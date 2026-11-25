import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import {
  countByStatus,
  isCaseStatus,
  listReports,
  type CaseStatus,
} from "@/lib/admin-reports";
import { getCurrentUser } from "@/lib/auth";
import { isReportReason, reportReasonLabels } from "@/lib/rating-rules";
import { setReportStatusAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Şikâyetler | Eventra",
  robots: { index: false, follow: false },
};

type Filter = CaseStatus | "all";

const statusLabels: Record<CaseStatus, string> = {
  open: "Açık",
  reviewed: "İncelendi",
  dismissed: "Geçersiz",
};

const statusTone: Record<CaseStatus, string> = {
  open: "bg-peach text-coral-ink",
  reviewed: "bg-sea text-mint-ink",
  dismissed: "bg-lilac text-violet",
};

function formatDate(date: Date): string {
  return date.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

function StatusButton({
  id,
  status,
  label,
  primary,
}: {
  id: string;
  status: CaseStatus;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={setReportStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={
          "inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold transition-colors " +
          (primary
            ? "bg-violet text-white hover:bg-sky"
            : "border border-line text-ink hover:bg-lilac")
        }
      >
        {label}
      </button>
    </form>
  );
}

export default async function ReportsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  const user = await getCurrentUser();

  // Yönetici olmayanlar sayfanın varlığını bile görmez.
  if (!user || !isAdminEmail(user.email)) {
    notFound();
  }

  const { durum } = await searchParams;
  const filter: Filter =
    durum === "all" ? "all" : isCaseStatus(durum) ? durum : "open";

  const [reports, counts] = await Promise.all([
    listReports(filter),
    countByStatus(),
  ]);

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "open", label: "Açık", count: counts.open },
    { key: "reviewed", label: "İncelendi", count: counts.reviewed },
    { key: "dismissed", label: "Geçersiz", count: counts.dismissed },
    {
      key: "all",
      label: "Tümü",
      count: counts.open + counts.reviewed + counts.dismissed,
    },
  ];

  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Şikâyetler
        </h1>
        <p className="mt-2 text-muted">
          Yalnızca yönetici hesabı görür. Kişisel verileri gereğinden fazla
          kopyalama ve paylaşma.
        </p>
        <Link
          href="/yonetim/olcumler"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-violet hover:underline"
        >
          Ölçümler &rarr;
        </Link>
        <Link
          href="/yonetim/ayarlar"
          className="ml-4 mt-3 inline-flex min-h-11 items-center text-sm font-bold text-violet hover:underline"
        >
          Ayarlar &rarr;
        </Link>

        <nav aria-label="Durum" className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={"/yonetim/raporlar?durum=" + tab.key}
              aria-current={filter === tab.key ? "page" : undefined}
              className={
                "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors " +
                (filter === tab.key
                  ? "bg-violet text-white"
                  : "bg-white text-ink ring-1 ring-line hover:bg-lilac")
              }
            >
              {tab.label}
              <span className="text-xs opacity-80">{tab.count}</span>
            </Link>
          ))}
        </nav>

        {reports.length === 0 ? (
          <p className="mt-8 rounded-3xl bg-white p-8 text-center text-muted ring-1 ring-black/5">
            Bu durumda şikâyet yok.
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {reports.map((report) => {
              const status: CaseStatus = isCaseStatus(report.status)
                ? report.status
                : "open";
              const isProfileReport = report.reason === "profile";
              const reason = isProfileReport
                ? "Profil: uygunsuz fotoğraf ya da yazı"
                : isReportReason(report.reason)
                  ? reportReasonLabels[report.reason]
                  : report.reason;

              return (
                <li
                  key={report.id}
                  className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        "rounded-full px-3 py-1 text-xs font-extrabold " +
                        statusTone[status]
                      }
                    >
                      {statusLabels[status]}
                    </span>
                    <span className="rounded-full bg-lilac px-3 py-1 text-xs font-extrabold text-violet">
                      {reason}
                    </span>
                    {report.totalAgainst >= 3 && (
                      <span className="rounded-full bg-peach px-3 py-1 text-xs font-extrabold text-coral-ink">
                        Bu kişi hakkında {report.totalAgainst} şikâyet
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted">
                      {formatDate(report.createdAt)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-muted">
                    <strong className="text-ink">{report.reporterName}</strong>
                    ,{" "}
                    <Link
                      href={"/profil/" + report.reportedId}
                      className="font-bold text-violet hover:underline"
                    >
                      {report.reportedName}
                    </Link>{" "}
                    kişisini bildirdi.
                  </p>

                  {report.details && (
                    <p className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-surface p-4 text-sm text-ink">
                      {report.details}
                    </p>
                  )}

                  {isProfileReport && (
                    <p className="mt-3 text-sm text-muted">
                      Profili açıp altta &quot;Yönetici: profil moderasyonu&quot;
                      kutusundan fotoğrafı ya da yazıyı kaldırabilirsin.
                    </p>
                  )}

                  {report.route && report.eventId && report.rideId && (
                    <p className="mt-3 text-sm text-muted">
                      Yolculuk:{" "}
                      <Link
                        href={
                          "/events/" +
                          report.eventId +
                          "/yolculuk/" +
                          report.rideId
                        }
                        className="font-bold text-violet hover:underline"
                      >
                        {report.route}
                      </Link>
                      {report.eventTitle ? " · " + report.eventTitle : ""}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {status === "open" ? (
                      <>
                        <StatusButton
                          id={report.id}
                          status="reviewed"
                          label="İncelendi"
                          primary
                        />
                        <StatusButton
                          id={report.id}
                          status="dismissed"
                          label="Geçersiz say"
                        />
                      </>
                    ) : (
                      <StatusButton
                        id={report.id}
                        status="open"
                        label="Yeniden aç"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}