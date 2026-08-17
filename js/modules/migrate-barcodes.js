(function () {

    function waitForDatabase() {

        if (typeof db !== "undefined" && db) {
            runBarcodeMigration();
            return;
        }

        setTimeout(waitForDatabase, 300);
    }

    async function runBarcodeMigration() {

        try {

            const products = await new Promise(function (resolve, reject) {

                const tx = db.transaction("products", "readonly");
                const req = tx.objectStore("products").getAll();

                req.onsuccess = function () {
                    resolve(req.result || []);
                };

                req.onerror = function () {
                    reject(new Error("خواندن کالاها انجام نشد."));
                };

            });

            if (!products.length) {
                alert("هیچ کالایی در انبار نیست.");
                return;
            }

            products.sort(function (a, b) {
                return Number(a.id) - Number(b.id);
            });

            let nextNum = 1;

            products.forEach(function (p) {

                if (
                    p.code &&
                    /^PY-\d+$/i.test(String(p.code))
                ) {

                    const n =
                        parseInt(
                            String(p.code).replace(/\D/g, ""),
                            10
                        );

                    if (n >= nextNum) {
                        nextNum = n + 1;
                    }

                }

            });

            const confirmed = confirm(
                "برای " +
                products.length +
                " کالا فیلد barcode اضافه/به‌روز شود؟\n" +
                "(اگر code داشته باشد همان می‌شود؛ وگرنه PY-xxx جدید)"
            );

            if (!confirmed) {
                return;
            }

            await new Promise(function (resolve, reject) {

                const tx =
                    db.transaction("products", "readwrite");

                const store =
                    tx.objectStore("products");

                products.forEach(function (product) {

                    let barcode =
                        String(product.code || "").trim();

                    if (!barcode) {

                        barcode =
                            "PY-" +
                            String(nextNum).padStart(3, "0");

                        product.code = barcode;

                        nextNum++;

                    }

                    product.barcode = barcode;

                    product.updatedAt =
                        new Date().toISOString();

                    store.put(product);

                });

                tx.oncomplete = function () {
                    resolve();
                };

                tx.onerror = function () {
                    reject(
                        new Error(
                            "ذخیره بارکدها انجام نشد."
                        )
                    );
                };

            });

            alert(
                "انجام شد.\n" +
                "تعداد: " +
                products.length +
                "\n" +
                "فیلد barcode برای همه کالاها تنظیم شد."
            );

            if (
                typeof loadProducts === "function"
            ) {
                loadProducts();
            }

        } catch (error) {

            console.error(
                "BARCODE MIGRATION ERROR:",
                error
            );

            alert(
                "خطا هنگام ساخت بارکدها:\n" +
                error.message
            );

        }

    }

    waitForDatabase();

})();