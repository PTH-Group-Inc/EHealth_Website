"use client";

/**
 * Receptionist Appointments — Phase J.3 #1-#5.
 * Spec: dòng 10777-11045.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { toast } from "react-hot-toast";
import {
    getAppointments,
    rescheduleAppointment,
    appointmentConfirmationService,
    cancelAppointment,
    doctorAvailabilityService,
    markNoShow
} from "@/services/appointmentService";
import { DropdownMenu } from "@/components/ui/dropdown-menu";

type TabKey = "today" | "need_confirm" | "upcoming" | "done" | "cancelled" | "all";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ xác nhận", cls: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "Đã xác nhận", cls: "bg-blue-100 text-blue-700" },
    CHECKED_IN: { label: "Đã check-in", cls: "bg-indigo-100 text-indigo-700" },
    IN_PROGRESS: { label: "Đang khám", cls: "bg-violet-100 text-violet-700" },
    COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-100 text-rose-700" },
    NO_SHOW: { label: "Không đến", cls: "bg-slate-200 text-slate-700" },
};

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };
const fmtTime = (v?: string) => v?.toString().slice(0, 5) ?? "—";

interface Row {
    id: string;
    code?: string;
    patientName: string;
    patientId?: string;
    phone?: string;
    doctorId?: string;
    doctorName?: string;
    serviceName?: string;
    specialtyName?: string;
    room?: string;
    date?: string;
    slotStart?: string;
    slotEnd?: string;
    status: string;
    reason?: string;
    priority?: string;
    bookingChannel?: string;
    queueNumber?: number;
    checkedInAt?: string;
    confirmedAt?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    cancelledBy?: string;
    createdAt?: string;
}

function normalize(a: any): Row {
    return {
        id: a.appointments_id ?? a.id,
        code: a.appointment_code,
        patientName: a.patient_name ?? a.patientName ?? "(chưa có)",
        patientId: a.patient_id ?? a.patientId,
        phone: a.patient_phone ?? a.phone,
        doctorId: a.doctor_id ?? a.doctorId,
        doctorName: a.doctor_name ?? a.doctorName,
        serviceName: a.service_name ?? a.serviceName,
        specialtyName: a.specialty_name ?? a.specialtyName,
        room: a.room_name ?? a.room,
        date: a.appointment_date ?? a.date,
        slotStart: a.slot_start_time,
        slotEnd: a.slot_end_time,
        status: (a.status ?? "PENDING").toString().toUpperCase(),
        reason: a.reason_for_visit ?? a.reason,
        priority: a.priority,
        bookingChannel: a.booking_channel ?? a.bookingChannel,
        queueNumber: a.queue_number ?? a.queueNumber,
        checkedInAt: a.checked_in_at ?? a.checkedInAt,
        confirmedAt: a.confirmed_at ?? a.confirmedAt,
        cancelledAt: a.cancelled_at ?? a.cancelledAt,
        cancellationReason: a.cancellation_reason ?? a.cancellationReason,
        cancelledBy: a.cancelled_by ?? a.cancelledBy,
        createdAt: a.created_at ?? a.createdAt,
    };
}

/* ── Calendar grid component ─────────────────────────── */
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const STATUS_DOT: Record<string, string> = {
    PENDING: "bg-amber-400",
    CONFIRMED: "bg-blue-500",
    CHECKED_IN: "bg-emerald-500",
    IN_PROGRESS: "bg-violet-500",
    COMPLETED: "bg-green-600",
    CANCELLED: "bg-rose-400",
    NO_SHOW: "bg-gray-400",
};

function CalendarGrid({ month, onMonthChange, items }: {
    month: Date;
    onMonthChange: (d: Date) => void;
    items: Row[];
}) {
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    const year = month.getFullYear();
    const mon = month.getMonth();
    const firstDow = new Date(year, mon, 1).getDay();
    const daysInMonth = new Date(year, mon + 1, 0).getDate();

    const byDate = useMemo(() => {
        const map: Record<string, Row[]> = {};
        items.forEach(r => {
            if (!r.date) return;
            const d = r.date.slice(0, 10);
            (map[d] ??= []).push(r);
        });
        return map;
    }, [items]);

    const todayStr = new Date().toISOString().slice(0, 10);
    const prev = () => onMonthChange(new Date(year, mon - 1, 1));
    const next = () => onMonthChange(new Date(year, mon + 1, 1));
    const goToday = () => onMonthChange(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const monthLabel = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(month);

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                <button onClick={prev} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold capitalize">{monthLabel}</h3>
                    <button onClick={goToday} className="text-xs px-2 py-0.5 rounded-md bg-[#3C81C6]/10 text-[#3C81C6] font-medium hover:bg-[#3C81C6]/20">Hôm nay</button>
                </div>
                <button onClick={next} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-5 py-2 border-b border-[#e5e7eb] dark:border-[#2d353e] bg-gray-50/50 dark:bg-gray-900/20">
                {Object.entries(STATUS_DOT).map(([k, cls]) => (
                    <span key={k} className="inline-flex items-center gap-1 text-[10px] text-[#687582]">
                        <span className={`w-2 h-2 rounded-full ${cls}`} />
                        {STATUS_META[k]?.label ?? k}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#687582] border-b border-[#e5e7eb] dark:border-[#2d353e]">
                {WEEKDAYS.map(w => <div key={w} className="py-2">{w}</div>)}
            </div>

            <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                    if (day === null) return <div key={`e${i}`} className="min-h-[100px] border-b border-r border-[#e5e7eb] dark:border-[#2d353e] bg-gray-50/50 dark:bg-gray-900/20" />;
                    const dateStr = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayItems = byDate[dateStr] ?? [];
                    const isToday = dateStr === todayStr;
                    const isExpanded = expandedDay === dateStr;
                    const isPast = dateStr < todayStr;

                    return (
                        <div key={dateStr}
                            className={`min-h-[100px] border-b border-r border-[#e5e7eb] dark:border-[#2d353e] p-1.5 transition-colors
                                ${dayItems.length > 0 ? "cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10" : ""}
                                ${isToday ? "bg-blue-50 dark:bg-blue-900/20" : isPast ? "bg-gray-50/30 dark:bg-gray-900/10" : ""}`}
                            onClick={() => dayItems.length > 0 ? setExpandedDay(isExpanded ? null : dateStr) : null}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[#3C81C6] text-white" : isPast ? "text-[#a0a8b0]" : "text-[#687582]"}`}>
                                    {day}
                                </span>
                                {dayItems.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-[#3C81C6] bg-[#3C81C6]/10 px-1.5 py-0.5 rounded-full">{dayItems.length}</span>
                                        {isExpanded ? <span className="material-symbols-outlined text-[12px] text-[#687582]">expand_less</span>
                                            : dayItems.length > 3 && <span className="material-symbols-outlined text-[12px] text-[#687582]">expand_more</span>}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-0.5">
                                {(isExpanded ? dayItems : dayItems.slice(0, 3)).map(r => {
                                    const meta = STATUS_META[r.status];
                                    return (
                                        <div key={r.id}
                                            className="w-full text-left flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate bg-gray-50/80 dark:bg-gray-800/40 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[r.status] ?? "bg-gray-300"}`} />
                                            <span className="font-medium text-[#3C81C6] shrink-0">{r.slotStart ? fmtTime(r.slotStart) : ""}</span>
                                            <span className="truncate">{r.patientName}</span>
                                        </div>
                                    );
                                })}
                                {!isExpanded && dayItems.length > 3 && (
                                    <span className="block text-[10px] text-[#3C81C6] pl-1 font-medium cursor-pointer">+{dayItems.length - 3} nữa ▾</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ReceptionistAppointmentsPage() {
    const [items, setItems] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>("today");
    const [filterDate, setFilterDate] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterDoctor, setFilterDoctor] = useState("ALL");
    const [filterService, setFilterService] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Row | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
    const [rescheduleSlotId, setRescheduleSlotId] = useState("");
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [showRescheduleForm, setShowRescheduleForm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<Row | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAppointments({ limit: 200 });
            setItems((res.data ?? []).map(normalize));
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const today = new Date().toISOString().slice(0, 10);

    const doctors = useMemo(() => Array.from(new Set(items.map(r => r.doctorName).filter(Boolean))), [items]);
    const services = useMemo(() => Array.from(new Set(items.map(r => r.serviceName).filter(Boolean))), [items]);

    const filtered = useMemo(() => items.filter(r => {
        if (tab === "today" && r.date?.slice(0, 10) !== today) return false;
        if (tab === "need_confirm" && r.status !== "PENDING") return false;
        if (tab === "upcoming" && !["PENDING", "CONFIRMED", "CHECKED_IN"].includes(r.status)) return false;
        if (tab === "done" && r.status !== "COMPLETED") return false;
        if (tab === "cancelled" && !["CANCELLED", "NO_SHOW"].includes(r.status)) return false;
        if (filterDate && r.date?.slice(0, 10) !== filterDate) return false;
        if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
        if (filterDoctor !== "ALL" && r.doctorName !== filterDoctor) return false;
        if (filterService !== "ALL" && r.serviceName !== filterService) return false;
        if (search) {
            const q = search.toLowerCase();
            return r.patientName.toLowerCase().includes(q) || (r.phone ?? "").includes(q) || (r.patientId ?? "").toLowerCase().includes(q) || (r.doctorName ?? "").toLowerCase().includes(q);
        }
        return true;
    }), [items, tab, today, filterDate, filterStatus, filterDoctor, filterService, search]);

    useEffect(() => {
        if (showRescheduleForm && selected?.doctorId && rescheduleDate) {
            setLoadingSlots(true);
            doctorAvailabilityService.getSlots({ doctorId: selected.doctorId, date: rescheduleDate })
                .then(slots => { setRescheduleSlots(slots); setRescheduleSlotId(""); })
                .catch(() => setRescheduleSlots([]))
                .finally(() => setLoadingSlots(false));
        } else {
            setRescheduleSlots([]);
            setRescheduleSlotId("");
        }
    }, [rescheduleDate, showRescheduleForm, selected?.doctorId]);

    const clearFilters = () => {
        setFilterDate("");
        setFilterStatus("ALL");
        setFilterDoctor("ALL");
        setFilterService("ALL");
        setSearch("");
        setTab("all");
    };

    const counts = {
        today: items.filter(r => r.date?.slice(0, 10) === today).length,
        need_confirm: items.filter(r => r.status === "PENDING").length,
        upcoming: items.filter(r => ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(r.status)).length,
        done: items.filter(r => r.status === "COMPLETED").length,
        cancelled: items.filter(r => ["CANCELLED", "NO_SHOW"].includes(r.status)).length,
    };

    const onConfirm = async (id: string) => {
        try { await appointmentConfirmationService.confirm(id); await load(); toast.success("Đã xác nhận lịch hẹn"); }
        catch (e: any) { toast.error(e?.message ?? "Xác nhận thất bại"); }
    };

    const onCheckIn = async (id: string) => {
        try { 
            const res = await appointmentConfirmationService.checkIn(id); 
            await load(); 
            toast.success(`Check-in thành công. Số thứ tự: ${res?.queueNumber ?? res?.queue_number ?? "Đã cấp"}`); 
        }
        catch (e: any) { toast.error(e?.message ?? "Check-in thất bại"); }
    };

    const onResend = async (id: string) => {
        try { await appointmentConfirmationService.sendReminder(id); toast.success("Đã gửi lại nhắc lịch."); }
        catch (e: any) { toast.error(e?.message ?? "Gửi thất bại"); }
    };

    const onCancelClick = (row: Row) => {
        setCancelTarget(row);
        setCancelReason("");
    };

    const onCancelConfirm = async () => {
        if (!cancelTarget) return;
        if (!cancelReason.trim()) { toast.error("Vui lòng nhập lý do huỷ."); return; }
        setBusy(true);
        try {
            await cancelAppointment(cancelTarget.id, cancelReason.trim());
            setCancelTarget(null); setSelected(null); await load();
            toast.success("Đã huỷ lịch hẹn");
        } catch (e: any) { toast.error(e?.message ?? "Huỷ thất bại"); }
        finally { setBusy(false); }
    };

    const onNoShow = async (id: string) => {
        if (!confirm("Xác nhận bệnh nhân không đến (No-Show)?")) return;
        try {
            await markNoShow(id);
            await load();
            toast.success("Đã cập nhật trạng thái Không đến");
        } catch (e: any) {
            toast.error(e?.message ?? "Cập nhật thất bại");
        }
    };

    const onReschedule = async () => {
        if (!selected || !rescheduleDate || !rescheduleSlotId) {
            toast.error("Vui lòng chọn ngày và giờ mới.");
            return;
        }
        setBusy(true);
        try {
            await rescheduleAppointment(selected.id, { newDate: rescheduleDate, newSlotId: rescheduleSlotId });
            setSelected(null);
            setShowRescheduleForm(false);
            await load();
            toast.success("Dời lịch thành công");
        } catch (e: any) { toast.error(e?.message ?? "Dời lịch thất bại"); }
        finally { setBusy(false); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Lịch khám"
                subtitle="Quản lý toàn bộ lịch khám: xác nhận, dời, nhắc, huỷ."
                icon="calendar_month"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Lịch khám" },
                ]}
                actions={
                    <Link href="/portal/receptionist/appointments/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3C81C6] text-white text-sm font-medium hover:bg-[#2a6da8]">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Đặt lịch tại quầy
                    </Link>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Hôm nay" value={counts.today} icon="event" color="blue" loading={loading} />
                <StatCard label="Cần xác nhận" value={counts.need_confirm} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Sắp tới" value={counts.upcoming} icon="upcoming" color="violet" loading={loading} />
                <StatCard label="Đã xong" value={counts.done} icon="task_alt" color="emerald" loading={loading} />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {([
                    { key: "today", label: `Hôm nay (${counts.today})` },
                    { key: "need_confirm", label: `Cần xác nhận (${counts.need_confirm})` },
                    { key: "upcoming", label: `Sắp tới (${counts.upcoming})` },
                    { key: "done", label: `Đã xong (${counts.done})` },
                    { key: "cancelled", label: `Đã huỷ/Bỏ hẹn (${counts.cancelled})` },
                    { key: "all", label: `Tất cả (${items.length})` },
                ] as { key: TabKey; label: string }[]).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 text-sm rounded-lg border ${tab === t.key ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3 items-center">
                <input type="date" value={filterDate} onChange={e => {
                    setFilterDate(e.target.value);
                    if (e.target.value && tab === "today") setTab("all");
                }} className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] w-full" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] w-full">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] w-full">
                    <option value="ALL">Mọi bác sĩ</option>
                    {doctors.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                </select>
                <select value={filterService} onChange={e => setFilterService(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] w-full">
                    <option value="ALL">Mọi dịch vụ</option>
                    {services.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                </select>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm BN / mã / SĐT…" className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] w-full" />
                <button onClick={clearFilters} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0 flex items-center justify-center" title="Xoá bộ lọc">
                    <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                </button>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setViewMode("list")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border ${viewMode === "list" ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                    <span className="material-symbols-outlined text-[16px]">view_list</span> Danh sách
                </button>
                <button onClick={() => setViewMode("calendar")} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border ${viewMode === "calendar" ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                    <span className="material-symbols-outlined text-[16px]">calendar_view_month</span> Lịch
                </button>
                <span className="text-xs text-[#687582] ml-2">{filtered.length} lịch hẹn</span>
            </div>

            {viewMode === "list" ? (
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Ngày</th>
                                <th className="text-left px-4 py-3">Giờ</th>
                                <th className="text-left px-4 py-3">Dịch vụ</th>
                                <th className="text-left px-4 py-3">Bác sĩ</th>
                                <th className="text-left px-4 py-3">Phòng</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8}><EmptyState icon="event_busy" title="Không có lịch" /></td></tr>
                            ) : filtered.map(r => {
                                const meta = STATUS_META[r.status] ?? { label: r.status, cls: "bg-gray-100 text-gray-700" };
                                const timeDisplay = r.slotStart ? `${fmtTime(r.slotStart)}${r.slotEnd ? ` - ${fmtTime(r.slotEnd)}` : ''}` : '—';
                                return (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-medium">
                                            {r.patientName}
                                            {r.phone && <span className="block text-[11px] text-[#687582] mt-0.5">{r.phone}</span>}
                                        </td>
                                        <td className="px-4 py-3">{fmt(r.date)}</td>
                                        <td className="px-4 py-3 text-[13px]">{timeDisplay}</td>
                                        <td className="px-4 py-3 text-[13px]">{r.serviceName ?? "—"}</td>
                                        <td className="px-4 py-3">{r.doctorName ?? "—"}</td>
                                        <td className="px-4 py-3">{r.room ?? "—"}</td>
                                        <td className="px-4 py-3"><span title={`Trạng thái: ${meta.label}`} className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <DropdownMenu 
                                                items={[
                                                    { 
                                                        label: "Chi tiết", 
                                                        icon: "visibility", 
                                                        onClick: () => { setSelected(r); setRescheduleDate(r.date?.slice(0, 10) ?? ""); setShowRescheduleForm(false); } 
                                                    },
                                                    ...(r.status === "PENDING" ? [{ label: "Xác nhận", icon: "check_circle", onClick: () => onConfirm(r.id) }] : []),
                                                    ...(r.status === "CONFIRMED" ? [{ label: "Check-in", icon: "how_to_reg", onClick: () => onCheckIn(r.id) }] : []),
                                                    ...(["PENDING", "CONFIRMED", "CHECKED_IN"].includes(r.status) ? [{ label: "Gửi nhắc nhở", icon: "notifications", onClick: () => onResend(r.id) }] : []),
                                                    ...(["CHECKED_IN"].includes(r.status) ? [{ label: "Không đến (No-Show)", icon: "event_busy", variant: "danger" as const, onClick: () => onNoShow(r.id) }] : []),
                                                    ...(["PENDING", "CONFIRMED"].includes(r.status) ? [{ label: "Huỷ lịch", icon: "cancel", variant: "danger" as const, onClick: () => onCancelClick(r) }] : []),
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            ) : (
            /* Calendar view */
            <CalendarGrid
                month={calMonth}
                onMonthChange={setCalMonth}
                items={filtered}
            />
            )}

            {/* Detail modal */}
            {selected && (() => {
                const sMeta = STATUS_META[selected.status] ?? { label: selected.status, cls: "bg-gray-100 text-gray-700" };
                const timeDisplay = selected.slotStart ? `${fmtTime(selected.slotStart)}${selected.slotEnd ? ` - ${fmtTime(selected.slotEnd)}` : ''}` : '—';
                const channelMap: Record<string, string> = { WEB: "Website", APP: "Ứng dụng", DIRECT_CLINIC: "Tại quầy", HOTLINE: "Hotline" };
                const priorityMap: Record<string, { label: string; cls: string }> = {
                    EMERGENCY: { label: "Cấp cứu", cls: "bg-red-100 text-red-700" },
                    URGENT: { label: "Ưu tiên", cls: "bg-orange-100 text-orange-700" },
                    NORMAL: { label: "Thường", cls: "bg-blue-100 text-blue-700" },
                };
                const pri = priorityMap[selected.priority ?? ""] ?? priorityMap.NORMAL;
                return (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#1e242b] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 shrink-0">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500">info</span>
                                Chi tiết lịch khám
                            </h3>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined text-xl block">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5 overflow-y-auto">
                            {/* Patient header */}
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg shrink-0 border border-blue-200 dark:border-blue-800">
                                    {selected.patientName?.charAt(0)?.toUpperCase() ?? "?"}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-lg font-bold truncate">{selected.patientName}</h4>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {selected.phone && <span className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded"><span className="material-symbols-outlined text-[13px]">phone</span>{selected.phone}</span>}
                                        {selected.code && <span className="flex items-center gap-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded"><span className="material-symbols-outlined text-[13px]">tag</span>{selected.code}</span>}
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${pri.cls}`}>{pri.label}</span>
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${sMeta.cls}`}>{sMeta.label}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span>Ngày khám</div>
                                    <div className="font-semibold">{fmt(selected.date)}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{timeDisplay}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">stethoscope</span>Bác sĩ</div>
                                    <div className="font-semibold truncate">{selected.doctorName ?? "—"}</div>
                                    <div className="text-xs text-gray-500 truncate">{selected.specialtyName ?? "—"}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">medical_services</span>Dịch vụ</div>
                                    <div className="font-semibold truncate">{selected.serviceName ?? "—"}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">room</span>Phòng khám</div>
                                    <div className="font-semibold">{selected.room ?? "—"}</div>
                                    {selected.queueNumber && <div className="text-xs text-gray-500">STT: {selected.queueNumber}</div>}
                                </div>
                            </div>

                            {/* Extra info */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div><span className="text-gray-500">Kênh đặt:</span> <span className="font-medium">{channelMap[selected.bookingChannel ?? ""] ?? selected.bookingChannel ?? "—"}</span></div>
                                {selected.reason && <div className="col-span-2"><span className="text-gray-500">Lý do khám:</span> <span className="font-medium">{selected.reason}</span></div>}
                                {selected.checkedInAt && <div><span className="text-gray-500">Check-in:</span> <span className="font-medium">{new Date(selected.checkedInAt).toLocaleTimeString("vi-VN", {hour:"2-digit",minute:"2-digit"})}</span></div>}
                                {selected.confirmedAt && <div><span className="text-gray-500">Xác nhận lúc:</span> <span className="font-medium">{new Date(selected.confirmedAt).toLocaleTimeString("vi-VN", {hour:"2-digit",minute:"2-digit"})}</span></div>}
                                {selected.status === "CANCELLED" && selected.cancellationReason && (
                                    <div className="col-span-2 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                                        <span className="text-rose-600 font-medium">Lý do huỷ:</span> {selected.cancellationReason}
                                        {selected.cancelledBy && <span className="text-gray-500 ml-1">({selected.cancelledBy})</span>}
                                    </div>
                                )}
                                {selected.createdAt && <div><span className="text-gray-500">Đặt lúc:</span> <span className="font-medium">{fmt(selected.createdAt)}</span></div>}
                            </div>

                            {/* Reschedule section */}
                            {["PENDING","CONFIRMED"].includes(selected.status) && (
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                                    {!showRescheduleForm ? (
                                        <button onClick={() => setShowRescheduleForm(true)} className="text-sm font-medium text-[#3C81C6] hover:underline flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">edit_calendar</span> Dời lịch khám
                                        </button>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-[#121417] p-3 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e]">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-sm font-medium">Chọn lịch mới</p>
                                                <button onClick={() => setShowRescheduleForm(false)} className="text-[#687582] hover:text-gray-900"><span className="material-symbols-outlined text-[18px]">close</span></button>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs text-[#687582] mb-1">Ngày dời sang</label>
                                                    <input type="date" min={new Date().toISOString().slice(0,10)} value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1e242b]" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-[#687582] mb-1">Giờ khám ({rescheduleSlots.length} slot)</label>
                                                    {loadingSlots ? <p className="text-xs text-[#687582] py-2">Đang tải...</p>
                                                    : rescheduleSlots.length > 0 ? (
                                                        <select value={rescheduleSlotId} onChange={e => setRescheduleSlotId(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1e242b]">
                                                            <option value="">-- Chọn khung giờ --</option>
                                                            {rescheduleSlots.map(s => <option key={s.id||s.slot_id} value={s.id||s.slot_id}>{s.startTime?.slice(0,5)||s.start_time?.slice(0,5)} - {s.endTime?.slice(0,5)||s.end_time?.slice(0,5)}</option>)}
                                                        </select>
                                                    ) : <p className="text-xs text-rose-500 py-2">Không có slot trống.</p>}
                                                </div>
                                                <button onClick={onReschedule} disabled={busy||!rescheduleSlotId} className="w-full px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white disabled:opacity-50 font-medium">Xác nhận dời lịch</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Link href={`/portal/receptionist/change-history?appointmentId=${selected.id}`} className="text-xs text-[#3C81C6] hover:underline block">Xem lịch sử thay đổi →</Link>
                        </div>

                        {/* Footer actions */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2 shrink-0 flex-wrap">
                            {selected.status === "PENDING" && (
                                <button onClick={() => { onConfirm(selected.id); setSelected(null); }} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 shadow-sm">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Xác nhận
                                </button>
                            )}
                            {selected.status === "CONFIRMED" && (
                                <button onClick={() => { onCheckIn(selected.id); setSelected(null); }} className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-sm">
                                    <span className="material-symbols-outlined text-[16px]">how_to_reg</span> Check-in
                                </button>
                            )}
                            {["PENDING","CONFIRMED","CHECKED_IN"].includes(selected.status) && (
                                <button onClick={() => onResend(selected.id)} className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] font-medium flex items-center gap-1.5 hover:bg-gray-50">
                                    <span className="material-symbols-outlined text-[16px]">notifications</span> Nhắc nhở
                                </button>
                            )}
                            {["PENDING","CONFIRMED"].includes(selected.status) && (
                                <button onClick={() => onCancelClick(selected)} className="px-4 py-2 text-sm rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 font-medium flex items-center gap-1.5 ml-auto">
                                    <span className="material-symbols-outlined text-[16px]">cancel</span> Huỷ lịch
                                </button>
                            )}
                            {!["PENDING","CONFIRMED"].includes(selected.status) && (
                                <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] font-medium hover:bg-gray-50 ml-auto">Đóng</button>
                            )}
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* Cancel reason modal */}
            {cancelTarget && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setCancelTarget(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                            <h3 className="text-lg font-bold text-rose-600">Huỷ lịch hẹn</h3>
                            <p className="text-sm text-[#687582] mt-1">Bệnh nhân: {cancelTarget.patientName}</p>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium mb-2">Lý do huỷ <span className="text-rose-500">*</span></label>
                            <textarea
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                rows={3}
                                placeholder="Nhập lý do huỷ lịch hẹn..."
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] resize-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
                                autoFocus
                            />
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex gap-3 justify-end">
                            <button onClick={() => setCancelTarget(null)} className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200">Huỷ bỏ</button>
                            <button onClick={onCancelConfirm} disabled={busy || !cancelReason.trim()} className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 font-medium">Xác nhận huỷ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
