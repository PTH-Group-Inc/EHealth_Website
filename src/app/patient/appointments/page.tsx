"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AppointmentStatusBadge } from "@/components/patient/AppointmentStatusBadge";
import { AppointmentRescheduleModal } from "@/components/patient/AppointmentRescheduleModal";
import { useAuth } from "@/contexts/AuthContext";
import {
    appointmentConfirmationService,
    cancelAppointment,
    getMyAppointments,
    regenerateAppointmentQr,
    type Appointment,
} from "@/services/appointmentService";
import { PreBookingPaymentModal } from "@/components/shared/PreBookingPaymentModal";
import { patientProfileService, type PatientProfileBE } from "@/services/patientProfileService";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { AIAppointmentSuggester } from "@/components/portal/ai";
import { useToast } from "@/contexts/ToastContext";

const TABS = [
    { id: "upcoming", label: "Sắp tới", icon: "event_upcoming" },
    { id: "completed", label: "Đã khám", icon: "task_alt" },
    { id: "cancelled", label: "Đã hủy", icon: "event_busy" },
];

type RescheduleModalState = {
    id: string;
    doctorId?: string;
    doctorName: string;
    branchId?: string;
    facilityId?: string;
    currentDate?: string;
    currentSlotId?: string;
};

export default function AppointmentsPage() {
    usePageAIContext({ pageKey: "appointments" });
    const { user } = useAuth();
    const { showToast } = useToast();
    const tp = useTranslations("pages.portal.patient.appointments");

    const [activeTab, setActiveTab] = useState("upcoming");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<PatientProfileBE[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState("");
    const [cancelModal, setCancelModal] = useState<{ id: string } | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelling, setCancelling] = useState(false);
    const [rescheduleModal, setRescheduleModal] = useState<RescheduleModalState | null>(null);
    const [resendingId, setResendingId] = useState<string | null>(null);
    const [profilesLoaded, setProfilesLoaded] = useState(false);
    const [payingData, setPayingData] = useState<{ appointmentId: string; invoiceId?: string; qrData: string; amount: number } | null>(null);
    const [loadingPay, setLoadingPay] = useState<string | null>(null);

    const handleContinuePayment = async (id: string) => {
        setLoadingPay(id);
        try {
            const res = await regenerateAppointmentQr(id);
            setPayingData({
                appointmentId: res.appointment_id ?? id,
                invoiceId: res.invoice_id,
                qrData: res.qrTemplateData ?? res.qr_url ?? "",
                amount: Number(res.amount ?? 0),
            });
        } catch (e: any) {
            showToast(e?.response?.data?.message ?? e?.message ?? "Không tạo lại được QR", "error");
        } finally {
            setLoadingPay(null);
        }
    };

    useEffect(() => {
        if (!user?.id) return;

        const loadProfiles = async () => {
            try {
                const response = await patientProfileService.getMyProfiles();
                if (response && response.length > 0) {
                    setProfiles(response);
                    const cachedId = sessionStorage.getItem("patientPortal_selectedProfileId");
                    const exists = response.some((profile) => profile.id === cachedId);
                    setSelectedProfileId(exists ? cachedId! : response[0].id);
                }
            } catch {
                // Vẫn cho phép tải lịch hẹn theo account nếu tải hồ sơ lỗi.
            } finally {
                setProfilesLoaded(true);
            }
        };

        void loadProfiles();
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id || !profilesLoaded) return;
        void loadAppointments();
    }, [activeTab, profilesLoaded, selectedProfileId, user?.id]);

    const loadAppointments = async () => {
        const statusMap: Record<string, string> = {
            upcoming: "PENDING,CONFIRMED",
            completed: "COMPLETED",
            cancelled: "CANCELLED,NO_SHOW",
        };

        try {
            setLoading(true);
            const response = await getMyAppointments({
                ...(selectedProfileId ? { patient_id: selectedProfileId } : {}),
                status: statusMap[activeTab],
                limit: 50,
            });
            
            let data = response.data && response.data.length > 0 ? response.data : [];
            
            // Sort appointments
            if (data.length > 0) {
                data = [...data].sort((a: any, b: any) => {
                    const dateA = new Date(a.appointment_date || a.date);
                    const dateB = new Date(b.appointment_date || b.date);
                    if (dateA.getTime() === dateB.getTime()) {
                        const timeA = a.slot_start_time || a.time || "00:00";
                        const timeB = b.slot_start_time || b.time || "00:00";
                        return activeTab === "upcoming" ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
                    }
                    return activeTab === "upcoming" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
                });
            }
            
            setAppointments(data);
        } catch {
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async (id: string) => {
        setResendingId(id);
        try {
            await appointmentConfirmationService.resendNotification(id);
            showToast("Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư.", "success");
        } catch (error: any) {
            showToast(error?.response?.data?.message || error?.message || "Gửi lại email thất bại", "error");
        } finally {
            setResendingId(null);
        }
    };

    const handleCancel = async () => {
        if (!cancelModal) return;

        setCancelling(true);
        try {
            await cancelAppointment(cancelModal.id, cancelReason);
            setCancelModal(null);
            setCancelReason("");
            showToast("Đã hủy lịch hẹn thành công", "success");
            await loadAppointments();
        } catch {
            showToast("Hủy lịch thất bại. Vui lòng thử lại.", "error");
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417]">{tp("title")}</h1>
                    <p className="mt-0.5 text-sm text-[#687582]">{tp("subtitle")}</p>
                </div>
                <Link
                    href="/booking"
                    className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-[#3C81C6] to-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#3C81C6]/20 transition-all hover:shadow-lg active:scale-[0.97] sm:flex"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                        add
                    </span>
                    Đặt lịch mới
                </Link>
            </div>

            {profiles.length > 0 && (
                <div className="mt-2 flex snap-x gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-2 px-2">
                    {profiles.map((profile) => (
                        <div
                            key={profile.id}
                            onClick={() => {
                                setSelectedProfileId(profile.id);
                                sessionStorage.setItem("patientPortal_selectedProfileId", profile.id);
                            }}
                            className={`min-w-[240px] cursor-pointer snap-start rounded-2xl border p-3 transition-all ${
                                selectedProfileId === profile.id
                                    ? "border-[#3C81C6] bg-blue-50/50 shadow-sm"
                                    : "border-gray-200 bg-white hover:border-blue-300"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] text-sm font-bold text-white shadow-md shadow-[#3C81C6]/20">
                                    {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`truncate text-sm font-bold ${selectedProfileId === profile.id ? "text-[#3C81C6]" : "text-gray-900"}`}>
                                        {profile.full_name}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">{profile.phone_number || "Chưa có SĐT"}</p>
                                </div>
                                {selectedProfileId === profile.id && (
                                    <span className="material-symbols-outlined shrink-0 text-[#3C81C6]" style={{ fontSize: "20px" }}>
                                        check_circle
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AIAppointmentSuggester />

            <div className="scrollbar-hide flex gap-1 overflow-x-auto pb-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? "bg-[#3C81C6] text-white shadow-sm shadow-[#3C81C6]/20"
                                : "border border-[#e5e7eb] bg-white text-[#687582] hover:bg-gray-50"
                        }`}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                            {tab.icon}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 rounded bg-gray-200" />
                                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                                    <div className="h-3 w-1/4 rounded bg-gray-100" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : profiles.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
                    <span className="material-symbols-outlined mb-4 text-gray-300" style={{ fontSize: "64px" }}>
                        person_add
                    </span>
                    <h3 className="mb-1 text-lg font-semibold text-gray-700">Chưa có hồ sơ bệnh nhân</h3>
                    <p className="mb-6 text-sm text-gray-400">Vui lòng thêm hồ sơ bệnh nhân để có thể xem và đặt lịch khám</p>
                    <Link
                        href="/patient/medical-records"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3C81C6] to-[#2563eb] px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                            add
                        </span>
                        Thêm hồ sơ ngay
                    </Link>
                </div>
            ) : appointments.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
                    <span className="material-symbols-outlined mb-4 text-gray-300" style={{ fontSize: "64px" }}>
                        {activeTab === "upcoming" ? "event_upcoming" : activeTab === "completed" ? "task_alt" : "event_busy"}
                    </span>
                    <h3 className="mb-1 text-lg font-semibold text-gray-700">
                        {activeTab === "upcoming"
                            ? "Chưa có lịch hẹn sắp tới"
                            : activeTab === "completed"
                              ? "Chưa có lịch khám hoàn thành"
                              : "Không có lịch hẹn đã hủy"}
                    </h3>
                    <p className="mb-6 text-sm text-gray-400">
                        {activeTab === "upcoming" ? "Đặt lịch khám ngay để bắt đầu chăm sóc sức khỏe" : ""}
                    </p>
                    {activeTab === "upcoming" && (
                        <Link
                            href="/booking"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3C81C6] to-[#2563eb] px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                calendar_month
                            </span>
                            Đặt lịch ngay
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appointment, index) => {
                        const raw = appointment as any;
                        const appointmentId = raw.appointments_id || appointment.id || index;
                        const appointmentDate = raw.appointment_date || appointment.date;
                        const slotStart = raw.slot_start_time?.substring(0, 5) || appointment.time || "--:--";
                        const slotEnd = raw.slot_end_time ? raw.slot_end_time.substring(0, 5) : "";
                        const doctorName = raw.doctor_name || appointment.doctorName || "Chưa xếp bác sĩ";
                        const subtitle = raw.service_name || raw.department_name || appointment.departmentName || "Khám bệnh";
                        const facilityName = raw.facility_name || "Trụ sở Hệ thống EHealth";
                        const branchName = raw.branch_name || "TP. Hồ Chí Minh";
                        const reason = raw.reason_for_visit || appointment.reason || appointment.notes;

                        // Status normalization
                        const rawStatus = (appointment.status || "").toUpperCase();
                        const isUpcoming = rawStatus === "PENDING" || rawStatus === "CONFIRMED";

                        // Calculate days remaining
                        const today = new Date(); // with current time
                        
                        const startOfDay = new Date();
                        startOfDay.setHours(0, 0, 0, 0);
                        
                        const aptDateObj = appointmentDate ? new Date(appointmentDate) : new Date();
                        aptDateObj.setHours(0, 0, 0, 0);
                        
                        const diffTime = aptDateObj.getTime() - startOfDay.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        // Calculate exact minutes if today
                        let minutesRemaining = null;
                        if (diffDays === 0 && slotStart !== "--:--") {
                            const [hours, minutes] = slotStart.split(":").map(Number);
                            const aptTimeObj = new Date(today);
                            aptTimeObj.setHours(hours, minutes, 0, 0);
                            const diffMs = aptTimeObj.getTime() - today.getTime();
                            minutesRemaining = Math.floor(diffMs / (1000 * 60));
                        }

                        const isCancelledOrMissed = rawStatus === "CANCELLED" || rawStatus === "MISSED" || rawStatus === "NO_SHOW";
                        
                        let isVerySoon = false;
                        let isTomorrow = false;
                        let timeAlertText = "";
                        
                        if (isUpcoming && diffDays === 0 && minutesRemaining !== null && minutesRemaining >= 0 && minutesRemaining <= 240) {
                            isVerySoon = true;
                            const h = Math.floor(minutesRemaining / 60);
                            const m = minutesRemaining % 60;
                            timeAlertText = h > 0 ? `Khám trong ${h}g ${m}p nữa!` : `Khám trong ${m} phút nữa!`;
                        } else if (isUpcoming && diffDays === 1) {
                            isTomorrow = true;
                            timeAlertText = "Khám ngày mai";
                        }

                        const formattedDate = aptDateObj.toLocaleDateString("vi-VN", {
                            weekday: "long",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        });

                        // Clean up branch display text
                        const branchSuffix = branchName.split('-').pop()?.trim() || branchName;
                        const displayLocation = facilityName.includes(branchSuffix) ? facilityName : `${facilityName} - ${branchSuffix}`;

                        return (
                            <div
                                key={appointmentId}
                                className={`group relative rounded-2xl border p-5 transition-all hover:shadow-md 
                                    ${isVerySoon ? 'border-amber-200 bg-gradient-to-r from-amber-50/50 to-white shadow-amber-100/50 shadow-lg' 
                                    : isCancelledOrMissed ? 'border-red-200 bg-gradient-to-r from-red-50/50 to-white hover:border-red-300' 
                                    : 'border-gray-100 bg-white hover:border-[#3C81C6]/30'}`}
                            >
                                {(isVerySoon || isTomorrow) && (
                                    <div className={`absolute top-0 right-0 rounded-bl-xl rounded-tr-xl px-3 py-1.5 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 ${isVerySoon ? 'animate-pulse bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{isVerySoon ? 'alarm_on' : 'campaign'}</span>
                                        {timeAlertText}
                                    </div>
                                )}

                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                    <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl 
                                        ${isVerySoon ? 'bg-amber-100/50 shadow-inner' 
                                        : isCancelledOrMissed ? 'bg-red-50 shadow-inner' 
                                        : 'bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10'}`}>
                                        <span className={`text-lg leading-none font-bold 
                                            ${isVerySoon ? 'text-amber-600' 
                                            : isCancelledOrMissed ? 'text-red-500' 
                                            : 'text-[#3C81C6]'}`}>
                                            {appointmentDate?.split("-")[2] || "--"}
                                        </span>
                                        <span className={`text-[10px] font-medium 
                                            ${isVerySoon ? 'text-amber-600/70' 
                                            : isCancelledOrMissed ? 'text-red-500/70' 
                                            : 'text-[#3C81C6]/70'}`}>
                                            T{appointmentDate?.split("-")[1] || "--"}
                                        </span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="flex items-center gap-2 font-semibold text-gray-900 transition-colors group-hover:text-[#3C81C6]">
                                                    {doctorName}
                                                    {rawStatus === "COMPLETED" && (
                                                        <span
                                                            className="material-symbols-outlined text-xs text-green-500"
                                                            title="Đã hoàn thành khám"
                                                        >
                                                            verified
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="mt-0.5 text-sm font-medium text-[#3C81C6]">{subtitle}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 mt-6 sm:mt-0">
                                                <AppointmentStatusBadge status={rawStatus} />
                                            </div>
                                        </div>

                                        {isVerySoon && (
                                            <div className="mt-3 flex items-start gap-2 rounded-lg p-2.5 text-sm font-medium border bg-orange-50/80 text-orange-800 border-orange-100/50">
                                                <span className="material-symbols-outlined shrink-0 text-orange-500" style={{ fontSize: "18px" }}>
                                                    info
                                                </span>
                                                <p>Đã sát giờ khám! Mời bạn di chuyển đến {facilityName || 'phòng khám'} để chuẩn bị khám bệnh.</p>
                                            </div>
                                        )}

                                        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                                            <span className="inline-flex items-center gap-1.5 font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "15px" }}>
                                                    calendar_month
                                                </span>
                                                <span className="capitalize">{formattedDate}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "15px" }}>
                                                    schedule
                                                </span>
                                                {slotStart}
                                                {slotEnd ? ` - ${slotEnd}` : ""}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "14px" }}>
                                                    local_hospital
                                                </span>
                                                <span className="max-w-[250px] truncate font-medium text-gray-700" title={displayLocation}>
                                                    {displayLocation}
                                                </span>
                                            </span>
                                            {raw.room_name && (
                                                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-blue-600">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                                        meeting_room
                                                    </span>
                                                    {raw.room_name}
                                                </span>
                                            )}
                                        </div>

                                        {reason && (
                                            <div className="mt-2.5 rounded-lg bg-gray-50/80 p-2.5 text-xs text-gray-600 line-clamp-2 border border-gray-100">
                                                <span className="mr-1 font-semibold text-gray-700">Lý do khám:</span>
                                                {reason}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-4">
                                    <Link
                                        href={`/patient/appointments/${appointmentId}`}
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                                    >
                                        Xem chi tiết
                                    </Link>
                                    {appointment.status === "pending" && (
                                        <button
                                            onClick={() => handleContinuePayment(String(appointmentId))}
                                            disabled={loadingPay === appointmentId}
                                            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>qr_code_2</span>
                                            {loadingPay === appointmentId ? "Đang tải QR…" : "Thanh toán cọc"}
                                        </button>
                                    )}
                                    {(appointment.status === "pending" || appointment.status === "confirmed") && (
                                        <>
                                            <button
                                                onClick={() => handleResendEmail(String(appointmentId))}
                                                disabled={resendingId === appointmentId}
                                                className="flex items-center gap-1 rounded-lg border border-[#3C81C6]/20 bg-[#3C81C6]/[0.08] px-3 py-1.5 text-xs font-medium text-[#3C81C6] transition-colors hover:bg-[#3C81C6]/[0.15] disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                                    {resendingId === appointmentId ? "hourglass_empty" : "mail"}
                                                </span>
                                                {resendingId === appointmentId ? "Đang gửi..." : "Gửi lại email"}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setRescheduleModal({
                                                        id: String(appointmentId),
                                                        doctorId: raw.doctor_id || appointment.doctorId,
                                                        doctorName,
                                                        branchId: raw.branch_id,
                                                        facilityId: raw.facility_id,
                                                        currentDate: raw.appointment_date || appointment.date,
                                                        currentSlotId: raw.slot_id,
                                                    })
                                                }
                                                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                                            >
                                                Dời lịch
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCancelModal({ id: String(appointmentId) });
                                                    setCancelReason("");
                                                }}
                                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                                            >
                                                Hủy lịch
                                            </button>
                                        </>
                                    )}
                                    {appointment.status === "completed" && (
                                        <button
                                            onClick={() => showToast("Bạn có thể đánh giá ở trang chi tiết lịch hẹn", "info")}
                                            className="rounded-lg border border-[#3C81C6]/20 bg-[#3C81C6]/[0.06] px-3 py-1.5 text-xs font-medium text-[#3C81C6] transition-colors hover:bg-[#3C81C6]/[0.12]"
                                        >
                                            Đánh giá
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {cancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setCancelModal(null)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
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
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCancelModal(null)}
                                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                            >
                                {cancelling ? "Đang xử lý..." : "Xác nhận hủy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {rescheduleModal && (
                <AppointmentRescheduleModal
                    isOpen
                    appointmentId={rescheduleModal.id}
                    doctorId={rescheduleModal.doctorId}
                    doctorName={rescheduleModal.doctorName}
                    branchId={rescheduleModal.branchId}
                    facilityId={rescheduleModal.facilityId}
                    currentDate={rescheduleModal.currentDate}
                    currentSlotId={rescheduleModal.currentSlotId}
                    onClose={() => setRescheduleModal(null)}
                    onSuccess={loadAppointments}
                />
            )}

            {payingData && (
                <PreBookingPaymentModal
                    appointmentId={payingData.appointmentId}
                    invoiceId={payingData.invoiceId}
                    qrData={payingData.qrData}
                    amount={payingData.amount}
                    onPaid={async () => {
                        setPayingData(null);
                        showToast("Thanh toán cọc thành công. Lịch khám đã được xác nhận.", "success");
                        await loadAppointments();
                    }}
                    onClose={() => setPayingData(null)}
                />
            )}
        </div>
    );
}
