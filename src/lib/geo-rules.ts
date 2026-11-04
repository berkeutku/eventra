// Saf kurallar ve ayrıştırıcılar: veritabanı ve ağ içermez, tarayıcıda ve betiklerde kullanılabilir.

export type Pt = { lat: number; lng: number };
export type Place = { label: string; lat: number; lng: number };
export type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  path: [number, number][]; // [boylam, enlem]
};

// Platform Türkiye için: sınırlar dışındaki noktalar reddedilir.
export const TR_BOUNDS = {
  minLat: 35.4,
  maxLat: 42.4,
  minLng: 25.4,
  maxLng: 45.0,
} as const;

export function isValidPoint(p: Pt): boolean {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    p.lat >= TR_BOUNDS.minLat &&
    p.lat <= TR_BOUNDS.maxLat &&
    p.lng >= TR_BOUNDS.minLng &&
    p.lng <= TR_BOUNDS.maxLng
  );
}

// Başlangıç ve varış için: yaklaşık 1 km (2 ondalık). Ev adresi tam görünmesin.
export function roundCoarse(p: Pt): Pt {
  return {
    lat: Math.round(p.lat * 100) / 100,
    lng: Math.round(p.lng * 100) / 100,
  };
}

// Buluşma noktası için: yaklaşık 1 metre (5 ondalık).
export function roundFine(p: Pt): Pt {
  return {
    lat: Math.round(p.lat * 100_000) / 100_000,
    lng: Math.round(p.lng * 100_000) / 100_000,
  };
}

export function toMicro(value: number): number {
  return Math.round(value * 1_000_000);
}

export function fromMicro(value: number): number {
  return value / 1_000_000;
}

// İki nokta arası kuş uçuşu mesafe (km).
export function distanceKm(a: Pt, b: Pt): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Çizgiyi en fazla "max" noktaya indirir (ilk ve son nokta korunur), koordinatları 5 ondalığa yuvarlar.
export function thinPath(
  path: [number, number][],
  max: number,
): [number, number][] {
  const rounded = path.map(
    ([lng, lat]) =>
      [Math.round(lng * 100_000) / 100_000, Math.round(lat * 100_000) / 100_000] as [
        number,
        number,
      ],
  );

  if (rounded.length <= max || max < 2) {
    return rounded;
  }

  const out: [number, number][] = [];
  const step = (rounded.length - 1) / (max - 1);

  for (let index = 0; index < max; index += 1) {
    out.push(rounded[Math.round(index * step)]);
  }

  return out;
}

export function routeKey(points: Pt[]): string {
  return `route:${points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|")}`;
}

export function searchKey(query: string): string {
  return `search:${query.toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim().slice(0, 100)}`;
}

function rec(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parsePath(value: unknown): [number, number][] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const out: [number, number][] = [];

  for (const point of value) {
    if (
      Array.isArray(point) &&
      typeof point[0] === "number" &&
      typeof point[1] === "number" &&
      Number.isFinite(point[0]) &&
      Number.isFinite(point[1])
    ) {
      out.push([point[0], point[1]]);
    } else {
      return null;
    }
  }

  return out.length >= 2 ? out : null;
}

function finishRoute(
  distance: unknown,
  duration: unknown,
  coordinates: unknown,
): RouteResult | null {
  const path = parsePath(coordinates);

  if (
    !path ||
    typeof distance !== "number" ||
    typeof duration !== "number" ||
    !Number.isFinite(distance) ||
    !Number.isFinite(duration) ||
    distance <= 0 ||
    duration <= 0
  ) {
    return null;
  }

  return {
    distanceMeters: Math.round(distance),
    durationSeconds: Math.round(duration),
    path: thinPath(path, 400),
  };
}

// OpenRouteService: POST /v2/directions/driving-car/geojson yanıtı.
export function parseOrsRoute(json: unknown): RouteResult | null {
  const root = rec(json);
  const features = root?.features;
  const feature = Array.isArray(features) ? rec(features[0]) : null;
  const summary = rec(rec(feature?.properties)?.summary);

  return finishRoute(
    summary?.distance,
    summary?.duration,
    rec(feature?.geometry)?.coordinates,
  );
}

// OSRM: /route/v1/driving yanıtı (geometries=geojson).
export function parseOsrmRoute(json: unknown): RouteResult | null {
  const root = rec(json);

  if (!root || root.code !== "Ok" || !Array.isArray(root.routes)) {
    return null;
  }

  const route = rec(root.routes[0]);

  return finishRoute(
    route?.distance,
    route?.duration,
    rec(route?.geometry)?.coordinates,
  );
}

// Nominatim: /search (format=jsonv2) yanıtı. En fazla 5 sonuç, yalnızca Türkiye sınırları içindekiler.
export function parseNominatim(json: unknown): Place[] {
  if (!Array.isArray(json)) {
    return [];
  }

  const out: Place[] = [];

  for (const item of json) {
    const row = rec(item);

    if (!row) {
      continue;
    }

    const lat = Number(row.lat);
    const lng = Number(row.lon);
    const label = typeof row.display_name === "string" ? row.display_name : "";

    if (!label || !isValidPoint({ lat, lng })) {
      continue;
    }

    out.push({ label: label.slice(0, 140), lat, lng });

    if (out.length >= 5) {
      break;
    }
  }

  return out;
}

export type GeoInput =
  | { status: "none" }
  | { status: "invalid" }
  | { status: "ok"; origin: Pt; meeting: Pt; dest: Pt };

const GEO_KEYS = [
  "originLat",
  "originLng",
  "meetingLat",
  "meetingLng",
  "destLat",
  "destLng",
] as const;

// Yolculuk formundaki gizli alanları okur. Hiçbiri yoksa harita kullanılmamıştır.
export function parseRideGeoInput(get: (key: string) => string): GeoInput {
  const raw = GEO_KEYS.map((key) => get(key).trim());

  if (raw.every((value) => value === "")) {
    return { status: "none" };
  }

  if (raw.some((value) => value === "")) {
    return { status: "invalid" };
  }

  const numbers = raw.map(Number);

  if (numbers.some((value) => !Number.isFinite(value))) {
    return { status: "invalid" };
  }

  const [oLat, oLng, mLat, mLng, dLat, dLng] = numbers;
  const origin = { lat: oLat, lng: oLng };
  const meeting = { lat: mLat, lng: mLng };
  const dest = { lat: dLat, lng: dLng };

  if (![origin, meeting, dest].every(isValidPoint)) {
    return { status: "invalid" };
  }

  return {
    status: "ok",
    origin: roundCoarse(origin),
    meeting: roundFine(meeting),
    dest: roundCoarse(dest),
  };
}

// /api/rota isteği: tam üç nokta (başlangıç, buluşma, varış).
export function parsePointsBody(body: unknown): Pt[] | null {
  const points = rec(body)?.points;

  if (!Array.isArray(points) || points.length !== 3) {
    return null;
  }

  const parsed = points.map((item) => {
    const row = rec(item);
    return { lat: Number(row?.lat), lng: Number(row?.lng) };
  });

  if (!parsed.every(isValidPoint)) {
    return null;
  }

  return [
    roundCoarse(parsed[0]),
    roundFine(parsed[1]),
    roundCoarse(parsed[2]),
  ];
}