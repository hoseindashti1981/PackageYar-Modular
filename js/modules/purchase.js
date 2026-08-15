async function openPurchaseInvoiceForm(){

    if(!db){
        alert("دیتابیس هنوز آماده نیست.");
        return;
    }

    // همیشه برای فاکتور جدید، حالت ویرایش را پاک کن
     editingPurchaseInvoiceId = null;
     currentPurchaseInvoiceItems = [];

    try{
        const products = await getAllProductsForPurchase();
        renderPurchaseInvoiceForm(products);
    }catch(error){
        console.error(error);
        alert(error.message || "خطا در باز کردن فرم فاکتور خرید.");
    }
}


function renderPurchaseInvoiceForm(
    products
){

    const inventoryPage =
        document.getElementById(
            "inventoryPage"
        );


    if(!inventoryPage){

        return;

    }


    /* ========================================================
       تشخیص حالت فرم

       اگر editingPurchaseInvoiceId مقدار داشته باشد
       یعنی در حال ویرایش یک فاکتور قبلی هستیم.

       اگر null باشد
       یعنی فاکتور جدید ایجاد می‌کنیم.
       ======================================================== */

    const isEditing =
        editingPurchaseInvoiceId !== null &&
        editingPurchaseInvoiceId !== undefined;


    /* ========================================================
       عنوان فرم
       ======================================================== */

    const formTitle =
        isEditing
        ?
        "✏️ ویرایش فاکتور خرید"
        :
        "🧾 فاکتور خرید";


    /* ========================================================
       متن دکمه ثبت
       ======================================================== */

    const submitButtonText =
        isEditing
        ?
        "💾 ذخیره تغییرات فاکتور"
        :
        "💾 ثبت نهایی فاکتور خرید";


    /* ========================================================
       تابعی که با کلیک دکمه اجرا می‌شود

       فاکتور جدید:
       savePurchaseInvoice()

       فاکتور موجود:
       updatePurchaseInvoice()
       ======================================================== */

    const submitFunction =
        isEditing
        ?
        "updatePurchaseInvoice()"
        :
        "savePurchaseInvoice()";


   
    /* ========================================================
       تاریخ امروز

       فقط برای فاکتور جدید استفاده می‌شود.

       در حالت ویرایش،
       تابع editPurchaseInvoice()
       تاریخ واقعی فاکتور قبلی را بعداً داخل فرم قرار می‌دهد.
       ======================================================== */

    const today =
        new Date()
        .toLocaleDateString(
            "fa-IR"
        );


    /* ========================================================
       ساخت فرم
       ======================================================== */

    inventoryPage.innerHTML = `

    <div
    class="back-btn"
    onclick="returnToInventoryList()">

    ← بازگشت به انبار

    </div>


    <div class="section-title">

    ${formTitle}

    </div>


    <div class="card">


        <!-- ================================================
             شماره فاکتور تأمین‌کننده
             ================================================ -->

        <div class="form-group">

            <label>

            شماره فاکتور تأمین‌کننده

            <span
            style="
            font-size:11px;
            color:#777;
            ">

            (اختیاری)

            </span>

            </label>


            <input
            type="text"
            id="purchaseInvoiceNumber"
            placeholder="شماره درج‌شده روی فاکتور تأمین‌کننده">

        </div>


        <!-- ================================================
             تاریخ فاکتور
             ================================================ -->

        <div class="form-group">

            <label>

            تاریخ فاکتور

            </label>


            <input
            type="text"
            id="purchaseInvoiceDate"
            value="${today}"
            readonly>

        </div>


        <!-- ================================================
             نام تأمین‌کننده
             ================================================ -->

        <div class="form-group">

            <label>

            نام تأمین‌کننده

            </label>


            <input
            type="text"
            id="purchaseSupplierName"
            placeholder="نام تأمین‌کننده">

        </div>


        <!-- ================================================
             شماره تماس تأمین‌کننده
             ================================================ -->

        <div class="form-group">

            <label>

            شماره تماس تأمین‌کننده

            </label>


            <input
            type="tel"
            id="purchaseSupplierPhone"
            placeholder="شماره تماس">

        </div>


        <!-- ================================================
             افزودن کالا
             ================================================ -->

        <div
        class="section-title"
        style="
        margin-top:20px;
        ">

        ➕ افزودن کالا به فاکتور

        </div>


                <div class="form-group">

            <label>

            کالا

            </label>

            <input type="hidden" id="purchaseProductId">
            <input type="hidden" id="purchaseProductName">
            <button type="button" id="purchaseProductPickerBtn" class="secondary-btn" style="width:100%;text-align:right;">
                انتخاب کالا...
            </button>

        </div>


        <div class="form-group">

            <label>

            تعداد

            </label>


            <input
            type="number"
            id="purchaseProductQuantity"
            min="1"
            step="1"
            inputmode="numeric"
            placeholder="تعداد">

        </div>


        <div class="form-group">

            <label>

            قیمت خرید واحد

            </label>


            <input
            type="number"
            id="purchaseProductUnitPrice"
            min="0"
            step="1"
            inputmode="numeric"
            placeholder="قیمت خرید">

        </div>


        <button
        class="primary-btn"
        style="
        width:100%;
        margin-top:10px;
        "
        onclick="addPurchaseInvoiceItem()">

        ➕ افزودن کالا به فاکتور

        </button>


    </div>


    <!-- ================================================
         لیست اقلام فاکتور
         ================================================ -->

    <div class="section-title">

    📦 اقلام فاکتور

    </div>


    <div
    id="purchaseInvoiceItemsContainer">

    </div>


    <!-- ================================================
         توضیحات و ثبت نهایی
         ================================================ -->

    <div class="card">


        <div
        class="form-group">

            <label>

            توضیحات

            </label>


            <textarea
            id="purchaseInvoiceNote"
            placeholder="توضیحات فاکتور"></textarea>

        </div>


        <!-- ================================================
             مبلغ کل
             ================================================ -->

        <div
        id="purchaseInvoiceTotal"
        class="info-box"
        style="
        margin-bottom:15px;
        ">

        مبلغ کل: ۰ تومان

        </div>


        <!-- ================================================
             دکمه ثبت / ویرایش هوشمند
             ================================================ -->

        <button
        class="primary-btn"
        style="
        width:100%;
        "
        onclick="${submitFunction}">

        ${submitButtonText}

        </button>


    </div>

    `;


    /* ========================================================
       نمایش اقلام موجود در حافظه

       در فاکتور جدید:
       لیست خالی است.

       در حالت ویرایش:
       editPurchaseInvoice()
       قبلاً اقلام فاکتور را داخل
       currentPurchaseInvoiceItems
       قرار داده است.

       بنابراین همین تابع باعث می‌شود
       کالاهای قبلی دوباره نمایش داده شوند.
       ======================================================== */

        renderPurchaseInvoiceItems();

    const purchasePickerBtn = document.getElementById("purchaseProductPickerBtn");
    if(purchasePickerBtn){
        purchasePickerBtn.onclick = function(){
            openProductPicker({
                title: "انتخاب کالا برای خرید",
                priceField: "purchasePrice",
                onSelect: function(product){
                    document.getElementById("purchaseProductId").value = product.id;
                    document.getElementById("purchaseProductName").value = product.name || "بدون نام";
                    purchasePickerBtn.textContent = "📦 " + (product.name || "بدون نام");
                    const priceInput = document.getElementById("purchaseProductUnitPrice");
                    if(priceInput) priceInput.value = Number(product.purchasePrice || 0);
                }
            });
        };
    }

}


async function savePurchaseInvoice(){

    if(!Array.isArray(currentPurchaseInvoiceItems) || currentPurchaseInvoiceItems.length === 0){
        alert("حداقل یک کالا باید به فاکتور اضافه شود.");
        return;
    }

    if(!db){
        alert("دیتابیس هنوز آماده نیست.");
        return;
    }

    const invoiceNumber = String(document.getElementById("purchaseInvoiceNumber")?.value || "").trim();
    const invoiceDate = document.getElementById("purchaseInvoiceDate")?.value || "";
    const supplierName = String(document.getElementById("purchaseSupplierName")?.value || "").trim();
    const supplierPhone = String(document.getElementById("purchaseSupplierPhone")?.value || "").trim();
    const note = String(document.getElementById("purchaseInvoiceNote")?.value || "").trim();

    if(!invoiceDate){
        alert("تاریخ فاکتور مشخص نیست.");
        return;
    }

    // اعتبارسنجی اقلام
    for(const item of currentPurchaseInvoiceItems){
        if(!Number.isInteger(Number(item.productId)) || Number(item.productId) <= 0){
            alert("شناسه یکی از کالاها نامعتبر است.");
            return;
        }
        if(!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0){
            alert("تعداد کالای «" + (item.productName || "") + "» نامعتبر است.");
            return;
        }
        if(!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0){
            alert("قیمت خرید کالای «" + (item.productName || "") + "» نامعتبر است.");
            return;
        }
    }

    const confirmed = confirm(
        "آیا فاکتور خرید ثبت شود؟\n\n" +
        "پس از ثبت، موجودی تمام کالاهای این فاکتور افزایش پیدا می‌کند."
    );
    if(!confirmed) return;

    try{
        const products = await getAllProductsForPurchase();
        const productMap = new Map();
        products.forEach(function(p){
            productMap.set(Number(p.id), p);
        });

        for(const item of currentPurchaseInvoiceItems){
            if(!productMap.has(Number(item.productId))){
                throw new Error("کالای «" + (item.productName || "نامشخص") + "» در انبار پیدا نشد.");
            }
        }

        let totalAmount = 0;
        currentPurchaseInvoiceItems.forEach(function(item){
            item.total = Number(item.quantity) * Number(item.unitPrice);
            totalAmount += item.total;
        });

        const now = new Date();
        const invoiceId = Date.now();

        // ---------- تراکنش واحد ----------
        await new Promise(function(resolve, reject){

            const transaction = db.transaction(
                ["purchaseInvoices", "invoiceItems", "products", "stockTransactions"],
                "readwrite"
            );

            const purchaseInvoicesStore = transaction.objectStore("purchaseInvoices");
            const invoiceItemsStore = transaction.objectStore("invoiceItems");
            const productsStore = transaction.objectStore("products");
            const stockStore = transaction.objectStore("stockTransactions");

            // ثبت فاکتور
            purchaseInvoicesStore.add({
                id: invoiceId,
                internalNumber: "PR-" + invoiceId,
                invoiceNumber: invoiceNumber,
                date: invoiceDate,
                supplierName: supplierName,
                supplierPhone: supplierPhone,
                note: note,
                totalAmount: totalAmount,
                itemCount: currentPurchaseInvoiceItems.length,
                createdAt: now.toISOString(),
                status: "COMPLETED"
            });

            let pending = currentPurchaseInvoiceItems.length;
            if(pending === 0){
                // نباید رخ دهد
            }

            let hasError = false;

            currentPurchaseInvoiceItems.forEach(function(item){

                if(hasError) return;

                const productId = Number(item.productId);
                const qty = Number(item.quantity);
                const unitPrice = Number(item.unitPrice);

                // ثبت قلم فاکتور
                invoiceItemsStore.add({
                    invoiceId: invoiceId,
                    productId: productId,
                    productName: item.productName,
                    quantity: qty,
                    purchasePrice: unitPrice,
                    unitPrice: unitPrice,
                    total: qty * unitPrice,
                    date: invoiceDate,
                    createdAt: now.toISOString()
                });

                // دریافت کالا و افزایش موجودی + میانگین قیمت
                const getReq = productsStore.get(productId);

                getReq.onsuccess = function(){
                    if(hasError) return;

                    const product = getReq.result;
                    if(!product){
                        hasError = true;
                        reject(new Error("کالای «" + item.productName + "» پیدا نشد."));
                        try{ transaction.abort(); }catch(e){}
                        return;
                    }

                    const stockBefore = Number(product.stock || 0);
                    const stockAfter = stockBefore + qty;

                    // میانگین وزنی قیمت خرید
                    const oldPrice = Number(product.purchasePrice || 0);
                    if(stockBefore <= 0){
                        product.purchasePrice = unitPrice;
                    }else{
                        const totalValue = (stockBefore * oldPrice) + (qty * unitPrice);
                        product.purchasePrice = Math.round(totalValue / stockAfter);
                    }

                    product.stock = stockAfter;

                    const putReq = productsStore.put(product);

                    putReq.onsuccess = function(){
                        // ثبت تراکنش انبار
                        stockStore.add({
                            productId: productId,
                            productName: product.name || item.productName || "نامشخص",
                            type: "IN",
                            quantity: qty,
                            reason: "خرید از تأمین‌کننده",
                            note: "فاکتور خرید شماره " + (invoiceNumber || invoiceId),
                            date: now.toLocaleDateString("fa-IR"),
                            time: now.toLocaleTimeString("fa-IR", {hour:"2-digit", minute:"2-digit"}),
                            createdAt: now.toISOString(),
                            stockBefore: stockBefore,
                            stockAfter: stockAfter
                        });

                        pending--;
                    };

                    putReq.onerror = function(){
                        hasError = true;
                        reject(new Error("به‌روزرسانی موجودی انجام نشد."));
                        try{ transaction.abort(); }catch(e){}
                    };
                };

                getReq.onerror = function(){
                    hasError = true;
                    reject(new Error("دریافت کالا انجام نشد."));
                    try{ transaction.abort(); }catch(e){}
                };
            });

            transaction.oncomplete = function(){
                resolve();
            };

            transaction.onerror = function(){
                reject(new Error("ثبت فاکتور خرید انجام نشد."));
            };

            transaction.onabort = function(){
                reject(new Error("ثبت فاکتور لغو شد."));
            };
        });

        // موفقیت
        currentPurchaseInvoiceItems = [];
        editingPurchaseInvoiceId = null;

        alert("فاکتور خرید با موفقیت ثبت شد.\n\nموجودی و قیمت خرید میانگین به‌روزرسانی شد.");

        returnToInventoryList();

    }catch(error){
        console.error("خطا در ثبت فاکتور خرید:", error);
        alert("ثبت فاکتور خرید انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}


async function updatePurchaseInvoice(){

    if(!editingPurchaseInvoiceId){
        alert("فاکتوری برای ویرایش انتخاب نشده است.");
        return;
    }

    if(!Array.isArray(currentPurchaseInvoiceItems) || currentPurchaseInvoiceItems.length === 0){
        alert("حداقل یک کالا باید در فاکتور باشد.");
        return;
    }

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    const invoiceId = Number(editingPurchaseInvoiceId);

    const invoiceNumber = String(document.getElementById("purchaseInvoiceNumber")?.value || "").trim();
    const invoiceDate = document.getElementById("purchaseInvoiceDate")?.value || "";
    const supplierName = String(document.getElementById("purchaseSupplierName")?.value || "").trim();
    const supplierPhone = String(document.getElementById("purchaseSupplierPhone")?.value || "").trim();
    const note = String(document.getElementById("purchaseInvoiceNote")?.value || "").trim();

    if(!invoiceDate){
        alert("تاریخ فاکتور مشخص نیست.");
        return;
    }

    // اعتبارسنجی اقلام
    for(const item of currentPurchaseInvoiceItems){
        if(!Number.isInteger(Number(item.productId)) || Number(item.productId) <= 0){
            alert("شناسه یکی از کالاها نامعتبر است.");
            return;
        }
        if(!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0){
            alert("تعداد کالای «" + (item.productName || "") + "» نامعتبر است.");
            return;
        }
        if(!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0){
            alert("قیمت خرید کالای «" + (item.productName || "") + "» نامعتبر است.");
            return;
        }
    }

    const confirmed = confirm(
        "آیا تغییرات فاکتور خرید ذخیره شود؟\n\n" +
        "موجودی انبار بر اساس اختلاف فاکتور قبلی و جدید اصلاح می‌شود."
    );
    if(!confirmed) return;

    try{
        // فاکتور قبلی
        const oldInvoice = await new Promise(function(resolve, reject){
            const tx = db.transaction(["purchaseInvoices"], "readonly");
            const req = tx.objectStore("purchaseInvoices").get(invoiceId);
            req.onsuccess = function(){ resolve(req.result || null); };
            req.onerror = function(){ reject(new Error("دریافت فاکتور قبلی انجام نشد.")); };
        });

        if(!oldInvoice) throw new Error("فاکتور پیدا نشد.");

        // اقلام قبلی
        const oldItems = await new Promise(function(resolve, reject){
            const tx = db.transaction(["invoiceItems"], "readonly");
            const req = tx.objectStore("invoiceItems").getAll();
            req.onsuccess = function(){
                resolve((req.result || []).filter(function(item){
                    return Number(item.invoiceId) === invoiceId;
                }));
            };
            req.onerror = function(){ reject(new Error("دریافت اقلام قبلی انجام نشد.")); };
        });

        // Map قبلی و جدید
        const oldMap = new Map();
        oldItems.forEach(function(item){
            const pid = Number(item.productId);
            const qty = Number(item.quantity) || 0;
            if(oldMap.has(pid)){
                oldMap.get(pid).quantity += qty;
            }else{
                oldMap.set(pid, {
                    quantity: qty,
                    productName: item.productName || ""
                });
            }
        });

        const newMap = new Map();
        currentPurchaseInvoiceItems.forEach(function(item){
            const pid = Number(item.productId);
            const qty = Number(item.quantity) || 0;
            if(newMap.has(pid)){
                newMap.get(pid).quantity += qty;
            }else{
                newMap.set(pid, {
                    quantity: qty,
                    productName: item.productName || "",
                    unitPrice: Number(item.unitPrice) || 0
                });
            }
        });

        // اختلاف‌ها
        const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);
        const differences = [];

       allIds.forEach(function(pid){
            const oldQty = oldMap.has(pid) ? oldMap.get(pid).quantity : 0;
            const newQty = newMap.has(pid) ? newMap.get(pid).quantity : 0;
            const diff = newQty - oldQty;
            if(diff !== 0){
                differences.push({
                    productId: pid,
                    difference: diff,
                    productName: (newMap.get(pid)?.productName) || (oldMap.get(pid)?.productName) || "نامشخص"
                });
            }
        });

        // بررسی موجودی برای کاهش‌ها
        const products = await getAllProductsForPurchase();
        const productMap = new Map();
        products.forEach(function(p){ productMap.set(Number(p.id), p); });

        for(const d of differences){
            if(!productMap.has(d.productId)){
                throw new Error("کالای «" + d.productName + "» در انبار پیدا نشد.");
            }
            if(d.difference < 0){
                const stock = Number(productMap.get(d.productId).stock || 0);
                if(stock < Math.abs(d.difference)){
                    throw new Error(
                        "موجودی «" + d.productName + "» برای اصلاح کافی نیست.\n" +
                        "موجودی: " + stock + " | نیاز به کاهش: " + Math.abs(d.difference)
                    );
                }
            }
        }

        // مبلغ جدید
        let totalAmount = 0;
        currentPurchaseInvoiceItems.forEach(function(item){
            item.total = Number(item.quantity) * Number(item.unitPrice);
            totalAmount += item.total;
        });

        const now = new Date();

        // تراکنش اتمیک
        await new Promise(function(resolve, reject){

            const transaction = db.transaction(
                ["purchaseInvoices", "invoiceItems", "products", "stockTransactions"],
                "readwrite"
            );

            const purchaseStore = transaction.objectStore("purchaseInvoices");
            const itemsStore = transaction.objectStore("invoiceItems");
            const productsStore = transaction.objectStore("products");
            const stockStore = transaction.objectStore("stockTransactions");

            // به‌روزرسانی فاکتور
            const updated = Object.assign({}, oldInvoice, {
                invoiceNumber: invoiceNumber,
                date: invoiceDate,
                supplierName: supplierName,
                supplierPhone: supplierPhone,
                note: note,
                totalAmount: totalAmount,
                itemCount: currentPurchaseInvoiceItems.length,
                updatedAt: now.toISOString(),
                status: "COMPLETED"
            });
            purchaseStore.put(updated);

            // حذف اقلام قبلی
            oldItems.forEach(function(item){
                if(item.id !== undefined){
                    itemsStore.delete(item.id);
                }
            });

            // ثبت اقلام جدید
            currentPurchaseInvoiceItems.forEach(function(item){
                itemsStore.add({
                    invoiceId: invoiceId,
                    productId: Number(item.productId),
                    productName: item.productName,
                    quantity: Number(item.quantity),
                    purchasePrice: Number(item.unitPrice),
                    unitPrice: Number(item.unitPrice),
                    total: Number(item.quantity) * Number(item.unitPrice),
                    date: invoiceDate,
                    createdAt: now.toISOString()
                });
            });

            // اعمال اختلاف موجودی (بدون await وسط تراکنش)
            let pending = differences.length;
            let hasError = false;

            if(pending === 0){
                // فقط اطلاعات فاکتور عوض شده
            }

            differences.forEach(function(d){
                if(hasError) return;

                const productId = d.productId;
                const qty = Math.abs(d.difference);
                const type = d.difference > 0 ? "IN" : "OUT";

                const getReq = productsStore.get(productId);

                getReq.onsuccess = function(){
                    if(hasError) return;
                    const product = getReq.result;
                    if(!product){
                        hasError = true;
                        reject(new Error("کالا پیدا نشد."));
                        try{ transaction.abort(); }catch(e){}
                        return;
                    }

                    const stockBefore = Number(product.stock || 0);
                    const stockAfter = type === "IN" ? stockBefore + qty : stockBefore - qty;

                    if(stockAfter < 0){
                        hasError = true;
                        reject(new Error("موجودی «" + product.name + "» کافی نیست."));
                        try{ transaction.abort(); }catch(e){}
                        return;
                    }

                    product.stock = stockAfter;
                    const putReq = productsStore.put(product);

                    putReq.onsuccess = function(){
                        stockStore.add({
                            productId: productId,
                            productName: product.name || d.productName,
                            type: type,
                            quantity: qty,
                            reason: "اصلاح فاکتور خرید",
                            note: "ویرایش فاکتور " + (oldInvoice.internalNumber || invoiceId),
                            date: now.toLocaleDateString("fa-IR"),
                            time: now.toLocaleTimeString("fa-IR", {hour:"2-digit", minute:"2-digit"}),
                            createdAt: now.toISOString(),
                            stockBefore: stockBefore,
                            stockAfter: stockAfter
                        });
                    };

                    putReq.onerror = function(){
                        hasError = true;
                        reject(new Error("به‌روزرسانی موجودی انجام نشد."));
                        try{ transaction.abort(); }catch(e){}
                    };
                };

                getReq.onerror = function(){
                    hasError = true;
                    reject(new Error("دریافت کالا انجام نشد."));
                    try{ transaction.abort(); }catch(e){}
                };
            });

            transaction.oncomplete = function(){ resolve(); };
            transaction.onerror = function(){ reject(new Error("ویرایش فاکتور انجام نشد.")); };
            transaction.onabort = function(){ reject(new Error("ویرایش لغو شد.")); };
        });

        // موفقیت
        currentPurchaseInvoiceItems = [];
        editingPurchaseInvoiceId = null;

        alert("فاکتور خرید با موفقیت ویرایش شد.");

        if(typeof renderPurchaseInvoiceList === "function"){
            renderPurchaseInvoiceList();
        }else{
            returnToInventoryList();
        }

    }catch(error){
        console.error(error);
        alert("ویرایش فاکتور خرید انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}


async function deletePurchaseInvoice(
    invoiceId
){

    /*
       --------------------------------------------------------
       بررسی دیتابیس
       --------------------------------------------------------
    */

    if(!db){

        alert(
            "دیتابیس هنوز آماده نیست."
        );

        return;

    }


    /*
       --------------------------------------------------------
       تبدیل شناسه به عدد
       --------------------------------------------------------
    */

    const numericInvoiceId =
        Number(
            invoiceId
        );


    if(
        !Number.isInteger(
            numericInvoiceId
        )
    ){

        alert(
            "شناسه فاکتور نامعتبر است."
        );

        return;

    }


    try{


        /*
           ====================================================
           مرحله ۱
           دریافت اطلاعات فاکتور
           ====================================================
        */

        const invoice =
            await new Promise(

                function(resolve,reject){

                    const transaction =
                        db.transaction(
                            [
                                "purchaseInvoices"
                            ],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "purchaseInvoices"
                        );


                    const request =
                        store.get(
                            numericInvoiceId
                        );


                    request.onsuccess =
                        function(){

                            resolve(
                                request.result ||
                                null
                            );

                        };


                    request.onerror =
                        function(){

                            reject(

                                new Error(

                                    "دریافت اطلاعات فاکتور انجام نشد."

                                )

                            );

                        };

                }

            );


        /*
           ----------------------------------------------------
           بررسی وجود فاکتور
           ----------------------------------------------------
        */

        if(!invoice){

            alert(
                "فاکتور موردنظر پیدا نشد."
            );

            return;

        }


        /*
           ====================================================
           مرحله ۲
           دریافت اقلام فاکتور
           ====================================================
        */

        const invoiceItems =
            await new Promise(

                function(resolve,reject){

                    const transaction =
                        db.transaction(
                            [
                                "invoiceItems"
                            ],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "invoiceItems"
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        function(){

                            const items =

                                (
                                    request.result ||
                                    []
                                )
                                .filter(

                                    function(item){

                                        return (

                                            Number(
                                                item.invoiceId
                                            )
                                            ===
                                            numericInvoiceId

                                        );

                                    }

                                );


                            resolve(
                                items
                            );

                        };


                    request.onerror =
                        function(){

                            reject(

                                new Error(

                                    "دریافت اقلام فاکتور انجام نشد."

                                )

                            );

                        };

                }

            );


        /*
           ----------------------------------------------------
           اگر فاکتور هیچ قلمی نداشته باشد
           ----------------------------------------------------
        */

        if(
            invoiceItems.length === 0
        ){

            const confirmed =
                confirm(

                    "این فاکتور هیچ قلم کالایی ندارد.\n\n" +

                    "آیا فاکتور حذف شود؟"

                );


            if(!confirmed){

                return;

            }

        }else{


            /*
               ------------------------------------------------
               تأیید حذف
               ------------------------------------------------
            */

            const confirmed =
                confirm(

                    "آیا از حذف این فاکتور خرید مطمئن هستید؟\n\n" +

                    "شماره داخلی:\n" +

                    (
                        invoice.internalNumber ||
                        "بدون شماره داخلی"
                    )

                    +

                    "\n\n" +

                    "با حذف فاکتور، مقدار کالاهای این فاکتور " +

                    "از موجودی انبار کسر خواهد شد."

                );


            if(!confirmed){

                return;

            }

        }


        /*
           ====================================================
           مرحله ۳
           ساخت تراکنش اصلی IndexedDB

           تمام عملیات زیر در همین تراکنش انجام می‌شود.
           ====================================================
        */

        const transaction =
            db.transaction(

                [

                    "purchaseInvoices",

                    "invoiceItems",

                    "products",

                    "stockTransactions"

                ],

                "readwrite"

            );


        const purchaseInvoicesStore =
            transaction.objectStore(
                "purchaseInvoices"
            );


        const invoiceItemsStore =
            transaction.objectStore(
                "invoiceItems"
            );


        const productsStore =
            transaction.objectStore(
                "products"
            );


        const stockTransactionsStore =
            transaction.objectStore(
                "stockTransactions"
            );


        /*
           ====================================================
           مرحله ۴
           دریافت تمام کالاهای موردنیاز

           ابتدا بررسی می‌کنیم که موجودی فعلی
           برای برگشت خرید کافی باشد.
           ====================================================
        */

        const productsMap =
            new Map();


        for(
            const item
            of invoiceItems
        ){

            const productId =
                Number(
                    item.productId
                );


            /*
               جلوگیری از دریافت تکراری
               برای کالاهای تکراری در یک فاکتور
            */

            if(
                productsMap.has(
                    productId
                )
            ){

                continue;

            }


            const product =
                await new Promise(

                    function(resolve,reject){

                        const request =
                            productsStore.get(
                                productId
                            );


                        request.onsuccess =
                            function(){

                                resolve(
                                    request.result ||
                                    null
                                );

                            };


                        request.onerror =
                            function(){

                                reject(

                                    new Error(

                                        "دریافت اطلاعات کالا انجام نشد."

                                    )

                                );

                            };

                    }

                );


            if(!product){

                throw new Error(

                    "کالای «" +

                    (
                        item.productName ||
                        "نامشخص"
                    )

                    +

                    "» دیگر در انبار وجود ندارد."

                );

            }


            productsMap.set(

                productId,

                {

                    product:
                        product,

                    quantityToReturn:
                        0

                }

            );

        }


        /*
           ====================================================
           مرحله ۵
           محاسبه مقدار برگشت برای هر کالا

           اگر یک کالا چند بار در فاکتور آمده باشد،
           مقدار همه آنها با هم جمع می‌شود.
           ====================================================
        */

        invoiceItems
        .forEach(

            function(item){

                const productId =
                    Number(
                        item.productId
                    );


                const quantity =
                    Number(
                        item.quantity
                    );


                if(
                    !Number.isFinite(
                        quantity
                    )
                    ||
                    quantity <= 0
                ){

                    throw new Error(

                        "مقدار یکی از اقلام فاکتور نامعتبر است."

                    );

                }


                const productData =
                    productsMap.get(
                        productId
                    );


                if(!productData){

                    throw new Error(

                        "اطلاعات یکی از کالاهای فاکتور پیدا نشد."

                    );

                }


                productData.quantityToReturn +=
                    quantity;

            }

        );


        /*
           ====================================================
           مرحله ۶
           بررسی موجودی قبل از حذف

           این قسمت بسیار مهم است.

           اگر فاکتور خرید ۱۰ عدد ثبت کرده باشد
           ولی از آن کالا فقط ۳ عدد باقی مانده باشد،
           حذف کامل فاکتور باعث منفی شدن موجودی می‌شود.

           در این حالت حذف متوقف می‌شود.
           ====================================================
        */

        productsMap
        .forEach(

            function(productData){

                const product =
                    productData.product;


                const currentStock =
                    Number(
                        product.stock || 0
                    );


                const quantityToReturn =
                    productData.quantityToReturn;


                if(
                    currentStock <
                    quantityToReturn
                ){

                    throw new Error(

                        "امکان حذف فاکتور وجود ندارد.\n\n" +

                        "کالا: " +

                        (
                            product.name ||
                            "نامشخص"
                        )

                        +

                        "\nموجودی فعلی: " +

                        currentStock

                        +

                        "\nمقدار خرید این فاکتور: " +

                        quantityToReturn

                        +

                        "\n\n" +

                        "احتمالاً بخشی از این کالا " +

                        "قبلاً مصرف یا فروخته شده است."

                    );

                }

            }

        );


        /*
           ====================================================
           مرحله ۷
           کاهش موجودی و ثبت تراکنش OUT

           برای هر قلم فاکتور:

           stockBefore
           stockAfter

           ثبت می‌شود.

           این تراکنش در تاریخچه انبار باقی می‌ماند
           و مشخص می‌کند که کاهش موجودی به دلیل حذف
           فاکتور خرید بوده است.
           ====================================================
        */

        const now =
            new Date();


        for(
            const [
                productId,
                productData
            ]
            of productsMap
        ){


            const product =
                productData.product;


            const quantityToReturn =
                productData.quantityToReturn;


            const stockBefore =
                Number(
                    product.stock || 0
                );


            const stockAfter =
                stockBefore -
                quantityToReturn;


            /*
               به‌روزرسانی موجودی
            */

            product.stock =
                stockAfter;


            productsStore.put(
                product
            );


            /*
               ثبت تراکنش OUT
            */

            stockTransactionsStore.add({

                productId:
                    productId,

                productName:
                    product.name ||
                    "نامشخص",

                type:
                    "OUT",

                quantity:
                    quantityToReturn,

                reason:
                    "حذف فاکتور خرید",

                note:

                    "برگشت موجودی ناشی از حذف فاکتور خرید " +

                    (

                        invoice.internalNumber ||

                        invoice.id ||

                        numericInvoiceId

                    ),

                date:
                    now.toLocaleDateString(
                        "fa-IR"
                    ),

                time:
                    now.toLocaleTimeString(
                        "fa-IR",
                        {
                            hour:
                                "2-digit",

                            minute:
                                "2-digit"
                        }
                    ),

                createdAt:
                    now.toISOString(),

                stockBefore:
                    stockBefore,

                stockAfter:
                    stockAfter

            });

        }


        /*
           ====================================================
           مرحله ۸
           حذف اقلام فاکتور
           ====================================================
        */

        for(
            const item
            of invoiceItems
        ){

            invoiceItemsStore.delete(

                item.id

            );

        }


        /*
           ====================================================
           مرحله ۹
           حذف خود فاکتور
           ====================================================
        */

        purchaseInvoicesStore.delete(

            numericInvoiceId

        );


        /*
           ====================================================
           مرحله ۱۰
           انتظار برای پایان تراکنش
           ====================================================
        */

        await new Promise(

            function(resolve,reject){

                transaction.oncomplete =
                    function(){

                        resolve();

                    };


                transaction.onerror =
                    function(){

                        reject(

                            new Error(

                                "حذف فاکتور انجام نشد."

                            )

                        );

                    };


                transaction.onabort =
                    function(){

                        reject(

                            new Error(

                                "عملیات حذف فاکتور لغو شد و هیچ تغییری اعمال نشد."

                            )

                        );

                    };

            }

        );


        /*
           ====================================================
           مرحله ۱۱
           نمایش نتیجه
           ====================================================
        */

        alert(

            "فاکتور خرید با موفقیت حذف شد.\n\n" +

            "موجودی کالاهای مربوط به این فاکتور نیز " +

            "به‌درستی از انبار برگشت داده شد."

        );


        /*
           ----------------------------------------------------
           بازگشت به لیست فاکتورها
           ----------------------------------------------------
        */

        renderPurchaseInvoiceList();


    }catch(error){


        console.error(

            "خطا در حذف فاکتور خرید:",

            error

        );


        alert(

            "حذف فاکتور خرید انجام نشد.\n\n" +

            (

                error.message ||

                "خطای نامشخص"

            )

        );

    }

}


async function editPurchaseInvoice(invoiceId){

    if(!db){
        alert("دیتابیس هنوز آماده نیست.");
        return;
    }

    const numericInvoiceId = Number(invoiceId);
    if(!Number.isInteger(numericInvoiceId) || numericInvoiceId <= 0){
        alert("شناسه فاکتور نامعتبر است.");
        return;
    }

    try{
        // دریافت فاکتور
        const invoice = await new Promise(function(resolve, reject){
            const tx = db.transaction(["purchaseInvoices"], "readonly");
            const req = tx.objectStore("purchaseInvoices").get(numericInvoiceId);
            req.onsuccess = function(){ resolve(req.result || null); };
            req.onerror = function(){ reject(new Error("دریافت فاکتور انجام نشد.")); };
        });

        if(!invoice){
            alert("فاکتور خرید پیدا نشد.");
            return;
        }

        // دریافت اقلام
        const oldItems = await new Promise(function(resolve, reject){
            const tx = db.transaction(["invoiceItems"], "readonly");
            const req = tx.objectStore("invoiceItems").getAll();
            req.onsuccess = function(){
                const items = (req.result || []).filter(function(item){
                    return Number(item.invoiceId) === numericInvoiceId;
                });
                resolve(items);
            };
            req.onerror = function(){ reject(new Error("دریافت اقلام فاکتور انجام نشد.")); };
        });

        // آماده‌سازی حالت ویرایش
        editingPurchaseInvoiceId = numericInvoiceId;

        currentPurchaseInvoiceItems = oldItems.map(function(item){
            return {
                productId: Number(item.productId),
                productName: item.productName || "بدون نام",
                quantity: Number(item.quantity) || 0,
                unitPrice: Number(item.unitPrice || item.purchasePrice || 0),
                total: Number(item.quantity || 0) * Number(item.unitPrice || item.purchasePrice || 0)
            };
        });

        const products = await getAllProductsForPurchase();
        renderPurchaseInvoiceForm(products);

        // پر کردن فیلدهای تأمین‌کننده بعد از ساخته شدن فرم
        setTimeout(function(){
            const el = function(id){ return document.getElementById(id); };

            if(el("purchaseInvoiceNumber")) el("purchaseInvoiceNumber").value = invoice.invoiceNumber || "";
            if(el("purchaseInvoiceDate")) el("purchaseInvoiceDate").value = invoice.date || "";
            if(el("purchaseSupplierName")) el("purchaseSupplierName").value = invoice.supplierName || "";
            if(el("purchaseSupplierPhone")) el("purchaseSupplierPhone").value = invoice.supplierPhone || "";
            if(el("purchaseInvoiceNote")) el("purchaseInvoiceNote").value = invoice.note || "";

            // عنوان فرم
            const title = document.querySelector("#inventoryPage .section-title");
            if(title) title.innerText = "✏️ ویرایش فاکتور خرید";

            // دکمه ثبت
            const submitBtn = document.querySelector("#inventoryPage button.primary-btn[onclick*='save'], #inventoryPage button.primary-btn[onclick*='update']");
            // در renderPurchaseInvoiceForm معمولاً دکمه با onclick ساخته می‌شود؛ عنوان را هم عوض می‌کنیم

            if(typeof renderPurchaseInvoiceItems === "function"){
                renderPurchaseInvoiceItems();
            }
        }, 150);

    }catch(error){
        console.error(error);
        editingPurchaseInvoiceId = null;
        currentPurchaseInvoiceItems = [];
        alert("باز کردن فاکتور برای ویرایش انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}


async function renderPurchaseInvoiceList(){

    const inventoryPage =
        document.getElementById(
            "inventoryPage"
        );


    if(!inventoryPage){

        alert(
            "صفحه انبار پیدا نشد."
        );

        return;

    }


    /*
       --------------------------------------------------------
       نمایش حالت بارگذاری
       --------------------------------------------------------
    */

    inventoryPage.innerHTML = `

    <div
    class="back-btn"
    onclick="returnToInventoryList()">

        ← بازگشت به انبار

    </div>


    <div class="section-title">

        🧾 فاکتورهای خرید

    </div>


    <div
    class="card"
    style="text-align:center;">

        در حال دریافت فاکتورهای خرید...

    </div>

    `;


    if(!db){

        alert(
            "دیتابیس هنوز آماده نیست."
        );

        return;

    }


    try{


        /*
           ----------------------------------------------------
           دریافت فاکتورها
           ----------------------------------------------------
        */

        const invoices =
            await new Promise(

                function(resolve,reject){

                    const transaction =
                        db.transaction(
                            [
                                "purchaseInvoices"
                            ],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "purchaseInvoices"
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        function(){

                            resolve(
                                request.result || []
                            );

                        };


                    request.onerror =
                        function(){

                            reject(
                                new Error(
                                    "دریافت فاکتورهای خرید انجام نشد."
                                )
                            );

                        };

                }

            );


        /*
           ----------------------------------------------------
           مرتب‌سازی:
           جدیدترین فاکتور اول
           ----------------------------------------------------
        */

        invoices.sort(

            function(a,b){

                return String(
                    b.createdAt || ""
                )
                .localeCompare(

                    String(
                        a.createdAt || ""
                    )

                );

            }

        );


        /*
           ----------------------------------------------------
           اگر فاکتوری وجود نداشت
           ----------------------------------------------------
        */

        if(
            invoices.length === 0
        ){

            inventoryPage.innerHTML = `

            <div
            class="back-btn"
            onclick="returnToInventoryList()">

                ← بازگشت به انبار

            </div>


            <div class="section-title">

                🧾 فاکتورهای خرید

            </div>


            <div
            class="card empty">

                هنوز هیچ فاکتور خریدی ثبت نشده است.

            </div>

            `;

            return;

        }


        /*
           ----------------------------------------------------
           ساخت HTML فاکتورها
           ----------------------------------------------------
        */

        let invoicesHTML = "";


        invoices.forEach(

            function(invoice){

                const invoiceId =
                    invoice.id;


                const internalNumber =
                    invoice.internalNumber ||
                    "بدون شماره داخلی";


                const supplierInvoiceNumber =
                    invoice.invoiceNumber ||
                    "ثبت نشده";


                const supplierName =
                    invoice.supplierName ||
                    "بدون نام تأمین‌کننده";


                const date =
                    invoice.date ||
                    "-";


                const totalAmount =
                    Number(
                        invoice.totalAmount || 0
                    );


                const itemCount =
                    Number(
                        invoice.itemCount || 0
                    );


                invoicesHTML += `

                <div
                class="card"
                style="
                margin-bottom:15px;
                ">


                    <div
                    style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:10px;
                    ">


                        <div>

                            <div
                            class="customer-name">

                                🧾

                                ${
                                    escapeHTML(
                                        internalNumber
                                    )
                                }

                            </div>


                            <div
                            class="customer-info">

                                📅 تاریخ:

                                ${
                                    escapeHTML(
                                        date
                                    )
                                }

                            </div>


                            <div
                            class="customer-info">

                                🏪 تأمین‌کننده:

                                ${
                                    escapeHTML(
                                        supplierName
                                    )
                                }

                            </div>


                            <div
                            class="customer-info">

                                🔢 شماره فاکتور تأمین‌کننده:

                                ${
                                    escapeHTML(
                                        supplierInvoiceNumber
                                    )
                                }

                            </div>

                        </div>


                        <div
                        class="badge">

                            خرید

                        </div>


                    </div>


                    <div
                    class="info-grid"
                    style="
                    margin-top:15px;
                    ">


                        <div
                        class="info-box">

                            <div
                            class="info-label">

                                مبلغ کل

                            </div>


                            <div
                            class="info-value">

                                ${
                                    formatMoney(
                                        totalAmount
                                    )
                                }

                            </div>

                        </div>


                        <div
                        class="info-box">

                            <div
                            class="info-label">

                                تعداد اقلام

                            </div>


                            <div
                            class="info-value">

                                ${
                                    itemCount
                                    .toLocaleString(
                                        "fa-IR"
                                    )
                                }

                            </div>

                        </div>


                    </div>


                    <div
                    class="card-actions"
                    style="
                    display:flex;
                    flex-direction:column;
                    gap:8px;
                    margin-top:15px;
                    ">


                        <button
                        class="primary-btn"
                        onclick="
                        viewPurchaseInvoiceDetails(
                            ${invoiceId}
                        )
                        ">

                            👁️ مشاهده جزئیات فاکتور

                        </button>


                    </div>


                </div>

                `;

            }

        );


        /*
           ----------------------------------------------------
           نمایش نهایی
           ----------------------------------------------------
        */

        inventoryPage.innerHTML = `

        <div
        class="back-btn"
        onclick="returnToInventoryList()">

            ← بازگشت به انبار

        </div>


        <div class="section-title">

            🧾 فاکتورهای خرید

        </div>


        ${invoicesHTML}

        `;


    }catch(error){


        console.error(
            "خطا در نمایش فاکتورهای خرید:",
            error
        );


        inventoryPage.innerHTML = `

        <div
        class="back-btn"
        onclick="returnToInventoryList()">

            ← بازگشت به انبار

        </div>


        <div class="section-title">

            🧾 فاکتورهای خرید

        </div>


        <div class="card">

            خطا در دریافت فاکتورهای خرید.

        </div>

        `;


        alert(

            "نمایش فاکتورهای خرید انجام نشد.\n\n" +

            (
                error.message ||
                "خطای نامشخص"
            )

        );

    }

}


async function viewPurchaseInvoiceDetails(
    invoiceId
){

    if(!db){

        alert(
            "دیتابیس هنوز آماده نیست."
        );

        return;

    }


    try{


        /*
           ----------------------------------------------------
           دریافت فاکتور
           ----------------------------------------------------
        */

        const invoice =
            await new Promise(

                function(resolve,reject){

                    const transaction =
                        db.transaction(
                            [
                                "purchaseInvoices"
                            ],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "purchaseInvoices"
                        );


                    const request =
                        store.get(
                            Number(
                                invoiceId
                            )
                        );


                    request.onsuccess =
                        function(){

                            resolve(
                                request.result
                            );

                        };


                    request.onerror =
                        function(){

                            reject(
                                new Error(
                                    "دریافت فاکتور انجام نشد."
                                )
                            );

                        };

                }

            );


        if(!invoice){

            alert(
                "فاکتور موردنظر پیدا نشد."
            );

            return;

        }


        /*
           ----------------------------------------------------
           دریافت اقلام فاکتور
           ----------------------------------------------------
        */

        const items =
            await new Promise(

                function(resolve,reject){

                    const transaction =
                        db.transaction(
                            [
                                "invoiceItems"
                            ],
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            "invoiceItems"
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        function(){

                            const result =

                                (
                                    request.result ||
                                    []
                                )
                                .filter(

                                    function(item){

                                        return (

                                            Number(
                                                item.invoiceId
                                            )
                                            ===
                                            Number(
                                                invoiceId
                                            )

                                        );

                                    }

                                );


                            resolve(
                                result
                            );

                        };


                    request.onerror =
                        function(){

                            reject(
                                new Error(
                                    "دریافت اقلام فاکتور انجام نشد."
                                )
                            );

                        };

                }

            );


        /*
           ----------------------------------------------------
           ساخت لیست اقلام
           ----------------------------------------------------
        */

        let itemsHTML = "";


        if(
            items.length === 0
        ){

            itemsHTML = `

            <div class="empty">

                هیچ قلمی برای این فاکتور ثبت نشده است.

            </div>

            `;

        }else{


            items.forEach(

                function(item,index){

                    const quantity =
                        Number(
                            item.quantity || 0
                        );


                    const unitPrice =
                        Number(
                            item.unitPrice ||
                            item.purchasePrice ||
                            0
                        );


                    const total =
                        Number(
                            item.total ||
                            (
                                quantity *
                                unitPrice
                            )
                        );


                    itemsHTML += `

                    <div
                    class="device-card"
                    style="
                    margin-bottom:10px;
                    ">


                        <div
                        style="
                        display:flex;
                        justify-content:space-between;
                        align-items:flex-start;
                        gap:10px;
                        ">


                            <div>

                                <div
                                style="
                                font-weight:bold;
                                ">

                                    ${
                                        Number(
                                            index + 1
                                        )
                                        .toLocaleString(
                                            "fa-IR"
                                        )
                                    }

                                    .

                                    ${
                                        escapeHTML(
                                            item.productName ||
                                            "کالای نامشخص"
                                        )
                                    }

                                </div>


                                <div
                                class="customer-info">

                                    تعداد:

                                    ${
                                        quantity
                                        .toLocaleString(
                                            "fa-IR"
                                        )
                                    }

                                    عدد

                                </div>


                                <div
                                class="customer-info">

                                    قیمت واحد:

                                    ${
                                        formatMoney(
                                            unitPrice
                                        )
                                    }

                                </div>

                            </div>


                            <div
                            style="
                            font-weight:bold;
                            white-space:nowrap;
                            ">

                                ${
                                    formatMoney(
                                        total
                                    )
                                }

                            </div>


                        </div>


                    </div>

                    `;

                }

            );

        }


        /*
           ----------------------------------------------------
           نمایش جزئیات
           ----------------------------------------------------
        */

        const inventoryPage =
            document.getElementById(
                "inventoryPage"
            );


        if(!inventoryPage){

            return;

        }


        inventoryPage.innerHTML = `

        <div
        class="back-btn"
        onclick="
        renderPurchaseInvoiceList()
        ">

            ← بازگشت به فاکتورهای خرید

        </div>


        <div class="section-title">

            🧾 جزئیات فاکتور خرید

        </div>


        <div class="card">


            <div
            class="customer-name">

                🧾

                ${
                    escapeHTML(
                        invoice.internalNumber ||
                        "بدون شماره داخلی"
                    )
                }

            </div>


            <div
            class="customer-info">

                📅 تاریخ فاکتور:

                ${
                    escapeHTML(
                        invoice.date ||
                        "-"
                    )
                }

            </div>


            <div
            class="customer-info">

                🏪 تأمین‌کننده:

                ${
                    escapeHTML(
                        invoice.supplierName ||
                        "ثبت نشده"
                    )
                }

            </div>


            <div
            class="customer-info">

                📞 تلفن تأمین‌کننده:

                ${
                    escapeHTML(
                        invoice.supplierPhone ||
                        "ثبت نشده"
                    )
                }

            </div>


            <div
            class="customer-info">

                🔢 شماره فاکتور تأمین‌کننده:

                ${
                    escapeHTML(
                        invoice.invoiceNumber ||
                        "ثبت نشده"
                    )
                }

            </div>


            ${
                invoice.note
                ?

                `

                <div
                class="customer-info">

                    📝 توضیحات:

                    ${
                        escapeHTML(
                            invoice.note
                        )
                    }

                </div>

                `

                :

                ""

            }



<button
class="edit-btn"
onclick="
editPurchaseInvoice(
    ${invoice.id}
)
">

✏️ ویرایش فاکتور خرید

</button>
<button
class="danger-btn"
onclick="
deletePurchaseInvoice(
    ${invoice.id}
)
">

🗑️ حذف فاکتور خرید

</button>


        </div>


        <div class="section-title">

            📦 اقلام فاکتور

        </div>


        <div class="card">

            ${itemsHTML}

        </div>


        <div class="card">


            <div
            style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            font-size:18px;
            font-weight:bold;
            ">


                <span>

                    مبلغ نهایی فاکتور

                </span>


                <span>

                    ${
                        formatMoney(
                            Number(
                                invoice.totalAmount ||
                                0
                            )
                        )
                    }

                </span>


            </div>


        </div>


        `;


    }catch(error){


        console.error(
            "خطا در نمایش جزئیات فاکتور:",
            error
        );


        alert(

            "نمایش جزئیات فاکتور انجام نشد.\n\n" +

            (
                error.message ||
                "خطای نامشخص"
            )

        );

    }

}


function removePurchaseInvoiceItem(
    index
){

    if(
        index < 0
        ||
        index >=
        currentPurchaseInvoiceItems.length
    ){

        return;

    }


    currentPurchaseInvoiceItems
    .splice(
        index,
        1
    );


    renderPurchaseInvoiceItems();

}


function applyPurchaseItemFieldChange(input){

    if(!input) return;

    const index = Number(input.dataset.index);
    const field = input.dataset.field;
    const raw = input.value;

    if(
        !Array.isArray(currentPurchaseInvoiceItems) ||
        index < 0 ||
        index >= currentPurchaseInvoiceItems.length
    ){
        return;
    }

    if(field === "quantity"){
        const qty = Number(raw);
        if(!Number.isInteger(qty) || qty <= 0){
            input.value = currentPurchaseInvoiceItems[index].quantity;
            return;
        }
        currentPurchaseInvoiceItems[index].quantity = qty;
    }

    if(field === "unitPrice"){
        const price = Number(raw);
        if(!Number.isFinite(price) || price < 0){
            input.value = currentPurchaseInvoiceItems[index].unitPrice;
            return;
        }
        currentPurchaseInvoiceItems[index].unitPrice = price;
    }

    const item = currentPurchaseInvoiceItems[index];
    item.total = Number(item.quantity) * Number(item.unitPrice);

    const card = input.closest(".product-card");
    if(card){
        const priceEl = card.querySelector(".product-price");
        if(priceEl){
            priceEl.innerHTML = "جمع: " + formatMoney(item.total);
        }
    }

    updatePurchaseInvoiceTotal();
}


function updatePurchaseInvoiceTotal(){

    const totalElement =
        document.getElementById(
            "purchaseInvoiceTotal"
        );


    if(!totalElement){

        return;

    }


    let total =
        0;


    currentPurchaseInvoiceItems
    .forEach(
        function(item){

            total +=

                Number(
                    item.total
                )

                ||

                0;

        }
    );


    totalElement.innerHTML = `

    مبلغ کل:

    ${formatMoney(
        total
    )}

    `;

}
function addPurchaseInvoiceItem(){

    const idInput = document.getElementById("purchaseProductId");
    const nameInput = document.getElementById("purchaseProductName");
    const quantityInput = document.getElementById("purchaseProductQuantity");
    const priceInput = document.getElementById("purchaseProductUnitPrice");
    const pickerBtn = document.getElementById("purchaseProductPickerBtn");

    if(!idInput || !quantityInput || !priceInput){
        return;
    }

    const productId = Number(idInput.value);
    const quantity = Number(quantityInput.value);
    const unitPrice = Number(priceInput.value);
    const productName = (nameInput && nameInput.value) ? nameInput.value : "کالا";

    if(!Number.isInteger(productId) || productId <= 0){
        alert("لطفاً کالا را انتخاب کنید.");
        return;
    }

    if(!Number.isInteger(quantity) || quantity <= 0){
        alert("تعداد نامعتبر است.");
        return;
    }

    if(!Number.isFinite(unitPrice) || unitPrice < 0){
        alert("قیمت خرید نامعتبر است.");
        return;
    }

    const existing = currentPurchaseInvoiceItems.find(function(item){
        return Number(item.productId) === productId;
    });

    if(existing){
        existing.quantity = Number(existing.quantity) + quantity;
        existing.unitPrice = unitPrice;
        existing.total = existing.quantity * existing.unitPrice;
    }else{
        currentPurchaseInvoiceItems.push({
            productId: productId,
            productName: productName,
            quantity: quantity,
            unitPrice: unitPrice,
            total: quantity * unitPrice
        });
    }

    idInput.value = "";
    if(nameInput) nameInput.value = "";
    quantityInput.value = "";
    priceInput.value = "";
    if(pickerBtn) pickerBtn.textContent = "انتخاب کالا...";

    renderPurchaseInvoiceItems();
}

function renderPurchaseInvoiceItems(){

    const container = document.getElementById("purchaseInvoiceItemsContainer");
    if(!container) return;

    if(!Array.isArray(currentPurchaseInvoiceItems) || currentPurchaseInvoiceItems.length === 0){
        container.innerHTML = `
            <div class="card">
                <div class="empty">هنوز کالایی به فاکتور اضافه نشده است.</div>
            </div>
        `;
        updatePurchaseInvoiceTotal();
        return;
    }

    let html = "";

    currentPurchaseInvoiceItems.forEach(function(item, index){
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;
        const total = qty * price;
        item.total = total;

        html += `
            <div class="product-card" data-index="${index}">
                <div class="product-title">
                    📦 ${escapeHTML(item.productName || "بدون نام")}
                </div>

                <div class="form-group" style="margin-top:12px;margin-bottom:8px;">
                    <label>تعداد</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        inputmode="numeric"
                        value="${qty}"
                        data-field="quantity"
                        data-index="${index}"
                    >
                </div>

                <div class="form-group" style="margin-bottom:8px;">
                    <label>قیمت واحد</label>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        inputmode="numeric"
                        value="${price}"
                        data-field="unitPrice"
                        data-index="${index}"
                    >
                </div>

                <div class="product-price">
                    جمع: ${formatMoney(total)}
                </div>

                <div class="product-actions" style="margin-top:12px;">
                    <button type="button" class="danger-btn" onclick="removePurchaseInvoiceItem(${index})">
                        حذف
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    container.querySelectorAll("input[data-field]").forEach(function(input){
        input.addEventListener("change", function(){
            applyPurchaseItemFieldChange(this);
        });
        input.addEventListener("blur", function(){
            applyPurchaseItemFieldChange(this);
        });
    });

    updatePurchaseInvoiceTotal();
}
