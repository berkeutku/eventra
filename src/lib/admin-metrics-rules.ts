// Saf kurallar: veritabanı içermez, hem sayfadan hem test betiğinden içe aktarılabilir.

export type DayCount = { day: string; count: number };

const TR_OFFSET_MS = 3 * 3_600_000; // Türkiye sabit UTC+3
const DAY_MS = 86_400_000;

// Verilen anın Türkiye saatine göre gününü "YYYY-MM-DD" olarak verir.
export function trDayKey(date: Date): string {
  return new Date(date.getTime() + TR_OFFSET_MS).toISOString().slice(0, 10);
}

// Bugün dahil son N günün anahtarları, en eskiden en yeniye doğru.
export function lastDays(days: number, now: Date): string[] {
  const keys: string[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    keys.push(trDayKey(new Date(now.getTime() - offset * DAY_MS)));
  }

  return keys;
}

// Kaydı olmayan günleri 0 ile doldurur, aralık dışındaki günleri atar.
export function fillDays(
  rows: DayCount[],
  days: number,
  now: Date,
): DayCount[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.day, (counts.get(row.day) ?? 0) + row.count);
  }

  return lastDays(days, now).map((day) => ({
    day,
    count: counts.get(day) ?? 0,
  }));
}

// Yüzde (0-100, yuvarlanmış). Toplam 0 ise 0 döner.
export function percent(part: number, total: number): number {
  if (total <= 0 || part <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((part / total) * 100));
}

// Çubuk genişliği (0-100). Değer varsa çok küçük çubuk da görünsün diye en az 4.
export function barWidth(value: number, max: number): number {
  if (value <= 0 || max <= 0) {
    return 0;
  }

  return Math.max(4, Math.min(100, Math.round((value / max) * 100)));
}
