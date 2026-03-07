"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MOCK_DEPARTMENTS } from "@/lib/mock-data/admin";

const SPECIALTIES = [
    "Nội tổng quát", "Ngoại tổng quát", "Nhi khoa", "Sản phụ khoa", "Tim mạch",
    "Thần kinh", "Da liễu", "Mắt", "Tai mũi họng", "Răng hàm mặt",
    "Ung bướu", "Cấp cứu", "Hồi sức tích cực", "Chấn thương chỉnh hình",
];

export default function NewDoctorPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "", email: "", phone: "", gender: "male",
        dateOfBirth: "", specialization: "Nội tổng quát",
        departmentId: "", licenseNumber: "", experience: "",
        education: "", address: "", bio: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
        if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
        if (!formData.phone.trim()) newErrors.phone = "Vui lòng nhập SĐT";
        if (!formData.licenseNumber.trim()) newErrors.licenseNumber = "Vui lòng nhập số CCHN";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Thêm bác sĩ thành công!");
        router.push("/admin/doctors");
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/doctors" className="hover:text-[#3C81C6] transition-colors">Quản lý Bác sĩ</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Thêm bác sĩ mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">person_add</span>
                        Thêm bác sĩ mới
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">Nhập thông tin bác sĩ để thêm vào hệ thống</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2"><SectionTitle icon="badge" title="Thông tin cá nhân" /></div>
                        <Field label="Họ và tên *" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} placeholder="BS. Nguyễn Văn A" icon="person" />
                        <Field label="Email *" name="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="doctor@ehealth.vn" icon="email" />
                        <Field label="Số điện thoại *" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="0901 234 567" icon="phone" />
                        <Select label="Giới tính" name="gender" value={formData.gender} onChange={handleChange} options={[{ v: "male", l: "Nam" }, { v: "female", l: "Nữ" }]} />
                        <Field label="Ngày sinh" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} icon="cake" />
                        <Field label="Địa chỉ" name="address" value={formData.address} onChange={handleChange} placeholder="Nhập địa chỉ" icon="location_on" />

                        <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800"><SectionTitle icon="stethoscope" title="Thông tin chuyên môn" /></div>
                        <Field label="Số CCHN *" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} error={errors.licenseNumber} placeholder="VD: BS-2024-001" icon="verified" />
                        <Select label="Chuyên khoa" name="specialization" value={formData.specialization} onChange={handleChange} options={SPECIALTIES.map(s => ({ v: s, l: s }))} />
                        <Select label="Khoa / Phòng ban" name="departmentId" value={formData.departmentId} onChange={handleChange} options={[{ v: "", l: "-- Chọn khoa --" }, ...MOCK_DEPARTMENTS.map(d => ({ v: d.id, l: d.name }))]} />
                        <Field label="Kinh nghiệm (năm)" name="experience" type="number" value={formData.experience} onChange={handleChange} placeholder="VD: 10" icon="work_history" />
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Học vấn / Chứng chỉ</label>
                            <textarea name="education" value={formData.education} onChange={handleChange} rows={2} placeholder="VD: Tiến sĩ Y khoa - ĐH Y Hà Nội..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 resize-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tiểu sử</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={2} placeholder="Giới thiệu ngắn về bác sĩ..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 resize-none" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Thêm bác sĩ</>}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
    return <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#3C81C6]">{icon}</span>{title}</h3>;
}
function Field({ label, name, type = "text", value, onChange, error, placeholder, icon }: { label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; placeholder?: string; icon?: string }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><div className="relative">{icon && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">{icon}</span></span>}<input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full py-2.5 ${icon ? "pl-10" : "pl-4"} pr-4 text-sm bg-gray-50 dark:bg-gray-800 border ${error ? "border-red-400" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 transition-colors`} /></div>{error && <p className="text-xs text-red-500 mt-1">{error}</p>}</div>);
}
function Select({ label, name, value, onChange, options }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { v: string; l: string }[] }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><select name={name} value={value} onChange={onChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">{options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>);
}
