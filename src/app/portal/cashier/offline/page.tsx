"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { BILLING_OFFLINE_PAYMENT_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface Transaction {
    id: string;
    code: string;
    invoiceCode?: string;
    patientName: string;
    amount: number;
    method: "CASH" | "CARD" | "QR";
    status: "SUCCESS" | "VOIDED";
    terminalName?: string;
    paidAt: string;
    cashierName?: string;
}

const METHOD_META: Record<string, { label: string; icon: string; color: string }> = {
    CASH: { label: "Tiền mặt", icon: "payments", color: "emerald" },
    CARD: { label: "Thẻ", icon: "credit_card", color: "blue" },
    QR: { label: "QR", icon: "qr_code_2", color: "violet" },
};

function normalizeMethod(raw: any): Transaction["method"] {
    const s = String(raw ?? "").toUpperCase();
    if (s === "CARD" || s === "POS") return "CARD";
    if (s === "QR" || s === "MOMO" || s === "VNPAY") return "QR";
    return "CASH";
}

function mapTxn(r: any): Transaction {
    return {
        id: String(r.transaction_id ?? r.id ?? ""),
        code: r.code ?? r.transaction_code ?? "",
        invoiceCode: r.invoice_code ?? r.invoiceCode ?? "",
        patientName: r.patient_name ?? r.patientName ?? "—",
        amount: Number(r.amount ?? 0),
        method: normalizeMethod(r.payment_method ?? r.method),
        status: r.is_voided || r.status === "VOIDED" ? "VOIDED" : "SUCCESS",
        terminalName: r.terminal_name ?? r.terminalName ?? "",
        paidAt: r.paid_at ?? r.created_at ?? "",
        cashierName: r.cashier_name ?? r.cashierName ?? "",
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

export default function CashierOfflinePage() {
    const t = useTranslations("pages.portal.cashier.offline");
    const toast = useToast();
    const [txns, setTxns] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [methodFilter, setMethodFilter] = useState("all");
    const [showPay, setShowPay] = useState(false);
    const [payForm, setPayForm] = useState({ invoiceCode: "", amount: 0, method: "CASH", note: "" });
    const [paying, setPaying] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(BILLING_OFFLINE_PAYMENT_ENDPOINTS.TRANSACTIONS, { params: { limit: 100 } });
            const { data } = unwrapList<any>(res);
            setTxns(data.map(mapTxn));
        } catch {
            setError("Không tải được giao dịch POS.");
            setTxns([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return txns.filter((t) => {
            if (methodFilter !== "all" && t.method !== methodFilter) return false;
            if (q && !`${t.code} ${t.invoiceCode ?? ""} ${t.patientName} ${t.cashierName ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [txns, search, methodFilter]);

    const stats = useMemo(() => {
        const success = txns.filter((t) => t.status === "SUCCESS");
        return {
            total: txns.length,
            success: success.length,
            voided: txns.filter((t) => t.status === "VOIDED").length,
            amount: success.reduce((s, t) => s + t.amount, 0),
        };
    }, [txns]);

    const handlePay = async () => {
        if (!payForm.invoiceCode.trim() || payForm.amount <= 0) {
            toast.warning("Nhập mã HĐ và số tiền.");
            return;
        }
        setPaying(true);
        try {
            await axiosClient.post(BILLING_OFFLINE_PAYMENT_ENDPOINTS.PAY, {
                invoice_code: payForm.invoiceCode.trim(),
                amount: payForm.amount,
                payment_method: payForm.method,
                note: payForm.note.trim() || undefined,
            });
            toast.success("Đã thu tiền.");
            setShowPay(false);
            setPayForm({ invoiceCode: "", amount: 0, method: "CASH", note: "" });
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không thu được tiền.");
        } finally {
            setPaying(false);
        }
    };

    const handleVoid = async (t: Transaction) => {
        const reason = prompt("Lý do huỷ giao dịch:");
        if (!reason) return;
        try {
            await axiosClient.post(BILLING_OFFLINE_PAYMENT_ENDPOINTS.VOID_TRANSACTION(t.id), { reason });
            toast.success("Đã huỷ giao dịch.");
            await load();
        } catch {
            toast.error("Không huỷ được.");
        }
    };

    const handlePrintReceipt = async (t: Transaction) => {
        try {
            await axiosClient.get(BILLING_OFFLINE_PAYMENT_ENDPOINTS.RECEIPT_BY_TRANSACTION(t.id));
            toast.success("Đã in biên lai.");
        } catch {
            toast.error("Không in được.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="point_of_sale"
                breadcrumbs={[{ label: "Thu ngân", href: "/portal/cashier" }, { label: "POS offline" }]}
                actions={
                    <button onClick={() => setShowPay(true)} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>point_of_sale</span>
                        Thu tiền
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Giao dịch" value={stats.total} icon="receipt" color="blue" loading={loading} />
                <StatCard label="Thành công" value={stats.success} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Đã huỷ" value={stats.voided} icon="cancel" color="red" loading={loading} />
                <StatCard label="Tổng thu" value={formatVND(stats.amount)} icon="payments" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo mã GD, HĐ, bệnh nhân..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "method", label: "Phương thức", value: methodFilter, onChange: setMethodFilter,
                    options: [{ value: "all", label: "Tất cả" }, ...Object.entries(METHOD_META).map(([k, v]) => ({ value: k, label: v.label }))],
                }]}
                onReset={() => { setSearch(""); setMethodFilter("all"); }}
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
                <EmptyState icon="point_of_sale" title="Chưa có giao dịch" description={txns.length === 0 ? "Bấm 'Thu tiền' để tạo giao dịch mới." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Mã GD</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">HĐ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bệnh nhân</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Số tiền</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Phương thức</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Trạng thái</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Thời gian</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((t) => {
                                    const mmeta = METHOD_META[t.method];
                                    return (
                                        <tr key={t.id} className={`border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] ${t.status === "VOIDED" ? "opacity-60" : ""}`}>
                                            <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{t.code}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-[#687582]">{t.invoiceCode || "—"}</td>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">{t.patientName}</td>
                                            <td className={`px-4 py-3 text-right font-mono font-semibold ${t.status === "VOIDED" ? "line-through text-[#687582]" : "text-[#121417] dark:text-white"}`}>{formatVND(t.amount)}</td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    mmeta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                    mmeta.color === "blue" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                                                    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                                                }`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{mmeta.icon}</span>
                                                    {mmeta.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${t.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{t.status}</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[#687582]">{formatDT(t.paidAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {t.status === "SUCCESS" && (
                                                        <>
                                                            <button onClick={() => handlePrintReceipt(t)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/10 rounded-md" title="In biên lai">
                                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>print</span>
                                                            </button>
                                                            <button onClick={() => handleVoid(t)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Huỷ">
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

            {showPay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowPay(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">point_of_sale</span>
                            Thu tiền offline
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Mã hoá đơn *</label>
                                <input value={payForm.invoiceCode} onChange={(e) => setPayForm({ ...payForm, invoiceCode: e.target.value })} placeholder="VD: HD202604001"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-mono dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Số tiền *</label>
                                <input type="number" min={0} step={1000} value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) || 0 })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-mono font-bold dark:text-white" />
                                <div className="text-xs text-[#687582] mt-1">{formatVND(payForm.amount)}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Phương thức</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(METHOD_META).map(([k, v]) => (
                                        <button key={k} onClick={() => setPayForm({ ...payForm, method: k })}
                                            className={`px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1 ${payForm.method === k ? "border-[#3C81C6] bg-[#3C81C6]/10 text-[#3C81C6]" : "border-[#dde0e4] dark:border-[#2d353e] text-[#687582] dark:text-gray-400"}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{v.icon}</span>{v.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Ghi chú</label>
                                <textarea rows={2} value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowPay(false)} disabled={paying} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">Huỷ</button>
                            <button onClick={handlePay} disabled={paying} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                                {paying ? "Đang thu..." : "Xác nhận thu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
