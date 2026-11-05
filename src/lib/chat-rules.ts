import { cleanText } from "./rating-rules";

// Saf kurallar: veritabanı içermez, hem sunucuda hem tarayıcıda ve betiklerde kullanılabilir.

export const MAX_MESSAGE = 500;
export const MAX_MESSAGES_PER_RIDE = 500;
export const MAX_MESSAGES_PER_WINDOW = 30;
export const MESSAGE_WINDOW_MS = 600_000; // 10 dakika
export const RETENTION_DAYS = 60;
export const NOTIFY_BUCKET_MS = 300_000; // aynı yolculuk için 5 dakikada en fazla bir bildirim

const HOUR = 3_600_000;
const DEFAULT_EVENT_HOURS = 3;
const OPEN_AFTER_EVENT_HOURS = 24;

export type ChatPhase = "open" | "readonly";

export type ChatItem = {
  id: string;
  mine: boolean;
  name: string;
  body: string;
  at: string;
};

// Bağlantılar (spam ve dolandırıcılık için) engellenir. Telefon numarası yazılabilir.
export function containsLink(text: string): boolean {
  return /https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|co|io|me|ly|app|tr|info|biz|xyz)\b/i.test(
    text,
  );
}

export type Prepared =
  | { ok: true; text: string }
  | { ok: false; reason: "empty" | "too_long" | "link" };

// Tek satırlık metin: kontrol karakterleri ve fazla boşluklar temizlenir.
export function prepareMessage(raw: unknown): Prepared {
  if (typeof raw !== "string") {
    return { ok: false, reason: "empty" };
  }

  if (raw.length > MAX_MESSAGE * 4) {
    return { ok: false, reason: "too_long" };
  }

  const text = cleanText(raw, MAX_MESSAGE + 1);

  if (text === "") {
    return { ok: false, reason: "empty" };
  }

  if (text.length > MAX_MESSAGE) {
    return { ok: false, reason: "too_long" };
  }

  if (containsLink(text)) {
    return { ok: false, reason: "link" };
  }

  return { ok: true, text };
}

// Sohbet etkinlik bitiminden 24 saat sonra salt okunur olur (bitiş yoksa başlangıç + 3 saat).
export function chatPhase(
  event: { startsAt: string; endsAt?: string | null },
  now: Date = new Date(),
): ChatPhase {
  const start = Date.parse(event.startsAt);

  if (Number.isNaN(start)) {
    return "readonly";
  }

  const parsedEnd = event.endsAt ? Date.parse(event.endsAt) : Number.NaN;
  const end =
    Number.isNaN(parsedEnd) || parsedEnd < start
      ? start + DEFAULT_EVENT_HOURS * HOUR
      : parsedEnd;

  return now.getTime() > end + OPEN_AFTER_EVENT_HOURS * HOUR
    ? "readonly"
    : "open";
}