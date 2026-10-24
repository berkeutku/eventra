import { useSyncExternalStore } from "react";

export type Role = "driver" | "passenger";

export type DemoUser = {
  name: string;
  role: Role;
};

export const roleLabels: Record<Role, string> = {
  driver: "Sürücü",
  passenger: "Yolcu",
};

const STORAGE_KEY = "eventra-demo-user";
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedUser: DemoUser | null = null;

function readUser(): DemoUser | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }

  if (raw === cachedRaw) {
    return cachedUser;
  }

  cachedRaw = raw;
  try {
    cachedUser = raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// undefined = henüz yüklenmedi, null = giriş yapılmamış, DemoUser = giriş yapılmış
export function useDemoUser(): DemoUser | null | undefined {
  return useSyncExternalStore(subscribe, readUser, () => undefined);
}

export function loginDemoUser(user: DemoUser) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Tarayıcı depolamaya izin vermiyorsa sessizce devam et.
  }
  notify();
}

export function logoutDemoUser() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Tarayıcı depolamaya izin vermiyorsa sessizce devam et.
  }
  notify();
}