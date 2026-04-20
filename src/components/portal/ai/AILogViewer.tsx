'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiService } from '@/services/aiService';

// ── Types ──────────────────────────────────────────────────────────────

type LogType = 'all' | 'chat' | 'diagnosis' | 'drug' | 'summary';
type DateFilter = 'today' | 'week' | 'month';

interface AILogEntry {
    id: string;
    type: Exclude<LogType, 'all'>;
    timestamp: string;
    prompt: string;
    responsePreview: string;
}

interface LogsApiResponse {
    items: AILogEntry[];
    total: number;
    page: number;
    hasMore: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: LogType; label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'chat', label: 'Chat' },
    { value: 'diagnosis', label: 'Chẩn đoán' },
    { value: 'drug', label: 'Thuốc' },
    { value: 'summary', label: 'Tóm tắt' },
];

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
];

const TYPE_BADGE: Record<Exclude<LogType, 'all'>, string> = {
    chat: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    diagnosis: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    drug: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    summary: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const TYPE_LABEL: Record<Exclude<LogType, 'all'>, string> = {
    chat: 'Chat',
    diagnosis: 'Chẩn đoán',
    drug: 'Thuốc',
    summary: 'Tóm tắt',
};

// ── Component ──────────────────────────────────────────────────────────

interface AILogViewerProps {
    doctorId?: string;
    visible: boolean;
}

export function AILogViewer({ doctorId, visible }: AILogViewerProps) {
    const [logs, setLogs] = useState<AILogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [typeFilter, setTypeFilter] = useState<LogType>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');

    // ── Fetch helpers ──────────────────────────────────────────────────

    const fetchLogs = useCallback(
        async (currentPage: number, replace: boolean) => {
            try {
                if (replace) {
                    setLoading(true);
                } else {
                    setLoadingMore(true);
                }
                setError(null);

                const response = await aiService.getLogs({
                    doctorId,
                    page: currentPage,
                    type: typeFilter === 'all' ? undefined : typeFilter,
                    dateRange: dateFilter,
                });

                // Normalise — backend may return different shapes
                const raw = response as unknown as { data?: LogsApiResponse } & LogsApiResponse;
                const data: LogsApiResponse = raw?.data ?? raw;
                const items: AILogEntry[] = data.items ?? [];
                const responseTotal: number = data.total ?? items.length;
                const responseHasMore: boolean = data.hasMore ?? false;

                if (replace) {
                    setLogs(items);
                } else {
                    setLogs((prev) => [...prev, ...items]);
                }
                setTotal(responseTotal);
                setHasMore(responseHasMore);
                setPage(currentPage);
            } catch {
                setError('Không thể tải lịch sử. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [doctorId, typeFilter, dateFilter],
    );

    // ── Effects ────────────────────────────────────────────────────────

    useEffect(() => {
        if (!visible) return;
        fetchLogs(1, true);
    }, [visible, fetchLogs]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchLogs(page + 1, false);
        }
    };

    // ── Filter bar ─────────────────────────────────────────────────────

    const FilterButton = ({
        active,
        onClick,
        children,
    }: {
        active: boolean;
        onClick: () => void;
        children: React.ReactNode;
    }) => (
        <button
            onClick={onClick}
            className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${
                active
                    ? 'bg-[#3C81C6] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-[#687582] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
            {children}
        </button>
    );

    // ── Render ─────────────────────────────────────────────────────────

    if (!visible) return null;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1a1d21]">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-[#121417] dark:text-gray-100">
                    📋 Lịch sử AI
                </span>
                {total > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#3C81C6]/10 text-[#3C81C6] dark:bg-blue-900/40 dark:text-blue-300">
                        {total}
                    </span>
                )}
            </div>

            {/* Filter bar */}
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                {/* Type filters */}
                <div className="flex gap-1.5 flex-wrap">
                    {TYPE_OPTIONS.map((opt) => (
                        <FilterButton
                            key={opt.value}
                            active={typeFilter === opt.value}
                            onClick={() => setTypeFilter(opt.value)}
                        >
                            {opt.label}
                        </FilterButton>
                    ))}
                </div>
                {/* Date filters */}
                <div className="flex gap-1.5">
                    {DATE_OPTIONS.map((opt) => (
                        <FilterButton
                            key={opt.value}
                            active={dateFilter === opt.value}
                            onClick={() => setDateFilter(opt.value)}
                        >
                            {opt.label}
                        </FilterButton>
                    ))}
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
                {/* Loading skeleton */}
                {loading && (
                    <div className="flex flex-col gap-3 p-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 animate-pulse"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-4 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700 mb-1" />
                                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                        <span className="text-2xl">⚠️</span>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{error}</p>
                        <button
                            onClick={() => fetchLogs(1, true)}
                            className="mt-1 text-xs text-[#3C81C6] hover:underline"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                        <span className="text-3xl">📭</span>
                        <p className="text-sm font-medium text-[#687582] dark:text-gray-400">
                            Chưa có lịch sử AI nào
                        </p>
                        <p className="text-xs text-[#687582] dark:text-gray-500">
                            Các cuộc hội thoại với AI sẽ xuất hiện tại đây
                        </p>
                    </div>
                )}

                {/* Log list */}
                {!loading && !error && logs.length > 0 && (
                    <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                        {logs.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex flex-col gap-1.5 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                {/* Top row: timestamp + badge */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-[#687582] dark:text-gray-500 tabular-nums whitespace-nowrap">
                                        {entry.timestamp}
                                    </span>
                                    <span
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[entry.type]}`}
                                    >
                                        {TYPE_LABEL[entry.type]}
                                    </span>
                                </div>

                                {/* Prompt — 2 lines max */}
                                <p className="text-xs text-[#121417] dark:text-gray-200 leading-snug line-clamp-2">
                                    {entry.prompt}
                                </p>

                                {/* Response preview — 1 line */}
                                {entry.responsePreview && (
                                    <p className="text-[11px] text-[#687582] dark:text-gray-500 leading-snug truncate">
                                        {entry.responsePreview}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Load more button */}
                {!loading && !error && hasMore && (
                    <div className="flex justify-center py-4">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="text-xs font-medium px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-[#687582] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loadingMore ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block h-3 w-3 rounded-full border-2 border-[#3C81C6] border-t-transparent animate-spin" />
                                    Đang tải...
                                </span>
                            ) : (
                                'Tải thêm'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
