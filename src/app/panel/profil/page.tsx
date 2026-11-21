import type { Metadata } from "next";
import AvatarUploader from "@/components/AvatarUploader";
import PanelGate from "@/components/PanelGate";
import PanelShell from "@/components/PanelShell";
import ProfileEditForm from "@/components/ProfileEditForm";
import { getCurrentUser } from "@/lib/auth";
import { getProfileData } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Profili düzenle | Eventra" };

export default async function EditProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <PanelGate next="/panel/profil" />;
  }

  const profile = await getProfileData(user.id);

  if (!profile) {
    return <PanelGate next="/panel/profil" />;
  }

  return (
    <PanelShell
      title="Profili düzenle"
      description="Profilin sürücülere ve yolculara kendini tanıtır. Girdiğin bilgiler giriş yapmış kullanıcılara görünür."
    >
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <h2 className="mb-4 text-xl font-extrabold tracking-tight">
            Profil fotoğrafı
          </h2>
          <AvatarUploader
            userId={profile.id}
            name={profile.name}
            version={profile.avatarV}
          />
        </section>

        <ProfileEditForm
          initial={{
            bio: profile.bio,
            city: profile.city,
            theme: profile.theme,
            interests: profile.interests,
          }}
        />
      </div>
    </PanelShell>
  );
}
