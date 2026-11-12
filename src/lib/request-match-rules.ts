import { normalizeText } from "./matching";
import { departureSortKey } from "./ride-utils";

// Saf kurallar: veritabanı içermez. Bu dosya hem uygulamadan hem test betiğinden
// çağrıldığı için göreli içe aktarımlar kullanıyor.

// Bir kişiye pencere içinde gidebilecek en fazla eşleşme bildirimi (spam önleme).
export const MAX_MATCH_NOTIFICATIONS = 3;
export const MATCH_WINDOW_HOURS = 6;
export const MAX_TIME_DIFF_MINUTES = 60;

export type RequestLike = {
  destination: string;
  preferredTime: string | null;
  seats: number;
};

export type RideLike = {
  destination: string;
  departureTime: string; // "HH:MM"
  seatsLeft: number;
};

// Bildirim için bilerek sıkı: tamamen aynı ya da biri diğerini içeriyor olmalı.
// Yalnızca ortak bir şehir adı ("İstanbul") eşleşme sayılmaz.
export function destinationsMatch(a: string, b: string): boolean {
  const x = normalizeText(a);
  const y = normalizeText(b);

  if (x === "" || y === "") {
    return false;
  }

  if (x === y) {
    return true;
  }

  return (x.length >= 3 && y.includes(x)) || (y.length >= 3 && x.includes(y));
}

// Saat girilmediyse her saat uyar. Gece yarısı sonrası saatler ertesi güne sayılır.
export function timeMatches(
  preferred: string | null,
  departure: string,
): boolean {
  if (preferred === null) {
    return true;
  }

  return (
    Math.abs(departureSortKey(preferred) - departureSortKey(departure)) <=
    MAX_TIME_DIFF_MINUTES
  );
}

export function requestFitsRide(request: RequestLike, ride: RideLike): boolean {
  return (
    ride.seatsLeft >= request.seats &&
    destinationsMatch(request.destination, ride.destination) &&
    timeMatches(request.preferredTime, ride.departureTime)
  );
}