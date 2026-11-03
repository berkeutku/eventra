// Saf kurallar: veritabanı içermez, bu yüzden betiklerden de test edilebilir.

export type RatingWindow = "not_yet" | "open" | "closed";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const DEFAULT_EVENT_HOURS = 3;

export const RATING_OPEN_DAYS = 30;
export const MAX_COMMENT = 300;
export const MAX_REPORT_DETAILS = 500;
export const MAX_REPORTS_PER_DAY = 5;

// Puanlama etkinlik bittiğinde açılır (bitiş yoksa başlangıç + 3 saat) ve 30 gün açık kalır.
export function ratingWindowState(
  event: { startsAt: string; endsAt?: string | null },
  now: Date = new Date(),
): RatingWindow {
  const start = Date.parse(event.startsAt);

  if (Number.isNaN(start)) {
    return "closed";
  }

  const parsedEnd = event.endsAt ? Date.parse(event.endsAt) : Number.NaN;
  const end =
    Number.isNaN(parsedEnd) || parsedEnd < start
      ? start + DEFAULT_EVENT_HOURS * HOUR
      : parsedEnd;

  if (now.getTime() < end) {
    return "not_yet";
  }

  if (now.getTime() > end + RATING_OPEN_DAYS * DAY) {
    return "closed";
  }

  return "open";
}

export const REPORT_REASONS = [
  "no_show",
  "unsafe",
  "harassment",
  "wrong_info",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const reportReasonLabels: Record<ReportReason, string> = {
  no_show: "Buluşma noktasına gelmedi",
  unsafe: "Güvensiz davranış ya da sürüş",
  harassment: "Taciz ya da uygunsuz davranış",
  wrong_info: "Yanlış bilgi ya da masraf",
  other: "Diğer",
};

export function isReportReason(value: unknown): value is ReportReason {
  return (
    typeof value === "string" &&
    (REPORT_REASONS as readonly string[]).includes(value)
  );
}

export function parseScore(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
    ? value
    : null;
}

// Tek satırlık metin: kontrol ve görünmez yön karakterlerini atar, boşlukları sadeleştirir, uzunluğu sınırlar.
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(
      /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}