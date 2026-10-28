"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import {
  LOGIN_WINDOW_MINUTES,
  clearFailedLogins,
  isLoginBlocked,
  recordFailedLogin,
} from "@/lib/login-throttle";
import { hashPassword, verifyPassword } from "@/lib/password";
import { safeNextPath } from "@/lib/safe-redirect";

export type LoginState = {
  message?: string;
  values?: { email: string };
};

const GENERIC_ERROR = "E-posta veya parola hatalı.";
const BLOCKED_ERROR = `Çok fazla hatalı deneme yaptın. Güvenlik için ${LOGIN_WINDOW_MINUTES} dakika sonra tekrar dene.`;

let dummyHash: Promise<string> | undefined;

function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword("eventra-dummy-password");
  return dummyHash;
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { email };

  if (!email || !password) {
    return { message: "E-posta ve parolanı gir.", values };
  }

  if (email.length > 254 || password.length > 128) {
    return { message: GENERIC_ERROR, values };
  }

  let loggedIn = false;

  try {
    // Çok sayıda hatalı denemeden sonra parola kontrolüne hiç girmeden reddet.
    // Sayaç, kayıtlı olmayan e-postalar için de aynı şekilde tutulur.
    if (await isLoginBlocked(email)) {
      return { message: BLOCKED_ERROR, values };
    }

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      if (await verifyPassword(password, user.passwordHash)) {
        await createSession(user.id);
        await clearFailedLogins(email);
        loggedIn = true;
      } else {
        await recordFailedLogin(email);
      }
    } else {
      // Kullanıcı yoksa da aynı sürede bir parola kontrolü yap,
      // böylece yanıt süresi hangi e-postaların kayıtlı olduğunu ele vermez.
      await verifyPassword(password, await getDummyHash());
      await recordFailedLogin(email);
    }

    // Bu hatalı deneme sınırı doldurduysa kullanıcıya hemen söyle.
    if (!loggedIn && (await isLoginBlocked(email))) {
      return { message: BLOCKED_ERROR, values };
    }
  } catch (error) {
    console.error("Giriş hatası:", error);
    return {
      message: "Giriş yapılamadı. Lütfen biraz sonra tekrar dene.",
      values,
    };
  }

  if (!loggedIn) {
    return { message: GENERIC_ERROR, values };
  }

  // Yönlendirme adresi her zaman sunucuda doğrulanır (yalnızca site içi yollar).
  redirect(safeNextPath(formData.get("next")));
}