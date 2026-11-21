import { containsLink } from "./chat-rules";
import { looksLikeContact } from "./request-rules";

// Profil kuralları. Veritabanı içermez; hem sunucuda hem tarayıcıda hem test betiğinde kullanılır.
// Bu dosya göreli içe aktarım kullanır çünkü test betiğinden doğrudan çalıştırılır.

export const MAX_BIO = 280;
export const MAX_CITY = 40;
export const MAX_INTERESTS = 5;

export const BIO_FIELD = "bio";
export const CITY_FIELD = "city";
export const THEME_FIELD = "theme";
export const INTERESTS_FIELD = "interests";
export const AVATAR_FIELD = "avatar";

// Profil fotoğrafı: tarayıcı 320x320 JPEG üretir, sunucu yalnızca bunu kabul eder.
export const AVATAR_SIZE = 320;
export const AVATAR_MAX_BYTES = 100_000;
export const AVATAR_MAX_INPUT_BYTES = 12_000_000; // seçilen özgün dosya için üst sınır

export type ProfileTheme =
  | "violet"
  | "sunset"
  | "mint"
  | "ocean"
  | "berry"
  | "gold";

export const DEFAULT_THEME: ProfileTheme = "violet";

// Sınıf adları tam metin olarak yazıldığı için Tailwind bunları bulur.
export const profileThemes: Record<
  ProfileTheme,
  { label: string; gradient: string }
> = {
  violet: {
    label: "Mor gece",
    gradient: "bg-linear-to-br from-[#1a0b4d] via-violet to-coral",
  },
  sunset: {
    label: "Gün batımı",
    gradient: "bg-linear-to-br from-[#5b1a3a] via-coral to-sun",
  },
  mint: {
    label: "Nane",
    gradient: "bg-linear-to-br from-[#004d3b] via-[#00997a] to-mint",
  },
  ocean: {
    label: "Okyanus",
    gradient: "bg-linear-to-br from-[#0b2a4d] via-[#2b6cb0] to-mint",
  },
  berry: {
    label: "Böğürtlen",
    gradient: "bg-linear-to-br from-night via-[#7a2e6b] to-coral",
  },
  gold: {
    label: "Altın",
    gradient: "bg-linear-to-br from-[#4d2a00] via-sun to-coral",
  },
};

export const THEME_KEYS = Object.keys(profileThemes) as ProfileTheme[];

// Etkinlik kategorileriyle aynı anahtarlar (veritabanındaki event_category).
export const INTEREST_KEYS = [
  "concert",
  "match",
  "theatre",
  "festival",
  "standup",
  "university",
  "party",
  "workshop",
  "kids",
  "other",
] as const;

export function parseTheme(value: unknown): ProfileTheme | null {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_THEME;
  }

  return typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(profileThemes, value)
    ? (value as ProfileTheme)
    : null;
}

export type InterestsResult =
  | { ok: true; value: string[] }
  | { ok: false; error: string };

export function parseInterests(values: unknown[]): InterestsResult {
  const valid = new Set<string>(INTEREST_KEYS);
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string" || !valid.has(value)) {
      return { ok: false, error: "Geçersiz ilgi alanı seçildi." };
    }

    seen.add(value);
  }

  if (seen.size > MAX_INTERESTS) {
    return {
      ok: false,
      error: `En fazla ${MAX_INTERESTS} ilgi alanı seçebilirsin.`,
    };
  }

  return { ok: true, value: [...seen] };
}

export type TextResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

// "Hakkımda": en fazla 280 karakter, satır sonları korunur. Herkese açık olduğu için
// telefon, e-posta, kullanıcı adı (@) ve bağlantı yazılamaz.
export function prepareBio(raw: unknown): TextResult {
  if (raw === undefined || raw === null) {
    return { ok: true, value: null };
  }

  if (typeof raw !== "string") {
    return { ok: false, error: "Hakkımda metni geçersiz." };
  }

  if (raw.length > MAX_BIO * 8) {
    return {
      ok: false,
      error: `Hakkımda en fazla ${MAX_BIO} karakter olabilir.`,
    };
  }

  const text = raw
    .replace(/\r\n?/g, "\n")
    .replace(
      /[\u0000-\u0009\u000B-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g,
      " ",
    )
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text === "") {
    return { ok: true, value: null };
  }

  if (text.length > MAX_BIO) {
    return {
      ok: false,
      error: `Hakkımda en fazla ${MAX_BIO} karakter olabilir.`,
    };
  }

  if (looksLikeContact(text) || containsLink(text)) {
    return {
      ok: false,
      error:
        "Hakkımda alanına telefon, e-posta, kullanıcı adı (@) ya da bağlantı yazma.",
    };
  }

  return { ok: true, value: text };
}

const CITY_PATTERN = /^\p{L}[\p{L}\s.'’-]{1,39}$/u;

export function prepareCity(raw: unknown): TextResult {
  if (raw === undefined || raw === null) {
    return { ok: true, value: null };
  }

  if (typeof raw !== "string") {
    return { ok: false, error: "Şehir geçersiz." };
  }

  const text = raw.replace(/\s+/g, " ").trim();

  if (text === "") {
    return { ok: true, value: null };
  }

  if (text.length > MAX_CITY || !CITY_PATTERN.test(text)) {
    return {
      ok: false,
      error: "Şehir adı yalnızca harf içermeli ve en fazla 40 karakter olmalı.",
    };
  }

  return { ok: true, value: text };
}

// Profil fotoğrafı sunucu doğrulaması: boyut ve JPEG imzası (FF D8 FF ... FF D9).
export function avatarFileError(bytes: Uint8Array): string | null {
  if (bytes.length === 0) {
    return "Dosya boş.";
  }

  if (bytes.length > AVATAR_MAX_BYTES) {
    return "Fotoğraf çok büyük. Daha küçük bir fotoğraf dene.";
  }

  const startsLikeJpeg =
    bytes.length > 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const endsLikeJpeg =
    bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;

  if (!startsLikeJpeg || !endsLikeJpeg) {
    return "Fotoğraf okunamadı. JPEG ya da PNG bir fotoğraf dene.";
  }

  return null;
}

export function initialsOf(name: string): string {
  const first = name.trim().charAt(0);
  return first === "" ? "?" : first.toLocaleUpperCase("tr-TR");
}

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

// "Kasım 2026" biçimi (Türkiye saatine göre ay).
export function memberSinceLabel(value: Date | string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const turkey = new Date(date.getTime() + 3 * 3_600_000);
  return `${MONTHS[turkey.getUTCMonth()]} ${turkey.getUTCFullYear()}`;
}

export type Completeness = { percent: number; missing: string[] };

// Profil doluluğu: her madde %20.
export function profileCompleteness(input: {
  hasAvatar: boolean;
  bio: string | null;
  city: string | null;
  interestCount: number;
  hasGender: boolean;
}): Completeness {
  const missing: string[] = [];

  if (!input.hasAvatar) missing.push("Profil fotoğrafı ekle");
  if (!input.bio) missing.push("Hakkımda yaz");
  if (!input.city) missing.push("Şehrini ekle");
  if (input.interestCount === 0) missing.push("İlgi alanlarını seç");
  if (!input.hasGender) missing.push("Cinsiyetini belirt");

  return { percent: (5 - missing.length) * 20, missing };
}
