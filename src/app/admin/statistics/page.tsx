"use client";

import { useEffect, useMemo, useState } from "react";
import {
    TopDiseasesChart,
    GenderDistribution,
    HourlyVisitsChart,
} from "@/components/admin/dashboard";
import { reportService } from "@/services/reportService";
import {
    emptyDashboardReport,
    emptyRevenueReport,
    type DashboardReportDto,
    type RevenueReportDto,
} from "@/features/admin/reports/reportAdapters";
import { usePageAIContext } from "@/hooks/usePageAIContext";

type Period = "month" | "quarter" | "year";

const EMPTY_SUMMARY = {
    revenue: 0,
    revenueChange: 0,
    patients: 0,
    patientsChange: 0,
    avgVisit: 0,
    visitChange: 0,
    rating: 0,
    ratingTrend: "flat" as const,
};

const DEPT_COLORS = ["#3C81C6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];

const toMillion = (amount: number): number => Math.round(amount / 1_000_000);

const formatCompactRevenue = (amountInMillions: number): string =>
    amountInMillions >= 1000 ? `${(amountInMillions / 1000).toFixed(1)} Tỷ` : `${amountInMillions} Tr`;

export default function StatisticsPage() {
    usePageAIContext({ pageKey: "statistics" });

    const [timeRange, setTimeRange] = useState<Period>("month");
    const [dashboardReport, setDashboardReport] = useState<DashboardReportDto>(emptyDashboardReport());
    const [revenueReport, setRevenueReport] = useState<RevenueReportDto>(emptyRevenueReport());

    useEffect(() => {
        let active = true;

        Promise.all([
            reportService.getDashboard(),
            reportService.getRevenue({ period: timeRange }),
        ])
            .then(([dashboard, revenue]) => {
                if (!active) {
                    return;
                }

                setDashboardReport(dashboard);
                setRevenueReport(revenue);
            })
            .catch(() => {
                if (!active) {
                    return;
                }

                setDashboardReport(emptyDashboardReport());
                setRevenueReport(emptyRevenueReport());
            });

        return () => {
            active = false;
        };
    }, [timeRange]);

    const summary = useMemo(() => ({
        revenue: toMillion(dashboardReport.stats.totalRevenue),
        revenueChange: dashboardReport.stats.revenueChange,
        patients: dashboardReport.overview.totalPatients,
        patientsChange: dashboardReport.overview.patientChange,
        avgVisit: dashboardReport.overview.avgDailyVisits,
        visitChange: dashboardReport.overview.visitChange,
        rating: dashboardReport.overview.rating,
        ratingTrend: dashboardReport.overview.ratingTrend,
    }), [dashboardReport]);

    const chartData = useMemo(
        () => revenueReport.chartData.map((item) => ({ label: item.label, value: toMillion(item.value) })),
        [revenueReport]
    );

    const departments = useMemo(
        () => revenueReport.byDepartment.map((department, index) => ({
            name: department.departmentName,
            patients: department.patientCount,
            revenue: toMillion(department.revenue),
            color: DEPT_COLORS[index % DEPT_COLORS.length],
        })),
        [revenueReport]
    );

    const topDoctors = useMemo(
        () => revenueReport.topDoctors.map((doctor) => ({
            name: doctor.name,
            dept: doctor.departmentName,
            patients: doctor.patientCount,
            revenue: toMillion(doctor.revenue),
        })),
        [revenueReport]
    );

    const totalPatients = departments.reduce((sum, department) => sum + department.patients, 0);
    const maxChartValue = chartData.length > 0 ? Math.max(...chartData.map((item) => item.value)) : 0;

    const periodLabel = timeRange === "month" ? "tháng trước" : timeRange === "quarter" ? "quý trước" : "năm trước";
    const chartTitle = timeRange === "month"
        ? "Doanh thu theo tháng (Triệu VND)"
        : timeRange === "quarter"
            ? "Doanh thu theo quý (Triệu VND)"
            : "Doanh thu theo năm (Triệu VND)";

    const handleExport = () => {
        const periodName = timeRange === "month" ? "THÁNG" : timeRange === "quarter" ? "QUÝ" : "NĂM";
        const lines = [
            `BÁO CÁO THỐNG KÊ - THEO ${periodName}`,
            `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`,
            "",
            `Tổng doanh thu: ${summary.revenue} Triệu VND`,
            `Tổng bệnh nhân: ${summary.patients.toLocaleString("vi-VN")}`,
            `Lượt khám TB/ngày: ${summary.avgVisit}`,
            `Đánh giá trung bình: ${summary.rating}/5`,
            "",
            "DOANH THU CHI TIẾT",
            "Kỳ,Doanh thu (Triệu VND)",
            ...chartData.map((item) => `${item.label},${item.value}`),
            "",
            "PHÂN BỔ THEO KHOA",
            "Khoa,Bệnh nhân,Doanh thu (Triệu VND)",
            ...departments.map((department) => `${department.name},${department.patients},${department.revenue}`),
            "",
            "TOP BÁC SĨ",
            "Bác sĩ,Khoa,Bệnh nhân,Doanh thu (Triệu VND)",
            ...topDoctors.map((doctor) => `${doctor.name},${doctor.dept},${doctor.patients},${doctor.revenue}`),
        ];
        const csv = lines.join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `thongke_${timeRange}_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                        Thống kê và Báo cáo
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400">
                        Tổng quan hoạt động và hiệu suất phòng khám
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                        {(["month", "quarter", "year"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${timeRange === range ? "bg-[#3C81C6] text-white" : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}
                            >
                                {range === "month" ? "Tháng" : range === "quarter" ? "Quý" : "Năm"}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 rounded-xl border border-[#dde0e4] bg-white px-5 py-2.5 text-sm font-bold text-[#121417] shadow-sm transition-colors hover:bg-gray-50 dark:border-[#2d353e] dark:bg-[#1e242b] dark:text-white dark:hover:bg-gray-800"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-[#3C81C6]/20 bg-gradient-to-r from-[#3C81C6]/5 to-indigo-500/5 p-4 dark:border-[#3C81C6]/30">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3C81C6] to-indigo-600 shadow-md shadow-[#3C81C6]/20">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>auto_awesome</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-[#121417] dark:text-white">
                        AI phân tích thống kê
                        <span className="rounded-md bg-[#3C81C6] px-1.5 py-0.5 text-[10px] font-bold text-white">AI</span>
                    </p>
                    <p className="text-sm leading-relaxed text-[#374151] dark:text-[#d1d5db]">
                        Doanh thu hiện tại đang ở mức {formatCompactRevenue(summary.revenue)}. Mức tăng trưởng là {summary.revenueChange}%,
                        tổng bệnh nhân là {summary.patients.toLocaleString("vi-VN")}. Các widget AI mở rộng sẽ được bổ sung khi có thêm nguồn dữ liệu.
                    </p>
                </div>
                <span className="whitespace-nowrap text-xs text-[#687582]">AI phân tích</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                    label="Tổng doanh thu"
                    value={formatCompactRevenue(summary.revenue)}
                    change={`${summary.revenueChange >= 0 ? "+" : ""}${summary.revenueChange}% so với ${periodLabel}`}
                    changeColor={summary.revenueChange >= 0 ? "text-green-600" : "text-red-500"}
                    icon="payments"
                    iconBg="bg-green-50 dark:bg-green-900/20"
                    iconColor="text-green-600"
                    trendIcon={summary.revenueChange >= 0 ? "trending_up" : "trending_down"}
                />
                <SummaryCard
                    label="Tổng bệnh nhân"
                    value={summary.patients.toLocaleString("vi-VN")}
                    change={`${summary.patientsChange >= 0 ? "+" : ""}${summary.patientsChange}% so với ${periodLabel}`}
                    changeColor={summary.patientsChange >= 0 ? "text-blue-600" : "text-red-500"}
                    icon="group"
                    iconBg="bg-blue-50 dark:bg-blue-900/20"
                    iconColor="text-blue-600"
                    trendIcon={summary.patientsChange >= 0 ? "trending_up" : "trending_down"}
                />
                <SummaryCard
                    label="Lượt khám TB/ngày"
                    value={summary.avgVisit.toString()}
                    change={`${summary.visitChange >= 0 ? "+" : ""}${summary.visitChange}% so với ${periodLabel}`}
                    changeColor={summary.visitChange >= 0 ? "text-orange-600" : "text-red-500"}
                    icon="vital_signs"
                    iconBg="bg-orange-50 dark:bg-orange-900/20"
                    iconColor="text-orange-600"
                    trendIcon={summary.visitChange >= 0 ? "trending_up" : "trending_down"}
                />
                <SummaryCard
                    label="Đánh giá trung bình"
                    value={`${summary.rating}/5`}
                    change={summary.ratingTrend === "up" ? "+0.1 so với kỳ trước" : summary.ratingTrend === "down" ? "-0.1 so với kỳ trước" : "Ổn định"}
                    changeColor={summary.ratingTrend === "down" ? "text-red-500" : "text-yellow-600"}
                    icon="star"
                    iconBg="bg-yellow-50 dark:bg-yellow-900/20"
                    iconColor="text-yellow-600"
                    trendIcon={summary.ratingTrend === "down" ? "trending_down" : summary.ratingTrend === "up" ? "trending_up" : "trending_flat"}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <TopDiseasesChart />
                <GenderDistribution />
                <HourlyVisitsChart />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-[#dde0e4] bg-white p-6 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b] lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white">{chartTitle}</h3>
                        <span className="rounded-lg bg-gray-50 px-2 py-1 text-xs text-[#687582] dark:bg-gray-800">
                            Tổng: {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString("vi-VN")} Tr
                        </span>
                    </div>
                    {chartData.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center text-center">
                            <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                            <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                        </div>
                    ) : (
                        <div className="flex h-64 items-end justify-between gap-2">
                            {chartData.map((item, index) => (
                                <div key={item.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                                    <div className="relative w-full">
                                        <div
                                            className={`w-full rounded-t transition-all duration-500 ${index === chartData.length - 1 ? "bg-gradient-to-t from-[#3C81C6] to-[#60a5fa]" : "bg-[#3C81C6]/25 group-hover:bg-[#3C81C6]/60"}`}
                                            style={{ height: `${maxChartValue > 0 ? (item.value / maxChartValue) * 200 : 0}px` }}
                                        >
                                            <div className="absolute left-1/2 top-[-2rem] z-10 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-700">
                                                {item.value.toLocaleString("vi-VN")} Tr
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-400">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-[#dde0e4] bg-white p-6 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <h3 className="mb-6 text-lg font-bold text-[#121417] dark:text-white">Phân bổ theo khoa</h3>
                    <div className="space-y-4">
                        {departments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                                <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                            </div>
                        ) : departments.map((department) => (
                            <div key={department.name} className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-[#121417] dark:text-white">{department.name}</span>
                                    <span className="text-[#687582]">{department.patients.toLocaleString("vi-VN")} BN</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${totalPatients > 0 ? (department.patients / totalPatients) * 100 : 0}%`, backgroundColor: department.color }}
                                    />
                                </div>
                                <p className="text-[10px] text-[#687582]">Doanh thu: {department.revenue} Tr</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                <div className="flex items-center justify-between border-b border-[#dde0e4] p-6 dark:border-[#2d353e]">
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                        Bác sĩ có hiệu suất cao nhất
                        <span className="ml-2 text-xs font-normal text-[#687582]">
                            ({timeRange === "month" ? "Tháng này" : timeRange === "quarter" ? "Quý này" : "Năm này"})
                        </span>
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-[#dde0e4] bg-gray-50/50 dark:border-[#2d353e] dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase text-[#687582] dark:text-gray-400">Xếp hạng</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase text-[#687582] dark:text-gray-400">Bác sĩ</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase text-[#687582] dark:text-gray-400">Khoa</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase text-[#687582] dark:text-gray-400">Bệnh nhân</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase text-[#687582] dark:text-gray-400">Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {topDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                                            <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : topDoctors.map((doctor, index) => (
                                <tr key={`${doctor.name}-${doctor.dept}`} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? "bg-yellow-100 text-yellow-700" : index === 1 ? "bg-gray-100 text-gray-600" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-500"}`}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3C81C6]/10 text-[#3C81C6]">
                                                <span className="material-symbols-outlined">person</span>
                                            </div>
                                            <span className="text-sm font-bold text-[#121417] dark:text-white">{doctor.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#687582] dark:text-gray-400">{doctor.dept}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-[#121417] dark:text-white">{doctor.patients}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[18px] text-emerald-600">payments</span>
                                            <span className="text-sm font-medium text-[#121417] dark:text-white">{doctor.revenue} Tr</span>
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

function SummaryCard({ label, value, change, changeColor, icon, iconBg, iconColor, trendIcon }: {
    label: string;
    value: string;
    change: string;
    changeColor: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    trendIcon: string;
}) {
    return (
        <div className="rounded-xl border border-[#dde0e4] bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-[#687582] dark:text-gray-400">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-[#121417] dark:text-white">{value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
            </div>
            <div className={`mt-3 flex items-center text-xs ${changeColor}`}>
                <span className="material-symbols-outlined mr-1 text-[14px]">{trendIcon}</span>
                {change}
            </div>
        </div>
    );
}
