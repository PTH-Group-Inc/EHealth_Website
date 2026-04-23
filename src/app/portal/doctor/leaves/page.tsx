"use client";

/**
 * Nghỉ phép / Vắng mặt — Phase I.2 Nhóm 2 #5.
 * Spec: dòng 5305-5367 `/Users/minhquan/EH/Sửa giao diện tổng.md`.
 * Tách 2 lớp: nghỉ phép có quy trình + báo vắng đột xuất.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { leaveService } from "@/services/leaveService";
import { doctorAbsenceService } from "@/services/doctorAbsenceService";

type Tab = "leaves" | "absences";

const LEAVE_STATUS: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    APPROVED: { label: "Đã duyệt", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    REJECTED: { label: "Từ chối", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
};

const fmtDate = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return v; }
};

export default function DoctorLeavesPage() {
    const { user } = useAuth();
    const [tab, setTab] = useState<Tab>("leaves");
    const [leaves, setLeaves] = useState<any[]>([]);
    const [absences, setAbsences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [showAbsenceForm, setShowAbsenceForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [leaveForm, setLeaveForm] = useState({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });
    const [absenceForm, setAbsenceForm] = useState({ type: "SICK", startDate: "", endDate: "", reason: "" });

    const load = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        const [l, a] = await Promise.allSettled([
            leaveService.getList({ staffId: user.id }),
            doctorAbsenceService.getByDoctor(user.id),
        ]);
        setLeaves(l.status === "fulfilled" ? (l.value as any)?.data ?? [] : []);
        setAbsences(a.status === "fulfilled" ? (a.value as any)?.data ?? [] : []);
        setLoading(false);
    }, [user?.id]);

    useEffect(() => { load(); }, [load]);

    const stats = useMemo(() => ({
        leavePending: leaves.filter(x => x.status === "PENDING").length,
        leaveApproved: leaves.filter(x => x.status === "APPROVED").length,
        absences: absences.length,
    }), [leaves, absences]);

    const onCreateLeave = async () => {
        if (!leaveForm.startDate || !leaveForm.endDate) {
            alert("Vui lòng chọn ngày bắt đầu và kết thúc.");
            return;
        }
        setSaving(true);
        try {
            await leaveService.create({
                staffId: user?.id,
                type: leaveForm.type,
                startDate: leaveForm.startDate,
                endDate: leaveForm.endDate,
                reason: leaveForm.reason,
            });
            setShowLeaveForm(false);
            setLeaveForm({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Tạo yêu cầu thất bại");
        } finally {
            setSaving(false);
        }
    };

    const onCreateAbsence = async () => {
        if (!absenceForm.startDate || !absenceForm.endDate) {
            alert("Vui lòng chọn ngày bắt đầu và kết thúc.");
            return;
        }
        setSaving(true);
        try {
            await doctorAbsenceService.create({
                doctorId: user!.id,
                startDate: absenceForm.startDate,
                endDate: absenceForm.endDate,
                type: absenceForm.type as any,
                reason: absenceForm.reason,
            });
            setShowAbsenceForm(false);
            setAbsenceForm({ type: "SICK", startDate: "", endDate: "", reason: "" });
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Tạo báo vắng thất bại");
        } finally {
            setSaving(false);
        }
    };

    const onDeleteLeave = async (id: string) => {
        if (!confirm("Huỷ yêu cầu nghỉ này?")) return;
        try {
            await leaveService.remove(id);
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Huỷ thất bại");
        }
    };

    const onDeleteAbsence = async (id: string) => {
        if (!confirm("Xoá báo vắng này?")) return;
        try {
            await doctorAbsenceService.delete(id);
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Xoá thất bại");
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Nghỉ phép & vắng mặt"
                subtitle="Tạo yêu cầu nghỉ phép có quy trình hoặc báo vắng đột xuất."
                icon="event_busy"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Nghỉ phép & vắng mặt" },
                ]}
                actions={
                    tab === "leaves" ? (
                        <button
                            onClick={() => setShowLeaveForm(true)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3C81C6] text-white text-sm font-medium hover:bg-[#2a6da8]"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Tạo nghỉ phép
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowAbsenceForm(true)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Báo vắng đột xuất
                        </button>
                    )
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Nghỉ chờ duyệt" value={stats.leavePending} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Nghỉ đã duyệt" value={stats.leaveApproved} icon="event_available" color="emerald" loading={loading} />
                <StatCard label="Báo vắng" value={stats.absences} icon="report" color="red" loading={loading} />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                {([
                    { key: "leaves", label: `Nghỉ phép (${leaves.length})` },
                    { key: "absences", label: `Vắng mặt đột xuất (${absences.length})` },
                ] as { key: Tab; label: string }[]).map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${tab === t.key
                            ? "bg-[#3C81C6] text-white border-[#3C81C6]"
                            : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e] text-[#121417] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-[#687582]">Đang tải…</div>
                ) : tab === "leaves" ? (
                    leaves.length === 0 ? (
                        <EmptyState icon="beach_access" title="Chưa có yêu cầu nghỉ" description="Hãy tạo yêu cầu nghỉ phép đầu tiên." />
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                                <tr>
                                    <th className="text-left px-4 py-3">Loại</th>
                                    <th className="text-left px-4 py-3">Từ ngày</th>
                                    <th className="text-left px-4 py-3">Đến ngày</th>
                                    <th className="text-left px-4 py-3">Lý do</th>
                                    <th className="text-left px-4 py-3">Trạng thái</th>
                                    <th className="text-right px-4 py-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {leaves.map((l: any) => {
                                    const st = LEAVE_STATUS[l.status] ?? { label: l.status, cls: "bg-gray-100 text-gray-700" };
                                    return (
                                        <tr key={l.id}>
                                            <td className="px-4 py-3 font-medium">{l.type ?? l.leaveType ?? "—"}</td>
                                            <td className="px-4 py-3">{fmtDate(l.startDate ?? l.fromDate ?? l.start_date)}</td>
                                            <td className="px-4 py-3">{fmtDate(l.endDate ?? l.toDate ?? l.end_date)}</td>
                                            <td className="px-4 py-3 text-[#687582]">{l.reason ?? "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {l.status === "PENDING" && (
                                                    <button
                                                        onClick={() => onDeleteLeave(l.id)}
                                                        className="text-xs text-rose-600 hover:underline"
                                                    >
                                                        Huỷ
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )
                ) : (
                    absences.length === 0 ? (
                        <EmptyState icon="event_busy" title="Chưa có báo vắng" description="Báo vắng đột xuất khi không thể đi làm." />
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                                <tr>
                                    <th className="text-left px-4 py-3">Loại</th>
                                    <th className="text-left px-4 py-3">Từ ngày</th>
                                    <th className="text-left px-4 py-3">Đến ngày</th>
                                    <th className="text-left px-4 py-3">Lý do</th>
                                    <th className="text-right px-4 py-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {absences.map((a: any) => (
                                    <tr key={a.id}>
                                        <td className="px-4 py-3 font-medium">{a.type ?? "—"}</td>
                                        <td className="px-4 py-3">{fmtDate(a.startDate ?? a.start_date)}</td>
                                        <td className="px-4 py-3">{fmtDate(a.endDate ?? a.end_date)}</td>
                                        <td className="px-4 py-3 text-[#687582]">{a.reason ?? "—"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => onDeleteAbsence(a.id)}
                                                className="text-xs text-rose-600 hover:underline"
                                            >
                                                Xoá
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>

            {/* Leave form modal */}
            {showLeaveForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLeaveForm(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-lg font-bold">Tạo yêu cầu nghỉ phép</h3>
                            <button onClick={() => setShowLeaveForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            <div>
                                <label className="block text-xs text-[#687582] mb-1">Loại nghỉ</label>
                                <select
                                    value={leaveForm.type}
                                    onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                >
                                    <option value="ANNUAL">Nghỉ phép năm</option>
                                    <option value="SICK">Nghỉ ốm</option>
                                    <option value="PERSONAL">Nghỉ cá nhân</option>
                                    <option value="UNPAID">Nghỉ không lương</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[#687582] mb-1">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={leaveForm.startDate}
                                        onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#687582] mb-1">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={leaveForm.endDate}
                                        onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-[#687582] mb-1">Lý do</label>
                                <textarea
                                    rows={3}
                                    value={leaveForm.reason}
                                    onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end gap-2">
                            <button onClick={() => setShowLeaveForm(false)} className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">Huỷ</button>
                            <button onClick={onCreateLeave} disabled={saving} className="px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white disabled:opacity-50">
                                Gửi yêu cầu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Absence form modal */}
            {showAbsenceForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAbsenceForm(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-lg font-bold">Báo vắng đột xuất</h3>
                            <button onClick={() => setShowAbsenceForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            <div>
                                <label className="block text-xs text-[#687582] mb-1">Loại</label>
                                <select
                                    value={absenceForm.type}
                                    onChange={e => setAbsenceForm({ ...absenceForm, type: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                >
                                    <option value="SICK">Ốm đột xuất</option>
                                    <option value="LEAVE">Việc gấp</option>
                                    <option value="TRAINING">Đi đào tạo</option>
                                    <option value="OTHER">Khác</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[#687582] mb-1">Từ ngày</label>
                                    <input
                                        type="date"
                                        value={absenceForm.startDate}
                                        onChange={e => setAbsenceForm({ ...absenceForm, startDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#687582] mb-1">Đến ngày</label>
                                    <input
                                        type="date"
                                        value={absenceForm.endDate}
                                        onChange={e => setAbsenceForm({ ...absenceForm, endDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-[#687582] mb-1">Lý do</label>
                                <textarea
                                    rows={3}
                                    value={absenceForm.reason}
                                    onChange={e => setAbsenceForm({ ...absenceForm, reason: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end gap-2">
                            <button onClick={() => setShowAbsenceForm(false)} className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">Huỷ</button>
                            <button onClick={onCreateAbsence} disabled={saving} className="px-3 py-2 text-sm rounded-lg bg-amber-500 text-white disabled:opacity-50">
                                Gửi báo vắng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
