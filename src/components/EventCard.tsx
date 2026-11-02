import Link from "next/link";
import EventCover from "@/components/EventCover";
import Icon, { categoryIcon } from "@/components/Icons";
import { pickEventImage } from "@/data/event-images";
import { categoryMeta, type EventItem } from "@/data/events";
import { formatEventTime } from "@/lib/format";

const TIME_ZONE = "Europe/Istanbul";

export default function EventCard({
  event,
  headingLevel = 3,
}: {
  event: EventItem;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const meta = categoryMeta[event.category];
  const isReal = event.source === "biletimgo";
  const image = event.imageUrl ?? pickEventImage(event.category, event.id)?.src;
  const date = new Date(event.startsAt);
  const day = date.toLocaleDateString("tr-TR", {
    day: "numeric",
    timeZone: TIME_ZONE,
  });
  const month = date.toLocaleDateString("tr-TR", {
    month: "short",
    timeZone: TIME_ZONE,
  });

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition-all hover:shadow-soft motion-safe:hover:-translate-y-1 motion-safe:hover:rotate-[0.4deg]"
    >
      <div className={`event-zoom relative h-44 overflow-hidden ${meta.gradient}`}>
        <EventCover
          category={event.category}
          src={image}
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
        <span className="absolute right-4 top-4 -rotate-2 rounded-lg bg-sun px-2.5 py-1 text-xs font-bold text-[#412402]">
          {isReal ? "biletimGO" : "Demo etkinlik"}
        </span>
      </div>

      <div aria-hidden="true" className="relative z-10 h-0">
        <span className="absolute -left-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-surface" />
        <span className="absolute -right-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-surface" />
        <div className="mx-6 border-t-2 border-dashed border-violet/25" />
      </div>

      <div className="flex flex-1 flex-col p-5 pt-6">
        <div className="flex gap-4">
          <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-lilac text-violet">
            <span className="block text-2xl font-extrabold leading-none">
              {day}
            </span>
            <span className="mt-0.5 block text-xs font-bold">{month}</span>
          </div>
          <div className="min-w-0 flex-1">
            <Heading className="text-lg font-extrabold leading-tight tracking-tight">
              {event.title}
            </Heading>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <Icon name="pin" className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                {event.venue}, {event.city}
              </span>
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Icon name="clock" className="h-4 w-4 shrink-0" />
              {formatEventTime(event.startsAt)}
              {isReal && event.priceText ? ` · ${event.priceText}` : ""}
            </p>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
          {event.description}
        </p>
        <span className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-violet px-5 py-3 text-sm font-bold text-white transition-colors group-hover:bg-sky">
          Yola çıkalım
          <Icon name="arrow" className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}