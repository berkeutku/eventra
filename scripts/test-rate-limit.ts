import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { actionLog, users } from "../src/db/schema";
import { takeRateSlot } from "../src/lib/rate-limit";

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

const HOUR = 3_600_000;

async function main() {
  const stamp = Date.now();
  const created = await db
    .insert(users)
    .values(
      ["A", "B"].map((name, index) => ({
        name: `Rate ${name}`,
        email: `ratelimit-${index}-${stamp}@rate-test.invalid`,
        passwordHash: "test",
        role: "passenger" as const,
      })),
    )
    .returning({ id: users.id, name: users.name });

  const a = created.find((user) => user.name === "Rate A");
  const b = created.find((user) => user.name === "Rate B");

  if (!a || !b) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  try {
    const base = new Date();

    check("ilk üç hak verilir", (await takeRateSlot(a.id, "test_kind", 3, HOUR, base)) && (await takeRateSlot(a.id, "test_kind", 3, HOUR, base)) && (await takeRateSlot(a.id, "test_kind", 3, HOUR, base)));
    check("dördüncü deneme reddedilir", !(await takeRateSlot(a.id, "test_kind", 3, HOUR, base)));
    check("reddedilen deneme kayıt eklemez", (await db.select({ id: actionLog.id }).from(actionLog).where(eq(actionLog.userId, a.id))).length === 3);
    check("başka işlem türü ayrı sayılır", await takeRateSlot(a.id, "other_kind", 3, HOUR, base));
    check("başka kullanıcı ayrı sayılır", await takeRateSlot(b.id, "test_kind", 3, HOUR, base));
    check("pencere geçince haklar yenilenir", await takeRateSlot(a.id, "test_kind", 3, HOUR, new Date(base.getTime() + 2 * HOUR)));

    await db.insert(actionLog).values({ userId: b.id, kind: "old_kind", createdAt: new Date(base.getTime() - 3 * 24 * HOUR) });
    await takeRateSlot(b.id, "test_kind", 3, HOUR, base);
    check("24 saatten eski kayıtlar temizlenir", (await db.select({ id: actionLog.id }).from(actionLog).where(eq(actionLog.kind, "old_kind"))).length === 0);

    check("sıfır hak tanınan işlem hiç verilmez", !(await takeRateSlot(a.id, "zero_kind", 0, HOUR, base)));

    await db.delete(users).where(eq(users.id, b.id));
    check("hesap silinince kayıtlar silinir", (await db.select({ id: actionLog.id }).from(actionLog).where(eq(actionLog.userId, b.id))).length === 0);
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