import Link from "next/link";
import Icon from "@/components/Icons";

export default function NotFound() {
  return (
    <main className="relative overflow-hidden px-6 py-16 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-violet/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-coral/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-xl text-center">
        <svg
          viewBox="0 0 220 120"
          aria-hidden="true"
          className="mx-auto h-32 w-56"
        >
          <path
            d="M20 14h180a10 10 0 0 1 10 10v22a14 14 0 0 0 0 28v22a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10V74a14 14 0 0 0 0-28V24a10 10 0 0 1 10-10z"
            fill="#efebff"
            stroke="#c9bbff"
            strokeWidth="3"
          />
          <path
            d="M150 20v80"
            stroke="#6c4dff"
            strokeOpacity="0.35"
            strokeWidth="3"
            strokeDasharray="6 7"
          />
          <text
            x="80"
            y="76"
            textAnchor="middle"
            fontSize="44"
            fontWeight="800"
            fill="#6c4dff"
          >
            404
          </text>
          <circle cx="180" cy="60" r="11" fill="#ff6b6b" />
        </svg>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl">
          Bu sayfa yolda kaybolmuş
        </h1>
        <p className="mt-4 text-lg text-muted">
          Aradığın sayfa taşınmış, silinmiş ya da adres yanlış yazılmış
          olabilir. Seni doğru yola çıkaralım.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-violet px-7 py-3.5 text-base font-bold text-white shadow-soft transition-colors hover:bg-sky"
          >
            Ana sayfaya dön
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
          <Link
            href="/events"
            className="rounded-full bg-white px-7 py-3.5 text-base font-bold text-violet ring-1 ring-violet/25 transition-colors hover:bg-lilac"
          >
            Etkinliklere göz at
          </Link>
        </div>
      </div>
    </main>
  );
}