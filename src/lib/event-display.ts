// Etkinliklerin ekranda nasıl gösterileceğine dair saf yardımcılar (veritabanı ve React içermez).
// Yeni bir bilet sağlayıcısı eklendiğinde yalnızca providerLabels listesine bir satır eklemek yeterli.

const TIME_ZONE = "Europe/Istanbul";

// Etkinlik kaynağının kullanıcıya gösterilen adı.
export const providerLabels: Record<string, string> = {
  biletimgo: "biletimGO",
};

export function sourceLabel(source: string | null | undefined): string {
  return (source && providerLabels[source]) || "Demo etkinlik";
}

export function isProviderEvent(source: string | null | undefined): boolean {
  return Boolean(source && providerLabels[source]);
}

export type PriceInfo = {
  // Gösterilecek fiyat metni ("600 TL", "350 – 657 TL") ya da null.
  text: string | null;
  // Satışta bilet yoksa true.
  soldOut: boolean;
};

const NUMBER = /^\d{1,7}(?:[.,]\d{1,2})?$/;

function formatAmount(raw: string): string {
  const value = Number(raw.replace(",", "."));

  if (!Number.isFinite(value)) {
    return raw;
  }

  return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

// Sağlayıcıdan gelen ham fiyat metnini okunur hale getirir.
export function formatPrice(priceText: string | null | undefined): PriceInfo {
  const text = (priceText ?? "").trim();

  if (!text) {
    return { text: null, soldOut: false };
  }

  const lower = text.toLocaleLowerCase("tr-TR");

  if (lower === "aktif bilet yok" || lower === "tükendi" || lower === "satışta değil") {
    return { text: null, soldOut: true };
  }

  if (/tl|₺/i.test(text)) {
    return { text, soldOut: false };
  }

  if (NUMBER.test(text)) {
    return { text: Number(text.replace(",", ".")) === 0 ? "Ücretsiz" : `${formatAmount(text)} TL`, soldOut: false };
  }

  const range = /^(\d{1,7}(?:[.,]\d{1,2})?)\s*[-–]\s*(\d{1,7}(?:[.,]\d{1,2})?)$/.exec(text);

  if (range) {
    return range[1] === range[2]
      ? { text: `${formatAmount(range[1])} TL`, soldOut: false }
      : { text: `${formatAmount(range[1])} – ${formatAmount(range[2])} TL`, soldOut: false };
  }

  return { text, soldOut: false };
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  });
}

// Birden fazla güne yayılan etkinlikler için "28 Kas – 1 Ara"; tek günlükse null.
// Gece yarısını geçen bir konser (ör. 21:00–01:30) çok günlü sayılmaz: 12 saatten kısa olanlar atlanır.
export function multiDayRange(
  startsAt: string,
  endsAt: string | null | undefined,
): string | null {
  if (!endsAt) {
    return null;
  }

  const end = new Date(endsAt).getTime();
  const start = new Date(startsAt).getTime();

  if (!Number.isFinite(end) || !Number.isFinite(start) || end - start < 12 * 3_600_000) {
    return null;
  }

  return dayKey(startsAt) === dayKey(endsAt)
    ? null
    : `${shortDay(startsAt)} – ${shortDay(endsAt)}`;
}

// Mekân şehirle aynıysa (sağlayıcı mekân vermemişse) şehri iki kez yazmaz.
export function venueLine(venue: string, city: string): string {
  const v = venue.trim();
  const c = city.trim();

  if (!v || v.toLocaleLowerCase("tr-TR") === c.toLocaleLowerCase("tr-TR")) {
    return c;
  }

  return v.toLocaleLowerCase("tr-TR").includes(c.toLocaleLowerCase("tr-TR"))
    ? v
    : `${v}, ${c}`;
}
