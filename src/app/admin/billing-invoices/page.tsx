"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { BILLING_INVOICE_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type InvoiceStatus = "DRAFT" | "PENDING" | "PAID" | "PARTIALLY_PAID" | "CANCELLED";

interface Invoice {
    id: string;
    code: string;
    patientName: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: InvoiceStatus;
    issuedAt?: string;
    dueAt?: string;
    encounterCode?: string;
}

const STATUS_META: Record<InvoiceStatus, { label: string; color: string; icon: string }> = {
    DRAFT: { label: "Nháp", color: "amber", icon: "edit_note" },
    PENDING: { label: "Chờ TT", color: "blue", icon: "pending" },
    PARTIALLY_PAID: { label: "TT 1 phần", color: "violet", icon: "check_circle" },
    PAID: { label: "Đã TT", color: "emerald", icon: "done_all" },
    CANCELLED: { label: "Đã huỷ", color: "red", icon: "cancel" },
};

function normalizeStatus(raw: any, paid: number, total: number): InvoiceStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    if (s === "PAID" || paid >= total) return "PAID";
    if (s === "PARTIALLY_PAID" || (paid > 0 && paid < total)) return "PARTIALLY_PAID";
    if (s === "DRAFT") return "DRAFT";
    return "PENDING";
}

function mapInvoice(r: any): Invoice {
    const total = Number(r.total_amount ?? r.totalAmount ?? r.total ?? 0);
    const paid = Number(r.paid_amount ?? r.paidAmount ?? 0);
    return {
        id: String(r.invoice_id ?? r.id ?? ""),
        code: r.code ?? r.invoice_code ?? "",
        patientName: r.patient_name ?? r.patientName ?? "—",
        totalAmount: total,
        paidAmount: paid,
        dueAmount: Math.max(0, total - paid),
        status: normalizeStatus(r.status, paid, total),
        issuedAt: r.issued_at ?? r.created_at ?? "",
        dueAt: r.due_at ?? r.dueAt ?? "",
        encounterCode: r.encounter_code ?? r.encounterCode ?? "",
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

export default function BillingInvoicesPage() {
    const toast = useToast();
    const t = useTranslations("pages.billingInvoices");
    const tc = useTranslations("common");
    const [items, setItems] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(BILLING_INVOICE_ENDPOINTS.LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapInvoice));
        } catch {
            setError("Không tải được danh sách hoá đơn.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((i) => {
            if (statusFilter !== "all" && i.status !== statusFilter) return false;
            if (q && !`${i.code} ${i.patientName} ${i.encounterCode ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, statusFilter]);

    const stats = useMemo(() => ({
        total: items.length,
        pending: items.filter((i) => i.status === "PENDING" || i.status === "PARTIALLY_PAID").length,
        paid: items.filter((i) => i.status === "PAID").length,
        totalRevenue: items.filter((i) => i.status !== "CANCELLED").reduce((s, i) => s + i.totalAmount, 0),
        totalDue: items.filter((i) => i.status === "PENDING" || i.status === "PARTIALLY_PAID").reduce((s, i) => s + i.dueAmount, 0),
    }), [items]);

    const handleCancel = async (i: Invoice) => {
        const reason = prompt("Lý do huỷ hoá đơn:");
        if (!reason) return;
        try {
            await axiosClient.patch(BILLING_INVOICE_ENDPOINTS.CANCEL(i.id), { reason });
            toast.success("Đã huỷ."); await load();
        } catch { toast.error("Không huỷ được."); }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="receipt"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng HĐ" value={stats.total} icon="receipt" color="blue" loading={loading} />
                <StatCard label="Chưa TT" value={stats.pending} icon="pending" color="amber" loading={loading} />
                <StatCard label="Đã TT" value={stats.paid} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Tổng doanh thu" value={formatVND(stats.totalRevenue)} icon="payments" color="violet" loading={loading} />
            </div>

            {stats.totalDue > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "24px" }}>warning</span>
                    <div>
                        <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">Công nợ chưa thu</div>
                        <div className="text-xs text-amber-700 dark:text-amber-300 font-mono font-bold">{formatVND(stats.totalDue)}</div>
                    </div>
                </div>
            )}

            <FilterBar
                searchPlaceholder="Tìm mã HĐ, BN, encounter..."
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
                <EmptyState icon="receipt" title="Chưa có hoá đơn" description={items.length === 0 ? "Hoá đơn được tạo từ phiên khám hoặc generate manual." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Mã HĐ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bệnh nhân</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Encounter</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Tổng</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Đã TT</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Còn nợ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Trạng thái</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Ngày</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((i, idx) => {
                                    const meta = STATUS_META[i.status];
                                    return (
                                        <tr key={i.id || `inv-${idx}`} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{i.code}</td>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">{i.patientName}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-[#687582]">{i.encounterCode || "—"}</td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold">{formatVND(i.totalAmount)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-emerald-600">{formatVND(i.paidAmount)}</td>
                                            <td className={`px-4 py-3 text-right font-mono font-bold ${i.dueAmount > 0 ? "text-red-600" : "text-[#687582]"}`}>
                                                {i.dueAmount > 0 ? formatVND(i.dueAmount) : "—"}
                                            </td>
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
                                            <td className="px-4 py-3 text-xs text-[#687582]">{formatDT(i.issuedAt)}</td>
                                            <td className="px-4 py-3 text-right">
                                                {i.status !== "CANCELLED" && i.status !== "PAID" && (
                                                    <button onClick={() => handleCancel(i)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Huỷ">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cancel</span>
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
