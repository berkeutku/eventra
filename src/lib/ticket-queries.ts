import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ticketVerifications } from "@/db/schema";

export async function isTicketVerified(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: ticketVerifications.id })
    .from(ticketVerifications)
    .where(
      and(
        eq(ticketVerifications.userId, userId),
        eq(ticketVerifications.eventId, eventId),
      ),
    )
    .limit(1);

  return Boolean(row);
}

// Bir etkinlik için bileti doğrulayan kişi sayısı. Yalnızca sayı döner, kimlik döndürülmez.
export async function countTicketVerifications(
  eventId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(ticketVerifications)
    .where(eq(ticketVerifications.eventId, eventId));

  return row?.total ?? 0;
}
