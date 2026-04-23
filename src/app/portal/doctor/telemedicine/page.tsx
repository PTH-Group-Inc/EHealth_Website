"use client";

/**
 * Telemedicine Hub — Phase I.6 Nhóm 6 (entry).
 * Spec: dòng 7013-7676. Hub điều phối 7 module:
 * - Booking, Room, Results, Prescriptions, Follow-ups, Medical Chat, Quality.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, StatCard } from "@/components/shared/layout";
import { teleFollowupService } from "@/services/teleFollowupService";
import { teleQualityService } from "@/services/teleQualityService";
import { telemedicineService } from "@/services/telemedicineService";

const MODULES = [
    { key: "bookings", label: "Booking", icon: "event_available", desc: "Phiên khám online đã đặt", color: "from-blue-500 to-blue-600" },
    { key: "results", label: "Kết quả khám", icon: "fact_check", desc: "Ghi nhận & ký kết quả phiên khám", color: "from-violet-500 to-violet-600" },
    { key: "prescriptions", label: "Đơn thuốc từ xa", icon: "medication", desc: "Kê đơn + lab orders + referral", color: "from-emerald-500 to-emerald-600" },
    { key: "follow-ups", label: "Follow-up", icon: "follow_the_signs", desc: "Theo dõi sau khám online", color: "from-amber-500 to-amber-600" },
    { key: "chat", label: "Medical Chat", icon: "chat", desc: "Tư vấn không đồng bộ với bệnh nhân", color: "from-pink-500 to-pink-600" },
    { key: "quality", label: "Chất lượng", icon: "thumb_up", desc: "Quality metrics & review", color: "from-cyan-500 to-cyan-600" },
];

export default function DoctorTelemedicineHub() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ todayBookings: 0, pendingFollowUps: 0, attentionUpdates: 0, avgRating: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        const today = new Date().toISOString().slice(0, 10);
        Promise.allSettled([
            telemedicineService.getList({ doctorId: user.id, from: today, to: today }),
            teleFollowupService.getStats(),
            teleFollowupService.getAttentionUpdates(),
            teleQualityService.getDoctorMetrics(user.id),
        ]).then(([b, fs, au, q]) => {
            const todayBookings = b.status === "fulfilled" ? ((b.value as any)?.data?.length ?? 0) : 0;
            const pending = fs.status === "fulfilled" ? ((fs.value as any)?.pending ?? (fs.value as any)?.upcoming ?? 0) : 0;
            const attn = au.status === "fulfilled" ? ((au.value as any)?.data?.length ?? 0) : 0;
            const rating = q.status === "fulfilled" ? ((q.value as any)?.average_rating ?? (q.value as any)?.avg_rating ?? 0) : 0;
            setStats({ todayBookings, pendingFollowUps: pending, attentionUpdates: attn, avgRating: rating });
            setLoading(false);
        });
    }, [user?.id]);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Telemedicine"
                subtitle="Trung tâm khám online: booking, room, kết quả, đơn thuốc, follow-up, chat, chất lượng."
                icon="videocam"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Telemedicine" },
                ]}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Booking hôm nay" value={stats.todayBookings} icon="event_available" color="blue" loading={loading} href="/portal/doctor/telemedicine/bookings" />
                <StatCard label="Follow-up chờ" value={stats.pendingFollowUps} icon="follow_the_signs" color="amber" loading={loading} href="/portal/doctor/telemedicine/follow-ups" />
                <StatCard label="Updates cần xem" value={stats.attentionUpdates} icon="priority_high" color="red" loading={loading} href="/portal/doctor/telemedicine/follow-ups" />
                <StatCard label="Rating TB" value={stats.avgRating ? Number(stats.avgRating).toFixed(1) : "—"} icon="thumb_up" color="emerald" loading={loading} href="/portal/doctor/telemedicine/quality" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MODULES.map(m => (
                    <Link key={m.key} href={`/portal/doctor/telemedicine/${m.key}`} className="group bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-2xl p-5 hover:shadow-md hover:border-[#3C81C6]/40 transition-all">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} text-white mb-3 group-hover:scale-110 transition-transform`}>
                            <span className="material-symbols-outlined text-[24px]">{m.icon}</span>
                        </div>
                        <h3 className="text-base font-bold text-[#121417] dark:text-white">{m.label}</h3>
                        <p className="text-xs text-[#687582] mt-1">{m.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
