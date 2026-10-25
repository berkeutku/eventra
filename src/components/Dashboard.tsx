"use client";

import Link from "next/link";
import { useState } from "react";
import type { AuthUser } from "@/lib/auth";
import { formatEventDate } from "@/lib/format";
import { deleteRideAction } from "@/lib/ride-actions";
import {
  calcArrival,
  calcSharePerPerson,
  type DriverRideItem,
} from "@/lib/ride-utils";
import { roleLabels } from "@/lib/roles";

type RideRowProps = {
  ride: DriverRideItem;
  confirming: boolean;
  onAskDelete: () => void;
  onCancel: () => void;
};

function RideRow({ ride, confirming, onAskDelete, onCancel }: RideRowProps) {
  const share = calcSharePerPerson(ride.totalCost, ride.seats);

  return (
    <li className="rounded-2xl border border-line p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/events/${ride.eventId}`}
            className="text-xs font-bold uppercase tracking-wider text-violet hover:underline"
          >
            {ride.eventTitle} · {formatEventDate(ride.eventStartsAt)}
          </Link>
          <h3 className="mt-1 text-lg font-extrabold tracking-tight">
            {ride.origin} → {ride.destination}
          </h3>
          <p className="mt-1 text-sm text-muted">
            Buluşma: {ride.meetingPoint}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold tracking-tight text-violet">
            {share} TL
          </p>
          <p className="text-xs text-muted">tahmini kişi başı</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink">
        {ride.departureTime} →{" "}
        {calcArrival(ride.departureTime, ride.durationMinutes)} · {ride.seats}{" "}
        boş koltuk
      </p>

      <div className="mt-4">
        {confirming ? (
          <form
            action={deleteRideAction}
            className="flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="rideId" value={ride.id} />
            <span className="text-sm font-bold text-ink">
              Bu yolculuğu silmek istediğine emin misin?
            </span>
            <button
              type="submit"
              className="rounded-full bg-coral px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              Evet, sil
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-lilac"
            >
              Vazgeç
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={onAskDelete}
            className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink hover:bg-lilac"
          >
            Sil
          </button>
        )}
      </div>
    </li>
  );
}

export default function Dashboard({
  user,
  rides,
}: {
  user: AuthUser;
  rides: DriverRideItem[];
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const totalSeats = rides.reduce((sum, ride) => sum + ride.seats, 0);

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
        <p className="text-sm text-muted">Hoş geldin</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">
          {user.name}
        </p>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
        <span className="mt-3 inline-block rounded-full bg-lilac px-4 py-1.5 text-sm font-bold text-violet">
          {roleLabels[user.role]}
        </span>

        {user.role === "driver" && (
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-lilac p-5">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                Oluşturduğun yolculuk
              </dt>
              <dd className="mt-1 text-3xl font-extrabold">{rides.length}</dd>
            </div>
            <div className="rounded-2xl bg-sea p-5">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                Toplam boş koltuk
              </dt>
              <dd className="mt-1 text-3xl font-extrabold">{totalSeats}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
        <h2 className="text-2xl font-extrabold tracking-tight">Yolculuklarım</h2>

        {user.role === "driver" ? (
          rides.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-surface p-6 text-center">
              <p className="font-bold text-ink">Henüz yolculuk oluşturmadın</p>
              <p className="mt-1 text-sm text-muted">
                Bir etkinlik seç ve boş koltuklarını paylaş.
              </p>
              <Link
                href="/events"
                className="mt-4 inline-block text-sm font-bold text-violet hover:underline"
              >
                Etkinliklere git &rarr;
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {rides.map((ride) => (
                <RideRow
                  key={ride.id}
                  ride={ride}
                  confirming={confirmId === ride.id}
                  onAskDelete={() => setConfirmId(ride.id)}
                  onCancel={() => setConfirmId(null)}
                />
              ))}
            </ul>
          )
        ) : (
          <div className="mt-6 rounded-2xl bg-surface p-6 text-center">
            <p className="font-bold text-ink">Katıldığın bir yolculuk yok</p>
            <p className="mt-1 text-sm text-muted">
              Yolculuğa katılma özelliği bir sonraki adımda eklenecek. Şimdilik
              etkinliklerdeki yolculukları inceleyebilirsin.
            </p>
            <Link
              href="/events"
              className="mt-4 inline-block text-sm font-bold text-violet hover:underline"
            >
              Etkinliklere git &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}