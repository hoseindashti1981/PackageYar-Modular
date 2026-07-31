

function openCustomerModal(
customer
){

editingCustomerId =
customer
?
customer.id
:
null;

document
.getElementById(
"customerModalTitle"
)
.innerText =

customer
?
"ویرایش مشتری"
:
"مشتری جدید";

document
.getElementById(
"customerName"
)
.value =

customer
?
customer.name || ""
:
"";

document
.getElementById(
"customerPhone"
)
.value =

customer
?
customer.phone || ""
:
"";

document
.getElementById(
"customerAddress"
)
.value =

customer
?
customer.address || ""
:
"";

document
.getElementById(
"customerNote"
)
.value =

customer
?
customer.note || ""
:
"";

document
.getElementById(
"customerModal"
)
.classList.add(
"show"
);

}


function closeCustomerModal(){

document
.getElementById(
"customerModal"
)
.classList.remove(
"show"
);

editingCustomerId =
null;

}


function saveCustomer(){

if(!db){

alert(
"دیتابیس هنوز آماده نیست."
);

return;

}

const name =
document
.getElementById(
"customerName"
)
.value
.trim();

const phone =
document
.getElementById(
"customerPhone"
)
.value
.trim();

const address =
document
.getElementById(
"customerAddress"
)
.value
.trim();

const note =
document
.getElementById(
"customerNote"
)
.value
.trim();

if(!name){

alert(
"لطفاً نام مشتری را وارد کنید."
);

return;

}

const transaction =
db.transaction(
"customers",
"readwrite"
);

const store =
transaction.objectStore(
"customers"
);

if(
editingCustomerId !== null
){

const request =
store.get(
editingCustomerId
);

request.onsuccess =
function(){

const customer =
request.result;

customer.name =
name;

customer.phone =
phone;

customer.address =
address;

customer.note =
note;

store.put(
customer
);

};

}else{

store.add({

name:name,

phone:phone,

address:address,

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

closeCustomerModal();

loadCustomers();

updateDashboard();

if(
currentCustomerId
){

openCustomerProfile(
currentCustomerId
);

}

};

}


function loadCustomers(){

if(!db){

return;

}

const list =
document.getElementById(
"customersList"
);

list.innerHTML =
"";

const search =
(
document
.getElementById(
"customerSearch"
)
.value || ""
)
.trim()
.toLowerCase();

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

let customers =
request.result;

if(search){

customers =
customers.filter(
customer =>

(
customer.name || ""
)
.toLowerCase()
.includes(
search
)

||

(
customer.phone || ""
)
.includes(
search
)

);

}

customers.sort(
function(a,b){

return b.id - a.id;

});

if(
customers.length === 0
){

list.innerHTML = `

<div class="card">

<div class="empty">

مشتری مورد نظر پیدا نشد.

</div>

</div>

`;

return;

}

customers.forEach(
function(customer){

const card =
document.createElement(
"div"
);

card.className =
"card";

card.innerHTML = `

<div
class="customer-card"
onclick="openCustomerProfile(${customer.id})">

<div class="customer-name">

👤

${escapeHTML(
customer.name || ""
)}

</div>

<div class="customer-info">

📞

${
escapeHTML(
customer.phone ||
"بدون شماره"
)
}

</div>

<div class="customer-info">

📍

${
escapeHTML(
customer.address ||
"بدون آدرس"
)
}

</div>

</div>

<div class="card-actions">

<button
class="edit-btn"
onclick="event.stopPropagation();editCustomer(${customer.id})">

ویرایش

</button>

<button
class="danger-btn"
onclick="event.stopPropagation();deleteCustomer(${customer.id})">

حذف

</button>

</div>

`;

list.appendChild(
card
);

});

};

}


function editCustomer(
id
){

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
.get(
id
);

request.onsuccess =
function(){

openCustomerModal(
request.result
);

};

}


function deleteCustomer(
id
){

if(
!confirm(
"آیا از حذف این مشتری مطمئن هستید؟"
)
){

return;

}

const transaction =
db.transaction(
["customers","devices","repairs"],
"readwrite"
);

transaction
.objectStore(
"customers"
)
.delete(
id
);

const deviceStore =
transaction
.objectStore(
"devices"
);

const repairStore =
transaction
.objectStore(
"repairs"
);

const deviceRequest =
deviceStore
.getAll();

deviceRequest.onsuccess =
function(){

const devices =
deviceRequest.result
.filter(
device =>
device.customerId === id
);

devices.forEach(
function(device){

deviceStore.delete(
device.id
);

});

const repairRequest =
repairStore
.getAll();

repairRequest.onsuccess =
function(){

repairRequest.result
.filter(
repair =>
repair.customerId === id
)
.forEach(
function(repair){

repairStore.delete(
repair.id
);

});

};

};

transaction.oncomplete =
function(){

currentCustomerId =
null;

currentDeviceId =
null;


loadCustomers();

updateDashboard();

};

}


function openCustomerProfile(
customerId
){

currentCustomerId =
customerId;

const transaction =
db.transaction(
["customers","devices"],
"readonly"
);

const customerRequest =
transaction
.objectStore(
"customers"
)
.get(
customerId
);

const deviceRequest =
transaction
.objectStore(
"devices"
)
.getAll();

transaction.oncomplete =
function(){

const customer =
customerRequest.result;

const devices =
deviceRequest.result
.filter(
function(device){

return device.customerId ===
customerId;

}
);

if(!customer){

showPage(
"customersPage"
);

return;

}

renderCustomerProfile(
customer,
devices
);

};

showPage(
"customerProfilePage"
);

}


function renderCustomerProfile(
customer,
devices
){

const container =
document.getElementById(
"customerProfile"
);

container.innerHTML = `

<div class="card">

<div class="customer-name">

👤

${escapeHTML(
customer.name || ""
)}

</div>

<div class="customer-info">

📞

${
escapeHTML(
customer.phone ||
"بدون شماره"
)
}

</div>

<div class="customer-info">

📍

${
escapeHTML(
customer.address ||
"بدون آدرس"
)
}

</div>

<div class="customer-info">

📝

${
escapeHTML(
customer.note ||
"بدون توضیحات"
)
}

</div>

<div class="customer-info">

📅

تاریخ ثبت:

${
customer.createdDate ||
"نامشخص"
}

</div>

<div class="card-actions">

<button
class="edit-btn"
onclick="editCustomerFromProfile(${customer.id})">

ویرایش مشتری

</button>

</div>

</div>

<div class="section-title">

🔥 دستگاه‌های مشتری

</div>

<button
class="primary-btn"
onclick="openDeviceModal()">

+ افزودن دستگاه

</button>

<div
id="devicesList"
style="margin-top:15px">

</div>

`;

const devicesList =
document.getElementById(
"devicesList"
);

if(
devices.length === 0
){

devicesList.innerHTML = `

<div class="card">

<div class="empty">

هنوز دستگاهی برای این مشتری ثبت نشده است.

</div>

</div>

`;

return;

}

devices.forEach(
function(device){

const card =
document.createElement(
"div"
);

card.className =
"device-card";

card.innerHTML = `

<div
class="device-card clickable"
onclick="openDeviceProfile(${device.id})">

<div class="device-title">

🔥

${
escapeHTML(
device.brand ||
"برند نامشخص"
)
}

-

${
escapeHTML(
device.model ||
"مدل نامشخص"
)
}

</div>

<div class="customer-info">

نوع دستگاه:

${
escapeHTML(
device.type ||
"ثبت نشده"
)
}

</div>

<div class="customer-info">

شماره سریال:

${
escapeHTML(
device.serial ||
"ثبت نشده"
)
}

</div>

<div class="badge">

ثبت شده در:

${
device.createdDate ||
"نامشخص"
}

</div>

</div>

<div class="card-actions">

<button
class="edit-btn"
onclick="event.stopPropagation();editDevice(${device.id})">

ویرایش

</button>

<button
class="danger-btn"
onclick="event.stopPropagation();deleteDevice(${device.id})">

حذف

</button>

</div>

`;

devicesList.appendChild(
card
);

});

}


function editCustomerFromProfile(
id
){

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
.get(
id
);

request.onsuccess =
function(){

openCustomerModal(
request.result
);

};

}


