"use client";

import { useState, useMemo } from "react";
import { UI_TEXT } from "@/constants/ui-text";
import { MOCK_USERS, MOCK_USER_STATS } from "@/lib/mock-data/admin";
import { ROLES, ROLE_LABELS, ROLE_COLORS, type Role } from "@/constants/roles";
import { USER_STATUS } from "@/constants/status";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { UserFormModal } from "@/features/users/components/user-form-modal";
import { PermissionsModal } from "@/features/users/components/permissions-modal";
import type { User } from "@/types";

type SortField = "fullName" | "role" | "createdAt" | "lastAccess" | "status";
type SortOrder = "asc" | "desc";

export default function UsersPage() {
    // State
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const stats = MOCK_USER_STATS;

    // Filtered and sorted users
    const filteredUsers = useMemo(() => {
        let result = users.filter((user) => {
            const matchesSearch =
                searchQuery === "" ||
                user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === "all" || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            if (sortField === "fullName") {
                comparison = a.fullName.localeCompare(b.fullName);
            } else if (sortField === "role") {
                comparison = a.role.localeCompare(b.role);
            } else if (sortField === "createdAt") {
                comparison = a.createdAt.localeCompare(b.createdAt);
            } else if (sortField === "status") {
                comparison = a.status.localeCompare(b.status);
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

    // Export to CSV
    const handleExport = () => {
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

    const handleDeleteUser = (userId: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
            setUsers((prev) => prev.filter((u) => u.id !== userId));
        }
    };

    const handleLockUser = (userId: string) => {
        setUsers((prev) =>
            prev.map((u) =>
                u.id === userId
                    ? { ...u, status: u.status === USER_STATUS.LOCKED ? USER_STATUS.ACTIVE : USER_STATUS.LOCKED }
                    : u
            )
        );
    };

    const handleSubmitUser = (userData: Partial<User>) => {
        if (editingUser) {
            // Update existing user
            setUsers((prev) =>
                prev.map((u) => (u.id === editingUser.id ? { ...u, ...userData } : u))
            );
        } else {
            // Add new user
            const newUser: User = {
                id: String(Date.now()),
                email: userData.email || "",
                fullName: userData.fullName || "",
                role: userData.role || ROLES.RECEPTIONIST,
                status: USER_STATUS.ACTIVE,
                lastAccess: "Vừa tạo",
                createdAt: new Date().toISOString().split("T")[0],
                updatedAt: new Date().toISOString().split("T")[0],
            };
            setUsers((prev) => [newUser, ...prev]);
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
                    <button
                        onClick={handleAddUser}
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

                {/* Table Content */}
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
                                    const roleColor = ROLE_COLORS[user.role as Role];
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
                                                <p className="text-sm text-[#121417] dark:text-gray-200">{user.createdAt}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm text-[#121417] dark:text-gray-200">{user.lastAccess}</p>
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
                                                            label: "Chỉnh sửa",
                                                            icon: "edit",
                                                            onClick: () => handleEditUser(user),
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
