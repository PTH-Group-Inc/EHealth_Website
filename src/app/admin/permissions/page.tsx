"use client";

import { useCallback, useEffect, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { PERMISSION_ENDPOINTS, MENU_ENDPOINTS, API_PERMISSION_ENDPOINTS, MODULE_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

type TabKey = "permissions" | "menus" | "api-permissions" | "modules";

interface Permission { id: string; code: string; name: string; module?: string; description?: string; }
interface Menu { id: string; code: string; label: string; icon?: string; parent?: string; order?: number; }
interface ApiPerm { id: string; method: string; path: string; description?: string; }
interface ModuleItem { name: string; permissionCount: number; }

function mapPerm(r: any): Permission {
    return {
        id: String(r.permission_id ?? r.id ?? ""),
        code: r.code ?? r.permission_code ?? "",
        name: r.name ?? "",
        module: r.module ?? r.module_name ?? "",
        description: r.description ?? "",
    };
}
function mapMenu(r: any): Menu {
    return {
        id: String(r.menu_id ?? r.id ?? ""),
        code: r.code ?? "",
        label: r.label ?? r.name ?? "",
        icon: r.icon ?? "",
        parent: r.parent_id ?? r.parentId ?? "",
        order: Number(r.order ?? r.sort_order ?? 0),
    };
}
function mapApiPerm(r: any): ApiPerm {
    return {
        id: String(r.api_permission_id ?? r.id ?? ""),
        method: (r.method ?? "GET").toUpperCase(),
        path: r.path ?? r.endpoint ?? "",
        description: r.description ?? "",
    };
}

export default function PermissionsPage() {
    const [tab, setTab] = useState<TabKey>("permissions");
    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Quản lý quyền hệ thống"
                subtitle="Permissions, Menus, API permissions và Modules"
                icon="lock"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Phân quyền" }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-1.5 inline-flex gap-1 flex-wrap">
                {([
                    { key: "permissions", label: "Permissions", icon: "lock" },
                    { key: "menus", label: "Menus", icon: "menu" },
                    { key: "api-permissions", label: "API Permissions", icon: "api" },
                    { key: "modules", label: "Modules", icon: "view_module" },
                ] as { key: TabKey; label: string; icon: string }[]).map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 ${tab === t.key ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm" : "text-[#687582] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "permissions" && <PermissionsTab />}
            {tab === "menus" && <MenusTab />}
            {tab === "api-permissions" && <ApiPermTab />}
            {tab === "modules" && <ModulesTab />}
        </div>
    );
}

function PermissionsTab() {
    const toast = useToast();
    const [items, setItems] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(PERMISSION_ENDPOINTS.LIST, { params: { limit: 500 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapPerm));
        } catch {
            setError("Không tải được permissions.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (p: Permission) => {
        if (!confirm(`Xoá permission "${p.code}"?`)) return;
        try {
            await axiosClient.delete(PERMISSION_ENDPOINTS.DELETE(p.id));
            toast.success("Đã xoá."); await load();
        } catch { toast.error("Không xoá được."); }
    };

    const byModule = items.reduce<Record<string, Permission[]>>((acc, p) => {
        const k = p.module || "Khác";
        if (!acc[k]) acc[k] = [];
        acc[k].push(p);
        return acc;
    }, {});

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng permission" value={items.length} icon="lock" color="blue" loading={loading} />
                <StatCard label="Module" value={Object.keys(byModule).length} icon="view_module" color="violet" loading={loading} />
                <StatCard label="Có description" value={items.filter((p) => p.description).length} icon="description" color="emerald" loading={loading} />
                <StatCard label="Không module" value={(byModule["Khác"] ?? []).length} icon="help" color="amber" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="lock" title="Chưa có permission" description="Hệ thống chưa định nghĩa permission nào." />
            ) : (
                <div className="space-y-4">
                    {Object.entries(byModule).map(([mod, list]) => (
                        <div key={mod} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                            <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                                <h3 className="font-bold text-[#121417] dark:text-white text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>view_module</span>
                                    {mod} <span className="text-xs text-[#687582] font-normal">({list.length})</span>
                                </h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {list.map((p, idx) => (
                                        <tr key={p.id || `perm-${mod}-${idx}`} className="border-b border-gray-50 dark:border-gray-800">
                                            <td className="px-4 py-2 font-mono text-xs text-[#3C81C6] w-64">{p.code}</td>
                                            <td className="px-4 py-2 text-[#121417] dark:text-white">{p.name}</td>
                                            <td className="px-4 py-2 text-xs text-[#687582] dark:text-gray-400">{p.description || "—"}</td>
                                            <td className="px-4 py-2 text-right w-16">
                                                <button onClick={() => handleDelete(p)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

function MenusTab() {
    const toast = useToast();
    const [items, setItems] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(MENU_ENDPOINTS.LIST, { params: { limit: 500 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapMenu));
        } catch {
            setError("Không tải được menus.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (m: Menu) => {
        if (!confirm(`Xoá menu "${m.label}"?`)) return;
        try {
            await axiosClient.delete(MENU_ENDPOINTS.DELETE(m.id));
            toast.success("Đã xoá."); await load();
        } catch { toast.error("Không xoá được."); }
    };

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng menu" value={items.length} icon="menu" color="blue" loading={loading} />
                <StatCard label="Menu cha" value={items.filter((m) => !m.parent).length} icon="folder" color="violet" loading={loading} />
                <StatCard label="Menu con" value={items.filter((m) => m.parent).length} icon="folder_open" color="emerald" loading={loading} />
                <StatCard label="Có icon" value={items.filter((m) => m.icon).length} icon="emoji_symbols" color="amber" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="menu" title="Chưa có menu" description="Hệ thống chưa định nghĩa menu nào." />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-[#687582]">Icon</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#687582]">Label</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#687582]">Code</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#687582]">Menu cha</th>
                                <th className="text-right px-4 py-3 font-semibold text-[#687582]">Order</th>
                                <th className="text-right px-4 py-3 font-semibold text-[#687582]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((m, idx) => (
                                <tr key={m.id || `menu-${idx}`} className="border-b border-gray-50 dark:border-gray-800">
                                    <td className="px-4 py-3">{m.icon && <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>{m.icon}</span>}</td>
                                    <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{m.label}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-[#687582]">{m.code}</td>
                                    <td className="px-4 py-3 text-xs text-[#687582]">{m.parent || "—"}</td>
                                    <td className="px-4 py-3 text-right font-mono">{m.order ?? 0}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleDelete(m)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

function ApiPermTab() {
    const toast = useToast();
    const [items, setItems] = useState<ApiPerm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const METHOD_COLORS: Record<string, string> = {
        GET: "bg-emerald-100 text-emerald-700",
        POST: "bg-blue-100 text-blue-700",
        PUT: "bg-amber-100 text-amber-700",
        PATCH: "bg-violet-100 text-violet-700",
        DELETE: "bg-red-100 text-red-700",
    };

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(API_PERMISSION_ENDPOINTS.LIST, { params: { limit: 500 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapApiPerm));
        } catch {
            setError("Không tải được API permissions.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (a: ApiPerm) => {
        if (!confirm(`Xoá API "${a.method} ${a.path}"?`)) return;
        try {
            await axiosClient.delete(API_PERMISSION_ENDPOINTS.DELETE(a.id));
            toast.success("Đã xoá."); await load();
        } catch { toast.error("Không xoá được."); }
    };

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng API" value={items.length} icon="api" color="blue" loading={loading} />
                <StatCard label="GET" value={items.filter((a) => a.method === "GET").length} icon="download" color="emerald" loading={loading} />
                <StatCard label="POST/PUT/PATCH" value={items.filter((a) => ["POST", "PUT", "PATCH"].includes(a.method)).length} icon="edit" color="violet" loading={loading} />
                <StatCard label="DELETE" value={items.filter((a) => a.method === "DELETE").length} icon="delete" color="red" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="api" title="Chưa có API permission" description="Khai báo endpoints để kiểm soát quyền gọi API." />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <tbody>
                            {items.map((a, idx) => (
                                <tr key={a.id || `api-${idx}`} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                    <td className="px-4 py-2 w-24">
                                        <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${METHOD_COLORS[a.method] ?? "bg-gray-100 text-gray-700"}`}>{a.method}</div>
                                    </td>
                                    <td className="px-4 py-2 font-mono text-xs text-[#121417] dark:text-white">{a.path}</td>
                                    <td className="px-4 py-2 text-xs text-[#687582]">{a.description || "—"}</td>
                                    <td className="px-4 py-2 text-right w-16">
                                        <button onClick={() => handleDelete(a)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

function ModulesTab() {
    const [items, setItems] = useState<ModuleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(MODULE_ENDPOINTS.LIST);
            const { data } = unwrapList<any>(res);
            setItems(data.map((r: any) => ({
                name: r.name ?? r.module_name ?? "",
                permissionCount: Number(r.permission_count ?? r.permissionCount ?? 0),
            })));
        } catch {
            setError("Không tải được modules.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <>
            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="view_module" title="Chưa có module" description="Modules được định nghĩa từ database, có thể lấy từ permissions." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((m) => (
                        <div key={m.name} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white"><span className="material-symbols-outlined" style={{ fontSize: "20px" }}>view_module</span></div>
                                    <div className="font-bold text-[#121417] dark:text-white">{m.name}</div>
                                </div>
                                <div className="font-mono text-sm font-bold text-[#3C81C6]">{m.permissionCount} perm</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
