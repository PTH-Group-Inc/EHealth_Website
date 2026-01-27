"use client";

import { Modal } from "@/components/ui/modal";
import type { Department } from "@/types";
import { DEPARTMENT_STATUS } from "@/constants/status";
import { UI_TEXT } from "@/constants/ui-text";

interface DepartmentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    department: Department | null;
}

export function DepartmentDetailModal({ isOpen, onClose, department }: DepartmentDetailModalProps) {
    if (!department) return null;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case DEPARTMENT_STATUS.ACTIVE:
                return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500", label: UI_TEXT.STATUS.ACTIVE };
            case DEPARTMENT_STATUS.INACTIVE:
                return { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400", label: UI_TEXT.STATUS.INACTIVE };
            case DEPARTMENT_STATUS.MAINTENANCE:
                return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500", label: UI_TEXT.STATUS.MAINTENANCE };
            default:
                return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: status };
        }
    };

    const statusStyle = getStatusStyle(department.status);
    const loadPercent = department.capacity ? Math.min(100, Math.round(((department.appointmentToday || 0) / department.capacity) * 100)) : 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết Chuyên khoa" size="lg">
            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start gap-4 pb-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="w-16 h-16 rounded-xl bg-[#3C81C6]/10 flex items-center justify-center text-[#3C81C6]">
                        <span className="material-symbols-outlined text-[32px]">{department.icon || "local_hospital"}</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-[#121417] dark:text-white">{department.name}</h2>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                                {statusStyle.label}
                            </span>
                        </div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{department.code}</p>
                        {department.description && (
                            <p className="text-sm text-[#687582] dark:text-gray-400 mt-2">{department.description}</p>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                        <span className="material-symbols-outlined text-blue-600 text-[24px] mb-1 block">stethoscope</span>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{department.doctorCount}</p>
                        <p className="text-xs text-[#687582] dark:text-gray-400">Bác sĩ</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                        <span className="material-symbols-outlined text-green-600 text-[24px] mb-1 block">personal_injury</span>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{department.patientCount || 0}</p>
                        <p className="text-xs text-[#687582] dark:text-gray-400">Bệnh nhân</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                        <span className="material-symbols-outlined text-purple-600 text-[24px] mb-1 block">event_available</span>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{department.appointmentToday || 0}</p>
                        <p className="text-xs text-[#687582] dark:text-gray-400">Lịch hẹn hôm nay</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                        <span className="material-symbols-outlined text-orange-600 text-[24px] mb-1 block">groups</span>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{department.capacity || 0}</p>
                        <p className="text-xs text-[#687582] dark:text-gray-400">Sức chứa</p>
                    </div>
                </div>

                {/* Load Progress */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#121417] dark:text-white">Tải công việc hiện tại</span>
                        <span className={`text-sm font-bold ${loadPercent > 80 ? "text-red-600" : loadPercent > 50 ? "text-orange-600" : "text-green-600"}`}>
                            {loadPercent}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                            className={`h-3 rounded-full transition-all ${loadPercent > 80 ? "bg-red-500" : loadPercent > 50 ? "bg-orange-500" : "bg-green-500"}`}
                            style={{ width: `${loadPercent}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-[#687582] dark:text-gray-400 mt-2">
                        {department.appointmentToday || 0} / {department.capacity || 0} bệnh nhân
                    </p>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {department.location && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <span className="material-symbols-outlined text-[#687582]">location_on</span>
                            <div>
                                <p className="text-xs text-[#687582] dark:text-gray-400">Vị trí</p>
                                <p className="text-sm font-medium text-[#121417] dark:text-white">{department.location}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <span className="material-symbols-outlined text-[#687582]">calendar_today</span>
                        <div>
                            <p className="text-xs text-[#687582] dark:text-gray-400">Ngày tạo</p>
                            <p className="text-sm font-medium text-[#121417] dark:text-white">
                                {department.createdAt ? new Date(department.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        Đóng
                    </button>
                    <button className="px-5 py-2.5 text-sm font-bold text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-xl shadow-md transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Chỉnh sửa
                    </button>
                </div>
            </div>
        </Modal>
    );
}
