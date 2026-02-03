"use client";

import { useState } from "react";
import { UI_TEXT } from "@/constants/ui-text";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { AddScheduleModal } from "@/features/schedules/components/add-schedule-modal";

interface Schedule {
    id: string;
    doctorId: string;
    doctorName: string;
    department: string;
    shift: "MORNING" | "AFTERNOON" | "NIGHT";
    date: string;
    status: "SCHEDULED" | "ON_DUTY" | "COMPLETED" | "ABSENT";
}

const SHIFTS = {
    MORNING: { label: "Ca sáng", time: "7:00 - 12:00", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" },
    AFTERNOON: { label: "Ca chiều", time: "13:00 - 18:00", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
    NIGHT: { label: "Ca đêm", time: "19:00 - 7:00", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
};

const STATUS_STYLES = {
    SCHEDULED: { label: "Đã lên lịch", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300" },
    ON_DUTY: { label: "Đang trực", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
    COMPLETED: { label: "Hoàn thành", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
    ABSENT: { label: "Vắng mặt", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
};

// Generate mock schedules
const generateMockSchedules = (): Schedule[] => {
    const doctors = [
        { id: "1", name: "BS. Nguyễn Văn An", dept: "Khoa Nội" },
        { id: "2", name: "BS. Trần Thị Bình", dept: "Khoa Ngoại" },
        { id: "3", name: "BS. Lê Văn Cường", dept: "Khoa Nhi" },
        { id: "4", name: "BS. Phạm Thị Dung", dept: "Khoa Sản" },
        { id: "5", name: "BS. Hoàng Văn Em", dept: "Khoa Tim mạch" },
    ];
    const today = new Date();
    const schedules: Schedule[] = [];

    for (let i = -3; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        doctors.forEach((doc, idx) => {
            const shifts: ("MORNING" | "AFTERNOON" | "NIGHT")[] = ["MORNING", "AFTERNOON", "NIGHT"];
            const shift = shifts[(idx + i) % 3];
            const status = i < 0 ? (Math.random() > 0.1 ? "COMPLETED" : "ABSENT") : i === 0 ? "ON_DUTY" : "SCHEDULED";

            schedules.push({
                id: `${doc.id}-${dateStr}`,
                doctorId: doc.id,
                doctorName: doc.name,
                department: doc.dept,
                shift,
                date: dateStr,
                status: status as Schedule["status"],
            });
        });
    }
    return schedules;
};

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>(generateMockSchedules());
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [viewMode, setViewMode] = useState<"day" | "week">("day");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredSchedules = schedules.filter((s) => {
        if (viewMode === "day") return s.date === selectedDate;
        // Week view: show current week
        const scheduleDate = new Date(s.date);
        const selected = new Date(selectedDate);
        const weekStart = new Date(selected);
        weekStart.setDate(selected.getDate() - selected.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return scheduleDate >= weekStart && scheduleDate <= weekEnd;
    });

    const stats = {
        totalToday: schedules.filter((s) => s.date === selectedDate).length,
        onDuty: schedules.filter((s) => s.date === selectedDate && s.status === "ON_DUTY").length,
        morning: schedules.filter((s) => s.date === selectedDate && s.shift === "MORNING").length,
        afternoon: schedules.filter((s) => s.date === selectedDate && s.shift === "AFTERNOON").length,
        night: schedules.filter((s) => s.date === selectedDate && s.shift === "NIGHT").length,
    };

    const handleAddSchedule = (scheduleData: Omit<Schedule, "id" | "status">) => {
        const newSchedule: Schedule = {
            ...scheduleData,
            id: `new-${Date.now()}`,
            status: "SCHEDULED",
        };
        setSchedules((prev) => [...prev, newSchedule]);
    };

    const handleDeleteSchedule = (scheduleId: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa lịch trực này?")) {
            setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
        }
    };

    const handleChangeStatus = (scheduleId: string, newStatus: Schedule["status"]) => {
        setSchedules((prev) =>
            prev.map((s) => (s.id === scheduleId ? { ...s, status: newStatus } : s))
        );
    };

    const handleExport = () => {
        const headers = ["Bác sĩ", "Khoa", "Ngày", "Ca trực", "Giờ", "Trạng thái"];
        const rows = filteredSchedules.map((s) => [
            s.doctorName,
            s.department,
            new Date(s.date).toLocaleDateString("vi-VN"),
            SHIFTS[s.shift].label,
            SHIFTS[s.shift].time,
            STATUS_STYLES[s.status].label,
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `schedules_${selectedDate}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                        Quản lý Lịch trực
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400">
                        Phân công và theo dõi lịch trực của bác sĩ
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Xuất lịch
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        Thêm lịch trực
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="py-2.5 px-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                    />
                    <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button
                            onClick={() => setViewMode("day")}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "day" ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                        >
                            Ngày
                        </button>
                        <button
                            onClick={() => setViewMode("week")}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "week" ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                        >
                            Tuần
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                        <span className="text-gray-600 dark:text-gray-400">Sáng: {stats.morning}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                        <span className="text-gray-600 dark:text-gray-400">Chiều: {stats.afternoon}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full bg-purple-400"></span>
                        <span className="text-gray-600 dark:text-gray-400">Đêm: {stats.night}</span>
                    </div>
                </div>
            </div>

            {/* Schedule Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Bác sĩ</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Khoa</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Ngày</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Ca trực</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Trạng thái</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase text-right">{UI_TEXT.COMMON.ACTIONS}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {filteredSchedules.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">event_busy</span>
                                        Không có lịch trực trong khoảng thời gian này
                                    </td>
                                </tr>
                            ) : (
                                filteredSchedules.map((schedule) => {
                                    const shiftInfo = SHIFTS[schedule.shift];
                                    const statusInfo = STATUS_STYLES[schedule.status];
                                    return (
                                        <tr key={schedule.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#3C81C6]/10 flex items-center justify-center text-[#3C81C6]">
                                                        <span className="material-symbols-outlined">person</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-[#121417] dark:text-white">{schedule.doctorName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-[#687582] dark:text-gray-400">{schedule.department}</td>
                                            <td className="py-4 px-6 text-sm text-[#121417] dark:text-white">
                                                {new Date(schedule.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${shiftInfo.color}`}>
                                                    {shiftInfo.label}
                                                    <span className="text-[10px] opacity-70">({shiftInfo.time})</span>
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <DropdownMenu
                                                    items={[
                                                        {
                                                            label: "Đánh dấu hoàn thành",
                                                            icon: "check_circle",
                                                            onClick: () => handleChangeStatus(schedule.id, "COMPLETED"),
                                                        },
                                                        {
                                                            label: "Đánh dấu vắng mặt",
                                                            icon: "cancel",
                                                            onClick: () => handleChangeStatus(schedule.id, "ABSENT"),
                                                        },
                                                        {
                                                            label: "Xóa lịch",
                                                            icon: "delete",
                                                            onClick: () => handleDeleteSchedule(schedule.id),
                                                            variant: "danger",
                                                        },
                                                    ]}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Schedule Modal */}
            <AddScheduleModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddSchedule}
                initialDate={selectedDate}
            />
        </>
    );
}
