import { and, eq, gt, inArray, sql } from "drizzle-orm";
import * as webpush from "web-push";
import { db } from "../db";
import {
  notifications,
  pushDeliveries,
  pushSubscriptions,
} from "../db/schema";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli
// (../db) import yollarını kullanıyor.

export type PushPayload = { title: string; body: string; link: string };
export type PushTarget = { endpoint: string; p256dh: string; auth: string };
export type PushSender = (
  target: PushTarget,
  payload: PushPayload,
) => Promise<void>;

const FRESH_MINUTES = 15;
const MAX_BATCH = 50;

function readVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

export function isPushConfigured(): boolean {
  return readVapid() !== null;
}

const webPushSender: PushSender = async (target, payload) => {
  const vapid = readVapid();

  if (!vapid) {
    throw new Error("Push anahtarları tanımlı değil.");
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  await webpush.sendNotification(
    {
      endpoint: target.endpoint,
      keys: { p256dh: target.p256dh, auth: target.auth },
    },
    JSON.stringify(payload),
    { TTL: 3600, urgency: "normal" },
  );
};

async function deliver(
  sender: PushSender,
  targets: PushTarget[],
  payload: PushPayload,
): Promise<number> {
  let sent = 0;

  for (const target of targets) {
    try {
      await sender(target, payload);
      sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number } | null)?.statusCode;

      // 404 ve 410: abonelik artık geçerli değil, temizle.
      if (status === 404 || status === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, target.endpoint));
      } else {
        // Hata nesnesinin tamamı yazılmaz: uç nokta adresi içerebilir.
        console.error("Push gönderilemedi, durum:", status ?? "bilinmiyor");
      }
    }
  }

  return sent;
}

// Henüz push için alınmamış, yeni ve aboneliği olan kullanıcılara ait bildirimleri gönderir.
// Hata fırlatmaz: gönderim başarısız olsa bile ana işlem etkilenmez.
export async function sendPendingPush(
  sender?: PushSender,
  options?: { userIds?: string[] },
): Promise<number> {
  if (!sender && !isPushConfigured()) {
    return 0;
  }

  const send = sender ?? webPushSender;

  try {
    const since = new Date(Date.now() - FRESH_MINUTES * 60 * 1000);

    const eligible = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        title: notifications.title,
        body: notifications.body,
        link: notifications.link,
      })
      .from(notifications)
      .where(
        and(
          gt(notifications.createdAt, since),
          options?.userIds
            ? inArray(notifications.userId, options.userIds)
            : undefined,
          sql`exists (select 1 from ${pushSubscriptions} where ${pushSubscriptions.userId} = ${notifications.userId})`,
          sql`not exists (select 1 from ${pushDeliveries} where ${pushDeliveries.notificationId} = ${notifications.id})`,
        ),
      )
      .limit(MAX_BATCH);

    if (eligible.length === 0) {
      return 0;
    }

    // Bildirimi "alma" işlemi: birincil anahtar çakışması sayesinde
    // eşzamanlı iki istekten yalnızca biri her bildirimi kazanır.
    const claimed = await db
      .insert(pushDeliveries)
      .values(eligible.map((item) => ({ notificationId: item.id })))
      .onConflictDoNothing()
      .returning({ notificationId: pushDeliveries.notificationId });

    const won = new Set(claimed.map((row) => row.notificationId));
    const mine = eligible.filter((item) => won.has(item.id));

    if (mine.length === 0) {
      return 0;
    }

    const subscriptions = await db
      .select({
        userId: pushSubscriptions.userId,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(pushSubscriptions)
      .where(
        inArray(pushSubscriptions.userId, [
          ...new Set(mine.map((item) => item.userId)),
        ]),
      );

    let total = 0;

    for (const item of mine) {
      const targets = subscriptions.filter((row) => row.userId === item.userId);
      total += await deliver(send, targets, {
        title: item.title,
        body: item.body,
        link: item.link,
      });
    }

    return total;
  } catch (error) {
    console.error(
      "Push işlemi tamamlanamadı:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return 0;
  }
}

export type TestPushResult =
  | "sent"
  | "no_subscription"
  | "not_configured"
  | "failed";

// Kullanıcının kendi cihazlarına bir deneme bildirimi gönderir.
export async function sendTestPush(
  userId: string,
  sender?: PushSender,
): Promise<TestPushResult> {
  if (!sender && !isPushConfigured()) {
    return "not_configured";
  }

  const targets = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (targets.length === 0) {
    return "no_subscription";
  }

  const sent = await deliver(sender ?? webPushSender, targets, {
    title: "Eventra deneme bildirimi",
    body: "Telefon bildirimleri bu cihazda çalışıyor.",
    link: "/bildirimler",
  });

  return sent > 0 ? "sent" : "failed";
}