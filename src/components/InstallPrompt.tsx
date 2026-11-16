"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { cardClass } from "@/components/ui/Card";
import {
  getInstallEvent,
  promptInstall,
  subscribeInstall,
} from "@/lib/install-prompt";
import { installHint, isIosDevice } from "@/lib/install-prompt-rules";

const DISMISS_KEY = "eventra_install_dismissed";
const DISMISS_EVENT = "eventra-install-dismiss";

const noopSubscribe = () => () => {};

function subscribeDismiss(listener: () => void) {
  window.addEventListener(DISMISS_EVENT, listener);
  return () => window.removeEventListener(DISMISS_EVENT, listener);
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function readStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallPrompt() {
  // Sunucuda "zaten kurulu" varsayılır, böylece kart yalnızca tarayıcıda gerekirse görünür.
  const standalone = useSyncExternalStore(noopSubscribe, readStandalone, () => true);
  const ios = useSyncExternalStore(
    noopSubscribe,
    () => isIosDevice(navigator.userAgent),
    () => false,
  );
  const dismissed = useSyncExternalStore(subscribeDismiss, readDismissed, () => true);
  const canPrompt = useSyncExternalStore(
    subscribeInstall,
    () => getInstallEvent() !== null,
    () => false,
  );

  const hint = installHint({ standalone, dismissed, canPrompt, ios });

  if (hint === "none") {
    return null;
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Depolama kapalıysa kart bu oturumda yine kapanır.
    }

    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  return (
    <section aria-label="Uygulamayı kur" className={cardClass}>
      <h2 className="text-xl font-extrabold tracking-tight">
        Eventra&apos;yı ana ekrana ekle
      </h2>
      <p className="mt-2 text-sm text-muted">
        {hint === "prompt"
          ? "Uygulama gibi tek dokunuşla aç, yolculuk bildirimlerini kaçırma."
          : "Safari'de alttaki Paylaş düğmesine dokun, ardından \"Ana Ekrana Ekle\"yi seç. Uygulama gibi açılır ve yolculuk bildirimlerini alabilirsin."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {hint === "prompt" && (
          <Button
            onClick={async () => {
              await promptInstall();
            }}
          >
            Ana ekrana ekle
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={dismiss}>
          Şimdi değil
        </Button>
      </div>
    </section>
  );
}
