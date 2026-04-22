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
import { USER_ENDPOINTS, ROLE_ENDPOINTS, AUDIT_LOG_ENDPOINTS } from "@/api/endpoints";
import { getImageUrl } from "@/utils/helpers";

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
    { key: "overview", label: "Tổng quan", icon: "person" },
    { key: "roles", label: "Phân quyền", icon: "shield_person" },
    { key: "security", label: "Bảo mật", icon: "security" },
    { key: "activity", label: "Hoạt động", icon: "history" },
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
                {activeTab === "roles" && <RolesTab userId={userId} roles={user.roles} onRefresh={triggerRefresh} />}
                {activeTab === "security" && <SecurityTab userId={userId} isActive={isActive} onRefresh={triggerRefresh} />}
                {activeTab === "activity" && <ActivityTab userId={userId} />}
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
            await axiosClient.post(USER_ENDPOINTS.ROLES(userId), { role: selectedRole });
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
            await axiosClient.delete(USER_ENDPOINTS.ROLE_DELETE(userId, roleIdToDelete));
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
