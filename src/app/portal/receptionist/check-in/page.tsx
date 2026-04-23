"use client";

/**
 * Check-in tại quầy — Phase J.3 #6.
 * Spec: dòng 11088-11136.
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/layout";
import { appointmentStatusService } from "@/services/appointmentStatusService";

export default function ReceptionistCheckInPage() {
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const onCheckInQR = async () => {
        if (!code.trim()) return;
        setBusy(true); setError(null); setResult(null);
        try {
            const r = await appointmentStatusService.checkInByQR(code.trim());
            setResult(r);
            setCode("");
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? "Check-in thất bại. Mã không hợp lệ.");
        } finally { setBusy(false); }
    };

    const onCheckInId = async () => {
        if (!code.trim()) return;
        setBusy(true); setError(null); setResult(null);
        try {
            const r = await appointmentStatusService.checkIn(code.trim());
            setResult(r);
            setCode("");
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? "Check-in thất bại.");
        } finally { setBusy(false); }
    };

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto">
            <PageHeader
                title="Check-in tại quầy"
                subtitle="Quét mã QR hoặc nhập mã lịch để check-in nhanh."
                icon="qr_code_scanner"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Check-in" },
                ]}
            />

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-2xl p-8 mb-4">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white mb-4">
                        <span className="material-symbols-outlined text-[40px]">qr_code_scanner</span>
                    </div>
                    <h2 className="text-xl font-bold">Nhập mã / quét QR</h2>
                    <p className="text-sm text-[#687582]">Hỗ trợ check-in bằng QR (camera) hoặc nhập mã lịch thủ công.</p>
                </div>

                <div className="flex gap-2 mb-4">
                    <input
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && onCheckInQR()}
                        placeholder="Mã QR hoặc mã lịch hẹn…"
                        className="flex-1 px-4 py-3 text-base rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                        autoFocus
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={onCheckInQR} disabled={busy || !code.trim()} className="px-4 py-3 text-sm font-medium rounded-lg bg-[#3C81C6] text-white hover:bg-[#2a6da8] disabled:opacity-50">
                        Check-in QR
                    </button>
                    <button onClick={onCheckInId} disabled={busy || !code.trim()} className="px-4 py-3 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                        Check-in theo mã
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 text-sm">
                        <span className="material-symbols-outlined text-[18px] align-middle">error</span> {error}
                    </div>
                )}

                {result && (
                    <div className="mt-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700">
                        <p className="font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined">check_circle</span>
                            Check-in thành công
                        </p>
                        <pre className="text-xs mt-2 overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
                        <div className="mt-3 flex gap-2">
                            <Link href="/portal/receptionist/queue" className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white">
                                Xem queue
                            </Link>
                            <button onClick={() => setResult(null)} className="px-3 py-1.5 text-xs rounded bg-white dark:bg-[#1e242b]">
                                Check-in tiếp
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center text-sm text-[#687582]">
                <p>Hoặc check-in từ <Link href="/portal/receptionist/appointments" className="text-[#3C81C6] hover:underline">danh sách lịch khám</Link>.</p>
            </div>
        </div>
    );
}
