"use client";

import { ReactNode, useCallback, useMemo, useState } from "react";

export interface MultiStepFormStep {
    key: string;
    title: string;
    description?: string;
    icon?: string;
    optional?: boolean;
    validate?: () => boolean | string;
    content: ReactNode;
}

export interface MultiStepFormProps {
    steps: MultiStepFormStep[];
    initialStep?: number;
    onComplete?: () => void | Promise<void>;
    onCancel?: () => void;
    submitLabel?: string;
    cancelLabel?: string;
    nextLabel?: string;
    backLabel?: string;
    submitting?: boolean;
    showStepper?: boolean;
    allowSkip?: boolean;
}

export function MultiStepForm({
    steps,
    initialStep = 0,
    onComplete,
    onCancel,
    submitLabel = "Hoàn tất",
    cancelLabel = "Huỷ",
    nextLabel = "Tiếp theo",
    backLabel = "Quay lại",
    submitting = false,
    showStepper = true,
    allowSkip = false,
}: MultiStepFormProps) {
    const [current, setCurrent] = useState(initialStep);
    const [error, setError] = useState<string | null>(null);
    const [visited, setVisited] = useState<Set<number>>(() => new Set([initialStep]));

    const isLast = current === steps.length - 1;
    const step = steps[current];

    const goNext = useCallback(async () => {
        setError(null);
        const result = step?.validate?.();
        if (result === false) {
            setError("Vui lòng kiểm tra lại thông tin trước khi tiếp tục.");
            return;
        }
        if (typeof result === "string" && result) {
            setError(result);
            return;
        }
        if (isLast) {
            await onComplete?.();
            return;
        }
        const next = current + 1;
        setCurrent(next);
        setVisited((prev) => new Set(prev).add(next));
    }, [current, isLast, onComplete, step]);

    const goBack = useCallback(() => {
        setError(null);
        if (current > 0) setCurrent(current - 1);
    }, [current]);

    const goTo = useCallback((idx: number) => {
        if (idx === current) return;
        if (!allowSkip && !visited.has(idx) && idx > current) return;
        setError(null);
        setCurrent(idx);
        setVisited((prev) => new Set(prev).add(idx));
    }, [allowSkip, current, visited]);

    const progressPct = useMemo(() => Math.round(((current + 1) / steps.length) * 100), [current, steps.length]);

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            {showStepper && (
                <div className="px-5 py-4 border-b border-[#dde0e4] dark:border-[#2d353e] bg-gradient-to-r from-[#3C81C6]/5 to-[#1d4ed8]/5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs text-[#687582] dark:text-gray-500 mb-0.5">
                                Bước {current + 1} / {steps.length}
                            </p>
                            <h3 className="text-base font-semibold text-[#121417] dark:text-white">
                                {step?.title}
                            </h3>
                            {step?.description && (
                                <p className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">
                                    {step.description}
                                </p>
                            )}
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#3C81C6]">{progressPct}%</span>
                    </div>

                    <div className="hidden md:flex items-center gap-2 mb-3">
                        {steps.map((s, i) => {
                            const reached = visited.has(i) || i < current;
                            const isCurrent = i === current;
                            const clickable = allowSkip || reached;
                            return (
                                <div key={s.key} className="flex-1 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => goTo(i)}
                                        disabled={!clickable}
                                        className={`flex items-center gap-2 transition-all ${clickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                            isCurrent
                                                ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] border-[#3C81C6] text-white shadow-sm scale-110"
                                                : reached
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "bg-white dark:bg-[#13191f] border-[#dde0e4] dark:border-[#2d353e] text-[#687582] dark:text-gray-500"
                                        }`}>
                                            {reached && !isCurrent ? (
                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check</span>
                                            ) : s.icon ? (
                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{s.icon}</span>
                                            ) : (
                                                i + 1
                                            )}
                                        </div>
                                        <span className={`text-xs font-medium hidden lg:inline whitespace-nowrap ${
                                            isCurrent ? "text-[#3C81C6]" : reached ? "text-[#121417] dark:text-white" : "text-[#687582] dark:text-gray-500"
                                        }`}>
                                            {s.title}
                                            {s.optional && <span className="text-[10px] text-gray-400 ml-1">(tuỳ chọn)</span>}
                                        </span>
                                    </button>
                                    {i < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 ${reached && i < current ? "bg-emerald-500" : "bg-[#dde0e4] dark:bg-[#2d353e]"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="md:hidden h-1.5 rounded-full bg-[#dde0e4] dark:bg-[#2d353e] overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="p-5">
                {step?.content}
                {error && (
                    <div className="mt-4 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
                        <span className="material-symbols-outlined text-red-600 dark:text-red-400" style={{ fontSize: "18px" }}>error</span>
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}
            </div>

            <div className="px-5 py-3 border-t border-[#dde0e4] dark:border-[#2d353e] bg-[#f8f9fa] dark:bg-[#13191f] flex items-center justify-between gap-2">
                <div>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={submitting}
                            className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {current > 0 && (
                        <button
                            type="button"
                            onClick={goBack}
                            disabled={submitting}
                            className="px-4 py-2 text-sm font-medium text-[#121417] dark:text-white bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl hover:bg-[#f8f9fa] dark:hover:bg-[#161c22] transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                            {backLabel}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={goNext}
                        disabled={submitting}
                        className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1"
                    >
                        {submitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang xử lý...
                            </>
                        ) : isLast ? (
                            <>
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                                {submitLabel}
                            </>
                        ) : (
                            <>
                                {nextLabel}
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MultiStepForm;
