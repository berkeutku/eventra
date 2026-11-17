"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("page_error", error.digest ?? "no-digest");
  }, [error]);

  return (
    <main className="px-6 py-24">
      <div
        role="alert"
        className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-md shadow-violet/5 ring-1 ring-line"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Bir şeyler ters gitti
        </h1>
        <p className="mt-3 text-muted">
          Sayfa şu an yüklenemedi. Birkaç saniye sonra tekrar dene; sorun
          sürerse ana sayfaya dönebilirsin.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center rounded-full bg-violet px-6 text-sm font-semibold text-white transition-colors hover:bg-sky"
          >
            Tekrar dene
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-full px-6 text-sm font-semibold text-ink ring-1 ring-line transition-colors hover:bg-lilac"
          >
            Ana sayfa
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-6 text-xs text-muted">
            Destek için hata kodu: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
