"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/giris/actions";

const initialState: LoginState = {};

const inputClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="mt-8 space-y-6 rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5"
    >
      <input type="hidden" name="next" value={next} />

      {state.message && (
        <p
          role="alert"
          className="rounded-2xl bg-peach p-4 text-sm font-medium text-coral-ink"
        >
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-bold">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          placeholder="demo1@example.com"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-bold">
          Parola
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-violet px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>

      <p className="text-center text-sm text-muted">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-bold text-violet hover:underline">
          Hesap oluştur
        </Link>
      </p>
    </form>
  );
}