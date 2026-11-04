import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import {
  clearFailedLogins,
  isLoginBlocked,
  recordFailedLogin,
} from "./login-throttle";
import { hashPassword, verifyPassword } from "./password";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 128;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ChangePasswordStatus =
  | "changed"
  | "wrong_password"
  | "same_password"
  | "too_short"
  | "too_long"
  | "blocked"
  | "not_found";

// Mevcut parola yanlışsa giriş sayfasıyla aynı sayaca yazılır, çok denemede işlem engellenir.
// Oturumların kapatılması çağıran tarafta yapılır (çerezle çalıştığı için).
export async function changePassword(input: {
  userId: string;
  currentPassword: unknown;
  newPassword: unknown;
}): Promise<ChangePasswordStatus> {
  const next = input.newPassword;
  const current = input.currentPassword;

  if (typeof next !== "string" || next.length < MIN_PASSWORD) {
    return "too_short";
  }

  if (next.length > MAX_PASSWORD) {
    return "too_long";
  }

  if (!UUID_PATTERN.test(input.userId)) {
    return "not_found";
  }

  const [user] = await db
    .select({ email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);

  if (!user) {
    return "not_found";
  }

  if (await isLoginBlocked(user.email)) {
    return "blocked";
  }

  // Doğru olamayacak değerler (metin değil, boş, çok uzun) pahalı özet hesabına girmeden reddedilir.
  if (
    typeof current !== "string" ||
    current.length === 0 ||
    current.length > MAX_PASSWORD
  ) {
    return "wrong_password";
  }

  if (!(await verifyPassword(current, user.passwordHash))) {
    await recordFailedLogin(user.email);
    return "wrong_password";
  }

  if (current === next) {
    return "same_password";
  }

  const passwordHash = await hashPassword(next);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, input.userId));

  // Doğru parolayı bilen kişi işlemi tamamladı, önceki hatalı denemeler sıfırlanır.
  await clearFailedLogins(user.email);

  return "changed";
}