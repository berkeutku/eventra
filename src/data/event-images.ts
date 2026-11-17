import type { EventCategory } from "@/data/events";

export type EventImage = { src: string };

// Fotoğraflar public/events klasöründedir. Bir dosya yoksa ilgili etkinlik
// otomatik olarak çizimli görsele döner (bkz. EventCover).
const IMAGES: Record<EventCategory, EventImage[]> = {
  concert: [{ src: "/events/concert-1.jpg" }, { src: "/events/concert-2.jpg" }],
  match: [{ src: "/events/match-1.jpg" }, { src: "/events/match-2.jpg" }],
  theatre: [{ src: "/events/theatre-1.jpg" }, { src: "/events/theatre-2.jpg" }],
  festival: [{ src: "/events/festival-1.jpg" }, { src: "/events/festival-2.jpg" }],
  standup: [{ src: "/events/standup-1.jpg" }],
  university: [{ src: "/events/university-1.jpg" }],
  other: [{ src: "/events/other-1.jpg" }], party: [], workshop: [], kids: [],
};

// Başlıkta bu kelimeler geçiyorsa konuya uygun fotoğraf seçilir (örn. derbi için stadyum).
// Eşleşme yoksa kimlikten hesaplanan seçim geçerlidir.
const TITLE_HINTS: { category: EventCategory; pattern: RegExp; src: string }[] = [
  { category: "match", pattern: /derbi|lig|futbol|stadyum|süper/, src: "/events/match-2.jpg" },
  { category: "match", pattern: /voleybol|basketbol|hentbol|salon/, src: "/events/match-1.jpg" },
];

export function imageFromTitle(
  category: EventCategory,
  title: string | undefined,
): EventImage | null {
  if (!title) {
    return null;
  }

  const lower = title.toLocaleLowerCase("tr-TR");
  const hint = TITLE_HINTS.find(
    (item) => item.category === category && item.pattern.test(lower),
  );

  return hint ? { src: hint.src } : null;
}

// Aynı etkinlik her zaman aynı fotoğrafı alır (başlıktaki ipucundan ya da kimliğinden hesaplanır).
export function pickEventImage(
  category: EventCategory,
  id: string,
  title?: string,
): EventImage | null {
  const fromTitle = imageFromTitle(category, title);

  if (fromTitle) {
    return fromTitle;
  }

  const list = IMAGES[category];

  if (list.length === 0) {
    return null;
  }

  let sum = 0;

  for (const char of id) {
    sum += char.charCodeAt(0);
  }

  return list[sum % list.length];
}