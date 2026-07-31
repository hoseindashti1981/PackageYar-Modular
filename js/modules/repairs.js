
function startNewRepair(){

     currentRepairParts = [];
     editingRepairId = null;


    // پاک‌سازی وضعیت قبلی
    editingRepairId = null;
    currentRepairParts = [];
    currentDeviceId = null;
if(!db){

alert(
"دیتابیس هنوز آماده نیست."
);

return;

}

const transaction =
db.transaction(
"customers",
"readonly"
);

const request =
transaction
.objectStore(
"customers"
)
.getAll();

request.onsuccess =
function(){

const customers =
request.result
.sort(
function(a,b){

return b.id - a.id;

}
);

if(
customers.length === 0
){

alert(
"هنوز هیچ مشتری ثبت نشده است."
);

return;

}

showCustomerSelectionForRepair(
customers
);

};

}


function showCustomerSelectionForRepair(
customers
){

const container =
document.getElementById(
"repairsPage"
);

let html = `

<div class="back-btn" onclick="renderRepairsPageStructure(); loadAllRepairs();">
← بازگشت به لیست تعمیرات
</div>

<div class="section-title">

🔧 ثبت تعمیر جدید

</div>

<div class="card">

<div style="
font-size:17px;
font-weight:bold;
margin-bottom:15px;
">

مرحله ۱: انتخاب مشتری

</div>

<div class="search-box">

<span class="search-icon">
🔍
</span>

<input
id="repairCustomerSearch"
type="search"
placeholder="جستجوی نام یا شماره مشتری..."
autocomplete="off">

</div>

<div id="repairCustomerList">

`;

customers.forEach(
function(customer){

html += `

<div
class="device-card clickable"
data-customer-name="${escapeHTML(
customer.name || ""
)}"
data-customer-phone="${escapeHTML(
customer.phone || ""
)}"
onclick="selectRepairCustomer(${customer.id})">

<div class="device-title">

👤

${escapeHTML(
customer.name ||
"بدون نام"
)}

</div>

<div class="customer-info">

📞

${escapeHTML(
customer.phone ||
"بدون شماره"
)}

</div>

<div class="customer-info">

📍

${escapeHTML(
customer.address ||
"بدون آدرس"
)}

</div>

</div>

`;

}
);

html += `

</div>

</div>

`;

container.innerHTML =
html;

// فقط صفحه تعمیرات را فعال کن (بدون بازسازی ساختار)
document.querySelectorAll(".page").forEach(function(p){
    p.classList.remove("active");
});
container.classList.add("active");

document.querySelectorAll(".nav-item").forEach(function(item){
    item.classList.remove("active");
});


const search =
document.getElementById(
"repairCustomerSearch"
);

if(search){

search.addEventListener(
"input",
function(){

const query =
search.value
.trim()
.toLowerCase();

document
.querySelectorAll(
"#repairCustomerList .device-card"
)
.forEach(
function(card){

const name =
(
card.dataset.customerName ||
""
)
.toLowerCase();

const phone =
(
card.dataset.customerPhone ||
""
)
.toLowerCase();

if(
name.includes(query)
||
phone.includes(query)
){

card.style.display =
"";

}else{

card.style.display =
"none";

}

}
);

}
);

}

}


function selectRepairCustomer(
customerId
){

currentCustomerId =
customerId;

const transaction =
db.transaction(
"devices",
"readonly"
);

const request =
transaction
.objectStore(
"devices"
)
.getAll();

request.onsuccess =
function(){

const devices =
request.result
.filter(
function(device){

return (
device.customerId ===
customerId
);

}
)
.sort(
function(a,b){

return b.id - a.id;

}
);

showDeviceSelectionForRepair(
devices
);

};

}


function showDeviceSelectionForRepair(
devices
){

const container =
document.getElementById(
"repairsPage"
);

let html = `

<div class="back-btn"
onclick="startNewRepair()">

← انتخاب مشتری دیگر

</div>

<div class="section-title">

🔧 ثبت تعمیر جدید

</div>

<div class="card">

<div style="
font-size:17px;
font-weight:bold;
margin-bottom:15px;
">

مرحله ۲: انتخاب دستگاه

</div>

`;

if(
devices.length === 0
){

html += `

<div class="empty">

برای این مشتری هنوز هیچ دستگاهی ثبت نشده است.

<br><br>

ابتدا از کارت مشتری، دستگاه را ثبت کنید.

</div>

`;

}else{

devices.forEach(
function(device){

html += `

<div
class="device-card clickable"
onclick="selectRepairDevice(${device.id})">

<div class="device-title">

🔥

${escapeHTML(
device.brand ||
"برند نامشخص"
)}

-

${escapeHTML(
device.model ||
"مدل نامشخص"
)}

</div>

<div class="customer-info">

نوع:

${escapeHTML(
device.type ||
"ثبت نشده"
)}

</div>

<div class="customer-info">

شماره سریال:

${escapeHTML(
device.serial ||
"ثبت نشده"
)}

</div>

</div>

`;

}
);

}

html += `

</div>

`;

container.innerHTML =
html;

// فقط صفحه تعمیرات را فعال کن (بدون بازسازی ساختار)
document.querySelectorAll(".page").forEach(function(p){
    p.classList.remove("active");
});
container.classList.add("active");

document.querySelectorAll(".nav-item").forEach(function(item){
    item.classList.remove("active");
});

}


function selectRepairDevice(
deviceId
){

if(!db){

alert(
"دیتابیس آماده نیست."
);

return;

}

const transaction =
db.transaction(
"devices",
"readonly"
);

const request =
transaction
.objectStore(
"devices"
)
.get(
deviceId
);

request.onsuccess =
function(){

const device =
request.result;

if(!device){

alert(
"اطلاعات دستگاه پیدا نشد."
);

return;

}

currentCustomerId =
device.customerId;

currentDeviceId =
device.id;

editingRepairId =
null;

openRepairModal();

};

request.onerror =
function(){

alert(
"خطا در دریافت اطلاعات دستگاه."
);

};

}


function openRepairModal(repair){

    const isEditing =
        repair &&
        repair.id !== undefined;

    editingRepairId =
        isEditing ? repair.id : null;

    // پاک کردن قطعات قبلی
    currentRepairParts = [];

    // اگر در حال ویرایش هستیم، قطعات قبلی را بارگذاری کن
    if(
        isEditing &&
        Array.isArray(repair.repairParts)
    ){
        currentRepairParts = repair.repairParts.map(function(part){
            return {
                productId: Number(part.productId),
                productName: part.productName || "بدون نام",
                quantity: Number(part.quantity) || 0,
                unitPrice: Number(part.unitPrice) || 0,
                total: Number(part.total) || (Number(part.quantity) * Number(part.unitPrice))
            };
        });
    }

    document.getElementById("repairModalTitle").innerText =
        isEditing ? "ویرایش تعمیر" : "ثبت سرویس و تعمیر جدید";

    document.getElementById("repairDate").value =
        isEditing ? (repair.date || getTodayJalali()) : getTodayJalali();

    document.getElementById("repairType").value =
        isEditing ? (repair.type || "تعمیر") : "تعمیر";

    document.getElementById("repairProblem").value =
        isEditing ? (repair.problem || "") : "";

    document.getElementById("repairAction").value =
        isEditing ? (repair.action || "") : "";

    document.getElementById("repairLaborCost").value =
        isEditing ? (repair.laborCost || 0) : 0;

// پر شدن خودکار مبلغ پرداخت‌شده هنگام تغییر اجرت
const laborInput = document.getElementById("repairLaborCost");
if(laborInput){
    laborInput.oninput = function(){
        updateRepairPaidAmount();
    };
}    


document.getElementById("repairPaymentStatus").value =
        isEditing ? (repair.paymentStatus || "پرداخت کامل") : "پرداخت کامل";

    document.getElementById("repairPaid").value =
        isEditing ? (repair.paidAmount || 0) : 0;

    document.getElementById("repairNote").value =
        isEditing ? (repair.note || "") : "";

    // پاک کردن ورودی‌های قطعه
    const productSelect = document.getElementById("repairProductSelect");
    const quantityInput = document.getElementById("repairProductQuantity");
    const priceInput = document.getElementById("repairProductUnitPrice");

    if(productSelect) productSelect.value = "";
    if(quantityInput) quantityInput.value = "";
    if(priceInput) priceInput.value = "";

    // نمایش قطعات (اگر ویرایش باشد)
    renderRepairParts();

    // بارگذاری لیست قطعات از انبار
    loadRepairProducts();

    document.getElementById("repairModal").classList.add("show");
}


function closeRepairModal(){

document
.getElementById(
"repairModal"
)
.classList.remove(
"show"
);

editingRepairId =
null;

}


async function saveRepair(){

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    if(!currentDeviceId){
        alert("دستگاه انتخاب نشده است.");
        return;
    }

    // ---------- دریافت اطلاعات فرم ----------
    const date = document.getElementById("repairDate")?.value.trim();
    const type = document.getElementById("repairType")?.value || "تعمیر";
    const problem = document.getElementById("repairProblem")?.value.trim() || "";
    const action = document.getElementById("repairAction")?.value.trim() || "";
    const laborCost = Number(document.getElementById("repairLaborCost")?.value) || 0;
    const paymentStatus = document.getElementById("repairPaymentStatus")?.value || "پرداخت کامل";
    const paidAmount = Number(document.getElementById("repairPaid")?.value) || 0;
    const note = document.getElementById("repairNote")?.value.trim() || "";

    if(!date){
        alert("تاریخ تعمیر مشخص نیست.");
        return;
    }

    if(!Number.isFinite(laborCost) || laborCost < 0){
        alert("مبلغ اجرت نامعتبر است.");
        return;
    }

    // ---------- آماده‌سازی قطعات ----------
    const repairParts = Array.isArray(currentRepairParts)
        ? currentRepairParts.map(function(part){
            const quantity = Number(part.quantity);
            const unitPrice = Number(part.unitPrice);
            return {
                productId: Number(part.productId),
                productName: part.productName || "بدون نام",
                quantity: quantity,
                unitPrice: unitPrice,
                total: quantity * unitPrice
            };
        })
        : [];

    // ---------- اعتبارسنجی قطعات ----------
    for(const part of repairParts){
        if(!Number.isInteger(part.productId) || part.productId <= 0){
            alert("شناسه یکی از قطعات نامعتبر است.");
            return;
        }
        if(!Number.isInteger(part.quantity) || part.quantity <= 0){
            alert("تعداد قطعه «" + part.productName + "» نامعتبر است.");
            return;
        }
        if(!Number.isFinite(part.unitPrice) || part.unitPrice < 0){
            alert("قیمت قطعه «" + part.productName + "» نامعتبر است.");
            return;
        }
    }

    // ---------- محاسبه هزینه‌ها ----------
    let partsCost = 0;
    repairParts.forEach(function(part){
        partsCost += Number(part.total);
    });

    const totalCost = partsCost + laborCost;

    if(paidAmount < 0){
        alert("مبلغ پرداخت‌شده نمی‌تواند منفی باشد.");
        return;
    }

    if(paidAmount > totalCost){
        alert("مبلغ پرداخت‌شده نمی‌تواند بیشتر از مبلغ کل باشد.");
        return;
    }

    // ---------- تأیید کاربر ----------
    const confirmed = confirm(
        "آیا اطلاعات تعمیر ثبت شود؟\n\n" +
        "تعداد قطعات: " + repairParts.length + "\n" +
        "هزینه قطعات: " + formatMoney(partsCost) + "\n" +
        "اجرت: " + formatMoney(laborCost) + "\n" +
        "مبلغ کل: " + formatMoney(totalCost) + "\n\n" +
        (repairParts.length > 0 ? "موجودی قطعات از انبار کم خواهد شد." : "")
    );

    if(!confirmed) return;

    const now = new Date();

    try{

        // =====================================================
        // حالت ثبت تعمیر جدید
        // =====================================================
        if(editingRepairId === null){

            // ----- بررسی موجودی قبل از هر تغییری -----
            if(repairParts.length > 0){

                const products = await getAllProductsForPurchase();
                const productMap = new Map();
                products.forEach(function(p){
                    productMap.set(Number(p.id), p);
                });

                for(const part of repairParts){
                    const product = productMap.get(part.productId);
                    if(!product){
                        throw new Error("کالای «" + part.productName + "» در انبار پیدا نشد.");
                    }
                    const currentStock = Number(product.stock || 0);
                    if(currentStock < part.quantity){
                        throw new Error(
                            "موجودی کالای «" + part.productName + "» کافی نیست.\n\n" +
                            "موجودی فعلی: " + currentStock.toLocaleString("fa-IR") + "\n" +
                            "تعداد مورد نیاز: " + part.quantity.toLocaleString("fa-IR")
                        );
                    }
                }
            }

            // ----- شروع تراکنش اتمیک -----
            const transaction = db.transaction(
                ["repairs", "products", "stockTransactions"],
                "readwrite"
            );

            const repairsStore = transaction.objectStore("repairs");

            // ثبت تعمیر
            const repairRecord = {
                customerId: currentCustomerId,
                deviceId: currentDeviceId,
                date: date,
                type: type,
                problem: problem,
                action: action,
                repairParts: repairParts,          // آرایه ساختاریافته
                partsCost: partsCost,
                laborCost: laborCost,
                totalCost: totalCost,
                paymentStatus: paymentStatus,
                paidAmount: paidAmount,
                note: note,
                createdAt: now.toISOString()
            };

            const repairId = await new Promise(function(resolve, reject){
                const request = repairsStore.add(repairRecord);
                request.onsuccess = function(){ resolve(request.result); };
                request.onerror = function(){ reject(new Error("ثبت تعمیر انجام نشد.")); };
            });

            // ثبت OUT برای هر قطعه
            for(const part of repairParts){
                await processStockTransactionInExistingTransaction({
                    transaction: transaction,
                    productId: part.productId,
                    type: "OUT",
                    quantity: part.quantity,
                    reason: "مصرف قطعه در تعمیر",
                    note: "مصرف در تعمیر شماره " + repairId,
                    repairId: repairId
                });
            }

            // انتظار برای تکمیل
            await new Promise(function(resolve, reject){
                transaction.oncomplete = function(){ resolve(); };
                transaction.onerror = function(){ reject(new Error("ثبت تعمیر و انبار انجام نشد.")); };
                transaction.onabort = function(){ reject(new Error("عملیات لغو شد.")); };
            });

            // پاک‌سازی
            currentRepairParts = [];
            editingRepairId = null;
            closeRepairModal();
            openDeviceProfile(currentDeviceId);
            updateDashboard();

            alert(
                "تعمیر با موفقیت ثبت شد.\n\n" +
                "مبلغ کل: " + formatMoney(totalCost) + "\n\n" +
                (repairParts.length > 0 ? "قطعات از موجودی انبار کسر شدند." : "")
            );
        }

        // =====================================================
        // حالت ویرایش (فعلاً ساده - بدون تغییر موجودی)
        // =====================================================
        else{

            const transaction = db.transaction(["repairs"], "readwrite");
            const repairsStore = transaction.objectStore("repairs");

            const existingRepair = await new Promise(function(resolve, reject){
                const request = repairsStore.get(Number(editingRepairId));
                request.onsuccess = function(){ resolve(request.result); };
                request.onerror = function(){ reject(new Error("دریافت تعمیر قبلی انجام نشد.")); };
            });

            if(!existingRepair){
                throw new Error("رکورد تعمیر برای ویرایش پیدا نشد.");
            }

            existingRepair.date = date;
            existingRepair.type = type;
            existingRepair.problem = problem;
            existingRepair.action = action;
            existingRepair.repairParts = repairParts;
            existingRepair.partsCost = partsCost;
            existingRepair.laborCost = laborCost;
            existingRepair.totalCost = totalCost;
            existingRepair.paymentStatus = paymentStatus;
            existingRepair.paidAmount = paidAmount;
            existingRepair.note = note;
            existingRepair.updatedAt = now.toISOString();

            await new Promise(function(resolve, reject){
                const request = repairsStore.put(existingRepair);
                request.onsuccess = function(){ resolve(); };
                request.onerror = function(){ reject(new Error("به‌روزرسانی تعمیر انجام نشد.")); };
            });

            await new Promise(function(resolve, reject){
                transaction.oncomplete = function(){ resolve(); };
                transaction.onerror = function(){ reject(new Error("ویرایش تعمیر انجام نشد.")); };
            });

            currentRepairParts = [];
            editingRepairId = null;
            closeRepairModal();
            openDeviceProfile(currentDeviceId);
            updateDashboard();

            alert("تعمیر با موفقیت ویرایش شد.\n\n(تغییر موجودی انبار در مرحله بعدی اضافه می‌شود)");
        }

    }catch(error){
        console.error("خطا در ثبت تعمیر:", error);
        alert("ثبت تعمیر انجام نشد.\n\n" + (error.message || "خطای نامشخص"));
    }
}


function addRepairPart(){

    const productSelect =
        document.getElementById(
            "repairProductSelect"
        );


    const quantityInput =
        document.getElementById(
            "repairProductQuantity"
        );


    const priceInput =
        document.getElementById(
            "repairProductUnitPrice"
        );


    if(
        !productSelect ||
        !quantityInput ||
        !priceInput
    ){

        return;

    }


    const productId =
        Number(
            productSelect.value
        );


    const quantity =
        Number(
            quantityInput.value
        );


    const unitPrice =
        Number(
            priceInput.value
        );


    /* --------------------------------------------------------
       اعتبارسنجی کالا
       -------------------------------------------------------- */

    if(
        !Number.isInteger(
            productId
        )
        ||
        productId <= 0
    ){

        alert(
            "لطفاً قطعه را از لیست انتخاب کنید."
        );

        return;

    }


    /* --------------------------------------------------------
       اعتبارسنجی تعداد
       -------------------------------------------------------- */

    if(
        !Number.isInteger(
            quantity
        )
        ||
        quantity <= 0
    ){

        alert(
            "تعداد قطعه باید بیشتر از صفر باشد."
        );

        return;

    }


    /* --------------------------------------------------------
       اعتبارسنجی قیمت
       -------------------------------------------------------- */

    if(
        !Number.isFinite(
            unitPrice
        )
        ||
        unitPrice < 0
    ){

        alert(
            "قیمت قطعه نامعتبر است."
        );

        return;

    }


    const productName =

        productSelect
        .options[
            productSelect.selectedIndex
        ]
        .textContent
        .trim();


    /* --------------------------------------------------------
       بررسی وجود قطعه تکراری

       اگر قطعه قبلاً اضافه شده باشد،
       ردیف جدید ایجاد نمی‌کنیم.

       تعداد را افزایش می‌دهیم
       و قیمت را با قیمت جدید جایگزین می‌کنیم.
       -------------------------------------------------------- */

    const existingItem =

        currentRepairParts
        .find(

            function(item){

                return (

                    Number(
                        item.productId
                    )
                    ===
                    productId

                );

            }

        );


    if(existingItem){

        existingItem.quantity =

            Number(
                existingItem.quantity
            )

            +

            quantity;


        existingItem.unitPrice =
            unitPrice;


        existingItem.total =

            existingItem.quantity
            *
            existingItem.unitPrice;

    }else{


        currentRepairParts
        .push({

            productId:
                productId,

            productName:
                productName,

            quantity:
                quantity,

            unitPrice:
                unitPrice,

            total:
                quantity *
                unitPrice

        });

    }


    /* --------------------------------------------------------
       پاک کردن ورودی‌ها
       -------------------------------------------------------- */

    productSelect.value =
        "";


    quantityInput.value =
        "";


    priceInput.value =
        "";


    /* --------------------------------------------------------
       نمایش مجدد قطعات
       -------------------------------------------------------- */

    renderRepairParts();

}



function removeRepairPart(index){

    if(
        !Array.isArray(
            currentRepairParts
        )
    ){

        return;

    }


    if(
        !Number.isInteger(
            index
        )
        ||
        index < 0
        ||
        index >=
        currentRepairParts.length
    ){

        return;

    }


    const productName =

        currentRepairParts[
            index
        ]
        ?.productName
        ||
        "این قطعه";


    const confirmed =
        confirm(

            "آیا قطعه «" +

            productName +

            "» از تعمیر حذف شود؟"

        );


    if(!confirmed){

        return;

    }


    currentRepairParts
    .splice(
        index,
        1
    );


    renderRepairParts();

}


function renderRepairParts(){

    const container =
        document.getElementById(
            "repairPartsContainer"
        );


    const totalElement =
        document.getElementById(
            "repairPartsTotal"
        );


    if(!container){

        return;

    }


    if(
        !Array.isArray(
            currentRepairParts
        )
        ||
        currentRepairParts.length === 0
    ){

        container.innerHTML = `

        <div class="empty">

        هنوز قطعه‌ای به تعمیر اضافه نشده است.

        </div>

        `;


        if(totalElement){

            totalElement.innerText =

                "مجموع هزینه قطعات: ۰";

        }


        return;

    }


    let html =
        "";


    let totalCost =
        0;


    currentRepairParts
    .forEach(

        function(item,index){

            const quantity =
                Number(
                    item.quantity
                )
                ||
                0;


            const unitPrice =
                Number(
                    item.unitPrice
                )
                ||
                0;


            const itemTotal =

                quantity
                *
                unitPrice;


            item.total =
                itemTotal;


            totalCost +=
                itemTotal;


            html += `

            <div
            class="card"
            style="
            margin-bottom:10px;
            ">


                <div
                class="customer-name">

                📦

                ${escapeHTML(
                    item.productName ||
                    "بدون نام"
                )}

                </div>


                <div
                class="customer-info">

                تعداد:

                ${quantity.toLocaleString(
                    "fa-IR"
                )}

                </div>


                <div
                class="customer-info">

                قیمت واحد:

                ${formatMoney(
                    unitPrice
                )}

                </div>


                <div
                class="customer-info">

                مبلغ:

                ${formatMoney(
                    itemTotal
                )}

                </div>


                <div
                class="card-actions"
                style="
                margin-top:10px;
                ">


                    <button
                    type="button"
                    class="danger-btn"
                    onclick="
                    removeRepairPart(
                        ${index}
                    )
                    ">

                    🗑️ حذف قطعه

                    </button>


                </div>


            </div>

            `;

        }

    );


    container.innerHTML =
        html;


    if(totalElement){

        totalElement.innerText =

            "مجموع هزینه قطعات: " +

            formatMoney(
                totalCost
            );

    }

}


async function loadRepairProducts(){

    const select = document.getElementById("repairProductSelect");
    if(!select) return;

    try{
        const products = await getAllProductsForPurchase();

        select.innerHTML = `<option value="">انتخاب قطعه</option>`;

        products.forEach(function(product){
            const option = document.createElement("option");
            option.value = product.id;
            option.textContent =
                (product.name || "بدون نام") +
                " | موجودی: " +
                Number(product.stock || 0).toLocaleString("fa-IR");

            option.dataset.salePrice = Number(product.salePrice || 0);
            option.dataset.purchasePrice = Number(product.purchasePrice || 0);
            option.dataset.name = product.name || "بدون نام";

            select.appendChild(option);
        });

        select.onchange = function(){
            const option = select.options[select.selectedIndex];
            const priceInput = document.getElementById("repairProductUnitPrice");
            if(!priceInput) return;

            if(!select.value){
                priceInput.value = "";
                return;
            }

            priceInput.value = Number(option.dataset.salePrice || 0);
        };

    }catch(error){
        console.error("خطا در دریافت قطعات:", error);
        alert("دریافت لیست قطعات از انبار انجام نشد.");
    }
}


function updateRepairPartsTotal(){

    const totalElement = document.getElementById("repairPartsTotal");
    if(!totalElement) return;

    let total = 0;
    currentRepairParts.forEach(function(part){
        total += Number(part.quantity || 0) * Number(part.unitPrice || 0);
    });

    totalElement.innerHTML = "مجموع هزینه قطعات: " + formatMoney(total);

updateRepairPaidAmount();
}


function updateRepairPaidAmount(){

    const laborInput = document.getElementById("repairLaborCost");
    const paidInput = document.getElementById("repairPaid");

    if(!laborInput || !paidInput) return;

    let partsCost = 0;

    if(Array.isArray(currentRepairParts)){
        currentRepairParts.forEach(function(part){
            partsCost += Number(part.quantity || 0) * Number(part.unitPrice || 0);
        });
    }

    const laborCost = Number(laborInput.value) || 0;
    const total = partsCost + laborCost;

    paidInput.value = total;
}


function loadAllRepairs(){

if(!db){

return;

}


const list =
document.getElementById(
"repairsHistoryList"
);


if(!list){

return;

}


list.innerHTML = `

<div class="card">

<div class="empty">

در حال بارگذاری سوابق تعمیرات...

</div>

</div>

`;


const transaction =
db.transaction(
[
"repairs",
"customers",
"devices"
],
"readonly"
);


const repairStore =
transaction.objectStore(
"repairs"
);


const customerStore =
transaction.objectStore(
"customers"
);


const deviceStore =
transaction.objectStore(
"devices"
);


const repairRequest =
repairStore.getAll();


const customerRequest =
customerStore.getAll();


const deviceRequest =
deviceStore.getAll();


transaction.oncomplete =
function(){

const repairs =
repairRequest.result || [];


const customers =
customerRequest.result || [];


const devices =
deviceRequest.result || [];


const customerMap =
{};


const deviceMap =
{};


customers.forEach(
function(customer){

customerMap[
customer.id
] =
customer;

});


devices.forEach(
function(device){

deviceMap[
device.id
] =
device;

});


let records =
repairs.map(
function(repair){

const customer =
customerMap[
repair.customerId
];


const device =
deviceMap[
repair.deviceId
];


return {

repair:
repair,

customer:
customer,

device:
device

};

});


records.sort(
function(a,b){

return (
Number(
b.repair.id
) || 0
)
-
(
Number(
a.repair.id
) || 0
);

});


renderAllRepairs(
records
);

};

}


function renderAllRepairs(
records
){

const list =
document.getElementById(
"repairsHistoryList"
);


if(!list){

return;

}


const searchInput =
document.getElementById(
"repairHistorySearch"
);


const search =
(
searchInput
?
searchInput.value
:
""
)
.trim()
.toLowerCase();


if(search){

records =
records.filter(
function(record){

const repair =
record.repair;


const customer =
record.customer ||
{};


const device =
record.device ||
{};


const customerName =
(
customer.name ||
""
)
.toLowerCase();


const customerPhone =
(
customer.phone ||
""
)
.toLowerCase();


const deviceBrand =
(
device.brand ||
""
)
.toLowerCase();


const deviceModel =
(
device.model ||
""
)
.toLowerCase();


const deviceSerial =
(
device.serial ||
""
)
.toLowerCase();


const repairDate =
(
repair.date ||
""
)
.toLowerCase();


const repairType =
(
repair.type ||
""
)
.toLowerCase();


return (

customerName.includes(
search
)

||

customerPhone.includes(
search
)

||

deviceBrand.includes(
search
)

||

deviceModel.includes(
search
)

||

deviceSerial.includes(
search
)

||

repairDate.includes(
search
)

||

repairType.includes(
search
)

);

});

}


if(
records.length === 0
){

list.innerHTML = `

<div class="card">

<div class="empty">

${
search
?
"هیچ تعمیر مطابق جستجوی شما پیدا نشد."
:
"هنوز هیچ تعمیر یا سرویسی ثبت نشده است."
}

</div>

</div>

`;

return;

}


list.innerHTML =
"";


records.forEach(
function(record){

const repair =
record.repair;


const customer =
record.customer ||
{};


const device =
record.device ||
{};


let statusClass =
"status-unpaid";


if(
repair.paymentStatus ===
"پرداخت کامل"
){

statusClass =
"status-paid";

}else if(
repair.paymentStatus ===
"پرداخت ناقص"
){

statusClass =
"status-partial";

}


const customerName =
customer.name ||
"مشتری نامشخص";


const customerPhone =
customer.phone ||
"بدون شماره";


const deviceName =

(
device.brand ||
"برند نامشخص"
)

+

" - "

+

(
device.model ||
"مدل نامشخص"
);


const totalCost =
Number(
repair.totalCost
) || 0;


const paidAmount =
Number(
repair.paidAmount
) || 0;


const remaining =
Math.max(
0,
totalCost -
paidAmount
);


const card =
document.createElement(
"div"
);


card.className =
"repair-card";


card.innerHTML = `

<div class="repair-title">

🔧

${escapeHTML(
repair.type ||
"تعمیر"
)}

<span
class="badge ${statusClass}">

${escapeHTML(
repair.paymentStatus ||
"پرداخت نشده"
)}

</span>

</div>


<div class="customer-info">

👤 مشتری:

<strong>

${escapeHTML(
customerName
)}

</strong>

</div>


<div class="customer-info">

📞 شماره:

${escapeHTML(
customerPhone
)}

</div>


<div class="customer-info">

🔥 دستگاه:

<strong>

${escapeHTML(
deviceName
)}

</strong>

</div>


<div class="customer-info">

📅 تاریخ:

${escapeHTML(
repair.date ||
"نامشخص"
)}

</div>


<div class="info-grid">


<div class="info-box">

<div class="info-label">

مبلغ کل

</div>

<div class="info-value">

${formatMoney(
totalCost
)}

</div>

</div>


<div class="info-box">

<div class="info-label">

پرداخت‌شده

</div>

<div class="info-value">

${formatMoney(
paidAmount
)}

</div>

</div>


<div class="info-box">

<div class="info-label">

مانده

</div>

<div class="info-value">

${formatMoney(
remaining
)}

</div>

</div>


<div class="info-box">

<div class="info-label">

تاریخ ثبت

</div>

<div class="info-value">

${escapeHTML(
repair.date ||
"نامشخص"
)}

</div>

</div>


</div>


${
repair.problem
?

`

<div class="customer-info">

⚠️ ایراد:

${escapeHTML(
repair.problem
)}

</div>

`

:

""

}


${
repair.action
?

`

<div class="customer-info">

🛠 اقدامات:

${escapeHTML(
repair.action
)}

</div>

`

:

""

}


<div class="card-actions">


<button
class="primary-btn"
onclick="viewRepairDetails(${repair.id})">

مشاهده جزئیات

</button>


<button
class="edit-btn"
onclick="editRepair(${repair.id})">

ویرایش

</button>


<button
class="danger-btn"
onclick="deleteRepairFromHistory(${repair.id})">

حذف

</button>


</div>

`;


list.appendChild(
card
);

});

}


function viewRepairDetails(
repairId
){

if(!db){

return;

}


const transaction =
db.transaction(
[
"repairs",
"customers",
"devices"
],
"readonly"
);


const repairRequest =
transaction
.objectStore(
"repairs"
)
.get(
repairId
);


const customerRequest =
transaction
.objectStore(
"customers"
)
.getAll();


const deviceRequest =
transaction
.objectStore(
"devices"
)
.getAll();


transaction.oncomplete =
function(){

const repair =
repairRequest.result;


if(!repair){

alert(
"اطلاعات تعمیر پیدا نشد."
);

return;

}


const customer =
customerRequest.result.find(
function(item){

return (
item.id ===
repair.customerId
);

}
);


const device =
deviceRequest.result.find(
function(item){

return (
item.id ===
repair.deviceId
);

}
);


showRepairDetailsModal(
repair,
customer,
device
);

};

}


function showRepairDetailsModal(
repair,
customer,
device
){

let modal =
document.getElementById(
"repairDetailsModal"
);


if(!modal){

modal =
document.createElement(
"div"
);


modal.id =
"repairDetailsModal";


modal.className =
"modal";


document.body.appendChild(
modal
);

}


const totalCost =
Number(
repair.totalCost
) || 0;


const paidAmount =
Number(
repair.paidAmount
) || 0;


const remaining =
Math.max(
0,
totalCost -
paidAmount
);


modal.innerHTML = `

<div class="modal-content">


<div class="modal-header">

<h3>

جزئیات تعمیر

</h3>


<div
class="close"
onclick="closeRepairDetailsModal()">

×

</div>

</div>


<div class="info-grid">


<div class="info-box">

<div class="info-label">

مشتری

</div>

<div class="info-value">

${escapeHTML(
customer
?
customer.name
:
"نامشخص"
)}

</div>

</div>


<div class="info-box">

<div class="info-label">

شماره تماس

</div>

<div class="info-value">

${escapeHTML(
customer
?
customer.phone ||
"ثبت نشده"
:
"ثبت نشده"
)}

</div>

</div>


<div class="info-box">

<div class="info-label">

دستگاه

</div>

<div class="info-value">

${escapeHTML(
device
?
(
device.brand ||
""
)
+
" "
+
(
device.model ||
""
)
:
"نامشخص"
)}

</div>

</div>


<div class="info-box">

<div class="info-label">

تاریخ

</div>

<div class="info-value">

${escapeHTML(
repair.date ||
"نامشخص"
)}

</div>

</div>

</div>


<div class="card">

<strong>

نوع فعالیت:

</strong>

${escapeHTML(
repair.type ||
"تعمیر"
)}

</div>


<div class="card">

<strong>

شرح ایراد:

</strong>

<br><br>

${escapeHTML(
repair.problem ||
"ثبت نشده"
)}

</div>


<div class="card">

<strong>

اقدامات انجام‌شده:

</strong>

<br><br>

${escapeHTML(
repair.action ||
"ثبت نشده"
)}

</div>


<div class="card">

<strong>

قطعات مصرف‌شده:

</strong>

<br><br>

${
    Array.isArray(repair.repairParts) && repair.repairParts.length > 0
    ?
    escapeHTML(
        repair.repairParts.map(function(p){
            return (p.productName || "قطعه") +
                " × " +
                Number(p.quantity || 0).toLocaleString("fa-IR") +
                " (" + formatMoney(p.unitPrice || 0) + ")";
        }).join("\n")
    ).replace(/\n/g, "<br>")
    :
    "بدون قطعه"
}

</div>


<div class="info-grid">


<div class="info-box">

<div class="info-label">

هزینه قطعات

</div>

<div class="info-value">

${formatMoney(
repair.partsCost
)}

</div>

</div>


<div class="info-box">

<div class="info-label">

اجرت

</div>

<div class="info-value">

${formatMoney(
repair.laborCost
)}

</div>

</div>


<div class="info-box">

<div class="info-label">

مبلغ کل

</div>

<div class="info-value">

${formatMoney(
totalCost
)}

</div>

</div>


<div class="info-box">

<div class="info-label">

پرداخت‌شده

</div>

<div class="info-value">

${formatMoney(
paidAmount
)}

</div>

</div>

</div>


<div class="repair-price">

مانده:

${formatMoney(
remaining
)}

</div>


<div class="card">

<strong>

وضعیت پرداخت:

</strong>

${escapeHTML(
repair.paymentStatus ||
"نامشخص"
)}

</div>


${
repair.note
?

`

<div class="card">

<strong>

توضیحات:

</strong>

<br><br>

${escapeHTML(
repair.note
)}

</div>

`

:

""

}


<div class="card-actions">


<button
class="edit-btn"
onclick="closeRepairDetailsModal();editRepair(${repair.id})">

✏️ ویرایش

</button>


<button
class="danger-btn"
onclick="closeRepairDetailsModal();deleteRepairFromHistory(${repair.id})">

🗑️ حذف

</button>

<button
class="success-btn"
onclick="closeRepairDetailsModal(); openSalesInvoiceFromRepair(${repair.id})">

🧾 ساخت فاکتور فروش

</button>

</div>


</div>

`;


modal.classList.add(
"show"
);

}


function closeRepairDetailsModal(){

const modal =
document.getElementById(
"repairDetailsModal"
);


if(modal){

modal.classList.remove(
"show"
);

}

}


function deleteRepairFromHistory(
repairId
){

if(
!confirm(
"آیا از حذف این سابقه تعمیر مطمئن هستید؟"
)
){

return;

}


if(!db){

return;

}


const transaction =
db.transaction(
"repairs",
"readwrite"
);


transaction
.objectStore(
"repairs"
)
.delete(
repairId
);


transaction.oncomplete =
function(){

loadAllRepairs();

updateDashboard();

};

}
function renderRepairsPageStructure(){

    const page = document.getElementById("repairsPage");
    if(!page) return;

    page.innerHTML = `
        <div class="section-title">
            🔧 سوابق تعمیرات
        </div>

        <button class="primary-btn" onclick="startNewRepair()">
            + ثبت تعمیر جدید
        </button>

        <div class="search-box" style="margin-top:15px">
            <span class="search-icon">🔍</span>
            <input
                id="repairHistorySearch"
                type="search"
                placeholder="جستجوی مشتری، دستگاه، مدل، شماره یا تاریخ..."
                autocomplete="off">
        </div>

        <div id="repairsHistoryList"></div>
    `;

    // اتصال جستجو
    const search = document.getElementById("repairHistorySearch");
    if(search){
        search.addEventListener("input", function(){
            loadAllRepairs();
        });
    }
}


async function openSalesInvoiceFromRepair(repairId){

    if(!db){
        alert("دیتابیس آماده نیست.");
        return;
    }

    try{
        const repair = await new Promise(function(resolve, reject){
            const tx = db.transaction(["repairs"], "readonly");
            const req = tx.objectStore("repairs").get(Number(repairId));
            req.onsuccess = function(){ resolve(req.result || null); };
            req.onerror = function(){ reject(new Error("دریافت تعمیر انجام نشد.")); };
        });

        if(!repair){
            alert("تعمیر پیدا نشد.");
            return;
        }

        // مشتری
        let customerName = "مشتری";
        if(repair.customerId){
            const customer = await new Promise(function(resolve){
                const tx = db.transaction(["customers"], "readonly");
                const req = tx.objectStore("customers").get(Number(repair.customerId));
                req.onsuccess = function(){ resolve(req.result || null); };
                req.onerror = function(){ resolve(null); };
            });
            if(customer) customerName = customer.name || "مشتری";
        }

        // آماده‌سازی اقلام از قطعات تعمیر
        currentSalesInvoiceItems = [];
        if(Array.isArray(repair.repairParts)){
            repair.repairParts.forEach(function(part){
                currentSalesInvoiceItems.push({
                    productId: Number(part.productId),
                    productName: part.productName || "بدون نام",
                    quantity: Number(part.quantity) || 0,
                    unitPrice: Number(part.unitPrice) || 0,
                    total: Number(part.quantity || 0) * Number(part.unitPrice || 0),
                    fromRepair: true
                });
            });
        }

        editingSalesInvoiceId = null;
        currentSalesCustomerId = Number(repair.customerId) || null;
        currentSalesRepairId = Number(repair.id);

        const customers = await new Promise(function(resolve, reject){
            const tx = db.transaction("customers", "readonly");
            const req = tx.objectStore("customers").getAll();
            req.onsuccess = function(){ resolve(req.result || []); };
            req.onerror = function(){ reject(new Error("دریافت مشتریان انجام نشد.")); };
        });

        const products = await getAllProductsForPurchase();

        // برو به انبار و فرم فروش
        showPage("inventoryPage");
        renderSalesInvoiceForm(customers, products);

        setTimeout(function(){
            // انتخاب مشتری
            const select = document.getElementById("salesCustomerSelect");
            if(select && currentSalesCustomerId){
                select.value = String(currentSalesCustomerId);
            }

            // اجرت
            const labor = document.getElementById("salesLaborCost");
            if(labor){
                labor.value = Number(repair.laborCost || 0);
            }

            // توضیح
            const note = document.getElementById("salesInvoiceNote");
            if(note){
                note.value = "فاکتور مربوط به تعمیر شماره " + repair.id +
                    (repair.type ? " (" + repair.type + ")" : "");
            }

            // عنوان
            const title = document.querySelector("#inventoryPage .section-title");
            if(title){
                title.innerText = "🧾 فاکتور فروش از تعمیر #" + repair.id;
            }

            renderSalesInvoiceItems();
            updateSalesInvoiceTotal();

            alert(
                "فاکتور از روی تعمیر آماده شد.\n\n" +
                "مشتری و قطعات و اجرت پر شده‌اند.\n" +
                "قیمت‌ها را در صورت نیاز تغییر دهید و ثبت کنید.\n\n" +
                "توجه: موجودی قطعات قبلاً در تعمیر کم شده و دوباره کم نمی‌شود."
            );
        }, 200);

    }catch(error){
        console.error(error);
        alert(error.message || "ساخت فاکتور از تعمیر انجام نشد.");
    }
}


