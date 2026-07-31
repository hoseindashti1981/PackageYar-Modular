

function openDeviceModal(
device
){

let editingDeviceId =
null;
let currentDeviceId =
null; 

if(
!currentCustomerId
){

alert(
"مشتری انتخاب نشده است."
);

return;

}

editingDeviceId =
device
?
device.id
:
null;

document
.getElementById(
"deviceModalTitle"
)
.innerText =

device
?
"ویرایش دستگاه"
:
"دستگاه جدید";

document
.getElementById(
"deviceBrand"
)
.value =

device
?
device.brand || ""
:
"";

document
.getElementById(
"deviceModel"
)
.value =

device
?
device.model || ""
:
"";

document
.getElementById(
"deviceType"
)
.value =

device
?
device.type || ""
:
"";

document
.getElementById(
"deviceSerial"
)
.value =

device
?
device.serial || ""
:
"";

document
.getElementById(
"deviceNote"
)
.value =

device
?
device.note || ""
:
"";

document
.getElementById(
"deviceModal"
)
.classList.add(
"show"
);

}


function closeDeviceModal(){

document
.getElementById(
"deviceModal"
)
.classList.remove(
"show"
);

editingDeviceId =
null;

}


function saveDevice(){

if(!db){

alert(
"دیتابیس هنوز آماده نیست."
);

return;

}

const brand =
document
.getElementById(
"deviceBrand"
)
.value
.trim();

const model =
document
.getElementById(
"deviceModel"
)
.value
.trim();

const type =
document
.getElementById(
"deviceType"
)
.value
.trim();

const serial =
document
.getElementById(
"deviceSerial"
)
.value
.trim();

const note =
document
.getElementById(
"deviceNote"
)
.value
.trim();

if(
!brand &&
!model
){

alert(
"حداقل برند یا مدل دستگاه را وارد کنید."
);

return;

}

const transaction =
db.transaction(
"devices",
"readwrite"
);

const store =
transaction.objectStore(
"devices"
);

if(
editingDeviceId !== null
){

const request =
store.get(
editingDeviceId
);

request.onsuccess =
function(){

const device =
request.result;

device.brand =
brand;

device.model =
model;

device.type =
type;

device.serial =
serial;

device.note =
note;

store.put(
device
);

};

}else{

store.add({

customerId:
currentCustomerId,

brand:brand,

model:model,

type:type,

serial:serial,

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

closeDeviceModal();

openCustomerProfile(
currentCustomerId
);

updateDashboard();

};

}


function editDevice(
id
){

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
id
);

request.onsuccess =
function(){

openDeviceModal(
request.result
);

};

}


function deleteDevice(
id
){

if(
!confirm(
"آیا از حذف این دستگاه مطمئن هستید؟\nسوابق تعمیرات این دستگاه نیز حذف خواهد شد."
)
){

return;

}

const transaction =
db.transaction(
["devices","repairs"],
"readwrite"
);

transaction
.objectStore(
"devices"
)
.delete(
id
);

const repairStore =
transaction
.objectStore(
"repairs"
);

const request =
repairStore
.getAll();

request.onsuccess =
function(){

request.result
.filter(
repair =>
repair.deviceId === id
)
.forEach(
repair =>
repairStore.delete(
repair.id
)
);

};

transaction.oncomplete =
function(){

openCustomerProfile(
currentCustomerId
);

updateDashboard();

};

}


function openDeviceProfile(
deviceId
){

currentDeviceId =
deviceId;

const transaction =
db.transaction(
["devices","customers","repairs"],
"readonly"
);

const deviceRequest =
transaction
.objectStore(
"devices"
)
.get(
deviceId
);

const customerRequest =
transaction
.objectStore(
"customers"
)
.getAll();

const repairsRequest =
transaction
.objectStore(
"repairs"
)
.getAll();

transaction.oncomplete =
function(){

const device =
deviceRequest.result;

if(!device){

return;

}

const customer =
customerRequest.result.find(
customer =>
customer.id ===
device.customerId
);

const repairs =
repairsRequest.result
.filter(
repair =>
repair.deviceId ===
deviceId
)
.sort(
(a,b) =>
b.id - a.id
);

renderDeviceProfile(
device,
customer,
repairs
);

};

showPage(
"deviceProfilePage"
);

}


function openDeviceProfile(
deviceId
){

currentDeviceId =
deviceId;

const transaction =
db.transaction(
["devices","customers","repairs"],
"readonly"
);

const deviceRequest =
transaction
.objectStore(
"devices"
)
.get(
deviceId
);

const customerRequest =
transaction
.objectStore(
"customers"
)
.getAll();

const repairsRequest =
transaction
.objectStore(
"repairs"
)
.getAll();

transaction.oncomplete =
function(){

const device =
deviceRequest.result;

if(!device){

return;

}

const customer =
customerRequest.result.find(
customer =>
customer.id ===
device.customerId
);

const repairs =
repairsRequest.result
.filter(
repair =>
repair.deviceId ===
deviceId
)
.sort(
(a,b) =>
b.id - a.id
);

renderDeviceProfile(
device,
customer,
repairs
);

};

showPage(
"deviceProfilePage"
);

}


function editDeviceFromProfile(
id
){

editDevice(
id
);

}
