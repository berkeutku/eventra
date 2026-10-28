"use client";

import { useActionState } from "react";
import { useToast } from "@/components/Toast";
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
      }

      return result;
    },
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="rideId" value={rideId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Katılınıyor…" : "Yolculuğa katıl"}
      </button>
      {state.message && (
        <p role="alert" className="mt-3 text-sm font-medium text-coral-ink">
          {state.message}
        </p>
      )}
    </form>
  );
}