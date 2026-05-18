"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { inventoryService } from "@/services/inventoryService";

type StockInStatus = "DRAFT" | "CONFIRMED" | "RECEIVED" | "CANCELLED";

interface ImportDetail {
    id: string;
    code: string;
    status: StockInStatus;
    createdAt: string;
    createdBy: string;
    supplier: string;
    warehouseName: string;
    note: string;
    totalItems: number;
    totalAmount: number;
    receivedBy: string;
    receivedAt: string;
    cancelReason: string;
}

interface ImportItem {
    id: string;
    drugName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lotNumber: string;
    expiryDate: string;
}

const formatDate = (value: unknown): string => {
    const raw = String(value ?? "");
    return raw.includes("T") ? raw.split("T")[0] : raw;
};

const normalizeStatus = (value: unknown): StockInStatus => {
    const status = String(value ?? "").trim().toUpperCase();

    if (status === "CONFIRMED" || status === "RECEIVED" || status === "CANCELLED") {
        return status;
    }
    return "DRAFT";
};

const STATUS_MAP: Record<StockInStatus, { label: string; bg: string; text: string; icon: string }> = {
    DRAFT: { label: "Bản nháp", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: "pending" },
    CONFIRMED: { label: "Đã xác nhận", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: "task_alt" },
    RECEIVED: { label: "Đã nhập", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: "check_circle" },
    CANCELLED: { label: "Đã hủy", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: "cancel" },
};

export default function StockInDetailPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [detail, setDetail] = useState<ImportDetail | null>(null);
    const [items, setItems] = useState<ImportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<"" | "confirm" | "receive" | "cancel">("");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    useEffect(() => {
        setLoading(true);
        inventoryService.getStockInDetail(orderId)
            .then((response: any) => {
                const order = response?.order;
                const details = Array.isArray(response?.details) ? response.details : [];

                if (!order) {
                    setDetail(null);
                    setItems([]);
                    return;
                }

                setDetail({
                    id: order.stock_in_order_id ?? order.id ?? orderId,
                    code: order.order_code ?? order.code ?? `NK-${orderId}`,
                    status: normalizeStatus(order.status),
                    createdAt: formatDate(order.created_at),
                    createdBy: order.created_by_name ?? "-",
                    supplier: order.supplier_name ?? order.supplier?.name ?? "-",
                    warehouseName: order.warehouse_name ?? order.warehouse?.name ?? "-",
                    note: order.notes ?? order.note ?? "",
                    totalItems: Number(response?.total_items ?? details.length),
                    totalAmount: Number(order.total_amount ?? 0),
                    receivedBy: order.received_by_name ?? "-",
                    receivedAt: formatDate(order.received_at),
                    cancelReason: order.cancelled_reason ?? "",
                });

                setItems(details.map((item: any, index: number) => ({
                    id: item.stock_in_detail_id ?? item.id ?? String(index + 1),
                    drugName: item.brand_name ?? item.drug_name ?? "-",
                    quantity: Number(item.quantity ?? 0),
                    unit: item.dispensing_unit ?? item.unit ?? "Đơn vị",
                    unitPrice: Number(item.unit_cost ?? item.unit_price ?? 0),
                    lotNumber: item.batch_number ?? item.lot_number ?? "",
                    expiryDate: formatDate(item.expiry_date ?? item.expiryDate),
                })));
            })
            .catch(() => {
                setDetail(null);
                setItems([]);
            })
            .finally(() => setLoading(false));
    }, [orderId]);

    const handleConfirm = async () => {
        setActionLoading("confirm");
        try {
            await inventoryService.confirmStockIn(orderId);
            setDetail((current) => current ? { ...current, status: "CONFIRMED" } : current);
        } catch {
            alert("Không thể xác nhận phiếu nhập. Vui lòng thử lại.");
        } finally {
            setActionLoading("");
        }
    };

    const handleReceive = async () => {
        setActionLoading("receive");
        try {
            await inventoryService.receiveStockIn(orderId);
            setDetail((current) => current ? { ...current, status: "RECEIVED", receivedAt: formatDate(new Date().toISOString()) } : current);
        } catch {
            alert("Không thể nhận hàng. Vui lòng thử lại.");
        } finally {
            setActionLoading("");
        }
    };

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            return;
        }

        setActionLoading("cancel");
        try {
            await inventoryService.cancelStockIn(orderId, cancelReason);
            setDetail((current) => current ? { ...current, status: "CANCELLED", cancelReason } : current);
        } catch {
            alert("Không thể hủy phiếu nhập. Vui lòng thử lại.");
        } finally {
            setActionLoading("");
            setShowCancelModal(false);
            setCancelReason("");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3C81C6] border-t-transparent" />
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined mb-4 text-5xl text-gray-300">inbox</span>
                <p className="mb-4 text-lg text-gray-500">Không tìm thấy phiếu nhập</p>
                <button onClick={() => router.back()} className="rounded-xl bg-[#3C81C6] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2a6da8]">
                    Quay lại
                </button>
            </div>
        );
    }

    const status = STATUS_MAP[detail.status];
    const totalValue = detail.totalAmount > 0
        ? detail.totalAmount
        : items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/medicines" className="transition-colors hover:text-[#3C81C6]">Danh mục thuốc</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <Link href="/admin/medicines/import" className="transition-colors hover:text-[#3C81C6]">Nhập kho</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="font-medium text-[#121417] dark:text-white">{detail.code}</span>
                </div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#1e242b] dark:hover:bg-gray-800"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Quay lại
                </button>
            </div>

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                    <div className="mb-2 flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">Phiếu nhập {detail.code}</h1>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                            <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                            {status.label}
                        </span>
                    </div>
                    <p className="text-sm text-[#687582] dark:text-gray-400">Tạo lúc {detail.createdAt || "-"} bởi {detail.createdBy}</p>
                </div>

                {(detail.status === "DRAFT" || detail.status === "CONFIRMED") && (
                    <div className="flex items-center gap-2">
                        {detail.status === "DRAFT" && (
                            <button
                                onClick={handleConfirm}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {actionLoading === "confirm" ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                                Xác nhận
                            </button>
                        )}
                        {detail.status === "CONFIRMED" && (
                            <button
                                onClick={handleReceive}
                                disabled={!!actionLoading}
                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                                {actionLoading === "receive" ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <span className="material-symbols-outlined text-[18px]">inventory</span>}
                                Nhận hàng
                            </button>
                        )}
                        <button
                            onClick={() => setShowCancelModal(true)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                            Hủy phiếu
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-xl border border-[#dde0e4] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">Nhà cung cấp</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{detail.supplier}</p>
                </div>
                <div className="rounded-xl border border-[#dde0e4] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">Kho nhận</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{detail.warehouseName}</p>
                </div>
                <div className="rounded-xl border border-[#dde0e4] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">Số dòng thuốc</p>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">{detail.totalItems}</p>
                </div>
                <div className="rounded-xl border border-[#dde0e4] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">Tổng giá trị</p>
                    <p className="text-sm font-bold text-[#3C81C6]">{(totalValue ?? 0).toLocaleString("vi-VN")}d</p>
                </div>
            </div>

            {detail.note && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-blue-600">info</span>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Ghi chú</p>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-300">{detail.note}</p>
                </div>
            )}

            {detail.status === "CANCELLED" && detail.cancelReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-red-600">error</span>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Lý do hủy</p>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-300">{detail.cancelReason}</p>
                </div>
            )}

            <div className="rounded-xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                <div className="border-b border-[#dde0e4] p-4 dark:border-[#2d353e]">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-[#121417] dark:text-white">
                        <span className="material-symbols-outlined text-[#3C81C6]">medication</span>
                        Danh sách thuốc nhập ({items.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-[#dde0e4] bg-gray-50/50 dark:border-[#2d353e] dark:bg-gray-800/50">
                            <tr>
                                <th className="px-5 py-3 text-xs font-semibold uppercase text-[#687582]">#</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase text-[#687582]">Tên thuốc</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-[#687582]">Số lượng</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase text-[#687582]">Đơn vị</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-[#687582]">Đơn giá</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-[#687582]">Thành tiền</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase text-[#687582]">Số lô</th>
                                <th className="px-5 py-3 text-xs font-semibold uppercase text-[#687582]">HSD</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-[#687582] dark:text-gray-400">
                                        Chưa có dòng thuốc nào trong phiếu
                                    </td>
                                </tr>
                            ) : items.map((item, index) => (
                                <tr key={item.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-5 py-3 text-sm text-[#687582]">{index + 1}</td>
                                    <td className="px-5 py-3 text-sm font-medium text-[#121417] dark:text-white">{item.drugName}</td>
                                    <td className="px-5 py-3 text-right text-sm font-bold text-[#121417] dark:text-white">{(item.quantity ?? 0).toLocaleString("vi-VN")}</td>
                                    <td className="px-5 py-3 text-sm text-[#687582]">{item.unit}</td>
                                    <td className="px-5 py-3 text-right text-sm text-[#121417] dark:text-white">{(item.unitPrice ?? 0).toLocaleString("vi-VN")}d</td>
                                    <td className="px-5 py-3 text-right text-sm font-bold text-[#3C81C6]">{(item.quantity * item.unitPrice).toLocaleString("vi-VN")}d</td>
                                    <td className="px-5 py-3 text-sm text-[#687582]">{item.lotNumber || "-"}</td>
                                    <td className="px-5 py-3 text-sm text-[#687582]">{item.expiryDate || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {detail.status === "RECEIVED" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">
                            <span className="font-bold">Đã nhập kho</span>
                            {detail.receivedBy !== "-" ? ` bởi ${detail.receivedBy}` : ""}
                            {detail.receivedAt ? ` lúc ${detail.receivedAt}` : ""}
                        </p>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCancelModal(false)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1e242b]" onClick={(event) => event.stopPropagation()}>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                <span className="material-symbols-outlined text-red-600">warning</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">Hủy phiếu nhập</h3>
                                <p className="text-sm text-[#687582]">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="mb-1.5 block text-sm font-medium text-[#121417] dark:text-gray-300">Lý do hủy *</label>
                            <textarea
                                value={cancelReason}
                                onChange={(event) => setCancelReason(event.target.value)}
                                rows={3}
                                placeholder="Nhập lý do hủy phiếu nhập..."
                                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason("");
                                }}
                                className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-[#687582] transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={!cancelReason.trim() || !!actionLoading}
                                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading === "cancel" ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <span className="material-symbols-outlined text-[18px]">delete</span>}
                                Xác nhận hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
