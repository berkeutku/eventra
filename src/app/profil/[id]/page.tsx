import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProfileHeroCard from "@/components/ProfileHeroCard";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { getProfileData, getProfileStats } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil | Eventra",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const viewer = await getCurrentUser();

  if (!viewer) {
    return (
      <main className="px-6 py-10 sm:py-16">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Profili görmek için giriş yap
          </h1>
          <p className="mt-2 text-muted">
            Profiller yalnızca giriş yapmış kullanıcılara gösterilir.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href={`/giris?next=/profil/${encodeURIComponent(id)}`}>
              Giriş yap
            </LinkButton>
            <LinkButton href="/kayit" variant="secondary">
              Hesap oluştur
            </LinkButton>
          </div>
        </div>
      </main>
    );
  }

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const [profile, stats] = await Promise.all([
    getProfileData(id),
    getProfileStats(id),
  ]);

  if (!profile) {
    notFound();
  }

  const isOwn = viewer.id === profile.id;
  const rating =
    stats.rating === null ? "—" : stats.rating.toFixed(1).replace(".", ",");

  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href={isOwn ? "/panel" : "/events"}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-violet hover:underline"
        >
          &larr; {isOwn ? "Profilim" : "Etkinlikler"}
        </Link>

        {isOwn ? (
          <p className="rounded-2xl bg-lilac p-4 text-sm font-medium text-violet">
            Başkaları profilini böyle görüyor.{" "}
            <Link href="/panel/profil" className="font-extrabold hover:underline">
              Düzenle
            </Link>
          </p>
        ) : null}

        <ProfileHeroCard
          profile={profile}
          stats={[
            { label: "Sürücü olarak", value: String(stats.drivenRides) },
            { label: "Yolcu olarak", value: String(stats.joinedRides) },
            {
              label: "Puan",
              value:
                stats.ratingCount > 0 ? `★ ${rating}` : "—",
            },
            { label: "Değerlendirme", value: String(stats.ratingCount) },
          ]}
        />

        <p className="rounded-2xl bg-surface p-4 text-sm text-muted">
          Bu bilgiler kullanıcının kendi beyanına dayanır; Eventra cinsiyet, şehir
          ve kişisel açıklamaları doğrulamaz. Yolculuk sırasında rahatsız olursan
          yolculuk sayfasından şikâyet edebilirsin.
        </p>
      </div>
    </main>
  );
}
