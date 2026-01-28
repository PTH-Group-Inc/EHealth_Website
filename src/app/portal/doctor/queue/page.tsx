"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { UI_TEXT } from "@/constants/ui-text";
import { ROUTES } from "@/constants/routes";
import { MOCK_PATIENT_QUEUE, MOCK_QUEUE_STATS } from "@/lib/mock-data/doctor";

type QueueStatus = "all" | "waiting" | "examining" | "completed" | "cancelled";

export default function QueuePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<QueueStatus>("all");
    const [queue, setQueue] = useState(MOCK_PATIENT_QUEUE);
    const stats = MOCK_QUEUE_STATS;

    const filteredQueue = useMemo(() => {
        return queue.filter((patient) => {
            const matchesSearch =
                searchQuery === "" ||
                patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                patient.phone.includes(searchQuery);

            const matchesStatus =
                statusFilter === "all" || patient.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [queue, searchQuery, statusFilter]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "examining":
                return {
                    bg: "bg-green-100 dark:bg-green-900/30",
                    text: "text-green-700 dark:text-green-400",
                    label: "Đang khám",
                    dot: "bg-green-500",
                };
            case "waiting":
                return {
                    bg: "bg-orange-100 dark:bg-orange-900/30",
                    text: "text-orange-700 dark:text-orange-400",
                    label: "Chờ khám",
                    dot: "bg-orange-500",
                };
            case "completed":
                return {
                    bg: "bg-blue-100 dark:bg-blue-900/30",
                    text: "text-blue-700 dark:text-blue-400",
                    label: "Hoàn thành",
                    dot: "bg-blue-500",
                };
            case "cancelled":
                return {
                    bg: "bg-gray-100 dark:bg-gray-700",
                    text: "text-gray-600 dark:text-gray-400",
                    label: "Đã hủy",
                    dot: "bg-gray-400",
                };
            default:
                return {
                    bg: "bg-gray-100",
                    text: "text-gray-600",
                    label: status,
                    dot: "bg-gray-400",
                };
        }
    };

    const handleCallPatient = (patientId: string) => {
        alert(`Đang gọi bệnh nhân ${patientId}...`);
    };

    const handleStartExam = (patientId: string) => {
        setQueue((prev) =>
            prev.map((p) =>
                p.id === patientId ? { ...p, status: "examining" } : p
            )
        );
    };

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.DOCTOR.QUEUE.TITLE}
                        </h2>
                        <p className="text-sm text-[#687582] dark:text-gray-400">
                            {UI_TEXT.DOCTOR.QUEUE.SUBTITLE}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={ROUTES.PORTAL.DOCTOR.EXAMINATION}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                stethoscope
                            </span>
                            Vào phòng khám
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Remaining */}
                    <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#3C81C6]">
                                    format_list_numbered
                                </span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#121417] dark:text-white">
                                    {stats.remaining}
                                    <span className="text-sm text-[#94a3b8] font-medium">
                                        /{stats.total}
                                    </span>
                                </p>
                                <p className="text-xs text-[#687582] dark:text-gray-400">
                                    {UI_TEXT.DOCTOR.QUEUE.REMAINING_PATIENTS}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Waiting */}
                    <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-orange-500">
                                    hourglass_empty
                                </span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#121417] dark:text-white">
                                    {stats.waiting}
                                </p>
                                <p className="text-xs text-[#687582] dark:text-gray-400">
                                    {UI_TEXT.DOCTOR.QUEUE.WAITING}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Examining */}
                    <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-600">
                                    local_hospital
                                </span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#121417] dark:text-white">
                                    {stats.examining}
                                </p>
                                <p className="text-xs text-[#687582] dark:text-gray-400">
                                    {UI_TEXT.DOCTOR.QUEUE.EXAMINING}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Completed */}
                    <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600">
                                    task_alt
                                </span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#121417] dark:text-white">
                                    {stats.completed}
                                </p>
                                <p className="text-xs text-[#687582] dark:text-gray-400">
                                    {UI_TEXT.DOCTOR.QUEUE.COMPLETED}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Avg Wait Time */}
                    <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-600">
                                    timer
                                </span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#121417] dark:text-white">
                                    ~{stats.avgWaitTime}p
                                </p>
                                <p className="text-xs text-[#687582] dark:text-gray-400">
                                    {UI_TEXT.DOCTOR.QUEUE.AVG_WAIT_TIME}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Queue Table */}
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl shadow-sm">
                    {/* Table Header */}
                    <div className="p-4 border-b border-[#e5e7eb] dark:border-[#2d353e] flex flex-col md:flex-row justify-between gap-4 items-center">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-72">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                                    <span className="material-symbols-outlined text-[20px]">
                                        search
                                    </span>
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full py-2.5 pl-10 pr-4 text-sm bg-[#f8fafc] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all dark:text-white placeholder:text-gray-400"
                                    placeholder={UI_TEXT.DOCTOR.QUEUE.SEARCH_PLACEHOLDER}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {(["all", "waiting", "examining", "completed"] as QueueStatus[]).map(
                                (status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === status
                                                ? "bg-[#3C81C6] text-white"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                            }`}
                                    >
                                        {status === "all"
                                            ? "Tất cả"
                                            : status === "waiting"
                                                ? "Chờ khám"
                                                : status === "examining"
                                                    ? "Đang khám"
                                                    : "Hoàn thành"}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        STT
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        Thông tin bệnh nhân
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        Check-in
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        Lý do khám
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        Trạng thái
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase text-right">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {filteredQueue.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-12 text-center text-[#687582] dark:text-gray-400"
                                        >
                                            <span className="material-symbols-outlined text-4xl mb-2 block">
                                                search_off
                                            </span>
                                            Không tìm thấy bệnh nhân
                                        </td>
                                    </tr>
                                ) : (
                                    filteredQueue.map((patient) => {
                                        const statusStyle = getStatusStyle(patient.status);
                                        return (
                                            <tr
                                                key={patient.id}
                                                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="py-4 px-6">
                                                    <span
                                                        className={`inline-flex items-center justify-center size-8 rounded-full text-sm font-bold ${patient.status === "examining"
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                            }`}
                                                    >
                                                        {patient.queueNumber}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="size-10 rounded-full bg-cover bg-center border border-gray-200 bg-gray-100"
                                                            style={{
                                                                backgroundImage: patient.avatar
                                                                    ? `url('${patient.avatar}')`
                                                                    : undefined,
                                                            }}
                                                        >
                                                            {!patient.avatar && (
                                                                <div className="size-full flex items-center justify-center text-gray-400">
                                                                    <span className="material-symbols-outlined">
                                                                        person
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#121417] dark:text-white">
                                                                {patient.fullName}
                                                            </p>
                                                            <p className="text-xs text-[#687582] dark:text-gray-400">
                                                                {patient.id} • {patient.gender},{" "}
                                                                {patient.age} tuổi
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-sm text-[#121417] dark:text-gray-200">
                                                        {patient.checkInTime}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-sm text-[#687582] dark:text-gray-400 max-w-xs truncate">
                                                        {patient.reason}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                                                    >
                                                        <span
                                                            className={`size-1.5 rounded-full ${statusStyle.dot}`}
                                                        ></span>
                                                        {statusStyle.label}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {patient.status === "waiting" && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        handleCallPatient(patient.id)
                                                                    }
                                                                    className="p-2 text-[#3C81C6] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                                    title="Gọi bệnh nhân"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">
                                                                        campaign
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleStartExam(patient.id)
                                                                    }
                                                                    className="flex items-center gap-1 px-3 py-1.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-xs font-medium rounded-lg transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">
                                                                        stethoscope
                                                                    </span>
                                                                    Khám
                                                                </button>
                                                            </>
                                                        )}
                                                        {patient.status === "examining" && (
                                                            <Link
                                                                href={`${ROUTES.PORTAL.DOCTOR.EXAMINATION}?patient=${patient.id}`}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">
                                                                    visibility
                                                                </span>
                                                                Tiếp tục
                                                            </Link>
                                                        )}
                                                        {patient.status === "completed" && (
                                                            <button className="p-2 text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                                                <span className="material-symbols-outlined text-[20px]">
                                                                    visibility
                                                                </span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                        <p className="text-sm text-[#687582] dark:text-gray-400">
                            Hiển thị {filteredQueue.length} bệnh nhân
                        </p>
                        <div className="flex items-center gap-2">
                            <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-[20px] text-[#687582]">
                                    chevron_left
                                </span>
                            </button>
                            <span className="px-3 py-1 bg-[#3C81C6] text-white text-sm font-medium rounded-lg">
                                1
                            </span>
                            <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-[20px] text-[#687582]">
                                    chevron_right
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
