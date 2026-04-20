"use client";

/**
 * MedicineCard — card thuốc cho admin medicines list + pharmacist dispensing.
 * Hiển thị tên, đơn vị, tồn kho, hạn dùng, giá, cảnh báo.
 */

import { formatDate } from "@/utils/formatters";

export interface MedicineCardProps {
    code?: string;
    name: string;
    unit?: string;
    dosageForm?: string;       // viên nén, ống, ml, ...
    manufacturer?: string;
    stock?: number;
    minStock?: number;
    expiryDate?: string;       // ISO
    price?: number;
    imageUrl?: string;
    status?: "active" | "inactive" | "expiring" | "out_of_stock";
    onEdit?: () => void;
    onView?: () => void;
    onImport?: () => void;
}

function daysUntil(dateStr?: string): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    return Math.floor((d.getTime() - now.getTime()) / 86_400_000);
}

export function MedicineCard({
    code,
    name,
    unit,
    dosageForm,
    manufacturer,
    stock,
    minStock,
    expiryDate,
    price,
    imageUrl,
    status = "active",
    onEdit,
    onView,
    onImport,
}: MedicineCardProps) {
    const daysLeft = daysUntil(expiryDate);
    const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
    const isExpired = daysLeft !== null && daysLeft < 0;
    const stockRatio = stock !== undefined && minStock && minStock > 0 ? stock / minStock : null;
    const isLowStock = stockRatio !== null && stockRatio < 1;
    const isCriticalStock = stockRatio !== null && stockRatio < 0.3;

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md hover:border-[#3C81C6]/40 transition-all group overflow-hidden">
            {(isExpired || isExpiringSoon || isCriticalStock) && (
                <div className={`${isExpired || isCriticalStock
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : "bg-gradient-to-r from-amber-500 to-orange-500"
                    } text-white px-4 py-1.5 flex items-center gap-2 text-xs font-semibold`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                        {isExpired ? "dangerous" : "warning"}
                    </span>
                    {isExpired
                        ? `Đã hết hạn ${Math.abs(daysLeft ?? 0)} ngày`
                        : isExpiringSoon
                            ? `Sắp hết hạn (còn ${daysLeft} ngày)`
                            : "Tồn kho nguy hiểm — cần nhập gấp"}
                </div>
            )}

            <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt={name}
                            className="w-14 h-14 rounded-xl object-cover border border-gray-100 dark:border-gray-800 flex-shrink-0" />
                    ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <span className="material-symbols-outlined" style={{ fontSize: "26px" }}>pill</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        {code && <p className="text-[10px] font-mono text-[#687582] dark:text-gray-500 uppercase">#{code}</p>}
                        <h3 className="font-semibold text-sm text-[#121417] dark:text-white truncate">{name}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {dosageForm && <span className="text-[10px] font-medium text-[#687582] bg-gray-50 dark:bg-gray-800 dark:text-gray-400 px-1.5 py-0.5 rounded">{dosageForm}</span>}
                            {unit && <span className="text-[10px] font-medium text-[#687582] bg-gray-50 dark:bg-gray-800 dark:text-gray-400 px-1.5 py-0.5 rounded">{unit}</span>}
                        </div>
                    </div>
                    {status === "inactive" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Ngừng</span>
                    )}
                </div>

                {manufacturer && (
                    <p className="text-xs text-[#687582] dark:text-gray-400 mb-2 truncate">
                        <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: "12px" }}>factory</span>
                        {manufacturer}
                    </p>
                )}

                {stock !== undefined && (
                    <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-[#687582] dark:text-gray-400">Tồn kho</span>
                            <span className={`font-bold ${isCriticalStock ? "text-red-500" : isLowStock ? "text-amber-500" : "text-emerald-600"}`}>
                                {stock}{unit ? ` ${unit}` : ""}{minStock ? ` / ${minStock}` : ""}
                            </span>
                        </div>
                        {minStock ? (
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${isCriticalStock ? "bg-red-500" : isLowStock ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min((stockRatio ?? 1) * 100, 100)}%` }} />
                            </div>
                        ) : null}
                    </div>
                )}

                <div className="flex items-center justify-between gap-2 text-xs mt-3">
                    {expiryDate && (
                        <div className={`inline-flex items-center gap-1 ${isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-600" : "text-[#687582] dark:text-gray-400"}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event</span>
                            <span>HSD: {formatDate(expiryDate)}</span>
                        </div>
                    )}
                    {price !== undefined && (
                        <span className="font-bold text-[#121417] dark:text-white">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)}
                        </span>
                    )}
                </div>

                {(onEdit || onView || onImport) && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                        {onView && (
                            <button onClick={onView}
                                className="flex-1 px-2.5 py-1.5 text-xs font-medium text-[#3C81C6] hover:bg-[#3C81C6]/[0.08] border border-[#3C81C6]/20 rounded-lg transition-colors">
                                Chi tiết
                            </button>
                        )}
                        {onImport && (isLowStock || isExpiringSoon) && (
                            <button onClick={onImport}
                                className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#3C81C6] hover:bg-[#2b6cb0] rounded-lg transition-colors inline-flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>input</span>
                                Nhập
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={onEdit}
                                className="px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg transition-colors">
                                Sửa
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MedicineCard;
