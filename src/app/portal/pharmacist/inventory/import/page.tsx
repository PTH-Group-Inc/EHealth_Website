"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUPPLIERS = ["DHG Pharma", "Imexpharm", "Pymepharco", "Hậu Giang", "Traphaco", "Khác"];
const GROUPS = ["Kháng sinh", "Giảm đau", "Tim mạch", "Tiêu hóa", "Hô hấp", "Đái tháo đường", "Da liễu", "Vitamin", "Khác"];
const UNITS = ["viên", "ống", "gói", "chai", "tuýp", "hộp"];

export default function ImportMedicinePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState([
        { name: "", group: "Kháng sinh", unit: "viên", quantity: "", price: "", expiry: "", supplier: "DHG Pharma", batch: "" },
    ]);
    const [note, setNote] = useState("");

    const handleItemChange = (index: number, field: string, value: string) => {
        setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const addItem = () => {
        setItems((prev) => [...prev, { name: "", group: "Kháng sinh", unit: "viên", quantity: "", price: "", expiry: "", supplier: "DHG Pharma", batch: "" }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const totalValue = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!items[0].name || !items[0].quantity) { alert("Vui lòng nhập tên thuốc và số lượng"); return; }
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Nhập thuốc thành công!");
        router.push("/portal/pharmacist/inventory");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/portal/pharmacist/inventory" className="hover:text-[#3C81C6]">Kho thuốc</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Nhập thuốc mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">inventory_2</span> Phiếu nhập thuốc
                        </h1>
                        <p className="text-sm text-[#687582] mt-1">Ngày nhập: {new Date().toLocaleDateString("vi-VN")}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-[#687582]">Tổng giá trị</p>
                        <p className="text-xl font-bold text-[#3C81C6]">{totalValue.toLocaleString("vi-VN")}đ</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {items.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-[#3C81C6]">Thuốc #{idx + 1}</span>
                                {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700"><span className="material-symbols-outlined text-[18px]">close</span></button>}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <input type="text" placeholder="Tên thuốc *" value={item.name} onChange={(e) => handleItemChange(idx, "name", e.target.value)} className="col-span-2 py-2 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                <select value={item.group} onChange={(e) => handleItemChange(idx, "group", e.target.value)} className="py-2 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white">
                                    {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <select value={item.unit} onChange={(e) => handleItemChange(idx, "unit", e.target.value)} className="py-2 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white">
                                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                </select>
                                <input type="number" placeholder="Số lượng *" value={item.quantity} onChange={(e) => handleItemChange(idx, "quantity", e.target.value)} className="py-2 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white" />
                                <input type="number" placeholder="Đơn giá (đ)" value={item.price} onChange={(e) => handleItemChange(idx, "price", e.target.value)} className="py-2 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white" />
                                <input type="text" placeholder="Số lô" value={item.batch} onChange={(e) => handleItemChange(idx, "batch", e.target.value)} className="py-2 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white" />
                                <input type="date" placeholder="Hạn dùng" value={item.expiry} onChange={(e) => handleItemChange(idx, "expiry", e.target.value)} className="py-2 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white" />
                                <select value={item.supplier} onChange={(e) => handleItemChange(idx, "supplier", e.target.value)} className="col-span-2 py-2 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white">
                                    {SUPPLIERS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="col-span-2 text-right text-sm font-bold text-[#121417] dark:text-white">
                                    Thành tiền: {((Number(item.quantity) || 0) * (Number(item.price) || 0)).toLocaleString("vi-VN")}đ
                                </div>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addItem} className="w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-[#3C81C6] hover:border-[#3C81C6] hover:bg-[#3C81C6]/5 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add</span> Thêm thuốc
                    </button>
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú phiếu nhập</label>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Ghi chú thêm..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Xác nhận nhập kho</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
