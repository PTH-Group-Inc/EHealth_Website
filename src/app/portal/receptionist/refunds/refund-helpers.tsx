"use client";
import { useState } from "react";

// ─── Constants ───
export const STATUS_META: Record<string, { label: string; cls: string; icon: string }> = {
    PENDING: { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: "hourglass_empty" },
    APPROVED: { label: "Đã duyệt", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: "verified" },
    PROCESSING: { label: "Đang xử lý", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: "sync" },
    COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "task_alt" },
    REJECTED: { label: "Từ chối", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: "cancel" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-slate-200 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400", icon: "block" },
    FAILED: { label: "Thất bại", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: "error" },
};

export const ADJ_STATUS_META: Record<string, { label: string; cls: string; icon: string }> = {
    PENDING: { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: "hourglass_empty" },
    APPROVED: { label: "Đã duyệt", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: "verified" },
    APPLIED: { label: "Đã áp dụng", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "check_circle" },
    REJECTED: { label: "Từ chối", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: "cancel" },
};

export const REASON_LABELS: Record<string, string> = {
    OVERCHARGE: "Thu lố", SERVICE_CANCELLED: "Huỷ dịch vụ", DUPLICATE_PAYMENT: "Thanh toán trùng",
    WRONG_PATIENT: "Sai bệnh nhân", QUALITY_ISSUE: "Vấn đề chất lượng",
    PATIENT_REQUEST: "BN yêu cầu", OTHER: "Khác",
};

export const ADJ_TYPE_LABELS: Record<string, string> = {
    OVERCHARGE: "Thu lố (hoàn lại)", UNDERCHARGE: "Thu thiếu (thu thêm)",
    WRONG_METHOD: "Sai phương thức", DUPLICATE: "Giao dịch trùng", OTHER: "Khác",
};

export const REFUND_TYPE_LABELS: Record<string, string> = { FULL: "Toàn bộ", PARTIAL: "Một phần" };

// ─── Utilities ───
export const fmt = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleString("vi-VN"); } catch { return v; }
};

export const fmtMoney = (v?: string | number) => {
    if (v == null) return "—";
    const num = Number(v);
    if (isNaN(num)) return "—";
    return `${Math.round(num).toLocaleString("vi-VN")}đ`;
};

// ─── Badge Component ───
export function StatusBadge({ status, meta }: { status: string; meta: Record<string, { label: string; cls: string; icon: string }> }) {
    const m = meta[status] ?? { label: status, cls: "bg-gray-100 text-gray-700", icon: "info" };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>
            <span className="material-symbols-outlined text-[14px]">{m.icon}</span>
            {m.label}
        </span>
    );
}

// ─── Confirm Dialog ───
export function ConfirmDialog({ open, title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading, children }: {
    open: boolean; title: string; message: string; confirmLabel: string; confirmColor?: string;
    onConfirm: () => void; onCancel: () => void; loading?: boolean; children?: React.ReactNode;
}) {
    if (!open) return null;
    const btnCls = confirmColor === "red"
        ? "bg-rose-600 hover:bg-rose-700 text-white"
        : confirmColor === "green"
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-[#3C81C6] hover:bg-[#2a66a0] text-white";
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-[#121417] dark:text-white">{title}</h3>
                <p className="text-sm text-[#687582]">{message}</p>
                {children}
                <div className="flex gap-3 pt-2">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Huỷ</button>
                    <button onClick={onConfirm} disabled={loading} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${btnCls}`}>
                        {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Toast Hook ───
export interface Toast { id: number; message: string; type: "success" | "error" | "info"; }

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const add = (message: string, type: Toast["type"] = "success") => {
        const id = Date.now();
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };
    return { toasts, add };
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
    if (!toasts.length) return null;
    const colors = { success: "bg-emerald-600", error: "bg-rose-600", info: "bg-[#3C81C6]" };
    const icons = { success: "check_circle", error: "error", info: "info" };
    return (
        <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 max-w-sm">
            {toasts.map(t => (
                <div key={t.id} className={`${colors[t.type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-right duration-300`}>
                    <span className="material-symbols-outlined text-[18px]">{icons[t.type]}</span>
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// ─── Timeline Component ───
export function TimelineView({ events, loading }: { events: any[]; loading: boolean }) {
    if (loading) return <div className="flex items-center justify-center py-6 text-[#687582]"><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>Đang tải...</div>;
    if (!events.length) return <p className="text-sm text-[#687582] py-4 text-center">Chưa có lịch sử xử lý.</p>;

    const evtMeta: Record<string, { icon: string; color: string }> = {
        CREATED: { icon: "add_circle", color: "text-blue-500" },
        APPROVED: { icon: "verified", color: "text-emerald-500" },
        REJECTED: { icon: "cancel", color: "text-rose-500" },
        PROCESSING: { icon: "sync", color: "text-indigo-500" },
        COMPLETED: { icon: "task_alt", color: "text-emerald-600" },
        CANCELLED: { icon: "block", color: "text-slate-500" },
    };

    return (
        <div className="relative pl-6 space-y-4">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#3C81C6] to-[#e5e7eb] dark:to-[#2d353e]" />
            {events.map((ev: any, i: number) => {
                const m = evtMeta[ev.event] ?? { icon: "info", color: "text-gray-500" };
                return (
                    <div key={i} className="relative flex gap-3">
                        <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white dark:bg-[#1e242b] flex items-center justify-center ring-2 ring-[#e5e7eb] dark:ring-[#2d353e]`}>
                            <span className={`material-symbols-outlined text-[16px] ${m.color}`}>{m.icon}</span>
                        </div>
                        <div className="flex-1 ml-2">
                            <div className="text-sm font-semibold text-[#121417] dark:text-white">{ev.event}</div>
                            <div className="text-xs text-[#687582]">{fmt(ev.timestamp)} {ev.user_name ? `• ${ev.user_name}` : ""}</div>
                            {ev.detail && <div className="text-sm text-[#687582] mt-0.5">{ev.detail}</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Skeleton Row ───
export function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" /></td>
                    ))}
                </tr>
            ))}
        </>
    );
}
