"use client";

/**
 * Receptionist Billing — Phase J.5 #1-#3.
 * Spec: dòng 11698-11976.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { billingService } from "@/services/billingService";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Nháp", cls: "bg-slate-200 text-slate-700" },
    PENDING: { label: "Chờ thu", cls: "bg-amber-100 text-amber-700" },
    PARTIALLY_PAID: { label: "Thu một phần", cls: "bg-blue-100 text-blue-700" },
    PAID: { label: "Đã thu", cls: "bg-emerald-100 text-emerald-700" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-100 text-rose-700" },
};

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };
const fmtMoney = (v?: number) => v == null ? "—" : `${v.toLocaleString("vi-VN")} ₫`;

export default function ReceptionistBillingPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [fromDate, setFromDate] = useState("");
    const [selected, setSelected] = useState<any>(null);
    const [payAmount, setPayAmount] = useState("");
    const [payMethod, setPayMethod] = useState<"CASH" | "BANK">("CASH");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { limit: 200 };
            if (fromDate) params.dateFrom = fromDate;
            const r = await billingService.getInvoices(params);
            const data = r?.data?.data ?? r?.data ?? [];
            setItems(Array.isArray(data) ? data : []);
        } finally { setLoading(false); }
    }, [fromDate]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => items.filter((inv: any) => {
        const status = (inv.status ?? inv.payment_status ?? "PENDING").toString().toUpperCase();
        if (statusFilter !== "ALL" && status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (inv.patient_name ?? inv.patientName ?? "").toLowerCase().includes(q) ||
                   (inv.invoice_code ?? inv.id ?? "").toString().toLowerCase().includes(q);
        }
        return true;
    }), [items, statusFilter, search]);

    const stats = {
        total: items.length,
        pending: items.filter((i: any) => (i.status ?? "").toUpperCase() === "PENDING").length,
        paid: items.filter((i: any) => (i.status ?? "").toUpperCase() === "PAID").length,
        revenue: items.filter((i: any) => (i.status ?? "").toUpperCase() === "PAID").reduce((sum: number, i: any) => sum + (i.total ?? i.total_amount ?? 0), 0),
    };

    const onPay = async () => {
        if (!selected || !payAmount) return;
        setBusy(true);
        try {
            await billingService.pay(selected.id, { amount: Number(payAmount), method: payMethod });
            alert("Thu tiền thành công.");
            setSelected(null);
            setPayAmount("");
            await load();
        } catch (e: any) { alert(e?.message ?? "Thanh toán thất bại"); }
        finally { setBusy(false); }
    };

    const onCancel = async (id: string) => {
        if (!confirm("Huỷ hoá đơn này?")) return;
        try { await billingService.cancelInvoice(id, "Receptionist cancel"); await load(); }
        catch (e: any) { alert(e?.message ?? "Huỷ thất bại"); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Thu phí — Hoá đơn"
                subtitle="Tra cứu hoá đơn, thu tiền offline, tạo QR thanh toán."
                icon="receipt_long"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Hoá đơn" },
                ]}
                actions={
                    <div className="flex gap-2">
                        <Link href="/portal/receptionist/payments" className="px-3 py-2 text-sm rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100">QR / online</Link>
                        <Link href="/portal/receptionist/refunds" className="px-3 py-2 text-sm rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100">Hoàn tiền</Link>
                        <Link href="/portal/receptionist/billing/new" className="px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white hover:bg-[#2a6da8]">+ Tạo hoá đơn</Link>
                    </div>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng hoá đơn" value={stats.total} icon="receipt" color="blue" loading={loading} />
                <StatCard label="Chờ thu" value={stats.pending} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Đã thu" value={stats.paid} icon="paid" color="emerald" loading={loading} />
                <StatCard label="Doanh thu" value={fmtMoney(stats.revenue)} icon="payments" color="violet" loading={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm BN / mã hoá đơn…" className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Mã</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-right px-4 py-3">Tổng</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-left px-4 py-3">Ngày</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6}><EmptyState icon="receipt" title="Không có hoá đơn" /></td></tr>
                            ) : filtered.map((inv: any) => {
                                const status = (inv.status ?? "PENDING").toUpperCase();
                                const meta = STATUS_META[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={inv.id}>
                                        <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{inv.invoice_code ?? `#${(inv.id ?? "").toString().slice(0, 8)}`}</td>
                                        <td className="px-4 py-3 font-medium">{inv.patient_name ?? "—"}</td>
                                        <td className="px-4 py-3 text-right font-bold">{fmtMoney(inv.total ?? inv.total_amount)}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span></td>
                                        <td className="px-4 py-3 text-[#687582]">{fmt(inv.created_at ?? inv.createdAt)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex gap-1">
                                                {(status === "PENDING" || status === "PARTIALLY_PAID") && (
                                                    <button onClick={() => { setSelected(inv); setPayAmount(String(inv.total ?? inv.total_amount ?? "")); }} className="px-2 py-1 text-xs rounded bg-[#3C81C6] text-white">Thu tiền</button>
                                                )}
                                                {status !== "CANCELLED" && status !== "PAID" && (
                                                    <button onClick={() => onCancel(inv.id)} className="px-2 py-1 text-xs rounded text-rose-600 hover:bg-rose-50">Huỷ</button>
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

            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                            <h3 className="text-lg font-bold">Thu tiền hoá đơn</h3>
                            <p className="text-xs text-[#687582] font-mono">{selected.invoice_code ?? `#${selected.id?.slice?.(0, 8)}`}</p>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            <div><p className="text-xs text-[#687582]">Bệnh nhân</p><p className="font-medium">{selected.patient_name ?? "—"}</p></div>
                            <div><p className="text-xs text-[#687582]">Tổng tiền</p><p className="text-2xl font-bold">{fmtMoney(selected.total ?? selected.total_amount)}</p></div>
                            <div>
                                <label className="block text-xs text-[#687582] mb-1">Phương thức</label>
                                <select value={payMethod} onChange={e => setPayMethod(e.target.value as any)} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                                    <option value="CASH">Tiền mặt</option>
                                    <option value="BANK">Chuyển khoản</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-[#687582] mb-1">Số tiền thu</label>
                                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end gap-2">
                            <button onClick={() => setSelected(null)} className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">Huỷ</button>
                            <button onClick={onPay} disabled={busy || !payAmount} className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white disabled:opacity-50">
                                Xác nhận thu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
