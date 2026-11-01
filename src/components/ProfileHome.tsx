import Link from "next/link";
import Icon, { type IconName } from "@/components/Icons";
import RoleToggle from "@/components/RoleToggle";
import { UnreadBadge } from "@/components/UnreadProvider";
import type { AuthUser } from "@/lib/auth";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { pickNextRide } from "@/lib/panel";
import { SECTION_PATHS } from "@/lib/panel-tabs";
import type { RideWithEvent } from "@/lib/ride-utils";
import { roleLabels } from "@/lib/roles";

type Row = {
  href: string;
  icon: IconName;
  tint: string;
  title: string;
  hint: string;
  value?: string;
  badge?: boolean;
};

export default function ProfileHome({
  user,
  driverRides,
  passengerRides,
  favoritesCount,
  earnedBadges,
  totalBadges,
}: {
  user: AuthUser;
  driverRides: RideWithEvent[];
  passengerRides: RideWithEvent[];
  favoritesCount: number;
  earnedBadges: number;
  totalBadges: number;
}) {
  const initial = user.name.trim().charAt(0).toLocaleUpperCase("tr-TR");
  const next = pickNextRide(driverRides, passengerRides);
  const totalRides = driverRides.length + passengerRides.length;
  const isDriver = user.role === "driver";

  const rows: Row[] = [
    {
      href: SECTION_PATHS.yolculuklar,
      icon: "car",
      tint: "bg-lilac text-violet",
      title: "Yolculuklarım",
      hint: `${driverRides.length} oluşturduğum · ${passengerRides.length} katıldığım`,
      value: String(totalRides),
    },
    {
      href: SECTION_PATHS.favoriler,
      icon: "star",
      tint: "bg-peach text-coral-ink",
      title: "Favoriler",
      hint: "Kaydettiğin etkinlikler",
      value: String(favoritesCount),
    },
    {
      href: SECTION_PATHS.basarilar,
      icon: "spark",
      tint: "bg-sea text-mint-ink",
      title: "Başarılar",
      hint: "Tahmini tasarruf ve rozetler",
      value: `${earnedBadges} / ${totalBadges}`,
    },
    {
      href: "/bildirimler",
      icon: "bell",
      tint: "bg-lilac text-violet",
      title: "Bildirimler",
      hint: "Yolculuklarınla ilgili haberler",
      badge: true,
    },
    {
      href: SECTION_PATHS.ayarlar,
      icon: "shield",
      tint: "bg-surface text-ink",
      title: "Ayarlar",
      hint: "Hesap, telefon bildirimi, hesabı silme",
    },
  ];

  const steps = [
    { done: favoritesCount > 0 || totalRides > 0, text: "Bir etkinlik seç" },
    {
      done: totalRides > 0,
      text: isDriver ? "Bir yolculuk oluştur" : "Bir yolculuğa katıl",
    },
    { done: false, text: "Telefon bildirimlerini aç (Ayarlar)" },
  ];

  return (
    <div className="space-y-6">
      <section
        aria-label="Profil"
        className="rounded-3xl bg-white p-6 ring-1 ring-black/5 sm:p-8"
      >
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-violet text-2xl font-extrabold text-white"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
              {user.name}
            </h1>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Aktif rolün
          </p>
          <div className="mt-2">
            <RoleToggle currentRole={user.role} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {isDriver
              ? "Sürücü rolündeyken etkinlikler için yolculuk oluşturabilirsin."
              : "Yolcu rolündeyken etkinliklerdeki yolculuklara katılabilirsin."}
          </p>
        </div>
      </section>

      {next ? (
        <section aria-label="Sıradaki yolculuk">
          <h2 className="px-1 text-sm font-bold uppercase tracking-wider text-muted">
            Sıradaki yolculuğun
          </h2>
          <Link
            href={`/events/${next.ride.eventId}/yolculuk/${next.ride.id}`}
            className="mt-2 block rounded-3xl bg-white p-5 ring-1 ring-black/5 transition-colors hover:bg-lilac/60 sm:p-6"
          >
            <span className="inline-block rounded-full bg-lilac px-3 py-1 text-xs font-bold text-violet">
              {roleLabels[next.role]}
            </span>
            <span className="mt-3 block text-xs font-bold uppercase tracking-wider text-violet">
              {next.ride.eventTitle} · {formatEventDate(next.ride.eventStartsAt)} ·{" "}
              {formatEventTime(next.ride.eventStartsAt)}
            </span>
            <span className="mt-1 block text-xl font-extrabold tracking-tight text-ink">
              {next.ride.origin} → {next.ride.destination}
            </span>
            <span className="mt-1 block text-sm text-muted">
              Kalkış {next.ride.departureTime} · Buluşma: {next.ride.meetingPoint}
              {next.role === "passenger" ? ` · Sürücü: ${next.ride.driverName}` : ""}
            </span>
          </Link>
        </section>
      ) : null}

      {totalRides === 0 ? (
        <section
          aria-label="Başlarken"
          className="rounded-3xl bg-white p-6 ring-1 ring-black/5 sm:p-8"
        >
          <h2 className="text-xl font-extrabold tracking-tight">Başlarken</h2>
          <ol className="mt-4 space-y-3">
            {steps.map((step, index) => (
              <li key={step.text} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                    step.done ? "bg-mint text-night" : "bg-lilac text-violet"
                  }`}
                >
                  {step.done ? <Icon name="check" className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={`text-ink ${step.done ? "line-through opacity-60" : ""}`}
                >
                  {step.text}
                </span>
              </li>
            ))}
          </ol>
          <Link
            href="/events"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky"
          >
            Etkinliklere göz at
          </Link>
        </section>
      ) : null}

      <section aria-label="Profil bölümleri">
        <h2 className="sr-only">Profil bölümleri</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
          {rows.map((row) => (
            <li key={row.title}>
              <Link
                href={row.href}
                className="flex min-h-[4.5rem] items-center gap-4 px-5 py-4 transition-colors hover:bg-lilac/60 active:bg-lilac"
              >
                <span
                  aria-hidden="true"
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${row.tint}`}
                >
                  <Icon name={row.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold text-ink">{row.title}</span>
                  <span className="block truncate text-sm text-muted">
                    {row.hint}
                  </span>
                </span>
                {row.badge ? <UnreadBadge /> : null}
                {row.value ? (
                  <span className="text-sm font-bold text-ink">{row.value}</span>
                ) : null}
                <Icon name="arrow" className="h-4 w-4 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}