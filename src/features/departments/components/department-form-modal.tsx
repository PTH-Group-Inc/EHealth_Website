"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { UI_TEXT } from "@/constants/ui-text";
import { DEPARTMENT_STATUS } from "@/constants/status";
import type { Department } from "@/types";

interface DepartmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (department: Partial<Department>) => void;
    initialData?: Department;
    mode: "create" | "edit";
}

const DEPARTMENT_ICONS = [
    { icon: "cardiology", label: "Tim mạch" },
    { icon: "psychology", label: "Thần kinh" },
    { icon: "healing", label: "Ngoại khoa" },
    { icon: "child_care", label: "Nhi khoa" },
    { icon: "pregnant_woman", label: "Sản khoa" },
    { icon: "visibility", label: "Mắt" },
    { icon: "dentistry", label: "Răng hàm mặt" },
    { icon: "dermotology", label: "Da liễu" },
    { icon: "emergency", label: "Cấp cứu" },
    { icon: "local_hospital", label: "Nội khoa" },
];

export function DepartmentFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
}: DepartmentFormModalProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
        icon: initialData?.icon || "local_hospital",
        location: initialData?.location || "",
        capacity: initialData?.capacity || 50,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "Vui lòng nhập tên khoa";
        }

        if (!formData.location.trim()) {
            newErrors.location = "Vui lòng nhập vị trí";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSubmit({
            ...initialData,
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            location: formData.location,
            capacity: formData.capacity,
        });

        setFormData({
            name: "",
            description: "",
            icon: "local_hospital",
            location: "",
            capacity: 50,
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "create" ? "Thêm khoa mới" : "Chỉnh sửa thông tin khoa"}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Tên khoa <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.name ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white`}
                        placeholder="Khoa Tim mạch"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Mô tả
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white resize-none"
                        placeholder="Mô tả về khoa..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Icon */}
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Biểu tượng
                        </label>
                        <select
                            name="icon"
                            value={formData.icon}
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white cursor-pointer"
                        >
                            {DEPARTMENT_ICONS.map((item) => (
                                <option key={item.icon} value={item.icon}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Vị trí <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.location ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white`}
                            placeholder="Tầng 3, Tòa A"
                        />
                        {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                    </div>
                </div>

                {/* Capacity */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Sức chứa (bệnh nhân/ngày)
                    </label>
                    <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        min="1"
                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white"
                        placeholder="50"
                    />
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
