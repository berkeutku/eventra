"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useAuthUser } from "@/components/AuthProvider";
import Icon from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import VerifiedBadge from "@/components/VerifiedBadge";
import {
  generateDemoCodeAction,
  verifyTicketAction,
  type VerifyTicketState,
} from "@/lib/ticket-actions";
import {
  CHECK_PHASES,
  ticketSteps,
  type StepState,
} from "@/lib/ticket-steps-rules";

const initialState: VerifyTicketState = {};

function StepMarker({ state, index }: { state: StepState; index: number }) {
  if (state === "done") {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint text-night">
        <Icon name="check" className="h-4 w-4" />
        <span className="sr-only">Tamamlandı</span>
      </span>
    );
  }

  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
        state === "current"
          ? "bg-violet text-white"
          : "bg-white text-muted ring-1 ring-line"
      }`}
    >
      {index + 1}
    </span>
  );
}

// Doğrulama sürerken görünür; ayrı bir bileşen olduğu için her seferinde baştan başlar.
function PendingSteps() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhase((current) => Math.min(current + 1, CHECK_PHASES.length - 1));
    }, 260);

    return () => window.clearInterval(id);
  }, []);

  return (
    <ul aria-live="polite" className="mt-4 space-y-2 rounded-xl bg-white p-4">
      {CHECK_PHASES.map((label, index) => (
        <li
          key={label}
          className={`flex items-center gap-3 text-sm ${
            index > phase ? "text-muted/60" : "font-bold text-ink"
          }`}
        >
          {index < phase ? (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-mint text-night">
              <Icon name="check" className="h-3 w-3" />
            </span>
          ) : index === phase ? (
            <span
              aria-hidden="true"
              className="h-5 w-5 rounded-full border-2 border-violet/30 border-t-violet motion-safe:animate-spin"
            />
          ) : (
            <span
              aria-hidden="true"
              className="h-5 w-5 rounded-full border-2 border-line"
            />
          )}
          {label}
        </li>
      ))}
    </ul>
  );
}

export default function TicketVerificationCard({
  eventId,
  verified,
  createHref = null,
}: {
  eventId: string;
  verified: boolean;
  createHref?: string | null;
}) {
  const user = useAuthUser();
  const toast = useToast();
  const wasVerified = useRef(verified);

  // Doğrulama bu ekranda yeni tamamlandığında (sayfa zaten doğrulanmış açılmadığında) tik göster.
  useEffect(() => {
    if (verified && !wasVerified.current) {
      toast.tick();
    }

    wasVerified.current = verified;
  }, [verified, toast]);

  const [state, formAction, pending] = useActionState(
    verifyTicketAction,
    initialState,
  );
  const [code, setCode] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();

  const steps = ticketSteps(Boolean(user), verified);
  const isVerified = Boolean(user) && verified;

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
    <div
      className={`mt-6 rounded-2xl p-5 ${
        isVerified
          ? "border border-mint/60 bg-sea"
          : "border border-dashed border-violet/40 bg-lilac/50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-extrabold tracking-tight">
          Bilet doğrulama
        </h3>
        <Badge tone="sun">Demo</Badge>
      </div>

      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.key}
            aria-current={step.state === "current" ? "step" : undefined}
            className={`flex items-start gap-3 rounded-xl p-3 ${
              step.state === "current" ? "bg-white shadow-sm" : ""
            }`}
          >
            <StepMarker state={step.state} index={index} />
            <div className="min-w-0">
              <p
                className={`text-sm font-extrabold ${
                  step.state === "upcoming" ? "text-muted" : "text-ink"
                }`}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-muted">{step.hint}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-sm text-muted">
        Bu bir simülasyondur. Gerçek bir bilet sağlayıcısına ya da e-Devlet&apos;e
        bağlantı yoktur. Kod yalnızca biçim ve sağlama karakteri açısından
        kontrol edilir.
      </p>

      {!user ? (
        <LinkButton
          href="/giris"
          variant="ghost"
          className="mt-4 text-sm"
        >
          Doğrulamak için giriş yap &rarr;
        </LinkButton>
      ) : verified ? (
        <div className="mt-4">
          <VerifiedBadge />
          <p className="mt-2 text-sm text-ink">
            Bu etkinlik için bilet doğrulaman kayıtlı. Artık yolculuk
            oluşturabilir ve açık yolculuklara katılabilirsin. Rozet
            yolculuklarda adının yanında görünür.
          </p>
          {createHref && (
            <LinkButton href={createHref} className="mt-4">
              <Icon name="car" className="h-4 w-4" />
              Yolculuk oluştur
            </LinkButton>
          )}
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
            <Button type="submit" disabled={pending}>
              {pending ? "Doğrulanıyor…" : "Doğrula"}
            </Button>
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

          {pending && <PendingSteps />}

          {!pending && (state.message || generateError) && (
            <p role="alert" className="mt-3 text-sm font-medium text-coral-ink">
              {generateError ?? state.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
