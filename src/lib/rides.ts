import { useSyncExternalStore } from "react";

export type Ride = {
  id: string;
  eventId: string;
  driverName: string;
  origin: string;
  destination: string;
  meetingPoint: string;
  departureTime: string; // "HH:MM" formatında, örn. "23:30"
  durationMinutes: number;
  seats: number;
  totalCost: number; // TL, tahmini toplam yol masrafı
  createdAt: string;
};

export type NewRide = Omit<Ride, "id" | "createdAt">;

const STORAGE_KEY = "eventra-demo-rides";
const listeners = new Set<() => void>();

const EMPTY: Ride[] = [];
let cachedRaw: string | null = null;
let cachedRides: Ride[] = EMPTY;

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readRides(): Ride[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }

  if (raw === cachedRaw) {
    return cachedRides;
  }

  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedRides = Array.isArray(parsed) ? (parsed as Ride[]) : EMPTY;
  } catch {
    cachedRides = EMPTY;
  }
  return cachedRides;
}

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// undefined = henüz yüklenmedi, dizi = yüklenmiş yolculuklar
export function useRides(): Ride[] | undefined {
  return useSyncExternalStore(subscribe, readRides, () => undefined);
}

// Başarılıysa kaydedilen yolculuğu, başarısızsa null döndürür.
export function addRide(input: NewRide): Ride | null {
  const ride: Ride = {
    ...input,
    id: makeId(),
    createdAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...readRides(), ride]),
    );
  } catch {
    return null;
  }

  notify();
  return ride;
}

// Yolculuğu siler. Başarılıysa true, başarısızsa false döndürür.
export function deleteRide(id: string): boolean {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(readRides().filter((ride) => ride.id !== id)),
    );
  } catch {
    return false;
  }

  notify();
  return true;
}

// Masraf, sürücü dahil herkese eşit bölünür ve tam liraya yuvarlanır.
export function calcSharePerPerson(totalCost: number, seats: number): number {
  return Math.ceil(totalCost / (seats + 1));
}

// "23:30" + 45 dakika = "00:15 (ertesi gün)"
export function calcArrival(
  departureTime: string,
  durationMinutes: number,
): string {
  const [hours, minutes] = departureTime.split(":").map(Number);
  const total = hours * 60 + minutes + durationMinutes;
  const wrapped = total % 1440;
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return total >= 1440 ? `${hh}:${mm} (ertesi gün)` : `${hh}:${mm}`;
}

// Sıralama için: gece 06:00'dan önceki saatler ertesi güne ait sayılır.
// Böylece etkinlik çıkışında 23:30 kalkış, 00:10 kalkıştan önce gelir.
export function departureSortKey(departureTime: string): number {
  const [hours, minutes] = departureTime.split(":").map(Number);
  return hours * 60 + minutes + (hours < 6 ? 1440 : 0);
}