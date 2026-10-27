import {
  calcSharePerPerson,
  departureSortKey,
  remainingSeats,
  type RideItem,
} from "./ride-utils";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli
// (./ride-utils) import yolunu kullanıyor.

export type MatchPreferences = {
  destination: string;
  preferredTime: string; // "HH:MM" ya da boş
};

export type ReasonKey = "destination" | "time" | "cost" | "seats";

export type MatchReason = {
  key: ReasonKey;
  label: string;
  detail: string;
  points: number;
  max: number;
};

export type ScoredRide = {
  ride: RideItem;
  score: number; // 0 ile 100 arası uyum yüzdesi
  reasons: MatchReason[];
  full: boolean;
};

export const WEIGHTS = {
  destination: 50,
  time: 20,
  cost: 20,
  seats: 10,
} as const;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// "Kadıköy" -> "kadikoy", "İSTANBUL" -> "istanbul"
export function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function destinationPoints(
  input: string,
  target: string,
): { points: number; detail: string } {
  const a = normalizeText(input);
  const b = normalizeText(target);

  if (a === b) {
    return { points: WEIGHTS.destination, detail: "Varış yerin tam eşleşiyor" };
  }

  if ((a.length >= 3 && b.includes(a)) || (b.length >= 3 && a.includes(b))) {
    return { points: 40, detail: "Varış yeri benzer" };
  }

  const tokensA = a.split(" ").filter((token) => token.length >= 3);
  const tokensB = new Set(b.split(" ").filter((token) => token.length >= 3));

  if (tokensA.some((token) => tokensB.has(token))) {
    return { points: 25, detail: "Varış yerinde ortak sözcük var" };
  }

  return { points: 0, detail: "Varış yeri eşleşmiyor" };
}

function timePoints(
  preferred: string,
  departure: string,
): { points: number; detail: string } {
  const diff = Math.abs(
    departureSortKey(preferred) - departureSortKey(departure),
  );

  if (diff === 0) {
    return { points: WEIGHTS.time, detail: "Tam istediğin saatte kalkıyor" };
  }

  if (diff <= 15) {
    return { points: WEIGHTS.time, detail: `${diff} dakika fark` };
  }

  if (diff <= 30) {
    return { points: 14, detail: `${diff} dakika fark` };
  }

  if (diff <= 60) {
    return { points: 8, detail: `${diff} dakika fark` };
  }

  return { points: 0, detail: "İstediğin saatten bir saatten fazla uzak" };
}

export function scoreRides(
  rides: RideItem[],
  prefs: MatchPreferences,
): ScoredRide[] {
  if (rides.length === 0) {
    return [];
  }

  const destination = prefs.destination.trim();
  const useDestination = normalizeText(destination).length > 0;
  const useTime = TIME_PATTERN.test(prefs.preferredTime);

  const shares = rides.map((ride) =>
    calcSharePerPerson(ride.totalCost, ride.seats),
  );
  const minShare = Math.min(...shares);
  const maxShare = Math.max(...shares);

  return rides.map((ride, index) => {
    const reasons: MatchReason[] = [];

    if (useDestination) {
      const match = destinationPoints(destination, ride.destination);
      reasons.push({
        key: "destination",
        label: "Varış yeri",
        detail: match.detail,
        points: match.points,
        max: WEIGHTS.destination,
      });
    }

    if (useTime) {
      const match = timePoints(prefs.preferredTime, ride.departureTime);
      reasons.push({
        key: "time",
        label: "Kalkış saati",
        detail: match.detail,
        points: match.points,
        max: WEIGHTS.time,
      });
    }

    const share = shares[index];
    const costPoints =
      maxShare === minShare
        ? WEIGHTS.cost
        : Math.round((WEIGHTS.cost * (maxShare - share)) / (maxShare - minShare));

    reasons.push({
      key: "cost",
      label: "Kişi başı masraf",
      detail:
        maxShare === minShare
          ? `Tüm yolculuklarda ${share} TL`
          : `${share} TL (bu etkinlikteki yolculuklara göre)`,
      points: costPoints,
      max: WEIGHTS.cost,
    });

    const left = remainingSeats(ride);
    const seatPoints = left >= 2 ? WEIGHTS.seats : left === 1 ? 5 : 0;

    reasons.push({
      key: "seats",
      label: "Boş koltuk",
      detail:
        left === 0
          ? "Yolculuk dolu"
          : left === 1
            ? "Son koltuk"
            : `${left} boş koltuk`,
      points: seatPoints,
      max: WEIGHTS.seats,
    });

    const earned = reasons.reduce((sum, reason) => sum + reason.points, 0);
    const possible = reasons.reduce((sum, reason) => sum + reason.max, 0);

    return {
      ride,
      score: possible === 0 ? 0 : Math.round((earned / possible) * 100),
      reasons,
      full: left === 0,
    };
  });
}