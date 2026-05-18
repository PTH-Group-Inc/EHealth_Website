"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { SPECIALTY_ENDPOINTS, SPECIALTY_SERVICE_ENDPOINTS, STAFF_ENDPOINTS, MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS } from "@/api/endpoints";
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
    name: string;
    description: string;
    icon: string;
}

const EMPTY_FORM: FormState = { name: "", description: "", icon: "local_hospital" };

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
    const [assignFor, setAssignFor] = useState<Specialty | null>(null);
    const [allServices, setAllServices] = useState<{ id: string; name: string; code?: string }[]>([]);
    const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
    const [initialAssignedIds, setInitialAssignedIds] = useState<Set<string>>(new Set());
    const [assignSaving, setAssignSaving] = useState(false);
    const [assignSearch, setAssignSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [specRes, staffRes] = await Promise.allSettled([
                axiosClient.get(SPECIALTY_ENDPOINTS.LIST, { params: { limit: 200 } }),
                axiosClient.get(STAFF_ENDPOINTS.LIST, { params: { limit: 500 } }),
            ]);

            if (specRes.status !== "fulfilled") {
                setError(t("toast.loadError"));
                setItems([]);
                return;
            }
            const { data } = unwrapList<any>(specRes.value);
            const baseItems = data.map(mapSpecialty);

            const staffData: any[] = staffRes.status === "fulfilled"
                ? (staffRes.value.data?.data?.items ?? staffRes.value.data?.data ?? staffRes.value.data?.items ?? staffRes.value.data ?? [])
                : [];
            const doctorBySpec = new Map<string, number>();
            for (const s of (Array.isArray(staffData) ? staffData : [])) {
                const sid = String(s.specialty_id ?? s.specialtyId ?? s.specialties_id ?? "");
                const role = String(s.role ?? s.position ?? "").toUpperCase();
                if (!sid) continue;
                if (role.includes("DOCTOR") || role.includes("BAC_SI") || role === "BS") {
                    doctorBySpec.set(sid, (doctorBySpec.get(sid) ?? 0) + 1);
                }
            }

            const withDoctors = baseItems.map((s) => ({
                ...s,
                doctorCount: s.doctorCount && s.doctorCount > 0 ? s.doctorCount : (doctorBySpec.get(s.id) ?? 0),
            }));

            const svcCounts = await Promise.allSettled(
                withDoctors.map((s) => axiosClient.get(SPECIALTY_SERVICE_ENDPOINTS.SERVICES_BY_SPECIALTY(s.id)))
            );
            const finalItems = withDoctors.map((s, idx) => {
                const r = svcCounts[idx];
                if (r.status === "fulfilled") {
                    const raw = r.value.data?.data ?? r.value.data?.items ?? r.value.data ?? [];
                    const arr = Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? []);
                    return { ...s, serviceCount: Array.isArray(arr) ? arr.length : (s.serviceCount ?? 0) };
                }
                return s;
            });
            setItems(finalItems);
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

    const openAssign = async (s: Specialty) => {
        setAssignFor(s);
        setAssignSearch("");
        try {
            const [allRes, ownRes] = await Promise.allSettled([
                axiosClient.get(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.MASTER_LIST, { params: { limit: 500 } }),
                axiosClient.get(SPECIALTY_SERVICE_ENDPOINTS.SERVICES_BY_SPECIALTY(s.id)),
            ]);
            const allRaw: any[] = allRes.status === "fulfilled"
                ? (allRes.value.data?.data?.items ?? allRes.value.data?.data ?? allRes.value.data?.items ?? allRes.value.data ?? [])
                : [];
            setAllServices((Array.isArray(allRaw) ? allRaw : []).map((x: any) => ({
                id: String(x.services_id ?? x.service_id ?? x.id ?? ""),
                name: x.name ?? x.service_name ?? "",
                code: x.code ?? x.service_code ?? "",
            })).filter((x) => x.id));
            const ownRaw: any[] = ownRes.status === "fulfilled"
                ? (ownRes.value.data?.data?.items ?? ownRes.value.data?.data ?? ownRes.value.data?.items ?? ownRes.value.data ?? [])
                : [];
            const ids = new Set<string>(
                (Array.isArray(ownRaw) ? ownRaw : []).map((x: any) => String(x.services_id ?? x.service_id ?? x.id ?? "")).filter(Boolean)
            );
            setAssignedIds(new Set(ids));
            setInitialAssignedIds(new Set(ids));
        } catch {
            setAllServices([]);
            setAssignedIds(new Set());
            setInitialAssignedIds(new Set());
        }
    };

    const handleAssignSave = async () => {
        if (!assignFor) return;
        setAssignSaving(true);
        try {
            const toAdd = Array.from(assignedIds).filter((id) => !initialAssignedIds.has(id));
            const toRemove = Array.from(initialAssignedIds).filter((id) => !assignedIds.has(id));
            await Promise.all([
                ...toAdd.map((sid) =>
                    axiosClient.post(SPECIALTY_SERVICE_ENDPOINTS.ASSIGN_SERVICES(assignFor.id), { service_id: sid })
                ),
                ...toRemove.map((sid) =>
                    axiosClient.delete(SPECIALTY_SERVICE_ENDPOINTS.REMOVE_SERVICE(assignFor.id, sid))
                ),
            ]);
            toast.success(`Đã cập nhật ${toAdd.length + toRemove.length} dịch vụ.`);
            setAssignFor(null);
            await load();
        } catch (err: any) {
            toast.error(translateError(err, tErr));
        } finally { setAssignSaving(false); }
    };

    const toggleAssign = (id: string) => {
        const next = new Set(assignedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setAssignedIds(next);
    };

    const openCreate = () => { setForm(EMPTY_FORM); setShowModal(true); };
    const openEdit = (s: Specialty) => {
        setForm({ id: s.id, name: s.name, description: s.description ?? "", icon: s.icon ?? "local_hospital" });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.warning("Vui lòng nhập tên chuyên khoa."); return; }
        setSaving(true);
        try {
            const payload = {
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
                                <div className="flex items-center justify-between gap-1 pt-3 border-t border-gray-50 dark:border-gray-800 mt-3">
                                    <button onClick={() => openAssign(s)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-md" title="Gắn dịch vụ vào chuyên khoa">
                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>link</span>
                                        Gắn dịch vụ
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => openEdit(s)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title={tc("table.editTitle")}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(s)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title={tc("table.deleteTitle")}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                        </button>
                                    </div>
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
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.name")} *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.icon")}</label>
                                <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white">
                                    {SPECIALTY_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
                                </select>
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

            {assignFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setAssignFor(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-2xl w-full p-5 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-violet-600">link</span>
                            Gắn dịch vụ vào {assignFor.name}
                        </h3>
                        <p className="text-xs text-[#687582] mb-3">Chọn các dịch vụ thuộc chuyên khoa này.</p>
                        <input value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} placeholder="Tìm dịch vụ..."
                            className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white mb-3" />
                        <div className="flex-1 overflow-y-auto border border-[#dde0e4] dark:border-[#2d353e] rounded-xl p-2 space-y-1 min-h-[200px]">
                            {allServices
                                .filter((s) => !assignSearch.trim() || `${s.code ?? ""} ${s.name}`.toLowerCase().includes(assignSearch.toLowerCase()))
                                .map((s) => (
                                    <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                                        <input type="checkbox" checked={assignedIds.has(s.id)} onChange={() => toggleAssign(s.id)} className="w-4 h-4 rounded border-[#dde0e4] text-[#3C81C6]" />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-[#121417] dark:text-white truncate">{s.name}</div>
                                            {s.code && <div className="text-[10px] font-mono text-[#687582]">{s.code}</div>}
                                        </div>
                                    </label>
                                ))}
                            {allServices.length === 0 && (
                                <p className="text-sm text-[#687582] text-center py-8">Không tải được danh sách dịch vụ.</p>
                            )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <span className="text-xs text-[#687582]">Đã chọn: <b className="text-[#121417] dark:text-white">{assignedIds.size}</b></span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setAssignFor(null)} disabled={assignSaving} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">{tc("actions.cancel")}</button>
                                <button onClick={handleAssignSave} disabled={assignSaving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-violet-700 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                                    {assignSaving ? tc("form.saving") : "Lưu thay đổi"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
