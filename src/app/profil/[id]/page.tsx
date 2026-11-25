import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProfileHeroCard from "@/components/ProfileHeroCard";
import ProfileReportForm from "@/components/ProfileReportForm";
import { LinkButton } from "@/components/ui/Button";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { getProfileData, getProfileStats } from "@/lib/profile";
import {
  adminClearProfileTextAction,
  adminRemoveAvatarAction,
} from "./moderation-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil | Eventra",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ModerationForm({
  userId,
  action,
  label,
  confirmText,
}: {
  userId: string;
  action: (formData: FormData) => Promise<void>;
  label: string;
  confirmText: string;
}) {
  return (
    <form action={action} className="rounded-2xl bg-white p-4 ring-1 ring-line">
      <input type="hidden" name="userId" value={userId} />
      <label className="flex items-start gap-2 text-sm text-ink">
        <input type="checkbox" name="confirm" required className="mt-1 h-4 w-4" />
        <span>{confirmText}</span>
      </label>
      <button
        type="submit"
        className="mt-3 inline-flex min-h-11 items-center rounded-full bg-coral-ink px-5 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        {label}
      </button>
    </form>
  );
}

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
  const isAdmin = isAdminEmail(viewer.email);
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
              value: stats.ratingCount > 0 ? `★ ${rating}` : "—",
            },
            { label: "Değerlendirme", value: String(stats.ratingCount) },
          ]}
        />

        <p className="rounded-2xl bg-surface p-4 text-sm text-muted">
          Bu bilgiler kullanıcının kendi beyanına dayanır; Eventra cinsiyet, şehir
          ve kişisel açıklamaları doğrulamaz. Yolculuk sırasında rahatsız olursan
          yolculuk sayfasından şikâyet edebilirsin.
        </p>

        {!isOwn ? <ProfileReportForm userId={profile.id} /> : null}

        {isAdmin ? (
          <section
            aria-label="Yönetici işlemleri"
            className="rounded-3xl bg-peach p-6 ring-1 ring-coral/30"
          >
            <h2 className="text-lg font-extrabold tracking-tight text-coral-ink">
              Yönetici: profil moderasyonu
            </h2>
            <p className="mt-1 text-sm text-ink">
              Yalnızca yöneticiler bu kutuyu görür. Uygunsuz içerikte kullan;
              işlem geri alınamaz. Kullanıcıya uygulama içi bildirim gider.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {profile.avatarV ? (
                <ModerationForm
                  userId={profile.id}
                  action={adminRemoveAvatarAction}
                  label="Fotoğrafı kaldır"
                  confirmText="Bu kullanıcının profil fotoğrafını kaldırmak istiyorum."
                />
              ) : (
                <p className="rounded-2xl bg-white p-4 text-sm text-muted ring-1 ring-line">
                  Profil fotoğrafı yok.
                </p>
              )}
              {profile.bio || profile.city ? (
                <ModerationForm
                  userId={profile.id}
                  action={adminClearProfileTextAction}
                  label="Yazıyı ve şehri temizle"
                  confirmText="Tanıtım yazısını ve şehri silmek istiyorum."
                />
              ) : (
                <p className="rounded-2xl bg-white p-4 text-sm text-muted ring-1 ring-line">
                  Tanıtım yazısı ve şehir boş.
                </p>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
