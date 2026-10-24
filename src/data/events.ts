export type EventCategory = "concert" | "match" | "theatre";

export type EventItem = {
  id: string;
  title: string;
  category: EventCategory;
  city: string;
  venue: string;
  startsAt: string; // ISO format: 2026-11-21T20:00:00+03:00
  description: string;
};

export const categoryMeta: Record<
  EventCategory,
  { label: string; gradient: string; soft: string }
> = {
  concert: {
    label: "Konser",
    gradient: "bg-linear-to-br from-violet to-pink",
    soft: "bg-lilac",
  },
  match: {
    label: "Maç",
    gradient: "bg-linear-to-br from-mint to-sky",
    soft: "bg-sea",
  },
  theatre: {
    label: "Tiyatro",
    gradient: "bg-linear-to-br from-coral to-sun",
    soft: "bg-peach",
  },
};

// DEMO VERİ: Tüm etkinlikler, mekanlar ve takımlar kurgusaldır.
export const events: EventItem[] = [
  {
    id: "gece-yolculugu-konseri",
    title: "Gece Yolculuğu Konseri",
    category: "concert",
    city: "İstanbul",
    venue: "Liman Sahnesi",
    startsAt: "2026-11-21T20:30:00+03:00",
    description:
      "Açık havada elektronik ve indie müzik gecesi. Çıkışta yoğunluk bekleniyor.",
  },
  {
    id: "anadolu-derbisi",
    title: "Anadolu Derbisi",
    category: "match",
    city: "Ankara",
    venue: "Kuzey Arena",
    startsAt: "2026-11-28T19:00:00+03:00",
    description:
      "Şehrin iki büyük takımı karşı karşıya. Maç sonrası otopark çıkışı uzun sürebilir.",
  },
  {
    id: "son-perde-tiyatro",
    title: "Son Perde",
    category: "theatre",
    city: "İzmir",
    venue: "Körfez Sanat Merkezi",
    startsAt: "2026-12-05T20:00:00+03:00",
    description:
      "Modern bir drama. Gösteri gece geç saatte bittiği için toplu taşıma seçenekleri sınırlı.",
  },
  {
    id: "akdeniz-caz-gecesi",
    title: "Akdeniz Caz Gecesi",
    category: "concert",
    city: "Adana",
    venue: "Merkez Kültür Salonu",
    startsAt: "2026-12-12T21:00:00+03:00",
    description:
      "Canlı caz orkestrasıyla bir akşam. Salonun çevresinde park yeri bulmak zor.",
  },
  {
    id: "sehir-kupasi-finali",
    title: "Şehir Kupası Finali",
    category: "match",
    city: "İstanbul",
    venue: "Boğaz Stadyumu",
    startsAt: "2026-12-19T18:00:00+03:00",
    description:
      "Sezonun final maçı. Stadyum çevresinde yoğun trafik ve uzun taksi kuyrukları bekleniyor.",
  },
  {
    id: "yazlik-sahne-komedi",
    title: "Kahkaha Akşamı",
    category: "theatre",
    city: "Ankara",
    venue: "Başkent Tiyatro Evi",
    startsAt: "2026-12-26T20:30:00+03:00",
    description:
      "Müzikli komedi oyunu. Yılın son hafta sonu, şehir merkezinde yoğunluk yüksek.",
  },
];