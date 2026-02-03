"use client";

import { UI_TEXT } from "@/constants/ui-text";

// Types
interface Announcement {
    id: string;
    type: string;
    title: string;
    content: string;
    time: string;
    department: string;
}

interface HospitalAnnouncementsProps {
    announcements: Announcement[];
}

// Announcement Card Component
function AnnouncementCard({ announcement }: { announcement: Announcement }) {
    const isUrgent = announcement.type === "urgent";

    return (
        <div
            className={`p-4 rounded-lg flex gap-3 items-start cursor-pointer hover:shadow-md transition-shadow ${isUrgent
                ? "bg-[#FFF4F2] border border-red-100"
                : "bg-[#f0f9ff] border border-blue-100"
                }`}
        >
            <span
                className={`bg-white p-1.5 rounded-full shadow-sm material-symbols-outlined text-lg ${isUrgent ? "text-red-500" : "text-[#3C81C6]"
                    }`}
            >
                {isUrgent ? "priority_high" : "info"}
            </span>
            <div>
                <h4 className="text-sm font-bold text-[#121417] dark:text-gray-900 mb-1">
                    {announcement.title}
                </h4>
                <p className="text-xs text-[#687582] line-clamp-2">
                    {announcement.content}
                </p>
                <span className="text-[10px] font-medium text-[#687582] mt-2 block">
                    {announcement.time} • {announcement.department}
                </span>
            </div>
        </div>
    );
}

// Main Component
export function HospitalAnnouncements({ announcements }: HospitalAnnouncementsProps) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">campaign</span>
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                        {UI_TEXT.DOCTOR.DASHBOARD.HOSPITAL_ANNOUNCEMENTS}
                    </h3>
                </div>
                <button className="text-sm text-[#687582] dark:text-gray-400 hover:text-[#3C81C6]">
                    Đánh dấu đã đọc
                </button>
            </div>

            {/* Announcements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map((announcement) => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
            </div>
        </div>
    );
}

export default HospitalAnnouncements;
