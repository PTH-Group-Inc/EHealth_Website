"use client";

/**
 * Receptionist Queue — Phase J.1 #2 + J.3 #7 (điều phối hàng đợi).
 * Spec: dòng 10137-10265 + 11140-11173.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { appointmentStatusService } from "@/services/appointmentStatusService";
import { toast } from "react-hot-toast";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    waiting: { label: "Chờ xác nhận", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
    confirmed: { label: "Đã xác nhận", cls: "bg-sky-100 text-sky-700 border border-sky-200" },
    checked_in: { label: "Đã tiếp nhận", cls: "bg-blue-100 text-blue-700 border border-blue-200" },
    in_progress: { label: "Đang khám", cls: "bg-violet-100 text-violet-700 border border-violet-200" },
    completed: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
    skipped: { label: "Bỏ qua", cls: "bg-slate-100 text-slate-700 border border-slate-200" },
    no_show: { label: "Vắng mặt", cls: "bg-rose-100 text-rose-700 border border-rose-200" },
};

const normalizeStatus = (raw: any): string => {
    const s = (raw ?? "").toString().toUpperCase();
    if (["WAITING", "PENDING"].includes(s)) return "waiting";
    if (["CONFIRMED"].includes(s)) return "confirmed";
    if (s === "CHECKED_IN") return "checked_in";
    if (["IN_PROGRESS", "EXAMINING"].includes(s)) return "in_progress";
    if (["COMPLETED", "DONE"].includes(s)) return "completed";
    if (s === "SKIPPED") return "skipped";
    if (s === "NO_SHOW") return "no_show";
    if (s === "CANCELLED") return "cancelled";
    return s.toLowerCase() || "waiting";
};

const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—";
    // Giả sử timeStr là "08:00:00" hoặc datetime ISO
    if (timeStr.includes("T")) {
        const d = new Date(timeStr);
        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    if (timeStr.includes(" - ")) {
        const parts = timeStr.split(" - ");
        return parts.map(p => p.substring(0, 5)).join(" - ");
    }
    return timeStr.substring(0, 5);
};

interface QueueItem {
    id: string;
    queueNumber?: number;
    patientName: string;
    appointmentCode?: string;
    room?: string;
    doctorName?: string;
    status: string;
    appointmentTime?: string;
    priority?: string;
    isLate?: boolean;
    lateMinutes?: number;
    checkedInAt?: string;
    startedAt?: string;
    checkInMethod?: string;
    appointmentDate?: string;
    specialtyName?: string;
}

export default function ReceptionistQueuePage() {
    const sp = useSearchParams();
    const initialRoom = sp.get("room") ?? "ALL";

    const [items, setItems] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [roomFilter, setRoomFilter] = useState(initialRoom);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
    const [cancelTarget, setCancelTarget] = useState<QueueItem | null>(null);
    const [cancelReason, setCancelReason] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await appointmentStatusService.getQueueToday({ include_all: true });
            const data = (r as any)?.data ?? r;
            setItems((Array.isArray(data) ? data : []).map((a: any) => ({
                id: a.id ?? a.appointments_id,
                queueNumber: a.queue_number ?? a.queueNumber,
                patientName: a.patient_name ?? a.patientName ?? "(chưa có)",
                appointmentCode: a.appointment_code ?? a.code,
                room: a.room_name ?? a.room,
                doctorName: a.doctor_name ?? a.doctorName,
                status: normalizeStatus(a.queue_status ?? a.status),
                appointmentTime: a.appointment_time ?? a.slot_time ?? a.slot_start_time,
                priority: a.priority,
                isLate: a.is_late,
                lateMinutes: a.late_minutes,
                checkedInAt: a.checked_in_at,
                startedAt: a.started_at,
                checkInMethod: a.check_in_method,
                appointmentDate: a.appointment_date,
                specialtyName: a.specialty_name,
            })).filter(q => !["cancelled", "no_show"].includes(q.status)));
            setLastUpdate(new Date());
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(() => {
            load();
        }, 30000);
        return () => clearInterval(interval);
    }, [load]);

    // Close menu when clicking outside or scrolling
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.action-menu-popup') && !(e.target as Element).closest('.action-menu-btn')) {
                setOpenMenuId(null);
            }
        };
        const handleScroll = () => setOpenMenuId(null);
        
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, []);

    const handleMenuClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (openMenuId === id) {
            setOpenMenuId(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 4,
                left: rect.right - 192 // w-48 = 192px
            });
            setOpenMenuId(id);
        }
    };

    const rooms = useMemo(() => Array.from(new Set(items.map(q => q.room).filter(Boolean) as string[])), [items]);

    const filtered = useMemo(() => items.filter(q => {
        if (roomFilter !== "ALL" && q.room !== roomFilter) return false;
        if (statusFilter !== "ALL" && q.status !== statusFilter) return false;
        if (search) {
            const qq = search.toLowerCase();
            return q.patientName.toLowerCase().includes(qq) || (q.appointmentCode ?? "").toLowerCase().includes(qq);
        }
        return true;
    }), [items, roomFilter, statusFilter, search]);

    const stats = useMemo(() => ({
        total: items.length,
        waiting: items.filter(q => q.status === "waiting").length,
        checkedIn: items.filter(q => q.status === "checked_in").length,
        inProgress: items.filter(q => q.status === "in_progress").length,
    }), [items]);

    const doAction = async (id: string, action: "check_in" | "skip" | "recall" | "no_show" | "confirm" | "cancel", extra?: string) => {
        setBusyId(id);
        setOpenMenuId(null);
        try {
            if (action === "confirm") {
                await appointmentStatusService.confirmAppointment(id);
                toast.success("Đã xác nhận lịch khám thành công");
            }
            if (action === "cancel") {
                await appointmentStatusService.cancelAppointment(id, extra || "Lễ tân hủy lịch");
                toast.success("Đã hủy lịch khám");
            }
            if (action === "check_in") {
                await appointmentStatusService.checkIn(id);
                toast.success("Đã tiếp nhận thành công");
            }
            if (action === "skip") {
                await appointmentStatusService.skip(id);
                toast.success("Đã bỏ qua bệnh nhân");
            }
            if (action === "recall") {
                await appointmentStatusService.recall(id);
                toast.success("Đã gọi lại bệnh nhân");
            }
            if (action === "no_show") {
                await appointmentStatusService.markNoShow(id);
                toast.success("Đã đánh dấu không đến");
            }
            await load();
        } catch (e: any) { 
            toast.error(e?.response?.data?.message ?? e?.message ?? "Thao tác thất bại"); 
        } finally { 
            setBusyId(null); 
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Hàng đợi hôm nay"
                subtitle={`Cập nhật lúc ${lastUpdate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
                icon="groups"
                breadcrumbs={[
                    { label: "Trang chủ", href: "/portal/receptionist" },
                    { label: "Hàng đợi" },
                ]}
                actions={
                    <button onClick={load} className="px-4 py-2 text-sm rounded-lg bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">refresh</span> Làm mới
                    </button>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng" value={stats.total} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Đang chờ" value={stats.waiting} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Đã tiếp nhận" value={stats.checkedIn} icon="how_to_reg" color="violet" loading={loading} />
                <StatCard label="Đang khám" value={stats.inProgress} icon="stethoscope" color="emerald" loading={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4 shadow-sm">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bệnh nhân / mã lịch…" className="px-4 py-2.5 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-gray-50 dark:bg-[#121417] focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
                <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className="px-4 py-2.5 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-gray-50 dark:bg-[#121417] focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none">
                    <option value="ALL">Mọi phòng khám</option>
                    {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-gray-50 dark:bg-[#121417] focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto min-h-[350px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                            <tr>
                                <th className="px-5 py-4 font-semibold">STT</th>
                                <th className="px-5 py-4 font-semibold">Bệnh nhân</th>
                                <th className="px-5 py-4 font-semibold">Giờ khám</th>
                                <th className="px-5 py-4 font-semibold">Phòng</th>
                                <th className="px-5 py-4 font-semibold">Bác sĩ</th>
                                <th className="px-5 py-4 font-semibold">Trạng thái</th>
                                <th className="px-5 py-4 font-semibold text-center w-24">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <span className="material-symbols-outlined animate-spin text-3xl mb-2">refresh</span>
                                            <p>Đang tải danh sách hàng đợi...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8">
                                        <EmptyState icon="groups" title="Không có bệnh nhân" description="Hàng đợi hiện tại đang trống" variant="default" />
                                    </td>
                                </tr>
                            ) : filtered.map(q => {
                                const meta = STATUS_META[q.status] ?? { label: q.status, cls: "bg-gray-100 text-gray-700 border border-gray-200" };
                                const highlight = q.status === "waiting" ? "border-l-4 border-l-amber-400"
                                    : q.status === "in_progress" ? "border-l-4 border-l-violet-500" : "border-l-4 border-l-transparent";
                                const disabled = busyId === q.id;
                                
                                return (
                                    <tr key={q.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${highlight}`}>
                                        <td className="px-5 py-4 font-bold text-blue-600 dark:text-blue-400 text-lg">
                                            #{q.queueNumber ?? "?"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100">{q.patientName}</div>
                                        </td>
                                        <td className="px-5 py-4 font-mono font-medium text-gray-600 dark:text-gray-300">
                                            {formatTime(q.appointmentTime)}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                                            {q.room ?? "—"}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                                            {q.doctorName ?? "—"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${meta.cls}`}>
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center relative">
                                            {q.status === "completed" ? (
                                                <Link 
                                                    href={`/portal/receptionist/billing?search=${encodeURIComponent(q.appointmentCode || q.patientName)}`} 
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 dark:hover:bg-teal-900/50 transition-colors"
                                                    title="Thanh toán"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                                    </span>
                                                </Link>
                                            ) : (
                                                <div className="relative inline-block text-left">
                                                    <button 
                                                        onClick={(e) => handleMenuClick(e, q.id)} 
                                                        className={`action-menu-btn p-1.5 rounded-full transition-colors ${openMenuId === q.id ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[20px] block">more_vert</span>
                                                    </button>
                                                    
                                                    {openMenuId === q.id && (
                                                        <div 
                                                            className="fixed w-48 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] shadow-xl rounded-xl overflow-hidden z-[9999] text-left py-1 action-menu-popup"
                                                            style={{ top: menuPos.top, left: menuPos.left }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {["waiting", "confirmed"].includes(q.status) && (
                                                                <>
                                                                    {q.status === "waiting" && (
                                                                        <button onClick={() => doAction(q.id, "confirm")} disabled={disabled} className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors">
                                                                            <span className="material-symbols-outlined text-[18px]">check_circle</span> Xác nhận
                                                                        </button>
                                                                    )}
                                                                    {q.status === "confirmed" && (
                                                                        <button onClick={() => doAction(q.id, "check_in")} disabled={disabled} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors">
                                                                            <span className="material-symbols-outlined text-[18px]">how_to_reg</span> Tiếp nhận
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => { setOpenMenuId(null); setCancelTarget(q); setCancelReason(""); }} disabled={disabled} className="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-700 dark:text-rose-400 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors">
                                                                        <span className="material-symbols-outlined text-[18px]">cancel</span> Hủy lịch
                                                                    </button>
                                                                </>
                                                            )}
                                                            {q.status === "checked_in" && (
                                                                <>
                                                                    <button onClick={() => doAction(q.id, "no_show")} disabled={disabled} className="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-700 dark:text-rose-400 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors">
                                                                        <span className="material-symbols-outlined text-[18px]">person_off</span> Không đến
                                                                    </button>
                                                                    <button onClick={() => doAction(q.id, "skip")} disabled={disabled} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 text-gray-700 dark:text-gray-300 flex items-center gap-2 font-medium transition-colors">
                                                                        <span className="material-symbols-outlined text-[18px]">skip_next</span> Bỏ qua
                                                                    </button>
                                                                </>
                                                            )}
                                                            {q.status === "skipped" && (
                                                                <button onClick={() => doAction(q.id, "recall")} disabled={disabled} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors">
                                                                    <span className="material-symbols-outlined text-[18px]">call</span> Gọi lại
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => { setSelectedItem(q); setOpenMenuId(null); }} 
                                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-2 font-medium transition-colors border-t border-gray-100 dark:border-gray-800"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">visibility</span> Xem chi tiết
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1e242b] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500">info</span>
                                Chi tiết hàng đợi
                            </h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-symbols-outlined text-xl block">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl shrink-0 border border-blue-200 dark:border-blue-800">
                                    {selectedItem.queueNumber ?? "?"}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{selectedItem.patientName}</h4>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex gap-3 flex-wrap">
                                        <span className="flex items-center gap-1 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs"><span className="material-symbols-outlined text-[14px]">tag</span>{selectedItem.appointmentCode ?? "—"}</span>
                                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">
                                            <span className={`w-2 h-2 rounded-full ${selectedItem.priority === 'EMERGENCY' ? 'bg-red-500' : selectedItem.priority === 'URGENT' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                                            {selectedItem.priority === 'EMERGENCY' ? 'Cấp cứu' : selectedItem.priority === 'URGENT' ? 'Ưu tiên' : 'Khám thường'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span>Giờ khám dự kiến</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{selectedItem.appointmentDate} • {formatTime(selectedItem.appointmentTime)}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">how_to_reg</span>Tiếp nhận lúc</div>
                                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1 flex-wrap">
                                        {formatTime(selectedItem.checkedInAt)}
                                        {selectedItem.isLate && <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded ml-1">TRỄ {selectedItem.lateMinutes} PHÚT</span>}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">stethoscope</span>Bác sĩ / Khoa</div>
                                    <div className="font-semibold text-gray-900 dark:text-white truncate" title={selectedItem.doctorName}>{selectedItem.doctorName ?? "—"}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedItem.specialtyName ?? "—"}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">room</span>Phòng khám</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{selectedItem.room ?? "—"}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Trạng thái: {STATUS_META[selectedItem.status]?.label ?? selectedItem.status}</div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
                            <button onClick={() => setSelectedItem(null)} className="px-5 py-2.5 rounded-lg bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-blue-500/20 outline-none">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {cancelTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1e242b] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-rose-50 dark:bg-rose-900/20">
                            <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                                <span className="material-symbols-outlined">cancel</span>
                                Hủy lịch khám
                            </h3>
                            <button onClick={() => setCancelTarget(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-symbols-outlined text-xl block">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Bạn đang hủy lịch khám của <strong className="text-gray-900 dark:text-white">{cancelTarget.patientName}</strong>
                                {cancelTarget.appointmentCode && <span className="font-mono text-xs ml-1">({cancelTarget.appointmentCode})</span>}
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lý do hủy <span className="text-rose-500">*</span></label>
                                <textarea
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                    rows={3}
                                    placeholder="Nhập lý do hủy lịch khám..."
                                    className="w-full px-4 py-2.5 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-gray-50 dark:bg-[#121417] focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none resize-none"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                            <button onClick={() => setCancelTarget(null)} className="px-5 py-2.5 rounded-lg bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                Đóng
                            </button>
                            <button
                                disabled={!cancelReason.trim() || busyId === cancelTarget.id}
                                onClick={async () => {
                                    const target = cancelTarget;
                                    setCancelTarget(null);
                                    await doAction(target.id, "cancel", cancelReason.trim());
                                }}
                                className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                                Xác nhận hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

