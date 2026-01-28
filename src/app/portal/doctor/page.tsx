"use client";

import Link from "next/link";
import { UI_TEXT } from "@/constants/ui-text";
import { ROUTES } from "@/constants/routes";
import {
    MOCK_DOCTOR_DASHBOARD_STATS,
    MOCK_WEEKLY_EXAM_STATS,
    MOCK_TODAY_SCHEDULE,
    MOCK_HOSPITAL_ANNOUNCEMENTS,
} from "@/lib/mock-data/doctor";

// Format số tiền
function formatCurrency(num: number): string {
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}tr`;
    }
    return num.toLocaleString("vi-VN");
}

export default function DoctorDashboard() {
    const stats = MOCK_DOCTOR_DASHBOARD_STATS;
    const weeklyStats = MOCK_WEEKLY_EXAM_STATS;
    const schedule = MOCK_TODAY_SCHEDULE;
    const announcements = MOCK_HOSPITAL_ANNOUNCEMENTS;

    const getScheduleStatusStyle = (status: string) => {
        switch (status) {
            case "completed":
                return { bg: "bg-blue-50", border: "border-blue-100", dot: "bg-blue-500" };
            case "ongoing":
                return { bg: "bg-white", border: "border-green-200", dot: "bg-green-500 ring-4 ring-green-100" };
            case "upcoming":
                return { bg: "bg-[#f8fafc]", border: "border-dashed border-[#cbd5e1]", dot: "bg-[#cbd5e1]" };
            default:
                return { bg: "bg-gray-50", border: "border-gray-100", dot: "bg-gray-400" };
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div>
                    <h2 className="text-2xl font-bold text-[#121417] dark:text-white">
                        {UI_TEXT.DOCTOR.DASHBOARD.TITLE}
                    </h2>
                    <p className="text-sm text-[#687582] dark:text-gray-400">
                        {UI_TEXT.DOCTOR.DASHBOARD.SUBTITLE}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Số ca khám hôm nay */}
                    <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1 duration-300">
                        <div>
                            <p className="text-sm font-medium text-[#687582] dark:text-gray-400 mb-1">
                                {UI_TEXT.DOCTOR.DASHBOARD.TODAY_EXAMS}
                            </p>
                            <h3 className="text-3xl font-bold text-[#121417] dark:text-white">
                                {stats.todayExams}{" "}
                                <span className="text-lg text-[#94a3b8] font-medium">
                                    / {stats.totalExamsToday}
                                </span>
                            </h3>
                            <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                {stats.progressPercent}% Tiến độ
                            </p>
                        </div>
                        <div className="size-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#3C81C6] text-2xl">
                                medical_services
                            </span>
                        </div>
                    </div>

                    {/* Bệnh nhân đang đợi */}
                    <Link
                        href={ROUTES.PORTAL.DOCTOR.QUEUE}
                        className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1 hover:border-[#3C81C6] duration-300"
                    >
                        <div>
                            <p className="text-sm font-medium text-[#687582] dark:text-gray-400 mb-1">
                                {UI_TEXT.DOCTOR.DASHBOARD.WAITING_PATIENTS}
                            </p>
                            <h3 className="text-3xl font-bold text-[#121417] dark:text-white">
                                {stats.waitingPatients}
                            </h3>
                            <p className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                Chờ TB: {stats.avgWaitTime}p
                            </p>
                        </div>
                        <div className="size-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-orange-500 text-2xl">
                                group
                            </span>
                        </div>
                    </Link>

                    {/* Doanh thu cá nhân */}
                    <Link
                        href={ROUTES.PORTAL.DOCTOR.REPORTS}
                        className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1 hover:border-[#3C81C6] duration-300"
                    >
                        <div>
                            <p className="text-sm font-medium text-[#687582] dark:text-gray-400 mb-1">
                                {UI_TEXT.DOCTOR.DASHBOARD.PERSONAL_REVENUE}
                            </p>
                            <h3 className="text-3xl font-bold text-[#121417] dark:text-white">
                                {formatCurrency(stats.personalRevenue)}
                            </h3>
                            <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                +{stats.revenueChange}% so với tuần trước
                            </p>
                        </div>
                        <div className="size-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-green-600 text-2xl">
                                attach_money
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Weekly Stats Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                {UI_TEXT.DOCTOR.DASHBOARD.WEEKLY_STATS}
                            </h3>
                            <select className="text-sm border-none bg-[#f8fafc] dark:bg-gray-800 text-[#687582] dark:text-gray-300 rounded-lg py-1 px-3 focus:ring-0 cursor-pointer outline-none">
                                <option>Tuần hiện tại</option>
                                <option>Tuần trước</option>
                            </select>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2">
                            {weeklyStats.map((item, index) => {
                                const isToday = index === 2; // T4 = Today
                                return (
                                    <div
                                        key={item.day}
                                        className="flex flex-col items-center gap-2 flex-1 group cursor-pointer"
                                    >
                                        <div
                                            className={`relative w-full max-w-[40px] rounded-t-md transition-all duration-300 ${isToday
                                                    ? "bg-[#3C81C6] shadow-lg shadow-blue-200 dark:shadow-none"
                                                    : "bg-[#3C81C6]/10 group-hover:bg-[#3C81C6]/20"
                                                }`}
                                            style={{ height: `${item.percentage}%` }}
                                        >
                                            <div
                                                className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1e242b] text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity ${isToday ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                    }`}
                                            >
                                                {item.count}
                                            </div>
                                        </div>
                                        <span
                                            className={`text-xs ${isToday
                                                    ? "font-bold text-[#3C81C6]"
                                                    : "text-gray-400"
                                                }`}
                                        >
                                            {item.day}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="lg:col-span-1 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                {UI_TEXT.DOCTOR.DASHBOARD.TODAY_SCHEDULE}
                            </h3>
                            <Link
                                href={ROUTES.PORTAL.DOCTOR.APPOINTMENTS}
                                className="text-sm text-[#3C81C6] font-medium hover:underline"
                            >
                                {UI_TEXT.COMMON.VIEW_ALL}
                            </Link>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            {schedule.map((item, index) => {
                                const style = getScheduleStatusStyle(item.status);
                                return (
                                    <div key={item.id} className="flex gap-4 group">
                                        <div className="flex flex-col items-center gap-1">
                                            <span
                                                className={`text-xs font-bold ${item.status === "upcoming"
                                                        ? "text-[#687582]"
                                                        : "text-[#121417] dark:text-white"
                                                    }`}
                                            >
                                                {item.time}
                                            </span>
                                            <div
                                                className={`w-0.5 h-full ${index === schedule.length - 1
                                                        ? "bg-transparent"
                                                        : "bg-[#e5e7eb] dark:bg-[#2d353e]"
                                                    } relative`}
                                            >
                                                <div
                                                    className={`absolute top-0 left-1/2 -translate-x-1/2 size-2 rounded-full ${style.dot}`}
                                                ></div>
                                            </div>
                                        </div>
                                        <div
                                            className={`pb-4 ${index === schedule.length - 1
                                                    ? "border-none"
                                                    : "border-b border-[#f1f2f4] dark:border-[#2d353e]"
                                                } w-full`}
                                        >
                                            <div
                                                className={`${style.bg} p-3 rounded-lg border ${style.border}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-bold text-[#121417] dark:text-white">
                                                        {item.title}
                                                    </p>
                                                    {item.status === "ongoing" && (
                                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded uppercase">
                                                            Đang diễn ra
                                                        </span>
                                                    )}
                                                </div>
                                                {item.location && (
                                                    <p className="text-xs text-[#687582] dark:text-gray-400 mt-1">
                                                        {item.location} • {item.duration}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Announcements */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500">campaign</span>
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                {UI_TEXT.DOCTOR.DASHBOARD.HOSPITAL_ANNOUNCEMENTS}
                            </h3>
                        </div>
                        <button className="text-sm text-[#687582] dark:text-gray-400 hover:text-[#3C81C6]">
                            Đánh dấu đã đọc
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {announcements.map((announcement) => (
                            <div
                                key={announcement.id}
                                className={`p-4 rounded-lg flex gap-3 items-start cursor-pointer hover:shadow-md transition-shadow ${announcement.type === "urgent"
                                        ? "bg-[#FFF4F2] border border-red-100"
                                        : "bg-[#f0f9ff] border border-blue-100"
                                    }`}
                            >
                                <span
                                    className={`bg-white p-1.5 rounded-full shadow-sm material-symbols-outlined text-lg ${announcement.type === "urgent"
                                            ? "text-red-500"
                                            : "text-[#3C81C6]"
                                        }`}
                                >
                                    {announcement.type === "urgent" ? "priority_high" : "info"}
                                </span>
                                <div>
                                    <h4 className="text-sm font-bold text-[#121417] dark:text-gray-900 mb-1">
                                        {announcement.title}
                                    </h4>
                                    <p className="text-xs text-[#687582] line-clamp-2">
                                        {announcement.content}
                                    </p>
                                    <span className="text-[10px] font-medium text-[#687582] mt-2 block">
                                        {announcement.time} • {announcement.department}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
