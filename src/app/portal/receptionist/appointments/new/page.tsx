"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEPARTMENTS = ["Nội tổng quát", "Ngoại tổng quát", "Nhi khoa", "Sản phụ khoa", "Tim mạch", "Da liễu", "Mắt", "Cấp cứu"];
const DOCTORS: Record<string, string[]> = {
    "Nội tổng quát": ["BS. Nguyễn Văn An", "BS. Trần Bình"], "Nhi khoa": ["BS. Phạm Dung"],
    "Tim mạch": ["BS. Hoàng Em", "BS. Ngô Đức"], "Da liễu": ["BS. Phạm Hoa"], "Cấp cứu": ["BS. Lý Thanh"],
};

export default function NewAppointmentPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [fd, setFd] = useState({
        patientName: "", phone: "", cccd: "", dob: "", gender: "Nam",
        department: "", doctor: "", date: "", time: "", type: "Khám mới",
        insurance: "", note: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFd((p) => ({ ...p, [name]: value }));
        if (name === "department") setFd((p) => ({ ...p, doctor: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fd.patientName || !fd.phone || !fd.date || !fd.time) { alert("Vui lòng nhập đầy đủ thông tin bệnh nhân, ngày và giờ hẹn"); return; }
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Đã đặt lịch hẹn thành công!");
        router.push("/portal/receptionist/appointments");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/portal/receptionist/appointments" className="hover:text-[#3C81C6]">Lịch hẹn</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Đặt lịch hẹn mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">event_available</span> Đặt lịch hẹn mới
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <h3 className="col-span-full text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-[18px] text-[#3C81C6]">person</span> Thông tin bệnh nhân</h3>
                        <Inp label="Họ và tên *" name="patientName" value={fd.patientName} onChange={handleChange} placeholder="Nguyễn Văn A" />
                        <Inp label="Số điện thoại *" name="phone" value={fd.phone} onChange={handleChange} placeholder="0901 234 567" />
                        <Inp label="CCCD" name="cccd" value={fd.cccd} onChange={handleChange} placeholder="012345678901" />
                        <Inp label="Ngày sinh" name="dob" type="date" value={fd.dob} onChange={handleChange} />
                        <Sel label="Giới tính" name="gender" value={fd.gender} onChange={handleChange} options={["Nam", "Nữ"]} />
                        <Inp label="Số BHYT" name="insurance" value={fd.insurance} onChange={handleChange} placeholder="HC4012345678" />

                        <h3 className="col-span-full text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-2 pt-4 border-t border-gray-100 dark:border-gray-800"><span className="material-symbols-outlined text-[18px] text-[#3C81C6]">calendar_month</span> Thông tin lịch hẹn</h3>
                        <Sel label="Chuyên khoa" name="department" value={fd.department} onChange={handleChange} options={["-- Chọn --", ...DEPARTMENTS]} />
                        <Sel label="Bác sĩ" name="doctor" value={fd.doctor} onChange={handleChange} options={["-- Chọn --", ...(DOCTORS[fd.department] || [])]} />
                        <Inp label="Ngày hẹn *" name="date" type="date" value={fd.date} onChange={handleChange} />
                        <Inp label="Giờ hẹn *" name="time" type="time" value={fd.time} onChange={handleChange} />
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Loại khám</label>
                            <div className="flex gap-2">
                                {["Khám mới", "Tái khám"].map((t) => (
                                    <button key={t} type="button" onClick={() => setFd((p) => ({ ...p, type: t }))}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${fd.type === t ? "bg-[#3C81C6]/10 border-[#3C81C6]/30 text-[#3C81C6]" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>{t}</button>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                            <textarea name="note" value={fd.note} onChange={handleChange} rows={2} placeholder="Triệu chứng, lý do khám..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Đặt lịch hẹn</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Inp({ label, name, type = "text", value, onChange, placeholder }: { label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" /></div>);
}
function Sel({ label, name, value, onChange, options }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><select name={name} value={value} onChange={onChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>);
}
