"use client";

/**
 * Refunds — Phase J.5 #5.
 * Spec: dòng 12044-12134.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { billingRefundService } from "@/services/billingRefundService";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ xử lý", cls: "bg-amber-100 text-amber-700" },
    PROCESSING: { label: "Đang xử lý", cls: "bg-blue-100 text-blue-700" },
    APPROVED: { label: "Đã duyệt", cls: "bg-emerald-100 text-emerald-700" },
    REJECTED: { label: "Từ chối", cls: "bg-rose-100 text-rose-700" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-slate-200 text-slate-700" },
    COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700" },
};

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };
const fmtMoney = (v?: number) => v == null ? "—" : `${v.toLocaleString("vi-VN")} ₫`;

export default function ReceptionistRefundsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const [d, l] = await Promise.allSettled([
            billingRefundService.getDashboard(),
            billingRefundService.getRequests(),
        ]);
        if (d.status === "fulfilled") setDashboard(d.value);
        if (l.status === "fulfilled") {
            const arr = (l.value as any)?.data ?? [];
            setItems(Array.isArray(arr) ? arr : []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => items.filter((r: any) => {
        const status = (r.status ?? "PENDING").toUpperCase();
        return statusFilter === "ALL" || status === statusFilter;
    }), [items, statusFilter]);

    const stats = {
        total: items.length,
        pending: items.filter((r: any) => (r.status ?? "").toUpperCase() === "PENDING").length,
        completed: items.filter((r: any) => (r.status ?? "").toUpperCase() === "COMPLETED").length,
        amount: dashboard?.total_amount ?? items.reduce((s: number, r: any) => s + (r.amount ?? 0), 0),
    };

    const onProcess = async (id: string) => {
        setBusyId(id);
        try {
            await billingRefundService.processRefund(id);
            await load();
        } catch (e: any) { alert(e?.message ?? "Xử lý thất bại"); }
        finally { setBusyId(null); }
    };

    const onCancel = async (id: string) => {
        const reason = prompt("Lý do từ chối:");
        if (!reason) return;
        setBusyId(id);
        try {
            await billingRefundService.reject(id, reason);
            await load();
        } catch (e: any) { alert(e?.message ?? "Huỷ thất bại"); }
        finally { setBusyId(null); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Hoàn tiền / Refund"
                subtitle="Theo dõi và xử lý yêu cầu hoàn tiền."
                icon="undo"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Hoá đơn", href: "/portal/receptionist/billing" },
                    { label: "Refund" },
                ]}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng request" value={stats.total} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Chờ xử lý" value={stats.pending} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Hoàn tất" value={stats.completed} icon="task_alt" color="emerald" loading={loading} />
                <StatCard label="Tổng tiền" value={fmtMoney(stats.amount)} icon="payments" color="violet" loading={loading} />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3 mb-4">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
                : filtered.length === 0 ? <EmptyState icon="undo" title="Không có yêu cầu hoàn tiền" />
                : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">ID</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Invoice</th>
                                <th className="text-right px-4 py-3">Số tiền</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-left px-4 py-3">Ngày</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {filtered.map((r: any) => {
                                const status = (r.status ?? "PENDING").toUpperCase();
                                const meta = STATUS_META[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3 font-mono text-xs">#{(r.id ?? "").toString().slice(0, 8)}</td>
                                        <td className="px-4 py-3">{r.patient_name ?? "—"}</td>
                                        <td className="px-4 py-3 font-mono text-xs">#{(r.invoice_id ?? r.transaction_id ?? "").toString().slice(0, 8)}</td>
                                        <td className="px-4 py-3 text-right font-bold">{fmtMoney(r.amount ?? r.refund_amount)}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span></td>
                                        <td className="px-4 py-3 text-[#687582]">{fmt(r.created_at)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex gap-1">
                                                {status === "PENDING" && <button onClick={() => onProcess(r.id)} disabled={busyId === r.id} className="px-2 py-1 text-xs rounded bg-[#3C81C6] text-white disabled:opacity-50">Xử lý</button>}
                                                {(status === "PENDING" || status === "PROCESSING") && <button onClick={() => onCancel(r.id)} disabled={busyId === r.id} className="px-2 py-1 text-xs rounded text-rose-600 hover:bg-rose-50 disabled:opacity-50">Huỷ</button>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
