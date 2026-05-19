"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader, StatCard } from "@/components/shared/layout";
import { billingRefundService } from "@/services/billingRefundService";
import { fmtMoney, useToast, ToastContainer } from "./refund-helpers";
import RefundTab from "./RefundTab";
import AdjustmentTab from "./AdjustmentTab";

type Tab = "refunds" | "adjustments";

export default function ReceptionistRefundsPage() {
    const [tab, setTab] = useState<Tab>("refunds");
    const [items, setItems] = useState<any[]>([]);
    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toasts, add: addToast } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        const [d, l] = await Promise.allSettled([
            billingRefundService.getDashboard(),
            billingRefundService.getRequests(),
        ]);
        if (d.status === "fulfilled") setDashboard(d.value);
        if (l.status === "fulfilled") {
            const arr = (l.value as any)?.data ?? [];
            setItems(Array.isArray(arr) ? arr : []);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const stats = {
        total: dashboard?.total_refund_count ?? items.length,
        pending: dashboard?.pending_count ?? items.filter((r: any) => (r.status ?? "").toUpperCase() === "PENDING").length,
        completed: items.filter((r: any) => (r.status ?? "").toUpperCase() === "COMPLETED").length,
        pendingAmount: dashboard?.pending_amount ?? 0,
        totalRefunded: dashboard?.total_refunded ?? 0,
    };

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: "refunds", label: "Yêu cầu Hoàn tiền", icon: "undo" },
        { key: "adjustments", label: "Điều chỉnh Giao dịch", icon: "tune" },
    ];

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <ToastContainer toasts={toasts} />

            <PageHeader
                title="Hoàn tiền & Điều chỉnh"
                subtitle="Quản lý yêu cầu hoàn tiền và điều chỉnh giao dịch tài chính."
                icon="undo"
                breadcrumbs={[
                    { label: "Trang chủ", href: "/portal/receptionist" },
                    { label: "Hoá đơn", href: "/portal/receptionist/billing" },
                    { label: "Hoàn tiền" },
                ]}
                actions={
                    <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-sm font-medium text-[#121417] dark:text-white shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">refresh</span>Làm mới
                    </button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Tổng yêu cầu" value={stats.total} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Chờ duyệt" value={stats.pending} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Chờ xử lý (VNĐ)" value={fmtMoney(stats.pendingAmount)} icon="pending_actions" color="red" loading={loading} />
                <StatCard label="Đã hoàn (VNĐ)" value={fmtMoney(stats.totalRefunded)} icon="payments" color="emerald" loading={loading} />
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-1 inline-flex gap-1">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            tab === t.key
                                ? "bg-[#3C81C6] text-white shadow-sm"
                                : "text-[#687582] hover:text-[#121417] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}>
                        <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === "refunds" && (
                <RefundTab items={items} loading={loading} onReload={load} toast={addToast} />
            )}
            {tab === "adjustments" && (
                <AdjustmentTab toast={addToast} />
            )}
        </div>
    );
}
