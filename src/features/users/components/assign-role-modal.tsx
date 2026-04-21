"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import { UI_TEXT } from "@/constants/ui-text";
import type { User } from "@/types";

interface AssignRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (role: string) => void;
    user: User | null;
}

export function AssignRoleModal({
    isOpen,
    onClose,
    onSubmit,
    user,
}: AssignRoleModalProps) {
    const [selectedRole, setSelectedRole] = useState<string>("STAFF");
    const currentRole =
        typeof user?.role === "string" && user.role.trim().length > 0
            ? user.role.trim().toUpperCase()
            : Array.isArray(user?.roles) && user.roles.length > 0
                ? String(user.roles[0]).trim().toUpperCase()
                : "STAFF";

    useEffect(() => {
        if (isOpen && user) {
            setSelectedRole(currentRole);
        }
    }, [currentRole, isOpen, user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(selectedRole);
    };

    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Đổi Vai Trò: ${user.fullName}`}
            size="md"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="space-y-4">
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                        Chọn một vai trò hiệu lực mới. Vai trò hiện tại sẽ được thay thế khi bạn lưu.
                    </p>
                    <div className="flex flex-col gap-3">
                        {Object.entries(ROLES).map(([key, value]) => {
                            const roleVal = value as Role;
                            const isSelected = selectedRole === roleVal;
                            return (
                                <div
                                    key={key}
                                    onClick={() => setSelectedRole(roleVal)}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                                        isSelected 
                                            ? "border-[#3C81C6] bg-[#3C81C6]/5 dark:bg-[#3C81C6]/10" 
                                            : "border-[#dde0e4] bg-white dark:bg-[#1e242b] dark:border-[#2d353e] hover:border-gray-300 dark:hover:border-gray-600 shadow-sm"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                                            isSelected ? "bg-[#3C81C6]/10 text-[#3C81C6]" : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                                        }`}>
                                            <span className="material-symbols-outlined text-[20px]">
                                                {roleVal === ROLES.ADMIN ? "shield_person" : roleVal === ROLES.DOCTOR ? "stethoscope" : roleVal === ROLES.PHARMACIST ? "medical_information" : "person"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold flex items-center gap-2 ${isSelected ? "text-[#3C81C6]" : "text-[#121417] dark:text-gray-200"}`}>
                                                {ROLE_LABELS[roleVal] || roleVal}
                                                {currentRole === roleVal && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 font-medium">Hiện tại</span>
                                                )}
                                            </span>
                                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                                {roleVal === ROLES.ADMIN ? "Toàn quyền hệ thống" : roleVal === ROLES.DOCTOR ? "Quản lý khám bệnh" : roleVal === ROLES.PHARMACIST ? "Hỗ trợ y tế" : "Nhân viên phòng khám"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        isSelected ? "border-[#3C81C6]" : "border-gray-300 dark:border-gray-600"
                                    }`}>
                                        {isSelected && <div className="w-2.5 h-2.5 bg-[#3C81C6] rounded-full" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        {UI_TEXT.COMMON.CANCEL}
                    </button>
                    <button
                        type="submit"
                        disabled={selectedRole === currentRole}
                        className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#3C81C6] to-[#4A90E2] hover:from-[#2a6da8] hover:to-[#387DCB] disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                    >
                        Lưu Thay Đổi
                        <span className="material-symbols-outlined text-[18px]">security</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}
