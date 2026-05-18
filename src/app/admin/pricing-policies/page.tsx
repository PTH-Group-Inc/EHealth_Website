"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { BILLING_PRICING_ENDPOINTS, FACILITY_MANAGEMENT_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface Policy {
    id: string;
    facilityServiceId: string;
    serviceName: string;
    basePrice: number;
    currency: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    isActive: boolean;
    note?: string;
}

interface FacilityLite { id: string; name: string; }

function mapPolicy(r: any): Policy {
    return {
        id: String(r.policy_id ?? r.pricing_policy_id ?? r.id ?? ""),
        facilityServiceId: String(r.facility_service_id ?? r.facilityServiceId ?? ""),
        serviceName: r.service_name ?? r.serviceName ?? r.name ?? "—",
        basePrice: Number(r.base_price ?? r.basePrice ?? r.price ?? 0),
        currency: r.currency ?? "VND",
        effectiveFrom: r.effective_from ?? r.effectiveFrom ?? "",
        effectiveTo: r.effective_to ?? r.effectiveTo ?? "",
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
        note: r.note ?? r.description ?? "",
    };
}

function formatDate(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatVND(n: number): string {
    return n.toLocaleString("vi-VN") + " ₫";
}

export default function PricingPoliciesPage() {
    const toast = useToast();
    const t = useTranslations("pages.pricingPolicies");
    const tc = useTranslations("common");
    const [facilities, setFacilities] = useState<FacilityLite[]>([]);
    const [facilityId, setFacilityId] = useState("");
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [expiringOnly, setExpiringOnly] = useState(false);

    const loadFacilities = useCallback(async () => {
        try {
            const res = await axiosClient.get(FACILITY_MANAGEMENT_ENDPOINTS.DROPDOWN);
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            const list = raw.map((d: any) => ({ id: String(d.facility_id ?? d.facilities_id ?? d.id ?? ""), name: d.name ?? d.facility_name ?? "" })).filter((f) => f.id);
            setFacilities(list);
            if (list.length > 0 && !facilityId) setFacilityId(list[0].id);
        } catch {
            setFacilities([]);
        }
    }, [facilityId]);

    const load = useCallback(async () => {
        if (!facilityId) return;
        setLoading(true);
        setError(null);
        try {
            const endpoint = expiringOnly ? BILLING_PRICING_ENDPOINTS.EXPIRING_POLICIES(facilityId) : BILLING_PRICING_ENDPOINTS.FACILITY_CATALOG(facilityId);
            const res = await axiosClient.get(endpoint);
            const { data } = unwrapList<any>(res);
            setPolicies(data.map(mapPolicy));
        } catch {
            setError(t("toast.loadError"));
            setPolicies([]);
        } finally {
            setLoading(false);
        }
    }, [facilityId, expiringOnly, t]);

    useEffect(() => { loadFacilities(); }, [loadFacilities]);
    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return policies;
        return policies.filter((p) => p.serviceName.toLowerCase().includes(q));
    }, [policies, search]);

    const stats = useMemo(() => {
        const active = policies.filter((p) => p.isActive);
        const sum = active.reduce((s, p) => s + p.basePrice, 0);
        return {
            total: policies.length,
            active: active.length,
            avg: active.length > 0 ? Math.round(sum / active.length) : 0,
            expiring: policies.filter((p) => {
                if (!p.effectiveTo) return false;
                const days = (new Date(p.effectiveTo).getTime() - Date.now()) / 86400000;
                return days > 0 && days <= 30;
            }).length,
        };
    }, [policies]);

    const handleDelete = async (p: Policy) => {
        if (!confirm(t("toast.deleteConfirm", { name: p.serviceName }))) return;
        try {
            await axiosClient.delete(BILLING_PRICING_ENDPOINTS.DELETE_POLICY(p.id));
            toast.success(t("toast.deleted"));
            await load();
        } catch {
            toast.error(t("toast.deleteError"));
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="price_change"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4 flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium text-[#121417] dark:text-gray-300">{t("header.facilityLabel")}</label>
                <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}
                    className="flex-1 max-w-sm px-4 py-2 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                    <option value="">{t("header.facilityPlaceholder")}</option>
                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-[#121417] dark:text-white cursor-pointer">
                    <input type="checkbox" checked={expiringOnly} onChange={(e) => setExpiringOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-[#dde0e4] text-[#3C81C6] focus:ring-[#3C81C6]" />
                    {t("header.expiringOnly")}
                </label>
            </div>

            {facilityId && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label={t("stats.total")} value={stats.total} icon="price_change" color="blue" loading={loading} />
                        <StatCard label={t("stats.active")} value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                        <StatCard label={t("stats.avg")} value={formatVND(stats.avg)} icon="payments" color="violet" loading={loading} />
                        <StatCard label={t("stats.expiring")} value={stats.expiring} icon="warning" color="amber" loading={loading} />
                    </div>

                    <FilterBar searchPlaceholder={t("filter.searchPlaceholder")} searchValue={search} onSearchChange={setSearch} onReset={() => setSearch("")} />

                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                            <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
                    ) : filtered.length === 0 ? (
                        <EmptyState icon="price_change" title={t("empty.none")} description={policies.length === 0 ? t("empty.noneDesc") : t("empty.noMatchDesc")} />
                    ) : (
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">{t("table.service")}</th>
                                            <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">{t("table.basePrice")}</th>
                                            <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">{t("table.effective")}</th>
                                            <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">{t("table.status")}</th>
                                            <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">{tc("table.actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((p, idx) => (
                                            <tr key={p.id || `${p.facilityServiceId}-${idx}`} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                                <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{p.serviceName}</td>
                                                <td className="px-4 py-3 text-right font-mono font-semibold text-[#121417] dark:text-white">{formatVND(p.basePrice)}</td>
                                                <td className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400">{formatDate(p.effectiveFrom)} → {formatDate(p.effectiveTo)}</td>
                                                <td className="px-4 py-3">
                                                    <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${p.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
                                                        {p.isActive ? t("statusLabel.active") : t("statusLabel.inactive")}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => handleDelete(p)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title={t("table.deleteTitle")}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
