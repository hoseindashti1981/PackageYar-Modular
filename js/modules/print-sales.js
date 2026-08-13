async function showSalesInvoicePrintPreview(invoiceId){

    const inventoryPage = document.getElementById("inventoryPage");
    if(!inventoryPage){
        alert("صفحه انبار پیدا نشد.");
        return;
    }

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
        // ---------- تنظیمات ----------
        const appName = await getSetting("appName") || "پکیج‌یار";
        const appSubtitle = await getSetting("appSubtitle") || "سیستم مدیریت تعمیرکار پکیج";
        const appLogo = await getSetting("appLogo") || "";
        const businessPhone = await getSetting("businessPhone") || "";
        const businessAddress = await getSetting("businessAddress") || "";
        const shopStamp = await getSetting("shopStamp") || "";
        // ---------- فاکتور ----------
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

        // ---------- اقلام ----------
        const items = await new Promise(function(resolve, reject){
            const tx = db.transaction(["invoiceItems"], "readonly");
            const req = tx.objectStore("invoiceItems").getAll();
            req.onsuccess = function(){
                resolve(
                    (req.result || []).filter(function(item){
                        return Number(item.invoiceId) === numericId;
                    })
                );
            };
            req.onerror = function(){ reject(new Error("دریافت اقلام انجام نشد.")); };
        });

        // ---------- مشتری ----------
        let customer = null;
        if(invoice.customerId){
            customer = await new Promise(function(resolve){
                const tx = db.transaction(["customers"], "readonly");
                const req = tx.objectStore("customers").get(Number(invoice.customerId));
                req.onsuccess = function(){ resolve(req.result || null); };
                req.onerror = function(){ resolve(null); };
            });
        }

        const customerName = (customer && customer.name) || invoice.customerName || "—";
        const customerPhone = (customer && customer.phone) || "—";
        const customerAddress = (customer && customer.address) || "—";

        // ---------- محصولات (برای کد کالا) ----------
        const products = await getAllProductsForPurchase().catch(function(){ return []; });
        const productMap = new Map();
        products.forEach(function(p){
            productMap.set(Number(p.id), p);
        });

        // ---------- محاسبات ----------
               const itemsTotal = Number(invoice.itemsTotal != null ? invoice.itemsTotal : 0);
        const laborCost = Number(invoice.laborCost || 0);
        const discount = Number(invoice.discount || 0);
        const transportCost = Number(invoice.transportCost || 0);
        const totalAmount = Number(invoice.totalAmount || 0);
        const paidAmount = Number(invoice.paidAmount || 0);
        const remaining = Math.max(0, totalAmount - paidAmount);
        const paymentStatus = invoice.paymentStatus || "نامشخص";

        // ---------- لوگو ----------
        const logoHTML = appLogo
            ? `<div class="sales-print-logo"><img src="${appLogo}" alt="لوگوی ${escapeHTML(appName)}"></div>`
            : "";

       const stampHTML = shopStamp
    ? `
        <div class="sales-print-stamp">
            <img
                src="${shopStamp}"
                alt="مهر فروشگاه"
            >
        </div>
      `
    : "";
       
            // ---------- ردیف اقلام ----------
        let itemsRows = "";
        if(items.length === 0){
            itemsRows = `
                <tr>
                    <td colspan="6" style="text-align:center;">قلمی ثبت نشده است</td>
                </tr>
            `;
        }else{
            items.forEach(function(item, index){
                const qty = Number(item.quantity || 0);
                const unitPrice = Number(item.unitPrice || item.salePrice || 0);
                const lineTotal = Number(item.total != null ? item.total : (qty * unitPrice));
                const product = productMap.get(Number(item.productId));
                const code = (product && product.code) ? product.code : "—";

                itemsRows += `
                    <tr>
                        <td>${Number(index + 1).toLocaleString("fa-IR")}</td>
                        <td class="item-name">${escapeHTML(item.productName || "کالا")}</td>
                        <td>${escapeHTML(code)}</td>
                        <td>${qty.toLocaleString("fa-IR")}</td>
                        <td>${formatMoney(unitPrice)}</td>
                        <td>${formatMoney(lineTotal)}</td>
                    </tr>
                `;
            });
        }

        // ---------- تماس و آدرس کسب‌وکار ----------
        let companyExtra = "";
        if(businessPhone){
            companyExtra += "تلفن: " + escapeHTML(businessPhone) + "<br>";
        }
        if(businessAddress){
            companyExtra += "آدرس: " + escapeHTML(businessAddress);
        }

        // ---------- توضیحات ----------
        const noteHTML = invoice.note
            ? `
                <div class="sales-print-note">
                    <div class="sales-print-note-title">توضیحات</div>
                    <div class="sales-print-note-text">${escapeHTML(invoice.note)}</div>
                </div>
            `
            : "";

        // ---------- رندر ----------
        inventoryPage.innerHTML = `
        <div class="back-btn sales-print-no-print" onclick="viewSalesInvoiceDetails(${numericId})">
            ← بازگشت به جزئیات فاکتور
        </div>

        <div class="section-title sales-print-no-print">
            🖨️ پیش‌نمایش چاپ فاکتور فروش
        </div>

        <div class="sales-print-no-print" style="margin-bottom:15px;">
            <button type="button" class="primary-btn" style="width:100%;margin-bottom:10px;"
                onclick="window.print()">
                🖨️ چاپ / ذخیره PDF
            </button>
            <button type="button" class="primary-btn" style="width:100%;"
                onclick="viewSalesInvoiceDetails(${numericId})">
                ← بازگشت
            </button>
        </div>

        <div class="sales-print-preview">
            <div class="sales-print-invoice">

                <div class="sales-print-header">
                    ${logoHTML}
                    <div class="sales-print-company">
                        <div class="sales-print-company-name">
                            ${escapeHTML(appName)}
                        </div>
                        <div class="sales-print-company-subtitle">
                            ${escapeHTML(appSubtitle)}
                            ${companyExtra ? "<br>" + companyExtra : ""}
                        </div>
                    </div>
                    <div class="sales-print-title-box">
                        <div class="sales-print-title">فاکتور فروش</div>
                        <div class="sales-print-invoice-number">
                            شماره: ${escapeHTML(invoice.internalNumber || ("SL-" + invoice.id))}
                        </div>
                    </div>
                </div>

                <div class="sales-print-meta">
                    <div class="sales-print-meta-item">
                        <span class="sales-print-meta-label">تاریخ:</span>
                        <span>${escapeHTML(invoice.date || "—")}</span>
                    </div>
                    <div class="sales-print-meta-item">
                        <span class="sales-print-meta-label">وضعیت:</span>
                        <span>${escapeHTML(paymentStatus)}</span>
                    </div>
                </div>

                <div class="sales-print-customer">
                    <div class="sales-print-section-title">اطلاعات مشتری</div>
                    <div class="sales-print-customer-grid">
                        <div class="sales-print-customer-item">
                            <span class="sales-print-label">نام:</span>
                            ${escapeHTML(customerName)}
                        </div>
                                                <div class="sales-print-customer-item">
                            <span class="sales-print-label">تلفن:</span>
                            <span dir="ltr" style="unicode-bidi: isolate; display: inline-block;">
                                ${escapeHTML(customerPhone)}
                            </span>
                        </div>
                        <div class="sales-print-customer-item">
                            <span class="sales-print-label">آدرس:</span>
                            ${escapeHTML(customerAddress)}
                        </div>
                    </div>
                </div>

                <div class="sales-print-items">
                    <div class="sales-print-section-title">اقلام فاکتور</div>
                    <table>
                        <thead>
                            <tr>
                                <th>ردیف</th>
                                <th>شرح کالا</th>
                                <th>کد کالا</th>
                                <th>تعداد</th>
                                <th>قیمت واحد</th>
                                <th>مبلغ کل</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsRows}
                        </tbody>
                    </table>
                </div>

                                <div class="sales-print-summary">
                    <div class="sales-print-summary-row">
                        <span class="sales-print-summary-label">جمع کالاها</span>
                        <span>${formatMoney(itemsTotal)}</span>
                    </div>
                    <div class="sales-print-summary-row">
                        <span class="sales-print-summary-label">اجرت / خدمات</span>
                        <span>${formatMoney(laborCost)}</span>
                    </div>
                    <div class="sales-print-summary-row">
                        <span class="sales-print-summary-label">ایاب و ذهاب</span>
                        <span>${formatMoney(transportCost)}</span>
                    </div>
                    <div class="sales-print-summary-row">
                        <span class="sales-print-summary-label">تخفیف</span>
                        <span>${formatMoney(discount)}</span>
                    </div>
                    <div class="sales-print-summary-row sales-print-summary-total">
                        <span>مبلغ کل</span>
                        <span>${formatMoney(totalAmount)}</span>
                    </div>
                    <div class="sales-print-summary-row">
                        <span class="sales-print-summary-label">پرداخت‌شده</span>
                        <span>${formatMoney(paidAmount)}</span>
                    </div>
                    <div class="sales-print-summary-row">
                        <span class="sales-print-summary-label">مانده</span>
                        <span>${formatMoney(remaining)}</span>
                    </div>
                </div>

                <div class="sales-print-payment-status">
                    وضعیت پرداخت: ${escapeHTML(paymentStatus)}
                </div>

                ${noteHTML}

                <div class="sales-print-footer">

    <div class="sales-print-thanks-area">
        <div class="sales-print-thanks">
            از اعتماد شما سپاسگزاریم
        </div>

        ${stampHTML}
    </div>

    <div class="sales-print-signature">
        امضاء فروشنده<br><br>........................
    </div>

    <div class="sales-print-signature">
        امضاء مشتری<br><br>........................
    </div>

</div>
</div>
</div>
            </div>
        </div>
        `;

    }catch(error){
        console.error(error);
        alert("پیش‌نمایش چاپ انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}
