"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loginDemoUser,
  logoutDemoUser,
  roleLabels,
  useDemoUser,
  type Role,
} from "@/lib/session";

const roleOptions: { value: Role; title: string; text: string }[] = [
  {
    value: "driver",
    title: "Sürücü",
    text: "Aracınla etkinliğe gidiyorsun ve boş koltukları paylaşmak istiyorsun.",
  },
  {
    value: "passenger",
    title: "Yolcu",
    text: "Etkinliğe gidiyorsun ve ortak bir yolculuğa katılmak istiyorsun.",
  },
];

type FormErrors = { name?: string; role?: string };

export default function LoginForm() {
  const router = useRouter();
  const user = useDemoUser();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const nextErrors: FormErrors = {};

    if (trimmedName.length < 2) {
      nextErrors.name = "Lütfen en az 2 karakterlik bir ad gir.";
    } else if (trimmedName.length > 40) {
      nextErrors.name = "Ad en fazla 40 karakter olabilir.";
    }

    if (!role) {
      nextErrors.role = "Lütfen bir rol seç.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !role) {
      return;
    }

    loginDemoUser({ name: trimmedName, role });
    router.push("/events");
  }

  if (user === undefined) {
    return <div className="mt-8 h-72" aria-busy="true" />;
  }

  if (user) {
    return (
      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm text-muted">Giriş yapıldı</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          Merhaba, {user.name}
        </p>
        <p className="mt-2 text-muted">Rolün: {roleLabels[user.role]}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/events"
            className="rounded-full bg-violet px-6 py-3 text-sm font-medium text-white hover:bg-sky"
          >
            Etkinliklere git
          </Link>
          <button
            type="button"
            onClick={logoutDemoUser}
            className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink hover:bg-surface"
          >
            Çıkış yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-8 space-y-8 rounded-3xl bg-white p-8 shadow-sm"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink">
          Görünen ad
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Örn. Demo Kullanıcı"
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60"
        />
        {errors.name && (
          <p id="name-error" role="alert" className="mt-2 text-sm text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink">Rolün</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {roleOptions.map((option) => (
            <label
              key={option.value}
              className="cursor-pointer rounded-2xl border border-line p-4 has-[:checked]:border-sky has-[:checked]:ring-2 has-[:checked]:ring-sky has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sky"
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              <span className="block text-base font-semibold text-ink">
                {option.title}
              </span>
              <span className="mt-1 block text-sm text-muted">
                {option.text}
              </span>
            </label>
          ))}
        </div>
        {errors.role && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {errors.role}
          </p>
        )}
      </fieldset>

      <button
        type="submit"
        className="w-full rounded-full bg-violet px-6 py-3 text-base font-medium text-white transition-colors hover:bg-sky"
      >
        Demo olarak devam et
      </button>
    </form>
  );
}