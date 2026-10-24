"use client";

import { useState } from "react";
import Link from "next/link";
import { events } from "@/data/events";
import { formatEventDate } from "@/lib/format";
import {
  calcArrival,
  calcSharePerPerson,
  deleteRide,
  useRides,
  type Ride,
} from "@/lib/rides";
import { roleLabels, useDemoUser } from "@/lib/session";

type RideRowProps = {
  ride: Ride;
  confirming: boolean;
  onAskDelete: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

function RideRow({
  ride,
  confirming,
  onAskDelete,
  onCancel,
  onConfirm,
}: RideRowProps) {
  const event = events.find((item) => item.id === ride.eventId);
  const share = calcSharePerPerson(ride.totalCost, ride.seats);

  return (
    <li className="rounded-2xl border border-line p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {event ? (
            <Link
              href={`/events/${event.id}`}
              className="text-xs font-semibold uppercase tracking-wider text-violet hover:underline"
            >
              {event.title} · {formatEventDate(event.startsAt)}
            </Link>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Etkinlik bulunamadı
            </p>
          )}
          <h3 className="mt-1 text-lg font-bold tracking-tight">
            {ride.origin} → {ride.destination}
          </h3>
          <p className="mt-1 text-sm text-muted">
            Buluşma: {ride.meetingPoint}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tracking-tight">{share} TL</p>
          <p className="text-xs text-muted">tahmini kişi başı</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink">
        {ride.departureTime} →{" "}
        {calcArrival(ride.departureTime, ride.durationMinutes)} ·{" "}
        {ride.seats} boş koltuk
      </p>

      <div className="mt-4">
        {confirming ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-ink">
              Bu yolculuğu silmek istediğine emin misin?
            </span>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Evet, sil
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-lilac"
            >
              Vazgeç
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAskDelete}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-lilac"
          >
            Sil
          </button>
        )}
      </div>
    </li>
  );
}

export default function Dashboard() {
  const user = useDemoUser();
  const allRides = useRides();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (user === undefined || allRides === undefined) {
    return <div className="mt-8 h-64" aria-busy="true" />;
  }

  if (user === null) {
    return (
      <div className="mt-8 rounded-3xl bg-white p-8 shadow-md shadow-violet/5 ring-1 ring-line">
        <h2 className="text-2xl font-bold tracking-tight">
          Panelini görmek için giriş yap
        </h2>
        <p className="mt-2 text-muted">
          Demo girişi yapıp rolünü seçtikten sonra panelin açılır.
        </p>
        <Link
          href="/giris"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-violet"
        >
          Giriş yap
        </Link>
      </div>
    );
  }

  const myRides =
    user.role === "driver"
      ? allRides
          .filter((ride) => ride.driverName === user.name)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];

  const totalSeats = myRides.reduce((sum, ride) => sum + ride.seats, 0);

  function handleConfirmDelete(id: string) {
    const ok = deleteRide(id);
    setConfirmId(null);
    setDeleteError(
      ok ? null : "Yolculuk silinemedi. Tarayıcın depolamaya izin vermiyor olabilir.",
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-md shadow-violet/5 ring-1 ring-line">
        <p className="text-sm text-muted">Hoş geldin</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{user.name}</p>
        <span className="mt-3 inline-block rounded-full bg-lilac px-4 py-1.5 text-sm font-semibold text-violet">
          {roleLabels[user.role]}
        </span>

        {user.role === "driver" && (
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-lilac p-5">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                Oluşturduğun yolculuk
              </dt>
              <dd className="mt-1 text-3xl font-bold">{myRides.length}</dd>
            </div>
            <div className="rounded-2xl bg-sea p-5">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                Toplam boş koltuk
              </dt>
              <dd className="mt-1 text-3xl font-bold">{totalSeats}</dd>
            </div>
          </dl>
        )}
      </div>

      {user.role === "driver" ? (
        <div className="rounded-3xl bg-white p-8 shadow-md shadow-violet/5 ring-1 ring-line">
          <h2 className="text-2xl font-bold tracking-tight">Yolculuklarım</h2>

          {deleteError && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {deleteError}
            </p>
          )}

          {myRides.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-surface p-6 text-center">
              <p className="font-semibold text-ink">
                Henüz yolculuk oluşturmadın
              </p>
              <p className="mt-1 text-sm text-muted">
                Bir etkinlik seç ve boş koltuklarını paylaş.
              </p>
              <Link
                href="/events"
                className="mt-4 inline-block text-sm font-semibold text-violet hover:underline"
              >
                Etkinliklere git &rarr;
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {myRides.map((ride) => (
                <RideRow
                  key={ride.id}
                  ride={ride}
                  confirming={confirmId === ride.id}
                  onAskDelete={() => setConfirmId(ride.id)}
                  onCancel={() => setConfirmId(null)}
                  onConfirm={() => handleConfirmDelete(ride.id)}
                />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-8 shadow-md shadow-violet/5 ring-1 ring-line">
          <h2 className="text-2xl font-bold tracking-tight">Yolculuklarım</h2>
          <div className="mt-6 rounded-2xl bg-surface p-6 text-center">
            <p className="font-semibold text-ink">
              Katıldığın bir yolculuk yok
            </p>
            <p className="mt-1 text-sm text-muted">
              Yolculuğa katılma özelliği gerçek veritabanı eklendiğinde
              çalışacak. Şimdilik etkinliklerdeki yolculukları inceleyebilirsin.
            </p>
            <Link
              href="/events"
              className="mt-4 inline-block text-sm font-semibold text-violet hover:underline"
            >
              Etkinliklere git &rarr;
            </Link>
          </div>
        </div>
      )}

      <p className="rounded-2xl bg-lilac p-4 text-sm text-muted">
        Demo bilgisi: Panel yalnızca bu tarayıcıdaki verileri gösterir.
        Yolculuklar ad eşleşmesiyle sana bağlanır, gerçek hesap sistemi
        backend aşamasında eklenecek.
      </p>
    </div>
  );
}