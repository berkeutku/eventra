import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { rides } from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

export const MAX_TEMPLATES = 5;

export type RideTemplate = {
  origin: string;
  destination: string;
  meetingPoint: string;
  departureTime: string;
  durationMinutes: number;
  seats: number;
  totalCost: number;
};

// Sürücünün önceki yolculuklarından, birebir aynı olanlar tek sayılarak, en yeni önce.
export async function listRideTemplates(
  userId: string,
): Promise<RideTemplate[]> {
  const rows = await db
    .select({
      origin: rides.origin,
      destination: rides.destination,
      meetingPoint: rides.meetingPoint,
      departureTime: rides.departureTime,
      durationMinutes: rides.durationMinutes,
      seats: rides.seats,
      totalCost: rides.totalCost,
    })
    .from(rides)
    .where(eq(rides.driverId, userId))
    .orderBy(desc(rides.createdAt))
    .limit(50);

  const seen = new Set<string>();
  const result: RideTemplate[] = [];

  for (const row of rows) {
    const template: RideTemplate = {
      origin: row.origin,
      destination: row.destination,
      meetingPoint: row.meetingPoint,
      departureTime: row.departureTime.slice(0, 5),
      durationMinutes: row.durationMinutes,
      seats: row.seats,
      totalCost: row.totalCost,
    };
    const key = JSON.stringify(template);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(template);

    if (result.length >= MAX_TEMPLATES) {
      break;
    }
  }

  return result;
}