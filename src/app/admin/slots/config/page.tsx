"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { APPOINTMENT_SLOT_ENDPOINTS, STAFF_ENDPOINTS, DEPARTMENT_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type SlotStatus = "AVAILABLE" | "FULL" | "BLOCKED" | "CANCELLED";

interface Slot {
    id: string;
    doctorId?: string;
    doctorName?: string;
    departmentId?: string;
    departmentName?: string;
    roomId?: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
    bookedCount: number;
    status: SlotStatus;
}

interface DoctorLite {
    id: string;
    fullName: string;
}

interface DeptLite {
    id: string;
    name: string;
}

interface FormState {
    id?: string;
    doctorId: string;
    departmentId: string;
    date: string;
    startTime: string;
    endTime: string;
    capacity: number;
}

interface BulkState {
    doctorId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    slotDuration: number;
    capacity: number;
}

const EMPTY_FORM: FormState = { doctorId: "", departmentId: "", date: "", startTime: "08:00", endTime: "08:30", capacity: 1 };
const EMPTY_BULK: BulkState = { doctorId: "", startDate: "", endDate: "", startTime: "08:00", endTime: "17:00", slotDuration: 30, capacity: 1 };

const STATUS_META: Record<SlotStatus, { label: string; color: string; icon: string }> = {
    AVAILABLE: { label: "Sẵn sàng", color: "emerald", icon: "event_available" },
    FULL: { label: "Đã đầy", color: "amber", icon: "groups" },
    BLOCKED: { label: "Khoá", color: "red", icon: "block" },
    CANCELLED: { label: "Huỷ", color: "gray", icon: "event_busy" },
};

function normalizeStatus(raw: any): SlotStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "FULL" || s === "BOOKED") return "FULL";
    if (s === "BLOCKED" || s === "LOCKED") return "BLOCKED";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    return "AVAILABLE";
}

function mapSlot(r: any): Slot {
    return {
        id: String(r.slots_id ?? r.slot_id ?? r.id ?? ""),
        doctorId: String(r.doctor_id ?? r.doctorId ?? r.users_id ?? ""),
        doctorName: r.doctor_name ?? r.doctorName ?? r.full_name ?? "",
        departmentId: String(r.department_id ?? r.departmentId ?? ""),
        departmentName: r.department_name ?? r.departmentName ?? "",
        roomId: String(r.room_id ?? r.roomId ?? ""),
        date: r.date ?? r.slot_date ?? "",
        startTime: (r.start_time ?? r.startTime ?? "").slice(0, 5),
        endTime: (r.end_time ?? r.endTime ?? "").slice(0, 5),
        capacity: Number(r.capacity ?? r.max_patients ?? 1),
        bookedCount: Number(r.booked_count ?? r.bookedCount ?? r.current_bookings ?? 0),
        status: normalizeStatus(r.status),
    };
}

function formatDate(d: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "short" });
}

export default function SlotsConfigPage() {
    const toast = useToast();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [doctors, setDoctors] = useState<DoctorLite[]>([]);
    const [departments, setDepartments] = useState<DeptLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [doctorFilter, setDoctorFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [showBulk, setShowBulk] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [bulk, setBulk] = useState<BulkState>(EMPTY_BULK);
    const [saving, setSaving] = useState(false);

    const loadDropdowns = useCallback(async () => {
        try {
            const [dRes, depRes] = await Promise.all([
                axiosClient.get(STAFF_ENDPOINTS.LIST, { params: { role: "DOCTOR", limit: 500 } }),
                axiosClient.get(DEPARTMENT_ENDPOINTS.LIST, { params: { limit: 500 } }),
            ]);
            const docRaw: any[] = Array.isArray(dRes.data?.data) ? dRes.data.data : Array.isArray(dRes.data) ? dRes.data : [];
            const depRaw: any[] = Array.isArray(depRes.data?.data) ? depRes.data.data : Array.isArray(depRes.data) ? depRes.data : [];
            setDoctors(docRaw.map((d: any) => ({ id: String(d.users_id ?? d.id ?? ""), fullName: d.full_name ?? d.fullName ?? d.name ?? "" })).filter((d) => d.id));
            setDepartments(depRaw.map((d: any) => ({ id: String(d.departments_id ?? d.department_id ?? d.id ?? ""), name: d.name ?? d.department_name ?? "" })).filter((d) => d.id));
        } catch {
            setDoctors([]);
            setDepartments([]);
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(APPOINTMENT_SLOT_ENDPOINTS.LIST, { params: { limit: 500 } });
            const { data } = unwrapList<any>(res);
            setSlots(data.map(mapSlot));
        } catch {
            setError("Không tải được danh sách slot khám.");
            setSlots([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDropdowns(); load(); }, [loadDropdowns, load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return slots.filter((s) => {
            if (doctorFilter !== "all" && s.doctorId !== doctorFilter) return false;
            if (statusFilter !== "all" && s.status !== statusFilter) return false;
            if (q && !`${s.doctorName ?? ""} ${s.departmentName ?? ""} ${s.date}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [slots, search, doctorFilter, statusFilter]);

    const stats = useMemo(
        () => ({
            total: slots.length,
            available: slots.filter((s) => s.status === "AVAILABLE").length,
            full: slots.filter((s) => s.status === "FULL").length,
            booked: slots.reduce((sum, s) => sum + s.bookedCount, 0),
        }),
        [slots]
    );

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, doctorId: doctors[0]?.id ?? "", departmentId: departments[0]?.id ?? "" });
        setShowModal(true);
    };

    const openEdit = (s: Slot) => {
        setForm({
            id: s.id,
            doctorId: s.doctorId ?? "",
            departmentId: s.departmentId ?? "",
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            capacity: s.capacity,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.date || !form.startTime || !form.endTime) {
            toast.warning("Vui lòng nhập ngày và thời gian.");
            return;
        }
        if (form.startTime >= form.endTime) {
            toast.warning("Giờ bắt đầu phải trước giờ kết thúc.");
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                date: form.date,
                start_time: form.startTime,
                end_time: form.endTime,
                capacity: form.capacity,
            };
            if (form.doctorId) payload.doctor_id = form.doctorId;
            if (form.departmentId) payload.department_id = form.departmentId;

            if (form.id) {
                await axiosClient.put(APPOINTMENT_SLOT_ENDPOINTS.UPDATE(form.id), payload);
                toast.success("Đã cập nhật slot.");
            } else {
                await axiosClient.post(APPOINTMENT_SLOT_ENDPOINTS.CREATE, payload);
                toast.success("Đã tạo slot.");
            }
            setShowModal(false);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được slot.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (s: Slot) => {
        if (!confirm(`Xoá slot ${formatDate(s.date)} ${s.startTime}–${s.endTime}?`)) return;
        try {
            await axiosClient.delete(APPOINTMENT_SLOT_ENDPOINTS.DELETE(s.id));
            toast.success("Đã xoá slot.");
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không xoá được slot (có thể đã có booking).");
        }
    };

    const handleBulkCreate = async () => {
        if (!bulk.doctorId || !bulk.startDate || !bulk.endDate) {
            toast.warning("Chọn bác sĩ và khoảng ngày.");
            return;
        }
        if (bulk.startDate > bulk.endDate) {
            toast.warning("Ngày kết thúc phải sau ngày bắt đầu.");
            return;
        }
        if (bulk.slotDuration < 5) {
            toast.warning("Thời lượng slot tối thiểu 5 phút.");
            return;
        }
        setSaving(true);
        try {
            const dates: string[] = [];
            const d0 = new Date(bulk.startDate);
            const d1 = new Date(bulk.endDate);
            for (let dt = new Date(d0); dt <= d1; dt.setDate(dt.getDate() + 1)) {
                dates.push(dt.toISOString().slice(0, 10));
            }
            await axiosClient.post("/api/slots/bulk", {
                doctor_id: bulk.doctorId,
                dates,
                start_time: bulk.startTime,
                end_time: bulk.endTime,
                slot_duration: bulk.slotDuration,
                capacity: bulk.capacity,
            });
            toast.success(`Đã tạo slot cho ${dates.length} ngày.`);
            setShowBulk(false);
            setBulk(EMPTY_BULK);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không tạo bulk được (có thể BE chưa hỗ trợ).");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Cấu hình khung giờ khám"
                subtitle="Tạo & quản lý slot khám theo bác sĩ, ngày và thời lượng"
                icon="schedule"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Cấu hình slot" }]}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setBulk({ ...EMPTY_BULK, doctorId: doctors[0]?.id ?? "" }); setShowBulk(true); }}
                            className="px-4 py-2 text-sm font-semibold text-[#3C81C6] border border-[#3C81C6]/40 hover:bg-[#3C81C6]/10 rounded-xl inline-flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>bolt</span>
                            Tạo hàng loạt
                        </button>
                        <button
                            onClick={openCreate}
                            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                            Tạo slot
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng slot" value={stats.total} icon="schedule" color="blue" loading={loading} />
                <StatCard label="Sẵn sàng" value={stats.available} icon="event_available" color="emerald" loading={loading} />
                <StatCard label="Đã đầy" value={stats.full} icon="groups" color="amber" loading={loading} />
                <StatCard label="Lượt đặt" value={stats.booked} icon="event_seat" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo bác sĩ, khoa, ngày..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: "doctor",
                        label: "Bác sĩ",
                        value: doctorFilter,
                        onChange: setDoctorFilter,
                        options: [{ value: "all", label: "Mọi bác sĩ" }, ...doctors.map((d) => ({ value: d.id, label: d.fullName }))],
                    },
                    {
                        key: "status",
                        label: "Trạng thái",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: "all", label: "Mọi trạng thái" },
                            ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label })),
                        ],
                    },
                ]}
                onReset={() => { setSearch(""); setDoctorFilter("all"); setStatusFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="schedule"
                    title="Chưa có slot khám"
                    description={slots.length === 0 ? "Tạo slot đầu tiên hoặc dùng 'Tạo hàng loạt'." : "Không có slot phù hợp bộ lọc."}
                    action={
                        slots.length === 0 ? (
                            <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">+ Tạo slot</button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Ngày</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Khung giờ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Bác sĩ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Khoa</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Sức chứa</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Trạng thái</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => {
                                    const meta = STATUS_META[s.status];
                                    const fillPct = s.capacity > 0 ? Math.min(100, Math.round((s.bookedCount / s.capacity) * 100)) : 0;
                                    return (
                                        <tr key={s.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-3 text-[#121417] dark:text-white whitespace-nowrap">{formatDate(s.date)}</td>
                                            <td className="px-4 py-3 font-mono text-[#121417] dark:text-white">{s.startTime}–{s.endTime}</td>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">{s.doctorName || "—"}</td>
                                            <td className="px-4 py-3 text-[#687582] dark:text-gray-400">{s.departmentName || "—"}</td>
                                            <td className="px-4 py-3 min-w-[140px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs font-semibold text-[#121417] dark:text-white">{s.bookedCount}/{s.capacity}</div>
                                                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div className={`h-full ${fillPct >= 100 ? "bg-amber-500" : fillPct >= 70 ? "bg-[#3C81C6]" : "bg-emerald-500"}`} style={{ width: `${fillPct}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                    meta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                                    meta.color === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                }`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{meta.icon}</span>
                                                    {meta.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(s)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title="Sửa">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                                                    </button>
                                                    <button onClick={() => handleDelete(s)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Xoá">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                                    </button>
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

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{form.id ? "edit" : "add"}</span>
                            {form.id ? "Sửa slot khám" : "Tạo slot khám mới"}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bác sĩ</label>
                                <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    <option value="">— Chọn bác sĩ —</option>
                                    {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Khoa</label>
                                <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    <option value="">— Chọn khoa —</option>
                                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ngày *</label>
                                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bắt đầu *</label>
                                    <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Kết thúc *</label>
                                    <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Sức chứa</label>
                                    <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 1 })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang lưu...</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>Lưu</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBulk && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowBulk(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">bolt</span>
                            Tạo slot hàng loạt
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-400 mb-3">
                            Tự động chia khoảng thời gian thành nhiều slot đều nhau cho mỗi ngày trong khoảng.
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bác sĩ *</label>
                                <select value={bulk.doctorId} onChange={(e) => setBulk({ ...bulk, doctorId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    <option value="">— Chọn bác sĩ —</option>
                                    {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Từ ngày *</label>
                                    <input type="date" value={bulk.startDate} onChange={(e) => setBulk({ ...bulk, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Đến ngày *</label>
                                    <input type="date" value={bulk.endDate} onChange={(e) => setBulk({ ...bulk, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Giờ bắt đầu</label>
                                    <input type="time" value={bulk.startTime} onChange={(e) => setBulk({ ...bulk, startTime: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Giờ kết thúc</label>
                                    <input type="time" value={bulk.endTime} onChange={(e) => setBulk({ ...bulk, endTime: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Thời lượng slot (phút)</label>
                                    <input type="number" min={5} step={5} value={bulk.slotDuration} onChange={(e) => setBulk({ ...bulk, slotDuration: Number(e.target.value) || 30 })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Sức chứa mỗi slot</label>
                                    <input type="number" min={1} value={bulk.capacity} onChange={(e) => setBulk({ ...bulk, capacity: Number(e.target.value) || 1 })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowBulk(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleBulkCreate} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang tạo...</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>bolt</span>Tạo</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
