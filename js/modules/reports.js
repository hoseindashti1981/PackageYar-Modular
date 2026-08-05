/* PackageYar - Reports Module */

async function openReportsPage(){

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }
if(typeof showPage === "function"){
    showPage("settingsPage");
}
    const page = document.getElementById("settingsPage");
    if(!page) return;

    const today = getTodayJalali();

    page.innerHTML = `
        <div class="back-btn" onclick="renderSettingsPage()">
            ← بازگشت به تنظیمات
        </div>

        <div class="section-title">📊 گزارش‌ها</div>

        <div class="card">
            <div class="form-group">
                <label>از تاریخ</label>
                <input type="text" id="reportFromDate" value="${today}" placeholder="مثلاً 1404/05/01">
            </div>
            <div class="form-group">
                <label>تا تاریخ</label>
                <input type="text" id="reportToDate" value="${today}" placeholder="مثلاً 1404/05/31">
            </div>
            <button class="primary-btn" style="width:100%;" onclick="runReportsFilter()">
                اعمال فیلتر
            </button>
            <button class="secondary-btn" style="width:100%;margin-top:8px;" onclick="runReportsThisMonth()">
                گزارش این ماه
            </button>
            <button class="secondary-btn" style="width:100%;margin-top:8px;" onclick="runReportsToday()">
                گزارش امروز
            </button>
        </div>

        <div class="card" id="reportsSummary" style="margin-top:15px;">
            <div class="empty">در حال محاسبه...</div>
        </div>

        <div class="section-title" style="margin-top:20px;">🔩 قطعات پرمصرف (در بازه)</div>
        <div id="reportsTopParts"></div>
    `;

    // پیش‌فرض: امروز
    await calculateAndRenderReports(today, today);
}


function runReportsFilter(){
    const from = (document.getElementById("reportFromDate")?.value || "").trim();
    const to = (document.getElementById("reportToDate")?.value || "").trim();

    if(!from || !to){
        alert("لطفاً هر دو تاریخ را وارد کنید.");
        return;
    }

    calculateAndRenderReports(from, to);
}


function runReportsToday(){
    const today = getTodayJalali();
    const fromInput = document.getElementById("reportFromDate");
    const toInput = document.getElementById("reportToDate");
    if(fromInput) fromInput.value = today;
    if(toInput) toInput.value = today;
    calculateAndRenderReports(today, today);
}


function runReportsThisMonth(){
    const today = getTodayJalali();
    const monthStart = today.substring(0, 7) + "/01";
    const fromInput = document.getElementById("reportFromDate");
    const toInput = document.getElementById("reportToDate");
    if(fromInput) fromInput.value = monthStart;
    if(toInput) toInput.value = today;
    calculateAndRenderReports(monthStart, today);
}


async function calculateAndRenderReports(fromDate, toDate){

    const summary = document.getElementById("reportsSummary");
    const topContainer = document.getElementById("reportsTopParts");

    if(summary){
        summary.innerHTML = `<div class="empty">در حال محاسبه...</div>`;
    }

    try{
        const [repairs, sales, invoiceItems] = await Promise.all([
            getAllFromStore("repairs"),
            getAllFromStore("salesInvoices"),
            getAllFromStore("invoiceItems")
        ]);

        function inRange(date){
            if(!date) return false;
            return date >= fromDate && date <= toDate;
        }

        // ----- فروش -----
        let salesTotal = 0;
        let salesPaid = 0;
        let salesCount = 0;

        sales.forEach(function(s){
            if(!inRange(s.date || "")) return;
            salesCount++;
            salesTotal += Number(s.totalAmount || 0);
            salesPaid += Number(s.paidAmount || 0);
        });

        // ----- تعمیرات -----
        let repairsCount = 0;
        let repairTotal = 0;
        let repairPaid = 0;

        repairs.forEach(function(r){
            if(!inRange(r.date || "")) return;
            repairsCount++;
            repairTotal += Number(r.totalCost || 0);
            repairPaid += Number(r.paidAmount || 0);
        });

        // ----- مانده کل مشتریان (همیشه کلی، نه فقط بازه) -----
        let totalBalance = 0;
        repairs.forEach(function(r){
            totalBalance += Math.max(0, Number(r.totalCost || 0) - Number(r.paidAmount || 0));
        });
        sales.forEach(function(s){
            totalBalance += Math.max(0, Number(s.totalAmount || 0) - Number(s.paidAmount || 0));
        });

        if(summary){
            summary.innerHTML = `
                <div style="font-size:13px;color:#666;margin-bottom:12px;">
                    بازه: ${escapeHTML(fromDate)} تا ${escapeHTML(toDate)}
                </div>
                <div class="info-grid">
                    <div class="info-box">
                        <div class="info-label">تعداد فاکتور فروش</div>
                        <div class="info-value">${salesCount.toLocaleString("fa-IR")}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">مبلغ فروش</div>
                        <div class="info-value">${formatMoney(salesTotal)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">دریافتی فروش</div>
                        <div class="info-value">${formatMoney(salesPaid)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">مانده فروش (بازه)</div>
                        <div class="info-value">${formatMoney(Math.max(0, salesTotal - salesPaid))}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">تعداد تعمیرات</div>
                        <div class="info-value">${repairsCount.toLocaleString("fa-IR")}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">مبلغ تعمیرات</div>
                        <div class="info-value">${formatMoney(repairTotal)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">دریافتی تعمیرات</div>
                        <div class="info-value">${formatMoney(repairPaid)}</div>
                    </div>
                    <div class="info-box">
                        <div class="info-label">مانده تعمیرات (بازه)</div>
                        <div class="info-value">${formatMoney(Math.max(0, repairTotal - repairPaid))}</div>
                    </div>
                    <div class="info-box" style="grid-column:1/-1;">
                        <div class="info-label">مجموع مانده همه مشتریان (کل)</div>
                        <div class="info-value" style="color:${totalBalance > 0 ? "#dc2626" : "#16a34a"};">
                            ${formatMoney(totalBalance)}
                        </div>
                    </div>
                </div>
            `;
        }

        // ----- قطعات پرمصرف در بازه -----
        // از اقلام فاکتورهایی که تاریخ‌شان در بازه است
        const salesInRange = new Set();
        sales.forEach(function(s){
            if(inRange(s.date || "")) salesInRange.add(Number(s.id));
        });

        const partUsage = {};

        invoiceItems.forEach(function(item){
            const invId = Number(item.invoiceId);
            if(!salesInRange.has(invId)) return;
            if(item.invoiceType && item.invoiceType !== "فروش") return;

            const pid = Number(item.productId);
            if(!pid) return;
            const qty = Number(item.quantity) || 0;

            if(!partUsage[pid]){
                partUsage[pid] = {
                    name: item.productName || "بدون نام",
                    quantity: 0
                };
            }
            partUsage[pid].quantity += qty;
            if(item.productName) partUsage[pid].name = item.productName;
        });

        repairs.forEach(function(r){
            if(!inRange(r.date || "")) return;
            if(!Array.isArray(r.parts)) return;
            r.parts.forEach(function(p){
                const pid = Number(p.productId);
                if(!pid) return;
                const qty = Number(p.quantity) || 0;
                if(!partUsage[pid]){
                    partUsage[pid] = {
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
            .slice(0, 10);

        if(topContainer){
            if(topParts.length === 0){
                topContainer.innerHTML = `
                    <div class="card">
                        <div class="empty">در این بازه قطعه مصرف‌شده‌ای ثبت نشده است.</div>
                    </div>
                `;
            }else{
                let html = "";
                topParts.forEach(function(p, i){
                    html += `
                        <div class="product-card">
                            <div class="product-title">${i + 1}. ${escapeHTML(p.name)}</div>
                            <div class="product-meta">تعداد مصرف: ${Number(p.quantity).toLocaleString("fa-IR")}</div>
                        </div>
                    `;
                });
                topContainer.innerHTML = html;
            }
        }

    }catch(error){
        console.error(error);
        if(summary){
            summary.innerHTML = `<div class="empty">خطا در محاسبه گزارش‌ها.</div>`;
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
