"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { NOTIFICATION_ENDPOINTS, ROLE_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

interface Category { id: string; code: string; name: string; }
interface Role { id: string; name: string; code?: string; }
interface RoleConfig { roleId: string; categoryId: string; email: boolean; sms: boolean; push: boolean; inbox: boolean; }

function mapCategory(r: any): Category {
    return {
        id: String(r.category_id ?? r.id ?? ""),
        code: r.code ?? "",
        name: r.name ?? "",
    };
}

function mapRole(r: any): Role {
    return {
        id: String(r.role_id ?? r.roles_id ?? r.id ?? ""),
        name: r.name ?? r.role_name ?? "",
        code: r.code ?? "",
    };
}

function mapConfig(r: any): RoleConfig {
    return {
        roleId: String(r.role_id ?? r.roleId ?? ""),
        categoryId: String(r.category_id ?? r.categoryId ?? ""),
        email: Boolean(r.email ?? r.via_email ?? false),
        sms: Boolean(r.sms ?? r.via_sms ?? false),
        push: Boolean(r.push ?? r.via_push ?? false),
        inbox: Boolean(r.inbox ?? r.via_inbox ?? true),
    };
}

export default function NotificationRoleConfigsPage() {
    const toast = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [configs, setConfigs] = useState<Map<string, RoleConfig>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [catRes, roleRes, cfgRes] = await Promise.all([
                axiosClient.get(NOTIFICATION_ENDPOINTS.CATEGORIES, { params: { limit: 200 } }),
                axiosClient.get(ROLE_ENDPOINTS.LIST, { params: { limit: 200 } }),
                axiosClient.get(NOTIFICATION_ENDPOINTS.ROLE_CONFIGS).catch(() => ({ data: { data: [] } })),
            ]);
            const { data: catData } = unwrapList<any>(catRes);
            const { data: roleData } = unwrapList<any>(roleRes);
            const { data: cfgData } = unwrapList<any>(cfgRes);
            setCategories(catData.map(mapCategory));
            setRoles(roleData.map(mapRole));
            const m = new Map<string, RoleConfig>();
            cfgData.map(mapConfig).forEach((c) => m.set(`${c.roleId}:${c.categoryId}`, c));
            setConfigs(m);
        } catch {
            setError("Không tải được config role × category.");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const getConfig = (roleId: string, categoryId: string): RoleConfig => {
        return configs.get(`${roleId}:${categoryId}`) ?? { roleId, categoryId, email: false, sms: false, push: false, inbox: true };
    };

    const toggle = async (roleId: string, categoryId: string, channel: keyof RoleConfig) => {
        const current = getConfig(roleId, categoryId);
        const next = { ...current, [channel]: !(current as any)[channel] };
        const key = `${roleId}:${categoryId}`;
        const newMap = new Map(configs);
        newMap.set(key, next);
        setConfigs(newMap);
        try {
            await axiosClient.put(NOTIFICATION_ENDPOINTS.ROLE_CONFIG_UPDATE(roleId, categoryId), {
                email: next.email, sms: next.sms, push: next.push, inbox: next.inbox,
            });
        } catch {
            toast.error("Không lưu được.");
            setConfigs(configs); // rollback
        }
    };

    const stats = useMemo(() => {
        const total = roles.length * categories.length;
        let enabled = 0;
        configs.forEach((c) => { if (c.email || c.sms || c.push || c.inbox) enabled++; });
        return { total, enabled, roles: roles.length, categories: categories.length };
    }, [roles, categories, configs]);

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Cấu hình thông báo theo vai trò"
                subtitle="Ma trận vai trò × loại thông báo × kênh (Email/SMS/Push/Inbox)"
                icon="notifications"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Thông báo" }, { label: "Role config" }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Vai trò" value={stats.roles} icon="badge" color="blue" loading={loading} />
                <StatCard label="Loại thông báo" value={stats.categories} icon="notifications" color="violet" loading={loading} />
                <StatCard label="Cell đã cấu hình" value={stats.enabled} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Tổng cell" value={stats.total} icon="grid_on" color="amber" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : categories.length === 0 || roles.length === 0 ? (
                <EmptyState icon="notifications" title="Chưa có data" description="Cần có role + notification category trước." />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-3 py-2 font-semibold text-[#687582] sticky left-0 bg-[#f8f9fa] dark:bg-[#13191f] min-w-[180px]">Loại thông báo</th>
                                    {roles.map((r, idx) => (
                                        <th key={r.id || `role-h-${idx}`} colSpan={4} className="text-center px-2 py-1 font-semibold text-xs text-[#687582] border-l border-[#dde0e4] dark:border-[#2d353e]">{r.name}</th>
                                    ))}
                                </tr>
                                <tr className="border-t border-[#dde0e4] dark:border-[#2d353e]">
                                    <th className="sticky left-0 bg-[#f8f9fa] dark:bg-[#13191f]"></th>
                                    {roles.map((r, idx) => (
                                        <Fragment key={r.id || `role-sub-${idx}`}>
                                            <th className="px-1 py-1 text-[10px] font-semibold text-[#687582] border-l border-[#dde0e4] dark:border-[#2d353e]" title="Email">✉</th>
                                            <th className="px-1 py-1 text-[10px] font-semibold text-[#687582]" title="SMS">SMS</th>
                                            <th className="px-1 py-1 text-[10px] font-semibold text-[#687582]" title="Push">🔔</th>
                                            <th className="px-1 py-1 text-[10px] font-semibold text-[#687582]" title="Inbox">📥</th>
                                        </Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((c, cIdx) => (
                                    <tr key={c.id || `cat-${cIdx}`} className="border-b border-gray-50 dark:border-gray-800">
                                        <td className="px-3 py-2 font-medium text-[#121417] dark:text-white text-xs sticky left-0 bg-white dark:bg-[#1e242b]">{c.name}</td>
                                        {roles.map((r, rIdx) => {
                                            const cfg = getConfig(r.id, c.id);
                                            return (
                                                <Fragment key={`${r.id || rIdx}-${c.id || cIdx}`}>
                                                    <td className="px-1 py-1 text-center border-l border-[#dde0e4] dark:border-[#2d353e]">
                                                        <input type="checkbox" checked={cfg.email} onChange={() => toggle(r.id, c.id, "email")} className="w-3 h-3" />
                                                    </td>
                                                    <td className="px-1 py-1 text-center">
                                                        <input type="checkbox" checked={cfg.sms} onChange={() => toggle(r.id, c.id, "sms")} className="w-3 h-3" />
                                                    </td>
                                                    <td className="px-1 py-1 text-center">
                                                        <input type="checkbox" checked={cfg.push} onChange={() => toggle(r.id, c.id, "push")} className="w-3 h-3" />
                                                    </td>
                                                    <td className="px-1 py-1 text-center">
                                                        <input type="checkbox" checked={cfg.inbox} onChange={() => toggle(r.id, c.id, "inbox")} className="w-3 h-3" />
                                                    </td>
                                                </Fragment>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
