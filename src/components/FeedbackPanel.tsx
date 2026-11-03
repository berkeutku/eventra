"use client";

import { useState, useTransition } from "react";
import { rateAction, reportAction } from "@/lib/rating-actions";
import {
  MAX_COMMENT,
  MAX_REPORT_DETAILS,
  REPORT_REASONS,
  reportReasonLabels,
  type RatingWindow,
  type ReportReason,
} from "@/lib/rating-rules";

export type FeedbackTarget = {
  userId: string;
  name: string;
  role: "driver" | "passenger";
  ratable: boolean;
  score: number | null;
  comment: string | null;
  reported: boolean;
};

type Note = { ok: boolean; text: string } | null;

const field =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

function Stars({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="mt-2 flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          aria-pressed={n === value}
          aria-label={`${n} yıldız`}
          onClick={() => onChange(n)}
          className={`grid h-11 w-11 place-items-center rounded-full text-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            n <= value
              ? "bg-sun text-[#412402]"
              : "bg-surface text-muted hover:bg-lilac"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function NoteLine({ note }: { note: Note }) {
  if (!note) {
    return null;
  }

  return (
    <p
      role="status"
      className={`mt-3 text-sm font-bold ${
        note.ok ? "text-mint-ink" : "text-coral-ink"
      }`}
    >
      {note.text}
    </p>
  );
}

function TargetCard({
  rideId,
  target,
  phase,
}: {
  rideId: string;
  target: FeedbackTarget;
  phase: RatingWindow;
}) {
  const [score, setScore] = useState(target.score ?? 0);
  const [comment, setComment] = useState(target.comment ?? "");
  const [rateNote, setRateNote] = useState<Note>(null);
  const [reported, setReported] = useState(target.reported);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("no_show");
  const [details, setDetails] = useState("");
  const [reportNote, setReportNote] = useState<Note>(null);
  const [pending, startTransition] = useTransition();

  const canRate = target.ratable && phase === "open";

  function save() {
    startTransition(async () => {
      const result = await rateAction(rideId, target.userId, score, comment);
      setRateNote({ ok: result.ok, text: result.message });
    });
  }

  function sendReport() {
    startTransition(async () => {
      const result = await reportAction(rideId, target.userId, reason, details);
      setReportNote({ ok: result.ok, text: result.message });

      if (result.ok) {
        setReported(true);
        setReportOpen(false);
      }
    });
  }

  return (
    <li className="rounded-2xl bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-lilac font-bold text-violet">
          {target.name.trim().charAt(0).toLocaleUpperCase("tr-TR")}
        </span>
        <span className="font-extrabold text-ink">{target.name}</span>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-muted">
          {target.role === "driver" ? "Sürücü" : "Yolcu"}
        </span>
      </div>

      {target.ratable ? (
        <div className="mt-4">
          <p className="text-sm font-bold text-ink">Yolculuk nasıldı?</p>
          <Stars
            value={score}
            onChange={setScore}
            disabled={!canRate || pending}
            label={`${target.name} için puan`}
          />
          {phase === "not_yet" && (
            <p className="mt-2 text-xs text-muted">
              Puanlama, etkinlik bittikten sonra açılır.
            </p>
          )}
          {phase === "closed" && (
            <p className="mt-2 text-xs text-muted">Puanlama süresi doldu.</p>
          )}
          {canRate && (
            <>
              <label
                htmlFor={`comment-${target.userId}`}
                className="mt-3 block text-sm font-bold text-ink"
              >
                Yorum <span className="font-normal text-muted">(isteğe bağlı)</span>
              </label>
              <textarea
                id={`comment-${target.userId}`}
                value={comment}
                maxLength={MAX_COMMENT}
                rows={2}
                onChange={(event) => setComment(event.target.value)}
                className={field}
              />
              <button
                type="button"
                onClick={save}
                disabled={pending || score === 0}
                className="mt-3 rounded-full bg-violet px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
              >
                {target.score ? "Puanı güncelle" : "Puanı kaydet"}
              </button>
              <NoteLine note={rateNote} />
            </>
          )}
        </div>
      ) : null}

      <div className="mt-4 border-t border-line pt-4">
        {reported ? (
          <p className="text-sm font-bold text-muted">
            Bu kişiyi bildirdin. Bildirimin kaydedildi.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setReportOpen((open) => !open)}
              aria-expanded={reportOpen}
              className="text-sm font-bold text-coral-ink hover:underline"
            >
              Bu kişiyi bildir
            </button>

            {reportOpen && (
              <div className="mt-3">
                <p className="rounded-xl bg-peach p-3 text-xs text-coral-ink">
                  Acil bir tehlike varsa önce 112&apos;yi ara. Demo sürümde
                  şikâyetler proje sahibi tarafından elle incelenir.
                </p>
                <label
                  htmlFor={`reason-${target.userId}`}
                  className="mt-3 block text-sm font-bold text-ink"
                >
                  Neden?
                </label>
                <select
                  id={`reason-${target.userId}`}
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value as ReportReason)
                  }
                  className={field}
                >
                  {REPORT_REASONS.map((item) => (
                    <option key={item} value={item}>
                      {reportReasonLabels[item]}
                    </option>
                  ))}
                </select>
                <label
                  htmlFor={`details-${target.userId}`}
                  className="mt-3 block text-sm font-bold text-ink"
                >
                  Ayrıntı <span className="font-normal text-muted">(isteğe bağlı)</span>
                </label>
                <textarea
                  id={`details-${target.userId}`}
                  value={details}
                  maxLength={MAX_REPORT_DETAILS}
                  rows={3}
                  onChange={(event) => setDetails(event.target.value)}
                  className={field}
                />
                <button
                  type="button"
                  onClick={sendReport}
                  disabled={pending}
                  className="mt-3 rounded-full bg-coral px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Bildirimi gönder
                </button>
              </div>
            )}
            <NoteLine note={reportNote} />
          </>
        )}
      </div>
    </li>
  );
}

export default function FeedbackPanel({
  rideId,
  phase,
  targets,
}: {
  rideId: string;
  phase: RatingWindow;
  targets: FeedbackTarget[];
}) {
  return (
    <details
      open={phase === "open"}
      className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
    >
      <summary className="cursor-pointer text-xl font-extrabold tracking-tight text-ink">
        Yolculuk sonrası: puanla ve bildir
      </summary>
      <p className="mt-2 text-sm text-muted">
        Aynı yolculukta olduğun kişileri puanlayabilir ya da bir sorun
        yaşadıysan bildirebilirsin. Puanlar etkinlik bittikten sonra 30 gün
        açıktır.
      </p>
      <ul className="mt-4 space-y-4">
        {targets.map((target) => (
          <TargetCard
            key={target.userId}
            rideId={rideId}
            target={target}
            phase={phase}
          />
        ))}
      </ul>
    </details>
  );
}