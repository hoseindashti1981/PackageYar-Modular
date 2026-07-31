if("serviceWorker" in navigator){
    navigator.serviceWorker.addEventListener("controllerchange", function(){
        window.location.reload();
    });
}