"use server";

import { getCurrentUser } from "@/lib/auth";
import { submitProfileReport } from "@/lib/profile-report";

export type ProfileReportState = { ok?: boolean; message?: string };

export async function reportProfileAction(
  _previous: ProfileReportState,
  formData: FormData,
): Promise<ProfileReportState> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: "Bildirmek için giriş yapmalısın." };
  }

  try {
    const status = await submitProfileReport({
      reporterId: user.id,
      reportedId: String(formData.get("userId") ?? ""),
      details: String(formData.get("details") ?? ""),
    });

    switch (status) {
      case "saved":
        return {
          ok: true,
          message:
            "Bildirimin alındı, teşekkürler. Şikâyetler proje sahibi tarafından elle incelenir.",
        };
      case "duplicate":
        return {
          ok: false,
          message: "Bu profil için incelenmeyi bekleyen bir bildirimin zaten var.",
        };
      case "rate_limited":
        return {
          ok: false,
          message: "Bugün çok sayıda bildirim gönderdin. Yarın tekrar dene.",
        };
      case "self":
        return { ok: false, message: "Kendi profilini bildiremezsin." };
      default:
        return { ok: false, message: "Bu profil şu an bildirilemiyor." };
    }
  } catch (error) {
    console.error(
      "Profil bildirimi kaydedilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return { ok: false, message: "Kaydedilemedi. Lütfen biraz sonra tekrar dene." };
  }
}
