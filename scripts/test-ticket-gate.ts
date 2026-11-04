import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { events, ticketVerifications, users } from "../src/db/schema";
import { checkTicketGate, hasVerifiedTicket } from "../src/lib/ticket-gate";
import { gateFor, gateMessages } from "../src/lib/ticket-gate-rules";

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
  check("gerçek etkinlik doğrulansa bile 'unavailable'", gateFor({ source: "biletimgo" }, true) === "unavailable" && gateFor({ source: "biletimgo" }, false) === "unavailable");
  check("demo etkinlik, doğrulanmamış: 'verify_required'", gateFor({ source: "demo" }, false) === "verify_required");
  check("demo etkinlik, doğrulanmış: 'ok'", gateFor({ source: "demo" }, true) === "ok");
  check("kaynak belirtilmemişse demo sayılır", gateFor({}, false) === "verify_required" && gateFor({}, true) === "ok");
  check("her kapı için anlamlı mesaj var", (["create", "join"] as const).every((kind) => (["verify_required", "unavailable"] as const).every((gate) => gateMessages[kind][gate].length > 30)));

  const demos = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.source, "demo"))
    .limit(2);

  if (demos.length < 2) {
    throw new Error("En az iki demo etkinlik gerekli.");
  }

  const [demo1, demo2] = demos;
  const stamp = Date.now();
  const created = await db
    .insert(users)
    .values(
      ["A", "B"].map((name, index) => ({
        name: `Gate ${name}`,
        email: `gate-${index}-${stamp}@gate-test.invalid`,
        passwordHash: "test",
        role: "passenger" as const,
      })),
    )
    .returning({ id: users.id, name: users.name });

  const a = created.find((user) => user.name === "Gate A");
  const b = created.find((user) => user.name === "Gate B");

  if (!a || !b) {
    throw new Error("Test kullanıcıları oluşturulamadı.");
  }

  try {
    check("doğrulama yokken demo etkinlikte 'verify_required'", (await checkTicketGate(a.id, { id: demo1.id, source: "demo" })) === "verify_required" && !(await hasVerifiedTicket(a.id, demo1.id)));

    await db.insert(ticketVerifications).values({ userId: a.id, eventId: demo1.id, codeHash: `gate-${stamp}-a` });

    check("doğrulayınca aynı etkinlikte 'ok'", (await checkTicketGate(a.id, { id: demo1.id, source: "demo" })) === "ok");
    check("başka etkinlik için doğrulama yok: 'verify_required'", (await checkTicketGate(a.id, { id: demo2.id, source: "demo" })) === "verify_required");
    check("başka kullanıcı etkilenmez", (await checkTicketGate(b.id, { id: demo1.id, source: "demo" })) === "verify_required");
    check("gerçek etkinlik: doğrulama kaydı olsa bile 'unavailable'", (await checkTicketGate(a.id, { id: "bgo-0", source: "biletimgo" })) === "unavailable");

    await db.delete(users).where(eq(users.id, a.id));
    const left = await db.select({ id: ticketVerifications.id }).from(ticketVerifications).where(eq(ticketVerifications.codeHash, `gate-${stamp}-a`));
    check("hesap silinince doğrulama kaydı da silinir", left.length === 0);
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