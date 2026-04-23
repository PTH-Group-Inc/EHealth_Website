import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from "./config";

/**
 * Xác định locale:
 *  1. Cookie `NEXT_LOCALE` — user đã chọn (ưu tiên tuyệt đối)
 *  2. Default `vi` (Tiếng Việt) — áp dụng cho mọi user mới, bất kể
 *     browser preference. Design quyết định: Tiếng Việt là default.
 *
 * KHÔNG auto-detect Accept-Language để đảm bảo user Việt không bị
 * chuyển sang English mặc định dù browser set en-US.
 */
function resolveLocale(): Locale {
    try {
        const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
        if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
            return cookieLocale as Locale;
        }
    } catch {
        // Server-side context might not have cookies (during build)
    }
    return defaultLocale;
}

export default getRequestConfig(async () => {
    const locale = resolveLocale();
    const messages = {
        common: (await import(`../locales/${locale}/common.json`)).default,
        pages: (await import(`../locales/${locale}/pages.json`)).default,
        errors: (await import(`../locales/${locale}/errors.json`)).default,
    };
    return {
        locale,
        messages,
    };
});
