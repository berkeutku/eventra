import type { Metadata } from "next";
import EventCard from "@/components/EventCard";
import { getEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Etkinlikler | Eventra",
  description: "Yaklaşan etkinlikleri keşfet ve ortak yolculuk planla.",
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Etkinlikler
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Katılacağın etkinliği seç, aynı yöne gidenlerle yolculuk planla.
        </p>
        <p className="mt-2 text-xs text-muted">
          Bu sayfadaki etkinlikler demo amaçlı kurgusal verilerdir.
        </p>

        {events.length === 0 ? (
          <div className="mt-12 rounded-3xl bg-white p-10 text-center ring-1 ring-line">
            <p className="font-semibold text-ink">Henüz etkinlik yok</p>
            <p className="mt-1 text-sm text-muted">
              Veritabanında gösterilecek etkinlik bulunamadı.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}