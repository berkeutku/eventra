"use client";

import { useEffect } from "react";

// Service worker yalnızca yayın (production) sürümünde kaydedilir.
// Geliştirme sırasında önbellek kafa karıştırmasın diye devre dışıdır.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
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