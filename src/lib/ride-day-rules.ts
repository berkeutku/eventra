import { cleanText } from "./rating-rules";
import { looksLikeContact } from "./request-rules";

// Saf kurallar: veritabanı içermez, hem sunucuda hem tarayıcıda ve betiklerde kullanılabilir.

export const RIDE_STATUSES = ["planned", "departed", "arrived"] as const;
export type RideStatus = (typeof RIDE_STATUSES)[number];

export const MAX_VEHICLE = 60;
export const MAX_SHARES_PER_DAY = 5;
export const SHARE_VALID_HOURS = 24;

export const statusLabels: Record<RideStatus, string> = {
  planned: "Planlandı",
  departed: "Yolda",
  arrived: "Vardı",
};

export function isRideStatus(value: unknown): value is RideStatus {
  return (
    typeof value === "string" &&
    (RIDE_STATUSES as readonly string[]).includes(value)
  );
}

// Durum yalnızca ileri gider: planlandı -> yolda -> vardı.
export function nextStatus(current: RideStatus): RideStatus | null {
  if (current === "planned") return "departed";
  if (current === "departed") return "arrived";
  return null;
}

// Durum değiştirme, etkinlikten 3 saat önce açılır ve bitişten 24 saat sonra kapanır.
export function rideDayOpen(
  startsAt: Date,
  endsAt: Date | null,
  now: Date,
): boolean {
  const start = startsAt.getTime();
  const end = endsAt ? endsAt.getTime() : start + 3 * 3_600_000;
  const t = now.getTime();
  return t >= start - 3 * 3_600_000 && t <= end + 24 * 3_600_000;
}

export type VehicleParse =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

const FULL_PLATE = /\b\d{2}\s?[A-Za-zÇĞİÖŞÜçğıöşü]{1,3}\s?\d{2,4}\b/;

// Araç bilgisi tek satır, isteğe bağlı. Telefon, bağlantı ve tam plaka kabul edilmez.
export function parseVehicle(input: string): VehicleParse {
  const text = cleanText(input, MAX_VEHICLE);

  if (text === "") {
    return { ok: true, value: null };
  }

  if (text.length < 2) {
    return { ok: false, error: "Araç bilgisi en az 2 karakter olmalı." };
  }

  if (looksLikeContact(text)) {
    return {
      ok: false,
      error: "Araç bilgisine telefon, e-posta ya da bağlantı yazma.",
    };
  }

  if (FULL_PLATE.test(text)) {
    return {
      ok: false,
      error:
        "Gizlilik için plakanın tamamını yazma, yalnızca son 2-3 hanesini yaz (örn. Beyaz Clio, plaka sonu 123).",
    };
  }

  return { ok: true, value: text };
}

export function statusNotification(
  to: "departed" | "arrived",
  origin: string,
  destination: string,
): { title: string; body: string } {
  if (to === "departed") {
    return {
      title: "Yolculuk yola çıktı",
      body: `${origin} → ${destination} yolculuğunda sürücü yola çıktığını bildirdi.`,
    };
  }

  return {
    title: "Yolculuk tamamlandı",
    body: `${origin} → ${destination} yolculuğu tamamlandı. İstersen sürücüyü puanlayabilirsin.`,
  };
}