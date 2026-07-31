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


