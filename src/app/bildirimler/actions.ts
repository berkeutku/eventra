"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  markAllNotificationsRead,
  openNotification,
} from "@/lib/notifications";
import { safeNextPath } from "@/lib/safe-redirect";

// Bildirimi okundu yapar ve ilgili sayfaya götürür.
// Kimlik oturumdan alınır; yalnızca kendi bildirimin açılabilir.
export async function openNotificationAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris?next=/bildirimler");
  }

  const id = String(formData.get("id") ?? "");
  let link: string | null = null;

  try {
    link = await openNotification(user.id, id);
  } catch (error) {
    console.error("Bildirim açılamadı:", error);
  }

  revalidatePath("/", "layout");
  redirect(link ? safeNextPath(link) : "/bildirimler");
}

export async function markAllReadAction(): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris?next=/bildirimler");
  }

  try {
    await markAllNotificationsRead(user.id);
  } catch (error) {
    console.error("Bildirimler okundu yapılamadı:", error);
  }

  revalidatePath("/", "layout");
}