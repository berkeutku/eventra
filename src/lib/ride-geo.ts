import { eq } from "drizzle-orm";
import { db } from "../db";
import { rideGeo } from "../db/schema";
import {
  fromMicro,
  parsePath,
  thinPath,
  toMicro,
  type Pt,
  type RouteResult,
} from "./geo-rules";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

export type SavedGeo = {
  origin: Pt;
  meeting: Pt;
  dest: Pt;
  distanceMeters: number | null;
  durationSeconds: number | null;
  path: [number, number][] | null;
};

export async function saveRideGeo(
  rideId: string,
  points: { origin: Pt; meeting: Pt; dest: Pt },
  route: RouteResult | null,
): Promise<void> {
  const data = {
    originLat: toMicro(points.origin.lat),
    originLng: toMicro(points.origin.lng),
    meetingLat: toMicro(points.meeting.lat),
    meetingLng: toMicro(points.meeting.lng),
    destLat: toMicro(points.dest.lat),
    destLng: toMicro(points.dest.lng),
    distanceMeters: route ? Math.round(route.distanceMeters) : null,
    durationSeconds: route ? Math.round(route.durationSeconds) : null,
    routePath: route ? JSON.stringify(thinPath(route.path, 400)) : null,
  };

  await db
    .insert(rideGeo)
    .values({ rideId, ...data })
    .onConflictDoUpdate({ target: rideGeo.rideId, set: data });
}

export async function getRideGeo(rideId: string): Promise<SavedGeo | null> {
  const [row] = await db
    .select()
    .from(rideGeo)
    .where(eq(rideGeo.rideId, rideId))
    .limit(1);

  if (!row) {
    return null;
  }

  let path: [number, number][] | null = null;

  if (row.routePath) {
    try {
      path = parsePath(JSON.parse(row.routePath));
    } catch {
      path = null;
    }
  }

  return {
    origin: { lat: fromMicro(row.originLat), lng: fromMicro(row.originLng) },
    meeting: { lat: fromMicro(row.meetingLat), lng: fromMicro(row.meetingLng) },
    dest: { lat: fromMicro(row.destLat), lng: fromMicro(row.destLng) },
    distanceMeters: row.distanceMeters,
    durationSeconds: row.durationSeconds,
    path,
  };
}