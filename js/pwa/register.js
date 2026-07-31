if("serviceWorker" in navigator){
    window.addEventListener("load", function(){
        navigator.serviceWorker.register("./sw.js").catch(function(err){
            console.log("SW register failed:", err);
        });
    });
}

if("serviceWorker" in navigator){
    navigator.serviceWorker.addEventListener("controllerchange", function(){
        window.location.reload();
    });
}