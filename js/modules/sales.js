
async function openSalesInvoiceForm(){

    if(!db){
        showToast("دیتابیس هنوز آماده نیست.", "error");
        return;
    }
    currentSalesInvoiceItems = [];
    editingSalesInvoiceId = null;
    currentSalesCustomerId = null;
    currentSalesRepairId = null;
    currentSalesInvoiceItems = [];
    editingSalesInvoiceId = null;
    currentSalesCustomerId = null;
    currentSalesRepairId = null;
    window._oldSalesInvoiceItems = null;

    try{
        const customers = await new Promise(function(resolve, reject){
            const tx = db.transaction("customers", "readonly");
            const req = tx.objectStore("customers").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ reject(new Error("دریافت مشتریان انجام نشد.")); };
        });

        const products = await getAllProductsForPurchase();

        renderSalesInvoiceForm(customers, products);

    }catch(error){
        console.error(error);
        alert(error.message || "خطا در باز کردن فاکتور فروش.");
    }
}

function renderSalesInvoiceForm(customers, products){
    console.log("Items:", currentSalesInvoiceItems);
    const page = document.getElementById("inventoryPage");
    if(!page) return;

    // گزینه‌های مشتری
    let customerOptions = `<option value="">انتخاب مشتری</option>`;
    customers
        .sort(function(a,b){ return b.id - a.id; })
        .forEach(function(c){
            customerOptions += `
                <option value="${c.id}">
                    ${escapeHTML(c.name || "بدون نام")}
                    ${c.phone ? " — " + escapeHTML(c.phone) : ""}
                </option>`;
        });

    // گزینه‌های کالا
    let productOptions = `<option value="">انتخاب کالا</option>`;
    products.forEach(function(p){
        productOptions += `
            <option value="${p.id}"
                data-sale-price="${Number(p.salePrice || 0)}"
                data-stock="${Number(p.stock || 0)}">
                ${escapeHTML(p.name || "بدون نام")}
                | موجودی: ${Number(p.stock || 0).toLocaleString("fa-IR")}
            </option>`;
    });

    const today = getTodayJalali();

    page.innerHTML = `
    <div class="back-btn" onclick="returnToInventoryList()">
        ← بازگشت به انبار
    </div>

    <div class="section-title">🧾 فاکتور فروش</div>

    <div class="card">

        <div class="form-group">
            <label>مشتری</label>
            <select id="salesCustomerSelect">
                ${customerOptions}
            </select>
        </div>

        <button type="button" class="secondary-btn" style="width:100%;margin-bottom:12px;"
            onclick="openQuickCustomerForSales()">
            + مشتری جدید (سریع)
        </button>

        <div class="form-group">
            <label>تاریخ فاکتور</label>
            <input type="text" id="salesInvoiceDate" value="${today}" readonly>
        </div>

        <div class="form-group">
            <label>توضیحات</label>
            <textarea id="salesInvoiceNote" placeholder="توضیحات فاکتور (اختیاری)"></textarea>
        </div>

    </div>

    <div class="section-title">➕ افزودن کالا</div>

    <div class="card">

        <div class="form-group">
            <label>کالا</label>
            <select id="salesProductSelect">
                ${productOptions}
            </select>
        </div>

        <div class="form-group">
            <label>تعداد</label>
            <input type="number" id="salesProductQuantity" min="1" step="1" inputmode="numeric" placeholder="تعداد">
        </div>

        <div class="form-group">
            <label>قیمت فروش واحد (قابل تغییر)</label>
            <input type="number" id="salesProductUnitPrice" min="0" step="1" inputmode="numeric" placeholder="قیمت فروش">
        </div>

        <button type="button" class="primary-btn" style="width:100%;" onclick="addSalesInvoiceItem()">
            ➕ افزودن به فاکتور
        </button>

    </div>

    <div class="section-title">📦 اقلام فاکتور</div>
    <div id="salesInvoiceItemsContainer"></div>

    <div class="card">

        <div class="form-group">
            <label>اجرت / خدمات (اختیاری)</label>
            <input type="number" id="salesLaborCost" min="0" step="1" inputmode="numeric" placeholder="۰" value="0">
        </div>

        <div id="salesInvoiceTotal" class="info-box" style="margin-bottom:12px;">
            مبلغ کل: ۰ تومان
        </div>

        <div class="form-group">
            <label>مبلغ پرداخت‌شده</label>
            <input type="number" id="salesPaidAmount" min="0" step="1" inputmode="numeric" placeholder="۰" value="0">
        </div>

        <div class="form-group">
            <label>وضعیت پرداخت</label>
            <select id="salesPaymentStatus">
                <option value="پرداخت کامل">پرداخت کامل</option>
                <option value="پرداخت ناقص">پرداخت ناقص</option>
                <option value="پرداخت نشده">پرداخت نشده</option>
            </select>
        </div>

        <button class="primary-btn" style="width:100%;" onclick="saveSalesInvoice()">
            💾 ثبت نهایی فاکتور فروش
        </button>

    </div>
    `;

    // پر کردن خودکار قیمت فروش هنگام انتخاب کالا
    const productSelect = document.getElementById("salesProductSelect");
    if(productSelect){
        productSelect.onchange = function(){
            const opt = productSelect.options[productSelect.selectedIndex];
            const priceInput = document.getElementById("salesProductUnitPrice");
            if(!priceInput) return;
            if(!productSelect.value){
                priceInput.value = "";
                return;
            }
            priceInput.value = Number(opt.dataset.salePrice || 0);
        };
    }

    // پر شدن خودکار مبلغ پرداخت‌شده
    const laborInput = document.getElementById("salesLaborCost");
    if(laborInput){
        laborInput.oninput = function(){
            updateSalesPaidAmount();
        };
    }

    renderSalesInvoiceItems();
    console.log(currentSalesInvoiceItems);
    const statusSelect = document.getElementById("salesPaymentStatus");
    if(statusSelect){
        statusSelect.onchange = function(){
            updateSalesPaidAmount();
        };
    }
}
async function saveSalesInvoice(){

    if(!db){
        showToast("دیتابیس هنوز آماده نیست.", "error");
        return;
    }

    // مشتری
    const customerSelect = document.getElementById("salesCustomerSelect");
    const customerId = Number(customerSelect?.value || currentSalesCustomerId || 0);

    if(!Number.isInteger(customerId) || customerId <= 0){
        showToast("لطفاً مشتری را انتخاب کنید.", "error");
        return;
    }

    if(!Array.isArray(currentSalesInvoiceItems) || currentSalesInvoiceItems.length === 0){
       showToast("حداقل یک کالا باید اضافه شود.", "error");
        return;
    }

    const invoiceDate = document.getElementById("salesInvoiceDate")?.value || getTodayJalali();
    const note = String(document.getElementById("salesInvoiceNote")?.value || "").trim();
    const laborCost = Number(document.getElementById("salesLaborCost")?.value) || 0;
    const paidAmount = Number(document.getElementById("salesPaidAmount")?.value) || 0;
    const paymentStatus = document.getElementById("salesPaymentStatus")?.value || "پرداخت کامل";

    if(!Number.isFinite(laborCost) || laborCost < 0){
        showToast("مبلغ اجرت نامعتبر است.", "error");
        return;
    }

    // محاسبه مبلغ کالاها
    let itemsTotal = 0;
    for(const item of currentSalesInvoiceItems){
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);

        if(!Number.isInteger(qty) || qty <= 0){
            showtoast("تعداد یکی از کالاها نامعتبر است.", "error");
            return;
        }
        if(!Number.isFinite(price) || price < 0){
            showtoast("قیمت یکی از کالاها نامعتبر است.", "error");
            return;
        }

        item.total = qty * price;
        itemsTotal += item.total;
    }

    const totalAmount = itemsTotal + laborCost;

    if(paidAmount < 0){
        showtoast("مبلغ پرداخت‌شده نمی‌تواند منفی باشد.", "error");
        return;
    }

    if(paidAmount > totalAmount){
        showtoast("مبلغ پرداخت‌شده نمی‌تواند بیشتر از مبلغ کل باشد.", "error");
        return;
    }

    const confirmed = confirm(
        "آیا فاکتور فروش ثبت شود؟\n\n" +
        "تعداد اقلام: " + currentSalesInvoiceItems.length + "\n" +
        "مبلغ کالاها: " + formatMoney(itemsTotal) + "\n" +
        "اجرت: " + formatMoney(laborCost) + "\n" +
        "مبلغ کل: " + formatMoney(totalAmount) + "\n\n" +
        "موجودی کالاها از انبار کم خواهد شد."
    );

    if(!confirmed) return;

    try{
        // بررسی موجودی قبل از ثبت
        const products = await getAllProductsForPurchase();
        const productMap = new Map();
        products.forEach(function(p){
            productMap.set(Number(p.id), p);
        });

        for(const item of currentSalesInvoiceItems){

    if(item.fromRepair === true){
        continue;
    }

    const product = productMap.get(Number(item.productId));

    if(!product){
        throw new Error("کالای «" + item.productName + "» پیدا نشد.");
    }

    const stock = Number(product.stock || 0);

    if(stock < Number(item.quantity)){
        throw new Error(
            "موجودی «" + item.productName + "» کافی نیست.\n" +
            "موجودی: " + stock.toLocaleString("fa-IR") + "\n" +
            "نیاز: " + Number(item.quantity).toLocaleString("fa-IR")
        );
    }
}

        // نام مشتری
        let customerName = "مشتری";
        const custOpt = customerSelect?.options[customerSelect.selectedIndex];
        if(custOpt){
            customerName = custOpt.textContent.split("—")[0].trim();
        }

        const now = new Date();
        const invoiceId = Date.now();

        await new Promise(function(resolve, reject){

            const transaction = db.transaction(
                ["salesInvoices", "invoiceItems", "products", "stockTransactions"],
                "readwrite"
            );

            const salesStore = transaction.objectStore("salesInvoices");
            const itemsStore = transaction.objectStore("invoiceItems");
            const productsStore = transaction.objectStore("products");
            const stockStore = transaction.objectStore("stockTransactions");

            // ثبت فاکتور
            salesStore.add({
                id: invoiceId,
                internalNumber: "SL-" + invoiceId,
                customerId: customerId,
                customerName: customerName,
                date: invoiceDate,
                note: note,
                itemsTotal: itemsTotal,
                laborCost: laborCost,
                totalAmount: totalAmount,
                paidAmount: paidAmount,
                paymentStatus: paymentStatus,
                itemCount: currentSalesInvoiceItems.length,
                createdAt: now.toISOString(),
                repairId: currentSalesRepairId || null,
                status: "COMPLETED"
            });

            let pending = currentSalesInvoiceItems.length;
            let hasError = false;

            if(pending === 0){
                // فقط اجرت — بدون کالا
            }

            currentSalesInvoiceItems.forEach(function(item){
                console.log(currentSalesInvoiceItems);
                if(hasError) return;

                const productId = Number(item.productId);
                const qty = Number(item.quantity);
                const unitPrice = Number(item.unitPrice);

                // ثبت قلم
                itemsStore.add({
                    invoiceId: invoiceId,
                    invoiceType: "فروش",
                    productId: productId,
                    productName: item.productName,
                    quantity: qty,
                    salePrice: unitPrice,
                    unitPrice: unitPrice,
                    total: qty * unitPrice,
                    date: invoiceDate,
                    fromRepair: item.fromRepair === true,
                    createdAt: now.toISOString()
                });
                if(item.fromRepair === true){
                    return;
                }
                // کاهش موجودی
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
                    if(stockBefore < qty){
                        hasError = true;
                        reject(new Error("موجودی «" + product.name + "» کافی نیست."));
                        try{ transaction.abort(); }catch(e){}
                        return;
                    }

                    const stockAfter = stockBefore - qty;
                    product.stock = stockAfter;

                    const putReq = productsStore.put(product);

                    putReq.onsuccess = function(){
                        stockStore.add({
                            productId: productId,
                            productName: product.name || item.productName,
                            type: "OUT",
                            quantity: qty,
                            reason: "فروش به مشتری",
                            note: "فاکتور فروش " + ("SL-" + invoiceId) + " — " + customerName,
                            date: now.toLocaleDateString("fa-IR"),
                            time: now.toLocaleTimeString("fa-IR", {hour:"2-digit", minute:"2-digit"}),
                            createdAt: now.toISOString(),
                            stockBefore: stockBefore,
                            stockAfter: stockAfter
                        });
                    };

                    putReq.onerror = function(){
                        hasError = true;
                        reject(new Error("کاهش موجودی انجام نشد."));
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
                reject(new Error("ثبت فاکتور فروش انجام نشد."));
            };

            transaction.onabort = function(){
                reject(new Error("ثبت فاکتور لغو شد."));
            };
        });

        
                // موفقیت
        
        currentSalesInvoiceItems = [];
        editingSalesInvoiceId = null;
        currentSalesCustomerId = null;
        currentSalesRepairId = null;

        updateDashboard();

        // اول فرم فاکتور را ببند و انبار را برگردان
        if(typeof returnToInventoryList === "function"){
            returnToInventoryList();
        }else{
            showPage("inventoryPage");
            loadProducts();
            updateInventorySummary();
        }

        // فقط اگر مشتری ناقص بود، پیشنهاد تکمیل بده
        let shouldAskComplete = false;

        try{
            const customer = await new Promise(function(resolve, reject){
                const tx = db.transaction("customers", "readonly");
                const req = tx.objectStore("customers").get(customerId);
                req.onsuccess = function(){ resolve(req.result || null); };
                req.onerror = function(){ resolve(null); };
            });

            
            if(customer){
                const noAddress = !customer.address || String(customer.address).trim() === "";
                // فقط اگر آدرس خالی باشد پیشنهاد تکمیل بده
                if(noAddress){
                    shouldAskComplete = true;
                }
            }


        }catch(e){}

        if(shouldAskComplete){
            const completeProfile = confirm(
                "فاکتور فروش ثبت شد.\n\n" +
                "مبلغ کل: " + formatMoney(totalAmount) + "\n\n" +
                "مشخصات این مشتری ناقص است.\n" +
                "آیا می‌خواهید الان کامل کنید؟"
            );

            if(completeProfile){
                showPage("customersPage");
                openCustomerProfile(customerId);
            }else{
                alert("فاکتور فروش با موفقیت ثبت شد.\nمبلغ کل: " + formatMoney(totalAmount));
            }
        }else{
            alert("فاکتور فروش با موفقیت ثبت شد.\nمبلغ کل: " + formatMoney(totalAmount));
        }

    }catch(error){
        console.error("خطا در ثبت فاکتور فروش:", error);
        alert("ثبت فاکتور فروش انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}
async function updateSalesInvoice(){

    if(!editingSalesInvoiceId){
        alert("فاکتوری برای ویرایش انتخاب نشده است.");
        return;
    }

    if(!Array.isArray(currentSalesInvoiceItems) || currentSalesInvoiceItems.length === 0){
        alert("حداقل یک کالا باید در فاکتور باشد.");
        return;
    }

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    const invoiceId = Number(editingSalesInvoiceId);
    const customerSelect = document.getElementById("salesCustomerSelect");
    const customerId = Number(customerSelect?.value || currentSalesCustomerId || 0);

    if(!Number.isInteger(customerId) || customerId <= 0){
        alert("لطفاً مشتری را انتخاب کنید.");
        return;
    }

    const invoiceDate = document.getElementById("salesInvoiceDate")?.value || getTodayJalali();
    const note = String(document.getElementById("salesInvoiceNote")?.value || "").trim();
    const laborCost = Number(document.getElementById("salesLaborCost")?.value) || 0;
    const paidAmount = Number(document.getElementById("salesPaidAmount")?.value) || 0;
    const paymentStatus = document.getElementById("salesPaymentStatus")?.value || "پرداخت کامل";

    let itemsTotal = 0;
    for(const item of currentSalesInvoiceItems){
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);
        if(!Number.isInteger(qty) || qty <= 0){
            alert("تعداد یکی از کالاها نامعتبر است.");
            return;
        }
        if(!Number.isFinite(price) || price < 0){
            alert("قیمت یکی از کالاها نامعتبر است.");
            return;
        }
        item.total = qty * price;
        itemsTotal += item.total;
    }

    const totalAmount = itemsTotal + laborCost;

    if(paidAmount < 0 || paidAmount > totalAmount){
        alert("مبلغ پرداخت‌شده نامعتبر است.");
        return;
    }

    const confirmed = confirm(
        "آیا تغییرات فاکتور فروش ذخیره شود؟\n\n" +
        "موجودی کالاهای عادی بر اساس اختلاف قبلی و جدید اصلاح می‌شود.\n" +
        "قطعات آمده از تعمیر تغییر موجودی نمی‌دهند."
    );
    if(!confirmed) return;

    try{
        const oldInvoice = await new Promise(function(resolve, reject){
            const tx = db.transaction(["salesInvoices"], "readonly");
            const req = tx.objectStore("salesInvoices").get(invoiceId);
            req.onsuccess = function(){ resolve(req.result || null); };
            req.onerror = function(){ reject(new Error("دریافت فاکتور قبلی انجام نشد.")); };
        });

        if(!oldInvoice) throw new Error("فاکتور پیدا نشد.");

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

        // اختلاف فقط برای اقلام غیرتعمیر
        const oldMap = new Map();
        oldItems.forEach(function(item){
            if(item.fromRepair === true) return;
            const pid = Number(item.productId);
            const qty = Number(item.quantity) || 0;
            oldMap.set(pid, (oldMap.get(pid) || 0) + qty);
        });

        const newMap = new Map();
        currentSalesInvoiceItems.forEach(function(item){
            if(item.fromRepair === true) return;
            const pid = Number(item.productId);
            const qty = Number(item.quantity) || 0;
            newMap.set(pid, (newMap.get(pid) || 0) + qty);
        });

        const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);
        const differences = [];

        allIds.forEach(function(pid){
            const oldQty = oldMap.get(pid) || 0;
            const newQty = newMap.get(pid) || 0;
            const diff = newQty - oldQty; // مثبت = خروج بیشتر
            if(diff !== 0){
                differences.push({ productId: pid, difference: diff });
            }
        });

        // بررسی موجودی برای خروج‌های بیشتر
        const products = await getAllProductsForPurchase();
        const productMap = new Map();
        products.forEach(function(p){ productMap.set(Number(p.id), p); });

        for(const d of differences){
            if(d.difference > 0){
                const p = productMap.get(d.productId);
                if(!p) throw new Error("یکی از کالاها در انبار پیدا نشد.");
                if(Number(p.stock || 0) < d.difference){
                    throw new Error(
                        "موجودی «" + (p.name || "") + "» برای افزایش تعداد کافی نیست."
                    );
                }
            }
        }

        let customerName = oldInvoice.customerName || "مشتری";
        const custOpt = customerSelect?.options[customerSelect.selectedIndex];
        if(custOpt){
            customerName = custOpt.textContent.split("—")[0].trim();
        }

        const now = new Date();

        await new Promise(function(resolve, reject){

            const transaction = db.transaction(
                ["salesInvoices", "invoiceItems", "products", "stockTransactions"],
                "readwrite"
            );

            const salesStore = transaction.objectStore("salesInvoices");
            const itemsStore = transaction.objectStore("invoiceItems");
            const productsStore = transaction.objectStore("products");
            const stockStore = transaction.objectStore("stockTransactions");

            const updated = Object.assign({}, oldInvoice, {
                customerId: customerId,
                customerName: customerName,
                date: invoiceDate,
                note: note,
                itemsTotal: itemsTotal,
                laborCost: laborCost,
                totalAmount: totalAmount,
                paidAmount: paidAmount,
                paymentStatus: paymentStatus,
                itemCount: currentSalesInvoiceItems.length,
                updatedAt: now.toISOString()
            });
            salesStore.put(updated);

            // حذف اقلام قبلی
            oldItems.forEach(function(item){
                if(item.id !== undefined) itemsStore.delete(item.id);
            });

            // ثبت اقلام جدید
            currentSalesInvoiceItems.forEach(function(item){
                itemsStore.add({
                    invoiceId: invoiceId,
                    invoiceType: "فروش",
                    productId: Number(item.productId),
                    productName: item.productName,
                    quantity: Number(item.quantity),
                    salePrice: Number(item.unitPrice),
                    unitPrice: Number(item.unitPrice),
                    total: Number(item.quantity) * Number(item.unitPrice),
                    date: invoiceDate,
                    fromRepair: item.fromRepair === true,
                    createdAt: now.toISOString()
                });
            });

            let hasError = false;

            differences.forEach(function(d){
                if(hasError) return;

                const productId = d.productId;
                const qty = Math.abs(d.difference);
                const type = d.difference > 0 ? "OUT" : "IN";

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
                    const stockAfter = type === "OUT" ? stockBefore - qty : stockBefore + qty;

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
                            productName: product.name || "",
                            type: type,
                            quantity: qty,
                            reason: "اصلاح فاکتور فروش",
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

        currentSalesInvoiceItems = [];
        editingSalesInvoiceId = null;
        currentSalesCustomerId = null;
        currentSalesRepairId = null;
        window._oldSalesInvoiceItems = null;

        alert("فاکتور فروش با موفقیت ویرایش شد.");
        renderSalesInvoiceList();
        updateDashboard();

    }catch(error){
        console.error(error);
        alert("ویرایش فاکتور فروش انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}
async function editSalesInvoice(invoiceId){

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    const numericId = Number(invoiceId);
    if(!Number.isInteger(numericId) || numericId <= 0){
        alert("شناسه فاکتور نامعتبر است.");
        return;
    }

    try{
        const invoice = await new Promise(function(resolve, reject){
            const tx = db.transaction(["salesInvoices"], "readonly");
            const req = tx.objectStore("salesInvoices").get(numericId);
            req.onsuccess = function(){ resolve(req.result || null); };
            req.onerror = function(){ reject(new Error("دریافت فاکتور انجام نشد.")); };
        });

        if(!invoice){
            alert("فاکتور پیدا نشد.");
            return;
        }

        const oldItems = await new Promise(function(resolve, reject){
            const tx = db.transaction(["invoiceItems"], "readonly");
            const req = tx.objectStore("invoiceItems").getAll();
            req.onsuccess = function(){
                resolve((req.result || []).filter(function(item){
                    return Number(item.invoiceId) === numericId;
                }));
            };
            req.onerror = function(){ reject(new Error("دریافت اقلام انجام نشد.")); };
        });

        editingSalesInvoiceId = numericId;
        currentSalesRepairId = invoice.repairId || null;
        currentSalesCustomerId = Number(invoice.customerId) || null;

        currentSalesInvoiceItems = oldItems.map(function(item){
            return {
                productId: Number(item.productId),
                productName: item.productName || "بدون نام",
                quantity: Number(item.quantity) || 0,
                unitPrice: Number(item.unitPrice || item.salePrice || 0),
                total: Number(item.total || 0),
                fromRepair: item.fromRepair === true
            };
        });

        // برای محاسبه اختلاف موجودی هنگام ذخیره
        window._oldSalesInvoiceItems = oldItems.map(function(item){
            return {
                productId: Number(item.productId),
                quantity: Number(item.quantity) || 0,
                fromRepair: item.fromRepair === true
            };
        });

        const customers = await new Promise(function(resolve, reject){
            const tx = db.transaction("customers", "readonly");
            const req = tx.objectStore("customers").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ reject(new Error("دریافت مشتریان انجام نشد.")); };
        });

        const products = await getAllProductsForPurchase();

        showPage("inventoryPage");
        renderSalesInvoiceForm(customers, products);

        setTimeout(function(){
            const el = function(id){ return document.getElementById(id); };

            if(el("salesCustomerSelect") && invoice.customerId){
                el("salesCustomerSelect").value = String(invoice.customerId);
            }
            if(el("salesInvoiceDate")){
                el("salesInvoiceDate").value = invoice.date || getTodayJalali();
            }
            if(el("salesInvoiceNote")){
                el("salesInvoiceNote").value = invoice.note || "";
            }
            if(el("salesLaborCost")){
                el("salesLaborCost").value = Number(invoice.laborCost || 0);
            }
            if(el("salesPaidAmount")){
                el("salesPaidAmount").value = Number(invoice.paidAmount || 0);
            }
            if(el("salesPaymentStatus")){
                el("salesPaymentStatus").value = invoice.paymentStatus || "پرداخت کامل";
            }

            const title = document.querySelector("#inventoryPage .section-title");
            if(title) title.innerText = "✏️ ویرایش فاکتور فروش";

            // دکمه ثبت را به حالت ویرایش ببر
            const buttons = document.querySelectorAll("#inventoryPage button.primary-btn");
            buttons.forEach(function(btn){
                if((btn.textContent || "").indexOf("ثبت نهایی") !== -1){
                    btn.textContent = "💾 ذخیره تغییرات فاکتور";
                    btn.setAttribute("onclick", "updateSalesInvoice()");
                }
            });

            renderSalesInvoiceItems();
            updateSalesInvoiceTotal();

            // بعد از محاسبه خودکار، مبلغ پرداخت‌شده قبلی را برگردان
            if(el("salesPaidAmount")){
                el("salesPaidAmount").value = Number(invoice.paidAmount || 0);
            }
            if(el("salesPaymentStatus")){
                el("salesPaymentStatus").value = invoice.paymentStatus || "پرداخت کامل";
                if(typeof updateSalesPaidAmount === "function"){
                    // وضعیت را حفظ کن؛ اگر ناقص بود دستی بماند
                    if(invoice.paymentStatus === "پرداخت ناقص"){
                        el("salesPaidAmount").readOnly = false;
                        el("salesPaidAmount").value = Number(invoice.paidAmount || 0);
                    }
                }
            }

        }, 200);

    }catch(error){
        console.error(error);
        editingSalesInvoiceId = null;
        currentSalesInvoiceItems = [];
        alert("باز کردن فاکتور برای ویرایش انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}
async function deleteSalesInvoice(invoiceId){

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    const numericId = Number(invoiceId);
    if(!Number.isInteger(numericId) || numericId <= 0){
        alert("شناسه فاکتور نامعتبر است.");
        return;
    }

    try{
        // دریافت فاکتور
        const invoice = await new Promise(function(resolve, reject){
            const tx = db.transaction(["salesInvoices"], "readonly");
            const req = tx.objectStore("salesInvoices").get(numericId);
            req.onsuccess = function(){ resolve(req.result || null); };
            req.onerror = function(){ reject(new Error("دریافت فاکتور انجام نشد.")); };
        });

        if(!invoice){
            alert("فاکتور پیدا نشد.");
            return;
        }

        // دریافت اقلام
        const items = await new Promise(function(resolve, reject){
            const tx = db.transaction(["invoiceItems"], "readonly");
            const req = tx.objectStore("invoiceItems").getAll();
            req.onsuccess = function(){
                resolve((req.result || []).filter(function(item){
                    return Number(item.invoiceId) === numericId;
                }));
            };
            req.onerror = function(){ reject(new Error("دریافت اقلام انجام نشد.")); };
        });

        const confirmed = confirm(
            "آیا از حذف این فاکتور فروش مطمئن هستید؟\n\n" +
            "شماره: " + (invoice.internalNumber || numericId) + "\n" +
            "مشتری: " + (invoice.customerName || "-") + "\n\n" +
            "کالاهای فروش‌رفته عادی به انبار برمی‌گردند.\n" +
            "قطعات مربوط به تعمیر برنمی‌گردند."
        );

        if(!confirmed) return;

        const now = new Date();

        await new Promise(function(resolve, reject){

            const transaction = db.transaction(
                ["salesInvoices", "invoiceItems", "products", "stockTransactions"],
                "readwrite"
            );

            const salesStore = transaction.objectStore("salesInvoices");
            const itemsStore = transaction.objectStore("invoiceItems");
            const productsStore = transaction.objectStore("products");
            const stockStore = transaction.objectStore("stockTransactions");

            let hasError = false;

            items.forEach(function(item){

                if(hasError) return;

                // حذف قلم
                if(item.id !== undefined){
                    itemsStore.delete(item.id);
                }

                // قطعات تعمیر → موجودی دست نخورد
                if(item.fromRepair === true){
                    return;
                }

                const productId = Number(item.productId);
                const qty = Number(item.quantity || 0);
                if(!productId || qty <= 0) return;

                const getReq = productsStore.get(productId);

                getReq.onsuccess = function(){
                    if(hasError) return;

                    const product = getReq.result;
                    if(!product) return; // کالا حذف شده؛ فقط قلم را پاک کردیم

                    const stockBefore = Number(product.stock || 0);
                    const stockAfter = stockBefore + qty;
                    product.stock = stockAfter;

                    const putReq = productsStore.put(product);

                    putReq.onsuccess = function(){
                        stockStore.add({
                            productId: productId,
                            productName: product.name || item.productName || "نامشخص",
                            type: "IN",
                            quantity: qty,
                            reason: "حذف فاکتور فروش",
                            note: "برگشت موجودی از حذف فاکتور " + (invoice.internalNumber || numericId),
                            date: now.toLocaleDateString("fa-IR"),
                            time: now.toLocaleTimeString("fa-IR", {hour:"2-digit", minute:"2-digit"}),
                            createdAt: now.toISOString(),
                            stockBefore: stockBefore,
                            stockAfter: stockAfter
                        });
                    };

                    putReq.onerror = function(){
                        hasError = true;
                        reject(new Error("برگرداندن موجودی انجام نشد."));
                        try{ transaction.abort(); }catch(e){}
                    };
                };

                getReq.onerror = function(){
                    hasError = true;
                    reject(new Error("دریافت کالا انجام نشد."));
                    try{ transaction.abort(); }catch(e){}
                };
            });

            // حذف خود فاکتور
            salesStore.delete(numericId);

            transaction.oncomplete = function(){ resolve(); };
            transaction.onerror = function(){ reject(new Error("حذف فاکتور انجام نشد.")); };
            transaction.onabort = function(){ reject(new Error("حذف لغو شد.")); };
        });

        alert("فاکتور فروش با موفقیت حذف شد.");
        renderSalesInvoiceList();
        updateDashboard();

    }catch(error){
        console.error(error);
        alert("حذف فاکتور فروش انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}
async function renderSalesInvoiceList(){

    const inventoryPage = document.getElementById("inventoryPage");
    if(!inventoryPage){
        alert("صفحه انبار پیدا نشد.");
        return;
    }

    inventoryPage.innerHTML = `
    <div class="back-btn" onclick="returnToInventoryList()">
        ← بازگشت به انبار
    </div>
    <div class="section-title">📋 فاکتورهای فروش</div>
    <div class="card" style="text-align:center;">
        در حال دریافت فاکتورهای فروش...
    </div>
    `;

    if(!db){
        alert("دیتابیس هنوز آماده نیست.");
        return;
    }

    try{
        const invoices = await new Promise(function(resolve, reject){
            const tx = db.transaction(["salesInvoices"], "readonly");
            const req = tx.objectStore("salesInvoices").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ reject(new Error("دریافت فاکتورهای فروش انجام نشد.")); };
        });

        invoices.sort(function(a, b){
            return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
        });

        if(invoices.length === 0){
            inventoryPage.innerHTML = `
            <div class="back-btn" onclick="returnToInventoryList()">
                ← بازگشت به انبار
            </div>
            <div class="section-title">📋 فاکتورهای فروش</div>
            <div class="card empty">
                هنوز هیچ فاکتور فروشی ثبت نشده است.
            </div>
            `;
            return;
        }

        let html = "";

        invoices.forEach(function(invoice){

            const status = invoice.paymentStatus || "نامشخص";
            let statusClass = "status-unpaid";
            if(status === "پرداخت کامل") statusClass = "status-paid";
            else if(status === "پرداخت ناقص") statusClass = "status-partial";

            html += `
            <div class="card" style="margin-bottom:15px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                    <div>
                        <div class="customer-name">
                            🧾 ${escapeHTML(invoice.internalNumber || ("SL-" + invoice.id))}
                        </div>
                        <div class="customer-info">
                            📅 تاریخ: ${escapeHTML(invoice.date || "-")}
                        </div>
                        <div class="customer-info">
                            👤 مشتری: ${escapeHTML(invoice.customerName || "نامشخص")}
                        </div>
                        <div class="customer-info">
                            وضعیت:
                            <span class="badge ${statusClass}">
                                ${escapeHTML(status)}
                            </span>
                        </div>
                    </div>
                    <div class="badge">فروش</div>
                </div>

                <div class="info-grid" style="margin-top:15px;">
                    <div class="info-box">
                        <div class="info-label">مبلغ کل</div>
                        <div class="info-value">${formatMoney(invoice.totalAmount)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">پرداخت‌شده</div>
                        <div class="info-value">${formatMoney(invoice.paidAmount)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">مانده</div>
                        <div class="info-value">
                            ${formatMoney(
                                Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0))
                            )}
                        </div>
                    </div>
                    <div class="info-box">
    <div class="info-label">تعداد اقلام</div>
    <div class="info-value">
        ${Number(invoice.itemCount || 0).toLocaleString("fa-IR")}
    </div>
</div>
                </div>

                <div class="card-actions" style="margin-top:15px;display:flex;flex-direction:column;gap:8px;">
                    <button class="primary-btn" onclick="viewSalesInvoiceDetails(${invoice.id})">
                        👁️ مشاهده جزئیات
                    </button>
                </div>
            </div>
            `;
        });

        inventoryPage.innerHTML = `
        <div class="back-btn" onclick="returnToInventoryList()">
            ← بازگشت به انبار
        </div>
        <div class="section-title">📋 فاکتورهای فروش</div>
        ${html}
        `;

    }catch(error){
        console.error(error);
        inventoryPage.innerHTML = `
        <div class="back-btn" onclick="returnToInventoryList()">
            ← بازگشت به انبار
        </div>
        <div class="section-title">📋 فاکتورهای فروش</div>
        <div class="card">خطا در دریافت فاکتورهای فروش.</div>
        `;
        alert(error.message || "خطای نامشخص");
    }

}
async function viewSalesInvoiceDetails(invoiceId){

    if(!db){
        alert("دیتابیس هنوز آماده نیست.");
        return;
    }

    try{
        const invoice = await new Promise(function(resolve, reject){
            const tx = db.transaction(["salesInvoices"], "readonly");
            const req = tx.objectStore("salesInvoices").get(Number(invoiceId));
            req.onsuccess = function(){ resolve(req.result); };
            req.onerror = function(){ reject(new Error("دریافت فاکتور انجام نشد.")); };
        });

        if(!invoice){
            alert("فاکتور موردنظر پیدا نشد.");
            return;
        }

        const items = await new Promise(function(resolve, reject){
            const tx = db.transaction(["invoiceItems"], "readonly");
            const req = tx.objectStore("invoiceItems").getAll();
            req.onsuccess = function(){
                resolve(
                    (req.result || []).filter(function(item){
                        return Number(item.invoiceId) === Number(invoiceId);
                    })
                );
            };
            req.onerror = function(){ reject(new Error("دریافت اقلام فاکتور انجام نشد.")); };
        });

        let itemsHTML = "";

        if(items.length === 0){
            itemsHTML = `
            <div class="empty">
                هیچ قلمی برای این فاکتور ثبت نشده است.
            </div>
            `;
        }else{
            items.forEach(function(item, index){
                const quantity = Number(item.quantity || 0);
                const unitPrice = Number(item.unitPrice || item.salePrice || 0);
                const total = Number(item.total || (quantity * unitPrice));

                itemsHTML += `
                <div class="device-card" style="margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                        <div>
                            <div style="font-weight:bold;">
                                ${Number(index + 1).toLocaleString("fa-IR")}.
                                ${escapeHTML(item.productName || "کالای نامشخص")}
                            </div>
                            <div class="customer-info">
                                تعداد: ${quantity.toLocaleString("fa-IR")} عدد
                            </div>
                            <div class="customer-info">
                                قیمت واحد: ${formatMoney(unitPrice)}
                            </div>
                        </div>
                        <div style="font-weight:bold;white-space:nowrap;">
                            ${formatMoney(total)}
                        </div>
                    </div>
                </div>
                `;
            });
        }
        const status = invoice.paymentStatus || "نامشخص";
        let statusClass = "status-unpaid";
        if(status === "پرداخت کامل") statusClass = "status-paid";
        else if(status === "پرداخت ناقص") statusClass = "status-partial";

        const inventoryPage = document.getElementById("inventoryPage");
        if(!inventoryPage) return;

        inventoryPage.innerHTML = `
        <div class="back-btn" onclick="renderSalesInvoiceList()">
            ← بازگشت به فاکتورهای فروش
        </div>

        <div class="section-title">
            🧾 جزئیات فاکتور فروش
        </div>

        <div class="card">

            <div class="customer-name">
                🧾
                ${escapeHTML(invoice.internalNumber || ("SL-" + invoice.id))}
            </div>

            <div class="customer-info">
                📅 تاریخ فاکتور:
                ${escapeHTML(invoice.date || "-")}
            </div>

            <div class="customer-info">
                👤 مشتری:
                ${escapeHTML(invoice.customerName || "ثبت نشده")}
            </div>

            <div class="customer-info">
                وضعیت پرداخت:
                <span class="badge ${statusClass}">
                    ${escapeHTML(status)}
                </span>
            </div>

            ${
                invoice.note
                ? `
                <div class="customer-info">
                    📝 توضیحات:
                    ${escapeHTML(invoice.note)}
                </div>
                `
                : ""
            }
            
<div class="card-actions" style="margin-top:15px;display:flex;flex-direction:column;gap:8px;">
    <button class="primary-btn" onclick="showSalesInvoicePrintPreview(${invoice.id})">
        🖨️ چاپ فاکتور
    </button>
    <button class="edit-btn" onclick="editSalesInvoice(${invoice.id})">
        ✏️ ویرایش فاکتور
    </button>
    <button class="danger-btn" onclick="deleteSalesInvoice(${invoice.id})">
        🗑️ حذف فاکتور فروش
    </button>
</div>
    
        

        </div>

        <div class="section-title">
            📦 اقلام فاکتور
        </div>

        <div class="card">
            ${itemsHTML}
        </div>

        ${
            Number(invoice.laborCost || 0) > 0
            ? `
            <div class="card">
                <div class="customer-info">
                    🔧 اجرت / خدمات:
                    <strong>${formatMoney(invoice.laborCost)}</strong>
                </div>
            </div>
            `
            : ""
        }

        <div class="card">
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                font-size:18px;
                font-weight:bold;
            ">
            <span>مبلغ نهایی فاکتور</span>
                <span>${formatMoney(Number(invoice.totalAmount || 0))}</span>
            </div>

            <div class="customer-info" style="margin-top:12px;">
                پرداخت‌شده: ${formatMoney(invoice.paidAmount)}
            </div>
            <div class="customer-info">
                مانده:
                ${formatMoney(
                    Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0))
                )}
            </div>
        </div>
        `;

    }catch(error){
        console.error("خطا در نمایش جزئیات فاکتور فروش:", error);
        alert(
            "نمایش جزئیات فاکتور انجام نشد.\n\n" +
            (error.message || "خطای نامشخص")
        );
    }
}
function openQuickCustomerForSales(){

    const name = prompt("نام و نام خانوادگی مشتری جدید:");
    if(name === null) return;

    const trimmedName = String(name).trim();
    if(!trimmedName){
        alert("نام مشتری الزامی است.");
        return;
    }

    const phoneRaw = prompt("شماره موبایل (اختیاری):");
    if(phoneRaw === null) return;

    const phone = String(phoneRaw).trim();

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    const tx = db.transaction("customers", "readwrite");
    const store = tx.objectStore("customers");

    const customer = {
        name: trimmedName,
        phone: phone,
        address: "",
        note: "ساخته‌شده از فاکتور فروش",
        createdAt: new Date().toISOString(),
        createdDate: getTodayJalali()
    };

    const req = store.add(customer);

    req.onsuccess = function(){
        const newId = req.result;
        currentSalesCustomerId = newId;

        alert("مشتری «" + trimmedName + "» ثبت شد.");

        // باز کردن دوباره فرم با لیست به‌روز + انتخاب خودکار
        openSalesInvoiceForm().then(function(){
            setTimeout(function(){
                const select = document.getElementById("salesCustomerSelect");
                if(select){
                    select.value = String(newId);
                }
            }, 250);
        });
    };

    req.onerror = function(){
        alert("ثبت مشتری جدید انجام نشد.");
    };
}
function addSalesInvoiceItem(){

    const select = document.getElementById("salesProductSelect");
    const quantityInput = document.getElementById("salesProductQuantity");
    const priceInput = document.getElementById("salesProductUnitPrice");

    if(!select || !quantityInput || !priceInput){
        return;
    }

    const productId = Number(select.value);
    const quantity = Number(quantityInput.value);
    const unitPrice = Number(priceInput.value);

    if(!Number.isInteger(productId) || productId <= 0){
        alert("لطفاً کالا را انتخاب کنید.");
        return;
    }

    if(!Number.isInteger(quantity) || quantity <= 0){
        alert("تعداد نامعتبر است.");
        return;
    }

    if(!Number.isFinite(unitPrice) || unitPrice < 0){
        alert("قیمت فروش نامعتبر است.");
        return;
    }

    const option = select.options[select.selectedIndex];
    const stock = Number(option?.dataset?.stock || 0);

    if(stock < quantity){
        alert(
            "موجودی کافی نیست.\n" +
            "موجودی: " + stock.toLocaleString("fa-IR") + "\n" +
            "درخواستی: " + quantity.toLocaleString("fa-IR")
        );
        return;
    }

    const productName = (option ? option.textContent : "کالا").split("|")[0].trim();

    const existing = currentSalesInvoiceItems.find(function(item){
        return Number(item.productId) === productId && item.fromRepair !== true;
    });

    if(existing){
        existing.quantity = Number(existing.quantity) + quantity;
        existing.unitPrice = unitPrice;
        existing.total = existing.quantity * existing.unitPrice;
    }else{
        currentSalesInvoiceItems.push({
            productId: productId,
            productName: productName,
            quantity: quantity,
            unitPrice: unitPrice,
            total: quantity * unitPrice,
            fromRepair: false
        });
    }

    select.value = "";
    quantityInput.value = "";
    priceInput.value = "";

    renderSalesInvoiceItems();
}


function removeSalesInvoiceItem(index){

    if(
        !Array.isArray(currentSalesInvoiceItems) ||
        index < 0 ||
        index >= currentSalesInvoiceItems.length
    ){
        return;
    }

    currentSalesInvoiceItems.splice(index, 1);
    renderSalesInvoiceItems();
}

function applySalesItemFieldChange(input){

    if(!input) return;

    const index = Number(input.dataset.index);
    const field = input.dataset.field;
    const raw = input.value;

    if(
        !Array.isArray(currentSalesInvoiceItems) ||
        index < 0 ||
        index >= currentSalesInvoiceItems.length
    ){
        return;
    }

    if(field === "quantity"){
        const qty = Number(raw);
        if(!Number.isInteger(qty) || qty <= 0){
            input.value = currentSalesInvoiceItems[index].quantity;
            return;
        }
        currentSalesInvoiceItems[index].quantity = qty;
    }

    if(field === "unitPrice"){
        const price = Number(raw);
        if(!Number.isFinite(price) || price < 0){
            input.value = currentSalesInvoiceItems[index].unitPrice;
            return;
        }
        currentSalesInvoiceItems[index].unitPrice = price;
    }

    const item = currentSalesInvoiceItems[index];
    item.total = Number(item.quantity) * Number(item.unitPrice);

    // به‌روز کردن جمع همان کارت
    const card = input.closest(".product-card");
    if(card){
        const priceEl = card.querySelector(".product-price");
        if(priceEl){
            priceEl.innerHTML = "جمع: " + formatMoney(item.total);
        }
    }

    updateSalesInvoiceTotal();
}


function updateSalesItemQuantity(index, value){

    if(
        !Array.isArray(currentSalesInvoiceItems) ||
        index < 0 ||
        index >= currentSalesInvoiceItems.length
    ){
        return;
    }

    const qty = Number(value);

    if(!Number.isInteger(qty) || qty <= 0){
        // مقدار نامعتبر → رندر دوباره با مقدار قبلی
        renderSalesInvoiceItems();
        return;
    }

    currentSalesInvoiceItems[index].quantity = qty;
    currentSalesInvoiceItems[index].total =
        qty * Number(currentSalesInvoiceItems[index].unitPrice || 0);

    // فقط جمع‌ها را به‌روز کن (بدون رندر کامل تا فوکوس از بین نرود)
    updateSalesInvoiceTotal();

    // جمع همان کارت را هم به‌روز کن
    const cards = document.querySelectorAll("#salesInvoiceItemsContainer .product-card");
    if(cards[index]){
        const priceEl = cards[index].querySelector(".product-price");
        if(priceEl){
            priceEl.innerHTML = "جمع: " + formatMoney(currentSalesInvoiceItems[index].total);
        }
    }
}


function updateSalesItemUnitPrice(index, value){

    if(
        !Array.isArray(currentSalesInvoiceItems) ||
        index < 0 ||
        index >= currentSalesInvoiceItems.length
    ){
        return;
    }

    const price = Number(value);

    if(!Number.isFinite(price) || price < 0){
        renderSalesInvoiceItems();
        return;
    }

    currentSalesInvoiceItems[index].unitPrice = price;
    currentSalesInvoiceItems[index].total =
        Number(currentSalesInvoiceItems[index].quantity || 0) * price;

    updateSalesInvoiceTotal();

    const cards = document.querySelectorAll("#salesInvoiceItemsContainer .product-card");
    if(cards[index]){
        const priceEl = cards[index].querySelector(".product-price");
        if(priceEl){
            priceEl.innerHTML = "جمع: " + formatMoney(currentSalesInvoiceItems[index].total);
        }
    }
}

function renderSalesInvoiceItems(){

    const container = document.getElementById("salesInvoiceItemsContainer");
    if(!container) return;

    if(!Array.isArray(currentSalesInvoiceItems) || currentSalesInvoiceItems.length === 0){
        container.innerHTML = `
            <div class="card">
                <div class="empty">هنوز کالایی به فاکتور اضافه نشده است.</div>
            </div>
        `;
        updateSalesInvoiceTotal();
        return;
    }

    let html = "";

    currentSalesInvoiceItems.forEach(function(item, index){
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;
        const total = qty * price;
        item.total = total;

        html += `
            <div class="product-card" data-index="${index}">
                <div class="product-title">
                    📦 ${escapeHTML(item.productName || "بدون نام")}
                    ${item.fromRepair ? " <span class=\"badge\">از تعمیر</span>" : ""}
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
                    <button type="button" class="danger-btn" onclick="removeSalesInvoiceItem(${index})">
                        حذف
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // اتصال رویدادها بعد از رندر
    container.querySelectorAll("input[data-field]").forEach(function(input){
        input.addEventListener("change", function(){
            applySalesItemFieldChange(this);
        });
        input.addEventListener("blur", function(){
            applySalesItemFieldChange(this);
        });
    });

    updateSalesInvoiceTotal();
}
function updateSalesInvoiceTotal(){

    const totalElement = document.getElementById("salesInvoiceTotal");
    if(!totalElement){
        return;
    }

    let itemsTotal = 0;

    if(Array.isArray(currentSalesInvoiceItems)){
        currentSalesInvoiceItems.forEach(function(item){
            itemsTotal += Number(item.quantity || 0) * Number(item.unitPrice || 0);
        });
    }

    const laborCost = Number(document.getElementById("salesLaborCost")?.value) || 0;
    const total = itemsTotal + laborCost;

    totalElement.innerHTML = "مبلغ کل: " + formatMoney(total);

    updateSalesPaidAmount();
}


function updateSalesPaidAmount(){

    const statusSelect = document.getElementById("salesPaymentStatus");
    const paidInput = document.getElementById("salesPaidAmount");
    const laborInput = document.getElementById("salesLaborCost");

    if(!statusSelect || !paidInput){
        return;
    }

    let itemsTotal = 0;

    if(Array.isArray(currentSalesInvoiceItems)){
        currentSalesInvoiceItems.forEach(function(item){
            itemsTotal += Number(item.quantity || 0) * Number(item.unitPrice || 0);
        });
    }

    const laborCost = Number(laborInput?.value) || 0;
    const total = itemsTotal + laborCost;
    const status = statusSelect.value;

    if(status === "پرداخت کامل"){
        paidInput.value = total;
        paidInput.readOnly = true;
    }else if(status === "پرداخت نشده"){
        paidInput.value = 0;
        paidInput.readOnly = true;
    }else{
        // پرداخت ناقص — مقدار فعلی را حفظ کن و فقط قابل ویرایش بگذار
        paidInput.readOnly = false;

        const currentPaid = Number(paidInput.value) || 0;

        // اگر مبلغ پرداختی از کل بیشتر شده، به کل محدود کن
        if(currentPaid > total){
            paidInput.value = total;
        }
    }
}
