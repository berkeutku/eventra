import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli
// (../db) import yollarını kullanıyor.

export type NotificationType = "ride_joined" | "ride_left" | "ride_cancelled";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Her sorgu alıcının kimliğiyle sınırlıdır: kimse başkasının bildirimini göremez.
export async function listNotifications(
  userId: string,
  limit = 30,
): Promise<NotificationItem[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    read: row.readAt !== null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function countUnread(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

  return row.total;
}

// Yalnızca bildirimin sahibi okundu işaretleyebilir. Başarılıysa true döner.
export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  if (!UUID_PATTERN.test(notificationId)) {
    return false;
  }

  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ id: notifications.id });

  return updated.length > 0;
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<number> {
  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });

  return updated.length;
}

// Bildirimi yalnızca sahibi için okundu yapar ve gideceği adresi döner.
// Daha önce okunmuşsa ilk okunma zamanı korunur. Başkasının bildirimi için null döner.
export async function openNotification(
  userId: string,
  notificationId: string,
): Promise<string | null> {
  if (!UUID_PATTERN.test(notificationId)) {
    return null;
  }

  const rows = await db
    .update(notifications)
    .set({ readAt: sql`coalesce(${notifications.readAt}, now())` })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
      ),
    )
    .returning({ link: notifications.link });

  return rows[0]?.link ?? null;
}