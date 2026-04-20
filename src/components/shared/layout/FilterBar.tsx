"use client";

/**
 * FilterBar — thanh lọc chuẩn cho list page.
 * Search input + dropdown filters + reset + action.
 */

import { ReactNode, useState } from "react";

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterDropdown {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
}

export interface FilterBarProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    filters?: FilterDropdown[];
    actions?: ReactNode;
    showReset?: boolean;
    onReset?: () => void;
}

export function FilterBar({
    searchPlaceholder = "Tìm kiếm...",
    searchValue = "",
    onSearchChange,
    filters = [],
    actions,
    showReset = true,
    onReset,
}: FilterBarProps) {
    const [focused, setFocused] = useState(false);
    const hasActiveFilter =
        (searchValue && searchValue.length > 0) ||
        filters.some((f) => f.value && f.value !== "all" && f.value !== "");

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-3 flex flex-wrap items-center gap-2">
            {onSearchChange && (
                <div className={`relative flex-1 min-w-[200px] ${focused ? "ring-2 ring-[#3C81C6]/20 rounded-xl" : ""}`}>
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#687582] dark:text-gray-500" style={{ fontSize: "18px" }}>
                        search
                    </span>
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:bg-white dark:focus:bg-[#1e242b] dark:text-white transition-colors"
                    />
                </div>
            )}

            {filters.map((f) => (
                <div key={f.key} className="relative">
                    <select
                        value={f.value}
                        onChange={(e) => f.onChange(e.target.value)}
                        aria-label={f.label}
                        className="pl-3 pr-8 py-2 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 appearance-none cursor-pointer dark:text-white min-w-[120px]"
                    >
                        {f.options.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#687582] dark:text-gray-500 pointer-events-none" style={{ fontSize: "16px" }}>
                        expand_more
                    </span>
                </div>
            ))}

            {showReset && hasActiveFilter && onReset && (
                <button
                    onClick={onReset}
                    className="px-3 py-2 text-xs font-medium text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors inline-flex items-center gap-1"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                    Xoá bộ lọc
                </button>
            )}

            {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
    );
}

export default FilterBar;
