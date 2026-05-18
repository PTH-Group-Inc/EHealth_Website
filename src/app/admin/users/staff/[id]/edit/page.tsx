"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import type { User } from "@/types";
import { getUserById, updateUser } from "@/services/userService";

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        role: ROLES.STAFF as string,
        phone: "",
        gender: "Nam",
        birthDate: "",
        address: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!userId) return;
        setIsLoading(true);
        setLoadError(null);
        getUserById(userId)
            .then((res) => {
                const d = (res as any)?.data ?? res as any;
                if (d) {
                    const roleVal = Array.isArray(d.roles) && d.roles.length > 0
                        ? String(d.roles[0]).toUpperCase()
                        : String(d.role ?? ROLES.STAFF).toUpperCase();
                    setUser({
                        id: d.user_id ?? d.users_id ?? d.id ?? userId,
                        fullName: d.profile?.full_name ?? d.full_name ?? "",
                        email: d.email ?? "",
                        role: roleVal as Role,
                        status: (d.status ?? "ACTIVE") as User["status"],
                        avatar: d.profile?.avatar_url ?? d.avatar ?? "",
                        createdAt: d.created_at ?? "",
                    } as User);
                    setFormData({
                        fullName: d.profile?.full_name ?? d.full_name ?? "",
                        email: d.email ?? "",
                        role: roleVal,
                        phone: d.phone ?? d.phone_number ?? "",
                        gender: d.gender === "MALE" ? "Nam" : d.gender === "FEMALE" ? "Nữ" : "Nam",
                        birthDate: d.dob ?? d.date_of_birth ?? "",
                        address: d.address ?? "",
                    });
                } else {
                    setLoadError("Không tìm thấy người dùng");
                }
            })
            .catch((err: any) => {
                setLoadError(err?.message || "Lấy thông tin người dùng thất bại");
            })
            .finally(() => setIsLoading(false));
    }, [userId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
        if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            newErrors.email = "Email không hợp lệ";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        setApiError(null);
        try {
            await updateUser(userId, {
                fullName: formData.fullName,
                email: formData.email,
                role: formData.role as Role,
                phoneNumber: formData.phone,
                gender: formData.gender === "Nam" ? "MALE" : formData.gender === "Nữ" ? "FEMALE" : undefined,
                dob: formData.birthDate || undefined,
                address: formData.address || undefined,
            } as any);
            router.push(`/admin/users/${userId}`);
        } catch (err: any) {
            setApiError(err?.message || "Cập nhật người dùng thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#687582]">Đang tải thông tin người dùng...</p>
            </div>
        );
    }

    if (loadError || !user) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_off</span>
                <p className="text-lg text-gray-500 mb-4">{loadError || "Không tìm thấy người dùng"}</p>
                <button onClick={() => router.back()} className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors">
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/users" className="hover:text-[#3C81C6] transition-colors">Người dùng</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <Link href={`/admin/users/${userId}`} className="hover:text-[#3C81C6] transition-colors">{user.fullName}</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Chỉnh sửa</span>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-black text-[#121417] dark:text-white">Chỉnh sửa người dùng</h1>
                    <p className="text-sm text-[#687582] dark:text-gray-400 mt-1">Cập nhật thông tin tài khoản người dùng</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {apiError && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <span className="material-symbols-outlined text-[18px] text-red-600">error</span>
                            <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                                className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.fullName ? "border-red-500" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all dark:text-white`}
                                placeholder="Nhập họ và tên" />
                            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange}
                                className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.email ? "border-red-500" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all dark:text-white`}
                                placeholder="example@ehealth.vn" />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Vai trò</label>
                            <select name="role" value={formData.role} onChange={handleChange}
                                className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white cursor-pointer">
                                {Object.entries(ROLES).map(([key, value]) => (
                                    <option key={key} value={value}>{ROLE_LABELS[value as Role]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Số điện thoại</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white"
                                placeholder="0901 234 567" />
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Giới tính</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}
                                className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white cursor-pointer">
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        {/* Birthdate */}
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Ngày sinh</label>
                            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange}
                                className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white" />
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Địa chỉ</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange}
                                className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white"
                                placeholder="Nhập địa chỉ" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-[#dde0e4] dark:border-[#2d353e]">
                        <button type="button" onClick={() => router.back()}
                            className="px-5 py-2.5 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                            Hủy bỏ
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">{saving ? "hourglass_empty" : "save"}</span>
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
