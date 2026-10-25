"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, useTransition } from "react";
import { useAuthUser } from "@/components/AuthProvider";
import VerifiedBadge from "@/components/VerifiedBadge";
import {
  generateDemoCodeAction,
  verifyTicketAction,
  type VerifyTicketState,
} from "@/lib/ticket-actions";

const initialState: VerifyTicketState = {};

export default function TicketVerificationCard({
  eventId,
  verified,
}: {
  eventId: string;
  verified: boolean;
}) {
  const user = useAuthUser();
  const [state, formAction, pending] = useActionState(
    verifyTicketAction,
    initialState,
  );
  const [code, setCode] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  function handleGenerate() {
    setGenerateError(null);
    startGenerate(async () => {
      const result = await generateDemoCodeAction();

      if (result.code) {
        setCode(result.code);
      } else {
        setGenerateError(result.message ?? "Kod üretilemedi.");
      }
    });
  }

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-violet/40 bg-lilac/50 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-extrabold tracking-tight">
          Bilet doğrulama
        </h3>
        <span className="rounded-full bg-sun/30 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-ink">
          Demo
        </span>
      </div>

      <p className="mt-2 text-sm text-muted">
        Bu bir simülasyondur. Gerçek bir bilet sağlayıcısına ya da e-Devlet'e
        bağlantı yoktur. Kod yalnızca biçim ve sağlama karakteri açısından
        kontrol edilir.
      </p>

      {!user ? (
        <Link
          href="/giris"
          className="mt-4 inline-block text-sm font-bold text-violet hover:underline"
        >
          Doğrulamak için giriş yap &rarr;
        </Link>
      ) : verified ? (
        <div className="mt-4">
          <VerifiedBadge />
          <p className="mt-2 text-sm text-muted">
            Bu etkinlik için bilet doğrulaman kayıtlı. Rozet yolculuklarda
            adının yanında görünür.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-4">
          <input type="hidden" name="eventId" value={eventId} />
          <label htmlFor="ticket-code" className="block text-sm font-bold">
            Bilet kodu
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            <input
              id="ticket-code"
              name="code"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="EVT-7KQ-M2X"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="ticket-code-hint"
              className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-3 font-mono text-base uppercase text-ink placeholder:text-muted/60"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Doğrulanıyor…" : "Doğrula"}
            </button>
          </div>

          <p id="ticket-code-hint" className="mt-2 text-sm text-muted">
            Gerçek biletin yoksa{" "}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="font-bold text-violet hover:underline disabled:opacity-60"
            >
              {generating ? "Üretiliyor…" : "örnek kod üret"}
            </button>
            .
          </p>

          {(state.message || generateError) && (
            <p role="alert" className="mt-3 text-sm font-medium text-coral-ink">
              {generateError ?? state.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}