import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShare } from "@/lib/ride-day";
import { statusLabels } from "@/lib/ride-day-rules";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yolculuk bilgisi | Eventra",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = { params: Promise<{ token: string }> };

function formatDate(date: Date): string {
  return date.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const ride = await getShare(token);

  if (!ride) {
    notFound();
  }

  const rows: [string, string][] = [
    ["Etkinlik", `${ride.eventTitle} · ${formatDate(ride.eventStartsAt)}`],
    ["Güzergâh", `${ride.origin} → ${ride.destination}`],
    ["Buluşma noktası", ride.meetingPoint],
    ["Kalkış saati", ride.departureTime],
    ["Sürücü", ride.driverFirstName],
    ["Araç", ride.vehicle ?? "Belirtilmedi"],
  ];

  return (
    <main className="px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Yolculuk bilgisi
        </h1>
        <p className="mt-3 text-muted">
          Biri Eventra&apos;da bir ortak yolculuk için bu bilgileri seninle
          paylaştı.
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-lilac p-4">
          <span className="text-sm font-bold text-ink">Durum:</span>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-violet">
            {statusLabels[ride.status]}
          </span>
        </div>

        <dl className="mt-6 space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                {label}
              </dt>
              <dd className="mt-1 font-bold text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs text-muted">
          Gizlilik için yolcu adları ve paylaşan kişinin kimliği gösterilmez.
          Bu bağlantı {formatDate(ride.expiresAt)} tarihine kadar geçerlidir.
          Eventra bir demo projesidir.
        </p>
      </div>
    </main>
  );
}