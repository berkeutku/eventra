"use client";

import { useActionState, useState, useTransition } from "react";
import { useToast } from "@/components/Toast";
import {
  changeRideStatusAction,
  createShareLinkAction,
  saveVehicleAction,
  type VehicleState,
} from "@/lib/ride-day-actions";
import {
  MAX_VEHICLE,
  nextStatus,
  statusLabels,
  type RideStatus,
} from "@/lib/ride-day-rules";

type Props = {
  rideId: string;
  isDriver: boolean;
  status: RideStatus;
  vehicle: string | null;
  windowOpen: boolean;
};

const badgeTone: Record<RideStatus, string> = {
  planned: "bg-lilac text-violet",
  departed: "bg-sun/30 text-ink",
  arrived: "bg-sea text-mint-ink",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/60";

export default function RideDayPanel({
  rideId,
  isDriver,
  status,
  vehicle,
  windowOpen,
}: Props) {
  const toast = useToast();
  const [vehicleState, vehicleAction, vehiclePending] = useActionState(
    saveVehicleAction,
    {} as VehicleState,
  );
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, startShare] = useTransition();
  const next = nextStatus(status);

  function makeLink() {
    startShare(async () => {
      const result = await createShareLinkAction(rideId);

      if (result.path) {
        setShareUrl(`${window.location.origin}${result.path}`);
      } else {
        toast.show(result.message ?? "Bağlantı oluşturulamadı.", "info");
      }
    });
  }

  async function copy() {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.show("Bağlantı kopyalandı.");
    } catch {
      toast.show("Kopyalanamadı, bağlantıyı elle seçip kopyala.", "info");
    }
  }

  async function share() {
    if (!shareUrl) {
      return;
    }

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Eventra yolculuğum", url: shareUrl });
      } catch {
        // Kullanıcı paylaşımı kapattı.
      }
      return;
    }

    await copy();
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Yolculuk günü
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold ${badgeTone[status]}`}
        >
          {statusLabels[status]}
        </span>
      </div>

      {!isDriver && (
        <p className="mt-4 text-sm text-ink">
          Araç:{" "}
          <strong>
            {vehicle ?? "Sürücü henüz araç bilgisi eklemedi."}
          </strong>
        </p>
      )}

      {isDriver && (
        <div className="mt-5 space-y-5">
          <form action={vehicleAction}>
            <input type="hidden" name="rideId" value={rideId} />
            <label
              htmlFor="vehicle"
              className="block text-sm font-bold text-ink"
            >
              Araç bilgisi (isteğe bağlı)
            </label>
            <input
              id="vehicle"
              name="vehicle"
              type="text"
              defaultValue={vehicle ?? ""}
              maxLength={MAX_VEHICLE}
              autoComplete="off"
              placeholder="Örn. Beyaz Clio, plaka sonu 123"
              className={inputClass}
            />
            <p className="mt-2 text-sm text-muted">
              Yolcular seni kapıda tanısın. Plakanın tamamını yazma, yalnızca
              son 2-3 hanesi yeter.
            </p>
            {vehicleState.message && (
              <p
                role="status"
                className={`mt-2 text-sm font-medium ${
                  vehicleState.ok ? "text-mint-ink" : "text-coral-ink"
                }`}
              >
                {vehicleState.message}
              </p>
            )}
            <button
              type="submit"
              disabled={vehiclePending}
              className="mt-3 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac disabled:opacity-60"
            >
              {vehiclePending ? "Kaydediliyor…" : "Araç bilgisini kaydet"}
            </button>
          </form>

          {next && windowOpen && (
            <form action={changeRideStatusAction}>
              <input type="hidden" name="rideId" value={rideId} />
              <input type="hidden" name="to" value={next} />
              <button
                type="submit"
                className="rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky"
              >
                {next === "departed"
                  ? "Yola çıktım"
                  : "Vardık, yolculuk tamamlandı"}
              </button>
              <p className="mt-2 text-sm text-muted">
                Yolculardaki herkese bildirim gider.
              </p>
            </form>
          )}

          {next && !windowOpen && (
            <p className="text-sm text-muted">
              Yola çıkış ve varış tuşları etkinlikten 3 saat önce açılır.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-line pt-6">
        <p className="text-sm font-bold text-ink">Güvenli paylaşım bağlantısı</p>
        <p className="mt-1 text-sm text-muted">
          Bir yakınına gönder: güzergâhı, saati, durumu ve araç bilgisini
          görür. Yolcu adları görünmez, bağlantı 24 saat geçerlidir.
        </p>

        {!shareUrl ? (
          <button
            type="button"
            onClick={makeLink}
            disabled={sharing}
            className="mt-3 rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky disabled:opacity-60"
          >
            {sharing ? "Oluşturuluyor…" : "Bağlantı oluştur"}
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <input
              readOnly
              value={shareUrl}
              aria-label="Paylaşım bağlantısı"
              onFocus={(event) => event.currentTarget.select()}
              className={inputClass}
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={share}
                className="rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky"
              >
                Paylaş
              </button>
              <button
                type="button"
                onClick={copy}
                className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac"
              >
                Kopyala
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}