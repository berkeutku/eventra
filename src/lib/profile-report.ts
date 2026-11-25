import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { userReports } from "../db/schema";
import { MAX_REPORTS_PER_DAY, cleanText } from "./rating-rules";

// Profil şikâyeti: uygunsuz profil fotoğrafı ya da tanıtım yazısı için.
// Yolculuk şikâyetleriyle aynı tabloya, yolculuk olmadan (ride_id boş) ve "profile" nedeniyle kaydedilir.
// Bu dosya hem uygulamadan hem test betiğinden çağrılabilsin diye göreli içe aktarımlar kullanıyor.

export const PROFILE_REPORT_REASON = "profile";
export const MAX_PROFILE_REPORT_DETAILS = 300;

export type ProfileReportStatus =
  | "saved"
  | "self"
  | "invalid"
  | "duplicate"
  | "rate_limited";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function submitProfileReport(input: {
  reporterId: string;
  reportedId: string;
  details: unknown;
  now?: Date;
}): Promise<ProfileReportStatus> {
  if (!UUID_PATTERN.test(input.reportedId)) {
    return "invalid";
  }

  if (input.reporterId === input.reportedId) {
    return "self";
  }

  const now = input.now ?? new Date();

  // Yolculuk ve profil şikâyetleri aynı günlük sınırı paylaşır.
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

  // Aynı kişi için açık bir profil şikâyetin varsa yenisi eklenmez.
  const [open] = await db
    .select({ id: userReports.id })
    .from(userReports)
    .where(
      and(
        eq(userReports.reporterId, input.reporterId),
        eq(userReports.reportedId, input.reportedId),
        eq(userReports.reason, PROFILE_REPORT_REASON),
        eq(userReports.status, "open"),
        isNull(userReports.rideId),
      ),
    )
    .limit(1);

  if (open) {
    return "duplicate";
  }

  await db.insert(userReports).values({
    reporterId: input.reporterId,
    reportedId: input.reportedId,
    rideId: null,
    reason: PROFILE_REPORT_REASON,
    details: cleanText(input.details, MAX_PROFILE_REPORT_DETAILS) || null,
  });

  return "saved";
}
