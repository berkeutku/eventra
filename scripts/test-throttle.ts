import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { loginAttempts } from "../src/db/schema";
import {
  clearFailedLogins,
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
  } finally {
    await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
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