"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { useAuthUser } from "@/components/AuthProvider";
import {
  createRideAction,
  type CreateRideField,
  type CreateRideState,
} from "@/lib/ride-actions";
import { calcSharePerPerson } from "@/lib/ride-utils";
import { roleLabels } from "@/lib/roles";

type Props = {
  eventId: string;
};

type FormValues = {
  origin: string;
  destination: string;
  meetingPoint: string;
  departureTime: string;
  duration: string;
  seats: string;
  cost: string;
};

const initialState: CreateRideState = {};

const emptyForm: FormValues = {
  origin: "",
  destination: "",
  meetingPoint: "",
  departureTime: "",
  duration: "",
  seats: "3",
  cost: "",
};

function parseWholeNumber(value: string): number | null {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

const baseInput =
  "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

type TextInputProps = {
  id: CreateRideField;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  hint?: string;
  type?: "text" | "time";
  inputMode?: "numeric";
};

function TextInput({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  hint,
  type = "text",
  inputMode,
}: TextInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        className={`${baseInput} ${error ? "border-coral" : "border-line"}`}
      />
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-sm font-medium text-coral-ink"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function RideForm({ eventId }: Props) {
  const user = useAuthUser();
  const [state, formAction, pending] = useActionState(
    createRideAction,
    initialState,
  );
  const [values, setValues] = useState<FormValues>(emptyForm);

  const errors = state.errors ?? {};

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // Formu kendimiz gönderiyoruz: böylece hata olsa bile yazdıkların kutularda kalır.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  if (user === null) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Önce giriş yapmalısın
        </h2>
        <p className="mt-2 text-muted">
          Yolculuk oluşturmak için giriş yapmalı ve hesabının rolü Sürücü
          olmalı.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/giris"
            className="rounded-full bg-violet px-6 py-3 text-sm font-bold text-white hover:bg-sky"
          >
            Giriş yap
          </Link>
          <Link
            href="/kayit"
            className="rounded-full border border-line px-6 py-3 text-sm font-bold text-ink hover:bg-lilac"
          >
            Hesap oluştur
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "driver") {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Bu sayfa sürücüler içindir
        </h2>
        <p className="mt-2 text-muted">
          {user.name} olarak {roleLabels[user.role]} rolüyle giriş yaptın.
          Yolculuk oluşturmak için Sürücü rolüyle kayıtlı bir hesap gerekir.
        </p>
      </div>
    );
  }

  const costNumber = parseWholeNumber(values.cost);
  const previewShare =
    costNumber !== null && costNumber <= 5000
      ? calcSharePerPerson(costNumber, Number(values.seats))
      : null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5"
    >
      <input type="hidden" name="eventId" value={eventId} />

      <p className="text-sm text-muted">
        Sürücü olarak giriş yaptın: <strong>{user.name}</strong>
      </p>

      {state.message && (
        <p
          role="alert"
          className="rounded-2xl bg-peach p-4 text-sm font-medium text-coral-ink"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <TextInput
          id="origin"
          label="Başlangıç noktası"
          value={values.origin}
          onChange={(value) => update("origin", value)}
          error={errors.origin}
          placeholder="Örn. Etkinlik alanı otoparkı"
        />
        <TextInput
          id="destination"
          label="Varış noktası"
          value={values.destination}
          onChange={(value) => update("destination", value)}
          error={errors.destination}
          placeholder="Örn. Kadıköy"
        />
      </div>

      <TextInput
        id="meetingPoint"
        label="Buluşma noktası"
        value={values.meetingPoint}
        onChange={(value) => update("meetingPoint", value)}
        error={errors.meetingPoint}
        placeholder="Örn. Ana kapı çıkışı, mavi tabela önü"
        hint="Kalabalıkta kolay bulunacak, herkese açık bir nokta seç."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextInput
          id="departureTime"
          label="Kalkış saati"
          type="time"
          value={values.departureTime}
          onChange={(value) => update("departureTime", value)}
          error={errors.departureTime}
        />
        <TextInput
          id="duration"
          label="Tahmini yolculuk süresi (dakika)"
          inputMode="numeric"
          value={values.duration}
          onChange={(value) => update("duration", value)}
          error={errors.duration}
          placeholder="Örn. 45"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="seats" className="block text-sm font-bold text-ink">
            Boş koltuk sayısı
          </label>
          <select
            id="seats"
            name="seats"
            value={values.seats}
            onChange={(event) => update("seats", event.target.value)}
            className={`${baseInput} ${errors.seats ? "border-coral" : "border-line"}`}
          >
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          {errors.seats && (
            <p role="alert" className="mt-2 text-sm font-medium text-coral-ink">
              {errors.seats}
            </p>
          )}
        </div>
        <TextInput
          id="cost"
          label="Tahmini toplam yol masrafı (TL)"
          inputMode="numeric"
          value={values.cost}
          onChange={(value) => update("cost", value)}
          error={errors.cost}
          placeholder="Örn. 600"
          hint="Yakıt, otoyol gibi tahmini toplam masraf."
        />
      </div>

      <div className="rounded-2xl bg-lilac p-4 text-sm">
        <p className="font-bold text-ink">Tahmini kişi başı masraf</p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-violet">
          {previewShare === null ? "—" : `${previewShare} TL`}
        </p>
        <p className="mt-1 text-muted">
          Masraf, sürücü dahil herkese eşit bölünür. Bu yalnızca bir tahmindir,
          ödeme alınmaz.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-violet px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Yolculuğu oluştur"}
      </button>
    </form>
  );
}