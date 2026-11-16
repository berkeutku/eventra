import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { events, pushSubscriptions, ticketVerifications } from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

export type OnboardingData = {
  verifiedCount: number;
  latestVerified: { id: string; title: string } | null;
  pushEnabled: boolean;
};

export async function getOnboardingData(
  userId: string,
): Promise<OnboardingData> {
  const [verified, push] = await Promise.all([
    db
      .select({ id: events.id, title: events.title })
      .from(ticketVerifications)
      .innerJoin(events, eq(events.id, ticketVerifications.eventId))
      .where(eq(ticketVerifications.userId, userId))
      .orderBy(desc(ticketVerifications.verifiedAt))
      .limit(50),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId)),
  ]);

  return {
    verifiedCount: verified.length,
    latestVerified: verified[0] ?? null,
    pushEnabled: (push[0]?.total ?? 0) > 0,
  };
}
