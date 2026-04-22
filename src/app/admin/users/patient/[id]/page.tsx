"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ROLES, ROLE_LABELS, ROLE_COLORS, type Role } from "@/constants/roles";
import { USER_STATUS } from "@/constants/status";
import type { User } from "@/types";
import { getUserById } from "@/services/userService";
import { useToast } from "@/contexts";
import axiosClient from "@/api/axiosClient";
import { USER_ENDPOINTS, ROLE_ENDPOINTS, AUDIT_LOG_ENDPOINTS, EHR_ENDPOINTS, PATIENT_ENDPOINTS, PATIENT_CONTACT_ENDPOINTS } from "@/api/endpoints";
import { getImageUrl } from "@/utils/helpers";
import { ViewProfileModal, ProfileFormModal, ContactFormModal } from "./modals";

const REL_LABELS: Record<string, string> = {
    SELF: "Bản thân",
    PARENT: "Cha/Mẹ",
    CHILD: "Con",
    SPOUSE: "Vợ/Chồng",
    SIBLING: "Anh/Chị/Em",
    OTHER: "Khác"
};

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
    };
}

const TABS = [
    { key: "overview", label: "Thông tin cá nhân", icon: "person" },
    { key: "family_profiles", label: "Hồ sơ gia đình", icon: "family_restroom" },
    { key: "contacts", label: "Liên hệ / Giám hộ", icon: "contact_emergency" },
    { key: "medical_history", label: "Lịch sử khám bệnh", icon: "medical_information" },
    { key: "medication_history", label: "Lịch sử mua thuốc", icon: "prescriptions" },
    { key: "security", label: "Bảo mật", icon: "security" },
];

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<UserDetailVM | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
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
                        onClick={() => router.push(`/admin/users/${userId}/edit`)}
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
                        {TABS.map((tab) => (
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
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="pb-10">
                {activeTab === "overview" && <OverviewTab user={user} isActive={isActive} />}
                {activeTab === "family_profiles" && <FamilyProfilesTab userId={userId} />}
                {activeTab === "contacts" && <ContactsTab userId={userId} />}
                {activeTab === "medical_history" && <MedicalHistoryTab userId={userId} />}
                {activeTab === "medication_history" && <MedicationHistoryTab userId={userId} />}
                {activeTab === "security" && <SecurityTab userId={userId} isActive={isActive} onRefresh={triggerRefresh} />}
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

            <div className="space-y-6">
                <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">settings</span>
                        Cài đặt cá nhân
                    </h2>
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#121417] dark:text-white">Nhận thông báo lịch hẹn</h3>
                                <p className="text-xs text-[#687582] mt-0.5">Qua Email và SMS khi có thay đổi lịch khám</p>
                            </div>
                            <div className="w-11 h-6 bg-[#3C81C6] rounded-full relative cursor-pointer flex-shrink-0 transition-colors">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#dde0e4] dark:bg-[#2d353e]"></div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#121417] dark:text-white">Bảo mật 2 lớp (2FA)</h3>
                                <p className="text-xs text-[#687582] mt-0.5">Bảo vệ tài khoản bằng mã xác thực 2 lớp</p>
                            </div>
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer flex-shrink-0 transition-colors">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                            </div>
                        </div>
                        <div className="w-full h-px bg-[#dde0e4] dark:bg-[#2d353e]"></div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#121417] dark:text-white">Email Marketing</h3>
                                <p className="text-xs text-[#687582] mt-0.5">Nhận các thông tin khuyến mãi và tin tức từ phòng khám</p>
                            </div>
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full relative cursor-pointer flex-shrink-0 transition-colors">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">manage_accounts</span>
                        Thông tin tài khoản
                    </h2>
                    <div className="space-y-4">
                        <InfoRow label="Ngày tạo tài khoản" value={formatDate(user.createdAt)} icon="event" />
                        <InfoRow label="Truy cập cuối" value={user.lastAccess ? formatDate(user.lastAccess) : "-"} icon="schedule" />
                        <InfoRow label="Trạng thái" value={isActive ? "Đang hoạt động" : "Đã khóa"} icon="toggle_on" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Hồ sơ gia đình ─── */
function FamilyProfilesTab({ userId }: { userId: string }) {
    const { showToast } = useToast();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewProfile, setViewProfile] = useState<any>(null);
    const [editProfile, setEditProfile] = useState<any>(null);
    const [showAdd, setShowAdd] = useState(false);

    const fetchProfiles = () => {
        setLoading(true);
        axiosClient.get(PATIENT_ENDPOINTS.BY_ACCOUNT(userId))
            .then(res => setProfiles(res.data?.data || res.data || []))
            .catch(() => showToast("Không thể tải danh sách hồ sơ gia đình", "error"))
            .finally(() => setLoading(false));
    };
    useEffect(() => { fetchProfiles(); }, [userId]);

    const handleDelete = async (profileId: string) => {
        if (!window.confirm("Xóa hồ sơ này?")) return;
        try {
            await axiosClient.delete(PATIENT_ENDPOINTS.DETAIL(profileId));
            showToast("Đã xóa hồ sơ", "success"); fetchProfiles();
        } catch { showToast("Lỗi xóa hồ sơ", "error"); }
    };

    if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">family_restroom</span>Hồ sơ gia đình
                    </h2>
                    <p className="text-sm text-[#687582] mt-1">Danh sách các hồ sơ bệnh nhân được quản lý bởi tài khoản này.</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-[#3C81C6] dark:text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>Thêm Hồ Sơ
                </button>
            </div>
            {profiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {profiles.map((profile, idx) => (
                        <div key={profile.id || idx} className={`flex flex-col border ${profile.is_default ? 'border-[#3C81C6] bg-blue-50/20 dark:bg-blue-900/10' : 'border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#1e242b]'} rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative group`}>
                            {profile.is_default && (<div className="absolute top-0 right-0"><div className="bg-[#3C81C6] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">star</span>MẶC ĐỊNH</div></div>)}
                            <div className="p-5 flex-1">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#3C81C6] dark:text-blue-400 flex items-center justify-center font-bold text-lg shadow-sm border border-blue-200/50 dark:border-blue-800/30 overflow-hidden relative">
                                        {profile.avatar_url || profile.avatar ? (
                                            <img 
                                                src={getImageUrl(profile.avatar_url || profile.avatar)} 
                                                alt={profile.full_name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : null}
                                        <span className="absolute inset-0 flex items-center justify-center -z-10">
                                            {profile.full_name?.charAt(0) || "?"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-10">
                                        <h3 className="text-base font-bold text-[#121417] dark:text-white truncate" title={profile.full_name}>{profile.full_name}</h3>
                                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-[#687582] dark:text-gray-300 rounded-md text-[11px] font-semibold tracking-wide uppercase">
                                            {REL_LABELS[profile.relationship] || profile.relationship || "Bản thân"}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl p-3 border border-gray-100 dark:border-gray-800/50">
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-gray-400">cake</span><span className="text-sm font-medium text-[#121417] dark:text-gray-200">{formatDateOnly(profile.date_of_birth || profile.dob) || "Chưa cập nhật"}</span></div>
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-gray-400">id_card</span><span className="text-sm font-medium text-[#121417] dark:text-gray-200">{profile.id_card_number || profile.identity_card_number || "Chưa cập nhật"}</span></div>
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-gray-400">call</span><span className="text-sm font-medium text-[#121417] dark:text-gray-200">{profile.phone_number || "Chưa cập nhật"}</span></div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-t border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between gap-2">
                                <button onClick={() => setViewProfile(profile)} className="text-sm font-bold text-[#3C81C6] hover:text-blue-700 transition-colors flex items-center gap-1">Chi tiết <span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setEditProfile(profile)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#687582] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Chỉnh sửa"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                    {!profile.is_default && (<button onClick={() => handleDelete(profile.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#687582] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors" title="Xóa hồ sơ"><span className="material-symbols-outlined text-[18px]">delete</span></button>)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="w-16 h-16 bg-white dark:bg-[#2d353e] rounded-full flex items-center justify-center mb-4 shadow-sm"><span className="material-symbols-outlined text-3xl text-gray-400">group_off</span></div>
                    <h3 className="text-base font-bold text-[#121417] dark:text-white mb-2">Chưa có hồ sơ</h3>
                    <p className="text-sm text-[#687582] max-w-sm mb-6">Tài khoản này chưa tạo bất kỳ hồ sơ bệnh nhân nào.</p>
                    <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-all shadow-md shadow-blue-200 dark:shadow-none"><span className="material-symbols-outlined text-[20px]">add</span>Tạo Hồ Sơ Mới</button>
                </div>
            )}
            <ViewProfileModal open={!!viewProfile} onClose={() => setViewProfile(null)} profile={viewProfile} />
            <ProfileFormModal open={showAdd || !!editProfile} onClose={() => { setShowAdd(false); setEditProfile(null); }} onSuccess={() => { fetchProfiles(); showToast(editProfile ? "Cập nhật thành công" : "Tạo hồ sơ thành công", "success"); }} profile={editProfile} accountId={userId} />
        </div>
    );
}

/* ─── Tab: Liên hệ / Giám hộ ─── */
function ContactsTab({ userId }: { userId: string }) {
    const { showToast } = useToast();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddContact, setShowAddContact] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const profRes = await axiosClient.get(PATIENT_ENDPOINTS.BY_ACCOUNT(userId));
            const profs = profRes.data?.data || profRes.data || [];
            setProfiles(profs);
            const allContacts: any[] = [];
            for (const p of profs) {
                try {
                    const cRes = await axiosClient.get(PATIENT_CONTACT_ENDPOINTS.LIST, { params: { patient_id: p.id } });
                    const payload = cRes.data?.data ?? cRes.data ?? null;
                    const items = Array.isArray(payload) ? payload : payload?.data ?? [];
                    (Array.isArray(items) ? items : []).forEach((c: any) => allContacts.push({ ...c, _profileName: p.full_name }));
                } catch { /* skip */ }
            }
            setContacts(allContacts);
        } catch { showToast("Lỗi tải dữ liệu liên hệ", "error"); }
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, [userId]);

    if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div></div>;

    const handleDelete = async (id: string) => {
        if (!window.confirm("Xóa liên hệ này?")) return;
        try { await axiosClient.delete(PATIENT_CONTACT_ENDPOINTS.DELETE(id)); showToast("Đã xóa", "success"); fetchData(); } catch { showToast("Lỗi xóa", "error"); }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-[#3C81C6] rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 border border-blue-100 dark:border-blue-900/30">
                            <span className="material-symbols-outlined text-[24px]">contact_emergency</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#121417] dark:text-white">Liên hệ Khẩn cấp & Người Giám hộ</h2>
                            <p className="text-sm text-[#687582] mt-1">Quản lý các số liên lạc quan trọng cho từng hồ sơ bệnh nhân.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAddContact(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-[#3C81C6] dark:text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">person_add</span>Thêm liên hệ
                    </button>
                </div>
                {contacts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {contacts.map((c, i) => (
                            <div key={c.patient_contacts_id || c.patient_relation_id || c.id || i} className="border border-[#dde0e4] dark:border-[#2d353e] rounded-2xl p-4 bg-white dark:bg-[#232a33] hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold ${c.is_emergency_contact ? 'bg-orange-500' : c.is_legal_representative ? 'bg-purple-500' : 'bg-gray-400'}`}>
                                            <span className="material-symbols-outlined text-[18px]">{c.is_emergency_contact ? 'emergency' : c.is_legal_representative ? 'gavel' : 'person'}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#121417] dark:text-white">{c.contact_name}</p>
                                            <p className="text-[11px] text-[#687582]">{c.relation_type?.relation_type_name || c.relation_type_name || "—"}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(c.patient_contacts_id || c.patient_relation_id || c.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                </div>
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex items-center gap-2 text-[#687582]"><span className="material-symbols-outlined text-[14px]">call</span>{c.phone_number || "—"}</div>
                                    {c.address && <div className="flex items-center gap-2 text-[#687582]"><span className="material-symbols-outlined text-[14px]">pin_drop</span>{c.address}</div>}
                                    <div className="flex items-center gap-2 text-[#687582]"><span className="material-symbols-outlined text-[14px]">folder_shared</span><span className="text-xs">{c._profileName}</span></div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    {c.is_emergency_contact && <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-md text-[10px] font-bold">Khẩn cấp</span>}
                                    {c.is_legal_representative && <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-md text-[10px] font-bold">Giám hộ</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-[#dde0e4] dark:border-[#2d353e]">
                        <div className="w-16 h-16 bg-white dark:bg-[#2d353e] rounded-full flex items-center justify-center mb-4 shadow-sm"><span className="material-symbols-outlined text-3xl text-gray-400">contact_phone</span></div>
                        <h3 className="text-base font-bold text-[#121417] dark:text-white mb-2">Chưa có liên hệ</h3>
                        <p className="text-sm text-[#687582] max-w-sm mb-6">Chưa có thông tin liên hệ khẩn cấp hoặc người giám hộ nào được thiết lập.</p>
                        <button onClick={() => setShowAddContact(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-all shadow-md shadow-blue-200 dark:shadow-none"><span className="material-symbols-outlined text-[20px]">add</span>Thêm liên hệ</button>
                    </div>
                )}
            </div>
            <ContactFormModal open={showAddContact} onClose={() => setShowAddContact(false)} onSuccess={() => { fetchData(); showToast("Thêm liên hệ thành công", "success"); }} profiles={profiles} />
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

/* ─── Tab: Lịch sử khám bệnh ─── */
function MedicalHistoryTab({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const fetchMedicalHistory = async () => {
            try {
                setLoading(true);
                // 1. Fetch patient profiles associated with the user account
                const profilesRes: any = await axiosClient.get(PATIENT_ENDPOINTS.BY_ACCOUNT(userId));
                const profiles = Array.isArray(profilesRes) ? profilesRes : profilesRes.data || profilesRes.items || [];
                
                let allHistories: any[] = [];
                // 2. Fetch medical histories for each patient profile
                for (const profile of profiles) {
                    if (profile.id) {
                        try {
                            const res: any = await axiosClient.get(EHR_ENDPOINTS.MEDICAL_HISTORY(profile.id));
                            const items = Array.isArray(res) ? res : res.data || res.items || [];
                            allHistories = [...allHistories, ...items];
                        } catch (err) {
                            console.error(`Error fetching medical history for patient ${profile.id}:`, err);
                        }
                    }
                }
                
                // Sort by date descending
                allHistories.sort((a, b) => {
                    const dateA = new Date(a.date || a.visit_date || a.createdAt || 0).getTime();
                    const dateB = new Date(b.date || b.visit_date || b.createdAt || 0).getTime();
                    return dateB - dateA;
                });
                
                setData(allHistories);
            } catch (error) {
                console.error("Error fetching medical history:", error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchMedicalHistory();
    }, [userId]);

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">medical_information</span>
                Lịch sử khám bệnh
            </h2>
            {loading ? (
                 <div className="flex justify-center py-12">
                     <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                 </div>
            ) : data.length > 0 ? (
                <div className="space-y-4">
                    {data.map((item, idx) => (
                        <div key={idx} className="p-4 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-gray-50/50 dark:bg-gray-800/30 hover:shadow-sm transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg">
                                        {item.id || item.code || `MH-${idx + 1}`}
                                    </span>
                                    <span className="text-sm font-semibold text-[#121417] dark:text-white flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
                                        {formatDate(item.date || item.visit_date || item.createdAt)}
                                    </span>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                    {item.status || "Hoàn thành"}
                                </span>
                            </div>
                            <h3 className="text-base font-bold text-[#121417] dark:text-white mb-2">
                                {item.diagnosis || item.notes || "Chưa có chẩn đoán"}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-[#687582] dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                                    {item.specialty || item.departmentName || "Nội tổng quát"}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">person</span>
                                    {item.doctor || item.doctorName || "Bác sĩ điều trị"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="w-16 h-16 bg-white dark:bg-[#2d353e] rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <span className="material-symbols-outlined text-3xl text-gray-400">history_toggle_off</span>
                    </div>
                    <h3 className="text-base font-bold text-[#121417] dark:text-white mb-2">Chưa có lịch sử khám</h3>
                    <p className="text-sm text-[#687582] max-w-sm">Bệnh nhân này chưa có ghi nhận khám bệnh nào trên hệ thống.</p>
                </div>
            )}
        </div>
    );
}

/* ─── Tab: Lịch sử mua thuốc ─── */
function MedicationHistoryTab({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const fetchMedicationHistory = async () => {
            try {
                setLoading(true);
                const res: any = await axiosClient.get(PATIENT_ENDPOINTS.PRESCRIPTIONS(userId));
                const items = Array.isArray(res) ? res : res.data || res.items || [];
                setData(items);
            } catch (error) {
                console.error("Error fetching medication history:", error);
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchMedicationHistory();
    }, [userId]);

    // Format currency Helper
    const formatCurrency = (amount?: number | string) => {
        if (!amount) return "0đ";
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount));
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">prescriptions</span>
                Lịch sử đơn thuốc
            </h2>
            {loading ? (
                 <div className="flex justify-center py-12">
                     <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                 </div>
            ) : data.length > 0 ? (
                <div className="space-y-4">
                    {data.map((item, idx) => (
                        <div key={idx} className="p-4 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-gray-50/50 dark:bg-gray-800/30 hover:shadow-sm transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 border-b border-[#dde0e4] dark:border-[#2d353e] pb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-lg">
                                            {item.id || item.code || `RX-${idx + 1}`}
                                        </span>
                                        <span className="text-sm font-semibold text-[#121417] dark:text-white flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
                                            {formatDate(item.date || item.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined text-[16px]">local_hospital</span>
                                        {item.facility || item.facilityName || "Cơ sở y tế"}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[#687582] dark:text-gray-400 mb-1">Trạng thái</p>
                                    <p className={`text-sm font-bold ${item.status === 'COMPLETED' ? 'text-green-600' : 'text-[#3C81C6]'}`}>
                                        {item.status || "Hoàn thành"}
                                    </p>
                                    {item.total && (
                                        <p className="text-lg font-bold text-[#3C81C6] mt-1">{formatCurrency(item.total)}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-2">Đơn thuốc</h4>
                                <ul className="list-disc list-inside text-sm text-[#121417] dark:text-white space-y-1">
                                    {Array.isArray(item.items) ? (
                                        item.items.map((med: any, i: number) => (
                                            <li key={i}>{med?.name || med?.drugName || String(med)}</li>
                                        ))
                                    ) : (
                                        <li>{item.prescriptionDetails || "Chưa có thông tin thuốc chi tiết"}</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="w-16 h-16 bg-white dark:bg-[#2d353e] rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <span className="material-symbols-outlined text-3xl text-gray-400">receipt_long</span>
                    </div>
                    <h3 className="text-base font-bold text-[#121417] dark:text-white mb-2">Chưa có lịch sử đơn thuốc</h3>
                    <p className="text-sm text-[#687582] max-w-sm">Bệnh nhân này chưa có ghi nhận đơn thuốc nào trên hệ thống.</p>
                </div>
            )}
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
