import Link from "next/link";

export default function PanelGate({ next }: { next: string }) {
  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Profilim
        </h1>
        <div className="mt-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <h2 className="text-2xl font-extrabold tracking-tight">
            Profilini görmek için giriş yap
          </h2>
          <p className="mt-2 text-muted">
            Hesabınla giriş yaptıktan sonra profilin açılır.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/giris?next=${next}`}
              className="rounded-full bg-violet px-6 py-3 text-sm font-bold text-white hover:bg-sky"
            >
              Giriş yap
            </Link>
            <Link
              href="/kayit"
              className="rounded-full border border-line px-6 py-3 text-sm font-bold text-ink hover:bg-lilac"
            >
              Hesap oluştur
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}