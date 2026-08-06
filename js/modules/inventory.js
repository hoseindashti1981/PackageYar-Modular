

function openProductModal(product){
    editingProductId = product ? product.id : null;

document
.getElementById(
"productModalTitle"
)
.innerText =

product
?
"ویرایش کالا"
:
"کالای جدید";

document
.getElementById(
"productName"
)
.value =

product
?
product.name || ""
:
"";

document
.getElementById(
"productCode"
)
.value =

product
?
product.code || ""
:
"";

document
.getElementById(
"productCategory"
)
.value =

product
?
product.category || ""
:
"";

document
.getElementById(
"productUnit"
)
.value =

product
?
product.unit || "عدد"
:
"عدد";

document
.getElementById(
"productPurchasePrice"
)
.value =

product
?
product.purchasePrice || 0
:
0;

document
.getElementById(
"productSalePrice"
)
.value =

product
?
product.salePrice || 0
:
0;

document
.getElementById(
"productMinStock"
)
.value =

product
?
product.minStock || 0
:
0;

document
.getElementById(
"productNote"
)
.value =

product
?
product.note || ""
:
"";

document
.getElementById(
"productModal"
)
.classList
.add(
"show"
);

}


function closeProductModal(){

document
.getElementById(
"productModal"
)
.classList
.remove(
"show"
);

editingProductId =
null;

}


function saveProduct(){

if(!db){

alert(
"دیتابیس هنوز آماده نیست."
);

return;

}

const name =
document
.getElementById(
"productName"
)
.value
.trim();

const code =
document
.getElementById(
"productCode"
)
.value
.trim();

const category =
document
.getElementById(
"productCategory"
)
.value
.trim();

const unit =
document
.getElementById(
"productUnit"
)
.value;

const purchasePrice =
Number(
document
.getElementById(
"productPurchasePrice"
)
.value
) || 0;

const salePrice =
Number(
document
.getElementById(
"productSalePrice"
)
.value
) || 0;

const minStock =
Number(
document
.getElementById(
"productMinStock"
)
.value
) || 0;

const note =
document
.getElementById(
"productNote"
)
.value
.trim();

if(!name){

alert(
"لطفاً نام کالا را وارد کنید."
);

return;

}

const transaction =
db.transaction(
"products",
"readwrite"
);

const store =
transaction
.objectStore(
"products"
);

if(
editingProductId !== null
){

const request =
store.get(
editingProductId
);

request.onsuccess =
function(){

const product =
request.result;

if(!product){

alert(
"کالا پیدا نشد."
);

return;

}

product.name =
name;

product.code =
code;

product.category =
category;

product.unit =
unit;

product.purchasePrice =
purchasePrice;

product.salePrice =
salePrice;

product.minStock =
minStock;

product.note =
note;

product.updatedAt =
new Date()
.toISOString();

store.put(
product
);

};

}else{

store.add({

name:name,

code:code,

category:category,

unit:unit,

purchasePrice:purchasePrice,

salePrice:salePrice,

minStock:minStock,

stock:0,

note:note,

createdAt:
new Date()
.toISOString(),

createdDate:
getTodayJalali()

});

}

transaction.oncomplete =
function(){

closeProductModal();

loadProducts();

updateInventorySummary();

updateDashboard();

};

transaction.onerror =
function(){

alert(
"خطا در ذخیره کالا."
);

};

}


function loadProducts(){

if(!db){

return;

}

const list =
document.getElementById(
"productsList"
);

if(!list){

return;

}

list.innerHTML =
"";

const search =
(
document
.getElementById(
"productSearch"
)
.value || ""
)
.trim()
.toLowerCase();

const transaction =
db.transaction(
"products",
"readonly"
);

const request =
transaction
.objectStore(
"products"
)
.getAll();

request.onsuccess =
function(){

let products =
request.result;

if(search){

products =
products.filter(
function(product){

const name =
(
product.name ||
""
)
.toLowerCase();

const code =
(
product.code ||
""
)
.toLowerCase();

return (
name.includes(search)
||
code.includes(search)
);

}
);

}

products.sort(
function(a,b){

return b.id - a.id;

});

if(
products.length === 0
){

list.innerHTML = `

<div class="card">

<div class="empty">

هنوز کالایی در انبار ثبت نشده است.

<br><br>

برای شروع روی «کالای جدید» بزنید.

</div>

</div>

`;

return;

}

products.forEach(
function(product){

const stock = Number(product.stock) || 0;

let minStock = Number(product.minStock);
if(!Number.isFinite(minStock) || minStock < 0){
    minStock = 2; // پیش‌فرض اگر تعیین نشده
}

// سه وضعیت: ناموجود / کم / مناسب
let stockStatus = "ok"; // مناسب
if(stock === 0){
    stockStatus = "out"; // ناموجود
}else if(stock <= minStock){
    stockStatus = "low"; // کم
}

const isLow = (stockStatus !== "ok");

const card =
document.createElement(
"div"
);

card.className =
"product-card";

card.innerHTML = `

<div class="product-title">

📦

${escapeHTML(
product.name ||
"بدون نام"
)}

</div>

${
product.code
?

`

<div class="product-meta">

کد کالا:

${escapeHTML(
product.code
)}

</div>

`

:

""

}

<div class="product-meta">

دسته‌بندی:

${escapeHTML(
product.category ||
"بدون دسته‌بندی"
)}

</div>

<div class="product-meta">

واحد:

${escapeHTML(
product.unit ||
"عدد"
)}

</div>

<div class="product-meta">

موجودی:

<span class="${
    stockStatus === "ok" ? "stock-normal" :
    stockStatus === "out" ? "stock-out" : "stock-low"
}">
    ${stock.toLocaleString("fa-IR")}
    ${escapeHTML(product.unit || "عدد")}
</span>

<span class="stock-badge ${
    stockStatus === "ok" ? "normal" :
    stockStatus === "out" ? "out" : "low"
}">
    ${
        stockStatus === "out" ? "🚫 ناموجود" :
        stockStatus === "low" ? "⚠️ موجودی کم" :
        "✓ موجودی مناسب"
    }
</span>
</span>

</div>

<div class="product-price">

قیمت خرید:

${formatMoney(
product.purchasePrice
)}

</div>

<div class="product-price">

قیمت فروش:

${formatMoney(
product.salePrice
)}

</div>

<div class="product-actions">

<button
class="edit-btn"
onclick="editProduct(${product.id})">

ویرایش

</button>

<button
class="danger-btn"
onclick="deleteProduct(${product.id})">

حذف

</button>

</div>

`;

attachProductCardClick(
    card,
    product.id
);

list.appendChild(
card
);

});

};

}


function editProduct(
id
){

if(!db){

return;

}

const transaction =
db.transaction(
"products",
"readonly"
);

const request =
transaction
.objectStore(
"products"
)
.get(
id
);

request.onsuccess =
function(){

if(
request.result
){

openProductModal(
request.result
);

}

};

request.onerror =
function(){

alert(
"خطا در دریافت اطلاعات کالا."
);

};

}


function deleteProduct(
id
){

if(!db){

return;

}

if(
!confirm(
"آیا از حذف این کالا مطمئن هستید؟"
)
){

return;

}

const transaction =
db.transaction(
"products",
"readwrite"
);

transaction
.objectStore(
"products"
)
.delete(
id
);

transaction.oncomplete =
function(){

loadProducts();

updateInventorySummary();

updateDashboard();

};

transaction.onerror =
function(){

alert(
"خطا در حذف کالا."
);

};

}


function updateInventorySummary(){

if(!db){

return;

}

const transaction =
db.transaction(
"products",
"readonly"
);

const request =
transaction
.objectStore(
"products"
)
.getAll();

request.onsuccess =
function(){

const products =
request.result;

let totalStock =
0;

products.forEach(
function(product){

totalStock +=
Number(
product.stock
) || 0;

});

const countElement =
document.getElementById(
"inventoryProductCount"
);

const stockElement =
document.getElementById(
"inventoryTotalStock"
);

if(countElement){

countElement.innerText =
products.length
.toLocaleString(
"fa-IR"
);

}

if(stockElement){

stockElement.innerText =
totalStock
.toLocaleString(
"fa-IR"
);

}

};

}


function attachProductCardClick(
    cardElement,
    productId
){

    if(!cardElement){

        return;

    }


    cardElement.style.cursor =
        "pointer";


    cardElement.addEventListener(
        "click",
        function(event){

            /*
               اگر روی دکمه‌های عملیات کلیک شد،
               کارت کالا باز نشود.
            */

            if(
                event.target.closest(
                    "button"
                )
            ){

                return;

            }


            openProductProfile(
                productId
            );

        }
    );

}


function openProductProfile(productId){

    if(!db){

        alert(
            "دیتابیس هنوز آماده نیست."
        );

        return;

    }


    const transaction =
        db.transaction(
            [
                "products",
                "stockTransactions",
                "purchaseInvoices",
                "salesInvoices",
                "invoiceItems",
                "repairs"
            ],
            "readonly"
        );


    const productStore =
        transaction.objectStore(
            "products"
        );


    const productRequest =
        productStore.get(
            productId
        );


    productRequest.onsuccess =
        function(){

            const product =
                productRequest.result;


            if(!product){

                alert(
                    "اطلاعات کالا پیدا نشد."
                );

                return;

            }


            let stockTransactions = [];

            let purchaseInvoices = [];

            let salesInvoices = [];

            let invoiceItems = [];

            let repairs = [];


            try{

                const request =
                    transaction
                    .objectStore(
                        "stockTransactions"
                    )
                    .getAll();


                request.onsuccess =
                    function(){

                        stockTransactions =
                            request.result || [];

                    };

            }catch(error){}



            try{

                const request =
                    transaction
                    .objectStore(
                        "purchaseInvoices"
                    )
                    .getAll();


                request.onsuccess =
                    function(){

                        purchaseInvoices =
                            request.result || [];

                    };

            }catch(error){}



            try{

                const request =
                    transaction
                    .objectStore(
                        "salesInvoices"
                    )
                    .getAll();


                request.onsuccess =
                    function(){

                        salesInvoices =
                            request.result || [];

                    };

            }catch(error){}



            try{

                const request =
                    transaction
                    .objectStore(
                        "invoiceItems"
                    )
                    .getAll();


                request.onsuccess =
                    function(){

                        invoiceItems =
                            request.result || [];

                    };

            }catch(error){}



            try{

                const request =
                    transaction
                    .objectStore(
                        "repairs"
                    )
                    .getAll();


                request.onsuccess =
                    function(){

                        repairs =
                            request.result || [];

                    };

            }catch(error){}



            transaction.oncomplete =
                function(){

                    const stats =
                        calculateProductStatistics(
                            product,
                            stockTransactions,
                            purchaseInvoices,
                            salesInvoices,
                            invoiceItems,
                            repairs
                        );


                    renderProductProfile(
                        product,
                        stats
                    );

                };

        };

}


function calculateProductStatistics(
    product,
    stockTransactions,
    purchaseInvoices,
    salesInvoices,
    invoiceItems,
    repairs
){

    let currentStock =
        Number(
            product.stock
        ) || 0;


    let totalPurchaseQuantity =
        0;


    let totalPurchaseAmount =
        0;


    let totalSaleQuantity =
        0;


    let totalSaleAmount =
        0;


    let totalRepairConsumption =
        0;


    let transactionHistory = [];


    /*
       ---------------------------------------------------------
       1. تاریخچه تراکنش‌های انبار
       ---------------------------------------------------------
    */

    stockTransactions
    .filter(
        function(transaction){

            return (
                Number(
                    transaction.productId
                ) ===
                Number(
                    product.id
                )
            );

        }
    )
    .forEach(
        function(transaction){

            const quantity =
                Number(
                    transaction.quantity
                ) || 0;


            const type =
                transaction.type ||
                transaction.transactionType ||
                "";


            transactionHistory.push({

    date:
        transaction.date ||
        transaction.createdDate ||
        "-",

    time:
        transaction.time ||
        "",

    type:
        type,

    quantity:
        quantity,

    reason:
        transaction.reason ||
        "",

    note:
        transaction.note ||
        transaction.description ||
        "",

    stockBefore:
        Number(
            transaction.stockBefore
        ) || 0,

    stockAfter:
        Number(
            transaction.stockAfter
        ) || 0,

    createdAt:
        transaction.createdAt ||
        ""

});

        }
    );


    /*
       ---------------------------------------------------------
       2. اقلام فاکتور خرید
       ---------------------------------------------------------
    */

    const productInvoiceItems =
        invoiceItems
        .filter(
            function(item){

                return (

                    Number(
                        item.productId
                    ) ===
                    Number(
                        product.id
                    )

                );

            }
        );


    productInvoiceItems
    .forEach(
        function(item){

            const quantity =
                Number(
                    item.quantity
                ) || 0;


            const unitPrice =
                Number(
                    item.purchasePrice ||
                    item.unitPrice ||
                    item.price ||
                    0
                );


            /*
               تشخیص خرید

               فیلدهای احتمالی:
               invoiceType
               type
               transactionType
               invoiceId
            */

            const itemType =
                String(
                    item.invoiceType ||
                    item.type ||
                    item.transactionType ||
                    ""
                )
                .toLowerCase();


            if(

                itemType.includes(
                    "خرید"
                )

                ||

                itemType.includes(
                    "purchase"
                )

            ){

                totalPurchaseQuantity +=
                    quantity;


                totalPurchaseAmount +=
                    quantity *
                    unitPrice;


                transactionHistory.push({

                    date:
                        item.date ||
                        item.createdDate ||
                        "-",

                    type:
                        "ورود",

                    quantity:
                        quantity,

                    note:
                        "ورود از فاکتور خرید"

                });

            }


            if(

                itemType.includes(
                    "فروش"
                )

                ||

                itemType.includes(
                    "sale"
                )

            ){

                const salePrice =
                    Number(
                        item.salePrice ||
                        item.unitPrice ||
                        item.price ||
                        0
                    );


                totalSaleQuantity +=
                    quantity;


                totalSaleAmount +=
                    quantity *
                    salePrice;


                transactionHistory.push({

                    date:
                        item.date ||
                        item.createdDate ||
                        "-",

                    type:
                        "خروج",

                    quantity:
                        quantity,

                    note:
                        "خروج از فاکتور فروش"

                });

            }

        }
    );


    /*
       ---------------------------------------------------------
       3. بررسی مستقیم فاکتورهای خرید
       ---------------------------------------------------------
    */

    purchaseInvoices
    .forEach(
        function(invoice){

            /*
               فقط در صورتی که خود فاکتور
               productId داشته باشد.
            */

            if(

                Number(
                    invoice.productId
                ) ===
                Number(
                    product.id
                )

            ){

                const quantity =
                    Number(
                        invoice.quantity
                    ) || 0;


                const price =
                    Number(
                        invoice.purchasePrice ||
                        invoice.unitPrice ||
                        invoice.price ||
                        0
                    );


                totalPurchaseQuantity +=
                    quantity;


                totalPurchaseAmount +=
                    quantity *
                    price;

            }

        }
    );


    /*
       ---------------------------------------------------------
       4. بررسی مستقیم فاکتورهای فروش
       ---------------------------------------------------------
    */

    salesInvoices
    .forEach(
        function(invoice){

            if(

                Number(
                    invoice.productId
                ) ===
                Number(
                    product.id
                )

            ){

                const quantity =
                    Number(
                        invoice.quantity
                    ) || 0;


                const price =
                    Number(
                        invoice.salePrice ||
                        invoice.unitPrice ||
                        invoice.price ||
                        0
                    );


                totalSaleQuantity +=
                    quantity;


                totalSaleAmount +=
                    quantity *
                    price;

            }

        }
    );


    /*
       ---------------------------------------------------------
       5. مصرف در تعمیرات
       ---------------------------------------------------------

       فقط داده‌های ساختاریافته قابل اعتماد هستند.

       مثال:

       repair.partsItems = [
           {
               productId: 12,
               quantity: 2
           }
       ]

       یا:

       repair.partsUsed = [
           {
               productId: 12,
               quantity: 2
           }
       ]
    */

    repairs
    .forEach(
        function(repair){

            const usedItems =

                Array.isArray(
                    repair.partsItems
                )

                ?

                repair.partsItems

                :

                Array.isArray(
                    repair.partsUsed
                )

                ?

                repair.partsUsed

                :

                [];


            usedItems
            .forEach(
                function(item){

                    if(

                        Number(
                            item.productId
                        ) ===
                        Number(
                            product.id
                        )

                    ){

                        totalRepairConsumption +=

                            Number(
                                item.quantity
                            ) || 0;

                    }

                }
            );

        }
    );


    /*
       ---------------------------------------------------------
       6. تاریخچه را از جدید به قدیم مرتب کن
       ---------------------------------------------------------
    */

    transactionHistory.sort(function(a, b){

    // اولویت ۱: createdAt (دقیق‌ترین)
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    if(timeA && timeB && timeA !== timeB){
        return timeB - timeA; // جدیدتر بالا
    }

    // اولویت ۲: تاریخ + ساعت فارسی
    const keyA = String(a.date || "") + " " + String(a.time || "");
    const keyB = String(b.date || "") + " " + String(b.time || "");

    return keyB.localeCompare(keyA, "fa");
});

    /*
       اگر موجودی فعلی در خود کالا وجود داشته باشد،
       همان مقدار منبع اصلی است.

       در غیر این صورت صفر.
    */

    currentStock =
        Number(
            product.stock
        ) || 0;


    return {

        currentStock:
            currentStock,

        totalPurchaseQuantity:
            totalPurchaseQuantity,

        totalPurchaseAmount:
            totalPurchaseAmount,

        totalSaleQuantity:
            totalSaleQuantity,

        totalSaleAmount:
            totalSaleAmount,

        totalRepairConsumption:
            totalRepairConsumption,

        transactionHistory:
            transactionHistory

    };

}


function renderProductProfile(
    product,
    stats
){

    const inventoryPage =
        document.getElementById(
            "inventoryPage"
        );


    if(!inventoryPage){

        return;

    }


    /*
       ذخیره ID کالا برای بازگشت
    */

    window.currentProductProfileId =
        product.id;


    let historyHTML = "";


    /* ============================================================
       ساخت تاریخچه کامل تراکنش‌های کالا
       ============================================================ */

    if(
        !stats.transactionHistory ||
        stats.transactionHistory.length === 0
    ){

        historyHTML = `

        <div class="empty">

        هنوز هیچ تراکنشی برای این کالا ثبت نشده است.

        </div>

        `;

    }else{


        stats
        .transactionHistory
        .forEach(
            function(item){

                const type =
                    String(
                        item.type ||
                        ""
                    )
                    .toUpperCase();


                let title =
                    "تراکنش کالا";


                let icon =
                    "📦";


                let quantityText =
                    Number(
                        item.quantity || 0
                    )
                    .toLocaleString(
                        "fa-IR"
                    );


                let quantityPrefix =
                    "";


                /*
                   ورود کالا
                */

                if(
                    type === "IN"
                ){

                    title =
                        "ورود کالا";

                    icon =
                        "📥";

                    quantityPrefix =
                        "+";

                }


                /*
                   خروج کالا
                */

                else if(
                    type === "OUT"
                ){

                    title =
                        "خروج کالا";

                    icon =
                        "📤";

                    quantityPrefix =
                        "-";

                }


                /*
                   برگشت از مشتری
                */

                else if(
                    type === "RETURN_IN"
                ){

                    title =
                        "برگشت از مشتری";

                    icon =
                        "🔄";

                    quantityPrefix =
                        "+";

                }


                /*
                   برگشت به تأمین‌کننده
                */

                else if(
                    type === "RETURN_OUT"
                ){

                    title =
                        "برگشت به تأمین‌کننده";

                    icon =
                        "🔄";

                    quantityPrefix =
                        "-";

                }


                /*
                   اصلاح موجودی
                */

                else if(
                    type === "ADJUSTMENT"
                ){

                    title =
                        "اصلاح موجودی";

                    icon =
                        "⚖️";

                }


                /*
                   مقدار نمایش داده‌شده
                */

                let displayQuantity =
                    quantityPrefix +
                    quantityText;


                /*
                   در اصلاح موجودی،
                   quantity همان موجودی نهایی است.
                */

                if(
                    type === "ADJUSTMENT"
                ){

                    displayQuantity =

                        "موجودی جدید: " +

                        Number(
                            item.stockAfter || 0
                        )
                        .toLocaleString(
                            "fa-IR"
                        ) +

                        " عدد";

                }


                historyHTML += `

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
                            font-size:16px;
                            ">

                            ${icon}

                            ${title}

                            </div>


                            <div
                            class="customer-info">

                            📅

                            ${
                                escapeHTML(
                                    item.date ||
                                    "-"
                                )
                            }

                            ${
                                item.time
                                ?
                                " ⏰ " +
                                escapeHTML(
                                    item.time
                                )
                                :
                                ""
                            }

                            </div>


                            <div
                            class="customer-info">

                            📝 دلیل:

                            ${
                                escapeHTML(
                                    item.reason ||
                                    item.note ||
                                    "بدون توضیحات"
                                )
                            }

                            </div>


                            ${
                                item.note
                                ?

                                `

                                <div
                                class="customer-info">

                                💬 توضیحات:

                                ${
                                    escapeHTML(
                                        item.note
                                    )
                                }

                                </div>

                                `

                                :

                                ""

                            }


                            <div
                            class="customer-info">

                            📦 موجودی:

                            ${
                                Number(
                                    item.stockBefore || 0
                                )
                                .toLocaleString(
                                    "fa-IR"
                                )
                            }

                            ←

                            ${
                                Number(
                                    item.stockAfter || 0
                                )
                                .toLocaleString(
                                    "fa-IR"
                                )
                            }

                            </div>


                        </div>


                        <div
                        style="
                        font-size:18px;
                        font-weight:bold;
                        white-space:nowrap;
                        ">

                        ${displayQuantity}

                        </div>


                    </div>


                </div>

                `;

            }
        );

    }


    /* ============================================================
       نمایش کامل کارت کالا
       ============================================================ */

    inventoryPage.innerHTML = `

    <div
    class="back-btn"
    onclick="returnToInventoryList()">

    ← بازگشت به انبار

    </div>


    <div class="section-title">

    📦 کارت اختصاصی کالا

    </div>


    <div class="card">


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

                📦

                ${
                    escapeHTML(
                        product.name ||
                        "بدون نام"
                    )
                }

                </div>


                <div
                class="customer-info">

                شناسه کالا:

                ${
                    product.id
                }

                </div>


                <div
                class="customer-info">

                تاریخ ثبت:

                ${
                    escapeHTML(
                        product.createdDate ||
                        "-"
                    )
                }

                </div>

            </div>


            <div
            class="badge">

            کالا

            </div>


        </div>


        <div
        class="info-grid">


            <div
            class="info-box">

                <div
                class="info-label">

                موجودی فعلی

                </div>

                <div
                class="info-value"
                style="
                font-size:20px;
                ">

                ${
                    Number(
                        stats.currentStock
                    )
                    .toLocaleString(
                        "fa-IR"
                    )
                }

                عدد

                </div>

            </div>


            <div
            class="info-box">

                <div
                class="info-label">

                مجموع خرید

                </div>

                <div
                class="info-value">

                ${
                    formatMoney(
                        stats.totalPurchaseAmount
                    )
                }

                </div>

                <div
                style="
                font-size:11px;
                color:#777;
                margin-top:5px;
                ">

                تعداد:

                ${
                    Number(
                        stats.totalPurchaseQuantity
                    )
                    .toLocaleString(
                        "fa-IR"
                    )
                }

                </div>

            </div>


            <div
            class="info-box">

                <div
                class="info-label">

                مجموع فروش

                </div>

                <div
                class="info-value">

                ${
                    formatMoney(
                        stats.totalSaleAmount
                    )
                }

                </div>

                <div
                style="
                font-size:11px;
                color:#777;
                margin-top:5px;
                ">

                تعداد:

                ${
                    Number(
                        stats.totalSaleQuantity
                    )
                    .toLocaleString(
                        "fa-IR"
                    )
                }

                </div>

            </div>


            <div
            class="info-box">

                <div
                class="info-label">

                مصرف در تعمیرات

                </div>

                <div
                class="info-value">

                ${
                    Number(
                        stats.totalRepairConsumption
                    )
                    .toLocaleString(
                        "fa-IR"
                    )
                }

                عدد

                </div>

            </div>


        </div>


        <div
        class="card-actions product-card-actions">


            <button
            class="edit-btn"
            onclick="editProductFromProfile(
                ${product.id}
            )">

            ✏️ ویرایش کالا

            </button>


            <button
            class="danger-btn"
            onclick="deleteProductFromProfile(
                ${product.id}
            )">

            🗑️ حذف کالا

            </button>


            <button
            class="secondary-btn"
            onclick="manualProductStockOut(
                ${product.id}
            )">

            📤 خروج کالا

            </button>


            <button
            class="primary-btn"
            onclick="adjustProductStock(
                ${product.id}
            )">

            ⚖️ اصلاح موجودی

            </button>


            <button
            class="primary-btn"
            onclick="returnProductStock(
                ${product.id}
            )">

            🔄 برگشت کالا

            </button>


        </div>


    </div>


    <div class="section-title">

    📊 تاریخچه تراکنش‌های کالا

    </div>


    <div class="card">

        <div
        id="productTransactionHistory">

        ${historyHTML}

        </div>

    </div>


    `;

}


function returnToInventoryList(){
     // پاک‌سازی حالت ویرایش فاکتور خرید
    editingPurchaseInvoiceId = null;
    if(typeof currentPurchaseInvoiceItems !== "undefined"){
        currentPurchaseInvoiceItems = [];
    }

    window.currentProductProfileId = null;

    const inventoryPage = document.getElementById("inventoryPage");
    if(!inventoryPage) return;

    // بازسازی ساختار اصلی صفحه انبار
    inventoryPage.innerHTML = `
        <div class="section-title">
            📦 انبار
        </div>

        <div class="card">
            <div class="inventory-summary">
                <div class="inventory-stat">
                    <div class="inventory-stat-title">تعداد کالاها</div>
                    <div class="inventory-stat-value" id="inventoryProductCount">0</div>
                </div>
                <div class="inventory-stat">
                    <div class="inventory-stat-title">مجموع موجودی</div>
                    <div class="inventory-stat-value" id="inventoryTotalStock">0</div>
                </div>
            </div>

            <div style="margin-top:15px">
                <button class="primary-btn" onclick="openProductModal()">
                    + کالای جدید
                </button>
            </div>
        </div>

        <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
                id="productSearch"
                type="search"
                placeholder="جستجوی نام کالا یا کد کالا..."
                autocomplete="off">
        </div>

        <div id="productsList"></div>
    `;

    // فعال‌سازی مجدد جستجو
    const productSearch = document.getElementById("productSearch");
    if(productSearch){
        productSearch.addEventListener("input", loadProducts);
    }

    // بارگذاری لیست و خلاصه
    loadProducts();
    updateInventorySummary();
    renderInventoryImportButton();  // دکمه Markdown
}


async function manualProductStockOut(productId){

    if(!productId){

        alert(
            "شناسه کالا نامعتبر است."
        );

        return;

    }


    if(!db){

        alert(
            "دیتابیس هنوز آماده نیست."
        );

        return;

    }


    /*
       دریافت اطلاعات کالا
    */

    const transaction =
        db.transaction(
            [
                "products"
            ],
            "readonly"
        );


    const productStore =
        transaction.objectStore(
            "products"
        );


    const request =
        productStore.get(
            Number(productId)
        );


    request.onsuccess =
        function(){

            const product =
                request.result;


            if(!product){

                alert(
                    "کالا پیدا نشد."
                );

                return;

            }


            const currentStock =
                Number(
                    product.stock || 0
                );


            /*
               دریافت تعداد خروج
            */

            const quantityInput =
                prompt(

                    "تعداد کالای خروجی را وارد کنید:\n\n" +
                    "موجودی فعلی: " +
                    currentStock.toLocaleString(
                        "fa-IR"
                    ) +
                    " عدد"

                );


            /*
               لغو عملیات
            */

            if(
                quantityInput === null
            ){

                return;

            }


            /*
               تبدیل اعداد فارسی و عربی
               به انگلیسی
            */

            const normalizedQuantity =
                String(
                    quantityInput
                )
                .replace(
                    /[۰-۹]/g,
                    function(d){

                        return String(
                            "۰۱۲۳۴۵۶۷۸۹"
                            .indexOf(d)
                        );

                    }
                )
                .replace(
                    /[٠-٩]/g,
                    function(d){

                        return String(
                            "٠١٢٣٤٥٦٧٨٩"
                            .indexOf(d)
                        );

                    }
                )
                .replace(
                    /[,،]/g,
                    ""
                )
                .trim();


            const quantity =
                Number(
                    normalizedQuantity
                );


            /*
               بررسی مقدار
            */

            if(
                !Number.isFinite(
                    quantity
                ) ||
                quantity <= 0
            ){

                alert(
                    "لطفاً یک تعداد معتبر بیشتر از صفر وارد کنید."
                );

                return;

            }


            /*
               جلوگیری از خروج بیشتر
               از موجودی فعلی
            */

            if(
                quantity >
                currentStock
            ){

                alert(

                    "موجودی کافی نیست.\n\n" +

                    "موجودی فعلی: " +
                    currentStock.toLocaleString(
                        "fa-IR"
                    ) +

                    " عدد\n\n" +

                    "مقدار خروج: " +
                    quantity.toLocaleString(
                        "fa-IR"
                    ) +

                    " عدد"

                );

                return;

            }


            /*
               دریافت دلیل خروج
            */

            const reason =
                prompt(
                    "دلیل خروج کالا را وارد کنید:",
                    "خروج دستی"
                );


            /*
               لغو عملیات
            */

            if(
                reason === null
            ){

                return;

            }


            if(
                !String(
                    reason
                ).trim()
            ){

                alert(
                    "دلیل خروج الزامی است."
                );

                return;

            }


            /*
               ثبت تراکنش
            */

            recordStockTransaction({

                productId:
                    Number(productId),

                type:
                    "OUT",

                quantity:
                    quantity,

                reason:
                    String(
                        reason
                    ).trim()

            })

            .then(
                function(){

                    alert(

                        "خروج کالا با موفقیت ثبت شد.\n\n" +

                        "تعداد خروج: " +
                        quantity.toLocaleString(
                            "fa-IR"
                        ) +

                        " عدد\n\n" +

                        "موجودی جدید: " +
                        (
                            currentStock -
                            quantity
                        ).toLocaleString(
                            "fa-IR"
                        ) +

                        " عدد"

                    );


                    /*
                       بازخوانی کارت کالا
                    */

                    openProductProfile(
                        Number(productId)
                    );

                }
            )

            .catch(
                function(error){

                    console.error(
                        "خطا در خروج کالا:",
                        error
                    );


                    alert(

                        error &&
                        error.message

                        ?

                        error.message

                        :

                        "خطایی هنگام ثبت خروج کالا رخ داد."

                    );

                }
            );

        };


    request.onerror =
        function(){

            alert(
                "خطا در دریافت اطلاعات کالا."
            );

        };

}


async function adjustProductStock(productId){

    if(!productId){

        alert(
            "شناسه کالا نامعتبر است."
        );

        return;

    }


    if(!db){

        alert(
            "دیتابیس هنوز آماده نیست."
        );

        return;

    }


    /*
       دریافت اطلاعات کالا
    */

    const transaction =
        db.transaction(
            [
                "products"
            ],
            "readonly"
        );


    const productStore =
        transaction.objectStore(
            "products"
        );


    const request =
        productStore.get(
            Number(productId)
        );


    request.onsuccess =
        function(){

            const product =
                request.result;


            if(!product){

                alert(
                    "کالا پیدا نشد."
                );

                return;

            }


            /*
               موجودی فعلی
            */

            const currentStock =
                Number(
                    product.stock || 0
                );


            /*
               دریافت موجودی واقعی
            */

            const newStockInput =
                prompt(

                    "موجودی واقعی کالا را وارد کنید:\n\n" +

                    "موجودی ثبت‌شده فعلی: " +

                    currentStock.toLocaleString(
                        "fa-IR"
                    ) +

                    " عدد"

                );


            /*
               لغو عملیات
            */

            if(
                newStockInput === null
            ){

                return;

            }


            /*
               تبدیل اعداد فارسی و عربی
               به انگلیسی
            */

            const normalizedStock =
                String(
                    newStockInput
                )
                .replace(
                    /[۰-۹]/g,
                    function(d){

                        return String(
                            "۰۱۲۳۴۵۶۷۸۹"
                            .indexOf(d)
                        );

                    }
                )
                .replace(
                    /[٠-٩]/g,
                    function(d){

                        return String(
                            "٠١٢٣٤٥٦٧٨٩"
                            .indexOf(d)
                        );

                    }
                )
                .replace(
                    /[,،]/g,
                    ""
                )
                .trim();


            const newStock =
                Number(
                    normalizedStock
                );


            /*
               بررسی مقدار
            */

            if(
                !Number.isFinite(
                    newStock
                ) ||
                newStock < 0
            ){

                alert(
                    "لطفاً یک موجودی معتبر وارد کنید."
                );

                return;

            }


            /*
               اگر مقدار جدید با مقدار قبلی برابر باشد
            */

            if(
                newStock ===
                currentStock
            ){

                alert(
                    "موجودی جدید با موجودی فعلی برابر است."
                );

                return;

            }


            /*
               محاسبه اختلاف
            */

            const difference =
                newStock -
                currentStock;


            /*
               دریافت دلیل اصلاح
            */

            const reason =
                prompt(

                    "دلیل اصلاح موجودی را وارد کنید:\n\n" +

                    "موجودی قبلی: " +
                    currentStock.toLocaleString(
                        "fa-IR"
                    ) +

                    " عدد\n" +

                    "موجودی جدید: " +
                    newStock.toLocaleString(
                        "fa-IR"
                    ) +

                    " عدد\n\n" +

                    "اختلاف: " +

                    (
                        difference > 0
                        ?
                        "+"
                        :
                        ""
                    ) +

                    difference.toLocaleString(
                        "fa-IR"
                    ) +

                    " عدد",

                    "اصلاح موجودی انبار"

                );


            /*
               لغو عملیات
            */

            if(
                reason === null
            ){

                return;

            }


            if(
                !String(
                    reason
                ).trim()
            ){

                alert(
                    "دلیل اصلاح موجودی الزامی است."
                );

                return;

            }


            /*
               ثبت تراکنش اصلاح موجودی
            */

            recordStockTransaction({

                productId:
                    Number(productId),

                type:
                    "ADJUSTMENT",

                quantity:
                    newStock,

                reason:
                    String(
                        reason
                    ).trim()

            })

            .then(
                function(){

                    alert(

                        "اصلاح موجودی با موفقیت ثبت شد.\n\n" +

                        "موجودی قبلی: " +

                        currentStock.toLocaleString(
                            "fa-IR"
                        ) +

                        " عدد\n\n" +

                        "موجودی جدید: " +

                        newStock.toLocaleString(
                            "fa-IR"
                        ) +

                        " عدد"

                    );


                    /*
                       بازخوانی کارت کالا
                    */

                    openProductProfile(
                        Number(productId)
                    );

                }
            )

            .catch(
                function(error){

                    console.error(
                        "خطا در اصلاح موجودی:",
                        error
                    );


                    alert(

                        error &&
                        error.message

                        ?

                        error.message

                        :

                        "خطایی هنگام اصلاح موجودی رخ داد."

                    );

                }
            );

        };


    request.onerror =
        function(){

            alert(
                "خطا در دریافت اطلاعات کالا."
            );

        };

}


async function returnProductStock(productId){

    if(!productId){

        alert(
            "شناسه کالا نامعتبر است."
        );

        return;

    }


    if(!db){

        alert(
            "دیتابیس هنوز آماده نیست."
        );

        return;

    }


    /*
       دریافت اطلاعات کالا
    */

    const transaction =
        db.transaction(
            [
                "products"
            ],
            "readonly"
        );


    const productStore =
        transaction.objectStore(
            "products"
        );


    const request =
        productStore.get(
            Number(productId)
        );


    request.onsuccess =
        function(){

            const product =
                request.result;


            if(!product){

                alert(
                    "کالا پیدا نشد."
                );

                return;

            }


            const currentStock =
                Number(
                    product.stock || 0
                );


            /*
               انتخاب نوع برگشت
            */

            const returnType =
                prompt(

                    "نوع برگشت کالا را انتخاب کنید:\n\n" +

                    "1 ← برگشت به تأمین‌کننده\n" +

                    "2 ← برگشت از مشتری\n\n" +

                    "عدد 1 یا 2 را وارد کنید."

                );


            /*
               لغو عملیات
            */

            if(
                returnType === null
            ){

                return;

            }


            let transactionType = "";

            let returnTitle = "";

            let stockChange = 0;


            /*
               برگشت به تأمین‌کننده
            */

            if(
                String(
                    returnType
                ).trim() === "1"
            ){

                transactionType =
                    "RETURN_OUT";

                returnTitle =
                    "برگشت به تأمین‌کننده";

                stockChange =
                    -1;

            }


            /*
               برگشت از مشتری
            */

            else if(
                String(
                    returnType
                ).trim() === "2"
            ){

                transactionType =
                    "RETURN_IN";

                returnTitle =
                    "برگشت از مشتری";

                stockChange =
                    1;

            }


            else{

                alert(
                    "انتخاب نامعتبر است."
                );

                return;

            }


            /*
               دریافت تعداد برگشت
            */

            const quantityInput =
                prompt(

                    returnTitle +

                    "\n\nتعداد کالا را وارد کنید:\n\n" +

                    "موجودی فعلی: " +

                    currentStock.toLocaleString(
                        "fa-IR"
                    ) +

                    " عدد"

                );


            /*
               لغو عملیات
            */

            if(
                quantityInput === null
            ){

                return;

            }


            /*
               تبدیل اعداد فارسی و عربی
               به انگلیسی
            */

            const normalizedQuantity =
                String(
                    quantityInput
                )
                .replace(
                    /[۰-۹]/g,
                    function(d){

                        return String(
                            "۰۱۲۳۴۵۶۷۸۹"
                            .indexOf(d)
                        );

                    }
                )
                .replace(
                    /[٠-٩]/g,
                    function(d){

                        return String(
                            "٠١٢٣٤٥٦٧٨٩"
                            .indexOf(d)
                        );

                    }
                )
                .replace(
                    /[,،]/g,
                    ""
                )
                .trim();


            const quantity =
                Number(
                    normalizedQuantity
                );


            /*
               بررسی تعداد
            */

            if(
                !Number.isFinite(
                    quantity
                ) ||
                quantity <= 0
            ){

                alert(
                    "لطفاً یک تعداد معتبر بیشتر از صفر وارد کنید."
                );

                return;

            }


            /*
               جلوگیری از برگشت بیشتر
               از موجودی در برگشت به تأمین‌کننده
            */

            if(
                transactionType ===
                "RETURN_OUT" &&
                quantity >
                currentStock
            ){

                alert(

                    "موجودی کافی نیست.\n\n" +

                    "موجودی فعلی: " +

                    currentStock.toLocaleString(
                        "fa-IR"
                    ) +

                    " عدد\n\n" +

                    "مقدار برگشت: " +

                    quantity.toLocaleString(
                        "fa-IR"
                    ) +

                    " عدد"

                );

                return;

            }


            /*
               دریافت دلیل
            */

            const reason =
                prompt(

                    "دلیل برگشت کالا را وارد کنید:",

                    returnTitle

                );


            /*
               لغو عملیات
            */

            if(
                reason === null
            ){

                return;

            }


            if(
                !String(
                    reason
                ).trim()
            ){

                alert(
                    "دلیل برگشت الزامی است."
                );

                return;

            }


            /*
               محاسبه موجودی جدید
            */

            const newStock =
                currentStock +
                (
                    quantity *
                    stockChange
                );


            /*
               ثبت تراکنش
            */

            recordStockTransaction({

                productId:
                    Number(productId),

                type:
                    transactionType,

                quantity:
                    quantity,

                reason:
                    String(
                        reason
                    ).trim()

            })

            .then(
                function(){

                    alert(

                        "برگشت کالا با موفقیت ثبت شد.\n\n" +

                        "نوع: " +
                        returnTitle +

                        "\n\n" +

                        "تعداد: " +

                        quantity.toLocaleString(
                            "fa-IR"
                        ) +

                        " عدد\n\n" +

                        "موجودی جدید: " +

                        newStock.toLocaleString(
                            "fa-IR"
                        ) +

                        " عدد"

                    );


                    /*
                       بازخوانی کارت کالا
                    */

                    openProductProfile(
                        Number(productId)
                    );

                }
            )

            .catch(
                function(error){

                    console.error(
                        "خطا در ثبت برگشت کالا:",
                        error
                    );


                    alert(

                        error &&
                        error.message

                        ?

                        error.message

                        :

                        "خطایی هنگام ثبت برگشت کالا رخ داد."

                    );

                }
            );

        };


    request.onerror =
        function(){

            alert(
                "خطا در دریافت اطلاعات کالا."
            );

        };

}


function editProductFromProfile(
    productId
){

    /*
       قبل از رفتن به فرم،
       ID کارت فعلی را نگه می‌داریم.
    */

    window.currentProductProfileId =
        productId;


    /*
       استفاده از تابع فعلی سیستم
       بدون بازنویسی آن.
    */

    if(
        typeof editProduct ===
        "function"
    ){

        editProduct(
            productId
        );

        return;

    }


    alert(
        "تابع ویرایش کالا در کد فعلی پیدا نشد."
    );

}


function deleteProductFromProfile(
    productId
){

    if(
        !confirm(
            "آیا از حذف این کالا مطمئن هستید؟"
        )
    ){

        return;

    }


    if(!db){

        alert(
            "دیتابیس آماده نیست."
        );

        return;

    }


    const transaction =
        db.transaction(
            "products",
            "readwrite"
        );


    transaction
    .objectStore(
        "products"
    )
    .delete(
        productId
    );


    transaction.oncomplete =
        function(){

            window.currentProductProfileId =
                null;


            /*
               بازگشت به لیست اصلی انبار
            */

            returnToInventoryList();

        };


    transaction.onerror =
        function(){

            alert(
                "حذف کالا انجام نشد."
            );

        };

}


function openMarkdownImport(){

    if(!db){

        alert(
            "دیتابیس هنوز آماده نیست."
        );

        return;

    }


    let oldModal =
        document.getElementById(
            "markdownImportModal"
        );


    if(oldModal){

        oldModal.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "markdownImportModal";


    modal.className =
        "modal show";


    modal.innerHTML = `

    <div class="modal-content">

        <div class="modal-header">

            <h3>
            📥 ورود کالاها از فایل Markdown
            </h3>

            <div
            class="close"
            onclick="closeMarkdownImport()">

            ×

            </div>

        </div>


        <p style="
        color:#666;
        font-size:13px;
        line-height:1.9;
        ">

        فایل لیست کالاها را انتخاب کنید.
        موجودی اولیه تمام کالاها صفر در نظر گرفته می‌شود.
        قیمت فروش تمام کالاها به‌صورت خودکار
        ۵۰٪ بیشتر از قیمت خرید محاسبه می‌شود.

        </p>


        <label>
        انتخاب فایل Markdown
        </label>


        <input
        id="markdownFileInput"
        type="file"
        accept=".md,text/markdown,text/plain">


        <div
        id="markdownImportPreview"
        style="margin-top:15px">

        </div>


        <button
        id="markdownReadButton"
        class="primary-btn"
        style="
        width:100%;
        margin-top:15px;
        "
        onclick="readMarkdownInventoryFile()">

        📖 خواندن فایل

        </button>


        <button
        class="secondary-btn"
        style="
        width:100%;
        margin-top:10px;
        "
        onclick="closeMarkdownImport()">

        انصراف

        </button>

    </div>

    `;


    document.body.appendChild(
        modal
    );

}


function confirmMarkdownInventoryImport(){

    const products =
        window
        .pendingMarkdownProducts;


    if(
        !products
        ||
        products.length === 0
    ){

        alert(
            "لیست کالاها آماده نیست."
        );

        return;

    }


    if(
        !confirm(
            "آیا می‌خواهید " +
            products.length +
            " کالا وارد دیتابیس شود؟\n\n" +
            "موجودی اولیه همه کالاها صفر خواهد بود.\n" +
            "قیمت فروش هر کالا برابر با ۱۵۰٪ قیمت خرید خواهد بود."
        )
    ){

        return;

    }


    const transaction =
        db.transaction(
            "products",
            "readwrite"
        );


    const store =
        transaction
        .objectStore(
            "products"
        );


    const request =
        store.getAll();


    request.onsuccess =
        function(){

            const existingProducts =
                request.result;


            let added =
                0;


            let skipped =
                0;


            products.forEach(
                function(product){

                    const productName =
                        product.name
                        .trim()
                        .toLowerCase();


                    const duplicate =
                        existingProducts
                        .some(
                            function(existing){

                                return (

                                    String(
                                        existing.name ||
                                        ""
                                    )
                                    .trim()
                                    .toLowerCase()

                                    ===

                                    productName

                                );

                            }
                        );


                    if(
                        duplicate
                    ){

                        skipped++;

                        return;

                    }


                    const newProduct = {

                        name:
                            product.name,

                        /*
                        مهم:
                        موجودی اولیه همیشه صفر است.
                        مقدار stock از Markdown
                        هرگز وارد دیتابیس نمی‌شود.
                        */

                        stock:
                            0,

                        purchasePrice:
                            Number(
                                product.purchasePrice
                            ) || 0,

                        salePrice:
                            Math.round(
                                (
                                    Number(
                                        product.purchasePrice
                                    ) || 0
                                ) * 1.5
                            ),

                        createdAt:
                            new Date()
                            .toISOString(),

                        createdDate:
                            getTodayJalali()

                    };


                    store.add(
                        newProduct
                    );


                    existingProducts.push(
                        newProduct
                    );


                    added++;

                }
            );


            transaction.oncomplete =
                function(){

                    window
                    .pendingMarkdownProducts =
                    null;


                    closeMarkdownImport();


                    updateDashboard();


                    alert(

                        "ورود کالاها با موفقیت انجام شد.\n\n" +

                        "کالاهای جدید: " +
                        added +

                        "\nموجودی اولیه همه کالاها: صفر" +

                        "\nکالاهای تکراری: " +
                        skipped

                    );

                };


            transaction.onerror =
                function(){

                    alert(
                        "خطا در ذخیره کالاها در دیتابیس."
                    );

                };

        };


    request.onerror =
        function(){

            alert(
                "خطا در بررسی کالاهای موجود."
            );

        };

}


function renderInventoryImportButton(){

    const page = document.getElementById("inventoryPage");
    if(!page) return;

    // اگر قبلاً نوار دکمه‌ها ساخته شده، دوباره نساز
    if(document.getElementById("inventoryActionButtons")){
        return;
    }

    const title = page.querySelector(".section-title");
    if(!title) return;

    // نوار دکمه‌ها — ترتیب از بالا به پایین اینجا کنترل می‌شود
    const bar = document.createElement("div");
    bar.id = "inventoryActionButtons";
    bar.style.marginBottom = "15px";

    bar.innerHTML = `
        <button class="primary-btn" style="width:100%;margin-bottom:10px;"
            onclick="openPurchaseInvoiceForm()">
            🧾 فاکتور خرید
        </button>

        <button class="primary-btn" style="width:100%;margin-bottom:10px;"
            onclick="renderPurchaseInvoiceList()">
            📋 فاکتورهای خرید
        </button>

        <button class="primary-btn" style="width:100%;margin-bottom:10px;"
            onclick="openSalesInvoiceForm()">
            🧾 فاکتور فروش
        </button>

        <button class="primary-btn" style="width:100%;margin-bottom:10px;"
            onclick="renderSalesInvoiceList()">
            📋 فاکتورهای فروش
        </button>

        <button class="primary-btn" style="width:100%;margin-bottom:10px;"
            onclick="openMarkdownImport()">
            📥 ورود کالاها از فایل Markdown
        </button>
    `;

    title.insertAdjacentElement("afterend", bar);
}


function closeMarkdownImport(){

    const modal =
        document.getElementById(
            "markdownImportModal"
        );


    if(modal){

        modal.remove();

    }

}

function parseMarkdownInventory(
    markdown
){

    const products = [];


    const lines =
        markdown
        .split(
            /\r?\n/
        )
        .map(
            function(line){

                return line.trim();

            }
        )
        .filter(
            function(line){

                return (
                    line.length > 0
                );

            }
        );


    lines.forEach(
        function(line){

            if(
                !line.startsWith("|")
                ||
                !line.endsWith("|")
            ){

                return;

            }


            const cells =
                line
                .split("|")
                .slice(
                    1,
                    -1
                )
                .map(
                    function(cell){

                        return cell.trim();

                    }
                );


            if(
                cells.length < 4
            ){

                return;

            }


            /*
            حذف خط جداکننده Markdown

            |---|---|---|---|
            */

            const isSeparator =
                cells.every(
                    function(cell){

                        return /^:?-+:?$/.test(
                            cell
                        );

                    }
                );


            if(
                isSeparator
            ){

                return;

            }


            const firstCell =
                cells[0]
                .toLowerCase();


            /*
            حذف خط عنوان جدول
            */

            if(
                firstCell === "کالا"
                ||
                firstCell === "نام کالا"
                ||
                firstCell === "name"
                ||
                firstCell === "product"
            ){

                return;

            }


            const name =
                cells[0].trim();


            if(
                !name
            ){

                return;

            }


            /*
            مهم:
            ستون تعداد از Markdown خوانده نمی‌شود.
            موجودی اولیه همیشه صفر است.
            */

            const stock = 0;


            const purchasePrice =
                parseInventoryNumber(
                    cells[2]
                );


            /*
            قیمت فروش:
            ۵۰ درصد بیشتر از قیمت خرید
            */

            const salePrice =
                Math.round(
                    purchasePrice * 1.5
                );


            products.push({

                name:
                    name,

                stock:
                    0,

                purchasePrice:
                    purchasePrice,

                salePrice:
                    salePrice

            });

        }
    );


    return products;

}

function readMarkdownInventoryFile(){

    if(!db){

        alert(
            "دیتابیس آماده نیست."
        );

        return;

    }


    const input =
        document.getElementById(
            "markdownFileInput"
        );


    if(
        !input
        ||
        !input.files
        ||
        !input.files[0]
    ){

        alert(
            "لطفاً ابتدا فایل Markdown را انتخاب کنید."
        );

        return;

    }


    const file =
        input.files[0];


    const reader =
        new FileReader();


    reader.onload =
        function(event){

            const markdown =
                event.target.result;


            const products =
                parseMarkdownInventory(
                    markdown
                );


            if(
                products.length === 0
            ){

                alert(
                    "هیچ کالایی از فایل پیدا نشد.\n\nفرمت فایل باید جدول Markdown چهار ستونه باشد."
                );

                return;

            }


            showMarkdownInventoryPreview(
                products
            );

        };


    reader.onerror =
        function(){

            alert(
                "خطا در خواندن فایل."
            );

        };


    reader.readAsText(
        file,
        "UTF-8"
    );

}

function showMarkdownInventoryPreview(
    products
){

    const preview =
        document.getElementById(
            "markdownImportPreview"
        );


    if(!preview){

        return;

    }


    let html = `

    <div class="card"
    style="
    margin-top:10px;
    background:#f8fafc;
    ">

    <div style="
    font-weight:bold;
    margin-bottom:10px;
    ">

    📋 پیش‌نمایش کالاها

    </div>


    <div style="
    font-size:13px;
    color:#555;
    margin-bottom:12px;
    ">

    تعداد کالاهای شناسایی‌شده:

    <strong>
    ${products.length}
    </strong>

    <br>

    موجودی اولیه همه کالاها:

    <strong>
    صفر
    </strong>

    </div>

    `;


    products
    .slice(
        0,
        10
    )
    .forEach(
        function(product,index){

            html += `

            <div style="
            padding:10px 0;
            border-bottom:1px solid #eee;
            font-size:13px;
            ">

            <strong>
            ${index + 1}.
            ${escapeHTML(
                product.name
            )}
            </strong>

            <br>

            موجودی اولیه:
            ۰

            <br>

            قیمت خرید:
            ${formatMoney(
                product.purchasePrice
            )}

            <br>

            قیمت فروش:
            ${formatMoney(
                product.salePrice
            )}

            </div>

            `;

        }
    );


    if(
        products.length > 10
    ){

        html += `

        <div style="
        margin-top:10px;
        color:#777;
        font-size:12px;
        ">

        و
        ${(
            products.length - 10
        ).toLocaleString("fa-IR")}
        کالای دیگر...

        </div>

        `;

    }


    html += `

    <button
    class="success-btn"
    style="
    width:100%;
    margin-top:15px;
    "
    onclick="confirmMarkdownInventoryImport()">

    ✓ تأیید و ورود به دیتابیس

    </button>


    </div>

    `;


    preview.innerHTML =
        html;


    window
    .pendingMarkdownProducts =
        products;

}

