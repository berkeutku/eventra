"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { logoutDemoUser, roleLabels, useDemoUser } from "@/lib/session";

const links = [
  { label: "Etkinlikler", href: "/events" },
  { label: "Nasıl Çalışır", href: "/#nasil-calisir" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const user = useDemoUser();

  function handleLogout() {
    logoutDemoUser();
    setOpen(false);
    router.push("/");
  }

  return (
    <header className="sticky top-3 z-50 px-4 pt-3">
      <div className="mx-auto max-w-5xl rounded-full bg-white/90 shadow-lg shadow-violet/10 ring-1 ring-line backdrop-blur">
        <div className="flex h-16 items-center justify-between pl-6 pr-3">
          <Link href="/" aria-label="Eventra ana sayfa">
            <Logo />
          </Link>

          <nav
            aria-label="Ana menü"
            className="hidden items-center gap-1 text-sm font-medium text-ink sm:flex"
          >
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full px-4 py-2 transition-colors hover:bg-lilac"
              >
                {link.label}
              </Link>
            ))}

            {user === undefined ? null : user === null ? (
              <Link
                href="/giris"
                className="ml-1 rounded-full bg-ink px-5 py-2.5 text-white transition-colors hover:bg-violet"
              >
                Giriş Yap
              </Link>
            ) : (
              <>
                               <Link
                  href="/panel"
                  className="ml-1 rounded-full bg-lilac px-4 py-2 text-violet transition-colors hover:bg-violet hover:text-white"
                >
                  {user.name} · {roleLabels[user.role]}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full px-4 py-2 transition-colors hover:bg-lilac"
                >
                  Çıkış
                </button>
              </>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-lilac text-violet sm:hidden"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 8h16M4 16h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav
            id="mobile-menu"
            aria-label="Mobil menü"
            className="px-4 pb-4 sm:hidden"
          >
            <ul className="flex flex-col gap-1 border-t border-line pt-3">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl px-4 py-3 text-lg font-medium text-ink hover:bg-lilac"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {user === null && (
                <li>
                  <Link
                    href="/giris"
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl bg-ink px-4 py-3 text-center text-lg font-medium text-white"
                  >
                    Giriş Yap
                  </Link>
                </li>
              )}
              {user && (
                <>
                  <li>
                    <Link
                      href="/panel"
                      onClick={() => setOpen(false)}
                      className="block rounded-2xl bg-lilac px-4 py-3 text-lg font-medium text-violet"
                    >
                      Panelim · {user.name}
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-2xl px-4 py-3 text-left text-lg font-medium text-ink hover:bg-lilac"
                    >
                      Çıkış
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}