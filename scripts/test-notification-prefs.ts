import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  notificationPreferences,
  notifications,
  pushDeliveries,
  pushSubscriptions,
  users,
} from "../src/db/schema";
import { PREF_TYPES } from "../src/lib/notification-pref-types";
import { getMutedTypes, saveMutedTypes } from "../src/lib/notification-prefs";
import { sendPendingPush, type PushPayload, type PushTarget } from "../src/lib/push";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean) {
  if (ok) {
    passed += 1;
    console.log(`  geçti: ${name}`);
  } else {
    failed += 1;
    console.log(`  BAŞARISIZ: ${name}`);
  }
}

async function main() {
  const stamp = Date.now();
  const created = await db
    .insert(users)
    .values(
      ["A", "B"].map((name, index) => ({
        name: `Pref ${name}`,
        email: `pref-${index}-${stamp}@pref-test.invalid`,
        passwordHash: "test",
        role: "passenger" as const,
      })),
    )
    .returning({ id: users.id, name: users.name });

  const a = created.find((user) => user.name === "Pref A");
  const b = created.find((user) => user.name === "Pref B");

  if (!a || !b) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  const endpointA = `https://push.example.invalid/${stamp}-a`;
  const endpointB = `https://push.example.invalid/${stamp}-b`;

  try {
    check("tercih kaydı yokken hiçbir tür kapalı değil", (await getMutedTypes(a.id)).length === 0);

    const saved = await saveMutedTypes(a.id, ["ride_joined", "ride_joined", "uydurma", 5, "ride_updated"]);
    check("yalnızca geçerli ve tekil türler kaydedilir", saved.join(",") === "ride_joined,ride_updated" && (await getMutedTypes(a.id)).join(",") === "ride_joined,ride_updated");

    await db.insert(pushSubscriptions).values([
      { userId: a.id, endpoint: endpointA, p256dh: "p", auth: "a" },
      { userId: b.id, endpoint: endpointB, p256dh: "p", auth: "a" },
    ]);

    const types = ["ride_joined", "ride_left", "ride_updated"] as const;
    const rows = [];

    for (const user of [a, b]) {
      for (const type of types) {
        rows.push({ userId: user.id, type, title: `T-${type}`, body: "x", link: "/bildirimler" });
      }
    }

    const inserted = await db.insert(notifications).values(rows).returning({ id: notifications.id, userId: notifications.userId, type: notifications.type });

    const sent: string[] = [];
    const sender = async (target: PushTarget, payload: PushPayload) => {
      sent.push(`${target.endpoint}|${payload.title}`);
    };

    await sendPendingPush(sender, { userIds: [a.id, b.id] });

    const forA = sent.filter((item) => item.startsWith(endpointA)).map((item) => item.split("|")[1]);
    const forB = sent.filter((item) => item.startsWith(endpointB)).map((item) => item.split("|")[1]);

    check("kapatılan türler telefona gönderilmez", forA.length === 1 && forA[0] === "T-ride_left");
    check("tercihi olmayan kullanıcı hepsini alır", forB.length === 3);

    const deliveredA = await db.select({ id: pushDeliveries.notificationId }).from(pushDeliveries).where(inArray(pushDeliveries.notificationId, inserted.filter((row) => row.userId === a.id).map((row) => row.id)));
    check("kapatılan bildirimler 'alındı' işaretlenmez", deliveredA.length === 1);
    check("uygulama içi bildirimler yine de kayıtlı", (await db.select({ id: notifications.id }).from(notifications).where(eq(notifications.userId, a.id))).length === 3);

    await saveMutedTypes(a.id, []);
    sent.length = 0;
    await sendPendingPush(sender, { userIds: [a.id, b.id] });
    const lateA = sent.filter((item) => item.startsWith(endpointA)).map((item) => item.split("|")[1]).sort();
    check("tercih açılınca bekleyen bildirimler gönderilir", lateA.join(",") === "T-ride_joined,T-ride_updated");
    check("diğer kullanıcıya ikinci kez gönderilmez", sent.filter((item) => item.startsWith(endpointB)).length === 0);

    check("tüm türleri kapatmak mümkün", (await saveMutedTypes(a.id, [...PREF_TYPES])).length === PREF_TYPES.length);

    await db.delete(users).where(eq(users.id, a.id));
    const left = await db.select({ id: notificationPreferences.userId }).from(notificationPreferences).where(eq(notificationPreferences.userId, a.id));
    check("hesap silinince tercihler de silinir", left.length === 0);
  } finally {
    await db.delete(users).where(inArray(users.id, created.map((user) => user.id)));
  }

  console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Test çalışırken hata oluştu:", error instanceof Error ? error.message : "bilinmeyen hata");
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });