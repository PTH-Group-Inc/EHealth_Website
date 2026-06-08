'use client';

import { useState } from 'react';
import type { AIAuditEntry, Citation } from '@/types';
import { aiService } from '@/services/aiService';
import { AICitationBlock } from './AICitationBlock';
import { AIStatusIndicator } from './AIStatusIndicator';
import { AIAuditTrail } from './AIAuditTrail';

// ============================================
// Props
// ============================================

interface AIExaminationSummaryProps {
    vitals: Record<string, string>;
    symptoms: string;
    diagnosis: string;
    icdCode: string;
    treatment: string;
    meds: { name: string; dosage: string; frequency: string; duration: string }[];
    auditEntries: AIAuditEntry[];
    onGenerateSummary?: (summary: string) => void;
}

// ============================================
// SOAP section type
// ============================================

interface SOAPNote {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    rawText: string;
    citations: Citation[];
}

// ============================================
// Parse SOAP from raw AI text
// Helper: best-effort parser, falls back to raw text sections
// ============================================

function parseSOAP(rawText: string, citations: Citation[]): SOAPNote {
    const lines = rawText.split('\n');

    const sections: Record<string, string[]> = {
        subjective: [],
        objective: [],
        assessment: [],
        plan: [],
    };

    // Section label patterns (Vietnamese + English)
    const sectionPatterns: [keyof typeof sections, RegExp][] = [
        ['subjective', /^(S|Subjective|Chủ quan|Bệnh sử|Lý do khám)\s*[:\-]/i],
        ['objective', /^(O|Objective|Khách quan|Khám|Sinh hiệu)\s*[:\-]/i],
        ['assessment', /^(A|Assessment|Đánh giá|Chẩn đoán)\s*[:\-]/i],
        ['plan', /^(P|Plan|Kế hoạch|Điều trị)\s*[:\-]/i],
    ];

    let currentSection: keyof typeof sections | null = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let matched = false;
        for (const [section, pattern] of sectionPatterns) {
            if (pattern.test(trimmed)) {
                currentSection = section;
                // Include text after the colon on the same line
                const afterColon = trimmed.replace(pattern, '').replace(/^[\s:\-]+/, '');
                if (afterColon) sections[section].push(afterColon);
                matched = true;
                break;
            }
        }

        if (!matched && currentSection) {
            sections[currentSection].push(trimmed);
        }
    }

    // Fallback: if parsing failed, dump raw text into assessment
    const hasContent = Object.values(sections).some((v) => v.length > 0);
    if (!hasContent) {
        sections.assessment.push(rawText);
    }

    return {
        subjective: sections.subjective.join('\n'),
        objective: sections.objective.join('\n'),
        assessment: sections.assessment.join('\n'),
        plan: sections.plan.join('\n'),
        rawText,
        citations,
    };
}

// ============================================
// SOAP display section
// ============================================

const SOAP_CONFIG = {
    subjective: {
        letter: 'S',
        label: 'Chủ quan (Subjective)',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        letterBg: 'bg-[#3C81C6] text-white',
        heading: 'text-blue-800 dark:text-blue-200',
    },
    objective: {
        letter: 'O',
        label: 'Khách quan (Objective)',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        letterBg: 'bg-emerald-600 text-white',
        heading: 'text-emerald-800 dark:text-emerald-200',
    },
    assessment: {
        letter: 'A',
        label: 'Đánh giá (Assessment)',
        bg: 'bg-violet-50 dark:bg-violet-950/30',
        border: 'border-violet-200 dark:border-violet-800',
        letterBg: 'bg-violet-600 text-white',
        heading: 'text-violet-800 dark:text-violet-200',
    },
    plan: {
        letter: 'P',
        label: 'Kế hoạch (Plan)',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        letterBg: 'bg-amber-500 text-white',
        heading: 'text-amber-800 dark:text-amber-200',
    },
} as const;

function SOAPSection({
    sectionKey,
    content,
    placeholder,
}: {
    sectionKey: keyof typeof SOAP_CONFIG;
    content: string;
    placeholder: string;
}) {
    const cfg = SOAP_CONFIG[sectionKey];
    const isEmpty = !content.trim();

    return (
        <div className={`rounded-lg border ${cfg.bg} ${cfg.border} overflow-hidden`}>
            <div className="flex items-center gap-2 px-3 py-2">
                <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${cfg.letterBg}`}
                >
                    {cfg.letter}
                </span>
                <span className={`text-xs font-semibold ${cfg.heading}`}>{cfg.label}</span>
            </div>
            <div className="px-3 pb-3">
                {isEmpty ? (
                    <p className="text-xs text-[#687582] dark:text-gray-500 italic">{placeholder}</p>
                ) : (
                    <p className="text-xs text-[#121417] dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {content}
                    </p>
                )}
            </div>
        </div>
    );
}

// ============================================
// Main component
// ============================================

export function AIExaminationSummary({
    vitals,
    symptoms,
    diagnosis,
    icdCode,
    treatment,
    meds,
    auditEntries,
    onGenerateSummary,
}: AIExaminationSummaryProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [soap, setSoap] = useState<SOAPNote | null>(null);
    const [used, setUsed] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setError(false);
        setUsed(false);

        try {
            const res = await aiService.analyze({
                type: 'session_notes',
                vitals,
                symptoms,
                diagnosis,
                icdCode,
                treatment,
                medications: meds,
                format: 'SOAP',
            });

            // The analyze endpoint returns a generic response; try to extract text + citations
            const responseData = (res.data as any)?.data ?? res.data;
            const data = responseData as {
                message?: string;
                content?: string;
                text?: string;
                citations?: Citation[];
                suggestions?: { content?: string; citations?: Citation[] }[];
            };

            const rawText =
                data.message ??
                data.content ??
                data.text ??
                data.suggestions?.[0]?.content ??
                '';

            const citations: Citation[] =
                data.citations ??
                data.suggestions?.[0]?.citations ??
                [];

            const parsed = parseSOAP(rawText, citations);
            setSoap(parsed);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleUseSummary = () => {
        if (!soap) return;
        onGenerateSummary?.(soap.rawText);
        setUsed(true);
    };

    const noCitations = soap !== null && soap.citations.length === 0;

    return (
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/40 dark:to-gray-950/20 border border-slate-200 dark:border-slate-700 border-l-4 border-l-slate-600 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        AI Tóm tắt Phiên khám (SOAP)
                    </span>
                    {loading && <AIStatusIndicator status="loading" />}
                </div>

                <div className="flex items-center gap-2">
                    {soap && !used && (
                        <button
                            onClick={handleUseSummary}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                            Dùng ✓
                        </button>
                    )}
                    {used && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Đã áp dụng ✓
                        </span>
                    )}
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#3C81C6] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                    >
                        {soap ? 'Tạo lại' : 'Tạo tóm tắt AI'}
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Context preview */}
                {!soap && !loading && !error && (
                    <div className="space-y-2">
                        <p className="text-xs text-[#687582] dark:text-gray-400">
                            AI sẽ tổng hợp dữ liệu phiên khám hiện tại thành ghi chú SOAP chuẩn mực.
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="px-2.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <span className="font-semibold text-[#687582] dark:text-gray-400">Chẩn đoán: </span>
                                <span className="text-[#121417] dark:text-gray-200">
                                    {diagnosis || '—'} {icdCode ? `(${icdCode})` : ''}
                                </span>
                            </div>
                            <div className="px-2.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <span className="font-semibold text-[#687582] dark:text-gray-400">Số thuốc: </span>
                                <span className="text-[#121417] dark:text-gray-200">{meds.length}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="space-y-2 animate-pulse">
                        {['S', 'O', 'A', 'P'].map((l) => (
                            <div key={l} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        ))}
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AIStatusIndicator status="error" />
                            <span className="text-xs text-[#687582] dark:text-gray-400">
                                Không thể tạo tóm tắt. Vui lòng thử lại.
                            </span>
                        </div>
                        <button
                            onClick={handleGenerate}
                            className="text-xs font-semibold px-2.5 py-1 rounded bg-[#3C81C6] text-white hover:bg-blue-700 transition-colors shrink-0"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* SOAP sections */}
                {soap && !loading && (
                    <>
                        <div className="space-y-2">
                            <SOAPSection
                                sectionKey="subjective"
                                content={soap.subjective}
                                placeholder="Không có dữ liệu chủ quan"
                            />
                            <SOAPSection
                                sectionKey="objective"
                                content={soap.objective}
                                placeholder="Không có dữ liệu khách quan"
                            />
                            <SOAPSection
                                sectionKey="assessment"
                                content={soap.assessment}
                                placeholder="Không có đánh giá"
                            />
                            <SOAPSection
                                sectionKey="plan"
                                content={soap.plan}
                                placeholder="Không có kế hoạch điều trị"
                            />
                        </div>

                        {/* "Dùng" button (repeated at bottom for convenience) */}
                        {!used && (
                            <button
                                onClick={handleUseSummary}
                                className="w-full py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            >
                                Dùng tóm tắt này vào ghi chú bác sĩ
                            </button>
                        )}

                        {/* Citations */}
                        {noCitations ? (
                            <p className="text-xs text-[#687582] dark:text-gray-400 italic">
                                Không tìm thấy guideline phù hợp
                            </p>
                        ) : (
                            soap.citations.length > 0 && (
                                <AICitationBlock citations={soap.citations} />
                            )
                        )}
                    </>
                )}

                {/* Audit trail divider */}
                {auditEntries.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wide mb-3">
                            Nhật ký tương tác AI — Phiên khám này
                        </p>
                        <AIAuditTrail entries={auditEntries} />
                    </div>
                )}
            </div>

            <div className="px-4 pb-2 text-[10px] text-[#687582] dark:text-gray-500">
                Ghi chú SOAP được tạo bởi AI dựa trên dữ liệu phiên khám. Bác sĩ chịu trách nhiệm kiểm tra và xác nhận trước khi lưu hồ sơ.
            </div>
        </div>
    );
}
