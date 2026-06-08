"use client";

import { useEffect, useMemo, useState } from "react";
import {
    getRoles,
    getPermissions,
    getApiPermissions,
    getRolePermissions,
    getRoleApiPermissions,
    assignPermissions,
    addRoleApiPermission,
    removeRoleApiPermission,
    replaceRoleApiPermissions,
    createRole,
    type PermissionGroup,
    type PermissionData,
    type ApiPermissionData,
} from "@/services/permissionService";
import suggestionMap from "@/constants/rolePermissionMap.json";

interface Role {
    id: string;
    name: string;
    code: string;
    description: string;
    users: number;
    status: string;
    permissions: string[];
}

type TabKey = "permissions" | "api_permissions";

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [savingPermissions, setSavingPermissions] = useState(false);

    // Catalog data từ BE
    const [permGroups, setPermGroups] = useState<PermissionGroup[]>([]);
    const [apiPerms, setApiPerms] = useState<ApiPermissionData[]>([]);

    // Selection / edit state
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<TabKey>("permissions");
    const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
    const [editedApiPermissions, setEditedApiPermissions] = useState<string[]>([]);
    const [originalApiPermissions, setOriginalApiPermissions] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Add role modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRole, setNewRole] = useState({ name: "", code: "", description: "" });
    const [creatingRole, setCreatingRole] = useState(false);

    /** Load roles + permission catalog */
    const loadAll = async () => {
        setIsLoading(true);
        try {
            const [rolesRaw, permsRaw, apiRaw] = await Promise.allSettled([
                getRoles(),
                getPermissions(),
                getApiPermissions(),
            ]);
            if (rolesRaw.status === "fulfilled" && Array.isArray(rolesRaw.value)) {
                setRoles(
                    rolesRaw.value.map((r: any) => ({
                        id: String(r.id ?? r.roles_id ?? r.name ?? ""),
                        name: r.displayName ?? r.name ?? "",
                        code: r.code ?? r.name ?? "",
                        description: r.description ?? "",
                        users: r.userCount ?? 0,
                        status: r.isActive !== false ? "active" : "inactive",
                        permissions: Array.isArray(r.permissions) ? r.permissions : [],
                    })),
                );
            }
            if (permsRaw.status === "fulfilled" && Array.isArray(permsRaw.value)) {
                setPermGroups(permsRaw.value);
            }
            if (apiRaw.status === "fulfilled" && Array.isArray(apiRaw.value)) {
                setApiPerms(apiRaw.value);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadAll();
    }, []);

    const filteredRoles = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return roles;
        return roles.filter(
            (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
        );
    }, [roles, search]);

    const selected = roles.find((r) => r.id === selectedRoleId);

    /** Group api perms theo module/path prefix */
    const apiPermGroups = useMemo(() => {
        const map = new Map<string, ApiPermissionData[]>();
        for (const p of apiPerms) {
            const key = p.module ?? (p.path?.split("/").filter(Boolean)[1] ?? "Khác");
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(p);
        }
        return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
    }, [apiPerms]);

    const handleSelectRole = async (roleId: string) => {
        const role = roles.find((r) => r.id === roleId);
        if (!role) return;
        setSelectedRoleId(roleId);
        setHasChanges(false);
        setSaveSuccess(false);
        setLoadingPermissions(true);
        try {
            const [permRes, apiRes] = await Promise.allSettled([
                getRolePermissions(roleId),
                getRoleApiPermissions(roleId),
            ]);
            const perms: string[] =
                permRes.status === "fulfilled" && Array.isArray(permRes.value?.data)
                    ? permRes.value.data.map((p: any) => String(p.id ?? p.code ?? p))
                    : Array.isArray(role.permissions)
                      ? role.permissions
                      : [];
            const apiIds: string[] =
                apiRes.status === "fulfilled" && Array.isArray(apiRes.value?.data)
                    ? apiRes.value.data.map((p: any) => String(p.id ?? p.api_id ?? p.api_permissions_id ?? p))
                    : [];
            setEditedPermissions(perms);
            setEditedApiPermissions(apiIds);
            setOriginalApiPermissions(apiIds);
        } catch {
            setEditedPermissions([...role.permissions]);
            setEditedApiPermissions([]);
            setOriginalApiPermissions([]);
        } finally {
            setLoadingPermissions(false);
        }
    };

    const handleTogglePermission = (permId: string) => {
        setEditedPermissions((prev) =>
            prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId],
        );
        setHasChanges(true);
        setSaveSuccess(false);
    };

    const handleToggleApiPermission = (apiId: string) => {
        setEditedApiPermissions((prev) =>
            prev.includes(apiId) ? prev.filter((p) => p !== apiId) : [...prev, apiId],
        );
        setHasChanges(true);
        setSaveSuccess(false);
    };

    const handleSave = async () => {
        if (!selectedRoleId) return;
        setSavingPermissions(true);
        try {
            // Lọc loại bỏ những quyền bị rác hoặc không còn tồn tại trong DB
            const validDbPerms = new Set(permGroups.flatMap((g) => (g.permissions ?? []).map((p: any) => String(p.id ?? p.code))));
            const validPerms = editedPermissions.filter(id => id && id !== "[object Object]" && id !== "undefined" && validDbPerms.has(id));

            const validDbApiIds = new Set(apiPerms.map((p: any) => String(p.id ?? p.api_id ?? p.api_permissions_id)));
            const validApiIds = editedApiPermissions.filter(id => id && id !== "[object Object]" && id !== "undefined" && id !== "null" && validDbApiIds.has(id));

            // 1) Save normal permissions (replace toàn bộ)
            await assignPermissions(selectedRoleId, validPerms);

            // 2) Save API permissions (replace toàn bộ qua 1 request duy nhất)
            await replaceRoleApiPermissions(selectedRoleId, validApiIds);

            setRoles((prev) =>
                prev.map((r) =>
                    r.id === selectedRoleId ? { ...r, permissions: editedPermissions } : r,
                ),
            );
            setOriginalApiPermissions(editedApiPermissions);
            setHasChanges(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err: any) {
            alert(err?.message || "Lưu quyền thất bại. Vui lòng thử lại.");
        } finally {
            setSavingPermissions(false);
        }
    };

    const handleSuggestPermissions = () => {
        if (!selected) return;
        let code = selected.code.toUpperCase();
        if (!code.startsWith("ROLE_")) code = "ROLE_" + code;

        let suggestedPerms: string[] = [];
        let suggestedApis: string[] = [];

        if (code === "ROLE_ADMIN") {
            suggestedPerms = permGroups.flatMap((g) => (g.permissions ?? []).map((p: any) => String(p.id ?? p.code)));
            suggestedApis = apiPerms.map((p: any) => String(p.id ?? p.api_id ?? p.api_permissions_id));
        } else {
            // 1) Read from exact database map if available
            const exactPerms = (suggestionMap.rolePerms as any)[code] || [];
            const exactApis = (suggestionMap.roleApis as any)[code] || [];

            if (exactPerms.length > 0 || exactApis.length > 0) {
                suggestedPerms = exactPerms;
                suggestedApis = exactApis;
            } else {
                // 2) Fallback to heuristic matching for custom roles
                const allowModules: string[] = [];
                const allowApiPaths: string[] = [];
                const rawCode = code.replace("ROLE_", "");
                
                if (rawCode === "DOCTOR" || rawCode === "BACSI") {
                    allowModules.push("PATIENT", "ENCOUNTER", "CLINICAL", "DIAGNOSIS", "PRESCRIPTION", "MEDICAL_ORDER", "MEDICAL_RECORD", "SCHEDULE");
                    allowApiPaths.push("/patients", "/encounters", "/clinical", "/diagnoses", "/prescriptions", "/medical-orders", "/medical-records", "/staff-schedules", "/teleconsultation");
                } else if (rawCode === "NURSE" || rawCode === "YTA") {
                    allowModules.push("PATIENT", "ENCOUNTER", "MEDICAL_ORDER", "VITALS", "BED", "CLINICAL");
                    allowApiPaths.push("/patients", "/encounters", "/medical-orders", "/clinical");
                } else if (rawCode === "RECEPTIONIST" || rawCode === "LETON") {
                    allowModules.push("PATIENT", "APPOINTMENT", "ENCOUNTER", "BILLING");
                    allowApiPaths.push("/patients", "/appointments", "/encounters", "/billing", "/appointment-status", "/appointment-confirmations");
                } else if (rawCode === "PHARMACIST" || rawCode === "DUOCSI") {
                    allowModules.push("PHARMACY", "INVENTORY", "DISPENSING", "STOCK_IN", "STOCK_OUT");
                    allowApiPaths.push("/pharmacy", "/inventory", "/dispensing", "/stock-in", "/stock-out");
                } else if (rawCode === "ACCOUNTANT" || rawCode === "KETOAN") {
                    allowModules.push("BILLING", "REPORT", "INVOICE");
                    allowApiPaths.push("/billing", "/reports");
                } else if (rawCode === "PATIENT" || rawCode === "BENHNHAN") {
                    allowModules.push("PORTAL_PATIENT");
                    allowApiPaths.push("/profile", "/teleconsultation/booking");
                }
    
                allowApiPaths.push("/auth", "/profile"); // basic access
    
                permGroups.forEach((g) => {
                    const mod = (g.group || "").toUpperCase();
                    if (allowModules.some(m => mod.includes(m))) {
                        (g.permissions ?? []).forEach((p: any) => suggestedPerms.push(String(p.id ?? p.code)));
                    }
                });
    
                apiPerms.forEach((p: any) => {
                    const apiPath = (p.path || p.endpoint || "").toLowerCase();
                    if (allowApiPaths.some(ap => apiPath.startsWith("/api" + ap))) {
                        suggestedApis.push(String(p.id ?? p.api_id ?? p.api_permissions_id));
                    }
                });
            }
        }

        setEditedPermissions(suggestedPerms);
        setEditedApiPermissions(suggestedApis);
        setHasChanges(true);
        setSaveSuccess(false);
    };

    const handleAddRole = async () => {
        if (!newRole.name.trim() || !newRole.code.trim()) return;
        setCreatingRole(true);
        try {
            const res = await createRole({
                name: newRole.code.toUpperCase(),
                displayName: newRole.name,
                code: newRole.code.toUpperCase(),
                description: newRole.description,
            });
            const newId = (res as any)?.data?.id ?? (res as any)?.id ?? "ROLE_" + Date.now();
            const role: Role = {
                id: newId,
                name: newRole.name,
                code: newRole.code.toUpperCase(),
                description: newRole.description,
                users: 0,
                status: "active",
                permissions: [],
            };
            setRoles((prev) => [...prev, role]);
            setSelectedRoleId(role.id);
            setEditedPermissions([]);
            setEditedApiPermissions([]);
            setOriginalApiPermissions([]);
            setShowAddModal(false);
            setNewRole({ name: "", code: "", description: "" });
            setHasChanges(false);
        } catch (err: any) {
            alert(err?.message || "Tạo vai trò thất bại. Vui lòng thử lại.");
        } finally {
            setCreatingRole(false);
        }
    };

    const renderPermissionsTab = () => (
        <div className="overflow-auto max-h-[600px]">
            {permGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#687582]">
                    <span className="material-symbols-outlined text-[36px] mb-2 opacity-40">key_off</span>
                    <p className="text-sm">Chưa có quyền nào trong hệ thống</p>
                </div>
            ) : (
                <table className="w-full">
                    <thead className="sticky top-0 bg-[#f6f7f8] dark:bg-[#13191f] z-10">
                        <tr>
                            <th className="text-left text-xs font-bold text-[#687582] dark:text-gray-400 px-5 py-3 uppercase tracking-wider">Nhóm</th>
                            <th className="text-left text-xs font-bold text-[#687582] dark:text-gray-400 px-3 py-3 uppercase tracking-wider">Quyền</th>
                            <th className="text-left text-xs font-bold text-[#687582] dark:text-gray-400 px-3 py-3 uppercase tracking-wider">Mã</th>
                            <th className="text-center text-xs font-bold text-[#687582] dark:text-gray-400 px-3 py-3 uppercase tracking-wider w-20">Bật</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                        {permGroups.map((g) =>
                            (g.permissions ?? []).map((p: PermissionData, pi: number) => (
                                <tr key={p.id ?? p.code} className="hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                    {pi === 0 && (
                                        <td
                                            rowSpan={(g.permissions ?? []).length}
                                            className="px-5 py-3 text-sm font-semibold text-[#121417] dark:text-white border-r border-[#f0f1f3] dark:border-[#2d353e] align-top"
                                        >
                                            {g.groupLabel ?? g.group}
                                        </td>
                                    )}
                                    <td className="px-3 py-3 text-sm text-[#121417] dark:text-white">
                                        {p.name ?? p.description ?? p.code}
                                    </td>
                                    <td className="px-3 py-3 text-xs font-mono text-[#687582]">{p.code}</td>
                                    <td className="px-3 py-3 text-center">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={editedPermissions.includes(String(p.id ?? p.code))}
                                                onChange={() => handleTogglePermission(String(p.id ?? p.code))}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-[#3C81C6] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                                        </label>
                                    </td>
                                </tr>
                            )),
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );

    const renderApiPermissionsTab = () => (
        <div className="overflow-auto max-h-[600px]">
            {apiPermGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#687582]">
                    <span className="material-symbols-outlined text-[36px] mb-2 opacity-40">api</span>
                    <p className="text-sm">Chưa có API permission nào</p>
                </div>
            ) : (
                <table className="w-full">
                    <thead className="sticky top-0 bg-[#f6f7f8] dark:bg-[#13191f] z-10">
                        <tr>
                            <th className="text-left text-xs font-bold text-[#687582] dark:text-gray-400 px-5 py-3 uppercase tracking-wider">Module</th>
                            <th className="text-left text-xs font-bold text-[#687582] dark:text-gray-400 px-3 py-3 uppercase tracking-wider w-20">Method</th>
                            <th className="text-left text-xs font-bold text-[#687582] dark:text-gray-400 px-3 py-3 uppercase tracking-wider">Endpoint</th>
                            <th className="text-left text-xs font-bold text-[#687582] dark:text-gray-400 px-3 py-3 uppercase tracking-wider">Mô tả</th>
                            <th className="text-center text-xs font-bold text-[#687582] dark:text-gray-400 px-3 py-3 uppercase tracking-wider w-20">Bật</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                        {apiPermGroups.map(({ group, items }) =>
                            items.map((p, pi) => {
                                const id = String(p.id ?? (p as any).api_id ?? (p as any).api_permissions_id);
                                const method = String(p.method ?? "").toUpperCase();
                                const methodColor =
                                    method === "GET"
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                        : method === "POST"
                                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                          : method === "PUT" || method === "PATCH"
                                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                            : method === "DELETE"
                                              ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                                              : "bg-gray-50 text-gray-700";
                                return (
                                    <tr key={id} className="hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                        {pi === 0 && (
                                            <td
                                                rowSpan={items.length}
                                                className="px-5 py-3 text-sm font-semibold text-[#121417] dark:text-white border-r border-[#f0f1f3] dark:border-[#2d353e] align-top"
                                            >
                                                {group}
                                            </td>
                                        )}
                                        <td className="px-3 py-3">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${methodColor}`}>
                                                {method}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-xs font-mono text-[#121417] dark:text-white">{p.path}</td>
                                        <td className="px-3 py-3 text-xs text-[#687582] dark:text-gray-400">
                                            {p.description ?? "—"}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={editedApiPermissions.includes(id)}
                                                    onChange={() => handleToggleApiPermission(id)}
                                                />
                                                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-[#3C81C6] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                                            </label>
                                        </td>
                                    </tr>
                                );
                            }),
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div>
                <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500 mb-3">
                    <span className="material-symbols-outlined text-[14px]">home</span>
                    <span>Trang chủ</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span>Người dùng & Phân quyền</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Phân quyền & Vai trò</span>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">Phân quyền & Vai trò</h1>
                        <p className="text-[#687582] dark:text-gray-400 mt-0.5 text-sm">
                            Quản lý vai trò, quyền hệ thống (Permissions) và quyền truy cập API (API Permissions) của từng nhóm người dùng
                        </p>
                    </div>
                    <button
                        onClick={() => (window.location.href = "/admin/users/roles/new")}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#3C81C6]/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Thêm vai trò
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái — Danh sách vai trò */}
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e]">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#687582]">search</span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm vai trò..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] text-sm placeholder-[#687582] focus:border-[#3C81C6] focus:ring-1 focus:ring-[#3C81C6]/20 outline-none transition-colors text-[#121417] dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                        {isLoading && (
                            <div className="flex items-center justify-center py-8 gap-2 text-[#687582]">
                                <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">Đang tải...</span>
                            </div>
                        )}
                        {!isLoading && filteredRoles.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-[#687582]">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-30">search_off</span>
                                <p className="text-sm">Không tìm thấy vai trò</p>
                            </div>
                        )}
                        {filteredRoles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => handleSelectRole(role.id)}
                                className={`w-full px-5 py-4 text-left hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors ${selectedRoleId === role.id ? "bg-[#3C81C6]/5 dark:bg-[#3C81C6]/10 border-l-3 border-[#3C81C6]" : ""}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-bold text-[#121417] dark:text-white">{role.name}</h4>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.status === "active" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                                    >
                                        {role.status === "active" ? "Hoạt Động" : "Ngưng"}
                                    </span>
                                </div>
                                <p className="text-xs text-[#687582] dark:text-gray-500 mb-1.5">{role.description}</p>
                                <div className="flex items-center gap-3 text-[11px] text-[#687582] dark:text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[13px]">badge</span> {role.code}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[13px]">group</span> {role.users} người
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[13px]">key</span> {role.permissions.length} quyền
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cột phải — Ma trận quyền */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    {selected ? (
                        <>
                            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Quyền hạn: {selected.name}</h3>
                                    <p className="text-xs text-[#687582] dark:text-gray-500">
                                        {editedPermissions.length} quyền hệ thống • {editedApiPermissions.length} quyền API đang bật
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSuggestPermissions}
                                        title="Tự động check quyền gợi ý cho vai trò này"
                                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                        Gợi ý quyền
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!hasChanges || savingPermissions}
                                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                                            saveSuccess
                                                ? "bg-green-500 text-white"
                                                : hasChanges && !savingPermissions
                                                  ? "bg-[#3C81C6] text-white hover:bg-[#2a6da8]"
                                                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                        }`}
                                    >
                                        {savingPermissions ? (
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <span className="material-symbols-outlined text-[14px]">{saveSuccess ? "check" : "save"}</span>
                                        )}
                                        {savingPermissions ? "Đang lưu..." : saveSuccess ? "Đã lưu!" : "Lưu thay đổi"}
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-[#f0f1f3] dark:border-[#2d353e]">
                                <button
                                    onClick={() => setTab("permissions")}
                                    className={`px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 ${
                                        tab === "permissions"
                                            ? "text-[#3C81C6] border-b-2 border-[#3C81C6]"
                                            : "text-[#687582] hover:text-[#121417] dark:hover:text-white"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">key</span>
                                    Quyền hệ thống
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                                        {permGroups.reduce((sum, g) => sum + (g.permissions?.length ?? 0), 0)}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setTab("api_permissions")}
                                    className={`px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 ${
                                        tab === "api_permissions"
                                            ? "text-[#3C81C6] border-b-2 border-[#3C81C6]"
                                            : "text-[#687582] hover:text-[#121417] dark:hover:text-white"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">api</span>
                                    Quyền API
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                                        {apiPerms.length}
                                    </span>
                                </button>
                            </div>

                            {loadingPermissions && (
                                <div className="flex items-center justify-center py-8 gap-2 text-[#687582]">
                                    <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Đang tải quyền hạn...</span>
                                </div>
                            )}

                            {!loadingPermissions && tab === "permissions" && renderPermissionsTab()}
                            {!loadingPermissions && tab === "api_permissions" && renderApiPermissionsTab()}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-96 text-[#687582] dark:text-gray-500">
                            <span className="material-symbols-outlined text-[48px] mb-3 opacity-30">admin_panel_settings</span>
                            <p className="text-sm">Chọn một vai trò ở bên trái để xem và chỉnh sửa quyền hạn</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Role Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]">add_circle</span>
                                Thêm vai trò mới
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên vai trò *</label>
                                <input
                                    type="text"
                                    value={newRole.name}
                                    onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="VD: Kỹ thuật viên"
                                    className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mã vai trò *</label>
                                <input
                                    type="text"
                                    value={newRole.code}
                                    onChange={(e) => setNewRole((p) => ({ ...p, code: e.target.value }))}
                                    placeholder="VD: TECHNICIAN"
                                    className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mô tả</label>
                                <textarea
                                    value={newRole.description}
                                    onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))}
                                    rows={2}
                                    placeholder="Mô tả vai trò..."
                                    className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-[#687582] rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddRole}
                                disabled={!newRole.name.trim() || !newRole.code.trim() || creatingRole}
                                className="px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {creatingRole ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                )}
                                {creatingRole ? "Đang tạo..." : "Tạo vai trò"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
