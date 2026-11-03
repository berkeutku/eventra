"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { saveMutedTypes } from "@/lib/notification-prefs";

export async function saveNotificationPrefsAction(
  muted: string[],
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  try {
    await saveMutedTypes(user.id, Array.isArray(muted) ? muted : []);
    revalidatePath("/panel/ayarlar");
    return true;
  } catch (error) {
    console.error(
      "Bildirim tercihleri kaydedilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return false;
  }
}