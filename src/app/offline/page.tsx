import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Çevrimdışı | Eventra",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <main className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-hand text-3xl text-violet">bağlantı yok</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Şu an çevrimdışısın
        </h1>
        <p className="mt-4 text-lg text-muted">
          Eventra etkinlik ve yolculuk bilgilerini internet üzerinden alır.
          Bağlantın dönene kadar bu sayfalar açılamaz. Çevrimdışıyken yolculuğa
          katılamaz veya yeni yolculuk oluşturamazsın.
        </p>
        <p className="mt-3 text-sm text-muted">
          Bu bir demo uygulamadır. Çevrimdışı modda yalnızca bu bilgi sayfası
          gösterilir, kayıtlı yolculuk verisi cihazında saklanmaz.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky"
        >
          Yeniden dene
        </Link>
      </div>
    </main>
  );
}