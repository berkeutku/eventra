import { removePushSubscriptionAction } from "@/app/panel/push-actions";

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Service worker hazır olana kadar en fazla 5 saniye bekler.
export async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  const timeout = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), 5000);
  });

  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

// Çıkış yaparken bu cihazın aboneliğini kaldırır (ortak cihazlarda başkasının
// bildirimlerinin gelmesini önler). Başarısız olursa çıkışı engellemez.
export async function disablePushOnThisDevice(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager?.getSubscription();

    if (!subscription) {
      return;
    }

    await removePushSubscriptionAction(subscription.endpoint);
    await subscription.unsubscribe();
  } catch {
    // Sessizce devam et.
  }
}