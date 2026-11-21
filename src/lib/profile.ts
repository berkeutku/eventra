import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  ridePassengers,
  rideRatings,
  rides,
  userAvatars,
  users,
} from "@/db/schema";
import { parseGender, type Gender } from "@/lib/gender-rules";
import { parseTheme, type ProfileTheme } from "@/lib/profile-rules";

export type ProfileData = {
  id: string;
  name: string;
  gender: Gender | null;
  bio: string | null;
  city: string | null;
  theme: ProfileTheme;
  interests: string[];
  createdAt: Date;
  // Fotoğraf yoksa null; varsa önbellek anahtarı olarak kullanılan güncelleme zamanı (ms).
  avatarV: number | null;
};

export type ProfileStats = {
  drivenRides: number;
  joinedRides: number;
  rating: number | null;
  ratingCount: number;
};

export async function getProfileData(
  userId: string,
): Promise<ProfileData | null> {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      gender: users.gender,
      bio: users.bio,
      city: users.city,
      theme: users.theme,
      interests: users.interests,
      createdAt: users.createdAt,
      avatarV: sql<number | null>`(select (extract(epoch from ${userAvatars.updatedAt}) * 1000)::float8 from ${userAvatars} where ${userAvatars.userId} = ${users.id})`,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    gender: parseGender(row.gender),
    bio: row.bio,
    city: row.city,
    theme: parseTheme(row.theme) ?? "violet",
    interests: row.interests,
    createdAt: row.createdAt,
    avatarV: row.avatarV ? Math.round(row.avatarV) : null,
  };
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [driven, joined, rating] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(rides)
      .where(eq(rides.driverId, userId)),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(ridePassengers)
      .where(eq(ridePassengers.userId, userId)),
    db
      .select({
        avg: sql<number | null>`round(avg(${rideRatings.score})::numeric, 1)::float8`,
        total: sql<number>`count(*)::int`,
      })
      .from(rideRatings)
      .where(eq(rideRatings.rateeId, userId)),
  ]);

  return {
    drivenRides: driven[0]?.total ?? 0,
    joinedRides: joined[0]?.total ?? 0,
    rating: rating[0]?.avg ?? null,
    ratingCount: rating[0]?.total ?? 0,
  };
}

export async function saveProfile(
  userId: string,
  data: {
    bio: string | null;
    city: string | null;
    theme: ProfileTheme;
    interests: string[];
  },
): Promise<void> {
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function saveAvatar(userId: string, base64: string): Promise<void> {
  await db
    .insert(userAvatars)
    .values({ userId, data: base64 })
    .onConflictDoUpdate({
      target: userAvatars.userId,
      set: { data: base64, updatedAt: new Date() },
    });
}

export async function deleteAvatar(userId: string): Promise<void> {
  await db.delete(userAvatars).where(eq(userAvatars.userId, userId));
}

export async function getAvatarBytes(
  userId: string,
): Promise<Uint8Array | null> {
  const [row] = await db
    .select({ data: userAvatars.data })
    .from(userAvatars)
    .where(eq(userAvatars.userId, userId))
    .limit(1);

  return row ? new Uint8Array(Buffer.from(row.data, "base64")) : null;
}
