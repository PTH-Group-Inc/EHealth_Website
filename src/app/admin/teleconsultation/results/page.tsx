"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { TELE_RESULT_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface Result {
    id: string;
    code: string;
    patientName: string;
    doctorName?: string;
    diagnosis?: string;
    conclusion?: string;
    isSigned: boolean;
    completedAt?: string;
    createdAt?: string;
    needsFollowUp?: boolean;
}

function mapResult(r: any): Result {
    return {
        id: String(r.consultation_id ?? r.result_id ?? r.id ?? ""),
        code: r.code ?? "",
        patientName: r.patient_name ?? r.patientName ?? "—",
        doctorName: r.doctor_name ?? r.doctorName ?? "",
        diagnosis: r.diagnosis ?? r.primary_diagnosis ?? "",
        conclusion: r.conclusion ?? r.summary ?? "",
        isSigned: Boolean(r.is_signed ?? r.isSigned ?? false),
        completedAt: r.completed_at ?? r.completedAt ?? "",
        createdAt: r.created_at ?? "",
        needsFollowUp: Boolean(r.needs_follow_up ?? r.needsFollowUp ?? false),
    };
}

function formatDT(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TeleResultsPage() {
    const toast = useToast();
    const [items, setItems] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "unsigned" | "follow-up">("all");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const endpoint = filter === "unsigned" ? TELE_RESULT_ENDPOINTS.UNSIGNED :
                filter === "follow-up" ? TELE_RESULT_ENDPOINTS.FOLLOW_UPS :
                TELE_RESULT_ENDPOINTS.LIST;
            const res = await axiosClient.get(endpoint, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapResult));
        } catch {
            setError("Không tải được kết quả khám.");
            setItems([]);
        } finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((r) => `${r.code} ${r.patientName} ${r.doctorName ?? ""} ${r.diagnosis ?? ""}`.toLowerCase().includes(q));
    }, [items, search]);

    const stats = useMemo(() => ({
        total: items.length,
        signed: items.filter((r) => r.isSigned).length,
        unsigned: items.filter((r) => !r.isSigned && r.completedAt).length,
        followUp: items.filter((r) => r.needsFollowUp).length,
    }), [items]);

    const handleSign = async (r: Result) => {
        if (!confirm(`Ký kết quả khám của ${r.patientName}?`)) return;
        try {
            await axiosClient.put(TELE_RESULT_ENDPOINTS.SIGN(r.id));
            toast.success("Đã ký."); await load();
        } catch { toast.error("Không ký được."); }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Kết quả khám online"
                subtitle="Danh sách kết quả khám từ xa, ký số & theo dõi follow-up"
                icon="medical_information"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Telemedicine" }, { label: "Kết quả" }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng kết quả" value={stats.total} icon="medical_information" color="blue" loading={loading} />
                <StatCard label="Đã ký" value={stats.signed} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Chờ ký" value={stats.unsigned} icon="hourglass_top" color="amber" loading={loading} />
                <StatCard label="Cần follow-up" value={stats.followUp} icon="event_repeat" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm mã, bệnh nhân, bác sĩ, chẩn đoán..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "filter", label: "Bộ lọc", value: filter, onChange: (v: string) => setFilter(v as any),
                    options: [
                        { value: "all", label: "Tất cả" },
                        { value: "unsigned", label: "Chưa ký" },
                        { value: "follow-up", label: "Cần follow-up" },
                    ],
                }]}
                onReset={() => { setSearch(""); setFilter("all"); }}
            />

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="medical_information" title="Chưa có kết quả khám" description={items.length === 0 ? "Chưa có phiên khám online nào hoàn tất." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Mã</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bệnh nhân</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bác sĩ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Chẩn đoán</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Trạng thái</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Hoàn tất</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr key={r.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                        <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{r.code || r.id.slice(0, 8)}</td>
                                        <td className="px-4 py-3 text-[#121417] dark:text-white">{r.patientName}</td>
                                        <td className="px-4 py-3 text-[#687582]">{r.doctorName || "—"}</td>
                                        <td className="px-4 py-3 text-xs text-[#121417] dark:text-white max-w-xs truncate" title={r.diagnosis}>{r.diagnosis || "—"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md w-fit ${r.isSigned ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {r.isSigned ? "Đã ký" : "Chưa ký"}
                                                </div>
                                                {r.needsFollowUp && <div className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 w-fit">Follow-up</div>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[#687582]">{formatDT(r.completedAt)}</td>
                                        <td className="px-4 py-3 text-right">
                                            {!r.isSigned && r.completedAt && (
                                                <button onClick={() => handleSign(r)} className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md" title="Ký">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
