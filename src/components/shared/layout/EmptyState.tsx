"use client";

/**
 * EmptyState — hiển thị khi list trống, không có data.
 * Có illustration + text + CTA tuỳ chọn.
 */

import { ReactNode } from "react";

export type EmptyStateVariant = "default" | "success" | "warning" | "info";

const VARIANT_STYLE: Record<EmptyStateVariant, { gradient: string; iconColor: string }> = {
    default: { gradient: "from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/20", iconColor: "text-gray-400 dark:text-gray-500" },
    success: { gradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/10", iconColor: "text-emerald-600" },
    warning: { gradient: "from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/10", iconColor: "text-amber-600" },
    info: { gradient: "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10", iconColor: "text-blue-600" },
};

export interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    variant?: EmptyStateVariant;
    action?: ReactNode;
    className?: string;
    compact?: boolean;
}

export function EmptyState({
    icon = "inbox",
    title,
    description,
    variant = "default",
    action,
    className = "",
    compact = false,
}: EmptyStateProps) {
    const s = VARIANT_STYLE[variant];
    const iconBoxSize = compact ? "w-12 h-12" : "w-16 h-16";
    const iconFontSize = compact ? 24 : 32;
    const py = compact ? "py-8" : "py-12";

    return (
        <div className={`flex flex-col items-center justify-center text-center ${py} ${className}`}>
            <div className={`${iconBoxSize} rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3`}>
                <span className={`material-symbols-outlined ${s.iconColor}`} style={{ fontSize: `${iconFontSize}px` }}>
                    {icon}
                </span>
            </div>
            <p className="text-sm font-semibold text-[#121417] dark:text-white mb-1">{title}</p>
            {description && (
                <p className="text-xs text-[#687582] dark:text-gray-500 max-w-sm">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export default EmptyState;
