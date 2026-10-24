"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export type RegisterState = {
  errors?: Partial<Record<"name" | "email" | "password" | "role", string>>;
  message?: string;
  values?: { name: string; email: string; role: string };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUniqueViolation(error: unknown): boolean {
  const direct = (error as { code?: string } | null)?.code;
  const nested = (error as { cause?: { code?: string } } | null)?.cause?.code;
  return direct === "23505" || nested === "23505";
}

export async function registerAction(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");
  const values = { name, email, role };

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

  const parsedRole =
    role === "driver" || role === "passenger" ? role : null;

  if (!parsedRole) {
    errors.role = "Lütfen bir rol seç.";
  }

  if (Object.keys(errors).length > 0 || !parsedRole) {
    return { errors, values };
  }

  let userId: string;

  try {
    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({ name, email, passwordHash, role: parsedRole })
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

  await createSession(userId);
  redirect("/hesap");
}