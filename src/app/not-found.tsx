import Link from "next/link";

export default function NotFound() {
  return (
    <main className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-hand text-3xl text-violet">yolunu kaybettin</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Sayfa bulunamadı
        </h1>
        <p className="mt-4 text-lg text-muted">
          Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky"
          >
            Ana sayfaya dön
          </Link>
          <Link
            href="/events"
            className="rounded-full border border-line px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-lilac"
          >
            Etkinliklere göz at
          </Link>
        </div>
      </div>
    </main>
  );
}