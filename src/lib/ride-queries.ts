import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  events,
  ridePassengers,
  rides,
  ticketVerifications,
  users,
} from "@/db/schema";
import type { RideItem, RideWithEvent } from "@/lib/ride-utils";

type RideRow = typeof rides.$inferSelect;

// Her yolculuk satırı için o yolculuğa katılan yolcu sayısını hesaplar.
function passengerCountSql() {
  return sql<number>`(select count(*)::int from ${ridePassengers} where ${ridePassengers.rideId} = ${rides.id})`;
}

// Sürücü bu etkinlik için (demo) bilet doğrulaması yapmış mı?
function driverVerifiedSql() {
  return sql<boolean>`exists (select 1 from ${ticketVerifications} where ${ticketVerifications.userId} = ${rides.driverId} and ${ticketVerifications.eventId} = ${rides.eventId})`;
}

function toRideItem(
  ride: RideRow,
  driverName: string,
  passengerCount: number,
  driverVerified: boolean,
  flags: { joined: boolean; isOwn: boolean },
): RideItem {
  return {
    id: ride.id,
    eventId: ride.eventId,
    driverName,
    origin: ride.origin,
    destination: ride.destination,
    meetingPoint: ride.meetingPoint,
    // Veritabanı "23:30:00" verir, arayüzde "23:30" gösteriyoruz.
    departureTime: ride.departureTime.slice(0, 5),
    durationMinutes: ride.durationMinutes,
    seats: ride.seats,
    totalCost: ride.totalCost,
    createdAt: ride.createdAt.toISOString(),
    passengerCount,
    joined: flags.joined,
    isOwn: flags.isOwn,
    driverVerified,
  };
}

export async function getRidesForEvent(
  eventId: string,
  userId?: string,
): Promise<RideItem[]> {
  const rows = await db
    .select({
      ride: rides,
      driverName: users.name,
      passengerCount: passengerCountSql(),
      driverVerified: driverVerifiedSql(),
    })
    .from(rides)
    .innerJoin(users, eq(rides.driverId, users.id))
    .where(eq(rides.eventId, eventId))
    .orderBy(desc(rides.createdAt));

  const joinedIds = new Set<string>();

  if (userId && rows.length > 0) {
    const joined = await db
      .select({ rideId: ridePassengers.rideId })
      .from(ridePassengers)
      .where(
        and(
          eq(ridePassengers.userId, userId),
          inArray(
            ridePassengers.rideId,
            rows.map((row) => row.ride.id),
          ),
        ),
      );

    for (const item of joined) {
      joinedIds.add(item.rideId);
    }
  }

  return rows.map((row) =>
    toRideItem(
      row.ride,
      row.driverName,
      row.passengerCount,
      row.driverVerified,
      {
        joined: joinedIds.has(row.ride.id),
        isOwn: userId !== undefined && row.ride.driverId === userId,
      },
    ),
  );
}

export async function getRidesForDriver(
  driverId: string,
): Promise<RideWithEvent[]> {
  const rows = await db
    .select({
      ride: rides,
      driverName: users.name,
      eventTitle: events.title,
      eventStartsAt: events.startsAt,
      passengerCount: passengerCountSql(),
      driverVerified: driverVerifiedSql(),
    })
    .from(rides)
    .innerJoin(users, eq(rides.driverId, users.id))
    .innerJoin(events, eq(rides.eventId, events.id))
    .where(eq(rides.driverId, driverId))
    .orderBy(desc(rides.createdAt));

  return rows.map((row) => ({
    ...toRideItem(
      row.ride,
      row.driverName,
      row.passengerCount,
      row.driverVerified,
      { joined: false, isOwn: true },
    ),
    eventTitle: row.eventTitle,
    eventStartsAt: row.eventStartsAt.toISOString(),
  }));
}

export async function getRidesForPassenger(
  userId: string,
): Promise<RideWithEvent[]> {
  const rows = await db
    .select({
      ride: rides,
      driverName: users.name,
      eventTitle: events.title,
      eventStartsAt: events.startsAt,
      passengerCount: passengerCountSql(),
      driverVerified: driverVerifiedSql(),
    })
    .from(ridePassengers)
    .innerJoin(rides, eq(ridePassengers.rideId, rides.id))
    .innerJoin(users, eq(rides.driverId, users.id))
    .innerJoin(events, eq(rides.eventId, events.id))
    .where(eq(ridePassengers.userId, userId))
    .orderBy(desc(ridePassengers.joinedAt));

  return rows.map((row) => ({
    ...toRideItem(
      row.ride,
      row.driverName,
      row.passengerCount,
      row.driverVerified,
      { joined: true, isOwn: false },
    ),
    eventTitle: row.eventTitle,
    eventStartsAt: row.eventStartsAt.toISOString(),
  }));
}

export type RideDetail = RideItem & {
  // Yolcu adları yalnızca sürücüye ve katılan yolculara gösterilir.
  passengers: { name: string; verified: boolean }[] | null;
};

export async function getRideDetail(
  rideId: string,
  userId?: string,
): Promise<RideDetail | null> {
  const [row] = await db
    .select({
      ride: rides,
      driverName: users.name,
      passengerCount: passengerCountSql(),
      driverVerified: driverVerifiedSql(),
    })
    .from(rides)
    .innerJoin(users, eq(rides.driverId, users.id))
    .where(eq(rides.id, rideId))
    .limit(1);

  if (!row) {
    return null;
  }

  const passengerRows = await db
    .select({
      userId: ridePassengers.userId,
      name: users.name,
      verified: sql<boolean>`exists (select 1 from ${ticketVerifications} where ${ticketVerifications.userId} = ${ridePassengers.userId} and ${ticketVerifications.eventId} = ${row.ride.eventId})`,
    })
    .from(ridePassengers)
    .innerJoin(users, eq(ridePassengers.userId, users.id))
    .where(eq(ridePassengers.rideId, rideId))
    .orderBy(asc(ridePassengers.joinedAt));

  const isOwn = userId !== undefined && row.ride.driverId === userId;
  const joined =
    userId !== undefined &&
    passengerRows.some((passenger) => passenger.userId === userId);

  return {
    ...toRideItem(
      row.ride,
      row.driverName,
      row.passengerCount,
      row.driverVerified,
      { joined, isOwn },
    ),
    passengers:
      isOwn || joined
        ? passengerRows.map((passenger) => ({
            name: passenger.name,
            verified: passenger.verified,
          }))
        : null,
  };
}