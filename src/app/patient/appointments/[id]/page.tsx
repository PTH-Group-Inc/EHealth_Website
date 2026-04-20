"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import { AppointmentRescheduleModal } from "@/components/patient/AppointmentRescheduleModal";
import { AppointmentStatusBadge } from "@/components/patient/AppointmentStatusBadge";
import {
    cancelAppointment,
    getAppointmentById,
    submitAppointmentReview,
    type Appointment,
} from "@/services/appointmentService";
import { encounterService } from "@/services/encounterService";
import { prescriptionService } from "@/services/prescriptionService";
import { useToast } from "@/contexts/ToastContext";

const STATUS_TIMELINE = [
    { status: "pending", label: "Đã đặt lịch", icon: "edit_calendar" },
    { status: "confirmed", label: "Đã xác nhận", icon: "check_circle" },
    { status: "checked_in", label: "Đang chờ khám", icon: "groups" },
    { status: "in_progress", label: "Đang khám", icon: "stethoscope" },
    { status: "completed", label: "Hoàn thành", icon: "task_alt" },
];

export default function AppointmentDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { showToast } = useToast();

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelConfirmKeyword, setCancelConfirmKeyword] = useState("");
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [diagnoses, setDiagnoses] = useState<any[]>([]);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loadingResult, setLoadingResult] = useState(false);

    useEffect(() => {
        if (id) {
            void loadAppointment();
        }
    }, [id]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!appointment || appointment.status?.toLowerCase() !== "completed") return;

            try {
                setLoadingResult(true);
                const encounter = await encounterService.getByAppointment(id);
                const encounterId = encounter?.encounters_id;

                if (!encounterId) {
                    setDiagnoses([]);
                    setPrescriptions([]);
                    return;
                }

                try {
                    const diagnosisResponse = await encounterService.getDiagnoses(encounterId);
                    setDiagnoses(Array.isArray(diagnosisResponse) ? diagnosisResponse : diagnosisResponse ? [diagnosisResponse] : []);
                } catch {
                    setDiagnoses([]);
                }

                try {
                    const prescriptionResponse = await prescriptionService.getByEncounter(encounterId);
                    setPrescriptions(Array.isArray(prescriptionResponse) ? prescriptionResponse : prescriptionResponse ? [prescriptionResponse] : []);
                } catch {
                    setPrescriptions([]);
                }
            } catch {
                setDiagnoses([]);
                setPrescriptions([]);
            } finally {
                setLoadingResult(false);
            }
        };

        void fetchResults();
    }, [appointment, id]);

    const loadAppointment = async () => {
        try {
            setLoading(true);
            const response = await getAppointmentById(id);
            setAppointment(response?.id ? response : null);
        } catch {
            setAppointment(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            setCancelling(true);
            await cancelAppointment(id, cancelReason);
            setShowCancelModal(false);
            setCancelConfirmKeyword("");
            await loadAppointment();
            showToast("Đã hủy lịch hẹn thành công", "success");
        } catch (error: any) {
            showToast(error?.message || "Hủy lịch hẹn thất bại", "error");
        } finally {
            setCancelling(false);
        }
    };

    const handleSubmitReview = async () => {
        if (reviewRating < 1 || reviewRating > 5) {
            showToast("Vui lòng chọn số sao để đánh giá", "warning");
            return;
        }

        try {
            setSubmittingReview(true);
            await submitAppointmentReview(id, reviewRating, reviewText);
            showToast("Cảm ơn bạn đã gửi đánh giá", "success");
            await loadAppointment();
        } catch (error: any) {
            showToast(error?.message || "Gửi đánh giá thất bại", "error");
        } finally {
            setSubmittingReview(false);
        }
    };

    const getTimelineIndex = (status?: string): number => {
        if (!status) return 0;
        const normalizedStatus = status.toLowerCase();
        const index = STATUS_TIMELINE.findIndex((step) => step.status === normalizedStatus);
        return index >= 0 ? index : 0;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="mb-4 h-6 w-1/3 rounded bg-gray-200" />
                    <div className="mb-2 h-4 w-1/2 rounded bg-gray-100" />
                    <div className="h-4 w-2/3 rounded bg-gray-100" />
                </div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
                <span className="material-symbols-outlined mb-4 text-gray-300" style={{ fontSize: "64px" }}>
                    event_busy
                </span>
                <h3 className="mb-2 text-lg font-semibold text-gray-700">Không tìm thấy lịch hẹn</h3>
                <Link href="/patient/appointments" className="text-sm font-medium text-[#3C81C6] hover:underline">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    const raw = appointment as any;
    const normalizedStatus = appointment.status?.toLowerCase() || "";
    const currentStep = getTimelineIndex(appointment.status);
    const isCancellable = normalizedStatus === "pending" || normalizedStatus === "confirmed";
    const isCompleted = normalizedStatus === "completed";
    const isCancelledOrMissed = normalizedStatus === "cancelled" || normalizedStatus === "missed" || normalizedStatus === "no_show";
    const appointmentId = raw.appointments_id || appointment.id;
    const appointmentDate = raw.appointment_date || appointment.date || "--";
    const slotStart = raw.slot_start_time?.slice(0, 5) || appointment.time || "--:--";
    const slotEnd = raw.slot_end_time?.slice(0, 5);
    const doctorName = raw.doctor_name || appointment.doctorName || "Chưa xếp bác sĩ";
    const departmentName = raw.department_name || raw.service_name || appointment.departmentName || "Khám bệnh";
    const branchName = raw.branch_name || "EHealth Hospital";
    const roomName = raw.room_name || "Chua phan phong";
    const serviceName = raw.service_name || departmentName;
    const reasonForVisit = raw.reason_for_visit || appointment.reason;
    const symptomsNotes = raw.symptoms_notes || appointment.notes;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/patient/appointments"
                        className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                            arrow_back
                        </span>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Chi tiết lịch hẹn</h1>
                    </div>
                </div>
                <AppointmentStatusBadge status={appointment.status} size="md" />
            </div>

            {!isCancelledOrMissed && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6">
                    <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-900">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>
                            timeline
                        </span>
                        Trạng thái lịch hẹn
                    </h3>
                    <div className="relative flex items-center justify-between">
                        <div className="absolute left-0 right-0 top-4 mx-8 h-0.5 bg-gray-200">
                            <div
                                className="h-full bg-gradient-to-r from-[#3C81C6] to-[#2563eb] transition-all duration-700"
                                style={{ width: `${(currentStep / (STATUS_TIMELINE.length - 1)) * 100}%` }}
                            />
                        </div>
                        {STATUS_TIMELINE.map((step, index) => {
                            const isPast = index <= currentStep;
                            const isCurrent = index === currentStep;

                            return (
                                <div key={step.status} className="relative z-10 flex flex-1 flex-col items-center">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                                            isPast
                                                ? "bg-gradient-to-br from-[#3C81C6] to-[#2563eb] text-white shadow-md"
                                                : "bg-gray-100 text-gray-400"
                                        } ${isCurrent ? "scale-110 ring-4 ring-[#3C81C6]/20" : ""}`}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                            {isPast && !isCurrent ? "check" : step.icon}
                                        </span>
                                    </div>
                                    <span
                                        className={`mt-2 max-w-[70px] text-center text-[10px] font-medium ${
                                            isCurrent
                                                ? "font-semibold text-[#3C81C6]"
                                                : isPast
                                                  ? "text-gray-700"
                                                  : "text-gray-400"
                                        }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {isCancelledOrMissed && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
                    <span className="material-symbols-outlined mt-0.5 text-red-500" style={{ fontSize: "20px" }}>
                        {normalizedStatus === "no_show" ? "event_busy" : "cancel"}
                    </span>
                    <div>
                        <h3 className="text-sm font-bold text-red-800">
                            {normalizedStatus === "no_show" ? "Bệnh nhân không đến khám" : "Lịch hẹn đã bị hủy"}
                        </h3>
                        <p className="mt-0.5 text-xs text-red-600">
                            {normalizedStatus === "no_show" 
                                ? "Quá giờ hẹn nhưng hệ thống không ghi nhận thông tin check-in của bệnh nhân." 
                                : `Lý do: ${raw.cancellation_reason || appointment.notes || "Không có"}`}
                        </p>
                    </div>
                </div>
            )}

            {normalizedStatus === "confirmed" && raw.qr_token && (
                <div className="flex items-start justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined mt-0.5 text-blue-500" style={{ fontSize: "20px" }}>
                            qr_code_scanner
                        </span>
                        <div>
                            <h3 className="text-sm font-bold text-blue-800">Sẵn sàng check-in</h3>
                            <p className="mt-1 text-xs text-blue-500">
                                Vui lòng quét mã tại quầy lễ tân khi đến phòng khám.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowQRModal(true)}
                        className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                    >
                        Xem mã QR
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-5 shadow-sm transition-shadow hover:shadow-md">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 text-sm font-bold text-gray-900">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>
                            person
                        </span>
                        Thông tin Bác sĩ
                    </h3>
                    <div className="space-y-4">
                        <InfoRow icon="person" label="Bác sĩ" value={doctorName} />
                        <InfoRow icon="medical_services" label="Chuyên khoa" value={departmentName} />
                    </div>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/30 p-5 shadow-sm transition-shadow hover:shadow-md">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 text-sm font-bold text-gray-900">
                        <span className="material-symbols-outlined text-purple-600" style={{ fontSize: "18px" }}>
                            calendar_month
                        </span>
                        Thời gian và loại khám
                    </h3>
                    <div className="space-y-4">
                        <InfoRow icon="event" label="Ngày khám" value={appointmentDate} />
                        <InfoRow icon="schedule" label="Giờ khám" value={slotEnd ? `${slotStart} - ${slotEnd}` : slotStart} />
                        <InfoRow
                            icon="category"
                            label="Loại khám"
                            value={
                                appointment.type === "first_visit"
                                    ? "Khám lần đầu"
                                    : appointment.type === "re_examination"
                                      ? "Tái khám"
                                      : "Tư vấn"
                            }
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50/30 p-5 shadow-sm transition-shadow hover:shadow-md md:col-span-2">
                    <h3 className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3 text-sm font-bold text-gray-900">
                        <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "18px" }}>
                            verified_user
                        </span>
                        Dịch vụ khám và phòng
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <InfoRow icon="location_on" label="Cơ sở" value={branchName} />
                        <InfoRow icon="meeting_room" label="Phòng" value={roomName} />
                        <InfoRow icon="vaccines" label="Dịch vụ khám" value={serviceName} />
                        <InfoRow icon="payments" label="Chi phí dự kiến" value="Theo biểu giá niêm yết" />
                    </div>
                </div>
            </div>

            {(reasonForVisit || symptomsNotes) && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <h3 className="mb-3 flex items-center gap-2 border-b border-gray-50 pb-3 text-sm font-bold text-gray-900">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>
                            description
                        </span>
                        Triệu chứng và ghi chú
                    </h3>
                    <div className="space-y-4">
                        {reasonForVisit && (
                            <div>
                                <p className="mb-1 text-xs font-medium text-gray-500">Lý do khám:</p>
                                <p className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                                    {reasonForVisit}
                                </p>
                            </div>
                        )}
                        {symptomsNotes && (
                            <div>
                                <p className="mb-1 text-xs font-medium text-gray-500">Ghi chú triệu chứng:</p>
                                <p className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm italic text-gray-700">
                                    {symptomsNotes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isCompleted && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>
                            labs
                        </span>
                        Kết quả khám
                    </h3>
                    <div className="space-y-3">
                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="mb-1 text-xs text-gray-400">Chẩn đoán</p>
                            {loadingResult ? (
                                <p className="text-sm font-medium text-gray-500">Đang tải chẩn đoán...</p>
                            ) : diagnoses.length > 0 ? (
                                <ul className="list-disc space-y-1 pl-4 text-sm font-medium text-gray-800">
                                    {diagnoses.map((diagnosis, index) => (
                                        <li key={index}>
                                            {diagnosis.icd_code ? <span className="font-semibold">{diagnosis.icd_code} - </span> : null}
                                            {diagnosis.diagnosis_name || diagnosis.notes || "Không rõ"}
                                            {diagnosis.diagnosis_type === "PRIMARY" ? " (Chính)" : ""}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm font-medium text-gray-800">Chưa có kết quả chẩn đoán</p>
                            )}
                        </div>
                        <div className="rounded-xl bg-gray-50 p-3">
                            <p className="mb-1 text-xs text-gray-400">Đơn thuốc</p>
                            {loadingResult ? (
                                <p className="text-sm font-medium text-gray-500">Đang tải đơn thuốc...</p>
                            ) : prescriptions.length > 0 ? (
                                <ul className="list-disc space-y-1 pl-4 text-sm font-semibold text-[#3C81C6]">
                                    {prescriptions.map((prescription, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <span>Mã đơn: {prescription.prescription_code || prescription.id || prescription.prescriptions_id}</span>
                                            <span
                                                className={`rounded px-2 py-0.5 text-[10px] ${
                                                    prescription.status === "DISPENSED"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {prescription.status === "DISPENSED" ? "Đã phát" : "Chưa phát"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-600">Chưa có đơn thuốc</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isCompleted && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>
                            rate_review
                        </span>
                        Đánh giá trải nghiệm
                    </h3>
                    {raw.rating ? (
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <div className="mb-2 flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <span
                                        key={index}
                                        className={`material-symbols-outlined ${index < raw.rating ? "text-amber-400" : "text-gray-200"}`}
                                        style={{ fontSize: "24px" }}
                                    >
                                        star
                                    </span>
                                ))}
                                <span className="ml-2 text-sm font-semibold text-gray-700">Đã đánh giá</span>
                            </div>
                            {raw.feedback && <p className="text-sm italic text-gray-600">&quot;{raw.feedback}&quot;</p>}
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setReviewRating(index + 1)}
                                        className="transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <span
                                            className={`material-symbols-outlined ${index < reviewRating ? "text-amber-400" : "text-gray-200"}`}
                                            style={{ fontSize: "32px" }}
                                        >
                                            star
                                        </span>
                                    </button>
                                ))}
                                {reviewRating > 0 && <span className="ml-2 text-sm text-gray-500">{reviewRating}/5</span>}
                            </div>
                            <textarea
                                value={reviewText}
                                onChange={(event) => setReviewText(event.target.value)}
                                placeholder="Chia sẻ trải nghiệm khám bệnh của bạn..."
                                className="mb-3 min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30"
                            />
                            <button
                                onClick={handleSubmitReview}
                                disabled={submittingReview || reviewRating === 0}
                                className="rounded-xl bg-gradient-to-r from-[#3C81C6] to-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="flex items-center gap-3">
                {isCancellable && (
                    <>
                        <button
                            type="button"
                            onClick={() => setShowRescheduleModal(true)}
                            className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                event_repeat
                            </span>
                            Dời lịch
                        </button>
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                event_busy
                            </span>
                            Hủy lịch
                        </button>
                    </>
                )}
            </div>

            {showCancelModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                    onClick={() => setShowCancelModal(false)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                <span className="material-symbols-outlined text-red-600" style={{ fontSize: "22px" }}>
                                    warning
                                </span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Xác nhận hủy lịch</h3>
                                <p className="text-xs text-gray-500">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>

                        <textarea
                            value={cancelReason}
                            onChange={(event) => setCancelReason(event.target.value)}
                            placeholder="Lý do hủy lịch (không bắt buộc)..."
                            className="mb-4 min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                        />

                        <div className="mb-4">
                            <p className="mb-2 text-xs font-semibold text-gray-700">
                                Vui lòng nhập <span className="font-bold text-red-600">HỦY LỊCH</span> để xác nhận:
                            </p>
                            <input
                                type="text"
                                value={cancelConfirmKeyword}
                                onChange={(event) => setCancelConfirmKeyword(event.target.value)}
                                placeholder="Nhập HỦY LỊCH"
                                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelConfirmKeyword("");
                                }}
                                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling || cancelConfirmKeyword !== "HỦY LỊCH"}
                                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {cancelling ? "Đang xử lý..." : "Xác nhận hủy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AppointmentRescheduleModal
                isOpen={showRescheduleModal}
                appointmentId={String(appointmentId)}
                doctorId={raw.doctor_id || appointment.doctorId}
                doctorName={raw.doctor_name || appointment.doctorName}
                branchId={raw.branch_id}
                facilityId={raw.facility_id}
                currentDate={raw.appointment_date || appointment.date}
                currentSlotId={raw.slot_id}
                onClose={() => setShowRescheduleModal(false)}
                onSuccess={async () => {
                    setShowRescheduleModal(false);
                    await loadAppointment();
                }}
            />

            {showQRModal && raw.qr_token && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                    onClick={() => setShowQRModal(false)}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Mã QR Check-in</h3>
                            <button onClick={() => setShowQRModal(false)} className="text-gray-400 transition-colors hover:text-gray-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="mb-4 inline-block rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4">
                            <QRCode
                                value={raw.qr_token}
                                size={192}
                                className="mx-auto"
                                style={{ height: "auto", maxWidth: "100%", width: "192px" }}
                            />
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                            Đưa mã này cho lễ tân tại phòng khám để tiến hành check-in tự động.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 text-gray-400" style={{ fontSize: "16px" }}>
                {icon}
            </span>
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
        </div>
    );
}
