import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RideForm from "@/components/RideForm";
import { getEventById } from "@/lib/events";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  return {
    title: event
      ? `Yolculuk Oluştur: ${event.title} | Eventra`
      : "Etkinlik bulunamadı | Eventra",
  };
}

export default async function CreateRidePage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <main className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/events/${event.id}`}
          className="text-sm font-semibold text-violet hover:underline"
        >
          &larr; {event.title}
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
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