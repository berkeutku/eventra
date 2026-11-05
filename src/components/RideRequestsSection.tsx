import Link from "next/link";
import RequestForm from "@/components/RequestForm";
import type { AuthUser } from "@/lib/auth";
import {
  countRequests,
  getMyRequest,
  listRequests,
} from "@/lib/ride-requests";
import type { TicketGate } from "@/lib/ticket-gate-rules";

type Props = {
  eventId: string;
  user: AuthUser | null;
  gate: TicketGate;
  blocked: boolean;
};

// Etkinlik sayfasındaki "Yolcu talepleri" bölümü. Ayrıntılar yalnızca bileti doğrulanmış
// giriş yapmış kullanıcılara görünür, diğerleri yalnızca sayıyı görür.
export default async function RideRequestsSection({
  eventId,
  user,
  gate,
  blocked,
}: Props) {
  if (gate === "unavailable" || blocked) {
    return null;
  }

  const total = await countRequests(eventId);
  const wrap = "mt-8 rounded-3xl border border-dashed border-violet/40 p-5 sm:p-6";

  if (!user) {
    return (
      <section className={wrap}>
        <h3 className="text-xl font-extrabold tracking-tight">Yolcu talepleri</h3>
        <p className="mt-2 text-sm text-muted">
          {total > 0
            ? `Bu etkinlik için ${total} yolcu talebi var. `
            : "Henüz talep yok. "}
          Talepleri görmek ve talep vermek için giriş yap ve biletini doğrula.
        </p>
        <Link
          href={`/giris?next=/events/${eventId}`}
          className="mt-3 inline-flex rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white hover:bg-sky"
        >
          Giriş yap
        </Link>
      </section>
    );
  }

  if (gate !== "ok") {
    return (
      <section className={wrap}>
        <h3 className="text-xl font-extrabold tracking-tight">Yolcu talepleri</h3>
        <p className="mt-2 text-sm text-muted">
          {total > 0
            ? `Bu etkinlik için ${total} yolcu talebi var. `
            : "Henüz talep yok. "}
          Talepleri görmek ve talep vermek için önce bu etkinliğin biletini
          doğrulamalısın.{" "}
          <a href="#bilet" className="font-bold text-violet hover:underline">
            Bileti doğrula &darr;
          </a>
        </p>
      </section>
    );
  }

  const [items, mine] = await Promise.all([
    listRequests(eventId, user.id),
    user.role === "passenger" ? getMyRequest(user.id, eventId) : null,
  ]);

  return (
    <section className={wrap}>
      <h3 className="text-xl font-extrabold tracking-tight">Yolcu talepleri</h3>
      <p className="mt-2 text-sm text-muted">
        Yolculuk arayan yolcuların talepleri. Yalnızca ilk adlar gösterilir.
      </p>

      {user.role === "driver" && items.length > 0 && (
        <Link
          href={`/events/${eventId}/yolculuk-olustur`}
          className="mt-3 inline-flex rounded-full bg-violet px-5 py-2.5 text-sm font-bold text-white hover:bg-sky"
        >
          Bu taleplere uygun yolculuk oluştur
        </Link>
      )}

      {items.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-surface p-4 text-sm text-muted">
          Henüz yolcu talebi yok.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-2xl bg-white p-4 ring-1 ${
                item.isOwn ? "ring-2 ring-violet/40" : "ring-black/5"
              }`}
            >
              <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                {item.firstName}
                {item.isOwn && (
                  <span className="rounded-full bg-lilac px-2.5 py-0.5 text-xs font-bold text-violet">
                    Senin talebin
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-ink">
                {item.destination} · {item.seats} kişi
                {item.preferredTime ? ` · ${item.preferredTime} civarı` : ""}
              </p>
              {item.note && (
                <p className="mt-1 text-sm text-muted">{item.note}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {user.role === "passenger" && (
        <div className="mt-5">
          <RequestForm eventId={eventId} existing={mine} />
        </div>
      )}

      {user.role !== "passenger" && user.role !== "driver" ? null : user.role ===
        "driver" ? (
        <p className="mt-4 text-xs text-muted">
          Yolcu talebi vermek için profilinden Yolcu rolüne geçebilirsin.
        </p>
      ) : null}
    </section>
  );
}