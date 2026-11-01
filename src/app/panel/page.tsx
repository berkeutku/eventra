import type { Metadata } from "next";
import Link from "next/link";
import DeleteAccountCard from "@/components/DeleteAccountCard";
import FavoritesCard from "@/components/FavoritesCard";
import PanelOverview from "@/components/PanelOverview";
import PanelTabs from "@/components/PanelTabs";
import PushToggle from "@/components/PushToggle";
import RidesPanel from "@/components/RidesPanel";
import StatsPanel from "@/components/StatsPanel";
import { getCurrentUser } from "@/lib/auth";
import { listFavoriteEvents } from "@/lib/favorites";
import { parseTab } from "@/lib/panel-tabs";
import { getRidesForDriver, getRidesForPassenger } from "@/lib/ride-queries";
import { roleLabels } from "@/lib/roles";
import { buildStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profilim | Eventra",
  description: "Eventra profilin: yolculukların, favorilerin ve hesap ayarların.",
};

type Props = {
  searchParams: Promise<{ sekme?: string | string[] }>;
};

export default async function PanelPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { sekme } = await searchParams;
  const tab = parseTab(sekme);

  if (!user) {
    return (
      <main className="px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Profilim
          </h1>
          <div className="mt-8 rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Profilini görmek için giriş yap
            </h2>
            <p className="mt-2 text-muted">
              Hesabınla giriş yaptıktan sonra profilin açılır.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/giris?next=/panel"
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

  const [driverRides, passengerRides, favorites] = await Promise.all([
    getRidesForDriver(user.id),
    getRidesForPassenger(user.id),
    listFavoriteEvents(user.id),
  ]);
  const stats = buildStats(driverRides, passengerRides);
  const earned = stats.badges.filter((badge) => badge.earned).length;

  return (
    <main className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Profilim
        </h1>
        <p className="mt-3 text-lg text-muted">
          Yolculuklarını, favorilerini ve hesap ayarlarını buradan yönet.
        </p>

        <PanelTabs
          active={tab}
          counts={{
            yolculuklar: driverRides.length + passengerRides.length,
            favoriler: favorites.length,
          }}
        />

        <div className="mt-6">
          {tab === "genel" && (
            <PanelOverview
              user={user}
              driverRides={driverRides}
              passengerRides={passengerRides}
              favoritesCount={favorites.length}
              earnedBadges={earned}
              totalBadges={stats.badges.length}
            />
          )}

          {tab === "yolculuklar" && (
            <RidesPanel
              role={user.role}
              driverRides={driverRides}
              passengerRides={passengerRides}
            />
          )}

          {tab === "favoriler" && <FavoritesCard events={favorites} />}

          {tab === "basarilar" && <StatsPanel stats={stats} />}

          {tab === "ayarlar" && (
            <div className="space-y-6">
              <section className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
                <h2 className="text-2xl font-extrabold tracking-tight">Hesap</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                      Görünen ad
                    </dt>
                    <dd className="mt-1 font-bold text-ink">{user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                      E-posta
                    </dt>
                    <dd className="mt-1 break-all font-bold text-ink">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                      Aktif rol
                    </dt>
                    <dd className="mt-1 font-bold text-ink">{roleLabels[user.role]}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-sm text-muted">
                  Rolünü Genel bakış sekmesinden tek tıkla değiştirebilirsin.
                </p>
              </section>

              <section className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Bildirim ayarları
                </h2>
                <PushToggle />
              </section>

              <DeleteAccountCard />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}