"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { DOCTOR_AVAILABILITY_ENDPOINTS, DOCTOR_ABSENCE_ENDPOINTS, STAFF_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type TabKey = "availability" | "absences";

interface DoctorAvailability {
    doctorId: string;
    doctorName: string;
    departmentName?: string;
    date: string;
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    conflicts: number;
}

interface Absence {
    id: string;
    doctorId: string;
    doctorName: string;
    startDate: string;
    endDate: string;
    reason?: string;
    affectedAppointments?: number;
    createdAt?: string;
}

interface AffectedAppointment {
    id: string;
    appointmentCode: string;
    patientName: string;
    doctorName: string;
    date: string;
    startTime: string;
    status?: string;
}

interface DoctorLite { id: string; fullName: string; departmentName?: string; }

function mapAvailability(d: any): DoctorAvailability {
    return {
        doctorId: String(d.doctor_id ?? d.doctorId ?? d.users_id ?? ""),
        doctorName: d.doctor_name ?? d.doctorName ?? d.full_name ?? "—",
        departmentName: d.department_name ?? d.departmentName ?? "",
        date: d.date ?? "",
        totalSlots: Number(d.total_slots ?? d.totalSlots ?? 0),
        availableSlots: Number(d.available_slots ?? d.availableSlots ?? 0),
        bookedSlots: Number(d.booked_slots ?? d.bookedSlots ?? 0),
        conflicts: Number(d.conflicts ?? d.conflict_count ?? 0),
    };
}

function mapAbsence(r: any): Absence {
    return {
        id: String(r.doctor_absences_id ?? r.absence_id ?? r.id ?? ""),
        doctorId: String(r.doctor_id ?? r.doctorId ?? r.users_id ?? ""),
        doctorName: r.doctor_name ?? r.doctorName ?? r.full_name ?? "—",
        startDate: r.start_date ?? r.startDate ?? r.from_date ?? "",
        endDate: r.end_date ?? r.endDate ?? r.to_date ?? "",
        reason: r.reason ?? r.note ?? "",
        affectedAppointments: Number(r.affected_appointments ?? r.affectedAppointments ?? 0),
        createdAt: r.created_at ?? r.createdAt ?? "",
    };
}

function mapAffected(r: any): AffectedAppointment {
    return {
        id: String(r.appointment_id ?? r.id ?? ""),
        appointmentCode: r.appointment_code ?? r.code ?? "",
        patientName: r.patient_name ?? r.patientName ?? "—",
        doctorName: r.doctor_name ?? r.doctorName ?? "",
        date: r.date ?? r.appointment_date ?? "",
        startTime: (r.start_time ?? r.startTime ?? "").slice(0, 5),
        status: r.status ?? "",
    };
}

function formatDate(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function DoctorAvailabilityPage() {
    const [tab, setTab] = useState<TabKey>("availability");
    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Độ rảnh & vắng mặt bác sĩ"
                subtitle="Theo dõi độ rảnh của bác sĩ theo ngày và quản lý vắng mặt đột xuất"
                icon="person_search"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Độ rảnh bác sĩ" }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-1.5 inline-flex gap-1">
                {([
                    { key: "availability", label: "Độ rảnh theo ngày", icon: "event_available" },
                    { key: "absences", label: "Vắng mặt đột xuất", icon: "person_off" },
                ] as { key: TabKey; label: string; icon: string }[]).map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 ${
                            tab === t.key ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm" : "text-[#687582] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]"
                        }`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "availability" ? <AvailabilityTab /> : <AbsencesTab />}
        </div>
    );
}

// ========== Availability Tab ==========
function AvailabilityTab() {
    const [date, setDate] = useState<string>(todayISO());
    const [items, setItems] = useState<DoctorAvailability[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        if (!date) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(DOCTOR_AVAILABILITY_ENDPOINTS.BY_DATE(date));
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapAvailability));
        } catch {
            setError("Không tải được độ rảnh bác sĩ.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((a) => `${a.doctorName} ${a.departmentName ?? ""}`.toLowerCase().includes(q));
    }, [items, search]);

    const stats = useMemo(() => ({
        total: items.length,
        available: items.filter((a) => a.availableSlots > 0).length,
        full: items.filter((a) => a.totalSlots > 0 && a.availableSlots === 0).length,
        conflicts: items.reduce((sum, a) => sum + a.conflicts, 0),
    }), [items]);

    return (
        <>
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4 flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium text-[#121417] dark:text-gray-300">Ngày:</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                <button onClick={() => setDate(todayISO())} className="px-3 py-2 text-xs text-[#3C81C6] border border-[#3C81C6]/40 hover:bg-[#3C81C6]/10 rounded-xl">Hôm nay</button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng bác sĩ" value={stats.total} icon="person" color="blue" loading={loading} />
                <StatCard label="Còn slot trống" value={stats.available} icon="event_available" color="emerald" loading={loading} />
                <StatCard label="Hết slot" value={stats.full} icon="event_busy" color="amber" loading={loading} />
                <StatCard label="Xung đột" value={stats.conflicts} icon="report_problem" color="red" loading={loading} />
            </div>

            <FilterBar searchPlaceholder="Tìm theo bác sĩ, khoa..." searchValue={search} onSearchChange={setSearch} onReset={() => setSearch("")} />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="person_search" title="Không có dữ liệu độ rảnh" description={items.length === 0 ? `Chưa có dữ liệu slot cho ngày ${formatDate(date)}.` : "Không có bác sĩ phù hợp bộ lọc."} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map((a) => {
                        const fillPct = a.totalSlots > 0 ? Math.round((a.bookedSlots / a.totalSlots) * 100) : 0;
                        const conflict = a.conflicts > 0;
                        return (
                            <div key={`${a.doctorId}-${a.date}`} className={`bg-white dark:bg-[#1e242b] rounded-2xl border shadow-sm p-4 ${conflict ? "border-red-300 dark:border-red-800" : "border-[#dde0e4] dark:border-[#2d353e]"}`}>
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {(a.doctorName[0] ?? "?").toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-[#121417] dark:text-white truncate" title={a.doctorName}>{a.doctorName}</div>
                                            {a.departmentName && <div className="text-xs text-[#687582] dark:text-gray-400 truncate">{a.departmentName}</div>}
                                        </div>
                                    </div>
                                    {conflict && (
                                        <div className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>report_problem</span>
                                            {a.conflicts}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-xs text-[#687582] dark:text-gray-400">Đã đặt <b className="text-[#121417] dark:text-white">{a.bookedSlots}/{a.totalSlots}</b></div>
                                    <div className="text-xs font-semibold text-[#3C81C6]">{fillPct}%</div>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all ${fillPct >= 100 ? "bg-amber-500" : fillPct >= 70 ? "bg-[#3C81C6]" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, fillPct)}%` }} />
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold">{a.availableSlots} slot trống</div>
                                    <div className="text-[#687582] dark:text-gray-400">{formatDate(a.date)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}

// ========== Absences Tab ==========
function AbsencesTab() {
    const toast = useToast();
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [affected, setAffected] = useState<AffectedAppointment[]>([]);
    const [doctors, setDoctors] = useState<DoctorLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [draft, setDraft] = useState({ doctorId: "", startDate: "", endDate: "", reason: "" });
    const [saving, setSaving] = useState(false);
    const [detail, setDetail] = useState<Absence | null>(null);

    const loadDoctors = useCallback(async () => {
        try {
            const res = await axiosClient.get(STAFF_ENDPOINTS.LIST, { params: { role: "DOCTOR", limit: 500 } });
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            setDoctors(raw.map((d: any) => ({
                id: String(d.users_id ?? d.id ?? ""),
                fullName: d.full_name ?? d.fullName ?? d.name ?? "",
                departmentName: d.department_name ?? d.specialty_name ?? "",
            })).filter((d) => d.id));
        } catch {
            setDoctors([]);
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [absRes, affRes] = await Promise.all([
                axiosClient.get(DOCTOR_ABSENCE_ENDPOINTS.LIST, { params: { limit: 200 } }),
                axiosClient.get(DOCTOR_ABSENCE_ENDPOINTS.AFFECTED_APPOINTMENTS, { params: { limit: 200 } }).catch(() => ({ data: { data: [] } })),
            ]);
            const { data: absData } = unwrapList<any>(absRes);
            const { data: affData } = unwrapList<any>(affRes);
            setAbsences(absData.map(mapAbsence));
            setAffected(affData.map(mapAffected));
        } catch {
            setError("Không tải được danh sách vắng mặt.");
            setAbsences([]);
            setAffected([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDoctors(); load(); }, [loadDoctors, load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return absences;
        return absences.filter((a) => `${a.doctorName} ${a.reason ?? ""}`.toLowerCase().includes(q));
    }, [absences, search]);

    const stats = useMemo(() => {
        const now = new Date();
        return {
            total: absences.length,
            active: absences.filter((a) => new Date(a.startDate) <= now && new Date(a.endDate) >= now).length,
            upcoming: absences.filter((a) => new Date(a.startDate) > now).length,
            affected: affected.length,
        };
    }, [absences, affected]);

    const handleSave = async () => {
        if (!draft.doctorId || !draft.startDate || !draft.endDate) {
            toast.warning("Nhập đủ bác sĩ và khoảng ngày.");
            return;
        }
        if (draft.startDate > draft.endDate) {
            toast.warning("Ngày kết thúc phải sau ngày bắt đầu.");
            return;
        }
        setSaving(true);
        try {
            await axiosClient.post(DOCTOR_ABSENCE_ENDPOINTS.CREATE, {
                doctor_id: draft.doctorId,
                start_date: draft.startDate,
                end_date: draft.endDate,
                reason: draft.reason.trim() || undefined,
            });
            toast.success("Đã ghi nhận vắng mặt.");
            setShowModal(false);
            setDraft({ doctorId: "", startDate: "", endDate: "", reason: "" });
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không tạo được.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (a: Absence) => {
        if (!confirm(`Xoá lịch vắng của ${a.doctorName} (${formatDate(a.startDate)} – ${formatDate(a.endDate)})?`)) return;
        try {
            await axiosClient.delete(DOCTOR_ABSENCE_ENDPOINTS.DETAIL(a.id));
            toast.success("Đã xoá.");
            await load();
        } catch {
            toast.error("Không xoá được.");
        }
    };

    const affectedByAbsence = useMemo(() => {
        const map = new Map<string, AffectedAppointment[]>();
        affected.forEach((a) => {
            if (!map.has(a.doctorName)) map.set(a.doctorName, []);
            map.get(a.doctorName)!.push(a);
        });
        return map;
    }, [affected]);

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng vắng" value={stats.total} icon="person_off" color="blue" loading={loading} />
                <StatCard label="Đang vắng" value={stats.active} icon="event_busy" color="red" loading={loading} />
                <StatCard label="Sắp tới" value={stats.upcoming} icon="upcoming" color="amber" loading={loading} />
                <StatCard label="Lịch bị ảnh hưởng" value={stats.affected} icon="warning" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo bác sĩ, lý do..."
                searchValue={search}
                onSearchChange={setSearch}
                actions={
                    <button onClick={() => setShowModal(true)} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        Ghi nhận vắng
                    </button>
                }
                onReset={() => setSearch("")}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="person_off" title="Không có bác sĩ vắng" description={absences.length === 0 ? "Tất cả bác sĩ đang có mặt." : "Không có lịch vắng phù hợp."} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map((a) => {
                        const appts = affectedByAbsence.get(a.doctorName) ?? [];
                        const now = new Date();
                        const isActive = new Date(a.startDate) <= now && new Date(a.endDate) >= now;
                        return (
                            <div key={a.id} className={`bg-white dark:bg-[#1e242b] rounded-2xl border shadow-sm overflow-hidden ${isActive ? "border-red-300 dark:border-red-800" : "border-[#dde0e4] dark:border-[#2d353e]"}`}>
                                <div className={`h-1 ${isActive ? "bg-gradient-to-r from-red-400 to-rose-500" : "bg-gradient-to-r from-amber-400 to-orange-500"}`} />
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white">
                                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>person_off</span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#121417] dark:text-white">{a.doctorName}</div>
                                                <div className="text-xs text-[#687582] dark:text-gray-400">{formatDate(a.startDate)} → {formatDate(a.endDate)}</div>
                                            </div>
                                        </div>
                                        {isActive && <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">ĐANG VẮNG</div>}
                                    </div>
                                    {a.reason && <div className="text-xs text-[#687582] dark:text-gray-400 mb-2 line-clamp-2" title={a.reason}>Lý do: {a.reason}</div>}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
                                        {appts.length > 0 ? (
                                            <button onClick={() => setDetail(a)} className="text-xs font-semibold text-amber-600 hover:underline inline-flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>warning</span>
                                                {appts.length} lịch ảnh hưởng
                                            </button>
                                        ) : (
                                            <span className="text-xs text-[#687582] dark:text-gray-400">Không có lịch ảnh hưởng</span>
                                        )}
                                        <button onClick={() => handleDelete(a)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Xoá">
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
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
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-600">person_off</span>
                            Ghi nhận bác sĩ vắng
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bác sĩ *</label>
                                <select value={draft.doctorId} onChange={(e) => setDraft({ ...draft, doctorId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    <option value="">— Chọn bác sĩ —</option>
                                    {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Từ ngày *</label>
                                    <input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Đến ngày *</label>
                                    <input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lý do</label>
                                <textarea rows={3} value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} placeholder="VD: Ốm đột xuất, việc gia đình..."
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                                {saving ? "Đang lưu..." : "Ghi nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDetail(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-xl w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-600">warning</span>
                            Lịch bị ảnh hưởng — {detail.doctorName}
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-400 mb-3">{formatDate(detail.startDate)} → {formatDate(detail.endDate)}</p>
                        {(() => {
                            const appts = affectedByAbsence.get(detail.doctorName) ?? [];
                            if (appts.length === 0) return <div className="text-sm text-[#687582] dark:text-gray-400 italic">Không có lịch bị ảnh hưởng.</div>;
                            return (
                                <div className="space-y-2">
                                    {appts.map((ap) => (
                                        <div key={ap.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#13191f]">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-[#121417] dark:text-white truncate">{ap.patientName}</div>
                                                <div className="text-xs text-[#687582] dark:text-gray-400">{formatDate(ap.date)} · {ap.startTime}</div>
                                            </div>
                                            <div className="font-mono text-xs text-[#3C81C6]">{ap.appointmentCode}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                        <div className="flex items-center justify-end mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
