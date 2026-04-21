"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ROLES, ROLE_LABELS, ROLE_COLORS, type Role } from "@/constants/roles";
import { USER_STATUS } from "@/constants/status";
import type { User } from "@/types";

/** Format ISO date to readable string */
function formatDate(iso: string): string {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("vi-VN", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit",
        });
    } catch { return iso; }
}

const TABS = [
    { key: "overview", label: "Tổng quan", icon: "person" },
    { key: "professional", label: "Chuyên môn", icon: "workspace_premium" },
    { key: "schedule", label: "Lịch làm việc", icon: "calendar_month" },
    { key: "education", label: "Học vấn & KN", icon: "school" },
    { key: "activity", label: "Hoạt động", icon: "history" },
];

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        import("@/services/userService").then(({ getUserById }) => {
            getUserById(userId).then((res: any) => {
                if (cancelled) return;
                const raw = res?.data?.data ?? res?.data ?? res;
                if (raw) {
                    const normalizedRole = Array.isArray(raw.roles) && raw.roles.length > 0
                        ? String(raw.roles[0]).toUpperCase()
                        : String(raw.role ?? ROLES.STAFF).toUpperCase();
                    setUser({
                        ...raw,
                        id: String(raw.users_id ?? raw.id ?? userId),
                        fullName: raw.profile?.full_name ?? raw.full_name ?? raw.fullName ?? raw.email ?? "",
                        email: raw.email ?? "",
                        phone: raw.phone ?? raw.phone_number ?? "",
                        role: normalizedRole as Role,
                        status: raw.status ?? "ACTIVE",
                        avatar: raw.profile?.avatar_url ?? raw.avatar ?? "",
                        createdAt: formatDate(raw.created_at ?? raw.createdAt ?? ""),
                        lastAccess: formatDate(raw.last_login ?? raw.lastAccess ?? ""),
                    } as User);
                } else {
                    setUser(null);
                }
            }).catch(() => { if (!cancelled) setUser(null); });
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [userId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin mb-4" />
                <p className="text-sm text-[#687582]">Đang tải...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_off</span>
                <p className="text-lg text-gray-500 mb-4">Không tìm thấy người dùng</p>
                <button
                    onClick={() => router.back()}
                    className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    const roleColor = ROLE_COLORS[user.role as Role] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
    const isActive = user.status === USER_STATUS.ACTIVE;

    return (
        <>
            {/* Breadcrumb + Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/users" className="hover:text-[#3C81C6] transition-colors">
                        Người dùng
                    </Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">{user.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push(`/admin/users/${userId}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-all shadow-md shadow-blue-200 dark:shadow-none"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Chỉnh sửa
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Quay lại
                    </button>
                </div>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                {/* Banner gradient */}
                <div className="h-32 bg-gradient-to-r from-[#3C81C6] via-[#60a5fa] to-[#93c5fd] relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-[#1e242b] border-4 border-white dark:border-[#1e242b] shadow-lg flex items-center justify-center">
                            {user.avatar ? (
                                <div className="w-full h-full rounded-xl bg-cover bg-center" style={{ backgroundImage: `url('${user.avatar}')` }} />
                            ) : (
                                <span className="material-symbols-outlined text-4xl text-[#3C81C6]">person</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="pt-16 pb-6 px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-[#121417] dark:text-white">{user.fullName}</h1>
                            <p className="text-[#687582] dark:text-gray-400 mt-1">{user.email}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot} mr-1.5`} />
                                    {ROLE_LABELS[user.role as Role] || user.role}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isActive ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
                                    {isActive ? "Đang hoạt động" : "Đã khóa"}
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
            {activeTab === "overview" && <OverviewTab user={user} roleColor={roleColor} isActive={isActive} />}
            {activeTab === "professional" && <ProfessionalTab />}
            {activeTab === "schedule" && <ScheduleTab />}
            {activeTab === "education" && <EducationTab />}
            {activeTab === "activity" && <ActivityTab userId={userId} />}
        </>
    );
}

/* ─── Tab: Tổng quan ─── */
function OverviewTab({ user, roleColor, isActive }: { user: User; roleColor: { bg: string; text: string; dot: string }; isActive: boolean }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">badge</span>
                    Thông tin cá nhân
                </h2>
                <div className="space-y-4">
                    <InfoRow label="Họ và tên" value={user.fullName} icon="person" />
                    <InfoRow label="Email" value={user.email} icon="email" />
                    <InfoRow label="Vai trò" value={ROLE_LABELS[user.role as Role] || user.role} icon="shield_person" />
                    <InfoRow label="Số điện thoại" value="0901 234 567" icon="phone" />
                    <InfoRow label="Giới tính" value="Nam" icon="wc" />
                    <InfoRow label="Ngày sinh" value="15/06/1990" icon="cake" />
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">manage_accounts</span>
                    Thông tin tài khoản
                </h2>
                <div className="space-y-4">
                    <InfoRow label="Mã nhân viên" value={`NV${String(user.id ?? "").padStart(5, "0")}`} icon="fingerprint" />
                    <InfoRow label="Ngày tạo tài khoản" value={user.createdAt} icon="event" />
                    <InfoRow label="Truy cập cuối" value={user.lastAccess || "—"} icon="schedule" />
                    <InfoRow label="Trạng thái" value={isActive ? "Đang hoạt động" : "Đã khóa"} icon="toggle_on" />
                    <InfoRow label="Khoa / Phòng ban" value="Khoa Nội Tổng Quát" icon="domain" />
                    <InfoRow label="Chi nhánh" value="E-Health Quận 1" icon="location_city" />
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Chuyên môn ─── */
function ProfessionalTab() {
    const certifications = [
        { name: "Chứng chỉ hành nghề y", number: "CCHN-2020-001234", issued: "15/03/2020", expiry: "15/03/2025", status: "active" },
        { name: "Chứng chỉ cấp cứu nâng cao (ACLS)", number: "ACLS-2022-056", issued: "10/08/2022", expiry: "10/08/2025", status: "active" },
        { name: "Chứng chỉ siêu âm tim", number: "SAT-2021-089", issued: "20/01/2021", expiry: "20/01/2024", status: "expired" },
    ];

    return (
        <div className="space-y-6">
            {/* Chuyên khoa */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">stethoscope</span>
                    Chuyên khoa & Kỹ năng
                </h2>
                <div className="flex flex-wrap gap-2">
                    {["Nội tổng quát", "Tim mạch", "Siêu âm", "Nội soi"].map((skill) => (
                        <span key={skill} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[#3C81C6]/10 text-[#3C81C6]">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Giấy phép & Chứng chỉ */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">verified</span>
                    Giấy phép & Chứng chỉ
                </h2>
                <div className="space-y-3">
                    {certifications.map((cert, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cert.status === "active" ? "bg-green-100 dark:bg-green-900/20 text-green-600" : "bg-red-100 dark:bg-red-900/20 text-red-600"}`}>
                                    <span className="material-symbols-outlined text-[20px]">{cert.status === "active" ? "verified" : "gpp_bad"}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#121417] dark:text-white">{cert.name}</p>
                                    <p className="text-xs text-[#687582] dark:text-gray-400">Số: {cert.number} • Cấp: {cert.issued}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cert.status === "active" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                                    {cert.status === "active" ? "Còn hiệu lực" : "Hết hạn"}
                                </span>
                                <p className="text-xs text-[#687582] mt-1">HSD: {cert.expiry}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cơ sở y tế */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">domain</span>
                    Cơ sở y tế & Phân công
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="Cơ sở làm việc" value="E-Health Quận 1" icon="location_city" />
                    <InfoRow label="Khoa / Phòng ban" value="Khoa Nội Tổng Quát" icon="domain" />
                    <InfoRow label="Chức vụ" value="Bác sĩ điều trị" icon="work" />
                    <InfoRow label="Ngày vào làm" value="01/06/2020" icon="event" />
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Lịch làm việc ─── */
function ScheduleTab() {
    const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const shifts = [
        { name: "Ca sáng", time: "7:00 - 12:00", color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
        { name: "Ca chiều", time: "13:00 - 18:00", color: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
        { name: "Ca đêm", time: "19:00 - 7:00", color: "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
    ];
    // Mock: which shifts are assigned on which days
    const assignments: Record<string, number[]> = {
        "T2": [0], "T3": [0], "T4": [1], "T5": [1], "T6": [0], "T7": [], "CN": [],
    };

    return (
        <div className="space-y-6">
            {/* Legend */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">calendar_month</span>
                    Lịch làm việc mặc định
                </h2>
                <div className="flex gap-4 mb-6">
                    {shifts.map((shift) => (
                        <span key={shift.name} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${shift.color}`}>
                            {shift.name} <span className="opacity-70">({shift.time})</span>
                        </span>
                    ))}
                </div>

                {/* Schedule Grid */}
                <div className="overflow-x-auto">
                    <div className="grid grid-cols-7 gap-2 min-w-[600px]">
                        {days.map((day) => (
                            <div key={day} className="text-center">
                                <div className="text-xs font-bold text-[#687582] dark:text-gray-400 uppercase mb-2 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    {day}
                                </div>
                                <div className="space-y-1.5">
                                    {shifts.map((shift, idx) => {
                                        const isAssigned = assignments[day]?.includes(idx);
                                        return (
                                            <div
                                                key={idx}
                                                className={`py-2.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                                                    isAssigned
                                                        ? shift.color
                                                        : "border-dashed border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600"
                                                }`}
                                            >
                                                {isAssigned ? shift.name.replace("Ca ", "") : "—"}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Tổng giờ/tuần</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">40h</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                        <span className="material-symbols-outlined">event_available</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Ngày làm/tuần</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">5 ngày</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                        <span className="material-symbols-outlined">event_busy</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Ngày phép còn lại</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">8 ngày</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Học vấn & KN ─── */
function EducationTab() {
    const education = [
        { degree: "Tiến sĩ Y khoa", school: "Đại học Y Dược TP.HCM", year: "2018 - 2022", icon: "school" },
        { degree: "Thạc sĩ Y học", school: "Đại học Y Hà Nội", year: "2015 - 2018", icon: "school" },
        { degree: "Bác sĩ Đa khoa", school: "Đại học Y Dược TP.HCM", year: "2009 - 2015", icon: "school" },
    ];
    const experience = [
        { position: "Bác sĩ điều trị — Khoa Nội", company: "E-Health Quận 1", period: "06/2020 - Hiện tại", current: true },
        { position: "Bác sĩ nội trú", company: "Bệnh viện Chợ Rẫy", period: "01/2018 - 05/2020", current: false },
        { position: "Bác sĩ thực tập", company: "Bệnh viện Đại học Y Dược", period: "06/2015 - 12/2017", current: false },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Học vấn */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">school</span>
                    Học vấn
                </h2>
                <div className="relative space-y-0">
                    {education.map((edu, i) => (
                        <div key={i} className="relative pl-8 pb-6 last:pb-0">
                            {/* Timeline line */}
                            {i < education.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                            )}
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#3C81C6]/10 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#3C81C6]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#121417] dark:text-white">{edu.degree}</p>
                                <p className="text-sm text-[#687582] dark:text-gray-400">{edu.school}</p>
                                <p className="text-xs text-[#687582] dark:text-gray-500 mt-0.5">{edu.year}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Kinh nghiệm */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">work_history</span>
                    Kinh nghiệm làm việc
                </h2>
                <div className="relative space-y-0">
                    {experience.map((exp, i) => (
                        <div key={i} className="relative pl-8 pb-6 last:pb-0">
                            {i < experience.length - 1 && (
                                <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                            )}
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: exp.current ? "rgba(60,129,198,0.1)" : "rgba(107,114,128,0.1)" }}>
                                <div className={`w-2.5 h-2.5 rounded-full ${exp.current ? "bg-[#3C81C6]" : "bg-gray-400"}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-[#121417] dark:text-white">{exp.position}</p>
                                    {exp.current && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Hiện tại</span>
                                    )}
                                </div>
                                <p className="text-sm text-[#687582] dark:text-gray-400">{exp.company}</p>
                                <p className="text-xs text-[#687582] dark:text-gray-500 mt-0.5">{exp.period}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Tab: Hoạt động ─── */
function ActivityTab({ userId }: { userId: string }) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuditLogs = async () => {
            try {
                const axiosClient = (await import('@/api/axiosClient')).default;
                const { AUDIT_LOG_ENDPOINTS } = await import('@/api/endpoints');
                
                const res = await axiosClient.get(AUDIT_LOG_ENDPOINTS.LIST, { 
                    params: { user_id: userId, limit: 20, sort_by: 'created_at', sort_dir: 'DESC' } 
                });
                
                const logs = res.data?.data || res.data || [];
                setActivities(logs);
            } catch (err) {
                console.error("Failed to fetch audit logs:", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchAuditLogs();
        } else {
            setLoading(false);
        }
    }, [userId]);

    const getActivityDetails = (log: any) => {
        const { module_name, action_type, action_desc } = log;
        let action = action_desc || "Thao tác trên hệ thống";
        let icon = "history";
        let color = "bg-gray-100 dark:bg-gray-800 text-gray-600";

        // Map icons & colors based on ACTION_TYPE
        if (action_type === "LOGIN") {
            action = "Đăng nhập hệ thống";
            icon = "login";
            color = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
        } else if (action_type === "CREATE") {
            icon = "add_circle";
            color = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
            if (module_name === "APPOINTMENTS") action = "Tạo lịch hẹn mới";
        } else if (action_type === "UPDATE") {
            icon = "edit_note";
            color = "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
            if (module_name === "APPOINTMENTS") action = "Cập nhật thông tin lịch hẹn";
        } else if (action_type === "DELETE") {
            icon = "delete";
            color = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
        } else if (action_type === "CANCEL") {
            icon = "cancel";
            color = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
            if (module_name === "APPOINTMENTS") action = "Huỷ lịch hẹn khám";
        } else if (action_type === "COMPLETE") {
            icon = "check_circle";
            color = "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400";
            if (module_name === "APPOINTMENTS") action = "Hoàn tất khám bệnh";
        }

        // Specific overrides context
        if (module_name === "APPOINTMENTS" && icon === "history") icon = "calendar_month";
        if (module_name === "PATIENTS") icon = "personal_injury";
        if (module_name === "PRESCRIPTIONS") icon = "medication";

        return { action, icon, color };
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "Không rõ thời gian";
        const date = new Date(dateStr);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6 line-clamp-none">
            <h2 className="text-lg font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">history</span>
                Lịch sử hoạt động
            </h2>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                    <span className="mt-4 text-sm text-gray-500 font-medium">Đang tải dữ liệu hoạt động...</span>
                </div>
            ) : activities.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-800 space-y-6">
                    {activities.map((log: any, i: number) => {
                        const { action, icon, color } = getActivityDetails(log);
                        return (
                            <div key={log.id || i} className="relative">
                                {/* Dot indicator */}
                                <div className={`absolute -left-[35px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1e242b] bg-[#3C81C6]`} />
                                
                                <div className="bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50 rounded-xl p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                            <span className="material-symbols-outlined text-[24px]">{icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <p className="text-base font-bold text-[#121417] dark:text-white">
                                                    {action}
                                                </p>
                                                <span className="text-xs font-medium text-gray-500 whitespace-nowrap bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                    {formatDate(log.created_at || log.action_time)}
                                                </span>
                                            </div>
                                            
                                            {log.action_desc && log.action_desc !== action && (
                                                <p className="text-sm text-[#687582] dark:text-gray-400 bg-white dark:bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700/50 mt-2">
                                                    {log.action_desc}
                                                </p>
                                            )}

                                            {log.ip_address && (
                                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                                                    <span className="material-symbols-outlined text-[14px]">cell_wifi</span>
                                                    IP: {log.ip_address}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <span className="material-symbols-outlined text-3xl text-gray-400">history_toggle_off</span>
                    </div>
                    <h3 className="text-base font-bold text-[#121417] dark:text-white mb-2">Chưa có hoạt động</h3>
                    <p className="text-sm text-gray-500 max-w-sm">Người dùng này chưa có hoạt động nào được ghi nhận trên hệ thống.</p>
                </div>
            )}
        </div>
    );
}

/* ─── Shared component ─── */
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
