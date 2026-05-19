"use client";
import { useState, useEffect, useCallback } from "react";
import { billingRefundService } from "@/services/billingRefundService";
import { Modal } from "@/components/ui/modal";
import { ADJ_STATUS_META, ADJ_TYPE_LABELS, fmtMoney, fmt, StatusBadge, ConfirmDialog, SkeletonRows, Toast } from "./refund-helpers";

interface Props { toast: (msg: string, type: Toast["type"]) => void; }

export default function AdjustmentTab({ toast }: Props) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selected, setSelected] = useState<any>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<{ type: string; id: string } | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await billingRefundService.getAdjustments();
            const arr = (res as any)?.data ?? [];
            setItems(Array.isArray(arr) ? arr : []);
        } catch { setItems([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = items.filter((r: any) => {
        const st = (r.status ?? "PENDING").toUpperCase();
        return statusFilter === "ALL" || st === statusFilter;
    });

    const doApprove = async () => {
        if (!confirm) return;
        setBusyId(confirm.id);
        try {
            await billingRefundService.approveAdjustment(confirm.id);
            toast("Đã duyệt điều chỉnh", "success");
            setConfirm(null); setSelected(null); load();
        } catch (e: any) { toast(e?.message ?? "Duyệt thất bại", "error"); }
        finally { setBusyId(null); }
    };

    const doApply = async () => {
        if (!confirm) return;
        setBusyId(confirm.id);
        try {
            await billingRefundService.applyAdjustment(confirm.id);
            toast("Đã áp dụng điều chỉnh thành công!", "success");
            setConfirm(null); setSelected(null); load();
        } catch (e: any) { toast(e?.message ?? "Áp dụng thất bại", "error"); }
        finally { setBusyId(null); }
    };

    const doReject = async () => {
        if (!confirm || !rejectReason.trim()) { toast("Vui lòng nhập lý do từ chối", "error"); return; }
        setBusyId(confirm.id);
        try {
            await billingRefundService.rejectAdjustment(confirm.id, rejectReason);
            toast("Đã từ chối điều chỉnh", "success");
            setConfirm(null); setSelected(null); setRejectReason(""); load();
        } catch (e: any) { toast(e?.message ?? "Từ chối thất bại", "error"); }
        finally { setBusyId(null); }
    };

    return (
        <>
            {/* Filter */}
            <div className="flex gap-3 mb-4">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(ADJ_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium">
                    <span className="material-symbols-outlined text-[18px]">refresh</span>Làm mới
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-[#121417] text-xs uppercase text-[#687582] border-b border-[#e5e7eb] dark:border-[#2d353e]">
                            <tr>
                                <th className="text-left px-4 py-3.5 font-semibold">Mã</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Mã GD gốc</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Loại điều chỉnh</th>
                                <th className="text-right px-4 py-3.5 font-semibold">Số tiền</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Trạng thái</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Ngày tạo</th>
                                <th className="text-center px-4 py-3.5 font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? <SkeletonRows cols={7} /> : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-[#687582]">
                                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">tune</span>
                                    Không có điều chỉnh nào
                                </td></tr>
                            ) : filtered.map((r: any, i: number) => {
                                const st = (r.status ?? "PENDING").toUpperCase();
                                const isNeg = parseFloat(r.adjustment_amount) < 0;
                                return (
                                    <tr key={r.adjustment_id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-medium">{r.adjustment_code || `#${(r.adjustment_id || "").toString().slice(0, 8)}`}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{r.transaction_code || (r.original_transaction_id?.toString().slice(0, 8)) || "—"}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${isNeg ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>{ADJ_TYPE_LABELS[r.adjustment_type] ?? r.adjustment_type}</span></td>
                                        <td className={`px-4 py-3 text-right font-bold ${isNeg ? "text-rose-600" : "text-emerald-600"}`}>{isNeg ? "-" : "+"}{fmtMoney(Math.abs(parseFloat(r.adjustment_amount)))}</td>
                                        <td className="px-4 py-3"><StatusBadge status={st} meta={ADJ_STATUS_META} /></td>
                                        <td className="px-4 py-3 text-[#687582] text-xs">{fmt(r.requested_at || r.created_at)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => setSelected(r)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">visibility</span>Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Chi tiết Điều chỉnh Giao dịch" size="lg">
                {selected && (() => {
                    const st = (selected.status ?? "PENDING").toUpperCase();
                    const meta = ADJ_STATUS_META[st] ?? { label: st, cls: "bg-gray-100 text-gray-700", icon: "info" };
                    return (
                        <div className="space-y-5">
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${meta.cls}`}>
                                <span className="material-symbols-outlined text-2xl">{meta.icon}</span>
                                <div><div className="font-bold">{meta.label}</div><div className="text-xs opacity-80">Mã: {selected.adjustment_code || selected.adjustment_id}</div></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    ["Loại điều chỉnh", ADJ_TYPE_LABELS[selected.adjustment_type] ?? selected.adjustment_type, "tune"],
                                    ["Số tiền", fmtMoney(selected.adjustment_amount), "payments"],
                                    ["Mã hóa đơn", selected.invoice_code || selected.invoice_id?.toString().slice(0, 8), "receipt_long"],
                                    ["Mã GD gốc", selected.transaction_code || selected.original_transaction_id?.toString().slice(0, 8), "swap_horiz"],
                                    ["Người tạo", selected.requested_by_name, "person"],
                                    ["Ngày tạo", fmt(selected.requested_at || selected.created_at), "calendar_today"],
                                ].map(([label, value, icon], idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <div className="flex items-center gap-1 text-xs text-[#687582] mb-1"><span className="material-symbols-outlined text-[14px]">{icon}</span>{label}</div>
                                        <div className="font-medium text-[#121417] dark:text-white text-sm">{value || "—"}</div>
                                    </div>
                                ))}
                            </div>
                            {selected.description && (
                                <div className="p-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl">
                                    <div className="text-xs text-[#687582] mb-1 font-semibold uppercase">Mô tả</div>
                                    <p className="text-sm text-[#121417] dark:text-white">{selected.description}</p>
                                </div>
                            )}
                            {st === "PENDING" && (
                                <div className="flex gap-3 pt-3 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                                    <button onClick={() => setConfirm({ type: "adj_approve", id: selected.adjustment_id })} className="flex-1 flex justify-center items-center gap-2 bg-[#3C81C6] hover:bg-[#2a66a0] text-white px-4 py-2.5 rounded-xl font-medium transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">thumb_up</span>Duyệt
                                    </button>
                                    <button onClick={() => { setRejectReason(""); setConfirm({ type: "adj_reject", id: selected.adjustment_id }); }} className="flex-1 flex justify-center items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 px-4 py-2.5 rounded-xl font-medium transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">cancel</span>Từ chối
                                    </button>
                                </div>
                            )}
                            {st === "APPROVED" && (
                                <div className="flex gap-3 pt-3 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                                    <button onClick={() => setConfirm({ type: "adj_apply", id: selected.adjustment_id })} className="flex-1 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">check_circle</span>Áp dụng điều chỉnh
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            <ConfirmDialog open={confirm?.type === "adj_approve"} title="Duyệt điều chỉnh" message="Xác nhận duyệt yêu cầu điều chỉnh này?"
                confirmLabel="Duyệt" onConfirm={doApprove} onCancel={() => setConfirm(null)} loading={!!busyId} />
            <ConfirmDialog open={confirm?.type === "adj_apply"} title="Áp dụng điều chỉnh" message="Xác nhận áp dụng? Hệ thống sẽ tạo giao dịch bù/hoàn tương ứng."
                confirmLabel="Áp dụng" confirmColor="green" onConfirm={doApply} onCancel={() => setConfirm(null)} loading={!!busyId} />
            <ConfirmDialog open={confirm?.type === "adj_reject"} title="Từ chối điều chỉnh" message="Vui lòng nhập lý do từ chối:"
                confirmLabel="Từ chối" confirmColor="red" onConfirm={doReject} onCancel={() => { setConfirm(null); setRejectReason(""); }} loading={!!busyId}>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Lý do từ chối..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 mt-2" />
            </ConfirmDialog>
        </>
    );
}
