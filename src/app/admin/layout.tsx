import type { Metadata } from "next";
import { AdminSidebar } from "@/components/shared/admin-sidebar";
import { AdminHeader } from "@/components/shared/admin-header";

export const metadata: Metadata = {
    title: "E-Health Admin",
    description: "Hệ thống quản trị Y tế Số",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-gray-100 font-display overflow-hidden h-screen flex">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f7f8] dark:bg-[#13191f] relative">
                {/* Header */}
                <AdminHeader />

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-[1440px] mx-auto space-y-8 pb-10">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
