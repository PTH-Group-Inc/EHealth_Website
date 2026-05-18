"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { inventoryService } from "@/services/inventoryService";
import {
    mapApiInventoryToStockItem,
    type AdminStockItem as StockItem,
} from "@/features/medicines/utils/adminMedicineMappers";

export default function MedicineStockPage() {
    const router = useRouter();
    const [stock, setStock] = useState<StockItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");

    useEffect(() => {
        inventoryService.getList({ limit: 500 })
            .then((res) => {
                const payload = (res as { data?: { data?: unknown[] } | unknown[] })?.data;
                const items: unknown[] = Array.isArray((payload as { data?: unknown[] })?.data)
                    ? ((payload as { data?: unknown[] }).data ?? [])
                    : Array.isArray(payload)
                        ? payload
                        : Array.isArray(res)
                            ? res
                            : [];

                setStock(
                    items
                        .map((item) => mapApiInventoryToStockItem(item))
                        .filter((item): item is StockItem => item !== null)
                );
            })
            .catch(() => {
                setStock([]);
            });
    }, []);

    const filtered = useMemo(
        () => stock.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.code.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesLevel = levelFilter === "all" || item.stockLevel === levelFilter;
            return matchesSearch && matchesLevel;
        }),
        [stock, searchQuery, levelFilter]
    );

    const getStockStyle = (level: string) => {
        switch (level) {
            case "HIGH":
                return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Du tru cao", bar: "bg-blue-500" };
            case "NORMAL":
                return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Binh thuong", bar: "bg-green-500" };
            case "LOW":
                return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: "Sap het", bar: "bg-orange-500" };
            case "OUT":
                return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Het hang", bar: "bg-red-500" };
            default:
                return { bg: "bg-gray-100", text: "text-gray-600", label: level, bar: "bg-gray-400" };
        }
    };

    return (
        <>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">Ton kho</h1>
                    <p className="text-[#687582] dark:text-gray-400">Theo doi so luong ton kho thuoc va vat tu y te</p>
                </div>
                <button className="flex items-center gap-2 rounded-xl border border-[#dde0e4] bg-white px-5 py-2.5 text-sm font-bold text-[#121417] shadow-sm transition-colors hover:bg-gray-50 dark:border-[#2d353e] dark:bg-[#1e242b] dark:text-white dark:hover:bg-gray-800">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Xuat bao cao
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-4 rounded-xl border border-[#dde0e4] bg-white p-4 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20"><span className="material-symbols-outlined">inventory_2</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Tong mat hang</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stock.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-[#dde0e4] bg-white p-4 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20"><span className="material-symbols-outlined">check_circle</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Du hang</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stock.filter((item) => item.stockLevel === "NORMAL" || item.stockLevel === "HIGH").length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-[#dde0e4] bg-white p-4 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20"><span className="material-symbols-outlined">warning</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Sap het</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stock.filter((item) => item.stockLevel === "LOW").length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-[#dde0e4] bg-white p-4 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20"><span className="material-symbols-outlined">report</span></div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Het hang</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stock.filter((item) => item.stockLevel === "OUT").length}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                <div className="flex flex-col gap-3 border-b border-[#dde0e4] p-4 sm:flex-row dark:border-[#2d353e]">
                    <div className="relative w-full sm:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[20px]">search</span></span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            placeholder="Tim theo ma, ten thuoc..."
                        />
                    </div>
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-10 text-sm text-[#687582] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    >
                        <option value="all">Tat ca muc ton</option>
                        <option value="HIGH">Du tru cao</option>
                        <option value="NORMAL">Binh thuong</option>
                        <option value="LOW">Sap het</option>
                        <option value="OUT">Het hang</option>
                    </select>
                </div>
                {filtered.length === 0 ? (
                    <div className="py-12 text-center text-[#687582] dark:text-gray-400">
                        <span className="material-symbols-outlined mb-2 block text-4xl">inbox</span>
                        Chua co du lieu
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map((item) => {
                            const style = getStockStyle(item.stockLevel);
                            const pct = item.maxStock > 0 ? Math.min(100, Math.round((item.currentStock / item.maxStock) * 100)) : 0;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => router.push(`/admin/medicines/stock/${item.id}`)}
                                    className="cursor-pointer rounded-2xl border border-[#dde0e4] bg-white dark:bg-[#1e242b] dark:border-[#2d353e] p-4 shadow-sm transition-all hover:shadow-md hover:border-[#3C81C6]"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-mono text-[#3C81C6] font-bold">{item.code}</p>
                                            <h3 className="text-sm font-bold text-[#121417] dark:text-white truncate" title={item.name}>{item.name}</h3>
                                        </div>
                                        <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>{style.label}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-[10px] text-[#687582] uppercase tracking-wider">Ton kho</p>
                                                <p className="text-2xl font-black text-[#121417] dark:text-white leading-tight">
                                                    {(item.currentStock ?? 0).toLocaleString("vi-VN")}
                                                    <span className="text-xs text-[#687582] font-normal"> / {(item.maxStock ?? 0).toLocaleString("vi-VN")}</span>
                                                </p>
                                            </div>
                                            <span className="text-xs font-semibold text-[#687582]">{pct}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            <div className={`h-full rounded-full ${style.bar} transition-all`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-[#687582] pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <span className="inline-flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>tag</span>
                                                {item.batchNumber || "—"}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span>
                                                {item.expiryDate || "—"}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-[#687582]">Min: {item.minStock}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
