"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import QRCode from "react-qr-code";
import { PatientNavbar } from "@/components/patient/PatientNavbar";
import { PatientFooter } from "@/components/patient/PatientFooter";
import { getAppointmentById, generateAppointmentQr, type Appointment } from "@/services/appointmentService";

export default function BookingSuccessPage({ params }: { params: Promise<{ appointmentId: string }> }) {
    const t = useTranslations("pages.public.booking");
    const router = useRouter();
    const resolvedParams = use(params);
    const { appointmentId } = resolvedParams;

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                // 1. Fetch appointment details
                const data = await getAppointmentById(appointmentId);
                setAppointment(data);

                // If appointment is SCHEDULED, COMPLETED, or has PAID status logically
                // Actually the API returns status string (e.g. 'SCHEDULED', 'PENDING_DEPOSIT')
                if (data.status === 'SCHEDULED' || data.status === 'COMPLETED') {
                    // 2. Generate check-in QR code
                    try {
                        const qrData = await generateAppointmentQr(appointmentId);
                        if (qrData?.qr_token) {
                            setQrToken(qrData.qr_token);
                        }
                    } catch (qrErr: any) {
                        console.warn("Could not generate QR code:", qrErr.message);
                    }
                } else if (data.status === 'PENDING_DEPOSIT') {
                     // If it's still pending, maybe webhook hasn't processed yet, or it's an error.
                     // But we only get here from payment page on SUCCESS.
                     // We can just show a message saying it's confirming.
                } else if (data.status === 'CANCELLED') {
                    setError("Lịch hẹn này đã bị hủy.");
                }
            } catch (err: any) {
                console.error("Failed to fetch appointment:", err);
                setError(err.message || "Không thể tải thông tin lịch hẹn");
            } finally {
                setLoading(false);
            }
        };

        if (appointmentId) {
            fetchDetails();
        }
    }, [appointmentId]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <PatientNavbar />

            <main className="flex-grow flex items-center justify-center p-4 py-12">
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin" />
                            <p className="text-gray-500 font-medium animate-pulse">Đang tải thông tin lịch hẹn...</p>
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi tải dữ liệu</h2>
                            <p className="text-gray-600 mb-8">{error}</p>
                            <Link href="/booking" className="inline-flex items-center gap-2 px-6 py-3 bg-[#3C81C6] text-white rounded-xl font-semibold hover:bg-[#2A65A0] transition-colors">
                                <span className="material-symbols-outlined">arrow_back</span>
                                Đặt lịch mới
                            </Link>
                        </div>
                    ) : (
                        <div className="p-8 md:p-12">
                            {/* Success Header */}
                            <div className="text-center mb-10">
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-50"></div>
                                    <span className="material-symbols-outlined text-green-600 text-5xl relative z-10">check_circle</span>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Đặt Lịch Thành Công!</h1>
                                <p className="text-gray-500 text-lg">Cảm ơn bạn đã đặt lịch khám. Dưới đây là thông tin chi tiết lịch hẹn của bạn.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Appointment Details */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-gray-800 border-b pb-3 border-gray-100">Thông tin Lịch hẹn</h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Mã Lịch Hẹn</span>
                                            <span className="text-gray-900 font-mono font-medium">{appointment?.id?.split('-')[0].toUpperCase()}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bệnh Nhân</span>
                                            <span className="text-gray-900 font-medium">{appointment?.patientName}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bác sĩ / Chuyên khoa</span>
                                            <span className="text-gray-900 font-medium">{appointment?.doctorName || appointment?.departmentName || 'Chưa phân bổ'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Thời gian Khám</span>
                                            <span className="text-[#3C81C6] font-bold text-lg">{appointment?.time} - {appointment?.date}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Trạng thái</span>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium w-fit
                                                ${appointment?.status === 'SCHEDULED' ? 'bg-green-100 text-green-800' : 
                                                  appointment?.status === 'PENDING_DEPOSIT' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {appointment?.status === 'SCHEDULED' ? 'Đã xác nhận' : 
                                                 appointment?.status === 'PENDING_DEPOSIT' ? 'Chờ xác nhận thanh toán' : appointment?.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code Section */}
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col items-center justify-center text-center">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Mã QR Check-in</h3>
                                    <p className="text-sm text-gray-500 mb-6">Sử dụng mã QR này để check-in nhanh tại quầy lễ tân khi đến khám.</p>
                                    
                                    {qrToken ? (
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                            <QRCode value={qrToken} size={180} level="M" />
                                        </div>
                                    ) : (
                                        <div className="w-[180px] h-[180px] bg-white border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-4">
                                            <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">qr_code_scanner</span>
                                            <span className="text-xs text-gray-500 text-center">
                                                {appointment?.status === 'PENDING_DEPOSIT' 
                                                    ? 'Mã QR sẽ hiển thị sau khi hệ thống xác nhận thanh toán thành công' 
                                                    : 'Đang tạo mã QR...'}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <p className="text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
                                        <span className="material-symbols-outlined text-xs">info</span>
                                        Lưu ý: Mã QR chỉ có hiệu lực vào ngày khám
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/appointments" className="px-8 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all text-center">
                                    Quản lý Lịch hẹn
                                </Link>
                                <Link href="/" className="px-8 py-3.5 bg-[#3C81C6] text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 hover:bg-[#2A65A0] hover:shadow-lg transition-all text-center flex items-center justify-center gap-2">
                                    Về Trang Chủ
                                    <span className="material-symbols-outlined text-sm">home</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <PatientFooter />
        </div>
    );
}
