"use client";

import { useActionState, useState } from "react";
import {
  changePasswordAction,
  type ChangePasswordField,
  type ChangePasswordState,
} from "@/app/panel/password-actions";

const MIN = 8;
const MAX = 128;

const initialState: ChangePasswordState = {};

const inputClass =
  "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

type Errors = Partial<Record<ChangePasswordField, string>>;

function Field({
  id,
  label,
  autoComplete,
  error,
  hint,
}: {
  id: ChangePasswordField;
  label: string;
  autoComplete: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={`pw-${id}`} className="block text-sm font-bold text-ink">
        {label}
      </label>
      <input
        id={`pw-${id}`}
        name={id}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `pw-${id}-error` : undefined}
        className={`${inputClass} ${error ? "border-coral" : "border-line"}`}
      />
      {error ? (
        <p
          id={`pw-${id}-error`}
          role="alert"
          className="mt-2 text-sm font-medium text-coral-ink"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export default function ChangePasswordCard() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );
  const [clientErrors, setClientErrors] = useState<Errors>({});

  const errors: Errors = { ...(state.errors ?? {}), ...clientErrors };

  // Basit kontroller tarayıcıda yapılır, asıl kontroller sunucuda tekrarlanır.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const current = String(data.get("current") ?? "");
    const next = String(data.get("next") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    const found: Errors = {};

    if (!current) {
      found.current = "Mevcut parolanı gir.";
    }

    if (next.length < MIN) {
      found.next = `Yeni parola en az ${MIN} karakter olmalı.`;
    } else if (next.length > MAX) {
      found.next = `Yeni parola en fazla ${MAX} karakter olabilir.`;
    } else if (next !== confirm) {
      found.confirm = "Parolalar aynı değil.";
    }

    setClientErrors(found);

    if (Object.keys(found).length > 0) {
      event.preventDefault();
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
      <h2 className="text-xl font-extrabold tracking-tight">
        Parolayı değiştir
      </h2>
      <p className="mt-2 text-sm text-muted">
        Parolanı değiştirdiğinde bu cihaz dışındaki tüm oturumların kapanır.
        Demo projede gerçek parolanı kullanma.
      </p>

      <form
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 space-y-5"
      >
        {state.message && (
          <p
            role={state.ok ? "status" : "alert"}
            className={`rounded-2xl p-4 text-sm font-medium ${
              state.ok ? "bg-sea text-mint-ink" : "bg-peach text-coral-ink"
            }`}
          >
            {state.message}
          </p>
        )}

        <Field
          id="current"
          label="Mevcut parola"
          autoComplete="current-password"
          error={errors.current}
        />
        <Field
          id="next"
          label="Yeni parola"
          autoComplete="new-password"
          error={errors.next}
          hint={`En az ${MIN} karakter.`}
        />
        <Field
          id="confirm"
          label="Yeni parola (tekrar)"
          autoComplete="new-password"
          error={errors.confirm}
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Değiştiriliyor…" : "Parolayı değiştir"}
        </button>
      </form>
    </section>
  );
}