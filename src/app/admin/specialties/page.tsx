"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { SPECIALTY_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";
import { translateError } from "@/utils/translateError";

interface Specialty {
    id: string;
    code: string;
    name: string;
    description?: string;
    icon?: string;
    doctorCount?: number;
    serviceCount?: number;
    isActive: boolean;
}

interface FormState {
    id?: string;
    code: string;
    name: string;
    description: string;
    icon: string;
}

const EMPTY_FORM: FormState = { code: "", name: "", description: "", icon: "local_hospital" };

const SPECIALTY_ICONS = [
    "local_hospital", "stethoscope", "cardiology", "neurology", "pediatrics", "dermatology",
    "visibility", "hearing", "medical_services", "psychology", "dentistry", "radiology",
];

function mapSpecialty(r: any): Specialty {
    return {
        id: String(r.specialties_id ?? r.specialty_id ?? r.id ?? ""),
        code: r.code ?? r.specialty_code ?? "",
        name: r.name ?? r.specialty_name ?? "",
        description: r.description ?? "",
        icon: r.icon ?? "local_hospital",
        doctorCount: Number(r.doctor_count ?? r.doctorCount ?? 0),
        serviceCount: Number(r.service_count ?? r.serviceCount ?? 0),
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
    };
}

export default function SpecialtiesPage() {
    const toast = useToast();
    const t = useTranslations("pages.specialties");
    const tc = useTranslations("common");
    const tErr = useTranslations("errors");
    const [items, setItems] = useState<Specialty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(SPECIALTY_ENDPOINTS.LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapSpecialty));
        } catch {
            setError(t("toast.loadError"));
            setItems([]);
        } finally { setLoading(false); }
    }, [t]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((s) => `${s.code} ${s.name} ${s.description ?? ""}`.toLowerCase().includes(q));
    }, [items, search]);

    const stats = useMemo(() => ({
        total: items.length,
        active: items.filter((s) => s.isActive).length,
        doctors: items.reduce((s, x) => s + (x.doctorCount ?? 0), 0),
        services: items.reduce((s, x) => s + (x.serviceCount ?? 0), 0),
    }), [items]);

    const openCreate = () => { setForm(EMPTY_FORM); setShowModal(true); };
    const openEdit = (s: Specialty) => {
        setForm({ id: s.id, code: s.code, name: s.name, description: s.description ?? "", icon: s.icon ?? "local_hospital" });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) { toast.warning(t("toast.requiredCodeName")); return; }
        setSaving(true);
        try {
            const payload = {
                code: form.code.trim(),
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                icon: form.icon,
            };
            if (form.id) {
                await axiosClient.put(SPECIALTY_ENDPOINTS.UPDATE(form.id), payload);
                toast.success(tc("toast.updated"));
            } else {
                await axiosClient.post(SPECIALTY_ENDPOINTS.CREATE, payload);
                toast.success(tc("toast.created"));
            }
            setShowModal(false);
            await load();
        } catch (err: any) {
            toast.error(translateError(err, tErr));
        } finally { setSaving(false); }
    };

    const handleDelete = async (s: Specialty) => {
        if (!confirm(tc("confirm.deleteNamed", { name: s.name }))) return;
        try {
            await axiosClient.delete(SPECIALTY_ENDPOINTS.DELETE(s.id));
            toast.success(tc("toast.deleted")); await load();
        } catch (err: any) { toast.error(translateError(err, tErr)); }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="local_hospital"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
                actions={
                    <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        {t("addButton")}
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label={t("stats.total")} value={stats.total} icon="local_hospital" color="blue" loading={loading} />
                <StatCard label={t("stats.active")} value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label={t("stats.doctors")} value={stats.doctors} icon="stethoscope" color="violet" loading={loading} />
                <StatCard label={t("stats.services")} value={stats.services} icon="medical_services" color="amber" loading={loading} />
            </div>

            <FilterBar searchPlaceholder={t("filter.searchPlaceholder")} searchValue={search} onSearchChange={setSearch} onReset={() => setSearch("")} />

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="local_hospital" title={items.length === 0 ? t("empty.none") : t("empty.noMatch")} description={items.length === 0 ? t("empty.noneDesc") : t("empty.noMatchDesc")} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((s) => (
                        <div key={s.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all overflow-hidden">
                            <div className={`h-1.5 bg-gradient-to-r ${s.isActive ? "from-[#3C81C6] to-[#1d4ed8]" : "from-gray-300 to-gray-400"}`} />
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white flex-shrink-0">
                                            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>{s.icon || "local_hospital"}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-[#121417] dark:text-white truncate">{s.name}</h3>
                                            <p className="text-xs font-mono text-[#687582]">{s.code}</p>
                                        </div>
                                    </div>
                                    <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${s.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-gray-100 text-gray-700"}`}>
                                        {s.isActive ? t("statusLabel.active") : t("statusLabel.inactive")}
                                    </div>
                                </div>
                                {s.description && <p className="text-xs text-[#687582] dark:text-gray-400 mb-3 line-clamp-2">{s.description}</p>}
                                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <div className="text-center">
                                        <div className="font-bold text-[#3C81C6] text-lg">{s.doctorCount ?? 0}</div>
                                        <div className="text-[10px] text-[#687582]">{t("units.doctors")}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-violet-600 text-lg">{s.serviceCount ?? 0}</div>
                                        <div className="text-[10px] text-[#687582]">{t("units.services")}</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-50 dark:border-gray-800 mt-3">
                                    <button onClick={() => openEdit(s)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title={tc("table.editTitle")}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(s)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title={tc("table.deleteTitle")}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
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
                                    <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-mono dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.icon")}</label>
                                    <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white">
                                        {SPECIALTY_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.name")} *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.description")}</label>
                                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#13191f]">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined">{form.icon}</span>
                                </div>
                                <div className="text-xs text-[#687582]">{t("modal.iconPreview")} <b className="font-mono text-[#121417] dark:text-white">{form.icon}</b></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">{tc("actions.cancel")}</button>
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
