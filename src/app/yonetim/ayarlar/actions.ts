"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/admin";
import { setShowRealEvents } from "@/lib/app-settings";
import { getCurrentUser } from "@/lib/auth";

// Her çağrıda yönetici kontrolü yapılır: form elle gönderilse bile yetkisiz kişi işlem yapamaz.
export async function setShowRealEventsAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();

  if (!user || !isAdminEmail(user.email)) {
    return;
  }

  const wantEnabled = String(formData.get("enabled") ?? "") === "1";
  const confirmed = formData.get("confirm") === "on";

  // Açmak için yazılı onay kutusu işaretli olmalı. Kapatmak her zaman serbest.
  if (wantEnabled && !confirmed) {
    return;
  }

  try {
    await setShowRealEvents(wantEnabled, user.email);
  } catch (error) {
    console.error(
      "Gerçek etkinlik ayarı değiştirilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
  }

  // Anahtar her sayfayı etkiler (ana sayfa, liste, altbilgi), bu yüzden tüm site yenilenir.
  revalidatePath("/", "layout");
}
