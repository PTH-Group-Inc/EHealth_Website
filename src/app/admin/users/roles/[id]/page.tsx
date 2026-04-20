"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosClient from "@/api/axiosClient";
import { ROLE_ENDPOINTS, PERMISSION_ENDPOINTS, MENU_ENDPOINTS, API_PERMISSION_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

type TabKey = "permissions" | "menus" | "api-permissions";

interface Role { id: string; name: string; code?: string; description?: string; }
interface Permission { id: string; code: string; name: string; module?: string; }
interface MenuItem { id: string; code: string; label: string; icon?: string; }
interface ApiPerm { id: string; method: string; path: string; }

function mapPerm(r: any): Permission {
    return {
        id: String(r.permission_id ?? r.id ?? ""),
        code: r.code ?? "",
        name: r.name ?? "",
        module: r.module ?? "",
    };
}
function mapMenu(r: any): MenuItem {
    return {
        id: String(r.menu_id ?? r.id ?? ""),
        code: r.code ?? "",
        label: r.label ?? r.name ?? "",
        icon: r.icon ?? "",
    };
}
function mapApiPerm(r: any): ApiPerm {
    return {
        id: String(r.api_permission_id ?? r.id ?? ""),
        method: (r.method ?? "GET").toUpperCase(),
        path: r.path ?? "",
    };
}

export default function RoleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const roleId = String(params?.id ?? "");
    const toast = useToast();
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>("permissions");

    useEffect(() => {
        if (!roleId) return;
        let mounted = true;
        (async () => {
            try {
                const res = await axiosClient.get(ROLE_ENDPOINTS.DETAIL(roleId));
                const r = res.data?.data ?? res.data ?? {};
                if (mounted) {
                    setRole({
                        id: String(r.role_id ?? r.roles_id ?? r.id ?? roleId),
                        name: r.name ?? r.role_name ?? "—",
                        code: r.code ?? "",
                        description: r.description ?? "",
                    });
                }
            } catch {
                if (mounted) toast.error("Không tải được thông tin vai trò.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleId]);

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={role ? `Phân quyền: ${role.name}` : "Chi tiết vai trò"}
                subtitle="Gán permissions, menus, API permissions cho vai trò"
                icon="badge"
                breadcrumbs={[
                    { label: "Quản trị", href: "/admin" },
                    { label: "Vai trò", href: "/admin/users/roles" },
                    { label: role?.name ?? roleId },
                ]}
                actions={
                    <button onClick={() => router.back()} className="px-4 py-2 text-sm font-semibold text-[#687582] border border-[#dde0e4] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                        Quay lại
                    </button>
                }
            />

            {loading ? (
                <div className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : role ? (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white">
                            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>badge</span>
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-lg text-[#121417] dark:text-white">{role.name}</div>
                            {role.code && <div className="text-xs font-mono text-[#687582]">{role.code}</div>}
                            {role.description && <div className="text-xs text-[#687582] dark:text-gray-400 mt-1">{role.description}</div>}
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-1.5 inline-flex gap-1">
                {([
                    { key: "permissions", label: "Permissions", icon: "lock" },
                    { key: "menus", label: "Menus", icon: "menu" },
                    { key: "api-permissions", label: "API Permissions", icon: "api" },
                ] as { key: TabKey; label: string; icon: string }[]).map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 ${tab === t.key ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm" : "text-[#687582] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "permissions" && <AssignPermissionsTab roleId={roleId} />}
            {tab === "menus" && <AssignMenusTab roleId={roleId} />}
            {tab === "api-permissions" && <AssignApiPermTab roleId={roleId} />}
        </div>
    );
}

function AssignPermissionsTab({ roleId }: { roleId: string }) {
    const toast = useToast();
    const [all, setAll] = useState<Permission[]>([]);
    const [assigned, setAssigned] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [allRes, assignedRes] = await Promise.all([
                axiosClient.get(PERMISSION_ENDPOINTS.LIST, { params: { limit: 500 } }),
                axiosClient.get(ROLE_ENDPOINTS.PERMISSIONS(roleId)),
            ]);
            const { data: allData } = unwrapList<any>(allRes);
            const { data: assignedData } = unwrapList<any>(assignedRes);
            setAll(allData.map(mapPerm));
            setAssigned(new Set(assignedData.map((r: any) => String(r.permission_id ?? r.id))));
        } catch { setAll([]); setAssigned(new Set()); }
        finally { setLoading(false); }
    }, [roleId]);

    useEffect(() => { load(); }, [load]);

    const toggle = async (permId: string) => {
        const next = new Set(assigned);
        if (next.has(permId)) next.delete(permId); else next.add(permId);
        setAssigned(next);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosClient.put(ROLE_ENDPOINTS.PERMISSIONS(roleId), { permission_ids: Array.from(assigned) });
            toast.success("Đã lưu permissions.");
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally { setSaving(false); }
    };

    const byModule = all.reduce<Record<string, Permission[]>>((acc, p) => {
        const k = p.module || "Khác";
        if (!acc[k]) acc[k] = [];
        acc[k].push(p);
        return acc;
    }, {});

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng permission" value={all.length} icon="lock" color="blue" loading={loading} />
                <StatCard label="Đã gán" value={assigned.size} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Chưa gán" value={all.length - assigned.size} icon="cancel" color="amber" loading={loading} />
                <StatCard label="Tỉ lệ" value={`${all.length ? Math.round(assigned.size / all.length * 100) : 0}%`} icon="percent" color="violet" loading={loading} />
            </div>

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : all.length === 0 ? (
                <EmptyState icon="lock" title="Chưa có permission" description="Tạo permissions tại trang Quản lý quyền." />
            ) : (
                <>
                    <div className="space-y-3">
                        {Object.entries(byModule).map(([mod, list]) => (
                            <div key={mod} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                                <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e] font-bold text-sm text-[#121417] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>view_module</span>
                                    {mod} ({list.filter((p) => assigned.has(p.id)).length}/{list.length})
                                </div>
                                <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-1">
                                    {list.map((p) => (
                                        <label key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] cursor-pointer">
                                            <input type="checkbox" checked={assigned.has(p.id)} onChange={() => toggle(p.id)} className="w-4 h-4 rounded border-[#dde0e4] text-[#3C81C6]" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-[#121417] dark:text-white truncate">{p.name}</div>
                                                <div className="font-mono text-[10px] text-[#687582] truncate">{p.code}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="sticky bottom-6 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-lg p-4 flex items-center justify-end">
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>
                            {saving ? "Đang lưu..." : `Lưu (${assigned.size} permissions)`}
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

function AssignMenusTab({ roleId }: { roleId: string }) {
    const toast = useToast();
    const [all, setAll] = useState<MenuItem[]>([]);
    const [assigned, setAssigned] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [allRes, assignedRes] = await Promise.all([
                axiosClient.get(MENU_ENDPOINTS.LIST, { params: { limit: 500 } }),
                axiosClient.get(ROLE_ENDPOINTS.MENUS(roleId)),
            ]);
            const { data: allData } = unwrapList<any>(allRes);
            const { data: assignedData } = unwrapList<any>(assignedRes);
            setAll(allData.map(mapMenu));
            setAssigned(new Set(assignedData.map((r: any) => String(r.menu_id ?? r.id))));
        } catch { setAll([]); setAssigned(new Set()); }
        finally { setLoading(false); }
    }, [roleId]);

    useEffect(() => { load(); }, [load]);

    const toggle = (id: string) => {
        const next = new Set(assigned);
        if (next.has(id)) next.delete(id); else next.add(id);
        setAssigned(next);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosClient.post(ROLE_ENDPOINTS.MENUS(roleId), { menu_ids: Array.from(assigned) });
            toast.success("Đã lưu menus.");
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally { setSaving(false); }
    };

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng menu" value={all.length} icon="menu" color="blue" loading={loading} />
                <StatCard label="Đã gán" value={assigned.size} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Chưa gán" value={all.length - assigned.size} icon="cancel" color="amber" loading={loading} />
                <StatCard label="Tỉ lệ" value={`${all.length ? Math.round(assigned.size / all.length * 100) : 0}%`} icon="percent" color="violet" loading={loading} />
            </div>

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : all.length === 0 ? (
                <EmptyState icon="menu" title="Chưa có menu" description="Tạo menus tại trang Quản lý quyền." />
            ) : (
                <>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                        {all.map((m) => (
                            <label key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] cursor-pointer">
                                <input type="checkbox" checked={assigned.has(m.id)} onChange={() => toggle(m.id)} className="w-4 h-4 rounded border-[#dde0e4] text-[#3C81C6]" />
                                {m.icon && <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>{m.icon}</span>}
                                <span className="text-sm text-[#121417] dark:text-white">{m.label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="sticky bottom-6 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-lg p-4 flex items-center justify-end">
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>
                            {saving ? "Đang lưu..." : `Lưu (${assigned.size} menus)`}
                        </button>
                    </div>
                </>
            )}
        </>
    );
}

function AssignApiPermTab({ roleId }: { roleId: string }) {
    const toast = useToast();
    const [all, setAll] = useState<ApiPerm[]>([]);
    const [assigned, setAssigned] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const METHOD_COLORS: Record<string, string> = {
        GET: "bg-emerald-100 text-emerald-700",
        POST: "bg-blue-100 text-blue-700",
        PUT: "bg-amber-100 text-amber-700",
        PATCH: "bg-violet-100 text-violet-700",
        DELETE: "bg-red-100 text-red-700",
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [allRes, assignedRes] = await Promise.all([
                axiosClient.get(API_PERMISSION_ENDPOINTS.LIST, { params: { limit: 500 } }),
                axiosClient.get(ROLE_ENDPOINTS.API_PERMISSIONS(roleId)),
            ]);
            const { data: allData } = unwrapList<any>(allRes);
            const { data: assignedData } = unwrapList<any>(assignedRes);
            setAll(allData.map(mapApiPerm));
            setAssigned(new Set(assignedData.map((r: any) => String(r.api_permission_id ?? r.id))));
        } catch { setAll([]); setAssigned(new Set()); }
        finally { setLoading(false); }
    }, [roleId]);

    useEffect(() => { load(); }, [load]);

    const toggle = (id: string) => {
        const next = new Set(assigned);
        if (next.has(id)) next.delete(id); else next.add(id);
        setAssigned(next);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosClient.post(ROLE_ENDPOINTS.API_PERMISSIONS(roleId), { api_ids: Array.from(assigned) });
            toast.success("Đã lưu API permissions.");
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally { setSaving(false); }
    };

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng API" value={all.length} icon="api" color="blue" loading={loading} />
                <StatCard label="Đã gán" value={assigned.size} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Chưa gán" value={all.length - assigned.size} icon="cancel" color="amber" loading={loading} />
                <StatCard label="Tỉ lệ" value={`${all.length ? Math.round(assigned.size / all.length * 100) : 0}%`} icon="percent" color="violet" loading={loading} />
            </div>

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : all.length === 0 ? (
                <EmptyState icon="api" title="Chưa có API permissions" description="Khai báo API permissions để kiểm soát quyền gọi." />
            ) : (
                <>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-3 space-y-1 max-h-[500px] overflow-y-auto">
                        {all.map((a) => (
                            <label key={a.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] cursor-pointer">
                                <input type="checkbox" checked={assigned.has(a.id)} onChange={() => toggle(a.id)} className="w-4 h-4 rounded border-[#dde0e4] text-[#3C81C6]" />
                                <div className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md w-16 justify-center ${METHOD_COLORS[a.method] ?? "bg-gray-100 text-gray-700"}`}>{a.method}</div>
                                <span className="font-mono text-xs text-[#121417] dark:text-white flex-1 truncate">{a.path}</span>
                            </label>
                        ))}
                    </div>

                    <div className="sticky bottom-6 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-lg p-4 flex items-center justify-end">
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>
                            {saving ? "Đang lưu..." : `Lưu (${assigned.size} APIs)`}
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
