function formatMoney(
value
){

const number =
Number(
value
) || 0;

return number
.toLocaleString(
"fa-IR"
)
+
" تومان";

}



function convertDigitsToEnglish(
    value
){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    let text =
        String(
            value
        );


    const persianDigits =
        "۰۱۲۳۴۵۶۷۸۹";


    const arabicDigits =
        "٠١٢٣٤٥٦٧٨٩";


    for(
        let i = 0;
        i < 10;
        i++
    ){

        text =
            text.replaceAll(
                persianDigits[i],
                String(i)
            );


        text =
            text.replaceAll(
                arabicDigits[i],
                String(i)
            );

    }


    return text;

}



function parseInventoryNumber(
    value
){

    let text =
        convertDigitsToEnglish(
            value
        );


    text =
        text
        .replace(
            /,/g,
            ""
        )
        .replace(
            /٬/g,
            ""
        )
        .replace(
            /\s/g,
            ""
        )
        .trim();


    if(
        text === ""
    ){

        return 0;

    }


    const number =
        Number(
            text
        );


    return isNaN(
        number
    )
    ?
    0
    :
    number;

}


