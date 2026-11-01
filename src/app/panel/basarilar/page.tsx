import type { Metadata } from "next";
import PanelGate from "@/components/PanelGate";
import PanelShell from "@/components/PanelShell";
import StatsPanel from "@/components/StatsPanel";
import { getCurrentUser } from "@/lib/auth";
import { getRidesForDriver, getRidesForPassenger } from "@/lib/ride-queries";
import { buildStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Başarılar | Eventra" };

export default async function AchievementsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <PanelGate next="/panel/basarilar" />;
  }

  const [driverRides, passengerRides] = await Promise.all([
    getRidesForDriver(user.id),
    getRidesForPassenger(user.id),
  ]);

  return (
    <PanelShell title="Başarılar">
      <StatsPanel stats={buildStats(driverRides, passengerRides)} />
    </PanelShell>
  );
}