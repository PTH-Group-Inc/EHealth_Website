"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { Doctor } from "@/types";
import { staffService } from "@/services/staffService";
import { getDepartments, unwrapDepartments } from "@/services/departmentService";

export default function EditDoctorPage() {
    const router = useRouter();
    const params = useParams();
    const doctorId = params.id as string;

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        departmentId: "",
        specialization: "",
        experience: "",
        gender: "Nam",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        getDepartments({ limit: 100 })
            .then((res: any) => {
                const items = unwrapDepartments(res);
                if (items.length > 0) {
                    setDepartments(items.map(d => ({ id: d.id, name: d.name })));
                }
            })
            .catch(() => {});

        if (!doctorId) return;
        setLoading(true);
        staffService.getById(doctorId)
            .then((res: any) => {
                const d = res?.data ?? res;
                if (d && (d.id || d.staff_id)) {
                    const doc = {
                        id: d.id ?? d.staff_id ?? doctorId,
                        fullName: d.full_name ?? "",
                        email: d.email ?? "",
                        phone: d.phone_number ?? d.phone ?? "",
                        departmentId: d.department_id ?? d.department?.id ?? "",
                        specialization: d.specialization ?? "",
                        experience: d.experience ?? 0,
                        gender: d.gender ?? "Nam",
                    } as unknown as Doctor;
                    setDoctor(doc);
                    setFormData({
                        fullName: doc.fullName || "",
                        email: doc.email || "",
                        phone: doc.phone || "",
                        departmentId: doc.departmentId || "",
                        specialization: doc.specialization || "",
                        experience: String(doc.experience || 0),
                        gender: (d.gender ?? "Nam") as string,
                    });
                }
            })
            .catch(() => {
                setDoctor(null);
            })
            .finally(() => setLoading(false));
    }, [doctorId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
        if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email không hợp lệ";
        if (!formData.departmentId) newErrors.departmentId = "Vui lòng chọn chuyên khoa";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await staffService.update(doctorId, {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                departmentId: formData.departmentId,
                specialization: formData.specialization,
                experience: Number(formData.experience) || 0,
            } as any);
        } catch { /* keep going */ }
        setSaving(false);
        router.push(`/admin/doctors/${doctorId}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin mb-4" />
                <p className="text-sm text-[#687582]">Đang tải thông tin bác sĩ...</p>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_off</span>
                <p className="text-lg text-gray-500 mb-4">Không tìm thấy bác sĩ</p>
                <button onClick={() => router.back()} className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors">Quay lại</button>
            </div>
        );
    }

    return (
        <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#687582]">
                <Link href="/admin/doctors" className="hover:text-[#3C81C6] transition-colors">Quản lý Bác sĩ</Link>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <Link href={`/admin/doctors/${doctorId}`} className="hover:text-[#3C81C6] transition-colors">{doctor.fullName}</Link>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                <span className="text-[#121417] dark:text-white font-medium">Chỉnh sửa</span>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-black text-[#121417] dark:text-white">Chỉnh sửa thông tin Bác sĩ</h1>
                    <p className="text-sm text-[#687582] dark:text-gray-400 mt-1">Cập nhật thông tin hồ sơ bác sĩ {doctor.fullName}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Thông tin cá nhân */}
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">badge</span>
                            Thông tin cá nhân
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Họ và tên <span className="text-red-500">*</span></label>
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                                    className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.fullName ? "border-red-500" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all dark:text-white`} />
                                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Email <span className="text-red-500">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange}
                                    className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.email ? "border-red-500" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all dark:text-white`} />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Số điện thoại</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                    className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Giới tính</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}
                                    className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white cursor-pointer">
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin chuyên môn */}
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">stethoscope</span>
                            Thông tin chuyên môn
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Chuyên khoa <span className="text-red-500">*</span></label>
                                <select name="departmentId" value={formData.departmentId} onChange={handleChange}
                                    className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.departmentId ? "border-red-500" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white cursor-pointer`}>
                                    <option value="">Chọn chuyên khoa</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                                {errors.departmentId && <p className="mt-1 text-xs text-red-500">{errors.departmentId}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Chuyên ngành</label>
                                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange}
                                    className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl  focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Kinh nghiệm (năm)</label>
                                <input type="number" name="experience" value={formData.experience} onChange={handleChange} min="0" max="50"
                                    className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white" />
                            </div>
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
