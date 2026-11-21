"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/app/kayit/actions";
import { GENDER_FIELD, GENDERS, genderLabels } from "@/lib/gender-rules";

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
      className="mt-8 space-y-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5"
    >
      {state.message && (
        <p
          role="alert"
          className="rounded-2xl bg-peach p-4 text-sm font-medium text-coral-ink"
        >
          {state.message}
        </p>
      )}

      <fieldset>
        <legend className="block text-sm font-bold">Cinsiyetin</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {GENDERS.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-base font-bold text-ink has-[:checked]:border-violet has-[:checked]:bg-lilac has-[:checked]:text-violet ${errors.gender ? "border-coral" : "border-line"}`}
            >
              <input
                type="radio"
                name={GENDER_FIELD}
                value={option}
                defaultChecked={state.values?.gender === option}
                aria-describedby={errors.gender ? "gender-error" : "gender-hint"}
                className="h-4 w-4 accent-violet"
              />
              {genderLabels[option]}
            </label>
          ))}
        </div>
        {errors.gender ? (
          <FieldError id="gender-error" message={errors.gender} />
        ) : (
          <p id="gender-hint" className="mt-2 text-sm text-muted">
            Yolculuklarda &quot;sadece kadınlar&quot; ve &quot;sadece erkekler&quot; seçenekleri için
            kullanılır ve profilinde görünür. Kendi beyanına dayanır, sonradan
            değiştirilemez.
          </p>
        )}
      </fieldset>

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

      <div>
        <label
          htmlFor="terms"
          className="flex cursor-pointer items-start gap-3 text-sm text-ink"
        >
          <input
            id="terms"
            name="terms"
            type="checkbox"
            aria-invalid={errors.terms ? true : undefined}
            aria-describedby={errors.terms ? "terms-error" : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-violet"
          />
          <span>
            <Link
              href="/kullanim-kosullari"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-violet hover:underline"
            >
              Kullanım koşullarını
            </Link>{" "}
            ve{" "}
            <Link
              href="/gizlilik"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-violet hover:underline"
            >
              gizlilik notunu
            </Link>{" "}
            okudum, kabul ediyorum. 18 yaşını doldurdum.
          </span>
        </label>
        <FieldError id="terms-error" message={errors.terms} />
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