"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewPatientPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [fd, setFd] = useState({
        name: "", phone: "", cccd: "", dob: "", gender: "Nam",
        email: "", address: "", insurance: "", insuranceExpiry: "",
        emergencyContact: "", emergencyPhone: "",
        bloodType: "", allergies: "", medicalHistory: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFd((p) => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fd.name || !fd.phone) { alert("Vui lòng nhập họ tên và số điện thoại"); return; }
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Tiếp nhận bệnh nhân thành công!");
        router.push("/portal/receptionist/patients");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/portal/receptionist/patients" className="hover:text-[#3C81C6]">Bệnh nhân</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Tiếp nhận bệnh nhân mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">person_add</span> Tiếp nhận bệnh nhân mới
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <h3 className="col-span-full text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#3C81C6]">badge</span> Thông tin cá nhân</h3>
                        <Inp label="Họ và tên *" name="name" value={fd.name} onChange={handleChange} placeholder="Nguyễn Văn A" />
                        <Inp label="Số điện thoại *" name="phone" value={fd.phone} onChange={handleChange} placeholder="0901 234 567" />
                        <Inp label="CCCD / CMND" name="cccd" value={fd.cccd} onChange={handleChange} placeholder="012345678901" />
                        <Inp label="Ngày sinh" name="dob" type="date" value={fd.dob} onChange={handleChange} />
                        <Sel label="Giới tính" name="gender" value={fd.gender} onChange={handleChange} options={["Nam", "Nữ"]} />
                        <Inp label="Email" name="email" value={fd.email} onChange={handleChange} placeholder="email@example.com" />
                        <div className="col-span-full"><Inp label="Địa chỉ" name="address" value={fd.address} onChange={handleChange} placeholder="Số nhà, đường, phường, quận..." /></div>

                        <h3 className="col-span-full text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800"><span className="material-symbols-outlined text-[18px] text-[#3C81C6]">health_and_safety</span> Bảo hiểm & Y tế</h3>
                        <Inp label="Số BHYT" name="insurance" value={fd.insurance} onChange={handleChange} placeholder="HC4012345678" />
                        <Inp label="Hạn BHYT" name="insuranceExpiry" type="date" value={fd.insuranceExpiry} onChange={handleChange} />
                        <Sel label="Nhóm máu" name="bloodType" value={fd.bloodType} onChange={handleChange} options={["-- Chưa rõ --", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
                        <div className="col-span-full"><Inp label="Dị ứng" name="allergies" value={fd.allergies} onChange={handleChange} placeholder="Thuốc, thực phẩm... (nếu có)" /></div>
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tiền sử bệnh</label>
                            <textarea name="medicalHistory" value={fd.medicalHistory} onChange={handleChange} rows={2} placeholder="Các bệnh lý đã mắc, thuốc đang dùng..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                        </div>

                        <h3 className="col-span-full text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800"><span className="material-symbols-outlined text-[18px] text-[#3C81C6]">emergency</span> Liên hệ khẩn cấp</h3>
                        <Inp label="Người liên hệ" name="emergencyContact" value={fd.emergencyContact} onChange={handleChange} placeholder="Họ tên người thân" />
                        <Inp label="SĐT người thân" name="emergencyPhone" value={fd.emergencyPhone} onChange={handleChange} placeholder="0901 xxx xxx" />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Tiếp nhận</>}
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
