import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventArt from "@/components/EventArt";
import Icon, { categoryIcon, type IconName } from "@/components/Icons";
import RideList from "@/components/RideList";
import ShareButton from "@/components/ShareButton";
import TicketVerificationCard from "@/components/TicketVerificationCard";
import { isTicketVerified } from "@/lib/ticket-queries";
import { categoryMeta } from "@/data/events";
import { getEventById } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { getRidesForEvent } from "@/lib/ride-queries";
import { calcSharePerPerson, remainingSeats } from "@/lib/ride-utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ yolculuk?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    return { title: "Etkinlik bulunamadı | Eventra" };
  }

  return {
    title: `${event.title} | Eventra`,
    description: event.description,
  };
}

// Takvim günü farkı (Türkiye saatine göre). Bugün 0, yarın 1, geçmiş negatif.
function daysUntil(iso: string): number {
  const toDay = (date: Date) =>
    date.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
  const toUtc = (day: string) => {
    const [year, month, date] = day.split("-").map(Number);
    return Date.UTC(year, month - 1, date);
  };

  return Math.round(
    (toUtc(toDay(new Date(iso))) - toUtc(toDay(new Date()))) / 86_400_000,
  );
}

function countdownLabel(days: number): string {
  if (days < 0) {
    return "Etkinlik tarihi geçti";
  }
  if (days === 0) {
    return "Bugün";
  }
  if (days === 1) {
    return "Yarın";
  }
  return `${days} gün sonra`;
}

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const user = await getCurrentUser();
  const rides = await getRidesForEvent(event.id, user?.id);
  const verified = user ? await isTicketVerified(user.id, event.id) : false;
  const meta = categoryMeta[event.category];

  const openSeats = rides.reduce((sum, ride) => sum + remainingSeats(ride), 0);
  const shares = rides.map((ride) =>
    calcSharePerPerson(ride.totalCost, ride.seats),
  );
  const lowestShare = shares.length > 0 ? Math.min(...shares) : null;

  const stats: { label: string; value: string }[] = [
    { label: "Etkinliğe kalan", value: countdownLabel(daysUntil(event.startsAt)) },
    { label: "Açık yolculuk", value: String(rides.length) },
    { label: "Toplam boş koltuk", value: String(openSeats) },
    {
      label: "En düşük kişi başı (tahmini)",
      value: lowestShare === null ? "—" : `${lowestShare} TL`,
    },
  ];

  const details: { label: string; value: string; icon: IconName }[] = [
    { label: "Tarih", value: formatEventDate(event.startsAt), icon: "calendar" },
    { label: "Saat", value: formatEventTime(event.startsAt), icon: "clock" },
    { label: "Mekan", value: `${event.venue}, ${event.city}`, icon: "pin" },
  ];

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
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-8 sm:pb-16 sm:pt-12">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/25"
          >
            &larr; Tüm etkinlikler
          </Link>
          <div className="mt-16 sm:mt-24">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-ink">
              <span className={meta.accent}>
                <Icon
                  name={categoryIcon[event.category]}
                  className="h-3.5 w-3.5"
                />
              </span>
              {meta.label}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              {event.title}
            </h1>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl space-y-6">
          {query.yolculuk === "olusturuldu" && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-2xl bg-sea p-4 font-bold text-mint-ink"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint text-night">
                <Icon name="check" className="h-4 w-4" />
              </span>
              Yolculuğun oluşturuldu ve aşağıdaki listede görünüyor.
            </div>
          )}

          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
            <dl className="grid gap-6 sm:grid-cols-3">
              {details.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.soft} ${meta.accent}`}
                  >
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                      {item.label}
                    </dt>
                    <dd className="mt-0.5 font-bold text-ink">{item.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-8 leading-relaxed text-muted">
              {event.description}
            </p>
            <div className="mt-6">
              <ShareButton title={event.title} />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight">
                Ortak yolculuklar
              </h2>
              <Link
                href={`/events/${event.id}/yolculuk-olustur`}
                className="inline-flex items-center gap-2 rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky"
              >
                <Icon name="car" className="h-4 w-4" />
                Yolculuk Oluştur
              </Link>
            </div>
            <p className="mt-2 text-muted">
              Bu etkinliğe giden sürücülerin paylaştığı yolculuklar.
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-surface p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-xl font-extrabold tracking-tight text-ink">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            <TicketVerificationCard eventId={event.id} verified={verified} />
            <RideList rides={rides} eventId={event.id} />
          </div>
        </div>
      </section>
    </main>
  );
}