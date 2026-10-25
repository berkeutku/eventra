"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthUser } from "@/components/AuthProvider";
import JoinRideButton from "@/components/JoinRideButton";
import { leaveRideAction } from "@/lib/ride-actions";
import {
  calcArrival,
  calcSharePerPerson,
  departureSortKey,
  remainingSeats,
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

function RideAction({ ride }: { ride: RideItem }) {
  const user = useAuthUser();
  const left = remainingSeats(ride);

  if (!user) {
    return (
      <Link
        href="/giris"
        className="text-sm font-bold text-violet hover:underline"
      >
        Katılmak için giriş yap &rarr;
      </Link>
    );
  }

  if (ride.isOwn) {
    return (
      <span className="rounded-full bg-lilac px-4 py-2 text-sm font-bold text-violet">
        Bu senin yolculuğun
      </span>
    );
  }

  if (ride.joined) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-sea px-4 py-2 text-sm font-bold text-mint-ink">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-mint"
          />
          Bu yolculuğa katıldın
        </span>
        <form action={leaveRideAction}>
          <input type="hidden" name="rideId" value={ride.id} />
          <button
            type="submit"
            className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-lilac"
          >
            Ayrıl
          </button>
        </form>
      </div>
    );
  }

  if (user.role !== "passenger") {
    return (
      <p className="text-sm text-muted">
        Yolculuğa katılmak için Yolcu rolünde bir hesap gerekir.
      </p>
    );
  }

  if (left === 0) {
    return (
      <span className="rounded-full bg-peach px-4 py-2 text-sm font-bold text-coral-ink">
        Yolculuk dolu
      </span>
    );
  }

  return <JoinRideButton rideId={ride.id} />;
}

function RideCard({ ride }: { ride: RideItem }) {
  const share = calcSharePerPerson(ride.totalCost, ride.seats);
  const left = remainingSeats(ride);

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
          <dd className="mt-1 text-sm font-bold">
            {left} / {ride.seats}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <RideAction ride={ride} />
        <Link
          href={`/events/${ride.eventId}/yolculuk/${ride.id}`}
          className="text-sm font-bold text-violet hover:underline"
        >
          Detayları gör &rarr;
        </Link>
      </div>
    </li>
  );
}

export default function RideList({ rides }: { rides: RideItem[] }) {
  const user = useAuthUser();
  const [query, setQuery] = useState("");
  const [minSeats, setMinSeats] = useState("0");
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
    .filter((ride) => remainingSeats(ride) >= minSeatCount)
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
            <option value="0">Tümü (dolu olanlar dahil)</option>
            {[1, 2, 3].map((count) => (
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
              setMinSeats("0");
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
        Katılmak ücretsizdir ve ödeme gerektirmez. Eventra ödeme almaz, masraf
        paylaşımı tahminidir ve sürücüyle yüz yüze ayarlanır.
      </p>
    </div>
  );
}