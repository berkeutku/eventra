export type EventCategory =
  | "concert"
  | "match"
  | "theatre"
  | "festival"
  | "standup"
  | "university"
  | "other";

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
  { label: string; gradient: string; soft: string; accent: string }
> = {
  concert: {
    label: "Konser",
    gradient: "bg-linear-to-br from-[#1a0b4d] via-violet to-coral",
    soft: "bg-lilac",
    accent: "text-violet",
  },
  match: {
    label: "Maç",
    gradient: "bg-linear-to-br from-[#004d3b] via-[#00997a] to-mint",
    soft: "bg-sea",
    accent: "text-mint-ink",
  },
  theatre: {
    label: "Tiyatro",
    gradient: "bg-linear-to-br from-[#5b1a3a] via-coral to-sun",
    soft: "bg-peach",
    accent: "text-coral-ink",
  },
  festival: {
    label: "Festival",
    gradient: "bg-linear-to-br from-[#4d2a00] via-sun to-coral",
    soft: "bg-[#fff1d6]",
    accent: "text-[#8a5a00]",
  },
  standup: {
    label: "Stand-up",
    gradient: "bg-linear-to-br from-night via-[#7a2e6b] to-coral",
    soft: "bg-[#fde7f3]",
    accent: "text-[#9b2c6a]",
  },
  university: {
    label: "Üniversite",
    gradient: "bg-linear-to-br from-[#0b2a4d] via-[#2b6cb0] to-mint",
    soft: "bg-[#e3f0fd]",
    accent: "text-[#1f5a99]",
  },
  other: {
    label: "Diğer",
    gradient: "bg-linear-to-br from-night via-[#3d3f63] to-[#8e77ff]",
    soft: "bg-[#ecedf5]",
    accent: "text-[#4a4c6a]",
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
  {
    id: "kis-isiklari-festivali",
    title: "Kış Işıkları Festivali",
    category: "festival",
    city: "Bursa",
    venue: "Göl Kıyısı Festival Alanı",
    startsAt: "2027-01-09T17:00:00+03:00",
    description:
      "Müzik, yemek tezgâhları ve ışık gösterileriyle bir kış festivali. Alan şehir dışında, çıkışta araç yoğunluğu bekleniyor.",
  },
  {
    id: "gulduren-gece-standup",
    title: "Güldüren Gece",
    category: "standup",
    city: "İstanbul",
    venue: "Kent Sahnesi",
    startsAt: "2027-01-16T21:00:00+03:00",
    description:
      "Birkaç komedyenin yer aldığı stand-up gecesi. Gösteri gece yarısına yakın bitiyor, toplu taşıma sınırlı.",
  },
  {
    id: "kampus-kariyer-gunleri",
    title: "Kampüs Kariyer Günleri",
    category: "university",
    city: "Ankara",
    venue: "Kuzey Kampüsü Konferans Salonu",
    startsAt: "2027-01-23T10:00:00+03:00",
    description:
      "Öğrencilere yönelik sunumlar ve tanışma etkinliği. Kampüs çıkışındaki servis ve otobüsler kalabalık olabiliyor.",
  },
  {
    id: "kitap-ve-sanat-fuari",
    title: "Kitap ve Sanat Fuarı",
    category: "other",
    city: "İstanbul",
    venue: "Sahil Fuar Alanı",
    startsAt: "2027-01-30T11:00:00+03:00",
    description:
      "Yayınevleri, imza günleri ve sanat atölyeleri. Hafta sonu yoğunluğu nedeniyle otopark çıkışı uzun sürebilir.",
  },
];