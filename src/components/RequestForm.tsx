"use client";

import { startTransition, useActionState, useState } from "react";
import {
  deleteRequestAction,
  saveRequestAction,
  type RequestState,
} from "@/lib/request-actions";
import { MAX_NOTE, MAX_REQUEST_SEATS } from "@/lib/request-rules";
import type { MyRequest } from "@/lib/ride-requests";

const baseInput =
  "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

type Values = {
  destination: string;
  preferredTime: string;
  seats: string;
  note: string;
};

export default function RequestForm({
  eventId,
  existing,
}: {
  eventId: string;
  existing: MyRequest | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveRequestAction,
    {} as RequestState,
  );
  const [values, setValues] = useState<Values>({
    destination: existing?.destination ?? "",
    preferredTime: existing?.preferredTime ?? "",
    seats: String(existing?.seats ?? 1),
    note: existing?.note ?? "",
  });
  const errors = state.errors ?? {};

  function update(field: keyof Values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // Formu kendimiz gönderiyoruz: hata olsa bile yazdıkların kutularda kalır.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <div className="rounded-2xl bg-lilac/60 p-4 sm:p-5">
      <p className="text-sm font-extrabold text-ink">
        {existing ? "Yolcu talebini güncelle" : "Yolculuk talebi ver"}
      </p>
      <p className="mt-1 text-sm text-muted">
        Uygun bir yolculuk yoksa talebini bırak, bu etkinliğe giden sürücüler
        görsün. Telefon ya da e-posta yazma.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        <input type="hidden" name="eventId" value={eventId} />

        {state.message && (
          <p
            role={state.ok ? "status" : "alert"}
            className={`rounded-2xl p-3 text-sm font-medium ${
              state.ok ? "bg-sea text-mint-ink" : "bg-peach text-coral-ink"
            }`}
          >
            {state.message}
          </p>
        )}

        <div>
          <label htmlFor="req-destination" className="block text-sm font-bold text-ink">
            Nereye gitmek istiyorsun?
          </label>
          <input
            id="req-destination"
            name="destination"
            value={values.destination}
            onChange={(event) => update("destination", event.target.value)}
            maxLength={80}
            autoComplete="off"
            placeholder="Örn. Kadıköy"
            aria-invalid={errors.destination ? true : undefined}
            className={`${baseInput} ${errors.destination ? "border-coral" : "border-line"}`}
          />
          {errors.destination && (
            <p role="alert" className="mt-2 text-sm font-medium text-coral-ink">
              {errors.destination}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="req-time" className="block text-sm font-bold text-ink">
              Tercih ettiğin saat{" "}
              <span className="font-normal text-muted">(isteğe bağlı)</span>
            </label>
            <input
              id="req-time"
              name="preferredTime"
              type="time"
              value={values.preferredTime}
              onChange={(event) => update("preferredTime", event.target.value)}
              className={`${baseInput} ${errors.preferredTime ? "border-coral" : "border-line"}`}
            />
            {errors.preferredTime && (
              <p role="alert" className="mt-2 text-sm font-medium text-coral-ink">
                {errors.preferredTime}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="req-seats" className="block text-sm font-bold text-ink">
              Kaç kişisiniz?
            </label>
            <select
              id="req-seats"
              name="seats"
              value={values.seats}
              onChange={(event) => update("seats", event.target.value)}
              className={`${baseInput} ${errors.seats ? "border-coral" : "border-line"}`}
            >
              {Array.from({ length: MAX_REQUEST_SEATS }, (_, index) => index + 1).map(
                (count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ),
              )}
            </select>
            {errors.seats && (
              <p role="alert" className="mt-2 text-sm font-medium text-coral-ink">
                {errors.seats}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="req-note" className="block text-sm font-bold text-ink">
            Not <span className="font-normal text-muted">(isteğe bağlı)</span>
          </label>
          <textarea
            id="req-note"
            name="note"
            value={values.note}
            onChange={(event) => update("note", event.target.value)}
            maxLength={MAX_NOTE}
            rows={2}
            className={`${baseInput} ${errors.note ? "border-coral" : "border-line"}`}
          />
          {errors.note && (
            <p role="alert" className="mt-2 text-sm font-medium text-coral-ink">
              {errors.note}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : existing ? "Talebi güncelle" : "Talebi kaydet"}
        </button>
      </form>

      {existing && (
        <form action={deleteRequestAction} className="mt-3">
          <input type="hidden" name="eventId" value={eventId} />
          <button
            type="submit"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac"
          >
            Talebi sil
          </button>
        </form>
      )}
    </div>
  );
}