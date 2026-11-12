import { desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";
import { events, rides, userReports, users } from "../db/schema";

export const CASE_STATUSES = ["open", "reviewed", "dismissed"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export function isCaseStatus(value: unknown): value is CaseStatus {
  return (
    typeof value === "string" &&
    (CASE_STATUSES as readonly string[]).includes(value)
  );
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: Date;
  reporterName: string;
  reportedName: string;
  totalAgainst: number;
  eventId: string | null;
  rideId: string | null;
  route: string | null;
  eventTitle: string | null;
};

export async function listReports(
  filter: CaseStatus | "all",
): Promise<ReportRow[]> {
  const reporter = alias(users, "reporter");
  const reported = alias(users, "reported");

  const rows = await db
    .select({
      id: userReports.id,
      reason: userReports.reason,
      details: userReports.details,
      status: userReports.status,
      createdAt: userReports.createdAt,
      reportedId: userReports.reportedId,
      reporterName: reporter.name,
      reportedName: reported.name,
      rideId: userReports.rideId,
      eventId: rides.eventId,
      origin: rides.origin,
      destination: rides.destination,
      eventTitle: events.title,
    })
    .from(userReports)
    .innerJoin(reporter, eq(userReports.reporterId, reporter.id))
    .innerJoin(reported, eq(userReports.reportedId, reported.id))
    .leftJoin(rides, eq(userReports.rideId, rides.id))
    .leftJoin(events, eq(rides.eventId, events.id))
    .where(filter === "all" ? undefined : eq(userReports.status, filter))
    .orderBy(desc(userReports.createdAt))
    .limit(100);

  const ids = [...new Set(rows.map((row) => row.reportedId))];
  const counts =
    ids.length > 0
      ? await db
          .select({
            reportedId: userReports.reportedId,
            total: sql<number>`count(*)::int`,
          })
          .from(userReports)
          .where(inArray(userReports.reportedId, ids))
          .groupBy(userReports.reportedId)
      : [];

  return rows.map((row) => ({
    id: row.id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.createdAt,
    reporterName: row.reporterName,
    reportedName: row.reportedName,
    totalAgainst:
      counts.find((item) => item.reportedId === row.reportedId)?.total ?? 1,
    eventId: row.eventId,
    rideId: row.rideId,
    route: row.origin && row.destination ? `${row.origin} → ${row.destination}` : null,
    eventTitle: row.eventTitle,
  }));
}

export async function countByStatus(): Promise<Record<CaseStatus, number>> {
  const rows = await db
    .select({
      status: userReports.status,
      total: sql<number>`count(*)::int`,
    })
    .from(userReports)
    .groupBy(userReports.status);

  const result: Record<CaseStatus, number> = {
    open: 0,
    reviewed: 0,
    dismissed: 0,
  };

  for (const row of rows) {
    if (isCaseStatus(row.status)) {
      result[row.status] = row.total;
    }
  }

  return result;
}

export async function setCaseStatus(
  id: string,
  status: CaseStatus,
): Promise<boolean> {
  if (!UUID_PATTERN.test(id)) {
    return false;
  }

  const updated = await db
    .update(userReports)
    .set({ status })
    .where(eq(userReports.id, id))
    .returning({ id: userReports.id });

  return updated.length > 0;
}