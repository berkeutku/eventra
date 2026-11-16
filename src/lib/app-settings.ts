import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { appSettings } from "../db/schema";
import { parseSettingFlag } from "./app-settings-rules";

const SHOW_REAL_EVENTS_KEY = "show_real_events";

// Veritabanında kayıt yoksa (ya da okunamazsa) eski ortam değişkeni varsayılan olur.
// Değişken de yoksa site yalnızca demo etkinlikleri gösterir (güvenli varsayılan).
function envDefault(): boolean {
  return process.env.SHOW_REAL_EVENTS === "1";
}

// Aynı istek içinde tek sorgu çalışsın diye cache() kullanılır.
export const getShowRealEvents = cache(async (): Promise<boolean> => {
  try {
    const rows = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, SHOW_REAL_EVENTS_KEY))
      .limit(1);

    return parseSettingFlag(rows[0]?.value, envDefault());
  } catch {
    // Tablo henüz yoksa ya da veritabanı geçici hata verirse sessizce güvenli varsayılana dön.
    return envDefault();
  }
});

export async function setShowRealEvents(
  enabled: boolean,
  updatedBy: string,
): Promise<void> {
  const value = enabled ? "1" : "0";

  await db
    .insert(appSettings)
    .values({ key: SHOW_REAL_EVENTS_KEY, value, updatedBy })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedBy, updatedAt: new Date() },
    });
}

export async function getShowRealEventsInfo(): Promise<{
  enabled: boolean;
  updatedAt: Date | null;
  updatedBy: string | null;
  fromDatabase: boolean;
}> {
  try {
    const rows = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, SHOW_REAL_EVENTS_KEY))
      .limit(1);
    const row = rows[0];

    return {
      enabled: parseSettingFlag(row?.value, envDefault()),
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
      fromDatabase: Boolean(row),
    };
  } catch {
    return { enabled: envDefault(), updatedAt: null, updatedBy: null, fromDatabase: false };
  }
}
