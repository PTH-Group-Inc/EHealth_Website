"use client";

import { useState } from "react";
import { UI_TEXT } from "@/constants/ui-text";
import {
    MOCK_DOCTOR_REPORT_STATS,
    MOCK_TOP_DISEASES,
    MOCK_MONTHLY_EXAM_TREND,
} from "@/lib/mock-data/doctor";

export default function ReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState("this_month");
    const stats = MOCK_DOCTOR_REPORT_STATS;
    const topDiseases = MOCK_TOP_DISEASES;
    const monthlyTrend = MOCK_MONTHLY_EXAM_TREND;

    const handleExportPDF = () => {
        alert("Đang xuất báo cáo PDF...");
    };

    const handleExportExcel = () => {
        alert("Đang xuất báo cáo Excel...");
    };

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.DOCTOR.REPORTS.TITLE}
                        </h2>
                        <p className="text-sm text-[#687582] dark:text-gray-400">
                            {UI_TEXT.DOCTOR.REPORTS.SUBTITLE}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="py-2.5 px-4 text-sm bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 text-[#121417] dark:text-white cursor-pointer"
                        >
                            <option value="this_week">{UI_TEXT.DOCTOR.REPORTS.THIS_WEEK}</option>
                            <option value="this_month">
                                {UI_TEXT.DOCTOR.REPORTS.THIS_MONTH}
                            </option>
                            <option value="this_quarter">
                                {UI_TEXT.DOCTOR.REPORTS.THIS_QUARTER}
                            </option>
                        </select>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px] text-green-600">
                                table_chart
                            </span>
                            {UI_TEXT.DOCTOR.REPORTS.EXPORT_EXCEL}
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                picture_as_pdf
                            </span>
                            {UI_TEXT.DOCTOR.REPORTS.EXPORT_PDF}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Examinations */}
                    <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-[#687582] dark:text-gray-400">
                                {UI_TEXT.DOCTOR.REPORTS.TOTAL_EXAMS}
                            </p>
                            <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#3C81C6]">
                                    medical_services
                                </span>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-[#121417] dark:text-white">
                            {stats.totalExams}
                        </h3>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">
                                trending_up
                            </span>
                            +{stats.totalExamsChange}% so với tháng trước
                        </p>
                    </div>

                    {/* Revenue */}
                    <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-[#687582] dark:text-gray-400">
                                {UI_TEXT.DOCTOR.REPORTS.REVENUE}
                            </p>
                            <div className="size-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-600">
                                    attach_money
                                </span>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-[#121417] dark:text-white">
                            {stats.revenue}
                        </h3>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">
                                trending_up
                            </span>
                            +{stats.revenueChange}% so với tháng trước
                        </p>
                    </div>

                    {/* Exams per Day */}
                    <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-[#687582] dark:text-gray-400">
                                {UI_TEXT.DOCTOR.REPORTS.EXAMS_PER_DAY}
                            </p>
                            <div className="size-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-600">
                                    event_note
                                </span>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-[#121417] dark:text-white">
                            {stats.examsPerDay}
                        </h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Trung bình/ngày
                        </p>
                    </div>

                    {/* Average Rating */}
                    <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-[#687582] dark:text-gray-400">
                                {UI_TEXT.DOCTOR.REPORTS.AVG_RATING}
                            </p>
                            <div className="size-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-yellow-500">
                                    star
                                </span>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-[#121417] dark:text-white flex items-center gap-1">
                            {stats.avgRating}
                            <span className="text-lg text-[#94a3b8]">/5</span>
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-400 mt-1">
                            {stats.totalReviews} đánh giá
                        </p>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Monthly Trend Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                {UI_TEXT.DOCTOR.REPORTS.EXAM_TREND}
                            </h3>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-3 bg-[#3C81C6] rounded-full"></span>
                                    <span className="text-[#687582] dark:text-gray-400">
                                        Số ca khám
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2">
                            {monthlyTrend.map((item) => (
                                <div
                                    key={item.month}
                                    className="flex flex-col items-center gap-2 flex-1 group cursor-pointer"
                                >
                                    <div
                                        className="relative w-full max-w-[40px] rounded-t-md bg-[#3C81C6]/10 group-hover:bg-[#3C81C6]/20 transition-all duration-300"
                                        style={{ height: `${item.percentage}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1e242b] text-white text-xs py-1 px-2 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {item.count} ca
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{item.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disease Ratio Chart */}
                    <div className="lg:col-span-1 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-6">
                            {UI_TEXT.DOCTOR.REPORTS.DISEASE_RATIO}
                        </h3>
                        <div className="space-y-4">
                            {topDiseases.slice(0, 5).map((disease, index) => {
                                const colors = [
                                    "bg-blue-500",
                                    "bg-green-500",
                                    "bg-orange-500",
                                    "bg-purple-500",
                                    "bg-pink-500",
                                ];
                                return (
                                    <div key={disease.icdCode}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-[#121417] dark:text-white font-medium truncate max-w-[160px]">
                                                {disease.name}
                                            </span>
                                            <span className="text-[#687582] dark:text-gray-400">
                                                {disease.percentage}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[index]} rounded-full transition-all duration-500`}
                                                style={{ width: `${disease.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Top Diseases Table */}
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl shadow-sm">
                    <div className="p-4 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.DOCTOR.REPORTS.TOP_DISEASES}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        STT
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        Mã ICD-10
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        Tên bệnh
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        Số ca
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        Tỷ lệ
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        Xu hướng
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {topDiseases.map((disease, index) => (
                                    <tr
                                        key={disease.icdCode}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <span
                                                className={`inline-flex items-center justify-center size-7 rounded-full text-xs font-bold ${index < 3
                                                        ? "bg-[#3C81C6]/10 text-[#3C81C6]"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                                    }`}
                                            >
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm font-medium text-[#3C81C6]">
                                                {disease.icdCode}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-[#121417] dark:text-white">
                                                {disease.name}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm font-bold text-[#121417] dark:text-white">
                                                {disease.count}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#3C81C6] rounded-full"
                                                        style={{ width: `${disease.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-[#687582] dark:text-gray-400">
                                                    {disease.percentage}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span
                                                className={`inline-flex items-center gap-1 text-xs font-medium ${disease.trend === "up"
                                                        ? "text-red-600"
                                                        : disease.trend === "down"
                                                            ? "text-green-600"
                                                            : "text-gray-500"
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">
                                                    {disease.trend === "up"
                                                        ? "trending_up"
                                                        : disease.trend === "down"
                                                            ? "trending_down"
                                                            : "trending_flat"}
                                                </span>
                                                {disease.trend === "up"
                                                    ? "Tăng"
                                                    : disease.trend === "down"
                                                        ? "Giảm"
                                                        : "Ổn định"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
