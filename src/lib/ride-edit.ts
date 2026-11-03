import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { notifications, ridePassengers, rides } from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

export const MAX_RIDES_PER_HOUR = 5;
export const MAX_RIDES_PER_DAY = 15;

export type RideFieldKey =
  | "origin"
  | "destination"
  | "meetingPoint"
  | "departureTime"
  | "duration"
  | "seats"
  | "cost";

export type RideFields = {
  origin: string;
  destination: string;
  meetingPoint: string;
  departureTime: string;
  durationMinutes: number;
  seats: number;
  totalCost: number;
};

export type ParseResult =
  | { ok: true; value: RideFields }
  | { ok: false; errors: Partial<Record<RideFieldKey, string>> };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const WHOLE_NUMBER = /^\d+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function checkText(value: string, label: string): string | undefined {
  if (value.length < 2) {
    return `${label} en az 2 karakter olmalı.`;
  }
  if (value.length > 80) {
    return `${label} en fazla 80 karakter olabilir.`;
  }
  return undefined;
}

function parseWhole(value: string): number | null {
  return WHOLE_NUMBER.test(value) ? Number(value) : null;
}

export function parseRideFields(
  input: Record<RideFieldKey, string>,
): ParseResult {
  const errors: Partial<Record<RideFieldKey, string>> = {};

  const origin = input.origin.trim();
  const destination = input.destination.trim();
  const meetingPoint = input.meetingPoint.trim();
  const departureTime = input.departureTime.trim();
  const duration = parseWhole(input.duration.trim());
  const seats = parseWhole(input.seats.trim());
  const cost = parseWhole(input.cost.trim());

  const originError = checkText(origin, "Başlangıç noktası");
  if (originError) errors.origin = originError;

  const destinationError = checkText(destination, "Varış noktası");
  if (destinationError) errors.destination = destinationError;

  const meetingPointError = checkText(meetingPoint, "Buluşma noktası");
  if (meetingPointError) errors.meetingPoint = meetingPointError;

  if (!TIME_PATTERN.test(departureTime)) {
    errors.departureTime = "Lütfen kalkış saatini seç.";
  }

  if (duration === null || duration < 5 || duration > 600) {
    errors.duration = "Süre 5 ile 600 dakika arasında bir sayı olmalı.";
  }

  if (seats === null || seats < 1 || seats > 6) {
    errors.seats = "Koltuk sayısı 1 ile 6 arasında olmalı.";
  }

  if (cost === null || cost > 5000) {
    errors.cost = "Masraf 0 ile 5000 TL arasında bir tam sayı olmalı.";
  }

  if (
    Object.keys(errors).length > 0 ||
    duration === null ||
    seats === null ||
    cost === null
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      origin,
      destination,
      meetingPoint,
      departureTime,
      durationMinutes: duration,
      seats,
      totalCost: cost,
    },
  };
}

// Sürücünün son bir saatte ve son bir günde oluşturduğu yolculuk sayısı.
export async function countRecentRides(
  driverId: string,
  now: Date = new Date(),
): Promise<{ hour: number; day: number }> {
  const hourAgo = new Date(now.getTime() - 3_600_000);
  const dayAgo = new Date(now.getTime() - 86_400_000);

  const [row] = await db
    .select({
      hour: sql<number>`(count(*) filter (where ${rides.createdAt} >= ${hourAgo.toISOString()}::timestamptz))::int`,
      day: sql<number>`count(*)::int`,
    })
    .from(rides)
    .where(and(eq(rides.driverId, driverId), gte(rides.createdAt, dayAgo)));

  return { hour: row.hour, day: row.day };
}

export type UpdateStatus =
  | "updated"
  | "unchanged"
  | "not_found"
  | "not_owner"
  | "too_few_seats";

// Yalnızca yolculuğun sürücüsü düzenleyebilir. Güzergâh, saat ya da masraf değişirse
// yolculuktaki yolculara bildirim gider (aynı yolculuk için dakikada en fazla bir).
export async function updateRide(input: {
  userId: string;
  rideId: string;
  fields: RideFields;
  now?: Date;
}): Promise<UpdateStatus> {
  if (!UUID_PATTERN.test(input.rideId)) {
    return "not_found";
  }

  const now = input.now ?? new Date();
  const f = input.fields;

  return db.transaction(async (tx) => {
    const [ride] = await tx
      .select()
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

    const passengers = await tx
      .select({ userId: ridePassengers.userId })
      .from(ridePassengers)
      .where(eq(ridePassengers.rideId, ride.id));

    if (f.seats < passengers.length) {
      return "too_few_seats";
    }

    const before: RideFields = {
      origin: ride.origin,
      destination: ride.destination,
      meetingPoint: ride.meetingPoint,
      departureTime: ride.departureTime.slice(0, 5),
      durationMinutes: ride.durationMinutes,
      seats: ride.seats,
      totalCost: ride.totalCost,
    };

    const changed = (Object.keys(before) as (keyof RideFields)[]).filter(
      (key) => before[key] !== f[key],
    );

    if (changed.length === 0) {
      return "unchanged";
    }

    await tx
      .update(rides)
      .set({
        origin: f.origin,
        destination: f.destination,
        meetingPoint: f.meetingPoint,
        departureTime: f.departureTime,
        durationMinutes: f.durationMinutes,
        seats: f.seats,
        totalCost: f.totalCost,
      })
      .where(eq(rides.id, ride.id));

    // Yalnızca koltuk sayısı değiştiyse yolculara bildirim gitmez.
    const important = changed.some((key) => key !== "seats");

    if (important && passengers.length > 0) {
      const minute = Math.floor(now.getTime() / 60_000);

      await tx
        .insert(notifications)
        .values(
          passengers.map((passenger) => ({
            userId: passenger.userId,
            type: "ride_updated" as const,
            title: "Yolculuk güncellendi",
            body: `${f.origin} → ${f.destination} yolculuğunda değişiklik var. Buluşma: ${f.meetingPoint}, kalkış ${f.departureTime}.`,
            link: `/events/${ride.eventId}/yolculuk/${ride.id}`,
            dedupeKey: `ride_updated:${ride.id}:${minute}`,
          })),
        )
        .onConflictDoNothing();
    }

    return "updated";
  });
}