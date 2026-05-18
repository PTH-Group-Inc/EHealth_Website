"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { MEDICAL_EQUIPMENT_ENDPOINTS, MEDICAL_ROOM_MANAGEMENT_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";
import { CustomSelect } from "@/components/ui/custom-select";

type EquipmentStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "BROKEN";

interface Equipment {
    id: string;
    code: string;
    name: string;
    type?: string;
    model?: string;
    manufacturer?: string;
    roomId?: string;
    roomName?: string;
    status: EquipmentStatus;
    purchaseDate?: string;
    warrantyUntil?: string;
    note?: string;
}

interface RoomLite {
    id: string;
    name: string;
}

interface FormState {
    id?: string;
    name: string;
    type: string;
    model: string;
    manufacturer: string;
    roomId: string;
    purchaseDate: string;
    warrantyUntil: string;
    note: string;
}

const EMPTY_FORM: FormState = {
    name: "", type: "", model: "", manufacturer: "",
    roomId: "", purchaseDate: "", warrantyUntil: "", note: "",
};

type StatusKey = "active" | "inactive" | "maintenance" | "broken";

const STATUS_META: Record<string, { labelKey: StatusKey; color: string; bg: string; icon: string }> = {
    ACTIVE: { labelKey: "active", color: "emerald", bg: "from-emerald-500 to-teal-500", icon: "check_circle" },
    INACTIVE: { labelKey: "inactive", color: "gray", bg: "from-gray-400 to-gray-500", icon: "pause_circle" },
    MAINTENANCE: { labelKey: "maintenance", color: "amber", bg: "from-amber-500 to-orange-500", icon: "build" },
    BROKEN: { labelKey: "broken", color: "red", bg: "from-red-500 to-rose-500", icon: "error" },
};

function normalizeStatus(raw: any): EquipmentStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "MAINTENANCE" || s === "REPAIR") return "MAINTENANCE";
    if (s === "BROKEN" || s === "DAMAGED" || s === "OUT_OF_ORDER") return "BROKEN";
    if (s === "INACTIVE" || s === "DISABLED" || s === "RETIRED") return "INACTIVE";
    return "ACTIVE";
}

function mapEquipment(e: any): Equipment {
    return {
        id: String(e.equipments_id ?? e.equipment_id ?? e.id ?? ""),
        code: e.code ?? e.equipment_code ?? "",
        name: e.name ?? e.equipment_name ?? "",
        type: e.type ?? e.equipment_type ?? e.category ?? "",
        model: e.model ?? "",
        manufacturer: e.manufacturer ?? e.brand ?? "",
        roomId: e.room_id ?? e.roomId ?? e.medical_room_id ?? "",
        roomName: e.room_name ?? e.roomName ?? e.medical_room_name ?? "",
        status: normalizeStatus(e.status),
        purchaseDate: e.purchase_date ?? e.purchaseDate ?? "",
        warrantyUntil: e.warranty_until ?? e.warrantyUntil ?? e.warranty_end ?? "",
        note: e.note ?? e.description ?? "",
    };
}

function mapRoom(r: any): RoomLite {
    return {
        id: String(r.medical_rooms_id ?? r.medical_room_id ?? r.rooms_id ?? r.id ?? ""),
        name: r.name ?? r.room_name ?? "",
    };
}

export default function EquipmentAdminPage() {
    const toast = useToast();
    const t = useTranslations("pages.equipment");
    const tc = useTranslations("common");
    const [items, setItems] = useState<Equipment[]>([]);
    const [rooms, setRooms] = useState<RoomLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roomFilter, setRoomFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const loadRooms = useCallback(async () => {
        try {
            const res = await axiosClient.get(MEDICAL_ROOM_MANAGEMENT_ENDPOINTS.DROPDOWN);
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            setRooms(raw.map(mapRoom).filter((r) => r.id));
        } catch {
            setRooms([]);
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(MEDICAL_EQUIPMENT_ENDPOINTS.LIST);
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapEquipment));
        } catch {
            setError(t("toast.loadError"));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadRooms();
        load();
    }, [loadRooms, load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((e) => {
            if (statusFilter !== "all" && e.status !== statusFilter) return false;
            if (roomFilter !== "all" && e.roomId !== roomFilter) return false;
            if (q && !`${e.code} ${e.name} ${e.model ?? ""} ${e.manufacturer ?? ""} ${e.roomName ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, statusFilter, roomFilter]);

    const stats = useMemo(() => ({
        total: items.length,
        active: items.filter((e) => e.status === "ACTIVE").length,
        maintenance: items.filter((e) => e.status === "MAINTENANCE").length,
        broken: items.filter((e) => e.status === "BROKEN").length,
    }), [items]);

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, roomId: rooms[0]?.id ?? "" });
        setShowModal(true);
    };

    const openEdit = (e: Equipment) => {
        setForm({
            id: e.id,
            name: e.name,
            type: e.type ?? "",
            model: e.model ?? "",
            manufacturer: e.manufacturer ?? "",
            roomId: e.roomId ?? "",
            purchaseDate: e.purchaseDate?.slice(0, 10) ?? "",
            warrantyUntil: e.warrantyUntil?.slice(0, 10) ?? "",
            note: e.note ?? "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.warning(t("toast.requiredName"));
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                name: form.name.trim(),
                type: form.type.trim() || undefined,
                model: form.model.trim() || undefined,
                manufacturer: form.manufacturer.trim() || undefined,
                purchase_date: form.purchaseDate || undefined,
                warranty_until: form.warrantyUntil || undefined,
                note: form.note.trim() || undefined,
            };
            if (form.roomId) payload.room_id = form.roomId;

            if (form.id) {
                await axiosClient.put(MEDICAL_EQUIPMENT_ENDPOINTS.UPDATE(form.id), payload);
                toast.success(t("toast.updated"));
            } else {
                await axiosClient.post(MEDICAL_EQUIPMENT_ENDPOINTS.CREATE, payload);
                toast.success(t("toast.created"));
            }
            setShowModal(false);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t("toast.saveError"));
        } finally {
            setSaving(false);
        }
    };

    const handleChangeStatus = async (e: Equipment, next: EquipmentStatus) => {
        try {
            await axiosClient.put(MEDICAL_EQUIPMENT_ENDPOINTS.STATUS(e.id), { status: next });
            toast.success(t("toast.statusChanged", { label: t(`statusLabel.${STATUS_META[next]?.labelKey ?? "active"}`) }));
            await load();
        } catch {
            toast.error(t("toast.toggleFailed"));
        }
    };

    const handleDelete = async (e: Equipment) => {
        if (!confirm(t("toast.deleteConfirm", { name: e.name }))) return;
        try {
            await axiosClient.delete(MEDICAL_EQUIPMENT_ENDPOINTS.DELETE(e.id));
            toast.success(t("toast.deleted"));
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t("toast.deleteError"));
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="medical_services"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
                actions={
                    <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        {t("addButton")}
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label={t("stats.total")} value={stats.total} icon="medical_services" color="blue" loading={loading} />
                <StatCard label={t("stats.active")} value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label={t("stats.maintenance")} value={stats.maintenance} icon="build" color="amber" loading={loading} />
                <StatCard label={t("stats.broken")} value={stats.broken} icon="error" color="red" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder={t("filter.searchPlaceholder")}
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: "status", label: t("filter.statusLabel"), value: statusFilter, onChange: setStatusFilter,
                        options: [{ value: "all", label: t("filter.allStatuses") }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: t(`statusLabel.${v.labelKey}`) }))],
                    },
                    {
                        key: "room", label: t("filter.roomLabel"), value: roomFilter, onChange: setRoomFilter,
                        options: [{ value: "all", label: t("filter.allRooms") }, ...rooms.map((r) => ({ value: r.id, label: r.name }))],
                    },
                ]}
                onReset={() => { setSearch(""); setStatusFilter("all"); setRoomFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-44 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="medical_services"
                    title={t("empty.none")}
                    description={items.length === 0 ? t("empty.noneDesc") : t("empty.noMatchDesc")}
                    action={items.length === 0 ? (
                        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">
                            {t("empty.createFirst")}
                        </button>
                    ) : undefined}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((e) => {
                        const meta = STATUS_META[e.status] ?? STATUS_META.ACTIVE;
                        const warrantySoon = e.warrantyUntil && new Date(e.warrantyUntil).getTime() - Date.now() < 30 * 86400000;
                        return (
                            <div key={e.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all overflow-hidden">
                                <div className={`h-1.5 bg-gradient-to-r ${meta.bg}`} />
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.bg} flex items-center justify-center text-white flex-shrink-0`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>medical_services</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-bold text-[#121417] dark:text-white truncate" title={e.name}>{e.name}</h3>
                                                <p className="text-xs text-[#687582] dark:text-gray-400 font-mono">{e.code}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                                            meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                            meta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                            meta.color === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                        }`}>{t(`statusLabel.${meta.labelKey}`)}</span>
                                    </div>

                                    <div className="space-y-1 text-xs text-[#687582] dark:text-gray-400 mb-3">
                                        {(e.model || e.manufacturer) && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>inventory_2</span>
                                                <span className="truncate">{[e.manufacturer, e.model].filter(Boolean).join(" · ")}</span>
                                            </div>
                                        )}
                                        {e.roomName && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "14px" }}>meeting_room</span>
                                                <span className="truncate">{e.roomName}</span>
                                            </div>
                                        )}
                                        {warrantySoon && (
                                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span>
                                                <span>{t("card.warrantySoon")}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 pt-3 border-t border-gray-50 dark:border-gray-800">
                                        <Link href={`/admin/equipment/${e.id}`} className="flex-1 px-3 py-1.5 text-xs font-medium text-[#3C81C6] bg-[#3C81C6]/[0.08] hover:bg-[#3C81C6]/[0.16] rounded-lg transition-colors inline-flex items-center justify-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>visibility</span>
                                            {t("card.detail")}
                                        </Link>
                                        <select
                                            value={e.status}
                                            onChange={(ev) => handleChangeStatus(e, ev.target.value as EquipmentStatus)}
                                            className="text-[10px] px-2 py-1 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-md outline-none focus:ring-1 focus:ring-[#3C81C6]/30 dark:text-white"
                                        >
                                            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{t(`statusLabel.${v.labelKey}`)}</option>)}
                                        </select>
                                        <button onClick={() => openEdit(e)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title={tc("table.editTitle")}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(e)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title={tc("table.deleteTitle")}>
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
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-xl w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{form.id ? "edit" : "add"}</span>
                            {form.id ? t("modal.titleEdit") : t("modal.titleCreate")}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.name")} *</label>
                                <input value={form.name} onChange={(ev) => setForm({ ...form, name: ev.target.value })} placeholder={t("modal.namePlaceholder")} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.type")}</label>
                                    <input value={form.type} onChange={(ev) => setForm({ ...form, type: ev.target.value })} placeholder={t("modal.typePlaceholder")} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.manufacturer")}</label>
                                    <input value={form.manufacturer} onChange={(ev) => setForm({ ...form, manufacturer: ev.target.value })} placeholder={t("modal.manufacturerPlaceholder")} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.model")}</label>
                                    <input value={form.model} onChange={(ev) => setForm({ ...form, model: ev.target.value })} placeholder={t("modal.modelPlaceholder")} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.room")}</label>
                                <CustomSelect
                                    options={[{ id: "", name: t("modal.roomUnassigned") }, ...rooms.map((r) => ({ id: r.id, name: r.name }))]}
                                    value={form.roomId}
                                    onChange={(value) => setForm({ ...form, roomId: String(value) })}
                                    placeholder={t("modal.roomPlaceholder")}
                                    icon="meeting_room"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.purchaseDate")}</label>
                                    <input type="date" value={form.purchaseDate} onChange={(ev) => setForm({ ...form, purchaseDate: ev.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.warrantyUntil")}</label>
                                    <input type="date" value={form.warrantyUntil} onChange={(ev) => setForm({ ...form, warrantyUntil: ev.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{t("modal.note")}</label>
                                <textarea rows={2} value={form.note} onChange={(ev) => setForm({ ...form, note: ev.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50">{tc("actions.cancel")}</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{tc("form.saving")}</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>{tc("actions.save")}</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
