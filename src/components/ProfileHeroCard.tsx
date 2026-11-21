import type { ReactNode } from "react";
import Avatar from "@/components/Avatar";
import { GenderChip } from "@/components/GenderUi";
import Icon from "@/components/Icons";
import { categoryMeta } from "@/data/events";
import type { ProfileData } from "@/lib/profile";
import { memberSinceLabel, profileThemes } from "@/lib/profile-rules";
import { roleLabels, type Role } from "@/lib/roles";

export type HeroStat = { label: string; value: string };

// Sosyal medya profili görünümü: renkli kapak, taşan fotoğraf, ad, rozetler, hakkımda,
// ilgi alanları ve sayılar. Hem kendi profilinde hem başkalarının gördüğü sayfada kullanılır.
export default function ProfileHeroCard({
  profile,
  role,
  stats,
  actions,
}: {
  profile: ProfileData;
  role?: Role;
  stats: HeroStat[];
  actions?: ReactNode;
}) {
  const theme = profileThemes[profile.theme];
  const since = memberSinceLabel(profile.createdAt);

  return (
    <section
      aria-label="Profil"
      className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5"
    >
      <div className={`relative h-28 overflow-hidden sm:h-40 ${theme.gradient}`}>
        <span className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <span className="absolute -bottom-14 left-8 h-36 w-36 rounded-full bg-white/10 blur-xl" />
        <span className="absolute right-1/3 top-6 h-16 w-16 rounded-full bg-white/10 blur-lg" />
      </div>

      <div className="px-5 pb-6 sm:px-8 sm:pb-8">
        <div className="-mt-14 flex items-end justify-between gap-3">
          <Avatar
            userId={profile.id}
            name={profile.name}
            version={profile.avatarV}
            size={104}
            className="ring-4 ring-white shadow-soft"
          />
          {actions ? (
            <div className="flex flex-wrap items-center justify-end gap-2 pb-1">
              {actions}
            </div>
          ) : null}
        </div>

        <h1 className="mt-4 break-words text-2xl font-extrabold tracking-tight sm:text-3xl">
          {profile.name}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
          <GenderChip gender={profile.gender} />
          {role ? (
            <span className="rounded-full bg-sea px-2.5 py-0.5 text-xs font-bold text-mint-ink">
              {roleLabels[role]}
            </span>
          ) : null}
          {profile.city ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" className="h-4 w-4" />
              {profile.city}
            </span>
          ) : null}
          {since ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" className="h-4 w-4" />
              {since}&apos;den beri üye
            </span>
          ) : null}
        </div>

        {profile.bio ? (
          <p className="mt-4 whitespace-pre-line break-words text-base leading-relaxed text-ink">
            {profile.bio}
          </p>
        ) : null}

        {profile.interests.length > 0 ? (
          <ul aria-label="İlgi alanları" className="mt-4 flex flex-wrap gap-2">
            {profile.interests.map((key) => {
              const meta = categoryMeta[key as keyof typeof categoryMeta];

              if (!meta) {
                return null;
              }

              return (
                <li
                  key={key}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${meta.soft} ${meta.accent}`}
                >
                  {meta.label}
                </li>
              );
            })}
          </ul>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col-reverse rounded-2xl bg-surface px-4 py-3 text-center"
            >
              <dt className="mt-0.5 text-xs font-bold uppercase tracking-wider text-muted">
                {stat.label}
              </dt>
              <dd className="text-xl font-extrabold tracking-tight text-violet">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
