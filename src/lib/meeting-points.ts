import { normalizeText } from "./matching";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli
// (./matching) import yolunu kullanıyor.

export type CrowdLevel = "low" | "medium" | "high";

export type MeetingPoint = {
  id: string;
  name: string;
  walkMinutes: number;
  crowd: CrowdLevel;
  lit: boolean;
  stepFree: boolean;
  // Şematik plan üzerindeki konum (400 x 260 birimlik çizim alanı)
  x: number;
  y: number;
};

export type MeetingReasonKey = "walk" | "crowd" | "light" | "access";

export type MeetingReason = {
  key: MeetingReasonKey;
  label: string;
  detail: string;
  points: number;
  max: number;
};

export type RankedMeetingPoint = {
  point: MeetingPoint;
  rank: number;
  score: number; // 0 ile 100 arası
  reasons: MeetingReason[];
};

// DEMO: Mekan planı, yürüyüş süreleri ve kalabalık tahminleri kurgusaldır.
// Gerçek bir ölçüm, harita ya da kalabalık verisi kullanılmaz.
export const MEETING_POINTS: MeetingPoint[] = [
  {
    id: "main-gate",
    name: "Ana kapı önü",
    walkMinutes: 2,
    crowd: "high",
    lit: true,
    stepFree: true,
    x: 200,
    y: 226,
  },
  {
    id: "north-exit",
    name: "Kuzey çıkışı",
    walkMinutes: 4,
    crowd: "low",
    lit: true,
    stepFree: true,
    x: 200,
    y: 34,
  },
  {
    id: "parking-entrance",
    name: "Otopark girişi",
    walkMinutes: 6,
    crowd: "medium",
    lit: true,
    stepFree: false,
    x: 352,
    y: 130,
  },
  {
    id: "west-gate",
    name: "Batı kapısı önü",
    walkMinutes: 8,
    crowd: "medium",
    lit: false,
    stepFree: true,
    x: 48,
    y: 130,
  },
];

export function crowdLabel(level: CrowdLevel): string {
  if (level === "low") return "düşük";
  if (level === "medium") return "orta";
  return "yüksek";
}

function walkPoints(minutes: number): number {
  if (minutes <= 3) return 40;
  if (minutes <= 5) return 30;
  if (minutes <= 7) return 20;
  return 10;
}

function crowdPoints(level: CrowdLevel): number {
  if (level === "low") return 40;
  if (level === "medium") return 25;
  return 10;
}

function scorePoint(point: MeetingPoint): MeetingReason[] {
  return [
    {
      key: "walk",
      label: "Yürüyüş mesafesi",
      detail: `Çıkıştan yaklaşık ${point.walkMinutes} dakika`,
      points: walkPoints(point.walkMinutes),
      max: 40,
    },
    {
      key: "crowd",
      label: "Tahmini kalabalık",
      detail: `Kalabalık ${crowdLabel(point.crowd)}`,
      points: crowdPoints(point.crowd),
      max: 40,
    },
    {
      key: "light",
      label: "Aydınlatma",
      detail: point.lit ? "Aydınlık" : "Aydınlatması az",
      points: point.lit ? 10 : 0,
      max: 10,
    },
    {
      key: "access",
      label: "Engelsiz erişim",
      detail: point.stepFree ? "Basamaksız erişim" : "Basamak var",
      points: point.stepFree ? 10 : 0,
      max: 10,
    },
  ];
}

export function rankMeetingPoints(
  points: MeetingPoint[] = MEETING_POINTS,
): RankedMeetingPoint[] {
  return points
    .map((point) => {
      const reasons = scorePoint(point);
      const score = reasons.reduce((sum, reason) => sum + reason.points, 0);
      return { point, score, reasons };
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.point.walkMinutes - b.point.walkMinutes,
    )
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

// "KUZEY ÇIKIŞI" ya da "kuzey cikisi" gibi yazımları da bulur.
export function findMeetingPoint(
  input: string,
  points: MeetingPoint[] = MEETING_POINTS,
): MeetingPoint | null {
  const wanted = normalizeText(input);

  if (wanted.length === 0) {
    return null;
  }

  return points.find((point) => normalizeText(point.name) === wanted) ?? null;
}