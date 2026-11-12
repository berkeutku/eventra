import Link from "next/link";
import RideChat from "@/components/RideChat";
import { getCurrentUser } from "@/lib/auth";
import { getChatStatus, listMessages } from "@/lib/ride-chat";

const shell = "rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8";

// Yalnızca yolculuğun sürücüsüne ve katılan yolculara görünür, bileti doğrulamamış olanlara kilit kartı çıkar.
export default async function RideChatSection({ rideId }: { rideId: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  let status: Awaited<ReturnType<typeof getChatStatus>>;

  try {
    status = await getChatStatus(rideId, user.id);
  } catch (error) {
    console.error(
      "Sohbet yüklenemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return null;
  }

  if (status.status === "none" || status.status === "unavailable") {
    return null;
  }

  if (status.status === "verify_required") {
    return (
      <section id="sohbet" className={shell}>
        <h2 className="text-2xl font-extrabold tracking-tight">
          Yolculuk sohbeti
        </h2>
        <p className="mt-2 text-sm text-muted">
          Bu yolculuğun sohbetini görmek ve yazmak için önce bu etkinliğin
          biletini doğrulamalısın.
        </p>
        <Link
          href={`/events/${status.eventId}#bilet`}
          className="mt-4 inline-flex rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky"
        >
          Bileti doğrula
        </Link>
      </section>
    );
  }

  let items: Awaited<ReturnType<typeof listMessages>> = [];

  try {
    items = await listMessages(rideId, user.id);
  } catch (error) {
    console.error(
      "Mesajlar okunamadı:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return null;
  }

  return (
    <section id="sohbet" className={shell}>
      <h2 className="text-2xl font-extrabold tracking-tight">
        Yolculuk sohbeti
      </h2>
      <RideChat
        rideId={rideId}
        initialItems={items}
        phase={status.access.phase}
        participantCount={status.access.participantIds.length}
      />
    </section>
  );
}