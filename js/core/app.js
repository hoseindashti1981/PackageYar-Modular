
/* ============================================================
   PackageYar - Application Bootstrap
   فایل: js/core/app.js

   وظیفه این فایل:
   - راه‌اندازی اولیه برنامه
   - آماده‌سازی تاریخ امروز
   - باز کردن دیتابیس
   - بارگذاری اطلاعات اولیه
   - اتصال Search Listener ها
   - اجرای Branding
   - اجرای قابلیت‌های اولیه UI

   نکته:
   این فایل منطق اصلی Customers / Repairs / Inventory / Sales
   را پیاده‌سازی نمی‌کند؛ فقط آن‌ها را در زمان مناسب اجرا می‌کند.
   ============================================================ */


/* ============================================================
   1. راه‌اندازی اصلی برنامه
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /* ----------------------------------------------------
           تاریخ امروز
           ---------------------------------------------------- */

        try {

            const todayDate =
                document.getElementById("todayDate");

            if (todayDate) {

                todayDate.innerText =
                    getTodayJalali();

            }

        } catch (error) {

            console.error(
                "TODAY DATE ERROR",
                error
            );

            const todayDate =
                document.getElementById("todayDate");

            if (todayDate) {

                todayDate.innerText =
                    "خطا";

            }

        }


        /* ----------------------------------------------------
           باز کردن دیتابیس
           ---------------------------------------------------- */

        openDatabase()

            .then(
                function () {

                    console.log(
                        "PackageYar database opened successfully."
                    );


                    /* --------------------------------------------
                       Dashboard
                       -------------------------------------------- */

                    updateDashboard();


                    /* --------------------------------------------
                       Customers
                       -------------------------------------------- */

                    loadCustomers();


                    /* --------------------------------------------
                       Products / Inventory
                       -------------------------------------------- */

                    loadProducts();

                    updateInventorySummary();


                    /* --------------------------------------------
                       Application Branding
                       -------------------------------------------- */

                    applyAppBranding();


                    /* --------------------------------------------
                       Inventory import button
                       -------------------------------------------- */

                    if (
                        typeof renderInventoryImportButton ===
                        "function"
                    ) {

                        renderInventoryImportButton();

                    }

                }
            )

            .catch(
                function (error) {

                    console.error(
                        "APP DATABASE FAILED",
                        error
                    );

                    const dbStatus =
                        document.getElementById("dbStatus");

                    if (dbStatus) {

                        dbStatus.innerText =
                            "خطا در اتصال به دیتابیس";

                        dbStatus.classList.add(
                            "db-error"
                        );

                    }

                }
            );


        /* ========================================================
           2. جستجوی مشتریان
           ======================================================== */

        const customerSearch =
            document.getElementById(
                "customerSearch"
            );

        if (customerSearch) {

            customerSearch.addEventListener(
                "input",
                function () {

                    loadCustomers();

                }
            );

        }


        /* ========================================================
           3. جستجوی کالاها
           ======================================================== */

        const productSearch =
            document.getElementById(
                "productSearch"
            );

        if (productSearch) {

            productSearch.addEventListener(
                "input",
                function () {

                    loadProducts();

                }
            );

        }


        /* ========================================================
           4. جستجوی سوابق تعمیرات
           ======================================================== */

        const repairHistorySearch =
            document.getElementById(
                "repairHistorySearch"
            );

        if (repairHistorySearch) {

            repairHistorySearch.addEventListener(
                "input",
                function () {

                    loadAllRepairs();

                }
            );

        }

    }
);
