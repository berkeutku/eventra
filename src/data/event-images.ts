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
  other: [{ src: "/events/other-1.jpg" }],
};

// Aynı etkinlik her zaman aynı fotoğrafı alır (kimliğinden hesaplanır).
export function pickEventImage(
  category: EventCategory,
  id: string,
): EventImage | null {
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