"use client";
import { useState } from "react";

export const INVOICE_STATUS: Record<string, { label: string; cls: string; icon: string }> = {
    UNPAID: { label: "Chưa thu", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: "pending" },
    PARTIALLY_PAID: { label: "Thu một phần", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: "hourglass_empty" },
    PAID: { label: "Đã thu đủ", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "check_circle" },
    OVERPAID: { label: "Thu thừa", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", icon: "warning" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: "cancel" },
    DRAFT: { label: "Nháp", cls: "bg-slate-200 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400", icon: "edit_note" },
    PENDING: { label: "Chờ thu", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: "schedule" },
};

export const fmtDate = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };
export const fmtDateTime = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleString("vi-VN"); } catch { return v; } };
export const fmtMoney = (v?: string | number) => {
    if (v == null) return "—";
    const n = Number(v);
    return isNaN(n) ? "—" : `${Math.round(n).toLocaleString("vi-VN")}đ`;
};

export function StatusBadge({ status }: { status: string }) {
    const m = INVOICE_STATUS[status] ?? { label: status, cls: "bg-gray-100 text-gray-700", icon: "info" };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>
            <span className="material-symbols-outlined text-[14px]">{m.icon}</span>{m.label}
        </span>
    );
}

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
                <div key={t.id} className={`${colors[t.type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium`}>
                    <span className="material-symbols-outlined text-[18px]">{icons[t.type]}</span>{t.message}
                </div>
            ))}
        </div>
    );
}

export function ConfirmDialog({ open, title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading, children }: {
    open: boolean; title: string; message: string; confirmLabel: string; confirmColor?: string;
    onConfirm: () => void; onCancel: () => void; loading?: boolean; children?: React.ReactNode;
}) {
    if (!open) return null;
    const btnCls = confirmColor === "red" ? "bg-rose-600 hover:bg-rose-700 text-white"
        : confirmColor === "green" ? "bg-emerald-600 hover:bg-emerald-700 text-white"
        : "bg-[#3C81C6] hover:bg-[#2a66a0] text-white";
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-sm text-[#687582]">{message}</p>
                {children}
                <div className="flex gap-3 pt-2">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Huỷ</button>
                    <button onClick={onConfirm} disabled={loading} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 ${btnCls}`}>
                        {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
    return (<>{Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">{Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" /></td>
        ))}</tr>
    ))}</>);
}
