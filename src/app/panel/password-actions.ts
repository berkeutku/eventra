"use server";

import { destroyOtherSessions, getCurrentUser } from "@/lib/auth";
import { LOGIN_WINDOW_MINUTES } from "@/lib/login-throttle";
import {
  MAX_PASSWORD,
  MIN_PASSWORD,
  changePassword,
  type ChangePasswordStatus,
} from "@/lib/password-change";

export type ChangePasswordField = "current" | "next" | "confirm";

export type ChangePasswordState = {
  ok?: boolean;
  message?: string;
  errors?: Partial<Record<ChangePasswordField, string>>;
};

export async function changePasswordAction(
  _previous: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Oturum bulunamadı. Lütfen tekrar giriş yap." };
  }

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const errors: NonNullable<ChangePasswordState["errors"]> = {};

  if (!current) {
    errors.current = "Mevcut parolanı gir.";
  }

  if (next.length < MIN_PASSWORD) {
    errors.next = `Yeni parola en az ${MIN_PASSWORD} karakter olmalı.`;
  } else if (next.length > MAX_PASSWORD) {
    errors.next = `Yeni parola en fazla ${MAX_PASSWORD} karakter olabilir.`;
  }

  if (!errors.next && next !== confirm) {
    errors.confirm = "Parolalar aynı değil.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  let status: ChangePasswordStatus;

  try {
    status = await changePassword({
      userId: user.id,
      currentPassword: current,
      newPassword: next,
    });
  } catch (error) {
    console.error(
      "Parola değiştirilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return { message: "Parola değiştirilemedi. Lütfen biraz sonra tekrar dene." };
  }

  switch (status) {
    case "changed": {
      let closed = 0;

      try {
        closed = await destroyOtherSessions(user.id);
      } catch (error) {
        console.error(
          "Diğer oturumlar kapatılamadı:",
          error instanceof Error ? error.message : "bilinmeyen hata",
        );
      }

      return {
        ok: true,
        message:
          closed > 0
            ? `Parolan değiştirildi. Diğer cihazlardaki ${closed} oturum kapatıldı.`
            : "Parolan değiştirildi.",
      };
    }
    case "wrong_password":
      return { errors: { current: "Mevcut parola hatalı." } };
    case "same_password":
      return { errors: { next: "Yeni parolan eskisiyle aynı olamaz." } };
    case "too_short":
      return {
        errors: { next: `Yeni parola en az ${MIN_PASSWORD} karakter olmalı.` },
      };
    case "too_long":
      return {
        errors: {
          next: `Yeni parola en fazla ${MAX_PASSWORD} karakter olabilir.`,
        },
      };
    case "blocked":
      return {
        message: `Çok fazla hatalı deneme yaptın. Güvenlik için ${LOGIN_WINDOW_MINUTES} dakika sonra tekrar dene.`,
      };
    default:
      return { message: "Hesap bulunamadı." };
  }
}