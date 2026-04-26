"use client";

/**
 * PatientCard — dùng cho receptionist patients list, doctor patients, etc.
 * Hiển thị avatar, tên, thông tin cơ bản, BHYT, thao tác nhanh.
 */

import { getInitials, getImageUrl } from "@/utils/helpers";
import { formatDate } from "@/utils/formatters";

export interface PatientCardProps {
    id: string;
    fullName: string;
    avatarUrl?: string;
    dob?: string;
    gender?: "male" | "female" | "other" | string;
    phone?: string;
    insuranceBadge?: string;      // "BHYT" | "VIP" | "Không có BH"
    hasBhyt?: boolean;
    lastVisit?: string;           // ISO
    status?: "active" | "inactive";
    onViewDetail?: () => void;
    onCall?: () => void;
    onBook?: () => void;
}

function calcAge(dob?: string): number | null {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
}

export function PatientCard({
    fullName,
    avatarUrl,
    dob,
    gender,
    phone,
    insuranceBadge,
    hasBhyt,
    lastVisit,
    status = "active",
    onViewDetail,
    onCall,
    onBook,
}: PatientCardProps) {
    const age = calcAge(dob);
    const genderLabel = gender === "male" ? "Nam" : gender === "female" ? "Nữ" : gender === "other" ? "Khác" : "";
    const genderColor = gender === "male" ? "from-blue-400 to-blue-600" : gender === "female" ? "from-pink-400 to-rose-500" : "from-gray-400 to-gray-600";
    const badgeLabel = insuranceBadge ?? (hasBhyt ? "BHYT" : undefined);

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md hover:border-[#3C81C6]/40 transition-all group">
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getImageUrl(avatarUrl)} alt={fullName}
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100 dark:border-gray-800" />
                    ) : (
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${genderColor} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
                            {getInitials(fullName)}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-[#121417] dark:text-white truncate">{fullName}</h3>
                            {status === "inactive" && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 flex-shrink-0">
                                    Ngừng
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap text-xs text-[#687582] dark:text-gray-400 mt-1">
                            {genderLabel && <span>{genderLabel}</span>}
                            {age !== null && <span>• {age} tuổi</span>}
                            {dob && <span>• {formatDate(dob)}</span>}
                        </div>

                        {badgeLabel && (
                            <div className="mt-2">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${hasBhyt !== false
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                    }`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>health_and_safety</span>
                                    {badgeLabel}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {(phone || lastVisit) && (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 space-y-1">
                        {phone && (
                            <div className="flex items-center gap-2 text-xs text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>phone</span>
                                <span className="truncate">{phone}</span>
                            </div>
                        )}
                        {lastVisit && (
                            <div className="flex items-center gap-2 text-xs text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event</span>
                                <span>Lần khám cuối: {formatDate(lastVisit)}</span>
                            </div>
                        )}
                    </div>
                )}

                {(onViewDetail || onCall || onBook) && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                        {onViewDetail && (
                            <button onClick={onViewDetail}
                                className="flex-1 px-2.5 py-1.5 text-xs font-medium text-[#3C81C6] hover:bg-[#3C81C6]/[0.08] border border-[#3C81C6]/20 rounded-lg transition-colors">
                                Chi tiết
                            </button>
                        )}
                        {onBook && (
                            <button onClick={onBook}
                                className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#3C81C6] hover:bg-[#2b6cb0] rounded-lg transition-colors inline-flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event_available</span>
                                Đặt lịch
                            </button>
                        )}
                        {onCall && phone && (
                            <button onClick={onCall}
                                className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg transition-colors inline-flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>call</span>
                                Gọi
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PatientCard;
