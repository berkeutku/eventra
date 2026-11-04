import { distanceKm, type Pt } from "./geo-rules";

// Varsayımlar: tahmin amaçlıdır ve arayüzde açıkça belirtilir.
export const DEFAULT_CONSUMPTION = 7; // litre / 100 km
// Ekim 2026'da İstanbul'da benzin litresi yaklaşık 76-84 TL idi. Kullanıcı kendi fiyatını girer.
export const DEFAULT_FUEL_PRICE = 80;
// Resmî test ortalaması (~120 g/km) ile gerçek sürüş ölçümleri (~180 g/km) arasında yaklaşık değer.
export const CO2_GRAMS_PER_KM = 150;
export const MAX_COST = 5000;

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// Yakıt + yol masrafı önerisi (TL). Geçersiz girdide null, 10 TL'ye yukarı yuvarlanır, en fazla 5000.
export function suggestRideCost(input: {
  distanceMeters: number;
  litersPer100: number;
  pricePerLiter: number;
  tolls: number;
}): number | null {
  const { distanceMeters, litersPer100, pricePerLiter, tolls } = input;

  if (![distanceMeters, litersPer100, pricePerLiter, tolls].every(finite)) {
    return null;
  }

  if (
    distanceMeters <= 0 ||
    litersPer100 < 2 ||
    litersPer100 > 30 ||
    pricePerLiter < 1 ||
    pricePerLiter > 500 ||
    tolls < 0 ||
    tolls > 2000
  ) {
    return null;
  }

  const fuel = (distanceMeters / 1000) * (litersPer100 / 100) * pricePerLiter;
  // Önce kuruşa yuvarla: 560.0000000000001 gibi kayan nokta artıkları yukarı yuvarlamayı bozmasın.
  const raw = Math.round((fuel + tolls) * 100) / 100;
  const total = Math.ceil(raw / 10) * 10;

  return Math.min(MAX_COST, Math.max(10, total));
}

// Yolculukla kaçınılan tahmini CO2 (kg, tek ondalık). Yolcu ya da mesafe yoksa null.
// Yalnızca buluşma noktasından varışa kadar olan kısım sayılır (sürücünün buluşmaya gelişi sayılmaz).
export function co2SavedKg(input: {
  passengers: number;
  routeMeters: number | null;
  origin: Pt;
  meeting: Pt;
  dest: Pt;
}): number | null {
  const { passengers, routeMeters } = input;

  if (
    !Number.isInteger(passengers) ||
    passengers <= 0 ||
    routeMeters === null ||
    !finite(routeMeters) ||
    routeMeters <= 0
  ) {
    return null;
  }

  const approach = distanceKm(input.origin, input.meeting);
  const shared = distanceKm(input.meeting, input.dest);
  const total = approach + shared;
  const fraction = total > 0 ? shared / total : 1;
  const km = (routeMeters / 1000) * fraction;

  return Math.round(((passengers * km * CO2_GRAMS_PER_KM) / 1000) * 10) / 10;
}