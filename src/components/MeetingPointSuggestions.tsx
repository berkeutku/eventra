"use client";

import { useMemo } from "react";
import VenuePlan from "@/components/VenuePlan";
import {
  crowdLabel,
  findMeetingPoint,
  rankMeetingPoints,
} from "@/lib/meeting-points";

export default function MeetingPointSuggestions({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (name: string) => void;
}) {
  const ranked = useMemo(() => rankMeetingPoints(), []);
  const selected = findMeetingPoint(value);

  return (
    <div className="rounded-2xl border border-dashed border-violet/40 bg-lilac/40 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-extrabold">Buluşma noktası önerileri</p>
        <span className="rounded-full bg-sun/30 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-ink">
          Demo
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">
        Bir nokta seçersen yukarıdaki kutuya yazılır. İstersen kendi
        noktanı da yazabilirsin.
      </p>

      <div className="mt-4 grid items-center gap-5 sm:grid-cols-2">
        <VenuePlan ranked={ranked} selectedId={selected?.id} />

        <ol className="space-y-2">
          {ranked.map((item) => {
            const isSelected = selected?.id === item.point.id;

            return (
              <li key={item.point.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(item.point.name)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-violet bg-white ring-2 ring-violet/20"
                      : "border-line bg-white hover:border-violet/50"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-extrabold">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                          isSelected
                            ? "bg-violet text-white"
                            : "bg-lilac text-violet"
                        }`}
                      >
                        {item.rank}
                      </span>
                      {item.point.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {item.rank === 1 && (
                        <span className="rounded-full bg-violet px-2 py-0.5 text-[10px] font-bold text-white">
                          En uygun
                        </span>
                      )}
                      <span className="rounded-full bg-sea px-2 py-0.5 text-xs font-bold text-mint-ink">
                        %{item.score}
                      </span>
                    </span>
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted">
                    <span className="rounded-full bg-surface px-2 py-0.5">
                      {item.point.walkMinutes} dk yürüyüş
                    </span>
                    <span className="rounded-full bg-surface px-2 py-0.5">
                      Kalabalık: {crowdLabel(item.point.crowd)}
                    </span>
                    <span className="rounded-full bg-surface px-2 py-0.5">
                      {item.point.lit ? "Aydınlık" : "Aydınlatma az"}
                    </span>
                    <span className="rounded-full bg-surface px-2 py-0.5">
                      {item.point.stepFree ? "Engelsiz erişim" : "Basamak var"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <details className="mt-4 rounded-xl bg-white p-3 text-sm">
        <summary className="cursor-pointer font-bold text-ink">
          Puanlar nasıl hesaplandı?
        </summary>
        <p className="mt-2 text-muted">
          Yürüyüş mesafesi en fazla 40, tahmini kalabalık 40, aydınlatma 10,
          engelsiz erişim 10 puan. Yapay zekâ kullanılmaz.
        </p>
        <ul className="mt-2 space-y-1 text-muted">
          {ranked.map((item) => (
            <li key={item.point.id}>
              <span className="font-bold text-ink">{item.point.name}:</span>{" "}
              {item.reasons
                .map((reason) => `${reason.label} ${reason.points}/${reason.max}`)
                .join(" + ")}{" "}
              = <span className="font-bold text-violet">{item.score}</span>
            </li>
          ))}
        </ul>
      </details>

      <p className="mt-3 text-xs text-muted">
        Mekan planı, yürüyüş süreleri ve kalabalık tahminleri kurgusal demo
        verisidir. Gerçek bir ölçüm, harita ya da kalabalık verisi kullanılmaz.
      </p>
    </div>
  );
}