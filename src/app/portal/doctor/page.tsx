"use client";

import {
    MOCK_DOCTOR_DASHBOARD_STATS,
    MOCK_WEEKLY_EXAM_STATS,
    MOCK_TODAY_SCHEDULE,
    MOCK_HOSPITAL_ANNOUNCEMENTS,
} from "@/lib/mock-data/doctor";

// Import dashboard components
import {
    DoctorPageHeader,
    DoctorStatsCards,
    WeeklyStatsChart,
    TodaySchedule,
    HospitalAnnouncements,
} from "@/components/portal/dashboard";

export default function DoctorDashboard() {
    const stats = MOCK_DOCTOR_DASHBOARD_STATS;
    const weeklyStats = MOCK_WEEKLY_EXAM_STATS;
    const schedule = MOCK_TODAY_SCHEDULE;
    const announcements = MOCK_HOSPITAL_ANNOUNCEMENTS;

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <DoctorPageHeader />

                {/* Stats Cards */}
                <DoctorStatsCards stats={stats} />

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <WeeklyStatsChart data={weeklyStats} />
                    <TodaySchedule schedule={schedule} />
                </div>

                {/* Announcements */}
                <HospitalAnnouncements announcements={announcements} />
            </div>
        </div>
    );
}
