"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewDepartmentPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "", code: "", head: "", phone: "", email: "",
        floor: "", roomCount: "", bedCount: "", maxCapacity: "",
        description: "", status: "active",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Vui lòng nhập tên chuyên khoa";
        if (!formData.code.trim()) newErrors.code = "Vui lòng nhập mã khoa";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Thêm chuyên khoa thành công!");
        router.push("/admin/departments");
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/departments" className="hover:text-[#3C81C6] transition-colors">Chuyên khoa</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Thêm chuyên khoa</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">domain_add</span>
                        Thêm chuyên khoa mới
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">Nhập thông tin để tạo khoa / phòng ban mới</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Field label="Tên chuyên khoa *" name="name" value={formData.name} onChange={handleChange} error={errors.name} placeholder="VD: Khoa Nội Tổng Quát" icon="domain" />
                        <Field label="Mã khoa *" name="code" value={formData.code} onChange={handleChange} error={errors.code} placeholder="VD: NOI-TQ" icon="tag" />
                        <Field label="Trưởng khoa" name="head" value={formData.head} onChange={handleChange} placeholder="BS. Nguyễn Văn A" icon="person" />
                        <Field label="Số điện thoại" name="phone" value={formData.phone} onChange={handleChange} placeholder="028 1234 5678" icon="phone" />
                        <Field label="Email" name="email" value={formData.email} onChange={handleChange} placeholder="khoa@ehealth.vn" icon="email" />
                        <Field label="Tầng / Vị trí" name="floor" value={formData.floor} onChange={handleChange} placeholder="VD: Tầng 3, Tòa A" icon="location_on" />
                        <Field label="Số phòng" name="roomCount" type="number" value={formData.roomCount} onChange={handleChange} placeholder="VD: 10" icon="meeting_room" />
                        <Field label="Số giường" name="bedCount" type="number" value={formData.bedCount} onChange={handleChange} placeholder="VD: 50" icon="bed" />
                        <Field label="Sức chứa tối đa" name="maxCapacity" type="number" value={formData.maxCapacity} onChange={handleChange} placeholder="VD: 100" icon="groups" />
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Trạng thái</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Tạm ngưng</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mô tả</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Mô tả chức năng, nhiệm vụ của khoa..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 resize-none" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Thêm chuyên khoa</>}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

function Field({ label, name, type = "text", value, onChange, error, placeholder, icon }: { label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; placeholder?: string; icon?: string }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><div className="relative">{icon && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">{icon}</span></span>}<input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full py-2.5 ${icon ? "pl-10" : "pl-4"} pr-4 text-sm bg-gray-50 dark:bg-gray-800 border ${error ? "border-red-400" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 transition-colors`} /></div>{error && <p className="text-xs text-red-500 mt-1">{error}</p>}</div>);
}
