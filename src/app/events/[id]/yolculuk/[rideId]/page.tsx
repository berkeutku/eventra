import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventArt from "@/components/EventArt";
import Icon, { categoryIcon } from "@/components/Icons";
import JoinRideButton from "@/components/JoinRideButton";
import RouteSummary from "@/components/RouteSummary";
import VerifiedBadge from "@/components/VerifiedBadge";
import { categoryMeta } from "@/data/events";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { getEventById } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { leaveRideAction } from "@/lib/ride-actions";
import { getRideDetail, type RideDetail } from "@/lib/ride-queries";
import {
  calcArrival,
  calcSharePerPerson,
  remainingSeats,
} from "@/lib/ride-utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; rideId: string }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const loadPage = cache(async (eventId: string, rideId: string) => {
  if (!UUID_PATTERN.test(rideId)) {
    return null;
  }

  const event = await getEventById(eventId);

  if (!event) {
    return null;
  }

  const user = await getCurrentUser();
  const ride = await getRideDetail(rideId, user?.id);

  if (!ride || ride.eventId !== event.id) {
    return null;
  }

  return { event, ride, user };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, rideId } = await params;
  const data = await loadPage(id, rideId);

  if (!data) {
    return { title: "Yolculuk bulunamadı | Eventra" };
  }

  return {
    title: `${data.ride.origin} → ${data.ride.destination} | Eventra`,
  };
}

function ActionArea({
  ride,
  user,
}: {
  ride: RideDetail;
  user: AuthUser | null;
}) {
  if (!user) {
    return (
      <Link
        href="/giris"
        className="inline-block rounded-full bg-violet px-6 py-3 text-sm font-bold text-white hover:bg-sky"
      >
        Katılmak için giriş yap
      </Link>
    );
  }

  if (ride.isOwn) {
    return (
      <span className="inline-block rounded-full bg-lilac px-4 py-2 text-sm font-bold text-violet">
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
            Yolculuktan ayrıl
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

  if (remainingSeats(ride) === 0) {
    return (
      <span className="inline-block rounded-full bg-peach px-4 py-2 text-sm font-bold text-coral-ink">
        Yolculuk dolu
      </span>
    );
  }

  return <JoinRideButton rideId={ride.id} />;
}

export default async function RideDetailPage({ params }: Props) {
  const { id, rideId } = await params;
  const data = await loadPage(id, rideId);

  if (!data) {
    notFound();
  }

  const { event, ride, user } = data;
  const meta = categoryMeta[event.category];

  const left = remainingSeats(ride);
  const fillPercent = Math.min(
    100,
    Math.round((ride.passengerCount / ride.seats) * 100),
  );
  const peopleNow = ride.passengerCount + 1;
  const shareNow = calcSharePerPerson(ride.totalCost, ride.passengerCount);
  const shareFull = calcSharePerPerson(ride.totalCost, ride.seats);
  const arrival = calcArrival(ride.departureTime, ride.durationMinutes);

  return (
    <main>
      <section className={`relative overflow-hidden text-white ${meta.gradient}`}>
        <EventArt
          category={event.category}
          className="absolute inset-0 h-full w-full"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent"
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-10 pt-8 sm:pb-14 sm:pt-12">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/25"
          >
            &larr; {event.title}
          </Link>
          <div className="mt-12 sm:mt-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-ink">
              <span className={meta.accent}>
                <Icon
                  name={categoryIcon[event.category]}
                  className="h-3.5 w-3.5"
                />
              </span>
              {formatEventDate(event.startsAt)} ·{" "}
              {formatEventTime(event.startsAt)}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {ride.origin} → {ride.destination}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-white/85">
              Sürücü: {ride.driverName}
              {ride.driverVerified && <VerifiedBadge />}
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
            <h2 className="text-2xl font-extrabold tracking-tight">Güzergâh</h2>

            <div className="mt-6 flex gap-4">
              <div className="flex flex-col items-center pt-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-violet" />
                <span className="my-1.5 w-px flex-1 border-l-2 border-dashed border-violet/40" />
                <span className="h-3.5 w-3.5 rounded-full bg-mint" />
              </div>
              <div className="flex flex-1 flex-col gap-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    Buluşma noktası
                  </p>
                  <p className="mt-1 text-lg font-extrabold">
                    {ride.meetingPoint}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <Icon name="clock" className="h-4 w-4" />
                    Kalkış {ride.departureTime} · Başlangıç: {ride.origin}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    Varış noktası
                  </p>
                  <p className="mt-1 text-lg font-extrabold">
                    {ride.destination}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <Icon name="clock" className="h-4 w-4" />
                    Tahmini varış {arrival} · yaklaşık {ride.durationMinutes}{" "}
                    dakika
                  </p>
                </div>
              </div>
            </div>
          </div>

          <RouteSummary
            origin={ride.origin}
            meetingPoint={ride.meetingPoint}
            destination={ride.destination}
            durationMinutes={ride.durationMinutes}
          />

          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Masraf paylaşımı
            </h2>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-surface p-5">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  Toplam yol masrafı
                </dt>
                <dd className="mt-1 text-2xl font-extrabold">
                  {ride.totalCost} TL
                </dd>
              </div>
              <div className="rounded-2xl bg-lilac p-5">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  Şu an kişi başı
                </dt>
                <dd className="mt-1 text-2xl font-extrabold text-violet">
                  {shareNow} TL
                </dd>
                <p className="mt-1 text-xs text-muted">
                  {peopleNow} kişi (sürücü dahil)
                </p>
              </div>
              <div className="rounded-2xl bg-sea p-5">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                  Yolculuk dolunca
                </dt>
                <dd className="mt-1 text-2xl font-extrabold text-mint-ink">
                  {shareFull} TL
                </dd>
                <p className="mt-1 text-xs text-muted">
                  {ride.seats + 1} kişi (sürücü dahil)
                </p>
              </div>
            </dl>

            <p className="mt-4 text-sm text-muted">
              Yol masrafı sürücü dahil herkese eşit bölünür. Kişi başı tutar,
              yolculuğa katılan kişi sayısı arttıkça düşer. Bu yalnızca bir
              tahmindir, Eventra ödeme almaz.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight">
                Koltuklar ve yolcular
              </h2>
              <p className="text-sm font-bold text-ink">
                {left} / {ride.seats} koltuk boş
              </p>
            </div>

            <div
              aria-hidden="true"
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-lilac"
            >
              <div
                className="h-full rounded-full bg-violet"
                style={{ width: `${fillPercent}%` }}
              />
            </div>

            <div className="mt-6">
              {ride.passengers === null ? (
                <p className="rounded-2xl bg-surface p-4 text-sm text-muted">
                  {ride.passengerCount} yolcu katıldı. Yolcu adları gizlilik
                  için yalnızca sürücüye ve yolculuğa katılanlara gösterilir.
                </p>
              ) : ride.passengers.length === 0 ? (
                <p className="rounded-2xl bg-surface p-4 text-sm text-muted">
                  Henüz yolcu katılmadı. Biri katıldığında adı burada görünecek.
                </p>
              ) : (
                <ul className="space-y-3">
                  {ride.passengers.map((passenger, index) => (
                    <li
                      key={`${passenger.name}-${index}`}
                      className="flex items-center gap-3"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-lilac font-bold text-violet">
                        {passenger.name
                          .trim()
                          .charAt(0)
                          .toLocaleUpperCase("tr-TR")}
                      </span>
                      <span className="flex flex-wrap items-center gap-2 font-bold">
                        {passenger.name}
                        {passenger.verified && <VerifiedBadge />}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 border-t border-line pt-6">
              <ActionArea ride={ride} user={user} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}