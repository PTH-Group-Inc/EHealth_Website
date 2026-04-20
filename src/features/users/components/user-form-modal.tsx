"use client";

import { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import { UI_TEXT } from "@/constants/ui-text";
import type { User } from "@/types";

interface ExtendedUser extends User {
    dob?: string;
    gender?: string;
    identity_card_number?: string;
    address?: string;
}

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (user: Partial<ExtendedUser> & { file?: File }) => void;
    initialData?: ExtendedUser;
    mode: "create" | "edit";
}

export function UserFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
}: UserFormModalProps) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        role: ROLES.STAFF as string,
        password: "",
        dob: "",
        gender: "MALE",
        identity_card_number: "",
        address: "",
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                fullName: initialData?.fullName || "",
                email: initialData?.email || "",
                phone: initialData?.phone || "",
                role: initialData?.role || (ROLES.STAFF as string),
                password: "",
                dob: initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : "",
                gender: initialData?.gender || "MALE",
                identity_card_number: initialData?.identity_card_number || "",
                address: initialData?.address || "",
            });
            setAvatarPreview(initialData?.avatar || null);
            setAvatarFile(null);
            setErrors({});
        }
    }, [isOpen, initialData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, avatar: "Kích thước ảnh tối đa 5MB" }));
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, avatar: "" }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
        if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email không hợp lệ";

        if (mode === "create" && !formData.password) {
            newErrors.password = "Vui lòng nhập mật khẩu";
        } else if (mode === "create" && formData.password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSubmit({
            ...initialData,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role as Role,
            dob: formData.dob || undefined,
            gender: formData.gender,
            identity_card_number: formData.identity_card_number || undefined,
            address: formData.address || undefined,
            ...(formData.password ? { password: formData.password } : {}),
            file: avatarFile || undefined,
            avatar: avatarPreview || undefined
        });

        onClose();
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={mode === "create" ? "Thêm Người Dùng" : "Chỉnh Sửa Hồ Sơ"}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8 pb-2 md:items-start">
                {/* Left Sidebar: Avatar & Quick Info */}
                <div className="w-full md:w-[32%] flex flex-col items-center p-6 bg-gray-50/50 dark:bg-[#161b22]/30 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] md:sticky md:top-0">
                    <h3 className="w-full text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-widest">
                        Ảnh Đại Diện
                    </h3>
                    <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-[#1e242b] shadow-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">person</span>
                            )}
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                                <span className="material-symbols-outlined text-2xl mb-1">photo_camera</span>
                                <span className="text-[10px] font-medium tracking-wide">Thay đổi</span>
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-[#3C81C6] text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-[#1e242b] hover:bg-[#2a6da8] transition-colors">
                            <span className="material-symbols-outlined text-[16px] leading-none">edit</span>
                        </div>
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/webp" 
                        className="hidden" 
                    />
                    
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed px-4">
                        Tỉ lệ 1:1.<br/>Cho phép định dạng JPG, PNG, WEBP (Tối đa 5MB).
                    </p>
                    {errors.avatar && <p className="text-xs text-red-500 mt-[-10px] mb-4 text-center">{errors.avatar}</p>}

                    <div className="w-full space-y-4 pt-6 mt-auto border-t border-[#dde0e4] dark:border-[#2d353e]">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-widest">
                                Phân Quyền Hệ Thống
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-3 text-sm font-semibold text-[#121417] dark:text-white bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6] focus:border-[#3C81C6] shadow-sm transition-all cursor-pointer appearance-none"
                                style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23687582%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                            >
                                {Object.entries(ROLES).map(([key, value]) => (
                                    <option key={key} value={value}>
                                        {ROLE_LABELS[value as Role]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="w-full md:w-[68%] flex flex-col pt-1">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-[#121417] dark:text-white">Thông tin cá nhân</h3>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Hồ sơ định danh và phương thức liên lạc</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 mb-auto">
                        <div className="md:col-span-2">
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Họ và Tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Ví dụ: Nguyễn Văn A"
                                className={`w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border ${errors.fullName ? "border-red-500 focus:ring-red-500" : "border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6]"} rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white`}
                            />
                            {errors.fullName && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.fullName}</p>}
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Số Điện Thoại
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="0901 234 567"
                                className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6] rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="example@ehealth.vn"
                                className={`w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border ${errors.email ? "border-red-500 focus:ring-red-500" : "border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6]"} rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white`}
                            />
                            {errors.email && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Giới Tính
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-5 py-3.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6] focus:border-[#3C81C6] text-sm text-[#121417] dark:text-white shadow-sm transition-all cursor-pointer appearance-none"
                                style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23687582%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                            >
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Chưa xác định</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Ngày Sinh
                            </label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6] rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                CMND / CCCD
                            </label>
                            <input
                                type="text"
                                name="identity_card_number"
                                value={formData.identity_card_number}
                                onChange={handleChange}
                                placeholder="Nhập số CMND hoặc thẻ Căn cước"
                                className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6] rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Địa Chỉ
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Nhập địa chỉ đầy đủ (Số nhà, Phường/Xã, Quận/Huyện...)"
                                className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6] rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white"
                            />
                        </div>

                        {mode === "create" && (
                            <div className="md:col-span-2 mt-2 pt-6 border-t border-[#dde0e4] dark:border-[#2d353e]">
                                <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                    Mật Khẩu <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Nhập tối thiểu 6 ký tự bảo mật"
                                        className={`w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border ${errors.password ? "border-red-500 focus:ring-red-500" : "border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6]"} rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white`}
                                    />
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">lock</span>
                                </div>
                                {errors.password && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.password}</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-[#dde0e4] dark:border-[#2d353e]">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2.5 text-sm font-semibold text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            {UI_TEXT.COMMON.CANCEL}
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#3C81C6] to-[#4A90E2] hover:from-[#2a6da8] hover:to-[#387DCB] rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                        >
                            {mode === "create" ? UI_TEXT.COMMON.CREATE : UI_TEXT.COMMON.SAVE}
                            <span className="material-symbols-outlined text-[18px]">
                                {mode === "create" ? "person_add" : "check_circle"}
                            </span>
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
