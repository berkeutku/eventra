import { desc, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import {
  events,
  rideMessages,
  ridePassengers,
  rideRatings,
  rideRequests,
  rideShares,
  rides,
  syncRuns,
  ticketVerifications,
  userReports,
  users,
} from "../db/schema";
import { fillDays, type DayCount } from "./admin-metrics-rules";

// Bu dosya hem sayfadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.
// Yalnızca sayılar döner, kişisel veri (ad, e-posta) hiçbir zaman çıkmaz.

export const SIGNUP_DAYS = 14;

export type Metrics = {
  generatedAt: Date;
  users: { total: number; last7: number; last30: number };
  signupsByDay: DayCount[];
  rides: {
    total: number;
    last7: number;
    matched: number; // en az bir yolcusu olan yolculuk
    departed: number;
    arrived: number;
    seatsOffered: number;
    seatsTaken: number;
  };
  joins: { total: number; last7: number };
  funnel: {
    registered: number;
    verified: number;
    participated: number; // yolculuk oluşturan ya da katılan
    completed: number; // tamamlanan bir yolculuğu olan
  };
  demand: { rideRequests: number };
  trust: {
    ratings: number;
    averageScore: number | null;
    openReports: number;
    shares: number;
    messages: number;
  };
  events: {
    demoUpcoming: number;
    realTotal: number;
    realActive: number;
    lastSync: {
      status: string;
      startedAt: Date;
      fetchedCount: number | null;
      errorCode: string | null;
    } | null;
  };
};

async function scalar(query: SQL): Promise<number> {
  const result = await db.execute(query);
  const row = result.rows[0] as { n?: number | string } | undefined;
  return Number(row?.n ?? 0);
}

export async function getMetrics(now: Date = new Date()): Promise<Metrics> {
  const signupDay = sql<string>`to_char(${users.createdAt} at time zone 'Europe/Istanbul', 'YYYY-MM-DD')`;

  const [
    userCounts,
    signupRows,
    rideCounts,
    joinCounts,
    verified,
    ratingCounts,
    requestCount,
    reportCount,
    shareCount,
    messageCount,
    eventCounts,
    syncRows,
    matched,
    participated,
    completed,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        last7: sql<number>`(count(*) filter (where ${users.createdAt} >= now() - interval '7 days'))::int`,
        last30: sql<number>`(count(*) filter (where ${users.createdAt} >= now() - interval '30 days'))::int`,
      })
      .from(users),
    db
      .select({ day: signupDay, count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.createdAt} >= now() - interval '16 days'`)
      .groupBy(signupDay),
    db
      .select({
        total: sql<number>`count(*)::int`,
        last7: sql<number>`(count(*) filter (where ${rides.createdAt} >= now() - interval '7 days'))::int`,
        departed: sql<number>`(count(*) filter (where ${rides.status} = 'departed'))::int`,
        arrived: sql<number>`(count(*) filter (where ${rides.status} = 'arrived'))::int`,
        seats: sql<number>`coalesce(sum(${rides.seats}), 0)::int`,
      })
      .from(rides),
    db
      .select({
        total: sql<number>`count(*)::int`,
        last7: sql<number>`(count(*) filter (where ${ridePassengers.joinedAt} >= now() - interval '7 days'))::int`,
      })
      .from(ridePassengers),
    db
      .select({ users: sql<number>`count(distinct ${ticketVerifications.userId})::int` })
      .from(ticketVerifications),
    db
      .select({
        total: sql<number>`count(*)::int`,
        average: sql<number | null>`avg(${rideRatings.score})::float8`,
      })
      .from(rideRatings),
    db.select({ total: sql<number>`count(*)::int` }).from(rideRequests),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(userReports)
      .where(sql`${userReports.status} = 'open'`),
    db.select({ total: sql<number>`count(*)::int` }).from(rideShares),
    db.select({ total: sql<number>`count(*)::int` }).from(rideMessages),
    db
      .select({
        demoUpcoming: sql<number>`(count(*) filter (where ${events.source} = 'demo' and coalesce(${events.endsAt}, ${events.startsAt} + interval '6 hours') >= now()))::int`,
        realTotal: sql<number>`(count(*) filter (where ${events.source} = 'biletimgo'))::int`,
        realActive: sql<number>`(count(*) filter (where ${events.source} = 'biletimgo' and ${events.isActive} = true))::int`,
      })
      .from(events),
    db
      .select({
        status: syncRuns.status,
        startedAt: syncRuns.startedAt,
        fetchedCount: syncRuns.fetchedCount,
        errorCode: syncRuns.errorCode,
      })
      .from(syncRuns)
      .orderBy(desc(syncRuns.startedAt))
      .limit(1),
    scalar(sql`select count(distinct ride_id)::int as n from ride_passengers`),
    scalar(
      sql`select count(*)::int as n from (select driver_id as uid from rides union select user_id as uid from ride_passengers) t`,
    ),
    scalar(
      sql`select count(*)::int as n from (select driver_id as uid from rides where status = 'arrived' union select rp.user_id as uid from ride_passengers rp join rides r on r.id = rp.ride_id where r.status = 'arrived') t`,
    ),
  ]);

  const u = userCounts[0];
  const r = rideCounts[0];
  const j = joinCounts[0];
  const e = eventCounts[0];
  const sync = syncRows[0];

  return {
    generatedAt: now,
    users: { total: u.total, last7: u.last7, last30: u.last30 },
    signupsByDay: fillDays(
      signupRows.map((row) => ({ day: row.day, count: row.count })),
      SIGNUP_DAYS,
      now,
    ),
    rides: {
      total: r.total,
      last7: r.last7,
      matched,
      departed: r.departed,
      arrived: r.arrived,
      seatsOffered: r.seats,
      seatsTaken: j.total,
    },
    joins: { total: j.total, last7: j.last7 },
    funnel: {
      registered: u.total,
      verified: verified[0].users,
      participated,
      completed,
    },
    demand: { rideRequests: requestCount[0].total },
    trust: {
      ratings: ratingCounts[0].total,
      averageScore: ratingCounts[0].average,
      openReports: reportCount[0].total,
      shares: shareCount[0].total,
      messages: messageCount[0].total,
    },
    events: {
      demoUpcoming: e.demoUpcoming,
      realTotal: e.realTotal,
      realActive: e.realActive,
      lastSync: sync
        ? {
            status: sync.status,
            startedAt: sync.startedAt,
            fetchedCount: sync.fetchedCount,
            errorCode: sync.errorCode,
          }
        : null,
    },
  };
}
