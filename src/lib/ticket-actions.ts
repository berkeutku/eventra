"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ticketVerifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getEventById } from "@/lib/events";
import { isTicketVerified } from "@/lib/ticket-queries";
import { checkTicket, generateDemoTicketCode } from "@/lib/ticket-provider";

export type VerifyTicketState = {
  message?: string;
  ok?: boolean;
};

export type GenerateCodeResult = {
  code?: string;
  message?: string;
};

function isUniqueViolation(error: unknown): boolean {
  const direct = (error as { code?: string } | null)?.code;
  const nested = (error as { cause?: { code?: string } } | null)?.cause?.code;
  return direct === "23505" || nested === "23505";
}

export async function generateDemoCodeAction(): Promise<GenerateCodeResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Önce giriş yapmalısın." };
  }

  return { code: generateDemoTicketCode() };
}

export async function verifyTicketAction(
  _previous: VerifyTicketState,
  formData: FormData,
): Promise<VerifyTicketState> {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Önce giriş yapmalısın." };
  }

  const eventId = String(formData.get("eventId") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  if (code.length === 0) {
    return { message: "Lütfen bilet kodunu gir." };
  }

  if (code.length > 40) {
    return { message: "Kod çok uzun. Örnek biçim: EVT-7KQ-M2X" };
  }

  const event = await getEventById(eventId);

  if (!event) {
    return { message: "Etkinlik bulunamadı." };
  }

  if (await isTicketVerified(user.id, event.id)) {
    return { ok: true };
  }

  const check = await checkTicket(code);

  if (check.status === "malformed") {
    return { message: "Kod biçimi hatalı. Örnek biçim: EVT-7KQ-M2X" };
  }

  if (check.status === "rejected") {
    return {
      message:
        "Simüle edilen sağlayıcı bu kodu reddetti (sağlama karakteri tutmuyor). Yazım hatası olabilir.",
    };
  }

  const codeHash = createHash("sha256").update(check.normalized).digest("hex");

  try {
    await db
      .insert(ticketVerifications)
      .values({ userId: user.id, eventId: event.id, codeHash });
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Aynı anda iki kez gönderildiyse doğrulama zaten kaydedilmiştir.
      if (await isTicketVerified(user.id, event.id)) {
        return { ok: true };
      }

      return { message: "Bu bilet kodu başka bir hesapta zaten kullanılmış." };
    }

    console.error("Bilet doğrulaması kaydedilemedi:", error);
    return {
      message: "Doğrulama kaydedilemedi. Lütfen biraz sonra tekrar dene.",
    };
  }

  revalidatePath("/events/[id]", "page");
  revalidatePath("/panel");
  return { ok: true };
}