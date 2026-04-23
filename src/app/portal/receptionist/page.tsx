"use client";

/**
 * Receptionist Dashboard — Phase J.1 #1.
 * Spec: dòng 10033-10134.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/layout";
import { appointmentStatusService } from "@/services/appointmentStatusService";

const QUICK_ACTIONS = [
    { icon: "person_search", label: "Tra cứu BN", href: "/portal/receptionist/patients", color: "from-blue-500 to-blue-600" },
    { icon: "event_available", label: "Đặt lịch tại quầy", href: "/portal/receptionist/appointments/new", color: "from-emerald-500 to-emerald-600" },
    { icon: "qr_code_scanner", label: "Check-in", href: "/portal/receptionist/check-in", color: "from-amber-500 to-amber-600" },
    { icon: "groups", label: "Queue hôm nay", href: "/portal/receptionist/queue", color: "from-violet-500 to-violet-600" },
    { icon: "meeting_room", label: "Room status", href: "/portal/receptionist/room-status", color: "from-pink-500 to-pink-600" },
    { icon: "receipt_long", label: "Thu phí", href: "/portal/receptionist/billing", color: "from-cyan-500 to-cyan-600" },
];

export default function ReceptionistDashboard() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            appointmentStatusService.getDashboardToday(),
            appointmentStatusService.getRoomStatus(),
        ]).then(([d, r]) => {
            if (d.status === "fulfilled") setDashboard((d.value as any)?.data ?? d.value);
            if (r.status === "fulfilled") {
                const data = (r.value as any)?.data ?? r.value;
                setRooms(Array.isArray(data) ? data : []);
            }
            setLoading(false);
        });
    }, []);

    const stats = {
        total: dashboard?.total_today ?? dashboard?.total ?? 0,
        waiting: dashboard?.waiting ?? 0,
        checkedIn: dashboard?.checked_in ?? 0,
        rooms: rooms.length,
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Quầy tiếp đón"
                subtitle={`Xin chào ${user?.fullName ?? user?.email ?? "lễ tân"} — tổng quan tiếp nhận hôm nay.`}
                icon="contact_emergency"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Lịch hôm nay" value={stats.total} icon="event" color="blue" loading={loading} href="/portal/receptionist/appointments" />
                <StatCard label="Đang chờ" value={stats.waiting} icon="hourglass_empty" color="amber" loading={loading} href="/portal/receptionist/queue" />
                <StatCard label="Đã check-in" value={stats.checkedIn} icon="how_to_reg" color="emerald" loading={loading} href="/portal/receptionist/queue" />
                <StatCard label="Phòng hoạt động" value={stats.rooms} icon="meeting_room" color="violet" loading={loading} href="/portal/receptionist/room-status" />
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-bold mb-3 text-[#121417] dark:text-white">Quick actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {QUICK_ACTIONS.map(a => (
                        <Link key={a.label} href={a.href} className="group bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4 hover:shadow-md hover:border-[#3C81C6]/40 transition-all text-center">
                            <div className={`mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} text-white mb-2 group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-outlined text-[24px]">{a.icon}</span>
                            </div>
                            <p className="text-xs font-medium text-[#121417] dark:text-white">{a.label}</p>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[#3C81C6]">summarize</span>
                        <h3 className="text-sm font-bold flex-1">Tóm tắt theo trạng thái</h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                        {[
                            { label: "Chờ xác nhận", value: dashboard?.pending ?? 0, color: "text-amber-600" },
                            { label: "Đã xác nhận", value: dashboard?.confirmed ?? 0, color: "text-blue-600" },
                            { label: "Đang khám", value: dashboard?.in_progress ?? 0, color: "text-violet-600" },
                            { label: "Hoàn tất", value: dashboard?.completed ?? 0, color: "text-emerald-600" },
                            { label: "No-show", value: dashboard?.no_show ?? 0, color: "text-rose-600" },
                            { label: "Huỷ", value: dashboard?.cancelled ?? 0, color: "text-slate-600" },
                        ].map(s => (
                            <div key={s.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                <p className="text-xs text-[#687582]">{s.label}</p>
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-violet-600">meeting_room</span>
                        <h3 className="text-sm font-bold flex-1">Tình trạng phòng ({rooms.length})</h3>
                        <Link href="/portal/receptionist/room-status" className="text-xs text-[#3C81C6] hover:underline">Xem tất cả →</Link>
                    </div>
                    {rooms.length === 0 ? <EmptyState icon="meeting_room" title="Không có dữ liệu phòng" compact />
                    : (
                        <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {rooms.slice(0, 6).map((r: any, i: number) => (
                                <li key={r.id ?? i} className="px-4 py-2.5 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{r.room_name ?? r.name ?? "Phòng"}</p>
                                        <p className="text-xs text-[#687582]">{r.doctor_name ?? "—"} · {r.waiting_count ?? 0} chờ</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${(r.status === "ACTIVE" || r.is_active) ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                                        {r.status ?? (r.is_active ? "Hoạt động" : "Trống")}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
