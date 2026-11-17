import { desc } from "drizzle-orm";
import { db } from "../db";
import { syncRuns } from "../db/schema";

export type SyncRunRow = {
  id: string;
  source: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  fetched: number | null;
  inserted: number | null;
  updated: number | null;
  skipped: number | null;
  deactivated: number | null;
  errorCode: string | null;
};

export async function listRecentSyncRuns(limit = 30): Promise<SyncRunRow[]> {
  return db
    .select({
      id: syncRuns.id,
      source: syncRuns.source,
      status: syncRuns.status,
      startedAt: syncRuns.startedAt,
      finishedAt: syncRuns.finishedAt,
      fetched: syncRuns.fetchedCount,
      inserted: syncRuns.insertedCount,
      updated: syncRuns.updatedCount,
      skipped: syncRuns.skippedCount,
      deactivated: syncRuns.deactivatedCount,
      errorCode: syncRuns.errorCode,
    })
    .from(syncRuns)
    .orderBy(desc(syncRuns.startedAt))
    .limit(limit);
}
