'use client';

import {
    useState,
    useRef,
    useEffect,
    useCallback,
    type KeyboardEvent,
    type ChangeEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAICopilot } from '@/contexts/AICopilotContext';
import { aiService } from '@/services/aiService';
import {
    extractAISearchResults,
    getLocalFallbackSearchResults,
    isSafeInternalHref,
    type AISearchResult as SearchResult,
} from '@/utils/aiSearch';

const TYPE_CONFIG: Record<
    SearchResult['type'],
    { icon: string; label: string; colorClass: string; badgeClass: string }
> = {
    patient: {
        icon: 'person',
        label: 'Bệnh nhân',
        colorClass: 'text-blue-500',
        badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    medicine: {
        icon: 'medication',
        label: 'Thuốc',
        colorClass: 'text-green-500',
        badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    },
    appointment: {
        icon: 'calendar_month',
        label: 'Lịch hẹn',
        colorClass: 'text-violet-500',
        badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    },
    record: {
        icon: 'folder_open',
        label: 'Hồ sơ',
        colorClass: 'text-amber-500',
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
};

const TYPE_ORDER: SearchResult['type'][] = ['patient', 'appointment', 'medicine', 'record'];

export default function AISearchBar() {
    const router = useRouter();
    const { role } = useAICopilot();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSearch = useCallback(
        async (value: string) => {
            if (!value.trim()) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setIsLoading(true);
            setIsOpen(true);

            try {
                const response = await aiService.semanticSearch({
                    query: value,
                    role,
                });
                const nextResults = extractAISearchResults(response.data);
                setResults(nextResults.length > 0 ? nextResults : getLocalFallbackSearchResults(value, role));
            } catch {
                setResults(getLocalFallbackSearchResults(value, role));
            } finally {
                setIsLoading(false);
                setHighlightIdx(0);
            }
        },
        [role]
    );

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            runSearch(value);
        }, 300);
    };

    const handleSelect = useCallback(
        (result: SearchResult) => {
            setQuery('');
            setIsOpen(false);
            setResults([]);

            if (isSafeInternalHref(result.href)) {
                router.push(result.href);
            }
        },
        [router]
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || results.length === 0) {
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIdx((index) => Math.min(index + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIdx((index) => Math.max(index - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[highlightIdx]) {
                handleSelect(results[highlightIdx]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
        }
    };

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const grouped = TYPE_ORDER.reduce<Record<string, SearchResult[]>>((acc, type) => {
        const items = results.filter((result) => result.type === type);
        if (items.length > 0) {
            acc[type] = items;
        }
        return acc;
    }, {});

    const flatResults = TYPE_ORDER.flatMap((type) => grouped[type] ?? []);

    return (
        <div className="relative hidden w-72 md:block">
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    {isLoading ? (
                        <span
                            className="material-symbols-outlined animate-spin text-violet-400"
                            style={{ fontSize: 18 }}
                        >
                            progress_activity
                        </span>
                    ) : (
                        <span
                            className="material-symbols-outlined text-violet-400"
                            style={{ fontSize: 18 }}
                        >
                            smart_toy
                        </span>
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (results.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder="Tìm kiếm với AI..."
                    className="
                        block w-full rounded-xl border border-[#e5e7eb] bg-[#f6f7f8] py-2 pl-10 pr-3 text-sm
                        text-[#121417] transition-colors placeholder-[#94a3b8]
                        focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40
                        dark:border-[#2d353e] dark:bg-[#13191f] dark:text-white dark:placeholder-[#687582]
                        dark:focus:border-violet-500
                    "
                />
            </div>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="
                        absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto overflow-hidden rounded-xl
                        border border-[#e5e7eb] bg-white shadow-xl
                        dark:border-[#2d353e] dark:bg-[#1e242b]
                    "
                >
                    {isLoading && results.length === 0 ? (
                        <div className="flex items-center gap-2 px-4 py-3 text-xs text-[#687582] dark:text-gray-400">
                            <span
                                className="material-symbols-outlined animate-spin text-violet-400"
                                style={{ fontSize: 14 }}
                            >
                                progress_activity
                            </span>
                            AI đang tìm kiếm...
                        </div>
                    ) : flatResults.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400">
                            Không tìm thấy kết quả
                        </div>
                    ) : (
                        TYPE_ORDER.map((type) => {
                            const items = grouped[type];
                            if (!items) {
                                return null;
                            }

                            const config = TYPE_CONFIG[type];

                            return (
                                <div key={type}>
                                    <div className="flex items-center gap-1.5 px-3 pb-1 pt-2">
                                        <span
                                            className={`material-symbols-outlined ${config.colorClass}`}
                                            style={{ fontSize: 13 }}
                                        >
                                            {config.icon}
                                        </span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#687582] dark:text-gray-400">
                                            {config.label}
                                        </span>
                                    </div>

                                    {items.map((result) => {
                                        const flatIdx = flatResults.indexOf(result);
                                        const isHighlighted = flatIdx === highlightIdx;

                                        return (
                                            <button
                                                key={result.id}
                                                onMouseEnter={() => setHighlightIdx(flatIdx)}
                                                onClick={() => handleSelect(result)}
                                                className={`
                                                    w-full px-3 py-2 text-left transition-colors
                                                    ${
                                                        isHighlighted
                                                            ? 'bg-violet-50 dark:bg-violet-950/30'
                                                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span
                                                        className={`material-symbols-outlined flex-shrink-0 ${config.colorClass}`}
                                                        style={{ fontSize: 16 }}
                                                    >
                                                        {config.icon}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="truncate text-xs font-medium text-[#121417] dark:text-white">
                                                                {result.title}
                                                            </span>
                                                            <span
                                                                className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${config.badgeClass}`}
                                                            >
                                                                {config.label}
                                                            </span>
                                                        </div>
                                                        <span className="block truncate text-[10px] text-[#687582] dark:text-gray-400">
                                                            {result.subtitle}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
