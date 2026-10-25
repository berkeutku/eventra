export type RideItem = {
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

export type DriverRideItem = RideItem & {
  eventTitle: string;
  eventStartsAt: string;
};

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