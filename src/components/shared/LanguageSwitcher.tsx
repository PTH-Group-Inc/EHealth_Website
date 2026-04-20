"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { locales, localeLabels, type Locale } from "@/i18n/config";

interface Props {
    variant?: "button" | "compact";
    align?: "left" | "right";
}

export function LanguageSwitcher({ variant = "button", align = "right" }: Props) {
    const router = useRouter();
    const currentLocale = useLocale() as Locale;
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, [open]);

    const handleSwitch = async (locale: Locale) => {
        if (locale === currentLocale || saving) return;
        setSaving(true);
        try {
            await fetch("/api/locale", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ locale }),
            });
            // Reload trang để Server Components lấy messages mới
            router.refresh();
            // Fallback hard reload nếu refresh không trigger re-render messages
            setTimeout(() => window.location.reload(), 100);
        } finally {
            setSaving(false);
            setOpen(false);
        }
    };

    const meta = localeLabels[currentLocale];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`inline-flex items-center gap-1.5 rounded-xl text-sm font-medium transition-colors ${
                    variant === "compact"
                        ? "px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#687582] dark:text-gray-400"
                        : "px-3 py-2 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] text-[#121417] dark:text-white"
                }`}
                title={meta.nativeName}
                aria-label="Switch language"
            >
                <span className="text-base" aria-hidden>{meta.flag}</span>
                {variant === "button" && <span className="hidden md:inline">{meta.nativeName}</span>}
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {open ? "expand_less" : "expand_more"}
                </span>
            </button>

            {open && (
                <div
                    className={`absolute top-full mt-2 min-w-[180px] bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-lg overflow-hidden z-50 ${
                        align === "right" ? "right-0" : "left-0"
                    }`}
                >
                    {locales.map((loc) => {
                        const m = localeLabels[loc];
                        const active = loc === currentLocale;
                        return (
                            <button
                                key={loc}
                                onClick={() => handleSwitch(loc)}
                                disabled={saving}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors disabled:opacity-50 ${
                                    active
                                        ? "bg-[#3C81C6]/10 text-[#3C81C6] font-semibold"
                                        : "hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] text-[#121417] dark:text-white"
                                }`}
                            >
                                <span className="text-base" aria-hidden>{m.flag}</span>
                                <span className="flex-1">{m.nativeName}</span>
                                {active && (
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>
                                        check
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
