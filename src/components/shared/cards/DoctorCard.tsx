"use client";

/**
 * DoctorCard — card bác sĩ cho admin doctors list + public doctor listing.
 * Layout 2 cột rộng: avatar trái, thông tin phải (tên đầy đủ → chuyên khoa → code → contact).
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
    rating?: number;            // giữ prop cho tương thích nhưng KHÔNG render
    reviewCount?: number;       // giữ prop cho tương thích nhưng KHÔNG render
    experience?: number;
    status?: "ACTIVE" | "OFFLINE" | "BUSY" | "ON_LEAVE" | "INACTIVE" | string;
    onView?: () => void;
    onEdit?: () => void;
    onSchedule?: () => void;
}

// Dot color cho status indicator (gọn, không text)
const STATUS_DOT: Record<string, string> = {
    ACTIVE: "bg-emerald-500",
    BUSY: "bg-amber-500",
    ON_LEAVE: "bg-blue-500",
    OFFLINE: "bg-gray-400",
    INACTIVE: "bg-gray-400",
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
    const dotColor = STATUS_DOT[status] ?? STATUS_DOT.OFFLINE;
    const displayName = title ? `${title}. ${fullName}` : fullName;

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md hover:border-[#3C81C6]/40 transition-all overflow-hidden">
            <div className="p-5">
                {/* Header: avatar + info side-by-side */}
                <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                        {avatarUrl ? (
                            <Image src={getImageUrl(avatarUrl)} alt={fullName}
                                width={72} height={72}
                                className="w-18 h-18 rounded-2xl object-cover border border-gray-100 dark:border-gray-800"
                                style={{ width: 72, height: 72 }} />
                        ) : (
                            <div className="rounded-2xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white font-bold text-xl"
                                style={{ width: 72, height: 72 }}>
                                {getInitials(fullName)}
                            </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${dotColor} border-2 border-white dark:border-[#1e242b]`} title={status} />
                    </div>
                    <div className="flex-1 min-w-0">
                        {/* Tên - 1 dòng đầy đủ */}
                        <h3 className="font-bold text-lg text-[#121417] dark:text-white leading-snug">
                            {displayName}
                        </h3>
                        {(specialization || departmentName) && (
                            <p className="text-sm text-[#3C81C6] font-medium mt-1">
                                {specialization || departmentName}
                            </p>
                        )}
                        {code && (
                            <p className="text-xs font-mono text-[#687582] dark:text-gray-500 mt-1">
                                {code}
                            </p>
                        )}
                    </div>
                </div>

                {/* Contact info */}
                {(experience !== undefined && experience > 0) || phone || email ? (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 space-y-1.5">
                        {experience !== undefined && experience > 0 && (
                            <div className="flex items-center gap-2 text-sm text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined text-[#3C81C6]/70" style={{ fontSize: "18px" }}>work_history</span>
                                <span>{experience} năm kinh nghiệm</span>
                            </div>
                        )}
                        {phone && (
                            <div className="flex items-center gap-2 text-sm text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined text-[#3C81C6]/70" style={{ fontSize: "18px" }}>phone</span>
                                <span>{phone}</span>
                            </div>
                        )}
                        {email && (
                            <div className="flex items-center gap-2 text-sm text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined text-[#3C81C6]/70" style={{ fontSize: "18px" }}>mail</span>
                                <span className="truncate" title={email}>{email}</span>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Actions */}
                {(onView || onEdit || onSchedule) && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
                        {onView && (
                            <button onClick={onView}
                                className="flex-1 px-3 py-2 text-sm font-medium text-[#3C81C6] hover:bg-[#3C81C6]/[0.08] border border-[#3C81C6]/20 rounded-lg transition-colors">
                                Chi tiết
                            </button>
                        )}
                        {onSchedule && (
                            <button onClick={onSchedule}
                                className="px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg transition-colors inline-flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_month</span>
                                Lịch
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={onEdit}
                                className="px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg transition-colors">
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
