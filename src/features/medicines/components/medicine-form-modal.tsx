"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { UI_TEXT } from "@/constants/ui-text";
import { MEDICINE_STATUS } from "@/constants/status";
import type { Medicine } from "@/types";

interface MedicineFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (medicine: Partial<Medicine>) => void;
    initialData?: Medicine;
    mode: "create" | "edit";
}

const MEDICINE_CATEGORIES = [
    "Kháng sinh",
    "Giảm đau",
    "Vitamin & Khoáng chất",
    "Hô hấp",
    "Tiêu hóa",
    "Tim mạch",
    "Thần kinh",
    "Da liễu",
];

export function MedicineFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
}: MedicineFormModalProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        activeIngredient: initialData?.activeIngredient || "",
        unit: initialData?.unit || "Hộp",
        unitDetail: initialData?.unitDetail || "",
        price: initialData?.price || 0,
        stock: initialData?.stock || 0,
        category: initialData?.category || MEDICINE_CATEGORIES[0],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
            newErrors.name = "Vui lòng nhập tên thuốc";
        }

        if (!formData.activeIngredient.trim()) {
            newErrors.activeIngredient = "Vui lòng nhập hoạt chất";
        }

        if (formData.price <= 0) {
            newErrors.price = "Giá phải lớn hơn 0";
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
            activeIngredient: formData.activeIngredient,
            unit: formData.unit,
            unitDetail: formData.unitDetail,
            price: formData.price,
            stock: formData.stock,
            category: formData.category,
            stockLevel: formData.stock > 100 ? "HIGH" : formData.stock > 50 ? "NORMAL" : formData.stock > 0 ? "LOW" : "OUT",
        });

        setFormData({
            name: "",
            activeIngredient: "",
            unit: "Hộp",
            unitDetail: "",
            price: 0,
            stock: 0,
            category: MEDICINE_CATEGORIES[0],
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "create" ? "Thêm thuốc mới" : "Chỉnh sửa thông tin thuốc"}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Tên thuốc <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.name ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white`}
                            placeholder="Amoxicillin 500mg"
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Active Ingredient */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Hoạt chất <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="activeIngredient"
                            value={formData.activeIngredient}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.activeIngredient ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white`}
                            placeholder="Amoxicillin trihydrate"
                        />
                        {errors.activeIngredient && <p className="mt-1 text-xs text-red-500">{errors.activeIngredient}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Danh mục
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white cursor-pointer"
                        >
                            {MEDICINE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Unit */}
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Đơn vị tính
                        </label>
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white cursor-pointer"
                        >
                            <option value="Hộp">Hộp</option>
                            <option value="Lọ">Lọ</option>
                            <option value="Chai">Chai</option>
                            <option value="Viên">Viên</option>
                            <option value="Ống">Ống</option>
                            <option value="Gói">Gói</option>
                        </select>
                    </div>

                    {/* Unit Detail */}
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Quy cách
                        </label>
                        <input
                            type="text"
                            name="unitDetail"
                            value={formData.unitDetail}
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white"
                            placeholder="Hộp (10 vỉ x 10 viên)"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Giá bán (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.price ? "border-red-500" : "border-gray-200 dark:border-gray-700"
                                } rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white`}
                            placeholder="85000"
                            min="0"
                        />
                        {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                    </div>

                    {/* Stock */}
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                            Số lượng tồn kho
                        </label>
                        <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white"
                            placeholder="100"
                            min="0"
                        />
                    </div>
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
