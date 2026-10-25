"use client";

import { useState } from "react";
import { calcSharePerPerson } from "@/lib/ride-utils";

function money(value: number): string {
  return value.toLocaleString("tr-TR");
}

export default function CostCalculator() {
  const [seats, setSeats] = useState(3);
  const [cost, setCost] = useState(600);

  const people = seats + 1;
  const share = calcSharePerPerson(cost, seats);
  const saving = Math.max(cost - share, 0);

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl shadow-violet/10 ring-1 ring-black/5">
      <div>
        <label
          htmlFor="calc-cost"
          className="flex items-baseline justify-between gap-4 text-sm font-bold"
        >
          <span>Tahmini toplam yol masrafı</span>
          <span className="text-violet">{money(cost)} TL</span>
        </label>
        <input
          id="calc-cost"
          type="range"
          min={0}
          max={2000}
          step={50}
          value={cost}
          onChange={(event) => setCost(Number(event.target.value))}
          className="mt-3 w-full accent-violet"
        />
      </div>

      <div className="mt-6">
        <label
          htmlFor="calc-seats"
          className="flex items-baseline justify-between gap-4 text-sm font-bold"
        >
          <span>Boş koltuk sayısı</span>
          <span className="text-violet">{seats}</span>
        </label>
        <input
          id="calc-seats"
          type="range"
          min={1}
          max={6}
          step={1}
          value={seats}
          onChange={(event) => setSeats(Number(event.target.value))}
          className="mt-3 w-full accent-violet"
        />
      </div>

      <div
        aria-live="polite"
        className="mt-8 rounded-2xl bg-lilac p-6 text-center"
      >
        <p className="text-sm font-bold text-muted">
          {people} kişi arasında bölünür
        </p>
        <p className="mt-1 text-5xl font-extrabold tracking-tight text-violet">
          {money(share)} TL
        </p>
        <p className="mt-1 text-sm text-muted">kişi başı tahmini masraf</p>
        {saving > 0 && (
          <p className="mt-4 inline-block rounded-full bg-sea px-4 py-1.5 text-sm font-bold text-mint-ink">
            Tek başına gitmeye göre {money(saving)} TL daha az
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">
        Sürücü dahil herkes eşit öder. Bu yalnızca bir tahmindir, Eventra ödeme
        almaz.
      </p>
    </div>
  );
}