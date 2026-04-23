"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { SHIFT_SWAP_ENDPOINTS, STAFF_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type SwapStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface ShiftSwap {
    id: string;
    requesterId: string;
    requesterName: string;
    targetStaffId: string;
    targetStaffName: string;
    fromDate?: string;
    toDate?: string;
    fromShiftName?: string;
    toShiftName?: string;
    reason?: string;
    status: SwapStatus;
    rejectReason?: string;
    createdAt?: string;
}

interface StaffLite {
    id: string;
    fullName: string;
}

const STATUS_META: Record<SwapStatus, { label: string; color: string; icon: string }> = {
    PENDING: { label: "Chờ duyệt", color: "amber", icon: "hourglass_top" },
    APPROVED: { label: "Đã duyệt", color: "emerald", icon: "check_circle" },
    REJECTED: { label: "Từ chối", color: "red", icon: "cancel" },
    CANCELLED: { label: "Đã huỷ", color: "gray", icon: "block" },
};

function normalizeStatus(raw: any): SwapStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "APPROVED" || s === "ACCEPTED") return "APPROVED";
    if (s === "REJECTED" || s === "DENIED") return "REJECTED";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    return "PENDING";
}

function mapSwap(r: any): ShiftSwap {
    return {
        id: String(r.shift_swaps_id ?? r.swap_id ?? r.id ?? ""),
        requesterId: String(r.requester_id ?? r.requesterId ?? r.from_user_id ?? ""),
        requesterName: r.requester_name ?? r.requesterName ?? r.from_user_name ?? "—",
        targetStaffId: String(r.target_staff_id ?? r.targetStaffId ?? r.to_user_id ?? ""),
        targetStaffName: r.target_staff_name ?? r.targetStaffName ?? r.to_user_name ?? "—",
        fromDate: r.from_date ?? r.fromDate ?? r.original_date ?? "",
        toDate: r.to_date ?? r.toDate ?? r.target_date ?? "",
        fromShiftName: r.from_shift_name ?? r.fromShiftName ?? "",
        toShiftName: r.to_shift_name ?? r.toShiftName ?? "",
        reason: r.reason ?? r.note ?? "",
        status: normalizeStatus(r.status),
        rejectReason: r.reject_reason ?? r.rejectReason ?? "",
        createdAt: r.created_at ?? r.createdAt ?? "",
    };
}

function formatDate(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ShiftSwapsAdminPage() {
    const toast = useToast();
    const t = useTranslations("pages.shiftSwaps");
    const tc = useTranslations("common");
    const [swaps, setSwaps] = useState<ShiftSwap[]>([]);
    const [staffList, setStaffList] = useState<StaffLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [detail, setDetail] = useState<ShiftSwap | null>(null);
    const [rejectTarget, setRejectTarget] = useState<ShiftSwap | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState<string | null>(null);

    const loadStaff = useCallback(async () => {
        try {
            const res = await axiosClient.get(STAFF_ENDPOINTS.LIST, { params: { limit: 500 } });
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            setStaffList(raw.map((d: any) => ({ id: String(d.users_id ?? d.id ?? ""), fullName: d.full_name ?? d.fullName ?? d.name ?? "" })).filter((s) => s.id));
        } catch {
            setStaffList([]);
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(SHIFT_SWAP_ENDPOINTS.LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            const mapped = data.map(mapSwap);
            const staffMap = new Map(staffList.map((s) => [s.id, s.fullName]));
            setSwaps(
                mapped.map((sw) => ({
                    ...sw,
                    requesterName: sw.requesterName !== "—" ? sw.requesterName : staffMap.get(sw.requesterId) ?? "—",
                    targetStaffName: sw.targetStaffName !== "—" ? sw.targetStaffName : staffMap.get(sw.targetStaffId) ?? "—",
                }))
            );
        } catch {
            setError("Không tải được danh sách đơn đổi ca.");
            setSwaps([]);
        } finally {
            setLoading(false);
        }
    }, [staffList]);

    useEffect(() => { loadStaff(); }, [loadStaff]);
    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return swaps.filter((s) => {
            if (statusFilter !== "all" && s.status !== statusFilter) return false;
            if (q && !`${s.requesterName} ${s.targetStaffName} ${s.reason ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [swaps, search, statusFilter]);

    const stats = useMemo(
        () => ({
            total: swaps.length,
            pending: swaps.filter((s) => s.status === "PENDING").length,
            approved: swaps.filter((s) => s.status === "APPROVED").length,
            rejected: swaps.filter((s) => s.status === "REJECTED").length,
        }),
        [swaps]
    );

    const handleApprove = async (s: ShiftSwap) => {
        if (!confirm(`Duyệt đổi ca giữa "${s.requesterName}" và "${s.targetStaffName}"?`)) return;
        setProcessing(s.id);
        try {
            await axiosClient.patch(SHIFT_SWAP_ENDPOINTS.APPROVE(s.id));
            toast.success("Đã duyệt đổi ca.");
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không duyệt được đổi ca.");
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
            await axiosClient.patch(SHIFT_SWAP_ENDPOINTS.REJECT(rejectTarget.id), { reason: rejectReason.trim() });
            toast.success("Đã từ chối đổi ca.");
            setRejectTarget(null);
            setRejectReason("");
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không từ chối được đổi ca.");
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="swap_horiz"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng yêu cầu" value={stats.total} icon="swap_horiz" color="blue" loading={loading} />
                <StatCard label="Chờ duyệt" value={stats.pending} icon="hourglass_top" color="amber" loading={loading} />
                <StatCard label="Đã duyệt" value={stats.approved} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Từ chối" value={stats.rejected} icon="cancel" color="red" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo tên nhân sự hoặc lý do..."
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
                ]}
                onReset={() => { setSearch(""); setStatusFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="swap_horiz"
                    title="Chưa có yêu cầu đổi ca"
                    description={swaps.length === 0 ? "Nhân sự chưa gửi yêu cầu đổi ca nào." : "Không có yêu cầu phù hợp bộ lọc."}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((sw) => {
                        const meta = STATUS_META[sw.status];
                        return (
                            <div key={sw.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex-1 text-center">
                                        <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white font-bold text-sm mb-1">
                                            {(sw.requesterName[0] ?? "?").toUpperCase()}
                                        </div>
                                        <div className="text-xs font-semibold text-[#121417] dark:text-white truncate" title={sw.requesterName}>{sw.requesterName}</div>
                                        <div className="text-[10px] text-[#687582] dark:text-gray-400">{formatDate(sw.fromDate)}</div>
                                        {sw.fromShiftName && <div className="text-[10px] text-[#3C81C6]">{sw.fromShiftName}</div>}
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "28px" }}>swap_horiz</span>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm mb-1">
                                            {(sw.targetStaffName[0] ?? "?").toUpperCase()}
                                        </div>
                                        <div className="text-xs font-semibold text-[#121417] dark:text-white truncate" title={sw.targetStaffName}>{sw.targetStaffName}</div>
                                        <div className="text-[10px] text-[#687582] dark:text-gray-400">{formatDate(sw.toDate)}</div>
                                        {sw.toShiftName && <div className="text-[10px] text-violet-600">{sw.toShiftName}</div>}
                                    </div>
                                </div>
                                {sw.reason && (
                                    <div className="text-xs text-[#687582] dark:text-gray-400 bg-[#f8f9fa] dark:bg-[#13191f] rounded-lg p-2 mb-3 line-clamp-2" title={sw.reason}>
                                        {sw.reason}
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
                                    <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                                        meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                        meta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                        meta.color === "red" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    }`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{meta.icon}</span>
                                        {meta.label}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setDetail(sw)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title="Chi tiết">
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>
                                        </button>
                                        {sw.status === "PENDING" && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(sw)}
                                                    disabled={processing === sw.id}
                                                    className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md disabled:opacity-50"
                                                    title="Duyệt"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
                                                </button>
                                                <button
                                                    onClick={() => { setRejectTarget(sw); setRejectReason(""); }}
                                                    disabled={processing === sw.id}
                                                    className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50"
                                                    title="Từ chối"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cancel</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDetail(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">swap_horiz</span>
                            Chi tiết yêu cầu đổi ca
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-xs text-[#687582] dark:text-gray-400 mb-1">Người yêu cầu</div>
                                <div className="font-semibold text-[#121417] dark:text-white">{detail.requesterName}</div>
                                <div className="text-xs text-[#687582] dark:text-gray-400">{formatDate(detail.fromDate)} {detail.fromShiftName && `· ${detail.fromShiftName}`}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[#687582] dark:text-gray-400 mb-1">Người đổi</div>
                                <div className="font-semibold text-[#121417] dark:text-white">{detail.targetStaffName}</div>
                                <div className="text-xs text-[#687582] dark:text-gray-400">{formatDate(detail.toDate)} {detail.toShiftName && `· ${detail.toShiftName}`}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-xs text-[#687582] dark:text-gray-400 mb-1">Lý do</div>
                                <div className="text-[#121417] dark:text-white whitespace-pre-wrap">{detail.reason || "—"}</div>
                            </div>
                            {detail.status === "REJECTED" && detail.rejectReason && (
                                <div className="col-span-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <div className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Lý do từ chối</div>
                                    <div className="text-sm text-red-800 dark:text-red-200">{detail.rejectReason}</div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            {detail.status === "PENDING" && (
                                <>
                                    <button onClick={() => { const t = detail; setDetail(null); setRejectTarget(t); setRejectReason(""); }} className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">Từ chối</button>
                                    <button onClick={() => { const t = detail; setDetail(null); handleApprove(t); }} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-sm hover:shadow-md">Duyệt</button>
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
                            Từ chối đổi ca
                        </h3>
                        <p className="text-sm text-[#687582] dark:text-gray-400 mb-4">
                            Đổi ca giữa <b>{rejectTarget.requesterName}</b> và <b>{rejectTarget.targetStaffName}</b>
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
                                {processing !== null ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xử lý...</>) : "Từ chối"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
