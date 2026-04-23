"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { TELE_FOLLOWUP_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface FollowUpPlan {
    id: string;
    patientName: string;
    doctorName?: string;
    planType?: string;
    scheduledDate: string;
    status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    needsAttention?: boolean;
    updates?: number;
}

const STATUS_META: Record<FollowUpPlan["status"], { label: string; color: string }> = {
    PLANNED: { label: "Đã lên kế hoạch", color: "amber" },
    IN_PROGRESS: { label: "Đang theo dõi", color: "blue" },
    COMPLETED: { label: "Hoàn tất", color: "emerald" },
    CANCELLED: { label: "Huỷ", color: "red" },
};

function normalizeStatus(raw: any): FollowUpPlan["status"] {
    const s = String(raw ?? "").toUpperCase();
    if (s === "IN_PROGRESS" || s === "ONGOING") return "IN_PROGRESS";
    if (s === "COMPLETED" || s === "DONE") return "COMPLETED";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    return "PLANNED";
}

function mapPlan(r: any): FollowUpPlan {
    return {
        id: String(r.plan_id ?? r.id ?? ""),
        patientName: r.patient_name ?? r.patientName ?? "—",
        doctorName: r.doctor_name ?? r.doctorName ?? "",
        planType: r.plan_type ?? r.planType ?? "",
        scheduledDate: r.scheduled_date ?? r.scheduledDate ?? "",
        status: normalizeStatus(r.status),
        needsAttention: Boolean(r.needs_attention ?? r.needsAttention ?? false),
        updates: Number(r.update_count ?? r.updates ?? 0),
    };
}

function formatDate(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function TeleFollowUpsPage() {
    const toast = useToast();
    const t = useTranslations("pages.tele.followups");
    const tc = useTranslations("common");
    const [items, setItems] = useState<FollowUpPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "upcoming" | "attention">("all");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const endpoint = filter === "upcoming" ? TELE_FOLLOWUP_ENDPOINTS.UPCOMING :
                filter === "attention" ? TELE_FOLLOWUP_ENDPOINTS.ATTENTION_UPDATES :
                TELE_FOLLOWUP_ENDPOINTS.PLANS;
            const res = await axiosClient.get(endpoint, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapPlan));
        } catch {
            setError("Không tải được kế hoạch follow-up.");
            setItems([]);
        } finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((p) => `${p.patientName} ${p.doctorName ?? ""} ${p.planType ?? ""}`.toLowerCase().includes(q));
    }, [items, search]);

    const stats = useMemo(() => ({
        total: items.length,
        planned: items.filter((p) => p.status === "PLANNED").length,
        completed: items.filter((p) => p.status === "COMPLETED").length,
        attention: items.filter((p) => p.needsAttention).length,
    }), [items]);

    const handleComplete = async (p: FollowUpPlan) => {
        if (!confirm(`Hoàn tất plan của ${p.patientName}?`)) return;
        try {
            await axiosClient.put(TELE_FOLLOWUP_ENDPOINTS.COMPLETE_PLAN(p.id));
            toast.success("Đã hoàn tất."); await load();
        } catch { toast.error("Không hoàn tất được."); }
    };

    const handleSendReminder = async (p: FollowUpPlan) => {
        try {
            await axiosClient.post(TELE_FOLLOWUP_ENDPOINTS.SEND_REMINDER(p.id));
            toast.success("Đã gửi nhắc.");
        } catch { toast.error("Không gửi được."); }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="event_repeat"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: "Telemedicine" }, { label: t("title") }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng plan" value={stats.total} icon="event_repeat" color="blue" loading={loading} />
                <StatCard label="Đã lên KH" value={stats.planned} icon="event_note" color="amber" loading={loading} />
                <StatCard label="Hoàn tất" value={stats.completed} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Cần chú ý" value={stats.attention} icon="warning" color="red" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm bệnh nhân, bác sĩ..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "filter", label: "Bộ lọc", value: filter, onChange: (v: string) => setFilter(v as any),
                    options: [
                        { value: "all", label: "Tất cả" },
                        { value: "upcoming", label: "Sắp tới" },
                        { value: "attention", label: "Cần chú ý" },
                    ],
                }]}
                onReset={() => { setSearch(""); setFilter("all"); }}
            />

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="event_repeat" title="Chưa có kế hoạch follow-up" description={items.length === 0 ? "Chưa có plan follow-up nào." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bệnh nhân</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bác sĩ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Loại</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Ngày hẹn</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Trạng thái</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Update</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p) => {
                                    const meta = STATUS_META[p.status];
                                    return (
                                        <tr key={p.id} className={`border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] ${p.needsAttention ? "bg-red-50/40 dark:bg-red-900/10" : ""}`}>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">
                                                {p.needsAttention && <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />}
                                                {p.patientName}
                                            </td>
                                            <td className="px-4 py-3 text-[#687582]">{p.doctorName || "—"}</td>
                                            <td className="px-4 py-3 text-xs text-[#687582]">{p.planType || "—"}</td>
                                            <td className="px-4 py-3 text-xs text-[#121417] dark:text-white">{formatDate(p.scheduledDate)}</td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    meta.color === "emerald" ? "bg-emerald-100 text-emerald-700" :
                                                    meta.color === "blue" ? "bg-blue-100 text-blue-700" :
                                                    meta.color === "amber" ? "bg-amber-100 text-amber-700" :
                                                    "bg-red-100 text-red-700"
                                                }`}>{meta.label}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-[#121417] dark:text-white">{p.updates ?? 0}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => handleSendReminder(p)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/10 rounded-md" title="Gửi nhắc">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>notifications_active</span>
                                                    </button>
                                                    {p.status !== "COMPLETED" && p.status !== "CANCELLED" && (
                                                        <button onClick={() => handleComplete(p)} className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md" title="Hoàn tất">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
