"use client";

import Link from "next/link";
import { UI_TEXT } from "@/constants/ui-text";
import { ROUTES } from "@/constants/routes";

// Types
interface DoctorStats {
    todayExams: number;
    totalExamsToday: number;
    progressPercent: number;
    waitingPatients: number;
    avgWaitTime: number;
    personalRevenue: number;
    revenueChange: number;
}

interface DoctorStatsCardsProps {
    stats: DoctorStats;
}

// Utility function
function formatCurrency(num: number): string {
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}tr`;
    }
    return num.toLocaleString("vi-VN");
}

// Individual Card Components
function TodayExamsCard({ stats }: { stats: DoctorStats }) {
    return (
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
    );
}

function WaitingPatientsCard({ stats }: { stats: DoctorStats }) {
    return (
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
    );
}

function RevenueCard({ stats }: { stats: DoctorStats }) {
    return (
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
    );
}

// Main Component
export function DoctorStatsCards({ stats }: DoctorStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TodayExamsCard stats={stats} />
            <WaitingPatientsCard stats={stats} />
            <RevenueCard stats={stats} />
        </div>
    );
}

export default DoctorStatsCards;
