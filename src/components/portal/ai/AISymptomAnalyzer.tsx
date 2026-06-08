'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AIDiagnosisSuggestion, AILabSuggestion } from '@/types';
import { aiService } from '@/services/aiService';
import type { AIDiagnosisResponse } from '@/services/aiService';
import { AI_DEBOUNCE_MS, AI_LAB_PRIORITY_COLORS, getConfidenceTier, AI_CONFIDENCE_COLORS } from '@/constants/ai';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { AICitationBlock } from './AICitationBlock';
import { AIStatusIndicator } from './AIStatusIndicator';
import { AIConfidenceBadge } from './AIConfidenceBadge';

// ============================================
// Props
// ============================================

interface AISymptomAnalyzerProps {
    symptoms: string;
    vitals?: Record<string, string>;
    patientHistory?: Record<string, unknown>;
    onSelectDiagnosis?: (icdCode: string, description: string) => void;
    onSuggestLabs?: (labIds: string[]) => void;
}

// ============================================
// Sub-components
// ============================================

function ConfidenceBar({ value }: { value: number }) {
    const tier = getConfidenceTier(value);
    const colors = AI_CONFIDENCE_COLORS[tier];
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${colors.badge} transition-all duration-500`}
                    style={{ width: `${value}%` }}
                />
            </div>
            <span className={`text-xs font-semibold tabular-nums ${colors.text} dark:${colors.text}`}>
                {value}%
            </span>
        </div>
    );
}

function DiagnosisCard({
    diagnosis,
    rank,
    onSelect,
    belowThreshold,
}: {
    diagnosis: AIDiagnosisSuggestion;
    rank: number;
    onSelect: (icdCode: string, description: string) => void;
    belowThreshold: boolean;
}) {
    const [expanded, setExpanded] = useState(rank === 1); // auto-expand top result

    return (
        <div
            className={`border rounded-lg overflow-hidden transition-opacity ${belowThreshold ? 'opacity-50' : ''} bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700`}
        >
            {/* Card header */}
            <div className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                    {/* Rank badge */}
                    <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#3C81C6] text-white text-[10px] font-bold mt-0.5">
                        {rank}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* ICD code badge */}
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-[#3C81C6] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {diagnosis.icdCode}
                            </span>
                            <span className="text-sm font-semibold text-[#121417] dark:text-gray-100 truncate">
                                {diagnosis.icdDescription}
                            </span>
                        </div>
                        <ConfidenceBar value={diagnosis.confidence} />
                        {belowThreshold && (
                            <p className="text-[10px] text-[#687582] dark:text-gray-500 italic">
                                Dưới ngưỡng confidence đã cài đặt
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <AIConfidenceBadge confidence={diagnosis.confidence} />
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="text-xs text-[#687582] dark:text-gray-400 hover:text-[#121417] dark:hover:text-gray-200 transition-colors"
                    >
                        {expanded ? '▲' : '▼'}
                    </button>
                </div>
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2.5 space-y-2.5">
                    {/* Matching symptoms */}
                    {(diagnosis.matchingSymptoms?.length ?? 0) > 0 && (
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#687582] dark:text-gray-400 mb-1">
                                Triệu chứng phù hợp
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {diagnosis.matchingSymptoms?.map((s, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                                    >
                                        ✅ {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Exclude symptoms */}
                    {(diagnosis.excludeSymptoms?.length ?? 0) > 0 && (
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#687582] dark:text-gray-400 mb-1">
                                Triệu chứng loại trừ
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {diagnosis.excludeSymptoms?.map((s, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800"
                                    >
                                        ❌ {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sensitivity / specificity */}
                    {(diagnosis.sensitivity !== undefined || diagnosis.specificity !== undefined) && (
                        <div className="flex gap-4 text-xs text-[#687582] dark:text-gray-400">
                            {diagnosis.sensitivity !== undefined && (
                                <span>
                                    <span className="font-semibold text-[#121417] dark:text-gray-200">
                                        {diagnosis.sensitivity}%
                                    </span>{' '}
                                    Độ nhạy
                                </span>
                            )}
                            {diagnosis.specificity !== undefined && (
                                <span>
                                    <span className="font-semibold text-[#121417] dark:text-gray-200">
                                        {diagnosis.specificity}%
                                    </span>{' '}
                                    Độ đặc hiệu
                                </span>
                            )}
                        </div>
                    )}

                    {/* Use diagnosis button */}
                    <button
                        onClick={() => onSelect(diagnosis.icdCode, diagnosis.icdDescription)}
                        className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg bg-[#3C81C6] hover:bg-blue-700 text-white transition-colors"
                    >
                        Dùng chẩn đoán: {diagnosis.icdCode} — {diagnosis.icdDescription}
                    </button>
                </div>
            )}
        </div>
    );
}

function LabRow({
    lab,
    onSuggest,
}: {
    lab: AILabSuggestion;
    onSuggest: (labId: string) => void;
}) {
    const priority = AI_LAB_PRIORITY_COLORS[lab.priority];
    return (
        <button
            onClick={() => onSuggest(lab.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left hover:brightness-95 transition-all ${priority.bg} ${priority.border}`}
        >
            <span className="text-base shrink-0">{priority.icon}</span>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#121417] dark:text-gray-100">{lab.labName}</p>
                <p className="text-[10px] text-[#687582] dark:text-gray-400 truncate">{lab.reason}</p>
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-[#687582] dark:text-gray-400 bg-white/70 dark:bg-gray-800/60 px-1.5 py-0.5 rounded">
                {priority.label}
            </span>
        </button>
    );
}

// ============================================
// Main component
// ============================================

export function AISymptomAnalyzer({
    symptoms,
    vitals,
    patientHistory,
    onSelectDiagnosis,
    onSuggestLabs,
}: AISymptomAnalyzerProps) {
    const { preferences } = useAIPreferences();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [result, setResult] = useState<AIDiagnosisResponse | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevSymptomsRef = useRef('');

    const analyse = useCallback(async () => {
        if (!symptoms.trim()) return;
        setLoading(true);
        setError(false);
        try {
            const res = await aiService.getDiagnosis({
                symptoms,
                vitals: vitals as Record<string, unknown> | undefined,
                patientHistory,
            });
            setResult((res.data as any)?.data ?? res.data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [symptoms, vitals, patientHistory]);

    // Auto-analysis (debounced)
    useEffect(() => {
        if (!preferences.enableAutoSymptomAnalysis) return;
        if (symptoms === prevSymptomsRef.current) return;
        prevSymptomsRef.current = symptoms;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            analyse();
        }, AI_DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [symptoms, preferences.enableAutoSymptomAnalysis, analyse]);

    const handleSelectDiagnosis = (icdCode: string, description: string) => {
        onSelectDiagnosis?.(icdCode, description);
    };

    const handleSuggestLab = (labId: string) => {
        onSuggestLabs?.([labId]);
    };

    const handleSuggestAllLabs = () => {
        if (!result?.suggestedLabs) return;
        onSuggestLabs?.(result.suggestedLabs.map((l) => l.id));
    };

    // Filter by confidence threshold
    const allDiagnoses = result?.diagnoses ?? [];
    const visibleDiagnoses = allDiagnoses.slice(0, 5); // max 5

    const noCitations =
        result !== null &&
        (result.citations?.length ?? 0) === 0 &&
        allDiagnoses.every((d) => (d.citations?.length ?? 0) === 0);

    return (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200 dark:border-violet-800 border-l-4 border-l-violet-600 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-violet-100/60 dark:bg-violet-900/30">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                        AI Phân tích Triệu chứng
                    </span>
                    {loading && <AIStatusIndicator status="loading" />}
                </div>
                <button
                    onClick={analyse}
                    disabled={loading || !symptoms.trim()}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#3C81C6] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                >
                    Phân tích triệu chứng
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Error state */}
                {error && (
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AIStatusIndicator status="error" />
                            <span className="text-xs text-[#687582] dark:text-gray-400">
                                Vui lòng thử lại hoặc nhập triệu chứng bổ sung.
                            </span>
                        </div>
                        <button
                            onClick={analyse}
                            className="text-xs font-semibold px-2.5 py-1 rounded bg-[#3C81C6] text-white hover:bg-blue-700 transition-colors shrink-0"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Diagnoses list */}
                {visibleDiagnoses.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wide">
                            Chẩn đoán phân biệt ({visibleDiagnoses.length} kết quả)
                        </p>
                        {visibleDiagnoses.map((dx, i) => (
                            <DiagnosisCard
                                key={dx.id}
                                diagnosis={dx}
                                rank={i + 1}
                                onSelect={handleSelectDiagnosis}
                                belowThreshold={dx.confidence < preferences.confidenceThreshold}
                            />
                        ))}
                    </div>
                )}

                {/* Suggested labs */}
                {result?.suggestedLabs && result.suggestedLabs.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wide">
                                Xét nghiệm đề xuất
                            </p>
                            <button
                                onClick={handleSuggestAllLabs}
                                className="text-xs text-[#3C81C6] dark:text-blue-400 hover:underline"
                            >
                                Thêm tất cả
                            </button>
                        </div>
                        <div className="space-y-1.5">
                            {result.suggestedLabs.map((lab) => (
                                <LabRow key={lab.id} lab={lab} onSuggest={handleSuggestLab} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state (after analysis returns nothing) */}
                {result !== null && visibleDiagnoses.length === 0 && !error && (
                    <p className="text-xs text-center text-[#687582] dark:text-gray-400 py-2">
                        Không đủ dữ liệu để gợi ý chẩn đoán. Vui lòng bổ sung triệu chứng.
                    </p>
                )}

                {/* Citations */}
                {result !== null && (
                    noCitations ? (
                        <div className="text-xs text-[#687582] dark:text-gray-400 italic px-1">
                            Không tìm thấy guideline phù hợp
                        </div>
                    ) : (
                        result.citations.length > 0 && (
                            <AICitationBlock citations={result.citations} />
                        )
                    )
                )}

                {/* Hint when auto-analysis is disabled */}
                {!preferences.enableAutoSymptomAnalysis && !result && !loading && (
                    <p className="text-xs text-[#687582] dark:text-gray-400 italic text-center py-1">
                        Tự động phân tích đang tắt. Nhấn &quot;Phân tích triệu chứng&quot; để bắt đầu.
                    </p>
                )}
            </div>
        </div>
    );
}
