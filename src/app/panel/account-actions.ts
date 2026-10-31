"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { deleteAccountData } from "@/lib/account";
import { destroySession, getCurrentUser } from "@/lib/auth";
import {
  LOGIN_WINDOW_MINUTES,
  isLoginBlocked,
  recordFailedLogin,
} from "@/lib/login-throttle";
import { verifyPassword } from "@/lib/password";
import { sendPendingPush } from "@/lib/push";

export type DeleteAccountState = {
  message?: string;
  done?: boolean;
};

export async function deleteAccountAction(
  _previous: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Oturum bulunamadı. Lütfen tekrar giriş yap." };
  }

  if (String(formData.get("confirm") ?? "") !== "yes") {
    return { message: "Devam etmek için onay kutusunu işaretlemelisin." };
  }

  const password = String(formData.get("password") ?? "");

  if (!password || password.length > 128) {
    return { message: "Parolanı gir." };
  }

  try {
    // Parola denemeleri giriş sınırıyla aynı sayaca yazılır.
    if (await isLoginBlocked(user.email)) {
      return {
        message: `Çok fazla hatalı deneme yaptın. Güvenlik için ${LOGIN_WINDOW_MINUTES} dakika sonra tekrar dene.`,
      };
    }

    const [row] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!row || !(await verifyPassword(password, row.passwordHash))) {
      await recordFailedLogin(user.email);
      return { message: "Parola hatalı." };
    }

    const deleted = await deleteAccountData(user.id);

    if (!deleted) {
      return { message: "Hesap bulunamadı." };
    }
  } catch (error) {
    console.error(
      "Hesap silinemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return { message: "Hesap silinemedi. Lütfen biraz sonra tekrar dene." };
  }

  // Hesap silindi: oturum çerezini temizle ve etkilenen kişilere bildirim gönder.
  try {
    await destroySession();
  } catch {
    // Oturum kaydı zaten zincirleme silindi, çerez temizliği başarısız olsa da devam.
  }

  after(() => sendPendingPush());
  revalidatePath("/", "layout");

  return { done: true };
}