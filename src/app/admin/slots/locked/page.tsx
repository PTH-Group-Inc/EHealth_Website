"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { LOCKED_SLOT_ENDPOINTS, SHIFT_ENDPOINTS, STAFF_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface LockedSlot {
    id: string;
    slotId: string;
    doctorId?: string;
    doctorName?: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
    lockedBy?: string;
    lockedAt?: string;
}

interface DoctorLite { id: string; fullName: string; }
interface ShiftLite { id: string; name: string; }

function mapLocked(r: any): LockedSlot {
    return {
        id: String(r.locked_slots_id ?? r.locked_slot_id ?? r.id ?? ""),
        slotId: String(r.slot_id ?? r.slotId ?? r.slots_id ?? ""),
        doctorId: String(r.doctor_id ?? r.doctorId ?? r.users_id ?? ""),
        doctorName: r.doctor_name ?? r.doctorName ?? r.full_name ?? "",
        date: r.date ?? r.slot_date ?? r.locked_date ?? "",
        startTime: (r.start_time ?? r.startTime ?? "").slice(0, 5),
        endTime: (r.end_time ?? r.endTime ?? "").slice(0, 5),
        reason: r.reason ?? r.note ?? "",
        lockedBy: r.locked_by_name ?? r.lockedByName ?? "",
        lockedAt: r.locked_at ?? r.lockedAt ?? r.created_at ?? "",
    };
}

function formatDate(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function LockedSlotsPage() {
    const toast = useToast();
    const [locks, setLocks] = useState<LockedSlot[]>([]);
    const [doctors, setDoctors] = useState<DoctorLite[]>([]);
    const [shifts, setShifts] = useState<ShiftLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [doctorFilter, setDoctorFilter] = useState("all");

    const [showLock, setShowLock] = useState(false);
    const [lockForm, setLockForm] = useState({ slotId: "", reason: "" });

    const [showLockByShift, setShowLockByShift] = useState(false);
    const [lockByShift, setLockByShift] = useState({ shiftId: "", startDate: "", endDate: "", reason: "" });

    const [saving, setSaving] = useState(false);

    const loadDropdowns = useCallback(async () => {
        try {
            const [dRes, sRes] = await Promise.all([
                axiosClient.get(STAFF_ENDPOINTS.LIST, { params: { role: "DOCTOR", limit: 500 } }),
                axiosClient.get(SHIFT_ENDPOINTS.LIST, { params: { limit: 200 } }),
            ]);
            const dRaw: any[] = Array.isArray(dRes.data?.data) ? dRes.data.data : Array.isArray(dRes.data) ? dRes.data : [];
            const sRaw: any[] = Array.isArray(sRes.data?.data) ? sRes.data.data : Array.isArray(sRes.data) ? sRes.data : [];
            setDoctors(dRaw.map((d: any) => ({ id: String(d.users_id ?? d.id ?? ""), fullName: d.full_name ?? d.fullName ?? "" })).filter((d) => d.id));
            setShifts(sRaw.map((s: any) => ({ id: String(s.shifts_id ?? s.shift_id ?? s.id ?? ""), name: s.name ?? s.shift_name ?? "" })).filter((s) => s.id));
        } catch {
            setDoctors([]);
            setShifts([]);
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(LOCKED_SLOT_ENDPOINTS.LOCKED, { params: { limit: 500 } });
            const { data } = unwrapList<any>(res);
            setLocks(data.map(mapLocked));
        } catch {
            setError("Không tải được slot bị khoá.");
            setLocks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDropdowns(); load(); }, [loadDropdowns, load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return locks.filter((l) => {
            if (doctorFilter !== "all" && l.doctorId !== doctorFilter) return false;
            if (q && !`${l.doctorName ?? ""} ${l.reason ?? ""} ${l.date}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [locks, search, doctorFilter]);

    const stats = useMemo(() => ({
        total: locks.length,
        upcoming: locks.filter((l) => new Date(l.date) >= new Date()).length,
        past: locks.filter((l) => new Date(l.date) < new Date()).length,
        doctors: new Set(locks.map((l) => l.doctorId).filter(Boolean)).size,
    }), [locks]);

    const handleLock = async () => {
        if (!lockForm.slotId.trim()) { toast.warning("Nhập slot ID."); return; }
        setSaving(true);
        try {
            await axiosClient.post(LOCKED_SLOT_ENDPOINTS.LOCK, {
                slot_id: lockForm.slotId.trim(),
                reason: lockForm.reason.trim() || undefined,
            });
            toast.success("Đã khoá slot.");
            setShowLock(false);
            setLockForm({ slotId: "", reason: "" });
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không khoá được.");
        } finally {
            setSaving(false);
        }
    };

    const handleLockByShift = async () => {
        if (!lockByShift.shiftId || !lockByShift.startDate) { toast.warning("Chọn ca và ngày."); return; }
        setSaving(true);
        try {
            await axiosClient.post(LOCKED_SLOT_ENDPOINTS.LOCK_BY_SHIFT, {
                shift_id: lockByShift.shiftId,
                start_date: lockByShift.startDate,
                end_date: lockByShift.endDate || lockByShift.startDate,
                reason: lockByShift.reason.trim() || undefined,
            });
            toast.success("Đã khoá theo ca.");
            setShowLockByShift(false);
            setLockByShift({ shiftId: "", startDate: "", endDate: "", reason: "" });
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không khoá theo ca được.");
        } finally {
            setSaving(false);
        }
    };

    const handleUnlock = async (l: LockedSlot) => {
        if (!confirm(`Mở khoá slot ${formatDate(l.date)} ${l.startTime}?`)) return;
        try {
            await axiosClient.delete(LOCKED_SLOT_ENDPOINTS.UNLOCK(l.id));
            toast.success("Đã mở khoá.");
            await load();
        } catch {
            toast.error("Không mở khoá được.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Slot bị khoá"
                subtitle="Khoá tạm slot khám khi bác sĩ bận, phòng bảo trì hoặc ngưng nhận lịch"
                icon="lock"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Cấu hình slot" }, { label: "Slot bị khoá" }]}
                actions={
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowLockByShift(true)} className="px-4 py-2 text-sm font-semibold text-[#3C81C6] border border-[#3C81C6]/40 hover:bg-[#3C81C6]/10 rounded-xl inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>event_repeat</span>
                            Khoá theo ca
                        </button>
                        <button onClick={() => setShowLock(true)} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>lock</span>
                            Khoá slot
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng slot khoá" value={stats.total} icon="lock" color="blue" loading={loading} />
                <StatCard label="Sắp tới" value={stats.upcoming} icon="upcoming" color="amber" loading={loading} />
                <StatCard label="Đã qua" value={stats.past} icon="history" color="blue" loading={loading} />
                <StatCard label="Bác sĩ ảnh hưởng" value={stats.doctors} icon="person_off" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo bác sĩ, lý do, ngày..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "doctor", label: "Bác sĩ", value: doctorFilter, onChange: setDoctorFilter,
                    options: [{ value: "all", label: "Mọi bác sĩ" }, ...doctors.map((d) => ({ value: d.id, label: d.fullName }))],
                }]}
                onReset={() => { setSearch(""); setDoctorFilter("all"); }}
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
                <EmptyState icon="lock_open" title="Không có slot bị khoá" description={locks.length === 0 ? "Tất cả slot đang mở nhận lịch." : "Không có slot phù hợp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Ngày</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Khung giờ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Bác sĩ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Lý do</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Khoá bởi</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((l) => (
                                    <tr key={l.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                        <td className="px-4 py-3 text-[#121417] dark:text-white whitespace-nowrap">{formatDate(l.date)}</td>
                                        <td className="px-4 py-3 font-mono text-[#121417] dark:text-white">{l.startTime}–{l.endTime}</td>
                                        <td className="px-4 py-3 text-[#121417] dark:text-white">{l.doctorName || "—"}</td>
                                        <td className="px-4 py-3 text-[#687582] dark:text-gray-400 max-w-xs truncate" title={l.reason}>{l.reason || "—"}</td>
                                        <td className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400">{l.lockedBy || "—"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleUnlock(l)} className="px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg inline-flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>lock_open</span>
                                                Mở khoá
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showLock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowLock(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">lock</span>
                            Khoá slot khám
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Slot ID *</label>
                                <input type="text" value={lockForm.slotId} onChange={(e) => setLockForm({ ...lockForm, slotId: e.target.value })} placeholder="Nhập slot ID cần khoá"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white font-mono" />
                                <p className="text-[10px] text-[#687582] dark:text-gray-500 mt-1">Lấy ID từ trang Cấu hình khung giờ khám.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lý do</label>
                                <textarea rows={3} value={lockForm.reason} onChange={(e) => setLockForm({ ...lockForm, reason: e.target.value })} placeholder="VD: Bác sĩ họp, phòng bảo trì..."
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowLock(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleLock} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                                {saving ? "Đang khoá..." : "Khoá"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLockByShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowLockByShift(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">event_repeat</span>
                            Khoá hàng loạt theo ca
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ca *</label>
                                <select value={lockByShift.shiftId} onChange={(e) => setLockByShift({ ...lockByShift, shiftId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    <option value="">— Chọn ca —</option>
                                    {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Từ ngày *</label>
                                    <input type="date" value={lockByShift.startDate} onChange={(e) => setLockByShift({ ...lockByShift, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Đến ngày</label>
                                    <input type="date" value={lockByShift.endDate} onChange={(e) => setLockByShift({ ...lockByShift, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lý do</label>
                                <textarea rows={2} value={lockByShift.reason} onChange={(e) => setLockByShift({ ...lockByShift, reason: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowLockByShift(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleLockByShift} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                                {saving ? "Đang khoá..." : "Khoá"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
