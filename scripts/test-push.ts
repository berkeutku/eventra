import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  notifications,
  pushSubscriptions,
  users,
} from "../src/db/schema";
import {
  sendPendingPush,
  sendTestPush,
  type PushPayload,
  type PushSender,
  type PushTarget,
} from "../src/lib/push";

const EMAIL_DOMAIN = "@push-test.invalid";

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
      ["A", "B", "C"].map((name, index) => ({
        name: `Push ${name}`,
        email: `push-${index}-${stamp}${EMAIL_DOMAIN}`,
        passwordHash: "test",
        role: "passenger" as const,
      })),
    )
    .returning({ id: users.id, name: users.name });

  const userA = created.find((user) => user.name === "Push A");
  const userB = created.find((user) => user.name === "Push B");
  const userC = created.find((user) => user.name === "Push C");

  if (!userA || !userB || !userC) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  const ids = created.map((user) => user.id);
  const sentLog: { endpoint: string; payload: PushPayload }[] = [];
  const goneEndpoints = new Set<string>();

  const fakeSender: PushSender = async (
    target: PushTarget,
    payload: PushPayload,
  ) => {
    if (goneEndpoints.has(target.endpoint)) {
      throw Object.assign(new Error("gone"), { statusCode: 410 });
    }
    sentLog.push({ endpoint: target.endpoint, payload });
  };

  const endpointA1 = `https://push.example.invalid/${stamp}/a1`;
  const endpointA2 = `https://push.example.invalid/${stamp}/a2`;
  const endpointB1 = `https://push.example.invalid/${stamp}/b1`;

  try {
    await db.insert(pushSubscriptions).values([
      { userId: userA.id, endpoint: endpointA1, p256dh: "key", auth: "auth" },
      { userId: userA.id, endpoint: endpointA2, p256dh: "key", auth: "auth" },
      { userId: userB.id, endpoint: endpointB1, p256dh: "key", auth: "auth" },
    ]);

    await db.insert(notifications).values([
      {
        userId: userA.id,
        type: "ride_joined",
        title: "A yeni",
        body: "A için yeni bildirim",
        link: "/events/test-a",
      },
      {
        userId: userB.id,
        type: "ride_left",
        title: "B yeni",
        body: "B için yeni bildirim",
        link: "/events/test-b",
      },
      {
        userId: userC.id,
        type: "ride_cancelled",
        title: "C yeni",
        body: "C aboneliksiz",
        link: "/events/test-c",
      },
      {
        userId: userA.id,
        type: "ride_joined",
        title: "A eski",
        body: "30 dakika önceki bildirim",
        link: "/events/test-eski",
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ]);

    const first = await sendPendingPush(fakeSender, { userIds: ids });
    check("A (2 cihaz) ve B (1 cihaz) için toplam 3 gönderim", first === 3);
    check(
      "aboneliği olmayan C için gönderim yok",
      sentLog.every((entry) => entry.payload.title !== "C yeni"),
    );
    check(
      "30 dakika önceki bildirim gönderilmedi",
      sentLog.every((entry) => entry.payload.title !== "A eski"),
    );
    check(
      "A'nın iki cihazına da gitti",
      sentLog.filter((entry) => entry.payload.title === "A yeni").length === 2,
    );
    check(
      "içerik yalnızca başlık, metin ve site içi bağlantı",
      sentLog.every(
        (entry) =>
          Object.keys(entry.payload).sort().join(",") === "body,link,title" &&
          entry.payload.link.startsWith("/"),
      ),
    );

    const second = await sendPendingPush(fakeSender, { userIds: ids });
    check("ikinci çalıştırmada tekrar gönderim yok", second === 0);

    const [concurrentTarget] = await db
      .insert(notifications)
      .values({
        userId: userB.id,
        type: "ride_joined",
        title: "B eşzamanlı",
        body: "Eşzamanlı deneme",
        link: "/events/test-b2",
      })
      .returning({ id: notifications.id });

    const before = sentLog.length;
    await Promise.all([
      sendPendingPush(fakeSender, { userIds: ids }),
      sendPendingPush(fakeSender, { userIds: ids }),
      sendPendingPush(fakeSender, { userIds: ids }),
    ]);
    check(
      "eşzamanlı üç çağrıda bildirim yalnızca bir kez gönderilir",
      sentLog.length - before === 1 && concurrentTarget.id.length > 0,
    );

    goneEndpoints.add(endpointA1);
    await db.insert(notifications).values({
      userId: userA.id,
      type: "ride_left",
      title: "A ikinci",
      body: "Ölü abonelik denemesi",
      link: "/events/test-a2",
    });
    const third = await sendPendingPush(fakeSender, { userIds: ids });
    check("ölü cihaza gönderilemedi, canlı cihaza gitti", third === 1);

    const remaining = await db
      .select({ endpoint: pushSubscriptions.endpoint })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userA.id));
    check(
      "410 alan abonelik silindi, diğeri duruyor",
      remaining.length === 1 && remaining[0].endpoint === endpointA2,
    );

    check(
      "abonelik yokken deneme bildirimi no_subscription döner",
      (await sendTestPush(userC.id, fakeSender)) === "no_subscription",
    );
    check(
      "abonelik varken deneme bildirimi gönderilir",
      (await sendTestPush(userB.id, fakeSender)) === "sent",
    );
  } finally {
    // Kullanıcılar silinince abonelikleri, bildirimleri ve gönderim kayıtları zincirleme silinir.
    await db.delete(users).where(inArray(users.id, ids));
  }

  console.log(`\n${passed} test geçti, ${failed} test başarısız.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Test çalışırken hata oluştu:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });