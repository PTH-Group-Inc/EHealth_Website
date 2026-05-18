"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ROLES, ROLE_LABELS, ROLE_COLORS, type Role } from "@/constants/roles";
import { USER_STATUS } from "@/constants/status";
import type { User } from "@/types";
import { getUserById } from "@/services/userService";
import { useToast } from "@/contexts";
import axiosClient from "@/api/axiosClient";
import {
    USER_ENDPOINTS,
    ROLE_ENDPOINTS,
    AUDIT_LOG_ENDPOINTS,
    STAFF_ENDPOINTS,
    STAFF_MANAGEMENT_ENDPOINTS,
} from "@/api/endpoints";
import { getImageUrl } from "@/utils/helpers";
import { usePermission } from "@/hooks/usePermission";
import { staffScheduleService, type StaffSchedule } from "@/services/staffScheduleService";
import { workShiftService, type WorkShift } from "@/services/workShiftService";
import { facilityService } from "@/services/facilityService";
import { branchService } from "@/services/branchService";
import { getDepartments, unwrapDepartments } from "@/services/departmentService";
import { CustomSelect } from "@/components/ui/custom-select";

/** Format ISO date to readable string */
function formatDate(iso: string): string {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("vi-VN", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit",
        });
    } catch { return iso; }
}

type UserDetailVM = User & {
    dob?: string;
    gender?: string;
    identityCardNumber?: string;
    address?: string;
    departmentName?: string;
    facilityName?: string;
    // Doctor-specific fields
    specialty?: string;
    title?: string;
    biography?: string;
    consultation_fee?: number;
    rating?: number;
    reviewCount?: number;
    licenses?: any[];
    professionalImage?: string;
    signatureUrl?: string;
};

function safeParseDate(value: unknown): Date | null {
    if (!value) return null;
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateOnly(iso?: string | null): string {
    if (!iso) return "-";
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return String(iso);
        return d.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
        return String(iso);
    }
}

function toYMDLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseYMDLocal(ymd: string): Date {
    const parts = String(ymd || "").split("-").map((p) => Number(p));
    const [y, m, d] = parts;
    if (!y || !m || !d) return new Date(ymd);
    return new Date(y, m - 1, d);
}

function formatGender(gender?: string | null): string {
    const g = String(gender ?? "").trim().toUpperCase();
    if (!g) return "-";
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    if (g === "OTHER") return "Khác";
    return String(gender);
}

function normalizeRoles(rawRoles: unknown): string[] {
    if (Array.isArray(rawRoles)) {
        return rawRoles
            .map((r) => {
                if (typeof r === "string") return r.trim().toUpperCase();
                if (r && typeof r === "object") {
                    const obj = r as Record<string, unknown>;
                    return String(obj.code ?? obj.role ?? obj.name ?? "").trim().toUpperCase();
                }
                return "";
            })
            .filter(Boolean);
    }
    if (typeof rawRoles === "string" && rawRoles.trim()) return [rawRoles.trim().toUpperCase()];
    return [];
}

function normalizeRole(raw: any): Role {
    const roles = normalizeRoles(raw?.roles);
    const roleCode = String(roles[0] ?? raw?.role ?? ROLES.STAFF).trim().toUpperCase();
    return (Object.values(ROLES) as string[]).includes(roleCode) ? (roleCode as Role) : ROLES.STAFF;
}

function normalizeStatus(raw: any): User["status"] {
    const rawStatus = String(raw?.status ?? USER_STATUS.ACTIVE).trim().toUpperCase();
    if (rawStatus === USER_STATUS.INACTIVE) return USER_STATUS.INACTIVE;
    if (rawStatus === USER_STATUS.LOCKED || rawStatus === "BANNED") return USER_STATUS.LOCKED;

    const lockedUntil = safeParseDate(raw?.locked_until ?? raw?.lockedUntil);
    if (lockedUntil && lockedUntil.getTime() > Date.now()) return USER_STATUS.LOCKED;

    return USER_STATUS.ACTIVE;
}

function mapApiUserToUserDetailVM(raw: any, userId: string): UserDetailVM {
    const id = String(raw?.users_id ?? raw?.id ?? userId);

    const fullName = raw?.profile?.full_name ?? raw?.full_name ?? raw?.fullName ?? raw?.email ?? "";
    const email = raw?.email ?? "";
    const phone = raw?.phone ?? raw?.phone_number ?? raw?.phoneNumber ?? "";
    const rawAvatar = raw?.profile?.avatar_url ?? raw?.avatar ?? "";
    const avatar = getImageUrl(rawAvatar);

    const createdAt = raw?.created_at ?? raw?.createdAt ?? "";
    const updatedAt = raw?.updated_at ?? raw?.updatedAt ?? "";
    const lastAccess = raw?.last_login ?? raw?.lastAccess ?? raw?.last_login_at ?? "";

    const dob = raw?.profile?.dob ?? raw?.dob ?? raw?.date_of_birth ?? "";
    const gender = raw?.profile?.gender ?? raw?.gender ?? "";
    const identityCardNumber = raw?.profile?.identity_card_number ?? raw?.identity_card_number ?? raw?.identityCardNumber ?? "";
    const address = raw?.profile?.address ?? raw?.address ?? "";

    const departmentName = raw?.department?.name ?? raw?.department_name ?? raw?.department ?? "";
    const facilityName = raw?.facility?.name ?? raw?.facility_name ?? raw?.branch?.name ?? raw?.branch_name ?? "";

    // Doctor-specific fields
    const specialty = raw?.specialty_name ?? raw?.specialty ?? raw?.specialization ?? "";
    const title = raw?.title ?? raw?.medical_title ?? "";
    const biography = raw?.biography ?? raw?.bio ?? "";
    const consultation_fee = raw?.consultation_fee ?? 0;
    const rating = raw?.rating ?? 0;
    const reviewCount = raw?.review_count ?? raw?.reviewCount ?? 0;
    const licenses = raw?.licenses ?? [];
    const professionalImage = raw?.professional_image ?? raw?.professional_avatar ?? "";
    const signatureUrl = getImageUrl(raw?.signature_url ?? raw?.signatureUrl ?? raw?.signature ?? "");

    return {
        id,
        createdAt: String(createdAt),
        updatedAt: String(updatedAt),
        email: String(email),
        fullName: String(fullName),
        phone: phone ? String(phone) : undefined,
        avatar: avatar ? String(avatar) : undefined,
        role: normalizeRole(raw),
        status: normalizeStatus(raw),
        lastAccess: lastAccess ? String(lastAccess) : undefined,
        roles: normalizeRoles(raw?.roles),
        dob: dob ? String(dob) : undefined,
        gender: gender ? String(gender) : undefined,
        identityCardNumber: identityCardNumber ? String(identityCardNumber) : undefined,
        address: address ? String(address) : undefined,
        departmentName: departmentName ? String(departmentName) : undefined,
        facilityName: facilityName ? String(facilityName) : undefined,
        specialty: specialty ? String(specialty) : undefined,
        title: title ? String(title) : undefined,
        biography: biography ? String(biography) : undefined,
        consultation_fee,
        rating,
        reviewCount,
        licenses,
        professionalImage: professionalImage ? String(professionalImage) : undefined,
        signatureUrl: signatureUrl ? String(signatureUrl) : undefined,
    };
}

const TABS = [
    { key: "info", label: "Thông tin nhân sự", icon: "person" },
    { key: "workplace", label: "Chi nhánh/phòng ban", icon: "domain" },
    { key: "specialty", label: "Chuyên môn", icon: "stethoscope" },
    { key: "schedule", label: "Lịch làm việc", icon: "calendar_month" },
    { key: "assignments", label: "Phân công", icon: "assignment_ind" },
] as const;

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<UserDetailVM | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("info");
    const [refresh, setRefresh] = useState(0);

    const triggerRefresh = () => setRefresh(prev => prev + 1);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getUserById(userId)
            .then((raw: any) => {
                if (cancelled) return;
                setUser(raw ? mapApiUserToUserDetailVM(raw, userId) : null);
            })
            .catch(() => { if (!cancelled) setUser(null); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [userId, refresh]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin mb-4" />
                <p className="text-sm text-[#687582]">Đang tải...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_off</span>
                <p className="text-lg text-gray-500 mb-4">Không tìm thấy người dùng</p>
                <button
                    onClick={() => router.back()}
                    className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    const roleColor = ROLE_COLORS[user.role as Role] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
    const isActive = user.status === USER_STATUS.ACTIVE;
    const normalizedRoleCodes = normalizeRoles(user.roles);
    const isDoctor = normalizedRoleCodes.includes(ROLES.DOCTOR) || String(user.role).toUpperCase() === ROLES.DOCTOR;

    return (
        <>
            {/* Breadcrumb + Actions */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/users" className="hover:text-[#3C81C6] transition-colors">
                        Người dùng
                    </Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">{user.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push(`/admin/users/staff/${userId}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-all shadow-md shadow-blue-200 dark:shadow-none"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Chỉnh sửa
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Quay lại
                    </button>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden mb-6">
                {/* Banner gradient */}
                <div className="h-32 bg-gradient-to-r from-[#3C81C6] via-[#60a5fa] to-[#93c5fd] relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-[#1e242b] border-4 border-white dark:border-[#1e242b] shadow-lg flex items-center justify-center">
                            {user.avatar ? (
                                <div className="w-full h-full rounded-xl bg-cover bg-center" style={{ backgroundImage: `url('${user.avatar}')` }} />
                            ) : (
                                <span className="material-symbols-outlined text-4xl text-[#3C81C6]">person</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="pt-16 pb-6 px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-[#121417] dark:text-white">{user.fullName}</h1>
                            <p className="text-[#687582] dark:text-gray-400 mt-1">{user.email}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot} mr-1.5`} />
                                    {ROLE_LABELS[user.role as Role] || user.role}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isActive ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
                                    {isActive ? "Đang hoạt động" : "Đã khóa"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-8 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="flex gap-1 -mb-px overflow-x-auto">
                        {TABS.map((tab) => {
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                        activeTab === tab.key
                                            ? "border-[#3C81C6] text-[#3C81C6]"
                                            : "border-transparent text-[#687582] hover:text-[#3C81C6] hover:border-gray-300"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="pb-10">
                {activeTab === "info" && <OverviewTab user={user} isActive={isActive} />}
                {activeTab === "workplace" && <WorkplaceTab userId={userId} />}
                {activeTab === "specialty" && <SpecialtyTab user={user} userId={userId} isDoctor={isDoctor} />}
                {activeTab === "schedule" && <ScheduleTab userId={userId} />}
                {activeTab === "assignments" && (
                    <AssignmentsTab userId={userId} roles={normalizedRoleCodes} onRefresh={triggerRefresh} />
                )}
            </div>
        </>
    );
}

/* ─── Tab: Tổng quan ─── */
function OverviewTab({ user, isActive }: { user: UserDetailVM; isActive: boolean }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">badge</span>
                    Thông tin cá nhân
                </h2>
                <div className="space-y-4">
                    <InfoRow label="Họ và tên" value={user.fullName} icon="person" />
                    <InfoRow label="Email" value={user.email} icon="email" />
                    <InfoRow label="Số thẻ CCCD/CMND" value={user.identityCardNumber || "-"} icon="id_card" />
                    <InfoRow label="Số điện thoại" value={user.phone || "-"} icon="phone" />
                    <InfoRow label="Giới tính" value={formatGender(user.gender)} icon="wc" />
                    <InfoRow label="Ngày sinh" value={formatDateOnly(user.dob)} icon="cake" />
                    <InfoRow label="Địa chỉ" value={user.address || "-"} icon="pin_drop" />
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">manage_accounts</span>
                    Thông tin tài khoản
                </h2>
                <div className="space-y-4">
                    <InfoRow label="Mã nhân viên" value={`NV${String(user.id ?? "").padStart(5, "0")}`} icon="fingerprint" />
                    <InfoRow label="Ngày tạo tài khoản" value={formatDate(user.createdAt)} icon="event" />
                    <InfoRow label="Truy cập cuối" value={user.lastAccess ? formatDate(user.lastAccess) : "-"} icon="schedule" />
                    <InfoRow label="Trạng thái" value={isActive ? "Đang hoạt động" : "Đã khóa"} icon="toggle_on" />
                    <InfoRow label="Phòng ban" value={user.departmentName || "-"} icon="domain" />
                    <InfoRow label="Chi nhánh" value={user.facilityName || "-"} icon="location_city" />
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Chi nhánh/phòng ban ─── */
function WorkplaceTab({ userId }: { userId: string }) {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        axiosClient
            .get(STAFF_ENDPOINTS.DETAIL(userId))
            .then((res) => {
                const raw = res.data?.data || res.data || {};
                const facilities = raw?.facilities ?? raw?.branches ?? raw?.assignments ?? [];
                if (mounted) setAssignments(Array.isArray(facilities) ? facilities : []);
            })
            .catch((err) => {
                console.error(err);
                if (mounted) setAssignments([]);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [userId]);

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">domain</span>
                Chi nhánh / Phòng ban
            </h2>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : assignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.map((a, idx) => {
                        const branchName = a.branch_name ?? a.branchName ?? a.name ?? "—";
                        const departmentName = a.department_name ?? a.departmentName ?? a.department?.name ?? null;
                        const facilityName = a.facility_name ?? a.facilityName ?? null;
                        const roleTitle = a.role_title ?? a.roleTitle ?? null;
                        return (
                            <div
                                key={a.user_branch_dept_id ?? a.id ?? `${branchName}-${idx}`}
                                className="p-4 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-gray-50/50 dark:bg-gray-800/30 hover:border-[#3C81C6] transition-colors"
                            >
                                <p className="text-sm font-bold text-[#121417] dark:text-white mb-1">{branchName}</p>
                                {facilityName ? (
                                    <p className="text-xs text-[#687582] dark:text-gray-400">Cơ sở: {facilityName}</p>
                                ) : null}
                                {departmentName ? (
                                    <p className="text-xs text-[#687582] dark:text-gray-400">Phòng ban: {departmentName}</p>
                                ) : null}
                                {roleTitle ? (
                                    <p className="text-xs text-[#687582] dark:text-gray-400 mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">badge</span>
                                        {roleTitle}
                                    </p>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">domain</span>
                    <p className="text-sm text-[#687582]">Chưa được phân công chi nhánh/phòng ban</p>
                </div>
            )}
        </div>
    );
}

/* ─── Tab: Phân quyền & Vai trò ─── */
function RolesTab({ userId, roles, onRefresh }: { userId: string; roles: string[]; onRefresh: () => void }) {
    const { showToast } = useToast();
    const [allRoles, setAllRoles] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axiosClient.get(ROLE_ENDPOINTS.LIST)
            .then(res => setAllRoles(res.data?.data || res.data || []))
            .catch(err => console.error(err));
    }, []);

    const handleAddRole = async () => {
        if (!selectedRole) return showToast("Vui lòng chọn vai trò", "warning");
        setLoading(true);
        try {
            await axiosClient.post(STAFF_MANAGEMENT_ENDPOINTS.ROLES(userId), { role: selectedRole });
            showToast("Thêm vai trò thành công", "success");
            setShowAddModal(false);
            setSelectedRole("");
            onRefresh();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Lỗi khi thêm vai trò", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveRole = async (roleCode: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa vai trò ${roleCode} khỏi người dùng này?`)) return;
        
        // Find role_id based on code
        const roleObj = allRoles.find(r => String(r.code).toUpperCase() === roleCode.toUpperCase() || r.name === roleCode || r.id === roleCode);
        const roleIdToDelete = roleObj?.id || roleCode;

        try {
            await axiosClient.delete(STAFF_MANAGEMENT_ENDPOINTS.REMOVE_ROLE(userId, roleIdToDelete));
            showToast("Xóa vai trò thành công", "success");
            onRefresh();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Lỗi khi xóa vai trò", "error");
        }
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6 relative">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">shield_person</span>
                    Vai trò hiện tại
                </h2>
                <button 
                    onClick={() => setShowAddModal(!showAddModal)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#f0f4f8] dark:bg-[#2d353e] text-[#3C81C6] rounded-xl text-sm font-semibold hover:bg-[#e1e9f0] dark:hover:bg-[#3a4450] transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Thêm vai trò
                </button>
            </div>
            
            {roles && roles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {roles.map((role, idx) => {
                        const rCode = role as Role;
                        const roleColor = ROLE_COLORS[rCode] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
                        const rLabel = ROLE_LABELS[rCode] || role;
                        
                        return (
                            <div key={idx} className="flex flex-col p-4 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-gray-50/50 dark:bg-[#1e242b] hover:border-[#3C81C6] hover:shadow-sm transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot} mr-1.5`} />
                                        {rLabel}
                                    </span>
                                    <button onClick={() => handleRemoveRole(rCode)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                                <p className="text-xs text-[#687582] dark:text-gray-400 mt-auto">Quyền truy cập trên hệ thống</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="w-16 h-16 bg-white dark:bg-[#2d353e] rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <span className="material-symbols-outlined text-3xl text-gray-400">gpp_bad</span>
                    </div>
                    <h3 className="text-base font-bold text-[#121417] dark:text-white mb-2">Chưa phân vai trò</h3>
                    <p className="text-sm text-[#687582] max-w-sm">Người dùng này chưa được chỉ định cấu hình vai trò nào trên hệ thống.</p>
                </div>
            )}

            {showAddModal && (
                <div className="absolute top-16 right-6 w-80 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] shadow-xl rounded-xl p-4 z-10">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3">Chọn vai trò cần thêm</h3>
                    <select 
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full text-sm p-2 mb-4 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg bg-gray-50 dark:bg-[#1e242b] outline-none focus:border-[#3C81C6] text-[#121417] dark:text-white"
                    >
                        <option value="">-- Chọn vai trò --</option>
                        {allRoles.map((r, i) => (
                            <option key={r.id || i} value={r.id || r.code}>{r.name || r.code}</option>
                        ))}
                    </select>
                    <div className="flex justify-end gap-2">
                        <button 
                            disabled={loading}
                            onClick={() => setShowAddModal(false)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                        >
                            Hủy
                        </button>
                        <button 
                            disabled={loading}
                            onClick={handleAddRole}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-lg flex items-center gap-1 transition-colors"
                        >
                            {loading ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span> : null}
                            Xác nhận
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Tab: Bảo mật & Trạng thái ─── */
function SecurityTab({ userId, isActive, onRefresh }: { userId: string; isActive: boolean; onRefresh: () => void }) {
    const { showToast } = useToast();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        axiosClient.get(USER_ENDPOINTS.STATUS_HISTORY(userId))
            .then(res => {
                if (mounted) setHistory(res.data?.data || res.data || []);
            })
            .catch(err => console.error(err))
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [userId, isActive]); // Reload history when status changes

    const handleToggleLock = async () => {
        if (!window.confirm(`Bạn có chắc chắn muốn ${isActive ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) return;
        setIsActionLoading(true);
        try {
            if (isActive) {
                await axiosClient.patch(USER_ENDPOINTS.LOCK(userId), { reason: "Admin thao tác từ hệ thống" });
                showToast("Khóa tài khoản thành công", "success");
            } else {
                await axiosClient.patch(USER_ENDPOINTS.UNLOCK(userId), { reason: "Admin thao tác mở khóa từ hệ thống" });
                showToast("Mở khóa tài khoản thành công", "success");
            }
            onRefresh();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Lỗi thao tác", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn khôi phục mật khẩu? Hệ thống sẽ tạo và báo mật khẩu mới cho người dùng.")) return;
        setIsActionLoading(true);
        try {
            await axiosClient.post(USER_ENDPOINTS.RESET_PASSWORD(userId), {});
            showToast("Khôi phục mật khẩu thành công", "success");
        } catch (error: any) {
            showToast(error.response?.data?.message || "Lỗi khôi phục mật khẩu", "error");
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lịch sử bảo mật */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">security_update_good</span>
                    Lịch sử trạng thái tài khoản
                </h2>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : history.length > 0 ? (
                    <div className="space-y-4">
                        {history.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#3C81C6] dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#121417] dark:text-white">{item.status || "Cập nhật trạng thái"}</p>
                                    <p className="text-xs text-[#687582] mt-1">{item.reason || "Hệ thống ghi nhận sự thay đổi trạng thái"}</p>
                                    <p className="text-xs font-semibold text-gray-400 mt-2">{new Date(item.created_at || Date.now()).toLocaleString("vi-VN")}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                        <div className="w-12 h-12 bg-white dark:bg-[#1e242b] rounded-full flex items-center justify-center mb-3 mx-auto shadow-sm">
                            <span className="material-symbols-outlined text-2xl text-gray-300">hourglass_empty</span>
                        </div>
                        <p className="text-sm text-[#687582]">Chưa có bản ghi lịch sử trạng thái.</p>
                    </div>
                )}
            </div>

            {/* Hành động */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                    <h2 className="text-base font-bold text-[#121417] dark:text-white mb-2">Mật khẩu</h2>
                    <p className="text-sm text-[#687582] dark:text-gray-400 mb-5">Cấp lại mật khẩu mới cho người dùng. Họ sẽ phải đổi mật khẩu ở lần đăng nhập tiếp theo.</p>
                    <button 
                        onClick={handleResetPassword}
                        disabled={isActionLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isActionLoading ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[18px]">key</span>}
                        {isActionLoading ? "Đang xử lý..." : "Khôi Phục Mật Khẩu"}
                    </button>
                </div>

                <div className="bg-white dark:bg-[#1e242b] border border-red-200 dark:border-red-900/30 rounded-xl shadow-sm p-6">
                    <h2 className="text-base font-bold text-red-600 dark:text-red-400 mb-2">Trạng thái Khóa</h2>
                    <p className="text-sm text-[#687582] dark:text-gray-400 mb-5">Thay đổi quyến truy cập người dùng này vào hệ thống. Hành động này có hiệu lực tức thì.</p>
                    {isActive ? (
                        <button 
                            onClick={handleToggleLock}
                            disabled={isActionLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                        >
                            {isActionLoading ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[18px]">lock</span>}
                            {isActionLoading ? "Đang xử lý..." : "Khóa Tài Khoản"}
                        </button>
                    ) : (
                        <button 
                            onClick={handleToggleLock}
                            disabled={isActionLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30 rounded-xl text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
                        >
                            {isActionLoading ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[18px]">lock_open</span>}
                            {isActionLoading ? "Đang xử lý..." : "Mở Khóa Tài Khoản"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Hoạt động ─── */
function ActivityTab({ userId }: { userId: string }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchAuditLogs = async () => {
            try {
                const axiosClient = (await import('@/api/axiosClient')).default;
                const { AUDIT_LOG_ENDPOINTS } = await import('@/api/endpoints');
                
                const res = await axiosClient.get(AUDIT_LOG_ENDPOINTS.LIST, { 
                    params: { user_id: userId, limit: 20, sort_by: 'created_at', sort_dir: 'DESC' } 
                });
                
                if (mounted) {
                    const logs = res.data?.data || res.data || [];
                    setActivities(logs);
                }
            } catch (err) {
                console.error("Failed to fetch audit logs:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (userId) {
            fetchAuditLogs();
        } else {
            setLoading(false);
        }
        return () => { mounted = false; };
    }, [userId]);

    const getActivityDetails = (log: any) => {
        const { module_name, action_type, action_desc } = log;
        let action = action_desc || "Thao tác trên hệ thống";
        let icon = "history";
        let color = "bg-gray-100 dark:bg-gray-800 text-gray-600";

        // Map icons & colors based on ACTION_TYPE
        if (action_type === "LOGIN") {
            action = "Đăng nhập hệ thống";
            icon = "login";
            color = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
        } else if (action_type === "CREATE") {
            icon = "add_circle";
            color = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
            if (module_name === "APPOINTMENTS") action = "Tạo lịch hẹn mới";
        } else if (action_type === "UPDATE") {
            icon = "edit_note";
            color = "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
            if (module_name === "APPOINTMENTS") action = "Cập nhật thông tin lịch hẹn";
        } else if (action_type === "DELETE") {
            icon = "delete";
            color = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
        } else if (action_type === "CANCEL") {
            icon = "cancel";
            color = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
            if (module_name === "APPOINTMENTS") action = "Huỷ lịch hẹn khám";
        } else if (action_type === "COMPLETE") {
            icon = "check_circle";
            color = "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400";
            if (module_name === "APPOINTMENTS") action = "Hoàn tất khám bệnh";
        }

        // Specific overrides context
        if (module_name === "APPOINTMENTS" && icon === "history") icon = "calendar_month";
        if (module_name === "PATIENTS") icon = "personal_injury";
        if (module_name === "PRESCRIPTIONS") icon = "medication";

        return { action, icon, color };
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "Không rõ thời gian";
        const date = new Date(dateStr);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6 line-clamp-none">
            <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">history</span>
                Lịch sử hoạt động
            </h2>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-4 text-sm text-[#687582] font-medium">Đang tải dữ liệu hoạt động...</span>
                </div>
            ) : activities.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-[#dde0e4] dark:border-[#2d353e] space-y-6">
                    {activities.map((log: any, i: number) => {
                        const { action, icon, color } = getActivityDetails(log);
                        return (
                            <div key={log.id || i} className="relative">
                                {/* Dot indicator */}
                                <div className={`absolute -left-[35px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1e242b] bg-[#3C81C6]`} />
                                
                                <div className="bg-gray-50/50 dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                            <span className="material-symbols-outlined text-[24px]">{icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <p className="text-base font-bold text-[#121417] dark:text-white">
                                                    {action}
                                                </p>
                                                <span className="text-xs font-medium text-[#687582] whitespace-nowrap bg-white dark:bg-gray-900 border border-[#dde0e4] dark:border-gray-700 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                    {formatDate(log.created_at || log.action_time)}
                                                </span>
                                            </div>
                                            
                                            {log.action_desc && log.action_desc !== action && (
                                                <p className="text-sm text-[#687582] dark:text-gray-400 bg-white dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-[#dde0e4] dark:border-gray-700/50 mt-2">
                                                    {log.action_desc}
                                                </p>
                                            )}

                                            {log.ip_address && (
                                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                                                    <span className="material-symbols-outlined text-[14px]">cell_wifi</span>
                                                    IP: {log.ip_address}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="w-16 h-16 bg-white dark:bg-[#2d353e] rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <span className="material-symbols-outlined text-3xl text-gray-400">history_toggle_off</span>
                    </div>
                    <h3 className="text-base font-bold text-[#121417] dark:text-white mb-2">Chưa có hoạt động</h3>
                    <p className="text-sm text-[#687582] max-w-sm">Người dùng này chưa có hoạt động nào được ghi nhận trên hệ thống.</p>
                </div>
            )}
        </div>
    );
}

/* ─── Tab: Chi nhánh/Phòng ban ─── */
function BranchesTab({ userId }: { userId: string }) {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        axiosClient.get(`${STAFF_ENDPOINTS.DETAIL(userId)}/branches`)
            .then(res => {
                if (mounted) setBranches(res.data?.data || res.data || []);
            })
            .catch(err => {
                console.error(err);
                if (mounted) setBranches([]);
            })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [userId]);

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">domain</span>
                Chi nhánh & Phòng ban
            </h2>
            
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : branches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map((branch, idx) => (
                        <div key={idx} className="p-4 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-gray-50/50 dark:bg-gray-800/30 hover:border-[#3C81C6] transition-colors">
                            <p className="text-sm font-bold text-[#121417] dark:text-white mb-1">{branch.name}</p>
                            <p className="text-xs text-[#687582] dark:text-gray-400">{branch.code || "—"}</p>
                            {branch.location && <p className="text-xs text-[#687582] dark:text-gray-400 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span>{branch.location}</p>}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">domain</span>
                    <p className="text-sm text-[#687582]">Chưa được gán chi nhánh/phòng ban</p>
                </div>
            )}
        </div>
    );
}

/* ─── Tab: Chuyên môn ─── */
function SpecialtyTab({ user, userId, isDoctor }: { user: UserDetailVM; userId: string; isDoctor: boolean }) {
    const [doctorInfo, setDoctorInfo] = useState<any>(null);
    const [licenses, setLicenses] = useState<any[]>([]);
    const [signatureUrl, setSignatureUrl] = useState<string | null>(user.signatureUrl ?? null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        const doctorInfoReq = isDoctor
            ? axiosClient.get(`${STAFF_ENDPOINTS.DETAIL(userId)}/doctor-info`).catch(() => ({ data: {} }))
            : Promise.resolve({ data: {} });
        
        Promise.all([
            doctorInfoReq,
            axiosClient.get(STAFF_MANAGEMENT_ENDPOINTS.LICENSES(userId)).catch(() => ({ data: [] })),
            axiosClient.get(STAFF_ENDPOINTS.DETAIL(userId)).catch(() => ({ data: {} })),
        ])
            .then(([infoRes, licensesRes, detailRes]) => {
                if (mounted) {
                    setDoctorInfo(infoRes.data?.data || infoRes.data || {});
                    setLicenses(licensesRes.data?.data || licensesRes.data || []);
                    const detail = detailRes.data?.data || detailRes.data || {};
                    const sig = getImageUrl(detail?.signature_url ?? detail?.signatureUrl ?? detail?.signature ?? "");
                    setSignatureUrl(sig || null);
                }
            })
            .catch(err => console.error(err))
            .finally(() => { if (mounted) setLoading(false); });

        return () => { mounted = false; };
    }, [userId, isDoctor]);

    return (
        <div className="space-y-6">
            {/* Thông tin chuyên môn cơ bản */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">stethoscope</span>
                    Thông tin chuyên môn
                </h2>
                
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {!isDoctor ? (
                            <div className="p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-gray-50/50 dark:bg-gray-800/30 text-sm text-[#687582]">
                                Nhân sự này không phải bác sĩ. Một số thông tin chuyên môn có thể không áp dụng.
                            </div>
                        ) : null}
                        <InfoRow label="Chuyên khoa" value={user.specialty || doctorInfo?.specialty || "—"} icon="domain" />
                        <InfoRow label="Chức danh" value={user.title || doctorInfo?.title || "—"} icon="badge" />
                        <InfoRow
                            label="Phí khám"
                            value={user.consultation_fee ? `${user.consultation_fee.toLocaleString("vi-VN")} VNĐ` : "—"}
                            icon="payments"
                        />
                        <div className="pt-2">
                            <p className="text-xs text-[#687582] dark:text-gray-400 mb-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#687582]">description</span>
                                Tiểu sử
                            </p>
                            <p className="text-sm font-medium text-[#121417] dark:text-white whitespace-pre-wrap">
                                {user.biography || doctorInfo?.biography || "—"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Ảnh chữ ký chuyên môn */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">draw</span>
                    Ảnh chữ ký chuyên môn
                </h2>
                {signatureUrl ? (
                    <div className="flex items-center justify-center p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-gray-50/50 dark:bg-gray-800/30">
                        <img src={signatureUrl} alt="Chữ ký chuyên môn" className="max-h-40 object-contain" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">draw</span>
                        <p className="text-sm text-[#687582]">Chưa có chữ ký chuyên môn</p>
                    </div>
                )}
            </div>

            {/* Danh sách bằng cấp/chứng chỉ */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">school</span>
                    Danh sách bằng cấp/chứng chỉ (license)
                </h2>
                
                {licenses.length > 0 ? (
                    <div className="space-y-3">
                        {licenses.map((license, idx) => (
                            <div key={idx} className="p-4 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-gray-50/50 dark:bg-gray-800/30 hover:border-[#3C81C6] transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#121417] dark:text-white">{license.name || license.title}</p>
                                        {license.issuer && <p className="text-xs text-[#687582] dark:text-gray-400">Cấp bởi: {license.issuer}</p>}
                                        {license.issue_date && <p className="text-xs text-[#687582] dark:text-gray-400">Ngày cấp: {new Date(license.issue_date).toLocaleDateString('vi-VN')}</p>}
                                        {license.expiry_date && <p className="text-xs text-[#687582] dark:text-gray-400">Hết hạn: {new Date(license.expiry_date).toLocaleDateString('vi-VN')}</p>}
                                    </div>
                                    {license.status && (
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                            license.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                        }`}>
                                            {license.status === 'ACTIVE' ? 'Hiệu lực' : 'Hết hạn'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">school</span>
                        <p className="text-sm text-[#687582]">Chưa có bằng cấp hoặc chứng chỉ nào</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Tab: Lịch làm việc ─── */
function ScheduleTab({ userId }: { userId: string }) {
    const { showToast } = useToast();
    const { isAdmin } = usePermission();

    const [viewMode, setViewMode] = useState<"week" | "month">("week");
    const [selectedDate, setSelectedDate] = useState(() => toYMDLocal(new Date()));
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
    const [shifts, setShifts] = useState<WorkShift[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<StaffSchedule | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<{ workDate: string; shiftId: string; note: string }>({
        workDate: selectedDate,
        shiftId: "",
        note: "",
    });

    const range = useMemo(() => {
        const d = parseYMDLocal(selectedDate);
        if (Number.isNaN(d.getTime())) return { from: selectedDate, to: selectedDate };

        if (viewMode === "month") {
            const first = new Date(d.getFullYear(), d.getMonth(), 1);
            const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            return {
                from: toYMDLocal(first),
                to: toYMDLocal(last),
            };
        }

        // Monday -> Sunday
        const day = d.getDay(); // 0 Sun ... 6 Sat
        const diffToMonday = (day + 6) % 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
            from: toYMDLocal(monday),
            to: toYMDLocal(sunday),
        };
    }, [selectedDate, viewMode]);

    const schedulesByDate = useMemo(() => {
        const map: Record<string, StaffSchedule[]> = {};
        for (const s of schedules) {
            const dateKey = String(
                (s as any).workDate ??
                    (s as any).work_date ??
                    (s as any).working_date ??
                    (s as any).workingDate ??
                    ""
            ).slice(0, 10);
            if (!dateKey) continue;
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(s);
        }
        return map;
    }, [schedules]);

    const daySchedules = useMemo(() => {
        const list = schedulesByDate[selectedDate] ?? [];
        return list.filter((s) => {
            const st = String((s as any).status ?? "").toUpperCase();
            const suspended = st === "SUSPENDED";
            if (statusFilter === "all") return true;
            if (statusFilter === "active") return !suspended;
            return suspended;
        });
    }, [schedulesByDate, selectedDate, statusFilter]);

    const reload = async () => {
        setLoading(true);
        try {
            const d = parseYMDLocal(selectedDate);
            const scheduleReq =
                viewMode === "month"
                    ? staffScheduleService.getCalendar(d.getMonth() + 1, d.getFullYear(), { staffId: userId, staff_id: userId } as any)
                    : staffScheduleService.getByStaff(userId, { from: range.from, to: range.to });

            const shiftPromise = workShiftService.getList({ limit: 200, isActive: true } as any);
            const scheduleList = await scheduleReq;
            let scheduleData = scheduleList.data || [];

            // Fallback: một số môi trường BE không hỗ trợ filter params / calendar theo staff
            if (scheduleData.length === 0) {
                const fallback = await staffScheduleService.getByStaff(userId);
                const all = fallback.data || [];
                scheduleData = all.filter((s: any) => {
                    const dateKey = String(
                        s.workDate ?? s.work_date ?? s.working_date ?? s.workingDate ?? ""
                    ).slice(0, 10);
                    if (!dateKey) return false;
                    return dateKey >= range.from && dateKey <= range.to;
                });
            }

            const shiftList = await shiftPromise;
            setSchedules(scheduleData);
            setShifts(shiftList.data);
        } catch (err) {
            console.error(err);
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, range.from, range.to]);

    const openCreate = () => {
        setEditing(null);
        setForm({ workDate: selectedDate, shiftId: "", note: "" });
        setShowModal(true);
    };

    const openEdit = (s: StaffSchedule) => {
        setEditing(s);
        setForm({
            workDate: String((s as any).workDate ?? (s as any).work_date ?? (s as any).working_date ?? selectedDate).slice(0, 10),
            shiftId: String((s as any).shiftId ?? (s as any).shift_id ?? ""),
            note: String((s as any).note ?? ""),
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.workDate || !form.shiftId) {
            showToast("Vui lòng chọn ngày và ca làm", "warning");
            return;
        }
        setSaving(true);
        try {
            if (editing?.id) {
                await staffScheduleService.update(editing.id, {
                    workDate: form.workDate,
                    shiftId: form.shiftId,
                    note: form.note || undefined,
                } as any);
                showToast("Cập nhật ca trực thành công", "success");
            } else {
                await staffScheduleService.create({
                    staffId: userId,
                    workDate: form.workDate,
                    shiftId: form.shiftId,
                    note: form.note || undefined,
                } as any);
                showToast("Tạo ca trực thành công", "success");
            }
            setShowModal(false);
            await reload();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Lỗi khi lưu ca trực", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (scheduleId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa ca trực này?")) return;
        try {
            await staffScheduleService.delete(scheduleId);
            showToast("Xóa ca trực thành công", "success");
            await reload();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Lỗi khi xóa ca trực", "error");
        }
    };

    const handleSuspend = async (scheduleId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn tạm dừng ca trực này?")) return;
        try {
            await staffScheduleService.suspend(scheduleId);
            showToast("Tạm dừng ca trực thành công", "success");
            await reload();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Lỗi khi tạm dừng", "error");
        }
    };

    const handleResume = async (scheduleId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn hoạt động lại ca trực này?")) return;
        try {
            await staffScheduleService.resume(scheduleId);
            showToast("Hoạt động lại ca trực thành công", "success");
            await reload();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Lỗi khi hoạt động lại", "error");
        }
    };

    const monthTitle = useMemo(() => {
        const d = parseYMDLocal(selectedDate);
        if (Number.isNaN(d.getTime())) return "";
        return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
    }, [selectedDate]);

    const weekTitle = useMemo(() => {
        const from = parseYMDLocal(range.from);
        const to = parseYMDLocal(range.to);
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "";
        return `${from.toLocaleDateString("vi-VN")} - ${to.toLocaleDateString("vi-VN")}`;
    }, [range.from, range.to]);

    return (
        <div className="space-y-6">
            {/* Calendar controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode("week")}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                            viewMode === "week"
                                ? "bg-[#3C81C6] text-white border-[#3C81C6]"
                                : "bg-white dark:bg-[#1e242b] text-[#687582] border-[#dde0e4] dark:border-[#2d353e] hover:text-[#3C81C6]"
                        }`}
                    >
                        Tuần
                    </button>
                    <button
                        onClick={() => setViewMode("month")}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                            viewMode === "month"
                                ? "bg-[#3C81C6] text-white border-[#3C81C6]"
                                : "bg-white dark:bg-[#1e242b] text-[#687582] border-[#dde0e4] dark:border-[#2d353e] hover:text-[#3C81C6]"
                        }`}
                    >
                        Tháng
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-[#121417] dark:text-white">Chọn ngày:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white text-sm"
                    />
                    {isAdmin ? (
                        <button
                            onClick={openCreate}
                            className="ml-2 flex items-center gap-2 px-4 py-2 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Tạo ca
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">calendar_month</span>
                        {viewMode === "month" ? monthTitle : weekTitle}
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#687582] dark:text-gray-400">Trạng thái:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white text-sm"
                        >
                            <option value="all">Tất cả</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>

                {viewMode === "week" ? (
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => {
                            const base = parseYMDLocal(range.from);
                            base.setDate(base.getDate() + i);
                            const key = toYMDLocal(base);
                            const count = (schedulesByDate[key] ?? []).length;
                            const isSelected = key === selectedDate;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedDate(key)}
                                    className={`p-3 rounded-xl border text-left transition-colors ${
                                        isSelected
                                            ? "border-[#3C81C6] bg-blue-50 dark:bg-blue-900/20"
                                            : "border-[#dde0e4] dark:border-[#2d353e] hover:border-[#3C81C6]"
                                    }`}
                                >
                                    <p className="text-xs text-[#687582] dark:text-gray-400">
                                        {base.toLocaleDateString("vi-VN", { weekday: "short" })}
                                    </p>
                                    <p className="text-sm font-bold text-[#121417] dark:text-white">
                                        {base.getDate()}/{base.getMonth() + 1}
                                    </p>
                                    <p className="text-xs text-[#687582] dark:text-gray-400 mt-1">{count} ca</p>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <MonthCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} schedulesByDate={schedulesByDate} />
                )}
            </div>

            {/* Day timeline view */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">calendar_view_day</span>
                    Lịch trực ngày {parseYMDLocal(selectedDate).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : daySchedules.length > 0 ? (
                    <DayTimeline
                        schedules={daySchedules}
                        isAdmin={isAdmin}
                        onEdit={openEdit}
                        onSuspend={handleSuspend}
                        onResume={handleResume}
                        onDelete={handleDelete}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-[#dde0e4] dark:border-[#2d353e]">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">calendar_today</span>
                        <p className="text-sm text-[#687582]">Không có ca trực nào trong ngày này</p>
                    </div>
                )}
            </div>

            {showModal ? (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl border border-[#dde0e4] dark:border-[#2d353e] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-base font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]">calendar_add_on</span>
                                {editing ? "Sửa ca trực" : "Tạo ca trực"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px] text-[#687582]">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Ngày làm</label>
                                <input
                                    type="date"
                                    value={form.workDate}
                                    onChange={(e) => setForm((p) => ({ ...p, workDate: e.target.value }))}
                                    className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Ca làm</label>
                                <CustomSelect
                                    options={[
                                        { id: "", name: "— Chọn ca —" },
                                        ...shifts.map((s) => ({ id: s.id, name: `${s.name} (${s.startTime}-${s.endTime})` })),
                                    ]}
                                    value={form.shiftId}
                                    onChange={(value) => setForm((p) => ({ ...p, shiftId: String(value) }))}
                                    icon="schedule"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Ghi chú</label>
                                <input
                                    value={form.note}
                                    onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                                    className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white"
                                    placeholder="(tuỳ chọn)"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={saving}
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-bold text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                )}
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function MonthCalendar({
    selectedDate,
    onSelectDate,
    schedulesByDate,
}: {
    selectedDate: string;
    onSelectDate: (d: string) => void;
    schedulesByDate: Record<string, StaffSchedule[]>;
}) {
    const d = parseYMDLocal(selectedDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = (first.getDay() + 6) % 7; // Monday=0
    const daysInMonth = last.getDate();
    const cells = Array.from({ length: startDay + daysInMonth });
    return (
        <div>
            <div className="grid grid-cols-7 gap-2 mb-2">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((w) => (
                    <div key={w} className="text-xs font-semibold text-[#687582] dark:text-gray-400 text-center">
                        {w}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {cells.map((_, idx) => {
                    const dayNum = idx - startDay + 1;
                    if (dayNum < 1 || dayNum > daysInMonth) return <div key={idx} className="h-16" />;
                    const dateObj = new Date(year, month, dayNum);
                    const key = toYMDLocal(dateObj);
                    const count = (schedulesByDate[key] ?? []).length;
                    const isSelected = key === selectedDate;
                    return (
                        <button
                            key={key}
                            onClick={() => onSelectDate(key)}
                            className={`h-16 p-2 rounded-xl border text-left transition-colors ${
                                isSelected
                                    ? "border-[#3C81C6] bg-blue-50 dark:bg-blue-900/20"
                                    : "border-[#dde0e4] dark:border-[#2d353e] hover:border-[#3C81C6]"
                            }`}
                        >
                            <p className="text-sm font-bold text-[#121417] dark:text-white">{dayNum}</p>
                            <p className="text-xs text-[#687582] dark:text-gray-400">{count} ca</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Day timeline: hiển thị các ca theo giờ trong ngày ─── */
function DayTimeline({
    schedules,
    isAdmin,
    onEdit,
    onSuspend,
    onResume,
    onDelete,
}: {
    schedules: StaffSchedule[];
    isAdmin: boolean;
    onEdit: (s: StaffSchedule) => void;
    onSuspend: (id: string) => void;
    onResume: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const HOUR_START = 6;
    const HOUR_END = 22;
    const totalHours = HOUR_END - HOUR_START;
    const hours = Array.from({ length: totalHours + 1 }, (_, i) => HOUR_START + i);

    const parseHourMinute = (value?: string): number | null => {
        if (!value) return null;
        const [h, m] = String(value).split(":");
        const hour = Number(h);
        const minute = Number(m ?? 0);
        if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
        return hour + minute / 60;
    };

    const getShiftKind = (startHour: number): "morning" | "afternoon" | "night" => {
        if (startHour < 12) return "morning";
        if (startHour < 18) return "afternoon";
        return "night";
    };

    const KIND_STYLE: Record<string, { bg: string; border: string; text: string; dot: string; icon: string; label: string }> = {
        morning: { bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-300 dark:border-amber-700", text: "text-amber-800 dark:text-amber-200", dot: "bg-amber-500", icon: "wb_sunny", label: "Ca sáng" },
        afternoon: { bg: "bg-sky-100 dark:bg-sky-900/30", border: "border-sky-300 dark:border-sky-700", text: "text-sky-800 dark:text-sky-200", dot: "bg-sky-500", icon: "wb_twilight", label: "Ca chiều" },
        night: { bg: "bg-violet-100 dark:bg-violet-900/30", border: "border-violet-300 dark:border-violet-700", text: "text-violet-800 dark:text-violet-200", dot: "bg-violet-500", icon: "bedtime", label: "Ca tối" },
    };

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
                {Object.entries(KIND_STYLE).map(([key, s]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                        <span className="text-[#687582] dark:text-gray-400">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Timeline */}
            <div className="relative border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-gray-50/30 dark:bg-gray-800/20 overflow-hidden">
                {/* Hour grid */}
                <div className="relative h-12 border-b border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#1e242b]">
                    {hours.map((h, idx) => (
                        <div
                            key={h}
                            className="absolute top-0 bottom-0 flex items-center justify-center text-[11px] font-semibold text-[#687582] dark:text-gray-400"
                            style={{ left: `${(idx / totalHours) * 100}%`, transform: "translateX(-50%)" }}
                        >
                            {h}:00
                        </div>
                    ))}
                </div>

                {/* Rows of shifts */}
                <div className="relative p-3 space-y-2 min-h-[200px]">
                    {/* Vertical hour lines */}
                    {hours.map((h, idx) => (
                        <div
                            key={`line-${h}`}
                            className="absolute top-0 bottom-0 w-px bg-[#dde0e4]/50 dark:bg-[#2d353e]/50 pointer-events-none"
                            style={{ left: `${(idx / totalHours) * 100}%` }}
                        />
                    ))}

                    {schedules.map((schedule, idx) => {
                        const shiftName = (schedule as any).shiftName ?? (schedule as any).shift_name ?? "Ca trực";
                        const startTime = String((schedule as any).startTime ?? (schedule as any).start_time ?? "").slice(0, 5);
                        const endTime = String((schedule as any).endTime ?? (schedule as any).end_time ?? "").slice(0, 5);
                        const status = String((schedule as any).status ?? "").toUpperCase();
                        const suspended = status === "SUSPENDED";

                        const startVal = parseHourMinute(startTime) ?? HOUR_START;
                        const endVal = parseHourMinute(endTime) ?? startVal + 1;
                        const clampedStart = Math.max(HOUR_START, Math.min(HOUR_END, startVal));
                        const clampedEnd = Math.max(HOUR_START, Math.min(HOUR_END, endVal));
                        const leftPct = ((clampedStart - HOUR_START) / totalHours) * 100;
                        const widthPct = Math.max(8, ((clampedEnd - clampedStart) / totalHours) * 100);

                        const kind = getShiftKind(clampedStart);
                        const style = KIND_STYLE[kind];

                        return (
                            <div key={schedule.id ?? idx} className="relative h-16">
                                <div
                                    className={`absolute top-0 bottom-0 rounded-xl border-2 ${style.bg} ${style.border} px-3 py-2 flex items-center gap-2 shadow-sm transition-all hover:shadow-md ${suspended ? "opacity-60" : ""}`}
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: "120px" }}
                                >
                                    <span className={`material-symbols-outlined text-[20px] ${style.text} flex-shrink-0`}>{style.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold ${style.text} truncate`}>{shiftName}</p>
                                        <p className={`text-[11px] ${style.text} opacity-80 truncate`}>
                                            {startTime && endTime ? `${startTime} – ${endTime}` : "—"}
                                        </p>
                                    </div>
                                    {suspended ? (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-black/30 text-orange-700 dark:text-orange-300 flex-shrink-0">
                                            Tạm dừng
                                        </span>
                                    ) : null}
                                    {isAdmin ? (
                                        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-70 hover:opacity-100">
                                            <button
                                                onClick={() => onEdit(schedule)}
                                                className="p-1 rounded hover:bg-white/60 dark:hover:bg-black/30 transition-colors"
                                                title="Sửa"
                                            >
                                                <span className={`material-symbols-outlined text-[16px] ${style.text}`}>edit</span>
                                            </button>
                                            {suspended ? (
                                                <button
                                                    onClick={() => onResume(schedule.id)}
                                                    className="p-1 rounded hover:bg-white/60 dark:hover:bg-black/30 transition-colors"
                                                    title="Hoạt động lại"
                                                >
                                                    <span className={`material-symbols-outlined text-[16px] ${style.text}`}>play_circle</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onSuspend(schedule.id)}
                                                    className="p-1 rounded hover:bg-white/60 dark:hover:bg-black/30 transition-colors"
                                                    title="Tạm dừng"
                                                >
                                                    <span className={`material-symbols-outlined text-[16px] ${style.text}`}>pause_circle</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDelete(schedule.id)}
                                                className="p-1 rounded hover:bg-white/60 dark:hover:bg-black/30 transition-colors"
                                                title="Xóa"
                                            >
                                                <span className={`material-symbols-outlined text-[16px] ${style.text}`}>delete</span>
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Phân công ─── */
function AssignmentsTab({
    userId,
    roles,
    onRefresh,
}: {
    userId: string;
    roles: string[];
    onRefresh: () => void;
}) {
    const { isAdmin } = usePermission();
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">assignment_ind</span>
                    Phân công
                </h2>
                <p className="text-sm text-[#687582] dark:text-gray-400">
                    Quản trị phân công chi nhánh/phòng ban và gán/thu hồi vai trò hệ thống.
                </p>
            </div>

            {!isAdmin ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">lock</span>
                    <p className="text-sm text-[#687582]">Bạn không có quyền quản trị phân công.</p>
                </div>
            ) : (
                <>
                    <BranchAssignmentPanel userId={userId} />
                    <RolesTab userId={userId} roles={roles} onRefresh={onRefresh} />
                </>
            )}
        </div>
    );
}

function BranchAssignmentPanel({ userId }: { userId: string }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<any[]>([]);

    const [facilities, setFacilities] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);

    const [form, setForm] = useState({
        facilityId: "",
        branchId: "",
        departmentId: "",
        roleTitle: "",
    });

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get(STAFF_ENDPOINTS.DETAIL(userId));
            const raw = res.data?.data || res.data || {};
            const list = raw?.facilities ?? raw?.assignments ?? [];
            setAssignments(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error(err);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        facilityService
            .getList({ limit: 100 })
            .then((r) => setFacilities(r.data || []))
            .catch(() => {});
        void loadAssignments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
        if (!form.facilityId) {
            setBranches([]);
            setForm((p) => ({ ...p, branchId: "", departmentId: "" }));
            return;
        }
        branchService
            .getList({ facility_id: form.facilityId, limit: 100 } as any)
            .then((r) => setBranches(r.data || []))
            .catch(() => {});
        setForm((p) => ({ ...p, branchId: "", departmentId: "" }));
    }, [form.facilityId]);

    useEffect(() => {
        if (!form.branchId) {
            setDepartments([]);
            setForm((p) => ({ ...p, departmentId: "" }));
            return;
        }
        getDepartments({ branch_id: form.branchId, limit: 100 } as any)
            .then((r) => setDepartments(unwrapDepartments(r)))
            .catch(() => setDepartments([]));
        setForm((p) => ({ ...p, departmentId: "" }));
    }, [form.branchId]);

    const handleAssign = async () => {
        if (!form.branchId) {
            showToast("Vui lòng chọn chi nhánh", "warning");
            return;
        }
        try {
            await axiosClient.post(STAFF_MANAGEMENT_ENDPOINTS.BRANCHES(userId), {
                facility_id: form.facilityId || undefined,
                branch_id: form.branchId,
                department_id: form.departmentId || undefined,
                role_title: form.roleTitle || undefined,
            });
            showToast("Phân công chi nhánh/phòng ban thành công", "success");
            setForm((p) => ({ ...p, branchId: "", departmentId: "", roleTitle: "" }));
            await loadAssignments();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Lỗi khi phân công", "error");
        }
    };

    const handleRemove = async (branchId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn gỡ phân công chi nhánh này?")) return;
        try {
            await axiosClient.delete(STAFF_MANAGEMENT_ENDPOINTS.REMOVE_BRANCH(userId, branchId));
            showToast("Gỡ phân công thành công", "success");
            await loadAssignments();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Lỗi khi gỡ phân công", "error");
        }
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">domain_add</span>
                Phân công chi nhánh/phòng ban
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Cơ sở</label>
                    <CustomSelect
                        options={[{ id: "", name: "— Chọn cơ sở —" }, ...facilities.map((f) => ({ id: f.id, name: f.name }))]}
                        value={form.facilityId}
                        onChange={(value) => setForm((p) => ({ ...p, facilityId: String(value) }))}
                        icon="apartment"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Chi nhánh</label>
                    <CustomSelect
                        options={[{ id: "", name: "— Chọn chi nhánh —" }, ...branches.map((b) => ({ id: b.id, name: b.name }))]}
                        value={form.branchId}
                        onChange={(value) => setForm((p) => ({ ...p, branchId: String(value) }))}
                        icon="domain"
                        disabled={!form.facilityId}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Phòng ban</label>
                    <CustomSelect
                        options={[{ id: "", name: "— (tuỳ chọn) —" }, ...departments.map((d) => ({ id: d.id, name: d.name }))]}
                        value={form.departmentId}
                        onChange={(value) => setForm((p) => ({ ...p, departmentId: String(value) }))}
                        icon="meeting_room"
                        disabled={!form.branchId}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Role title</label>
                    <input
                        value={form.roleTitle}
                        onChange={(e) => setForm((p) => ({ ...p, roleTitle: e.target.value }))}
                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white"
                        placeholder="VD: Bác sĩ điều trị"
                    />
                </div>
            </div>

            <div className="flex justify-end mb-6">
                <button
                    onClick={handleAssign}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Phân công
                </button>
            </div>

            <div className="border-t border-[#dde0e4] dark:border-[#2d353e] pt-6">
                <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6] text-[18px]">domain</span>
                    Danh sách đang công tác
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : assignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignments.map((a, idx) => {
                            const branchId = String(a.branch_id ?? a.branchId ?? a.id ?? "");
                            const branchName = a.branch_name ?? a.branchName ?? a.name ?? "—";
                            const departmentName = a.department_name ?? a.departmentName ?? null;
                            const facilityName = a.facility_name ?? a.facilityName ?? null;
                            const roleTitle = a.role_title ?? a.roleTitle ?? null;
                            return (
                                <div
                                    key={a.user_branch_dept_id ?? `${branchId}-${idx}`}
                                    className="p-4 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-gray-50/50 dark:bg-gray-800/30 flex items-start justify-between gap-3"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#121417] dark:text-white">{branchName}</p>
                                        {facilityName ? <p className="text-xs text-[#687582] dark:text-gray-400">Cơ sở: {facilityName}</p> : null}
                                        {departmentName ? <p className="text-xs text-[#687582] dark:text-gray-400">Phòng ban: {departmentName}</p> : null}
                                        {roleTitle ? <p className="text-xs text-[#687582] dark:text-gray-400">Vai trò: {roleTitle}</p> : null}
                                    </div>
                                    {branchId ? (
                                        <button
                                            onClick={() => handleRemove(branchId)}
                                            className="p-2 text-[#687582] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Gỡ phân công"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">domain</span>
                        <p className="text-sm text-[#687582]">Chưa có phân công nào</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Shared component ─── */
function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-[#dde0e4] dark:border-[#2d353e] last:border-0">
            <span className="material-symbols-outlined text-[18px] text-[#687582]">{icon}</span>
            <div className="flex-1">
                <p className="text-xs text-[#687582] dark:text-gray-400">{label}</p>
                <p className="text-sm font-medium text-[#121417] dark:text-white">{value}</p>
            </div>
        </div>
    );
}
