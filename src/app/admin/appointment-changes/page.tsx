"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { APPOINTMENT_CHANGE_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type ChangeKind = "RESCHEDULE" | "CANCEL" | "DOCTOR_SWAP" | "ROOM_CHANGE" | "OTHER";

interface AppointmentChange {
    id: string;
    appointmentId: string;
    appointmentCode: string;
    patientName: string;
    doctorName?: string;
    kind: ChangeKind;
    oldValue?: string;
    newValue?: string;
    reason?: string;
    changedBy?: string;
    changedAt: string;
}

interface Stats {
    total: number;
    reschedule: number;
    cancel: number;
    doctorSwap: number;
}

const KIND_META: Record<ChangeKind, { label: string; color: string; icon: string }> = {
    RESCHEDULE: { label: "Dời lịch", color: "amber", icon: "event_repeat" },
    CANCEL: { label: "Huỷ lịch", color: "red", icon: "event_busy" },
    DOCTOR_SWAP: { label: "Đổi BS", color: "violet", icon: "swap_horiz" },
    ROOM_CHANGE: { label: "Đổi phòng", color: "blue", icon: "meeting_room" },
    OTHER: { label: "Khác", color: "gray", icon: "more_horiz" },
};

function normalizeKind(raw: any): ChangeKind {
    const k = String(raw ?? "").toUpperCase();
    if (k === "RESCHEDULE" || k === "RESCHEDULED") return "RESCHEDULE";
    if (k === "CANCEL" || k === "CANCELLED" || k === "CANCELED") return "CANCEL";
    if (k === "DOCTOR_SWAP" || k === "REASSIGN_DOCTOR" || k === "DOCTOR_CHANGE") return "DOCTOR_SWAP";
    if (k === "ROOM_CHANGE" || k === "ROOM_SWAP") return "ROOM_CHANGE";
    return "OTHER";
}

function mapChange(r: any): AppointmentChange {
    return {
        id: String(r.appointment_changes_id ?? r.change_id ?? r.id ?? ""),
        appointmentId: String(r.appointment_id ?? r.appointmentId ?? r.appointments_id ?? ""),
        appointmentCode: r.appointment_code ?? r.appointmentCode ?? "",
        patientName: r.patient_name ?? r.patientName ?? "—",
        doctorName: r.doctor_name ?? r.doctorName ?? "",
        kind: normalizeKind(r.kind ?? r.change_type ?? r.changeType ?? r.type),
        oldValue: r.old_value ?? r.oldValue ?? r.previous_value ?? "",
        newValue: r.new_value ?? r.newValue ?? r.next_value ?? "",
        reason: r.reason ?? r.note ?? "",
        changedBy: r.changed_by_name ?? r.changedByName ?? r.user_name ?? "",
        changedAt: r.changed_at ?? r.changedAt ?? r.created_at ?? "",
    };
}

function formatDT(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AppointmentChangesPage() {
    const toast = useToast();
    const t = useTranslations("pages.appointmentChanges");
    const tc = useTranslations("common");
    const [changes, setChanges] = useState<AppointmentChange[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, reschedule: 0, cancel: 0, doctorSwap: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [kindFilter, setKindFilter] = useState("all");
    const [detail, setDetail] = useState<AppointmentChange | null>(null);
    const [detailHistory, setDetailHistory] = useState<AppointmentChange[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, recentRes] = await Promise.all([
                axiosClient.get(APPOINTMENT_CHANGE_ENDPOINTS.STATS).catch(() => ({ data: {} })),
                axiosClient.get(APPOINTMENT_CHANGE_ENDPOINTS.RECENT, { params: { limit: 100 } }).catch(() => ({ data: { data: [] } })),
            ]);
            const statsRaw = statsRes.data?.data ?? statsRes.data ?? {};
            setStats({
                total: Number(statsRaw.total ?? statsRaw.total_changes ?? 0),
                reschedule: Number(statsRaw.reschedule ?? statsRaw.reschedule_count ?? 0),
                cancel: Number(statsRaw.cancel ?? statsRaw.cancel_count ?? 0),
                doctorSwap: Number(statsRaw.doctor_swap ?? statsRaw.doctor_swap_count ?? 0),
            });
            const { data } = unwrapList<any>(recentRes);
            setChanges(data.map(mapChange));
        } catch {
            setError("Không tải được lịch sử thay đổi.");
            setChanges([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return changes.filter((c) => {
            if (kindFilter !== "all" && c.kind !== kindFilter) return false;
            if (q && !`${c.patientName} ${c.doctorName ?? ""} ${c.appointmentCode} ${c.reason ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [changes, search, kindFilter]);

    const computedStats = useMemo(() => ({
        total: stats.total || changes.length,
        reschedule: stats.reschedule || changes.filter((c) => c.kind === "RESCHEDULE").length,
        cancel: stats.cancel || changes.filter((c) => c.kind === "CANCEL").length,
        doctorSwap: stats.doctorSwap || changes.filter((c) => c.kind === "DOCTOR_SWAP").length,
    }), [stats, changes]);

    const openDetail = async (c: AppointmentChange) => {
        setDetail(c);
        setDetailHistory([]);
        if (!c.appointmentId) return;
        try {
            const res = await axiosClient.get(APPOINTMENT_CHANGE_ENDPOINTS.HISTORY(c.appointmentId));
            const { data } = unwrapList<any>(res);
            setDetailHistory(data.map(mapChange));
        } catch {
            toast.error("Không tải được lịch sử chi tiết.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="history"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng thay đổi" value={computedStats.total} icon="history" color="blue" loading={loading} />
                <StatCard label="Dời lịch" value={computedStats.reschedule} icon="event_repeat" color="amber" loading={loading} />
                <StatCard label="Huỷ lịch" value={computedStats.cancel} icon="event_busy" color="red" loading={loading} />
                <StatCard label="Đổi bác sĩ" value={computedStats.doctorSwap} icon="swap_horiz" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo bệnh nhân, bác sĩ, mã lịch, lý do..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "kind", label: "Loại", value: kindFilter, onChange: setKindFilter,
                    options: [{ value: "all", label: "Mọi loại" }, ...Object.entries(KIND_META).map(([k, v]) => ({ value: k, label: v.label }))],
                }]}
                onReset={() => { setSearch(""); setKindFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="history" title="Chưa có thay đổi nào" description={changes.length === 0 ? "Hệ thống chưa ghi nhận thay đổi lịch hẹn." : "Không có thay đổi phù hợp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thời gian</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Lịch hẹn</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Bệnh nhân</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Loại</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thay đổi</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Bởi</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => {
                                    const meta = KIND_META[c.kind];
                                    return (
                                        <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400 whitespace-nowrap">{formatDT(c.changedAt)}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{c.appointmentCode || c.appointmentId.slice(0, 8)}</td>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">{c.patientName}</td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    meta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                                    meta.color === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                                    meta.color === "violet" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" :
                                                    meta.color === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                }`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{meta.icon}</span>
                                                    {meta.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400 max-w-xs">
                                                {c.oldValue && c.newValue ? (
                                                    <div className="flex items-center gap-1 truncate" title={`${c.oldValue} → ${c.newValue}`}>
                                                        <span className="line-through">{c.oldValue}</span>
                                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "12px" }}>arrow_right_alt</span>
                                                        <span className="font-semibold text-[#121417] dark:text-white">{c.newValue}</span>
                                                    </div>
                                                ) : (
                                                    <span className="truncate block" title={c.reason}>{c.reason || "—"}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400">{c.changedBy || "—"}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => openDetail(c)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title="Xem history">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDetail(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">history</span>
                            Lịch sử thay đổi lịch hẹn {detail.appointmentCode}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl">
                            <div>
                                <div className="text-xs text-[#687582] dark:text-gray-400">Bệnh nhân</div>
                                <div className="font-semibold text-[#121417] dark:text-white">{detail.patientName}</div>
                            </div>
                            {detail.doctorName && (
                                <div>
                                    <div className="text-xs text-[#687582] dark:text-gray-400">Bác sĩ</div>
                                    <div className="font-semibold text-[#121417] dark:text-white">{detail.doctorName}</div>
                                </div>
                            )}
                        </div>

                        <h4 className="text-sm font-semibold text-[#121417] dark:text-white mb-2">Timeline thay đổi</h4>
                        {detailHistory.length === 0 ? (
                            <div className="text-sm text-[#687582] dark:text-gray-400 italic py-3">Không có history hoặc đang tải...</div>
                        ) : (
                            <div className="relative pl-6 space-y-3">
                                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#3C81C6] to-transparent" />
                                {detailHistory.map((h) => {
                                    const meta = KIND_META[h.kind];
                                    return (
                                        <div key={h.id} className="relative">
                                            <div className={`absolute -left-[22px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1e242b] bg-gradient-to-br ${
                                                meta.color === "amber" ? "from-amber-400 to-orange-500" :
                                                meta.color === "red" ? "from-red-400 to-rose-500" :
                                                meta.color === "violet" ? "from-violet-400 to-purple-500" :
                                                meta.color === "blue" ? "from-blue-400 to-indigo-500" :
                                                "from-gray-400 to-gray-500"
                                            }`} />
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>{meta.icon}</span>
                                                    <span className="text-sm font-semibold text-[#121417] dark:text-white">{meta.label}</span>
                                                </div>
                                                <div className="text-xs text-[#687582] dark:text-gray-400">{formatDT(h.changedAt)}</div>
                                            </div>
                                            {h.oldValue && h.newValue && (
                                                <div className="text-xs text-[#687582] dark:text-gray-400">
                                                    <span className="line-through">{h.oldValue}</span>
                                                    <span className="mx-1">→</span>
                                                    <span className="font-semibold text-[#121417] dark:text-white">{h.newValue}</span>
                                                </div>
                                            )}
                                            {h.reason && <div className="text-xs text-[#687582] dark:text-gray-400 mt-1">Lý do: {h.reason}</div>}
                                            {h.changedBy && <div className="text-[10px] text-[#687582] dark:text-gray-500 mt-0.5">bởi {h.changedBy}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center justify-end mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
