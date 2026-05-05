"use client";

/**
 * Room Status — Minimal & Compact UI
 * Implemented force release room action.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/layout";
import { appointmentStatusService } from "@/services/appointmentStatusService";
import toast from "react-hot-toast";

// Subtle, minimal status styling
const STATUS_META: Record<string, { label: string; color: string }> = {
    AVAILABLE: { label: "Trống", color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800" },
    IDLE: { label: "Trống", color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800" },
    OCCUPIED: { label: "Đang khám", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800" },
    ACTIVE: { label: "Đang hoạt động", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800" },
    BUSY: { label: "Quá tải", color: "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-900/20 dark:border-rose-800" },
    SLOW: { label: "Chậm", color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800" },
    CLOSED: { label: "Đóng", color: "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-900/20 dark:border-slate-800" },
};

export default function ReceptionistRoomStatusPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [view, setView] = useState<"card" | "table">("card");
    const [loading, setLoading] = useState(true);
    const [isReleasing, setIsReleasing] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await appointmentStatusService.getRoomStatus();
            const data = (r as any)?.data ?? r;
            setRooms(Array.isArray(data) ? data : []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleReleaseRoom = async (roomId: string, roomName: string) => {
        if (!window.confirm(`Bạn có chắc muốn giải phóng phòng ${roomName}? Trạng thái phòng sẽ được cập nhật thành 'Trống'.`)) {
            return;
        }
        setIsReleasing(roomId);
        try {
            await appointmentStatusService.forceReleaseRoom(roomId);
            toast.success(`Đã giải phóng ${roomName} thành công.`);
            load();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi khi giải phóng phòng");
        } finally {
            setIsReleasing(null);
        }
    };

    const stats = {
        total: rooms.length,
        active: rooms.filter((r: any) => {
            const s = (r.status ?? "").toUpperCase();
            return s === "ACTIVE" || s === "OCCUPIED" || r.is_active;
        }).length,
        busy: rooms.filter((r: any) => (r.status ?? "").toUpperCase() === "BUSY").length,
        idle: rooms.filter((r: any) => {
            const s = (r.status ?? "").toUpperCase();
            return s === "IDLE" || s === "AVAILABLE" || (!r.is_active && !r.waiting_count);
        }).length,
    };

    return (
        <div className="p-4 md:p-6 max-w-[1200px] mx-auto min-h-screen bg-slate-50/30 dark:bg-[#12161b]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[22px] text-slate-500">meeting_room</span>
                        Tình trạng phòng khám
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Giám sát hoạt động và điều phối phòng khám</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={load} 
                        disabled={loading}
                        className="px-3 py-1.5 text-sm font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        Làm mới
                    </button>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded p-0.5 border border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => setView("card")} 
                            className={`px-3 py-1 text-sm font-medium rounded-sm transition-all flex items-center gap-1.5 ${view === "card" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">grid_view</span>
                            Lưới
                        </button>
                        <button 
                            onClick={() => setView("table")} 
                            className={`px-3 py-1 text-sm font-medium rounded-sm transition-all flex items-center gap-1.5 ${view === "table" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">table_rows</span>
                            Bảng
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng phòng</span>
                    <span className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-1">{stats.total}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Đang hoạt động</span>
                    <span className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Quá tải</span>
                    <span className="text-xl font-semibold text-rose-600 dark:text-rose-400 mt-1">{stats.busy}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Phòng trống</span>
                    <span className="text-xl font-semibold text-blue-600 dark:text-blue-400 mt-1">{stats.idle}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex py-12 justify-center">
                    <span className="material-symbols-outlined text-3xl animate-spin text-slate-400">progress_activity</span>
                </div>
            ) : rooms.length === 0 ? (
                <EmptyState icon="meeting_room" title="Chưa có dữ liệu" description="Không tìm thấy thông tin phòng khám nào." />
            ) : view === "card" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map((r: any, i: number) => {
                        const status = (r.status ?? (r.is_active ? "ACTIVE" : "IDLE")).toUpperCase();
                        const meta = STATUS_META[status] ?? { label: status, color: "text-slate-600 bg-slate-50 border-slate-200" };
                        const isOccupied = status === "OCCUPIED" || status === "ACTIVE";
                        const isBusyReleasing = isReleasing === r.id;

                        return (
                            <div key={r.id ?? i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base">{r.room_name ?? r.name ?? "Phòng"}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                            <span className="material-symbols-outlined text-[12px]">person</span>
                                            {r.doctor_name ?? "Chưa phân bổ"}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${meta.color}`}>
                                        {meta.label}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-4 py-2 my-2 border-y border-slate-100 dark:border-slate-700/50">
                                    <div className="flex-1">
                                        <span className="text-[11px] text-slate-500">Chờ khám</span>
                                        <div className="text-lg font-semibold text-slate-700 dark:text-slate-300">{r.waiting_count ?? 0}</div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100 dark:bg-slate-700"></div>
                                    <div className="flex-1">
                                        <span className="text-[11px] text-slate-500">Hoàn thành</span>
                                        <div className="text-lg font-semibold text-slate-700 dark:text-slate-300">{r.completed_count ?? 0}</div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-2 flex justify-end gap-2">
                                    {isOccupied && r.id && (
                                        <button 
                                            onClick={() => handleReleaseRoom(r.id, r.room_name ?? r.name)}
                                            disabled={isBusyReleasing}
                                            className="text-xs font-medium px-2.5 py-1.5 rounded text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            title="Giải phóng phòng kẹt trạng thái"
                                        >
                                            {isBusyReleasing ? (
                                                <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-[14px]">lock_open_right</span>
                                            )}
                                            Giải phóng
                                        </button>
                                    )}
                                    <Link href={`/portal/receptionist/queue?room=${r.room_name ?? r.id}`} className="text-xs font-medium px-2.5 py-1.5 rounded text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">queue</span>
                                        Hàng đợi
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">Phòng khám</th>
                                <th className="text-left font-medium px-4 py-3">Bác sĩ</th>
                                <th className="text-center font-medium px-4 py-3">Chờ khám</th>
                                <th className="text-center font-medium px-4 py-3">Hoàn thành</th>
                                <th className="text-left font-medium px-4 py-3">Trạng thái</th>
                                <th className="text-right font-medium px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {rooms.map((r: any, i: number) => {
                                const status = (r.status ?? (r.is_active ? "ACTIVE" : "IDLE")).toUpperCase();
                                const meta = STATUS_META[status] ?? { label: status, color: "text-slate-600 bg-slate-50 border-slate-200" };
                                const isOccupied = status === "OCCUPIED" || status === "ACTIVE";
                                const isBusyReleasing = isReleasing === r.id;

                                return (
                                    <tr key={r.id ?? i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                            {r.room_name ?? r.name}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                            {r.doctor_name ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium">
                                            {r.waiting_count ?? 0}
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium">
                                            {r.completed_count ?? 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${meta.color}`}>
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {isOccupied && r.id && (
                                                    <button 
                                                        onClick={() => handleReleaseRoom(r.id, r.room_name ?? r.name)}
                                                        disabled={isBusyReleasing}
                                                        className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50 transition-colors"
                                                        title="Giải phóng phòng"
                                                    >
                                                        <span className={`material-symbols-outlined text-[16px] ${isBusyReleasing ? 'animate-spin' : ''}`}>
                                                            {isBusyReleasing ? 'progress_activity' : 'lock_open_right'}
                                                        </span>
                                                    </button>
                                                )}
                                                <Link 
                                                    href={`/portal/receptionist/queue?room=${r.room_name ?? r.id}`} 
                                                    className="p-1.5 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                    title="Hàng đợi"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">queue</span>
                                                </Link>
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
    );
}
