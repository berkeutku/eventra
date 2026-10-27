"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/app/kayit/actions";

const initialState: RegisterState = {};

const inputClass =
  "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="mt-2 text-sm font-medium text-coral-ink">
      {message}
    </p>
  );
}

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );
  const errors = state.errors ?? {};

  return (
    <form
      action={formAction}
      noValidate
      className="mt-8 space-y-6 rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5"
    >
      {state.message && (
        <p
          role="alert"
          className="rounded-2xl bg-peach p-4 text-sm font-medium text-coral-ink"
        >
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-bold">
          Görünen ad
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          defaultValue={state.values?.name}
          placeholder="Örn. Demo Kullanıcı"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`${inputClass} ${errors.name ? "border-coral" : "border-line"}`}
        />
        <FieldError id="name-error" message={errors.name} />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-bold">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          defaultValue={state.values?.email}
          placeholder="demo1@example.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : "email-hint"}
          className={`${inputClass} ${errors.email ? "border-coral" : "border-line"}`}
        />
        {errors.email ? (
          <FieldError id="email-error" message={errors.email} />
        ) : (
          <p id="email-hint" className="mt-2 text-sm text-muted">
            Gerçek adresini kullanma, örnek bir adres yaz.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-bold">
          Parola
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : "password-hint"}
          className={`${inputClass} ${errors.password ? "border-coral" : "border-line"}`}
        />
        {errors.password ? (
          <FieldError id="password-error" message={errors.password} />
        ) : (
          <p id="password-hint" className="mt-2 text-sm text-muted">
            En az 8 karakter. Gerçek parolanı kullanma, bu bir demo.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-violet px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
      </button>

      <p className="text-center text-sm text-muted">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-bold text-violet hover:underline">
          Giriş yap
        </Link>
      </p>
    </form>
  );
}