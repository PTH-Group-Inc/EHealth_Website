"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface Appointment {
    id: string;
    patientName: string;
    patientAge: number | null;
    doctorName: string;
    department: string;
    time: string;
    date: string;
    status: string;
    type: string;
}

const STATUS_MAP: Record<string, { label: string; dot: string; text: string }> = {
    confirmed: { label: "Đã xác nhận", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
    waiting: { label: "Chờ xác nhận", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
    in_progress: { label: "Đang khám", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
    cancelled: { label: "Đã huỷ", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
};

export function UpcomingAppointments({ data }: { data: Appointment[] }) {
    return (
        <div className="flex flex-col rounded-xl border border-[#dde0e4] bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#1e242b]">
            <div className="flex items-center justify-between border-b border-[#f0f1f3] px-4 py-2.5 dark:border-[#2d353e]">
                <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-blue-50 p-1.5 dark:bg-blue-900/20">
                        <span className="material-symbols-outlined text-[20px] text-blue-600">calendar_month</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white">Lịch hẹn sắp tới</h3>
                        <p className="text-xs text-[#687582] dark:text-gray-500">{data.length} lịch hẹn hôm nay</p>
                    </div>
                </div>
                <Link href={ROUTES.ADMIN.SCHEDULES} className="text-xs font-medium text-[#3C81C6] hover:underline">
                    Xem tất cả
                </Link>
            </div>

            <div className="flex-1 space-y-0 overflow-y-auto p-4">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <span className="material-symbols-outlined mb-2 text-4xl text-gray-300 dark:text-gray-600">inbox</span>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Chưa có dữ liệu</p>
                    </div>
                ) : data.map((appointment, index) => {
                    const status = STATUS_MAP[appointment.status] || STATUS_MAP.waiting;
                    const isLast = index === data.length - 1;

                    return (
                        <div key={appointment.id} className="group flex gap-3">
                            <div className="flex flex-col items-center pt-1">
                                <div className={`z-10 h-2.5 w-2.5 rounded-full ${status.dot} ring-4 ring-white dark:ring-[#1e242b]`} />
                                {!isLast && <div className="mt-1 flex-1 w-[2px] bg-[#e5e7eb] dark:bg-[#2d353e]" />}
                            </div>

                            <div className={`flex-1 ${!isLast ? "pb-4" : "pb-1"}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded bg-[#f6f7f8] px-2 py-0.5 text-xs font-bold text-[#121417] dark:bg-[#13191f] dark:text-white">
                                            {appointment.time}
                                        </span>
                                        <span className={`text-[11px] font-medium ${status.text}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-[#687582] dark:bg-gray-800 dark:text-gray-400">
                                        {appointment.type}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm font-medium text-[#121417] dark:text-white">
                                    {appointment.patientName}
                                    <span className="font-normal text-[#687582] dark:text-gray-500"> ({appointment.patientAge ?? "--"} tuổi)</span>
                                </p>
                                <p className="mt-0.5 text-xs text-[#687582] dark:text-gray-500">
                                    {appointment.doctorName} • {appointment.department}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default UpcomingAppointments;
