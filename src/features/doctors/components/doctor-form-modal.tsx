"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import { UI_TEXT } from "@/constants/ui-text";
import { MOCK_DEPARTMENTS } from "@/lib/mock-data/admin";
import type { Doctor } from "@/types";

interface DoctorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (doctor: Partial<Doctor>) => void;
    initialData?: Doctor;
    mode: "create" | "edit";
}

export function DoctorFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
}: DoctorFormModalProps) {
    const departments = MOCK_DEPARTMENTS;

    const [formData, setFormData] = useState({
        fullName: initialData?.fullName || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        departmentId: initialData?.departmentId || departments[0]?.id || "",
        specialization: initialData?.specialization || "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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

        if (!formData.specialization.trim()) {
            newErrors.specialization = "Vui lòng nhập chuyên khoa";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const selectedDept = departments.find((d) => d.id === formData.departmentId);

        onSubmit({
            ...initialData,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            departmentId: formData.departmentId,
            departmentName: selectedDept?.name || "",
            specialization: formData.specialization,
        });

        setFormData({
            fullName: "",
            email: "",
            phone: "",
            departmentId: departments[0]?.id || "",
            specialization: "",
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "create" ? "Thêm bác sĩ mới" : "Chỉnh sửa thông tin bác sĩ"}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                            className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.fullName ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white`}
                            placeholder="BS. Nguyễn Văn A"
                        />
                        {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
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
                            className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.email ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white`}
                            placeholder="doctor@ehealth.vn"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Số điện thoại
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white"
                            placeholder="0901234567"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Khoa
                        </label>
                        <select
                            name="departmentId"
                            value={formData.departmentId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white cursor-pointer"
                        >
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Specialization */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Chuyên khoa <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.specialization ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white`}
                        placeholder="Tim mạch, Nhi khoa, Thần kinh..."
                    />
                    {errors.specialization && <p className="mt-1 text-xs text-red-500">{errors.specialization}</p>}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <button
                        type="button"
                        onClick={onClose}
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
