import RideChat from "@/components/RideChat";
import { getCurrentUser } from "@/lib/auth";
import { loadChat } from "@/lib/ride-chat";

// Yalnızca yolculuğun sürücüsüne ve katılan yolculara görünür.
export default async function RideChatSection({ rideId }: { rideId: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  let chat: Awaited<ReturnType<typeof loadChat>> = null;

  try {
    chat = await loadChat(rideId, user.id);
  } catch (error) {
    console.error(
      "Sohbet yüklenemedi:",
      error instanceof Error ? error.message : "bilinmeyen hata",
    );
    return null;
  }

  if (!chat) {
    return null;
  }

  return (
    <section
      id="sohbet"
      className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
    >
      <h2 className="text-2xl font-extrabold tracking-tight">
        Yolculuk sohbeti
      </h2>
      <RideChat
        rideId={rideId}
        initialItems={chat.items}
        phase={chat.access.phase}
        participantCount={chat.access.participantIds.length}
      />
    </section>
  );
}