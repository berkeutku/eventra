import Link from "next/link";
import { formatEventDate, formatEventTime } from "@/lib/format";
import type { FavoriteEvent } from "@/lib/favorites";

export default function FavoritesCard({ events }: { events: FavoriteEvent[] }) {
  const nowMs = new Date().getTime();

  return (
    <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
      <h2 className="text-2xl font-extrabold tracking-tight">
        Favori etkinliklerim
      </h2>
      <p className="mt-2 text-sm text-muted">
        Favorilerin yalnızca sana görünür ve hesabını silersen birlikte silinir.
      </p>

      {events.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-surface p-6 text-center">
          <p className="font-bold text-ink">Henüz favori etkinliğin yok</p>
          <p className="mt-1 text-sm text-muted">
            Bir etkinliğin sayfasında &quot;Favorilere ekle&quot; düğmesine bas.
          </p>
          <Link
            href="/events"
            className="mt-4 inline-block text-sm font-bold text-violet hover:underline"
          >
            Etkinliklere git &rarr;
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {events.map((event) => {
            const past = new Date(event.startsAt).getTime() < nowMs;

            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block rounded-2xl border border-line p-4 transition-colors hover:bg-lilac"
                >
                  <span className="block font-extrabold text-ink">
                    {event.title}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {formatEventDate(event.startsAt)} ·{" "}
                    {formatEventTime(event.startsAt)} · {event.venue},{" "}
                    {event.city}
                    {past ? " · Etkinlik tarihi geçti" : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}