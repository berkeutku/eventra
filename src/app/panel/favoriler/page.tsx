import type { Metadata } from "next";
import FavoritesCard from "@/components/FavoritesCard";
import PanelGate from "@/components/PanelGate";
import PanelShell from "@/components/PanelShell";
import { getCurrentUser } from "@/lib/auth";
import { listFavoriteEvents } from "@/lib/favorites";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Favoriler | Eventra" };

export default async function FavoritesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <PanelGate next="/panel/favoriler" />;
  }

  const favorites = await listFavoriteEvents(user.id);

  return (
    <PanelShell title="Favoriler">
      <FavoritesCard events={favorites} />
    </PanelShell>
  );
}