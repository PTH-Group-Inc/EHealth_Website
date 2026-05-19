"use client";
import { useState } from "react";
import { billingRefundService } from "@/services/billingRefundService";
import { Modal } from "@/components/ui/modal";
import { STATUS_META, REASON_LABELS, REFUND_TYPE_LABELS, fmtMoney, fmt, StatusBadge, ConfirmDialog, TimelineView, SkeletonRows, Toast } from "./refund-helpers";

interface Props { items: any[]; loading: boolean; onReload: () => void; toast: (msg: string, type: Toast["type"]) => void; }

export default function RefundTab({ items, loading, onReload, toast }: Props) {
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [tlLoading, setTlLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<{ type: string; id: string } | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const filtered = items.filter((r: any) => {
        const st = (r.status ?? "PENDING").toUpperCase();
        if (statusFilter !== "ALL" && st !== statusFilter) return false;
        if (search) {
            const s = search.toLowerCase();
            const match = [r.patient_name, r.request_code, r.invoice_code, r.reason_detail].some(v => v?.toLowerCase().includes(s));
            if (!match) return false;
        }
        return true;
    });

    const openDetail = async (r: any) => {
        setSelected(r);
        setTlLoading(true);
        try {
            const res = await billingRefundService.getTimeline(r.request_id || r.id);
            setTimeline(Array.isArray(res) ? res : (res as any)?.data ?? []);
        } catch { setTimeline([]); }
        finally { setTlLoading(false); }
    };

    const doApprove = async () => {
        if (!confirm) return;
        setBusyId(confirm.id);
        try {
            await billingRefundService.approve(confirm.id);
            toast("Đã duyệt yêu cầu hoàn tiền", "success");
            setConfirm(null); setSelected(null); onReload();
        } catch (e: any) { toast(e?.message ?? "Duyệt thất bại", "error"); }
        finally { setBusyId(null); }
    };

    const doReject = async () => {
        if (!confirm || !rejectReason.trim()) { toast("Vui lòng nhập lý do từ chối", "error"); return; }
        setBusyId(confirm.id);
        try {
            await billingRefundService.reject(confirm.id, rejectReason);
            toast("Đã từ chối yêu cầu", "success");
            setConfirm(null); setSelected(null); setRejectReason(""); onReload();
        } catch (e: any) { toast(e?.message ?? "Từ chối thất bại", "error"); }
        finally { setBusyId(null); }
    };

    const doProcess = async () => {
        if (!confirm) return;
        setBusyId(confirm.id);
        try {
            await billingRefundService.processRefund(confirm.id);
            toast("Hoàn tiền thành công!", "success");
            setConfirm(null); setSelected(null); onReload();
        } catch (e: any) { toast(e?.message ?? "Xử lý thất bại", "error"); }
        finally { setBusyId(null); }
    };

    return (
        <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex items-center gap-2 flex-1">
                    <span className="material-symbols-outlined text-[#687582] text-[20px]">search</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên BN, mã YC, lý do..."
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-[#121417] text-xs uppercase text-[#687582] border-b border-[#e5e7eb] dark:border-[#2d353e]">
                            <tr>
                                <th className="text-left px-4 py-3.5 font-semibold">Mã YC</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Bệnh nhân</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Loại</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Lý do</th>
                                <th className="text-right px-4 py-3.5 font-semibold">Số tiền hoàn</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Trạng thái</th>
                                <th className="text-left px-4 py-3.5 font-semibold">Ngày tạo</th>
                                <th className="text-center px-4 py-3.5 font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? <SkeletonRows cols={8} /> : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-12 text-[#687582]">
                                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">undo</span>
                                    Không có yêu cầu hoàn tiền nào
                                </td></tr>
                            ) : filtered.map((r: any, i: number) => {
                                const st = (r.status ?? "PENDING").toUpperCase();
                                return (
                                    <tr key={r.request_id || r.id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-medium">{r.request_code || `#${(r.request_id || r.id || "").toString().slice(0, 8)}`}</td>
                                        <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{r.patient_name ?? "—"}</td>
                                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 font-medium">{REFUND_TYPE_LABELS[r.refund_type] ?? r.refund_type ?? "—"}</span></td>
                                        <td className="px-4 py-3 text-[#687582] text-xs max-w-[150px] truncate">{REASON_LABELS[r.reason_category] ?? r.reason_category ?? "—"}</td>
                                        <td className="px-4 py-3 text-right font-bold text-[#3C81C6]">{fmtMoney(r.refund_amount ?? r.amount)}</td>
                                        <td className="px-4 py-3"><StatusBadge status={st} meta={STATUS_META} /></td>
                                        <td className="px-4 py-3 text-[#687582] text-xs">{fmt(r.requested_at || r.created_at)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => openDetail(r)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
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
            <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Chi tiết Yêu cầu Hoàn tiền" size="xl">
                {selected && (() => {
                    const st = (selected.status ?? "PENDING").toUpperCase();
                    const meta = STATUS_META[st] ?? { label: st, cls: "bg-gray-100 text-gray-700", icon: "info" };
                    return (
                        <div className="space-y-5">
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${meta.cls}`}>
                                <span className="material-symbols-outlined text-2xl">{meta.icon}</span>
                                <div>
                                    <div className="font-bold text-base">{meta.label}</div>
                                    <div className="text-xs opacity-80">Mã: {selected.request_code || selected.id}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {[
                                    ["Bệnh nhân", selected.patient_name, "person"],
                                    ["Loại hoàn tiền", REFUND_TYPE_LABELS[selected.refund_type] ?? selected.refund_type, "category"],
                                    ["Danh mục lý do", REASON_LABELS[selected.reason_category] ?? selected.reason_category, "label"],
                                    ["Số tiền gốc", fmtMoney(selected.original_amount), "account_balance"],
                                    ["Số tiền hoàn", fmtMoney(selected.refund_amount ?? selected.amount), "payments"],
                                    ["Phương thức", selected.refund_method ?? "—", "credit_card"],
                                    ["Mã hóa đơn", selected.invoice_code || (selected.invoice_id?.toString().slice(0, 8)), "receipt_long"],
                                    ["Mã GD gốc", selected.transaction_code || (selected.transaction_id?.toString().slice(0, 8)), "swap_horiz"],
                                    ["Ngày tạo", fmt(selected.requested_at || selected.created_at), "calendar_today"],
                                ].map(([label, value, icon], idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                        <div className="flex items-center gap-1 text-xs text-[#687582] mb-1">
                                            <span className="material-symbols-outlined text-[14px]">{icon}</span>{label}
                                        </div>
                                        <div className="font-medium text-[#121417] dark:text-white text-sm">{value || "—"}</div>
                                    </div>
                                ))}
                            </div>
                            {selected.reason_detail && (
                                <div className="p-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl">
                                    <div className="text-xs text-[#687582] mb-1 font-semibold uppercase">Chi tiết lý do</div>
                                    <p className="text-sm text-[#121417] dark:text-white whitespace-pre-wrap">{selected.reason_detail}</p>
                                </div>
                            )}
                            {/* Timeline */}
                            <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-4">
                                <h4 className="text-sm font-bold text-[#121417] dark:text-white mb-3 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[18px]">timeline</span>Lịch sử xử lý
                                </h4>
                                <TimelineView events={timeline} loading={tlLoading} />
                            </div>
                            {/* Actions */}
                            {st === "PENDING" && (
                                <div className="flex gap-3 pt-3 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                                    <button onClick={() => setConfirm({ type: "approve", id: selected.request_id || selected.id })}
                                        className="flex-1 flex justify-center items-center gap-2 bg-[#3C81C6] hover:bg-[#2a66a0] text-white px-4 py-2.5 rounded-xl font-medium transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">thumb_up</span>Duyệt
                                    </button>
                                    <button onClick={() => { setRejectReason(""); setConfirm({ type: "reject", id: selected.request_id || selected.id }); }}
                                        className="flex-1 flex justify-center items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 px-4 py-2.5 rounded-xl font-medium transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">cancel</span>Từ chối
                                    </button>
                                </div>
                            )}
                            {st === "APPROVED" && (
                                <div className="flex gap-3 pt-3 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                                    <button onClick={() => setConfirm({ type: "process", id: selected.request_id || selected.id })}
                                        className="flex-1 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">payments</span>Thực hiện hoàn tiền
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            {/* Confirm Dialogs */}
            <ConfirmDialog open={confirm?.type === "approve"} title="Duyệt yêu cầu hoàn tiền" message="Xác nhận duyệt yêu cầu hoàn tiền này? Sau khi duyệt, yêu cầu sẽ sẵn sàng để thực hiện hoàn tiền."
                confirmLabel="Duyệt" onConfirm={doApprove} onCancel={() => setConfirm(null)} loading={!!busyId} />
            <ConfirmDialog open={confirm?.type === "process"} title="Thực hiện hoàn tiền" message="Xác nhận thực hiện hoàn tiền? Hệ thống sẽ tạo giao dịch hoàn và cập nhật hóa đơn."
                confirmLabel="Hoàn tiền" confirmColor="green" onConfirm={doProcess} onCancel={() => setConfirm(null)} loading={!!busyId} />
            <ConfirmDialog open={confirm?.type === "reject"} title="Từ chối yêu cầu" message="Vui lòng nhập lý do từ chối:"
                confirmLabel="Từ chối" confirmColor="red" onConfirm={doReject} onCancel={() => { setConfirm(null); setRejectReason(""); }} loading={!!busyId}>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Lý do từ chối..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400 mt-2" />
            </ConfirmDialog>
        </>
    );
}
