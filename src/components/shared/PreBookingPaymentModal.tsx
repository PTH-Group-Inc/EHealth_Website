"use client";

/**
 * Pre-Booking Payment Modal — Hiển thị QR SePay + polling status.
 *
 * Dùng cho luồng:
 * - Booking mới (Pre-Book API) → nhận QR → polling đến khi PAID.
 * - Tiếp tục thanh toán (Regenerate QR) → load lại QR → polling tiếp.
 *
 * Props:
 * - appointmentId: id lịch đang chờ thanh toán (bắt buộc để polling).
 * - qrData: chuỗi QR (URL ảnh SePay hoặc data-URL base64).
 * - amount: số tiền cọc cần thanh toán.
 * - invoiceId (tuỳ chọn): hiển thị cho user đối chiếu.
 * - initialTimeLeft: thời gian còn lại (giây) tính từ backend.
 * - onPaid: callback khi BE trả `isPaid=true`.
 * - onClose: đóng modal (có thể huỷ thanh toán).
 * - pollIntervalMs: mặc định 5000ms.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getAppointmentPaymentStatus } from "@/services/appointmentService";

export interface PreBookingPaymentModalProps {
    appointmentId: string;
    qrData: string;
    amount: number;
    invoiceId?: string;
    initialTimeLeft?: number;
    onPaid: (status: { appointment_status?: string; invoice_status?: string }) => void;
    onClose: () => void;
    pollIntervalMs?: number;
    title?: string;
}

const fmtMoney = (v: number) => `${v.toLocaleString("vi-VN")} ₫`;

/** Khoảng poll tối đa khi backoff (30 giây) */
const MAX_BACKOFF_MS = 30_000;

function QrImage({ src }: { src: string }) {
    // Hỗ trợ 3 format: URL http(s), data-URL, chuỗi base64 thuần.
    if (!src) return null;
    const finalSrc = src.startsWith("http") || src.startsWith("data:")
        ? src
        : `data:image/png;base64,${src}`;
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={finalSrc} alt="QR thanh toán" className="w-full max-w-[260px] mx-auto rounded-lg border border-[#e5e7eb]" />
    );
}

export function PreBookingPaymentModal({
    appointmentId,
    qrData,
    amount,
    invoiceId,
    initialTimeLeft = 15 * 60,
    onPaid,
    onClose,
    pollIntervalMs = 5000,
    title = "Thanh toán cọc đặt lịch",
}: PreBookingPaymentModalProps) {
    const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
    const [status, setStatus] = useState<"WAITING" | "CHECKING" | "PAID" | "ERROR" | "TIMEOUT">("WAITING");
    const [lastError, setLastError] = useState<string | null>(null);
    const stopped = useRef(false);
    const currentIntervalRef = useRef(pollIntervalMs);
    const consecutiveErrorsRef = useRef(0);

    // Stable callback ref cho onPaid
    const onPaidRef = useRef(onPaid);
    onPaidRef.current = onPaid;

    // Countdown timer (mỗi giây)
    useEffect(() => {
        const iv = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(iv);
                    setStatus("TIMEOUT");
                    stopped.current = true;
                    
                    // Automatically cancel the appointment if unpaid
                    if (appointmentId) {
                        import("@/services/appointmentService").then(({ cancelAppointment }) => {
                            cancelAppointment(appointmentId, "Quá thời hạn thanh toán cọc").then(() => {
                                // Auto-close modal after a short delay
                                setTimeout(() => {
                                    onClose();
                                    // Optional: You could trigger a window reload or a specific callback to refresh appointments
                                    window.location.reload(); 
                                }, 3000);
                            }).catch(err => {
                                console.error("Failed to auto-cancel appointment on expire:", err);
                            });
                        });
                    }

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId]);

    // Polling status với exponential backoff
    useEffect(() => {
        if (!appointmentId) return;
        
        stopped.current = false;
        currentIntervalRef.current = pollIntervalMs;
        consecutiveErrorsRef.current = 0;

        let timeoutId: ReturnType<typeof setTimeout>;

        const poll = async () => {
            if (stopped.current) return;
            setStatus("CHECKING");
            try {
                const res = await getAppointmentPaymentStatus(appointmentId);
                if (stopped.current) return;
                if (res.isPaid) {
                    setStatus("PAID");
                    stopped.current = true;
                    onPaidRef.current({
                        appointment_status: res.appointment_status,
                        invoice_status: res.invoice_status,
                    });
                    return;
                }
                setStatus("WAITING");
                setLastError(null);
                // Reset backoff khi thành công nhưng tăng dần interval để tránh spam
                consecutiveErrorsRef.current = 0;
                // Nếu chưa thanh toán, tiếp tục poll với interval tăng dần
                currentIntervalRef.current = Math.min(currentIntervalRef.current + 2000, 15000);
            } catch (e: any) {
                if (stopped.current) return;
                consecutiveErrorsRef.current += 1;

                // Exponential backoff: nhân đôi interval, tối đa MAX_BACKOFF_MS
                currentIntervalRef.current = Math.min(
                    pollIntervalMs * Math.pow(2, consecutiveErrorsRef.current),
                    MAX_BACKOFF_MS
                );

                const errMsg = e?.response?.status === 429
                    ? "Đang gửi quá nhiều yêu cầu, tự động giảm tốc..."
                    : (e?.message ?? "Kiểm tra trạng thái thất bại");
                setLastError(errMsg);
                setStatus("WAITING");
            }

            // Schedule lần poll tiếp theo với interval hiện tại
            if (!stopped.current) {
                timeoutId = setTimeout(poll, currentIntervalRef.current);
            }
        };

        // Poll lần đầu ngay lập tức
        timeoutId = setTimeout(poll, 500);

        return () => {
            stopped.current = true;
            clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId, pollIntervalMs]);

    const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const ss = String(timeLeft % 60).padStart(2, "0");

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">qr_code_2</span>
                            {title}
                        </h3>
                        {invoiceId && <p className="text-xs text-[#687582] font-mono mt-0.5">HĐ: #{invoiceId.slice(0, 8)}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Đóng"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 text-center space-y-3">
                    {status === "PAID" ? (
                        <div className="py-6 space-y-2">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600">
                                <span className="material-symbols-outlined text-[40px]">check_circle</span>
                            </div>
                            <p className="text-lg font-bold text-emerald-600">Thanh toán thành công</p>
                            <p className="text-xs text-[#687582]">Lịch khám đã được xác nhận.</p>
                        </div>
                    ) : status === "TIMEOUT" ? (
                        <div className="py-6 space-y-3">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600">
                                <span className="material-symbols-outlined text-[40px]">schedule</span>
                            </div>
                            <p className="text-lg font-bold text-amber-600">Giao dịch đã hết hạn</p>
                            <p className="text-xs text-[#687582]">
                                Mã QR này không còn hiệu lực để thanh toán do quá hạn thời gian giữ chỗ.
                            </p>
                        </div>
                    ) : (
                        <>
                            <QrImage src={qrData} />
                            <div className="mt-3 space-y-1">
                                <p className="text-xs text-[#687582]">Số tiền cần chuyển</p>
                                <p className="text-2xl font-black text-[#3C81C6]">{fmtMoney(amount)}</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300 text-left">
                                <p className="font-semibold mb-1">Hướng dẫn nhanh</p>
                                <ol className="list-decimal pl-4 space-y-0.5">
                                    <li>Mở app ngân hàng / ví điện tử, chọn Quét QR.</li>
                                    <li>Quét mã QR ở trên — số tiền &amp; nội dung đã auto-fill.</li>
                                    <li>Xác nhận chuyển tiền. Hệ thống sẽ tự động cập nhật.</li>
                                </ol>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs text-[#687582]">
                                <span className={`w-2 h-2 rounded-full ${status === "CHECKING" ? "bg-blue-500 animate-pulse" : "bg-amber-500"}`} />
                                {status === "CHECKING" ? "Đang kiểm tra…" : "Chờ chuyển khoản"}
                                <span className="ml-2 font-mono font-bold">{mm}:{ss}</span>
                            </div>
                            {lastError && <p className="text-xs text-rose-500">{lastError}</p>}
                        </>
                    )}
                </div>

                <div className="p-5 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end gap-2">
                    {status === "PAID" ? (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            Xong
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                Đóng
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PreBookingPaymentModal;

