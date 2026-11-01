import "dotenv/config";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "../src/db";
import { eventFavorites, events, users } from "../src/db/schema";
import {
  MAX_FAVORITES,
  isFavorite,
  listFavoriteEvents,
  setFavorite,
} from "../src/lib/favorites";

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
  const [demo] = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(eq(events.source, "demo"))
    .limit(1);

  if (!demo) {
    console.error("Demo etkinlik yok. Önce seed-events çalıştırılmalı.");
    process.exitCode = 1;
    return;
  }

  const stamp = Date.now();
  const created = await db
    .insert(users)
    .values(
      ["A", "B"].map((name, index) => ({
        name: `Fav ${name}`,
        email: `fav-${index}-${stamp}@fav-test.invalid`,
        passwordHash: "test",
        role: "passenger" as const,
      })),
    )
    .returning({ id: users.id, name: users.name });

  const userA = created.find((user) => user.name === "Fav A");
  const userB = created.find((user) => user.name === "Fav B");

  if (!userA || !userB) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  const tempId = `bgotestfav${stamp}-1`;
  const previousFlag = process.env.SHOW_REAL_EVENTS;

  try {
    check("başlangıçta favori değil", !(await isFavorite(userA.id, demo.id)));
    check("ekleme 'added' döner", (await setFavorite(userA.id, demo.id, true)) === "added");
    check("tekrar ekleme 'unchanged' döner", (await setFavorite(userA.id, demo.id, true)) === "unchanged");
    check("isFavorite true", await isFavorite(userA.id, demo.id));

    const list = await listFavoriteEvents(userA.id);
    check("liste etkinliği içerir", list.length === 1 && list[0].id === demo.id && list[0].title === demo.title);
    check("başka kullanıcıya görünmez", !(await isFavorite(userB.id, demo.id)) && (await listFavoriteEvents(userB.id)).length === 0);

    check("çıkarma 'removed' döner", (await setFavorite(userA.id, demo.id, false)) === "removed");
    check("tekrar çıkarma 'unchanged' ve liste boş", (await setFavorite(userA.id, demo.id, false)) === "unchanged" && (await listFavoriteEvents(userA.id)).length === 0);

    await db.insert(events).values({
      id: tempId,
      source: "biletimgo",
      externalId: `fav${stamp}`,
      title: "Favori Test Etkinliği",
      category: "other",
      city: "Test",
      venue: "Test",
      startsAt: new Date(Date.now() + 7 * 86_400_000),
      description: "Test",
      isActive: true,
    });

    check("gerçek etkinlik favorilenebilir (kayıt düzeyinde)", (await setFavorite(userA.id, tempId, true)) === "added");

    delete process.env.SHOW_REAL_EVENTS;
    check("bayrak kapalıyken gerçek etkinlik listede görünmez", !(await listFavoriteEvents(userA.id)).some((item) => item.id === tempId));

    process.env.SHOW_REAL_EVENTS = "1";
    check("bayrak açıkken gerçek etkinlik listede görünür", (await listFavoriteEvents(userA.id)).some((item) => item.id === tempId));

    await setFavorite(userA.id, tempId, false);
    check("yeniden ekleme sınırı", (await setFavorite(userA.id, demo.id, true, 1)) === "added");
    check("sınıra ulaşınca yeni favori 'limit' döner", (await setFavorite(userA.id, tempId, true, 1)) === "limit");
    check("sınırdayken mevcut favori 'unchanged' kalır", (await setFavorite(userA.id, demo.id, true, 1)) === "unchanged");

    await db.delete(users).where(eq(users.id, userA.id));
    const left = await db.select({ userId: eventFavorites.userId }).from(eventFavorites).where(eq(eventFavorites.userId, userA.id));
    check("hesap silinince favoriler de silinir", left.length === 0);

    check("üst sınır 200", MAX_FAVORITES === 200);
  } finally {
    if (previousFlag === undefined) {
      delete process.env.SHOW_REAL_EVENTS;
    } else {
      process.env.SHOW_REAL_EVENTS = previousFlag;
    }

    await db.delete(events).where(like(events.id, `bgotestfav${stamp}-%`));
    await db.delete(users).where(inArray(users.id, [userA.id, userB.id]));
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