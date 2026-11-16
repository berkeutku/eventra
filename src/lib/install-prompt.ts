// Yalnızca tarayıcıda çalışır. Tarayıcının "beforeinstallprompt" olayı sayfa açılırken bir kez gelir,
// bu yüzden olay her zaman yüklü olan bir bileşenden (ServiceWorkerRegister) yakalanıp burada saklanır.

export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function startInstallCapture(): () => void {
  function onPrompt(event: Event) {
    // Tarayıcının kendi küçük kurulum çubuğunu engelleyip kendi kartımızı gösteririz.
    event.preventDefault();
    deferred = event as InstallEvent;
    notify();
  }

  function onInstalled() {
    deferred = null;
    notify();
  }

  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);

  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getInstallEvent(): InstallEvent | null {
  return deferred;
}

export async function promptInstall(): Promise<
  "accepted" | "dismissed" | "unavailable"
> {
  const event = deferred;

  if (!event) {
    return "unavailable";
  }

  try {
    await event.prompt();
    const choice = await event.userChoice;
    // Olay yalnızca bir kez kullanılabilir.
    deferred = null;
    notify();
    return choice.outcome;
  } catch {
    return "unavailable";
  }
}
