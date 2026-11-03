import FeedbackPanel from "@/components/FeedbackPanel";
import { getCurrentUser } from "@/lib/auth";
import { getRatingContext } from "@/lib/ride-ratings";

// Yalnızca yolculuğun sürücüsü ve yolcularına görünür.
export default async function RideFeedback({ rideId }: { rideId: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const context = await getRatingContext(rideId, user.id);

  if (!context || context.targets.length === 0) {
    return null;
  }

  return (
    <FeedbackPanel
      rideId={rideId}
      phase={context.phase}
      targets={context.targets}
    />
  );
}