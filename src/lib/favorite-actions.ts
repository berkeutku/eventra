"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getEventById } from "@/lib/events";
import { setFavorite } from "@/lib/favorites";

export type ToggleFavoriteResult =
  | { ok: true; favorited: boolean }
  | { ok: false; message: string };

const EVENT_ID = /^[a-z0-9-]{1,120}$/i;

// İstenen durum açıkça verilir (aç/kapat değil), böylece art arda tıklamalar tutarlı kalır.
// Kimlik her zaman oturumdan alınır.
export async function toggleFavoriteAction(
  eventId: string,
  want: boolean,
): Promise<ToggleFavoriteResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: "Favorilere eklemek için giriş yapmalısın." };
  }

  if (typeof eventId !== "string" || !EVENT_ID.test(eventId)) {
    return { ok: false, message: "Etkinlik bulunamadı." };
  }

  // Yalnızca sitede görünür olan etkinlikler favorilenebilir.
  const event = await getEventById(eventId);

  if (!event) {
    return { ok: false, message: "Etkinlik bulunamadı." };
  }

  try {
    const result = await setFavorite(user.id, event.id, Boolean(want));

    if (result === "limit") {
      return { ok: false, message: "En fazla 200 favori etkinlik ekleyebilirsin." };
    }

    revalidatePath("/panel");
    return { ok: true, favorited: Boolean(want) };
  } catch {
    return { ok: false, message: "İşlem tamamlanamadı. Lütfen tekrar dene." };
  }
}