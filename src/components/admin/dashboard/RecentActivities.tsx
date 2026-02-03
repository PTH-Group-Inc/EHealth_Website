"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { UI_TEXT } from "@/constants/ui-text";

// Types
interface Activity {
    id: string;
    time: string;
    userName: string;
    userAvatar?: string;
    action: string;
    status: "SUCCESS" | "PENDING" | "FAILED";
}

interface RecentActivitiesProps {
    activities: Activity[];
}

// Status Badge Component
function StatusBadge({ status }: { status: Activity["status"] }) {
    const statusConfig = {
        SUCCESS: {
            className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            label: "Thành công"
        },
        PENDING: {
            className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            label: "Đang xử lý"
        },
        FAILED: {
            className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            label: "Thất bại"
        }
    };

    const config = statusConfig[status];

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
            {config.label}
        </span>
    );
}

// User Avatar Component
function UserAvatar({ userName, userAvatar }: { userName: string; userAvatar?: string }) {
    if (userAvatar) {
        return (
            <div
                className="w-8 h-8 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url('${userAvatar}')` }}
            ></div>
        );
    }

    return (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
            SYS
        </div>
    );
}

// Activity Row Component
function ActivityRow({ activity }: { activity: Activity }) {
    return (
        <tr className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td className="py-4 px-6 text-sm text-[#687582] dark:text-gray-400">
                {activity.time}
            </td>
            <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                    <UserAvatar userName={activity.userName} userAvatar={activity.userAvatar} />
                    <span className="text-sm font-medium text-[#121417] dark:text-white">
                        {activity.userName}
                    </span>
                </div>
            </td>
            <td className="py-4 px-6 text-sm text-[#121417] dark:text-gray-200">
                {activity.action}
            </td>
            <td className="py-4 px-6">
                <StatusBadge status={activity.status} />
            </td>
        </tr>
    );
}

// Table Header Component
function TableHeader() {
    const headers = ["Thời gian", "Người thực hiện", "Hành động", "Trạng thái"];

    return (
        <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
                {headers.map((header) => (
                    <th
                        key={header}
                        className="py-3 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase"
                    >
                        {header}
                    </th>
                ))}
            </tr>
        </thead>
    );
}

// Main Component
export function RecentActivities({ activities }: RecentActivitiesProps) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                    {UI_TEXT.ADMIN.DASHBOARD.RECENT_ACTIVITIES}
                </h3>
                <Link
                    href={ROUTES.ADMIN.ACTIVITY_LOGS}
                    className="text-sm text-[#3C81C6] font-medium hover:underline"
                >
                    {UI_TEXT.COMMON.VIEW_ALL}
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <TableHeader />
                    <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                        {activities.map((activity) => (
                            <ActivityRow key={activity.id} activity={activity} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default RecentActivities;
