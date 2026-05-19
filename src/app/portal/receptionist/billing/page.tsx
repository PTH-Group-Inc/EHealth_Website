"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { billingService } from "@/services/billingService";
import { StatusBadge, fmtDate, fmtDateTime, fmtMoney, useToast, ToastContainer, ConfirmDialog, SkeletonRows } from "./billing-helpers";
import { PageHeader, StatCard } from "@/components/shared/layout";

// ── types ───────────────────────────────────────────────────────────
interface Invoice { invoices_id: string; invoice_code: string; patient_name: string; patient_code?: string; encounter_id?: string; total_amount: string; discount_amount: string; insurance_amount: string; net_amount: string; paid_amount: string; status: string; created_at: string; due_date?: string; notes?: string; items?: any[]; payment_history?: any[]; }
type ActionMenu = { id: string; el: HTMLElement } | null;

export default function ReceptionistBillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const { toasts, add: toast } = useToast();

    // modals
    const [payModal, setPayModal] = useState<Invoice | null>(null);
    const [cancelModal, setCancelModal] = useState<Invoice | null>(null);
    const [detailModal, setDetailModal] = useState<Invoice | null>(null);
    const [actionMenu, setActionMenu] = useState<ActionMenu>(null);
    const [busy, setBusy] = useState(false);

    // pay form
    const [payMethod, setPayMethod] = useState("CASH");
    const [payAmount, setPayAmount] = useState("");
    const [payNote, setPayNote] = useState("");
    const [cancelReason, setCancelReason] = useState("");

    const menuRef = useRef<HTMLDivElement>(null);

    // ── fetch ────────────────────────────────────────────────────────
    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 15 };
            if (statusFilter) params.status = statusFilter;
            if (search.trim()) params.search = search.trim();
            const res = await billingService.getInvoices(params);
            const d = res.data;
            setInvoices(d.data || []);
            setMeta({ total: d.total || 0, totalPages: d.totalPages || 1 });
        } catch { toast("Không tải được danh sách hóa đơn", "error"); }
        setLoading(false);
    }, [page, statusFilter, search]);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActionMenu(null); };
        document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
    }, []);

    // ── stats ────────────────────────────────────────────────────────
    const stats = invoices.reduce((a, inv) => {
        a.total++;
        if (inv.status === "PAID") a.paid++;
        else if (inv.status === "UNPAID" || inv.status === "PENDING") a.unpaid++;
        else if (inv.status === "PARTIALLY_PAID") a.partial++;
        a.amount += Number(inv.net_amount || 0);
        return a;
    }, { total: 0, paid: 0, unpaid: 0, partial: 0, amount: 0 });

    // ── pay ──────────────────────────────────────────────────────────
    const openPay = (inv: Invoice) => {
        const remaining = Math.max(0, Number(inv.net_amount) - Number(inv.paid_amount));
        setPayAmount(String(remaining));
        setPayMethod("CASH");
        setPayNote("");
        setPayModal(inv);
        setActionMenu(null);
    };
    const submitPay = async () => {
        if (!payModal) return;
        const amt = Number(payAmount);
        if (!amt || amt <= 0) { toast("Số tiền không hợp lệ", "error"); return; }
        setBusy(true);
        try {
            await billingService.pay(payModal.invoices_id, { payment_method: payMethod, amount: amt, notes: payNote || undefined });
            toast("Thu phí thành công!");
            setPayModal(null);
            fetchInvoices();
        } catch (e: any) { toast(e?.response?.data?.message || "Lỗi thu phí", "error"); }
        setBusy(false);
    };

    // ── cancel ───────────────────────────────────────────────────────
    const openCancel = (inv: Invoice) => { setCancelReason(""); setCancelModal(inv); setActionMenu(null); };
    const submitCancel = async () => {
        if (!cancelModal) return;
        if (!cancelReason.trim()) { toast("Vui lòng nhập lý do huỷ", "error"); return; }
        setBusy(true);
        try {
            await billingService.cancelInvoice(cancelModal.invoices_id, cancelReason.trim());
            toast("Đã huỷ hóa đơn!");
            setCancelModal(null);
            fetchInvoices();
        } catch (e: any) { toast(e?.response?.data?.message || "Lỗi huỷ hóa đơn", "error"); }
        setBusy(false);
    };

    // ── detail ────────────────────────────────────────────────────────
    const openDetail = async (inv: Invoice) => {
        setActionMenu(null);
        try {
            const res = await billingService.getDetail(inv.invoices_id);
            setDetailModal(res.data.data || inv);
        } catch { setDetailModal(inv); }
    };

    // ── action menu items ────────────────────────────────────────────
    const menuItems = (inv: Invoice) => {
        const items: { icon: string; label: string; action: () => void; color?: string }[] = [
            { icon: "visibility", label: "Xem chi tiết", action: () => openDetail(inv) },
        ];
        if (["UNPAID", "PENDING", "PARTIALLY_PAID"].includes(inv.status))
            items.push({ icon: "payments", label: "Thu phí", action: () => openPay(inv), color: "text-emerald-600" });
        if (inv.status !== "CANCELLED" && inv.status !== "PAID")
            items.push({ icon: "cancel", label: "Huỷ hóa đơn", action: () => openCancel(inv), color: "text-rose-600" });
        return items;
    };

    // ── render ────────────────────────────────────────────────────────
    return (
        <>
            <ToastContainer toasts={toasts} />

            {/* Header */}
            <PageHeader
                title="Quản lý Thu phí"
                subtitle="Quản lý hóa đơn & thanh toán tại quầy lễ tân"
                icon="receipt_long"
                actions={
                    <button onClick={() => fetchInvoices()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3C81C6] text-white text-sm font-medium hover:bg-[#2a66a0] shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 transition-all">
                        <span className="material-symbols-outlined text-[18px]">refresh</span>Tải lại
                    </button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Tổng hóa đơn" value={String(stats.total)} icon="receipt_long" color="blue" />
                <StatCard label="Đã thu đủ" value={String(stats.paid)} icon="check_circle" color="emerald" />
                <StatCard label="Chưa thu" value={String(stats.unpaid)} icon="pending" color="amber" />
                <StatCard label="Thu một phần" value={String(stats.partial)} icon="hourglass_empty" color="violet" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#687582] text-[20px]">search</span>
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm mã HĐ, tên BN..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1a1f26] text-sm focus:ring-2 focus:ring-[#3C81C6] outline-none" />
                </div>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1a1f26] text-sm min-w-[160px] focus:ring-2 focus:ring-[#3C81C6] outline-none">
                    <option value="">Tất cả trạng thái</option>
                    <option value="UNPAID">Chưa thu</option>
                    <option value="PARTIALLY_PAID">Thu một phần</option>
                    <option value="PAID">Đã thu đủ</option>
                    <option value="CANCELLED">Đã huỷ</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-lg border border-[#e5e7eb] dark:border-[#2d353e] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-gradient-to-r from-[#3C81C6]/5 to-[#3C81C6]/10 text-left">
                            {["Mã HĐ", "Bệnh nhân", "Tổng tiền", "Đã thu", "Còn lại", "Trạng thái", "Ngày tạo", ""].map(h => (
                                <th key={h} className="px-4 py-3.5 font-semibold text-[#687582] text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody className="divide-y divide-[#f0f2f5] dark:divide-[#2d353e]">
                            {loading ? <SkeletonRows cols={8} /> : invoices.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-16 text-[#687582]">
                                    <span className="material-symbols-outlined text-5xl mb-2 block opacity-30">receipt_long</span>Không tìm thấy hóa đơn nào
                                </td></tr>
                            ) : invoices.map(inv => {
                                const remaining = Math.max(0, Number(inv.net_amount) - Number(inv.paid_amount));
                                return (
                                    <tr key={inv.invoices_id} className="hover:bg-[#f7f9fb] dark:hover:bg-[#252b33] transition-colors">
                                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#3C81C6]">{inv.invoice_code}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-medium">{inv.patient_name || "—"}</div>
                                            {inv.patient_code && <div className="text-xs text-[#687582] mt-0.5">{inv.patient_code}</div>}
                                        </td>
                                        <td className="px-4 py-3.5 font-semibold">{fmtMoney(inv.net_amount)}</td>
                                        <td className="px-4 py-3.5 text-emerald-600 font-medium">{fmtMoney(inv.paid_amount)}</td>
                                        <td className="px-4 py-3.5 font-medium" style={{ color: remaining > 0 ? "#e53e3e" : "#687582" }}>
                                            {remaining > 0 ? fmtMoney(remaining) : "—"}
                                        </td>
                                        <td className="px-4 py-3.5"><StatusBadge status={inv.status} /></td>
                                        <td className="px-4 py-3.5 text-[#687582] text-xs">{fmtDate(inv.created_at)}</td>
                                        <td className="px-4 py-3.5 relative">
                                            <button onClick={e => setActionMenu(actionMenu?.id === inv.invoices_id ? null : { id: inv.invoices_id, el: e.currentTarget })}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                            </button>
                                            {actionMenu?.id === inv.invoices_id && (
                                                <div ref={menuRef} className="absolute right-4 top-full mt-1 bg-white dark:bg-[#252b33] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl shadow-xl z-30 min-w-[180px] py-1.5">
                                                    {menuItems(inv).map((mi, idx) => (
                                                        <button key={idx} onClick={mi.action}
                                                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${mi.color || ""}`}>
                                                            <span className="material-symbols-outlined text-[18px]">{mi.icon}</span>{mi.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f2f5] dark:border-[#2d353e]">
                        <span className="text-xs text-[#687582]">Trang {page}/{meta.totalPages} · {meta.total} kết quả</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">← Trước</button>
                            <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 rounded-lg border text-xs font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">Sau →</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ PAY MODAL ═══ */}
            <ConfirmDialog open={!!payModal} title="Thu phí hóa đơn" message={`Thu phí cho hóa đơn ${payModal?.invoice_code}`}
                confirmLabel="Xác nhận thu phí" confirmColor="green" onConfirm={submitPay} onCancel={() => setPayModal(null)} loading={busy}>
                <div className="space-y-3 mt-3">
                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-[#1a1f26] rounded-xl p-3">
                        <div><span className="text-[#687582]">Tổng tiền:</span> <strong>{fmtMoney(payModal?.net_amount)}</strong></div>
                        <div><span className="text-[#687582]">Đã thu:</span> <strong className="text-emerald-600">{fmtMoney(payModal?.paid_amount)}</strong></div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-[#687582]">Phương thức</label>
                        <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1a1f26] text-sm">
                            <option value="CASH">💵 Tiền mặt</option>
                            <option value="BANK_TRANSFER">🏦 Chuyển khoản</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-[#687582]">Số tiền thu</label>
                        <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} min={0}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1a1f26] text-sm font-semibold" />
                        <p className="text-xs text-[#687582] mt-1">= {fmtMoney(payAmount)}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1 text-[#687582]">Ghi chú</label>
                        <input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Tuỳ chọn..."
                            className="w-full px-3 py-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1a1f26] text-sm" />
                    </div>
                </div>
            </ConfirmDialog>

            {/* ═══ CANCEL MODAL ═══ */}
            <ConfirmDialog open={!!cancelModal} title="Huỷ hóa đơn" message={`Xác nhận huỷ hóa đơn ${cancelModal?.invoice_code}? Thao tác này không thể hoàn tác.`}
                confirmLabel="Xác nhận huỷ" confirmColor="red" onConfirm={submitCancel} onCancel={() => setCancelModal(null)} loading={busy}>
                <div className="mt-3">
                    <label className="block text-xs font-medium mb-1 text-[#687582]">Lý do huỷ <span className="text-rose-500">*</span></label>
                    <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={2} placeholder="Nhập lý do huỷ (bắt buộc)..."
                        className="w-full px-3 py-2.5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#1a1f26] text-sm" />
                    {cancelReason.trim() === "" && <p className="text-xs text-rose-500 mt-1">⚠ Lý do huỷ không được để trống</p>}
                </div>
            </ConfirmDialog>

            {/* ═══ DETAIL MODAL ═══ */}
            {detailModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetailModal(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]">receipt_long</span>Chi tiết hóa đơn
                            </h3>
                            <button onClick={() => setDetailModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {/* Info */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-[#687582] text-xs">Mã HĐ</span><div className="font-mono font-bold text-[#3C81C6]">{detailModal.invoice_code}</div></div>
                            <div><span className="text-[#687582] text-xs">Trạng thái</span><div className="mt-0.5"><StatusBadge status={detailModal.status} /></div></div>
                            <div><span className="text-[#687582] text-xs">Bệnh nhân</span><div className="font-medium">{detailModal.patient_name}</div></div>
                            <div><span className="text-[#687582] text-xs">Ngày tạo</span><div>{fmtDateTime(detailModal.created_at)}</div></div>
                        </div>
                        {/* Amounts */}
                        <div className="bg-gray-50 dark:bg-[#1a1f26] rounded-xl p-4 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-[#687582]">Tổng tiền</span><span className="font-semibold">{fmtMoney(detailModal.total_amount)}</span></div>
                            {Number(detailModal.discount_amount) > 0 && <div className="flex justify-between"><span className="text-[#687582]">Giảm giá</span><span className="text-rose-500">-{fmtMoney(detailModal.discount_amount)}</span></div>}
                            {Number(detailModal.insurance_amount) > 0 && <div className="flex justify-between"><span className="text-[#687582]">Bảo hiểm</span><span className="text-blue-500">-{fmtMoney(detailModal.insurance_amount)}</span></div>}
                            <div className="flex justify-between border-t pt-2 border-dashed"><span className="font-semibold">Cần thu</span><span className="font-bold text-lg">{fmtMoney(detailModal.net_amount)}</span></div>
                            <div className="flex justify-between"><span className="text-[#687582]">Đã thu</span><span className="font-semibold text-emerald-600">{fmtMoney(detailModal.paid_amount)}</span></div>
                        </div>
                        {/* Items */}
                        {detailModal.items && detailModal.items.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-[#687582] uppercase tracking-wider mb-2">Danh mục dịch vụ</h4>
                                <div className="space-y-1.5">
                                    {detailModal.items.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm bg-gray-50 dark:bg-[#1a1f26] px-3 py-2 rounded-lg">
                                            <span>{item.item_name || item.service_name} <span className="text-[#687582]">×{item.quantity}</span></span>
                                            <span className="font-medium">{fmtMoney(item.subtotal || item.line_total)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Payment History */}
                        {detailModal.payment_history && detailModal.payment_history.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-[#687582] uppercase tracking-wider mb-2">Lịch sử thanh toán</h4>
                                <div className="space-y-1.5">
                                    {detailModal.payment_history.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-sm bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                                            <div>
                                                <span className="font-medium">{p.payment_method === "CASH" ? "💵 Tiền mặt" : p.payment_method === "BANK_TRANSFER" ? "🏦 Chuyển khoản" : p.payment_method}</span>
                                                <span className="text-xs text-[#687582] ml-2">{fmtDateTime(p.paid_at || p.created_at)}</span>
                                            </div>
                                            <span className="font-semibold text-emerald-600">{fmtMoney(p.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {detailModal.notes && <div className="text-xs text-[#687582] italic bg-gray-50 dark:bg-[#1a1f26] px-3 py-2 rounded-lg">📝 {detailModal.notes}</div>}
                    </div>
                </div>
            )}
        </>
    );
}
