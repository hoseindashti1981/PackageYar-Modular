function openDeviceModal(device){

    if(!currentCustomerId){
        alert("مشتری انتخاب نشده است.");
        return;
    }

    editingDeviceId = device ? device.id : null;

    document.getElementById("deviceModalTitle").innerText =
        device ? "ویرایش دستگاه" : "دستگاه جدید";

    document.getElementById("deviceBrand").value =
        device ? (device.brand || "") : "";

    document.getElementById("deviceModel").value =
        device ? (device.model || "") : "";

    document.getElementById("deviceType").value =
        device ? (device.type || "") : "";

    document.getElementById("deviceSerial").value =
        device ? (device.serial || "") : "";

    document.getElementById("deviceNote").value =
        device ? (device.note || "") : "";

    document.getElementById("deviceModal").classList.add("show");
}


function closeDeviceModal(){

    document.getElementById("deviceModal").classList.remove("show");
    editingDeviceId = null;
}


function saveDevice(){

    if(!db){
        alert("دیتابیس هنوز آماده نیست.");
        return;
    }

    const brand  = document.getElementById("deviceBrand").value.trim();
    const model  = document.getElementById("deviceModel").value.trim();
    const type   = document.getElementById("deviceType").value.trim();
    const serial = document.getElementById("deviceSerial").value.trim();
    const note   = document.getElementById("deviceNote").value.trim();

    if(!brand && !model){
        alert("حداقل برند یا مدل دستگاه را وارد کنید.");
        return;
    }

    const transaction = db.transaction("devices", "readwrite");
    const store = transaction.objectStore("devices");

    if(editingDeviceId !== null){

        const request = store.get(editingDeviceId);

        request.onsuccess = function(){

            const device = request.result;

            if(!device){
                alert("دستگاه پیدا نشد.");
                return;
            }

            device.brand  = brand;
            device.model  = model;
            device.type   = type;
            device.serial = serial;
            device.note   = note;

            store.put(device);
        };

    }else{

        store.add({
            customerId: currentCustomerId,
            brand: brand,
            model: model,
            type: type,
            serial: serial,
            note: note,
            createdAt: new Date().toISOString(),
            createdDate: getTodayJalali()
        });
    }

    transaction.oncomplete = function(){
        closeDeviceModal();
        openCustomerProfile(currentCustomerId);
        updateDashboard();
    };
}


function editDevice(id){

    if(!db){
        return;
    }

    const transaction = db.transaction("devices", "readonly");
    const request = transaction.objectStore("devices").get(id);

    request.onsuccess = function(){
        if(request.result){
            openDeviceModal(request.result);
        }
    };
}


function deleteDevice(id){

    if(!confirm("آیا از حذف این دستگاه مطمئن هستید؟\nسوابق تعمیرات این دستگاه نیز حذف خواهد شد.")){
        return;
    }

    const transaction = db.transaction(["devices", "repairs"], "readwrite");

    transaction.objectStore("devices").delete(id);

    const repairStore = transaction.objectStore("repairs");
    const request = repairStore.getAll();

    request.onsuccess = function(){
        request.result
            .filter(function(repair){
                return repair.deviceId === id;
            })
            .forEach(function(repair){
                repairStore.delete(repair.id);
            });
    };

    transaction.oncomplete = function(){
        openCustomerProfile(currentCustomerId);
        updateDashboard();
    };
}


function openDeviceProfile(deviceId){

    if(!db){
        alert("دیتابیس هنوز آماده نیست.");
        return;
    }

    currentDeviceId = deviceId;

    const transaction = db.transaction(
        ["devices", "customers", "repairs"],
        "readonly"
    );

    const deviceRequest   = transaction.objectStore("devices").get(deviceId);
    const customerRequest = transaction.objectStore("customers").getAll();
    const repairsRequest  = transaction.objectStore("repairs").getAll();

    transaction.oncomplete = function(){

        const device = deviceRequest.result;

        if(!device){
            alert("اطلاعات دستگاه پیدا نشد.");
            return;
        }

        currentCustomerId = device.customerId || currentCustomerId;

        const customer = customerRequest.result.find(function(c){
            return c.id === device.customerId;
        });

        const repairs = repairsRequest.result
            .filter(function(repair){
                return repair.deviceId === deviceId;
            })
            .sort(function(a, b){
                return b.id - a.id;
            });

        renderDeviceProfile(device, customer, repairs);
    };

    showPage("deviceProfilePage");
}


function renderDeviceProfile(device, customer, repairs){

    const container = document.getElementById("deviceProfile");

    if(!container){
        return;
    }

    if(!device){
        container.innerHTML = `
            <div class="card">
                <div class="empty">اطلاعات دستگاه پیدا نشد.</div>
            </div>
        `;
        return;
    }

    let repairsHtml = "";

    if(!repairs || repairs.length === 0){

        repairsHtml = `
            <div class="card">
                <div class="empty">
                    هنوز تعمیر یا سرویسی برای این دستگاه ثبت نشده است.
                </div>
            </div>
        `;

    }else{

        repairs.forEach(function(repair){

            const statusClass =
                repair.paymentStatus === "پرداخت کامل" ? "status-paid" :
                repair.paymentStatus === "پرداخت جزئی" ? "status-partial" :
                "status-unpaid";

            const partsCount = Array.isArray(repair.repairParts)
                ? repair.repairParts.length
                : 0;

            const totalParts = Array.isArray(repair.repairParts)
                ? repair.repairParts.reduce(function(sum, part){
                    return sum + (Number(part.total) || 0);
                }, 0)
                : 0;

            const labor = Number(repair.laborCost) || 0;
            const total = labor + totalParts;

            repairsHtml += `
                <div class="repair-card">
                    <div class="repair-title">
                        🔧 ${escapeHTML(repair.type || "تعمیر")}
                    </div>

                    <div class="customer-info">
                        📅 تاریخ: ${escapeHTML(repair.date || "نامشخص")}
                    </div>

                    <div class="customer-info">
                        📝 مشکل: ${escapeHTML(repair.problem || "ثبت نشده")}
                    </div>

                    <div class="customer-info">
                        🛠️ اقدام: ${escapeHTML(repair.action || "ثبت نشده")}
                    </div>

                    <div class="customer-info">
                        📦 تعداد قطعات: ${partsCount.toLocaleString("fa-IR")}
                    </div>

                    <div class="repair-price">
                        جمع کل: ${formatMoney(total)}
                    </div>

                    <span class="badge ${statusClass}">
                        ${escapeHTML(repair.paymentStatus || "نامشخص")}
                    </span>
                </div>
            `;
        });
    }

    container.innerHTML = `
        <div class="card">
            <div class="device-title">
                🔥
                ${escapeHTML(device.brand || "برند نامشخص")}
                -
                ${escapeHTML(device.model || "مدل نامشخص")}
            </div>

            <div class="customer-info">
                نوع دستگاه: ${escapeHTML(device.type || "ثبت نشده")}
            </div>

            <div class="customer-info">
                شماره سریال: ${escapeHTML(device.serial || "ثبت نشده")}
            </div>

            <div class="customer-info">
                توضیحات: ${escapeHTML(device.note || "بدون توضیحات")}
            </div>

            <div class="customer-info">
                👤 مشتری:
                ${escapeHTML(customer ? (customer.name || "نامشخص") : "نامشخص")}
            </div>

            <div class="customer-info">
                📅 تاریخ ثبت: ${escapeHTML(device.createdDate || "نامشخص")}
            </div>

            <div class="card-actions">
                <button
                    class="edit-btn"
                    onclick="editDeviceFromProfile(${device.id})">
                    ویرایش دستگاه
                </button>
                <button
                    class="primary-btn"
                    onclick="selectRepairDevice(${device.id})">
                    + ثبت تعمیر
                </button>
            </div>
        </div>

        <div class="section-title">
            🔧 سوابق تعمیرات این دستگاه
        </div>

        ${repairsHtml}
    `;
}


function editDeviceFromProfile(id){
    editDevice(id);
}
