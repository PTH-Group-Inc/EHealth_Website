"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import { UI_TEXT } from "@/constants/ui-text";
import type { User } from "@/types";

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (user: Partial<User>) => void;
    initialData?: User;
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
        fullName: initialData?.fullName || "",
        email: initialData?.email || "",
        role: initialData?.role || ROLES.RECEPTIONIST,
        password: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Vui lòng nhập họ tên";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Vui lòng nhập email";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }

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
            role: formData.role as Role,
        });

        // Reset form
        setFormData({
            fullName: "",
            email: "",
            role: ROLES.RECEPTIONIST,
            password: "",
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
            title={mode === "create" ? "Thêm người dùng mới" : "Chỉnh sửa người dùng"}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.fullName
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-200 dark:border-gray-700 focus:ring-[#3C81C6]"
                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all dark:text-white`}
                        placeholder="Nhập họ và tên"
                    />
                    {errors.fullName && (
                        <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.email
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-200 dark:border-gray-700 focus:ring-[#3C81C6]"
                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all dark:text-white`}
                        placeholder="example@ehealth.vn"
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                    )}
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Vai trò
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6] focus:ring-opacity-20 transition-all dark:text-white cursor-pointer"
                    >
                        {Object.entries(ROLES).map(([key, value]) => (
                            <option key={key} value={value}>
                                {ROLE_LABELS[value as Role]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Password (only for create mode) */}
                {mode === "create" && (
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.password
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-200 dark:border-gray-700 focus:ring-[#3C81C6]"
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all dark:text-white`}
                            placeholder="Nhập mật khẩu"
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        {UI_TEXT.COMMON.CANCEL}
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2.5 text-sm font-bold text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all"
                    >
                        {mode === "create" ? UI_TEXT.COMMON.CREATE : UI_TEXT.COMMON.SAVE}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
