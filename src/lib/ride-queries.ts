import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, ridePassengers, rides, users } from "@/db/schema";
import type { RideItem, RideWithEvent } from "@/lib/ride-utils";

type RideRow = typeof rides.$inferSelect;

// Her yolculuk satırı için o yolculuğa katılan yolcu sayısını hesaplar.
function passengerCountSql() {
  return sql<number>`(select count(*)::int from ${ridePassengers} where ${ridePassengers.rideId} = ${rides.id})`;
}

function toRideItem(
  ride: RideRow,
  driverName: string,
  passengerCount: number,
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
    toRideItem(row.ride, row.driverName, row.passengerCount, {
      joined: joinedIds.has(row.ride.id),
      isOwn: userId !== undefined && row.ride.driverId === userId,
    }),
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
    })
    .from(rides)
    .innerJoin(users, eq(rides.driverId, users.id))
    .innerJoin(events, eq(rides.eventId, events.id))
    .where(eq(rides.driverId, driverId))
    .orderBy(desc(rides.createdAt));

  return rows.map((row) => ({
    ...toRideItem(row.ride, row.driverName, row.passengerCount, {
      joined: false,
      isOwn: true,
    }),
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
    })
    .from(ridePassengers)
    .innerJoin(rides, eq(ridePassengers.rideId, rides.id))
    .innerJoin(users, eq(rides.driverId, users.id))
    .innerJoin(events, eq(rides.eventId, events.id))
    .where(eq(ridePassengers.userId, userId))
    .orderBy(desc(ridePassengers.joinedAt));

  return rows.map((row) => ({
    ...toRideItem(row.ride, row.driverName, row.passengerCount, {
      joined: true,
      isOwn: false,
    }),
    eventTitle: row.eventTitle,
    eventStartsAt: row.eventStartsAt.toISOString(),
  }));
}