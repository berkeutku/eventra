"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { rides } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getEventById } from "@/lib/events";
import { joinRide, type JoinOutcome } from "@/lib/ride-join";
import { deleteRide, leaveRide } from "@/lib/ride-manage";

export type CreateRideField =
  | "origin"
  | "destination"
  | "meetingPoint"
  | "departureTime"
  | "duration"
  | "seats"
  | "cost";

export type CreateRideState = {
  errors?: Partial<Record<CreateRideField, string>>;
  message?: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const WHOLE_NUMBER = /^\d+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function checkText(value: string, label: string): string | undefined {
  if (value.length < 2) {
    return `${label} en az 2 karakter olmalı.`;
  }
  if (value.length > 80) {
    return `${label} en fazla 80 karakter olabilir.`;
  }
  return undefined;
}

function parseWholeNumber(value: string): number | null {
  return WHOLE_NUMBER.test(value) ? Number(value) : null;
}

export async function createRideAction(
  _previous: CreateRideState,
  formData: FormData,
): Promise<CreateRideState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  if (user.role !== "driver") {
    return {
      message:
        "Yolculuk oluşturmak için panelinden Sürücü rolüne geçmelisin.",
    };
  }

  const event = await getEventById(readText(formData, "eventId"));

  if (!event) {
    return { message: "Etkinlik bulunamadı." };
  }

  const origin = readText(formData, "origin");
  const destination = readText(formData, "destination");
  const meetingPoint = readText(formData, "meetingPoint");
  const departureTime = readText(formData, "departureTime");
  const duration = parseWholeNumber(readText(formData, "duration"));
  const seats = parseWholeNumber(readText(formData, "seats"));
  const cost = parseWholeNumber(readText(formData, "cost"));

  const errors: NonNullable<CreateRideState["errors"]> = {};

  const originError = checkText(origin, "Başlangıç noktası");
  if (originError) errors.origin = originError;

  const destinationError = checkText(destination, "Varış noktası");
  if (destinationError) errors.destination = destinationError;

  const meetingPointError = checkText(meetingPoint, "Buluşma noktası");
  if (meetingPointError) errors.meetingPoint = meetingPointError;

  if (!TIME_PATTERN.test(departureTime)) {
    errors.departureTime = "Lütfen kalkış saatini seç.";
  }

  if (duration === null || duration < 5 || duration > 600) {
    errors.duration = "Süre 5 ile 600 dakika arasında bir sayı olmalı.";
  }

  if (seats === null || seats < 1 || seats > 6) {
    errors.seats = "Koltuk sayısı 1 ile 6 arasında olmalı.";
  }

  if (cost === null || cost > 5000) {
    errors.cost = "Masraf 0 ile 5000 TL arasında bir tam sayı olmalı.";
  }

  if (
    Object.keys(errors).length > 0 ||
    duration === null ||
    seats === null ||
    cost === null
  ) {
    return { errors };
  }

  try {
    await db.insert(rides).values({
      eventId: event.id,
      driverId: user.id,
      origin,
      destination,
      meetingPoint,
      departureTime,
      durationMinutes: duration,
      seats,
      totalCost: cost,
    });
  } catch (error) {
    console.error("Yolculuk kaydedilemedi:", error);
    return {
      message: "Yolculuk kaydedilemedi. Lütfen biraz sonra tekrar dene.",
    };
  }

  redirect(`/events/${event.id}?yolculuk=olusturuldu`);
}

export async function deleteRideAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  const rideId = readText(formData, "rideId");

  if (!UUID_PATTERN.test(rideId)) {
    return;
  }

  try {
    // Sahiplik kontrolü sorgunun içinde: yalnızca kendi yolculuğunu silebilirsin.
    await deleteRide(user.id, rideId);
  } catch (error) {
    console.error("Yolculuk silinemedi:", error);
  }

  revalidatePath("/", "layout");
}

export type JoinRideState = {
  success?: string;
  message?: string;
};

export async function joinRideAction(
  _previous: JoinRideState,
  formData: FormData,
): Promise<JoinRideState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  if (user.role !== "passenger") {
    return {
      message:
        "Yolculuğa katılmak için panelinden Yolcu rolüne geçmelisin.",
    };
  }

  const rideId = readText(formData, "rideId");

  if (!UUID_PATTERN.test(rideId)) {
    return { message: "Yolculuk bulunamadı." };
  }

  let outcome: JoinOutcome;

  try {
    outcome = await joinRide(user.id, rideId);
  } catch (error) {
    console.error("Katılma hatası:", error);
    return {
      message: "Katılma işlemi tamamlanamadı. Lütfen biraz sonra tekrar dene.",
    };
  }

  switch (outcome.status) {
    case "joined":
      revalidatePath("/", "layout");
      return { success: "Koltuğun ayrıldı. Yolculuğa katıldın." };
    case "full":
      return { message: "Bu yolculuk az önce doldu." };
    case "already_joined":
      return { message: "Bu yolculuğa zaten katıldın." };
    case "other_ride":
      return {
        message:
          "Bu etkinlik için başka bir yolculuğa zaten katıldın. Önce panelinden ondan ayrılmalısın.",
      };
    case "own_ride":
      return {
        message: "Kendi oluşturduğun yolculuğa yolcu olarak katılamazsın.",
      };
    case "not_found":
      return { message: "Bu yolculuk artık mevcut değil." };
  }
}

export async function leaveRideAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris");
  }

  const rideId = readText(formData, "rideId");

  if (!UUID_PATTERN.test(rideId)) {
    return;
  }

  try {
    // Yalnızca kendi katılımını silebilirsin.
    await leaveRide(user.id, rideId);
  } catch (error) {
    console.error("Yolculuktan ayrılınamadı:", error);
  }

  revalidatePath("/", "layout");
}