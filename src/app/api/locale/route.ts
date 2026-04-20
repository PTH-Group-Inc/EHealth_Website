import { NextResponse } from "next/server";
import { LOCALE_COOKIE, locales } from "@/i18n/config";

/**
 * POST /api/locale
 * Body: { locale: "vi" | "en" | "zh-CN" }
 *
 * Set cookie NEXT_LOCALE để `i18n/request.ts` đọc được ở lần render kế tiếp.
 */
export async function POST(req: Request) {
    try {
        const { locale } = await req.json();
        if (typeof locale !== "string" || !(locales as readonly string[]).includes(locale)) {
            return NextResponse.json({ success: false, error: "INVALID_LOCALE" }, { status: 400 });
        }

        const res = NextResponse.json({ success: true, locale });
        res.cookies.set(LOCALE_COOKIE, locale, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365, // 1 năm
            sameSite: "lax",
        });
        return res;
    } catch {
        return NextResponse.json({ success: false, error: "BAD_REQUEST" }, { status: 400 });
    }
}
