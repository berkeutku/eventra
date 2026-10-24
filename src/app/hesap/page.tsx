import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hesabım | Eventra",
};

const roleLabels = {
  driver: "Sürücü",
  passenger: "Yolcu",
} as const;

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/kayit");
  }

  return (
    <main className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Hesabım
        </h1>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-mint text-night">
              ✓
            </span>
            <p className="font-bold text-mint-ink">Gerçek hesapla giriş yapıldı</p>
          </div>

          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                Ad
              </dt>
              <dd className="mt-1 text-lg font-bold">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                E-posta
              </dt>
              <dd className="mt-1 text-lg font-bold">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                Rol
              </dt>
              <dd className="mt-1 text-lg font-bold">{roleLabels[user.role]}</dd>
            </div>
          </dl>

          <p className="mt-6 rounded-2xl bg-lilac p-4 text-sm text-muted">
            Oturumun sunucuda saklanır ve 7 gün geçerlidir. Bu sayfa geçici bir
            test sayfasıdır, Görev 18'de gerçek panele dönüşecek.
          </p>

          <form action={logoutAction} className="mt-6">
            <button
              type="submit"
              className="rounded-full border border-line px-6 py-3 text-sm font-bold hover:bg-lilac"
            >
              Çıkış yap
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}