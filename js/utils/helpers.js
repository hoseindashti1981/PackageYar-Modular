function escapeHTML(
text
){

const div =
document.createElement(
"div"
);

div.textContent =
String(
text
);

return div.innerHTML;

}



function countStore(
storeName,
elementId
){

if(!db){

return;

}

const transaction =
db.transaction(
storeName,
"readonly"
);

const request =
transaction
.objectStore(
storeName
)
.count();

request.onsuccess =
function(){

const element =
document.getElementById(
elementId
);

if(element){

element.innerText =
request.result;

}

};

}



function getAllFromStore(storeName){
    return new Promise(function(resolve, reject){
        if(!db.objectStoreNames.contains(storeName)){
            resolve([]);
            return;
        }
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = function(){ resolve(req.result || []); };
        req.onerror = function(){ reject(new Error("خواندن " + storeName + " انجام نشد.")); };
    });
}


function downloadCSV(filename, rows){

    // BOM برای نمایش درست فارسی در Excel
    const BOM = "\uFEFF";
    const csv = BOM + rows.map(function(row){
        return row.map(function(cell){
            let value = cell === null || cell === undefined ? "" : String(cell);
            value = value.replace(/"/g, '""');
            if(/[",\n\r]/.test(value)){
                value = '"' + value + '"';
            }
            return value;
        }).join(",");
    }).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


function readImageFileAsDataURL(file){

    return new Promise(function(resolve, reject){

        const reader = new FileReader();


        reader.onload = function(){

            resolve(
                reader.result || ""
            );

        };


        reader.onerror = function(){

            reject(
                new Error(
                    "خواندن فایل تصویر انجام نشد."
                )
            );

        };


        reader.readAsDataURL(file);

    });
}

function getAllProductsForPurchase(){

    return new Promise(function(resolve, reject){

        if(!db){
            reject(new Error("دیتابیس آماده نیست."));
            return;
        }

        if(!db.objectStoreNames.contains("products")){
            resolve([]);
            return;
        }

        const tx = db.transaction("products", "readonly");
        const req = tx.objectStore("products").getAll();

        req.onsuccess = function(){
            resolve(req.result || []);
        };

        req.onerror = function(){
            reject(new Error("خواندن کالاها از انبار انجام نشد."));
        };
    });
}

/* ========== انتخاب‌گر کالا با جستجو ========== */
let _productPickerOnSelect = null;
let _productPickerAllProducts = [];

function closeProductPicker() {
    const modal = document.getElementById("productPickerModal");
    if (modal) modal.classList.remove("show");
    _productPickerOnSelect = null;
}

async function openProductPicker(options) {
    options = options || {};
    const modal = document.getElementById("productPickerModal");
    const titleEl = document.getElementById("productPickerTitle");
    const searchEl = document.getElementById("productPickerSearch");
    const listEl = document.getElementById("productPickerList");

    if (!modal || !listEl) return;

    if (titleEl) titleEl.textContent = options.title || "انتخاب کالا";
    _productPickerOnSelect = options.onSelect || null;

    try {
        _productPickerAllProducts = await getAllProductsForPurchase();
    } catch (e) {
        alert("خطا در دریافت لیست کالاها");
        return;
    }

    function renderList(filter) {
        const q = (filter || "").trim().toLowerCase();
        let products = _productPickerAllProducts.slice();

        if (q) {
            products = products.filter(function (p) {
                const name = (p.name || "").toLowerCase();
                const code = (p.code || "").toLowerCase();
                return name.includes(q) || code.includes(q);
            });
        }

        products.sort(function (a, b) { return b.id - a.id; });

        if (products.length === 0) {
            listEl.innerHTML = '<div class="card"><div class="empty">کالایی پیدا نشد.</div></div>';
            return;
        }

        const priceField = options.priceField || "salePrice";
        let html = "";
        products.forEach(function (p) {
            const stock = Number(p.stock || 0);
            const price = Number(p[priceField] || 0);
            html +=
                '<div class="product-card" style="cursor:pointer;margin-bottom:10px;" data-id="' + p.id + '">' +
                '<div class="product-title">📦 ' + escapeHTML(p.name || "بدون نام") + '</div>' +
                '<div class="customer-info" style="margin-top:6px;">' +
                (p.code ? "کد: " + escapeHTML(p.code) + " | " : "") +
                "موجودی: " + stock.toLocaleString("fa-IR") +
                (price ? " | قیمت: " + formatMoney(price) : "") +
                "</div></div>";
        });
        listEl.innerHTML = html;

        listEl.querySelectorAll("[data-id]").forEach(function (card) {
            card.onclick = function () {
                const id = Number(card.dataset.id);
                const product = _productPickerAllProducts.find(function (x) {
                    return Number(x.id) === id;
                });
                if (product && typeof _productPickerOnSelect === "function") {
                    _productPickerOnSelect(product);
                }
                closeProductPicker();
            };
        });
    }

    if (searchEl) {
        searchEl.value = "";
        searchEl.oninput = function () {
            renderList(searchEl.value);
        };
    }

    renderList("");
    modal.classList.add("show");
    if (searchEl) {
        setTimeout(function () { searchEl.focus(); }, 120);
    }
}