/* PackageYar - Customer Payments */

async function openCustomerPaymentForm(prefill){

    // prefill اختیاری است:
    // { customerId, relatedType: "sales"|"repair"|"general", relatedId }

    if(!db){
        if(typeof showToast === "function"){
            showToast("دیتابیس هنوز آماده نیست.", "error");
        }else{
            alert("دیتابیس هنوز آماده نیست.");
        }
        return;
    }

    prefill = prefill || {};

    try{
        const customers = await new Promise(function(resolve, reject){
            const tx = db.transaction("customers", "readonly");
            const req = tx.objectStore("customers").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ reject(new Error("دریافت مشتریان انجام نشد.")); };
        });

        const sales = await new Promise(function(resolve){
            if(!db.objectStoreNames.contains("salesInvoices")){
                resolve([]);
                return;
            }
            const tx = db.transaction("salesInvoices", "readonly");
            const req = tx.objectStore("salesInvoices").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ resolve([]); };
        });

        const repairs = await new Promise(function(resolve){
            if(!db.objectStoreNames.contains("repairs")){
                resolve([]);
                return;
            }
            const tx = db.transaction("repairs", "readonly");
            const req = tx.objectStore("repairs").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ resolve([]); };
        });

        renderCustomerPaymentForm(customers, sales, repairs, prefill);

    }catch(error){
        console.error(error);
        alert(error.message || "خطا در باز کردن فرم پرداخت.");
    }
}


function renderCustomerPaymentForm(customers, sales, repairs, prefill){

    prefill = prefill || {};

    const page = document.getElementById("inventoryPage") || document.getElementById("settingsPage");
    if(!page){
        alert("صفحه مناسب پیدا نشد.");
        return;
    }

    let customerOptions = `<option value="">انتخاب مشتری</option>`;
    customers
        .sort(function(a, b){ return Number(b.id || 0) - Number(a.id || 0); })
        .forEach(function(c){
            const selected = (Number(prefill.customerId) === Number(c.id)) ? " selected" : "";
            customerOptions += `
                <option value="${c.id}"${selected}>
                    ${escapeHTML(c.name || "بدون نام")}
                    ${c.phone ? " — " + "\u200E" + escapeHTML(c.phone) : ""}
                </option>`;
        });

    let salesOptions = `<option value="">— بدون انتخاب (اختیاری) —</option>`;
    (sales || [])
        .sort(function(a, b){ return Number(b.id || 0) - Number(a.id || 0); })
        .forEach(function(s){
            const remain = Math.max(0, Number(s.totalAmount || 0) - Number(s.paidAmount || 0));
            const selected = (prefill.relatedType === "sales" && Number(prefill.relatedId) === Number(s.id)) ? " selected" : "";
            salesOptions += `
                <option value="${s.id}" data-customer-id="${s.customerId || ""}"${selected}>
                    ${escapeHTML(s.internalNumber || ("SL-" + s.id))}
                    — ${escapeHTML(s.customerName || "")}
                    — مانده: ${typeof formatMoney === "function" ? formatMoney(remain) : remain}
                </option>`;
        });

    let repairOptions = `<option value="">— بدون انتخاب (اختیاری) —</option>`;
    (repairs || [])
        .sort(function(a, b){ return Number(b.id || 0) - Number(a.id || 0); })
        .forEach(function(r){
            const remain = Math.max(0, Number(r.totalCost || 0) - Number(r.paidAmount || 0));
            const selected = (prefill.relatedType === "repair" && Number(prefill.relatedId) === Number(r.id)) ? " selected" : "";
            repairOptions += `
                <option value="${r.id}" data-customer-id="${r.customerId || ""}"${selected}>
                    تعمیر #${r.id}
                    — مانده: ${typeof formatMoney === "function" ? formatMoney(remain) : remain}
                </option>`;
        });

    const today = (typeof getTodayJalali === "function") ? getTodayJalali() : "";
    const relatedType = prefill.relatedType || "general";
    const showSales = relatedType === "sales";
    const showRepair = relatedType === "repair";

    page.innerHTML = `
    <div class="back-btn" onclick="if(typeof openOutstandingPaymentsModal==='function'){openOutstandingPaymentsModal();}else if(typeof showPage==='function'){showPage('dashboardPage');}">
        ← بازگشت
    </div>

    <div class="section-title">📥 ثبت پرداخت مشتری</div>

    <div class="card">

        <div class="form-group">
            <label>مشتری *</label>
            <select id="paymentCustomerSelect">
                ${customerOptions}
            </select>
        </div>

        <div class="form-group">
            <label>مبلغ پرداختی (تومان) *</label>
            <input type="number" id="paymentAmount" min="1" step="1" inputmode="numeric" placeholder="مثلاً ۵۰۰۰۰۰">
        </div>

        <div class="form-group">
            <label>تاریخ پرداخت</label>
            <input type="text" id="paymentDate" value="${today}" readonly>
        </div>

        <div class="form-group">
            <label>توضیحات (اختیاری)</label>
            <textarea id="paymentNote" placeholder="مثلاً بابت بدهی قبلی"></textarea>
        </div>

        <div class="form-group">
            <label>وصل به فاکتور (اختیاری)</label>
            <select id="paymentRelatedType">
                <option value="general"${relatedType === "general" ? " selected" : ""}>بدون فاکتور (عمومی)</option>
                <option value="sales"${relatedType === "sales" ? " selected" : ""}>فاکتور فروش</option>
                <option value="repair"${relatedType === "repair" ? " selected" : ""}>فاکتور تعمیر</option>
            </select>
        </div>

        <div class="form-group" id="paymentSalesContainer" style="display:${showSales ? "block" : "none"};">
            <label>انتخاب فاکتور فروش (اختیاری)</label>
            <select id="paymentSalesSelect">
                ${salesOptions}
            </select>
        </div>

        <div class="form-group" id="paymentRepairContainer" style="display:${showRepair ? "block" : "none"};">
            <label>انتخاب فاکتور تعمیر (اختیاری)</label>
            <select id="paymentRepairSelect">
                ${repairOptions}
            </select>
        </div>

        <button type="button" class="primary-btn" style="width:100%;" onclick="saveCustomerPayment()">
            💾 ثبت پرداخت
        </button>

    </div>
    `;

    const typeSelect = document.getElementById("paymentRelatedType");
    const salesContainer = document.getElementById("paymentSalesContainer");
    const repairContainer = document.getElementById("paymentRepairContainer");

    if(typeSelect){
        typeSelect.onchange = function(){
            const type = typeSelect.value;
            if(salesContainer) salesContainer.style.display = (type === "sales") ? "block" : "none";
            if(repairContainer) repairContainer.style.display = (type === "repair") ? "block" : "none";
        };
    }

        // فقط نمایش صفحه؛ showPage نزن تا returnToInventoryList محتوای بدهکاران را پاک نکند
    document.querySelectorAll(".page").forEach(function(p){
        p.classList.remove("active");
    });
    page.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(function(item){
        item.classList.remove("active");
    });
}




async function saveCustomerPayment(){

    if(!db){
        if(typeof showToast === "function"){
            showToast("دیتابیس آماده نیست.", "error");
        }else{
            alert("دیتابیس آماده نیست.");
        }
        return;
    }

    const customerSelect = document.getElementById("paymentCustomerSelect");
    const customerId = Number(customerSelect?.value || 0);
    const amount = Number(document.getElementById("paymentAmount")?.value) || 0;
    const date = document.getElementById("paymentDate")?.value || (typeof getTodayJalali === "function" ? getTodayJalali() : "");
    const note = String(document.getElementById("paymentNote")?.value || "").trim();
    const relatedType = document.getElementById("paymentRelatedType")?.value || "general";

    let relatedId = null;
    if(relatedType === "sales"){
        relatedId = Number(document.getElementById("paymentSalesSelect")?.value) || null;
        if(!relatedId) relatedId = null;
    }else if(relatedType === "repair"){
        relatedId = Number(document.getElementById("paymentRepairSelect")?.value) || null;
        if(!relatedId) relatedId = null;
    }

    // اعتبارسنجی
    if(!Number.isInteger(customerId) || customerId <= 0){
        if(typeof showToast === "function") showToast("لطفاً مشتری را انتخاب کنید.", "error");
        else alert("لطفاً مشتری را انتخاب کنید.");
        return;
    }

    if(!Number.isFinite(amount) || amount <= 0){
        if(typeof showToast === "function") showToast("مبلغ پرداختی نامعتبر است.", "error");
        else alert("مبلغ پرداختی نامعتبر است.");
        return;
    }

    // نام مشتری
    let customerName = "مشتری";
    if(customerSelect && customerSelect.selectedIndex >= 0){
        const text = customerSelect.options[customerSelect.selectedIndex].textContent || "";
        customerName = text.split("—")[0].trim() || "مشتری";
    }

    const confirmed = confirm(
        "آیا پرداخت ثبت شود؟\n\n" +
        "مشتری: " + customerName + "\n" +
        "مبلغ: " + (typeof formatMoney === "function" ? formatMoney(amount) : amount) + "\n" +
        "تاریخ: " + date
    );
    if(!confirmed) return;

    try{
        const now = new Date();

        // ۱) ثبت رکورد پرداخت
        await new Promise(function(resolve, reject){
            const tx = db.transaction(["customerPayments"], "readwrite");
            const store = tx.objectStore("customerPayments");

            store.add({
                customerId: customerId,
                customerName: customerName,
                amount: amount,
                date: date,
                note: note,
                relatedType: relatedType,   // general | sales | repair
                relatedId: relatedId,       // null یا شناسه فاکتور
                createdAt: now.toISOString()
            });

            tx.oncomplete = function(){ resolve(); };
            tx.onerror = function(){ reject(new Error("ثبت پرداخت انجام نشد.")); };
            tx.onabort = function(){ reject(new Error("ثبت پرداخت لغو شد.")); };
        });

        // ۲) اگر به فاکتور وصل شده بود، paidAmount همان فاکتور را زیاد کن
        if(relatedType === "sales" && relatedId){
            await updateInvoicePaidAmount("salesInvoices", relatedId, amount);
        }else if(relatedType === "repair" && relatedId){
            await updateInvoicePaidAmount("repairs", relatedId, amount, true);
        }

        if(typeof updateDashboard === "function"){
            updateDashboard();
        }

        alert(
            "پرداخت با موفقیت ثبت شد.\n" +
            "مبلغ: " + (typeof formatMoney === "function" ? formatMoney(amount) : amount)
        );

        // برگشت
        if(typeof returnToInventoryList === "function"){
            returnToInventoryList();
        }else if(typeof showPage === "function"){
            showPage("dashboardPage");
        }

    }catch(error){
        console.error(error);
        alert("ثبت پرداخت انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}


// به‌روزرسانی مبلغ پرداخت‌شده فاکتور (فروش یا تعمیر)
async function updateInvoicePaidAmount(storeName, invoiceId, payAmount, isRepair){

    if(!db || !db.objectStoreNames.contains(storeName)) return;

    const numericId = Number(invoiceId);
    if(!Number.isInteger(numericId) || numericId <= 0) return;

    await new Promise(function(resolve, reject){
        const tx = db.transaction([storeName], "readwrite");
        const store = tx.objectStore(storeName);
        const getReq = store.get(numericId);

        getReq.onsuccess = function(){
            const inv = getReq.result;
            if(!inv){
                resolve();
                return;
            }

            const total = isRepair
                ? Number(inv.totalCost || 0)
                : Number(inv.totalAmount || 0);

            const oldPaid = Number(inv.paidAmount || 0);
            const newPaid = oldPaid + Number(payAmount || 0);

            inv.paidAmount = newPaid;

            if(newPaid >= total && total > 0){
                inv.paymentStatus = "پرداخت کامل";
            }else if(newPaid > 0){
                inv.paymentStatus = "پرداخت ناقص";
            }else{
                inv.paymentStatus = "پرداخت نشده";
            }

            inv.updatedAt = new Date().toISOString();
            store.put(inv);
        };

        getReq.onerror = function(){ reject(new Error("دریافت فاکتور انجام نشد.")); };

        tx.oncomplete = function(){ resolve(); };
        tx.onerror = function(){ reject(new Error("به‌روزرسانی فاکتور انجام نشد.")); };
    });
}
async function openOutstandingPaymentsModal(){

    if(!db){
        if(typeof showToast === "function"){
            showToast("دیتابیس آماده نیست.", "error");
        }else{
            alert("دیتابیس آماده نیست.");
        }
        return;
    }

    try{
        const sales = await new Promise(function(resolve){
            if(!db.objectStoreNames.contains("salesInvoices")){
                resolve([]);
                return;
            }
            const tx = db.transaction("salesInvoices", "readonly");
            const req = tx.objectStore("salesInvoices").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ resolve([]); };
        });

        const repairs = await new Promise(function(resolve){
            if(!db.objectStoreNames.contains("repairs")){
                resolve([]);
                return;
            }
            const tx = db.transaction("repairs", "readonly");
            const req = tx.objectStore("repairs").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ resolve([]); };
        });

        const customers = await new Promise(function(resolve){
            if(!db.objectStoreNames.contains("customers")){
                resolve([]);
                return;
            }
            const tx = db.transaction("customers", "readonly");
            const req = tx.objectStore("customers").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ resolve([]); };
        });

        renderOutstandingPaymentsPage(sales, repairs, customers);

    }catch(error){
        console.error(error);
        alert("خطا در باز کردن بدهکاران.\n\n" + (error.message || "خطای نامشخص"));
    }
}


function renderOutstandingPaymentsPage(sales, repairs, customers){

    const page = document.getElementById("inventoryPage") || document.getElementById("settingsPage");
    if(!page){
        alert("صفحه مناسب پیدا نشد.");
        return;
    }

    // map برای پیدا کردن سریع نام مشتری
    const customerMap = {};
    (customers || []).forEach(function(c){
        customerMap[Number(c.id)] = c;
    });

    const unpaidSales = (sales || []).filter(function(s){
        const remain = Math.max(0, Number(s.totalAmount || 0) - Number(s.paidAmount || 0));
        return remain > 0;
    }).sort(function(a, b){
        return Number(b.id || 0) - Number(a.id || 0);
    });

    const unpaidRepairs = (repairs || []).filter(function(r){
        const remain = Math.max(0, Number(r.totalCost || 0) - Number(r.paidAmount || 0));
        return remain > 0;
    }).sort(function(a, b){
        return Number(b.id || 0) - Number(a.id || 0);
    });

    let salesHTML = "";
    if(unpaidSales.length === 0){
        salesHTML = `<div class="empty" style="padding:15px;">فاکتور فروش با مانده وجود ندارد.</div>`;
    }else{
        unpaidSales.forEach(function(s){
            const remain = Math.max(0, Number(s.totalAmount || 0) - Number(s.paidAmount || 0));
            salesHTML += `
                <div class="card" style="margin-bottom:12px;">
                    <div class="customer-name">🧾 ${escapeHTML(s.internalNumber || ("SL-" + s.id))}</div>
                    <div class="customer-info">👤 ${escapeHTML(s.customerName || "—")}</div>
                    <div class="customer-info">📅 ${escapeHTML(s.date || "—")}</div>
                    <div class="customer-info" style="color:#dc2626;font-weight:bold;">
                        مانده: ${typeof formatMoney === "function" ? formatMoney(remain) : remain}
                    </div>
                    <button type="button" class="primary-btn" style="width:100%;margin-top:10px;"
                        onclick="openCustomerPaymentForm({ customerId: ${Number(s.customerId) || 0}, relatedType: 'sales', relatedId: ${Number(s.id)} })">
                        📥 ثبت پرداخت
                    </button>
                </div>
            `;
        });
    }

    let repairsHTML = "";
    if(unpaidRepairs.length === 0){
        repairsHTML = `<div class="empty" style="padding:15px;">تعمیر با مانده وجود ندارد.</div>`;
    }else{
        unpaidRepairs.forEach(function(r){
            const remain = Math.max(0, Number(r.totalCost || 0) - Number(r.paidAmount || 0));
            const customer = customerMap[Number(r.customerId)] || null;
            const customerName = customer ? (customer.name || "بدون نام") : "—";

            repairsHTML += `
                <div class="card" style="margin-bottom:12px;">
                    <div class="customer-name">🔧 تعمیر #${r.id}</div>
                    <div class="customer-info">👤 ${escapeHTML(customerName)}</div>
                    <div class="customer-info">📅 ${escapeHTML(r.date || "—")}</div>
                    <div class="customer-info" style="color:#dc2626;font-weight:bold;">
                        مانده: ${typeof formatMoney === "function" ? formatMoney(remain) : remain}
                    </div>
                    <button type="button" class="primary-btn" style="width:100%;margin-top:10px;"
                        onclick="openCustomerPaymentForm({ customerId: ${Number(r.customerId) || 0}, relatedType: 'repair', relatedId: ${Number(r.id)} })">
                        📥 ثبت پرداخت
                    </button>
                </div>
            `;
        });
    }

    page.innerHTML = `
       <div class="back-btn" onclick="if(typeof showPage==='function'){showPage('dashboardPage');}">
    ← بازگشت
</div>

        <div class="section-title">💰 بدهکاران</div>

        <div class="section-title" style="font-size:15px;margin-top:10px;">فاکتورهای فروش با مانده</div>
        ${salesHTML}

        <div class="section-title" style="font-size:15px;margin-top:22px;">تعمیرات با مانده</div>
        ${repairsHTML}
    `;
    // فقط نمایش صفحه؛ showPage نزن تا returnToInventoryList محتوای بدهکاران را پاک نکند
    document.querySelectorAll(".page").forEach(function(p){
        p.classList.remove("active");
    });
    page.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(function(item){
        item.classList.remove("active");
    });
}