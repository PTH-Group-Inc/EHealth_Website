"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mock data — Kho thuốc
const INVENTORY_STATS = [
    { label: "Tổng thuốc", value: "1,247", icon: "inventory_2", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Đủ tồn kho", value: "1,185", icon: "check_circle", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Sắp hết", value: "42", icon: "warning", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Hết hàng", value: "20", icon: "error", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
];

const INVENTORY_HISTORY = [
    { id: "NK001", date: "26/02/2026", type: "import", name: "Amoxicillin 500mg", qty: 500, unit: "viên", supplier: "Dược Hậu Giang", note: "Đợt nhập tháng 2", user: "Admin" },
    { id: "NK002", date: "25/02/2026", type: "import", name: "Paracetamol 500mg", qty: 1000, unit: "viên", supplier: "TRAPHACO", note: "Bổ sung tồn kho", user: "Admin" },
    { id: "XK001", date: "25/02/2026", type: "export", name: "Vitamin C 1000mg", qty: 200, unit: "viên", supplier: "", note: "Cấp phát 200 viên", user: "DS. Trần Dược" },
    { id: "NK003", date: "24/02/2026", type: "import", name: "Omeprazole 20mg", qty: 300, unit: "viên", supplier: "Dược Hậu Giang", note: "Đơn hàng #DH-4521", user: "Admin" },
    { id: "XK002", date: "24/02/2026", type: "export", name: "Cefuroxime 500mg", qty: 100, unit: "viên", supplier: "", note: "Cấp phát theo đơn", user: "DS. Lý Minh" },
    { id: "NK004", date: "23/02/2026", type: "import", name: "Metformin 850mg", qty: 400, unit: "viên", supplier: "Sanofi", note: "Đợt nhập đặc biệt", user: "Admin" },
    { id: "XK003", date: "23/02/2026", type: "export", name: "Amoxicillin 500mg", qty: 150, unit: "viên", supplier: "", note: "Cấp phát", user: "DS. Trần Dược" },
    { id: "NK005", date: "22/02/2026", type: "import", name: "Atorvastatin 20mg", qty: 250, unit: "viên", supplier: "Pfizer", note: "Đơn hàng #DH-4520", user: "Admin" },
];

const LOW_STOCK_ITEMS = [
    { name: "Amoxicillin 500mg", stock: 45, min: 100, unit: "viên", category: "Kháng sinh" },
    { name: "Paracetamol 500mg", stock: 30, min: 200, unit: "viên", category: "Giảm đau" },
    { name: "Vitamin C 1000mg", stock: 12, min: 50, unit: "viên", category: "Vitamin" },
    { name: "Omeprazole 20mg", stock: 25, min: 80, unit: "viên", category: "Tiêu hóa" },
    { name: "Cefuroxime 500mg", stock: 18, min: 60, unit: "viên", category: "Kháng sinh" },
    { name: "Metformin 850mg", stock: 35, min: 100, unit: "viên", category: "Tiểu đường" },
];

export default function InventoryPage() {
    const router = useRouter();
    const [tab, setTab] = useState<"history" | "low">("history");
    const [typeFilter, setTypeFilter] = useState<"all" | "import" | "export">("all");

    const filteredHistory = typeFilter === "all" ? INVENTORY_HISTORY : INVENTORY_HISTORY.filter((h) => h.type === typeFilter);

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div>
                <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500 mb-3">
                    <span className="material-symbols-outlined text-[14px]">home</span>
                    <span>Trang chủ</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span>Danh mục Thuốc</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Nhập kho / Tồn kho</span>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">Nhập kho / Tồn kho</h1>
                        <p className="text-[#687582] dark:text-gray-400 mt-0.5 text-sm">Quản lý lịch sử nhập xuất và theo dõi tồn kho</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const headers = ["Mã", "Ngày", "Loại", "Tên thuốc", "Số lượng", "Đơn vị", "Nhà cung cấp", "Ghi chú", "Người thực hiện"];
                                const rows = INVENTORY_HISTORY.map((h) => [h.id, h.date, h.type === "import" ? "Nhập" : "Xuất", h.name, h.qty.toString(), h.unit, h.supplier || "-", h.note, h.user]);
                                const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
                                const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
                                link.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-[#687582] rounded-xl text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <span className="material-symbols-outlined text-[18px]">download</span>Xuất Excel
                        </button>
                        <button
                            onClick={() => router.push("/admin/medicines/inventory/import")}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#3C81C6]/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>Nhập kho mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {INVENTORY_STATS.map((s) => (
                    <div key={s.label} className="bg-white dark:bg-[#1e242b] p-4 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                        <div className={`p-2.5 ${s.bg} rounded-xl`}>
                            <span className={`material-symbols-outlined ${s.color} text-[22px]`}>{s.icon}</span>
                        </div>
                        <div>
                            <p className="text-xs text-[#687582] dark:text-gray-400 font-medium uppercase tracking-wider">{s.label}</p>
                            <p className="text-xl font-extrabold text-[#121417] dark:text-white">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#f6f7f8] dark:bg-[#13191f] p-1 rounded-xl w-fit">
                {[
                    { key: "history" as const, label: "Lịch sử nhập/xuất", icon: "receipt_long" },
                    { key: "low" as const, label: "Thuốc sắp hết", icon: "warning" },
                ].map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white shadow-sm" : "text-[#687582] hover:text-[#121417] dark:hover:text-white"}`}>
                        <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {tab === "history" ? (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="px-5 py-3 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center gap-2">
                        {[
                            { key: "all" as const, label: "Tất cả" },
                            { key: "import" as const, label: "Nhập kho" },
                            { key: "export" as const, label: "Xuất kho" },
                        ].map((f) => (
                            <button key={f.key} onClick={() => setTypeFilter(f.key)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${typeFilter === f.key ? "bg-[#3C81C6] text-white" : "text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#f6f7f8] dark:bg-[#13191f]">
                                <tr>
                                    <th className="text-left text-xs font-bold text-[#687582] px-5 py-3 uppercase tracking-wider">Mã</th>
                                    <th className="text-left text-xs font-bold text-[#687582] px-5 py-3 uppercase tracking-wider">Ngày</th>
                                    <th className="text-left text-xs font-bold text-[#687582] px-5 py-3 uppercase tracking-wider">Loại</th>
                                    <th className="text-left text-xs font-bold text-[#687582] px-5 py-3 uppercase tracking-wider">Tên thuốc</th>
                                    <th className="text-right text-xs font-bold text-[#687582] px-5 py-3 uppercase tracking-wider">Số lượng</th>
                                    <th className="text-left text-xs font-bold text-[#687582] px-5 py-3 uppercase tracking-wider">Nhà cung cấp</th>
                                    <th className="text-left text-xs font-bold text-[#687582] px-5 py-3 uppercase tracking-wider">Ghi chú</th>
                                    <th className="text-left text-xs font-bold text-[#687582] px-5 py-3 uppercase tracking-wider">Người thực hiện</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                                {filteredHistory.map((h) => (
                                    <tr key={h.id} className="hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                        <td className="px-5 py-3 text-sm font-medium text-[#121417] dark:text-white">{h.id}</td>
                                        <td className="px-5 py-3 text-sm text-[#687582] dark:text-gray-400">{h.date}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${h.type === "import"
                                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                                                : "bg-amber-50 dark:bg-amber-900/20 text-amber-600"}`}>
                                                <span className="material-symbols-outlined text-[12px]">{h.type === "import" ? "arrow_downward" : "arrow_upward"}</span>
                                                {h.type === "import" ? "Nhập" : "Xuất"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-sm font-medium text-[#121417] dark:text-white">{h.name}</td>
                                        <td className="px-5 py-3 text-sm font-bold text-right text-[#121417] dark:text-white">{h.qty.toLocaleString()} {h.unit}</td>
                                        <td className="px-5 py-3 text-sm text-[#687582] dark:text-gray-400">{h.supplier || "—"}</td>
                                        <td className="px-5 py-3 text-sm text-[#687582] dark:text-gray-400">{h.note}</td>
                                        <td className="px-5 py-3 text-sm text-[#687582] dark:text-gray-400">{h.user}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                        {LOW_STOCK_ITEMS.map((med) => (
                            <div key={med.name} className="px-5 py-4 flex items-center justify-between hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white">{med.name}</p>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[#687582]">{med.category}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-48 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${med.stock / med.min < 0.3 ? "bg-red-500" : "bg-amber-500"}`}
                                                style={{ width: `${Math.min((med.stock / med.min) * 100, 100)}%` }} />
                                        </div>
                                        <span className={`text-xs font-bold ${med.stock / med.min < 0.3 ? "text-red-500" : "text-amber-500"}`}>
                                            {med.stock}/{med.min} {med.unit}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push("/admin/medicines/inventory/import")}
                                    className="px-3 py-1.5 bg-[#3C81C6] text-white text-xs font-medium rounded-lg hover:bg-[#2a6da8] transition-colors"
                                >
                                    Nhập thêm
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
