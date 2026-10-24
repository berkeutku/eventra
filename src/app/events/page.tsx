import type { Metadata } from "next";
import EventCard from "@/components/EventCard";
import { events } from "@/data/events";

export const metadata: Metadata = {
  title: "Etkinlikler | Eventra",
  description: "Yaklaşan etkinlikleri keşfet ve ortak yolculuk planla.",
};

export default function EventsPage() {
  return (
    <main className="bg-surface px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Etkinlikler
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Katılacağın etkinliği seç, aynı yöne gidenlerle yolculuk planla.
        </p>
        <p className="mt-2 text-xs text-muted">
          Bu sayfadaki etkinlikler demo amaçlı kurgusal verilerdir.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </main>
  );
}