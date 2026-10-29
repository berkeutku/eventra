"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { checkSignupAllowed, recordSignup } from "@/lib/signup-throttle";

export type RegisterState = {
  errors?: Partial<Record<"name" | "email" | "password", string>>;
  message?: string;
  values?: { name: string; email: string };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUniqueViolation(error: unknown): boolean {
  const direct = (error as { code?: string } | null)?.code;
  const nested = (error as { cause?: { code?: string } } | null)?.cause?.code;
  return direct === "23505" || nested === "23505";
}

// Vercel bu başlıkları kendisi doldurur. Başlık yoksa (yerel geliştirme) null döner.
async function readClientIp(): Promise<string | null> {
  const list = await headers();
  const real = list.get("x-real-ip")?.trim();

  if (real) {
    return real;
  }

  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}

export async function registerAction(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const values = { name, email };

  const errors: NonNullable<RegisterState["errors"]> = {};

  if (name.length < 2 || name.length > 40) {
    errors.name = "Ad 2 ile 40 karakter arasında olmalı.";
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = "Geçerli bir e-posta adresi gir.";
  }

  if (password.length < 8) {
    errors.password = "Parola en az 8 karakter olmalı.";
  } else if (password.length > 128) {
    errors.password = "Parola en fazla 128 karakter olabilir.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  const ip = await readClientIp();

  try {
    const allowed = await checkSignupAllowed(ip);

    if (allowed === "ip_limited") {
      return {
        message:
          "Bu ağdan kısa sürede çok fazla hesap oluşturuldu. Lütfen bir süre sonra tekrar dene.",
        values,
      };
    }

    if (allowed === "global_limited") {
      return {
        message:
          "Şu anda çok fazla kayıt isteği var. Lütfen biraz sonra tekrar dene.",
        values,
      };
    }
  } catch (error) {
    // Sınır kontrolü başarısız olursa kayıt engellenmez.
    console.error(
      "Kayıt sınırı kontrol edilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
  }

  let userId: string;

  try {
    const passwordHash = await hashPassword(password);
    // Rol verilmez: veritabanı varsayılanı "passenger" uygulanır.
    const [created] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning({ id: users.id });
    userId = created.id;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        errors: { email: "Bu e-posta ile zaten bir hesap var." },
        values,
      };
    }

    console.error("Kayıt hatası:", error);
    return {
      message: "Hesap oluşturulamadı. Lütfen biraz sonra tekrar dene.",
      values,
    };
  }

  try {
    await recordSignup(ip);
  } catch (error) {
    console.error(
      "Kayıt kaydı yazılamadı:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
  }

  await createSession(userId);
  redirect("/panel");
}