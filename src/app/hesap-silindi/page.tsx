import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hesap silindi | Eventra",
  robots: { index: false },
};

export default function AccountDeletedPage() {
  return (
    <main className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-hand text-3xl text-violet">görüşürüz</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Hesabın silindi
        </h1>
        <p className="mt-4 text-lg text-muted">
          Hesabın ve ona bağlı tüm verilerin silindi. İstersen istediğin zaman
          yeni bir hesap oluşturabilirsin.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}