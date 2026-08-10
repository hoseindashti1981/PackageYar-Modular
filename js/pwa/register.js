/* ============================================================
   PackageYar - Service Worker Registration
   آپدیت فوری بدون هیچ پرسش از کاربر
   ============================================================ */

if ("serviceWorker" in navigator) {

  window.addEventListener("load", () => {

    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {

        // هر بار که صفحه فوکوس می‌گیرد یا visible می‌شود، چک آپدیت کن
        const checkForUpdate = () => {
          registration.update().catch(() => {});
        };

        // چک اولیه
        checkForUpdate();

        // چک هنگام برگشت به تب / اپ
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            checkForUpdate();
          }
        });

        // چک هنگام فوکوس شدن پنجره
        window.addEventListener("focus", checkForUpdate);

        // وقتی نسخه جدید پیدا شد
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            // وقتی نصب شد، فوراً فعالش کن
            if (newWorker.state === "installed") {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

      })
      .catch((err) => {
        console.log("SW register failed:", err);
      });

  });

  // وقتی Service Worker جدید کنترل صفحه را گرفت → رفرش فوری
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

}
