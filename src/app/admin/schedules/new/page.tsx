"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const MOCK_DOCTORS = [
    { id: "1", name: "BS. Nguyễn Văn An" }, { id: "2", name: "BS. Trần Thị Bình" },
    { id: "3", name: "BS. Lê Văn Cường" }, { id: "4", name: "BS. Phạm Thị Dung" },
    { id: "5", name: "BS. Hoàng Văn Em" },
];

const DEPARTMENTS = ["Khoa Nội", "Khoa Ngoại", "Khoa Nhi", "Khoa Sản", "Khoa Tim mạch", "Khoa Thần kinh", "Cấp cứu"];

export default function NewSchedulePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        doctorId: "", department: "Khoa Nội", shift: "MORNING",
        dateStart: new Date().toISOString().split("T")[0],
        dateEnd: "", repeat: "none", note: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.doctorId) { alert("Vui lòng chọn bác sĩ"); return; }
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Thêm lịch trực thành công!");
        router.push("/admin/schedules");
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/schedules" className="hover:text-[#3C81C6] transition-colors">Lịch trực</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Thêm lịch trực mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">calendar_add_on</span>
                        Thêm lịch trực mới
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">Phân công lịch trực cho bác sĩ</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bác sĩ *</label>
                            <select name="doctorId" value={formData.doctorId} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="">-- Chọn bác sĩ --</option>
                                {MOCK_DOCTORS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Khoa</label>
                            <select name="department" value={formData.department} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ca trực *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: "MORNING", label: "Ca sáng", time: "7:00-12:00", color: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700" },
                                    { value: "AFTERNOON", label: "Ca chiều", time: "13:00-18:00", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700" },
                                    { value: "NIGHT", label: "Ca đêm", time: "19:00-7:00", color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700" },
                                ].map((s) => (
                                    <button key={s.value} type="button" onClick={() => setFormData((prev) => ({ ...prev, shift: s.value }))}
                                        className={`p-3 rounded-xl border text-center transition-all ${formData.shift === s.value ? s.color + " ring-2 ring-current/20" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                                        <p className="text-sm font-bold">{s.label}</p>
                                        <p className="text-xs opacity-70">{s.time}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lặp lại</label>
                            <select name="repeat" value={formData.repeat} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="none">Không lặp</option>
                                <option value="daily">Hàng ngày</option>
                                <option value="weekly">Hàng tuần</option>
                                <option value="biweekly">2 tuần / lần</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ngày bắt đầu *</label>
                            <input type="date" name="dateStart" value={formData.dateStart} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ngày kết thúc</label>
                            <input type="date" name="dateEnd" value={formData.dateEnd} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                            <textarea name="note" value={formData.note} onChange={handleChange} rows={2} placeholder="Ghi chú thêm về lịch trực..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 resize-none" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Thêm lịch trực</>}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
