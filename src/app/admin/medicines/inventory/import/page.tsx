"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ImportItem {
    name: string;
    quantity: string;
    unit: string;
    supplier: string;
    lotNumber: string;
    expiryDate: string;
    price: string;
    note: string;
}

const EMPTY_ITEM: ImportItem = {
    name: "", quantity: "", unit: "Viên", supplier: "",
    lotNumber: "", expiryDate: "", price: "", note: "",
};

const UNITS = ["Viên", "Hộp", "Chai", "Ống", "Gói", "Tuýp", "Lọ"];

export default function InventoryImportPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState<ImportItem[]>([{ ...EMPTY_ITEM }]);

    const handleItemChange = (index: number, field: keyof ImportItem, value: string) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);

    const removeItem = (index: number) => {
        if (items.length === 1) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const hasEmpty = items.some((item) => !item.name.trim() || !item.quantity.trim());
        if (hasEmpty) { alert("Vui lòng nhập tên thuốc và số lượng cho tất cả các mục"); return; }
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Nhập kho thành công!");
        router.push("/admin/medicines/inventory");
    };

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/medicines" className="hover:text-[#3C81C6] transition-colors">Danh mục thuốc</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <Link href="/admin/medicines/inventory" className="hover:text-[#3C81C6] transition-colors">Nhập kho / Tồn kho</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Nhập kho mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">inventory</span>
                        Nhập kho mới
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">Thêm thuốc vào kho với thông tin chi tiết</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {items.map((item, index) => (
                            <div key={index} className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">medication</span>
                                        Thuốc #{index + 1}
                                    </h3>
                                    {items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên thuốc *</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">medication</span></span>
                                            <input type="text" value={item.name} onChange={(e) => handleItemChange(index, "name", e.target.value)} placeholder="VD: Amoxicillin 500mg"
                                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Số lượng *</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">inventory</span></span>
                                            <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, "quantity", e.target.value)} placeholder="VD: 500"
                                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Đơn vị</label>
                                        <select value={item.unit} onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                                            className="w-full py-2.5 px-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Nhà cung cấp</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">factory</span></span>
                                            <input type="text" value={item.supplier} onChange={(e) => handleItemChange(index, "supplier", e.target.value)} placeholder="VD: Dược Hậu Giang"
                                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Số lô</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">tag</span></span>
                                            <input type="text" value={item.lotNumber} onChange={(e) => handleItemChange(index, "lotNumber", e.target.value)} placeholder="VD: LOT-2026-001"
                                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Hạn sử dụng</label>
                                        <input type="date" value={item.expiryDate} onChange={(e) => handleItemChange(index, "expiryDate", e.target.value)}
                                            className="w-full py-2.5 px-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Giá nhập (VNĐ)</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">payments</span></span>
                                            <input type="number" value={item.price} onChange={(e) => handleItemChange(index, "price", e.target.value)} placeholder="VD: 5000"
                                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                                        <input type="text" value={item.note} onChange={(e) => handleItemChange(index, "note", e.target.value)} placeholder="VD: Đợt nhập tháng 3"
                                            className="w-full py-2.5 px-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add more button */}
                    <button type="button" onClick={addItem}
                        className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 text-[#687582] rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-[#3C81C6] hover:text-[#3C81C6] transition-all w-full justify-center">
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Thêm thuốc khác
                    </button>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()}
                            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">save</span> Nhập kho</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
