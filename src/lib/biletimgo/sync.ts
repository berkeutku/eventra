import { and, eq, gt, inArray, like, lt, sql } from "drizzle-orm";
import { db } from "../../db";
import { events, rides, syncRuns } from "../../db/schema";
import {
  BiletimgoError,
  fetchBiletimgoEvents,
  type FetchLike,
} from "./client";
import { normalizeEvent, type NormalizedEvent } from "./normalize";

// Bu dosya hem uygulamadan hem betiklerden çağrıldığı için göreli içe aktarımlar kullanıyor.
// GÜVENLİK KURALI: Bu dosyada etkinlik kaydını kaldıran hiçbir kod yoktur. Etkinlikler
// yalnızca "pasif" işaretlenir, çünkü yolculuklar ve bilet kayıtları etkinliğe bağlıdır.

export const DEFAULT_PREFIX = "bgo-";

const BATCH_SIZE = 100;
const LOCK_MINUTES = 15;
const MIN_VALID_RATIO = 0.8;
const SHARP_DROP_RATIO = 0.5;
const SHARP_DROP_MIN_PREVIOUS = 20;
const MISSES_BEFORE_DEACTIVATE = 2;

export type SyncOptions = {
  token: string;
  // false = deneme modu: veritabanına hiçbir şey yazılmaz.
  apply: boolean;
  prefix?: string;
  // Önceki aktif sayının yarısından az etkinlik gelirse çalışma durdurulur; bilerek geçmek için.
  allowDrop?: boolean;
  fetchImpl?: FetchLike;
  now?: () => Date;
};

export type SyncStatus =
  | "dry_run"
  | "success"
  | "suspicious"
  | "failed"
  | "locked";

export type SyncResult = {
  status: SyncStatus;
  fetched: number;
  valid: number;
  skipped: number;
  skippedReasons: Record<string, number>;
  duplicates: number;
  inserted: number;
  updated: number;
  reactivated: number;
  missed: number;
  deactivated: number;
  protectedChanges: number;
  errorCode: string | null;
};

function emptyResult(): SyncResult {
  return {
    status: "failed",
    fetched: 0,
    valid: 0,
    skipped: 0,
    skippedReasons: {},
    duplicates: 0,
    inserted: 0,
    updated: 0,
    reactivated: 0,
    missed: 0,
    deactivated: 0,
    protectedChanges: 0,
    errorCode: null,
  };
}

function errorCodeOf(error: unknown): string {
  if (error instanceof BiletimgoError) {
    return error.code;
  }

  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && code.length <= 20 ? code : "internal";
}

// Aynı anda iki çalışmayı engeller. İşlem düzeyinde danışma kilidi (advisory lock) kullanılır.
async function acquireLock(lockKey: string, now: Date): Promise<string | null> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);

    const cutoff = new Date(now.getTime() - LOCK_MINUTES * 60_000);

    // Çökmüş eski çalışmaları kapat.
    await tx
      .update(syncRuns)
      .set({ status: "failed", finishedAt: now, errorCode: "stale" })
      .where(
        and(
          eq(syncRuns.source, lockKey),
          eq(syncRuns.status, "running"),
          lt(syncRuns.startedAt, cutoff),
        ),
      );

    const [running] = await tx
      .select({ id: syncRuns.id })
      .from(syncRuns)
      .where(
        and(
          eq(syncRuns.source, lockKey),
          eq(syncRuns.status, "running"),
          gt(syncRuns.startedAt, cutoff),
        ),
      )
      .limit(1);

    if (running) {
      return null;
    }

    const [created] = await tx
      .insert(syncRuns)
      .values({ source: lockKey, status: "running", startedAt: now })
      .returning({ id: syncRuns.id });

    return created.id;
  });
}

async function finishRun(runId: string, result: SyncResult): Promise<void> {
  await db
    .update(syncRuns)
    .set({
      status: result.status === "dry_run" ? "success" : result.status,
      finishedAt: new Date(),
      fetchedCount: result.fetched,
      insertedCount: result.inserted,
      updatedCount: result.updated,
      skippedCount: result.skipped,
      deactivatedCount: result.deactivated,
      errorCode: result.errorCode,
    })
    .where(eq(syncRuns.id, runId));
}

function markSuspicious(result: SyncResult, code: string): void {
  result.status = "suspicious";
  result.errorCode = code;
}

function toRow(event: NormalizedEvent, now: Date) {
  return {
    id: event.id,
    source: "biletimgo",
    externalId: event.externalId,
    title: event.title,
    category: event.category,
    city: event.city,
    venue: event.venue,
    startsAt: event.startsAt,
    description: event.description,
    ticketUrl: event.ticketUrl,
    imageUrl: event.imageUrl,
    address: event.address,
    organizer: event.organizer,
    endsAt: event.endsAt,
    priceText: event.priceText,
    sourceCategory: event.sourceCategory,
    cityKey: event.cityKey,
    isActive: true,
    lastSeenAt: now,
    missedRuns: 0,
  };
}

async function execute(
  options: SyncOptions,
  prefix: string,
  now: Date,
  result: SyncResult,
): Promise<void> {
  const raw = await fetchBiletimgoEvents(options.token, options.fetchImpl);
  result.fetched = raw.length;

  const seen = new Map<string, NormalizedEvent>();

  for (const item of raw) {
    const normalized = normalizeEvent(item, prefix);

    if (!normalized.ok) {
      result.skipped += 1;
      result.skippedReasons[normalized.reason] =
        (result.skippedReasons[normalized.reason] ?? 0) + 1;
      continue;
    }

    if (seen.has(normalized.event.id)) {
      result.duplicates += 1;
      continue;
    }

    seen.set(normalized.event.id, normalized.event);
  }

  result.valid = seen.size;

  if (raw.length === 0) {
    markSuspicious(result, "empty");
    return;
  }

  if (result.valid / raw.length < MIN_VALID_RATIO) {
    markSuspicious(result, "too_many_invalid");
    return;
  }

  const existingRows = await db
    .select({
      id: events.id,
      title: events.title,
      venue: events.venue,
      city: events.city,
      isActive: events.isActive,
      missedRuns: events.missedRuns,
    })
    .from(events)
    .where(and(eq(events.source, "biletimgo"), like(events.id, `${prefix}%`)));

  const existing = new Map(existingRows.map((row) => [row.id, row]));
  const previousActive = existingRows.filter((row) => row.isActive).length;

  if (
    !options.allowDrop &&
    previousActive >= SHARP_DROP_MIN_PREVIOUS &&
    seen.size < previousActive * SHARP_DROP_RATIO
  ) {
    markSuspicious(result, "sharp_drop");
    return;
  }

  // Yolculuğu olan bir etkinliğin başlığı, mekânı ve şehri aynı anda tamamen değişirse
  // (kimlik başka bir etkinliğe atanmış olabilir) güncelleme uygulanmaz.
  const existingSeenIds = [...seen.keys()].filter((id) => existing.has(id));
  const withRides = new Set<string>();

  for (let i = 0; i < existingSeenIds.length; i += 1000) {
    const chunk = existingSeenIds.slice(i, i + 1000);
    const rows = await db
      .selectDistinct({ eventId: rides.eventId })
      .from(rides)
      .where(inArray(rides.eventId, chunk));

    for (const row of rows) {
      withRides.add(row.eventId);
    }
  }

  const writable: NormalizedEvent[] = [];

  for (const [id, event] of seen) {
    const old = existing.get(id);

    if (
      old &&
      withRides.has(id) &&
      old.title !== event.title &&
      old.venue !== event.venue &&
      old.city !== event.city
    ) {
      result.protectedChanges += 1;
      continue;
    }

    writable.push(event);
  }

  const unseenActive = existingRows.filter(
    (row) => row.isActive && !seen.has(row.id),
  );

  result.reactivated = [...seen.keys()].filter(
    (id) => existing.get(id)?.isActive === false,
  ).length;

  if (!options.apply) {
    result.inserted = writable.filter((event) => !existing.has(event.id)).length;
    result.updated = writable.length - result.inserted;
    result.missed = unseenActive.length;
    result.deactivated = unseenActive.filter(
      (row) => row.missedRuns + 1 >= MISSES_BEFORE_DEACTIVATE,
    ).length;
    result.status = "dry_run";
    return;
  }

  for (let i = 0; i < writable.length; i += BATCH_SIZE) {
    const batch = writable.slice(i, i + BATCH_SIZE);
    const rows = await db
      .insert(events)
      .values(batch.map((event) => toRow(event, now)))
      .onConflictDoUpdate({
        target: events.id,
        set: {
          title: sql`excluded.title`,
          category: sql`excluded.category`,
          city: sql`excluded.city`,
          venue: sql`excluded.venue`,
          startsAt: sql`excluded.starts_at`,
          description: sql`excluded.description`,
          ticketUrl: sql`excluded.ticket_url`,
          imageUrl: sql`excluded.image_url`,
          address: sql`excluded.address`,
          organizer: sql`excluded.organizer`,
          endsAt: sql`excluded.ends_at`,
          priceText: sql`excluded.price_text`,
          sourceCategory: sql`excluded.source_category`,
          cityKey: sql`excluded.city_key`,
          isActive: sql`excluded.is_active`,
          lastSeenAt: sql`excluded.last_seen_at`,
          missedRuns: sql`excluded.missed_runs`,
        },
        // Demo etkinliklerin üzerine asla yazılmaz.
        setWhere: sql`${events.source} = 'biletimgo'`,
      })
      .returning({ id: events.id, inserted: sql<boolean>`(xmax = 0)` });

    for (const row of rows) {
      if (row.inserted) {
        result.inserted += 1;
      } else {
        result.updated += 1;
      }
    }
  }

  // Görünmeyen etkinlikler: ardışık kayıp sayısı artar, eşik aşılırsa PASİF olur (silinmez).
  const unseenIds = unseenActive.map((row) => row.id);

  for (let i = 0; i < unseenIds.length; i += 500) {
    const chunk = unseenIds.slice(i, i + 500);
    const updated = await db
      .update(events)
      .set({
        missedRuns: sql`${events.missedRuns} + 1`,
        isActive: sql`(${events.missedRuns} + 1) < ${sql.raw(String(MISSES_BEFORE_DEACTIVATE))}`,
      })
      .where(
        and(
          eq(events.source, "biletimgo"),
          eq(events.isActive, true),
          inArray(events.id, chunk),
        ),
      )
      .returning({ id: events.id, isActive: events.isActive });

    result.missed += updated.length;
    result.deactivated += updated.filter((row) => !row.isActive).length;
  }

  result.status = "success";
}

export async function runBiletimgoSync(
  options: SyncOptions,
): Promise<SyncResult> {
  const prefix = options.prefix ?? DEFAULT_PREFIX;
  const lockKey = `biletimgo:${prefix}`;
  const now = options.now ? options.now() : new Date();
  const result = emptyResult();
  let runId: string | null = null;

  if (options.apply) {
    try {
      runId = await acquireLock(lockKey, now);
    } catch (error) {
      result.errorCode = errorCodeOf(error);
      return result;
    }

    if (!runId) {
      result.status = "locked";
      result.errorCode = "locked";
      return result;
    }
  }

  try {
    await execute(options, prefix, now, result);
  } catch (error) {
    result.status = "failed";
    result.errorCode = errorCodeOf(error);
  }

  if (runId) {
    try {
      await finishRun(runId, result);
    } catch {
      // Kayıt yazılamazsa sonuç yine de döner.
    }
  }

  return result;
}