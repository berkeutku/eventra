"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { submitRating, submitReport } from "@/lib/ride-ratings";

export type FeedbackResult = { ok: boolean; message: string };

const NOT_LOGGED_IN: FeedbackResult = {
  ok: false,
  message: "Devam etmek için giriş yapmalısın.",
};

const FAILED: FeedbackResult = {
  ok: false,
  message: "İşlem tamamlanamadı. Lütfen biraz sonra tekrar dene.",
};

export async function rateAction(
  rideId: string,
  rateeId: string,
  score: number,
  comment: string,
): Promise<FeedbackResult> {
  const user = await getCurrentUser();

  if (!user) {
    return NOT_LOGGED_IN;
  }

  try {
    const status = await submitRating({
      rideId: String(rideId),
      raterId: user.id,
      rateeId: String(rateeId),
      score,
      comment,
    });

    switch (status) {
      case "saved":
        revalidatePath("/", "layout");
        return { ok: true, message: "Değerlendirmen kaydedildi, teşekkürler!" };
      case "invalid":
        return { ok: false, message: "Lütfen 1 ile 5 arasında bir puan seç." };
      case "not_open":
        return {
          ok: false,
          message: "Puanlama, etkinlik bittikten sonra açılır.",
        };
      case "closed":
        return { ok: false, message: "Puanlama süresi doldu." };
      default:
        return { ok: false, message: "Bu kişiyi şu an puanlayamazsın." };
    }
  } catch (error) {
    console.error("Puan kaydedilemedi:", error);
    return FAILED;
  }
}

export async function reportAction(
  rideId: string,
  reportedId: string,
  reason: string,
  details: string,
): Promise<FeedbackResult> {
  const user = await getCurrentUser();

  if (!user) {
    return NOT_LOGGED_IN;
  }

  try {
    const status = await submitReport({
      rideId: String(rideId),
      reporterId: user.id,
      reportedId: String(reportedId),
      reason,
      details,
    });

    switch (status) {
      case "saved":
        revalidatePath("/", "layout");
        return {
          ok: true,
          message:
            "Bildirimin kaydedildi. Demo sürümde şikâyetler proje sahibi tarafından elle incelenir.",
        };
      case "invalid_reason":
        return { ok: false, message: "Lütfen bir neden seç." };
      case "duplicate":
        return {
          ok: false,
          message: "Bu kişiyi bu yolculuk için zaten bildirdin.",
        };
      case "rate_limited":
        return {
          ok: false,
          message: "Bugün çok sayıda bildirim gönderdin. Yarın tekrar dene.",
        };
      default:
        return { ok: false, message: "Bu kişiyi şu an bildiremezsin." };
    }
  } catch (error) {
    console.error("Bildirim kaydedilemedi:", error);
    return FAILED;
  }
}