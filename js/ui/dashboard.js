/* PackageYar - Dashboard */

async function updateDashboard(){

    countStore("customers", "customerCount");
    countStore("devices", "deviceCount");
    countStore("repairs", "repairCount");
    countStore("products", "productCount");

    if(!db) return;

    try{
        const [repairs, sales, products] = await Promise.all([
            safeGetAll("repairs"),
            safeGetAll("salesInvoices"),
            safeGetAll("products")
        ]);

        const today = (typeof getTodayJalali === "function") ? getTodayJalali() : "";

        let salesToday = 0;
        let salesPaidToday = 0;
        let repairsTodayCount = 0;
        let repairTotalToday = 0;
        let repairPaidToday = 0;

        sales.forEach(function(s){
            if((s.date || "") === today){
                salesToday += Number(s.totalAmount || 0);
                salesPaidToday += Number(s.paidAmount || 0);
            }
        });

        repairs.forEach(function(r){
            if((r.date || "") === today){
                repairsTodayCount++;
                repairTotalToday += Number(r.totalCost || 0);
                repairPaidToday += Number(r.paidAmount || 0);
            }
        });

        const paidToday = salesPaidToday + repairPaidToday;

        let totalBalance = 0;
        repairs.forEach(function(r){
            totalBalance += Math.max(0, Number(r.totalCost || 0) - Number(r.paidAmount || 0));
        });
        sales.forEach(function(s){
            totalBalance += Math.max(0, Number(s.totalAmount || 0) - Number(s.paidAmount || 0));
        });

        setText("dashSalesToday", formatMoneySafe(salesToday));
        setText(
            "dashRepairsToday",
            repairsTodayCount.toLocaleString("fa-IR") + " مورد · " + formatMoneySafe(repairTotalToday)
        );
        setText("dashPaidToday", formatMoneySafe(paidToday));

        const balanceEl = document.getElementById("dashTotalBalance");
        if(balanceEl){
            balanceEl.textContent = formatMoneySafe(totalBalance);
            balanceEl.style.color = totalBalance > 0 ? "#dc2626" : "#16a34a";
        }

        renderDashboardLowStock(products);
        renderDashboardRecentRepairs(repairs);

    }catch(error){
        console.error("خطا در به‌روزرسانی داشبورد:", error);
    }
}


function openReportsFromDashboard(){
    if(typeof showPage === "function"){
        showPage("settingsPage");
    }
    if(typeof openReportsPage === "function"){
        openReportsPage();
    }else if(typeof showToast === "function"){
        showToast("ماژول گزارش‌ها بارگذاری نشده است.", "error");
    }
}


function safeGetAll(storeName){
    return new Promise(function(resolve){
        if(!db || !db.objectStoreNames.contains(storeName)){
            resolve([]);
            return;
        }
        try{
            const tx = db.transaction(storeName, "readonly");
            const req = tx.objectStore(storeName).getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ resolve([]); };
        }catch(e){
            resolve([]);
        }
    });
}


function setText(id, text){
    const el = document.getElementById(id);
    if(el) el.textContent = text;
}


function formatMoneySafe(amount){
    if(typeof formatMoney === "function"){
        return formatMoney(amount);
    }
    return Number(amount || 0).toLocaleString("fa-IR") + " تومان";
}


function renderDashboardLowStock(products){

    const container = document.getElementById("dashboardLowStock");
    if(!container) return;

    const low = (products || []).filter(function(p){
        const stock = Number(p.stock || 0);
        let min = Number(p.minStock);
        if(!Number.isFinite(min) || min < 0) min = 2;
        return stock <= min;
    }).sort(function(a, b){
        return Number(a.stock || 0) - Number(b.stock || 0);
    }).slice(0, 50);

    if(low.length === 0){
        container.innerHTML = `
            <div class="card">
                <div class="empty" style="padding:20px 15px;">همه کالاها موجودی کافی دارند ✓</div>
            </div>
        `;
        return;
    }

    let html = "";
    low.forEach(function(p){
        const stock = Number(p.stock || 0);
        html += `
            <div class="product-card">
                <div class="product-title">📦 ${escapeHTML(p.name || "بدون نام")}</div>
                <div class="product-meta">
                    موجودی:
                    <span class="stock-low">${stock.toLocaleString("fa-IR")}</span>
                    ${p.unit ? " " + escapeHTML(p.unit) : ""}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}


function renderDashboardRecentRepairs(repairs){

    const container = document.getElementById("dashboardRecentRepairs");
    if(!container) return;

    const recent = (repairs || []).slice().sort(function(a, b){
        return Number(b.id || 0) - Number(a.id || 0);
    }).slice(0, 5);

    if(recent.length === 0){
        container.innerHTML = `
            <div class="card">
                <div class="empty" style="padding:20px 15px;">هنوز تعمیری ثبت نشده است.</div>
            </div>
        `;
        return;
    }

    let html = "";
    recent.forEach(function(r){
        const total = Number(r.totalCost || 0);
        const paid = Number(r.paidAmount || 0);
        const remain = Math.max(0, total - paid);
        const status = r.paymentStatus || "";

        let badgeClass = "badge";
        if(status === "پرداخت کامل") badgeClass += " status-paid";
        else if(status === "پرداخت نشده") badgeClass += " status-unpaid";
        else if(status === "پرداخت ناقص") badgeClass += " status-partial";

        html += `
            <div class="repair-card" style="cursor:pointer;" onclick="showPage('repairsPage')">
                <div class="repair-title">
                    ${escapeHTML(r.customerName || "مشتری")}
                    ${r.type ? " — " + escapeHTML(r.type) : ""}
                </div>
                <div class="customer-info" style="margin-top:6px;">
                    📅 ${escapeHTML(r.date || "—")}
                </div>
                <div class="repair-price">${formatMoneySafe(total)}</div>
                <span class="${badgeClass}">${escapeHTML(status || "—")}</span>
                ${remain > 0 ? `<div class="customer-info" style="color:#dc2626;margin-top:6px;">مانده: ${formatMoneySafe(remain)}</div>` : ""}
            </div>
        `;
    });
    container.innerHTML = html;
}
