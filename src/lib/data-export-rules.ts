// Saf kurallar: veritabanı içermez, hem yol işleyicisinden hem test betiğinden içe aktarılabilir.

export const EXPORT_MAX_PER_HOUR = 3;
export const EXPORT_WINDOW_MS = 3_600_000;
export const EXPORT_RATE_KIND = "data_export";

// Dosya adı: eventra-verilerim-2026-11-16.json
export function exportFileName(now: Date): string {
  return `eventra-verilerim-${now.toISOString().slice(0, 10)}.json`;
}

export type ExportEnvelope<T> = {
  bilgi: string;
  olusturulma: string;
  veriler: T;
};

// Dosyanın başına, ne olduğunu ve neyin bilerek dışarıda bırakıldığını açıklayan bir not koyar.
export function wrapExport<T>(data: T, now: Date): ExportEnvelope<T> {
  return {
    bilgi:
      "Eventra hesabına ait verilerin. Parola özeti, bilet kodu özeti, bildirim uç noktaları ve diğer kullanıcıların kimlik bilgileri gizlilik için bu dosyaya konmaz.",
    olusturulma: now.toISOString(),
    veriler: data,
  };
}
