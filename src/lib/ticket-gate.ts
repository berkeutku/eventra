import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { ticketVerifications } from "../db/schema";
import { gateFor, type GateEvent, type TicketGate } from "./ticket-gate-rules";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

export async function hasVerifiedTicket(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: ticketVerifications.id })
    .from(ticketVerifications)
    .where(
      and(
        eq(ticketVerifications.userId, userId),
        eq(ticketVerifications.eventId, eventId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

// Sunucu eylemlerinde kullanılır: kimlik her zaman oturumdan gelir.
export async function checkTicketGate(
  userId: string,
  event: GateEvent & { id: string },
): Promise<TicketGate> {
  if (event.source === "biletimgo") {
    return "unavailable";
  }

  return gateFor(event, await hasVerifiedTicket(userId, event.id));
}