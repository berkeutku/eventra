"use client";

import { useState } from "react";
import {
  DEFAULT_CONSUMPTION,
  DEFAULT_FUEL_PRICE,
  suggestRideCost,
} from "@/lib/trip-estimates";

const inputClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink";

function toNumber(text: string): number {
  return Number(text.trim().replace(",", "."));
}

export default function CostHelper({
  distanceMeters,
  onApply,
}: {
  distanceMeters: number | null;
  onApply: (cost: number) => void;
}) {
  const [consumption, setConsumption] = useState(String(DEFAULT_CONSUMPTION));
  const [price, setPrice] = useState(String(DEFAULT_FUEL_PRICE));
  const [tolls, setTolls] = useState("0");

  if (distanceMeters === null) {
    return null;
  }

  const km = Math.max(1, Math.round(distanceMeters / 1000));
  const suggestion = suggestRideCost({
    distanceMeters,
    litersPer100: toNumber(consumption),
    pricePerLiter: toNumber(price),
    tolls: toNumber(tolls),
  });

  return (
    <div className="rounded-2xl border border-dashed border-violet/40 bg-lilac/40 p-4 sm:p-5">
      <p className="text-sm font-extrabold text-ink">
        Mesafeye göre masraf önerisi
      </p>
      <p className="mt-1 text-sm text-muted">
        Rota yaklaşık {km} km. Aracına göre değerleri değiştirebilirsin.
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="cost-consumption" className="text-sm font-bold text-ink">
            Tüketim (L/100 km)
          </label>
          <input
            id="cost-consumption"
            inputMode="decimal"
            value={consumption}
            onChange={(event) => setConsumption(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cost-price" className="text-sm font-bold text-ink">
            Yakıt litre fiyatı (TL)
          </label>
          <input
            id="cost-price"
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cost-tolls" className="text-sm font-bold text-ink">
            Otoyol / köprü (TL)
          </label>
          <input
            id="cost-tolls"
            inputMode="decimal"
            value={tolls}
            onChange={(event) => setTolls(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {suggestion === null ? (
          <p className="text-sm font-medium text-coral-ink">
            Değerleri kontrol et (tüketim 2-30, fiyat 1-500 TL arasında olmalı).
          </p>
        ) : (
          <>
            <p className="text-sm text-ink">
              Önerilen toplam:{" "}
              <span className="text-xl font-extrabold text-violet">
                {suggestion} TL
              </span>
            </p>
            <button
              type="button"
              onClick={() => onApply(suggestion)}
              className="rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky"
            >
              Bu tutarı kullan
            </button>
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-muted">
        Öneri yalnızca yakıt ve yol (otoyol, köprü) masrafı içindir, kâr için
        değil. Yakıt fiyatı sürekli değişir, güncel pompa fiyatını sen gir.
        Rota hesabı trafik içermez.
      </p>
    </div>
  );
}