"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import CostHelper from "@/components/CostHelper";
import RoutePicker from "@/components/RoutePicker";
import type { Pt } from "@/lib/geo-rules";
import { updateRideAction, type EditRideState } from "@/lib/ride-edit-actions";
import { calcSharePerPerson } from "@/lib/ride-utils";

export type EditValues = {
  origin: string;
  destination: string;
  meetingPoint: string;
  departureTime: string;
  duration: string;
  seats: string;
  cost: string;
};

export type EditGeo = {
  origin: Pt;
  meeting: Pt;
  dest: Pt;
  distanceMeters: number | null;
  durationSeconds: number | null;
  path: [number, number][] | null;
};

type FieldKey = keyof EditValues;

const baseInput =
  "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  inputMode,
  hint,
}: {
  id: FieldKey;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "time";
  inputMode?: "numeric";
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={`edit-${id}`} className="block text-sm font-bold text-ink">
        {label}
      </label>
      <input
        id={`edit-${id}`}
        name={id}
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `edit-${id}-error` : undefined}
        className={`${baseInput} ${error ? "border-coral" : "border-line"}`}
      />
      {error ? (
        <p
          id={`edit-${id}-error`}
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

export default function RideEditForm({
  rideId,
  eventId,
  initial,
  initialGeo,
  passengerCount,
}: {
  rideId: string;
  eventId: string;
  initial: EditValues;
  initialGeo: EditGeo | null;
  passengerCount: number;
}) {
  const [state, formAction, pending] = useActionState(
    updateRideAction,
    {} as EditRideState,
  );
  const [values, setValues] = useState<EditValues>(initial);
  const [distance, setDistance] = useState<number | null>(
    initialGeo?.distanceMeters ?? null,
  );
  const errors = state.errors ?? {};
  const minSeats = Math.max(1, passengerCount);

  function update(field: FieldKey, value: string) {
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

  const costNumber = /^\d+$/.test(values.cost.trim())
    ? Number(values.cost.trim())
    : null;
  const previewShare =
    costNumber !== null && costNumber <= 5000
      ? calcSharePerPerson(costNumber, Number(values.seats))
      : null;

  const pickerInitial = initialGeo
    ? {
        points: {
          origin: initialGeo.origin,
          meeting: initialGeo.meeting,
          dest: initialGeo.dest,
        },
        route:
          initialGeo.path &&
          initialGeo.distanceMeters !== null &&
          initialGeo.durationSeconds !== null
            ? {
                distanceMeters: initialGeo.distanceMeters,
                durationSeconds: initialGeo.durationSeconds,
                path: initialGeo.path,
              }
            : null,
      }
    : undefined;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
    >
      <input type="hidden" name="rideId" value={rideId} />

      {passengerCount > 0 && (
        <p className="rounded-2xl bg-lilac p-4 text-sm text-ink">
          Bu yolculuğa {passengerCount} yolcu katılmış. Güzergâh, harita
          noktaları, saat ya da masrafı değiştirirsen yolcular bildirimle
          haberdar edilir.
        </p>
      )}

      {state.message && (
        <p
          role="alert"
          className="rounded-2xl bg-peach p-4 text-sm font-medium text-coral-ink"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="origin"
          label="Başlangıç noktası"
          value={values.origin}
          onChange={(value) => update("origin", value)}
          error={errors.origin}
        />
        <Field
          id="destination"
          label="Varış noktası"
          value={values.destination}
          onChange={(value) => update("destination", value)}
          error={errors.destination}
        />
      </div>

      <Field
        id="meetingPoint"
        label="Buluşma noktası"
        value={values.meetingPoint}
        onChange={(value) => update("meetingPoint", value)}
        error={errors.meetingPoint}
      />

      <RoutePicker
        initial={pickerInitial}
        onDuration={(minutes) => update("duration", String(minutes))}
        onRoute={(route) => setDistance(route ? route.distanceMeters : null)}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="departureTime"
          label="Kalkış saati"
          type="time"
          value={values.departureTime}
          onChange={(value) => update("departureTime", value)}
          error={errors.departureTime}
        />
        <Field
          id="duration"
          label="Tahmini yolculuk süresi (dakika)"
          inputMode="numeric"
          value={values.duration}
          onChange={(value) => update("duration", value)}
          error={errors.duration}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-seats" className="block text-sm font-bold text-ink">
            Boş koltuk sayısı
          </label>
          <select
            id="edit-seats"
            name="seats"
            value={values.seats}
            onChange={(event) => update("seats", event.target.value)}
            className={`${baseInput} ${errors.seats ? "border-coral" : "border-line"}`}
          >
            {[1, 2, 3, 4, 5, 6]
              .filter((count) => count >= minSeats)
              .map((count) => (
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
        <Field
          id="cost"
          label="Tahmini toplam yol masrafı (TL)"
          inputMode="numeric"
          value={values.cost}
          onChange={(value) => update("cost", value)}
          error={errors.cost}
        />
      </div>

      <CostHelper
        distanceMeters={distance}
        onApply={(cost) => update("cost", String(cost))}
      />

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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-violet px-7 py-3.5 text-base font-bold text-white shadow-soft transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
        </button>
        <Link
          href={`/events/${eventId}/yolculuk/${rideId}`}
          className="rounded-full border border-line px-6 py-3.5 text-base font-bold text-ink transition-colors hover:bg-lilac"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  );
}