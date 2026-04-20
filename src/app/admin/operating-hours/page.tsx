"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import {
    OPERATING_HOUR_ENDPOINTS,
    FACILITY_MANAGEMENT_ENDPOINTS,
    BRANCH_ENDPOINTS,
    CLOSED_DAY_ENDPOINTS,
    HOLIDAY_ENDPOINTS,
} from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

// ========== Types ==========
interface OperatingHour {
    id: string;
    facilityId?: string;
    branchId?: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
    note?: string;
}

interface ClosedDay {
    id: string;
    facilityId?: string;
    branchId?: string;
    date: string;
    reason?: string;
    createdAt?: string;
}

interface Holiday {
    id: string;
    name: string;
    date: string;
    isRecurring?: boolean;
    note?: string;
}

interface FacilityLite { id: string; name: string; }
interface BranchLite { id: string; name: string; facilityId?: string; }

type TargetKind = "facility" | "branch";
type TabKey = "hours" | "closed-days" | "holidays";

const DAYS_OF_WEEK = [
    { value: 1, label: "Thứ 2", short: "T2" },
    { value: 2, label: "Thứ 3", short: "T3" },
    { value: 3, label: "Thứ 4", short: "T4" },
    { value: 4, label: "Thứ 5", short: "T5" },
    { value: 5, label: "Thứ 6", short: "T6" },
    { value: 6, label: "Thứ 7", short: "T7" },
    { value: 0, label: "Chủ nhật", short: "CN" },
] as const;

// ========== Mappers ==========
function mapHour(r: any): OperatingHour {
    return {
        id: String(r.operating_hours_id ?? r.operating_hour_id ?? r.id ?? ""),
        facilityId: String(r.facility_id ?? r.facilityId ?? ""),
        branchId: String(r.branch_id ?? r.branchId ?? ""),
        dayOfWeek: Number(r.day_of_week ?? r.dayOfWeek ?? 0),
        openTime: (r.open_time ?? r.openTime ?? "").slice(0, 5),
        closeTime: (r.close_time ?? r.closeTime ?? "").slice(0, 5),
        isClosed: Boolean(r.is_closed ?? r.isClosed ?? false),
        note: r.note ?? r.description ?? "",
    };
}

function mapClosedDay(r: any): ClosedDay {
    return {
        id: String(r.closed_days_id ?? r.closed_day_id ?? r.id ?? ""),
        facilityId: String(r.facility_id ?? r.facilityId ?? ""),
        branchId: String(r.branch_id ?? r.branchId ?? ""),
        date: r.date ?? r.closed_date ?? "",
        reason: r.reason ?? r.note ?? r.description ?? "",
        createdAt: r.created_at ?? r.createdAt ?? "",
    };
}

function mapHoliday(r: any): Holiday {
    return {
        id: String(r.holidays_id ?? r.holiday_id ?? r.id ?? ""),
        name: r.name ?? r.holiday_name ?? "",
        date: r.date ?? r.holiday_date ?? "",
        isRecurring: Boolean(r.is_recurring ?? r.isRecurring ?? false),
        note: r.note ?? r.description ?? "",
    };
}

function formatDate(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "short" });
}

// ========== Main Page ==========
export default function OperatingHoursPage() {
    const toast = useToast();
    const [tab, setTab] = useState<TabKey>("hours");
    const [facilities, setFacilities] = useState<FacilityLite[]>([]);
    const [branches, setBranches] = useState<BranchLite[]>([]);
    const [targetKind, setTargetKind] = useState<TargetKind>("facility");
    const [targetId, setTargetId] = useState<string>("");

    const loadDropdowns = useCallback(async () => {
        try {
            const [fRes, bRes] = await Promise.all([
                axiosClient.get(FACILITY_MANAGEMENT_ENDPOINTS.DROPDOWN),
                axiosClient.get(BRANCH_ENDPOINTS.DROPDOWN),
            ]);
            const fRaw: any[] = Array.isArray(fRes.data?.data) ? fRes.data.data : Array.isArray(fRes.data) ? fRes.data : [];
            const bRaw: any[] = Array.isArray(bRes.data?.data) ? bRes.data.data : Array.isArray(bRes.data) ? bRes.data : [];
            setFacilities(fRaw.map((d: any) => ({ id: String(d.facility_id ?? d.facilities_id ?? d.id ?? ""), name: d.name ?? d.facility_name ?? "" })).filter((f) => f.id));
            setBranches(bRaw.map((d: any) => ({
                id: String(d.branches_id ?? d.branch_id ?? d.id ?? ""),
                name: d.name ?? d.branch_name ?? "",
                facilityId: String(d.facility_id ?? d.facilities_id ?? ""),
            })).filter((b) => b.id));
        } catch {
            setFacilities([]);
            setBranches([]);
        }
    }, []);

    useEffect(() => { loadDropdowns(); }, [loadDropdowns]);

    useEffect(() => {
        if (!targetId) {
            if (targetKind === "facility" && facilities.length > 0) setTargetId(facilities[0].id);
            else if (targetKind === "branch" && branches.length > 0) setTargetId(branches[0].id);
        }
    }, [facilities, branches, targetKind, targetId]);

    const targetOptions = targetKind === "facility" ? facilities : branches;
    const targetLabel = targetKind === "facility" ? "cơ sở y tế" : "chi nhánh";

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Giờ hoạt động & Ngày nghỉ"
                subtitle="Quản lý giờ mở cửa, ngày nghỉ đặc biệt và lịch lễ"
                icon="schedule"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Giờ hoạt động" }]}
            />

            {/* Tabs */}
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-1.5 inline-flex gap-1">
                {([
                    { key: "hours", label: "Giờ hoạt động tuần", icon: "schedule" },
                    { key: "closed-days", label: "Ngày nghỉ đặc biệt", icon: "event_busy" },
                    { key: "holidays", label: "Lịch lễ", icon: "celebration" },
                ] as { key: TabKey; label: string; icon: string }[]).map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 transition-all ${
                            tab === t.key
                                ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm"
                                : "text-[#687582] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]"
                        }`}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Target selector (only for hours + closed-days) */}
            {tab !== "holidays" && (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex rounded-xl bg-[#f8f9fa] dark:bg-[#13191f] p-1 border border-[#dde0e4] dark:border-[#2d353e]">
                            {(["facility", "branch"] as TargetKind[]).map((k) => (
                                <button
                                    key={k}
                                    onClick={() => { setTargetKind(k); setTargetId(""); }}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                        targetKind === k
                                            ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm"
                                            : "text-[#687582] dark:text-gray-400 hover:bg-white dark:hover:bg-[#1e242b]"
                                    }`}
                                >
                                    {k === "facility" ? "Cơ sở y tế" : "Chi nhánh"}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 min-w-[240px]">
                            <select
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                            >
                                <option value="">— Chọn {targetLabel} —</option>
                                {targetOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {tab === "hours" && (
                <HoursTab targetKind={targetKind} targetId={targetId} toast={toast} targetLabel={targetLabel} />
            )}
            {tab === "closed-days" && (
                <ClosedDaysTab targetKind={targetKind} targetId={targetId} toast={toast} targetLabel={targetLabel} />
            )}
            {tab === "holidays" && <HolidaysTab toast={toast} />}
        </div>
    );
}

// ========== Hours Tab ==========
function HoursTab({ targetKind, targetId, toast, targetLabel }: { targetKind: TargetKind; targetId: string; toast: any; targetLabel: string }) {
    const [hours, setHours] = useState<OperatingHour[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editDay, setEditDay] = useState<number | null>(null);
    const [draft, setDraft] = useState({ openTime: "08:00", closeTime: "17:00", isClosed: false, note: "" });
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!targetId) return;
        setLoading(true);
        setError(null);
        try {
            const params: any = { limit: 500 };
            if (targetKind === "facility") params.facility_id = targetId;
            else params.branch_id = targetId;
            const res = await axiosClient.get(OPERATING_HOUR_ENDPOINTS.LIST, { params });
            const { data } = unwrapList<any>(res);
            setHours(data.map(mapHour));
        } catch {
            setError("Không tải được giờ hoạt động.");
            setHours([]);
        } finally {
            setLoading(false);
        }
    }, [targetKind, targetId]);

    useEffect(() => { if (targetId) load(); }, [load, targetId]);

    const hoursByDay = useMemo(() => {
        const map = new Map<number, OperatingHour>();
        hours.forEach((h) => {
            const match = (targetKind === "facility" && h.facilityId === targetId) ||
                (targetKind === "branch" && h.branchId === targetId) ||
                (!h.facilityId && !h.branchId);
            if (match) map.set(h.dayOfWeek, h);
        });
        return map;
    }, [hours, targetKind, targetId]);

    const stats = useMemo(() => {
        const open = Array.from(hoursByDay.values()).filter((h) => !h.isClosed).length;
        return { open, closed: 7 - open, configured: hoursByDay.size, unconfigured: 7 - hoursByDay.size };
    }, [hoursByDay]);

    const openEdit = (dayOfWeek: number) => {
        const existing = hoursByDay.get(dayOfWeek);
        setDraft({
            openTime: existing?.openTime || "08:00",
            closeTime: existing?.closeTime || "17:00",
            isClosed: existing?.isClosed ?? false,
            note: existing?.note ?? "",
        });
        setEditDay(dayOfWeek);
    };

    const handleSave = async () => {
        if (editDay === null) return;
        if (!draft.isClosed && draft.openTime >= draft.closeTime) {
            toast.warning("Giờ mở phải trước giờ đóng.");
            return;
        }
        setSaving(true);
        try {
            const existing = hoursByDay.get(editDay);
            const payload: any = {
                day_of_week: editDay,
                open_time: draft.openTime,
                close_time: draft.closeTime,
                is_closed: draft.isClosed,
                note: draft.note.trim() || undefined,
            };
            if (targetKind === "facility") payload.facility_id = targetId;
            else payload.branch_id = targetId;

            if (existing) {
                await axiosClient.put(OPERATING_HOUR_ENDPOINTS.UPDATE(existing.id), payload);
                toast.success("Đã cập nhật giờ hoạt động.");
            } else {
                await axiosClient.post(OPERATING_HOUR_ENDPOINTS.CREATE, payload);
                toast.success("Đã tạo cấu hình.");
            }
            setEditDay(null);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (dayOfWeek: number) => {
        const existing = hoursByDay.get(dayOfWeek);
        if (!existing) return;
        const dayLabel = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label ?? "";
        if (!confirm(`Xoá cấu hình ${dayLabel}?`)) return;
        try {
            await axiosClient.delete(OPERATING_HOUR_ENDPOINTS.DELETE(existing.id));
            toast.success("Đã xoá cấu hình.");
            await load();
        } catch {
            toast.error("Không xoá được.");
        }
    };

    if (!targetId) {
        return <EmptyState icon="store" title={`Chọn ${targetLabel}`} description={`Chọn một ${targetLabel} để cấu hình giờ hoạt động.`} />;
    }

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Ngày mở cửa" value={stats.open} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Ngày nghỉ" value={stats.closed} icon="event_busy" color="red" loading={loading} />
                <StatCard label="Đã cấu hình" value={stats.configured} icon="settings" color="blue" loading={loading} />
                <StatCard label="Chưa cấu hình" value={stats.unconfigured} icon="help" color="amber" loading={loading} />
            </div>

            {error && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                    {DAYS_OF_WEEK.map((_, i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                    {DAYS_OF_WEEK.map((day) => {
                        const h = hoursByDay.get(day.value);
                        const configured = Boolean(h);
                        const isClosed = h?.isClosed ?? false;
                        return (
                            <div key={day.value} className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${
                                isClosed ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" :
                                configured ? "bg-white dark:bg-[#1e242b] border-[#dde0e4] dark:border-[#2d353e]" :
                                "bg-gray-50 dark:bg-gray-900/40 border-dashed border-gray-300 dark:border-gray-700"
                            }`}>
                                <div className={`h-1.5 ${isClosed ? "bg-gradient-to-r from-red-400 to-rose-500" : configured ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8]" : "bg-gray-300 dark:bg-gray-700"}`} />
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="text-xs font-bold text-[#121417] dark:text-white">{day.short}</div>
                                            <div className="text-[10px] text-[#687582] dark:text-gray-400">{day.label}</div>
                                        </div>
                                        <span className={`material-symbols-outlined ${isClosed ? "text-red-500" : configured ? "text-[#3C81C6]" : "text-gray-400"}`} style={{ fontSize: "20px" }}>
                                            {isClosed ? "event_busy" : configured ? "event_available" : "help"}
                                        </span>
                                    </div>
                                    {!configured ? (
                                        <div className="text-[10px] text-[#687582] dark:text-gray-500 italic mb-3">Chưa cấu hình</div>
                                    ) : isClosed ? (
                                        <div className="text-xs font-semibold text-red-700 dark:text-red-300 mb-3">Đóng cửa</div>
                                    ) : (
                                        <div className="space-y-1 mb-3">
                                            <div className="font-mono text-xs font-bold text-[#121417] dark:text-white">{h!.openTime}</div>
                                            <div className="text-[10px] text-[#687582] dark:text-gray-400">đến</div>
                                            <div className="font-mono text-xs font-bold text-[#121417] dark:text-white">{h!.closeTime}</div>
                                        </div>
                                    )}
                                    {configured && h?.note && <div className="text-[10px] text-[#687582] dark:text-gray-400 mb-2 line-clamp-2" title={h.note}>{h.note}</div>}
                                    <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <button onClick={() => openEdit(day.value)} className="flex-1 px-2 py-1 text-[10px] font-medium text-[#3C81C6] hover:bg-[#3C81C6]/10 rounded-md">{configured ? "Sửa" : "Cấu hình"}</button>
                                        {configured && (
                                            <button onClick={() => handleDelete(day.value)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Xoá">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editDay !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setEditDay(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">schedule</span>
                            Cấu hình {DAYS_OF_WEEK.find((d) => d.value === editDay)?.label}
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#13191f] cursor-pointer">
                                <input type="checkbox" checked={draft.isClosed} onChange={(e) => setDraft({ ...draft, isClosed: e.target.checked })}
                                    className="w-4 h-4 rounded border-[#dde0e4] text-[#3C81C6] focus:ring-[#3C81C6]" />
                                <span className="text-sm text-[#121417] dark:text-white font-medium">Đóng cửa cả ngày</span>
                            </label>
                            {!draft.isClosed && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Giờ mở *</label>
                                        <input type="time" value={draft.openTime} onChange={(e) => setDraft({ ...draft, openTime: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Giờ đóng *</label>
                                        <input type="time" value={draft.closeTime} onChange={(e) => setDraft({ ...draft, closeTime: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                                <textarea rows={2} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="VD: Nghỉ lễ, giờ nghỉ trưa..."
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setEditDay(null)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang lưu...</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>Lưu</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ========== Closed Days Tab ==========
function ClosedDaysTab({ targetKind, targetId, toast, targetLabel }: { targetKind: TargetKind; targetId: string; toast: any; targetLabel: string }) {
    const [items, setItems] = useState<ClosedDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [draft, setDraft] = useState({ date: "", reason: "" });
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        if (!targetId) return;
        setLoading(true);
        setError(null);
        try {
            const params: any = { limit: 500 };
            if (targetKind === "facility") params.facility_id = targetId;
            else params.branch_id = targetId;
            const res = await axiosClient.get(CLOSED_DAY_ENDPOINTS.LIST, { params });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapClosedDay));
        } catch {
            setError("Không tải được danh sách ngày nghỉ.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [targetKind, targetId]);

    useEffect(() => { if (targetId) load(); }, [load, targetId]);

    const handleCreate = async () => {
        if (!draft.date) { toast.warning("Chọn ngày nghỉ."); return; }
        setSaving(true);
        try {
            const payload: any = { date: draft.date, reason: draft.reason.trim() || undefined };
            if (targetKind === "facility") payload.facility_id = targetId;
            else payload.branch_id = targetId;
            await axiosClient.post(CLOSED_DAY_ENDPOINTS.CREATE, payload);
            toast.success("Đã thêm ngày nghỉ.");
            setShowModal(false);
            setDraft({ date: "", reason: "" });
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không tạo được.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, date: string) => {
        if (!confirm(`Xoá ngày nghỉ ${formatDate(date)}?`)) return;
        try {
            await axiosClient.delete(CLOSED_DAY_ENDPOINTS.DELETE(id));
            toast.success("Đã xoá.");
            await load();
        } catch {
            toast.error("Không xoá được.");
        }
    };

    if (!targetId) {
        return <EmptyState icon="event_busy" title={`Chọn ${targetLabel}`} description={`Chọn một ${targetLabel} để xem ngày nghỉ đặc biệt.`} />;
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="text-sm text-[#687582] dark:text-gray-400">
                    <b className="text-[#121417] dark:text-white">{items.length}</b> ngày nghỉ đặc biệt
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                    Thêm ngày nghỉ
                </button>
            </div>

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : items.length === 0 ? (
                <EmptyState icon="event_busy" title="Chưa có ngày nghỉ" description="Thêm các ngày nghỉ đặc biệt của cơ sở (ngoài lịch lễ quốc gia)." />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((d) => (
                        <div key={d.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <div className="text-xs font-bold text-red-700 dark:text-red-300">{formatDate(d.date)}</div>
                                    {d.reason && <div className="text-xs text-red-800 dark:text-red-200 mt-1 line-clamp-2">{d.reason}</div>}
                                </div>
                                <button onClick={() => handleDelete(d.id, d.date)} className="px-1.5 py-0.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded" title="Xoá">
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-600">event_busy</span>
                            Thêm ngày nghỉ đặc biệt
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ngày nghỉ *</label>
                                <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lý do</label>
                                <textarea rows={3} value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
                                    placeholder="VD: Bảo trì hệ thống, đào tạo nội bộ..."
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleCreate} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                                {saving ? "Đang lưu..." : "Thêm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ========== Holidays Tab ==========
function HolidaysTab({ toast }: { toast: any }) {
    const [items, setItems] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [draft, setDraft] = useState<{ id?: string; name: string; date: string; isRecurring: boolean; note: string }>({ name: "", date: "", isRecurring: false, note: "" });
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(HOLIDAY_ENDPOINTS.LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapHoliday));
        } catch {
            setError("Không tải được lịch lễ.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        if (!draft.name.trim() || !draft.date) { toast.warning("Nhập tên và ngày lễ."); return; }
        setSaving(true);
        try {
            const payload = {
                name: draft.name.trim(),
                date: draft.date,
                is_recurring: draft.isRecurring,
                note: draft.note.trim() || undefined,
            };
            if (draft.id) {
                await axiosClient.put(HOLIDAY_ENDPOINTS.UPDATE(draft.id), payload);
                toast.success("Đã cập nhật ngày lễ.");
            } else {
                await axiosClient.post(HOLIDAY_ENDPOINTS.CREATE, payload);
                toast.success("Đã thêm ngày lễ.");
            }
            setShowModal(false);
            setDraft({ name: "", date: "", isRecurring: false, note: "" });
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Xoá lễ "${name}"?`)) return;
        try {
            await axiosClient.delete(HOLIDAY_ENDPOINTS.DELETE(id));
            toast.success("Đã xoá.");
            await load();
        } catch {
            toast.error("Không xoá được.");
        }
    };

    const openEdit = (h: Holiday) => {
        setDraft({ id: h.id, name: h.name, date: h.date.slice(0, 10), isRecurring: h.isRecurring ?? false, note: h.note ?? "" });
        setShowModal(true);
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="text-sm text-[#687582] dark:text-gray-400">
                    <b className="text-[#121417] dark:text-white">{items.length}</b> ngày lễ
                </div>
                <button onClick={() => { setDraft({ name: "", date: "", isRecurring: false, note: "" }); setShowModal(true); }}
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                    Thêm ngày lễ
                </button>
            </div>

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : items.length === 0 ? (
                <EmptyState icon="celebration" title="Chưa có lịch lễ" description="Thêm ngày lễ quốc gia hoặc ngày đặc biệt của cơ sở." />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((h) => (
                        <div key={h.id} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>celebration</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-[#121417] dark:text-white">{h.name}</div>
                                        <div className="text-xs text-amber-700 dark:text-amber-300">{formatDate(h.date)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <button onClick={() => openEdit(h)} className="px-1.5 py-0.5 text-[#3C81C6] hover:bg-[#3C81C6]/10 rounded" title="Sửa">
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(h.id, h.name)} className="px-1.5 py-0.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Xoá">
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                    </button>
                                </div>
                            </div>
                            {h.isRecurring && (
                                <div className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                    <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>repeat</span>
                                    Hàng năm
                                </div>
                            )}
                            {h.note && <div className="text-xs text-[#687582] dark:text-gray-400 mt-2 line-clamp-2">{h.note}</div>}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-600">celebration</span>
                            {draft.id ? "Sửa ngày lễ" : "Thêm ngày lễ"}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên ngày lễ *</label>
                                <input type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="VD: Tết Nguyên đán, Quốc khánh..."
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ngày *</label>
                                <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <label className="flex items-center gap-2 p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#13191f] cursor-pointer">
                                <input type="checkbox" checked={draft.isRecurring} onChange={(e) => setDraft({ ...draft, isRecurring: e.target.checked })}
                                    className="w-4 h-4 rounded border-[#dde0e4] text-[#3C81C6] focus:ring-[#3C81C6]" />
                                <span className="text-sm text-[#121417] dark:text-white font-medium">Lặp lại hàng năm</span>
                            </label>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                                <textarea rows={2} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                                {saving ? "Đang lưu..." : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
