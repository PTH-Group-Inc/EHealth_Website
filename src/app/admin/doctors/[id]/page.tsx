"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { DOCTOR_STATUS } from "@/constants/status";
import type { Doctor } from "@/types";
import { staffService } from "@/services/staffService";
import { getImageUrl } from "@/utils/helpers";

const TABS = [
    { key: "overview", label: "Tổng quan", icon: "person" },
    { key: "professional", label: "Chuyên môn", icon: "workspace_premium" },
    { key: "schedule", label: "Lịch làm việc", icon: "calendar_month" },
    { key: "education", label: "Học vấn & KN", icon: "school" },
];

export default function DoctorDetailPage() {
    const router = useRouter();
    const params = useParams();
    const doctorId = params.id as string;

    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (!doctorId) return;
        setLoading(true);
        staffService.getById(doctorId)
            .then((res: any) => {
                const d = res?.data ?? res;
                if (d && (d.users_id || d.id || d.staff_id)) {
                    setDoctor({
                        id: String(d.users_id ?? d.id ?? d.staff_id ?? doctorId),
                        fullName: d.full_name ?? d.fullName ?? "",
                        email: d.email ?? "",
                        phone: d.phone ?? d.phone_number ?? "",
                        code: d.staff_code ?? d.employee_code ?? d.code ?? String(d.users_id ?? doctorId),
                        departmentName: d.specialty_name ?? d.department?.name ?? d.departmentName ?? d.department_name ?? "",
                        departmentId: d.department?.id ?? d.departmentId ?? d.department_id ?? "",
                        specialization: d.specialty_name ?? d.specialization ?? "",
                        status: d.status?.toLowerCase() === "active" ? DOCTOR_STATUS.ACTIVE : d.status ?? DOCTOR_STATUS.ACTIVE,
                        rating: d.rating ?? 0,
                        reviewCount: d.reviewCount ?? d.review_count ?? 0,
                        experience: d.experience ?? 0,
                        avatar: d.avatar_url ?? d.avatar ?? "",
                        createdAt: d.created_at?.split("T")[0] ?? d.createdAt ?? "",
                        workingSchedule: d.workingSchedule ?? [],
                    } as Doctor);
                }
            })
            .catch(() => {
                setDoctor(null);
            })
            .finally(() => setLoading(false));
    }, [doctorId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin mb-4" />
                <p className="text-sm text-[#687582]">Đang tải...</p>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_off</span>
                <p className="text-lg text-gray-500 mb-4">Không tìm thấy bác sĩ</p>
                <button onClick={() => router.back()} className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors">
                    Quay lại
                </button>
            </div>
        );
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case DOCTOR_STATUS.ACTIVE: return { color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", label: "Đang hoạt động" };
            case DOCTOR_STATUS.ON_LEAVE: return { color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", label: "Nghỉ phép" };
            case DOCTOR_STATUS.EXAMINING: return { color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Đang khám" };
            default: return { color: "text-gray-600 dark:text-gray-300", bg: "bg-gray-100 dark:bg-gray-700", label: "Offline" };
        }
    };

    const status = getStatusStyle(doctor.status);

    return (
        <>
            {/* Breadcrumb + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/doctors" className="hover:text-[#3C81C6] transition-colors">Quản lý Bác sĩ</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">{doctor.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/admin/doctors/${doctorId}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-all shadow-md shadow-blue-200 dark:shadow-none">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Chỉnh sửa
                    </button>
                    <button onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Quay lại
                    </button>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                <div className="h-36 bg-gradient-to-r from-[#3C81C6] via-[#60a5fa] to-[#93c5fd] relative">
                    <div className="absolute -bottom-14 left-8">
                        <div className="w-28 h-28 rounded-2xl bg-white dark:bg-[#1e242b] border-4 border-white dark:border-[#1e242b] shadow-lg flex items-center justify-center overflow-hidden">
                            {getImageUrl(doctor.avatar) ? (
                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${getImageUrl(doctor.avatar)}')` }} />
                            ) : (
                                <span className="material-symbols-outlined text-5xl text-[#3C81C6]">person</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="pt-18 pb-6 px-8" style={{ paddingTop: '72px' }}>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-[#121417] dark:text-white">{doctor.fullName}</h1>
                            <p className="text-[#687582] dark:text-gray-400 mt-1">{doctor.code} • {doctor.specialization || doctor.departmentName}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {status.label}
                                </span>
                                <span className="flex items-center gap-1 text-sm">
                                    <span className="material-symbols-outlined text-yellow-500 text-[18px]">star</span>
                                    <span className="font-bold text-[#121417] dark:text-white">{doctor.rating}</span>
                                    <span className="text-[#687582] dark:text-gray-400">({doctor.reviewCount} đánh giá)</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-8 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="flex gap-1 -mb-px overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? "border-[#3C81C6] text-[#3C81C6]"
                                        : "border-transparent text-[#687582] hover:text-[#3C81C6] hover:border-gray-300"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === "overview" && <OverviewTab doctor={doctor} />}
                {activeTab === "professional" && <ProfessionalTab doctor={doctor} />}
                {activeTab === "schedule" && <ScheduleTab doctor={doctor} />}
                {activeTab === "education" && <EducationTab doctor={doctor} />}
            </div>
        </>
    );
}

function OverviewTab({ doctor }: { doctor: Doctor }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">badge</span>
                    Thông tin cá nhân
                </h2>
                <div className="space-y-4">
                    <InfoRow label="Họ và tên" value={doctor.fullName} icon="person" />
                    <InfoRow label="Email" value={doctor.email || "—"} icon="email" />
                    <InfoRow label="Số điện thoại" value={doctor.phone || "—"} icon="phone" />
                    <InfoRow label="Mã bác sĩ" value={doctor.code} icon="fingerprint" />
                    <InfoRow label="Giới tính" value="Nam" icon="wc" />
                </div>
            </div>
        </div>
    );
}

function ProfessionalTab({ doctor }: { doctor: Doctor }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">stethoscope</span>
                Thông tin chuyên môn
            </h2>
            <div className="space-y-4">
                <InfoRow label="Chuyên khoa" value={doctor.departmentName} icon="domain" />
                <InfoRow label="Chuyên ngành" value={doctor.specialization || "—"} icon="medical_information" />
                <InfoRow label="Kinh nghiệm" value={`${doctor.experience || 5} năm`} icon="work_history" />
                <InfoRow label="Đánh giá" value={`${doctor.rating}/5 (${doctor.reviewCount} đánh giá)`} icon="star" />
                <InfoRow label="Ngày tạo" value={doctor.createdAt || "—"} icon="event" />
            </div>
        </div>
    );
}

function ScheduleTab({ doctor }: { doctor: Doctor }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">calendar_month</span>
                Lịch làm việc
            </h2>
            {doctor.workingSchedule && doctor.workingSchedule.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {doctor.workingSchedule.map((schedule, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-bold text-[#121417] dark:text-white mb-1">
                                {schedule.shift === "MORNING" ? "Ca sáng" : schedule.shift === "AFTERNOON" ? "Ca chiều" : "Ca tối"}
                            </p>
                            <p className="text-xs text-[#687582] dark:text-gray-400">
                                {schedule.days.join(", ")}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có lịch làm việc</p>
            )}
        </div>
    );
}

function EducationTab({ doctor }: { doctor: Doctor }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <span className="material-symbols-outlined text-3xl text-gray-400">school</span>
                </div>
                <h3 className="text-base font-bold text-[#121417] dark:text-white mb-2">Chưa có dữ liệu</h3>
                <p className="text-sm text-gray-500 max-w-sm">Chưa có dữ liệu học vấn và kinh nghiệm làm việc.</p>
            </div>
        </div>
    );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="material-symbols-outlined text-[18px] text-[#687582]">{icon}</span>
            <div className="flex-1">
                <p className="text-xs text-[#687582] dark:text-gray-400">{label}</p>
                <p className="text-sm font-medium text-[#121417] dark:text-white">{value}</p>
            </div>
        </div>
    );
}
