'use client';

import { useEffect, useRef, useState } from 'react';
import type { AIVitalAlert, AILabSuggestion } from '@/types';
import { aiService } from '@/services/aiService';
import { AI_LAB_PRIORITY_COLORS } from '@/constants/ai';
import { AICitationBlock } from './AICitationBlock';
import { AIStatusIndicator } from './AIStatusIndicator';

// ============================================
// Props
// ============================================

interface AIVitalAlertBannerProps {
    vitals: Record<string, string>;
    patientAge?: number;
    patientHistory?: Record<string, unknown>;
    onDismiss?: () => void;
}

// ============================================
// Severity config
// ============================================

const SEVERITY_CONFIG = {
    critical: {
        container: 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700 border-l-red-600',
        header: 'bg-red-100 dark:bg-red-900/40',
        icon: '🚨',
        label: 'Nguy kịch',
        labelClass: 'bg-red-600 text-white',
        titleClass: 'text-red-800 dark:text-red-200',
        valueClass: 'text-red-700 dark:text-red-300 font-bold',
        checkClass: 'text-red-700 dark:text-red-300',
    },
    warning: {
        container: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 border-l-amber-500',
        header: 'bg-amber-100 dark:bg-amber-900/40',
        icon: '⚠️',
        label: 'Cảnh báo',
        labelClass: 'bg-amber-500 text-white',
        titleClass: 'text-amber-800 dark:text-amber-200',
        valueClass: 'text-amber-700 dark:text-amber-300 font-bold',
        checkClass: 'text-amber-700 dark:text-amber-300',
    },
    info: {
        container: 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 border-l-blue-500',
        header: 'bg-blue-100 dark:bg-blue-900/40',
        icon: 'ℹ️',
        label: 'Lưu ý',
        labelClass: 'bg-blue-500 text-white',
        titleClass: 'text-blue-800 dark:text-blue-200',
        valueClass: 'text-blue-700 dark:text-blue-300 font-bold',
        checkClass: 'text-blue-700 dark:text-blue-300',
    },
} as const;

// ============================================
// Sub-components
// ============================================

function LabSuggestionChip({ lab }: { lab: AILabSuggestion }) {
    const priority = AI_LAB_PRIORITY_COLORS[lab.priority];
    return (
        <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${priority.bg} ${priority.border}`}
            title={lab.reason}
        >
            <span>{priority.icon}</span>
            <span className="font-medium text-[#121417] dark:text-gray-200">{lab.labName}</span>
            <span className="text-[#687582] dark:text-gray-400">({priority.label})</span>
        </span>
    );
}

function VitalAlertCard({
    alert,
    onDismissAlert,
}: {
    alert: AIVitalAlert;
    onDismissAlert: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const cfg = SEVERITY_CONFIG[alert.severity];

    const noCitations = alert.citations.length === 0;

    return (
        <div className={`border ${cfg.container} border-l-4 rounded-lg overflow-hidden`}>
            {/* Alert header */}
            <div className={`flex items-center justify-between px-3 py-2 ${cfg.header}`}>
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{cfg.icon}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.labelClass}`}>
                        {cfg.label}
                    </span>
                    <span className={`text-xs font-semibold truncate ${cfg.titleClass}`}>
                        {alert.parameter}
                    </span>
                    <span className={`text-xs ${cfg.valueClass}`}>{alert.value}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="text-xs text-[#687582] dark:text-gray-400 hover:text-[#121417] dark:hover:text-gray-200 transition-colors"
                        aria-label="Xem chi tiết"
                    >
                        {expanded ? '▲ Thu gọn' : '▼ Chi tiết'}
                    </button>
                    <button
                        onClick={() => onDismissAlert(alert.id)}
                        className="text-[#687582] dark:text-gray-400 hover:text-[#121417] dark:hover:text-gray-200 transition-colors text-sm leading-none"
                        aria-label="Đóng cảnh báo"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Message */}
            <div className="px-3 py-2">
                <p className="text-xs text-[#121417] dark:text-gray-200 leading-relaxed">{alert.message}</p>
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div className="px-3 pb-3 space-y-3">
                    {/* Clinical assessment checklist */}
                    {alert.clinicalAssessment.length > 0 && (
                        <div>
                            <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${cfg.checkClass}`}>
                                Đánh giá lâm sàng
                            </p>
                            <ul className="space-y-1">
                                {alert.clinicalAssessment.map((item, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs text-[#121417] dark:text-gray-200">
                                        <span className="mt-0.5 shrink-0">☐</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Suggested labs */}
                    {alert.suggestedLabs.length > 0 && (
                        <div>
                            <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${cfg.checkClass}`}>
                                Xét nghiệm đề xuất
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {alert.suggestedLabs.map((lab) => (
                                    <LabSuggestionChip key={lab.id} lab={lab} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Citations */}
                    {noCitations ? (
                        <div className="text-xs text-[#687582] dark:text-gray-400 italic">
                            Không tìm thấy guideline phù hợp
                        </div>
                    ) : (
                        <AICitationBlock citations={alert.citations} />
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================
// Main component
// ============================================

export function AIVitalAlertBanner({
    vitals,
    patientAge = 0,
    patientHistory,
    onDismiss,
}: AIVitalAlertBannerProps) {
    const [loading, setLoading] = useState(false);
    const [alerts, setAlerts] = useState<AIVitalAlert[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [bannerDismissed, setBannerDismissed] = useState(false);

    // Track previous vitals serialised to detect meaningful changes
    const prevVitalsRef = useRef<string>('');

    useEffect(() => {
        const serialised = JSON.stringify(vitals);
        // Skip if nothing changed or vitals object is empty
        if (serialised === prevVitalsRef.current || Object.keys(vitals).length === 0) return;
        prevVitalsRef.current = serialised;

        let cancelled = false;

        async function fetchAlerts() {
            setLoading(true);
            try {
                const res = await aiService.checkVitals({
                    vitals: vitals as Record<string, unknown>,
                    patientAge,
                    patientHistory,
                });
                if (!cancelled) {
                    setAlerts((res.data as any)?.data?.alerts ?? res.data?.alerts ?? []);
                }
            } catch {
                // Graceful failure — don't block workflow
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchAlerts();
        return () => {
            cancelled = true;
        };
    }, [vitals, patientAge, patientHistory]);

    const handleDismissAlert = (id: string) => {
        setDismissed((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const handleDismissBanner = () => {
        setBannerDismissed(true);
        onDismiss?.();
    };

    const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

    // Show loading indicator
    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#f8f9fa] dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <AIStatusIndicator status="loading" />
                <span className="text-xs text-[#687582] dark:text-gray-400">
                    Đang kiểm tra sinh hiệu bất thường...
                </span>
            </div>
        );
    }

    // Nothing to show
    if (bannerDismissed || visibleAlerts.length === 0) return null;

    // Sort: critical first, then warning, then info
    const sortOrder = { critical: 0, warning: 1, info: 2 };
    const sorted = [...visibleAlerts].sort((a, b) => sortOrder[a.severity] - sortOrder[b.severity]);

    const hasCritical = sorted.some((a) => a.severity === 'critical');

    return (
        <div
            className={`rounded-xl border ${hasCritical
                    ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20'
                    : 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
                } overflow-hidden`}
        >
            {/* Banner header */}
            <div
                className={`flex items-center justify-between px-4 py-2.5 ${hasCritical
                        ? 'bg-red-100 dark:bg-red-900/40'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <span>🤖</span>
                    <span
                        className={`text-sm font-semibold ${hasCritical
                                ? 'text-red-800 dark:text-red-200'
                                : 'text-amber-800 dark:text-amber-200'
                            }`}
                    >
                        AI Cảnh báo Sinh hiệu — {sorted.length} bất thường phát hiện
                    </span>
                </div>
                <button
                    onClick={handleDismissBanner}
                    className="text-[#687582] dark:text-gray-400 hover:text-[#121417] dark:hover:text-gray-200 transition-colors text-sm"
                    aria-label="Đóng tất cả cảnh báo"
                >
                    ✕
                </button>
            </div>

            {/* Alert cards */}
            <div className="p-3 space-y-2">
                {sorted.map((alert) => (
                    <VitalAlertCard
                        key={alert.id}
                        alert={alert}
                        onDismissAlert={handleDismissAlert}
                    />
                ))}
            </div>

            <div className="px-4 pb-2 text-[10px] text-[#687582] dark:text-gray-500">
                Kết quả phân tích AI chỉ mang tính hỗ trợ. Bác sĩ chịu trách nhiệm quyết định lâm sàng cuối cùng.
            </div>
        </div>
    );
}
