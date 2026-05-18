"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { ROLE_LABELS } from "@/constants/roles";
import { getImageUrl } from "@/utils/helpers";
import type { User } from "@/types";

interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: (User & {
        dob?: string;
        gender?: string;
        identity_card_number?: string;
        address?: string;
        phoneNumber?: string;
        roles?: string[];
    }) | null;
}

export function UserDetailsModal({
    isOpen,
    onClose,
    user,
}: UserDetailsModalProps) {
    if (!user) return null;
    const effectiveRole = String(user.roles?.[0] ?? user.role ?? "").trim().toUpperCase();

    const renderStatus = (status: string) => {
        switch (status?.toLowerCase()) {
            case "active":
                return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-full text-xs font-bold">Hoạt động</span>;
            case "inactive":
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded-full text-xs font-bold">Đã vô hiệu hóa</span>;
            case "locked":
                return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-full text-xs font-bold">Đã khóa</span>;
            default:
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Không có";
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
        } catch {
            return dateString;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Hồ Sơ Người Dùng"
            size="lg"
        >
            <div className="flex flex-col gap-8 pb-4">
                {/* Header: Avatar, Name, Role */}
                <div className="flex items-center gap-6 p-6 rounded-2xl bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-[#1e242b] shadow-lg flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                        {user.avatar ? (
                            <Image src={getImageUrl(user.avatar)} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <span className="material-symbols-outlined text-4xl">person</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[#121417] dark:text-white">{user.fullName}</h2>
                            {renderStatus(user.status)}
                        </div>
                        <div className="flex items-center gap-2 text-[#3C81C6] font-medium text-sm">
                            <span className="material-symbols-outlined text-[18px]">stars</span>
                            {ROLE_LABELS[effectiveRole as keyof typeof ROLE_LABELS] || effectiveRole || "Chưa xác định"}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-[13px] mt-1 space-y-1">
                            <p className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">mail</span>
                                {user.email}
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">phone</span>
                                {user.phone || user.phoneNumber || "Không có SĐT"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-[#2d353e] pb-2">Thông tin cá nhân</h3>
                        
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px]">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Giới tính:</span>
                            <span className="text-[#121417] dark:text-gray-200 font-semibold">
                                {user.gender === "MALE" ? "Nam" : user.gender === "FEMALE" ? "Nữ" : "Khác"}
                            </span>
                            
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Ngày sinh:</span>
                            <span className="text-[#121417] dark:text-gray-200 font-semibold">{formatDate(user.dob)}</span>
                            
                            <span className="text-gray-500 dark:text-gray-400 font-medium">CMND/CCCD:</span>
                            <span className="text-[#121417] dark:text-gray-200 font-semibold">{user.identity_card_number || "Chưa cập nhật"}</span>
                            
                            <span className="text-gray-500 dark:text-gray-400 font-medium overflow-visible">Nơi sinh/Địa chỉ:</span>
                            <span className="text-[#121417] dark:text-gray-200 font-semibold leading-relaxed">{user.address || "Chưa cập nhật"}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-[#2d353e] pb-2">Hệ Thống</h3>
                        
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px]">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">ID Nội bộ:</span>
                            <span className="text-[#121417] dark:text-gray-200 font-mono text-[12px]">{user.id}</span>
                            
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Vai trò hiệu lực:</span>
                            <span className="text-[#121417] dark:text-gray-200 font-semibold flex flex-wrap gap-1">
                                {effectiveRole ? (
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                        {ROLE_LABELS[effectiveRole as keyof typeof ROLE_LABELS] || effectiveRole}
                                    </span>
                                ) : "Chưa phân vai trò"}
                            </span>

                            <span className="text-gray-500 dark:text-gray-400 font-medium mt-3">Ngày tạo:</span>
                            <span className="text-[#121417] dark:text-gray-200 font-semibold mt-3">{formatDate(user.createdAt)}</span>
                            
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Cập nhật lúc:</span>
                            <span className="text-[#121417] dark:text-gray-200 font-semibold">{formatDate(user.updatedAt)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-2.5 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </Modal>
    );
}
