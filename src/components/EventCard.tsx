import Link from "next/link";
import { categoryMeta, type EventItem } from "@/data/events";
import { formatEventDate, formatEventTime } from "@/lib/format";

export default function EventCard({ event }: { event: EventItem }) {
  const meta = categoryMeta[event.category];

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-md shadow-violet/5 ring-1 ring-line transition-all hover:-translate-y-1.5 hover:rotate-[-0.5deg] hover:shadow-xl hover:shadow-violet/15"
    >
      <div className={`${meta.gradient} px-6 pb-8 pt-6 text-white`}>
        <span className="inline-block rounded-full bg-white/25 px-3.5 py-1 text-xs font-semibold backdrop-blur">
          {meta.label}
        </span>
        <h3 className="mt-6 text-2xl font-bold leading-tight tracking-tight">
          {event.title}
        </h3>
      </div>

      <div className="relative" aria-hidden="true">
        <div className="mx-8 border-t-2 border-dashed border-line" />
        <span className="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-surface ring-1 ring-line" />
        <span className="absolute -right-4 -top-4 h-8 w-8 rounded-full bg-surface ring-1 ring-line" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-semibold text-ink">
          {event.venue}, {event.city}
        </p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {event.description}
        </p>

        <div
          className={`${meta.soft} mt-5 flex items-center justify-between rounded-2xl px-4 py-3`}
        >
          <div>
            <p className="text-xs font-medium text-muted">
              {formatEventDate(event.startsAt)}
            </p>
            <p className="text-lg font-bold tracking-tight">
              {formatEventTime(event.startsAt)}
            </p>
          </div>
          <span className="text-sm font-semibold text-ink group-hover:translate-x-1 transition-transform">
            Detaylar &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}