"use client";

import { useState, useTransition } from "react";
import { saveNotificationPrefsAction } from "@/app/panel/prefs-actions";
import { useToast } from "@/components/Toast";
import {
  PREF_TYPES,
  prefLabels,
  type PrefType,
} from "@/lib/notification-pref-types";

export default function NotificationPrefs({ muted }: { muted: PrefType[] }) {
  const toast = useToast();
  const [enabled, setEnabled] = useState<Record<PrefType, boolean>>(
    () =>
      Object.fromEntries(
        PREF_TYPES.map((type) => [type, !muted.includes(type)]),
      ) as Record<PrefType, boolean>,
  );
  const [pending, startTransition] = useTransition();

  function toggle(type: PrefType) {
    setEnabled((current) => ({ ...current, [type]: !current[type] }));
  }

  function save() {
    const mutedNow = PREF_TYPES.filter((type) => !enabled[type]);

    startTransition(async () => {
      const ok = await saveNotificationPrefsAction(mutedNow);

      if (ok) {
        toast.show("Bildirim tercihlerin kaydedildi.");
      } else {
        toast.show("Tercihler kaydedilemedi. Lütfen tekrar dene.", "info");
      }
    });
  }

  return (
    <div className="mt-4 rounded-2xl bg-surface p-5">
      <p className="text-sm font-bold text-ink">Hangi olaylar telefona bildirilsin?</p>
      <p className="mt-1 text-sm text-muted">
        Uygulama içi bildirim kutun her zaman dolar, bu ayar yalnızca telefon
        bildirimlerini etkiler.
      </p>

      <ul className="mt-4 space-y-3">
        {PREF_TYPES.map((type) => (
          <li key={type}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
              <input
                type="checkbox"
                checked={enabled[type]}
                onChange={() => toggle(type)}
                className="mt-1 h-5 w-5 shrink-0 accent-violet"
              />
              <span>
                <span className="block text-sm font-bold text-ink">
                  {prefLabels[type].title}
                </span>
                <span className="block text-sm text-muted">
                  {prefLabels[type].text}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="mt-4 rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Tercihleri kaydet"}
      </button>
    </div>
  );
}