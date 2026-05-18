"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { inventoryService } from "@/services/inventoryService";

interface ImportRecord {
    id: string;
    code: string;
    supplier: string;
    warehouseName: string;
    totalAmount: number;
    totalItems: number;
    date: string;
    status: "draft" | "confirmed" | "received" | "cancelled";
    createdBy: string;
}

const normalizeStockInStatus = (value: unknown): ImportRecord["status"] => {
    const status = String(value ?? "").trim().toUpperCase();

    if (status === "CONFIRMED") {
        return "confirmed";
    }
    if (status === "RECEIVED") {
        return "received";
    }
    if (status === "CANCELLED") {
        return "cancelled";
    }
    return "draft";
};

const formatDate = (value: unknown): string => {
    const raw = String(value ?? "");
    return raw.includes("T") ? raw.split("T")[0] : raw;
};

export default function MedicineImportPage() {
    const router = useRouter();
    const [records, setRecords] = useState<ImportRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        inventoryService.getStockInList({ limit: 100 })
            .then((res: any) => {
                const payload = res?.data;
                const items: any[] = Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload)
                        ? payload
                        : Array.isArray(res?.data?.data)
                            ? res.data.data
                            : [];

                setRecords(items.map((item: any, index: number) => ({
                    id: item.stock_in_order_id ?? item.id ?? String(index + 1),
                    code: item.order_code ?? item.code ?? `NK-${index + 1}`,
                    supplier: item.supplier_name ?? item.supplier?.name ?? "-",
                    warehouseName: item.warehouse_name ?? item.warehouse?.name ?? "-",
                    totalAmount: Number(item.total_amount ?? 0),
                    totalItems: Number(item.total_items ?? 0),
                    date: formatDate(item.created_at ?? item.date),
                    status: normalizeStockInStatus(item.status),
                    createdBy: item.created_by_name ?? "-",
                })));
            })
            .catch(() => {
                setRecords([]);
            });
    }, []);

    const filtered = useMemo(
        () => records.filter((record) => {
            const search = searchQuery.trim().toLowerCase();
            if (!search) {
                return true;
            }

            return (
                record.code.toLowerCase().includes(search) ||
                record.supplier.toLowerCase().includes(search) ||
                record.warehouseName.toLowerCase().includes(search) ||
                record.createdBy.toLowerCase().includes(search)
            );
        }),
        [records, searchQuery]
    );

    const getStatusStyle = (status: ImportRecord["status"]) => {
        switch (status) {
            case "received":
                return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Đã nhập" };
            case "confirmed":
                return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Đã xác nhận" };
            case "cancelled":
                return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Đã hủy" };
            default:
                return { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "Bản nháp" };
        }
    };

    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">Nhập kho</h1>
                    <p className="text-[#687582] dark:text-gray-400">Quản lý phiếu nhập kho thuốc và vật tư y tế</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-[#dde0e4] bg-white p-4 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                        <span className="material-symbols-outlined">inventory</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Tổng phiếu nhập</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{records.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-[#dde0e4] bg-white p-4 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20">
                        <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Đã nhập kho</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{records.filter((record) => record.status === "received").length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-[#dde0e4] bg-white p-4 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20">
                        <span className="material-symbols-outlined">pending</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Đang chờ xử lý</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{records.filter((record) => record.status === "draft" || record.status === "confirmed").length}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                <div className="border-b border-[#dde0e4] p-4 dark:border-[#2d353e]">
                    <div className="relative w-full sm:w-80">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            placeholder="Tìm theo mã phiếu, nhà cung cấp, kho..."
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-[#dde0e4] bg-gray-50/50 dark:border-[#2d353e] dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#687582]">Mã phiếu</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#687582]">Nhà cung cấp</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#687582]">Kho nhận</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#687582]">Tổng giá trị</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#687582]">Người tạo</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#687582]">Ngày tạo</th>
                                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#687582]">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined mb-2 block text-4xl">inbox</span>
                                        Chưa có dữ liệu
                                    </td>
                                </tr>
                            ) : filtered.map((record) => {
                                const status = getStatusStyle(record.status);

                                return (
                                    <tr
                                        key={record.id}
                                        onClick={() => router.push(`/admin/medicines/import/${record.id}`)}
                                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <td className="px-6 py-3 text-sm font-bold text-[#3C81C6]">{record.code}</td>
                                        <td className="px-6 py-3 text-sm text-[#121417] dark:text-white">{record.supplier}</td>
                                        <td className="px-6 py-3 text-sm text-[#687582] dark:text-gray-400">{record.warehouseName}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-[#121417] dark:text-white">{(record.totalAmount ?? 0).toLocaleString("vi-VN")}d</td>
                                        <td className="px-6 py-3 text-sm text-[#687582] dark:text-gray-400">{record.createdBy}</td>
                                        <td className="px-6 py-3 text-sm text-[#687582] dark:text-gray-400">{record.date || "-"}</td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
