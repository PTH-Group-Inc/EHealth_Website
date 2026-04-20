"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { APPOINTMENT_CONFIRMATION_ENDPOINTS, APPOINTMENT_STATUS_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "CHECKED_IN" | "NO_SHOW" | "COMPLETED" | "CANCELLED";

interface Appointment {
    id: string;
    code: string;
    patientName: string;
    patientPhone?: string;
    doctorName?: string;
    scheduledTime: string;
    status: AppointmentStatus;
    confirmedAt?: string;
    reminderSentAt?: string;
}

const STATUS_META: Record<AppointmentStatus, { label: string; color: string }> = {
    SCHEDULED: { label: "Đã đặt", color: "amber" },
    CONFIRMED: { label: "Đã xác nhận", color: "blue" },
    CHECKED_IN: { label: "Đã check-in", color: "emerald" },
    NO_SHOW: { label: "Vắng mặt", color: "red" },
    COMPLETED: { label: "Hoàn tất", color: "violet" },
    CANCELLED: { label: "Huỷ", color: "red" },
};

function normalizeStatus(raw: any): AppointmentStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "CONFIRMED") return "CONFIRMED";
    if (s === "CHECKED_IN" || s === "CHECKED-IN") return "CHECKED_IN";
    if (s === "NO_SHOW" || s === "NO-SHOW" || s === "ABSENT") return "NO_SHOW";
    if (s === "COMPLETED" || s === "DONE") return "COMPLETED";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    return "SCHEDULED";
}

function mapAppt(r: any): Appointment {
    return {
        id: String(r.appointment_id ?? r.id ?? ""),
        code: r.code ?? r.appointment_code ?? "",
        patientName: r.patient_name ?? r.patientName ?? "—",
        patientPhone: r.patient_phone ?? r.phone ?? "",
        doctorName: r.doctor_name ?? r.doctorName ?? "",
        scheduledTime: r.scheduled_time ?? r.scheduledTime ?? r.start_time ?? "",
        status: normalizeStatus(r.status),
        confirmedAt: r.confirmed_at ?? r.confirmedAt ?? "",
        reminderSentAt: r.reminder_sent_at ?? r.reminderSentAt ?? "",
    };
}

function formatTime(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function QueueBatchOpsPage() {
    const toast = useToast();
    const [items, setItems] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [processing, setProcessing] = useState(false);
    const [qrMode, setQrMode] = useState(false);
    const [qrInput, setQrInput] = useState("");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(APPOINTMENT_STATUS_ENDPOINTS.QUEUE_TODAY);
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapAppt));
        } catch {
            setError("Không tải được danh sách lịch hôm nay.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((a) => {
            if (statusFilter !== "all" && a.status !== statusFilter) return false;
            if (q && !`${a.code} ${a.patientName} ${a.patientPhone ?? ""} ${a.doctorName ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, statusFilter]);

    const stats = useMemo(() => ({
        total: items.length,
        scheduled: items.filter((a) => a.status === "SCHEDULED").length,
        confirmed: items.filter((a) => a.status === "CONFIRMED").length,
        checkedIn: items.filter((a) => a.status === "CHECKED_IN").length,
    }), [items]);

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelected(next);
    };

    const selectAll = () => {
        setSelected(new Set(filtered.filter((a) => a.status === "SCHEDULED").map((a) => a.id)));
    };

    const clearSelection = () => setSelected(new Set());

    const handleBatchConfirm = async () => {
        if (selected.size === 0) { toast.warning("Chọn lịch cần xác nhận."); return; }
        if (!confirm(`Xác nhận ${selected.size} lịch hẹn?`)) return;
        setProcessing(true);
        try {
            await axiosClient.patch(APPOINTMENT_CONFIRMATION_ENDPOINTS.BATCH_CONFIRM, {
                appointment_ids: Array.from(selected),
            });
            toast.success(`Đã xác nhận ${selected.size} lịch.`);
            clearSelection();
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không xác nhận được.");
        } finally { setProcessing(false); }
    };

    const handleBatchReminder = async () => {
        if (selected.size === 0) { toast.warning("Chọn lịch cần gửi nhắc."); return; }
        if (!confirm(`Gửi nhắc ${selected.size} lịch hẹn?`)) return;
        setProcessing(true);
        try {
            await axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.BATCH_REMINDER, {
                appointment_ids: Array.from(selected),
            });
            toast.success(`Đã gửi nhắc ${selected.size} lịch.`);
            clearSelection();
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không gửi được.");
        } finally { setProcessing(false); }
    };

    const handleQrCheckIn = async () => {
        if (!qrInput.trim()) { toast.warning("Scan hoặc nhập mã QR."); return; }
        try {
            await axiosClient.post(APPOINTMENT_STATUS_ENDPOINTS.CHECK_IN_QR, { qr_code: qrInput.trim() });
            toast.success("Đã check-in thành công.");
            setQrInput("");
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "QR không hợp lệ.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Thao tác hàng loạt & QR check-in"
                subtitle="Xác nhận lịch hàng loạt, gửi nhắc SMS/email, QR check-in nhanh"
                icon="group"
                breadcrumbs={[
                    { label: "Lễ tân", href: "/portal/receptionist" },
                    { label: "Queue", href: "/portal/receptionist/queue" },
                    { label: "Thao tác batch" },
                ]}
                actions={
                    <button onClick={() => setQrMode(!qrMode)} className={`px-4 py-2 text-sm font-semibold rounded-xl inline-flex items-center gap-1 ${qrMode ? "text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm" : "text-[#3C81C6] border border-[#3C81C6]/40 hover:bg-[#3C81C6]/10"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>qr_code_scanner</span>
                        {qrMode ? "Đang scan QR" : "QR Check-in"}
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng lịch hôm nay" value={stats.total} icon="event" color="blue" loading={loading} />
                <StatCard label="Chờ xác nhận" value={stats.scheduled} icon="hourglass_top" color="amber" loading={loading} />
                <StatCard label="Đã xác nhận" value={stats.confirmed} icon="check_circle" color="violet" loading={loading} />
                <StatCard label="Đã check-in" value={stats.checkedIn} icon="login" color="emerald" loading={loading} />
            </div>

            {qrMode && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "32px" }}>qr_code_scanner</span>
                        <div>
                            <h3 className="font-bold text-[#121417] dark:text-white">QR Check-in</h3>
                            <p className="text-xs text-[#687582] dark:text-gray-400">Scan mã QR từ thiết bị hoặc nhập thủ công mã bệnh nhân.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input autoFocus type="text" value={qrInput} onChange={(e) => setQrInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleQrCheckIn()}
                            placeholder="Scan QR hoặc nhập mã..."
                            className="flex-1 px-4 py-3 bg-white dark:bg-[#13191f] border border-emerald-300 dark:border-emerald-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500/30 dark:text-white" />
                        <button onClick={handleQrCheckIn} className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>login</span>
                            Check-in
                        </button>
                    </div>
                </div>
            )}

            <FilterBar
                searchPlaceholder="Tìm bệnh nhân, SĐT, bác sĩ..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "status", label: "Trạng thái", value: statusFilter, onChange: setStatusFilter,
                    options: [{ value: "all", label: "Tất cả" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))],
                }]}
                onReset={() => { setSearch(""); setStatusFilter("all"); }}
            />

            {selected.size > 0 && (
                <div className="sticky top-6 z-10 bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white rounded-2xl shadow-lg p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span className="font-semibold">Đã chọn {selected.size} lịch</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleBatchConfirm} disabled={processing} className="px-4 py-2 text-sm font-semibold bg-white text-[#3C81C6] rounded-xl hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
                            Xác nhận all
                        </button>
                        <button onClick={handleBatchReminder} disabled={processing} className="px-4 py-2 text-sm font-semibold bg-white/20 hover:bg-white/30 rounded-xl disabled:opacity-50 inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>notifications_active</span>
                            Gửi nhắc all
                        </button>
                        <button onClick={clearSelection} className="px-3 py-2 text-sm bg-white/20 hover:bg-white/30 rounded-xl">Bỏ chọn</button>
                    </div>
                </div>
            )}

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="event" title="Chưa có lịch hẹn" description={items.length === 0 ? "Hôm nay chưa có lịch hẹn nào." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between text-xs">
                        <button onClick={selectAll} className="text-[#3C81C6] font-semibold hover:underline">Chọn tất cả lịch chưa xác nhận ({filtered.filter((a) => a.status === "SCHEDULED").length})</button>
                        <span className="text-[#687582]">Đã chọn {selected.size}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="w-10 text-center px-2 py-3"></th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Giờ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bệnh nhân</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bác sĩ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Trạng thái</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Xác nhận lúc</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Nhắc lần cuối</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((a) => {
                                    const meta = STATUS_META[a.status];
                                    return (
                                        <tr key={a.id} className={`border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] ${selected.has(a.id) ? "bg-[#3C81C6]/5" : ""}`}>
                                            <td className="px-2 py-3 text-center">
                                                <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} className="w-4 h-4 rounded border-[#dde0e4] text-[#3C81C6]" />
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-[#121417] dark:text-white">{formatTime(a.scheduledTime)}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-[#121417] dark:text-white">{a.patientName}</div>
                                                {a.patientPhone && <div className="text-xs text-[#687582]">{a.patientPhone}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-[#687582]">{a.doctorName || "—"}</td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    meta.color === "emerald" ? "bg-emerald-100 text-emerald-700" :
                                                    meta.color === "blue" ? "bg-blue-100 text-blue-700" :
                                                    meta.color === "amber" ? "bg-amber-100 text-amber-700" :
                                                    meta.color === "violet" ? "bg-violet-100 text-violet-700" :
                                                    "bg-red-100 text-red-700"
                                                }`}>{meta.label}</div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[#687582]">{a.confirmedAt ? formatTime(a.confirmedAt) : "—"}</td>
                                            <td className="px-4 py-3 text-xs text-[#687582]">{a.reminderSentAt ? formatTime(a.reminderSentAt) : "—"}</td>
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
