"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { BED_ENDPOINTS, MEDICAL_ROOM_MANAGEMENT_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type BedStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";

interface Bed {
    id: string;
    code: string;
    name: string;
    roomId?: string;
    roomName?: string;
    bedType?: string;
    patientName?: string;
    status: BedStatus;
    note?: string;
}

interface RoomLite {
    id: string;
    code?: string;
    name: string;
}

interface FormState {
    id?: string;
    code: string;
    name: string;
    roomId: string;
    bedType: string;
    note: string;
}

const EMPTY_FORM: FormState = { code: "", name: "", roomId: "", bedType: "STANDARD", note: "" };

const STATUS_META: Record<string, { labelKey: string; color: string; icon: string; bg: string }> = {
    AVAILABLE: { labelKey: "available", color: "emerald", icon: "bed", bg: "from-emerald-500 to-teal-500" },
    OCCUPIED: { labelKey: "occupied", color: "blue", icon: "personal_injury", bg: "from-blue-500 to-indigo-500" },
    MAINTENANCE: { labelKey: "maintenance", color: "amber", icon: "build", bg: "from-amber-500 to-orange-500" },
    RESERVED: { labelKey: "reserved", color: "violet", icon: "event_seat", bg: "from-violet-500 to-purple-500" },
};

const BED_TYPES = [
    { value: "STANDARD", label: "Thường" },
    { value: "VIP", label: "VIP" },
    { value: "ICU", label: "Hồi sức" },
    { value: "EMERGENCY", label: "Cấp cứu" },
    { value: "PEDIATRIC", label: "Nhi" },
];

function normalizeStatus(raw: any): BedStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "OCCUPIED" || s === "IN_USE" || s === "BUSY") return "OCCUPIED";
    if (s === "MAINTENANCE" || s === "BROKEN" || s === "REPAIR") return "MAINTENANCE";
    if (s === "RESERVED" || s === "BOOKED") return "RESERVED";
    return "AVAILABLE";
}

function mapBed(b: any): Bed {
    return {
        id: String(b.beds_id ?? b.bed_id ?? b.id ?? ""),
        code: b.code ?? b.bed_code ?? "",
        name: b.name ?? b.bed_name ?? b.code ?? "",
        roomId: b.room_id ?? b.roomId ?? b.medical_room_id ?? "",
        roomName: b.room_name ?? b.roomName ?? b.medical_room_name ?? "",
        bedType: b.bed_type ?? b.bedType ?? b.type ?? "STANDARD",
        patientName: b.patient_name ?? b.patientName ?? "",
        status: normalizeStatus(b.status),
        note: b.note ?? b.description ?? "",
    };
}

function mapRoom(r: any): RoomLite {
    return {
        id: String(r.medical_rooms_id ?? r.medical_room_id ?? r.rooms_id ?? r.id ?? ""),
        code: r.code ?? r.room_code ?? "",
        name: r.name ?? r.room_name ?? "",
    };
}

export default function BedsAdminPage() {
    const toast = useToast();
    const t = useTranslations("pages.beds");
    const tc = useTranslations("common");
    const [beds, setBeds] = useState<Bed[]>([]);
    const [rooms, setRooms] = useState<RoomLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [roomFilter, setRoomFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
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
            const res = await axiosClient.get(BED_ENDPOINTS.LIST);
            const { data } = unwrapList<any>(res);
            setBeds(data.map(mapBed));
        } catch {
            setError("Không tải được danh sách giường bệnh.");
            setBeds([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRooms();
        load();
    }, [loadRooms, load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return beds.filter((b) => {
            if (roomFilter !== "all" && b.roomId !== roomFilter) return false;
            if (statusFilter !== "all" && b.status !== statusFilter) return false;
            if (q && !`${b.code} ${b.name} ${b.roomName ?? ""} ${b.patientName ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [beds, search, roomFilter, statusFilter]);

    const stats = useMemo(() => ({
        total: beds.length,
        available: beds.filter((b) => b.status === "AVAILABLE").length,
        occupied: beds.filter((b) => b.status === "OCCUPIED").length,
        maintenance: beds.filter((b) => b.status === "MAINTENANCE").length,
    }), [beds]);

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, roomId: rooms[0]?.id ?? "" });
        setShowModal(true);
    };

    const openEdit = (b: Bed) => {
        setForm({
            id: b.id,
            code: b.code,
            name: b.name,
            roomId: b.roomId ?? "",
            bedType: b.bedType ?? "STANDARD",
            note: b.note ?? "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) {
            toast.warning("Vui lòng nhập mã và tên giường.");
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                code: form.code.trim(),
                name: form.name.trim(),
                bed_type: form.bedType,
                note: form.note.trim() || undefined,
            };
            if (form.roomId) payload.room_id = form.roomId;

            if (form.id) {
                await axiosClient.put(BED_ENDPOINTS.UPDATE(form.id), payload);
                toast.success("Đã cập nhật giường bệnh.");
            } else {
                await axiosClient.post(BED_ENDPOINTS.CREATE, payload);
                toast.success("Đã tạo giường bệnh mới.");
            }
            setShowModal(false);
            await load();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || "Không lưu được giường bệnh.";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleChangeStatus = async (b: Bed, next: BedStatus) => {
        try {
            await axiosClient.put(BED_ENDPOINTS.STATUS(b.id), { status: next });
            const key = STATUS_META[next]?.labelKey;
            toast.success(`Đã đổi trạng thái: ${key ? t(`statusLabel.${key}` as any) : next}`);
            await load();
        } catch {
            toast.error("Không đổi được trạng thái.");
        }
    };

    const handleDelete = async (b: Bed) => {
        if (!confirm(`Bạn chắc chắn xoá giường "${b.name}"?`)) return;
        try {
            await axiosClient.delete(BED_ENDPOINTS.DELETE(b.id));
            toast.success("Đã xoá giường.");
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không xoá được (có thể đang được dùng).");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="bed"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
                actions={
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        {t("addButton")}
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label={t("stats.total")} value={stats.total} icon="bed" color="blue" loading={loading} />
                <StatCard label={t("stats.available")} value={stats.available} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label={t("stats.occupied")} value={stats.occupied} icon="personal_injury" color="violet" loading={loading} />
                <StatCard label={t("stats.maintenance")} value={stats.maintenance} icon="build" color="amber" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder={t("filter.searchPlaceholder")}
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: "room",
                        label: "Phòng",
                        value: roomFilter,
                        onChange: setRoomFilter,
                        options: [
                            { value: "all", label: "Mọi phòng" },
                            ...rooms.map((r) => ({ value: r.id, label: r.name })),
                        ],
                    },
                    {
                        key: "status",
                        label: "Trạng thái",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: "all", label: "Mọi trạng thái" },
                            ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: t(`statusLabel.${v.labelKey}` as any) })),
                        ],
                    },
                ]}
                onReset={() => { setSearch(""); setRoomFilter("all"); setStatusFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="h-36 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="bed"
                    title="Chưa có giường bệnh"
                    description={beds.length === 0 ? "Tạo giường đầu tiên để bắt đầu phân bổ." : "Không có giường phù hợp bộ lọc."}
                    action={
                        beds.length === 0 ? (
                            <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">
                                + Tạo giường
                            </button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((b) => {
                        const meta = STATUS_META[b.status] ?? STATUS_META.AVAILABLE;
                        const bedTypeLabel = BED_TYPES.find((t) => t.value === b.bedType)?.label ?? b.bedType;
                        return (
                            <div key={b.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all overflow-hidden group">
                                <div className={`h-1.5 bg-gradient-to-r ${meta.bg}`} />
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.bg} flex items-center justify-center text-white flex-shrink-0`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{meta.icon}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-[#121417] dark:text-white truncate" title={b.name}>{b.name}</h3>
                                                <p className="text-[10px] text-[#687582] dark:text-gray-400 font-mono">{b.code}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-xs mb-3">
                                        {b.roomName && (
                                            <div className="flex items-center gap-1.5 text-[#687582] dark:text-gray-400">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>meeting_room</span>
                                                <span className="truncate">{b.roomName}</span>
                                            </div>
                                        )}
                                        {bedTypeLabel && (
                                            <div className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[#687582] dark:text-gray-400">
                                                {bedTypeLabel}
                                            </div>
                                        )}
                                        {b.patientName && (
                                            <div className="flex items-center gap-1.5 text-[#3C81C6] font-medium">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>person</span>
                                                <span className="truncate">{b.patientName}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-md mb-3 ${
                                        meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                        meta.color === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                                        meta.color === "violet" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" :
                                        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                    }`}>
                                        {t(`statusLabel.${meta.labelKey}` as any)}
                                    </div>

                                    <div className="flex items-center gap-1 pt-3 border-t border-gray-50 dark:border-gray-800">
                                        <select
                                            value={b.status}
                                            onChange={(e) => handleChangeStatus(b, e.target.value as BedStatus)}
                                            className="flex-1 text-[10px] px-2 py-1 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-md outline-none focus:ring-1 focus:ring-[#3C81C6]/30 dark:text-white"
                                        >
                                            {Object.entries(STATUS_META).map(([k, v]) => (
                                                <option key={k} value={k}>{t(`statusLabel.${v.labelKey}` as any)}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => openEdit(b)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title="Sửa">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(b)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Xoá">
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
                            {form.id ? "Sửa giường bệnh" : "Tạo giường bệnh mới"}
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mã giường *</label>
                                    <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="VD: BED-A101"
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên giường *</label>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Giường 1A"
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Phòng</label>
                                <select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    <option value="">— Chọn phòng —</option>
                                    {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Loại giường</label>
                                <select value={form.bedType} onChange={(e) => setForm({ ...form, bedType: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    {BED_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                                <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang lưu...</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>Lưu</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
