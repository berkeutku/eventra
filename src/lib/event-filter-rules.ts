// Etkinlik filtreleri için saf kurallar: veritabanı ya da React içermez, betiklerden test edilebilir.
// Tüm günler Türkiye saatine (sabit UTC+3) göre hesaplanır.

export type WhenFilter =
  | "all"
  | "today"
  | "tomorrow"
  | "weekend"
  | "week"
  | "month"
  | "custom";

export const WHEN_VALUES: WhenFilter[] = [
  "all",
  "today",
  "tomorrow",
  "weekend",
  "week",
  "month",
  "custom",
];

export const whenLabels: Record<WhenFilter, string> = {
  all: "Tüm tarihler",
  today: "Bugün",
  tomorrow: "Yarın",
  weekend: "Bu hafta sonu",
  week: "7 gün içinde",
  month: "30 gün içinde",
  custom: "Seçili tarih",
};

export const DAY_MS = 86_400_000;
const TR_OFFSET_MS = 3 * 3_600_000;
const MAX_RANGE_DAYS = 366;

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];
const MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const WEEKDAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export function parseWhen(value: string): WhenFilter {
  return WHEN_VALUES.find((item) => item === value) ?? "all";
}

// Türkiye saatine göre içinde bulunulan günün başlangıcı (UTC milisaniye).
export function trDayStart(now: Date): number {
  const dayNumber = Math.floor((now.getTime() + TR_OFFSET_MS) / DAY_MS);
  return dayNumber * DAY_MS - TR_OFFSET_MS;
}

// Türkiye saatine göre "YYYY-MM-DD".
export function dayKey(date: Date): string {
  return new Date(date.getTime() + TR_OFFSET_MS).toISOString().slice(0, 10);
}

// "YYYY-MM-DD" biçimindeki geçerli bir günü döndürür; değilse null.
export function parseDay(value: string | undefined | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (year < 2000 || year > 2100) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? value
    : null;
}

// Bir günün Türkiye saatine göre başlangıcı (UTC milisaniye).
function dayStartOf(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day) - TR_OFFSET_MS;
}

export type DateRange = { from: Date; to: Date };

// Seçilen zaman aralığı: [from, to). "all" ya da geçersiz özel aralık için null.
export function rangeFor(
  when: WhenFilter,
  now: Date,
  bas?: string | null,
  bit?: string | null,
): DateRange | null {
  const today = trDayStart(now);
  const span = (from: number, days: number): DateRange => ({
    from: new Date(from),
    to: new Date(from + days * DAY_MS),
  });

  switch (when) {
    case "all":
      return null;
    case "today":
      return span(today, 1);
    case "tomorrow":
      return span(today + DAY_MS, 1);
    case "week":
      return span(today, 7);
    case "month":
      return span(today, 30);
    case "weekend": {
      const weekday = (Math.floor((today + TR_OFFSET_MS) / DAY_MS) + 4) % 7; // 0 pazar, 6 cumartesi

      if (weekday === 0) {
        return span(today, 1);
      }

      if (weekday === 6) {
        return span(today, 2);
      }

      return span(today + (6 - weekday) * DAY_MS, 2);
    }
    case "custom": {
      const start = parseDay(bas);

      if (!start) {
        return null;
      }

      let first = dayStartOf(start);
      const endKey = parseDay(bit) ?? start;
      let last = dayStartOf(endKey);

      if (last < first) {
        [first, last] = [last, first];
      }

      const days = Math.min(Math.round((last - first) / DAY_MS) + 1, MAX_RANGE_DAYS);
      return span(first, days);
    }
  }
}

export type DayOption = {
  key: string;
  top: string; // "Bugün", "Yarın" ya da kısa gün adı
  day: number;
  month: string; // kısa ay adı
  weekend: boolean;
};

// Bugünden başlayarak sıradaki günler (tarih şeridi için).
export function upcomingDays(now: Date, count = 14): DayOption[] {
  const today = trDayStart(now);
  const result: DayOption[] = [];

  for (let i = 0; i < count; i += 1) {
    const start = today + i * DAY_MS;
    const local = new Date(start + TR_OFFSET_MS);
    const weekday = local.getUTCDay();

    result.push({
      key: local.toISOString().slice(0, 10),
      top: i === 0 ? "Bugün" : i === 1 ? "Yarın" : WEEKDAYS_SHORT[weekday],
      day: local.getUTCDate(),
      month: MONTHS_SHORT[local.getUTCMonth()],
      weekend: weekday === 0 || weekday === 6,
    });
  }

  return result;
}

// "2026-11-25" -> "25 Kasım"
export function formatDay(key: string): string {
  const valid = parseDay(key);

  if (!valid) {
    return key;
  }

  const [, month, day] = valid.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

// Seçili tarih filtresinin kısa açıklaması (etkin filtre etiketi için).
export function describeWhen(when: WhenFilter, bas?: string, bit?: string): string {
  if (when !== "custom") {
    return whenLabels[when];
  }

  const start = parseDay(bas);

  if (!start) {
    return whenLabels.all;
  }

  const end = parseDay(bit);
  return end && end !== start
    ? `${formatDay(start)} – ${formatDay(end)}`
    : formatDay(start);
}

export type FilterState = {
  q?: string;
  kategori?: string;
  sehir?: string;
  kaynak?: string;
  tarih?: string;
  bas?: string;
  bit?: string;
};

const ORDER: (keyof FilterState)[] = ["q", "kategori", "sehir", "kaynak", "tarih", "bas", "bit"];

// Mevcut filtrelere değişiklikleri uygulayıp /events adresini üretir. Sayfa numarası her zaman sıfırlanır.
export function eventsHref(
  state: FilterState,
  changes: Partial<FilterState> = {},
  page = 1,
): string {
  const merged: FilterState = { ...state, ...changes };

  if (merged.tarih !== "custom") {
    merged.bas = undefined;
    merged.bit = undefined;
  }

  if (merged.tarih === "all") {
    merged.tarih = undefined;
  }

  if (merged.kaynak === "all") {
    merged.kaynak = undefined;
  }

  const search = new URLSearchParams();

  for (const key of ORDER) {
    const value = merged[key];

    if (value) {
      search.set(key, value);
    }
  }

  if (page > 1) {
    search.set("sayfa", String(page));
  }

  const text = search.toString();
  return text ? `/events?${text}` : "/events";
}
