"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { UI_TEXT } from "@/constants/ui-text";

// Types
interface DashboardStats {
    totalRevenue: number;
    revenueChange: number;
    todayVisits: number;
    visitsChange: number;
    doctorsOnDuty: number;
    totalDoctors: number;
    medicineAlerts: number;
}

interface StatsCardsProps {
    stats: DashboardStats;
}

// Utility functions
function formatNumber(num: number): string {
    return num.toLocaleString("vi-VN");
}

function formatCurrency(num: number): string {
    if (num >= 1_000_000_000) {
        return `${(num / 1_000_000_000).toFixed(1)} Tỷ`;
    }
    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(0)} Triệu`;
    }
    return formatNumber(num);
}

// Individual Stat Card Components
function RevenueCard({ totalRevenue, revenueChange }: { totalRevenue: number; revenueChange: number }) {
    return (
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
                        {formatCurrency(totalRevenue)}
                    </h3>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">payments</span>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
                <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                    <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                    {revenueChange}%
                </span>
                <span className="text-xs text-[#687582] dark:text-gray-500">so với tháng trước</span>
            </div>
        </Link>
    );
}

function VisitsCard({ todayVisits, visitsChange }: { todayVisits: number; visitsChange: number }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] p-6 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[#687582] dark:text-gray-400 text-sm font-medium mb-1">
                        {UI_TEXT.ADMIN.DASHBOARD.TODAY_VISITS}
                    </p>
                    <h3 className="text-2xl font-bold text-[#121417] dark:text-white">
                        {formatNumber(todayVisits)}
                    </h3>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                    <span className="material-symbols-outlined">vital_signs</span>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
                <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                    {visitsChange}%
                </span>
                <span className="text-xs text-[#687582] dark:text-gray-500">so với hôm qua</span>
            </div>
        </div>
    );
}

function DoctorsCard({ doctorsOnDuty, totalDoctors }: { doctorsOnDuty: number; totalDoctors: number }) {
    return (
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
                        {doctorsOnDuty}/{totalDoctors}
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
                        +{doctorsOnDuty - 3}
                    </div>
                </div>
                <span className="text-xs text-[#687582] dark:text-gray-500">Đang hoạt động</span>
            </div>
        </Link>
    );
}

function MedicineAlertsCard({ medicineAlerts }: { medicineAlerts: number }) {
    return (
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
                        {String(medicineAlerts).padStart(2, "0")}
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
    );
}

// Main StatsCards Component
export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevenueCard
                totalRevenue={stats.totalRevenue}
                revenueChange={stats.revenueChange}
            />
            <VisitsCard
                todayVisits={stats.todayVisits}
                visitsChange={stats.visitsChange}
            />
            <DoctorsCard
                doctorsOnDuty={stats.doctorsOnDuty}
                totalDoctors={stats.totalDoctors}
            />
            <MedicineAlertsCard
                medicineAlerts={stats.medicineAlerts}
            />
        </div>
    );
}

export default StatsCards;
