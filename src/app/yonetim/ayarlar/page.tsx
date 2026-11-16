import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { getShowRealEventsInfo } from "@/lib/app-settings";
import { getCurrentUser } from "@/lib/auth";
import { setShowRealEventsAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ayarlar | Eventra",
  robots: { index: false, follow: false },
};

function formatDate(date: Date): string {
  return date.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminEmail(user.email)) {
    notFound();
  }

  const info = await getShowRealEventsInfo();

  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ayarlar
        </h1>
        <p className="mt-2 text-muted">Yalnızca yönetici hesabı görür.</p>
        <Link
          href="/yonetim/raporlar"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-violet hover:underline"
        >
          &larr; Şikâyetler
        </Link>

        <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-line">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold">
              Gerçek etkinlikler (biletimGO)
            </h2>
            <span
              className={
                "rounded-full px-3 py-1 text-sm font-bold " +
                (info.enabled
                  ? "bg-sea text-mint-ink"
                  : "bg-lilac text-violet")
              }
            >
              {info.enabled ? "Açık" : "Kapalı"}
            </span>
          </div>

          <p className="mt-3 text-sm text-muted">
            Kapalıyken sitede yalnızca demo etkinlikler görünür. biletimGO
            etkinliklerin herkese açık gösterilmesine yazılı olarak izin
            vermeden bu anahtarı açma.
          </p>

          <p className="mt-3 text-sm text-muted">
            {info.fromDatabase && info.updatedAt
              ? `Son değişiklik: ${formatDate(info.updatedAt)}${info.updatedBy ? " (" + info.updatedBy + ")" : ""}.`
              : "Henüz panelden değiştirilmedi; değer ortam değişkeninden (SHOW_REAL_EVENTS) geliyor."}
          </p>

          {info.enabled ? (
            <form action={setShowRealEventsAction} className="mt-5">
              <input type="hidden" name="enabled" value="0" />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-ink ring-1 ring-line hover:bg-lilac"
              >
                Gerçek etkinlikleri kapat
              </button>
            </form>
          ) : (
            <form action={setShowRealEventsAction} className="mt-5 space-y-4">
              <input type="hidden" name="enabled" value="1" />
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="confirm"
                  required
                  className="mt-1 h-5 w-5 shrink-0"
                />
                <span>
                  biletimGO&apos;dan etkinlikleri herkese açık göstermem için
                  yazılı onay aldım.
                </span>
              </label>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-full bg-violet px-5 text-sm font-bold text-white hover:opacity-90"
              >
                Gerçek etkinlikleri aç
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
