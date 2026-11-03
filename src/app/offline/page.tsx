import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Çevrimdışısın | Eventra",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <main className="relative overflow-hidden px-6 py-16 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-violet/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-mint/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-xl text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lilac text-violet">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-10 w-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5a10 10 0 0 1 4-2.4M2 9a15 15 0 0 1 4.2-2.7M19 12.5a10 10 0 0 0-2.1-1.6M22 9a15 15 0 0 0-8-4.4M8.5 16a5 5 0 0 1 7 0" />
            <circle cx="12" cy="19.5" r="1" fill="currentColor" />
            <path d="M3 3l18 18" />
          </svg>
        </span>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
          İnternet bağlantın yok
        </h1>
        <p className="mt-4 text-lg text-muted">
          Bağlantın geri geldiğinde kaldığın yerden devam edebilirsin.
          Yolculuk ve hesap bilgilerin güvenlik için cihazında saklanmaz, bu
          yüzden çevrimdışıyken yalnızca bu sayfa açılır.
        </p>

        <Link
          href="/"
          prefetch={false}
          className="mt-8 inline-flex items-center rounded-full bg-violet px-7 py-3.5 text-base font-bold text-white shadow-soft transition-colors hover:bg-sky"
        >
          Tekrar dene
        </Link>
      </div>
    </main>
  );
}