import "dotenv/config";
import {
  checkSignupAllowed,
  clearSignupRecords,
  hashIp,
  recordSignup,
} from "../src/lib/signup-throttle";

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
  const ipA = `test-${stamp}-a`;
  const ipB = `test-${stamp}-b`;
  const generous = { perIp: 2, global: 1_000_000 };

  try {
    check(
      "başlangıçta kayıt serbest",
      (await checkSignupAllowed(ipA, generous)) === "ok",
    );

    await recordSignup(ipA);
    check(
      "tek kayıttan sonra hâlâ serbest",
      (await checkSignupAllowed(ipA, generous)) === "ok",
    );

    await recordSignup(ipA);
    check(
      "IP sınırına ulaşınca ip_limited",
      (await checkSignupAllowed(ipA, generous)) === "ip_limited",
    );

    check(
      "başka bir IP etkilenmez",
      (await checkSignupAllowed(ipB, generous)) === "ok",
    );

    check(
      "genel sınır aşılınca global_limited",
      (await checkSignupAllowed(ipB, { perIp: 1000, global: 1 })) ===
        "global_limited",
    );

    check(
      "IP bilinmiyorsa IP sınırı atlanır",
      (await checkSignupAllowed(null, { perIp: 0, global: 1_000_000 })) === "ok",
    );

    check(
      "IP ham olarak saklanmaz, özeti alınır",
      hashIp(ipA) !== ipA && hashIp(ipA).length === 64,
    );
  } finally {
    await clearSignupRecords([ipA, ipB]);
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