import type { Metadata } from "next";
import Link from "next/link";
import CategoryChips from "@/components/CategoryChips";
import EventCard from "@/components/EventCard";
import { categoryMeta, type EventCategory } from "@/data/events";
import { getEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Etkinlikler | Eventra",
  description: "Yaklaşan etkinlikleri keşfet ve ortak yolculuk planla.",
};

type Props = {
  searchParams: Promise<{ kategori?: string }>;
};

export default async function EventsPage({ searchParams }: Props) {
  const params = await searchParams;
  const active = (Object.keys(categoryMeta) as EventCategory[]).find(
    (category) => category === params.kategori,
  );

  const allEvents = await getEvents();
  const events = active
    ? allEvents.filter((event) => event.category === active)
    : allEvents;

  return (
    <main className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          Bugün hangi etkinliğe gidiyoruz?
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Katılacağın etkinliği seç, aynı yöne gidenlerle yolculuk planla.
        </p>

        <div className="mt-8">
          <CategoryChips active={active} />
        </div>
        <p className="mt-4 text-xs text-muted">
          Bu sayfadaki etkinlikler demo amaçlı kurgusal verilerdir.
        </p>

        {events.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-10 text-center ring-1 ring-black/5">
            <p className="font-bold text-ink">Bu kategoride etkinlik yok</p>
            <p className="mt-1 text-sm text-muted">
              Başka bir kategoriye bakabilir ya da tüm etkinlikleri
              görebilirsin.
            </p>
            <Link
              href="/events"
              className="mt-4 inline-block text-sm font-bold text-violet hover:underline"
            >
              Tümünü gör
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}