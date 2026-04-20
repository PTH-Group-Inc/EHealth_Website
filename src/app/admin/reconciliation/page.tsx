"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { BILLING_RECONCILIATION_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type SessionStatus = "OPEN" | "REVIEWING" | "APPROVED" | "REJECTED";

interface Session {
    id: string;
    code: string;
    sessionType?: string;
    expectedAmount: number;
    actualAmount: number;
    discrepancy: number;
    cashierName?: string;
    status: SessionStatus;
    runAt?: string;
    reviewedBy?: string;
    reviewedAt?: string;
}

const STATUS_META: Record<SessionStatus, { label: string; color: string; icon: string }> = {
    OPEN: { label: "Chờ review", color: "amber", icon: "hourglass_top" },
    REVIEWING: { label: "Đang xem", color: "blue", icon: "pending" },
    APPROVED: { label: "Duyệt", color: "emerald", icon: "check_circle" },
    REJECTED: { label: "Từ chối", color: "red", icon: "cancel" },
};

function normalizeStatus(raw: any): SessionStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "APPROVED" || s === "ACCEPTED") return "APPROVED";
    if (s === "REJECTED") return "REJECTED";
    if (s === "REVIEWING" || s === "IN_REVIEW") return "REVIEWING";
    return "OPEN";
}

function mapSession(r: any): Session {
    const expected = Number(r.expected_amount ?? r.expectedAmount ?? 0);
    const actual = Number(r.actual_amount ?? r.actualAmount ?? 0);
    return {
        id: String(r.session_id ?? r.id ?? ""),
        code: r.code ?? r.session_code ?? "",
        sessionType: r.session_type ?? r.sessionType ?? "",
        expectedAmount: expected,
        actualAmount: actual,
        discrepancy: actual - expected,
        cashierName: r.cashier_name ?? r.cashierName ?? "",
        status: normalizeStatus(r.status),
        runAt: r.run_at ?? r.created_at ?? "",
        reviewedBy: r.reviewed_by_name ?? r.reviewedByName ?? "",
        reviewedAt: r.reviewed_at ?? r.reviewedAt ?? "",
    };
}

function formatDT(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatVND(n: number): string {
    const sign = n < 0 ? "-" : "";
    return sign + Math.abs(n).toLocaleString("vi-VN") + " ₫";
}

export default function ReconciliationPage() {
    const toast = useToast();
    const [items, setItems] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [runningOnline, setRunningOnline] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(BILLING_RECONCILIATION_ENDPOINTS.SESSIONS, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapSession));
        } catch {
            setError("Không tải được phiên đối soát.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((s) => {
            if (statusFilter !== "all" && s.status !== statusFilter) return false;
            if (q && !`${s.code} ${s.cashierName ?? ""} ${s.sessionType ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, statusFilter]);

    const stats = useMemo(() => ({
        total: items.length,
        open: items.filter((s) => s.status === "OPEN").length,
        approved: items.filter((s) => s.status === "APPROVED").length,
        discrepancy: items.filter((s) => Math.abs(s.discrepancy) > 0).length,
    }), [items]);

    const handleRunOnline = async () => {
        if (!confirm("Chạy đối soát online (tất cả payment gateway)?")) return;
        setRunningOnline(true);
        try {
            await axiosClient.post(BILLING_RECONCILIATION_ENDPOINTS.RUN_ONLINE);
            toast.success("Đã chạy đối soát online.");
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không chạy được.");
        } finally {
            setRunningOnline(false);
        }
    };

    const handleReview = async (s: Session) => {
        try {
            await axiosClient.patch(BILLING_RECONCILIATION_ENDPOINTS.REVIEW_SESSION(s.id));
            toast.success("Đã chuyển sang reviewing.");
            await load();
        } catch {
            toast.error("Không review được.");
        }
    };

    const handleApprove = async (s: Session) => {
        if (!confirm(`Duyệt phiên ${s.code}?`)) return;
        try {
            await axiosClient.patch(BILLING_RECONCILIATION_ENDPOINTS.APPROVE_SESSION(s.id));
            toast.success("Đã duyệt.");
            await load();
        } catch {
            toast.error("Không duyệt được.");
        }
    };

    const handleReject = async (s: Session) => {
        const reason = prompt("Lý do từ chối:");
        if (!reason) return;
        try {
            await axiosClient.patch(BILLING_RECONCILIATION_ENDPOINTS.REJECT_SESSION(s.id), { reason });
            toast.success("Đã từ chối.");
            await load();
        } catch {
            toast.error("Không từ chối được.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Đối soát thanh toán"
                subtitle="Đối chiếu giao dịch online/offline, xử lý chênh lệch"
                icon="fact_check"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Đối soát" }]}
                actions={
                    <button onClick={handleRunOnline} disabled={runningOnline} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>play_arrow</span>
                        {runningOnline ? "Đang chạy..." : "Chạy đối soát online"}
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng phiên" value={stats.total} icon="fact_check" color="blue" loading={loading} />
                <StatCard label="Chờ review" value={stats.open} icon="hourglass_top" color="amber" loading={loading} />
                <StatCard label="Đã duyệt" value={stats.approved} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Có chênh lệch" value={stats.discrepancy} icon="warning" color="red" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm mã phiên, thu ngân..."
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
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="fact_check" title="Chưa có phiên đối soát" description={items.length === 0 ? "Chạy đối soát online/theo ca để tạo phiên." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Mã phiên</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Loại</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thu ngân</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Dự kiến</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thực tế</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Chênh lệch</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Trạng thái</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => {
                                    const meta = STATUS_META[s.status];
                                    const diffColor = s.discrepancy === 0 ? "text-emerald-600" : s.discrepancy > 0 ? "text-[#3C81C6]" : "text-red-600";
                                    return (
                                        <tr key={s.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{s.code}</td>
                                            <td className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400">{s.sessionType || "—"}</td>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">{s.cashierName || "—"}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-[#687582]">{formatVND(s.expectedAmount)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-[#121417] dark:text-white">{formatVND(s.actualAmount)}</td>
                                            <td className={`px-4 py-3 text-right font-mono font-bold ${diffColor}`}>
                                                {s.discrepancy === 0 ? "✓" : (s.discrepancy > 0 ? "+" : "") + formatVND(s.discrepancy)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                    meta.color === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                                                    meta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                                    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                                }`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{meta.icon}</span>
                                                    {meta.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {s.status === "OPEN" && (
                                                        <button onClick={() => handleReview(s)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/10 rounded-md" title="Bắt đầu review">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>pending</span>
                                                        </button>
                                                    )}
                                                    {(s.status === "OPEN" || s.status === "REVIEWING") && (
                                                        <>
                                                            <button onClick={() => handleApprove(s)} className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md" title="Duyệt">
                                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
                                                            </button>
                                                            <button onClick={() => handleReject(s)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Từ chối">
                                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cancel</span>
                                                            </button>
                                                        </>
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
