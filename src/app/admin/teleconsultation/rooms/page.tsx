"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { TELE_ROOM_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

interface ActiveRoom {
    id: string;
    code: string;
    patientName: string;
    doctorName: string;
    startedAt: string;
    durationMinutes: number;
    participantCount: number;
    status: "OPEN" | "WAITING" | "IN_CALL";
}

function mapRoom(r: any): ActiveRoom {
    const started = r.started_at ?? r.opened_at ?? "";
    const now = Date.now();
    const startedTs = started ? new Date(started).getTime() : now;
    return {
        id: String(r.consultation_id ?? r.id ?? ""),
        code: r.code ?? r.session_code ?? "",
        patientName: r.patient_name ?? r.patientName ?? "—",
        doctorName: r.doctor_name ?? r.doctorName ?? "—",
        startedAt: started,
        durationMinutes: Math.max(0, Math.round((now - startedTs) / 60000)),
        participantCount: Number(r.participant_count ?? r.participantCount ?? 0),
        status: (r.status ?? "OPEN").toUpperCase() === "IN_CALL" || r.in_call ? "IN_CALL" : (r.status === "WAITING" ? "WAITING" : "OPEN"),
    };
}

export default function TeleRoomsPage() {
    const toast = useToast();
    const t = useTranslations("pages.tele.rooms");
    const tc = useTranslations("common");
    const [rooms, setRooms] = useState<ActiveRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(TELE_ROOM_ENDPOINTS.ACTIVE);
            const { data } = unwrapList<any>(res);
            setRooms(data.map(mapRoom));
        } catch {
            setError("Không tải được room đang hoạt động.");
            setRooms([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        load();
        const int = setInterval(load, 30000); // auto refresh 30s
        return () => clearInterval(int);
    }, [load]);

    const handleClose = async (r: ActiveRoom) => {
        if (!confirm(`Đóng room ${r.code}?`)) return;
        try {
            await axiosClient.post(TELE_ROOM_ENDPOINTS.CLOSE(r.id));
            toast.success("Đã đóng room."); await load();
        } catch { toast.error("Không đóng được."); }
    };

    const stats = {
        active: rooms.length,
        inCall: rooms.filter((r) => r.status === "IN_CALL").length,
        waiting: rooms.filter((r) => r.status === "WAITING").length,
        avgDuration: rooms.length ? Math.round(rooms.reduce((s, r) => s + r.durationMinutes, 0) / rooms.length) : 0,
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="videocam"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
                actions={
                    <button onClick={load} className="px-4 py-2 text-sm font-semibold text-[#3C81C6] border border-[#3C81C6]/40 hover:bg-[#3C81C6]/10 rounded-xl inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>refresh</span>
                        Refresh
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Đang hoạt động" value={stats.active} icon="videocam" color="blue" loading={loading} />
                <StatCard label="Đang gọi" value={stats.inCall} icon="call" color="emerald" loading={loading} />
                <StatCard label="Chờ" value={stats.waiting} icon="hourglass_top" color="amber" loading={loading} />
                <StatCard label="Thời lượng TB" value={stats.avgDuration + " ph"} icon="timer" color="violet" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-200">{error}</div>}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : rooms.length === 0 ? (
                <EmptyState icon="videocam_off" title="Không có room nào đang hoạt động" description="Tất cả phiên khám online đã đóng." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rooms.map((r) => (
                        <div key={r.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                            <div className={`h-1.5 bg-gradient-to-r ${r.status === "IN_CALL" ? "from-emerald-500 to-teal-500" : "from-amber-500 to-orange-500"}`} />
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${r.status === "IN_CALL" ? "from-emerald-500 to-teal-500 animate-pulse" : "from-amber-500 to-orange-500"}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>videocam</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#121417] dark:text-white">{r.patientName}</div>
                                            <div className="text-xs text-[#687582]">BS. {r.doctorName}</div>
                                        </div>
                                    </div>
                                    <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${r.status === "IN_CALL" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                        {r.status === "IN_CALL" ? "ĐANG GỌI" : "CHỜ"}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                    <div className="text-[#687582]">Thời lượng<div className="font-mono font-bold text-[#121417] dark:text-white">{r.durationMinutes} phút</div></div>
                                    <div className="text-[#687582]">Người tham gia<div className="font-mono font-bold text-[#121417] dark:text-white">{r.participantCount}</div></div>
                                </div>
                                <div className="flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <a href={`/portal/doctor/telemedicine/${r.id}`} className="flex-1 text-center px-3 py-1.5 text-xs text-[#3C81C6] hover:bg-[#3C81C6]/10 rounded-md">Xem chi tiết</a>
                                    <button onClick={() => handleClose(r)} className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">Đóng room</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
