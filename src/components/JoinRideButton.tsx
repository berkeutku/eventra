"use client";

import { useActionState } from "react";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { joinRideAction, type JoinRideState } from "@/lib/ride-actions";

const initialState: JoinRideState = {};

export default function JoinRideButton({ rideId }: { rideId: string }) {
  const toast = useToast();

  const [state, formAction, pending] = useActionState(
    async (previous: JoinRideState, formData: FormData) => {
      const result = await joinRideAction(previous, formData);

      // Onay yalnızca sunucu katılımı gerçekten kaydettiğinde gösterilir.
      if (result.success) {
        toast.show(result.success);
        toast.tick();
      }

      return result;
    },
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="rideId" value={rideId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Katılınıyor…" : "Yolculuğa katıl"}
      </Button>
      {state.message && (
        <p role="alert" className="mt-3 text-sm font-medium text-coral-ink">
          {state.message}
        </p>
      )}
    </form>
  );
}