import { and, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { db } from "../db";
import {
  notifications,
  ridePassengers,
  rideRequests,
  rides,
  users,
} from "../db/schema";
import { parseGender, parseRidePolicy, policyAllowsGender } from "./gender-rules";
import {
  MATCH_WINDOW_HOURS,
  MAX_MATCH_NOTIFICATIONS,
  requestFitsRide,
  type RequestLike,
} from "./request-match-rules";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

const MAX_RECIPIENTS_PER_RIDE = 50;

function hhmm(time: string): string {
  return time.slice(0, 5);
}

// Yeni bir yolculuk açılınca, aynı etkinlikte ona uyan bekleyen taleplerin sahiplerine
// bildirim yazar. Kaç bildirim yazıldığını döner. Bildirimde yalnızca güzergâh ve saat vardır.
export async function notifyMatchingRequests(
  rideId: string,
  now: Date = new Date(),
): Promise<number> {
  const [ride] = await db
    .select({
      id: rides.id,
      eventId: rides.eventId,
      driverId: rides.driverId,
      origin: rides.origin,
      destination: rides.destination,
      departureTime: rides.departureTime,
      seats: rides.seats,
      genderPolicy: rides.genderPolicy,
    })
    .from(rides)
    .where(eq(rides.id, rideId))
    .limit(1);

  if (!ride) {
    return 0;
  }

  const [taken] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(ridePassengers)
    .where(eq(ridePassengers.rideId, ride.id));

  const seatsLeft = ride.seats - taken.total;

  if (seatsLeft <= 0) {
    return 0;
  }

  // Sürücünün kendisi ve bu etkinlikte zaten bir yolculuğa katılmış olanlar bildirilmez.
  const candidates = await db
    .select({
      passengerId: rideRequests.passengerId,
      destination: rideRequests.destination,
      preferredTime: rideRequests.preferredTime,
      seats: rideRequests.seats,
      gender: users.gender,
    })
    .from(rideRequests)
    .innerJoin(users, eq(rideRequests.passengerId, users.id))
    .where(
      and(
        eq(rideRequests.eventId, ride.eventId),
        ne(rideRequests.passengerId, ride.driverId),
        sql`not exists (select 1 from ${ridePassengers} inner join ${rides} on ${ridePassengers.rideId} = ${rides.id} where ${ridePassengers.userId} = ${rideRequests.passengerId} and ${rides.eventId} = ${ride.eventId})`,
      ),
    )
    .limit(200);

  const departure = hhmm(ride.departureTime);
  const ridePolicy = parseRidePolicy(ride.genderPolicy) ?? "mixed";

  const matched = candidates
    .filter((candidate) =>
      // "Sadece kadınlar/erkekler" yolculuklarının bildirimi, katılamayacak kişilere gitmez.
      policyAllowsGender(ridePolicy, parseGender(candidate.gender)) &&
      requestFitsRide(
        {
          destination: candidate.destination,
          preferredTime: candidate.preferredTime
            ? hhmm(candidate.preferredTime)
            : null,
          seats: candidate.seats,
        },
        {
          destination: ride.destination,
          departureTime: departure,
          seatsLeft,
        },
      ),
    )
    .slice(0, MAX_RECIPIENTS_PER_RIDE);

  if (matched.length === 0) {
    return 0;
  }

  // Aynı kişiye kısa sürede çok fazla eşleşme bildirimi gitmesin.
  const since = new Date(now.getTime() - MATCH_WINDOW_HOURS * 3_600_000);
  const ids = matched.map((item) => item.passengerId);

  const recent = await db
    .select({
      userId: notifications.userId,
      total: sql<number>`count(*)::int`,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.type, "ride_request_match"),
        gt(notifications.createdAt, since),
        inArray(notifications.userId, ids),
      ),
    )
    .groupBy(notifications.userId);

  const capped = new Set(
    recent
      .filter((row) => row.total >= MAX_MATCH_NOTIFICATIONS)
      .map((row) => row.userId),
  );

  const recipients = matched.filter((item) => !capped.has(item.passengerId));

  if (recipients.length === 0) {
    return 0;
  }

  const inserted = await db
    .insert(notifications)
    .values(
      recipients.map((item) => ({
        userId: item.passengerId,
        type: "ride_request_match" as const,
        title: "Sana uygun bir yolculuk açıldı",
        body: `${ride.origin} → ${ride.destination} yolculuğu açıldı, kalkış ${departure}.`,
        link: `/events/${ride.eventId}/yolculuk/${ride.id}`,
        dedupeKey: `request_match:${ride.id}:${item.passengerId}`,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: notifications.id });

  return inserted.length;
}

// Talep verirken: şu an bu talebe uyan kaç açık yolculuk var? (kendi yolculukların sayılmaz)
export async function countMatchingRides(
  eventId: string,
  request: RequestLike,
  userId: string,
): Promise<number> {
  const [me] = await db
    .select({ gender: users.gender })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const myGender = parseGender(me?.gender ?? null);

  const rows = await db
    .select({
      genderPolicy: rides.genderPolicy,
      destination: rides.destination,
      departureTime: rides.departureTime,
      seats: rides.seats,
      taken: sql<number>`(select count(*)::int from ${ridePassengers} where ${ridePassengers.rideId} = ${rides.id})`,
    })
    .from(rides)
    .where(and(eq(rides.eventId, eventId), ne(rides.driverId, userId)));

  return rows.filter((row) =>
    policyAllowsGender(parseRidePolicy(row.genderPolicy) ?? "mixed", myGender) &&
    requestFitsRide(request, {
      destination: row.destination,
      departureTime: hhmm(row.departureTime),
      seatsLeft: row.seats - row.taken,
    }),
  ).length;
}