// Saf kurallar: veritabanı ya da başka içe aktarım içermez, bu yüzden betiklerden de test edilebilir.
export type RuleEvent = {
  source?: "demo" | "biletimgo";
  isActive?: boolean;
  startsAt: string;
  endsAt?: string | null;
};

export const MAX_RIDE_EVENT_HOURS = 24;
export const RIDE_WINDOW_AFTER_END_HOURS = 12;

const DEFAULT_EVENT_HOURS = 3;
const HOUR = 3_600_000;

export type RideBlockReason = "inactive" | "multi_day" | "ended";

export const rideBlockMessages: Record<RideBlockReason, string> = {
  inactive:
    "Bu etkinlik artık biletimGO'da listelenmediği için yeni yolculuk oluşturulamıyor. Mevcut yolculuklar görünmeye devam eder.",
  multi_day:
    "Bu etkinlik birden fazla gün sürdüğü için yolculuk oluşturma şimdilik yalnızca tek günlük etkinliklerde açık.",
  ended: "Bu etkinlik sona erdi, yeni yolculuk oluşturulamıyor.",
};

// Gerçek (biletimGO) etkinliklerde yeni yolculuk oluşturmayı engelleyen neden. Demo etkinlikler etkilenmez.
export function rideCreationBlockReason(
  event: RuleEvent,
  now: Date = new Date(),
): RideBlockReason | null {
  if (event.source !== "biletimgo") {
    return null;
  }

  if (event.isActive === false) {
    return "inactive";
  }

  const start = new Date(event.startsAt).getTime();

  if (Number.isNaN(start)) {
    return "ended";
  }

  const parsedEnd = event.endsAt ? new Date(event.endsAt).getTime() : Number.NaN;
  const end =
    Number.isNaN(parsedEnd) || parsedEnd < start
      ? start + DEFAULT_EVENT_HOURS * HOUR
      : parsedEnd;

  if ((end - start) / HOUR > MAX_RIDE_EVENT_HOURS) {
    return "multi_day";
  }

  if (now.getTime() > end + RIDE_WINDOW_AFTER_END_HOURS * HOUR) {
    return "ended";
  }

  return null;
}