"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import { medicalSignoffService } from "@/services/medicalSignoffService";
import { teleFollowupService } from "@/services/teleFollowupService";
import { teleQualityService } from "@/services/teleQualityService";

type AlertTab = "records" | "followups" | "telemedicine";

type Priority = "low" | "normal" | "high" | "urgent";

interface AlertItem {
    id: string;
    priority: Priority;
    icon: string;
    title: string;
    description?: string;
    meta?: string;
    actionLabel?: string;
    actionHref?: string;
}

const PRIORITY_STYLE: Record<Priority, { label: string; chip: string; border: string }> = {
    urgent: { label: "Khẩn", chip: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", border: "border-l-4 border-red-500" },
    high: { label: "Cao", chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", border: "border-l-4 border-amber-500" },
    normal: { label: "Bình thường", chip: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", border: "border-l-4 border-blue-400" },
    low: { label: "Thấp", chip: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", border: "border-l-4 border-gray-300 dark:border-gray-700" },
};

const fmtDateTime = (v?: string) => {
    if (!v) return "";
    try {
        return new Date(v).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
        return v;
    }
};

function AlertRow({ item }: { item: AlertItem }) {
    const p = PRIORITY_STYLE[item.priority];
    return (
        <li className={`flex items-center gap-3 px-4 py-3 ${p.border} hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors`}>
            <div className="p-2 rounded-lg bg-white dark:bg-[#0f1419] border border-[#e5e7eb] dark:border-[#2d353e] flex-shrink-0">
                <span className="material-symbols-outlined text-[20px] text-[#687582] dark:text-gray-400">{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{item.title}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${p.chip}`}>
                        {p.label}
                    </span>
                </div>
                {item.description && (
                    <p className="text-xs text-[#687582] dark:text-gray-400 truncate">{item.description}</p>
                )}
                {item.meta && (
                    <p className="text-[11px] text-[#687582] dark:text-gray-500 mt-0.5">{item.meta}</p>
                )}
            </div>
            {item.actionHref && (
                <Link
                    href={item.actionHref}
                    className="text-xs font-semibold text-[#3C81C6] hover:underline whitespace-nowrap flex-shrink-0"
                >
                    {item.actionLabel ?? "Xử lý"} →
                </Link>
            )}
        </li>
    );
}

export default function DoctorAlertsPage() {
    const { user } = useAuth();
    const [tab, setTab] = useState<AlertTab>("records");

    const [pendingSignoffs, setPendingSignoffs] = useState<any[]>([]);
    const [followUpStats, setFollowUpStats] = useState<any>(null);
    const [upcomingPlans, setUpcomingPlans] = useState<any[]>([]);
    const [attentionUpdates, setAttentionUpdates] = useState<any[]>([]);
    const [qualityMetrics, setQualityMetrics] = useState<any>(null);
    const [qualityReviews, setQualityReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        let alive = true;
        setLoading(true);

        Promise.allSettled([
            medicalSignoffService.getPending({ limit: 50 }),
            teleFollowupService.getStats(),
            teleFollowupService.getUpcoming({ limit: 30 }),
            teleFollowupService.getAttentionUpdates({ limit: 30 }),
            teleQualityService.getDoctorMetrics(user.id),
            teleQualityService.getDoctorReviews(user.id, { limit: 30 }),
        ]).then(([signoff, stats, upcoming, attention, metrics, reviews]) => {
            if (!alive) return;
            if (signoff.status === "fulfilled") setPendingSignoffs(signoff.value?.data ?? []);
            if (stats.status === "fulfilled") setFollowUpStats(stats.value);
            if (upcoming.status === "fulfilled") setUpcomingPlans(upcoming.value?.data ?? []);
            if (attention.status === "fulfilled") setAttentionUpdates(attention.value?.data ?? []);
            if (metrics.status === "fulfilled") setQualityMetrics(metrics.value);
            if (reviews.status === "fulfilled") setQualityReviews(reviews.value?.data ?? []);
            setLoading(false);
        });

        return () => { alive = false; };
    }, [user?.id]);

    const recordAlerts: AlertItem[] = useMemo(() => {
        const now = Date.now();
        return pendingSignoffs.map((s: any, i: number) => {
            const encounterId = s.encounterId ?? s.encounter_id ?? `enc-${i}`;
            const name = s.patientName ?? s.patient_name ?? "(chưa có tên)";
            const createdStr = s.createdAt ?? s.created_at ?? s.encounterDate ?? s.encounter_date;
            const createdMs = createdStr ? new Date(createdStr).getTime() : null;
            const ageDays = createdMs ? Math.floor((now - createdMs) / (1000 * 60 * 60 * 24)) : 0;
            const priority: Priority = ageDays > 7 ? "urgent" : ageDays > 3 ? "high" : "normal";
            return {
                id: `rec-${encounterId}`,
                priority,
                icon: "draw",
                title: `Hồ sơ chưa ký — ${name}`,
                description: `Encounter #${encounterId}${ageDays > 0 ? ` • treo ${ageDays} ngày` : ""}`,
                meta: createdStr ? `Ngày khám: ${fmtDateTime(createdStr)}` : undefined,
                actionLabel: "Đi ký",
                actionHref: `${ROUTES.PORTAL.DOCTOR.MEDICAL_RECORDS}?encounterId=${encounterId}`,
            };
        });
    }, [pendingSignoffs]);

    const followUpAlerts: AlertItem[] = useMemo(() => {
        const alerts: AlertItem[] = [];
        const now = Date.now();

        attentionUpdates.forEach((u: any, i: number) => {
            const id = u.id ?? `att-${i}`;
            const name = u.patientName ?? u.patient_name ?? "(chưa có tên)";
            alerts.push({
                id: `att-${id}`,
                priority: "high",
                icon: "priority_high",
                title: `Bệnh nhân cần phản hồi — ${name}`,
                description: u.reason ?? "Có cập nhật sức khỏe cần bác sĩ phản hồi",
                meta: u.createdAt ?? u.created_at ? `Lúc: ${fmtDateTime(u.createdAt ?? u.created_at)}` : undefined,
                actionLabel: "Phản hồi",
                actionHref: ROUTES.PORTAL.DOCTOR.TELEMEDICINE,
            });
        });

        upcomingPlans.forEach((p: any, i: number) => {
            const id = p.planId ?? p.plan_id ?? `plan-${i}`;
            const name = p.patientName ?? p.patient_name ?? "(chưa có tên)";
            const dueStr = p.dueAt ?? p.due_at ?? p.scheduledAt ?? p.scheduled_at;
            const dueMs = dueStr ? new Date(dueStr).getTime() : null;
            const diffDays = dueMs ? Math.ceil((dueMs - now) / (1000 * 60 * 60 * 24)) : null;
            const overdue = diffDays != null && diffDays < 0;
            const priority: Priority = overdue ? "urgent" : diffDays != null && diffDays <= 1 ? "high" : "normal";
            alerts.push({
                id: `plan-${id}`,
                priority,
                icon: overdue ? "schedule_off" : "event_upcoming",
                title: overdue
                    ? `Follow-up quá hạn — ${name}`
                    : `Follow-up sắp hạn — ${name}`,
                description: `Plan #${id}${diffDays != null ? (overdue ? ` • quá ${Math.abs(diffDays)} ngày` : ` • còn ${diffDays} ngày`) : ""}`,
                meta: dueStr ? `Hạn: ${fmtDateTime(dueStr)}` : undefined,
                actionLabel: "Xem plan",
                actionHref: ROUTES.PORTAL.DOCTOR.TELEMEDICINE,
            });
        });

        const byPriority = { urgent: 0, high: 1, normal: 2, low: 3 };
        alerts.sort((a, b) => byPriority[a.priority] - byPriority[b.priority]);
        return alerts;
    }, [upcomingPlans, attentionUpdates]);

    const telemedicineAlerts: AlertItem[] = useMemo(() => {
        const alerts: AlertItem[] = [];

        const connectionAlerts =
            qualityMetrics?.connection_alerts ??
            qualityMetrics?.connectionAlerts ??
            qualityMetrics?.alerts ??
            0;
        if (connectionAlerts > 0) {
            alerts.push({
                id: "quality-connection",
                priority: connectionAlerts > 3 ? "urgent" : "high",
                icon: "wifi_off",
                title: `${connectionAlerts} cảnh báo kết nối trong các phiên khám`,
                description: "Phiên có latency cao, mất gói hoặc gián đoạn kết nối",
                actionLabel: "Xem chi tiết",
                actionHref: ROUTES.PORTAL.DOCTOR.TELEMEDICINE,
            });
        }

        const issues =
            qualityMetrics?.sessions_with_issues ??
            qualityMetrics?.sessionsWithIssues ??
            0;
        if (issues > 0) {
            alerts.push({
                id: "quality-issues",
                priority: "high",
                icon: "error",
                title: `${issues} phiên có vấn đề chất lượng`,
                description: "Các phiên khám bị lỗi hệ thống hoặc bị báo cáo sự cố",
                actionLabel: "Xem chi tiết",
                actionHref: ROUTES.PORTAL.DOCTOR.TELEMEDICINE,
            });
        }

        qualityReviews
            .filter((r: any) => (r.rating ?? 5) <= 3)
            .forEach((r: any, i: number) => {
                const consultationId = r.consultationId ?? r.consultation_id ?? `cons-${i}`;
                const rating = r.rating ?? 0;
                const priority: Priority = rating <= 1 ? "urgent" : rating <= 2 ? "high" : "normal";
                alerts.push({
                    id: `review-${r.id ?? consultationId}`,
                    priority,
                    icon: "star_half",
                    title: `Phiên #${consultationId} bị đánh giá ${rating}/5`,
                    description: r.comment ?? r.feedback ?? "Bệnh nhân có phản hồi tiêu cực",
                    meta: r.createdAt ?? r.created_at ? fmtDateTime(r.createdAt ?? r.created_at) : undefined,
                    actionLabel: "Xem lại",
                    actionHref: ROUTES.PORTAL.DOCTOR.TELEMEDICINE,
                });
            });

        const byPriority = { urgent: 0, high: 1, normal: 2, low: 3 };
        alerts.sort((a, b) => byPriority[a.priority] - byPriority[b.priority]);
        return alerts;
    }, [qualityMetrics, qualityReviews]);

    const counts = {
        records: recordAlerts.length,
        followups: followUpAlerts.length,
        telemedicine: telemedicineAlerts.length,
    };
    const total = counts.records + counts.followups + counts.telemedicine;

    const urgentCount = [...recordAlerts, ...followUpAlerts, ...telemedicineAlerts].filter((a) => a.priority === "urgent").length;

    const activeAlerts = tab === "records" ? recordAlerts : tab === "followups" ? followUpAlerts : telemedicineAlerts;

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-5">
                <PageHeader
                    title="Cảnh báo cần xử lý"
                    subtitle={
                        loading
                            ? "Đang tải cảnh báo…"
                            : `${total} cảnh báo • ${urgentCount} khẩn cấp`
                    }
                    icon="notifications_active"
                    breadcrumbs={[
                        { label: "Bảng điều khiển", href: ROUTES.PORTAL.DOCTOR.DASHBOARD },
                        { label: "Cảnh báo" },
                    ]}
                />

                {/* Tabs */}
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="flex border-b border-[#f0f1f3] dark:border-[#2d353e]">
                        {(
                            [
                                { key: "records", label: "Hồ sơ", icon: "folder_shared", count: counts.records },
                                { key: "followups", label: "Follow-up", icon: "assignment_turned_in", count: counts.followups },
                                { key: "telemedicine", label: "Telemedicine", icon: "video_call", count: counts.telemedicine },
                            ] as const
                        ).map((t) => {
                            const active = tab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setTab(t.key)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                                        active
                                            ? "border-[#3C81C6] text-[#3C81C6] bg-[#3C81C6]/5"
                                            : "border-transparent text-[#687582] dark:text-gray-400 hover:text-[#121417] dark:hover:text-white"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                                    <span>{t.label}</span>
                                    {t.count > 0 && (
                                        <span
                                            className={`inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-[11px] font-bold px-1.5 ${
                                                active ? "bg-[#3C81C6] text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                            }`}
                                        >
                                            {t.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Alert list */}
                    <div>
                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <div className="w-6 h-6 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : activeAlerts.length === 0 ? (
                            <EmptyState
                                icon="check_circle"
                                variant="success"
                                title={
                                    tab === "records"
                                        ? "Không có cảnh báo hồ sơ"
                                        : tab === "followups"
                                        ? "Không có cảnh báo follow-up"
                                        : "Không có cảnh báo telemedicine"
                                }
                                description="Mọi thứ đang trong tầm kiểm soát."
                            />
                        ) : (
                            <ul className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                                {activeAlerts.map((a) => (
                                    <AlertRow key={a.id} item={a} />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
