import type { SavingsSummary, UserStats } from "@/lib/stats";

function tl(amount: number): string {
  return `${amount.toLocaleString("tr-TR")} TL`;
}

function SavingsCard({
  title,
  summary,
  tint,
}: {
  title: string;
  summary: SavingsSummary;
  tint: string;
}) {
  return (
    <div className={`rounded-2xl p-5 ${tint}`}>
      <p className="text-sm font-extrabold text-ink">{title}</p>
      <dl className="mt-3 space-y-3">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Yaklaşan yolculuk
          </dt>
          <dd className="mt-0.5 text-sm text-ink">
            <span className="text-2xl font-extrabold tracking-tight">
              {summary.upcoming}
            </span>{" "}
            yolculuk · yaklaşık{" "}
            <span className="font-extrabold">{tl(summary.savedUpcoming)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Etkinlik tarihi geçmiş
          </dt>
          <dd className="mt-0.5 text-sm text-ink">
            <span className="text-2xl font-extrabold tracking-tight">
              {summary.past}
            </span>{" "}
            yolculuk · yaklaşık{" "}
            <span className="font-extrabold">{tl(summary.savedPast)}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function StatsPanel({ stats }: { stats: UserStats }) {
  const earnedCount = stats.badges.filter((badge) => badge.earned).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
        <h2 className="text-2xl font-extrabold tracking-tight">
          Tahmini tasarruf özeti
        </h2>
        <p className="mt-2 text-sm text-muted">
          Hesap, tek başına gitseydin yol masrafının tamamını ödeyeceğin
          varsayımına dayanır ve yolculuğa o ana kadar katılan kişi sayısını
          kullanır. Eventra ödeme almaz, gerçek tutarı sürücüyle yüz yüze
          ayarlarsınız. Etkinlik tarihi geçen yolculukların gerçekten yapıldığı
          doğrulanmaz.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <SavingsCard
            title="Yolcu olarak (tahmini tasarruf)"
            summary={stats.asPassenger}
            tint="bg-sea"
          />
          <SavingsCard
            title="Sürücü olarak (yolcuların tahmini katkısı)"
            summary={stats.asDriver}
            tint="bg-lilac"
          />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-lg shadow-violet/5 ring-1 ring-black/5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight">Rozetler</h2>
          <p className="text-sm font-bold text-ink">
            {earnedCount} / {stats.badges.length} kazanıldı
          </p>
        </div>
        <p className="mt-2 text-sm text-muted">
          Rozetler yalnızca hesabındaki gerçek yolculuk kayıtlarından
          hesaplanır, kimse kendine rozet veremez.
        </p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {stats.badges.map((badge) => {
            const percent = Math.round((badge.current / badge.target) * 100);

            return (
              <li
                key={badge.key}
                className={`rounded-2xl border p-5 ${
                  badge.earned
                    ? "border-violet/30 bg-lilac/60"
                    : "border-line bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-extrabold text-ink">{badge.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      badge.earned
                        ? "bg-violet text-white"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {badge.earned ? "Kazanıldı" : "Kilitli"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{badge.description}</p>
                <div
                  className="mt-4 h-2 overflow-hidden rounded-full bg-lilac"
                  role="progressbar"
                  aria-label={`${badge.title} ilerlemesi`}
                  aria-valuemin={0}
                  aria-valuemax={badge.target}
                  aria-valuenow={badge.current}
                >
                  <div
                    className="h-full rounded-full bg-violet"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {badge.current} / {badge.target}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}