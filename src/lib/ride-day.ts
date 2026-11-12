import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "../db";
import {
  events,
  notifications,
  ridePassengers,
  rideShares,
  rides,
  users,
} from "../db/schema";
import { takeRateSlot } from "./rate-limit";
import { firstName } from "./request-rules";
import {
  MAX_SHARES_PER_DAY,
  SHARE_VALID_HOURS,
  isRideStatus,
  nextStatus,
  rideDayOpen,
  statusNotification,
  type RideStatus,
} from "./ride-day-rules";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

function hashToken(token: string): string {
  return createHash("sha256").update(`eventra-share:${token}`).digest("hex");
}

export type RideDayState = {
  status: RideStatus;
  vehicle: string | null;
  windowOpen: boolean;
};

export async function getRideDayState(
  rideId: string,
  now: Date = new Date(),
): Promise<RideDayState | null> {
  if (!UUID_PATTERN.test(rideId)) {
    return null;
  }

  const [row] = await db
    .select({
      status: rides.status,
      vehicle: rides.vehicle,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
    })
    .from(rides)
    .innerJoin(events, eq(rides.eventId, events.id))
    .where(eq(rides.id, rideId))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    status: isRideStatus(row.status) ? row.status : "planned",
    vehicle: row.vehicle,
    windowOpen: rideDayOpen(row.startsAt, row.endsAt, now),
  };
}

// Yalnızca yolculuğun sürücüsü araç bilgisini değiştirebilir (sahiplik sorgunun içinde).
export async function setVehicle(
  userId: string,
  rideId: string,
  vehicle: string | null,
): Promise<"saved" | "not_found"> {
  if (!UUID_PATTERN.test(rideId)) {
    return "not_found";
  }

  const updated = await db
    .update(rides)
    .set({ vehicle })
    .where(and(eq(rides.id, rideId), eq(rides.driverId, userId)))
    .returning({ id: rides.id });

  return updated.length > 0 ? "saved" : "not_found";
}

export type ChangeStatusResult =
  | "changed"
  | "not_found"
  | "not_owner"
  | "bad_transition"
  | "closed";

// Durum yalnızca sürücü tarafından ve sırayla değişir. Yolculardaki herkese bildirim yazılır.
export async function changeStatus(input: {
  userId: string;
  rideId: string;
  to: RideStatus;
  now?: Date;
}): Promise<ChangeStatusResult> {
  if (!UUID_PATTERN.test(input.rideId)) {
    return "not_found";
  }

  const now = input.now ?? new Date();

  return db.transaction(async (tx): Promise<ChangeStatusResult> => {
    const [ride] = await tx
      .select({
        id: rides.id,
        eventId: rides.eventId,
        driverId: rides.driverId,
        origin: rides.origin,
        destination: rides.destination,
        status: rides.status,
      })
      .from(rides)
      .where(eq(rides.id, input.rideId))
      .limit(1)
      .for("update");

    if (!ride) {
      return "not_found";
    }

    if (ride.driverId !== input.userId) {
      return "not_owner";
    }

    const current: RideStatus = isRideStatus(ride.status)
      ? ride.status
      : "planned";

    if (nextStatus(current) !== input.to) {
      return "bad_transition";
    }

    const [event] = await tx
      .select({ startsAt: events.startsAt, endsAt: events.endsAt })
      .from(events)
      .where(eq(events.id, ride.eventId))
      .limit(1);

    if (!event || !rideDayOpen(event.startsAt, event.endsAt, now)) {
      return "closed";
    }

    if (input.to === "departed") {
      await tx
        .update(rides)
        .set({ status: "departed", departedAt: now })
        .where(eq(rides.id, ride.id));
    } else {
      await tx
        .update(rides)
        .set({ status: "arrived", arrivedAt: now })
        .where(eq(rides.id, ride.id));
    }

    if (input.to !== "planned") {
      const passengers = await tx
        .select({ userId: ridePassengers.userId })
        .from(ridePassengers)
        .where(eq(ridePassengers.rideId, ride.id));

      if (passengers.length > 0) {
        const text = statusNotification(
          input.to,
          ride.origin,
          ride.destination,
        );

        await tx
          .insert(notifications)
          .values(
            passengers.map((passenger) => ({
              userId: passenger.userId,
              type: "ride_status" as const,
              title: text.title,
              body: text.body,
              link: `/events/${ride.eventId}/yolculuk/${ride.id}`,
              dedupeKey: `ride_status:${ride.id}:${input.to}:${passenger.userId}`,
            })),
          )
          .onConflictDoNothing();
      }
    }

    return "changed";
  });
}

export type CreateShareResult =
  | { status: "ok"; token: string }
  | { status: "not_found" | "not_participant" | "rate_limited" };

// Yalnızca yolculuğun sürücüsü ve yolcuları bağlantı oluşturabilir. Token'ın kendisi saklanmaz.
export async function createShareLink(
  userId: string,
  rideId: string,
): Promise<CreateShareResult> {
  if (!UUID_PATTERN.test(rideId)) {
    return { status: "not_found" };
  }

  const [ride] = await db
    .select({ driverId: rides.driverId })
    .from(rides)
    .where(eq(rides.id, rideId))
    .limit(1);

  if (!ride) {
    return { status: "not_found" };
  }

  if (ride.driverId !== userId) {
    const [passenger] = await db
      .select({ userId: ridePassengers.userId })
      .from(ridePassengers)
      .where(
        and(
          eq(ridePassengers.rideId, rideId),
          eq(ridePassengers.userId, userId),
        ),
      )
      .limit(1);

    if (!passenger) {
      return { status: "not_participant" };
    }
  }

  const allowed = await takeRateSlot(
    userId,
    "ride_share",
    MAX_SHARES_PER_DAY,
    86_400_000,
  );

  if (!allowed) {
    return { status: "rate_limited" };
  }

  const now = new Date();
  const token = randomBytes(24).toString("base64url");

  // Süresi dolmuş bağlantıları fırsat buldukça temizle.
  await db.delete(rideShares).where(lt(rideShares.expiresAt, now));

  await db.insert(rideShares).values({
    rideId,
    createdBy: userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + SHARE_VALID_HOURS * 3_600_000),
  });

  return { status: "ok", token };
}

export type SharedRide = {
  eventTitle: string;
  eventStartsAt: Date;
  origin: string;
  destination: string;
  meetingPoint: string;
  departureTime: string;
  status: RideStatus;
  vehicle: string | null;
  driverFirstName: string;
  expiresAt: Date;
};

// Herkese açık sayfa için: yalnızca güvenli alanlar döner (yolcu adı ve paylaşanın kimliği yok).
export async function getShare(
  token: string,
  now: Date = new Date(),
): Promise<SharedRide | null> {
  if (!TOKEN_PATTERN.test(token)) {
    return null;
  }

  const [row] = await db
    .select({
      eventTitle: events.title,
      eventStartsAt: events.startsAt,
      origin: rides.origin,
      destination: rides.destination,
      meetingPoint: rides.meetingPoint,
      departureTime: rides.departureTime,
      status: rides.status,
      vehicle: rides.vehicle,
      driverName: users.name,
      expiresAt: rideShares.expiresAt,
    })
    .from(rideShares)
    .innerJoin(rides, eq(rideShares.rideId, rides.id))
    .innerJoin(events, eq(rides.eventId, events.id))
    .innerJoin(users, eq(rides.driverId, users.id))
    .where(
      and(
        eq(rideShares.tokenHash, hashToken(token)),
        gt(rideShares.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    eventTitle: row.eventTitle,
    eventStartsAt: row.eventStartsAt,
    origin: row.origin,
    destination: row.destination,
    meetingPoint: row.meetingPoint,
    departureTime: row.departureTime.slice(0, 5),
    status: isRideStatus(row.status) ? row.status : "planned",
    vehicle: row.vehicle,
    driverFirstName: firstName(row.driverName),
    expiresAt: row.expiresAt,
  };
}