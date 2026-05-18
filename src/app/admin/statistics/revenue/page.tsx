"use client";

import { useEffect, useMemo, useState } from "react";
import { reportService } from "@/services/reportService";
import { emptyRevenueReport, type RevenueReportDto } from "@/features/admin/reports/reportAdapters";
import { usePageAIContext } from "@/hooks/usePageAIContext";

type Period = "month" | "quarter" | "year";

interface DeptRevenue {
    dept: string;
    revenue: number;
    patients: number;
    icon: string;
    color: string;
    bg: string;
}

interface ComparisonItem {
    label: string;
    revenue: number;
    target: number;
}

interface TopDoctor {
    rank: number;
    name: string;
    dept: string;
    revenue: number;
    patients: number;
}

interface Summary {
    total: number;
    totalChange: number;
    avgPerDoctor: number;
    avgChange: number;
    totalPatients: number;
    patientChange: number;
}

const EMPTY_SUMMARY: Summary = {
    total: 0,
    totalChange: 0,
    avgPerDoctor: 0,
    avgChange: 0,
    totalPatients: 0,
    patientChange: 0,
};

const DEPT_ICONS: { icon: string; color: string; bg: string }[] = [
    { icon: "cardiology", color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
    { icon: "surgical", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { icon: "child_care", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { icon: "dermatology", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
    { icon: "monitor_heart", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-500/10" },
    { icon: "pregnant_woman", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10" },
];

const toMillion = (amount: number): number => Math.round(amount / 1_000_000);

export default function RevenuePage() {
    usePageAIContext({ pageKey: "statistics" });

    const [period, setPeriod] = useState<Period>("month");
    const [report, setReport] = useState<RevenueReportDto>(emptyRevenueReport());

    useEffect(() => {
        let active = true;
        const now = new Date();
        const dateParams: Record<string, string> = {};

        if (period === "month") {
            const from = new Date(now.getFullYear(), now.getMonth(), 1);
            dateParams.from = from.toISOString().split("T")[0];
            dateParams.to = now.toISOString().split("T")[0];
        } else if (period === "quarter") {
            const quarter = Math.floor(now.getMonth() / 3);
            const from = new Date(now.getFullYear(), quarter * 3, 1);
            dateParams.from = from.toISOString().split("T")[0];
            dateParams.to = now.toISOString().split("T")[0];
        } else {
            dateParams.from = `${now.getFullYear()}-01-01`;
            dateParams.to = now.toISOString().split("T")[0];
        }

        reportService.getRevenue({ period, ...dateParams })
            .then((nextReport) => {
                if (active) {
                    setReport(nextReport);
                }
            })
            .catch(() => {
                if (active) {
                    setReport(emptyRevenueReport());
                }
            });

        return () => {
            active = false;
        };
    }, [period]);

    const summary = useMemo<Summary>(() => ({
        total: toMillion(report.total),
        totalChange: report.growth,
        avgPerDoctor: toMillion(report.avgPerDoctor),
        avgChange: report.avgChange,
        totalPatients: report.totalPatients,
        patientChange: report.patientGrowth,
    }), [report]);

    const deptData = useMemo<DeptRevenue[]>(
        () => report.byDepartment.map((department, index) => ({
            dept: department.departmentName,
            revenue: toMillion(department.revenue),
            patients: department.patientCount,
            icon: DEPT_ICONS[index % DEPT_ICONS.length]?.icon ?? "local_hospital",
            color: DEPT_ICONS[index % DEPT_ICONS.length]?.color ?? "text-blue-500",
            bg: DEPT_ICONS[index % DEPT_ICONS.length]?.bg ?? "bg-blue-50 dark:bg-blue-500/10",
        })),
        [report]
    );

    const comparison = useMemo<ComparisonItem[]>(
        () => report.comparison.map((item) => ({
            label: item.label,
            revenue: toMillion(item.revenue),
            target: toMillion(item.target),
        })),
        [report]
    );

    const doctors = useMemo<TopDoctor[]>(
        () => report.topDoctors.map((doctor, index) => ({
            rank: index + 1,
            name: doctor.name,
            dept: doctor.departmentName,
            revenue: toMillion(doctor.revenue),
            patients: doctor.patientCount,
        })),
        [report]
    );

    const maxDeptRevenue = deptData.length > 0 ? Math.max(...deptData.map((item) => item.revenue)) : 0;
    const maxComparison = useMemo(
        () => comparison.length > 0 ? Math.max(...comparison.map((item) => Math.max(item.revenue, item.target))) : 0,
        [comparison]
    );

    const periodLabel = period === "month" ? "tháng trước" : period === "quarter" ? "quý trước" : "năm trước";
    const comparisonTitle = period === "month" ? "So sánh theo tuần" : period === "quarter" ? "So sánh theo tháng" : "So sánh theo quý";

    const handleExportPDF = () => {
        const periodName = period === "month" ? "THÁNG" : period === "quarter" ? "QUÝ" : "NĂM";
        const lines = [
            `BÁO CÁO DOANH THU - THEO ${periodName}`,
            `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`,
            "",
            `Tổng doanh thu: ${summary.total} Triệu VND`,
            `TB doanh thu/BS: ${summary.avgPerDoctor} Triệu VND`,
            `Tổng bệnh nhân: ${summary.totalPatients}`,
            "",
            "DOANH THU THEO CHUYÊN KHOA",
            "Khoa,Doanh thu (Tr),Bệnh nhân",
            ...deptData.map((item) => `${item.dept},${item.revenue},${item.patients}`),
            "",
            `${comparisonTitle.toUpperCase()}`,
            "Kỳ,Doanh thu (Tr),Mục tiêu (Tr),Đạt",
            ...comparison.map((item) => `${item.label},${item.revenue},${item.target},${item.revenue >= item.target ? "Đạt" : "Chưa đạt"}`),
            "",
            "TOP BÁC SĨ THEO DOANH THU",
            "#,Bác sĩ,Chuyên khoa,Doanh thu (Tr),Bệnh nhân",
            ...doctors.map((doctor) => `${doctor.rank},${doctor.name},${doctor.dept},${doctor.revenue},${doctor.patients}`),
        ];
        const csv = lines.join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `doanhthu_${period}_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-3 flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500">
                    <span className="material-symbols-outlined text-[14px]">home</span>
                    <span>Trang chủ</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span>Thống kê</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span className="font-medium text-[#121417] dark:text-white">Báo cáo doanh thu</span>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-[#121417] dark:text-white">Báo cáo doanh thu</h1>
                        <p className="mt-0.5 text-sm text-[#687582] dark:text-gray-400">Phân tích doanh thu theo khoa, bác sĩ và thời gian</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {([
                            { key: "month" as const, label: "Tháng" },
                            { key: "quarter" as const, label: "Quý" },
                            { key: "year" as const, label: "Năm" },
                        ]).map((option) => (
                            <button
                                key={option.key}
                                onClick={() => setPeriod(option.key)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${period === option.key ? "bg-[#3C81C6] text-white" : "bg-gray-100 text-[#687582] hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"}`}
                            >
                                {option.label}
                            </button>
                        ))}
                        <button
                            onClick={handleExportPDF}
                            className="ml-2 flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-[#687582] transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            Xuất báo cáo
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-[#dde0e4] bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">Tổng doanh thu</p>
                    <p className="text-3xl font-extrabold text-[#121417] dark:text-white">
                        {summary.total >= 1000 ? `${(summary.total / 1000).toFixed(1)}` : summary.total} <span className="text-lg text-[#687582]">{summary.total >= 1000 ? "Tỷ" : "Tr"}</span>
                    </p>
                    <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${summary.totalChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        <span className="material-symbols-outlined text-[14px]">{summary.totalChange >= 0 ? "trending_up" : "trending_down"}</span>
                        {summary.totalChange >= 0 ? "+" : ""}{summary.totalChange}% so với {periodLabel}
                    </div>
                </div>
                <div className="rounded-2xl border border-[#dde0e4] bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">TB doanh thu / BS</p>
                    <p className="text-3xl font-extrabold text-[#121417] dark:text-white">{summary.avgPerDoctor} <span className="text-lg text-[#687582]">Tr</span></p>
                    <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${summary.avgChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        <span className="material-symbols-outlined text-[14px]">{summary.avgChange >= 0 ? "trending_up" : "trending_down"}</span>
                        {summary.avgChange >= 0 ? "+" : ""}{summary.avgChange}% so với {periodLabel}
                    </div>
                </div>
                <div className="rounded-2xl border border-[#dde0e4] bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#687582] dark:text-gray-400">Tổng bệnh nhân</p>
                    <p className="text-3xl font-extrabold text-[#121417] dark:text-white">{summary.totalPatients.toLocaleString("vi-VN")}</p>
                    <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${summary.patientChange >= 0 ? "text-amber-600" : "text-red-500"}`}>
                        <span className="material-symbols-outlined text-[14px]">{summary.patientChange >= 0 ? "trending_up" : "trending_down"}</span>
                        {summary.patientChange >= 0 ? "+" : ""}{summary.patientChange}% so với {periodLabel}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b] lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-[#f0f1f3] px-5 py-4 dark:border-[#2d353e]">
                        <div className="flex items-center gap-2.5">
                            <div className="rounded-lg bg-blue-50 p-1.5 dark:bg-blue-900/20">
                                <span className="material-symbols-outlined text-[20px] text-blue-600">analytics</span>
                            </div>
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white">Doanh thu theo chuyên khoa</h3>
                        </div>
                        <span className="rounded-lg bg-gray-50 px-2 py-1 text-xs text-[#687582] dark:bg-gray-800">
                            {period === "month" ? "Tháng này" : period === "quarter" ? "Quý này" : "Năm này"}
                        </span>
                    </div>
                    <div className="space-y-4 p-5">
                        {deptData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                                <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                            </div>
                        ) : deptData.map((item) => (
                            <div key={item.dept} className="flex items-center gap-4">
                                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                                    <span className={`material-symbols-outlined text-[18px] ${item.color}`}>{item.icon}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white">{item.dept}</p>
                                        <p className="text-sm font-bold text-[#121417] dark:text-white">{item.revenue >= 1000 ? `${(item.revenue / 1000).toFixed(1)} Tỷ` : `${item.revenue} Tr`}</p>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#3C81C6] to-[#60a5fa] transition-all duration-500"
                                            style={{ width: maxDeptRevenue > 0 ? `${(item.revenue / maxDeptRevenue) * 100}%` : "0%" }}
                                        />
                                    </div>
                                    <p className="mt-0.5 text-[10px] text-[#687582] dark:text-gray-500">{item.patients} bệnh nhân</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex items-center gap-2.5 border-b border-[#f0f1f3] px-5 py-4 dark:border-[#2d353e]">
                        <div className="rounded-lg bg-violet-50 p-1.5 dark:bg-violet-900/20">
                            <span className="material-symbols-outlined text-[20px] text-violet-600">compare</span>
                        </div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">{comparisonTitle}</h3>
                    </div>
                    <div className="p-5">
                        {comparison.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                                <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex h-52 items-end gap-3">
                                    {comparison.map((item) => (
                                        <div key={item.label} className="group flex flex-1 flex-col items-center gap-1">
                                            <div className="flex h-40 w-full items-end justify-center gap-1">
                                                <div className="group relative w-5 rounded-t-sm bg-[#3C81C6]/20" style={{ height: `${maxComparison > 0 ? (item.target / maxComparison) * 100 : 0}%` }}>
                                                    <div className="absolute left-1/2 top-[-1.25rem] -translate-x-1/2 whitespace-nowrap text-[8px] text-[#687582] opacity-0 transition-opacity group-hover:opacity-100">
                                                        {item.target}Tr
                                                    </div>
                                                </div>
                                                <div
                                                    className={`w-5 rounded-t-sm ${item.revenue >= item.target ? "bg-gradient-to-t from-emerald-500 to-emerald-400" : "bg-gradient-to-t from-rose-500 to-rose-400"}`}
                                                    style={{ height: `${maxComparison > 0 ? (item.revenue / maxComparison) * 100 : 0}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-[#687582] dark:text-gray-500">{item.label}</span>
                                            <span className={`text-[10px] font-bold ${item.revenue >= item.target ? "text-emerald-600" : "text-red-500"}`}>
                                                {item.revenue >= item.target ? "Đạt" : "Chưa đạt"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center gap-4 border-t border-[#f0f1f3] pt-3 dark:border-[#2d353e]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded-sm bg-[#3C81C6]/20" />
                                        <span className="text-[11px] text-[#687582]">Mục tiêu</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                                        <span className="text-[11px] text-[#687582]">Đạt</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded-sm bg-rose-500" />
                                        <span className="text-[11px] text-[#687582]">Chưa đạt</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                <div className="flex items-center justify-between border-b border-[#f0f1f3] px-5 py-4 dark:border-[#2d353e]">
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-amber-50 p-1.5 dark:bg-amber-900/20">
                            <span className="material-symbols-outlined text-[20px] text-amber-600">emoji_events</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white">Top Bác sĩ theo doanh thu</h3>
                            <p className="text-xs text-[#687582] dark:text-gray-500">
                                {period === "month" ? "Tháng này" : period === "quarter" ? "Quý này" : "Năm này"} - Đơn vị: Triệu VND
                            </p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#f6f7f8] dark:bg-[#13191f]">
                            <tr>
                                <th className="w-16 px-5 py-3 text-center text-xs font-bold uppercase text-[#687582]">#</th>
                                <th className="px-5 py-3 text-left text-xs font-bold uppercase text-[#687582]">Bác sĩ</th>
                                <th className="px-5 py-3 text-left text-xs font-bold uppercase text-[#687582]">Chuyên khoa</th>
                                <th className="px-5 py-3 text-right text-xs font-bold uppercase text-[#687582]">Doanh thu</th>
                                <th className="px-5 py-3 text-right text-xs font-bold uppercase text-[#687582]">Bệnh nhân</th>
                                <th className="px-5 py-3 text-right text-xs font-bold uppercase text-[#687582]">DT/BN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                            {doctors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                                            <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : doctors.map((doctor) => (
                                <tr key={`${doctor.rank}-${doctor.name}`} className="cursor-default transition-colors hover:bg-[#f6f7f8] dark:hover:bg-[#13191f]">
                                    <td className="px-5 py-3 text-center">
                                        {doctor.rank <= 3 ? (
                                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${doctor.rank === 1 ? "bg-amber-500" : doctor.rank === 2 ? "bg-gray-400" : "bg-amber-700"}`}>
                                                {doctor.rank}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-[#687582]">{doctor.rank}</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-sm font-semibold text-[#121417] dark:text-white">{doctor.name}</td>
                                    <td className="px-5 py-3 text-sm text-[#687582] dark:text-gray-400">{doctor.dept}</td>
                                    <td className="px-5 py-3 text-right text-sm font-bold text-[#121417] dark:text-white">{doctor.revenue} Tr</td>
                                    <td className="px-5 py-3 text-right text-sm text-[#687582] dark:text-gray-400">{doctor.patients}</td>
                                    <td className="px-5 py-3 text-right text-sm text-[#687582] dark:text-gray-400">
                                        {doctor.patients > 0 ? (doctor.revenue / doctor.patients).toFixed(1) : "0"} Tr
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
