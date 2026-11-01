import { createHash, timingSafeEqual } from "node:crypto";

export type CronAuth = "ok" | "unauthorized" | "not_configured";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

// Vercel Cron, CRON_SECRET tanımlıysa isteğe "Authorization: Bearer <CRON_SECRET>" başlığı ekler.
// Anahtar tanımsız ya da kısaysa (16 karakterden az) adres tamamen kapalı kalır.
// Karşılaştırma, uzunluk farkını sızdırmamak için özetler üzerinden ve sabit zamanlı yapılır.
export function checkCronAuth(
  header: string | null,
  secret: string | undefined,
): CronAuth {
  if (!secret || secret.length < 16) {
    return "not_configured";
  }

  if (!header) {
    return "unauthorized";
  }

  return timingSafeEqual(digest(`Bearer ${secret}`), digest(header))
    ? "ok"
    : "unauthorized";
}