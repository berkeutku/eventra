import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventArt from "@/components/EventArt";
import Icon, { categoryIcon, type IconName } from "@/components/Icons";
import RideList from "@/components/RideList";
import { categoryMeta } from "@/data/events";
import { getEventById } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
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

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const meta = categoryMeta[event.category];

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

            <RideList eventId={event.id} />
          </div>
        </div>
      </section>
    </main>
  );
}