"use client";

/**
 * Tele Follow-ups — Phase I.6 #5.
 * Spec: dòng 7427-7519.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { teleFollowupService } from "@/services/teleFollowupService";

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };
const fmtDateTime = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleString("vi-VN"); } catch { return v; } };

const STATUS_META: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ", cls: "bg-amber-100 text-amber-700" },
    IN_PROGRESS: { label: "Đang theo dõi", cls: "bg-violet-100 text-violet-700" },
    COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700" },
    OVERDUE: { label: "Quá hạn", cls: "bg-rose-100 text-rose-700" },
};

export default function TeleFollowUpsPage() {
    const [tab, setTab] = useState<"plans" | "attention">("plans");
    const [plans, setPlans] = useState<any[]>([]);
    const [attention, setAttention] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const [p, a, s] = await Promise.allSettled([
            teleFollowupService.getPlans(),
            teleFollowupService.getAttentionUpdates(),
            teleFollowupService.getStats(),
        ]);
        if (p.status === "fulfilled") setPlans((p.value as any)?.data ?? []);
        if (a.status === "fulfilled") setAttention((a.value as any)?.data ?? []);
        if (s.status === "fulfilled") setStats(s.value);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const onComplete = async (planId: string) => {
        try { await teleFollowupService.completePlan(planId); await load(); }
        catch (e: any) { alert(e?.message ?? "Complete thất bại"); }
    };

    const onRespond = async (updateId: string) => {
        const response = prompt("Phản hồi tới bệnh nhân:");
        if (!response) return;
        try { await teleFollowupService.respondToUpdate(updateId, { response }); await load(); }
        catch (e: any) { alert(e?.message ?? "Phản hồi thất bại"); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Follow-up từ xa"
                subtitle="Theo dõi sau khám online, phản hồi update từ bệnh nhân."
                icon="follow_the_signs"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Telemedicine", href: "/portal/doctor/telemedicine" },
                    { label: "Follow-up" },
                ]}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng plan" value={(stats as any).total ?? plans.length} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Đang theo dõi" value={(stats as any).in_progress ?? 0} icon="play_circle" color="violet" loading={loading} />
                <StatCard label="Quá hạn" value={(stats as any).overdue ?? 0} icon="warning" color="red" loading={loading} />
                <StatCard label="Cần phản hồi" value={attention.length} icon="priority_high" color="amber" loading={loading} />
            </div>

            <div className="flex gap-2 mb-4">
                <button onClick={() => setTab("plans")} className={`px-3 py-1.5 text-sm rounded-lg border ${tab === "plans" ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                    Plans ({plans.length})
                </button>
                <button onClick={() => setTab("attention")} className={`px-3 py-1.5 text-sm rounded-lg border ${tab === "attention" ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                    Cần phản hồi ({attention.length})
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                {tab === "plans" ? (
                    plans.length === 0 ? <EmptyState icon="follow_the_signs" title="Không có follow-up plan" />
                    : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                                <tr>
                                    <th className="text-left px-4 py-3">Plan</th>
                                    <th className="text-left px-4 py-3">Bệnh nhân</th>
                                    <th className="text-left px-4 py-3">Hẹn lúc</th>
                                    <th className="text-left px-4 py-3">Trạng thái</th>
                                    <th className="text-right px-4 py-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {plans.map((p: any) => {
                                    const status = (p.status ?? "PENDING").toString().toUpperCase();
                                    const meta = STATUS_META[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
                                    return (
                                        <tr key={p.id ?? p.plan_id}>
                                            <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">#{(p.id ?? p.plan_id ?? "").toString().slice(0, 8)}</td>
                                            <td className="px-4 py-3 font-medium">{p.patient_name ?? p.patientName ?? "—"}</td>
                                            <td className="px-4 py-3">{fmt(p.scheduled_at ?? p.followup_date)}</td>
                                            <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span></td>
                                            <td className="px-4 py-3 text-right">
                                                {status !== "COMPLETED" && (
                                                    <button onClick={() => onComplete(p.id ?? p.plan_id)} className="px-2 py-1 text-xs rounded bg-emerald-50 text-emerald-700">Complete</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )
                ) : (
                    attention.length === 0 ? <EmptyState icon="priority_high" title="Hết update cần phản hồi" variant="success" />
                    : (
                        <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {attention.map((u: any) => (
                                <li key={u.id} className="p-4 flex items-start gap-3">
                                    <span className="material-symbols-outlined text-amber-500 mt-1">priority_high</span>
                                    <div className="flex-1">
                                        <p className="font-medium">{u.patient_name ?? u.patientName} · {u.update_type ?? "Update"}</p>
                                        <p className="text-sm text-[#687582]">{u.content ?? u.message}</p>
                                        <p className="text-xs text-[#687582] mt-1">{fmtDateTime(u.created_at ?? u.createdAt)}</p>
                                    </div>
                                    <button onClick={() => onRespond(u.id)} className="px-3 py-1.5 text-xs rounded bg-[#3C81C6] text-white">Phản hồi</button>
                                </li>
                            ))}
                        </ul>
                    )
                )}
            </div>
        </div>
    );
}
