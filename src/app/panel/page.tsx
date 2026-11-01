import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PanelGate from "@/components/PanelGate";
import ProfileHome from "@/components/ProfileHome";
import { getCurrentUser } from "@/lib/auth";
import { listFavoriteEvents } from "@/lib/favorites";
import { legacyTabPath } from "@/lib/panel-tabs";
import { getRidesForDriver, getRidesForPassenger } from "@/lib/ride-queries";
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
  const { sekme } = await searchParams;
  const legacy = legacyTabPath(sekme);

  if (legacy) {
    redirect(legacy);
  }

  const user = await getCurrentUser();

  if (!user) {
    return <PanelGate next="/panel" />;
  }

  const [driverRides, passengerRides, favorites] = await Promise.all([
    getRidesForDriver(user.id),
    getRidesForPassenger(user.id),
    listFavoriteEvents(user.id),
  ]);
  const stats = buildStats(driverRides, passengerRides);
  const earned = stats.badges.filter((badge) => badge.earned).length;

  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <ProfileHome
          user={user}
          driverRides={driverRides}
          passengerRides={passengerRides}
          favoritesCount={favorites.length}
          earnedBadges={earned}
          totalBadges={stats.badges.length}
        />
      </div>
    </main>
  );
}