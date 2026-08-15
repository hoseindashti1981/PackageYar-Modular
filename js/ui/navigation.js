function showPage(
pageId,
navElement
){

document
.querySelectorAll(
".page"
)
.forEach(
page =>
page.classList.remove(
"active"
)
);

const page =
document.getElementById(
pageId
);

if(page){

page.classList.add(
"active"
);

}

document
.querySelectorAll(
".nav-item"
)
.forEach(
item =>
item.classList.remove(
"active"
)
);

if(navElement){

navElement.classList.add(
"active"
);

}

if(
pageId ===
"customersPage"
){

loadCustomers();

}

if(
pageId ===
"dashboardPage"
){

updateDashboard();

}

if(pageId === "repairsPage"){
    renderRepairsPageStructure();
    loadAllRepairs();
}

if(pageId === "settingsPage"){
    renderSettingsPage();
}

if(pageId === "inventoryPage"){
    // اگر از بدهکاران/پرداخت آمده باشیم، بازسازی نکن
    if(window._skipInventoryReload){
        window._skipInventoryReload = false;
    }else if(typeof returnToInventoryList === "function"){
        returnToInventoryList();
    }
}
}

function goHome(){

    // بستن همه مودال‌های باز
    document.querySelectorAll(".modal.show").forEach(function(modal){
        modal.classList.remove("show");
    });

    // اگر مودال‌هایی بدون کلاس show با display کنترل می‌شوند
    document.querySelectorAll(".modal").forEach(function(modal){
        if(modal.style && modal.style.display === "flex"){
            modal.style.display = "none";
        }
    });

    // پاک کردن فلگ‌های موقت (مثل بدهکاران / فاکتور)
    window._skipInventoryReload = false;

    // رفتن به داشبورد + فعال شدن تب خانه در منوی پایین
    var dashNav = document.querySelector('.nav-item[onclick*="dashboardPage"]');
    if(typeof showPage === "function"){
        showPage("dashboardPage", dashNav || null);
    }
}