"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Medicine {
    name: string;
    genericName: string;
    category: string;
    unit: string;
    manufacturer: string;
    price: string;
    quantity: string;
    minStock: string;
    description: string;
    dosageForm: string;
    strength: string;
    expiryDate: string;
}

const CATEGORIES = [
    "Kháng sinh", "Giảm đau", "Hạ sốt", "Tim mạch", "Tiêu hóa",
    "Thần kinh", "Hô hấp", "Da liễu", "Vitamin & khoáng chất", "Khác",
];

const DOSAGE_FORMS = [
    "Viên nén", "Viên nang", "Dung dịch", "Hỗn dịch", "Thuốc tiêm",
    "Thuốc mỡ", "Thuốc nhỏ mắt", "Thuốc xịt", "Thuốc bột", "Khác",
];

export default function NewMedicinePage() {
    const router = useRouter();
    const [formData, setFormData] = useState<Medicine>({
        name: "", genericName: "", category: "Kháng sinh", unit: "Viên",
        manufacturer: "", price: "", quantity: "", minStock: "",
        description: "", dosageForm: "Viên nén", strength: "", expiryDate: "",
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
        if (!formData.name.trim()) newErrors.name = "Vui lòng nhập tên thuốc";
        if (!formData.genericName.trim()) newErrors.genericName = "Vui lòng nhập tên hoạt chất";
        if (!formData.manufacturer.trim()) newErrors.manufacturer = "Vui lòng nhập nhà sản xuất";
        if (!formData.price || isNaN(Number(formData.price))) newErrors.price = "Giá không hợp lệ";
        if (!formData.quantity || isNaN(Number(formData.quantity))) newErrors.quantity = "Số lượng không hợp lệ";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Thêm thuốc thành công!");
        router.push("/admin/medicines");
    };

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/medicines" className="hover:text-[#3C81C6] transition-colors">Danh mục thuốc</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Thêm thuốc mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">medication</span>
                        Thêm thuốc mới
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">Nhập thông tin chi tiết của thuốc cần thêm vào danh mục</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Thông tin cơ bản */}
                        <div className="md:col-span-2 lg:col-span-3">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">info</span>
                                Thông tin cơ bản
                            </h3>
                        </div>

                        <Field label="Tên thuốc *" name="name" value={formData.name} onChange={handleChange} error={errors.name} placeholder="VD: Amoxicillin 500mg" icon="medication" />
                        <Field label="Tên hoạt chất *" name="genericName" value={formData.genericName} onChange={handleChange} error={errors.genericName} placeholder="VD: Amoxicillin" icon="science" />
                        <Field label="Nhà sản xuất *" name="manufacturer" value={formData.manufacturer} onChange={handleChange} error={errors.manufacturer} placeholder="VD: Pymepharco" icon="factory" />

                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Nhóm thuốc</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Dạng bào chế</label>
                            <select name="dosageForm" value={formData.dosageForm} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                {DOSAGE_FORMS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <Field label="Hàm lượng" name="strength" value={formData.strength} onChange={handleChange} placeholder="VD: 500mg" icon="scale" />

                        {/* Kho & Giá */}
                        <div className="md:col-span-2 lg:col-span-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">inventory_2</span>
                                Kho hàng & Giá
                            </h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Đơn vị tính</label>
                            <select name="unit" value={formData.unit} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                {["Viên", "Hộp", "Chai", "Ống", "Gói", "Tuýp", "Lọ"].map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>

                        <Field label="Giá bán (VNĐ) *" name="price" type="number" value={formData.price} onChange={handleChange} error={errors.price} placeholder="VD: 5000" icon="payments" />
                        <Field label="Số lượng nhập *" name="quantity" type="number" value={formData.quantity} onChange={handleChange} error={errors.quantity} placeholder="VD: 100" icon="inventory" />
                        <Field label="Tồn kho tối thiểu" name="minStock" type="number" value={formData.minStock} onChange={handleChange} placeholder="VD: 20" icon="warning" />
                        <Field label="Hạn sử dụng" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleChange} icon="event" />

                        {/* Mô tả */}
                        <div className="md:col-span-2 lg:col-span-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mô tả / Ghi chú</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Chỉ định, chống chỉ định, lưu ý sử dụng..."
                                className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 resize-none"
                            />
                        </div>
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
                                <><span className="material-symbols-outlined text-[18px]">save</span> Thêm thuốc</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

function Field({ label, name, type = "text", value, onChange, error, placeholder, icon }: {
    label: string; name: string; type?: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string; placeholder?: string; icon?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label>
            <div className="relative">
                {icon && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">{icon}</span></span>}
                <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
                    className={`w-full py-2.5 ${icon ? "pl-10" : "pl-4"} pr-4 text-sm bg-gray-50 dark:bg-gray-800 border ${error ? "border-red-400" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 transition-colors`}
                />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
