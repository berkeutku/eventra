import { CHECK_PHASES, ticketSteps } from "../src/lib/ticket-steps-rules";

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

function states(loggedIn: boolean, verified: boolean): string {
  return ticketSteps(loggedIn, verified)
    .map((step) => step.state)
    .join(",");
}

function main() {
  check("her zaman üç adım vardır", ticketSteps(false, false).length === 3);

  check(
    "giriş yok: giriş adımı aktif, diğerleri bekliyor",
    states(false, false) === "current,upcoming,upcoming",
  );

  check(
    "giriş var, bilet doğrulanmamış: kod adımı aktif",
    states(true, false) === "done,current,upcoming",
  );

  check(
    "giriş var, bilet doğrulanmış: hepsi tamam",
    states(true, true) === "done,done,done",
  );

  check(
    "giriş yokken doğrulanmış gelse bile doğrulanmış sayılmaz",
    states(false, true) === "current,upcoming,upcoming",
  );

  const combos: [boolean, boolean][] = [
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ];

  check(
    "aynı anda en fazla bir adım aktif olur",
    combos.every(
      ([loggedIn, verified]) =>
        ticketSteps(loggedIn, verified).filter((step) => step.state === "current")
          .length <= 1,
    ),
  );

  check(
    "adım anahtarları sıralı: login, code, ready",
    ticketSteps(true, false)
      .map((step) => step.key)
      .join(",") === "login,code,ready",
  );

  check("doğrulama sırasında üç simüle adım gösterilir", CHECK_PHASES.length === 3);

  console.log(`\n${passed} test geçti, ${failed} test başarısız.`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
