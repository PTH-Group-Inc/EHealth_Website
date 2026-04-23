"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { WAREHOUSE_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";
import { translateError } from "@/utils/translateError";

interface Warehouse {
    id: string;
    code: string;
    name: string;
    facilityName?: string;
    address?: string;
    manager?: string;
    phone?: string;
    type?: string;
    isActive: boolean;
    note?: string;
}

interface FormState {
    id?: string;
    code: string;
    name: string;
    address: string;
    manager: string;
    phone: string;
    type: string;
    note: string;
}

const EMPTY_FORM: FormState = { code: "", name: "", address: "", manager: "", phone: "", type: "MAIN", note: "" };

const TYPE_META: Record<string, { labelKey: "main" | "pharmacy" | "equipment" | "consumable" | "other"; icon: string }> = {
    MAIN: { labelKey: "main", icon: "warehouse" },
    PHARMACY: { labelKey: "pharmacy", icon: "medication" },
    EQUIPMENT: { labelKey: "equipment", icon: "medical_services" },
    CONSUMABLE: { labelKey: "consumable", icon: "inventory_2" },
    OTHER: { labelKey: "other", icon: "inventory" },
};

function mapWarehouse(r: any): Warehouse {
    return {
        id: String(r.warehouses_id ?? r.warehouse_id ?? r.id ?? ""),
        code: r.code ?? r.warehouse_code ?? "",
        name: r.name ?? r.warehouse_name ?? "",
        facilityName: r.facility_name ?? r.facilityName ?? "",
        address: r.address ?? "",
        manager: r.manager_name ?? r.managerName ?? r.manager ?? "",
        phone: r.phone ?? "",
        type: (r.type ?? r.warehouse_type ?? "MAIN").toUpperCase(),
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
        note: r.note ?? r.description ?? "",
    };
}

export default function WarehousesPage() {
    const toast = useToast();
    const t = useTranslations("pages.warehouses");
    const tc = useTranslations("common");
    const tErr = useTranslations("errors");
    const [items, setItems] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(WAREHOUSE_ENDPOINTS.LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapWarehouse));
        } catch {
            setError(t("toast.loadError"));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((w) => {
            if (typeFilter !== "all" && w.type !== typeFilter) return false;
            if (q && !`${w.code} ${w.name} ${w.manager ?? ""} ${w.address ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, typeFilter]);

    const stats = useMemo(() => ({
        total: items.length,
        active: items.filter((w) => w.isActive).length,
        pharmacy: items.filter((w) => w.type === "PHARMACY").length,
        equipment: items.filter((w) => w.type === "EQUIPMENT").length,
    }), [items]);

    const openCreate = () => { setForm(EMPTY_FORM); setShowModal(true); };
    const openEdit = (w: Warehouse) => {
        setForm({
            id: w.id, code: w.code, name: w.name,
            address: w.address ?? "", manager: w.manager ?? "",
            phone: w.phone ?? "", type: w.type ?? "MAIN", note: w.note ?? "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) { toast.warning(t("toast.requiredCodeName")); return; }
        setSaving(true);
        try {
            const payload = {
                code: form.code.trim(),
                name: form.name.trim(),
                address: form.address.trim() || undefined,
                manager_name: form.manager.trim() || undefined,
                phone: form.phone.trim() || undefined,
                type: form.type,
                note: form.note.trim() || undefined,
            };
            if (form.id) {
                await axiosClient.put(WAREHOUSE_ENDPOINTS.DETAIL(form.id), payload);
                toast.success(tc("toast.updated"));
            } else {
                await axiosClient.post(WAREHOUSE_ENDPOINTS.LIST, payload);
                toast.success(tc("toast.created"));
            }
            setShowModal(false);
            await load();
        } catch (err: any) {
            toast.error(translateError(err, tErr));
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (w: Warehouse) => {
        try {
            await axiosClient.patch(WAREHOUSE_ENDPOINTS.TOGGLE(w.id));
            toast.success(w.isActive ? t("toast.deactivated") : t("toast.activated"));
            await load();
        } catch {
            toast.error(t("toast.toggleFailed"));
        }
    };

    const handleDelete = async (w: Warehouse) => {
        if (!confirm(tc("confirm.deleteNamed", { name: w.name }))) return;
        try {
            await axiosClient.delete(WAREHOUSE_ENDPOINTS.DETAIL(w.id));
            toast.success(tc("toast.deleted"));
            await load();
        } catch (err: any) {
            toast.error(translateError(err, tErr));
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="warehouse"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
                actions={
                    <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        {t("addButton")}
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label={t("stats.total")} value={stats.total} icon="warehouse" color="blue" loading={loading} />
                <StatCard label={t("stats.active")} value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label={t("stats.pharmacy")} value={stats.pharmacy} icon="medication" color="violet" loading={loading} />
                <StatCard label={t("stats.equipment")} value={stats.equipment} icon="medical_services" color="amber" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder={t("filter.searchPlaceholder")}
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "type", label: t("filter.typeLabel"), value: typeFilter, onChange: setTypeFilter,
                    options: [{ value: "all", label: t("filter.allTypes") }, ...Object.entries(TYPE_META).map(([k, v]) => ({ value: k, label: t(`type.${v.labelKey}`) }))],
                }]}
                onReset={() => { setSearch(""); setTypeFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-36 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="warehouse" title={items.length === 0 ? t("empty.none") : t("empty.noMatch")} description={items.length === 0 ? t("empty.noneDesc") : t("empty.noMatchDesc")} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((w) => {
                        const tmeta = TYPE_META[w.type ?? "MAIN"] ?? TYPE_META.OTHER;
                        return (
                            <div key={w.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all overflow-hidden">
                                <div className={`h-1.5 bg-gradient-to-r ${w.isActive ? "from-[#3C81C6] to-[#1d4ed8]" : "from-gray-300 to-gray-400"}`} />
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white flex-shrink-0">
                                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{tmeta.icon}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-[#121417] dark:text-white truncate">{w.name}</div>
                                                <div className="text-xs font-mono text-[#687582] dark:text-gray-400">{w.code}</div>
                                            </div>
                                        </div>
                                        <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${w.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
                                            {w.isActive ? t("statusLabel.active") : t("statusLabel.inactive")}
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-xs text-[#687582] dark:text-gray-400">
                                        <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{tmeta.icon}</span>
                                            {t(`type.${tmeta.labelKey}`)}
                                        </div>
                                        {w.manager && <div className="flex items-center gap-1.5"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>person</span>{w.manager}</div>}
                                        {w.phone && <div className="flex items-center gap-1.5"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>phone</span>{w.phone}</div>}
                                        {w.address && <div className="flex items-start gap-1.5"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>location_on</span><span className="truncate">{w.address}</span></div>}
                                    </div>
                                    <div className="flex items-center gap-1 pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                                        <button onClick={() => handleToggle(w)} className="flex-1 px-2 py-1 text-xs text-[#3C81C6] hover:bg-[#3C81C6]/10 rounded-md">{w.isActive ? t("actions.deactivate") : t("actions.activate")}</button>
                                        <button onClick={() => openEdit(w)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title={tc("table.editTitle")}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(w)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title={tc("table.deleteTitle")}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{form.id ? "edit" : "add"}</span>
                            {form.id ? t("modal.titleEdit") : t("modal.titleCreate")}
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.code")} *</label>
                                    <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.type")}</label>
                                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                        {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{t(`type.${v.labelKey}`)}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.name")} *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.manager")}</label>
                                    <input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.phone")}</label>
                                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.address")}</label>
                                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.note")}</label>
                                <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">{tc("actions.cancel")}</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                                {saving ? tc("form.saving") : tc("actions.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
