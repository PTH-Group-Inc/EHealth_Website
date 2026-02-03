"use client";

import {
    MOCK_DASHBOARD_STATS,
    MOCK_DEPARTMENT_LOADS,
    MOCK_ACTIVITY_LOGS,
    MOCK_PATIENT_GROWTH,
} from "@/lib/mock-data/admin";

// Import dashboard components
import {
    PageHeader,
    StatsCards,
    PatientGrowthChart,
    DepartmentStatus,
    RecentActivities,
} from "@/components/admin/dashboard";

export default function AdminDashboard() {
    const stats = MOCK_DASHBOARD_STATS;
    const departmentLoads = MOCK_DEPARTMENT_LOADS;
    const activities = MOCK_ACTIVITY_LOGS;
    const patientGrowth = MOCK_PATIENT_GROWTH;

    return (
        <>
            {/* Page Header */}
            <PageHeader />

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <PatientGrowthChart data={patientGrowth} />
                <DepartmentStatus departments={departmentLoads} />
            </div>

            {/* Recent Activities Table */}
            <RecentActivities activities={activities} />
        </>
    );
}
