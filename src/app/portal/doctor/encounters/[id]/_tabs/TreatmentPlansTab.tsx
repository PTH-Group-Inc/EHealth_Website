"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { treatmentPlanService } from "@/services/treatmentPlanService";
import { encounterService } from "@/services/encounterService";
import { EmptyState } from "@/components/shared/layout";

interface Props { encounterId: string }

const STATUS_META: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Nháp", cls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
    ACTIVE: { label: "Đang điều trị", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    PAUSED: { label: "Tạm ngưng", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

const fmt = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; }
};

export default function TreatmentPlansTab({ encounterId }: Props) {
    const [plans, setPlans] = useState<any[]>([]);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        (async () => {
            try {
                // treatmentPlanService không có getByEncounter, dùng getByPatient + filter
                const enc: any = await encounterService.getById(encounterId).catch(() => null);
                const pid = enc?.patientId ?? enc?.patient_id ?? enc?.patient?.id ?? null;
                if (cancelled) return;
                setPatientId(pid);

                if (!pid) {
                    setPlans([]);
                    return;
                }

                const res: any = await treatmentPlanService.getByPatient(pid).catch(() => ({ data: [] }));
                if (cancelled) return;

                const all = res?.data ?? res ?? [];
                const list = Array.isArray(all) ? all : [];

                // Filter những plan có encounterId match (nếu BE trả). Nếu không có encounterId
                // trong plan thì show tất cả plan của bệnh nhân (context vẫn liên quan).
                const matched = list.filter((p: any) =>
                    p.encounterId === encounterId
                    || p.encounter_id === encounterId
                    || p.sourceEncounterId === encounterId
                );
                setPlans(matched.length > 0 ? matched : list);
            } catch {
                if (!cancelled) setPlans([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [encounterId]);

    if (loading) return <div className="p-6 text-center text-[#687582]">Đang tải kế hoạch điều trị…</div>;

    if (plans.length === 0) {
        return (
            <EmptyState
                icon="medical_information"
                title="Chưa có kế hoạch điều trị"
                description={patientId ? "Bệnh nhân này chưa có treatment plan nào." : "Không xác định được bệnh nhân của phiên khám."}
            />
        );
    }

    return (
        <div className="space-y-2">
            {plans.map((p: any) => {
                const st = STATUS_META[(p.status ?? "DRAFT").toUpperCase()] ?? { label: p.status, cls: "bg-gray-100 text-gray-700" };
                return (
                    <div key={p.id} className="p-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[#121417] dark:text-white">
                                    {p.title ?? p.name ?? "Kế hoạch điều trị"}
                                </p>
                                <p className="text-xs text-[#687582] mt-1 font-mono">#{p.id?.slice(0, 8)}</p>
                                <p className="text-sm text-[#687582] mt-1">
                                    {fmt(p.start_date ?? p.startDate)} → {fmt(p.end_date ?? p.endDate)}
                                </p>
                                {p.summary && (
                                    <p className="text-sm text-[#121417] dark:text-gray-200 mt-2 line-clamp-2">{p.summary}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                                {patientId && (
                                    <Link
                                        href={`/portal/doctor/treatment-plans?patientId=${patientId}`}
                                        className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[#687582]"
                                    >
                                        Mở chi tiết
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
