"use client";

/**
 * UserCard — card user/account cho admin users list.
 */

import { getInitials } from "@/utils/helpers";
import { formatRelativeTime } from "@/utils/formatters";

const ROLE_STYLE: Record<string, { badge: string; icon: string }> = {
    admin: { badge: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: "admin_panel_settings" },
    super_admin: { badge: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: "admin_panel_settings" },
    doctor: { badge: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: "stethoscope" },
    nurse: { badge: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: "medical_services" },
    pharmacist: { badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: "local_pharmacy" },
    staff: { badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: "support_agent" },
    receptionist: { badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: "support_agent" },
    cashier: { badge: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", icon: "payments" },
    patient: { badge: "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300", icon: "person" },
};

const ROLE_LABEL: Record<string, string> = {
    admin: "Quản trị",
    super_admin: "Super Admin",
    doctor: "Bác sĩ",
    nurse: "Điều dưỡng",
    pharmacist: "Dược sĩ",
    staff: "Nhân viên",
    receptionist: "Lễ tân",
    cashier: "Thu ngân",
    patient: "Bệnh nhân",
};

export interface UserCardProps {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    roles?: string[];
    status?: "ACTIVE" | "INACTIVE" | "LOCKED" | string;
    lastLoginAt?: string;
    branchName?: string;
    onView?: () => void;
    onEdit?: () => void;
    onResetPassword?: () => void;
    onToggleStatus?: () => void;
}

export function UserCard({
    fullName,
    email,
    phone,
    avatarUrl,
    roles = [],
    status = "ACTIVE",
    lastLoginAt,
    branchName,
    onView,
    onEdit,
    onResetPassword,
    onToggleStatus,
}: UserCardProps) {
    const primaryRole = (roles[0] ?? "").toLowerCase();
    const roleCfg = ROLE_STYLE[primaryRole] ?? ROLE_STYLE.patient;

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md hover:border-[#3C81C6]/40 transition-all group">
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={fullName}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-100 dark:border-gray-800 flex-shrink-0" />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {getInitials(fullName || email || "?")}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm text-[#121417] dark:text-white truncate">{fullName || "—"}</h3>
                            {status === "LOCKED" && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                                    <span className="material-symbols-outlined align-middle" style={{ fontSize: "12px" }}>lock</span> Khoá
                                </span>
                            )}
                            {status === "INACTIVE" && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Ngừng</span>
                            )}
                        </div>
                        {email && <p className="text-xs text-[#687582] dark:text-gray-400 truncate">{email}</p>}
                        {phone && <p className="text-xs text-[#687582] dark:text-gray-500 truncate">{phone}</p>}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {roles.slice(0, 3).map((r) => {
                                const rl = r.toLowerCase();
                                const cfg = ROLE_STYLE[rl] ?? ROLE_STYLE.patient;
                                return (
                                    <span key={r} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{cfg.icon}</span>
                                        {ROLE_LABEL[rl] ?? r}
                                    </span>
                                );
                            })}
                            {roles.length > 3 && (
                                <span className="text-[10px] text-[#687582] dark:text-gray-500">+{roles.length - 3}</span>
                            )}
                        </div>
                    </div>
                </div>

                {(branchName || lastLoginAt) && (
                    <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 space-y-1">
                        {branchName && (
                            <div className="flex items-center gap-2 text-xs text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>apartment</span>
                                <span className="truncate">{branchName}</span>
                            </div>
                        )}
                        {lastLoginAt && (
                            <div className="flex items-center gap-2 text-xs text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>login</span>
                                <span>Đăng nhập {formatRelativeTime(lastLoginAt)}</span>
                            </div>
                        )}
                    </div>
                )}

                {(onView || onEdit || onResetPassword || onToggleStatus) && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                        {onView && (
                            <button onClick={onView}
                                className="flex-1 px-2 py-1.5 text-xs font-medium text-[#3C81C6] hover:bg-[#3C81C6]/[0.08] border border-[#3C81C6]/20 rounded-lg transition-colors">
                                Chi tiết
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={onEdit}
                                className="px-2 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg transition-colors">
                                Sửa
                            </button>
                        )}
                        {onResetPassword && (
                            <button onClick={onResetPassword}
                                className="px-2 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 rounded-lg transition-colors"
                                title="Reset password">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>key</span>
                            </button>
                        )}
                        {onToggleStatus && (
                            <button onClick={onToggleStatus}
                                className="px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Khoá/Mở khoá">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                    {status === "LOCKED" ? "lock_open" : "lock"}
                                </span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserCard;
