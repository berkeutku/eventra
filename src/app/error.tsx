"use client";

export default function ErrorPage() {
  return (
    <main className="px-6 py-24">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-md shadow-violet/5 ring-1 ring-line">
        <h1 className="text-3xl font-bold tracking-tight">
          Bir şeyler ters gitti
        </h1>
        <p className="mt-3 text-muted">
          Sayfa şu an yüklenemedi. Veritabanı uykudan uyanıyor olabilir, birkaç
          saniye sonra tekrar dene.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full bg-violet px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky"
        >
          Tekrar dene
        </button>
      </div>
    </main>
  );
}