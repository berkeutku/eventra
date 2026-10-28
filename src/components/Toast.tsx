"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Icon from "@/components/Icons";

type Tone = "success" | "info";

type ToastItem = {
  id: number;
  message: string;
  tone: Tone;
};

type ToastApi = {
  show: (message: string, tone?: Tone) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast yalnızca ToastProvider içinde kullanılabilir.");
  }

  return context;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = nextId.current;
      nextId.current += 1;

      // Ekranda en fazla 3 bildirim kalır.
      setItems((current) => [...current.slice(-2), { id, message, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 5000),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-night py-2.5 pl-3 pr-2 text-sm font-bold text-white shadow-xl shadow-black/20"
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                item.tone === "success"
                  ? "bg-mint text-night"
                  : "bg-white/20 text-white"
              }`}
            >
              <Icon name="check" className="h-4 w-4" />
            </span>
            <span>{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Bildirimi kapat"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}