"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/hesap/actions";
import { useAuthUser } from "@/components/AuthProvider";
import Icon from "@/components/Icons";
import Logo from "@/components/Logo";
import { UnreadBadge } from "@/components/UnreadProvider";
import { roleLabels } from "@/lib/roles";

const links = [
  { label: "Etkinlikler", href: "/events" },
  { label: "Nasıl Çalışır", href: "/#nasil-calisir" },
];

export default function Header() {
  const pathname = usePathname();
  const user = useAuthUser();

  const initial = user
    ? user.name.trim().charAt(0).toLocaleUpperCase("tr-TR")
    : "";
  const notificationsActive = pathname.startsWith("/bildirimler");

  return (
    <header className="sticky top-0 z-40 sm:top-3 sm:px-4 sm:pt-3">
      <div className="border-b border-line bg-surface/90 backdrop-blur sm:mx-auto sm:max-w-5xl sm:rounded-full sm:border-0 sm:bg-white/90 sm:shadow-lg sm:shadow-violet/10 sm:ring-1 sm:ring-black/5">
        <div className="flex h-16 items-center justify-between px-4 sm:pl-6 sm:pr-3">
          <Link href="/" aria-label="Eventra ana sayfa">
            <Logo />
          </Link>

          <nav
            aria-label="Ana menü"
            className="hidden items-center gap-1 text-sm font-semibold sm:flex"
          >
            {links.map((link) => {
              const active =
                link.href === "/events" && pathname.startsWith("/events");

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-2 transition-colors ${
                    active
                      ? "bg-lilac text-violet"
                      : "text-ink hover:bg-lilac"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {user ? (
              <>
                <Link
                  href="/bildirimler"
                  aria-current={notificationsActive ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition-colors ${
                    notificationsActive
                      ? "bg-lilac text-violet"
                      : "text-ink hover:bg-lilac"
                  }`}
                >
                  <Icon name="bell" className="h-4 w-4" />
                  Bildirimler
                  <UnreadBadge />
                </Link>
                <Link
                  href="/panel"
                  className="group ml-1 flex items-center gap-2 rounded-full bg-lilac py-1.5 pl-1.5 pr-4 text-violet transition-colors hover:bg-violet hover:text-white"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-violet text-xs font-bold text-white group-hover:bg-white group-hover:text-violet">
                    {initial}
                  </span>
                  {user.name} · {roleLabels[user.role]}
                </Link>
                <form action={logoutAction} className="contents">
                  <button
                    type="submit"
                    className="rounded-full px-4 py-2 text-ink transition-colors hover:bg-lilac"
                  >
                    Çıkış
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="ml-1 rounded-full px-4 py-2 text-ink ring-1 ring-line transition-colors hover:bg-lilac"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  className="rounded-full bg-violet px-5 py-2.5 text-white transition-colors hover:bg-sky"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </nav>

          <div className="sm:hidden">
            {user ? (
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-full bg-lilac px-4 text-sm font-bold text-violet"
                >
                  Çıkış
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  href="/giris"
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-ink hover:bg-lilac"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  className="inline-flex min-h-11 items-center rounded-full bg-violet px-4 text-sm font-bold text-white"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}