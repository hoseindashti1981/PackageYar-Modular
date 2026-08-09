/* =========================================================
   HEADER UI
   مسئول نمایش و اعمال تنظیمات هدر برنامه
   ========================================================= */


/**
 * اعمال نام، زیرعنوان و لوگوی فعلی برنامه در هدر
 *
 * نکته:
 * appLogo همان لوگوی فعلی کسب‌وکار است و نباید
 * با بنر هدر اشتباه گرفته شود.
 */
async function applyAppBranding(){

    try{

        const appName =
            await getSetting("appName") ||
            "پکیج‌یار";

        const appSubtitle =
            await getSetting("appSubtitle") ||
            "سیستم مدیریت تعمیرکار پکیج";

        const appLogo =
            await getSetting("appLogo") ||
            "";

        /* نام برنامه */
        const nameEl =
            document.getElementById("headerAppName");

        if(nameEl){

            nameEl.innerText =
                "🔥 " + appName;

        }else{

            const logoText =
                document.querySelector(".logo");

            if(logoText){

                logoText.innerText =
                    "🔥 " + appName;

            }

        }


        /* زیرعنوان */
        const subtitle =
            document.querySelector(".subtitle");

        if(subtitle){

            subtitle.innerText =
                appSubtitle;

        }


        /* عنوان صفحه */
        document.title =
            appName;


        /* لوگوی فعلی کسب‌وکار */
        const headerLogo =
            document.getElementById("headerAppLogo");

        if(headerLogo){

            if(appLogo){

                headerLogo.src =
                    appLogo;

                headerLogo.style.display =
                    "block";

                headerLogo.alt =
                    appName;

            }else{

                headerLogo.removeAttribute("src");

                headerLogo.style.display =
                    "none";

            }

        }


        /* بنر هدر */
        await applyHeaderBanner();

    }catch(error){

        console.error(
            "خطا در اعمال تنظیمات هدر:",
            error
        );

    }

}


/**
 * نمایش بنر هدر ذخیره‌شده
 */
async function applyHeaderBanner(){

    try{

        const banner =
            await getSetting("appHeaderBanner") ||
            "";

        const bannerContainer =
            document.getElementById("headerBannerContainer");

        const bannerImage =
            document.getElementById("headerBanner");

        if(!bannerContainer || !bannerImage){

            return;

        }


        if(banner){

            bannerImage.src =
                banner;

            bannerImage.alt =
                "بنر هدر برنامه";

            bannerContainer.style.display =
                "block";

        }else{

            bannerImage.removeAttribute("src");

            bannerImage.alt =
                "";

            bannerContainer.style.display =
                "none";

        }

    }catch(error){

        console.error(
            "خطا در اعمال بنر هدر:",
            error
        );

    }

}
