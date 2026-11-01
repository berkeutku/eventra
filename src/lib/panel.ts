import type { RideWithEvent } from "./ride-utils";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarım kullanıyor.

export type NextRide = { ride: RideWithEvent; role: "driver" | "passenger" };

// Etkinlik başladıktan sonra bu kadar saat daha "sıradaki" sayılır (süren etkinlikler).
const GRACE_HOURS = 6;

export function pickNextRide(
  driverRides: RideWithEvent[],
  passengerRides: RideWithEvent[],
  now: Date = new Date(),
): NextRide | null {
  const cutoff = now.getTime() - GRACE_HOURS * 3_600_000;
  const time = (item: NextRide) => new Date(item.ride.eventStartsAt).getTime();

  const candidates: NextRide[] = [
    ...driverRides.map((ride) => ({ ride, role: "driver" as const })),
    ...passengerRides.map((ride) => ({ ride, role: "passenger" as const })),
  ].filter((item) => {
    const value = time(item);
    return !Number.isNaN(value) && value >= cutoff;
  });

  candidates.sort(
    (a, b) =>
      time(a) - time(b) ||
      a.ride.departureTime.localeCompare(b.ride.departureTime),
  );

  return candidates[0] ?? null;
}