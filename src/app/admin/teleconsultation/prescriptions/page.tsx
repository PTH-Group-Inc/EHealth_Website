"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { TELE_PRESCRIPTION_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface Prescription {
    id: string;
    code: string;
    patientName: string;
    doctorName?: string;
    itemCount: number;
    status: "DRAFT" | "PRESCRIBED" | "SENT" | "DISPENSED";
    createdAt?: string;
    sentAt?: string;
}

function normalizeStatus(raw: any): Prescription["status"] {
    const s = String(raw ?? "").toUpperCase();
    if (s === "PRESCRIBED" || s === "CONFIRMED") return "PRESCRIBED";
    if (s === "SENT" || s === "SENT_TO_PATIENT") return "SENT";
    if (s === "DISPENSED" || s === "COMPLETED") return "DISPENSED";
    return "DRAFT";
}

function mapRx(r: any): Prescription {
    return {
        id: String(r.consultation_id ?? r.prescription_id ?? r.id ?? ""),
        code: r.code ?? r.prescription_code ?? "",
        patientName: r.patient_name ?? r.patientName ?? "—",
        doctorName: r.doctor_name ?? r.doctorName ?? "",
        itemCount: Number(r.item_count ?? r.itemCount ?? 0),
        status: normalizeStatus(r.status),
        createdAt: r.created_at ?? "",
        sentAt: r.sent_at ?? r.sentAt ?? "",
    };
}

function formatDT(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_META: Record<Prescription["status"], { label: string; color: string }> = {
    DRAFT: { label: "Nháp", color: "amber" },
    PRESCRIBED: { label: "Đã kê", color: "blue" },
    SENT: { label: "Đã gửi KH", color: "violet" },
    DISPENSED: { label: "Đã cấp phát", color: "emerald" },
};

export default function TelePrescriptionsPage() {
    const toast = useToast();
    const t = useTranslations("pages.tele.prescriptions");
    const tc = useTranslations("common");
    const [items, setItems] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(TELE_PRESCRIPTION_ENDPOINTS.LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapRx));
        } catch {
            setError("Không tải được đơn thuốc online.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((r) => {
            if (statusFilter !== "all" && r.status !== statusFilter) return false;
            if (q && !`${r.code} ${r.patientName} ${r.doctorName ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, statusFilter]);

    const stats = useMemo(() => ({
        total: items.length,
        sent: items.filter((r) => r.status === "SENT" || r.status === "DISPENSED").length,
        dispensed: items.filter((r) => r.status === "DISPENSED").length,
        draft: items.filter((r) => r.status === "DRAFT").length,
    }), [items]);

    const handleSend = async (r: Prescription) => {
        if (!confirm(`Gửi đơn thuốc ${r.code} cho bệnh nhân?`)) return;
        try {
            await axiosClient.put(TELE_PRESCRIPTION_ENDPOINTS.SEND_TO_PATIENT(r.id));
            toast.success("Đã gửi."); await load();
        } catch { toast.error("Không gửi được."); }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="medication"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: "Telemedicine" }, { label: t("title") }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng đơn" value={stats.total} icon="medication" color="blue" loading={loading} />
                <StatCard label="Đã gửi KH" value={stats.sent} icon="send" color="violet" loading={loading} />
                <StatCard label="Đã cấp phát" value={stats.dispensed} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Nháp" value={stats.draft} icon="edit_note" color="amber" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm mã, bệnh nhân, bác sĩ..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "status", label: "Trạng thái", value: statusFilter, onChange: setStatusFilter,
                    options: [{ value: "all", label: "Tất cả" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))],
                }]}
                onReset={() => { setSearch(""); setStatusFilter("all"); }}
            />

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="medication" title="Chưa có đơn thuốc online" description={items.length === 0 ? "Chưa có đơn thuốc nào từ phiên khám từ xa." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Mã</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bệnh nhân</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bác sĩ</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Số thuốc</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Trạng thái</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Thời gian</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => {
                                    const meta = STATUS_META[r.status];
                                    return (
                                        <tr key={r.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{r.code || r.id.slice(0, 8)}</td>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">{r.patientName}</td>
                                            <td className="px-4 py-3 text-[#687582]">{r.doctorName || "—"}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{r.itemCount}</td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                    meta.color === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                                                    meta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                                    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                                                }`}>{meta.label}</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[#687582]">{formatDT(r.sentAt || r.createdAt)}</td>
                                            <td className="px-4 py-3 text-right">
                                                {r.status === "PRESCRIBED" && (
                                                    <button onClick={() => handleSend(r)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/10 rounded-md" title="Gửi KH">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>send</span>
                                                    </button>
                                                )}
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
