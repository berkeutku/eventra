"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendPendingPush } from "@/lib/push";
import {
  changeStatus,
  createShareLink,
  setVehicle,
} from "@/lib/ride-day";
import { isRideStatus, parseVehicle } from "@/lib/ride-day-rules";

export type VehicleState = { ok?: boolean; message?: string };
export type ShareState = { path?: string; message?: string };

function read(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function saveVehicleAction(
  _previous: VehicleState,
  formData: FormData,
): Promise<VehicleState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  const parsed = parseVehicle(read(formData, "vehicle"));

  if (!parsed.ok) {
    return { message: parsed.error };
  }

  try {
    const status = await setVehicle(
      user.id,
      read(formData, "rideId"),
      parsed.value,
    );

    if (status !== "saved") {
      return { message: "Yolculuk bulunamadı ya da sana ait değil." };
    }
  } catch (error) {
    console.error(
      "Araç bilgisi kaydedilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return { message: "Kaydedilemedi. Lütfen biraz sonra tekrar dene." };
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    message: parsed.value
      ? "Araç bilgisi kaydedildi."
      : "Araç bilgisi kaldırıldı.",
  };
}

export async function changeRideStatusAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  const to = read(formData, "to");

  if (!isRideStatus(to) || to === "planned") {
    return;
  }

  try {
    const result = await changeStatus({
      userId: user.id,
      rideId: read(formData, "rideId"),
      to,
    });

    if (result === "changed") {
      after(() => sendPendingPush());
    }
  } catch (error) {
    console.error(
      "Yolculuk durumu değiştirilemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
  }

  revalidatePath("/", "layout");
}

export async function createShareLinkAction(
  rideId: string,
): Promise<ShareState> {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Giriş yapmalısın." };
  }

  try {
    const result = await createShareLink(
      user.id,
      typeof rideId === "string" ? rideId : "",
    );

    if (result.status === "ok") {
      return { path: `/paylas/${result.token}` };
    }

    if (result.status === "rate_limited") {
      return {
        message: "Bugün çok sayıda bağlantı oluşturdun. Yarın tekrar dene.",
      };
    }

    return { message: "Yalnızca yolculuktaki kişiler bağlantı oluşturabilir." };
  } catch (error) {
    console.error(
      "Paylaşım bağlantısı oluşturulamadı:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return { message: "Bağlantı oluşturulamadı. Lütfen tekrar dene." };
  }
}