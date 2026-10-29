// Eventra service worker (demo).
// Çevrimdışı yedek sayfasını, ikonları ve değişmez statik dosyaları önbelleğe alır.
// Giriş yapmış kullanıcıya ait sayfalar ve veritabanı verileri ASLA önbelleğe alınmaz.
// Ayrıca sunucudan gelen push bildirimlerini gösterir.
const CACHE_NAME = "eventra-offline-v2";
const OFFLINE_URL = "/offline";
const STATIC_PREFIX = "/_next/static/";
const ICONS = ["/icons/icon-192.png", "/icons/icon-512.png"];

async function precache() {
  const cache = await caches.open(CACHE_NAME);

  // credentials: "omit" -> çerez gönderilmez, önbelleğe giriş yapmamış hâli girer.
  const response = await fetch(
    new Request(OFFLINE_URL, { credentials: "omit" }),
  );

  if (!response.ok) {
    throw new Error("Çevrimdışı sayfa alınamadı.");
  }

  const html = await response.clone().text();
  await cache.put(OFFLINE_URL, response);

  // Çevrimdışı sayfanın biçimlenmesi için gereken CSS ve yazı tipi dosyaları.
  const assets = new Set(ICONS);
  const found = html.match(/\/_next\/static\/[^"'\s)\\<>]+/g) ?? [];
  found.forEach((url) => assets.add(url));

  await Promise.allSettled(
    [...assets].map((url) =>
      cache.add(new Request(url, { credentials: "omit" })),
    ),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Değişmez statik dosyalar: önce önbellek, yoksa ağ.
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith(STATIC_PREFIX)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Sayfa gezintileri: önce ağ, bağlantı yoksa çevrimdışı sayfa.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const fallback = await cache.match(OFFLINE_URL);
        return fallback ?? Response.error();
      }),
    );
  }
});

// Sunucudan gelen push bildirimi.
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title =
    typeof data.title === "string" && data.title ? data.title : "Eventra";
  const body = typeof data.body === "string" ? data.body : "";
  const link = typeof data.link === "string" ? data.link : "/bildirimler";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      data: { link },
    }),
  );
});

// Bildirime dokunulunca ilgili sayfayı aç. Yalnızca site içi yollar kabul edilir.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const raw = event.notification.data && event.notification.data.link;
  const link =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")
      ? raw
      : "/bildirimler";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windows) {
        if ("focus" in client) {
          await client.focus();

          if ("navigate" in client) {
            try {
              await client.navigate(link);
            } catch {
              // Gezinme başarısız olursa pencere yine de öne gelir.
            }
          }

          return;
        }
      }

      await self.clients.openWindow(link);
    })(),
  );
});