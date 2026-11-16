// Veritabanı içermeyen saf kural dosyası (testle doğrudan çalıştırılabilir).
export function parseSettingFlag(
  value: string | null | undefined,
  fallback: boolean,
): boolean {
  if (value === "1") return true;
  if (value === "0") return false;
  return fallback;
}
