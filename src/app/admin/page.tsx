"use client";

import Link from "next/link";
import { UI_TEXT } from "@/constants/ui-text";
import { ROUTES } from "@/constants/routes";
import {
    MOCK_DASHBOARD_STATS,
    MOCK_DEPARTMENT_LOADS,
    MOCK_ACTIVITY_LOGS,
    MOCK_PATIENT_GROWTH,
} from "@/lib/mock-data/admin";

// Format number to Vietnamese style (1,234,567)
function formatNumber(num: number): string {
    return num.toLocaleString("vi-VN");
}

// Format currency to tỷ/triệu
function formatCurrency(num: number): string {
    if (num >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(1)} Tỷ`;
    }
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(0)} Triệu`;
    }
    return formatNumber(num);
}

// Get progress bar color based on percentage
function getLoadColor(percentage: number): string {
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 60) return "bg-orange-400";
    if (percentage >= 40) return "bg-yellow-400";
    return "bg-green-500";
}

export default function AdminDashboard() {
    const stats = MOCK_DASHBOARD_STATS;
    const departmentLoads = MOCK_DEPARTMENT_LOADS;
    const activities = MOCK_ACTIVITY_LOGS;
    const patientGrowth = MOCK_PATIENT_GROWTH;

    return (
        <>
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                    {UI_TEXT.ADMIN.DASHBOARD.TITLE}
                </h1>
                <p className="text-[#687582] dark:text-gray-400 mt-1">
                    {UI_TEXT.ADMIN.DASHBOARD.SUBTITLE}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <Link
                    href={ROUTES.ADMIN.STATISTICS}
                    className="bg-white dark:bg-[#1e242b] p-6 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-[#3C81C6] transition-all cursor-pointer"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[#687582] dark:text-gray-400 text-sm font-medium mb-1">
                                {UI_TEXT.ADMIN.DASHBOARD.TOTAL_REVENUE}
                            </p>
                            <h3 className="text-2xl font-bold text-[#121417] dark:text-white">
                                {formatCurrency(stats.totalRevenue)}
                            </h3>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                            <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                            {stats.revenueChange}%
                        </span>
                        <span className="text-xs text-[#687582] dark:text-gray-500">so với tháng trước</span>
                    </div>
                </Link>

                {/* Today Visits */}
                <div className="bg-white dark:bg-[#1e242b] p-6 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[#687582] dark:text-gray-400 text-sm font-medium mb-1">
                                {UI_TEXT.ADMIN.DASHBOARD.TODAY_VISITS}
                            </p>
                            <h3 className="text-2xl font-bold text-[#121417] dark:text-white">
                                {formatNumber(stats.todayVisits)}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                            <span className="material-symbols-outlined">vital_signs</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                            <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                            {stats.visitsChange}%
                        </span>
                        <span className="text-xs text-[#687582] dark:text-gray-500">so với hôm qua</span>
                    </div>
                </div>

                {/* Doctors on Duty */}
                <Link
                    href={ROUTES.ADMIN.DOCTORS}
                    className="bg-white dark:bg-[#1e242b] p-6 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-[#3C81C6] transition-all cursor-pointer"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[#687582] dark:text-gray-400 text-sm font-medium mb-1">
                                {UI_TEXT.ADMIN.DASHBOARD.DOCTORS_ON_DUTY}
                            </p>
                            <h3 className="text-2xl font-bold text-[#121417] dark:text-white">
                                {stats.doctorsOnDuty}/{stats.totalDoctors}
                            </h3>
                        </div>
                        <div className="p-3 bg-[#3C81C6]/10 rounded-xl text-[#3C81C6] group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">stethoscope</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 bg-cover" style={{ backgroundImage: `url('https://i.pravatar.cc/100?img=1')` }}></div>
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 bg-cover" style={{ backgroundImage: `url('https://i.pravatar.cc/100?img=2')` }}></div>
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 bg-cover" style={{ backgroundImage: `url('https://i.pravatar.cc/100?img=3')` }}></div>
                            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] text-gray-600 font-bold">
                                +{stats.doctorsOnDuty - 3}
                            </div>
                        </div>
                        <span className="text-xs text-[#687582] dark:text-gray-500">Đang hoạt động</span>
                    </div>
                </Link>

                {/* Medicine Alerts */}
                <Link
                    href={ROUTES.ADMIN.MEDICINES}
                    className="bg-white dark:bg-[#1e242b] p-6 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col justify-between group hover:shadow-md hover:border-red-400 transition-all cursor-pointer"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[#687582] dark:text-gray-400 text-sm font-medium mb-1">
                                {UI_TEXT.ADMIN.DASHBOARD.MEDICINE_ALERTS}
                            </p>
                            <h3 className="text-2xl font-bold text-[#121417] dark:text-white">
                                {String(stats.medicineAlerts).padStart(2, "0")}
                            </h3>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">warning</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <span className="flex items-center text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                            Sắp hết hạn
                        </span>
                        <span className="text-xs text-[#687582] dark:text-gray-500">Cần xử lý ngay</span>
                    </div>
                </Link>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient Growth Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] p-6 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                {UI_TEXT.ADMIN.DASHBOARD.PATIENT_GROWTH}
                            </h3>
                            <p className="text-xs text-[#687582] dark:text-gray-400">
                                Thống kê lượng bệnh nhân mới trong năm 2024
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <select className="text-sm border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-[#687582] dark:text-gray-300 focus:ring-[#3C81C6] focus:border-[#3C81C6] px-3 py-1.5">
                                <option>12 tháng qua</option>
                                <option>6 tháng qua</option>
                                <option>Tháng này</option>
                            </select>
                            <Link
                                href={ROUTES.ADMIN.STATISTICS}
                                className="text-xs text-[#3C81C6] hover:underline font-medium"
                            >
                                {UI_TEXT.COMMON.VIEW_DETAILS}
                            </Link>
                        </div>
                    </div>
                    {/* Simple Bar Chart */}
                    <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-4 mt-8 px-2">
                        {patientGrowth.map((item, index) => (
                            <div key={item.month} className="group relative flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <div
                                    className={`w-full ${index === 7 ? "bg-[#3C81C6] shadow-lg shadow-blue-200 dark:shadow-none" : "bg-[#3C81C6]/10 group-hover:bg-[#3C81C6]/20"} rounded-t-sm relative transition-all duration-300`}
                                    style={{ height: `${item.value}%` }}
                                >
                                    {index === 7 && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1e242b] text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            2,450
                                        </div>
                                    )}
                                </div>
                                <span className={`text-xs ${index === 7 ? "font-bold text-[#3C81C6]" : "text-gray-400"}`}>
                                    {item.month}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Department Status */}
                <div className="lg:col-span-1 bg-white dark:bg-[#1e242b] p-6 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4">
                        {UI_TEXT.ADMIN.DASHBOARD.DEPARTMENT_STATUS}
                    </h3>
                    <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                        {departmentLoads.map((dept) => (
                            <div key={dept.id} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-[#121417] dark:text-white">{dept.name}</span>
                                    <span className="text-[#687582] dark:text-gray-400">{dept.loadPercentage}% Tải</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getLoadColor(dept.loadPercentage)} rounded-full`}
                                        style={{ width: `${dept.loadPercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link
                        href={ROUTES.ADMIN.DEPARTMENTS}
                        className="mt-4 w-full py-2 text-sm text-[#3C81C6] font-bold hover:bg-[#3C81C6]/5 rounded-xl transition-colors text-center block"
                    >
                        {UI_TEXT.COMMON.VIEW_DETAILS}
                    </Link>
                </div>
            </div>

            {/* Recent Activities Table */}
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                        {UI_TEXT.ADMIN.DASHBOARD.RECENT_ACTIVITIES}
                    </h3>
                    <Link href={ROUTES.ADMIN.ACTIVITY_LOGS} className="text-sm text-[#3C81C6] font-medium hover:underline">
                        {UI_TEXT.COMMON.VIEW_ALL}
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                    Thời gian
                                </th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                    Người thực hiện
                                </th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                    Hành động
                                </th>
                                <th className="py-3 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {activities.map((activity) => (
                                <tr
                                    key={activity.id}
                                    className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <td className="py-4 px-6 text-sm text-[#687582] dark:text-gray-400">
                                        {activity.time}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            {activity.userAvatar ? (
                                                <div
                                                    className="w-8 h-8 rounded-full bg-cover bg-center"
                                                    style={{ backgroundImage: `url('${activity.userAvatar}')` }}
                                                ></div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                                                    SYS
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-[#121417] dark:text-white">
                                                {activity.userName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-[#121417] dark:text-gray-200">
                                        {activity.action}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${activity.status === "SUCCESS"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                : activity.status === "PENDING"
                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                }`}
                                        >
                                            {activity.status === "SUCCESS"
                                                ? "Thành công"
                                                : activity.status === "PENDING"
                                                    ? "Đang xử lý"
                                                    : "Thất bại"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
