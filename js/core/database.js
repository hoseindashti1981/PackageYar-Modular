const DB_NAME =
"PackageYarDB";

const DB_VERSION =
3;

let db =
null;


function setDatabaseStatus(
text,
className
){

const element =
document.getElementById(
"dbStatus"
);

if(!element){

return;

}

element.innerText =
text;

element.className =
className || "";

}

function openDatabase(){

return new Promise(
function(resolve,reject){

setDatabaseStatus(
"در حال باز کردن...",
""
);

const request =
indexedDB.open(
DB_NAME,
DB_VERSION
);

request.onupgradeneeded =
function(event){

const database =
event.target.result;

if(
!database.objectStoreNames.contains(
"customers"
)
){

const customers =
database.createObjectStore(
"customers",
{
keyPath:"id",
autoIncrement:true
}
);

customers.createIndex(
"name",
"name",
{
unique:false
}
);

customers.createIndex(
"phone",
"phone",
{
unique:false
}
);

}

if(
!database.objectStoreNames.contains(
"devices"
)
){

const devices =
database.createObjectStore(
"devices",
{
keyPath:"id",
autoIncrement:true
}
);

devices.createIndex(
"customerId",
"customerId",
{
unique:false
}
);

}

if(
!database.objectStoreNames.contains(
"repairs"
)
){

const repairs =
database.createObjectStore(
"repairs",
{
keyPath:"id",
autoIncrement:true
}
);

repairs.createIndex(
"customerId",
"customerId",
{
unique:false
}
);

repairs.createIndex(
"deviceId",
"deviceId",
{
unique:false
}
);

}

if(
!database.objectStoreNames.contains(
"products"
)
){

database.createObjectStore(
"products",
{
keyPath:"id",
autoIncrement:true
}
);

}

// ====================== stockTransactions ======================
if(
!database.objectStoreNames.contains("stockTransactions")
){

    const stockStore = database.createObjectStore(
        "stockTransactions",
        {
            keyPath:"id",
            autoIncrement:true
        }
    );

    // ایندکس‌های مفید برای جستجو و گزارش‌گیری
    stockStore.createIndex("productId", "productId", { unique: false });
    stockStore.createIndex("type", "type", { unique: false });
    stockStore.createIndex("date", "date", { unique: false });
    stockStore.createIndex("createdAt", "createdAt", { unique: false });
}

if(
!database.objectStoreNames.contains(
"purchaseInvoices"
)
){

database.createObjectStore(
"purchaseInvoices",
{
keyPath:"id",
autoIncrement:true
}
);

}

if(
!database.objectStoreNames.contains(
"salesInvoices"
)
){

database.createObjectStore(
"salesInvoices",
{
keyPath:"id",
autoIncrement:true
}
);

}

if(
!database.objectStoreNames.contains(
"invoiceItems"
)
){

database.createObjectStore(
"invoiceItems",
{
keyPath:"id",
autoIncrement:true
}
);

}

if(
!database.objectStoreNames.contains(
"settings"
)
){

database.createObjectStore(
"settings",
{
keyPath:"key"
}
);

}

};

request.onsuccess =
function(event){

db =
event.target.result;

document
.getElementById(
"dbName"
)
.innerText =
db.name;

document
.getElementById(
"dbVersion"
)
.innerText =
db.version;

setDatabaseStatus(
"فعال ✓",
"db-ok"
);

resolve(db);

};

request.onerror =
function(event){

setDatabaseStatus(
"خطا",
"db-error"
);

reject(
event.target.error
);

};

request.onblocked =
function(){

setDatabaseStatus(
"مسدود شده",
"db-error"
);

};

});

}

