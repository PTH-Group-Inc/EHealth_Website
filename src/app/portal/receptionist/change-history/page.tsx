"use client";

/**
 * Change History — Phase J.3 #9.
 * Spec: dòng 11208-11257.
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import axiosClient from "@/api/axiosClient";

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleString("vi-VN"); } catch { return v; } };

export default function ChangeHistoryPage() {
    const sp = useSearchParams();
    const appointmentId = sp.get("appointmentId") ?? "";

    const [stats, setStats] = useState<any>({});
    const [recent, setRecent] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const reqs: Promise<any>[] = [
            axiosClient.get("/api/appointment-changes/stats").then(r => ({ stats: r?.data?.data ?? r?.data })).catch(() => null),
            axiosClient.get("/api/appointment-changes/recent").then(r => ({ recent: r?.data?.data ?? r?.data ?? [] })).catch(() => null),
        ];
        if (appointmentId) {
            reqs.push(
                axiosClient.get(`/api/appointment-changes/${appointmentId}/history`)
                    .then(r => ({ history: r?.data?.data ?? r?.data ?? [] })).catch(() => null)
            );
        }
        const results = await Promise.all(reqs);
        results.forEach((r: any) => {
            if (!r) return;
            if (r.stats) setStats(r.stats);
            if (r.recent) setRecent(Array.isArray(r.recent) ? r.recent : []);
            if (r.history) setHistory(Array.isArray(r.history) ? r.history : []);
        });
        setLoading(false);
    }, [appointmentId]);

    useEffect(() => { load(); }, [load]);

    const list = appointmentId ? history : recent;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Lịch sử thay đổi lịch"
                subtitle={appointmentId ? `Chi tiết thay đổi của appointment ${appointmentId.slice(0, 8)}` : "Tất cả thay đổi lịch gần đây"}
                icon="history"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Lịch sử thay đổi" },
                ]}
            />

            {!appointmentId && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Hôm nay" value={stats?.today ?? 0} icon="today" color="blue" loading={loading} />
                    <StatCard label="Tuần này" value={stats?.this_week ?? 0} icon="date_range" color="violet" loading={loading} />
                    <StatCard label="Reschedule" value={stats?.reschedule ?? 0} icon="schedule" color="amber" loading={loading} />
                    <StatCard label="Cancel" value={stats?.cancel ?? 0} icon="cancel" color="red" loading={loading} />
                </div>
            )}

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
                : list.length === 0 ? <EmptyState icon="history" title="Không có thay đổi" />
                : (
                    <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                        {list.map((c: any, i: number) => (
                            <li key={c.id ?? i} className="p-4 flex items-start gap-3">
                                <span className="material-symbols-outlined text-[#3C81C6] mt-0.5">
                                    {c.change_type === "RESCHEDULE" ? "schedule" : c.change_type === "CANCEL" ? "cancel" : "edit"}
                                </span>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{c.change_type ?? "Thay đổi"} · {c.patient_name ?? c.patientName ?? "—"}</p>
                                    <p className="text-xs text-[#687582]">
                                        {c.old_value && c.new_value ? `${c.old_value} → ${c.new_value}` : c.reason ?? c.note}
                                    </p>
                                    <p className="text-xs text-[#687582]">{fmt(c.created_at ?? c.createdAt)} · {c.changed_by ?? "—"}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
