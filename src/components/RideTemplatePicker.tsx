"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { listRideTemplatesAction } from "@/lib/ride-template-actions";
import type { RideTemplate } from "@/lib/ride-templates";

type Picked = {
  origin: string;
  destination: string;
  meetingPoint: string;
  departureTime: string;
  duration: string;
  seats: string;
  cost: string;
};

export default function RideTemplatePicker({
  onPick,
}: {
  onPick: (values: Picked) => void;
}) {
  const toast = useToast();
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [items, setItems] = useState<RideTemplate[]>([]);

  async function load() {
    setState("loading");
    const result = await listRideTemplatesAction();

    if (!result) {
      setState("error");
      return;
    }

    setItems(result);
    setState("ready");
  }

  function pick(item: RideTemplate) {
    onPick({
      origin: item.origin,
      destination: item.destination,
      meetingPoint: item.meetingPoint,
      departureTime: item.departureTime,
      duration: String(item.durationMinutes),
      seats: String(item.seats),
      cost: String(item.totalCost),
    });
    toast.show("Form dolduruldu. Bilgileri kontrol edip yolculuğu oluştur.");
  }

  return (
    <div className="rounded-2xl bg-lilac/60 p-4">
      <p className="text-sm font-bold text-ink">Önceki yolculuklarımdan doldur</p>
      <p className="mt-1 text-xs text-muted">
        Hiçbir şey otomatik oluşturulmaz. Seçtiğin bilgiler forma yazılır, sen
        kontrol edip gönderirsin.
      </p>

      {state === "idle" && (
        <button
          type="button"
          onClick={load}
          className="mt-3 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-lilac"
        >
          Önceki yolculuklarımı göster
        </button>
      )}

      {state === "loading" && (
        <p className="mt-3 text-sm text-muted">Yükleniyor…</p>
      )}

      {state === "error" && (
        <p role="alert" className="mt-3 text-sm font-medium text-coral-ink">
          Önceki yolculuklar alınamadı. Lütfen tekrar dene.
        </p>
      )}

      {state === "ready" && items.length === 0 && (
        <p className="mt-3 text-sm text-muted">
          Henüz önceki bir yolculuğun yok.
        </p>
      )}

      {state === "ready" && items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${item.origin}-${item.destination}-${index}`}>
              <button
                type="button"
                onClick={() => pick(item)}
                className="w-full rounded-xl border border-line bg-white p-3 text-left text-sm transition-colors hover:bg-lilac"
              >
                <span className="block font-bold text-ink">
                  {item.origin} → {item.destination}
                </span>
                <span className="block text-muted">
                  {item.departureTime} · {item.seats} koltuk · {item.totalCost} TL ·{" "}
                  {item.meetingPoint}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}