function getSetting(key){
    return new Promise(function(resolve, reject){
        if(!db){
            resolve(null);
            return;
        }
        const tx = db.transaction("settings", "readonly");
        const req = tx.objectStore("settings").get(key);
        req.onsuccess = function(){
            resolve(req.result ? req.result.value : null);
        };
        req.onerror = function(){
            resolve(null);
        };
    });
}


function setSetting(key, value){
    return new Promise(function(resolve, reject){
        if(!db){
            reject(new Error("دیتابیس آماده نیست."));
            return;
        }
        const tx = db.transaction("settings", "readwrite");
        const store = tx.objectStore("settings");
        store.put({ key: key, value: value });
        tx.oncomplete = function(){ resolve(); };
        tx.onerror = function(){ reject(new Error("ذخیره تنظیمات انجام نشد.")); };
    });
}


async function applyAppBranding(){

    try{
        const appName = await getSetting("appName") || "پکیج‌یار";
        const appSubtitle = await getSetting("appSubtitle") || "سیستم مدیریت تعمیرکار پکیج";
        const appLogo = await getSetting("appLogo") || "";

        const nameEl = document.getElementById("headerAppName");
        if(nameEl){
            nameEl.innerText = "🔥 " + appName;
        }else{
            const logoText = document.querySelector(".logo");
            if(logoText) logoText.innerText = "🔥 " + appName;
        }

        const subtitle = document.querySelector(".subtitle");
        if(subtitle) subtitle.innerText = appSubtitle;

        document.title = appName;

        const headerLogo = document.getElementById("headerAppLogo");
        if(headerLogo){
            if(appLogo){
                headerLogo.src = appLogo;
                headerLogo.style.display = "block";
                headerLogo.alt = appName;
            }else{
                headerLogo.removeAttribute("src");
                headerLogo.style.display = "none";
            }
        }

    }catch(e){
        console.error("خطا در اعمال نام/لوگوی برنامه:", e);
    }
}


async function renderSettingsPage(){

    const page = document.getElementById("settingsPage");
    if(!page) return;

    const appName = await getSetting("appName") || "پکیج‌یار";
    const appSubtitle = await getSetting("appSubtitle") || "سیستم مدیریت تعمیرکار پکیج";
    const appLogo = await getSetting("appLogo") || "";

    page.innerHTML = `
    <div class="section-title">⚙️ تنظیمات</div>

    <!-- =====================================================
         نام و عنوان برنامه
         ===================================================== -->

    <div class="card">
        <h3 style="margin-top:0;">نام و عنوان برنامه</h3>

        <label>نام برنامه (بالای صفحه)</label>
        <input
            id="settingAppName"
            type="text"
            value="${escapeHTML(appName)}"
            placeholder="مثلاً پکیج‌یار"
        >

        <label>زیرعنوان</label>
        <input
            id="settingAppSubtitle"
            type="text"
            value="${escapeHTML(appSubtitle)}"
            placeholder="مثلاً سیستم مدیریت تعمیرکار پکیج"
        >

        <button
            class="primary-btn"
            style="width:100%;margin-top:10px;"
            onclick="saveBrandingSettings()"
        >
            💾 ذخیره نام و عنوان
        </button>
    </div>

     <!-- =====================================================
                         گزارش گیری
      ===================================================== -->


<div class="card">
    <div style="font-weight:bold;margin-bottom:10px;">📊 گزارش‌ها</div>
    <p style="color:#666;font-size:13px;line-height:1.8;margin-bottom:12px;">
        خلاصه فروش، تعمیرات، مانده مشتریان و قطعات پرمصرف.
    </p>
    <button
        class="primary-btn"
        style="width:100%;"
        onclick="openReportsPage()"
    >
        مشاهده گزارش‌ها
    </button>
</div>



    <!-- =====================================================
         لوگوی کسب و کار
         ===================================================== -->

    <div class="card">
        <h3 style="margin-top:0;">🖼️ لوگوی کسب‌وکار</h3>

        <p style="color:#666;font-size:13px;line-height:1.8;">
            لوگوی انتخاب‌شده در فاکتورهای چاپی فروش و خرید
            قابل استفاده خواهد بود.
            <br>
            پیشنهاد می‌شود از یک تصویر مربعی با کیفیت مناسب استفاده کنید.
        </p>

        <div
            id="appLogoPreviewContainer"
            class="app-logo-preview-container"
            style="${appLogo ? "" : "display:none;"}"
        >
            <img
                id="appLogoPreview"
                class="app-logo-preview"
                src="${appLogo}"
                alt="پیش‌نمایش لوگو"
            >
        </div>

        <div
            id="appLogoEmptyMessage"
            class="app-logo-empty-message"
            style="${appLogo ? "display:none;" : ""}"
        >
            هنوز لوگویی انتخاب نشده است.
        </div>

        <input
            id="appLogoInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style="display:none;"
            onchange="handleAppLogoSelection(event)"
        >

        <button
            type="button"
            class="secondary-btn"
            style="width:100%;margin-top:10px;"
            onclick="document.getElementById('appLogoInput').click()"
        >
            📷 انتخاب لوگو
        </button>

        <button
            id="removeAppLogoButton"
            type="button"
            class="danger-btn"
            style="width:100%;margin-top:10px;${appLogo ? "" : "display:none;"}"
            onclick="removeAppLogo()"
        >
            🗑️ حذف لوگو
        </button>

        <p style="color:#888;font-size:12px;line-height:1.7;margin-bottom:0;">
            فرمت‌های مجاز: PNG، JPG و WEBP
        </p>
    </div>


    <!-- =====================================================
         قیمت فروش گروهی
         ===================================================== -->

    <div class="card">
        <h3 style="margin-top:0;">💰 قیمت فروش گروهی</h3>

        <p style="color:#666;font-size:13px;line-height:1.8;">
            با این ابزار می‌توانید قیمت فروش
            <strong>همه کالاهای انبار</strong>
            را یکجا افزایش (یا کاهش) دهید.
            <br>
            مثلاً عدد ۲۰ یعنی ۲۰٪ افزایش.
            <br>
            عدد منفی مثل ۱۰- یعنی ۱۰٪ کاهش.
        </p>

        <label>درصد تغییر قیمت فروش</label>

        <input
            id="settingSalePricePercent"
            type="number"
            inputmode="numeric"
            placeholder="مثلاً ۲۰"
            step="1"
        >

        <button
            class="primary-btn"
            style="width:100%;margin-top:10px;"
            onclick="applyBulkSalePriceChange()"
        >
            📈 اعمال روی همه کالاها
        </button>
    </div>


    <!-- =====================================================
         پشتیبان‌گیری و بازیابی
         ===================================================== -->

    <div class="card">
        <h3 style="margin-top:0;">💾 پشتیبان‌گیری و بازیابی</h3>

        <p style="color:#666;font-size:13px;line-height:1.8;">
            بکاپ کامل شامل همه داده‌هاست:
            مشتریان، دستگاه‌ها، تعمیرات، کالاها، فاکتورها،
            تراکنش‌ها و تنظیمات.
        </p>

        <button
            class="primary-btn"
            style="width:100%;margin-bottom:10px;"
            onclick="exportFullBackup()"
        >
            📤 دریافت بکاپ کامل (JSON)
        </button>

        <label>بازیابی از فایل بکاپ</label>

        <input
            id="backupFileInput"
            type="file"
            accept=".json,application/json"
            style="margin-bottom:10px;"
        >

        <button
            class="danger-btn"
            style="width:100%;"
            onclick="importFullBackup()"
        >
            📥 بازیابی بکاپ (جایگزینی داده‌ها)
        </button>
    </div>

    <div class="card">
    <h3 style="margin-top:0;">🔄 به‌روزرسانی برنامه</h3>
    <p style="color:#666;font-size:13px;line-height:1.8;">
        بعد از آپلود نسخه جدید روی GitHub، این دکمه را بزن
        تا برنامه کش قدیمی را کنار بگذارد و نسخه تازه را بگیرد.
    </p>
    <button class="primary-btn" style="width:100%;" onclick="checkForAppUpdate()">
        🔄 بررسی به‌روزرسانی
    </button>
    </div>

    <!-- =====================================================
         وضعیت سیستم
         ===================================================== -->

    <div class="card">
        <h3 style="margin-top:0;">وضعیت سیستم</h3>

        <p>
            💾 وضعیت دیتابیس:
            <span id="dbStatus">—</span>
        </p>

        <p>
            📁 نام دیتابیس:
            <span id="dbName">—</span>
        </p>

        <p>
            🔢 نسخه دیتابیس:
            <span id="dbVersion">—</span>
        </p>
    </div>
    `;


    // =====================================================
    // پر کردن وضعیت دیتابیس
    // =====================================================

    if(db){

        const st = document.getElementById("dbStatus");
        const nm = document.getElementById("dbName");
        const vr = document.getElementById("dbVersion");

        if(st){
            st.innerText = "فعال ✓";
            st.className = "db-ok";
        }

        if(nm){
            nm.innerText = db.name;
        }

        if(vr){
            vr.innerText = db.version;
        }
    }
}


async function saveBrandingSettings(){

    const name = String(
        document.getElementById("settingAppName")?.value || ""
    ).trim();

    const subtitle = String(
        document.getElementById("settingAppSubtitle")?.value || ""
    ).trim();


    if(!name){
        alert("نام برنامه نمی‌تواند خالی باشد.");
        return;
    }


    try{

        await setSetting("appName", name);

        await setSetting(
            "appSubtitle",
            subtitle || "سیستم مدیریت"
        );

        await applyAppBranding();

        alert("نام و عنوان برنامه ذخیره شد.");

    }catch(error){

        console.error(error);

        alert(
            error.message ||
            "ذخیره تنظیمات انجام نشد."
        );
    }
}


async function applyBulkSalePriceChange(){

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    const percent = Number(document.getElementById("settingSalePricePercent")?.value);

    if(!Number.isFinite(percent) || percent === 0){
        alert("لطفاً یک درصد معتبر وارد کنید.\nمثلاً ۲۰ برای افزایش یا 10- برای کاهش.");
        return;
    }

    const confirmed = confirm(
        "آیا مطمئن هستید؟\n\n" +
        "قیمت فروش همه کالاها به اندازه " + percent + "٪ تغییر می‌کند.\n" +
        "این عمل برگشت‌پذیر نیست مگر پشتیبان داشته باشید."
    );

    if(!confirmed) return;

    try{
        const products = await new Promise(function(resolve, reject){
            const tx = db.transaction("products", "readonly");
            const req = tx.objectStore("products").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ reject(new Error("دریافت کالاها انجام نشد.")); };
        });

        if(products.length === 0){
            alert("هیچ کالایی در انبار نیست.");
            return;
        }

        await new Promise(function(resolve, reject){
            const tx = db.transaction("products", "readwrite");
            const store = tx.objectStore("products");

            products.forEach(function(product){
                const oldPrice = Number(product.salePrice || 0);
                const newPrice = Math.round(oldPrice * (1 + percent / 100));
                product.salePrice = Math.max(0, newPrice);
                store.put(product);
            });

            tx.oncomplete = function(){ resolve(); };
            tx.onerror = function(){ reject(new Error("به‌روزرسانی قیمت‌ها انجام نشد.")); };
        });

        updateDashboard();
        if(typeof loadProducts === "function") loadProducts();

        alert(
            "قیمت فروش " + products.length.toLocaleString("fa-IR") +
            " کالا با موفقیت " + percent + "٪ تغییر کرد."
        );

        const input = document.getElementById("settingSalePricePercent");
        if(input) input.value = "";

    }catch(error){
        console.error(error);
        alert(error.message || "عملیات انجام نشد.");
    }
}


async function handleAppLogoSelection(event){

    const input = event?.target;

    if(!input || !input.files || !input.files[0]){
        return;
    }


    const file = input.files[0];


    // بررسی نوع فایل
    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];


    if(!allowedTypes.includes(file.type)){

        alert(
            "فرمت تصویر مجاز نیست.\n\n" +
            "لطفاً یک تصویر PNG، JPG یا WEBP انتخاب کنید."
        );

        input.value = "";

        return;
    }


    // محدودیت حجم
    // 5 مگابایت
    const maxSize = 5 * 1024 * 1024;


    if(file.size > maxSize){

        alert(
            "حجم تصویر زیاد است.\n\n" +
            "حداکثر حجم مجاز لوگو ۵ مگابایت است."
        );

        input.value = "";

        return;
    }


    try{

        const dataUrl = await readImageFileAsDataURL(file);


        if(!dataUrl){

            throw new Error(
                "خواندن تصویر انجام نشد."
            );
        }


        // ذخیره لوگو در تنظیمات
        await setSetting(
            "appLogo",
            dataUrl
        );
        await applyAppBranding();

        // نمایش پیش‌نمایش
        const previewContainer =
            document.getElementById(
                "appLogoPreviewContainer"
            );

        const preview =
            document.getElementById(
                "appLogoPreview"
            );

        const emptyMessage =
            document.getElementById(
                "appLogoEmptyMessage"
            );

        const removeButton =
            document.getElementById(
                "removeAppLogoButton"
            );


        if(preview){

            preview.src = dataUrl;

        }


        if(previewContainer){

            previewContainer.style.display = "flex";

        }


        if(emptyMessage){

            emptyMessage.style.display = "none";

        }


        if(removeButton){

            removeButton.style.display = "block";

        }


        // پاک کردن مقدار input
        input.value = "";


        alert(
            "لوگو با موفقیت ذخیره شد."
        );


    }catch(error){

        console.error(
            "خطا در ذخیره لوگو:",
            error
        );


        alert(
            error.message ||
            "ذخیره لوگو انجام نشد."
        );

    }

}


async function removeAppLogo(){

    const confirmed = confirm(
        "آیا مطمئن هستید که می‌خواهید لوگو حذف شود؟"
    );


    if(!confirmed){
        return;
    }


    try{

        // حذف لوگو از تنظیمات
        await setSetting(
            "appLogo",
            ""
        );


        // گرفتن عناصر صفحه
        const previewContainer =
            document.getElementById(
                "appLogoPreviewContainer"
            );

        const preview =
            document.getElementById(
                "appLogoPreview"
            );

        const emptyMessage =
            document.getElementById(
                "appLogoEmptyMessage"
            );

        const removeButton =
            document.getElementById(
                "removeAppLogoButton"
            );


        // مخفی کردن پیش‌نمایش
        if(previewContainer){

            previewContainer.style.display = "none";

        }


        // پاک کردن تصویر
        if(preview){

            preview.removeAttribute("src");

        }


        // نمایش پیام نبودن لوگو
        if(emptyMessage){

            emptyMessage.style.display = "block";

        }


        // مخفی کردن دکمه حذف
        if(removeButton){

            removeButton.style.display = "none";

        }


        alert(
            "لوگو با موفقیت حذف شد."
        );


    }catch(error){

        console.error(
            "خطا در حذف لوگو:",
            error
        );


        alert(
            error.message ||
            "حذف لوگو انجام نشد."
        );

    }

}


async function exportFullBackup(){

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    try{
        const storeNames = [
            "customers",
            "devices",
            "repairs",
            "products",
            "stockTransactions",
            "purchaseInvoices",
            "salesInvoices",
            "invoiceItems",
            "settings"
        ];

        const backup = {
            app: "PackageYar",
            version: 1,
            exportedAt: new Date().toISOString(),
            dbName: DB_NAME,
            dbVersion: DB_VERSION,
            data: {}
        };

        for(const storeName of storeNames){
            if(!db.objectStoreNames.contains(storeName)){
                backup.data[storeName] = [];
                continue;
            }

            const rows = await new Promise(function(resolve, reject){
                const tx = db.transaction(storeName, "readonly");
                const req = tx.objectStore(storeName).getAll();
                req.onsuccess = function(){ resolve(req.result || []); };
                req.onerror = function(){ reject(new Error("خواندن " + storeName + " انجام نشد.")); };
            });

            backup.data[storeName] = rows;
        }

        const json = JSON.stringify(backup, null, 2);
        const filename = "packageyar-backup-" + getTodayJalali().replace(/\//g, "-") + ".json";
        const blob = new Blob([json], { type: "application/json" });

        // ----- روش ۱: Web Share (بهترین برای آیفون) -----
        if(navigator.canShare && navigator.share){
            try{
                const file = new File([blob], filename, { type: "application/json" });
                if(navigator.canShare({ files: [file] })){
                    await navigator.share({
                        files: [file],
                        title: "بکاپ پکیج‌یار",
                        text: "فایل پشتیبان کامل"
                    });
                    alert("بکاپ از طریق Share ارسال/ذخیره شد.");
                    return;
                }
            }catch(shareError){
                // کاربر Share را لغو کرده یا پشتیبانی نیست → ادامه روش‌های بعدی
                if(shareError && shareError.name === "AbortError"){
                    return;
                }
            }
        }

        // ----- روش ۲: باز کردن در تب جدید (آیفون می‌تواند Share کند) -----
        const url = URL.createObjectURL(blob);

        // تلاش دانلود معمولی (روی کامپیوتر کار می‌کند)
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // روی iOS: صفحه راهنما با لینک باز کردن فایل
        setTimeout(function(){
            const openNow = confirm(
                "اگر فایل دانلود نشد (معمول در آیفون):\n\n" +
                "OK = باز کردن فایل در صفحه جدید\n" +
                "بعد از باز شدن، از دکمه Share استفاده کنید و Save to Files بزنید.\n\n" +
                "Cancel = انصراف"
            );

            if(openNow){
                window.open(url, "_blank");
            }

            // آزادسازی حافظه با تأخیر
            setTimeout(function(){
                URL.revokeObjectURL(url);
            }, 60000);
        }, 400);

    }catch(error){
        console.error(error);
        alert("ساخت بکاپ انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}


async function importFullBackup(){

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    const input = document.getElementById("backupFileInput");
    if(!input || !input.files || !input.files[0]){
        alert("لطفاً ابتدا فایل بکاپ JSON را انتخاب کنید.");
        return;
    }

    const confirmed = confirm(
        "هشدار مهم\n\n" +
        "با بازیابی بکاپ، داده‌های فعلی برنامه جایگزین می‌شوند.\n" +
        "این کار قابل برگشت نیست.\n\n" +
        "آیا ادامه می‌دهید؟"
    );
    if(!confirmed) return;

    try{
        const file = input.files[0];
        const text = await file.text();
        const backup = JSON.parse(text);

        if(!backup || !backup.data || typeof backup.data !== "object"){
            throw new Error("فایل بکاپ معتبر نیست.");
        }

        const storeNames = Object.keys(backup.data);

        // پاک‌سازی و نوشتن داخل یک تراکنش بزرگ
        await new Promise(function(resolve, reject){

            const existingStores = storeNames.filter(function(name){
                return db.objectStoreNames.contains(name);
            });

            if(existingStores.length === 0){
                reject(new Error("هیچ فروشگاه معتبری در دیتابیس نیست."));
                return;
            }

            const tx = db.transaction(existingStores, "readwrite");

            existingStores.forEach(function(storeName){
                const store = tx.objectStore(storeName);
                store.clear();

                const rows = Array.isArray(backup.data[storeName])
                    ? backup.data[storeName]
                    : [];

                rows.forEach(function(row){
                    try{
                        store.put(row);
                    }catch(e){
                        // اگر put با کلید مشکل داشت، add را امتحان نکن — فقط رد شو
                        console.warn("رد شد:", storeName, row, e);
                    }
                });
            });

            tx.oncomplete = function(){ resolve(); };
            tx.onerror = function(){ reject(new Error("بازیابی دیتابیس انجام نشد.")); };
            tx.onabort = function(){ reject(new Error("بازیابی لغو شد.")); };
        });

        await applyAppBranding();
        updateDashboard();

        alert(
            "بازیابی بکاپ با موفقیت انجام شد.\n\n" +
            "برای اطمینان یک‌بار صفحه را رفرش کنید."
        );

        input.value = "";

    }catch(error){
        console.error(error);
        alert("بازیابی انجام نشد.\n\n" + (error.message || "فایل نامعتبر است."));
    }
}


async function exportCSV(type){

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    try{
        const today = getTodayJalali().replace(/\//g, "-");
        let rows = [];
        let filename = "";

        if(type === "customers"){
            const data = await getAllFromStore("customers");
            filename = "customers-" + today + ".csv";
            rows.push(["شناسه", "نام", "موبایل", "آدرس", "توضیحات", "تاریخ ثبت"]);
            data.forEach(function(c){
                rows.push([
                    c.id,
                    c.name || "",
                    c.phone || "",
                    c.address || "",
                    c.note || "",
                    c.createdDate || ""
                ]);
            });
        }

        else if(type === "products"){
            const data = await getAllFromStore("products");
            filename = "products-" + today + ".csv";
            rows.push(["شناسه", "نام", "کد", "دسته‌بندی", "واحد", "موجودی", "حداقل موجودی", "قیمت خرید", "قیمت فروش", "توضیحات"]);
            data.forEach(function(p){
                rows.push([
                    p.id,
                    p.name || "",
                    p.code || "",
                    p.category || "",
                    p.unit || "",
                    p.stock || 0,
                    p.minStock || 0,
                    p.purchasePrice || 0,
                    p.salePrice || 0,
                    p.note || ""
                ]);
            });
        }
        else if(type === "repairs"){
            const data = await getAllFromStore("repairs");
            filename = "repairs-" + today + ".csv";
            rows.push(["شناسه", "مشتری", "دستگاه", "تاریخ", "نوع", "ایراد", "اقدامات", "هزینه قطعات", "اجرت", "مبلغ کل", "پرداخت‌شده", "وضعیت پرداخت", "توضیحات"]);
            data.forEach(function(r){
                const partsText = Array.isArray(r.repairParts)
                    ? r.repairParts.map(function(p){
                        return (p.productName || "") + "×" + (p.quantity || 0);
                    }).join(" | ")
                    : (r.parts || "");

                rows.push([
                    r.id,
                    r.customerId || "",
                    r.deviceId || "",
                    r.date || "",
                    r.type || "",
                    r.problem || "",
                    r.action || "",
                    r.partsCost || 0,
                    r.laborCost || 0,
                    r.totalCost || 0,
                    r.paidAmount || 0,
                    r.paymentStatus || "",
                    (r.note || "") + (partsText ? " | قطعات: " + partsText : "")
                ]);
            });
        }

        else if(type === "purchaseInvoices"){
            const data = await getAllFromStore("purchaseInvoices");
            filename = "purchase-invoices-" + today + ".csv";
            rows.push(["شناسه", "شماره داخلی", "شماره فاکتور", "تاریخ", "تأمین‌کننده", "تلفن", "مبلغ کل", "تعداد اقلام", "توضیحات"]);
            data.forEach(function(inv){
                rows.push([
                    inv.id,
                    inv.internalNumber || "",
                    inv.invoiceNumber || "",
                    inv.date || "",
                    inv.supplierName || "",
                    inv.supplierPhone || "",
                    inv.totalAmount || 0,
                    inv.itemCount || 0,
                    inv.note || ""
                ]);
            });
        }

        else if(type === "salesInvoices"){
            const data = await getAllFromStore("salesInvoices");
            filename = "sales-invoices-" + today + ".csv";
            rows.push(["شناسه", "شماره داخلی", "تاریخ", "مشتری", "مبلغ کالاها", "اجرت", "مبلغ کل", "پرداخت‌شده", "وضعیت پرداخت", "تعداد اقلام", "توضیحات"]);
            data.forEach(function(inv){
                rows.push([
                    inv.id,
                    inv.internalNumber || "",
                    inv.date || "",
                    inv.customerName || "",
                    inv.itemsTotal || 0,
                    inv.laborCost || 0,
                    inv.totalAmount || 0,
                    inv.paidAmount || 0,
                    inv.paymentStatus || "",
                    inv.itemCount || 0,
                    inv.note || ""
                ]);
            });
        }
        else if(type === "stockTransactions"){
            const data = await getAllFromStore("stockTransactions");
            filename = "stock-transactions-" + today + ".csv";
            rows.push(["شناسه", "کالا", "نام کالا", "نوع", "تعداد", "دلیل", "توضیح", "تاریخ", "ساعت", "موجودی قبل", "موجودی بعد", "تعمیر"]);
            data.forEach(function(t){
                rows.push([
                    t.id || "",
                    t.productId || "",
                    t.productName || "",
                    t.type || "",
                    t.quantity || 0,
                    t.reason || "",
                    t.note || "",
                    t.date || "",
                    t.time || "",
                    t.stockBefore || 0,
                    t.stockAfter || 0,
                    t.repairId || ""
                ]);
            });
        }

        else{
            alert("نوع خروجی نامعتبر است.");
            return;
        }

        if(rows.length <= 1){
            alert("داده‌ای برای خروجی وجود ندارد.");
            return;
        }

        downloadCSV(filename, rows);
        alert("فایل CSV آماده شد.\nتعداد ردیف: " + (rows.length - 1).toLocaleString("fa-IR"));

    }catch(error){
        console.error(error);
        alert("خروجی CSV انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}


async function checkForAppUpdate(){

    if(!("serviceWorker" in navigator)){
        alert("این مرورگر از Service Worker پشتیبانی نمی‌کند.");
        return;
    }

    try{
        const registration = await navigator.serviceWorker.getRegistration();

        if(!registration){
            alert(
                "Service Worker ثبت نشده است.\n" +
                "یک‌بار صفحه را کامل رفرش کن و دوباره تلاش کن."
            );
            return;
        }

        await registration.update();

        if(registration.waiting){
            const ok = confirm(
                "نسخه جدید آماده است.\n\n" +
                "برای اعمال به‌روزرسانی، برنامه یک‌بار بسته و دوباره باز می‌شود.\n\n" +
                "ادامه می‌دهی؟"
            );

            if(ok){
                registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
            return;
        }

        if(registration.installing){
            alert("در حال دریافت نسخه جدید...\nچند لحظه دیگر دوباره همین دکمه را بزن.");
            return;
        }

        alert(
            "در حال حاضر از آخرین نسخه‌ای که این مرورگر گرفته استفاده می‌کنی.\n\n" +
            "اگر تازه روی GitHub آپلود کرده‌ای، چند ثانیه صبر کن و دوباره بزن."
        );

    }catch(error){
        console.error(error);
        alert("بررسی به‌روزرسانی انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}
