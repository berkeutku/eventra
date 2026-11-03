import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db";
import {
  events,
  ridePassengers,
  rideRatings,
  rides,
  userReports,
  users,
} from "../db/schema";
import {
  MAX_COMMENT,
  MAX_REPORT_DETAILS,
  MAX_REPORTS_PER_DAY,
  cleanText,
  isReportReason,
  parseScore,
  ratingWindowState,
  type RatingWindow,
} from "./rating-rules";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Person = { id: string; name: string; role: "driver" | "passenger" };

type RideContext = {
  event: { startsAt: string; endsAt: string | null };
  driver: Person;
  passengers: Person[];
};

async function loadRideContext(rideId: string): Promise<RideContext | null> {
  if (!UUID_PATTERN.test(rideId)) {
    return null;
  }

  const [row] = await db
    .select({
      driverId: rides.driverId,
      driverName: users.name,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
    })
    .from(rides)
    .innerJoin(users, eq(rides.driverId, users.id))
    .innerJoin(events, eq(rides.eventId, events.id))
    .where(eq(rides.id, rideId))
    .limit(1);

  if (!row) {
    return null;
  }

  const passengerRows = await db
    .select({ id: users.id, name: users.name })
    .from(ridePassengers)
    .innerJoin(users, eq(ridePassengers.userId, users.id))
    .where(eq(ridePassengers.rideId, rideId));

  return {
    event: {
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    },
    driver: { id: row.driverId, name: row.driverName, role: "driver" },
    passengers: passengerRows.map((passenger) => ({
      id: passenger.id,
      name: passenger.name,
      role: "passenger" as const,
    })),
  };
}

export type RatingTarget = {
  userId: string;
  name: string;
  role: "driver" | "passenger";
  ratable: boolean;
  score: number | null;
  comment: string | null;
  reported: boolean;
};

export type RatingContext = {
  phase: RatingWindow;
  targets: RatingTarget[];
};

// Yalnızca yolculuğun sürücüsü ve yolcuları için bir sonuç döner, diğer herkes için null.
export async function getRatingContext(
  rideId: string,
  userId: string,
  now: Date = new Date(),
): Promise<RatingContext | null> {
  const context = await loadRideContext(rideId);

  if (!context) {
    return null;
  }

  const people = [context.driver, ...context.passengers];

  if (!people.some((person) => person.id === userId)) {
    return null;
  }

  const myRatings = await db
    .select({
      rateeId: rideRatings.rateeId,
      score: rideRatings.score,
      comment: rideRatings.comment,
    })
    .from(rideRatings)
    .where(and(eq(rideRatings.rideId, rideId), eq(rideRatings.raterId, userId)));

  const myReports = await db
    .select({ reportedId: userReports.reportedId })
    .from(userReports)
    .where(and(eq(userReports.rideId, rideId), eq(userReports.reporterId, userId)));

  const iAmDriver = context.driver.id === userId;

  return {
    phase: ratingWindowState(context.event, now),
    targets: people
      .filter((person) => person.id !== userId)
      .map((person) => {
        const mine = myRatings.find((item) => item.rateeId === person.id);

        return {
          userId: person.id,
          name: person.name,
          role: person.role,
          ratable: iAmDriver || person.role === "driver",
          score: mine ? mine.score : null,
          comment: mine ? mine.comment : null,
          reported: myReports.some((item) => item.reportedId === person.id),
        };
      }),
  };
}

export type RatingStatus =
  | "saved"
  | "invalid"
  | "self"
  | "not_found"
  | "not_participant"
  | "not_ratable"
  | "not_open"
  | "closed";

export async function submitRating(input: {
  rideId: string;
  raterId: string;
  rateeId: string;
  score: unknown;
  comment: unknown;
  now?: Date;
}): Promise<RatingStatus> {
  const score = parseScore(input.score);

  if (score === null || !UUID_PATTERN.test(input.rateeId)) {
    return "invalid";
  }

  if (input.raterId === input.rateeId) {
    return "self";
  }

  const context = await loadRideContext(input.rideId);

  if (!context) {
    return "not_found";
  }

  const people = [context.driver, ...context.passengers];
  const rater = people.find((person) => person.id === input.raterId);
  const ratee = people.find((person) => person.id === input.rateeId);

  if (!rater || !ratee) {
    return "not_participant";
  }

  // Yalnızca sürücü ile yolcu arasında: yolcular birbirini puanlamaz.
  if (rater.role !== "driver" && ratee.role !== "driver") {
    return "not_ratable";
  }

  const phase = ratingWindowState(context.event, input.now);

  if (phase === "not_yet") {
    return "not_open";
  }

  if (phase === "closed") {
    return "closed";
  }

  const comment = cleanText(input.comment, MAX_COMMENT) || null;

  await db
    .insert(rideRatings)
    .values({
      rideId: input.rideId,
      raterId: input.raterId,
      rateeId: input.rateeId,
      score,
      comment,
    })
    .onConflictDoUpdate({
      target: [rideRatings.rideId, rideRatings.raterId, rideRatings.rateeId],
      set: { score, comment, updatedAt: new Date() },
    });

  return "saved";
}

export type ReportStatus =
  | "saved"
  | "invalid_reason"
  | "self"
  | "not_found"
  | "not_participant"
  | "duplicate"
  | "rate_limited";

export async function submitReport(input: {
  rideId: string;
  reporterId: string;
  reportedId: string;
  reason: unknown;
  details: unknown;
  now?: Date;
}): Promise<ReportStatus> {
  if (!isReportReason(input.reason) || !UUID_PATTERN.test(input.reportedId)) {
    return "invalid_reason";
  }

  if (input.reporterId === input.reportedId) {
    return "self";
  }

  const context = await loadRideContext(input.rideId);

  if (!context) {
    return "not_found";
  }

  const ids = [context.driver.id, ...context.passengers.map((p) => p.id)];

  if (!ids.includes(input.reporterId) || !ids.includes(input.reportedId)) {
    return "not_participant";
  }

  const now = input.now ?? new Date();
  const [counted] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(userReports)
    .where(
      and(
        eq(userReports.reporterId, input.reporterId),
        gte(userReports.createdAt, new Date(now.getTime() - 24 * 3_600_000)),
      ),
    );

  if (counted.total >= MAX_REPORTS_PER_DAY) {
    return "rate_limited";
  }

  const inserted = await db
    .insert(userReports)
    .values({
      reporterId: input.reporterId,
      reportedId: input.reportedId,
      rideId: input.rideId,
      reason: input.reason,
      details: cleanText(input.details, MAX_REPORT_DETAILS) || null,
    })
    .onConflictDoNothing()
    .returning({ id: userReports.id });

  return inserted.length > 0 ? "saved" : "duplicate";
}