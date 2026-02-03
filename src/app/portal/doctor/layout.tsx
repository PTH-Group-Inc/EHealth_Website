import type { Metadata } from "next";
import { DoctorSidebar } from "@/components/shared/doctor-sidebar";
import { DoctorHeader } from "@/components/shared/doctor-header";

export const metadata: Metadata = {
    title: "Cổng thông tin Bác sĩ - E-Health",
    description: "Hệ thống quản lý y tế số dành cho bác sĩ",
};

export default function DoctorPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-gray-100 font-display overflow-hidden h-screen flex">
            {/* Sidebar */}
            <DoctorSidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#13191f] relative">
                {/* Header */}
                <DoctorHeader />

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
