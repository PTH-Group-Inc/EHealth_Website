"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PatientNavbar } from "@/components/patient/PatientNavbar";
import { PatientFooter } from "@/components/patient/PatientFooter";
import { TimeSlotPicker } from "@/components/patient/TimeSlotPicker";
import { doctorService, type Doctor, type DoctorSchedule, getFullAvatarUrl, formatCurrency } from "@/services/doctorService";
import { getAvailableSlots } from "@/services/appointmentService";
import { getMockDoctorById, MOCK_REVIEWS } from "@/data/patient-mock";

const TABS = [
    { id: "about", label: "Giới thiệu", icon: "person" },
    { id: "schedule", label: "Lịch khám", icon: "calendar_month" },
    { id: "reviews", label: "Đánh giá", icon: "star" },
    { id: "services", label: "Dịch vụ", icon: "medical_services" },
];

export default function DoctorDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("about");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean; remaining: number }[]>([]);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);

    const loadDoctor = useCallback(async () => {
        try {
            setLoading(true);
            const doc = await doctorService.getById(id);
            if (doc && doc.id) {
                setDoctor(doc);
                // Also load schedule and services
                const [sched, srvs] = await Promise.all([
                    doctorService.getSchedule(id),
                    doc.doctorId ? doctorService.getServices(doc.doctorId) : Promise.resolve([])
                ]);
                setSchedules(sched);
                const sortedSrvs = [...srvs].sort((a, b) => {
                    if (a.is_primary === b.is_primary) return 0;
                    return a.is_primary ? -1 : 1;
                });
                setServices(sortedSrvs);
            } else {
                setDoctor(null);
            }
        } catch {
            setDoctor(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) loadDoctor();
    }, [id, loadDoctor]);

    useEffect(() => {
        if (!selectedDate || !doctor) return;
        
        let isMounted = true;
        const fetchSlots = async () => {
            const branchId = doctor.facilities?.[0]?.branch_id || "";
            
            if (!branchId) {
                if (isMounted) setAvailableSlots([]);
                if (isMounted) setIsFetchingSlots(false);
                return;
            }
            try {
                setIsFetchingSlots(true);
                const data = await getAvailableSlots({ date: selectedDate, doctor_id: id, branch_id: branchId });
                if (!isMounted) return;
                
                const mappedSlots = data.map((slot: any) => ({
                    time: slot.start_time.substring(0, 5),
                    available: slot.is_available,
                    remaining: Math.max(0, slot.max_capacity - slot.booked_count),
                }));
                mappedSlots.sort((a: any, b: any) => a.time.localeCompare(b.time));
                setAvailableSlots(mappedSlots);
            } catch (error) {
                console.error("Lỗi lấy slot:", error);
                if (isMounted) setAvailableSlots([]);
            } finally {
                if (isMounted) setIsFetchingSlots(false);
            }
        };
        fetchSlots();
        return () => { isMounted = false; };
    }, [selectedDate, doctor, id]);

    // Compute sidebar info from real data
    const consultationFeeDisplay = doctor?.consultationFee
        ? formatCurrency(doctor.consultationFee)
        : "Liên hệ";

    const locationDisplay = doctor?.facilities && doctor.facilities.length > 0
        ? { name: doctor.facilities[0].facility_name, branch: doctor.facilities[0].branch_name }
        : { name: doctor?.facilityName || "EHealth Hospital", branch: "" };

    // Build working hours from schedules
    const workingHoursDisplay = buildWorkingHours(schedules);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                <PatientNavbar />
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="animate-pulse">
                        <div className="flex gap-6">
                            <div className="w-40 h-48 rounded-2xl bg-gray-200" />
                            <div className="flex-1 space-y-3">
                                <div className="h-6 bg-gray-200 rounded w-1/3" />
                                <div className="h-4 bg-gray-100 rounded w-1/4" />
                                <div className="h-4 bg-gray-100 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                <PatientNavbar />
                <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                    <span className="material-symbols-outlined text-gray-300 mb-4" style={{ fontSize: "80px" }}>person_off</span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy bác sĩ</h2>
                    <p className="text-gray-500 mb-6">Bác sĩ không tồn tại hoặc đã bị xoá khỏi hệ thống.</p>
                    <Link href="/doctors" className="px-6 py-3 bg-[#3C81C6] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                        ← Quay lại danh sách
                    </Link>
                </div>
                <PatientFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <PatientNavbar />

            {/* Hero section */}
            <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c] pt-8 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#3C81C6]/15 rounded-full blur-[100px]" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/doctors" className="inline-flex items-center gap-1.5 text-[#60a5fa] text-sm font-medium hover:text-white transition-colors mb-6">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                        Quay lại danh sách bác sĩ
                    </Link>
                </div>
            </section>

            {/* Doctor profile card — overlapping hero */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Profile card */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-black/[0.04] border border-gray-100 p-6 md:p-8 mb-6">
                            <div className="flex flex-col sm:flex-row gap-6">
                                {/* Avatar */}
                                <div className="relative w-32 h-40 sm:w-36 sm:h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex-shrink-0 mx-auto sm:mx-0">
                                    {doctor.avatar ? (
                                        <img
                                            src={doctor.avatar}
                                            alt={doctor.fullName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                const parent = (e.target as HTMLImageElement).parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10"><span class="material-symbols-outlined text-[#3C81C6]" style="font-size: 56px">person</span></div>`;
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10">
                                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "56px" }}>person</span>
                                        </div>
                                    )}
                                    <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${doctor.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center sm:text-left">
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{doctor.fullName}</h1>
                                    {(doctor.doctorTitle || doctor.qualification) && (
                                        <p className="text-[#3C81C6] font-semibold text-sm mb-2">{doctor.doctorTitle || doctor.qualification}</p>
                                    )}
                                    <p className="text-gray-500 text-sm mb-4">{doctor.departmentName}</p>

                                    <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start mb-4">
                                        {doctor.experience && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>work_history</span>
                                                {doctor.experience} năm kinh nghiệm
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>star</span>
                                            {doctor.rating > 0 ? doctor.rating.toFixed(1) : "—"} <span className="text-amber-500 text-[10px]">(Chưa có đánh giá)</span>
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${doctor.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{doctor.status === "active" ? "check_circle" : "cancel"}</span>
                                            {doctor.status === "active" ? "Đang hoạt động" : "Tạm nghỉ"}
                                        </span>
                                    </div>

                                    {/* CTA */}
                                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                                        <Link href={`/booking?doctorId=${id}`}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-semibold rounded-xl shadow-lg shadow-[#3C81C6]/25 hover:shadow-xl hover:shadow-[#3C81C6]/30 transition-all active:scale-[0.97]">
                                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>calendar_month</span>
                                            Đặt lịch ngay
                                        </Link>
                                        <a href="tel:02812345678" className="inline-flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                            <span className="material-symbols-outlined text-green-500" style={{ fontSize: "20px" }}>call</span>
                                            Gọi tư vấn
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex border-b border-gray-100 overflow-x-auto">
                                {TABS.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                                        ${activeTab === tab.id ? "border-[#3C81C6] text-[#3C81C6]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {activeTab === "about" && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">Giới thiệu</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {doctor.biography || `${doctor.fullName} là chuyên gia tại khoa ${doctor.departmentName}. Bác sĩ có chuyên môn cao và được đánh giá tốt bởi sự tận tâm.`}
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">Chuyên môn chính</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(doctor.specialization || doctor.departmentName || "Đa khoa").split(",").map(s => (
                                                    <span key={s} className="px-3 py-1.5 bg-[#3C81C6]/[0.06] text-[#3C81C6] text-sm font-medium rounded-lg">{s.trim()}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Hiển thị chi nhánh làm việc */}
                                        {doctor.facilities && doctor.facilities.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-3">Nơi làm việc</h3>
                                                <div className="space-y-2">
                                                    {doctor.facilities.map((f, i) => (
                                                        <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                                                            <span className="material-symbols-outlined text-[#3C81C6] mt-0.5" style={{ fontSize: "16px" }}>location_on</span>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{f.facility_name} — {f.branch_name}</p>
                                                                {f.department_name && <p className="text-xs text-gray-400">Khoa {f.department_name}</p>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "schedule" && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Lịch khám & khung giờ</h3>

                                        {/* Hiển thị lịch thực nếu có */}
                                        {schedules.length > 0 && (
                                            <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                                <h4 className="text-sm font-semibold text-blue-800 mb-3">Lịch làm việc sắp tới</h4>
                                                <div className="space-y-2">
                                                    {schedules.slice(0, 7).map((s, i) => (
                                                        <div key={i} className="grid grid-cols-[1fr_1fr_.5fr] items-center gap-4 text-sm">
                                                            <span className="text-gray-700 font-medium text-left">{formatScheduleDate(s.working_date || s.work_date || "")}</span>
                                                            <span className="text-[#3C81C6] font-semibold text-left">{s.start_time.substring(0, 5)} — {s.end_time.substring(0, 5)}</span>
                                                            <span className="text-xs text-gray-400 text-left">
                                                                {s.room_name ? (s.room_name.startsWith('Phòng') ? s.room_name : `Phòng ${s.room_name}`) : ''}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <TimeSlotPicker
                                            selectedDate={selectedDate}
                                            onDateChange={setSelectedDate}
                                            selectedTime={selectedTime}
                                            onTimeChange={setSelectedTime}
                                            slots={selectedDate ? availableSlots : undefined}
                                            loading={isFetchingSlots}
                                            availableDates={Array.from(new Set(schedules.map(s => normalizeDateStr(s.working_date || s.work_date || "")).filter(Boolean)))}
                                        />
                                        {selectedDate && selectedTime && (
                                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-green-800">Bạn đã chọn: {new Date(selectedDate + "T00:00:00").toLocaleDateString("vi-VN")} lúc {selectedTime}</p>
                                                    <p className="text-xs text-green-600 mt-0.5">Nhấn &quot;Đặt lịch&quot; để tiếp tục</p>
                                                </div>
                                                <Link href={`/booking?doctorId=${id}&date=${selectedDate}&time=${selectedTime}`}
                                                    className="px-5 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-xl hover:bg-green-700 transition-colors active:scale-[0.97]">
                                                    Đặt lịch →
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "reviews" && (
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-900">Đánh giá bệnh nhân</h3>
                                            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                                                <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "18px" }}>star</span>
                                                <span className="text-lg font-bold text-amber-700">{doctor.rating > 0 ? doctor.rating.toFixed(1) : "—"}</span>
                                                <span className="text-xs text-amber-600">/5</span>
                                            </div>
                                        </div>

                                        {/* Note: BE chưa có API reviews */}
                                        <div className="mb-4 p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                                            <p className="text-xs text-amber-700">
                                                <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: "14px" }}>info</span>
                                                Hệ thống đánh giá đang được phát triển. Dữ liệu hiển thị dưới đây là minh hoạ.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            {MOCK_REVIEWS.map((rev, i) => (
                                                <div key={i} className="p-4 border border-gray-100 rounded-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10 flex items-center justify-center">
                                                                <span className="text-xs font-bold text-[#3C81C6]">{rev.name.charAt(0)}</span>
                                                            </div>
                                                            <span className="text-sm font-semibold text-gray-900">{rev.name}</span>
                                                        </div>
                                                        <span className="text-xs text-gray-400">{rev.date}</span>
                                                    </div>
                                                    <div className="flex gap-0.5 mb-2">
                                                        {Array.from({ length: 5 }).map((_, j) => (
                                                            <span key={j} className={`material-symbols-outlined ${j < rev.rating ? "text-amber-400" : "text-gray-200"}`} style={{ fontSize: "16px" }}>star</span>
                                                        ))}
                                                    </div>
                                                    <p className="text-sm text-gray-600">{rev.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "services" && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Dịch vụ & Gói khám</h3>
                                        <div className="space-y-3">
                                            {services.length > 0 ? services.map(svc => (
                                                <div key={svc.facility_service_id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#3C81C6]/20 transition-colors">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 text-sm">
                                                            {svc.service_name} 
                                                            {svc.is_primary && <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] uppercase font-bold rounded">Chính</span>}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 mt-0.5">{svc.service_group || 'Chưa phân nhóm'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold text-[#3C81C6]">
                                                            {formatCurrency(Number(svc.base_price))}
                                                        </span>
                                                        <Link href={`/booking?doctorId=${id}&serviceId=${svc.facility_service_id}`}
                                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#3C81C6] rounded-lg hover:bg-[#2a6da8] transition-colors">
                                                            Đặt lịch
                                                        </Link>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    <p className="text-gray-500 text-sm mb-2">Chưa có dịch vụ nào được cấu hình cho bác sĩ này.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="w-full lg:w-80 flex-shrink-0">
                        <div className="sticky top-24 space-y-4">
                            {/* Quick booking card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>event_available</span>
                                    Đặt lịch nhanh
                                </h3>
                                <Link href={`/booking?doctorId=${id}`}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white font-semibold rounded-xl shadow-md shadow-[#3C81C6]/20 hover:shadow-lg transition-all active:scale-[0.97] mb-3">
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>calendar_month</span>
                                    Chọn lịch ngay
                                </Link>
                                <a href="tel:02812345678" className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                    <span className="material-symbols-outlined text-green-500" style={{ fontSize: "18px" }}>call</span>
                                    (028) 1234 5678
                                </a>
                            </div>

                            {/* Info card — Data thật */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>payments</span>
                                    <div>
                                        <p className="text-xs text-gray-500">Giá khám</p>
                                        <p className="text-sm font-bold text-gray-900">{consultationFeeDisplay}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>location_on</span>
                                    <div>
                                        <p className="text-xs text-gray-500">Địa điểm khám</p>
                                        <p className="text-sm font-semibold text-gray-900">{locationDisplay.name}</p>
                                        {locationDisplay.branch && (
                                            <p className="text-xs text-gray-400">{locationDisplay.branch}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>schedule</span>
                                    <div>
                                        <p className="text-xs text-gray-500">Giờ làm việc</p>
                                        {workingHoursDisplay.length > 0 ? (
                                            workingHoursDisplay.map((wh, i) => (
                                                <p key={i} className="text-sm text-gray-700">{wh}</p>
                                            ))
                                        ) : (
                                            <>
                                                <p className="text-sm text-gray-700">T2 — T6: 7:00 — 17:00</p>
                                                <p className="text-sm text-gray-700">T7: 7:00 — 12:00</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="mt-12">
                <PatientFooter />
            </div>
        </div>
    );
}

// ============================================
// Helpers
// ============================================

/** Tách parse ngày để dùng chung, KHÔNG dùng new Date nếu chỉ cần format để tránh hydration error */
function parseCustomDate(dateStr: string): Date {
    if (!dateStr) return new Date("");
    try {
        let y, m, d;
        if (typeof dateStr === "string" && dateStr.includes("/")) {
            const p = dateStr.split("/");
            if(p.length === 3) { d=p[0]; m=p[1]; y=p[2]; }
        } else if (typeof dateStr === "string" && dateStr.includes("-")) {
            const p = dateStr.split("T")[0].split("-");
            if(p.length === 3) { y=p[0]; m=p[1]; d=p[2]; }
        }
        
        if (y && m && d) {
            return new Date(Number(y), Number(m)-1, Number(d));
        }
        return new Date(dateStr);
    } catch {
        return new Date(dateStr);
    }
}

function normalizeDateStr(dateStr: string): string {
    const d = parseCustomDate(dateStr);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/** Format ngày schedule (2026-04-10 → T5, 10/04) */
function formatScheduleDate(dateStr: string): string {
    try {
        const date = parseCustomDate(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const day = dayNames[date.getDay()];
        return `${day}, ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } catch {
        return dateStr;
    }
}

/** Build working hours summary từ schedule list */
function buildWorkingHours(schedules: DoctorSchedule[]): string[] {
    if (!schedules || schedules.length === 0) return [];

    // Group by day of week
    const byDay: Record<string, { start: string; end: string }[]> = {};
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (const s of schedules) {
        try {
            const date = parseCustomDate(s.working_date || s.work_date || "");
            if (isNaN(date.getTime())) continue;
            const dayName = dayNames[date.getDay()];
            if (!byDay[dayName]) byDay[dayName] = [];
            byDay[dayName].push({ start: s.start_time, end: s.end_time });
        } catch {
            // skip invalid dates
        }
    }

    // Summarize
    const result: string[] = [];
    const orderedDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    for (const day of orderedDays) {
        if (byDay[day] && byDay[day].length > 0) {
            const times = byDay[day][0];
            const startS = times.start.substring(0, 5);
            const endS = times.end.substring(0, 5);
            result.push(`${day}: ${startS} — ${endS}`);
        }
    }

    return result.length > 0 ? result : [];
}

