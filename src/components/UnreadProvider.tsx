"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuthUser } from "@/components/AuthProvider";

const UnreadContext = createContext(0);

export function useUnreadCount(): number {
  return useContext(UnreadContext);
}

export function UnreadBadge({ className = "" }: { className?: string }) {
  const count = useUnreadCount();

  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-extrabold leading-5 text-white ${className}`}
    >
      <span aria-hidden="true">{count > 9 ? "9+" : count}</span>
      <span className="sr-only">{count} okunmamış bildirim</span>
    </span>
  );
}

// Okunmamış bildirim sayısını tutar. Sunucudan gelen ilk değerle başlar,
// açık sekmede dakikada bir ve sekmeye geri dönüldüğünde sayıyı yeniler.
export default function UnreadProvider({
  initial,
  children,
}: {
  initial: number;
  children: ReactNode;
}) {
  const user = useAuthUser();
  const loggedIn = user !== null;
  const [count, setCount] = useState(initial);
  const [syncedInitial, setSyncedInitial] = useState(initial);

  // Sayfa sunucuda tazelendiğinde (ör. bildirim okundu işaretlenince) yeni değeri al.
  if (initial !== syncedInitial) {
    setSyncedInitial(initial);
    setCount(initial);
  }

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/unread", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { count?: number };

        if (!cancelled && typeof data.count === "number") {
          setCount(data.count);
        }
      } catch {
        // Ağ hatasında mevcut sayı korunur.
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }

    const interval = setInterval(onVisible, 60_000);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loggedIn]);

  return (
    <UnreadContext.Provider value={loggedIn ? count : 0}>
      {children}
    </UnreadContext.Provider>
  );
}