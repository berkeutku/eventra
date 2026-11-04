import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import RideEditForm from "@/components/RideEditForm";
import { getCurrentUser } from "@/lib/auth";
import { rideBlockMessages, rideCreationBlockReason } from "@/lib/event-rules";
import { getEventById } from "@/lib/events";
import { getRideDetail } from "@/lib/ride-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Yolculuğu düzenle | Eventra" };

type Props = {
  params: Promise<{ id: string; rideId: string }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Notice({
  title,
  text,
  href,
}: {
  title: string;
  text: string;
  href: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-2 text-muted">{text}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-full bg-violet px-6 py-3 text-sm font-bold text-white hover:bg-sky"
      >
        Yolculuğa dön
      </Link>
    </div>
  );
}

export default async function EditRidePage({ params }: Props) {
  const { id, rideId } = await params;

  if (!UUID_PATTERN.test(rideId)) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/giris?next=/events/${id}/yolculuk/${rideId}/duzenle`);
  }

  const event = await getEventById(id);
  const ride = event ? await getRideDetail(rideId, user.id) : null;

  if (!event || !ride || ride.eventId !== event.id) {
    notFound();
  }

  const backHref = `/events/${event.id}/yolculuk/${ride.id}`;
  const blocked = rideCreationBlockReason(event);

  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-violet hover:underline"
        >
          &larr; Yolculuğa dön
        </Link>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Yolculuğu düzenle
        </h1>
        <p className="mt-2 text-muted">{event.title}</p>

        <div className="mt-6">
          {!ride.isOwn ? (
            <Notice
              title="Bu yolculuğu düzenleyemezsin"
              text="Bir yolculuğu yalnızca onu oluşturan sürücü düzenleyebilir."
              href={backHref}
            />
          ) : blocked ? (
            <Notice
              title="Bu yolculuk şu an düzenlenemiyor"
              text={rideBlockMessages[blocked]}
              href={backHref}
            />
          ) : (
            <RideEditForm
              rideId={ride.id}
              eventId={event.id}
              passengerCount={ride.passengerCount}
              initial={{
                origin: ride.origin,
                destination: ride.destination,
                meetingPoint: ride.meetingPoint,
                departureTime: ride.departureTime,
                duration: String(ride.durationMinutes),
                seats: String(ride.seats),
                cost: String(ride.totalCost),
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}