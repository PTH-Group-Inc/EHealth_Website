"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import { UI_TEXT } from "@/constants/ui-text";

interface Permission {
    id: string;
    name: string;
    description: string;
}

const PERMISSIONS: Permission[] = [
    { id: "users.view", name: "Xem người dùng", description: "Xem danh sách người dùng" },
    { id: "users.create", name: "Tạo người dùng", description: "Thêm người dùng mới" },
    { id: "users.edit", name: "Sửa người dùng", description: "Chỉnh sửa thông tin người dùng" },
    { id: "users.delete", name: "Xóa người dùng", description: "Xóa người dùng khỏi hệ thống" },
    { id: "doctors.view", name: "Xem bác sĩ", description: "Xem danh sách bác sĩ" },
    { id: "doctors.manage", name: "Quản lý bác sĩ", description: "Thêm, sửa, xóa bác sĩ" },
    { id: "departments.view", name: "Xem chuyên khoa", description: "Xem danh sách chuyên khoa" },
    { id: "departments.manage", name: "Quản lý chuyên khoa", description: "Thêm, sửa, xóa chuyên khoa" },
    { id: "medicines.view", name: "Xem thuốc", description: "Xem danh sách thuốc" },
    { id: "medicines.manage", name: "Quản lý thuốc", description: "Thêm, sửa, xóa thuốc" },
    { id: "schedules.view", name: "Xem lịch trực", description: "Xem lịch làm việc" },
    { id: "schedules.manage", name: "Quản lý lịch trực", description: "Phân công lịch trực" },
    { id: "reports.view", name: "Xem báo cáo", description: "Xem thống kê và báo cáo" },
    { id: "reports.export", name: "Xuất báo cáo", description: "Tải xuống báo cáo" },
];

interface PermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PermissionsModal({ isOpen, onClose }: PermissionsModalProps) {
    const [selectedRole, setSelectedRole] = useState<Role>(ROLES.ADMIN);
    const [rolePermissions, setRolePermissions] = useState<Record<Role, string[]>>({
        [ROLES.ADMIN]: PERMISSIONS.map((p) => p.id),
        [ROLES.DOCTOR]: ["doctors.view", "schedules.view", "medicines.view"],
        [ROLES.PHARMACIST]: ["medicines.view", "medicines.manage"],
        [ROLES.RECEPTIONIST]: ["users.view", "doctors.view", "schedules.view"],
        [ROLES.PATIENT]: [],
    });

    const togglePermission = (permissionId: string) => {
        setRolePermissions((prev) => {
            const current = prev[selectedRole] || [];
            const updated = current.includes(permissionId)
                ? current.filter((p) => p !== permissionId)
                : [...current, permissionId];
            return { ...prev, [selectedRole]: updated };
        });
    };

    const currentPermissions = rolePermissions[selectedRole] || [];

    const handleSave = () => {
        // In real app, save to backend
        alert("Đã lưu cài đặt phân quyền!");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thiết lập phân quyền" size="xl">
            <div className="flex gap-6">
                {/* Role Selection */}
                <div className="w-48 flex-shrink-0">
                    <p className="text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase mb-3">
                        Vai trò
                    </p>
                    <div className="space-y-1">
                        {Object.entries(ROLES).map(([key, value]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedRole(value as Role)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedRole === value
                                        ? "bg-[#3C81C6] text-white font-medium"
                                        : "text-[#121417] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }`}
                            >
                                {ROLE_LABELS[value as Role]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Grid */}
                <div className="flex-1">
                    <p className="text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase mb-3">
                        Quyền hạn của {ROLE_LABELS[selectedRole]}
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                        {PERMISSIONS.map((permission) => {
                            const isChecked = currentPermissions.includes(permission.id);
                            return (
                                <label
                                    key={permission.id}
                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isChecked
                                            ? "border-[#3C81C6] bg-[#3C81C6]/5"
                                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => togglePermission(permission.id)}
                                        className="mt-0.5 w-4 h-4 text-[#3C81C6] border-gray-300 rounded focus:ring-[#3C81C6]"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-[#121417] dark:text-white">
                                            {permission.name}
                                        </p>
                                        <p className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">
                                            {permission.description}
                                        </p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-[#dde0e4] dark:border-[#2d353e]">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                    {UI_TEXT.COMMON.CANCEL}
                </button>
                <button
                    onClick={handleSave}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all"
                >
                    {UI_TEXT.COMMON.SAVE}
                </button>
            </div>
        </Modal>
    );
}
