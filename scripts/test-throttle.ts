import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { loginAttempts } from "../src/db/schema";
import {
  MAX_FAILED_PER_IP,
  clearFailedLogins,
  ipThrottleKey,
  isLoginBlocked,
  recordFailedLogin,
} from "../src/lib/login-throttle";

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
  const email = `throttle-${Date.now()}@throttle-test.invalid`;
  const ipKey = ipThrottleKey(`203.0.113.${Date.now() % 250}-test`);

  try {
    check("başlangıçta engel yok", !(await isLoginBlocked(email)));

    for (let i = 0; i < 4; i += 1) {
      await recordFailedLogin(email);
    }
    check("4 hatalı denemeden sonra engel yok", !(await isLoginBlocked(email)));

    await recordFailedLogin(email);
    check("5. hatalı denemeden sonra engel var", await isLoginBlocked(email));

    check(
      "başka bir e-posta etkilenmez",
      !(await isLoginBlocked(`other-${email}`)),
    );

    await clearFailedLogins(email);
    check(
      "başarılı girişten sonra sayaç sıfırlanır",
      !(await isLoginBlocked(email)),
    );

    // --- IP bazlı sınır ---
    check("IP anahtarı ham adresi içermez", !ipKey.includes("203.0.113"));
    check(
      "IP anahtarı aynı adres için sabit",
      ipThrottleKey("198.51.100.7") === ipThrottleKey("198.51.100.7"),
    );
    check(
      "farklı adresler farklı anahtar üretir",
      ipThrottleKey("198.51.100.7") !== ipThrottleKey("198.51.100.8"),
    );

    for (let i = 0; i < MAX_FAILED_PER_IP - 1; i += 1) {
      await recordFailedLogin(ipKey);
    }
    check(
      "IP sınırının altında engel yok",
      !(await isLoginBlocked(ipKey, MAX_FAILED_PER_IP)),
    );

    await recordFailedLogin(ipKey);
    check(
      "IP sınırı dolunca engel var",
      await isLoginBlocked(ipKey, MAX_FAILED_PER_IP),
    );
    check(
      "IP kayıtları e-posta sınırını tetiklemez",
      !(await isLoginBlocked(email)),
    );
    await clearFailedLogins(email);
    check(
      "başarılı e-posta girişi IP sayacını sıfırlamaz",
      await isLoginBlocked(ipKey, MAX_FAILED_PER_IP),
    );
  } finally {
    await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
    await db.delete(loginAttempts).where(eq(loginAttempts.email, ipKey));
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