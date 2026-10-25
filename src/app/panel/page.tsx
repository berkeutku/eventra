import type { Metadata } from "next";
import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import { getCurrentUser } from "@/lib/auth";
import { getRidesForDriver } from "@/lib/ride-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panelim | Eventra",
  description: "Eventra kullanıcı paneli: yolculuklarını yönet.",
};

export default async function PanelPage() {
  const user = await getCurrentUser();
  const rides = user?.role === "driver" ? await getRidesForDriver(user.id) : [];

  return (
    <main className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Panelim
        </h1>
        <p className="mt-4 text-lg text-muted">
          Rolünü ve yolculuklarını buradan takip et.
        </p>

        {user ? (
          <Dashboard user={user} rides={rides} />
        ) : (
          <div className="mt-8 rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Panelini görmek için giriş yap
            </h2>
            <p className="mt-2 text-muted">
              Hesabınla giriş yaptıktan sonra panelin açılır.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/giris"
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
        )}
      </div>
    </main>
  );
}