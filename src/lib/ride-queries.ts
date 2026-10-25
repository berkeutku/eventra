import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { events, rides, users } from "@/db/schema";
import type { DriverRideItem, RideItem } from "@/lib/ride-utils";

type RideRow = typeof rides.$inferSelect;

function toRideItem(ride: RideRow, driverName: string): RideItem {
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
  };
}

export async function getRidesForEvent(eventId: string): Promise<RideItem[]> {
  const rows = await db
    .select({ ride: rides, driverName: users.name })
    .from(rides)
    .innerJoin(users, eq(rides.driverId, users.id))
    .where(eq(rides.eventId, eventId))
    .orderBy(desc(rides.createdAt));

  return rows.map((row) => toRideItem(row.ride, row.driverName));
}

export async function getRidesForDriver(
  driverId: string,
): Promise<DriverRideItem[]> {
  const rows = await db
    .select({
      ride: rides,
      driverName: users.name,
      eventTitle: events.title,
      eventStartsAt: events.startsAt,
    })
    .from(rides)
    .innerJoin(users, eq(rides.driverId, users.id))
    .innerJoin(events, eq(rides.eventId, events.id))
    .where(eq(rides.driverId, driverId))
    .orderBy(desc(rides.createdAt));

  return rows.map((row) => ({
    ...toRideItem(row.ride, row.driverName),
    eventTitle: row.eventTitle,
    eventStartsAt: row.eventStartsAt.toISOString(),
  }));
}