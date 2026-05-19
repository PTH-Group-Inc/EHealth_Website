"use client";

/**
 * DoctorCard — card bác sĩ cho admin doctors list + public doctor listing.
 * Hiển thị avatar, tên, chuyên khoa, contact, status.
 */

import Image from "next/image";
import { getInitials, getImageUrl } from "@/utils/helpers";

export interface DoctorCardProps {
    id: string;
    fullName: string;
    avatarUrl?: string;
    code?: string;
    title?: string;             // "TS.BS", "ThS.BS", "BS"
    specialization?: string;
    departmentName?: string;
    phone?: string;
    email?: string;
    rating?: number;            // giữ prop để tương thích nhưng KHÔNG render
    reviewCount?: number;       // giữ prop để tương thích nhưng KHÔNG render
    experience?: number;
    status?: "ACTIVE" | "OFFLINE" | "BUSY" | "ON_LEAVE" | "INACTIVE" | string;
    onView?: () => void;
    onEdit?: () => void;
    onSchedule?: () => void;
}

const STATUS_STYLE: Record<string, { dot: string; label: string; badge: string }> = {
    ACTIVE: { dot: "bg-emerald-500", label: "Đang hoạt động", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    BUSY: { dot: "bg-amber-500", label: "Đang khám", badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    ON_LEAVE: { dot: "bg-blue-500", label: "Nghỉ phép", badge: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    OFFLINE: { dot: "bg-gray-400", label: "Offline", badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
    INACTIVE: { dot: "bg-gray-400", label: "Ngừng", badge: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

export function DoctorCard({
    fullName,
    avatarUrl,
    code,
    title,
    specialization,
    departmentName,
    phone,
    email,
    experience,
    status = "ACTIVE",
    onView,
    onEdit,
    onSchedule,
}: DoctorCardProps) {
    const s = STATUS_STYLE[status] ?? STATUS_STYLE.OFFLINE;
    const displayName = title ? `${title}. ${fullName}` : fullName;

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md hover:border-[#3C81C6]/40 transition-all group overflow-hidden">
            <div className="p-4">
                {/* Header: avatar + name + status */}
                <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                        {avatarUrl ? (
                            <Image src={getImageUrl(avatarUrl)} alt={fullName}
                                width={56} height={56}
                                className="w-14 h-14 rounded-2xl object-cover border border-gray-100 dark:border-gray-800" />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white font-bold text-base">
                                {getInitials(fullName)}
                            </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${s.dot} border-2 border-white dark:border-[#1e242b]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-base text-[#121417] dark:text-white leading-tight" title={displayName}>
                                {displayName}
                            </h3>
                            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
                        </div>
                        {(specialization || departmentName) && (
                            <p className="text-xs text-[#3C81C6] font-medium mt-0.5" title={specialization || departmentName}>
                                {specialization || departmentName}
                            </p>
                        )}
                        {code && (
                            <p className="text-[10px] font-mono text-[#687582] dark:text-gray-500 mt-0.5 truncate">
                                {code}
                            </p>
                        )}
                    </div>
                </div>

                {/* Contact info */}
                {(experience !== undefined && experience > 0) || phone || email ? (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 space-y-1.5">
                        {experience !== undefined && experience > 0 && (
                            <div className="flex items-center gap-2 text-xs text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined text-[#3C81C6]/70" style={{ fontSize: "16px" }}>work_history</span>
                                <span>{experience} năm kinh nghiệm</span>
                            </div>
                        )}
                        {phone && (
                            <div className="flex items-center gap-2 text-xs text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined text-[#3C81C6]/70" style={{ fontSize: "16px" }}>phone</span>
                                <span className="truncate" title={phone}>{phone}</span>
                            </div>
                        )}
                        {email && (
                            <div className="flex items-center gap-2 text-xs text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined text-[#3C81C6]/70" style={{ fontSize: "16px" }}>mail</span>
                                <span className="truncate" title={email}>{email}</span>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Actions */}
                {(onView || onEdit || onSchedule) && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                        {onView && (
                            <button onClick={onView}
                                className="flex-1 px-2.5 py-1.5 text-xs font-medium text-[#3C81C6] hover:bg-[#3C81C6]/[0.08] border border-[#3C81C6]/20 rounded-lg transition-colors">
                                Chi tiết
                            </button>
                        )}
                        {onSchedule && (
                            <button onClick={onSchedule}
                                className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg transition-colors inline-flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>calendar_month</span>
                                Lịch
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={onEdit}
                                className="px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg transition-colors">
                                Sửa
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DoctorCard;
