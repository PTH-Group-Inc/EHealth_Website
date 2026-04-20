/**
 * Cấu hình đa ngôn ngữ toàn hệ thống.
 *
 * - Tiếng Việt (vi) là mặc định.
 * - English (en) và 中文 (zh-CN) là ngôn ngữ phụ.
 */

export const locales = ["vi", "en", "zh-CN"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

export const localeLabels: Record<Locale, { name: string; flag: string; nativeName: string }> = {
    "vi": { name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
    "en": { name: "English", nativeName: "English", flag: "🇺🇸" },
    "zh-CN": { name: "Chinese (Simplified)", nativeName: "中文 (简体)", flag: "🇨🇳" },
};

export const LOCALE_COOKIE = "NEXT_LOCALE";
