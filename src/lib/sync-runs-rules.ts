// Senkron geçmişi için saf kurallar (veritabanına dokunmaz, test edilebilir).

export type SyncStatusTone = "good" | "bad" | "warn" | "neutral";

export function syncStatusLabel(status: string): string {
  switch (status) {
    case "success":
      return "Başarılı";
    case "failed":
      return "Başarısız";
    case "suspicious":
      return "Şüpheli (durduruldu)";
    case "running":
      return "Çalışıyor";
    default:
      return status;
  }
}

export function syncStatusTone(status: string): SyncStatusTone {
  switch (status) {
    case "success":
      return "good";
    case "failed":
      return "bad";
    case "suspicious":
      return "warn";
    default:
      return "neutral";
  }
}

const errorExplanations: Record<string, string> = {
  auth: "Token reddedildi (401). Token yanlış ya da süresi dolmuş olabilir.",
  forbidden: "Erişim reddedildi (403).",
  forbidden_html:
    "Cloudflare doğrulama sayfası çıktı. İstek biletimGO'nun güvenlik katmanında takılıyor, token'a hiç ulaşmıyor.",
  server: "biletimGO sunucusu hata verdi (5xx).",
  http: "Beklenmeyen HTTP yanıtı.",
  timeout: "İstek zaman aşımına uğradı.",
  network: "Ağ hatası, biletimGO'ya ulaşılamadı.",
  too_large: "Yanıt beklenenden büyük, güvenlik için reddedildi.",
  invalid_response: "Yanıt beklenen biçimde değil.",
};

export function explainSyncError(code: string | null | undefined): string {
  if (!code) return "";
  return errorExplanations[code] ?? `Hata kodu: ${code}`;
}

// Süreyi "3 sn" ya da "1 dk 5 sn" gibi yazar. Bitmemiş çalışma için null döner.
export function formatRunDuration(
  startedAt: Date,
  finishedAt: Date | null,
): string | null {
  if (!finishedAt) return null;
  const totalSeconds = Math.max(
    0,
    Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000),
  );
  if (totalSeconds < 60) return `${totalSeconds} sn`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes} dk` : `${minutes} dk ${seconds} sn`;
}

// Son çalışmalardan ardışık başarısızlık sayısı (en yeni başta). İlk başarıda durur.
export function consecutiveFailures(statuses: string[]): number {
  let count = 0;
  for (const status of statuses) {
    if (status === "success") break;
    if (status === "running") continue;
    count += 1;
  }
  return count;
}
