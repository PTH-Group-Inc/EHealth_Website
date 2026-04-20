"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { BILLING_DOCUMENT_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type DocStatus = "DRAFT" | "ISSUED" | "CANCELLED" | "SENT";

interface EInvoice {
    id: string;
    code: string;
    invoiceCode?: string;
    customerName: string;
    amount: number;
    taxCode?: string;
    status: DocStatus;
    issuedAt?: string;
    sentAt?: string;
    note?: string;
}

const STATUS_META: Record<DocStatus, { label: string; color: string; icon: string }> = {
    DRAFT: { label: "Nháp", color: "amber", icon: "edit_note" },
    ISSUED: { label: "Đã phát hành", color: "emerald", icon: "check_circle" },
    SENT: { label: "Đã gửi KH", color: "blue", icon: "send" },
    CANCELLED: { label: "Đã huỷ", color: "red", icon: "cancel" },
};

function normalizeStatus(raw: any): DocStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "ISSUED" || s === "PUBLISHED") return "ISSUED";
    if (s === "SENT" || s === "DELIVERED") return "SENT";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    return "DRAFT";
}

function mapDoc(r: any): EInvoice {
    return {
        id: String(r.document_id ?? r.e_invoice_id ?? r.id ?? ""),
        code: r.code ?? r.document_code ?? "",
        invoiceCode: r.invoice_code ?? r.invoiceCode ?? "",
        customerName: r.customer_name ?? r.customerName ?? "—",
        amount: Number(r.amount ?? r.total_amount ?? 0),
        taxCode: r.tax_code ?? r.taxCode ?? "",
        status: normalizeStatus(r.status),
        issuedAt: r.issued_at ?? r.issuedAt ?? "",
        sentAt: r.sent_at ?? r.sentAt ?? "",
        note: r.note ?? "",
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

export default function EInvoicesPage() {
    const toast = useToast();
    const [items, setItems] = useState<EInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(BILLING_DOCUMENT_ENDPOINTS.E_INVOICES, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapDoc));
        } catch {
            setError("Không tải được hoá đơn điện tử.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((it) => {
            if (statusFilter !== "all" && it.status !== statusFilter) return false;
            if (q && !`${it.code} ${it.invoiceCode ?? ""} ${it.customerName} ${it.taxCode ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, statusFilter]);

    const stats = useMemo(() => ({
        total: items.length,
        issued: items.filter((it) => it.status === "ISSUED" || it.status === "SENT").length,
        draft: items.filter((it) => it.status === "DRAFT").length,
        amount: items.filter((it) => it.status !== "CANCELLED").reduce((s, it) => s + it.amount, 0),
    }), [items]);

    const handleIssue = async (it: EInvoice) => {
        if (!confirm(`Phát hành hoá đơn ${it.code}?`)) return;
        try {
            await axiosClient.patch(BILLING_DOCUMENT_ENDPOINTS.ISSUE_E_INVOICE(it.id));
            toast.success("Đã phát hành.");
            await load();
        } catch {
            toast.error("Không phát hành được.");
        }
    };

    const handleSend = async (it: EInvoice) => {
        if (!confirm(`Gửi hoá đơn ${it.code} cho khách hàng?`)) return;
        try {
            await axiosClient.patch(BILLING_DOCUMENT_ENDPOINTS.SEND_E_INVOICE(it.id));
            toast.success("Đã gửi.");
            await load();
        } catch {
            toast.error("Không gửi được.");
        }
    };

    const handleDownload = (it: EInvoice) => {
        window.open(BILLING_DOCUMENT_ENDPOINTS.PRINT_DATA(it.id), "_blank");
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Hoá đơn điện tử (E-Invoice)"
                subtitle="Phát hành, gửi và lưu trữ hoá đơn điện tử theo quy định"
                icon="receipt_long"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "E-Invoice" }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng HĐ" value={stats.total} icon="receipt_long" color="blue" loading={loading} />
                <StatCard label="Đã phát hành" value={stats.issued} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Nháp" value={stats.draft} icon="edit_note" color="amber" loading={loading} />
                <StatCard label="Tổng giá trị" value={formatVND(stats.amount)} icon="payments" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm mã HĐ, KH, MST..."
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
                <EmptyState icon="receipt_long" title="Chưa có hoá đơn điện tử" description={items.length === 0 ? "Hoá đơn sẽ được tạo từ trang Thanh toán." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Mã HĐ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Khách hàng</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">MST</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Số tiền</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Trạng thái</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thời gian</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((it) => {
                                    const meta = STATUS_META[it.status];
                                    return (
                                        <tr key={it.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{it.code || it.invoiceCode}</td>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">{it.customerName}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-[#687582] dark:text-gray-400">{it.taxCode || "—"}</td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-[#121417] dark:text-white">{formatVND(it.amount)}</td>
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
                                            <td className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400">{formatDT(it.issuedAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => handleDownload(it)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title="Tải PDF">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
                                                    </button>
                                                    {it.status === "DRAFT" && (
                                                        <button onClick={() => handleIssue(it)} className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md" title="Phát hành">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>publish</span>
                                                        </button>
                                                    )}
                                                    {it.status === "ISSUED" && (
                                                        <button onClick={() => handleSend(it)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/10 rounded-md" title="Gửi KH">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>send</span>
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
