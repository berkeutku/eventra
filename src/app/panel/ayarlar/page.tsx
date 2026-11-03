import type { Metadata } from "next";
import DeleteAccountCard from "@/components/DeleteAccountCard";
import NotificationPrefs from "@/components/NotificationPrefs";
import PanelGate from "@/components/PanelGate";
import PanelShell from "@/components/PanelShell";
import PushToggle from "@/components/PushToggle";
import SecurityCard from "@/components/SecurityCard";
import { countActiveSessions, getCurrentUser } from "@/lib/auth";
import { getMutedTypes } from "@/lib/notification-prefs";
import { roleLabels } from "@/lib/roles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ayarlar | Eventra" };

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <PanelGate next="/panel/ayarlar" />;
  }

  const [muted, sessionCount] = await Promise.all([
    getMutedTypes(user.id),
    countActiveSessions(user.id),
  ]);

  return (
    <PanelShell title="Ayarlar">
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <h2 className="text-xl font-extrabold tracking-tight">Hesap</h2>
          <dl className="mt-4 space-y-4">
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
            Rolünü profil sayfandaki anahtardan tek tıkla değiştirebilirsin.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <h2 className="text-xl font-extrabold tracking-tight">
            Bildirim ayarları
          </h2>
          <PushToggle />
          <NotificationPrefs muted={muted} />
        </section>

        <SecurityCard sessionCount={sessionCount} />

        <DeleteAccountCard />
      </div>
    </PanelShell>
  );
}