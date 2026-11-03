"use client";

import { useState, useTransition } from "react";
import { signOutOtherDevicesAction } from "@/app/panel/security-actions";

export default function SecurityCard({
  sessionCount,
}: {
  sessionCount: number;
}) {
  const [count, setCount] = useState(sessionCount);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const others = Math.max(0, count - 1);

  function run() {
    startTransition(async () => {
      const result = await signOutOtherDevicesAction();

      if (result.ok) {
        setCount(1);
        setNote(
          result.closed > 0
            ? `${result.closed} oturum kapatıldı.`
            : "Kapatılacak başka oturum yoktu.",
        );
      } else {
        setNote("İşlem tamamlanamadı. Lütfen tekrar dene.");
      }
    });
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
      <h2 className="text-xl font-extrabold tracking-tight">Güvenlik</h2>
      <p className="mt-2 text-sm text-muted">
        Şu an {count} açık oturumun var (bu cihaz dahil). Tanımadığın bir cihazda
        oturumun açık kaldıysa diğer oturumları kapatabilirsin, bu cihazdaki
        oturum açık kalır.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={pending || others === 0}
        className="mt-4 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Kapatılıyor…" : "Diğer cihazlardaki oturumları kapat"}
      </button>

      {note && (
        <p role="status" className="mt-3 text-sm font-bold text-mint-ink">
          {note}
        </p>
      )}
    </section>
  );
}