import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RideList from "@/components/RideList";
import { categoryMeta } from "@/data/events";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { getEventById } from "@/lib/events";

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

  const details = [
    { label: "Tarih", value: formatEventDate(event.startsAt) },
    { label: "Saat", value: formatEventTime(event.startsAt) },
    { label: "Mekan", value: event.venue },
    { label: "Şehir", value: event.city },
  ];

  return (
    <main>
      <section className={`${meta.gradient} px-6 pb-16 pt-10 text-white sm:pb-24`}>
        <div className="mx-auto max-w-4xl">
          <Link
            href="/events"
            className="text-sm font-medium text-white/80 hover:text-white"
          >
            &larr; Tüm etkinlikler
          </Link>
          <span className="mt-10 inline-block rounded-full bg-white/25 px-3.5 py-1 text-xs font-semibold backdrop-blur">
            {meta.label}
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            {event.title}
          </h1>
        </div>
      </section>

      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-3xl bg-white p-8 shadow-md shadow-violet/5 ring-1 ring-line">
            <dl className="grid gap-6 sm:grid-cols-4">
              {details.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-ink">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 leading-relaxed text-muted">
              {event.description}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-md shadow-violet/5 ring-1 ring-line">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight">
                Ortak yolculuklar
              </h2>
              <Link
                href={`/events/${event.id}/yolculuk-olustur`}
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet"
              >
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