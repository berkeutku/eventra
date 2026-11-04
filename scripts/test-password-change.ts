import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { loginAttempts, users } from "../src/db/schema";
import { clearFailedLogins, isLoginBlocked } from "../src/lib/login-throttle";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { changePassword } from "../src/lib/password-change";

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
  const email = `pwchange-${stamp}@pw-test.invalid`;
  const OLD = "eski-parola-1";
  const NEW = "yeni-parola-2";
  const NEW2 = "ucuncu-parola-3";

  const [user] = await db
    .insert(users)
    .values({
      name: "Pw Test",
      email,
      passwordHash: await hashPassword(OLD),
      role: "passenger",
    })
    .returning({ id: users.id });

  const failedCount = async () =>
    (await db.select({ id: loginAttempts.id }).from(loginAttempts).where(eq(loginAttempts.email, email))).length;
  const currentHash = async () =>
    (await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id)))[0].hash;
  const attempt = (current: unknown, next: unknown) =>
    changePassword({ userId: user.id, currentPassword: current, newPassword: next });

  try {
    check("çok kısa yeni parola reddedilir", (await attempt(OLD, "short")) === "too_short" && (await attempt(OLD, "1234567")) === "too_short");
    check("metin olmayan yeni parola reddedilir", (await attempt(OLD, 12345678)) === "too_short");
    check("çok uzun yeni parola reddedilir", (await attempt(OLD, "a".repeat(129))) === "too_long");
    check("var olmayan hesap", (await changePassword({ userId: "00000000-0000-4000-8000-000000000000", currentPassword: OLD, newPassword: NEW })) === "not_found");
    check("bozuk hesap kimliği hata vermez", (await changePassword({ userId: "bozuk", currentPassword: OLD, newPassword: NEW })) === "not_found");
    check("doğrulama hataları sayaca yazılmaz", (await failedCount()) === 0);

    check("yanlış mevcut parola reddedilir ve sayaca yazılır", (await attempt("yanlis-parola", NEW)) === "wrong_password" && (await failedCount()) === 1);
    check("boş, metin olmayan ve çok uzun mevcut parola reddedilir, sayaca yazılmaz", (await attempt("", NEW)) === "wrong_password" && (await attempt(42, NEW)) === "wrong_password" && (await attempt("a".repeat(129), NEW)) === "wrong_password" && (await failedCount()) === 1);
    check("yeni parola eskisiyle aynı olamaz", (await attempt(OLD, OLD)) === "same_password");
    check("başarısız denemelerde parola değişmedi", await verifyPassword(OLD, await currentHash()));

    for (let i = 0; i < 4; i += 1) {
      await attempt("yanlis-parola", NEW);
    }

    check("5 hatalı denemeden sonra doğru parola bile engellenir", (await isLoginBlocked(email)) && (await attempt(OLD, NEW)) === "blocked");
    check("engelliyken parola değişmedi", await verifyPassword(OLD, await currentHash()));

    await clearFailedLogins(email);

    check("doğru mevcut parola ile değiştirilir", (await attempt(OLD, NEW)) === "changed");
    const hashAfter = await currentHash();
    check("yeni parola geçerli, eskisi geçersiz", (await verifyPassword(NEW, hashAfter)) && !(await verifyPassword(OLD, hashAfter)));
    check("parola düz metin olarak saklanmaz", !hashAfter.includes(NEW));
    check("eski parola artık mevcut parola olarak kabul edilmez", (await attempt(OLD, NEW2)) === "wrong_password" && (await failedCount()) === 1);
    check("başarılı değişim önceki hatalı denemeleri sıfırlar", (await attempt(NEW, NEW2)) === "changed" && (await failedCount()) === 0);
    check("128 karakterlik parola kabul edilir", (await attempt(NEW2, "a".repeat(128))) === "changed" && (await verifyPassword("a".repeat(128), await currentHash())));
  } finally {
    await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
    await db.delete(users).where(eq(users.id, user.id));
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