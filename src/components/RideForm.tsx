"use client";

import { useState } from "react";
import Link from "next/link";
import {
  addRide,
  calcArrival,
  calcSharePerPerson,
  type Ride,
} from "@/lib/rides";
import { roleLabels, useDemoUser } from "@/lib/session";

type Props = {
  eventId: string;
  eventTitle: string;
};

type FieldName =
  | "origin"
  | "destination"
  | "meetingPoint"
  | "departureTime"
  | "duration"
  | "cost";

type FormErrors = Partial<Record<FieldName, string>>;

type FormValues = {
  origin: string;
  destination: string;
  meetingPoint: string;
  departureTime: string;
  duration: string;
  seats: string;
  cost: string;
};

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

function validateText(value: string, label: string): string | undefined {
  const length = value.trim().length;
  if (length < 2) {
    return `${label} en az 2 karakter olmalı.`;
  }
  if (length > 80) {
    return `${label} en fazla 80 karakter olabilir.`;
  }
  return undefined;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  const origin = validateText(values.origin, "Başlangıç noktası");
  if (origin) errors.origin = origin;

  const destination = validateText(values.destination, "Varış noktası");
  if (destination) errors.destination = destination;

  const meetingPoint = validateText(values.meetingPoint, "Buluşma noktası");
  if (meetingPoint) errors.meetingPoint = meetingPoint;

  if (!values.departureTime) {
    errors.departureTime = "Lütfen kalkış saatini seç.";
  }

  const duration = parseWholeNumber(values.duration);
  if (duration === null || duration < 5 || duration > 600) {
    errors.duration = "Süre 5 ile 600 dakika arasında bir sayı olmalı.";
  }

  const cost = parseWholeNumber(values.cost);
  if (cost === null || cost > 5000) {
    errors.cost = "Masraf 0 ile 5000 TL arasında bir tam sayı olmalı.";
  }

  return errors;
}

const baseInput =
  "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

type TextInputProps = {
  id: FieldName;
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
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${baseInput} ${error ? "border-red-500" : "border-line"}`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600">
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

export default function RideForm({ eventId, eventTitle }: Props) {
  const user = useDemoUser();
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [created, setCreated] = useState<Ride | null>(null);

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !user) {
      return;
    }

    const ride = addRide({
      eventId,
      driverName: user.name,
      origin: values.origin.trim(),
      destination: values.destination.trim(),
      meetingPoint: values.meetingPoint.trim(),
      departureTime: values.departureTime,
      durationMinutes: Number(values.duration),
      seats: Number(values.seats),
      totalCost: Number(values.cost),
    });

    if (!ride) {
      setSaveError(
        "Yolculuk kaydedilemedi. Tarayıcın depolamaya izin vermiyor olabilir.",
      );
      return;
    }

    setCreated(ride);
  }

  function handleReset() {
    setValues(emptyForm);
    setErrors({});
    setSaveError(null);
    setCreated(null);
  }

  if (user === undefined) {
    return <div className="h-72" aria-busy="true" />;
  }

  if (user === null) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight">
          Önce giriş yapmalısın
        </h2>
        <p className="mt-2 text-muted">
          Yolculuk oluşturmak için demo girişi yapıp Sürücü rolünü seç.
        </p>
        <Link
          href="/giris"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-black"
        >
          Giriş yap
        </Link>
      </div>
    );
  }

  if (user.role !== "driver") {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight">
          Bu sayfa sürücüler içindir
        </h2>
        <p className="mt-2 text-muted">
          {user.name} olarak {roleLabels[user.role]} rolüyle giriş yaptın.
          Yolculuk oluşturmak için çıkış yapıp Sürücü rolüyle tekrar giriş
          yapabilirsin.
        </p>
        <Link
          href="/giris"
          className="mt-6 inline-block rounded-full border border-line px-6 py-3 text-sm font-medium text-ink hover:bg-surface"
        >
          Giriş sayfasına git
        </Link>
      </div>
    );
  }

  if (created) {
    const share = calcSharePerPerson(created.totalCost, created.seats);

    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-sky">Yolculuk kaydedildi</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          {created.origin} → {created.destination}
        </h2>
        <p className="mt-1 text-muted">{eventTitle} etkinliği için</p>

        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted">
              Buluşma noktası
            </dt>
            <dd className="mt-1 font-semibold">{created.meetingPoint}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted">
              Kalkış → tahmini varış
            </dt>
            <dd className="mt-1 font-semibold">
              {created.departureTime} →{" "}
              {calcArrival(created.departureTime, created.durationMinutes)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted">
              Boş koltuk
            </dt>
            <dd className="mt-1 font-semibold">{created.seats}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted">
              Tahmini kişi başı masraf
            </dt>
            <dd className="mt-1 font-semibold">{share} TL</dd>
          </div>
        </dl>

        <p className="mt-6 rounded-2xl bg-surface p-4 text-sm text-muted">
          Demo bilgisi: Bu yolculuk yalnızca bu tarayıcıda saklanır. Masraf
          tutarı tahminidir, ödeme alınmaz.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/events/${eventId}`}
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white hover:bg-black"
          >
            Etkinliğe dön
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink hover:bg-surface"
          >
            Yeni yolculuk oluştur
          </button>
        </div>
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
      className="space-y-6 rounded-3xl bg-white p-8 shadow-sm"
    >
      <p className="text-sm text-muted">
        Sürücü olarak giriş yaptın: <strong>{user.name}</strong>
      </p>

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
          <label htmlFor="seats" className="block text-sm font-medium text-ink">
            Boş koltuk sayısı
          </label>
          <select
            id="seats"
            value={values.seats}
            onChange={(event) => update("seats", event.target.value)}
            className={`${baseInput} border-line`}
          >
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
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

      <div className="rounded-2xl bg-surface p-4 text-sm">
        <p className="font-medium text-ink">Tahmini kişi başı masraf</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          {previewShare === null ? "—" : `${previewShare} TL`}
        </p>
        <p className="mt-1 text-muted">
          Masraf, sürücü dahil herkese eşit bölünür. Bu yalnızca bir tahmindir,
          ödeme alınmaz.
        </p>
      </div>

      {saveError && (
        <p role="alert" className="text-sm text-red-600">
          {saveError}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-full bg-ink px-6 py-3 text-base font-medium text-white transition-colors hover:bg-black"
      >
        Yolculuğu oluştur
      </button>
    </form>
  );
}