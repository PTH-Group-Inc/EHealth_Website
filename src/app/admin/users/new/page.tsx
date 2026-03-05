"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";

export default function NewUserPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        role: ROLES.RECEPTIONIST,
        password: "",
        confirmPassword: "",
        gender: "male",
        dateOfBirth: "",
        department: "",
        address: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên";
        if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email không hợp lệ";
        if (!formData.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
        if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu";
        else if (formData.password.length < 6) newErrors.password = "Mật khẩu tối thiểu 6 ký tự";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        // TODO: Call API
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Tạo tài khoản thành công!");
        router.push("/admin/users");
    };

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/users" className="hover:text-[#3C81C6] transition-colors">Người dùng</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Thêm người dùng mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Quay lại
                </button>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">person_add</span>
                        Thêm người dùng mới
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">Điền đầy đủ thông tin để tạo tài khoản mới</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Thông tin cá nhân */}
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">badge</span>
                                Thông tin cá nhân
                            </h3>
                        </div>

                        <FormField label="Họ và tên *" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} placeholder="Nhập họ và tên" icon="person" />
                        <FormField label="Email *" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="example@ehealth.vn" icon="email" />
                        <FormField label="Số điện thoại *" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="0901 234 567" icon="phone" />

                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Giới tính</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>

                        <FormField label="Ngày sinh" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} icon="cake" />
                        <FormField label="Địa chỉ" name="address" value={formData.address} onChange={handleChange} placeholder="Nhập địa chỉ" icon="location_on" />

                        {/* Thông tin tài khoản */}
                        <div className="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">manage_accounts</span>
                                Thông tin tài khoản
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Vai trò *</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                {Object.entries(ROLES).map(([key, value]) => (
                                    <option key={key} value={value}>{ROLE_LABELS[value as Role]}</option>
                                ))}
                            </select>
                        </div>

                        <FormField label="Khoa / Phòng ban" name="department" value={formData.department} onChange={handleChange} placeholder="VD: Khoa Nội Tổng Quát" icon="domain" />
                        <FormField label="Mật khẩu *" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="Tối thiểu 6 ký tự" icon="lock" />
                        <FormField label="Xác nhận mật khẩu *" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="Nhập lại mật khẩu" icon="lock" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Hủy
                        </button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">save</span> Tạo tài khoản</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

function FormField({ label, name, type = "text", value, onChange, error, placeholder, icon }: {
    label: string; name: string; type?: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string; placeholder?: string; icon?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label>
            <div className="relative">
                {icon && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </span>
                )}
                <input
                    type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
                    className={`w-full py-2.5 ${icon ? "pl-10" : "pl-4"} pr-4 text-sm bg-gray-50 dark:bg-gray-800 border ${error ? "border-red-400" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 transition-colors`}
                />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
