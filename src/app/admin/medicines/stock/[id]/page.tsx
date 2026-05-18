"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { inventoryService } from "@/services/inventoryService";

interface BatchDetail {
    id: string;
    drugName: string;
    drugCode: string;
    category: string;
    lotNumber: string;
    expiryDate: string;
    currentStock: number;
    minStock: number;
    unit: string;
    warehouseName: string;
    supplier: string;
    importDate: string;
    unitPrice: number;
}

interface StockHistory {
    id: string;
    date: string;
    type: "import" | "export";
    quantity: number;
    refCode: string;
    note: string;
    user: string;
}

const formatDate = (value: unknown): string => {
    const raw = String(value ?? "");
    return raw.includes("T") ? raw.split("T")[0] : raw;
};

export default function StockBatchDetailPage() {
    const router = useRouter();
    const params = useParams();
    const batchId = params.id as string;

    const [batch, setBatch] = useState<BatchDetail | null>(null);
    const [history] = useState<StockHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        inventoryService.getDetail(batchId)
            .then((res: any) => {
                if (!res) {
                    setBatch(null);
                    return;
                }

                setBatch({
                    id: res.pharmacy_inventory_id ?? res.id ?? batchId,
                    drugName: res.brand_name ?? res.drug_name ?? "-",
                    drugCode: res.drug_code ?? "-",
                    category: res.category_name ?? res.category ?? "-",
                    lotNumber: res.batch_number ?? res.lot_number ?? "-",
                    expiryDate: formatDate(res.expiry_date),
                    currentStock: Number(res.stock_quantity ?? res.quantity ?? 0),
                    minStock: Number(res.low_stock_threshold ?? res.min_quantity ?? 0),
                    unit: res.dispensing_unit ?? res.unit ?? "Đơn vị",
                    warehouseName: res.warehouse_name ?? res.warehouse?.name ?? "-",
                    supplier: res.supplier_name ?? res.supplier?.name ?? "-",
                    importDate: formatDate(res.created_at ?? res.import_date),
                    unitPrice: Number(res.unit_price ?? 0),
                });
            })
            .catch(() => {
                setBatch(null);
            })
            .finally(() => setLoading(false));
    }, [batchId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3C81C6] border-t-transparent" />
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined mb-4 text-5xl text-gray-300">inventory_2</span>
                <p className="mb-4 text-lg text-gray-500">Không tìm thấy thông tin tồn kho</p>
                <button onClick={() => router.back()} className="rounded-xl bg-[#3C81C6] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2a6da8]">
                    Quay lại
                </button>
            </div>
        );
    }

    const stockPercent = batch.minStock > 0 ? Math.min((batch.currentStock / batch.minStock) * 100, 100) : 100;
    const stockLevel = batch.currentStock === 0 ? "OUT" : batch.currentStock < batch.minStock ? "LOW" : batch.currentStock > batch.minStock * 3 ? "HIGH" : "NORMAL";
    const stockLevelMap = {
        HIGH: { label: "Đầy đủ", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", bar: "bg-blue-500" },
        NORMAL: { label: "Bình thường", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", bar: "bg-emerald-500" },
        LOW: { label: "Sắp hết", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", bar: "bg-amber-500" },
        OUT: { label: "Hết hàng", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", bar: "bg-red-500" },
    } as const;
    const sl = stockLevelMap[stockLevel];

    const expiryTime = new Date(batch.expiryDate).getTime();
    const daysToExpiry = Number.isFinite(expiryTime)
        ? Math.ceil((expiryTime - Date.now()) / (1000 * 60 * 60 * 24))
        : Number.POSITIVE_INFINITY;
    const expiryWarning = daysToExpiry <= 90;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/medicines" className="transition-colors hover:text-[#3C81C6]">Danh mục thuốc</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <Link href="/admin/medicines/stock" className="transition-colors hover:text-[#3C81C6]">Tồn kho</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="font-medium text-[#121417] dark:text-white">{batch.drugName}</span>
                </div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#1e242b] dark:hover:bg-gray-800"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Quay lại
                </button>
            </div>

            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="mb-2 flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">{batch.drugName}</h1>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${sl.bg} ${sl.color}`}>
                            {sl.label}
                        </span>
                    </div>
                    <p className="text-sm text-[#687582] dark:text-gray-400">Mã: {batch.drugCode} | Lô: {batch.lotNumber}</p>
                </div>
                <button
                    onClick={() => router.push("/admin/medicines/import")}
                    className="flex items-center gap-2 rounded-xl bg-[#3C81C6] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#3C81C6]/20 transition-colors hover:bg-[#2a6da8]"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Nhập thêm
                </button>
            </div>

            <div className="rounded-xl border border-[#dde0e4] bg-white p-5 dark:border-[#2d353e] dark:bg-[#1e242b]">
                <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-[#121417] dark:text-white">Mức tồn kho</p>
                    <p className={`text-sm font-bold ${sl.color}`}>{batch.currentStock}/{Math.max(batch.minStock, 0)} {batch.unit}</p>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className={`h-full rounded-full ${sl.bar}`} style={{ width: `${stockPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-[#687582]">Mức tối thiểu: {batch.minStock} {batch.unit}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-xl border border-[#dde0e4] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">Nhóm thuốc</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{batch.category}</p>
                </div>
                <div className="rounded-xl border border-[#dde0e4] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">Nhà cung cấp</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{batch.supplier}</p>
                </div>
                <div className="rounded-xl border border-[#dde0e4] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">Kho lưu trữ</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{batch.warehouseName}</p>
                </div>
                <div className="rounded-xl border border-[#dde0e4] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">Giá nhập</p>
                    <p className="text-sm font-bold text-[#3C81C6]">{(batch.unitPrice ?? 0).toLocaleString("vi-VN")}d/{batch.unit}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 rounded-xl border border-[#dde0e4] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="rounded-xl bg-blue-50 p-2.5 dark:bg-blue-900/20">
                        <span className="material-symbols-outlined text-blue-600">calendar_month</span>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-[#687582] dark:text-gray-400">Ngày nhập kho</p>
                        <p className="text-sm font-bold text-[#121417] dark:text-white">{batch.importDate || "-"}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-4 rounded-xl border p-4 ${expiryWarning ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20" : "border-[#dde0e4] bg-white dark:border-[#2d353e] dark:bg-[#1e242b]"}`}>
                    <div className={`rounded-xl p-2.5 ${expiryWarning ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-50 dark:bg-amber-900/20"}`}>
                        <span className={`material-symbols-outlined ${expiryWarning ? "text-red-600" : "text-amber-600"}`}>event_busy</span>
                    </div>
                    <div>
                        <p className={`text-xs font-medium ${expiryWarning ? "text-red-600" : "text-[#687582] dark:text-gray-400"}`}>Hạn sử dụng</p>
                        <p className={`text-sm font-bold ${expiryWarning ? "text-red-700 dark:text-red-400" : "text-[#121417] dark:text-white"}`}>
                            {batch.expiryDate || "-"}
                            {Number.isFinite(daysToExpiry) && expiryWarning && (
                                <span className="ml-2 text-xs font-normal">
                                    ({daysToExpiry > 0 ? `còn ${daysToExpiry} ngày` : "đã hết hạn"})
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                <div className="border-b border-[#dde0e4] p-4 dark:border-[#2d353e]">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-[#121417] dark:text-white">
                        <span className="material-symbols-outlined text-[#3C81C6]">history</span>
                        Lịch sử nhập xuất
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-[#dde0e4] bg-gray-50/50 dark:border-[#2d353e] dark:bg-gray-800/50">
                            <tr>
                                <th className="px-5 py-3 text-xs font-semibold uppercase text-[#687582]">Ngày</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase text-[#687582]">Loại</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-[#687582]">Số lượng</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase text-[#687582]">Mã phiếu</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase text-[#687582]">Ghi chú</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase text-[#687582]">Người thực hiện</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-[#687582] dark:text-gray-400">
                                        Chưa có lịch sử nhập xuất cho lô thuốc này
                                    </td>
                                </tr>
                            ) : history.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => router.push(item.type === "import" ? `/admin/medicines/import/${item.id}` : `/admin/medicines/export/${item.id}`)}
                                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    <td className="px-5 py-3 text-sm text-[#687582]">{item.date}</td>
                                    <td className="px-5 py-3 text-sm text-[#121417] dark:text-white">{item.type === "import" ? "Nhập" : "Xuất"}</td>
                                    <td className="px-5 py-3 text-right text-sm font-bold text-[#121417] dark:text-white">{(item.quantity ?? 0).toLocaleString("vi-VN")}</td>
                                    <td className="px-5 py-3 text-sm font-medium text-[#3C81C6]">{item.refCode}</td>
                                    <td className="px-5 py-3 text-sm text-[#687582]">{item.note}</td>
                                    <td className="px-5 py-3 text-sm text-[#687582]">{item.user}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
