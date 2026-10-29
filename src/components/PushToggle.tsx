"use client";

import { useEffect, useState } from "react";
import {
  savePushSubscriptionAction,
  removePushSubscriptionAction,
  sendTestPushAction,
} from "@/app/panel/push-actions";
import { useToast } from "@/components/Toast";
import {
  getReadyRegistration,
  isIos,
  isPushSupported,
  isStandalone,
  urlBase64ToUint8Array,
} from "@/lib/push-client";

type PushState =
  | "checking"
  | "dev"
  | "no-key"
  | "unsupported"
  | "needs-install"
  | "denied"
  | "off"
  | "on";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

async function saveToServer(subscription: PushSubscription): Promise<boolean> {
  const json = subscription.toJSON();

  return savePushSubscriptionAction({
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
  });
}

export default function PushToggle() {
  const toast = useToast();
  const [state, setState] = useState<PushState>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      let next: PushState;

      if (process.env.NODE_ENV !== "production") {
        next = "dev";
      } else if (!PUBLIC_KEY) {
        next = "no-key";
      } else if (!isPushSupported()) {
        next = isIos() && !isStandalone() ? "needs-install" : "unsupported";
      } else if (Notification.permission === "denied") {
        next = "denied";
      } else {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();

        if (subscription) {
          // Cihazdaki abonelik bu hesaba bağlı olsun (başka hesapla girildiyse eşitler).
          await saveToServer(subscription).catch(() => false);
          next = "on";
        } else {
          next = "off";
        }
      }

      if (!cancelled) {
        setState(next);
      }
    }

    detect().catch(() => {
      if (!cancelled) {
        setState("unsupported");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    if (!PUBLIC_KEY) {
      return;
    }

    setBusy(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await getReadyRegistration();

      if (!registration) {
        toast.show("Bildirim servisi hazır değil. Sayfayı yenileyip dene.", "info");
        return;
      }

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
        }));

      const saved = await saveToServer(subscription);

      if (!saved) {
        await subscription.unsubscribe();
        toast.show("Bildirimler kaydedilemedi. Lütfen tekrar dene.", "info");
        return;
      }

      setState("on");
      toast.show("Bu cihazda telefon bildirimleri açıldı.");
    } catch {
      toast.show("Bildirimler açılamadı. Lütfen tekrar dene.", "info");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await removePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }

      setState("off");
      toast.show("Bu cihazda telefon bildirimleri kapatıldı.");
    } catch {
      toast.show("Bildirimler kapatılamadı. Lütfen tekrar dene.", "info");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);

    try {
      const result = await sendTestPushAction();

      if (result === "sent") {
        toast.show("Deneme bildirimi gönderildi.");
      } else if (result === "no_subscription") {
        toast.show("Bu hesapta kayıtlı cihaz yok. Bildirimleri yeniden aç.", "info");
      } else if (result === "not_configured") {
        toast.show("Sunucuda push anahtarları tanımlı değil.", "info");
      } else {
        toast.show("Deneme bildirimi gönderilemedi.", "info");
      }
    } finally {
      setBusy(false);
    }
  }

  const messages: Partial<Record<PushState, string>> = {
    dev: "Telefon bildirimleri yalnızca yayın sürümünde çalışır (geliştirme modunda kapalı).",
    "no-key": "Telefon bildirimleri bu sürümde yapılandırılmamış.",
    unsupported: "Bu tarayıcı telefon bildirimlerini desteklemiyor.",
    "needs-install":
      "iPhone'da telefon bildirimi için önce Safari'de Paylaş düğmesinden Ana Ekrana Ekle ile uygulamayı yükle, sonra yüklenen uygulamadan aç.",
    denied:
      "Bu tarayıcıda bildirim izni kapalı. Tarayıcı veya telefon ayarlarından Eventra için bildirimlere izin ver.",
  };

  const buttonBase =
    "rounded-full px-5 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="mt-4 rounded-2xl bg-surface p-5">
      <p className="text-sm font-bold text-ink">Telefon bildirimleri</p>

      {state === "checking" && (
        <p className="mt-1 text-sm text-muted">Kontrol ediliyor…</p>
      )}

      {messages[state] && (
        <p className="mt-1 text-sm text-muted">{messages[state]}</p>
      )}

      {(state === "off" || state === "on") && (
        <>
          <p className="mt-1 text-sm text-muted">
            {state === "on"
              ? "Bu cihaza bildirim gönderilir: yolculuğuna biri katıldığında veya ayrıldığında, katıldığın yolculuk iptal edildiğinde. Bildirim metni yolcu adını içerebilir ve kilit ekranında görünebilir."
              : "Yolculuğunla ilgili olaylarda bu cihaza bildirim al. Tarayıcı senden izin isteyecek, istediğin zaman kapatabilirsin."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {state === "off" ? (
              <button
                type="button"
                onClick={enable}
                disabled={busy}
                className={`${buttonBase} bg-violet text-white hover:bg-sky`}
              >
                {busy ? "Açılıyor…" : "Bildirimleri bu cihazda aç"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={sendTest}
                  disabled={busy}
                  className={`${buttonBase} bg-violet text-white hover:bg-sky`}
                >
                  Deneme bildirimi gönder
                </button>
                <button
                  type="button"
                  onClick={disable}
                  disabled={busy}
                  className={`${buttonBase} border border-line text-ink hover:bg-lilac`}
                >
                  Bu cihazda kapat
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}