"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/components/AuthProvider";
import Icon, { type IconName } from "@/components/Icons";
import { UnreadBadge } from "@/components/UnreadProvider";

type Tab = {
  label: string;
  href: string;
  icon: IconName;
  active: boolean;
  badge?: boolean;
};

export default function BottomNav() {
  const pathname = usePathname();
  const user = useAuthUser();

  const tabs: Tab[] = [
    { label: "Ana Sayfa", href: "/", icon: "home", active: pathname === "/" },
    {
      label: "Etkinlikler",
      href: "/events",
      icon: "ticket",
      active: pathname.startsWith("/events"),
    },
  ];

  if (user) {
    tabs.push({
      label: "Bildirimler",
      href: "/bildirimler",
      icon: "bell",
      active: pathname.startsWith("/bildirimler"),
      badge: true,
    });
  }

  tabs.push({
    label: "Profil",
    href: "/panel",
    icon: "user",
    active: pathname.startsWith("/panel") || pathname.startsWith("/giris"),
  });

  return (
    <nav
      aria-label="Alt menü"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul
        className={`mx-auto grid max-w-md ${user ? "grid-cols-4" : "grid-cols-3"}`}
      >
        {tabs.map((tab) => (
          <li key={tab.label}>
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors ${
                tab.active ? "text-violet" : "text-muted"
              }`}
            >
              <span
                className={`relative grid h-8 w-14 place-items-center rounded-full transition-colors ${
                  tab.active ? "bg-lilac" : ""
                }`}
              >
                <Icon name={tab.icon} className="h-5 w-5" />
                {tab.badge && <UnreadBadge className="absolute -right-0.5 -top-1" />}
              </span>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}