"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  updateProfileAction,
  type ProfileFormState,
} from "@/app/panel/profil-actions";
import { categoryMeta } from "@/data/events";
import {
  BIO_FIELD,
  CITY_FIELD,
  INTERESTS_FIELD,
  INTEREST_KEYS,
  MAX_BIO,
  MAX_CITY,
  MAX_INTERESTS,
  THEME_FIELD,
  THEME_KEYS,
  profileThemes,
  type ProfileTheme,
} from "@/lib/profile-rules";

const initialState: ProfileFormState = {};

const inputClass =
  "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

export default function ProfileEditForm({
  initial,
}: {
  initial: {
    bio: string | null;
    city: string | null;
    theme: ProfileTheme;
    interests: string[];
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [bio, setBio] = useState(initial.bio ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [theme, setTheme] = useState<ProfileTheme>(initial.theme);
  const [interests, setInterests] = useState<string[]>(initial.interests);
  const errors = state.errors ?? {};

  function toggleInterest(key: string) {
    setInterests((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state.message ? (
        <p
          role="alert"
          className="rounded-2xl bg-peach p-4 text-sm font-medium text-coral-ink"
        >
          {state.message}
        </p>
      ) : null}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <h2 className="text-xl font-extrabold tracking-tight">Hakkımda</h2>
        <label htmlFor="bio" className="sr-only">
          Hakkımda
        </label>
        <textarea
          id="bio"
          name={BIO_FIELD}
          rows={5}
          maxLength={MAX_BIO}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Kendinden kısaca bahset: hangi etkinliklere gidersin, nasıl bir yol arkadaşısın?"
          aria-invalid={errors.bio ? true : undefined}
          className={`${inputClass} ${errors.bio ? "border-coral" : "border-line"}`}
        />
        <div className="mt-2 flex items-start justify-between gap-3 text-sm">
          {errors.bio ? (
            <p role="alert" className="font-medium text-coral-ink">
              {errors.bio}
            </p>
          ) : (
            <p className="text-muted">
              Herkese açıktır. Telefon, e-posta, kullanıcı adı ya da bağlantı yazma.
            </p>
          )}
          <span className="shrink-0 font-bold text-muted">
            {bio.length}/{MAX_BIO}
          </span>
        </div>

        <div className="mt-6">
          <label htmlFor="city" className="block text-sm font-bold">
            Şehir
          </label>
          <input
            id="city"
            name={CITY_FIELD}
            type="text"
            maxLength={MAX_CITY}
            autoComplete="off"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Örn. Mersin"
            aria-invalid={errors.city ? true : undefined}
            className={`${inputClass} ${errors.city ? "border-coral" : "border-line"}`}
          />
          {errors.city ? (
            <p role="alert" className="mt-2 text-sm font-medium text-coral-ink">
              {errors.city}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <h2 className="text-xl font-extrabold tracking-tight">Kapak teması</h2>
        <p className="mt-1 text-sm text-muted">
          Profilinin üstündeki rengi seç.
        </p>
        <div role="radiogroup" aria-label="Kapak teması" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEME_KEYS.map((key) => (
            <label
              key={key}
              className="cursor-pointer overflow-hidden rounded-2xl ring-1 ring-black/10 has-[:checked]:ring-4 has-[:checked]:ring-violet"
            >
              <input
                type="radio"
                name={THEME_FIELD}
                value={key}
                checked={theme === key}
                onChange={() => setTheme(key)}
                className="sr-only"
              />
              <span className={`block h-14 ${profileThemes[key].gradient}`} />
              <span className="block bg-white px-3 py-2 text-center text-xs font-bold text-ink">
                {profileThemes[key].label}
              </span>
            </label>
          ))}
        </div>
        {errors.theme ? (
          <p role="alert" className="mt-2 text-sm font-medium text-coral-ink">
            {errors.theme}
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <h2 className="text-xl font-extrabold tracking-tight">İlgi alanların</h2>
        <p className="mt-1 text-sm text-muted">
          En fazla {MAX_INTERESTS} tane seç ({interests.length}/{MAX_INTERESTS}).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {INTEREST_KEYS.map((key) => {
            const meta = categoryMeta[key];
            const checked = interests.includes(key);

            return (
              <label
                key={key}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet ${
                  checked
                    ? "bg-violet text-white"
                    : `${meta.soft} ${meta.accent} hover:opacity-80`
                }`}
              >
                <input
                  type="checkbox"
                  name={INTERESTS_FIELD}
                  value={key}
                  checked={checked}
                  onChange={() => toggleInterest(key)}
                  className="sr-only"
                />
                {meta.label}
              </label>
            );
          })}
        </div>
        {errors.interests ? (
          <p role="alert" className="mt-2 text-sm font-medium text-coral-ink">
            {errors.interests}
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-violet px-8 py-3.5 text-base font-bold text-white shadow-soft transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <Link
          href="/panel"
          className="rounded-full border border-line px-6 py-3.5 text-base font-bold text-ink transition-colors hover:bg-lilac"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  );
}
