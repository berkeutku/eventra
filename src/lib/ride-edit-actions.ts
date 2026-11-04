"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { rideBlockMessages, rideCreationBlockReason } from "@/lib/event-rules";
import { getEventById } from "@/lib/events";
import { parseRideGeoInput, toMicro, type Pt } from "@/lib/geo-rules";
import { getRoute } from "@/lib/geo-service";
import { sendPendingPush } from "@/lib/push";
import {
  parseRideFields,
  updateRide,
  type RideFieldKey,
} from "@/lib/ride-edit";
import { getRideGeo, saveRideGeo } from "@/lib/ride-geo";
import { getRideDetail } from "@/lib/ride-queries";

export type EditRideState = {
  errors?: Partial<Record<RideFieldKey, string>>;
  message?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function read(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function samePoint(a: Pt, b: Pt): boolean {
  return toMicro(a.lat) === toMicro(b.lat) && toMicro(a.lng) === toMicro(b.lng);
}

export async function updateRideAction(
  _previous: EditRideState,
  formData: FormData,
): Promise<EditRideState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  const rideId = read(formData, "rideId");

  if (!UUID_PATTERN.test(rideId)) {
    return { message: "Yolculuk bulunamadı." };
  }

  const detail = await getRideDetail(rideId, user.id);

  if (!detail || !detail.isOwn) {
    return { message: "Bu yolculuğu düzenleme yetkin yok." };
  }

  const event = await getEventById(detail.eventId);

  if (!event) {
    return { message: "Etkinlik bulunamadı." };
  }

  const blocked = rideCreationBlockReason(event);

  if (blocked) {
    return { message: rideBlockMessages[blocked] };
  }

  const parsed = parseRideFields({
    origin: read(formData, "origin"),
    destination: read(formData, "destination"),
    meetingPoint: read(formData, "meetingPoint"),
    departureTime: read(formData, "departureTime"),
    duration: read(formData, "duration"),
    seats: read(formData, "seats"),
    cost: read(formData, "cost"),
  });

  if (!parsed.ok) {
    return { errors: parsed.errors };
  }

  // Harita noktaları isteğe bağlıdır. Form hiç harita alanı göndermediyse mevcut harita bilgisi korunur.
  const geoInput = parseRideGeoInput((key) => read(formData, key));

  if (geoInput.status === "invalid") {
    return {
      message:
        "Harita noktaları geçersiz. Noktaları yeniden seç ya da haritayı kullanma.",
    };
  }

  let geoChanged = false;

  if (geoInput.status === "ok") {
    try {
      const existing = await getRideGeo(rideId);
      geoChanged =
        !existing ||
        !samePoint(existing.origin, geoInput.origin) ||
        !samePoint(existing.meeting, geoInput.meeting) ||
        !samePoint(existing.dest, geoInput.dest);
    } catch (error) {
      console.error(
        "Harita bilgisi okunamadı:",
        error instanceof Error ? error.message : "bilinmeyen hata",
      );
      geoChanged = true;
    }
  }

  let status: Awaited<ReturnType<typeof updateRide>>;

  try {
    status = await updateRide({
      userId: user.id,
      rideId,
      fields: parsed.value,
      geoChanged,
    });
  } catch (error) {
    console.error("Yolculuk güncellenemedi:", error);
    return {
      message: "Yolculuk güncellenemedi. Lütfen biraz sonra tekrar dene.",
    };
  }

  switch (status) {
    case "updated":
      if (geoInput.status === "ok" && geoChanged) {
        try {
          const routed = await getRoute([
            geoInput.origin,
            geoInput.meeting,
            geoInput.dest,
          ]);
          await saveRideGeo(
            rideId,
            {
              origin: geoInput.origin,
              meeting: geoInput.meeting,
              dest: geoInput.dest,
            },
            routed.status === "ok" ? routed.route : null,
          );
        } catch (error) {
          console.error(
            "Harita bilgisi kaydedilemedi:",
            error instanceof Error ? error.message : "bilinmeyen hata",
          );
        }
      }

      revalidatePath("/", "layout");
      after(() => sendPendingPush());
      redirect(`/events/${detail.eventId}/yolculuk/${rideId}`);
    case "unchanged":
      return { message: "Hiçbir şeyi değiştirmedin." };
    case "too_few_seats":
      return {
        errors: {
          seats: "Koltuk sayısı, yolculuğa katılan yolcu sayısından az olamaz.",
        },
      };
    case "not_owner":
      return { message: "Bu yolculuğu düzenleme yetkin yok." };
    default:
      return { message: "Bu yolculuk artık mevcut değil." };
  }
}