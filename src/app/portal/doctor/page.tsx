"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/layout";
import { appointmentStatusService } from "@/services/appointmentStatusService";
import { medicalSignoffService } from "@/services/medicalSignoffService";
import { teleFollowupService } from "@/services/teleFollowupService";
import { teleQualityService } from "@/services/teleQualityService";

interface DashboardTodayData {
    total?: number;
    upcoming?: number;
    completed?: number;
    waiting?: number;
    in_progress?: number;
    inProgress?: number;
    by_room?: Array<{ room_id?: string; room_name?: string; waiting?: number; total?: number }>;
    byRoom?: Array<any>;
    [key: string]: any;
}

interface PendingSignoff {
    encounter_id?: string;
    encounterId?: string;
    patient_name?: string;
    patientName?: string;
    encounter_date?: string;
    encounterDate?: string;
    status?: string;
    [key: string]: any;
}

interface QualityMetrics {
    quality_score?: number;
    qualityScore?: number;
    connection_alerts?: number;
    connectionAlerts?: number;
    sessions_with_issues?: number;
    sessionsWithIssues?: number;
    [key: string]: any;
}

const fmtDate = (v?: string) => {
    if (!v) return "—";
    try {
        return new Date(v).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return v;
    }
};

export default function DoctorDashboardPage() {
    const { user } = useAuth();
    const [dashboardToday, setDashboardToday] = useState<DashboardTodayData | null>(null);
    const [pendingSignoffs, setPendingSignoffs] = useState<PendingSignoff[]>([]);
    const [followUpStats, setFollowUpStats] = useState<any>(null);
    const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        let alive = true;
        setLoading(true);

        Promise.allSettled([
            appointmentStatusService.getDashboardToday(),
            medicalSignoffService.getPending({ limit: 10 }),
            teleFollowupService.getStats(),
            teleQualityService.getDoctorMetrics(user.id),
        ]).then(([dash, signoff, followUp, quality]) => {
            if (!alive) return;
            if (dash.status === "fulfilled") {
                const payload = (dash.value as any)?.data ?? dash.value;
                setDashboardToday(payload ?? null);
            }
            if (signoff.status === "fulfilled") {
                setPendingSignoffs(signoff.value?.data ?? []);
            }
            if (followUp.status === "fulfilled") {
                setFollowUpStats(followUp.value ?? null);
            }
            if (quality.status === "fulfilled") {
                setQualityMetrics(quality.value ?? null);
            }
            setLoading(false);
        });

        return () => {
            alive = false;
        };
    }, [user?.id]);

    const todayTotal = dashboardToday?.total ?? 0;
    const todayWaiting = dashboardToday?.waiting ?? dashboardToday?.in_progress ?? dashboardToday?.inProgress ?? 0;
    const todayUpcoming = dashboardToday?.upcoming ?? 0;
    const todayCompleted = dashboardToday?.completed ?? 0;

    const pendingSignoffCount = pendingSignoffs.length;
    const followUpActive = followUpStats?.active ?? followUpStats?.total ?? 0;
    const followUpUpcoming = followUpStats?.upcoming ?? 0;
    const followUpNeedResponse = followUpStats?.need_response ?? followUpStats?.needResponse ?? 0;

    const qualityAlerts =
        qualityMetrics?.connection_alerts ??
        qualityMetrics?.connectionAlerts ??
        qualityMetrics?.sessions_with_issues ??
        qualityMetrics?.sessionsWithIssues ??
        0;
    const qualityScore = qualityMetrics?.quality_score ?? qualityMetrics?.qualityScore;

    const byRoom = dashboardToday?.by_room ?? dashboardToday?.byRoom ?? [];

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-5">
                <PageHeader
                    title="Bảng điều khiển bác sĩ"
                    subtitle="Tổng quan khối lượng việc, hồ sơ chờ ký và cảnh báo hôm nay"
                    icon="dashboard"
                />

                {/* KPI row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    <StatCard
                        label="Lịch khám hôm nay"
                        value={loading ? "—" : todayTotal}
                        icon="event"
                        color="blue"
                        href={ROUTES.PORTAL.DOCTOR.APPOINTMENTS}
                        loading={loading}
                    />
                    <StatCard
                        label="Ca đang chờ"
                        value={loading ? "—" : todayWaiting}
                        icon="groups"
                        color="amber"
                        href={ROUTES.PORTAL.DOCTOR.QUEUE}
                        loading={loading}
                    />
                    <StatCard
                        label="Hồ sơ chờ ký"
                        value={loading ? "—" : pendingSignoffCount}
                        icon="draw"
                        color="red"
                        href={ROUTES.PORTAL.DOCTOR.MEDICAL_RECORDS}
                        loading={loading}
                    />
                    <StatCard
                        label="Follow-up cần xử lý"
                        value={loading ? "—" : followUpNeedResponse || followUpActive}
                        icon="assignment_turned_in"
                        color="violet"
                        href={ROUTES.PORTAL.DOCTOR.TASKS}
                        loading={loading}
                    />
                    <StatCard
                        label="Cảnh báo Telemedicine"
                        value={loading ? "—" : qualityAlerts}
                        icon="video_call"
                        color={qualityAlerts > 0 ? "red" : "emerald"}
                        href={ROUTES.PORTAL.DOCTOR.ALERTS}
                        loading={loading}
                        footer={
                            qualityScore != null ? (
                                <p className="text-[11px] text-[#687582] dark:text-gray-500">
                                    Điểm chất lượng: <span className="font-bold text-[#121417] dark:text-white">{qualityScore}</span>
                                </p>
                            ) : undefined
                        }
                    />
                </div>

                {/* Block chính */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Block 1: Tóm tắt lịch khám hôm nay */}
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                        <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-blue-600 text-[20px]">event_note</span>
                                </div>
                                <h3 className="text-sm font-bold text-[#121417] dark:text-white">Lịch khám hôm nay</h3>
                            </div>
                            <Link
                                href={ROUTES.PORTAL.DOCTOR.APPOINTMENTS}
                                className="text-xs font-semibold text-[#3C81C6] hover:underline"
                            >
                                Xem tất cả
                            </Link>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-[#f6f7f8] dark:bg-[#13191f] p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-[#687582] dark:text-gray-500 font-semibold">Tổng ca</p>
                                    <p className="text-2xl font-bold text-[#121417] dark:text-white">{loading ? "—" : todayTotal}</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">Đã xong</p>
                                    <p className="text-2xl font-bold text-emerald-600">{loading ? "—" : todayCompleted}</p>
                                </div>
                                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">Đang chờ</p>
                                    <p className="text-2xl font-bold text-amber-600">{loading ? "—" : todayWaiting}</p>
                                </div>
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold">Sắp đến</p>
                                    <p className="text-2xl font-bold text-blue-600">{loading ? "—" : todayUpcoming}</p>
                                </div>
                            </div>

                            {byRoom.length > 0 && (
                                <div className="pt-2 border-t border-[#f0f1f3] dark:border-[#2d353e]">
                                    <p className="text-[10px] uppercase tracking-wider text-[#687582] dark:text-gray-500 font-semibold mb-2">Theo phòng</p>
                                    <div className="space-y-1.5">
                                        {byRoom.slice(0, 5).map((r: any, i: number) => (
                                            <div key={r.room_id ?? r.roomId ?? i} className="flex items-center justify-between text-xs">
                                                <span className="text-[#121417] dark:text-white">{r.room_name ?? r.roomName ?? `Phòng ${i + 1}`}</span>
                                                <span className="text-[#687582] dark:text-gray-500">
                                                    {(r.waiting ?? 0)}/{(r.total ?? 0)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Block 2: Hồ sơ chờ ký */}
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                        <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-red-500 text-[20px]">draw</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Hồ sơ chờ ký</h3>
                                    <p className="text-[11px] text-[#687582] dark:text-gray-500">{pendingSignoffCount} hồ sơ đang treo</p>
                                </div>
                            </div>
                            <Link
                                href={ROUTES.PORTAL.DOCTOR.MEDICAL_RECORDS}
                                className="text-xs font-semibold text-[#3C81C6] hover:underline"
                            >
                                Xem tất cả
                            </Link>
                        </div>
                        <div className="p-2 max-h-[320px] overflow-y-auto">
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : pendingSignoffs.length === 0 ? (
                                <EmptyState
                                    icon="check_circle"
                                    variant="success"
                                    title="Không còn hồ sơ nào chờ ký"
                                    compact
                                />
                            ) : (
                                <ul className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                                    {pendingSignoffs.slice(0, 8).map((s, i) => {
                                        const id = s.encounterId ?? s.encounter_id ?? `row-${i}`;
                                        const name = s.patientName ?? s.patient_name ?? "(chưa có tên)";
                                        const date = fmtDate(s.encounterDate ?? s.encounter_date);
                                        return (
                                            <li key={id} className="px-3 py-2.5 flex items-center gap-3 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] rounded-lg transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                                                    <span className="material-symbols-outlined text-red-500 text-[16px]">person</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{name}</p>
                                                    <p className="text-[11px] text-[#687582] dark:text-gray-500">#{id} • {date}</p>
                                                </div>
                                                <Link
                                                    href={`${ROUTES.PORTAL.DOCTOR.MEDICAL_RECORDS}?encounterId=${id}`}
                                                    className="text-[11px] font-semibold text-[#3C81C6] hover:underline whitespace-nowrap"
                                                >
                                                    Đi ký →
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Block 3: Follow-up + Telemedicine quality */}
                    <div className="space-y-5">
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                                        <span className="material-symbols-outlined text-violet-600 text-[20px]">assignment_turned_in</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Follow-up</h3>
                                </div>
                                <Link
                                    href={ROUTES.PORTAL.DOCTOR.TASKS}
                                    className="text-xs font-semibold text-[#3C81C6] hover:underline"
                                >
                                    Xem tất cả
                                </Link>
                            </div>
                            <div className="p-4 grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="text-xl font-bold text-violet-600">{loading ? "—" : followUpActive}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-[#687582] dark:text-gray-500 font-semibold">Active</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-amber-600">{loading ? "—" : followUpUpcoming}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-[#687582] dark:text-gray-500 font-semibold">Sắp hạn</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-red-500">{loading ? "—" : followUpNeedResponse}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-[#687582] dark:text-gray-500 font-semibold">Cần PH</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                        <span className="material-symbols-outlined text-emerald-600 text-[20px]">video_call</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white">Chất lượng Telemedicine</h3>
                                </div>
                                <Link
                                    href={ROUTES.PORTAL.DOCTOR.TELEMEDICINE}
                                    className="text-xs font-semibold text-[#3C81C6] hover:underline"
                                >
                                    Chi tiết
                                </Link>
                            </div>
                            <div className="p-4 space-y-2.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[#687582] dark:text-gray-400">Điểm chất lượng</span>
                                    <span className="font-bold text-[#121417] dark:text-white">
                                        {qualityScore != null ? qualityScore : "—"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[#687582] dark:text-gray-400">Cảnh báo kết nối</span>
                                    <span className={`font-bold ${qualityAlerts > 0 ? "text-red-500" : "text-emerald-600"}`}>
                                        {loading ? "—" : qualityAlerts}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[#687582] dark:text-gray-400">Phiên có vấn đề</span>
                                    <span className="font-bold text-[#121417] dark:text-white">
                                        {loading
                                            ? "—"
                                            : (qualityMetrics?.sessions_with_issues ?? qualityMetrics?.sessionsWithIssues ?? 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
