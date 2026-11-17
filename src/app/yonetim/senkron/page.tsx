import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { listRecentSyncRuns } from "@/lib/sync-runs";
import {
  consecutiveFailures,
  explainSyncError,
  formatRunDuration,
  syncStatusLabel,
  syncStatusTone,
} from "@/lib/sync-runs-rules";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Senkron geçmişi | Eventra",
  robots: { index: false, follow: false },
};

const toneClass = {
  good: "bg-sea text-mint-ink",
  bad: "bg-peach text-coral-ink",
  warn: "bg-peach text-coral-ink",
  neutral: "bg-lilac text-violet",
} as const;

function formatDate(date: Date): string {
  return date.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

export default async function SyncHistoryPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminEmail(user.email)) {
    notFound();
  }

  const runs = await listRecentSyncRuns(30);
  const failures = consecutiveFailures(runs.map((run) => run.status));
  const lastSuccess = runs.find((run) => run.status === "success");

  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Senkron geçmişi
        </h1>
        <p className="mt-2 text-muted">
          biletimGO etkinlik listesinin son çalışmaları. Yalnızca yönetici
          hesabı görür.
        </p>
        <Link
          href="/yonetim/ayarlar"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-violet hover:underline"
        >
          &larr; Ayarlar
        </Link>

        <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-line">
          <h2 className="text-xl font-extrabold">Özet</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            <li>
              Son başarılı senkron:{" "}
              <strong className="text-ink">
                {lastSuccess ? formatDate(lastSuccess.startedAt) : "hiç yok"}
              </strong>
            </li>
            <li>
              Üst üste başarısız deneme:{" "}
              <strong className="text-ink">{failures}</strong>
            </li>
          </ul>
        </section>

        {runs.length === 0 ? (
          <p className="mt-6 rounded-3xl bg-white p-6 text-muted ring-1 ring-line">
            Henüz kayıtlı bir senkron çalışması yok.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {runs.map((run) => {
              const duration = formatRunDuration(run.startedAt, run.finishedAt);
              const explanation = explainSyncError(run.errorCode);

              return (
                <li
                  key={run.id}
                  className="rounded-3xl bg-white p-5 ring-1 ring-line"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold">
                      {formatDate(run.startedAt)}
                    </span>
                    <span
                      className={
                        "rounded-full px-3 py-1 text-xs font-bold " +
                        toneClass[syncStatusTone(run.status)]
                      }
                    >
                      {syncStatusLabel(run.status)}
                    </span>
                  </div>

                  {explanation ? (
                    <p className="mt-2 text-sm text-muted">{explanation}</p>
                  ) : null}

                  <p className="mt-2 text-xs text-muted">
                    {duration ? `Süre: ${duration} · ` : ""}
                    API&apos;den gelen: {run.fetched ?? 0} · eklenen:{" "}
                    {run.inserted ?? 0} · güncellenen: {run.updated ?? 0} ·
                    atlanan: {run.skipped ?? 0} · pasifleşen:{" "}
                    {run.deactivated ?? 0}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
