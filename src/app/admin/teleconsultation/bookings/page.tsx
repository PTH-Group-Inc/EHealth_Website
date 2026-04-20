"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { TELE_BOOKING_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type Status = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface TeleBooking {
    id: string;
    code: string;
    patientName: string;
    doctorName?: string;
    typeName?: string;
    scheduledAt: string;
    duration?: number;
    price?: number;
    status: Status;
    paymentStatus?: string;
}

const STATUS_META: Record<Status, { label: string; color: string; icon: string }> = {
    PENDING: { label: "Chờ xác nhận", color: "amber", icon: "hourglass_top" },
    CONFIRMED: { label: "Đã xác nhận", color: "blue", icon: "check_circle" },
    IN_PROGRESS: { label: "Đang khám", color: "emerald", icon: "videocam" },
    COMPLETED: { label: "Hoàn tất", color: "violet", icon: "done_all" },
    CANCELLED: { label: "Huỷ", color: "red", icon: "cancel" },
};

function normalizeStatus(raw: any): Status {
    const s = String(raw ?? "").toUpperCase();
    if (s === "CONFIRMED") return "CONFIRMED";
    if (s === "IN_PROGRESS" || s === "ONGOING") return "IN_PROGRESS";
    if (s === "COMPLETED" || s === "DONE") return "COMPLETED";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    return "PENDING";
}

function mapBooking(r: any): TeleBooking {
    return {
        id: String(r.consultation_id ?? r.session_id ?? r.id ?? ""),
        code: r.code ?? r.session_code ?? "",
        patientName: r.patient_name ?? r.patientName ?? "—",
        doctorName: r.doctor_name ?? r.doctorName ?? "",
        typeName: r.type_name ?? r.typeName ?? "",
        scheduledAt: r.scheduled_at ?? r.scheduledAt ?? r.start_time ?? "",
        duration: Number(r.duration_minutes ?? r.duration ?? 0),
        price: Number(r.price ?? r.amount ?? 0),
        status: normalizeStatus(r.status),
        paymentStatus: r.payment_status ?? r.paymentStatus ?? "",
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

export default function TeleBookingsPage() {
    const toast = useToast();
    const [items, setItems] = useState<TeleBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(TELE_BOOKING_ENDPOINTS.LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapBooking));
        } catch {
            setError("Không tải được booking.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((b) => {
            if (statusFilter !== "all" && b.status !== statusFilter) return false;
            if (q && !`${b.code} ${b.patientName} ${b.doctorName ?? ""} ${b.typeName ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, statusFilter]);

    const stats = useMemo(() => ({
        total: items.length,
        pending: items.filter((b) => b.status === "PENDING").length,
        today: items.filter((b) => {
            const d = new Date(b.scheduledAt);
            const t = new Date();
            return d.toDateString() === t.toDateString();
        }).length,
        revenue: items.filter((b) => b.status === "COMPLETED").reduce((s, b) => s + (b.price ?? 0), 0),
    }), [items]);

    const handleConfirm = async (b: TeleBooking) => {
        try {
            await axiosClient.post(TELE_BOOKING_ENDPOINTS.CONFIRM(b.id));
            toast.success("Đã xác nhận."); await load();
        } catch { toast.error("Không xác nhận được."); }
    };

    const handleCancel = async (b: TeleBooking) => {
        const reason = prompt("Lý do huỷ:");
        if (!reason) return;
        try {
            await axiosClient.post(TELE_BOOKING_ENDPOINTS.CANCEL(b.id), { reason });
            toast.success("Đã huỷ."); await load();
        } catch { toast.error("Không huỷ được."); }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Booking khám từ xa"
                subtitle="Danh sách tất cả phiên tư vấn/khám online đã đặt"
                icon="videocam"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Telemedicine" }, { label: "Booking" }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng booking" value={stats.total} icon="videocam" color="blue" loading={loading} />
                <StatCard label="Chờ xác nhận" value={stats.pending} icon="hourglass_top" color="amber" loading={loading} />
                <StatCard label="Hôm nay" value={stats.today} icon="today" color="emerald" loading={loading} />
                <StatCard label="Doanh thu" value={formatVND(stats.revenue)} icon="payments" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm mã, bệnh nhân, bác sĩ..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "status", label: "Trạng thái", value: statusFilter, onChange: setStatusFilter,
                    options: [{ value: "all", label: "Tất cả" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))],
                }]}
                onReset={() => { setSearch(""); setStatusFilter("all"); }}
            />

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="videocam" title="Chưa có booking" description={items.length === 0 ? "Chưa có ai đặt lịch khám online." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Mã</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bệnh nhân</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Bác sĩ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Loại</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Giờ hẹn</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Giá</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Trạng thái</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((b) => {
                                    const meta = STATUS_META[b.status];
                                    return (
                                        <tr key={b.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{b.code || b.id.slice(0, 8)}</td>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">{b.patientName}</td>
                                            <td className="px-4 py-3 text-[#687582] dark:text-gray-400">{b.doctorName || "—"}</td>
                                            <td className="px-4 py-3 text-xs text-[#687582]">{b.typeName || "—"}</td>
                                            <td className="px-4 py-3 text-xs text-[#121417] dark:text-white">{formatDT(b.scheduledAt)}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-[#121417] dark:text-white">{formatVND(b.price ?? 0)}</td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    meta.color === "emerald" ? "bg-emerald-100 text-emerald-700" :
                                                    meta.color === "blue" ? "bg-blue-100 text-blue-700" :
                                                    meta.color === "amber" ? "bg-amber-100 text-amber-700" :
                                                    meta.color === "violet" ? "bg-violet-100 text-violet-700" :
                                                    "bg-red-100 text-red-700"
                                                }`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{meta.icon}</span>
                                                    {meta.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {b.status === "PENDING" && (
                                                        <button onClick={() => handleConfirm(b)} className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md" title="Xác nhận">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
                                                        </button>
                                                    )}
                                                    {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                                                        <button onClick={() => handleCancel(b)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Huỷ">
                                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cancel</span>
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
