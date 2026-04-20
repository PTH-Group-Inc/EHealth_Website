"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { getAppointments } from "@/services/appointmentService";
import { appointmentStatusService } from "@/services/appointmentStatusService";
import { QueueCard, type QueueStatus, type QueuePriority } from "@/components/shared/cards";
import { EmptyState } from "@/components/shared/layout";


const STATUS_CFG: Record<string, { label: string; cls: string; icon: string }> = {
    checked_in: { label: "Đã tiếp nhận", cls: "bg-blue-50 dark:bg-blue-500/10 text-blue-600", icon: "how_to_reg" },
    waiting: { label: "Đang chờ", cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600", icon: "schedule" },
    examining: { label: "Đang khám", cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600", icon: "stethoscope" },
    completed: { label: "Hoàn thành", cls: "bg-gray-100 dark:bg-gray-500/10 text-gray-500", icon: "check_circle" },
};

export default function ReceptionistQueue() {
    const [queue, setQueue] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"table" | "card">("card");
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const loadQueue = () => {
        const mapStatus = (s: string) => {
            if (s === "WAITING") return "waiting";
            if (s === "IN_PROGRESS" || s === "EXAMINING") return "examining";
            if (s === "COMPLETED" || s === "DONE") return "completed";
            if (s === "CHECKED_IN" || s === "confirmed") return "checked_in";
            return "waiting";
        };
        appointmentStatusService.getQueueToday()
            .then(res => {
                const items: any[] = res?.data?.data ?? res?.data ?? res ?? [];
                if (Array.isArray(items)) {
                    setQueue(items.map((a: any, idx: number) => ({
                        id: a.id ?? idx + 1,
                        number: a.queueNumber ?? `A${String(idx + 1).padStart(3, "0")}`,
                        patient: a.patientName ?? a.patient?.fullName ?? "",
                        age: a.age ?? a.patient?.age ?? 0,
                        checkInTime: a.checkInTime ?? a.scheduledTime ?? "",
                        doctor: a.doctorName ?? a.doctor?.fullName ?? "",
                        dept: a.departmentName ?? a.department?.name ?? "",
                        room: a.roomName ?? a.room?.name ?? "—",
                        status: mapStatus(a.status ?? ""),
                        waitTime: a.waitTime ?? "—",
                    })));
                    setLastRefresh(new Date());
                }
            })
            .catch(() => {
                const today = new Date().toISOString().split("T")[0];
                getAppointments({ date: today, status: "confirmed", limit: 100 })
                    .then(res => {
                        const items: any[] = res?.data ?? [];
                        setQueue(items.map((a: any, idx: number) => ({
                            id: a.id ?? idx + 1,
                            number: `A${String(idx + 1).padStart(3, "0")}`,
                            patient: a.patientName ?? "",
                            age: a.age ?? 0,
                            checkInTime: a.checkInTime ?? a.time ?? "",
                            doctor: a.doctorName ?? "",
                            dept: a.departmentName ?? "",
                            room: a.room ?? "—",
                            status: a.status === "confirmed" ? "checked_in" : a.status,
                            waitTime: "—",
                        })));
                        setLastRefresh(new Date());
                    })
                    .catch(() => setQueue([]));
            });
    };

    useEffect(() => {
        loadQueue();
        if (!autoRefresh) return;
        const id = setInterval(loadQueue, 30_000);
        return () => clearInterval(id);
    }, [autoRefresh]);
    const [filter, setFilter] = useState("all");
    const [transferModal, setTransferModal] = useState<{ id: number; type: "doctor" | "dept" } | null>(null);
    const [transferTarget, setTransferTarget] = useState("");

    const handleCall = async (id: number) => {
        const q = queue.find(q => q.id === id);
        if (!q) return;
        try {
            await appointmentStatusService.recall(String(id));
        } catch { /* local update anyway */ }
        setQueue(prev => prev.map(q => q.id === id ? { ...q, status: "examining" } : q));
    };
    const handleCancel = async (id: number) => {
        if (!confirm("Bạn có chắc muốn hủy lượt khám này?")) return;
        try {
            await appointmentStatusService.markNoShow(String(id));
        } catch { /* local update anyway */ }
        setQueue(prev => prev.filter(q => q.id !== id));
    };

    const handleTransfer = () => {
        if (!transferModal || !transferTarget) return;
        alert("Chức năng chuyển bác sĩ/khoa đang phát triển");
        setTransferModal(null);
        setTransferTarget("");
    };

    const filtered = useMemo(() => queue.filter(q => {
        const ms = q.patient.toLowerCase().includes(search.toLowerCase()) || q.number.includes(search);
        return ms && (filter === "all" || q.status === filter);
    }), [queue, search, filter]);

    const cnt = (s: string) => queue.filter(q => q.status === s).length;

    return (
        <div className="p-6 md:p-8"><div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Quản lý Hàng đợi</h1>
                    <p className="text-sm text-[#687582] mt-1">Theo dõi và điều phối bệnh nhân chờ khám</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${autoRefresh
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                        title={autoRefresh ? "Tự động cập nhật mỗi 30s" : "Cập nhật thủ công"}>
                        <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                        {autoRefresh ? "Live" : "Đã tắt"}
                    </button>
                    <button onClick={loadQueue}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-xs font-medium hover:border-[#3C81C6] transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>refresh</span>
                        Cập nhật ({lastRefresh.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })})
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-medium hover:border-[#3C81C6] transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>print</span>In số thứ tự
                    </button>
                    <Link href="/portal/receptionist/reception"
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#3C81C6]/20">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>Tiếp nhận BN mới
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                    { l: "Tổng", v: queue.length, i: "groups", c: "from-blue-500 to-blue-600" },
                    { l: "Đã tiếp nhận", v: cnt("checked_in"), i: "how_to_reg", c: "from-cyan-500 to-cyan-600" },
                    { l: "Đang chờ", v: cnt("waiting"), i: "schedule", c: "from-amber-500 to-amber-600" },
                    { l: "Đang khám", v: cnt("examining"), i: "stethoscope", c: "from-emerald-500 to-emerald-600" },
                    { l: "Hoàn thành", v: cnt("completed"), i: "check_circle", c: "from-gray-400 to-gray-500" },
                ].map(s => (
                    <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>{s.i}</span>
                        </div>
                        <div><p className="text-xl font-bold text-[#121417] dark:text-white">{s.v}</p><p className="text-xs text-[#687582]">{s.l}</p></div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full sm:max-w-xs">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>search</span>
                        <input type="text" placeholder="Tìm theo tên, STT..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] dark:text-white" />
                    </div>
                    <div className="flex gap-2">
                        {["all", "checked_in", "waiting", "examining", "completed"].map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-[#3C81C6] text-white" : "bg-[#f6f7f8] dark:bg-[#13191f] text-[#687582] hover:text-[#121417]"}`}>
                                {s === "all" ? "Tất cả" : STATUS_CFG[s]?.label}
                            </button>
                        ))}
                    </div>
                    <div className="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl ml-auto">
                        <button onClick={() => setViewMode("card")}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${viewMode === "card" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] hover:text-[#3C81C6]"}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>grid_view</span>
                            Thẻ
                        </button>
                        <button onClick={() => setViewMode("table")}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${viewMode === "table" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] hover:text-[#3C81C6]"}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>table_rows</span>
                            Bảng
                        </button>
                    </div>
                </div>
                {viewMode === "card" && (
                    <div className="p-4">
                        {filtered.length === 0 ? (
                            <EmptyState icon="event_busy" title="Hàng đợi trống" description="Chưa có bệnh nhân nào hôm nay." />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {filtered.map(q => {
                                    const isPriority = q.age >= 60 || q.age <= 6;
                                    return (
                                        <QueueCard
                                            key={q.id}
                                            queueNumber={q.number}
                                            patientName={q.patient}
                                            patientAge={q.age}
                                            department={q.dept}
                                            note={[q.doctor ? `BS: ${q.doctor}` : "", q.room && q.room !== "—" ? `Phòng ${q.room}` : ""].filter(Boolean).join(" • ")}
                                            waitMinutes={typeof q.waitTime === "number" ? q.waitTime : undefined}
                                            priority={(isPriority ? "urgent" : "normal") as QueuePriority}
                                            status={(q.status === "examining" ? "examining" : q.status === "completed" ? "done" : q.status === "checked_in" ? "called" : "waiting") as QueueStatus}
                                            onCall={q.status === "waiting" ? () => handleCall(q.id) : undefined}
                                            onSkip={q.status === "waiting" ? () => handleCancel(q.id) : undefined}
                                            onDetail={() => { setTransferModal({ id: q.id, type: "doctor" }); setTransferTarget(""); }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
                {viewMode === "table" && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-[#dde0e4] dark:border-[#2d353e]">
                            {["STT", "Bệnh nhân", "Tiếp nhận", "BS / Phòng", "Chờ", "Trạng thái", "Thao tác"].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#687582]">
                                    <span className="material-symbols-outlined text-[40px] mb-2 block">event_busy</span>
                                    <p className="text-sm">Hàng đợi trống</p>
                                </td></tr>
                            )}
                            {filtered.map(q => {
                                const isPriority = q.age >= 60 || q.age <= 6;
                                return (
                                    <tr key={q.id} className={`border-b border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${isPriority ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#3C81C6]/10 text-[#3C81C6] font-bold text-sm">{q.number}</span>
                                                {isPriority && <span className="material-symbols-outlined text-red-500 text-[16px]" title={q.age <= 6 ? "Trẻ em" : "Người cao tuổi"}>priority_high</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><p className="text-sm font-semibold text-[#121417] dark:text-white">{q.patient}</p><p className="text-xs text-[#687582]">{q.age} tuổi</p></td>
                                        <td className="px-4 py-3 text-sm font-medium text-[#121417] dark:text-white">{q.checkInTime}</td>
                                        <td className="px-4 py-3"><p className="text-sm text-[#121417] dark:text-white">{q.doctor}</p><p className="text-xs text-[#687582]">{q.dept} • {q.room}</p></td>
                                        <td className="px-4 py-3 text-sm text-[#687582] font-medium">{q.waitTime}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CFG[q.status]?.cls}`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{STATUS_CFG[q.status]?.icon}</span>
                                                {STATUS_CFG[q.status]?.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {q.status === "waiting" && <button onClick={() => handleCall(q.id)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors" title="Gọi"><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>campaign</span></button>}
                                                <button onClick={() => { setTransferModal({ id: q.id, type: "doctor" }); setTransferTarget(""); }} className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 text-purple-600 transition-colors" title="Chuyển BS">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>swap_horiz</span>
                                                </button>
                                                <button onClick={() => { setTransferModal({ id: q.id, type: "dept" }); setTransferTarget(""); }} className="p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-500/10 text-teal-600 transition-colors" title="Chuyển khoa">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>domain</span>
                                                </button>
                                                <button onClick={() => handleCancel(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors" title="Hủy"><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                )}
            </div>

            {/* Transfer Modal */}
            {transferModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setTransferModal(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]">{transferModal.type === "doctor" ? "swap_horiz" : "domain"}</span>
                                {transferModal.type === "doctor" ? "Chuyển bác sĩ" : "Chuyển khoa"}
                            </h3>
                            <p className="text-xs text-[#687582] mt-1">BN: {queue.find(q => q.id === transferModal.id)?.patient}</p>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="px-4 py-3">
                                <input
                                    type="text"
                                    value={transferTarget}
                                    onChange={e => setTransferTarget(e.target.value)}
                                    placeholder={transferModal.type === "doctor" ? "Nhập tên bác sĩ..." : "Nhập tên khoa..."}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-[#121417] dark:text-white bg-white dark:bg-[#13191f] focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30"
                                />
                            </div>
                        </div>
                        <div className="p-5 border-t border-[#dde0e4] dark:border-[#2d353e] flex justify-end gap-3">
                            <button onClick={() => setTransferModal(null)} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Huỷ</button>
                            <button onClick={handleTransfer} disabled={!transferTarget} className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-lg disabled:opacity-40 transition-colors">Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div></div>
    );
}
