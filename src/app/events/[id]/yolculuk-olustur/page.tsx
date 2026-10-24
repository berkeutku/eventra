import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RideForm from "@/components/RideForm";
import { events } from "@/data/events";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return events.map((event) => ({ id: event.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = events.find((item) => item.id === id);

  return {
    title: event
      ? `Yolculuk Oluştur: ${event.title} | Eventra`
      : "Etkinlik bulunamadı | Eventra",
  };
}

export default async function CreateRidePage({ params }: Props) {
  const { id } = await params;
  const event = events.find((item) => item.id === id);

  if (!event) {
    notFound();
  }

  return (
    <main className="bg-surface px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/events/${event.id}`}
          className="text-sm font-medium text-sky hover:text-violet"
        >
          &larr; {event.title}
        </Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          Yolculuk oluştur
        </h1>
        <p className="mt-4 text-lg text-muted">
          {event.venue}, {event.city} çıkışı için boş koltuklarını paylaş.
        </p>

        <div className="mt-8">
          <RideForm eventId={event.id} eventTitle={event.title} />
        </div>
      </div>
    </main>
  );
}