import { eq } from "drizzle-orm";
import { db } from "../db";
import { notificationPreferences } from "../db/schema";
import { PREF_TYPES, type PrefType } from "./notification-pref-types";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

export async function getMutedTypes(userId: string): Promise<PrefType[]> {
  const [row] = await db
    .select({ muted: notificationPreferences.mutedPushTypes })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (!row) {
    return [];
  }

  return PREF_TYPES.filter((type) => row.muted.includes(type));
}

// Bilinmeyen ve yinelenen değerler atılır, yalnızca geçerli türler kaydedilir.
export async function saveMutedTypes(
  userId: string,
  muted: unknown[],
): Promise<PrefType[]> {
  const clean = PREF_TYPES.filter((type) => muted.includes(type));

  await db
    .insert(notificationPreferences)
    .values({ userId, mutedPushTypes: clean })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: { mutedPushTypes: clean, updatedAt: new Date() },
    });

  return clean;
}