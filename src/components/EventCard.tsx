import Link from "next/link";
import EventCover from "@/components/EventCover";
import Icon, { categoryIcon } from "@/components/Icons";
import { pickEventImage } from "@/data/event-images";
import { categoryMeta, type EventItem } from "@/data/events";
import { formatEventDate, formatEventTime } from "@/lib/format";

export default function EventCard({ event }: { event: EventItem }) {
  const meta = categoryMeta[event.category];
  const image = pickEventImage(event.category, event.id);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-violet/10 ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet/20"
    >
      <div className={`relative h-44 overflow-hidden ${meta.gradient}`}>
        <EventCover
          category={event.category}
          src={image?.src}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/25 to-transparent"
        />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink">
          <span className={meta.accent}>
            <Icon name={categoryIcon[event.category]} className="h-3.5 w-3.5" />
          </span>
          {meta.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-extrabold leading-tight tracking-tight">
          {event.title}
        </h3>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Icon name="pin" className="h-4 w-4 shrink-0" />
          {event.venue}, {event.city}
        </p>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
          <Icon name="calendar" className="h-4 w-4 shrink-0" />
          {formatEventDate(event.startsAt)} · {formatEventTime(event.startsAt)}
        </p>
        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
          {event.description}
        </p>
        <span className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-violet px-5 py-3 text-sm font-bold text-white transition-colors group-hover:bg-sky">
          Yolculukları gör
          <Icon name="arrow" className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}