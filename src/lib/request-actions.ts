"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { rideBlockMessages, rideCreationBlockReason } from "@/lib/event-rules";
import { getEventById } from "@/lib/events";
import {
  parseRequestInput,
  requestGateMessages,
  type RequestField,
} from "@/lib/request-rules";
import { deleteRequest, saveRequest } from "@/lib/ride-requests";
import { checkTicketGate } from "@/lib/ticket-gate";

export type RequestState = {
  ok?: boolean;
  message?: string;
  errors?: Partial<Record<RequestField, string>>;
};

function read(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function saveRequestAction(
  _previous: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  if (user.role !== "passenger") {
    return {
      message: "Yolcu talebi vermek için profilinden Yolcu rolüne geçmelisin.",
    };
  }

  const event = await getEventById(read(formData, "eventId"));

  if (!event) {
    return { message: "Etkinlik bulunamadı." };
  }

  const gate = await checkTicketGate(user.id, event);

  if (gate !== "ok") {
    return { message: requestGateMessages[gate] };
  }

  const blocked = rideCreationBlockReason(event);

  if (blocked) {
    return { message: rideBlockMessages[blocked] };
  }

  const parsed = parseRequestInput({
    destination: read(formData, "destination"),
    preferredTime: read(formData, "preferredTime"),
    seats: read(formData, "seats"),
    note: read(formData, "note"),
  });

  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  let status: Awaited<ReturnType<typeof saveRequest>>;

  try {
    status = await saveRequest({
      userId: user.id,
      eventId: event.id,
      fields: parsed.value,
    });
  } catch (error) {
    console.error(
      "Talep kaydedilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return { message: "Talep kaydedilemedi. Lütfen biraz sonra tekrar dene." };
  }

  switch (status) {
    case "saved":
      revalidatePath("/", "layout");
      return {
        ok: true,
        message:
          "Talebin kaydedildi. Bu etkinliğe giden sürücüler talebini görebilir.",
      };
    case "has_ride":
      return {
        message:
          "Bu etkinlik için zaten bir yolculuğa katıldın, talep vermene gerek yok.",
      };
    case "rate_limited":
      return { message: "Bugün çok sayıda talep gönderdin. Yarın tekrar dene." };
  }
}

export async function deleteRequestAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  const eventId = read(formData, "eventId");

  if (!eventId) {
    return;
  }

  try {
    // Yalnızca kendi talebini silebilirsin: kimlik oturumdan gelir.
    await deleteRequest(user.id, eventId);
  } catch (error) {
    console.error(
      "Talep silinemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
  }

  revalidatePath("/", "layout");
}