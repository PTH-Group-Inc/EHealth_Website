"use client";

/**
 * InvoiceCard — card hoá đơn cho patient billing + admin invoices.
 */

const STATUS_STYLE: Record<string, { badge: string; label: string; icon: string }> = {
    pending: { badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", label: "Chờ thanh toán", icon: "pending_actions" },
    overdue: { badge: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300", label: "Quá hạn", icon: "schedule" },
    paid: { badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", label: "Đã thanh toán", icon: "check_circle" },
    refunded: { badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", label: "Đã huỷ/hoàn", icon: "undo" },
    partial: { badge: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", label: "Thanh toán một phần", icon: "payments" },
};

const formatVND = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

export interface InvoiceCardProps {
    code?: string;
    patientName?: string;
    date?: string;
    status?: string;
    subtotal?: number;
    insuranceCovered?: number;
    discount?: number;
    total: number;
    paidAmount?: number;
    doctorName?: string;
    department?: string;
    onPay?: () => void;
    onDetail?: () => void;
    onDownload?: () => void;
}

export function InvoiceCard({
    code,
    patientName,
    date,
    status = "pending",
    insuranceCovered,
    discount,
    total,
    paidAmount,
    doctorName,
    department,
    onPay,
    onDetail,
    onDownload,
}: InvoiceCardProps) {
    const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
    const outstanding = total - (paidAmount ?? 0);

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-900/10 flex items-center justify-center text-violet-600 flex-shrink-0">
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>receipt_long</span>
                        </div>
                        <div className="min-w-0">
                            {code && <p className="text-[11px] font-mono text-[#687582] dark:text-gray-500">#{code}</p>}
                            <h3 className="font-semibold text-sm text-[#121417] dark:text-white truncate">
                                {patientName || date || "Hoá đơn"}
                            </h3>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${s.badge} flex-shrink-0`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{s.icon}</span>
                        {s.label}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#687582] dark:text-gray-400 mb-3">
                    {doctorName && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: "14px" }}>stethoscope</span>
                            <span className="truncate">{doctorName}</span>
                        </div>
                    )}
                    {department && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: "14px" }}>local_hospital</span>
                            <span className="truncate">{department}</span>
                        </div>
                    )}
                    {date && (
                        <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: "14px" }}>event</span>
                            <span className="truncate">{date}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1.5 py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-3">
                    {insuranceCovered !== undefined && insuranceCovered > 0 && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-emerald-600 inline-flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>health_and_safety</span>
                                BHYT chi trả
                            </span>
                            <span className="font-medium text-emerald-600">−{formatVND(insuranceCovered)}</span>
                        </div>
                    )}
                    {discount !== undefined && discount > 0 && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-violet-600">Chiết khấu</span>
                            <span className="font-medium text-violet-600">−{formatVND(discount)}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-[#687582] dark:text-gray-400">
                            {status === "paid" ? "Đã thanh toán" : "Phải trả"}
                        </span>
                        <span className="text-base font-extrabold text-[#121417] dark:text-white">
                            {formatVND(status === "paid" && paidAmount !== undefined ? paidAmount : outstanding)}
                        </span>
                    </div>
                </div>

                {(onPay || onDetail || onDownload) && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50 dark:border-gray-800">
                        {onPay && (status === "pending" || status === "overdue" || status === "partial") && (
                            <button onClick={onPay}
                                className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] hover:from-[#2b6cb0] rounded-lg transition-colors inline-flex items-center justify-center gap-1 shadow-sm shadow-blue-500/20">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>qr_code_2</span>
                                Thanh toán
                            </button>
                        )}
                        {onDetail && (
                            <button onClick={onDetail}
                                className="px-3 py-1.5 text-xs font-medium text-[#3C81C6] hover:bg-[#3C81C6]/[0.08] border border-[#3C81C6]/20 rounded-lg transition-colors">
                                Chi tiết
                            </button>
                        )}
                        {onDownload && status === "paid" && (
                            <button onClick={onDownload}
                                className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Tải PDF">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>download</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InvoiceCard;
