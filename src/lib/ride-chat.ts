import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db } from "../db";
import {
  events,
  notifications,
  ridePassengers,
  rideMessages,
  rides,
  users,
} from "../db/schema";
import {
  MAX_MESSAGES_PER_RIDE,
  MAX_MESSAGES_PER_WINDOW,
  MESSAGE_WINDOW_MS,
  NOTIFY_BUCKET_MS,
  RETENTION_DAYS,
  chatPhase,
  prepareMessage,
  type ChatItem,
  type ChatPhase,
} from "./chat-rules";
import { takeRateSlot } from "./rate-limit";
import { firstName } from "./request-rules";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ChatAccess = {
  rideId: string;
  eventId: string;
  participantIds: string[];
  phase: ChatPhase;
};

// Yalnızca yolculuğun sürücüsü ve o an katılmış yolcular için sonuç döner, diğer herkes için null.
export async function getChatAccess(
  rideId: string,
  userId: string,
  now: Date = new Date(),
): Promise<ChatAccess | null> {
  if (!UUID_PATTERN.test(rideId)) {
    return null;
  }

  const [row] = await db
    .select({
      eventId: rides.eventId,
      driverId: rides.driverId,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
    })
    .from(rides)
    .innerJoin(events, eq(rides.eventId, events.id))
    .where(eq(rides.id, rideId))
    .limit(1);

  if (!row) {
    return null;
  }

  const passengers = await db
    .select({ userId: ridePassengers.userId })
    .from(ridePassengers)
    .where(eq(ridePassengers.rideId, rideId));

  const participantIds = [row.driverId, ...passengers.map((p) => p.userId)];

  if (!participantIds.includes(userId)) {
    return null;
  }

  return {
    rideId,
    eventId: row.eventId,
    participantIds,
    phase: chatPhase(
      {
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt ? row.endsAt.toISOString() : null,
      },
      now,
    ),
  };
}

// Çağıran taraf erişimi önceden doğrulamış olmalı. Son 60 mesaj, eskiden yeniye.
export async function listMessages(
  rideId: string,
  viewerId: string,
  limit = 60,
): Promise<ChatItem[]> {
  const rows = await db
    .select({
      id: rideMessages.id,
      senderId: rideMessages.senderId,
      name: users.name,
      body: rideMessages.body,
      createdAt: rideMessages.createdAt,
    })
    .from(rideMessages)
    .innerJoin(users, eq(rideMessages.senderId, users.id))
    .where(eq(rideMessages.rideId, rideId))
    .orderBy(desc(rideMessages.createdAt), desc(rideMessages.id))
    .limit(limit);

  return rows.reverse().map((row) => ({
    id: row.id,
    mine: row.senderId === viewerId,
    name: firstName(row.name),
    body: row.body,
    at: row.createdAt.toISOString(),
  }));
}

export async function loadChat(
  rideId: string,
  userId: string,
  now: Date = new Date(),
): Promise<{ access: ChatAccess; items: ChatItem[] } | null> {
  const access = await getChatAccess(rideId, userId, now);

  if (!access) {
    return null;
  }

  return { access, items: await listMessages(rideId, userId) };
}

export type SendStatus =
  | "sent"
  | "empty"
  | "too_long"
  | "link"
  | "not_participant"
  | "read_only"
  | "rate_limited"
  | "ride_full";

export async function sendMessage(input: {
  rideId: string;
  userId: string;
  text: unknown;
  now?: Date;
}): Promise<SendStatus> {
  const now = input.now ?? new Date();
  const prepared = prepareMessage(input.text);

  if (!prepared.ok) {
    return prepared.reason;
  }

  const access = await getChatAccess(input.rideId, input.userId, now);

  if (!access) {
    return "not_participant";
  }

  if (access.phase === "readonly") {
    return "read_only";
  }

  const allowed = await takeRateSlot(
    input.userId,
    "chat_message",
    MAX_MESSAGES_PER_WINDOW,
    MESSAGE_WINDOW_MS,
    now,
  );

  if (!allowed) {
    return "rate_limited";
  }

  const [counted] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(rideMessages)
    .where(eq(rideMessages.rideId, input.rideId));

  if (counted.total >= MAX_MESSAGES_PER_RIDE) {
    return "ride_full";
  }

  await db.insert(rideMessages).values({
    rideId: input.rideId,
    senderId: input.userId,
    body: prepared.text,
    createdAt: now,
  });

  // Diğer katılımcılara bildirim: mesaj içeriği bildirimde yazmaz, aynı yolculuk için 5 dakikada bir.
  try {
    const recipients = access.participantIds.filter((id) => id !== input.userId);

    if (recipients.length > 0) {
      const [sender] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      const bucket = Math.floor(now.getTime() / NOTIFY_BUCKET_MS);

      await db
        .insert(notifications)
        .values(
          recipients.map((userId) => ({
            userId,
            type: "ride_message" as const,
            title: "Yolculuğunda yeni mesaj var",
            body: `${firstName(sender?.name ?? "")} yolculuk sohbetine mesaj yazdı.`,
            link: `/events/${access.eventId}/yolculuk/${input.rideId}`,
            dedupeKey: `ride_message:${input.rideId}:${bucket}`,
          })),
        )
        .onConflictDoNothing();
    }
  } catch (error) {
    console.error(
      "Sohbet bildirimi yazılamadı:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
  }

  // 60 günden eski mesajlar temizlenir. Hata gönderimi etkilemez.
  try {
    await db
      .delete(rideMessages)
      .where(
        lt(
          rideMessages.createdAt,
          new Date(now.getTime() - RETENTION_DAYS * 86_400_000),
        ),
      );
  } catch (error) {
    console.error(
      "Eski mesajlar silinemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
  }

  return "sent";
}

// Yalnızca kendi mesajını silebilirsin. Gerçekten bir kayıt silindiyse true döner.
export async function deleteMessage(
  userId: string,
  messageId: string,
): Promise<boolean> {
  if (!UUID_PATTERN.test(messageId)) {
    return false;
  }

  const removed = await db
    .delete(rideMessages)
    .where(
      and(eq(rideMessages.id, messageId), eq(rideMessages.senderId, userId)),
    )
    .returning({ id: rideMessages.id });

  return removed.length > 0;
}