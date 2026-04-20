"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UI_TEXT } from "@/constants/ui-text";
import { ROLES, ROLE_LABELS, ROLE_COLORS, type Role } from "@/constants/roles";
import { USER_STATUS } from "@/constants/status";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { UserFormModal } from "@/features/users/components/user-form-modal";
import { PermissionsModal } from "@/features/users/components/permissions-modal";
import * as userService from "@/services/userService";
import type { User } from "@/types";
import { validateFile } from "@/utils/fileValidation";
import { UserCard } from "@/components/shared/cards";
import { EmptyState } from "@/components/shared/layout";

/** Format ISO date to readable string */
function formatDate(iso: unknown): string {
    if (!iso || typeof iso !== 'string') return "—";
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return String(iso);
        return d.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch { return String(iso); }
}

type SortField = "fullName" | "role" | "createdAt" | "lastAccess" | "status";
type SortOrder = "asc" | "desc";

export default function UsersPage() {
    // State
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [viewMode, setViewMode] = useState<"table" | "card">("card");

    // Load users from API
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsDataLoading(true);
                const res: any = await userService.getUsers({ limit: 100 });
                const items = res?.data?.items ?? res?.items ?? res?.data?.data ?? res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    setUsers(items.map((u: Record<string, unknown>) => ({
                        id: String(u.users_id ?? u.id ?? ""),
                        fullName: (u as Record<string, unknown> & { profile?: { full_name?: string } }).profile?.full_name ?? u.full_name ?? u.fullName ?? u.email ?? "",
                        email: u.email ?? "",
                        phone: u.phone ?? u.phone_number ?? "",
                        role: Array.isArray(u.roles) && (u.roles as string[]).length > 0 ? (u.roles as string[])[0].toLowerCase() : "staff",
                        status: u.status ?? "ACTIVE",
                        avatar: (u as Record<string, unknown> & { profile?: { avatar_url?: string } }).profile?.avatar_url ?? u.avatar ?? "",
                        createdAt: u.created_at ?? u.createdAt ?? "",
                    })) as unknown as User[]);
                }
            } catch (err) {
                console.error('Lỗi tải danh sách người dùng:', err);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const stats = {
        total: users.length,
        active: users.filter(u => u.status === USER_STATUS.ACTIVE).length,
        locked: users.filter(u => u.status === USER_STATUS.LOCKED).length,
        inactive: users.filter(u => u.status !== USER_STATUS.ACTIVE && u.status !== USER_STATUS.LOCKED).length,
        roles: new Set(users.map(u => u.role)).size,
    };

    // Filtered and sorted users
    const filteredUsers = useMemo(() => {
        let result = users.filter((user) => {
            const matchesSearch =
                searchQuery === "" ||
                (user.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            if (sortField === "fullName") {
                comparison = (a.fullName || "").localeCompare(b.fullName || "");
            } else if (sortField === "role") {
                comparison = (a.role || "").localeCompare(b.role || "");
            } else if (sortField === "createdAt") {
                comparison = (a.createdAt || "").localeCompare(b.createdAt || "");
            } else if (sortField === "status") {
                comparison = (a.status || "").localeCompare(b.status || "");
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return result;
    }, [users, searchQuery, roleFilter, sortField, sortOrder]);

    // Toggle sort
    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    // Export Excel từ API
    const handleExport = async () => {
        try {
            const blob = await userService.exportUsers({
                role: roleFilter !== "all" ? roleFilter : undefined,
                search: searchQuery || undefined,
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `users_${new Date().toISOString().split("T")[0]}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            // Fallback: export CSV từ dữ liệu hiện có
            const headers = ["Họ tên", "Email", "Vai trò", "Ngày tạo", "Trạng thái"];
            const rows = filteredUsers.map((u) => [
                u.fullName,
                u.email,
                ROLE_LABELS[u.role as Role],
                u.createdAt,
                u.status,
            ]);
            const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
            link.click();
        }
    };

    // Handlers
    const handleAddUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
        try {
            await userService.deleteUser(userId);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
        } catch (err) {
            console.error('Xóa người dùng thất bại:', err);
            alert('Xóa người dùng thất bại. Vui lòng thử lại.');
        }
    };

    const handleLockUser = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const isLocked = user.status === USER_STATUS.LOCKED;
        try {
            if (isLocked) {
                await userService.unlockUser(userId);
            } else {
                await userService.lockUser(userId);
            }
            const newStatus = isLocked ? USER_STATUS.ACTIVE : USER_STATUS.LOCKED;
            setUsers((prev) =>
                prev.map((u) => u.id === userId ? { ...u, status: newStatus } : u)
            );
        } catch (err: any) {
            console.error('Cập nhật trạng thái thất bại:', err);
            alert(err?.message || 'Cập nhật trạng thái thất bại. Vui lòng thử lại.');
        }
    };

    const handleSubmitUser = async (userData: Partial<User>) => {
        try {
            if (editingUser) {
                await userService.updateUser(editingUser.id, userData as any);
                setUsers((prev) =>
                    prev.map((u) => (u.id === editingUser.id ? { ...u, ...userData } : u))
                );
            } else {
                const created = await userService.createUser(userData as any);
                setUsers((prev) => [created as unknown as User, ...prev]);
            }
        } catch (err) {
            console.error('Lưu người dùng thất bại:', err);
            alert('Lưu người dùng thất bại. Vui lòng thử lại.');
        }
    };

    // Helper functions
    const getStatusStyle = (status: string) => {
        switch (status) {
            case USER_STATUS.ACTIVE:
                return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
            case USER_STATUS.LOCKED:
                return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
            default:
                return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case USER_STATUS.ACTIVE:
                return UI_TEXT.STATUS.ACTIVE;
            case USER_STATUS.LOCKED:
                return UI_TEXT.STATUS.LOCKED;
            default:
                return UI_TEXT.STATUS.OFFLINE;
        }
    };

    const getOnlineIndicator = (status: string) => {
        switch (status) {
            case USER_STATUS.ACTIVE:
                return "bg-green-500";
            case USER_STATUS.LOCKED:
                return "bg-red-500";
            default:
                return "bg-gray-400";
        }
    };

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                        {UI_TEXT.ADMIN.USERS.TITLE}
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400">
                        {UI_TEXT.ADMIN.USERS.SUBTITLE}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPermissionsOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                        {UI_TEXT.ADMIN.USERS.CONFIGURE_PERMISSIONS}
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">upload</span>
                        Import
                        <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            e.target.value = "";
                            const validation = validateFile(file, { maxSize: 5 * 1024 * 1024, allowedTypes: ["csv", "xlsx", "xls"] });
                            if (!validation.valid) { alert(validation.message); return; }
                            try {
                                const res = await userService.importUsers(file);
                                const count = res?.data?.count ?? res?.count ?? "nhiều";
                                alert(`Import thành công ${count} người dùng.`);
                                // Reload danh sách
                                setIsDataLoading(true);
                                const reloadRes: any = await userService.getUsers({ limit: 100 });
                                const items = reloadRes?.data?.items ?? reloadRes?.items ?? reloadRes?.data?.data ?? reloadRes?.data ?? reloadRes ?? [];
                                if (Array.isArray(items)) {
                                    setUsers(items.map((u: Record<string, unknown>) => ({
                                        id: String(u.users_id ?? u.id ?? ""),
                                        fullName: (u as any).profile?.full_name ?? u.full_name ?? u.fullName ?? u.email ?? "",
                                        email: u.email ?? "",
                                        phone: u.phone ?? u.phone_number ?? "",
                                        role: Array.isArray(u.roles) && (u.roles as string[]).length > 0 ? (u.roles as string[])[0].toLowerCase() : "staff",
                                        status: u.status ?? "ACTIVE",
                                        avatar: (u as any).profile?.avatar_url ?? u.avatar ?? "",
                                        createdAt: u.created_at ?? u.createdAt ?? "",
                                    })) as unknown as User[]);
                                }
                            } catch (err: any) {
                                alert(err?.message || "Import thất bại. Vui lòng kiểm tra định dạng file và thử lại.");
                            } finally {
                                setIsDataLoading(false);
                            }
                        }} />
                    </label>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Export
                    </button>
                    <button
                        onClick={() => router.push("/admin/users/new")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                    >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        {UI_TEXT.ADMIN.USERS.ADD_USER}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined">group</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.USERS.TOTAL_USERS}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{users.length}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined">verified_user</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.USERS.ACTIVE_USERS}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">
                            {users.filter((u) => u.status === USER_STATUS.ACTIVE).length}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <span className="material-symbols-outlined">manage_accounts</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.USERS.ROLES_COUNT}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stats.roles}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                        <span className="material-symbols-outlined">block</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.USERS.LOCKED_USERS}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">
                            {users.filter((u) => u.status === USER_STATUS.LOCKED).length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm flex flex-col">
                {/* Table Header */}
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex flex-col sm:flex-row justify-between gap-4 items-center">
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                        <div className="relative w-full sm:w-72">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all dark:text-white placeholder:text-gray-400"
                                placeholder={UI_TEXT.ADMIN.USERS.SEARCH_PLACEHOLDER}
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="py-2.5 pl-3 pr-10 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all text-[#687582] dark:text-gray-400 cursor-pointer"
                        >
                            <option value="all">{UI_TEXT.ADMIN.USERS.ALL_ROLES}</option>
                            {Object.entries(ROLES).map(([key, value]) => (
                                <option key={key} value={value}>
                                    {ROLE_LABELS[value as Role]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <button onClick={() => setViewMode("card")}
                                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${viewMode === "card" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] hover:text-[#3C81C6]"}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>grid_view</span>
                                Thẻ
                            </button>
                            <button onClick={() => setViewMode("table")}
                                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${viewMode === "table" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] hover:text-[#3C81C6]"}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>table_rows</span>
                                Bảng
                            </button>
                        </div>
                        <button
                            onClick={handleExport}
                            className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-[#687582] dark:text-gray-400 transition-colors"
                            title="Xuất dữ liệu"
                        >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setRoleFilter("all");
                            }}
                            className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-[#687582] dark:text-gray-400 transition-colors"
                            title="Xóa bộ lọc"
                        >
                            <span className="material-symbols-outlined text-[20px]">filter_list_off</span>
                        </button>
                    </div>
                </div>

                {/* Card view */}
                {viewMode === "card" && (
                    <div className="p-4">
                        {isDataLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-40 bg-gray-50 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <EmptyState icon="person_off" title="Không có user nào" description="Thử điều chỉnh bộ lọc hoặc thêm user mới." />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredUsers.map((u, idx) => (
                                    <UserCard
                                        key={`${u.id || "user"}-${idx}`}
                                        id={u.id}
                                        fullName={(u as any).fullName || u.email || "—"}
                                        email={u.email}
                                        phone={(u as any).phone}
                                        avatarUrl={(u as any).avatar}
                                        roles={Array.isArray((u as any).roles) ? (u as any).roles : u.role ? [u.role] : []}
                                        status={(u as any).status || "ACTIVE"}
                                        lastLoginAt={(u as any).lastAccess || (u as any).last_login_at}
                                        branchName={(u as any).branchName}
                                        onView={() => router.push(`/admin/users/${u.id}`)}
                                        onEdit={() => { setEditingUser(u); setIsModalOpen(true); }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Table Content */}
                {viewMode === "table" && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <th onClick={() => toggleSort("fullName")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Thông tin người dùng
                                        {sortField === "fullName" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th onClick={() => toggleSort("role")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Vai trò (Role)
                                        {sortField === "role" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th onClick={() => toggleSort("createdAt")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Ngày tạo
                                        {sortField === "createdAt" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wider">Truy cập cuối</th>
                                <th onClick={() => toggleSort("status")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Trạng thái
                                        {sortField === "status" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase tracking-wider text-right">{UI_TEXT.COMMON.ACTIONS}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                                        {UI_TEXT.TABLE.NO_RESULTS}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const roleColor = ROLE_COLORS[user.role?.toUpperCase() as Role] ?? ROLE_COLORS[user.role as Role] ?? { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300", dot: "bg-gray-500" };
                                    return (
                                        <tr key={user.id} className={`group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${user.status === USER_STATUS.LOCKED ? "opacity-60" : ""}`}>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div
                                                            className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200 bg-gray-100"
                                                            style={{ backgroundImage: user.avatar ? `url('${user.avatar}')` : undefined }}
                                                        >
                                                            {!user.avatar && (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                    <span className="material-symbols-outlined">person</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className={`absolute bottom-0 right-0 w-3 h-3 ${getOnlineIndicator(user.status)} border-2 border-white dark:border-[#1e242b] rounded-full`}></span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#121417] dark:text-white">{user.fullName}</p>
                                                        <p className="text-xs text-[#687582] dark:text-gray-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${roleColor.bg} ${roleColor.text} border border-current/10`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot} mr-1.5`}></span>
                                                    {ROLE_LABELS[user.role as Role]}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm text-[#121417] dark:text-gray-200">{formatDate(user.createdAt)}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm text-[#121417] dark:text-gray-200">{user.lastAccess ? formatDate(user.lastAccess) : "—"}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(user.status)}`}>
                                                    {getStatusLabel(user.status)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <DropdownMenu
                                                    items={[
                                                        {
                                                            label: "Xem chi tiết",
                                                            icon: "visibility",
                                                            onClick: () => router.push(`/admin/users/${user.id}`),
                                                        },
                                                        {
                                                            label: "Chỉnh sửa",
                                                            icon: "edit",
                                                            onClick: () => router.push(`/admin/users/${user.id}/edit`),
                                                        },
                                                        {
                                                            label: user.status === USER_STATUS.LOCKED ? "Mở khóa" : "Khóa tài khoản",
                                                            icon: user.status === USER_STATUS.LOCKED ? "lock_open" : "lock",
                                                            onClick: () => handleLockUser(user.id),
                                                        },
                                                        {
                                                            label: "Xóa",
                                                            icon: "delete",
                                                            onClick: () => handleDeleteUser(user.id),
                                                            variant: "danger",
                                                        },
                                                    ]}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                )}

                {/* Pagination */}
                <div className="p-4 border-t border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                    <p className="text-sm text-[#687582] dark:text-gray-400">
                        {UI_TEXT.TABLE.SHOWING} <span className="font-medium text-[#121417] dark:text-white">1</span> {UI_TEXT.TABLE.TO} <span className="font-medium text-[#121417] dark:text-white">{filteredUsers.length}</span> {UI_TEXT.TABLE.OF} <span className="font-medium text-[#121417] dark:text-white">{users.length}</span> {UI_TEXT.TABLE.RESULTS}
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg border border-[#dde0e4] dark:border-[#2d353e] text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-[#3C81C6] text-white text-sm font-bold shadow-sm">1</button>
                        <button className="p-2 rounded-lg border border-[#dde0e4] dark:border-[#2d353e] text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* User Form Modal */}
            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitUser}
                initialData={editingUser || undefined}
                mode={editingUser ? "edit" : "create"}
            />

            {/* Permissions Modal */}
            <PermissionsModal
                isOpen={isPermissionsOpen}
                onClose={() => setIsPermissionsOpen(false)}
            />
        </>
    );
}
