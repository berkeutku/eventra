import { and, eq } from "drizzle-orm";
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