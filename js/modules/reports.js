/* PackageYar - Reports Module */

async function openReportsPage(){

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    const page = document.getElementById("settingsPage");
    if(!page) return;

    page.innerHTML = `
        <div class="back-btn" onclick="renderSettingsPage()">
            ← بازگشت به تنظیمات
        </div>

        <div class="section-title">📊 گزارش‌ها</div>

        <div class="card" id="reportsSummary">
            <div class="empty">در حال محاسبه...</div>
        </div>

        <div class="section-title" style="margin-top:20px;">🔩 قطعات پرمصرف</div>
        <div id="reportsTopParts"></div>
    `;

    try{
        const [repairs, sales, products, invoiceItems] = await Promise.all([
            getAllFromStore("repairs"),
            getAllFromStore("salesInvoices"),
            getAllFromStore("products"),
            getAllFromStore("invoiceItems")
        ]);

        const today = getTodayJalali();
        const currentMonth = today.substring(0, 7); // YYYY/MM

        // ----- فروش -----
        let salesToday = 0;
        let salesMonth = 0;
        let salesPaidToday = 0;
        let salesPaidMonth = 0;

        sales.forEach(function(s){
            const date = s.date || "";
            const total = Number(s.totalAmount || 0);
            const paid = Number(s.paidAmount || 0);

            if(date === today){
                salesToday += total;
                salesPaidToday += paid;
            }
            if(date.startsWith(currentMonth)){
                salesMonth += total;
                salesPaidMonth += paid;
            }
        });

        // ----- تعمیرات -----
        let repairsToday = 0;
        let repairsMonth = 0;
        let repairTotalToday = 0;
        let repairTotalMonth = 0;
        let repairPaidToday = 0;
        let repairPaidMonth = 0;

        repairs.forEach(function(r){
            const date = r.date || "";
            const total = Number(r.totalCost || 0);
            const paid = Number(r.paidAmount || 0);

            if(date === today){
                repairsToday++;
                repairTotalToday += total;
                repairPaidToday += paid;
            }
            if(date.startsWith(currentMonth)){
                repairsMonth++;
                repairTotalMonth += total;
                repairPaidMonth += paid;
            }
        });

        // ----- مانده مشتریان -----
        let totalBalance = 0;

        repairs.forEach(function(r){
            totalBalance += Math.max(0, Number(r.totalCost || 0) - Number(r.paidAmount || 0));
        });
        sales.forEach(function(s){
            totalBalance += Math.max(0, Number(s.totalAmount || 0) - Number(s.paidAmount || 0));
        });

        // ----- نمایش خلاصه -----
        const summary = document.getElementById("reportsSummary");
        if(summary){
            summary.innerHTML = `
                <div class="info-grid">
                    <div class="info-box">
                        <div class="info-label">فروش امروز</div>
                        <div class="info-value">${formatMoney(salesToday)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">دریافتی فروش امروز</div>
                        <div class="info-value">${formatMoney(salesPaidToday)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">فروش این ماه</div>
                        <div class="info-value">${formatMoney(salesMonth)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">دریافتی فروش ماه</div>
                        <div class="info-value">${formatMoney(salesPaidMonth)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">تعمیرات امروز</div>
                        <div class="info-value">${repairsToday.toLocaleString("fa-IR")} مورد</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">مبلغ تعمیرات امروز</div>
                        <div class="info-value">${formatMoney(repairTotalToday)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">تعمیرات این ماه</div>
                        <div class="info-value">${repairsMonth.toLocaleString("fa-IR")} مورد</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">مبلغ تعمیرات ماه</div>
                        <div class="info-value">${formatMoney(repairTotalMonth)}</div>
                    </div>
                    <div class="info-box" style="grid-column:1/-1;">
                        <div class="info-label">مجموع مانده مشتریان</div>
                        <div class="info-value" style="color:${totalBalance > 0 ? "#dc2626" : "#16a34a"};">
                            ${formatMoney(totalBalance)}
                        </div>
                    </div>
                </div>
            `;
        }

        // ----- قطعات پرمصرف -----
        const partUsage = {};

        // از اقلام فاکتور فروش
        invoiceItems.forEach(function(item){
            if(item.invoiceType && item.invoiceType !== "فروش") return;
            const pid = Number(item.productId);
            if(!pid) return;
            const qty = Number(item.quantity) || 0;
            if(!partUsage[pid]){
                partUsage[pid] = {
                    productId: pid,
                    name: item.productName || "بدون نام",
                    quantity: 0
                };
            }
            partUsage[pid].quantity += qty;
            if(item.productName) partUsage[pid].name = item.productName;
        });

        // از قطعات تعمیر (اگر در خود repair ذخیره شده)
        repairs.forEach(function(r){
            if(!Array.isArray(r.parts)) return;
            r.parts.forEach(function(p){
                const pid = Number(p.productId);
                if(!pid) return;
                const qty = Number(p.quantity) || 0;
                if(!partUsage[pid]){
                    partUsage[pid] = {
                        productId: pid,
                        name: p.productName || "بدون نام",
                        quantity: 0
                    };
                }
                partUsage[pid].quantity += qty;
            });
        });

        const topParts = Object.values(partUsage)
            .filter(function(p){ return p.quantity > 0; })
            .sort(function(a, b){ return b.quantity - a.quantity; })
            .slice(0, 5);

        const topContainer = document.getElementById("reportsTopParts");
        if(topContainer){
            if(topParts.length === 0){
                topContainer.innerHTML = `
                    <div class="card">
                        <div class="empty">هنوز قطعه مصرف‌شده‌ای ثبت نشده است.</div>
                    </div>
                `;
            }else{
                let html = "";
                topParts.forEach(function(p, i){
                    html += `
                        <div class="product-card">
                            <div class="product-title">
                                ${i + 1}. ${escapeHTML(p.name)}
                            </div>
                            <div class="product-meta">
                                تعداد مصرف: ${Number(p.quantity).toLocaleString("fa-IR")}
                            </div>
                        </div>
                    `;
                });
                topContainer.innerHTML = html;
            }
        }

    }catch(error){
        console.error(error);
        const summary = document.getElementById("reportsSummary");
        if(summary){
            summary.innerHTML = `
                <div class="empty">خطا در محاسبه گزارش‌ها.</div>
            `;
        }
    }
}


function getAllFromStore(storeName){
    return new Promise(function(resolve){
        if(!db || !db.objectStoreNames.contains(storeName)){
            resolve([]);
            return;
        }
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = function(){ resolve(req.result || []); };
        req.onerror = function(){ resolve([]); };
    });
}
