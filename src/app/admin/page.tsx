"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
    PageHeader,
    StatsCards,
    PatientGrowthChart,
    DepartmentStatus,
    PatientQueue,
    UpcomingAppointments,
    MedicineAlerts,
    RevenueChart,
} from "@/components/admin/dashboard";
import { reportService } from "@/services/reportService";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { AISystemMonitor, AIPredictiveAnalytics, AIStaffingOptimizer, AIRevenueInsight } from "@/components/portal/ai";
import { emptyDashboardReport, type DashboardReportDto } from "@/features/admin/reports/reportAdapters";

export default function AdminDashboard() {
    usePageAIContext({ pageKey: "admin-dashboard" });
    const t = useTranslations("pages.dashboard");
    const [report, setReport] = useState<DashboardReportDto>(emptyDashboardReport());

    useEffect(() => {
        let active = true;

        reportService.getDashboard()
            .then((nextReport) => {
                if (active) {
                    setReport(nextReport);
                }
            })
            .catch(() => {
                if (active) {
                    setReport(emptyDashboardReport());
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const availableRate = Math.max(0, 100 - report.fillRate);

    return (
        <div className="space-y-4">
            <h1 className="sr-only">{t("title")}</h1>
            <PageHeader />
            <StatsCards stats={report.stats} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7"><PatientGrowthChart data={report.patientGrowth} /></div>
                <div className="lg:col-span-5"><RevenueChart data={report.revenueData} /></div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 rounded-2xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex items-center gap-2.5 border-b border-[#f0f1f3] px-5 py-3.5 dark:border-[#2d353e]">
                        <div className="rounded-lg bg-green-50 p-1.5 dark:bg-green-900/20">
                            <span className="material-symbols-outlined text-[20px] text-green-600">timeline</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white">Hoat dong gan day</h3>
                            <p className="text-xs text-[#687582]">Realtime feed</p>
                        </div>
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-green-600">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                            Live
                        </span>
                    </div>
                    <div className="max-h-[320px] divide-y divide-[#f0f1f3] overflow-y-auto dark:divide-[#2d353e]">
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                            <p className="text-sm text-[#687582] dark:text-gray-400">Chua co du lieu</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 rounded-2xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex items-center gap-2.5 border-b border-[#f0f1f3] px-5 py-3.5 dark:border-[#2d353e]">
                        <div className="rounded-lg bg-rose-50 p-1.5 dark:bg-rose-900/20">
                            <span className="material-symbols-outlined text-[20px] text-rose-500">analytics</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white">Top benh ly thang</h3>
                            <p className="text-xs text-[#687582]">Thong ke chan doan</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-5 py-10 text-center">
                        <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Chua co du lieu</p>
                    </div>
                </div>

                <div className="lg:col-span-3 flex flex-col rounded-2xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
                    <div className="flex items-center gap-2.5 border-b border-[#f0f1f3] px-5 py-3.5 dark:border-[#2d353e]">
                        <div className="rounded-lg bg-indigo-50 p-1.5 dark:bg-indigo-900/20">
                            <span className="material-symbols-outlined text-[20px] text-indigo-600">pie_chart</span>
                        </div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Ty le lap day</h3>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5">
                        <div className="relative h-32 w-32">
                            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#f0f1f3" strokeWidth="10" className="dark:stroke-gray-800" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="url(#admin-fill-rate)"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${report.fillRate * 2.64} ${264 - report.fillRate * 2.64}`}
                                />
                                <defs>
                                    <linearGradient id="admin-fill-rate">
                                        <stop stopColor="#3C81C6" />
                                        <stop offset="1" stopColor="#60a5fa" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-[#121417] dark:text-white">{report.fillRate}%</p>
                                    <p className="text-[10px] text-[#687582]">lich da su dung</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-[#121417] dark:text-white">Lich hen hom nay</p>
                            <p className="text-xs text-[#687582]">Muc su dung slot hien tai</p>
                        </div>
                        <div className="mt-auto grid w-full grid-cols-2 gap-2">
                            <div className="rounded-lg bg-[#f6f7f8] p-2 text-center dark:bg-[#13191f]">
                                <p className="text-base font-bold text-emerald-600">{report.fillRate}%</p>
                                <p className="text-[10px] text-[#687582]">Da dat</p>
                            </div>
                            <div className="rounded-lg bg-[#f6f7f8] p-2 text-center dark:bg-[#13191f]">
                                <p className="text-base font-bold text-amber-500">{availableRate}%</p>
                                <p className="text-[10px] text-[#687582]">Con trong</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <PatientQueue data={report.patientQueue} />
                <DepartmentStatus departments={report.departments} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <UpcomingAppointments data={report.upcomingAppointments} />
                <MedicineAlerts data={report.medicineAlerts} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <AISystemMonitor />
                <AIPredictiveAnalytics />
                <AIStaffingOptimizer />
                <AIRevenueInsight />
            </div>
        </div>
    );
}
