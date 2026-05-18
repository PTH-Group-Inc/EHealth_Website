'use client';

import { useState, useEffect, useRef } from 'react';
import { aiService } from '@/services/aiService';
import type { AIPatientSummary } from '@/types';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { AICitationBlock } from './AICitationBlock';

// ============================================
// Props
// ============================================

interface AIPreExamHintProps {
    patientId: string;
    patientName: string;
    visible: boolean;
    onClose?: () => void;
}

// ============================================
// Sub-components
// ============================================

function AllergyBadge({ allergy }: { allergy: string }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700">
            ⚠ {allergy}
        </span>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-3 animate-pulse" aria-label="Đang tải...">
            {[90, 70, 80, 60].map((w, i) => (
                <div
                    key={i}
                    className="h-3 rounded bg-violet-200/60 dark:bg-violet-800/30"
                    style={{ width: `${w}%` }}
                />
            ))}
        </div>
    );
}

function SummaryContent({ summary }: { summary: AIPatientSummary }) {
    return (
        <div className="space-y-4">
            {/* Last visit */}
            {summary.recentDiagnosis && (
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-400 mb-1">
                        Lần khám gần nhất
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                        <span className="mt-0.5 shrink-0">📅</span>
                        <span>
                            {summary.recentDiagnosis.date} —{' '}
                            <span className="font-medium">
                                {summary.recentDiagnosis.description}
                            </span>{' '}
                            <span className="text-gray-400 dark:text-gray-500">
                                ({summary.recentDiagnosis.icdCode})
                            </span>
                        </span>
                    </p>
                </div>
            )}

            {/* Red flags */}
            {summary.redFlags.length > 0 && (
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 dark:text-red-400 mb-1">
                        Cờ đỏ lâm sàng
                    </p>
                    <ul className="space-y-1">
                        {summary.redFlags.map((flag, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-300 font-medium"
                            >
                                <span className="mt-0.5 shrink-0">🚩</span>
                                <span>{flag}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Current medications */}
            {summary.currentMedications.length > 0 && (
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-400 mb-1">
                        Thuốc đang dùng
                    </p>
                    <ul className="space-y-1">
                        {summary.currentMedications.map((med, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                                <span className="mt-0.5 shrink-0">💊</span>
                                <span>
                                    <span className="font-medium">{med.name}</span>
                                    {med.dosage && (
                                        <span className="text-gray-500 dark:text-gray-400"> — {med.dosage}</span>
                                    )}
                                    {med.compliance && (
                                        <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400">
                                            ({med.compliance})
                                        </span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Allergies */}
            {summary.allergies.length > 0 && (
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 dark:text-red-400 mb-1.5">
                        Dị ứng
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {summary.allergies.map((a, i) => (
                            <AllergyBadge key={i} allergy={a} />
                        ))}
                    </div>
                </div>
            )}

            {/* Chronic conditions (bonus) */}
            {summary.chronicConditions.length > 0 && (
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-400 mb-1">
                        Bệnh mãn tính
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {summary.chronicConditions.map((c, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                            >
                                {c}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// Main component
// ============================================

export function AIPreExamHint({ patientId, patientName, visible, onClose }: AIPreExamHintProps) {
    const { preferences } = useAIPreferences();

    const [summary, setSummary] = useState<AIPatientSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rendered, setRendered] = useState(false); // Controls mount (for transition)

    const prevPatientRef = useRef<string>('');
    const cancelledRef = useRef(false);

    // Animate in: mount first, then trigger CSS transition
    useEffect(() => {
        if (visible) {
            setRendered(true);
        }
    }, [visible]);

    // Fetch summary whenever panel becomes visible for a patient
    useEffect(() => {
        if (!visible || !patientId) return;

        // Skip re-fetch if same patient
        if (prevPatientRef.current === patientId && summary) return;
        prevPatientRef.current = patientId;

        cancelledRef.current = false;
        setSummary(null);
        setError(null);
        setLoading(true);

        async function fetchSummary() {
            try {
                const res = await aiService.summarizePatient(patientId);
                if (!cancelledRef.current) {
                    setSummary(res.data?.summary ?? null);
                }
            } catch {
                if (!cancelledRef.current) {
                    setError('Không thể tải dữ liệu AI. Vui lòng thử lại.');
                }
            } finally {
                if (!cancelledRef.current) {
                    setLoading(false);
                }
            }
        }

        fetchSummary();

        return () => {
            cancelledRef.current = true;
        };
    // intentionally exclude `summary` to avoid loop — chính effect này set summary
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, patientId]);

    const handleClose = () => {
        onClose?.();
    };

    const handleTransitionEnd = () => {
        if (!visible) {
            setRendered(false);
        }
    };

    if (!rendered) return null;

    return (
        <div
            role="dialog"
            aria-label={`AI Pre-Exam Hint — ${patientName}`}
            aria-modal="false"
            onTransitionEnd={handleTransitionEnd}
            style={{ transition: 'opacity 200ms ease, transform 200ms ease' }}
            className={`
                rounded-xl border border-violet-200 dark:border-violet-700
                bg-violet-50 dark:bg-violet-950/30
                border-l-4 border-l-violet-600 dark:border-l-violet-400
                overflow-hidden shadow-sm
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-violet-100 dark:bg-violet-900/40 border-b border-violet-200 dark:border-violet-700">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">🤖</span>
                    <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-200 truncate">
                        AI Pre-Exam Hint —{' '}
                        <span className="font-bold">{patientName}</span>
                    </h3>
                    {loading && (
                        <span className="ml-1 h-3.5 w-3.5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin shrink-0" />
                    )}
                </div>
                <button
                    onClick={handleClose}
                    className="shrink-0 ml-2 text-violet-500 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 transition-colors text-sm leading-none"
                    aria-label="Đóng AI Pre-Exam Hint"
                >
                    ✕
                </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4">
                {loading && <LoadingSkeleton />}

                {!loading && error && (
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                )}

                {!loading && !error && !summary && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Không có dữ liệu tóm tắt cho bệnh nhân này.
                    </p>
                )}

                {!loading && !error && summary && (
                    <SummaryContent summary={summary} />
                )}
            </div>

            {/* Footer: citations */}
            {!loading && summary && summary.citations.length > 0 && (
                <div className="px-4 pb-4">
                    <AICitationBlock citations={summary.citations} />
                </div>
            )}

            {/* Disclaimer */}
            <div className="px-4 pb-3">
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Tóm tắt AI chỉ mang tính hỗ trợ lâm sàng. Bác sĩ chịu trách nhiệm quyết định cuối cùng.
                </p>
            </div>
        </div>
    );
}
