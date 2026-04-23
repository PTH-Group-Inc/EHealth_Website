"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { BILLING_REFUND_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type RefundStatus = "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED" | "CANCELLED";

interface RefundRequest {
    id: string;
    code: string;
    invoiceCode?: string;
    patientName: string;
    amount: number;
    reason?: string;
    status: RefundStatus;
    requestedBy?: string;
    approverName?: string;
    requestedAt?: string;
    processedAt?: string;
}

const STATUS_META: Record<RefundStatus, { label: string; color: string; icon: string }> = {
    PENDING: { label: "Chờ duyệt", color: "amber", icon: "hourglass_top" },
    APPROVED: { label: "Đã duyệt", color: "blue", icon: "check_circle" },
    PROCESSING: { label: "Đang xử lý", color: "violet", icon: "pending" },
    COMPLETED: { label: "Hoàn tất", color: "emerald", icon: "done_all" },
    REJECTED: { label: "Từ chối", color: "red", icon: "cancel" },
    CANCELLED: { label: "Đã huỷ", color: "red", icon: "block" },
};

function normalizeStatus(raw: any): RefundStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "APPROVED") return "APPROVED";
    if (s === "PROCESSING") return "PROCESSING";
    if (s === "COMPLETED" || s === "DONE" || s === "PROCESSED") return "COMPLETED";
    if (s === "REJECTED") return "REJECTED";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    return "PENDING";
}

function mapRequest(r: any): RefundRequest {
    return {
        id: String(r.refund_request_id ?? r.request_id ?? r.id ?? ""),
        code: r.code ?? r.request_code ?? "",
        invoiceCode: r.invoice_code ?? r.invoiceCode ?? "",
        patientName: r.patient_name ?? r.patientName ?? "—",
        amount: Number(r.amount ?? r.refund_amount ?? 0),
        reason: r.reason ?? "",
        status: normalizeStatus(r.status),
        requestedBy: r.requested_by_name ?? r.requestedByName ?? "",
        approverName: r.approver_name ?? r.approverName ?? "",
        requestedAt: r.requested_at ?? r.created_at ?? "",
        processedAt: r.processed_at ?? r.processedAt ?? "",
    };
}

function formatDT(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatVND(n: number): string {
    return n.toLocaleString("vi-VN") + " ₫";
}

export default function RefundsPage() {
    const toast = useToast();
    const t = useTranslations("pages.refunds");
    const tc = useTranslations("common");
    const [items, setItems] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(BILLING_REFUND_ENDPOINTS.REQUESTS, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapRequest));
        } catch {
            setError("Không tải được yêu cầu hoàn tiền.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((r) => {
            if (statusFilter !== "all" && r.status !== statusFilter) return false;
            if (q && !`${r.code} ${r.invoiceCode ?? ""} ${r.patientName} ${r.reason ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, statusFilter]);

    const stats = useMemo(() => ({
        total: items.length,
        pending: items.filter((r) => r.status === "PENDING").length,
        completed: items.filter((r) => r.status === "COMPLETED").length,
        amount: items.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + r.amount, 0),
    }), [items]);

    const handleApprove = async (r: RefundRequest) => {
        if (!confirm(`Duyệt hoàn ${formatVND(r.amount)} cho ${r.patientName}?`)) return;
        try {
            await axiosClient.patch(BILLING_REFUND_ENDPOINTS.APPROVE(r.id));
            toast.success("Đã duyệt."); await load();
        } catch { toast.error("Không duyệt được."); }
    };

    const handleReject = async (r: RefundRequest) => {
        const reason = prompt("Lý do từ chối:");
        if (!reason) return;
        try {
            await axiosClient.patch(BILLING_REFUND_ENDPOINTS.REJECT(r.id), { reason });
            toast.success("Đã từ chối."); await load();
        } catch { toast.error("Không từ chối được."); }
    };

    const handleProcess = async (r: RefundRequest) => {
        if (!confirm(`Xử lý hoàn ${formatVND(r.amount)}?`)) return;
        try {
            await axiosClient.patch(BILLING_REFUND_ENDPOINTS.PROCESS(r.id));
            toast.success("Đã xử lý."); await load();
        } catch { toast.error("Không xử lý được."); }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="currency_exchange"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng YC" value={stats.total} icon="currency_exchange" color="blue" loading={loading} />
                <StatCard label="Chờ duyệt" value={stats.pending} icon="hourglass_top" color="amber" loading={loading} />
                <StatCard label="Đã hoàn" value={stats.completed} icon="done_all" color="emerald" loading={loading} />
                <StatCard label="Tổng tiền hoàn" value={formatVND(stats.amount)} icon="payments" color="red" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm mã YC, hoá đơn, bệnh nhân..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "status", label: "Trạng thái", value: statusFilter, onChange: setStatusFilter,
                    options: [{ value: "all", label: "Tất cả" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))],
                }]}
                onReset={() => { setSearch(""); setStatusFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="currency_exchange" title="Chưa có yêu cầu hoàn" description={items.length === 0 ? "Không có yêu cầu hoàn tiền nào." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Mã YC</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">HĐ gốc</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Bệnh nhân</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Số tiền</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Lý do</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Trạng thái</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => {
                                    const meta = STATUS_META[r.status];
                                    return (
                                        <tr key={r.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{r.code}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-[#687582]">{r.invoiceCode || "—"}</td>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">{r.patientName}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-red-600">{formatVND(r.amount)}</td>
                                            <td className="px-4 py-3 text-xs text-[#687582] max-w-xs truncate" title={r.reason}>{r.reason || "—"}</td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                    meta.color === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                                                    meta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                                    meta.color === "violet" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" :
                                                    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                                }`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{meta.icon}</span>
                                                    {meta.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {r.status === "PENDING" && (
                                                        <>
                                                            <button onClick={() => handleApprove(r)} className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md" title="Duyệt">
                                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
                                                            </button>
                                                            <button onClick={() => handleReject(r)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Từ chối">
                                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cancel</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    {r.status === "APPROVED" && (
                                                        <button onClick={() => handleProcess(r)} className="px-2 py-1 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-md" title="Xử lý hoàn">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>payments</span>
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
