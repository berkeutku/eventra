import type { Metadata } from "next";
import PanelGate from "@/components/PanelGate";
import PanelShell from "@/components/PanelShell";
import RidesPanel from "@/components/RidesPanel";
import { getCurrentUser } from "@/lib/auth";
import { getRidesForDriver, getRidesForPassenger } from "@/lib/ride-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Yolculuklarım | Eventra" };

export default async function MyRidesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <PanelGate next="/panel/yolculuklar" />;
  }

  const [driverRides, passengerRides] = await Promise.all([
    getRidesForDriver(user.id),
    getRidesForPassenger(user.id),
  ]);

  return (
    <PanelShell
      title="Yolculuklarım"
      description="Oluşturduğun ve katıldığın yolculuklar. Aktif rolüne ait olan üstte görünür."
    >
      <RidesPanel
        role={user.role}
        driverRides={driverRides}
        passengerRides={passengerRides}
      />
    </PanelShell>
  );
}