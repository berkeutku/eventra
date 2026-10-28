"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuthUser } from "@/components/AuthProvider";
import JoinRideButton from "@/components/JoinRideButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import { scoreRides, type ScoredRide } from "@/lib/matching";
import { leaveRideAction } from "@/lib/ride-actions";
import {
  calcArrival,
  calcSharePerPerson,
  departureSortKey,
  remainingSeats,
  type RideItem,
} from "@/lib/ride-utils";

type SortKey = "match" | "time" | "cost";

const inputClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

const primaryLink =
  "inline-flex items-center justify-center rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky";
const secondaryLink =
  "inline-flex items-center justify-center rounded-full border border-line px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-lilac";

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

function scoreTone(score: number): string {
  if (score >= 75) {
    return "bg-sea text-mint-ink";
  }
  if (score >= 45) {
    return "bg-lilac text-violet";
  }
  return "bg-surface text-muted";
}

function RideAction({ ride }: { ride: RideItem }) {
  const user = useAuthUser();
  const left = remainingSeats(ride);

  if (!user) {
    return (
      <Link href="/giris" className={primaryLink}>
        Katılmak için giriş yap
      </Link>
    );
  }

  if (ride.isOwn) {
    return (
      <span className="inline-flex items-center rounded-full bg-lilac px-4 py-2.5 text-sm font-bold text-violet">
        Bu senin yolculuğun
      </span>
    );
  }

  if (ride.joined) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-sea px-4 py-2.5 text-sm font-bold text-mint-ink">
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
            className="rounded-full border border-line px-4 py-2.5 text-sm font-bold text-ink hover:bg-lilac"
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
        Yolculuğa katılmak için Yolcu rolünde olmalısın.{" "}
        <Link href="/panel" className="font-bold text-violet hover:underline">
          Panele git &rarr;
        </Link>
      </p>
    );
  }

  if (left === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-peach px-4 py-2.5 text-sm font-bold text-coral-ink">
        Yolculukta yer kalmadı
      </span>
    );
  }

  return <JoinRideButton rideId={ride.id} />;
}

function RideCard({
  item,
  showScore,
  best,
}: {
  item: ScoredRide;
  showScore: boolean;
  best: boolean;
}) {
  const ride = item.ride;
  const share = calcSharePerPerson(ride.totalCost, ride.seats);
  const left = remainingSeats(ride);
  const showBadge = showScore && !item.full;

  return (
    <li
      className={`rounded-2xl border bg-white p-5 sm:p-6 ${
        best ? "border-violet ring-2 ring-violet/20" : "border-line"
      }`}
    >
      {(best || showBadge) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {best && (
            <span className="rounded-full bg-violet px-3 py-1 text-xs font-bold text-white">
              En uygun
            </span>
          )}
          {showBadge && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${scoreTone(item.score)}`}
            >
              %{item.score} uyum
            </span>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold leading-snug tracking-tight">
            {ride.origin} → {ride.destination}
          </h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span>Sürücü: {ride.driverName}</span>
            {ride.driverVerified && <VerifiedBadge />}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-extrabold tracking-tight text-violet">
            {share} TL
          </p>
          <p className="text-xs text-muted">kişi başı, tahmini</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 rounded-xl bg-surface p-4 sm:grid-cols-3">
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

      {showScore && (
        <details className="mt-4 rounded-xl border border-line p-3 text-sm">
          <summary className="cursor-pointer font-bold text-ink">
            Neden bu puan?
          </summary>
          <ul className="mt-3 space-y-3">
            {item.reasons.map((reason) => (
              <li
                key={reason.key}
                className="flex items-start justify-between gap-3"
              >
                <span>
                  <span className="block font-bold text-ink">
                    {reason.label}
                  </span>
                  <span className="block text-muted">{reason.detail}</span>
                </span>
                <span className="shrink-0 font-bold text-violet">
                  {reason.points} / {reason.max}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Puan, bu kurallara göre hesaplanır. Yapay zekâ kullanılmaz.
          </p>
        </details>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <RideAction ride={ride} />
        <Link
          href={`/events/${ride.eventId}/yolculuk/${ride.id}`}
          className="inline-flex items-center justify-center rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac"
        >
          Detayları gör
        </Link>
      </div>
    </li>
  );
}

function EmptyRides({ eventId }: { eventId: string }) {
  const user = useAuthUser();

  return (
    <div className="mt-8 rounded-2xl bg-surface p-6 text-center sm:p-8">
      <p className="text-lg font-extrabold text-ink">
        Bu etkinlik için henüz yolculuk oluşturulmamış
      </p>

      {!user && (
        <>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Hesap oluştur, Sürücü rolüne geçip ilk yolculuğu sen aç ya da
            başkası bir yolculuk açtığında katıl.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/kayit" className={primaryLink}>
              Kayıt ol
            </Link>
            <Link href="/giris" className={secondaryLink}>
              Giriş yap
            </Link>
          </div>
        </>
      )}

      {user?.role === "driver" && (
        <>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            İlk yolculuğu sen oluştur, aynı etkinliğe gidenler seni burada
            bulsun.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              href={`/events/${eventId}/yolculuk-olustur`}
              className={primaryLink}
            >
              Yolculuk oluştur
            </Link>
          </div>
        </>
      )}

      {user?.role === "passenger" && (
        <>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Bir sürücü yolculuk açtığında burada görünecek. Sen de yolculuk
            oluşturmak istersen panelinden Sürücü rolüne geçebilirsin.
          </p>
          <div className="mt-5 flex justify-center">
            <Link href="/panel" className={secondaryLink}>
              Panele git
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function RideList({
  rides,
  eventId,
}: {
  rides: RideItem[];
  eventId: string;
}) {
  const [query, setQuery] = useState("");
  const [minSeats, setMinSeats] = useState("0");
  const [sort, setSort] = useState<SortKey | null>(null);
  const [destination, setDestination] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const scored = useMemo(
    () => scoreRides(rides, { destination, preferredTime }),
    [rides, destination, preferredTime],
  );

  if (rides.length === 0) {
    return <EmptyRides eventId={eventId} />;
  }

  const hasPreference = destination.trim() !== "" || preferredTime !== "";
  const activeSort: SortKey = sort ?? (hasPreference ? "match" : "time");
  const showScore = activeSort === "match";
  const normalizedQuery = normalize(query.trim());
  const minSeatCount = Number(minSeats);

  const visibleRides = scored
    .filter((item) => matchesQuery(item.ride, normalizedQuery))
    .filter((item) => remainingSeats(item.ride) >= minSeatCount)
    .sort((a, b) => {
      if (activeSort === "match") {
        if (a.full !== b.full) {
          return a.full ? 1 : -1;
        }
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (
          departureSortKey(a.ride.departureTime) -
          departureSortKey(b.ride.departureTime)
        );
      }

      if (activeSort === "cost") {
        return (
          calcSharePerPerson(a.ride.totalCost, a.ride.seats) -
          calcSharePerPerson(b.ride.totalCost, b.ride.seats)
        );
      }

      return (
        departureSortKey(a.ride.departureTime) -
        departureSortKey(b.ride.departureTime)
      );
    });

  const bestId =
    showScore && hasPreference
      ? visibleRides.find((item) => !item.full && item.score > 0)?.ride.id
      : undefined;

  return (
    <div className="mt-8">
      <div className="rounded-2xl bg-lilac/60 p-4 sm:p-5">
        <p className="text-sm font-extrabold">Sana uygun yolculuğu bul</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ride-destination"
              className="text-sm font-bold text-ink"
            >
              Nereye gidiyorsun?
            </label>
            <input
              id="ride-destination"
              type="text"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Örn. Kadıköy"
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ride-time" className="text-sm font-bold text-ink">
              Hangi saatte çıkmak istiyorsun?{" "}
              <span className="font-normal text-muted">(isteğe bağlı)</span>
            </label>
            <input
              id="ride-time"
              type="time"
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Puan: varış yeri en fazla 50, kalkış saati 20, kişi başı masraf 20,
          boş koltuk 10. Girmediğin tercihler puana katılmaz. Her kartta
          nedenini görebilirsin, yapay zekâ kullanılmaz.
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ride-query" className="text-sm font-bold text-ink">
            Ara (filtre)
          </label>
          <input
            id="ride-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Başlangıç, varış veya buluşma noktası"
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
            value={activeSort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className={inputClass}
          >
            <option value="match">Uyum puanı (önerilen)</option>
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
        <ul className="mt-4 space-y-5">
          {visibleRides.map((item) => (
            <RideCard
              key={item.ride.id}
              item={item}
              showScore={showScore}
              best={item.ride.id === bestId}
            />
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