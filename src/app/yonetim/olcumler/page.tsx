import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { cardClass } from "@/components/ui/Card";
import { isAdminEmail } from "@/lib/admin";
import { barWidth, percent } from "@/lib/admin-metrics-rules";
import { getMetrics } from "@/lib/admin-metrics";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ölçümler | Eventra",
  robots: { index: false, follow: false },
};

const number = (value: number) => value.toLocaleString("tr-TR");

function dayLabel(key: string): string {
  const [, month, day] = key.split("-");
  return `${day}.${month}`;
}

function Tile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-5">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
        {value}
      </dd>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Bar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: number;
  tone: string;
}) {
  return (
    <li className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="h-3 overflow-hidden rounded-full bg-surface">
        <span
          className={`block h-full rounded-full ${tone}`}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="min-w-8 text-right font-bold text-ink">{value}</span>
    </li>
  );
}

export default async function MetricsPage() {
  const user = await getCurrentUser();

  // Yönetici olmayanlar sayfanın varlığını bile görmez.
  if (!user || !isAdminEmail(user.email)) {
    notFound();
  }

  const m = await getMetrics();
  const maxSignup = Math.max(...m.signupsByDay.map((item) => item.count), 0);
  const last14 = m.signupsByDay.reduce((sum, item) => sum + item.count, 0);

  const funnel = [
    { label: "Kayıt oldu", value: m.funnel.registered },
    { label: "Bilet doğruladı", value: m.funnel.verified },
    { label: "Yolculuk oluşturdu ya da katıldı", value: m.funnel.participated },
    { label: "Yolculuğu tamamladı", value: m.funnel.completed },
  ];

  const sync = m.events.lastSync;

  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ölçümler
          </h1>
          <p className="mt-2 text-muted">
            Yalnızca yönetici hesabı görür. Yalnızca sayılar gösterilir, kişisel
            veri yoktur. Demo ve test hesaplarının verileri de dahildir.
          </p>
          <Link
            href="/yonetim/raporlar"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-violet hover:underline"
          >
            Şikâyetler ({m.trust.openReports} açık) &rarr;
          </Link>
        </div>

        <section className={cardClass}>
          <h2 className="text-2xl font-extrabold tracking-tight">Büyüme</h2>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Kullanıcı" value={number(m.users.total)} />
            <Tile
              label="Son 7 gün"
              value={`+${number(m.users.last7)}`}
              hint="yeni kayıt"
            />
            <Tile
              label="Son 30 gün"
              value={`+${number(m.users.last30)}`}
              hint="yeni kayıt"
            />
            <Tile
              label="Yolculuk"
              value={number(m.rides.total)}
              hint={`son 7 gün: +${number(m.rides.last7)}`}
            />
          </dl>

          <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-muted">
            Günlük kayıt (son {m.signupsByDay.length} gün, toplam {last14})
          </h3>
          <ul className="mt-3 space-y-2">
            {m.signupsByDay.map((item) => (
              <Bar
                key={item.day}
                label={dayLabel(item.day)}
                value={String(item.count)}
                width={barWidth(item.count, maxSignup)}
                tone="bg-violet"
              />
            ))}
          </ul>
        </section>

        <section className={cardClass}>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Kullanıcı yolculuğu
          </h2>
          <p className="mt-2 text-sm text-muted">
            Kayıt olanların ne kadarı bileti doğruladı, yolculuğa katıldı ve
            yolculuğu tamamladı. Yüzdeler toplam kayıda göredir.
          </p>
          <ul className="mt-5 space-y-3">
            {funnel.map((step) => (
              <li key={step.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-bold text-ink">{step.label}</span>
                  <span className="text-muted">
                    {number(step.value)} ·{" "}
                    <strong className="text-ink">
                      %{percent(step.value, m.funnel.registered)}
                    </strong>
                  </span>
                </div>
                <span className="mt-1.5 block h-3 overflow-hidden rounded-full bg-surface">
                  <span
                    className="block h-full rounded-full bg-mint"
                    style={{
                      width: `${barWidth(step.value, m.funnel.registered)}%`,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass}>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Eşleşme sağlığı
          </h2>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile
              label="Eşleşen yolculuk"
              value={`%${percent(m.rides.matched, m.rides.total)}`}
              hint={`${number(m.rides.matched)} / ${number(m.rides.total)}`}
            />
            <Tile
              label="Koltuk doluluğu"
              value={`%${percent(m.rides.seatsTaken, m.rides.seatsOffered)}`}
              hint={`${number(m.rides.seatsTaken)} / ${number(m.rides.seatsOffered)}`}
            />
            <Tile
              label="Katılım"
              value={number(m.joins.total)}
              hint={`son 7 gün: +${number(m.joins.last7)}`}
            />
            <Tile
              label="Yolcu talebi"
              value={number(m.demand.rideRequests)}
              hint="açık talep kaydı"
            />
            <Tile label="Yolda" value={number(m.rides.departed)} />
            <Tile label="Tamamlanan" value={number(m.rides.arrived)} />
          </dl>
        </section>

        <section className={cardClass}>
          <h2 className="text-2xl font-extrabold tracking-tight">Güven</h2>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile
              label="Puanlama"
              value={number(m.trust.ratings)}
              hint={
                m.trust.averageScore === null
                  ? "henüz puan yok"
                  : `ortalama ${m.trust.averageScore.toLocaleString("tr-TR", {
                      maximumFractionDigits: 1,
                    })} / 5`
              }
            />
            <Tile label="Açık şikâyet" value={number(m.trust.openReports)} />
            <Tile label="Paylaşım bağlantısı" value={number(m.trust.shares)} />
            <Tile label="Sohbet mesajı" value={number(m.trust.messages)} />
          </dl>
        </section>

        <section className={cardClass}>
          <h2 className="text-2xl font-extrabold tracking-tight">Etkinlikler</h2>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile label="Yaklaşan demo etkinlik" value={number(m.events.demoUpcoming)} />
            <Tile
              label="biletimGO etkinliği"
              value={number(m.events.realTotal)}
              hint={`${number(m.events.realActive)} aktif · sitede gizli (kapalı)`}
            />
            <div className="rounded-2xl bg-surface p-5">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                Son senkron
              </dt>
              <dd className="mt-2">
                {sync ? (
                  <Badge tone={sync.status === "success" ? "mint" : "sun"}>
                    {sync.status}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted">Kayıt yok</span>
                )}
              </dd>
              {sync && (
                <p className="mt-1 text-xs text-muted">
                  {sync.startedAt.toLocaleString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Istanbul",
                  })}
                  {sync.errorCode ? ` · ${sync.errorCode}` : ""}
                  {sync.fetchedCount !== null
                    ? ` · ${number(sync.fetchedCount)} kayıt`
                    : ""}
                </p>
              )}
            </div>
          </dl>
        </section>

        <p className="text-xs text-muted">
          Hesaplandı:{" "}
          {m.generatedAt.toLocaleString("tr-TR", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Europe/Istanbul",
          })}
        </p>
      </div>
    </main>
  );
}
