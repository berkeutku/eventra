import Link from "next/link";
import RoleToggle from "@/components/RoleToggle";
import type { AuthUser } from "@/lib/auth";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { pickNextRide } from "@/lib/panel";
import { tabHref, type PanelTab } from "@/lib/panel-tabs";
import type { RideWithEvent } from "@/lib/ride-utils";
import { roleLabels } from "@/lib/roles";

export default function PanelOverview({
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
  const isDriver = user.role === "driver";

  const tiles: { tab: PanelTab; label: string; value: string }[] = [
    { tab: "yolculuklar", label: "Oluşturduğum yolculuk", value: String(driverRides.length) },
    { tab: "yolculuklar", label: "Katıldığım yolculuk", value: String(passengerRides.length) },
    { tab: "favoriler", label: "Favori etkinlik", value: String(favoritesCount) },
    { tab: "basarilar", label: "Rozet", value: `${earnedBadges} / ${totalBadges}` },
  ];

  return (
    <div className="space-y-6">
      <section
        aria-label="Profil özeti"
        className="rounded-3xl bg-violet p-6 text-white shadow-lg shadow-violet/20 sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden="true"
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/20 text-2xl font-extrabold"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-white/90">Hoş geldin</p>
              <p className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
                {user.name}
              </p>
              <p className="truncate text-sm text-white/90">{user.email}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/90">
              Aktif rolün
            </p>
            <div className="mt-2">
              <RoleToggle currentRole={user.role} onDark />
            </div>
          </div>
        </div>
        <p className="mt-5 text-sm text-white/90">
          {isDriver
            ? "Sürücü rolündeyken etkinlikler için yolculuk oluşturabilirsin."
            : "Yolcu rolündeyken etkinliklerdeki yolculuklara katılabilirsin."}{" "}
          İstediğin zaman değiştirebilirsin.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tabHref(tile.tab)}
            className="rounded-2xl bg-white p-5 ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet/10"
          >
            <span className="block text-xs font-bold uppercase tracking-wider text-muted">
              {tile.label}
            </span>
            <span className="mt-1 block text-3xl font-extrabold tracking-tight text-ink">
              {tile.value}
            </span>
          </Link>
        ))}
      </div>

      <section className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Sıradaki yolculuğun
        </h2>

        {next ? (
          <Link
            href={`/events/${next.ride.eventId}/yolculuk/${next.ride.id}`}
            className="mt-5 block rounded-2xl border border-line p-5 transition-colors hover:bg-lilac"
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
        ) : (
          <div className="mt-5 rounded-2xl bg-surface p-6 text-center">
            <p className="font-bold text-ink">Yaklaşan bir yolculuğun yok</p>
            <p className="mt-1 text-sm text-muted">
              {isDriver
                ? "Bir etkinlik seç ve boş koltuklarını paylaşmak için yolculuk oluştur."
                : "Bir etkinlik seç ve sana uygun bir yolculuğa katıl."}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/events"
            className="rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky"
          >
            Etkinliklere göz at
          </Link>
          <Link
            href="/bildirimler"
            className="rounded-full border border-line px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-lilac"
          >
            Bildirimlerim
          </Link>
        </div>
      </section>
    </div>
  );
}