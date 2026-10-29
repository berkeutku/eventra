"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { sendTestPush, type TestPushResult } from "@/lib/push";

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;
const MAX_SUBSCRIPTIONS_PER_USER = 10;

type SubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

// Kimlik her zaman oturumdan alınır. Aynı cihaz başka bir hesapla kaydedilirse
// abonelik yeni hesaba geçer (uç nokta benzersizdir).
export async function savePushSubscriptionAction(
  input: SubscriptionInput,
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const endpoint = input?.endpoint;
  const p256dh = input?.p256dh;
  const auth = input?.auth;

  if (
    typeof endpoint !== "string" ||
    typeof p256dh !== "string" ||
    typeof auth !== "string" ||
    !endpoint.startsWith("https://") ||
    endpoint.length > 2000 ||
    p256dh.length > 200 ||
    auth.length > 200 ||
    !BASE64URL.test(p256dh) ||
    !BASE64URL.test(auth)
  ) {
    return false;
  }

  try {
    const [others] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, user.id),
          ne(pushSubscriptions.endpoint, endpoint),
        ),
      );

    if (others.total >= MAX_SUBSCRIPTIONS_PER_USER) {
      return false;
    }

    await db
      .insert(pushSubscriptions)
      .values({ userId: user.id, endpoint, p256dh, auth })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId: user.id, p256dh, auth },
      });

    return true;
  } catch (error) {
    console.error(
      "Push aboneliği kaydedilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return false;
  }
}

// Yalnızca kendi aboneliğini silebilirsin.
export async function removePushSubscriptionAction(
  endpoint: string,
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user || typeof endpoint !== "string") {
    return false;
  }

  try {
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, user.id),
        ),
      );
    return true;
  } catch {
    return false;
  }
}

export async function sendTestPushAction(): Promise<TestPushResult> {
  const user = await getCurrentUser();

  if (!user) {
    return "failed";
  }

  return sendTestPush(user.id);
}