"use client";

/**
 * IcdSearchInput — autocomplete tìm ICD-10.
 * Debounce 350ms, gọi encounterService.searchICD.
 */

import { useEffect, useState } from "react";
import { encounterService } from "@/services/encounterService";

export interface IcdResult {
    code: string;
    description: string;
}

export interface IcdSearchInputProps {
    selectedCode?: string;
    selectedDescription?: string;
    onSelect: (code: string, description: string) => void;
    onClear?: () => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
}

export function IcdSearchInput({
    selectedCode,
    selectedDescription,
    onSelect,
    onClear,
    placeholder = "Gõ tên bệnh hoặc mã ICD-10...",
    label = "Tìm ICD-10",
    required,
    disabled,
}: IcdSearchInputProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<IcdResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        const handle = setTimeout(() => {
            encounterService
                .searchICD(query)
                .then((res: any) => {
                    const data = res?.data?.data ?? res?.data ?? [];
                    setResults(Array.isArray(data) ? data : []);
                })
                .catch(() => setResults([]))
                .finally(() => setSearching(false));
        }, 350);
        return () => {
            clearTimeout(handle);
            setSearching(false);
        };
    }, [query]);

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            {selectedCode && (
                <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">{selectedCode}</span>
                    <span className="text-sm text-[#121417] dark:text-white flex-1 truncate">{selectedDescription}</span>
                    {onClear && (
                        <button type="button" onClick={() => { onClear(); setQuery(""); setResults([]); }}
                            className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Xoá chẩn đoán">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
                        </button>
                    )}
                </div>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 200)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full px-4 py-2.5 pr-10 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {searching ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                ) : (
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#687582] dark:text-gray-500" style={{ fontSize: "18px" }}>
                        search
                    </span>
                )}
            </div>

            {open && results.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {results.map((r) => (
                        <li key={r.code}>
                            <button type="button"
                                onClick={() => {
                                    onSelect(r.code, r.description);
                                    setQuery("");
                                    setResults([]);
                                    setOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] text-sm border-b border-[#f0f0f0] dark:border-[#2d353e] last:border-0 transition-colors">
                                <span className="font-mono text-[#3C81C6] text-xs font-bold mr-2">{r.code}</span>
                                <span className="text-[#121417] dark:text-white">{r.description}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {open && query.length >= 2 && !searching && results.length === 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-lg px-4 py-3 text-sm text-[#687582] dark:text-gray-400 text-center">
                    Không tìm thấy kết quả cho &ldquo;<span className="font-medium">{query}</span>&rdquo;
                </div>
            )}
        </div>
    );
}

export default IcdSearchInput;
