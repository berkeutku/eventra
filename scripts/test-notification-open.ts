import "dotenv/config";
import { inArray } from "drizzle-orm";
import { db } from "../src/db";
import { notifications, users } from "../src/db/schema";
import { countUnread, openNotification } from "../src/lib/notifications";

const EMAIL_DOMAIN = "@open-test.invalid";

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
      ["Sahip", "Yabancı"].map((name, index) => ({
        name,
        email: `open-${index}-${stamp}${EMAIL_DOMAIN}`,
        passwordHash: "test",
        role: "passenger" as const,
      })),
    )
    .returning({ id: users.id, name: users.name });

  const owner = created.find((user) => user.name === "Sahip");
  const stranger = created.find((user) => user.name === "Yabancı");

  if (!owner || !stranger) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  try {
    const [item] = await db
      .insert(notifications)
      .values({
        userId: owner.id,
        type: "ride_joined",
        title: "Test",
        body: "Test bildirimi",
        link: "/events/test-etkinlik",
      })
      .returning({ id: notifications.id });

    check("başlangıçta 1 okunmamış", (await countUnread(owner.id)) === 1);

    check(
      "yabancı bildirimi açamaz",
      (await openNotification(stranger.id, item.id)) === null,
    );
    check(
      "yabancının denemesi bildirimi okundu yapmadı",
      (await countUnread(owner.id)) === 1,
    );
    check(
      "geçersiz kimlik reddedilir",
      (await openNotification(owner.id, "gecersiz")) === null,
    );

    check(
      "sahibi bildirimi açınca adresini alır",
      (await openNotification(owner.id, item.id)) === "/events/test-etkinlik",
    );
    check("açılınca okundu olur", (await countUnread(owner.id)) === 0);
    check(
      "tekrar açmak yine adresi verir ve sayıyı bozmaz",
      (await openNotification(owner.id, item.id)) === "/events/test-etkinlik" &&
        (await countUnread(owner.id)) === 0,
    );
  } finally {
    // Kullanıcılar silinince bildirimleri de zincirleme silinir.
    await db.delete(users).where(
      inArray(
        users.id,
        created.map((user) => user.id),
      ),
    );
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