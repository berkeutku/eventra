"use client";

import { useEffect } from "react";
import { startInstallCapture } from "@/lib/install-prompt";

// Service worker yalnızca yayın (production) sürümünde kaydedilir.
// Geliştirme modunda ise önceki denemelerden kalan service worker ve önbellekler
// silinir, böylece eski dosyalar yeni kodla çakışmaz.
export default function ServiceWorkerRegister() {
  // "Ana ekrana ekle" olayı sayfa açılırken bir kez gelir, bu yüzden burada yakalanır.
  useEffect(() => startInstallCapture(), []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        })
        .catch(() => {});

      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => {
            keys
              .filter((key) => key.startsWith("eventra-"))
              .forEach((key) => {
                caches.delete(key);
              });
          })
          .catch(() => {});
      }

      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => {
        console.error("Service worker kaydedilemedi:", error);
      });
  }, []);

  return null;
}