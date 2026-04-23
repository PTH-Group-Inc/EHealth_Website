"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { TELE_CONSULTATION_TYPE_ENDPOINTS, TELE_CONFIG_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

type TabKey = "types" | "configs" | "admin-configs";

interface TeleType {
    id: string;
    name: string;
    code?: string;
    description?: string;
    duration?: number;
    price?: number;
    isActive: boolean;
}

interface TeleConfig {
    id: string;
    typeId: string;
    typeName?: string;
    configKey: string;
    configValue: string;
    note?: string;
}

interface AdminConfig {
    key: string;
    value: string;
    description?: string;
    updatedAt?: string;
}

function mapType(r: any): TeleType {
    return {
        id: String(r.type_id ?? r.id ?? ""),
        name: r.name ?? r.type_name ?? "",
        code: r.code ?? "",
        description: r.description ?? r.note ?? "",
        duration: Number(r.duration_minutes ?? r.duration ?? 0),
        price: Number(r.base_price ?? r.price ?? 0),
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
    };
}

function mapConfig(r: any): TeleConfig {
    return {
        id: String(r.config_id ?? r.id ?? ""),
        typeId: String(r.type_id ?? ""),
        typeName: r.type_name ?? "",
        configKey: r.config_key ?? r.key ?? "",
        configValue: r.config_value ?? r.value ?? "",
        note: r.note ?? "",
    };
}

function mapAdminConfig(r: any): AdminConfig {
    return {
        key: r.key ?? r.config_key ?? "",
        value: String(r.value ?? r.config_value ?? ""),
        description: r.description ?? r.note ?? "",
        updatedAt: r.updated_at ?? "",
    };
}

function formatVND(n: number): string {
    return n.toLocaleString("vi-VN") + " ₫";
}

export default function TeleTypesPage() {
    const t = useTranslations("pages.tele.types");
    const tc = useTranslations("common");
    const [tab, setTab] = useState<TabKey>("types");

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="videocam"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-1.5 inline-flex gap-1">
                {([
                    { key: "types", label: "Loại khám", icon: "medical_services" },
                    { key: "configs", label: "Config theo loại", icon: "tune" },
                    { key: "admin-configs", label: "Admin config", icon: "settings" },
                ] as { key: TabKey; label: string; icon: string }[]).map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 ${tab === t.key ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm" : "text-[#687582] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "types" && <TypesTab />}
            {tab === "configs" && <ConfigsTab />}
            {tab === "admin-configs" && <AdminConfigsTab />}
        </div>
    );
}

function TypesTab() {
    const toast = useToast();
    const [items, setItems] = useState<TeleType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(TELE_CONSULTATION_TYPE_ENDPOINTS.TYPES, { params: { limit: 100 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapType));
        } catch {
            setError("Không tải được loại khám.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (t: TeleType) => {
        if (!confirm(`Xoá loại khám "${t.name}"?`)) return;
        try {
            await axiosClient.delete(TELE_CONSULTATION_TYPE_ENDPOINTS.DELETE_TYPE(t.id));
            toast.success("Đã xoá."); await load();
        } catch { toast.error("Không xoá được."); }
    };

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng loại" value={items.length} icon="medical_services" color="blue" loading={loading} />
                <StatCard label="Đang hoạt động" value={items.filter((t) => t.isActive).length} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Thời lượng TB" value={items.length ? Math.round(items.reduce((s, t) => s + (t.duration ?? 0), 0) / items.length) + " ph" : "—"} icon="timer" color="violet" loading={loading} />
                <StatCard label="Giá TB" value={items.length ? formatVND(Math.round(items.reduce((s, t) => s + (t.price ?? 0), 0) / items.length)) : "—"} icon="payments" color="amber" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-200">{error}</div>}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="videocam" title="Chưa có loại khám từ xa" description="Định nghĩa các loại khám online (tư vấn nhanh, khám chuyên sâu, ...)" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((t) => (
                        <div key={t.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                            <div className={`h-1.5 bg-gradient-to-r ${t.isActive ? "from-[#3C81C6] to-[#1d4ed8]" : "from-gray-300 to-gray-400"}`} />
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white">
                                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>videocam</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#121417] dark:text-white">{t.name}</div>
                                            {t.code && <div className="text-xs font-mono text-[#687582]">{t.code}</div>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(t)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Xoá">
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                    </button>
                                </div>
                                {t.description && <p className="text-xs text-[#687582] dark:text-gray-400 mb-3 line-clamp-2">{t.description}</p>}
                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50 dark:border-gray-800">
                                    <div className="inline-flex items-center gap-1 text-xs text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>timer</span>
                                        {t.duration ?? 0} phút
                                    </div>
                                    <div className="font-mono font-bold text-sm text-[#3C81C6]">{formatVND(t.price ?? 0)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

function ConfigsTab() {
    const toast = useToast();
    const [items, setItems] = useState<TeleConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(TELE_CONSULTATION_TYPE_ENDPOINTS.CONFIGS, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapConfig));
        } catch {
            setError("Không tải được config theo loại.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (c: TeleConfig) => {
        if (!confirm(`Xoá config "${c.configKey}"?`)) return;
        try {
            await axiosClient.delete(TELE_CONSULTATION_TYPE_ENDPOINTS.DELETE_CONFIG(c.id));
            toast.success("Đã xoá."); await load();
        } catch { toast.error("Không xoá được."); }
    };

    return (
        <>
            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="tune" title="Chưa có config theo loại" description="Các config riêng cho từng loại khám sẽ hiển thị ở đây." />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-[#687582]">Loại khám</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#687582]">Key</th>
                                <th className="text-left px-4 py-3 font-semibold text-[#687582]">Value</th>
                                <th className="text-right px-4 py-3 font-semibold text-[#687582]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((c) => (
                                <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800">
                                    <td className="px-4 py-3 text-[#121417] dark:text-white">{c.typeName || "—"}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{c.configKey}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-[#121417] dark:text-white">{c.configValue}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleDelete(c)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
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

function AdminConfigsTab() {
    const toast = useToast();
    const [items, setItems] = useState<AdminConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [draft, setDraft] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(TELE_CONFIG_ENDPOINTS.ALL_CONFIGS);
            const { data } = unwrapList<any>(res);
            const list = data.map(mapAdminConfig);
            setItems(list);
            setDraft(Object.fromEntries(list.map((c) => [c.key, c.value])));
        } catch {
            setError("Không tải được admin config.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSaveOne = async (key: string) => {
        try {
            await axiosClient.put(TELE_CONFIG_ENDPOINTS.CONFIG(key), { value: draft[key] });
            toast.success(`Đã lưu ${key}.`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        }
    };

    const handleReset = async () => {
        if (!confirm("Reset tất cả config về mặc định?")) return;
        try {
            await axiosClient.post(TELE_CONFIG_ENDPOINTS.RESET_DEFAULTS);
            toast.success("Đã reset."); await load();
        } catch { toast.error("Không reset được."); }
    };

    return (
        <>
            <div className="flex items-center justify-end">
                <button onClick={handleReset} className="px-3 py-1.5 text-xs text-red-600 border border-red-500/40 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg inline-flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>restart_alt</span>
                    Reset mặc định
                </button>
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="settings" title="Chưa có admin config" description="Hệ thống chưa có config nào." />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
                    {items.map((c) => (
                        <div key={c.key} className="flex items-start gap-3 p-4">
                            <div className="flex-1 min-w-0">
                                <div className="font-mono text-sm font-bold text-[#121417] dark:text-white">{c.key}</div>
                                {c.description && <div className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">{c.description}</div>}
                            </div>
                            <input value={draft[c.key] ?? ""} onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })}
                                className="w-48 px-3 py-2 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm font-mono dark:text-white" />
                            <button onClick={() => handleSaveOne(c.key)} disabled={draft[c.key] === c.value} className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-lg disabled:opacity-50">Lưu</button>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
