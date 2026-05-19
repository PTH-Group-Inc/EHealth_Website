"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { APPOINTMENT_SLOT_ENDPOINTS, SHIFT_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

// BE shape: /api/slots → { slot_id, shift_id, start_time, end_time, is_active }
// Đây là TEMPLATE slot (khung giờ trong ca), không phải lịch slot cụ thể có BS/ngày.
type SlotStatus = "ACTIVE" | "INACTIVE";

interface Slot {
    id: string;
    shiftId: string;
    shiftName?: string;
    startTime: string;
    endTime: string;
    status: SlotStatus;
    durationMinutes: number;
}

interface ShiftLite {
    id: string;
    name: string;
    startTime?: string;
    endTime?: string;
}

interface FormState {
    id?: string;
    shiftId: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
}

interface BulkState {
    shiftId: string;
    rangeStart: string;
    rangeEnd: string;
    slotDuration: number;
}

const EMPTY_FORM: FormState = { shiftId: "", startTime: "07:00", endTime: "07:45", isActive: true };
const DEFAULT_BULK: BulkState = {
    shiftId: "",
    rangeStart: "07:00",
    rangeEnd: "11:30",
    slotDuration: 45,
};
const EMPTY_BULK: BulkState = { ...DEFAULT_BULK };

const STATUS_META: Record<SlotStatus, { label: string; color: string; icon: string }> = {
    ACTIVE: { label: "Đang dùng", color: "emerald", icon: "event_available" },
    INACTIVE: { label: "Tắt", color: "gray", icon: "event_busy" },
};

function timeDiffMinutes(start: string, end: string): number {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    if ([sH, sM, eH, eM].some((n) => Number.isNaN(n))) return 0;
    return (eH * 60 + eM) - (sH * 60 + sM);
}

function mapSlot(r: any, shiftMap: Map<string, ShiftLite>): Slot {
    const shiftId = String(r.shift_id ?? "");
    const startTime = (r.start_time ?? "").slice(0, 5);
    const endTime = (r.end_time ?? "").slice(0, 5);
    const shift = shiftMap.get(shiftId);
    return {
        id: String(r.slot_id ?? r.id ?? ""),
        shiftId,
        shiftName: shift?.name ?? r.shift_name ?? "",
        startTime,
        endTime,
        status: r.is_active === false ? "INACTIVE" : "ACTIVE",
        durationMinutes: timeDiffMinutes(startTime, endTime),
    };
}

export default function SlotsConfigPage() {
    const toast = useToast();
    const t = useTranslations("pages.slotsConfig");
    const tc = useTranslations("common");
    const [slots, setSlots] = useState<Slot[]>([]);
    const [shifts, setShifts] = useState<ShiftLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [shiftFilter, setShiftFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [showBulk, setShowBulk] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [bulk, setBulk] = useState<BulkState>(EMPTY_BULK);
    const [saving, setSaving] = useState(false);

    const shiftMap = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Load shifts trước để map shift_name vào slot
            const shiftRes = await axiosClient.get(SHIFT_ENDPOINTS.LIST, { params: { limit: 200 } });
            const sRaw: any[] = Array.isArray(shiftRes.data?.data) ? shiftRes.data.data : Array.isArray(shiftRes.data) ? shiftRes.data : [];
            const shiftList: ShiftLite[] = sRaw.map((s: any) => ({
                id: String(s.shifts_id ?? s.shift_id ?? s.id ?? ""),
                name: s.name ?? s.shift_name ?? "",
                startTime: (s.start_time ?? "").slice(0, 5),
                endTime: (s.end_time ?? "").slice(0, 5),
            })).filter((s) => s.id);
            setShifts(shiftList);
            const localMap = new Map(shiftList.map((s) => [s.id, s]));

            const res = await axiosClient.get(APPOINTMENT_SLOT_ENDPOINTS.LIST, { params: { limit: 500 } });
            const { data } = unwrapList<any>(res);
            setSlots(data.map((r) => mapSlot(r, localMap)));
        } catch {
            setError("Không tải được danh sách slot khám.");
            setSlots([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return slots.filter((s) => {
            if (shiftFilter !== "all" && s.shiftId !== shiftFilter) return false;
            if (statusFilter !== "all" && s.status !== statusFilter) return false;
            if (q && !`${s.shiftName ?? ""} ${s.startTime} ${s.endTime}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [slots, search, shiftFilter, statusFilter]);

    const stats = useMemo(
        () => {
            const totalDuration = slots.reduce((sum, s) => sum + s.durationMinutes, 0);
            return {
                total: slots.length,
                active: slots.filter((s) => s.status === "ACTIVE").length,
                inactive: slots.filter((s) => s.status === "INACTIVE").length,
                totalHours: Math.round((totalDuration / 60) * 10) / 10,
            };
        },
        [slots]
    );

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, shiftId: shifts[0]?.id ?? "" });
        setShowModal(true);
    };

    const openEdit = (s: Slot) => {
        setForm({
            id: s.id,
            shiftId: s.shiftId,
            startTime: s.startTime,
            endTime: s.endTime,
            isActive: s.status === "ACTIVE",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.shiftId) {
            toast.warning("Vui lòng chọn ca làm việc.");
            return;
        }
        if (!form.startTime || !form.endTime) {
            toast.warning("Vui lòng nhập thời gian.");
            return;
        }
        if (form.startTime >= form.endTime) {
            toast.warning("Giờ bắt đầu phải trước giờ kết thúc.");
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                shift_id: form.shiftId,
                start_time: form.startTime,
                end_time: form.endTime,
                is_active: form.isActive,
            };
            if (form.id) {
                await axiosClient.put(APPOINTMENT_SLOT_ENDPOINTS.UPDATE(form.id), payload);
                toast.success("Đã cập nhật slot.");
            } else {
                await axiosClient.post(APPOINTMENT_SLOT_ENDPOINTS.CREATE, payload);
                toast.success("Đã tạo slot.");
            }
            setShowModal(false);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được slot.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (s: Slot) => {
        if (!confirm(`Xoá slot ${s.shiftName ?? s.shiftId} ${s.startTime}–${s.endTime}?`)) return;
        try {
            await axiosClient.delete(APPOINTMENT_SLOT_ENDPOINTS.DELETE(s.id));
            toast.success("Đã xoá slot.");
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không xoá được slot (có thể đã có booking).");
        }
    };

    const handleBulkCreate = async () => {
        if (!bulk.shiftId) {
            toast.warning("Chọn ca làm việc.");
            return;
        }
        if (!bulk.rangeStart || !bulk.rangeEnd || bulk.rangeStart >= bulk.rangeEnd) {
            toast.warning("Khoảng giờ không hợp lệ.");
            return;
        }
        if (bulk.slotDuration < 5) {
            toast.warning("Thời lượng slot tối thiểu 5 phút.");
            return;
        }
        setSaving(true);
        try {
            // Chia khoảng [rangeStart, rangeEnd] thành nhiều slot theo slotDuration
            const [sH, sM] = bulk.rangeStart.split(":").map(Number);
            const [eH, eM] = bulk.rangeEnd.split(":").map(Number);
            const startMin = sH * 60 + sM;
            const endMin = eH * 60 + eM;
            const segments: Array<{ start: string; end: string }> = [];
            for (let cur = startMin; cur + bulk.slotDuration <= endMin; cur += bulk.slotDuration) {
                const a = cur, b = cur + bulk.slotDuration;
                const fmt = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
                segments.push({ start: fmt(a), end: fmt(b) });
            }
            if (segments.length === 0) {
                toast.warning("Không sinh ra slot nào với cấu hình hiện tại.");
                setSaving(false);
                return;
            }

            let done = 0, errors = 0;
            for (const seg of segments) {
                try {
                    await axiosClient.post(APPOINTMENT_SLOT_ENDPOINTS.CREATE, {
                        shift_id: bulk.shiftId,
                        start_time: seg.start,
                        end_time: seg.end,
                        is_active: true,
                    });
                    done += 1;
                } catch {
                    errors += 1;
                }
            }
            if (done > 0) {
                toast.success(`Đã tạo ${done}/${segments.length} slot (lỗi: ${errors}).`);
                setShowBulk(false);
                setBulk(DEFAULT_BULK);
                await load();
            } else {
                toast.error("Không tạo được slot nào.");
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không tạo bulk được.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="schedule"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setBulk({ ...EMPTY_BULK, shiftId: shifts[0]?.id ?? "" }); setShowBulk(true); }}
                            className="px-4 py-2 text-sm font-semibold text-[#3C81C6] border border-[#3C81C6]/40 hover:bg-[#3C81C6]/10 rounded-xl inline-flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>bolt</span>
                            Tạo hàng loạt
                        </button>
                        <button
                            onClick={openCreate}
                            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                            Tạo slot
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng slot" value={stats.total} icon="schedule" color="blue" loading={loading} />
                <StatCard label="Đang dùng" value={stats.active} icon="event_available" color="emerald" loading={loading} />
                <StatCard label="Tắt" value={stats.inactive} icon="event_busy" color="amber" loading={loading} />
                <StatCard label="Tổng thời lượng (h)" value={stats.totalHours} icon="schedule" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo ca, giờ..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: "shift",
                        label: "Ca",
                        value: shiftFilter,
                        onChange: setShiftFilter,
                        options: [{ value: "all", label: "Mọi ca" }, ...shifts.map((s) => ({ value: s.id, label: s.name }))],
                    },
                    {
                        key: "status",
                        label: "Trạng thái",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: "all", label: "Mọi trạng thái" },
                            ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label })),
                        ],
                    },
                ]}
                onReset={() => { setSearch(""); setShiftFilter("all"); setStatusFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="schedule"
                    title="Chưa có slot khám"
                    description={slots.length === 0 ? "Tạo slot đầu tiên hoặc dùng 'Tạo hàng loạt'." : "Không có slot phù hợp bộ lọc."}
                    action={
                        slots.length === 0 ? (
                            <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">+ Tạo slot</button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Ca làm việc</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Khung giờ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thời lượng</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Trạng thái</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => {
                                    const meta = STATUS_META[s.status];
                                    return (
                                        <tr key={s.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-3 text-[#121417] dark:text-white whitespace-nowrap">{s.shiftName || s.shiftId || "—"}</td>
                                            <td className="px-4 py-3 font-mono text-[#121417] dark:text-white">{s.startTime}–{s.endTime}</td>
                                            <td className="px-4 py-3 text-[#687582] dark:text-gray-400">{s.durationMinutes} phút</td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                }`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{meta.icon}</span>
                                                    {meta.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(s)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title="Sửa">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                                                    </button>
                                                    <button onClick={() => handleDelete(s)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Xoá">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{form.id ? "edit" : "add"}</span>
                            {form.id ? "Sửa slot khám" : "Tạo slot khám mới"}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ca làm việc *</label>
                                <select value={form.shiftId} onChange={(e) => setForm({ ...form, shiftId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    <option value="">— Chọn ca —</option>
                                    {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bắt đầu *</label>
                                    <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Kết thúc *</label>
                                    <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                                <span className="text-sm text-[#121417] dark:text-white">Đang dùng</span>
                            </label>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang lưu...</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>Lưu</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBulk && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowBulk(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">bolt</span>
                            Tạo slot hàng loạt
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-400 mb-3">
                            Chia khoảng thời gian thành nhiều slot đều nhau trong một ca làm việc.
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ca làm việc *</label>
                                <select value={bulk.shiftId} onChange={(e) => setBulk({ ...bulk, shiftId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    <option value="">— Chọn ca —</option>
                                    {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Từ giờ *</label>
                                    <input type="time" value={bulk.rangeStart} onChange={(e) => setBulk({ ...bulk, rangeStart: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Đến giờ *</label>
                                    <input type="time" value={bulk.rangeEnd} onChange={(e) => setBulk({ ...bulk, rangeEnd: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Thời lượng mỗi slot (phút)</label>
                                <input type="number" min={5} step={5} value={bulk.slotDuration} onChange={(e) => setBulk({ ...bulk, slotDuration: Number(e.target.value) || 30 })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowBulk(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleBulkCreate} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang tạo...</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>bolt</span>Tạo</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
