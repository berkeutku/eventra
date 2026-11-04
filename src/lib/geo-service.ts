import { eq, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { geoCache } from "../db/schema";
import {
  parseNominatim,
  parseOrsRoute,
  parseOsrmRoute,
  routeKey,
  searchKey,
  type Place,
  type Pt,
  type RouteResult,
} from "./geo-rules";

// Bu dosya hem uygulamadan hem test betiğinden çağrıldığı için göreli içe aktarımlar kullanıyor.

const USER_AGENT = "Eventra-demo/1.0 (+https://github.com/berkeutku/eventra)";
const SEARCH_TTL_MS = 30 * 24 * 3_600_000;
const ROUTE_TTL_MS = 7 * 24 * 3_600_000;
const MIN_INTERVAL_SECONDS = 1.1;

type Options = { fetcher?: typeof fetch; prefix?: string };

// Dış hizmete en az "seconds" saniye arayla istek gitmesini sağlar (tüm kullanıcılar için ortak).
// Hakkı alırsa true, çok sıkışıksa false döner.
export async function claimThrottle(
  provider: string,
  seconds: number = MIN_INTERVAL_SECONDS,
): Promise<boolean> {
  const result = await db.execute(
    sql`insert into api_throttle (provider, last_at) values (${provider}, now())
        on conflict (provider) do update set last_at = now()
        where api_throttle.last_at <= now() - ${seconds}::float8 * interval '1 second'
        returning provider`,
  );

  return result.rows.length > 0;
}

export async function cacheGet(
  key: string,
  ttlMs: number,
): Promise<string | null> {
  const [row] = await db
    .select({ payload: geoCache.payload, createdAt: geoCache.createdAt })
    .from(geoCache)
    .where(eq(geoCache.key, key))
    .limit(1);

  if (!row || Date.now() - row.createdAt.getTime() > ttlMs) {
    return null;
  }

  return row.payload;
}

export async function cachePut(key: string, payload: string): Promise<void> {
  await db
    .insert(geoCache)
    .values({ key, payload })
    .onConflictDoUpdate({
      target: geoCache.key,
      set: { payload, createdAt: new Date() },
    });

  // 60 günden eski kayıtlar temizlenir.
  await db
    .delete(geoCache)
    .where(lt(geoCache.createdAt, new Date(Date.now() - 60 * 24 * 3_600_000)));
}

export type SearchOutcome =
  | { status: "ok"; places: Place[] }
  | { status: "busy" }
  | { status: "failed" };

// Adres arama (Nominatim). Sonuçlar önbelleğe alınır, istekler ortak hız sınırından geçer.
export async function searchPlaces(
  query: string,
  options: Options = {},
): Promise<SearchOutcome> {
  const fetcher = options.fetcher ?? fetch;
  const key = searchKey(query);
  const cached = await cacheGet(key, SEARCH_TTL_MS);

  if (cached) {
    try {
      return { status: "ok", places: JSON.parse(cached) as Place[] };
    } catch {
      // Bozuk önbellek kaydı: yeniden sorulur.
    }
  }

  if (!(await claimThrottle(`${options.prefix ?? ""}nominatim`))) {
    return { status: "busy" };
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query.trim());
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "tr");
    url.searchParams.set("accept-language", "tr");

    const response = await fetcher(url, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return { status: "failed" };
    }

    const places = parseNominatim(await response.json());
    await cachePut(key, JSON.stringify(places));
    return { status: "ok", places };
  } catch {
    return { status: "failed" };
  }
}

export type RouteOutcome =
  | { status: "ok"; route: RouteResult; source: "cache" | "ors" | "osrm" }
  | { status: "busy" }
  | { status: "failed" };

async function fetchOrs(
  points: Pt[],
  fetcher: typeof fetch,
): Promise<RouteResult | null> {
  const apiKey = process.env.ORS_API_KEY;

  if (!apiKey) {
    return null;
  }

  const base = (
    process.env.ORS_BASE_URL ?? "https://api.heigit.org/openrouteservice"
  ).replace(/\/$/, "");

  try {
    const response = await fetcher(`${base}/v2/directions/driving-car/geojson`, {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: points.map((p) => [p.lng, p.lat]) }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    return response.ok ? parseOrsRoute(await response.json()) : null;
  } catch {
    return null;
  }
}

async function fetchOsrm(
  points: Pt[],
  fetcher: typeof fetch,
): Promise<RouteResult | null> {
  const coordinates = points.map((p) => `${p.lng},${p.lat}`).join(";");

  try {
    const response = await fetcher(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
      {
        headers: { "User-Agent": USER_AGENT },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );

    return response.ok ? parseOsrmRoute(await response.json()) : null;
  } catch {
    return null;
  }
}

// Rota: önce önbellek, sonra (anahtar varsa) OpenRouteService, sonra OSRM demo sunucusu.
export async function getRoute(
  points: Pt[],
  options: Options = {},
): Promise<RouteOutcome> {
  if (points.length < 2 || points.length > 4) {
    return { status: "failed" };
  }

  const fetcher = options.fetcher ?? fetch;
  const prefix = options.prefix ?? "";
  const key = routeKey(points);
  const cached = await cacheGet(key, ROUTE_TTL_MS);

  if (cached) {
    try {
      const route = JSON.parse(cached) as RouteResult;

      if (Array.isArray(route.path) && route.path.length >= 2) {
        return { status: "ok", route, source: "cache" };
      }
    } catch {
      // Bozuk önbellek kaydı: yeniden hesaplanır.
    }
  }

  let busy = false;

  if (process.env.ORS_API_KEY) {
    if (await claimThrottle(`${prefix}ors`, 1.5)) {
      const route = await fetchOrs(points, fetcher);

      if (route) {
        await cachePut(key, JSON.stringify(route));
        return { status: "ok", route, source: "ors" };
      }
    } else {
      busy = true;
    }
  }

  if (await claimThrottle(`${prefix}osrm`)) {
    const route = await fetchOsrm(points, fetcher);

    if (route) {
      await cachePut(key, JSON.stringify(route));
      return { status: "ok", route, source: "osrm" };
    }
  } else {
    busy = true;
  }

  return busy ? { status: "busy" } : { status: "failed" };
}