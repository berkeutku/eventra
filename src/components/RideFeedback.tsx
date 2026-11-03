import Link from "next/link";
import FeedbackPanel from "@/components/FeedbackPanel";
import { getCurrentUser } from "@/lib/auth";
import { getRideDetail } from "@/lib/ride-queries";
import { getRatingContext } from "@/lib/ride-ratings";

// Yalnızca yolculuğun sürücüsü ve yolcularına görünür: düzenleme bağlantısı (sürücü)
// ve puanlama/şikâyet kutusu.
export default async function RideFeedback({ rideId }: { rideId: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const [ride, context] = await Promise.all([
    getRideDetail(rideId, user.id),
    getRatingContext(rideId, user.id),
  ]);

  const showFeedback = Boolean(context && context.targets.length > 0);
  const isOwn = ride?.isOwn === true;

  if (!isOwn && !showFeedback) {
    return null;
  }

  return (
    <div className="space-y-6">
      {isOwn && ride && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-lilac p-4 sm:p-5">
          <p className="text-sm font-bold text-ink">Bu senin yolculuğun.</p>
          <Link
            href={`/events/${ride.eventId}/yolculuk/${ride.id}/duzenle`}
            className="rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky"
          >
            Yolculuğu düzenle
          </Link>
        </div>
      )}

      {showFeedback && context && (
        <FeedbackPanel
          rideId={rideId}
          phase={context.phase}
          targets={context.targets}
        />
      )}
    </div>
  );
}