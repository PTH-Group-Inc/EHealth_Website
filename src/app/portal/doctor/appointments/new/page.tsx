"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEPARTMENTS = ["Nội tổng quát", "Ngoại tổng quát", "Nhi khoa", "Sản phụ khoa", "Tim mạch", "Thần kinh", "Da liễu", "Mắt", "Tai mũi họng", "Cấp cứu"];
const DOCTORS: Record<string, string[]> = {
    "Nội tổng quát": ["BS. Nguyễn Văn An", "BS. Trần Bình"], "Ngoại tổng quát": ["BS. Lê Cường"],
    "Nhi khoa": ["BS. Phạm Dung"], "Tim mạch": ["BS. Hoàng Em", "BS. Ngô Đức"],
    "Da liễu": ["BS. Phạm Hoa"], "Cấp cứu": ["BS. Lý Thanh"],
};

export default function NewAppointmentPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        patientName: "", phone: "", department: "", doctor: "",
        date: "", time: "", type: "Khám mới", note: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === "department") setFormData((prev) => ({ ...prev, doctor: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientName || !formData.phone || !formData.date || !formData.time) {
            alert("Vui lòng nhập đầy đủ thông tin"); return;
        }
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Đã tạo lịch hẹn thành công!");
        router.push("/portal/doctor/appointments");
    };

    const availableDoctors = formData.department ? (DOCTORS[formData.department] || []) : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/portal/doctor/appointments" className="hover:text-[#3C81C6]">Lịch hẹn</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Tạo lịch hẹn mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">calendar_add_on</span> Tạo lịch hẹn mới
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Inp label="Tên bệnh nhân *" name="patientName" value={formData.patientName} onChange={handleChange} placeholder="Nhập họ tên" icon="person" />
                        <Inp label="Số điện thoại *" name="phone" value={formData.phone} onChange={handleChange} placeholder="0901 234 567" icon="phone" />
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chuyên khoa</label>
                            <select name="department" value={formData.department} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="">-- Chọn chuyên khoa --</option>
                                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bác sĩ</label>
                            <select name="doctor" value={formData.doctor} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="">-- Chọn bác sĩ --</option>
                                {availableDoctors.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <Inp label="Ngày hẹn *" name="date" type="date" value={formData.date} onChange={handleChange} icon="event" />
                        <Inp label="Giờ hẹn *" name="time" type="time" value={formData.time} onChange={handleChange} icon="schedule" />
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Loại khám</label>
                            <div className="flex gap-2">
                                {["Khám mới", "Tái khám", "Cấp cứu"].map((t) => (
                                    <button key={t} type="button" onClick={() => setFormData((p) => ({ ...p, type: t }))}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${formData.type === t ? "bg-[#3C81C6]/10 border-[#3C81C6]/30 text-[#3C81C6]" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                            <textarea name="note" value={formData.note} onChange={handleChange} rows={2} placeholder="Lý do khám, triệu chứng..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Tạo lịch hẹn</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Inp({ label, name, type = "text", value, onChange, placeholder, icon }: { label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; icon?: string }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><div className="relative">{icon && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">{icon}</span></span>}<input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full py-2.5 ${icon ? "pl-10" : "pl-4"} pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400`} /></div></div>);
}
