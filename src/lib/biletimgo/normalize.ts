// Saf dönüştürme ve doğrulama: veritabanı ve ağ içermez, bu yüzden betiklerden de çağrılabilir.
import type { EventCategory } from "../../data/events";

export const LIMITS = {
  title: 200,
  venue: 200,
  organizer: 200,
  address: 300,
  city: 80,
  description: 8000,
  price: 60,
  sourceCategory: 60,
  url: 500,
} as const;

const ALLOWED_HOST = "www.biletimgo.com";
const TURKEY_OFFSET_HOURS = 3; // Türkiye 2016'dan beri sabit UTC+3 kullanıyor.

export type NormalizedEvent = {
  id: string;
  externalId: string;
  title: string;
  category: EventCategory;
  sourceCategory: string | null;
  city: string;
  cityKey: string;
  venue: string;
  address: string | null;
  organizer: string | null;
  startsAt: Date;
  endsAt: Date | null;
  description: string;
  ticketUrl: string;
  imageUrl: string | null;
  priceText: string | null;
};

export type NormalizeResult =
  | { ok: true; event: NormalizedEvent }
  | { ok: false; reason: string };

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

function stripControls(text: string): string {
  return text.replace(CONTROL_CHARS, "");
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

// HTML varlıklarını TEK geçişte çözer (çift kodlama saldırısını önler).
export function decodeEntitiesOnce(input: string): string {
  return input.replace(
    /&(#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z]{2,6});/g,
    (whole: string, body: string) => {
      if (body.startsWith("#")) {
        const code =
          body[1] === "x" || body[1] === "X"
            ? Number.parseInt(body.slice(2), 16)
            : Number.parseInt(body.slice(1), 10);

        if (
          !Number.isInteger(code) ||
          code < 0x20 ||
          code > 0x10ffff ||
          (code >= 0xd800 && code <= 0xdfff)
        ) {
          return "";
        }

        return String.fromCodePoint(code);
      }

      return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, body)
        ? NAMED_ENTITIES[body]
        : whole;
    },
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }

  const cut = text.slice(0, max - 1).replace(/[\uD800-\uDBFF]$/, "");
  return `${cut.trimEnd()}…`;
}

// Tek satırlık alanlar (başlık, mekân, şehir...): varlıkları çöz, kontrol karakterlerini at, boşlukları sadeleştir.
export function cleanInline(input: unknown, max: number): string {
  if (typeof input !== "string") {
    return "";
  }

  const text = stripControls(decodeEntitiesOnce(input))
    .replace(/\s+/g, " ")
    .trim();

  return truncate(text, max);
}

// URL-kodlu HTML açıklamayı DÜZ METNE çevirir. Bağlantı, görsel, etiket ve betikler atılır;
// çıktı yalnızca metindir ve arayüzde asla HTML olarak yerleştirilmez.
export function htmlToText(
  encoded: unknown,
  max: number = LIMITS.description,
): string {
  if (typeof encoded !== "string") {
    return "";
  }

  let text: string;

  try {
    text = decodeURIComponent(encoded);
  } catch {
    text = encoded;
  }

  text = text.slice(0, 100_000);

  text = text.replace(
    /<\s*(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\s*\/\s*\1\s*>/gi,
    " ",
  );
  text = text
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "\n• ")
    .replace(
      /<\s*\/\s*(p|div|h[1-6]|blockquote|figure|table|ul|ol|tr)\s*>/gi,
      "\n\n",
    )
    .replace(/<\s*\/\s*(td|th)\s*>/gi, " ");
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, "");
  text = decodeEntitiesOnce(text);
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, "");
  text = stripControls(text)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\u00A0]+/g, " ");
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return truncate(text, max);
}

// "2026-11-15 20:00" (ya da yalnızca saat, ya da saniyeli) Türkiye saati kabul edilir.
export function parseTurkeyDateTime(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2})(?::(\d{2}))?(?::(\d{2}))?$/.exec(
      value.trim(),
    );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5] ?? "0");
  const second = Number(match[6] ?? "0");

  if (
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  const utc = Date.UTC(
    year,
    month - 1,
    day,
    hour - TURKEY_OFFSET_HOURS,
    minute,
    second,
  );
  const local = new Date(utc + TURKEY_OFFSET_HOURS * 3_600_000);

  // 31 Şubat gibi geçersiz günleri yakala.
  if (
    local.getUTCFullYear() !== year ||
    local.getUTCMonth() !== month - 1 ||
    local.getUTCDate() !== day ||
    local.getUTCHours() !== hour
  ) {
    return null;
  }

  return new Date(utc);
}

const CATEGORY_MAP: Record<string, EventCategory> = {
  tiyatro: "theatre",
  workshop: "workshop",
  eğitim: "workshop",
  parti: "party",
  konser: "concert",
  "stand-up": "standup",
  standup: "standup",
  "stand up": "standup",
  "çocuk etkinlikleri": "kids",
  festival: "festival",
  sahne: "other",
  topluluklar: "other",
  diğer: "other",
};

export function mapCategory(label: string): EventCategory {
  const key = label.trim().toLocaleLowerCase("tr-TR");
  return Object.prototype.hasOwnProperty.call(CATEGORY_MAP, key)
    ? CATEGORY_MAP[key]
    : "other";
}

// Filtre için şehir anahtarı: küçük harf, Türkçe karakterler ASCII, harf dışı karakterler tire.
export function normalizeCityKey(city: string): string {
  return city
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Fiyat alanı METİN olarak korunur ("600", "350 - 657", "Aktif Bilet Yok").
export function normalizePrice(value: unknown): string | null {
  const text = cleanInline(value, LIMITS.price);
  return text === "" ? null : text;
}

// Yalnızca https://www.biletimgo.com adresine izin verilir. Geçerliyse adres
// DEĞİŞTİRİLMEDEN (iş ortaklığı parametreleriyle birlikte) döner.
export function safeBiletimgoUrl(
  value: unknown,
  pathPrefix?: string,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const raw = value.trim();

  if (raw.length === 0 || raw.length > LIMITS.url || /[\u0000-\u0020\u007F]/.test(raw)) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== ALLOWED_HOST ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== ""
  ) {
    return null;
  }

  if (pathPrefix && !url.pathname.startsWith(pathPrefix)) {
    return null;
  }

  return raw;
}

export function normalizeEvent(raw: unknown, prefix = "bgo-"): NormalizeResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "not_object" };
  }

  const r = raw as Record<string, unknown>;
  const idValue =
    typeof r.id === "string" || typeof r.id === "number"
      ? String(r.id).trim()
      : "";

  if (!/^[0-9]{1,12}$/.test(idValue)) {
    return { ok: false, reason: "id" };
  }

  const title = cleanInline(r.etkinlik, LIMITS.title);

  if (!title) {
    return { ok: false, reason: "title" };
  }

  const startsAt = parseTurkeyDateTime(r.baslangic);

  if (!startsAt) {
    return { ok: false, reason: "start" };
  }

  const city = cleanInline(r.sehir, LIMITS.city);

  if (!city) {
    return { ok: false, reason: "city" };
  }

  const ticketUrl = safeBiletimgoUrl(r.url);

  if (!ticketUrl) {
    return { ok: false, reason: "url" };
  }

  const address = cleanInline(r.adres, LIMITS.address) || null;
  const venue =
    cleanInline(r.konum, LIMITS.venue) ||
    cleanInline(r.adres, LIMITS.venue) ||
    city;
  const organizer = cleanInline(r.organizator, LIMITS.organizer) || null;
  const sourceCategory =
    cleanInline(r.kategori, LIMITS.sourceCategory) || null;
  const parsedEnd = parseTurkeyDateTime(r.bitis);
  const endsAt = parsedEnd && parsedEnd >= startsAt ? parsedEnd : null;

  return {
    ok: true,
    event: {
      id: `${prefix}${idValue}`,
      externalId: idValue,
      title,
      category: mapCategory(sourceCategory ?? ""),
      sourceCategory,
      city,
      cityKey: normalizeCityKey(city),
      venue,
      address,
      organizer,
      startsAt,
      endsAt,
      description: htmlToText(r.detay),
      ticketUrl,
      imageUrl: safeBiletimgoUrl(r.gorsel, "/images/"),
      priceText: normalizePrice(r.fiyat),
    },
  };
}