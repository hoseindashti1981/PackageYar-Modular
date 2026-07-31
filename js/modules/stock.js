async function recordStockTransaction({

    productId,

    type,

    quantity,

    reason,

    note = "",

    existingTransaction = null

}) {

    const allowedTypes = [

        "IN",

        "OUT",

        "RETURN_IN",

        "RETURN_OUT",

        "ADJUSTMENT"

    ];


    if(
        !allowedTypes.includes(
            type
        )
    ){

        throw new Error(
            "نوع تراکنش نامعتبر است."
        );

    }


    const numericProductId =
        Number(
            productId
        );


    if(
        !Number.isInteger(
            numericProductId
        )
        ||
        numericProductId <= 0
    ){

        throw new Error(
            "شناسه کالا نامعتبر است."
        );

    }


    const numericQuantity =
        Number(
            quantity
        );


    if(
        !Number.isFinite(
            numericQuantity
        )
    ){

        throw new Error(
            "مقدار تراکنش نامعتبر است."
        );

    }


    if(
        type !== "ADJUSTMENT"
        &&
        numericQuantity <= 0
    ){

        throw new Error(
            "مقدار تراکنش باید بیشتر از صفر باشد."
        );

    }


    if(
        type === "ADJUSTMENT"
        &&
        numericQuantity < 0
    ){

        throw new Error(
            "موجودی نهایی نمی‌تواند منفی باشد."
        );

    }


    if(
        !reason
        ||
        !String(
            reason
        ).trim()
    ){

        throw new Error(
            "دلیل تراکنش الزامی است."
        );

    }


    /*
       اگر تراکنش IndexedDB از قبل باز شده باشد،
       از همان تراکنش استفاده می‌کنیم.

       این حالت برای ثبت فاکتور خرید است.
    */

    if(
        existingTransaction
    ){

        return processStockTransactionInExistingTransaction({

            transaction:
                existingTransaction,

            productId:
                numericProductId,

            type:
                type,

            quantity:
                numericQuantity,

            reason:
                reason,

            note:
                note

        });

    }


    /*
       حالت عادی:
       ثبت مستقل تراکنش
    */

    return new Promise(
        function(resolve,reject){

            if(!db){

                reject(
                    new Error(
                        "دیتابیس آماده نیست."
                    )
                );

                return;

            }


            const transaction =
                db.transaction(

                    [
                        "products",

                        "stockTransactions"

                    ],

                    "readwrite"

                );


            processStockTransactionInExistingTransaction({

                transaction:
                    transaction,

                productId:
                    numericProductId,

                type:
                    type,

                quantity:
                    numericQuantity,

                reason:
                    reason,

                note:
                    note

            })
            .then(
                function(){

                    transaction.oncomplete =
                        function(){

                            resolve({

                                success:
                                    true,

                                productId:
                                    numericProductId,

                                type:
                                    type,

                                quantity:
                                    numericQuantity

                            });

                        };


                    transaction.onerror =
                        function(){

                            reject(
                                new Error(
                                    "ثبت تراکنش انبار انجام نشد."
                                )
                            );

                        };


                    transaction.onabort =
                        function(){

                            reject(
                                new Error(
                                    "تراکنش انبار لغو شد."
                                )
                            );

                        };

                }
            )
            .catch(
                function(error){

                    try{

                        transaction.abort();

                    }catch(abortError){}


                    reject(
                        error
                    );

                }
            );

        }
    );

}


function processStockTransactionInExistingTransaction({

    transaction,

    productId,

    type,

    quantity,

    reason,

    note,

    repairId = null

}){

    return new Promise(

        function(resolve,reject){

            /* ------------------------------------------------
               بررسی اولیه ورودی‌ها
               ------------------------------------------------ */

            const numericProductId =
                Number(
                    productId
                );


            const numericQuantity =
                Number(
                    quantity
                );


            if(
                !Number.isInteger(
                    numericProductId
                )
                ||
                numericProductId <= 0
            ){

                reject(

                    new Error(
                        "شناسه کالا نامعتبر است."
                    )

                );

                return;

            }


            if(
                !Number.isInteger(
                    numericQuantity
                )
                ||
                numericQuantity <= 0
            ){

                reject(

                    new Error(
                        "تعداد کالا باید بیشتر از صفر باشد."
                    )

                );

                return;

            }


            /* ------------------------------------------------
               دریافت Store ها از همان تراکنش موجود
               ------------------------------------------------ */

            const productsStore =
                transaction.objectStore(
                    "products"
                );


            const transactionsStore =
                transaction.objectStore(
                    "stockTransactions"
                );


            /* ------------------------------------------------
               دریافت کالا
               ------------------------------------------------ */

            const productRequest =
                productsStore.get(
                    numericProductId
                );


            productRequest.onsuccess =
                function(){

                    const product =
                        productRequest.result;


                    /* ----------------------------------------
                       بررسی وجود کالا
                       ---------------------------------------- */

                    if(!product){

                        reject(

                            new Error(

                                "کالای موردنظر در انبار پیدا نشد."

                            )

                        );

                        return;

                    }


                    /* ----------------------------------------
                       موجودی فعلی
                       ---------------------------------------- */

                    const stockBefore =
                        Number(
                            product.stock || 0
                        );


                    let stockAfter;


                    /* ----------------------------------------
                       محاسبه موجودی جدید
                       ---------------------------------------- */

                    switch(type){

                        case "IN":

                        case "RETURN_IN":

                            stockAfter =

                                stockBefore +

                                numericQuantity;

                            break;


                        case "OUT":

                        case "RETURN_OUT":

                            stockAfter =

                                stockBefore -

                                numericQuantity;

                            break;


                        case "ADJUSTMENT":

                            /*
                               در حالت ADJUSTMENT
                               quantity به‌عنوان موجودی نهایی
                               در نظر گرفته می‌شود.
                            */

                            stockAfter =
                                numericQuantity;

                            break;


                        default:

                            reject(

                                new Error(

                                    "نوع تراکنش انبار نامعتبر است."

                                )

                            );

                            return;

                    }


                    /* ----------------------------------------
                       جلوگیری از موجودی منفی

                       مخصوصاً برای OUT تعمیرات
                       ---------------------------------------- */

                    if(
                        stockAfter < 0
                    ){

                        reject(

                            new Error(

                                "موجودی کالای «" +

                                (
                                    product.name ||
                                    "بدون نام"
                                )

                                +

                                "» کافی نیست.\n\n" +

                                "موجودی فعلی: " +

                                stockBefore.toLocaleString(
                                    "fa-IR"
                                )

                                +

                                "\n" +

                                "تعداد موردنیاز: " +

                                numericQuantity.toLocaleString(
                                    "fa-IR"
                                )

                            )

                        );

                        return;

                    }


                    /* ----------------------------------------
                       به‌روزرسانی موجودی کالا
                       ---------------------------------------- */

                    

/* ----------------------------------------
   میانگین وزنی قیمت خرید
   فقط برای ورود کالا (IN)
   ---------------------------------------- */
if(
    type === "IN" &&
    unitPrice !== null &&
    Number.isFinite(Number(unitPrice)) &&
    Number(unitPrice) >= 0
){
    const oldStock = stockBefore;
    const oldPrice = Number(product.purchasePrice || 0);
    const newQty = numericQuantity;
    const newPrice = Number(unitPrice);

    if(oldStock <= 0){
        // اگر قبلاً موجودی صفر بود، قیمت جدید جایگزین می‌شود
        product.purchasePrice = newPrice;
    }else{
        // میانگین وزنی
        const totalValue = (oldStock * oldPrice) + (newQty * newPrice);
        const totalQty = oldStock + newQty;
        product.purchasePrice = Math.round(totalValue / totalQty);
    }
}



product.stock =
                        stockAfter;


                    const productPutRequest =
                        productsStore.put(
                            product
                        );


                    productPutRequest.onerror =
                        function(){

                            reject(

                                new Error(

                                    "به‌روزرسانی موجودی کالا انجام نشد."

                                )

                            );

                        };


                    /* ----------------------------------------
                       اطلاعات زمان ثبت
                       ---------------------------------------- */

                    const now =
                        new Date();


                    /* ----------------------------------------
                       ساخت رکورد تراکنش انبار
                       ---------------------------------------- */

                    const transactionRecord = {

                        productId:
                            numericProductId,


                        productName:
                            product.name ||
                            "نامشخص",


                        type:
                            type,


                        quantity:
                            numericQuantity,


                        reason:
                            String(
                                reason ||
                                ""
                            )
                            .trim(),


                        note:
                            String(
                                note ||
                                ""
                            )
                            .trim(),


                        /*
                           اگر این تراکنش مربوط به
                           یک تعمیر باشد، repairId
                           در اینجا ذخیره می‌شود.

                           برای تراکنش‌های عادی مثل
                           خرید انبار، مقدار null است.
                        */

                        repairId:
                            repairId !== null
                            &&
                            repairId !== undefined
                            ?
                            Number(
                                repairId
                            )
                            :
                            null,


                        date:
                            now.toLocaleDateString(
                                "fa-IR"
                            ),


                        time:
                            now.toLocaleTimeString(
                                "fa-IR",
                                {
                                    hour:
                                        "2-digit",

                                    minute:
                                        "2-digit"
                                }
                            ),


                        createdAt:
                            now.toISOString(),


                        stockBefore:
                            stockBefore,


                        stockAfter:
                            stockAfter

                    };


                    /* ----------------------------------------
                       ثبت سابقه تراکنش
                       ---------------------------------------- */

                    const addRequest =
                        transactionsStore.add(
                            transactionRecord
                        );


                    addRequest.onsuccess =
                        function(){

                            resolve({

                                productId:
                                    numericProductId,


                                productName:
                                    product.name ||
                                    "نامشخص",


                                quantity:
                                    numericQuantity,


                                type:
                                    type,


                                stockBefore:
                                    stockBefore,


                                stockAfter:
                                    stockAfter,


                                repairId:
                                    transactionRecord.repairId,


                                transaction:
                                    transactionRecord

                            });

                        };


                    addRequest.onerror =
                        function(){

                            reject(

                                new Error(

                                    "ثبت سابقه تراکنش انبار انجام نشد."

                                )

                            );

                        };

                };


            /* ------------------------------------------------
               خطا در دریافت کالا
               ------------------------------------------------ */

            productRequest.onerror =
                function(){

                    reject(

                        new Error(

                            "دریافت اطلاعات کالا از انبار انجام نشد."

                        )

                    );

                };

        }

    );

}
