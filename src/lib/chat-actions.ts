"use server";

import { after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { ChatItem } from "@/lib/chat-rules";
import { sendPendingPush } from "@/lib/push";
import {
  deleteMessage,
  loadChat,
  sendMessage,
  type SendStatus,
} from "@/lib/ride-chat";

export type ChatResult = {
  ok: boolean;
  message?: string;
  items?: ChatItem[];
};

const NOT_LOGGED_IN: ChatResult = {
  ok: false,
  message: "Devam etmek için giriş yapmalısın.",
};

const FAILED: ChatResult = {
  ok: false,
  message: "İşlem tamamlanamadı. Lütfen biraz sonra tekrar dene.",
};

const MESSAGES: Record<Exclude<SendStatus, "sent">, string> = {
  empty: "Boş mesaj gönderilemez.",
  too_long: "Mesaj en fazla 500 karakter olabilir.",
  link: "Güvenlik için mesajlarda bağlantı paylaşılamaz.",
  not_participant: "Bu sohbete yalnızca yolculuğun sürücüsü ve yolcuları yazabilir.",
  read_only: "Etkinlik bitti, bu sohbet artık yalnızca okunabilir.",
  rate_limited: "Kısa sürede çok fazla mesaj gönderdin. Biraz sonra tekrar dene.",
  ride_full: "Bu sohbet mesaj sınırına ulaştı.",
};

async function safeItems(
  rideId: string,
  userId: string,
): Promise<ChatItem[] | undefined> {
  try {
    return (await loadChat(rideId, userId))?.items;
  } catch {
    return undefined;
  }
}

export async function sendMessageAction(
  rideId: string,
  text: string,
): Promise<ChatResult> {
  const user = await getCurrentUser();

  if (!user) {
    return NOT_LOGGED_IN;
  }

  let status: SendStatus;

  try {
    status = await sendMessage({
      rideId: String(rideId),
      userId: user.id,
      text,
    });
  } catch (error) {
    console.error(
      "Mesaj gönderilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return FAILED;
  }

  const items = await safeItems(String(rideId), user.id);

  if (status !== "sent") {
    return { ok: false, message: MESSAGES[status], items };
  }

  after(() => sendPendingPush());
  return { ok: true, items };
}

export async function deleteMessageAction(
  rideId: string,
  messageId: string,
): Promise<ChatResult> {
  const user = await getCurrentUser();

  if (!user) {
    return NOT_LOGGED_IN;
  }

  try {
    // Yalnızca kendi mesajını silebilirsin: kimlik oturumdan gelir.
    await deleteMessage(user.id, String(messageId));
  } catch (error) {
    console.error(
      "Mesaj silinemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return FAILED;
  }

  return { ok: true, items: await safeItems(String(rideId), user.id) };
}