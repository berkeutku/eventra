"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthUser } from "@/components/AuthProvider";
import {
  calcArrival,
  calcSharePerPerson,
  departureSortKey,
  type RideItem,
} from "@/lib/ride-utils";

type SortKey = "time" | "cost";

const inputClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

function normalize(text: string): string {
  return text.toLocaleLowerCase("tr-TR");
}

function matchesQuery(ride: RideItem, query: string): boolean {
  if (query === "") {
    return true;
  }
  const haystack = normalize(
    `${ride.origin} ${ride.destination} ${ride.meetingPoint}`,
  );
  return haystack.includes(query);
}

function RideCard({ ride }: { ride: RideItem }) {
  const share = calcSharePerPerson(ride.totalCost, ride.seats);

  return (
    <li className="rounded-2xl border border-line p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight">
            {ride.origin} → {ride.destination}
          </h3>
          <p className="mt-1 text-sm text-muted">Sürücü: {ride.driverName}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold tracking-tight text-violet">
            {share} TL
          </p>
          <p className="text-xs text-muted">tahmini kişi başı</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Buluşma noktası
          </dt>
          <dd className="mt-1 text-sm font-bold">{ride.meetingPoint}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Kalkış → tahmini varış
          </dt>
          <dd className="mt-1 text-sm font-bold">
            {ride.departureTime} →{" "}
            {calcArrival(ride.departureTime, ride.durationMinutes)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Boş koltuk
          </dt>
          <dd className="mt-1 text-sm font-bold">{ride.seats}</dd>
        </div>
      </dl>
    </li>
  );
}

export default function RideList({ rides }: { rides: RideItem[] }) {
  const user = useAuthUser();
  const [query, setQuery] = useState("");
  const [minSeats, setMinSeats] = useState("1");
  const [sort, setSort] = useState<SortKey>("time");

  if (rides.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-surface p-6 text-center">
        <p className="font-bold text-ink">
          Bu etkinlik için henüz yolculuk yok
        </p>
        <p className="mt-1 text-sm text-muted">
          Sürücü olarak giriş yapıp ilk yolculuğu sen oluşturabilirsin.
        </p>
        {!user && (
          <Link
            href="/giris"
            className="mt-4 inline-block text-sm font-bold text-violet hover:underline"
          >
            Giriş sayfasına git &rarr;
          </Link>
        )}
      </div>
    );
  }

  const normalizedQuery = normalize(query.trim());
  const minSeatCount = Number(minSeats);

  const visibleRides = rides
    .filter((ride) => matchesQuery(ride, normalizedQuery))
    .filter((ride) => ride.seats >= minSeatCount)
    .sort((a, b) => {
      if (sort === "cost") {
        return (
          calcSharePerPerson(a.totalCost, a.seats) -
          calcSharePerPerson(b.totalCost, b.seats)
        );
      }
      return (
        departureSortKey(a.departureTime) - departureSortKey(b.departureTime)
      );
    });

  return (
    <div className="mt-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ride-query" className="text-sm font-bold text-ink">
            Ara
          </label>
          <input
            id="ride-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Varış, başlangıç veya buluşma noktası"
            autoComplete="off"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ride-seats" className="text-sm font-bold text-ink">
            En az boş koltuk
          </label>
          <select
            id="ride-seats"
            value={minSeats}
            onChange={(event) => setMinSeats(event.target.value)}
            className={inputClass}
          >
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {count} veya daha fazla
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ride-sort" className="text-sm font-bold text-ink">
            Sırala
          </label>
          <select
            id="ride-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className={inputClass}
          >
            <option value="time">Kalkış saati (erken önce)</option>
            <option value="cost">Kişi başı masraf (düşük önce)</option>
          </select>
        </div>
      </div>

      <p aria-live="polite" className="mt-6 text-sm text-muted">
        {visibleRides.length} yolculuk gösteriliyor
        {visibleRides.length !== rides.length
          ? ` (toplam ${rides.length})`
          : ""}
      </p>

      {visibleRides.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-surface p-6 text-center">
          <p className="font-bold text-ink">Sonuç bulunamadı</p>
          <p className="mt-1 text-sm text-muted">
            Aramayı veya koltuk filtresini değiştirmeyi dene.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setMinSeats("1");
            }}
            className="mt-4 text-sm font-bold text-violet hover:underline"
          >
            Filtreleri temizle
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {visibleRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </ul>
      )}

      <p className="mt-6 rounded-2xl bg-lilac p-4 text-sm text-muted">
        Yolculuğa katılma ve koltuk rezervasyonu bir sonraki adımda eklenecek.
        Şimdilik yolculukları inceleyebilir ve filtreleyebilirsin.
      </p>
    </div>
  );
}