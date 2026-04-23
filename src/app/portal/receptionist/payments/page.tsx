"use client";

/**
 * QR / Online Payments — Phase J.5 #4.
 * Spec: dòng 11980-12041.
 */

import { useState, useCallback } from "react";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import { billingService } from "@/services/billingService";
import axiosClient from "@/api/axiosClient";

export default function ReceptionistPaymentsPage() {
    const [invoiceId, setInvoiceId] = useState("");
    const [amount, setAmount] = useState("");
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const onCreate = async () => {
        if (!invoiceId.trim()) return;
        setBusy(true); setQrUrl(null); setOrderId(null); setStatus(null);
        try {
            const r = await billingService.createQR({ invoiceId: invoiceId.trim(), amount: amount ? Number(amount) : undefined });
            const d: any = r?.data?.data ?? r?.data ?? {};
            setQrUrl(d.qr_url ?? d.qrCode ?? d.url);
            setOrderId(d.order_id ?? d.orderId);
            setStatus(d.status ?? "PENDING");
        } catch (e: any) { alert(e?.message ?? "Tạo QR thất bại"); }
        finally { setBusy(false); }
    };

    const checkStatus = useCallback(async () => {
        if (!orderId) return;
        try {
            const r = await billingService.getQRStatus(orderId);
            setStatus((r?.data?.data ?? r?.data)?.status ?? "UNKNOWN");
        } catch {}
    }, [orderId]);

    const onCancel = async () => {
        if (!orderId) return;
        try {
            await axiosClient.post(`/api/billing/payments/orders/${orderId}/cancel`);
            setStatus("CANCELLED");
        } catch (e: any) { alert(e?.message ?? "Huỷ thất bại"); }
    };

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <PageHeader
                title="Thanh toán QR / Online"
                subtitle="Tạo QR code thanh toán cho hoá đơn và theo dõi trạng thái."
                icon="qr_code"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Hoá đơn", href: "/portal/receptionist/billing" },
                    { label: "QR / Online" },
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-5">
                    <h3 className="text-sm font-bold mb-3">Tạo QR thanh toán</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-[#687582] mb-1">Mã hoá đơn</label>
                            <input value={invoiceId} onChange={e => setInvoiceId(e.target.value)} placeholder="Nhập invoice ID hoặc code" className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                        </div>
                        <div>
                            <label className="block text-xs text-[#687582] mb-1">Số tiền (tuỳ chọn)</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                        </div>
                        <button onClick={onCreate} disabled={busy || !invoiceId.trim()} className="w-full px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white disabled:opacity-50">
                            {busy ? "Đang tạo…" : "Tạo QR"}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-5">
                    <h3 className="text-sm font-bold mb-3">QR & trạng thái</h3>
                    {!qrUrl ? <EmptyState icon="qr_code_2" title="Chưa có QR" description="Tạo QR mới để hiển thị." compact />
                    : (
                        <div className="text-center space-y-3">
                            <img src={qrUrl} alt="Payment QR" className="mx-auto max-w-xs rounded-lg border" />
                            <p className="text-xs text-[#687582] font-mono">Order: {orderId}</p>
                            <p className="text-sm">
                                Trạng thái: <span className={status === "PAID" ? "text-emerald-600 font-bold" : status === "CANCELLED" ? "text-rose-600 font-bold" : "text-amber-600 font-bold"}>{status}</span>
                            </p>
                            <div className="flex gap-2 justify-center">
                                <button onClick={checkStatus} className="px-3 py-1.5 text-xs rounded bg-blue-50 text-blue-700">Kiểm tra trạng thái</button>
                                <button onClick={onCancel} className="px-3 py-1.5 text-xs rounded bg-rose-50 text-rose-700">Huỷ order</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
