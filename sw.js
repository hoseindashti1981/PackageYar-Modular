const CACHE_NAME = "packageyar-v4";

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
  "./js/pwa/register.js",
  "./js/pwa/update.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then(function (response) {
        // فقط درخواست‌های موفق هم‌منبع را در کش ذخیره کن
        if (
          !response ||
          response.status !== 200 ||
          response.type !== "basic"
        ) {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(function () {
        // اگر آفلاین بود و در کش نبود، همان صفحه اصلی را برگردان
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
