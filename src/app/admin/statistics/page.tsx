"use client";

import { useState } from "react";

// Mock data
const MONTHLY_REVENUE = [
    { month: "T1", value: 450 },
    { month: "T2", value: 520 },
    { month: "T3", value: 480 },
    { month: "T4", value: 610 },
    { month: "T5", value: 580 },
    { month: "T6", value: 720 },
    { month: "T7", value: 680 },
    { month: "T8", value: 850 },
    { month: "T9", value: 780 },
    { month: "T10", value: 920 },
    { month: "T11", value: 880 },
    { month: "T12", value: 1050 },
];

const DEPARTMENT_STATS = [
    { name: "Khoa Nội", patients: 1250, revenue: 450, color: "#3C81C6" },
    { name: "Khoa Ngoại", patients: 980, revenue: 520, color: "#22c55e" },
    { name: "Khoa Nhi", patients: 850, revenue: 280, color: "#f59e0b" },
    { name: "Khoa Sản", patients: 720, revenue: 380, color: "#ec4899" },
    { name: "Khoa Tim mạch", patients: 650, revenue: 620, color: "#8b5cf6" },
];

const TOP_DOCTORS = [
    { name: "BS. Nguyễn Văn An", dept: "Khoa Nội", patients: 245, rating: 4.9 },
    { name: "BS. Trần Thị Bình", dept: "Khoa Ngoại", patients: 218, rating: 4.8 },
    { name: "BS. Lê Văn Cường", dept: "Khoa Tim mạch", patients: 195, rating: 4.9 },
    { name: "BS. Phạm Thị Dung", dept: "Khoa Sản", patients: 182, rating: 4.7 },
    { name: "BS. Hoàng Văn Em", dept: "Khoa Nhi", patients: 168, rating: 4.8 },
];

export default function StatisticsPage() {
    const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("year");

    const totalRevenue = MONTHLY_REVENUE.reduce((sum, m) => sum + m.value, 0);
    const totalPatients = DEPARTMENT_STATS.reduce((sum, d) => sum + d.patients, 0);
    const maxRevenue = Math.max(...MONTHLY_REVENUE.map((m) => m.value));

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                        Thống kê & Báo cáo
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400">
                        Tổng quan hoạt động và hiệu suất phòng khám
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {(["month", "quarter", "year"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${timeRange === range ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                            >
                                {range === "month" ? "Tháng" : range === "quarter" ? "Quý" : "Năm"}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#687582] dark:text-gray-400">Tổng doanh thu</p>
                            <p className="text-2xl font-bold text-[#121417] dark:text-white mt-1">{(totalRevenue / 1000).toFixed(1)} Tỷ</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-green-600">
                        <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                        +12.5% so với kỳ trước
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#687582] dark:text-gray-400">Tổng bệnh nhân</p>
                            <p className="text-2xl font-bold text-[#121417] dark:text-white mt-1">{totalPatients.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-blue-600">
                        <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                        +8.3% so với kỳ trước
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#687582] dark:text-gray-400">Lượt khám TB/ngày</p>
                            <p className="text-2xl font-bold text-[#121417] dark:text-white mt-1">156</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                            <span className="material-symbols-outlined">vital_signs</span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-orange-600">
                        <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                        +5.2% so với kỳ trước
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-5 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#687582] dark:text-gray-400">Đánh giá trung bình</p>
                            <p className="text-2xl font-bold text-[#121417] dark:text-white mt-1">4.8/5</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600">
                            <span className="material-symbols-outlined">star</span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-yellow-600">
                        <span className="material-symbols-outlined text-[14px] mr-1">trending_flat</span>
                        Ổn định
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] p-6 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-6">Doanh thu theo tháng (Triệu VND)</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {MONTHLY_REVENUE.map((item, index) => (
                            <div key={item.month} className="group flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <div className="relative w-full">
                                    <div
                                        className={`w-full bg-[#3C81C6] ${index === MONTHLY_REVENUE.length - 1 ? "opacity-100" : "opacity-30"} group-hover:opacity-100 rounded-t transition-all duration-300`}
                                        style={{ height: `${(item.value / maxRevenue) * 200}px` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {item.value} Tr
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">{item.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Department Distribution */}
                <div className="bg-white dark:bg-[#1e242b] p-6 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-6">Phân bố theo khoa</h3>
                    <div className="space-y-4">
                        {DEPARTMENT_STATS.map((dept) => (
                            <div key={dept.name} className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-[#121417] dark:text-white">{dept.name}</span>
                                    <span className="text-[#687582]">{dept.patients} BN</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${(dept.patients / totalPatients) * 100}%`, backgroundColor: dept.color }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Doctors */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white">Bác sĩ có hiệu suất cao nhất</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Xếp hạng</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Bác sĩ</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Khoa</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Bệnh nhân</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Đánh giá</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {TOP_DOCTORS.map((doc, index) => (
                                <tr key={doc.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-sm font-bold ${index === 0 ? "bg-yellow-100 text-yellow-700" : index === 1 ? "bg-gray-100 text-gray-600" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-500"}`}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#3C81C6]/10 flex items-center justify-center text-[#3C81C6]">
                                                <span className="material-symbols-outlined">person</span>
                                            </div>
                                            <span className="text-sm font-bold text-[#121417] dark:text-white">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-[#687582] dark:text-gray-400">{doc.dept}</td>
                                    <td className="py-4 px-6 text-sm font-semibold text-[#121417] dark:text-white">{doc.patients}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-yellow-500 text-[18px]">star</span>
                                            <span className="text-sm font-medium text-[#121417] dark:text-white">{doc.rating}</span>
                                        </div>
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
