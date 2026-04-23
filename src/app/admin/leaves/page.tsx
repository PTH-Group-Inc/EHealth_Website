"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { LEAVE_ENDPOINTS, STAFF_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
type LeaveType = "ANNUAL" | "SICK" | "PERSONAL" | "MATERNITY" | "UNPAID" | "OTHER";

interface Leave {
    id: string;
    staffId: string;
    staffName: string;
    staffRole?: string;
    departmentName?: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays?: number;
    reason?: string;
    status: LeaveStatus;
    rejectReason?: string;
    approverName?: string;
    approvedAt?: string;
    createdAt?: string;
}

interface StaffLite {
    id: string;
    fullName: string;
    role?: string;
}

const STATUS_META: Record<LeaveStatus, { label: string; color: string; icon: string; bg: string }> = {
    PENDING: { label: "Chờ duyệt", color: "amber", icon: "hourglass_top", bg: "from-amber-500 to-orange-500" },
    APPROVED: { label: "Đã duyệt", color: "emerald", icon: "check_circle", bg: "from-emerald-500 to-teal-500" },
    REJECTED: { label: "Từ chối", color: "red", icon: "cancel", bg: "from-red-500 to-rose-500" },
    CANCELLED: { label: "Đã huỷ", color: "gray", icon: "block", bg: "from-gray-400 to-gray-500" },
};

const LEAVE_TYPE_META: Record<LeaveType, { label: string; icon: string }> = {
    ANNUAL: { label: "Nghỉ phép năm", icon: "beach_access" },
    SICK: { label: "Nghỉ ốm", icon: "sick" },
    PERSONAL: { label: "Việc riêng", icon: "person" },
    MATERNITY: { label: "Thai sản", icon: "child_friendly" },
    UNPAID: { label: "Không lương", icon: "money_off" },
    OTHER: { label: "Khác", icon: "more_horiz" },
};

function normalizeStatus(raw: any): LeaveStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "APPROVED" || s === "ACCEPTED") return "APPROVED";
    if (s === "REJECTED" || s === "DENIED") return "REJECTED";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    return "PENDING";
}

function normalizeType(raw: any): LeaveType {
    const t = String(raw ?? "").toUpperCase();
    if (t in LEAVE_TYPE_META) return t as LeaveType;
    return "OTHER";
}

function diffDays(start: string, end: string): number {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) return 0;
    return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

function mapLeave(r: any): Leave {
    const startDate = r.start_date ?? r.startDate ?? r.from_date ?? r.fromDate ?? "";
    const endDate = r.end_date ?? r.endDate ?? r.to_date ?? r.toDate ?? "";
    return {
        id: String(r.leaves_id ?? r.leave_id ?? r.id ?? ""),
        staffId: String(r.users_id ?? r.staff_id ?? r.user_id ?? r.staffId ?? ""),
        staffName: r.staff_name ?? r.full_name ?? r.staffName ?? r.name ?? "—",
        staffRole: r.role ?? r.staff_role ?? r.roles?.[0] ?? "",
        departmentName: r.department_name ?? r.departmentName ?? r.specialty_name ?? "",
        leaveType: normalizeType(r.leave_type ?? r.type ?? r.leaveType),
        startDate,
        endDate,
        totalDays: r.total_days ?? r.totalDays ?? diffDays(startDate, endDate),
        reason: r.reason ?? r.note ?? r.description ?? "",
        status: normalizeStatus(r.status),
        rejectReason: r.reject_reason ?? r.rejectReason ?? r.rejection_reason ?? "",
        approverName: r.approver_name ?? r.approverName ?? r.approved_by_name ?? "",
        approvedAt: r.approved_at ?? r.approvedAt ?? "",
        createdAt: r.created_at ?? r.createdAt ?? "",
    };
}

function formatDate(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function LeavesAdminPage() {
    const toast = useToast();
    const t = useTranslations("pages.leaves");
    const tc = useTranslations("common");
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [staffList, setStaffList] = useState<StaffLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [detail, setDetail] = useState<Leave | null>(null);
    const [rejectTarget, setRejectTarget] = useState<Leave | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState<string | null>(null);

    const loadStaff = useCallback(async () => {
        try {
            const res = await axiosClient.get(STAFF_ENDPOINTS.LIST, { params: { limit: 500 } });
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            setStaffList(
                raw
                    .map((d: any) => ({
                        id: String(d.users_id ?? d.id ?? ""),
                        fullName: d.full_name ?? d.fullName ?? d.name ?? "",
                        role: Array.isArray(d.roles) && d.roles.length > 0 ? d.roles[0] : d.role ?? "",
                    }))
                    .filter((s) => s.id)
            );
        } catch {
            setStaffList([]);
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(LEAVE_ENDPOINTS.LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            const mapped = data.map(mapLeave);
            // Enrich staff name when backend only returns users_id
            const staffMap = new Map(staffList.map((s) => [s.id, s]));
            setLeaves(
                mapped.map((l) => {
                    if (l.staffName === "—" && l.staffId && staffMap.has(l.staffId)) {
                        const s = staffMap.get(l.staffId)!;
                        return { ...l, staffName: s.fullName, staffRole: l.staffRole || s.role };
                    }
                    return l;
                })
            );
        } catch {
            setError("Không tải được danh sách nghỉ phép.");
            setLeaves([]);
        } finally {
            setLoading(false);
        }
    }, [staffList]);

    useEffect(() => {
        loadStaff();
    }, [loadStaff]);

    useEffect(() => {
        load();
    }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return leaves.filter((l) => {
            if (statusFilter !== "all" && l.status !== statusFilter) return false;
            if (typeFilter !== "all" && l.leaveType !== typeFilter) return false;
            if (q && !`${l.staffName} ${l.reason ?? ""} ${l.departmentName ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [leaves, search, statusFilter, typeFilter]);

    const stats = useMemo(
        () => ({
            total: leaves.length,
            pending: leaves.filter((l) => l.status === "PENDING").length,
            approved: leaves.filter((l) => l.status === "APPROVED").length,
            rejected: leaves.filter((l) => l.status === "REJECTED").length,
        }),
        [leaves]
    );

    const handleApprove = async (l: Leave) => {
        if (!confirm(`Duyệt đơn nghỉ của "${l.staffName}" (${formatDate(l.startDate)} → ${formatDate(l.endDate)})?`)) return;
        setProcessing(l.id);
        try {
            await axiosClient.put(LEAVE_ENDPOINTS.APPROVE(l.id));
            toast.success(`Đã duyệt đơn nghỉ của ${l.staffName}.`);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không duyệt được đơn nghỉ.");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        if (!rejectReason.trim()) {
            toast.warning("Vui lòng nhập lý do từ chối.");
            return;
        }
        setProcessing(rejectTarget.id);
        try {
            await axiosClient.put(LEAVE_ENDPOINTS.REJECT(rejectTarget.id), { reason: rejectReason.trim() });
            toast.success(`Đã từ chối đơn nghỉ của ${rejectTarget.staffName}.`);
            setRejectTarget(null);
            setRejectReason("");
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không từ chối được đơn nghỉ.");
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="event_busy"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng đơn" value={stats.total} icon="event_note" color="blue" loading={loading} />
                <StatCard label="Chờ duyệt" value={stats.pending} icon="hourglass_top" color="amber" loading={loading} />
                <StatCard label="Đã duyệt" value={stats.approved} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Từ chối" value={stats.rejected} icon="cancel" color="red" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo tên nhân sự, khoa, lý do..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
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
                    {
                        key: "type",
                        label: "Loại nghỉ",
                        value: typeFilter,
                        onChange: setTypeFilter,
                        options: [
                            { value: "all", label: "Mọi loại" },
                            ...Object.entries(LEAVE_TYPE_META).map(([k, v]) => ({ value: k, label: v.label })),
                        ],
                    },
                ]}
                onReset={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="event_busy"
                    title="Chưa có đơn nghỉ phép"
                    description={leaves.length === 0 ? "Nhân sự chưa gửi đơn nghỉ nào." : "Không có đơn phù hợp bộ lọc."}
                />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Nhân sự</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Loại</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thời gian</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Lý do</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Trạng thái</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((l) => {
                                    const smeta = STATUS_META[l.status];
                                    const tmeta = LEAVE_TYPE_META[l.leaveType];
                                    return (
                                        <tr key={l.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-[#121417] dark:text-white">{l.staffName}</div>
                                                {l.departmentName && <div className="text-xs text-[#687582] dark:text-gray-400">{l.departmentName}</div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-[#687582] dark:text-gray-300">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{tmeta.icon}</span>
                                                    {tmeta.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[#121417] dark:text-white">
                                                <div>{formatDate(l.startDate)} → {formatDate(l.endDate)}</div>
                                                <div className="text-xs text-[#687582] dark:text-gray-400">{l.totalDays} ngày</div>
                                            </td>
                                            <td className="px-4 py-3 text-[#687582] dark:text-gray-400 max-w-xs">
                                                <div className="truncate" title={l.reason}>{l.reason || "—"}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    smeta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                    smeta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                                    smeta.color === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                }`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{smeta.icon}</span>
                                                    {smeta.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => setDetail(l)}
                                                        className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md"
                                                        title="Chi tiết"
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>
                                                    </button>
                                                    {l.status === "PENDING" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(l)}
                                                                disabled={processing === l.id}
                                                                className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md disabled:opacity-50"
                                                                title="Duyệt"
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
                                                            </button>
                                                            <button
                                                                onClick={() => { setRejectTarget(l); setRejectReason(""); }}
                                                                disabled={processing === l.id}
                                                                className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50"
                                                                title="Từ chối"
                                                            >
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

            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDetail(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">event_busy</span>
                            Chi tiết đơn nghỉ phép
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-xs text-[#687582] dark:text-gray-400 mb-1">Nhân sự</div>
                                    <div className="font-semibold text-[#121417] dark:text-white">{detail.staffName}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#687582] dark:text-gray-400 mb-1">Khoa</div>
                                    <div className="text-[#121417] dark:text-white">{detail.departmentName || "—"}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#687582] dark:text-gray-400 mb-1">Loại nghỉ</div>
                                    <div className="text-[#121417] dark:text-white">{LEAVE_TYPE_META[detail.leaveType].label}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#687582] dark:text-gray-400 mb-1">Số ngày</div>
                                    <div className="text-[#121417] dark:text-white font-semibold">{detail.totalDays} ngày</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#687582] dark:text-gray-400 mb-1">Từ ngày</div>
                                    <div className="text-[#121417] dark:text-white">{formatDate(detail.startDate)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#687582] dark:text-gray-400 mb-1">Đến ngày</div>
                                    <div className="text-[#121417] dark:text-white">{formatDate(detail.endDate)}</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-[#687582] dark:text-gray-400 mb-1">Lý do</div>
                                <div className="text-[#121417] dark:text-white whitespace-pre-wrap">{detail.reason || "—"}</div>
                            </div>
                            {detail.status === "REJECTED" && detail.rejectReason && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <div className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Lý do từ chối</div>
                                    <div className="text-sm text-red-800 dark:text-red-200">{detail.rejectReason}</div>
                                </div>
                            )}
                            {detail.status === "APPROVED" && detail.approverName && (
                                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                                    Duyệt bởi <b>{detail.approverName}</b> {detail.approvedAt && `· ${formatDate(detail.approvedAt)}`}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            {detail.status === "PENDING" && (
                                <>
                                    <button
                                        onClick={() => { const t = detail; setDetail(null); setRejectTarget(t); setRejectReason(""); }}
                                        className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                    >
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={() => { const t = detail; setDetail(null); handleApprove(t); }}
                                        className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-sm hover:shadow-md"
                                    >
                                        Duyệt đơn
                                    </button>
                                </>
                            )}
                            <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setRejectTarget(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-600">cancel</span>
                            Từ chối đơn nghỉ phép
                        </h3>
                        <p className="text-sm text-[#687582] dark:text-gray-400 mb-4">
                            Đơn của <b>{rejectTarget.staffName}</b> · {formatDate(rejectTarget.startDate)} → {formatDate(rejectTarget.endDate)}
                        </p>
                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lý do từ chối *</label>
                        <textarea
                            rows={4}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Nêu lý do để nhân sự biết..."
                            className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/20 dark:text-white"
                        />
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setRejectTarget(null)} disabled={processing !== null} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button
                                onClick={handleReject}
                                disabled={processing !== null}
                                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1"
                            >
                                {processing !== null ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xử lý...</>) : "Từ chối đơn"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
