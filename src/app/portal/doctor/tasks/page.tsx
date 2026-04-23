"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import { getAppointmentsByDoctor } from "@/services/appointmentService";
import { appointmentStatusService } from "@/services/appointmentStatusService";
import { medicalSignoffService } from "@/services/medicalSignoffService";
import { teleFollowupService } from "@/services/teleFollowupService";
import { teleQualityService } from "@/services/teleQualityService";

const fmtTime = (v?: string) => {
    if (!v) return "";
    if (/^\d{1,2}:\d{2}/.test(v)) return v.substring(0, 5);
    try {
        return new Date(v).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
        return v;
    }
};

const fmtDate = (v?: string) => {
    if (!v) return "—";
    try {
        return new Date(v).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return v;
    }
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
    pending: { label: "Chờ xác nhận", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
    confirmed: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
    checked_in: { label: "Đã check-in", color: "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400" },
    waiting: { label: "Đang chờ", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
    examining: { label: "Đang khám", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
    completed: { label: "Hoàn tất", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

function renderStatusBadge(status?: string) {
    const key = (status ?? "").toLowerCase();
    const s = STATUS_BADGE[key] ?? { label: status ?? "—", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
    return <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${s.color}`}>{s.label}</span>;
}

interface SectionProps {
    title: string;
    icon: string;
    iconColor: string;
    count: number;
    viewAllHref?: string;
    children: React.ReactNode;
}

function Section({ title, icon, iconColor, count, viewAllHref, children }: SectionProps) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
            <div className="px-5 py-4 border-b border-[#f0f1f3] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${iconColor}`}>
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">{title}</h3>
                        <p className="text-[11px] text-[#687582] dark:text-gray-500">{count} mục</p>
                    </div>
                </div>
                {viewAllHref && (
                    <Link href={viewAllHref} className="text-xs font-semibold text-[#3C81C6] hover:underline">
                        Xem tất cả
                    </Link>
                )}
            </div>
            <div>{children}</div>
        </div>
    );
}

export default function DoctorTasksPage() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [queue, setQueue] = useState<any[]>([]);
    const [pendingSignoffs, setPendingSignoffs] = useState<any[]>([]);
    const [followUps, setFollowUps] = useState<any[]>([]);
    const [attentionUpdates, setAttentionUpdates] = useState<any[]>([]);
    const [teleReviews, setTeleReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        let alive = true;
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];

        Promise.allSettled([
            getAppointmentsByDoctor(user.id, { date: today }),
            appointmentStatusService.getQueueToday({ doctorId: user.id }),
            medicalSignoffService.getPending({ limit: 20 }),
            teleFollowupService.getUpcoming({ limit: 20 }),
            teleFollowupService.getAttentionUpdates({ limit: 20 }),
            teleQualityService.getDoctorReviews(user.id, { limit: 10 }),
        ]).then(([apts, q, signoff, upcoming, attention, reviews]) => {
            if (!alive) return;
            if (apts.status === "fulfilled") {
                const raw: any = apts.value;
                const items = Array.isArray(raw) ? raw : (raw?.data ?? []);
                setAppointments(items);
            }
            if (q.status === "fulfilled") {
                const raw: any = q.value;
                const items = raw?.data?.data ?? raw?.data ?? raw ?? [];
                setQueue(Array.isArray(items) ? items : []);
            }
            if (signoff.status === "fulfilled") setPendingSignoffs(signoff.value?.data ?? []);
            if (upcoming.status === "fulfilled") setFollowUps(upcoming.value?.data ?? []);
            if (attention.status === "fulfilled") setAttentionUpdates(attention.value?.data ?? []);
            if (reviews.status === "fulfilled") setTeleReviews(reviews.value?.data ?? []);
            setLoading(false);
        });

        return () => { alive = false; };
    }, [user?.id]);

    const totalTasks =
        appointments.length +
        queue.length +
        pendingSignoffs.length +
        attentionUpdates.length +
        teleReviews.filter((r) => (r.rating ?? 5) <= 3).length;

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-5">
                <PageHeader
                    title="Việc cần làm hôm nay"
                    subtitle={loading ? "Đang tổng hợp đầu việc…" : `Tổng cộng ${totalTasks} đầu việc đang cần xử lý`}
                    icon="checklist"
                    breadcrumbs={[
                        { label: "Bảng điều khiển", href: ROUTES.PORTAL.DOCTOR.DASHBOARD },
                        { label: "Việc cần làm" },
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Section 1: Lịch khám hôm nay */}
                    <Section
                        title="Lịch khám hôm nay"
                        icon="event_note"
                        iconColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                        count={appointments.length}
                        viewAllHref={ROUTES.PORTAL.DOCTOR.APPOINTMENTS}
                    >
                        {loading ? (
                            <div className="py-8 flex justify-center">
                                <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : appointments.length === 0 ? (
                            <EmptyState icon="event_available" variant="success" title="Không có lịch khám hôm nay" compact />
                        ) : (
                            <ul className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e] max-h-[360px] overflow-y-auto">
                                {appointments.slice(0, 10).map((a: any, i: number) => {
                                    const id = a.id ?? a.appointments_id ?? `apt-${i}`;
                                    const patient = a.patientName ?? a.patient_name ?? "(chưa có tên)";
                                    const code = a.appointment_code ?? a.appointmentCode ?? `APT-${id}`;
                                    const time = fmtTime(a.slot_start_time ?? a.time);
                                    const room = a.room_name ?? a.roomName ?? "";
                                    const service = a.service_name ?? a.serviceName ?? a.reason_for_visit ?? a.reason ?? "";
                                    return (
                                        <li key={id} className="px-4 py-3 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex-shrink-0 py-1.5 text-center">
                                                    <p className="text-[10px] font-semibold leading-none">{time || "—"}</p>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{patient}</p>
                                                        {renderStatusBadge(a.status)}
                                                    </div>
                                                    <p className="text-[11px] text-[#687582] dark:text-gray-500 truncate">
                                                        {code}{service ? ` • ${service}` : ""}{room ? ` • ${room}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Section>

                    {/* Section 2: Queue đang chờ */}
                    <Section
                        title="Queue đang chờ"
                        icon="groups"
                        iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                        count={queue.length}
                        viewAllHref={ROUTES.PORTAL.DOCTOR.QUEUE}
                    >
                        {loading ? (
                            <div className="py-8 flex justify-center">
                                <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : queue.length === 0 ? (
                            <EmptyState icon="done_all" variant="success" title="Không có bệnh nhân chờ" compact />
                        ) : (
                            <ul className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e] max-h-[360px] overflow-y-auto">
                                {queue.slice(0, 10).map((q: any, i: number) => {
                                    const id = q.id ?? q.appointment_id ?? `q-${i}`;
                                    const qnum = q.queue_number ?? q.queueNumber ?? i + 1;
                                    const patient = q.patientName ?? q.patient_name ?? "(chưa có tên)";
                                    const room = q.room_name ?? q.roomName ?? "";
                                    return (
                                        <li key={id} className="px-4 py-3 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                                                    #{qnum}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{patient}</p>
                                                        {renderStatusBadge(q.status)}
                                                    </div>
                                                    {room && <p className="text-[11px] text-[#687582] dark:text-gray-500 truncate">{room}</p>}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Section>

                    {/* Section 3: Hồ sơ cần ký */}
                    <Section
                        title="Hồ sơ cần ký"
                        icon="draw"
                        iconColor="bg-red-50 text-red-500 dark:bg-red-900/20"
                        count={pendingSignoffs.length}
                        viewAllHref={ROUTES.PORTAL.DOCTOR.MEDICAL_RECORDS}
                    >
                        {loading ? (
                            <div className="py-8 flex justify-center">
                                <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : pendingSignoffs.length === 0 ? (
                            <EmptyState icon="check_circle" variant="success" title="Tất cả hồ sơ đã ký" compact />
                        ) : (
                            <ul className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e] max-h-[360px] overflow-y-auto">
                                {pendingSignoffs.slice(0, 10).map((s: any, i: number) => {
                                    const encounterId = s.encounterId ?? s.encounter_id ?? `enc-${i}`;
                                    const name = s.patientName ?? s.patient_name ?? "(chưa có tên)";
                                    const date = fmtDate(s.encounterDate ?? s.encounter_date);
                                    return (
                                        <li key={encounterId} className="px-4 py-3 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-red-500 text-[16px]">person</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{name}</p>
                                                <p className="text-[11px] text-[#687582] dark:text-gray-500">#{encounterId} • {date}</p>
                                            </div>
                                            <Link
                                                href={`${ROUTES.PORTAL.DOCTOR.MEDICAL_RECORDS}?encounterId=${encounterId}`}
                                                className="text-[11px] font-semibold text-[#3C81C6] hover:underline whitespace-nowrap"
                                            >
                                                Đi ký →
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Section>

                    {/* Section 4: Follow-up cần xử lý */}
                    <Section
                        title="Follow-up cần xử lý"
                        icon="assignment_turned_in"
                        iconColor="bg-violet-50 text-violet-600 dark:bg-violet-900/20"
                        count={followUps.length + attentionUpdates.length}
                    >
                        {loading ? (
                            <div className="py-8 flex justify-center">
                                <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : followUps.length + attentionUpdates.length === 0 ? (
                            <EmptyState icon="task_alt" variant="success" title="Chưa có follow-up cần xử lý" compact />
                        ) : (
                            <ul className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e] max-h-[360px] overflow-y-auto">
                                {attentionUpdates.slice(0, 5).map((u: any, i: number) => {
                                    const id = u.id ?? `att-${i}`;
                                    const name = u.patientName ?? u.patient_name ?? "(chưa có tên)";
                                    const reason = u.reason ?? "Cần phản hồi";
                                    return (
                                        <li key={id} className="px-4 py-3 flex items-center gap-3 bg-red-50/40 dark:bg-red-900/5">
                                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-red-500 text-[16px]">priority_high</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{name}</p>
                                                <p className="text-[11px] text-red-600 dark:text-red-400 truncate">{reason}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                                {followUps.slice(0, 5).map((f: any, i: number) => {
                                    const id = f.planId ?? f.plan_id ?? `plan-${i}`;
                                    const name = f.patientName ?? f.patient_name ?? "(chưa có tên)";
                                    const due = fmtDate(f.dueAt ?? f.due_at ?? f.scheduledAt ?? f.scheduled_at);
                                    return (
                                        <li key={id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-violet-600 text-[16px]">event_upcoming</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{name}</p>
                                                <p className="text-[11px] text-[#687582] dark:text-gray-500">Plan #{id} • Hạn {due}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Section>
                </div>

                {/* Section 5 full-width: Telemedicine cần chú ý */}
                <Section
                    title="Phiên Telemedicine cần chú ý"
                    icon="video_call"
                    iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                    count={teleReviews.filter((r: any) => (r.rating ?? 5) <= 3).length}
                    viewAllHref={ROUTES.PORTAL.DOCTOR.TELEMEDICINE}
                >
                    {loading ? (
                        <div className="py-8 flex justify-center">
                            <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : teleReviews.filter((r: any) => (r.rating ?? 5) <= 3).length === 0 ? (
                        <EmptyState icon="sentiment_satisfied" variant="success" title="Không có phiên nào cần chú ý" compact />
                    ) : (
                        <ul className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                            {teleReviews
                                .filter((r: any) => (r.rating ?? 5) <= 3)
                                .slice(0, 10)
                                .map((r: any, i: number) => {
                                    const id = r.consultationId ?? r.consultation_id ?? `cons-${i}`;
                                    const rating = r.rating ?? 0;
                                    const comment = r.comment ?? r.feedback ?? "Không có nhận xét";
                                    return (
                                        <li key={r.id ?? id} className="px-5 py-3 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-amber-600 text-[16px]">star</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-[#121417] dark:text-white">Phiên #{id}</p>
                                                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                                                        <span className="material-symbols-outlined text-[14px]">star</span>
                                                        {rating}/5
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[#687582] dark:text-gray-500 truncate">{comment}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                        </ul>
                    )}
                </Section>
            </div>
        </div>
    );
}
