"use client";

/**
 * Đổi ca — Phase I.2 Nhóm 2 #6.
 * Spec: dòng 5371-5421 `/Users/minhquan/EH/Sửa giao diện tổng.md`.
 * Doctor portal chỉ list / detail / create — không có duyệt.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { shiftSwapService, type ShiftSwap, type ShiftSwapStatus } from "@/services/shiftSwapService";
import { staffScheduleService } from "@/services/staffScheduleService";

const STATUS_META: Record<ShiftSwapStatus, { label: string; cls: string }> = {
    PENDING: { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    APPROVED: { label: "Đã duyệt", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    REJECTED: { label: "Từ chối", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
};

const fmtDate = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return v; }
};
const fmtDateTime = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return v; }
};

export default function DoctorShiftSwapsPage() {
    const { user } = useAuth();
    const [list, setList] = useState<ShiftSwap[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [mySchedules, setMySchedules] = useState<any[]>([]);
    const [form, setForm] = useState({ fromScheduleId: "", toScheduleId: "", targetStaffId: "", reason: "" });
    const [selected, setSelected] = useState<ShiftSwap | null>(null);

    const load = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        const [l, s] = await Promise.allSettled([
            shiftSwapService.getList({ requesterId: user.id }),
            staffScheduleService.getByStaff(user.id, { from: new Date().toISOString().slice(0, 10) }),
        ]);
        setList(l.status === "fulfilled" ? ((l.value as any)?.data ?? []) as ShiftSwap[] : []);
        setMySchedules(s.status === "fulfilled" ? (s.value as any)?.data ?? [] : []);
        setLoading(false);
    }, [user?.id]);

    useEffect(() => { load(); }, [load]);

    const stats = useMemo(() => ({
        total: list.length,
        pending: list.filter(x => x.status === "PENDING").length,
        approved: list.filter(x => x.status === "APPROVED").length,
        rejected: list.filter(x => x.status === "REJECTED").length,
    }), [list]);

    const onCreate = async () => {
        if (!form.fromScheduleId) {
            alert("Chọn ca cần đổi.");
            return;
        }
        setSaving(true);
        try {
            await shiftSwapService.request({
                requesterId: user?.id,
                fromScheduleId: form.fromScheduleId,
                toScheduleId: form.toScheduleId || undefined,
                targetStaffId: form.targetStaffId || undefined,
                reason: form.reason,
            });
            setShowForm(false);
            setForm({ fromScheduleId: "", toScheduleId: "", targetStaffId: "", reason: "" });
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Tạo yêu cầu thất bại");
        } finally {
            setSaving(false);
        }
    };

    const onCancel = async (id: string) => {
        if (!confirm("Huỷ yêu cầu đổi ca này?")) return;
        try {
            await shiftSwapService.cancel(id);
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Huỷ thất bại");
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Đổi ca"
                subtitle="Gửi & theo dõi yêu cầu đổi ca cá nhân."
                icon="swap_horiz"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Đổi ca" },
                ]}
                actions={
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3C81C6] text-white text-sm font-medium hover:bg-[#2a6da8]"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tạo yêu cầu
                    </button>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng yêu cầu" value={stats.total} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Chờ duyệt" value={stats.pending} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Đã duyệt" value={stats.approved} icon="task_alt" color="emerald" loading={loading} />
                <StatCard label="Từ chối" value={stats.rejected} icon="block" color="red" loading={loading} />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-[#687582]">Đang tải…</div>
                ) : list.length === 0 ? (
                    <EmptyState icon="swap_horiz" title="Chưa có yêu cầu đổi ca" description="Tạo yêu cầu đầu tiên khi cần đổi lịch trực." />
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Ca hiện tại</th>
                                <th className="text-left px-4 py-3">Ca đề xuất</th>
                                <th className="text-left px-4 py-3">Người nhận</th>
                                <th className="text-left px-4 py-3">Gửi lúc</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {list.map(s => {
                                const meta = STATUS_META[s.status] ?? { label: s.status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3">{fmtDate(s.fromDate)} {s.fromScheduleId ? <span className="text-xs text-[#687582] font-mono">#{s.fromScheduleId.slice(0, 6)}</span> : null}</td>
                                        <td className="px-4 py-3">{s.toDate ? fmtDate(s.toDate) : "—"} {s.toScheduleId ? <span className="text-xs text-[#687582] font-mono">#{s.toScheduleId.slice(0, 6)}</span> : null}</td>
                                        <td className="px-4 py-3">{s.targetStaffName ?? (s.targetStaffId ? `#${s.targetStaffId.slice(0, 6)}` : "—")}</td>
                                        <td className="px-4 py-3 text-[#687582]">{fmtDateTime(s.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => setSelected(s)} className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                Chi tiết
                                            </button>
                                            {s.status === "PENDING" && (
                                                <button onClick={() => onCancel(s.id)} className="ml-1 px-2 py-1 text-xs rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                                    Huỷ
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-lg font-bold">Chi tiết yêu cầu đổi ca</h3>
                            <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-[#687582]">Ca hiện tại</p>
                                    <p className="font-medium">{fmtDate(selected.fromDate)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582]">Ca đề xuất đổi</p>
                                    <p className="font-medium">{selected.toDate ? fmtDate(selected.toDate) : "—"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-[#687582]">Người nhận</p>
                                <p className="font-medium">{selected.targetStaffName ?? (selected.targetStaffId ? `#${selected.targetStaffId}` : "Để hệ thống chọn")}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#687582]">Lý do</p>
                                <p>{selected.reason ?? <span className="italic text-[#687582]">Không có</span>}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#687582]">Trạng thái</p>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_META[selected.status]?.cls ?? "bg-gray-100 text-gray-700"}`}>
                                    {STATUS_META[selected.status]?.label ?? selected.status}
                                </span>
                            </div>
                            {selected.rejectReason && (
                                <div>
                                    <p className="text-xs text-[#687582]">Lý do từ chối</p>
                                    <p className="text-rose-600">{selected.rejectReason}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end">
                            <button onClick={() => setSelected(null)} className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create form modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-lg font-bold">Tạo yêu cầu đổi ca</h3>
                            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            <div>
                                <label className="block text-xs text-[#687582] mb-1">Ca cần đổi (của bạn)</label>
                                <select
                                    value={form.fromScheduleId}
                                    onChange={e => setForm({ ...form, fromScheduleId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                >
                                    <option value="">— Chọn ca —</option>
                                    {mySchedules.map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {fmtDate(s.work_date ?? s.workDate)} • {s.shift_name ?? s.shiftName ?? "Ca làm việc"}
                                        </option>
                                    ))}
                                </select>
                                {mySchedules.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">Bạn chưa có ca trực nào trong tương lai.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-[#687582] mb-1">Ca đề xuất đổi (tuỳ chọn)</label>
                                <input
                                    value={form.toScheduleId}
                                    onChange={e => setForm({ ...form, toScheduleId: e.target.value })}
                                    placeholder="ID ca đề xuất (nếu biết)"
                                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#687582] mb-1">Người nhận (tuỳ chọn)</label>
                                <input
                                    value={form.targetStaffId}
                                    onChange={e => setForm({ ...form, targetStaffId: e.target.value })}
                                    placeholder="ID nhân viên (nếu chỉ định)"
                                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#687582] mb-1">Lý do</label>
                                <textarea
                                    rows={3}
                                    value={form.reason}
                                    onChange={e => setForm({ ...form, reason: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end gap-2">
                            <button onClick={() => setShowForm(false)} className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">Huỷ</button>
                            <button onClick={onCreate} disabled={saving} className="px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white disabled:opacity-50">
                                Gửi yêu cầu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
