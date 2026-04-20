"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { STOCK_OUT_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type StockOutStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

interface StockOutOrder {
    id: string;
    code: string;
    warehouseName?: string;
    reason?: string;
    totalItems: number;
    totalValue?: number;
    status: StockOutStatus;
    createdBy?: string;
    createdAt?: string;
    confirmedAt?: string;
}

interface StockOutItem {
    id: string;
    medicineName: string;
    batchNo?: string;
    quantity: number;
    unit?: string;
    unitPrice?: number;
}

const STATUS_META: Record<StockOutStatus, { label: string; color: string; icon: string }> = {
    PENDING: { label: "Chờ duyệt", color: "amber", icon: "hourglass_top" },
    CONFIRMED: { label: "Đã xuất", color: "emerald", icon: "check_circle" },
    CANCELLED: { label: "Đã huỷ", color: "red", icon: "cancel" },
};

function normalizeStatus(raw: any): StockOutStatus {
    const s = String(raw ?? "").toUpperCase();
    if (s === "CONFIRMED" || s === "COMPLETED" || s === "DONE") return "CONFIRMED";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    return "PENDING";
}

function mapOrder(r: any): StockOutOrder {
    return {
        id: String(r.stock_out_id ?? r.stockOutId ?? r.id ?? r.order_id ?? ""),
        code: r.code ?? r.order_code ?? r.stock_out_code ?? "",
        warehouseName: r.warehouse_name ?? r.warehouseName ?? "",
        reason: r.reason ?? r.note ?? r.description ?? "",
        totalItems: Number(r.total_items ?? r.totalItems ?? r.item_count ?? 0),
        totalValue: Number(r.total_value ?? r.totalValue ?? r.total_amount ?? 0),
        status: normalizeStatus(r.status),
        createdBy: r.created_by_name ?? r.createdByName ?? "",
        createdAt: r.created_at ?? r.createdAt ?? "",
        confirmedAt: r.confirmed_at ?? r.confirmedAt ?? "",
    };
}

function mapItem(r: any): StockOutItem {
    return {
        id: String(r.item_id ?? r.id ?? ""),
        medicineName: r.medicine_name ?? r.medicineName ?? r.name ?? "",
        batchNo: r.batch_no ?? r.batchNo ?? "",
        quantity: Number(r.quantity ?? 0),
        unit: r.unit ?? "",
        unitPrice: Number(r.unit_price ?? r.unitPrice ?? 0),
    };
}

function formatDT(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatVND(n: number): string {
    if (!n) return "0 ₫";
    return n.toLocaleString("vi-VN") + " ₫";
}

export default function StockOutPage() {
    const toast = useToast();
    const [orders, setOrders] = useState<StockOutOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [detail, setDetail] = useState<StockOutOrder | null>(null);
    const [detailItems, setDetailItems] = useState<StockOutItem[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(STOCK_OUT_ENDPOINTS.LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setOrders(data.map(mapOrder));
        } catch {
            setError("Không tải được danh sách phiếu xuất kho.");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return orders.filter((o) => {
            if (statusFilter !== "all" && o.status !== statusFilter) return false;
            if (q && !`${o.code} ${o.warehouseName ?? ""} ${o.reason ?? ""} ${o.createdBy ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [orders, search, statusFilter]);

    const stats = useMemo(() => ({
        total: orders.length,
        pending: orders.filter((o) => o.status === "PENDING").length,
        confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
        totalValue: orders.filter((o) => o.status === "CONFIRMED").reduce((sum, o) => sum + (o.totalValue ?? 0), 0),
    }), [orders]);

    const openDetail = async (o: StockOutOrder) => {
        setDetail(o);
        setDetailItems([]);
        try {
            const res = await axiosClient.get(STOCK_OUT_ENDPOINTS.ITEMS(o.id));
            const { data } = unwrapList<any>(res);
            setDetailItems(data.map(mapItem));
        } catch {
            toast.error("Không tải được chi tiết phiếu.");
        }
    };

    const handleConfirm = async (o: StockOutOrder) => {
        if (!confirm(`Xác nhận xuất kho phiếu ${o.code}?`)) return;
        try {
            await axiosClient.patch(STOCK_OUT_ENDPOINTS.CONFIRM(o.id));
            toast.success("Đã xác nhận xuất kho.");
            await load();
        } catch {
            toast.error("Không xác nhận được.");
        }
    };

    const handleCancel = async (o: StockOutOrder) => {
        if (!confirm(`Huỷ phiếu xuất ${o.code}?`)) return;
        try {
            await axiosClient.patch(STOCK_OUT_ENDPOINTS.CANCEL(o.id));
            toast.success("Đã huỷ phiếu.");
            await load();
        } catch {
            toast.error("Không huỷ được.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Phiếu xuất kho"
                subtitle="Theo dõi và duyệt các phiếu xuất kho thuốc/vật tư"
                icon="output"
                breadcrumbs={[{ label: "Dược sĩ", href: "/portal/pharmacist" }, { label: "Xuất kho" }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng phiếu" value={stats.total} icon="output" color="blue" loading={loading} />
                <StatCard label="Chờ duyệt" value={stats.pending} icon="hourglass_top" color="amber" loading={loading} />
                <StatCard label="Đã xuất" value={stats.confirmed} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Tổng giá trị" value={formatVND(stats.totalValue)} icon="payments" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm mã phiếu, kho, lý do..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "status", label: "Trạng thái", value: statusFilter, onChange: setStatusFilter,
                    options: [{ value: "all", label: "Tất cả" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))],
                }]}
                onReset={() => { setSearch(""); setStatusFilter("all"); }}
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
                <EmptyState icon="output" title="Chưa có phiếu xuất kho" description={orders.length === 0 ? "Chưa có phiếu xuất nào." : "Không khớp bộ lọc."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Mã phiếu</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Kho</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Lý do</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">SL</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Giá trị</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Trạng thái</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thời gian</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((o) => {
                                    const meta = STATUS_META[o.status];
                                    return (
                                        <tr key={o.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{o.code}</td>
                                            <td className="px-4 py-3 text-xs text-[#121417] dark:text-white">{o.warehouseName || "—"}</td>
                                            <td className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400 max-w-xs truncate" title={o.reason}>{o.reason || "—"}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-[#121417] dark:text-white">{o.totalItems}</td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-[#121417] dark:text-white">{formatVND(o.totalValue ?? 0)}</td>
                                            <td className="px-4 py-3">
                                                <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                                    meta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                                    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                                }`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{meta.icon}</span>
                                                    {meta.label}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400">{formatDT(o.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openDetail(o)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title="Chi tiết">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>
                                                    </button>
                                                    {o.status === "PENDING" && (
                                                        <>
                                                            <button onClick={() => handleConfirm(o)} className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md" title="Duyệt">
                                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
                                                            </button>
                                                            <button onClick={() => handleCancel(o)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Huỷ">
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
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">output</span>
                            Chi tiết phiếu xuất {detail.code}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl text-sm">
                            <div><div className="text-xs text-[#687582] dark:text-gray-400">Kho</div><div className="font-semibold text-[#121417] dark:text-white">{detail.warehouseName || "—"}</div></div>
                            <div><div className="text-xs text-[#687582] dark:text-gray-400">Lý do</div><div className="font-semibold text-[#121417] dark:text-white">{detail.reason || "—"}</div></div>
                            <div><div className="text-xs text-[#687582] dark:text-gray-400">Người tạo</div><div className="font-semibold text-[#121417] dark:text-white">{detail.createdBy || "—"}</div></div>
                            <div><div className="text-xs text-[#687582] dark:text-gray-400">Ngày tạo</div><div className="font-semibold text-[#121417] dark:text-white">{formatDT(detail.createdAt)}</div></div>
                        </div>
                        <h4 className="text-sm font-semibold text-[#121417] dark:text-white mb-2">Danh sách thuốc ({detailItems.length})</h4>
                        {detailItems.length === 0 ? (
                            <div className="text-sm text-[#687582] dark:text-gray-400 italic py-3">Đang tải hoặc không có chi tiết.</div>
                        ) : (
                            <table className="w-full text-sm border border-[#dde0e4] dark:border-[#2d353e] rounded-xl overflow-hidden">
                                <thead className="bg-[#f8f9fa] dark:bg-[#13191f]">
                                    <tr>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-[#687582] dark:text-gray-400">Thuốc</th>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-[#687582] dark:text-gray-400">Lô</th>
                                        <th className="text-right px-3 py-2 text-xs font-semibold text-[#687582] dark:text-gray-400">SL</th>
                                        <th className="text-right px-3 py-2 text-xs font-semibold text-[#687582] dark:text-gray-400">Đơn giá</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailItems.map((it) => (
                                        <tr key={it.id} className="border-t border-gray-50 dark:border-gray-800">
                                            <td className="px-3 py-2 text-[#121417] dark:text-white">{it.medicineName}</td>
                                            <td className="px-3 py-2 font-mono text-xs text-[#687582] dark:text-gray-400">{it.batchNo || "—"}</td>
                                            <td className="px-3 py-2 text-right font-semibold text-[#121417] dark:text-white">{it.quantity} {it.unit}</td>
                                            <td className="px-3 py-2 text-right font-mono text-xs text-[#121417] dark:text-white">{formatVND(it.unitPrice ?? 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div className="flex items-center justify-end mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
