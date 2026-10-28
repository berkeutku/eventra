import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Icon, { type IconName } from "@/components/Icons";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications, type NotificationType } from "@/lib/notifications";
import {
  markAllReadAction,
  openNotificationAction,
} from "@/app/bildirimler/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bildirimler | Eventra",
  description: "Yolculuklarınla ilgili bildirimler.",
};

const typeMeta: Record<NotificationType, { icon: IconName; tint: string }> = {
  ride_joined: { icon: "users", tint: "bg-sea text-mint-ink" },
  ride_left: { icon: "user", tint: "bg-lilac text-violet" },
  ride_cancelled: { icon: "car", tint: "bg-peach text-coral-ink" },
};

function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);

  if (minutes < 1) {
    return "Az önce";
  }
  if (minutes < 60) {
    return `${minutes} dk önce`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} saat önce`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} gün önce`;
  }

  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  });
}

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/giris?next=/bildirimler");
  }

  const items = await listNotifications(user.id);
  const unread = items.filter((item) => !item.read).length;

  return (
    <main className="px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Bildirimler
            </h1>
            <p className="mt-3 text-lg text-muted">
              {unread > 0
                ? `${unread} okunmamış bildirimin var.`
                : "Tüm bildirimlerin okundu."}
            </p>
          </div>

          {unread > 0 && (
            <form action={markAllReadAction}>
              <button
                type="submit"
                className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-lilac"
              >
                Tümünü okundu işaretle
              </button>
            </form>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-lg shadow-violet/5 ring-1 ring-black/5">
            <p className="text-lg font-extrabold text-ink">
              Henüz bildirimin yok
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Yolculuğuna biri katıldığında ya da ayrıldığında, katıldığın bir
              yolculuk iptal edildiğinde burada göreceksin.
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-violet px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky"
            >
              Etkinliklere göz at
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((item) => {
              const meta = typeMeta[item.type];

              return (
                <li key={item.id}>
                  <form action={openNotificationAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors hover:bg-lilac sm:p-5 ${
                        item.read
                          ? "border-line bg-white"
                          : "border-violet/30 bg-lilac/60"
                      }`}
                    >
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${meta.tint}`}
                      >
                        <Icon name={meta.icon} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-base text-ink ${
                            item.read ? "font-bold" : "font-extrabold"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm text-muted">
                          {item.body}
                        </span>
                        <span className="mt-2 block text-xs text-muted">
                          {relativeTime(item.createdAt)}
                        </span>
                      </span>
                      {!item.read && (
                        <span className="mt-1.5 shrink-0">
                          <span
                            aria-hidden="true"
                            className="block h-2.5 w-2.5 rounded-full bg-violet"
                          />
                          <span className="sr-only">Okunmadı</span>
                        </span>
                      )}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 text-xs text-muted">
          En son 30 bildirim gösterilir. Bildirimler yalnızca bu uygulamanın
          içindedir, telefona bildirim gönderilmez.
        </p>
      </div>
    </main>
  );
}