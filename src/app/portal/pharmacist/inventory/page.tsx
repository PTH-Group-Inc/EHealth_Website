"use client";

import { useState, useMemo } from "react";

const MOCK_INVENTORY = [
    { id: "T001", name: "Amoxicillin 500mg", group: "Kháng sinh", unit: "viên", stock: 45, min: 100, price: 3500, expiry: "06/2025", supplier: "DHG Pharma" },
    { id: "T002", name: "Paracetamol 500mg", group: "Giảm đau", unit: "viên", stock: 30, min: 200, price: 1200, expiry: "12/2025", supplier: "Imexpharm" },
    { id: "T003", name: "Omeprazole 20mg", group: "Tiêu hóa", unit: "viên", stock: 25, min: 80, price: 5500, expiry: "09/2025", supplier: "DHG Pharma" },
    { id: "T004", name: "Amlodipine 5mg", group: "Tim mạch", unit: "viên", stock: 320, min: 100, price: 2800, expiry: "03/2026", supplier: "Hasan" },
    { id: "T005", name: "Cetirizine 10mg", group: "Dị ứng", unit: "viên", stock: 180, min: 50, price: 2200, expiry: "11/2025", supplier: "Imexpharm" },
    { id: "T006", name: "Vitamin C 1000mg", group: "Vitamin", unit: "viên", stock: 12, min: 50, price: 1500, expiry: "08/2025", supplier: "Pymepharco" },
    { id: "T007", name: "Cefuroxime 500mg", group: "Kháng sinh", unit: "viên", stock: 18, min: 60, price: 12000, expiry: "04/2025", supplier: "DHG Pharma" },
    { id: "T008", name: "Losartan 50mg", group: "Tim mạch", unit: "viên", stock: 250, min: 80, price: 4200, expiry: "01/2026", supplier: "Hasan" },
    { id: "T009", name: "Metformin 500mg", group: "Đái tháo đường", unit: "viên", stock: 500, min: 200, price: 1800, expiry: "07/2025", supplier: "Pymepharco" },
    { id: "T010", name: "Atorvastatin 10mg", group: "Tim mạch", unit: "viên", stock: 150, min: 60, price: 6500, expiry: "10/2025", supplier: "Imexpharm" },
];

export default function PharmacistInventory() {
    const [inventory] = useState(MOCK_INVENTORY);
    const [search, setSearch] = useState("");
    const [groupFilter, setGroupFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");

    const groups = Array.from(new Set(inventory.map((i) => i.group)));

    const filtered = useMemo(() => inventory.filter((i) => {
        const ms = i.name.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search);
        const mg = groupFilter === "all" || i.group === groupFilter;
        const mst = stockFilter === "all" || (stockFilter === "low" && i.stock < i.min) || (stockFilter === "ok" && i.stock >= i.min);
        return ms && mg && mst;
    }), [inventory, search, groupFilter, stockFilter]);

    const lowCount = inventory.filter((i) => i.stock < i.min).length;
    const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";

    return (
        <div className="p-6 md:p-8"><div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Kho thuốc</h1>
                    <p className="text-sm text-[#687582] mt-1">Quản lý tồn kho & nhập xuất thuốc</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-medium hover:border-[#3C81C6] transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>Xuất Excel
                    </button>
                    <button onClick={() => window.location.href = '/portal/pharmacist/inventory/import'} className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#3C81C6]/20">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>Nhập thuốc
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { l: "Tổng danh mục", v: inventory.length.toString(), i: "medication", c: "text-blue-600" },
                    { l: "Tồn kho đủ", v: (inventory.length - lowCount).toString(), i: "check_circle", c: "text-emerald-600" },
                    { l: "Sắp hết", v: lowCount.toString(), i: "warning", c: "text-amber-600" },
                    { l: "Sắp hết hạn", v: "3", i: "event_busy", c: "text-red-500" },
                ].map((s) => (
                    <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-4">
                        <span className={`material-symbols-outlined ${s.c}`} style={{ fontSize: "28px" }}>{s.i}</span>
                        <div><p className="text-xl font-bold text-[#121417] dark:text-white">{s.v}</p><p className="text-xs text-[#687582]">{s.l}</p></div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full sm:max-w-xs">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>search</span>
                        <input type="text" placeholder="Tìm thuốc..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6]" />
                    </div>
                    <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}
                        className="px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6]">
                        <option value="all">Tất cả nhóm</option>
                        {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}
                        className="px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6]">
                        <option value="all">Tất cả tồn kho</option>
                        <option value="low">Sắp hết</option>
                        <option value="ok">Đủ hàng</option>
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-[#dde0e4] dark:border-[#2d353e]">
                            {["Mã", "Tên thuốc", "Nhóm", "Tồn kho", "Đơn giá", "Hạn dùng", "NCC", "Thao tác"].map((h) => (
                                <th key={h} className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {filtered.map((item) => (
                                <tr key={item.id} className="border-b border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-4 py-3 text-sm font-mono text-[#3C81C6] font-medium">{item.id}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-[#121417] dark:text-white">{item.name}</td>
                                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600">{item.group}</span></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-semibold ${item.stock < item.min ? "text-red-500" : "text-[#121417] dark:text-white"}`}>{item.stock}</span>
                                            <span className="text-xs text-[#687582]">/ {item.min} {item.unit}</span>
                                            {item.stock < item.min && <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "16px" }}>warning</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#121417] dark:text-white">{fmt(item.price)}</td>
                                    <td className="px-4 py-3 text-sm text-[#687582]">{item.expiry}</td>
                                    <td className="px-4 py-3 text-sm text-[#687582]">{item.supplier}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors"><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span></button>
                                            <button className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 transition-colors"><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_shopping_cart</span></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-[#dde0e4] dark:border-[#2d353e] text-sm text-[#687582]">Hiển thị {filtered.length}/{inventory.length} thuốc</div>
            </div>
        </div></div>
    );
}
