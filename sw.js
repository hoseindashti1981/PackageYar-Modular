/* ============================================================
   PackageYar - Service Worker
   استراتژی: Network First (آپدیت فوری) + Fallback به کش در حالت آفلاین
   ============================================================ */

const CACHE_NAME = "packageyar-v7";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",

  // آیکون‌ها
  "./icons/icon-192.png",
  "./icons/icon-512.png",

  // CSS
  "./css/app.css",
  "./css/print.css",

  // utils
  "./js/utils/dates.js",
  "./js/utils/formatter.js",
  "./js/utils/helpers.js",
  "./js/utils/validator.js",

  // core
  "./js/core/state.js",
  "./js/core/database.js",
  "./js/core/theme.js",
  "./js/core/app.js",

  // ui
  "./js/ui/navigation.js",
  "./js/ui/dashboard.js",
  "./js/ui/modal.js",
  "./js/ui/toast.js",
  "./js/ui/header.js",

  // modules
  "./js/modules/stock.js",
  "./js/modules/customers.js",
  "./js/modules/devices.js",
  "./js/modules/inventory.js",
  "./js/modules/repairs.js",
  "./js/modules/purchase.js",
  "./js/modules/sales.js",
  "./js/modules/print-sales.js",
  "./js/modules/settings.js",
  "./js/modules/reports.js",

  // pwa
  "./js/pwa/register.js"
];

/* ---------- Install ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())   // بلافاصله فعال شود
  );
});

/* ---------- Activate ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())  // کنترل همه تب‌ها
  );
});

/* ---------- Fetch: Network First ---------- */
self.addEventListener("fetch", (event) => {
  // فقط درخواست‌های هم‌منبع
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // پاسخ موفق را در کش ذخیره کن (برای استفاده آفلاین)
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // شبکه در دسترس نبود → از کش بخوان
        return caches.match(event.request).then((cached) => {
          if (cached) {
            return cached;
          }
          // اگر صفحه navigate بود و در کش نبود، index.html را برگردان
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return new Response("آفلاین هستید و این فایل در کش موجود نیست.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        });
      })
  );
});

/* ---------- پیام از صفحه ---------- */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
