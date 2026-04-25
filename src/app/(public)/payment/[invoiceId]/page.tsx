"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { 
    getAppointmentPaymentStatus, 
    regenerateAppointmentQr, 
    getAppointmentById,
    cancelAppointment,
    type Appointment 
} from "@/services/appointmentService";
import { PatientNavbar } from "@/components/patient/PatientNavbar";
import { PatientFooter } from "@/components/patient/PatientFooter";

const fmtMoney = (v: number) => `${v.toLocaleString("vi-VN")} ₫`;

function QrImage({ src }: { src: string }) {
    if (!src) return null;
    const finalSrc = src.startsWith("http") || src.startsWith("data:")
        ? src
        : `data:image/png;base64,${src}`;
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={finalSrc} alt="QR thanh toán" className="w-full max-w-[260px] mx-auto rounded-lg border border-[#e5e7eb]" />
    );
}

function PaymentPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const invoiceId = params.invoiceId as string;
    const appointmentId = searchParams.get("appointmentId");

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [qrData, setQrData] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [status, setStatus] = useState<"WAITING" | "CHECKING" | "PAID" | "ERROR" | "EXPIRED">("WAITING");
    const [lastError, setLastError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 minutes default
    
    const stopped = useRef(false);

    useEffect(() => {
        if (!appointmentId) {
            setError("Không tìm thấy thông tin lịch hẹn");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const [aptRes, qrRes] = await Promise.all([
                    getAppointmentById(appointmentId),
                    regenerateAppointmentQr(appointmentId)
                ]);

                setAppointment(aptRes);
                if (typeof qrRes.remaining_seconds === "number") {
                    const remainingSeconds = Math.max(0, qrRes.remaining_seconds);
                    setTimeLeft(remainingSeconds);
                    if (remainingSeconds === 0) setStatus("EXPIRED");
                } else if (qrRes.expires_at) {
                    const remainingSeconds = Math.max(0, Math.floor((new Date(qrRes.expires_at).getTime() - Date.now()) / 1000));
                    setTimeLeft(remainingSeconds);
                    if (remainingSeconds === 0) setStatus("EXPIRED");
                }

                setQrData(qrRes.qrTemplateData || qrRes.qr_url || qrRes.qr_code_url || "");
                setAmount(Number(qrRes.amount || 0));
            } catch (err: any) {
                setError(err.message || "Lỗi khi tải thông tin thanh toán");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [appointmentId, invoiceId]);

    // Countdown Timer
    useEffect(() => {
        const iv = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(iv);
                    setStatus("EXPIRED");
                    stopped.current = true;
                    
                    // Auto-cancel on server side to free up slot
                    if (appointmentId) {
                        cancelAppointment(appointmentId, "Quá thời hạn thanh toán cọc").then(() => {
                            // Chuyển sang trang đơn hủy hoặc trang khám bệnh sau khi hết hạn 1 chút
                            setTimeout(() => {
                                router.push("/patient/appointments");
                            }, 3000);
                        }).catch(err => {
                            console.error("Failed to auto-cancel appointment on expire:", err);
                        });
                    }

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(iv);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId, router]);

    // Polling Status with exponential backoff
    useEffect(() => {
        if (!appointmentId || loading) return;
        
        stopped.current = false;
        let timeoutId: NodeJS.Timeout;
        let currentInterval = 5000; // Start with 5 seconds
        let consecutiveErrors = 0;
        const MAX_BACKOFF_MS = 30000; // Max 30 seconds
        
        const poll = async () => {
            if (stopped.current) return;
            setStatus("CHECKING");
            try {
                const res = await getAppointmentPaymentStatus(appointmentId);
                if (stopped.current) return;
                if (res.isPaid) {
                    setStatus("PAID");
                    stopped.current = true;
                    // Auto redirect after 3 seconds
                    setTimeout(() => {
                        router.push(`/booking/success/${appointmentId}`);
                    }, 3000);
                    return;
                }
                setStatus("WAITING");
                setLastError(null);
                consecutiveErrors = 0;
                // If not paid, continue polling but slightly slower over time to avoid rate limits
                // E.g., cap at 10 seconds if it's just waiting normally
                currentInterval = Math.min(currentInterval + 2000, 15000); 
            } catch (e: any) {
                if (stopped.current) return;
                consecutiveErrors += 1;
                // Exponential backoff on errors
                currentInterval = Math.min(
                    5000 * Math.pow(2, consecutiveErrors),
                    MAX_BACKOFF_MS
                );
                const errMsg = e?.response?.status === 429
                    ? "Đang gửi quá nhiều yêu cầu, tự động giảm tốc..."
                    : (e?.message ?? "Kiểm tra trạng thái thất bại");
                setLastError(errMsg);
                setStatus("WAITING");
            }
            
            if (!stopped.current) {
                timeoutId = setTimeout(poll, currentInterval);
            }
        };

        timeoutId = setTimeout(poll, 1000); // Initial poll after 1 second
        
        return () => {
            stopped.current = true;
            clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointmentId, loading, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-[#3C81C6] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-20 text-center">
                <div className="text-rose-500 mb-4"><span className="material-symbols-outlined text-5xl">error</span></div>
                <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => router.push("/")} className="px-6 py-2 bg-[#3C81C6] text-white rounded-lg">Về trang chủ</button>
            </div>
        );
    }

    const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const ss = String(timeLeft % 60).padStart(2, "0");

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Thanh toán cọc đặt lịch</h1>
                        <p className="text-blue-100 mt-1">Mã hóa đơn: #{invoiceId.slice(0, 8)}</p>
                    </div>
                    {status === "PAID" && (
                        <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30 flex items-center gap-2">
                            <span className="material-symbols-outlined">check_circle</span>
                            <span className="font-semibold">Đã thanh toán</span>
                        </div>
                    )}
                    {status === "EXPIRED" && (
                        <div className="bg-red-500/80 px-4 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2">
                            <span className="material-symbols-outlined">timer_off</span>
                            <span className="font-semibold">Đã hết hạn</span>
                        </div>
                    )}
                    {(status === "WAITING" || status === "CHECKING") && (
                        <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30 flex items-center gap-2">
                            <span className="material-symbols-outlined animate-spin-slow">schedule</span>
                            <span className="font-mono font-bold text-xl">{mm}:{ss}</span>
                        </div>
                    )}
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold border-b pb-2">Thông tin lịch hẹn</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Chuyên khoa</p>
                                <p className="font-medium">{appointment?.departmentName || "Chưa xác định"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Bác sĩ</p>
                                <p className="font-medium">{appointment?.doctorName || "Khám bệnh chung"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Bệnh nhân</p>
                                <p className="font-medium">{appointment?.patientName || "Chưa xác định"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Ngày khám</p>
                                    <p className="font-medium">{appointment?.date || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Giờ khám</p>
                                    <p className="font-medium">{appointment?.time || "—"}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-sm text-blue-800 font-medium mb-1">Số tiền thanh toán cọc</p>
                                <p className="text-3xl font-black text-blue-600">{fmtMoney(amount)}</p>
                            </div>
                        </div>
                    </div>

                    {/* QR Code & Payment Info */}
                    <div className="bg-gray-50 p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-100 relative">
                        {status === "PAID" ? (
                            <div className="text-center py-10 space-y-4 animate-fade-in">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 text-emerald-600">
                                    <span className="material-symbols-outlined text-[64px]">task_alt</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-emerald-600 mb-2">Thanh toán thành công!</h3>
                                    <p className="text-gray-600">Đang chuyển hướng đến trang hoàn tất...</p>
                                </div>
                            </div>
                        ) : status === "EXPIRED" ? (
                            <div className="text-center py-10 space-y-4">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 text-red-600">
                                    <span className="material-symbols-outlined text-[64px]">timer_off</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-red-600 mb-2">Giao dịch đã hết hạn</h3>
                                    <p className="text-gray-600 mb-6">Mã QR này không còn hiệu lực để thanh toán.</p>
                                    <button 
                                        onClick={() => router.push("/booking")}
                                        className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                                    >
                                        Đặt lại lịch hẹn
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="font-semibold text-gray-800 mb-4">Mở App ngân hàng quét mã QR</h3>
                                
                                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 mb-6">
                                    <QrImage src={qrData} />
                                </div>

                                <div className="w-full text-sm text-gray-600 space-y-2">
                                    <p className="text-center italic mb-4">Hoặc chuyển khoản thủ công:</p>
                                    
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-500">Số tài khoản</span>
                                        <span className="font-semibold text-gray-800">19039012390123 (Techcombank)</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-500">Chủ tài khoản</span>
                                        <span className="font-semibold text-gray-800">PHONG KHAM EHEALTH</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-500">Nội dung CK</span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-blue-600">EH {invoiceId.slice(-6)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                                    <span className={`w-2.5 h-2.5 rounded-full ${status === "CHECKING" ? "bg-blue-500 animate-pulse" : "bg-amber-500"}`} />
                                    {status === "CHECKING" ? "Hệ thống đang kiểm tra giao dịch..." : "Hệ thống đang chờ chuyển khoản..."}
                                </div>
                                {lastError && <p className="mt-2 text-xs text-rose-500">{lastError}</p>}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PatientNavbar />
            <div className="flex-1">
                <Suspense fallback={
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin h-8 w-8 border-4 border-[#3C81C6] border-t-transparent rounded-full"></div>
                    </div>
                }>
                    <PaymentPageContent />
                </Suspense>
            </div>
            <PatientFooter />
        </div>
    );
}
