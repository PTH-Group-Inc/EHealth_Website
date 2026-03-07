"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Permission groups — Tương ứng bảng `permissions` (module, code, description)
const PERMISSION_MODULES = [
    {
        module: "PATIENT_MANAGEMENT", label: "Quản lý Bệnh nhân",
        permissions: [
            { code: "PATIENT_VIEW", label: "Xem hồ sơ bệnh nhân" },
            { code: "PATIENT_CREATE", label: "Tiếp nhận bệnh nhân mới" },
            { code: "PATIENT_UPDATE", label: "Cập nhật thông tin" },
            { code: "PATIENT_DELETE", label: "Xóa hồ sơ (soft delete)" },
            { code: "PATIENT_EXPORT", label: "Xuất danh sách" },
        ],
    },
    {
        module: "APPOINTMENT", label: "Lịch hẹn khám",
        permissions: [
            { code: "APPOINTMENT_VIEW", label: "Xem lịch hẹn" },
            { code: "APPOINTMENT_CREATE", label: "Đặt lịch hẹn" },
            { code: "APPOINTMENT_UPDATE", label: "Sửa / Dời lịch" },
            { code: "APPOINTMENT_CANCEL", label: "Hủy lịch hẹn" },
        ],
    },
    {
        module: "EMR", label: "Hồ sơ bệnh án (EMR)",
        permissions: [
            { code: "EMR_VIEW", label: "Xem bệnh án" },
            { code: "EMR_CREATE", label: "Tạo lượt khám mới" },
            { code: "EMR_DIAGNOSIS", label: "Chẩn đoán (ICD-10)" },
            { code: "EMR_SIGN", label: "Ký số bệnh án" },
            { code: "EMR_EXPORT", label: "Xuất bệnh án" },
        ],
    },
    {
        module: "CLINICAL_EXAM", label: "Khám lâm sàng & Sinh hiệu",
        permissions: [
            { code: "VITAL_SIGNS_VIEW", label: "Xem sinh hiệu" },
            { code: "VITAL_SIGNS_RECORD", label: "Ghi nhận sinh hiệu" },
            { code: "CLINICAL_EXAM_VIEW", label: "Xem khám lâm sàng" },
            { code: "CLINICAL_EXAM_WRITE", label: "Ghi khám lâm sàng" },
        ],
    },
    {
        module: "MEDICAL_ORDER", label: "Chỉ định CLS (Xét nghiệm, CĐHA)",
        permissions: [
            { code: "ORDER_VIEW", label: "Xem chỉ định" },
            { code: "ORDER_CREATE", label: "Tạo chỉ định" },
            { code: "ORDER_RESULT_VIEW", label: "Xem kết quả" },
            { code: "ORDER_RESULT_WRITE", label: "Nhập kết quả" },
        ],
    },
    {
        module: "PRESCRIPTION", label: "Kê đơn thuốc",
        permissions: [
            { code: "PRESCRIPTION_VIEW", label: "Xem đơn thuốc" },
            { code: "PRESCRIPTION_CREATE", label: "Kê đơn mới" },
            { code: "PRESCRIPTION_CANCEL", label: "Hủy đơn thuốc" },
        ],
    },
    {
        module: "PHARMACY", label: "Quản lý Kho thuốc & Cấp phát",
        permissions: [
            { code: "DRUG_VIEW", label: "Xem danh mục thuốc" },
            { code: "DRUG_MANAGE", label: "Quản lý danh mục" },
            { code: "INVENTORY_VIEW", label: "Xem tồn kho" },
            { code: "INVENTORY_IMPORT", label: "Nhập kho" },
            { code: "DISPENSING_VIEW", label: "Xem phiếu cấp phát" },
            { code: "DISPENSING_EXECUTE", label: "Thực hiện cấp phát" },
        ],
    },
    {
        module: "BILLING", label: "Thanh toán & Thu ngân",
        permissions: [
            { code: "INVOICE_VIEW", label: "Xem hóa đơn" },
            { code: "INVOICE_CREATE", label: "Tạo hóa đơn" },
            { code: "PAYMENT_PROCESS", label: "Xử lý thanh toán" },
            { code: "REFUND_PROCESS", label: "Xử lý hoàn tiền" },
            { code: "CASHIER_SHIFT", label: "Quản lý ca thu ngân" },
        ],
    },
    {
        module: "TELEMEDICINE", label: "Khám từ xa (Telemedicine)",
        permissions: [
            { code: "TELE_VIEW", label: "Xem lịch khám từ xa" },
            { code: "TELE_START", label: "Bắt đầu cuộc gọi" },
            { code: "TELE_CHAT", label: "Chat với bệnh nhân" },
        ],
    },
    {
        module: "EHR", label: "Hồ sơ Sức khỏe Điện tử (EHR)",
        permissions: [
            { code: "EHR_VIEW", label: "Xem timeline sức khỏe" },
            { code: "EHR_SHARE", label: "Chia sẻ hồ sơ" },
            { code: "EHR_SYNC", label: "Đồng bộ dữ liệu ngoài" },
        ],
    },
    {
        module: "REPORT", label: "Báo cáo & Thống kê",
        permissions: [
            { code: "REPORT_VIEW", label: "Xem báo cáo" },
            { code: "REPORT_EXPORT", label: "Xuất báo cáo" },
            { code: "REVENUE_VIEW", label: "Xem doanh thu" },
        ],
    },
    {
        module: "USER_MANAGEMENT", label: "Quản lý Người dùng & Phân quyền",
        permissions: [
            { code: "USER_VIEW", label: "Xem danh sách" },
            { code: "USER_CREATE", label: "Tạo tài khoản" },
            { code: "USER_UPDATE", label: "Sửa tài khoản" },
            { code: "USER_DELETE", label: "Xóa / Khóa tài khoản" },
            { code: "ROLE_VIEW", label: "Xem vai trò" },
            { code: "ROLE_MANAGE", label: "Quản lý vai trò & quyền" },
        ],
    },
    {
        module: "SYSTEM", label: "Hệ thống & Cài đặt",
        permissions: [
            { code: "SETTINGS_VIEW", label: "Xem cài đặt" },
            { code: "SETTINGS_MANAGE", label: "Thay đổi cài đặt" },
            { code: "AUDIT_LOG_VIEW", label: "Xem nhật ký hoạt động" },
            { code: "MASTER_DATA_MANAGE", label: "Quản lý danh mục nền" },
            { code: "NOTIFICATION_MANAGE", label: "Quản lý thông báo" },
        ],
    },
];

// Role templates for quick setup
const ROLE_TEMPLATES = [
    { label: "Trống (không có quyền)", permissions: [] as string[] },
    { label: "Bác sĩ (mẫu)", permissions: ["PATIENT_VIEW", "APPOINTMENT_VIEW", "APPOINTMENT_CREATE", "EMR_VIEW", "EMR_CREATE", "EMR_DIAGNOSIS", "EMR_SIGN", "VITAL_SIGNS_VIEW", "CLINICAL_EXAM_VIEW", "CLINICAL_EXAM_WRITE", "ORDER_VIEW", "ORDER_CREATE", "ORDER_RESULT_VIEW", "PRESCRIPTION_VIEW", "PRESCRIPTION_CREATE", "TELE_VIEW", "TELE_START", "TELE_CHAT", "EHR_VIEW", "REPORT_VIEW"] },
    { label: "Dược sĩ (mẫu)", permissions: ["DRUG_VIEW", "DRUG_MANAGE", "INVENTORY_VIEW", "INVENTORY_IMPORT", "DISPENSING_VIEW", "DISPENSING_EXECUTE", "PRESCRIPTION_VIEW"] },
    { label: "Lễ tân (mẫu)", permissions: ["PATIENT_VIEW", "PATIENT_CREATE", "PATIENT_UPDATE", "APPOINTMENT_VIEW", "APPOINTMENT_CREATE", "APPOINTMENT_UPDATE", "APPOINTMENT_CANCEL", "INVOICE_VIEW", "INVOICE_CREATE", "PAYMENT_PROCESS"] },
    { label: "Toàn quyền (Admin)", permissions: PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => p.code)) },
];

export default function NewRolePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [fd, setFd] = useState({ name: "", code: "", description: "", isSystem: false });
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [expandedModules, setExpandedModules] = useState<string[]>(PERMISSION_MODULES.map((m) => m.module));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFd((p) => ({ ...p, [name]: value }));
    };

    const togglePermission = (code: string) => {
        setSelectedPermissions((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
    };

    const toggleModule = (modulePerms: string[]) => {
        const allSelected = modulePerms.every((p) => selectedPermissions.includes(p));
        if (allSelected) {
            setSelectedPermissions((prev) => prev.filter((p) => !modulePerms.includes(p)));
        } else {
            setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modulePerms])));
        }
    };

    const toggleModuleExpand = (module: string) => {
        setExpandedModules((prev) => prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]);
    };

    const applyTemplate = (permissions: string[]) => {
        setSelectedPermissions([...permissions]);
    };

    const totalPermissions = PERMISSION_MODULES.reduce((sum, m) => sum + m.permissions.length, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fd.name.trim() || !fd.code.trim()) { alert("Vui lòng nhập tên và mã vai trò"); return; }
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Đã tạo vai trò thành công!");
        router.push("/admin/users/roles");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/users/roles" className="hover:text-[#3C81C6]">Phân quyền & Vai trò</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Thêm vai trò mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Role info */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                            <div className="p-5 border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <h2 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">badge</span> Thông tin vai trò
                                </h2>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên vai trò *</label>
                                    <input type="text" name="name" value={fd.name} onChange={handleChange} placeholder="VD: Kỹ thuật viên xét nghiệm" className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mã vai trò (code) *</label>
                                    <input type="text" name="code" value={fd.code} onChange={(e) => setFd((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/\s+/g, '_') }))} placeholder="VD: LAB_TECHNICIAN" className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white font-mono" />
                                    <p className="text-xs text-[#687582] mt-1">Mã duy nhất, viết hoa, dùng dấu _</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mô tả</label>
                                    <textarea name="description" value={fd.description} onChange={handleChange} rows={3} placeholder="Mô tả chức năng và phạm vi của vai trò..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={fd.isSystem} onChange={(e) => setFd((p) => ({ ...p, isSystem: e.target.checked }))} />
                                        <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                                    </label>
                                    <div>
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Vai trò hệ thống</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Không cho phép admin khác sửa/xóa</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Templates */}
                        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                            <div className="p-5 border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <h2 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">auto_fix_high</span> Áp dụng mẫu nhanh
                                </h2>
                            </div>
                            <div className="p-4 space-y-2">
                                {ROLE_TEMPLATES.map((tmpl, idx) => (
                                    <button key={idx} type="button" onClick={() => applyTemplate(tmpl.permissions)}
                                        className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#3C81C6]/40 hover:bg-[#3C81C6]/5 transition-all text-sm font-medium text-[#121417] dark:text-gray-300 flex items-center justify-between group">
                                        <span>{tmpl.label}</span>
                                        <span className="text-xs text-[#687582] group-hover:text-[#3C81C6]">{tmpl.permissions.length} quyền</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-gradient-to-br from-[#3C81C6] to-[#2a6da8] rounded-xl p-5 text-white shadow-lg shadow-blue-200 dark:shadow-none">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-[20px]">key</span>
                                <span className="text-sm font-bold">Tổng kết quyền</span>
                            </div>
                            <div className="text-3xl font-black">{selectedPermissions.length}<span className="text-lg font-normal text-blue-200"> / {totalPermissions}</span></div>
                            <p className="text-sm text-blue-100 mt-1">quyền hạn đã chọn</p>
                            <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                                <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${(selectedPermissions.length / totalPermissions) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Right: Permission matrix */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                        <div className="p-5 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">admin_panel_settings</span> Ma trận phân quyền
                                </h2>
                                <p className="text-xs text-[#687582] mt-0.5">Chọn các quyền hạn cho vai trò tương ứng (theo module)</p>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setSelectedPermissions([])} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-[#687582] rounded-lg hover:bg-gray-200 transition-colors font-medium">Bỏ tất cả</button>
                                <button type="button" onClick={() => setSelectedPermissions(PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => p.code)))} className="text-xs px-3 py-1.5 bg-[#3C81C6]/10 text-[#3C81C6] rounded-lg hover:bg-[#3C81C6]/20 transition-colors font-medium">Chọn tất cả</button>
                            </div>
                        </div>
                        <div className="overflow-auto max-h-[700px] divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                            {PERMISSION_MODULES.map((mod) => {
                                const modPerms = mod.permissions.map((p) => p.code);
                                const selectedCount = modPerms.filter((c) => selectedPermissions.includes(c)).length;
                                const allSelected = selectedCount === modPerms.length;
                                const isExpanded = expandedModules.includes(mod.module);

                                return (
                                    <div key={mod.module}>
                                        <div className="flex items-center gap-3 px-5 py-3 bg-[#f8fafc] dark:bg-[#13191f] cursor-pointer select-none hover:bg-[#f0f4f8] dark:hover:bg-[#1a2028] transition-colors"
                                            onClick={() => toggleModuleExpand(mod.module)}>
                                            <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" className="sr-only peer" checked={allSelected} onChange={() => toggleModule(modPerms)} />
                                                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-md peer peer-checked:bg-[#3C81C6] flex items-center justify-center after:content-['✓'] after:text-white after:text-xs after:opacity-0 peer-checked:after:opacity-100" />
                                            </label>
                                            <div className="flex-1">
                                                <span className="text-sm font-bold text-[#121417] dark:text-white">{mod.label}</span>
                                                <span className="ml-2 text-xs text-[#687582]">({selectedCount}/{modPerms.length})</span>
                                            </div>
                                            <span className={`material-symbols-outlined text-[16px] text-[#687582] transition-transform ${isExpanded ? "rotate-180" : ""}`}>expand_more</span>
                                        </div>
                                        {isExpanded && (
                                            <div className="px-5 py-2 space-y-1">
                                                {mod.permissions.map((perm) => (
                                                    <label key={perm.code} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                                                        <input type="checkbox" checked={selectedPermissions.includes(perm.code)} onChange={() => togglePermission(perm.code)}
                                                            className="w-4 h-4 text-[#3C81C6] bg-gray-100 border-gray-300 rounded focus:ring-[#3C81C6] dark:bg-gray-700 dark:border-gray-600" />
                                                        <div className="flex-1">
                                                            <span className="text-sm text-[#121417] dark:text-gray-300">{perm.label}</span>
                                                            <span className="ml-2 text-[10px] font-mono text-[#3C81C6]/60 bg-[#3C81C6]/5 px-1.5 py-0.5 rounded">{perm.code}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom action bar */}
                <div className="flex items-center justify-end gap-3 pt-6">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                    <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                        {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Tạo vai trò</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
