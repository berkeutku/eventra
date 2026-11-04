"use client";

import { useMemo, useState } from "react";
import LazyMap from "@/components/LazyMap";
import type { MapMarker } from "@/components/MapView";
import { roundCoarse, roundFine, type Place, type Pt } from "@/lib/geo-rules";

type Slot = "origin" | "meeting" | "dest";

const SLOTS: { key: Slot; label: string; color: string; note: string }[] = [
  { key: "origin", label: "Başlangıç", color: "#6c4dff", note: "yaklaşık (~1 km)" },
  { key: "meeting", label: "Buluşma", color: "#ff6b6b", note: "tam konum" },
  { key: "dest", label: "Varış", color: "#00d5a0", note: "yaklaşık (~1 km)" },
];

type RouteState = {
  distanceMeters: number;
  durationSeconds: number;
  path: [number, number][];
} | null;

const inputClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

// Yolculuk formunun içinde kullanılır: nokta seçildikçe gizli alanlar forma eklenir.
export default function RoutePicker({
  onDuration,
}: {
  onDuration: (minutes: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Slot>("origin");
  const [points, setPoints] = useState<Partial<Record<Slot, Pt>>>({});
  const [route, setRoute] = useState<RouteState>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setPoint(slot: Slot, raw: Pt) {
    const snapped = slot === "meeting" ? roundFine(raw) : roundCoarse(raw);
    const nextSlot = SLOTS.find(
      (item) => item.key !== slot && !points[item.key],
    );

    setPoints((current) => ({ ...current, [slot]: snapped }));
    setRoute(null);
    setNote(null);

    if (nextSlot) {
      setActive(nextSlot.key);
    }
  }

  function clearAll() {
    setPoints({});
    setRoute(null);
    setResults([]);
    setNote(null);
    setActive("origin");
  }

  async function search() {
    const text = query.trim();

    if (text.length < 3) {
      setNote("Aramak için en az 3 harf yaz.");
      return;
    }

    setBusy(true);
    setNote(null);

    try {
      const response = await fetch(`/api/yer-ara?q=${encodeURIComponent(text)}`);

      if (response.status === 401) {
        setNote("Arama için giriş yapmalısın.");
        return;
      }

      if (response.status === 429) {
        setNote("Arama şu an yoğun. Birkaç saniye sonra tekrar dene.");
        return;
      }

      if (!response.ok) {
        setNote(
          "Arama şu an çalışmıyor. Haritaya dokunarak da nokta seçebilirsin.",
        );
        return;
      }

      const data = (await response.json()) as { results?: Place[] };
      const found = data.results ?? [];
      setResults(found);

      if (found.length === 0) {
        setNote("Sonuç bulunamadı. Daha açık yazmayı dene (örn. mahalle ve şehir).");
      }
    } catch {
      setNote("Bağlantı hatası. Lütfen tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  async function calculate() {
    const { origin, meeting, dest } = points;

    if (!origin || !meeting || !dest) {
      setNote("Önce üç noktayı da seç.");
      return;
    }

    setBusy(true);
    setNote(null);

    try {
      const response = await fetch("/api/rota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: [origin, meeting, dest] }),
      });

      if (!response.ok) {
        setNote(
          response.status === 429
            ? "Rota hesabı şu an yoğun. Biraz sonra tekrar dene."
            : "Rota hesaplanamadı. Noktalar yine de kaydedilir, haritada düz çizgi görünür.",
        );
        return;
      }

      const data = (await response.json()) as {
        distanceMeters: number;
        durationSeconds: number;
        path: [number, number][];
      };

      setRoute(data);
      onDuration(
        Math.min(600, Math.max(5, Math.round(data.durationSeconds / 60))),
      );
    } catch {
      setNote("Bağlantı hatası. Lütfen tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  const markers = useMemo<MapMarker[]>(
    () =>
      SLOTS.flatMap((slot) => {
        const point = points[slot.key];

        return point
          ? [
              {
                id: slot.key,
                lng: point.lng,
                lat: point.lat,
                color: slot.color,
                title: `${slot.label} (${slot.note})`,
              },
            ]
          : [];
      }),
    [points],
  );

  const path = route ? route.path : null;
  const complete = Boolean(points.origin && points.meeting && points.dest);

  if (!open) {
    return (
      <div className="rounded-2xl border border-dashed border-violet/40 bg-lilac/40 p-5">
        <p className="text-sm font-extrabold text-ink">
          Haritadan nokta seç{" "}
          <span className="font-normal text-muted">(isteğe bağlı)</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          Noktaları haritada seçersen yolculuğun gerçek rotası, mesafesi ve
          süresi gösterilir.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky"
        >
          Haritayı aç
        </button>
      </div>
    );
  }

  const hidden = complete && points.origin && points.meeting && points.dest;

  return (
    <div className="rounded-2xl border border-violet/30 bg-lilac/40 p-4 sm:p-5">
      {hidden && (
        <>
          <input type="hidden" name="originLat" value={points.origin!.lat} />
          <input type="hidden" name="originLng" value={points.origin!.lng} />
          <input type="hidden" name="meetingLat" value={points.meeting!.lat} />
          <input type="hidden" name="meetingLng" value={points.meeting!.lng} />
          <input type="hidden" name="destLat" value={points.dest!.lat} />
          <input type="hidden" name="destLng" value={points.dest!.lng} />
        </>
      )}

      <p className="text-sm font-extrabold text-ink">Haritadan nokta seç</p>
      <p className="mt-1 text-sm text-muted">
        Önce hangi noktayı seçtiğini işaretle, sonra yer ara ya da haritaya
        dokun.
      </p>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Nokta türü">
        {SLOTS.map((slot) => (
          <button
            key={slot.key}
            type="button"
            aria-pressed={active === slot.key}
            onClick={() => setActive(slot.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              active === slot.key
                ? "bg-night text-white"
                : "bg-white text-ink ring-1 ring-line hover:bg-lilac"
            }`}
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: slot.color }}
            />
            {slot.label}
            {points[slot.key] ? " ✓" : ""}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="geo-query" className="text-sm font-bold text-ink">
            Yer ara
          </label>
          <input
            id="geo-query"
            type="search"
            value={query}
            maxLength={100}
            autoComplete="off"
            placeholder="Örn. Kadıköy iskele"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void search();
              }
            }}
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={() => void search()}
          disabled={busy}
          className="min-h-12 rounded-full bg-violet px-5 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ara
        </button>
      </div>

      {results.length > 0 && (
        <ul className="mt-3 space-y-2">
          {results.map((place) => (
            <li key={`${place.lat},${place.lng}`}>
              <button
                type="button"
                onClick={() => {
                  setPoint(active, { lat: place.lat, lng: place.lng });
                  setResults([]);
                }}
                className="w-full rounded-xl bg-white p-3 text-left text-sm ring-1 ring-line transition-colors hover:bg-lilac"
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <LazyMap
          startOpen
          label="Rota haritası"
          markers={markers}
          path={path}
          onMapClick={(point) => setPoint(active, point)}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void calculate()}
          disabled={busy || !complete}
          className="rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Hesaplanıyor…" : "Rotayı hesapla"}
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac"
        >
          Noktaları temizle
        </button>
      </div>

      {route && (
        <p role="status" className="mt-3 text-sm font-bold text-mint-ink">
          Yaklaşık {Math.max(1, Math.round(route.distanceMeters / 1000))} km ·
          yaklaşık {Math.round(route.durationSeconds / 60)} dakika. Süre alanı
          dolduruldu, istersen değiştirebilirsin.
        </p>
      )}

      {note && (
        <p role="status" className="mt-3 text-sm font-medium text-coral-ink">
          {note}
        </p>
      )}

      <p className="mt-3 text-xs text-muted">
        Gizlilik: başlangıç ve varış noktaları yaklaşık 1 km hassasiyetle
        kaydedilir ve gösterilir, ev adresin tam olarak görünmez. Buluşma
        noktası tam görünür, bu yüzden herkese açık bir yer seç. Rota hesabı
        tahmindir, trafik içermez. Yer araması © OpenStreetMap katkıcıları.
      </p>
    </div>
  );
}