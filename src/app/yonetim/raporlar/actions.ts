"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/admin";
import { isCaseStatus, setCaseStatus } from "@/lib/admin-reports";
import { getCurrentUser } from "@/lib/auth";

// Her çağrıda yönetici kontrolü yapılır: form elle gönderilse bile yetkisiz kişi işlem yapamaz.
export async function setReportStatusAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user || !isAdminEmail(user.email)) {
    return;
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!isCaseStatus(status)) {
    return;
  }

  try {
    await setCaseStatus(id, status);
  } catch (error) {
    console.error(
      "Şikâyet durumu değiştirilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
  }

  revalidatePath("/yonetim/raporlar");
}