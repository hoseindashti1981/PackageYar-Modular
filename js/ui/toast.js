/* PackageYar - Toast notifications */

function showToast(message, type){
    // type: "success" | "error" | "info"  (پیش‌فرض: info)

    type = type || "info";

    let container = document.getElementById("toastContainer");
    if(!container){
        container = document.createElement("div");
        container.id = "toastContainer";
        container.style.cssText = [
            "position:fixed",
            "top:18px",
            "left:50%",
            "transform:translateX(-50%)",
            "z-index:9999",
            "display:flex",
            "flex-direction:column",
            "gap:8px",
            "width:90%",
            "max-width:420px",
            "pointer-events:none"
        ].join(";");
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.style.cssText = [
        "pointer-events:auto",
        "padding:14px 16px",
        "border-radius:14px",
        "box-shadow:0 8px 24px rgba(0,0,0,.15)",
        "font-size:14px",
        "line-height:1.6",
        "color:#fff",
        "opacity:0",
        "transform:translateY(-8px)",
        "transition:opacity .2s ease, transform .2s ease",
        "word-break:break-word"
    ].join(";");

    if(type === "success"){
        toast.style.background = "#16a34a";
    }else if(type === "error"){
        toast.style.background = "#dc2626";
    }else{
        toast.style.background = "#1f2937";
    }

    toast.textContent = message;
    container.appendChild(toast);

    // انیمیشن ورود
    requestAnimationFrame(function(){
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    // حذف خودکار
    const duration = type === "error" ? 4000 : 2800;
    setTimeout(function(){
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-8px)";
        setTimeout(function(){
            if(toast.parentNode){
                toast.parentNode.removeChild(toast);
            }
        }, 220);
    }, duration);
}
