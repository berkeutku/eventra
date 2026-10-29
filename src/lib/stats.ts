// Saf hesaplama dosyası: veritabanına bağlanmaz ve hiçbir yerden içe aktarım yapmaz,
// bu yüzden test betiğinden doğrudan çalıştırılabilir.

export type StatsRide = {
  id: string;
  eventId: string;
  eventStartsAt: string | Date;
  totalCost: number;
  seats: number;
  passengerCount: number;
};

export type SavingsSummary = {
  past: number;
  upcoming: number;
  savedPast: number;
  savedUpcoming: number;
};

export type Badge = {
  key: string;
  title: string;
  description: string;
  earned: boolean;
  current: number;
  target: number;
};

export type UserStats = {
  asPassenger: SavingsSummary;
  asDriver: SavingsSummary;
  badges: Badge[];
  totalRides: number;
};

// Kişi başı pay: Eventra'nın her yerinde kullanılan formülle aynı (yukarı yuvarlama).
function sharePerPerson(totalCost: number, people: number): number {
  return Math.ceil(totalCost / Math.max(people, 1));
}

// Yolcu için tahmini tasarruf: tek başına gitseydi masrafın tamamını ödeyeceği varsayılır.
// Katılan yolcu sayısı o anki sayıdır, yolculuk dolunca kişi başı pay düşer.
export function passengerSaving(ride: StatsRide): number {
  const people = Math.max(ride.passengerCount, 0) + 1;
  return Math.max(0, ride.totalCost - sharePerPerson(ride.totalCost, people));
}

// Sürücü için: yolcuların tahmini toplam katkısı.
export function driverContribution(ride: StatsRide): number {
  const passengers = Math.max(ride.passengerCount, 0);

  if (passengers === 0) {
    return 0;
  }

  return Math.min(
    ride.totalCost,
    passengers * sharePerPerson(ride.totalCost, passengers + 1),
  );
}

export function summarize(
  rides: StatsRide[],
  saving: (ride: StatsRide) => number,
  now: Date,
): SavingsSummary {
  const summary: SavingsSummary = {
    past: 0,
    upcoming: 0,
    savedPast: 0,
    savedUpcoming: 0,
  };

  for (const ride of rides) {
    const start = new Date(ride.eventStartsAt).getTime();

    if (Number.isNaN(start)) {
      continue;
    }

    const amount = saving(ride);

    if (start < now.getTime()) {
      summary.past += 1;
      summary.savedPast += amount;
    } else {
      summary.upcoming += 1;
      summary.savedUpcoming += amount;
    }
  }

  return summary;
}

function makeBadge(
  key: string,
  title: string,
  description: string,
  current: number,
  target: number,
): Badge {
  return {
    key,
    title,
    description,
    earned: current >= target,
    current: Math.min(current, target),
    target,
  };
}

// Rozetler yalnızca hesaptaki gerçek yolculuk kayıtlarından anında hesaplanır.
export function computeBadges(
  driverRides: StatsRide[],
  passengerRides: StatsRide[],
): Badge[] {
  const eventIds = new Set<string>([
    ...driverRides.map((ride) => ride.eventId),
    ...passengerRides.map((ride) => ride.eventId),
  ]);
  const fullRides = driverRides.filter(
    (ride) => ride.passengerCount >= ride.seats,
  ).length;
  const total = driverRides.length + passengerRides.length;

  return [
    makeBadge(
      "first_join",
      "İlk Katılım",
      "Bir yolculuğa yolcu olarak katıl.",
      passengerRides.length,
      1,
    ),
    makeBadge(
      "first_ride",
      "İlk Kaptanlık",
      "Sürücü olarak bir yolculuk oluştur.",
      driverRides.length,
      1,
    ),
    makeBadge(
      "full_car",
      "Dolu Araç",
      "Oluşturduğun bir yolculuğun tüm koltukları dolsun.",
      fullRides,
      1,
    ),
    makeBadge(
      "explorer",
      "Etkinlik Kaşifi",
      "3 farklı etkinlik için yolculuk oluştur veya yolculuğa katıl.",
      eventIds.size,
      3,
    ),
    makeBadge(
      "sharing_master",
      "Paylaşım Ustası",
      "Toplam 5 yolculuğa dahil ol (sürücü veya yolcu olarak).",
      total,
      5,
    ),
  ];
}

export function buildStats(
  driverRides: StatsRide[],
  passengerRides: StatsRide[],
  now: Date = new Date(),
): UserStats {
  return {
    asPassenger: summarize(passengerRides, passengerSaving, now),
    asDriver: summarize(driverRides, driverContribution, now),
    badges: computeBadges(driverRides, passengerRides),
    totalRides: driverRides.length + passengerRides.length,
  };
}