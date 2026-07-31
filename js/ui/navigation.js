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

}



