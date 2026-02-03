"use client";

import { useState, useMemo } from "react";
import { UI_TEXT } from "@/constants/ui-text";

interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    userRole: string;
    action: string;
    target?: string;
    ipAddress: string;
    userAgent: string;
    status: "SUCCESS" | "FAILED" | "WARNING";
    timestamp: string;
}

const MOCK_LOGS: ActivityLog[] = [
    { id: "1", userId: "1", userName: "Admin Hệ thống", userRole: "Admin", action: "Đăng nhập hệ thống", ipAddress: "192.168.1.100", userAgent: "Chrome/Windows", status: "SUCCESS", timestamp: "2024-01-15T09:30:00" },
    { id: "2", userId: "2", userName: "BS. Nguyễn Văn An", userRole: "Doctor", action: "Xem hồ sơ bệnh nhân", target: "Trần Văn B", ipAddress: "192.168.1.105", userAgent: "Safari/MacOS", status: "SUCCESS", timestamp: "2024-01-15T09:25:00" },
    { id: "3", userId: "3", userName: "Đào Thị C", userRole: "Receptionist", action: "Tạo lịch hẹn mới", target: "Lê Văn D - Khoa Nội", ipAddress: "192.168.1.102", userAgent: "Firefox/Windows", status: "SUCCESS", timestamp: "2024-01-15T09:20:00" },
    { id: "4", userId: "4", userName: "Phạm Văn E", userRole: "Pharmacist", action: "Xuất thuốc theo đơn", target: "ĐT-2024-0125", ipAddress: "192.168.1.108", userAgent: "Chrome/Windows", status: "SUCCESS", timestamp: "2024-01-15T09:15:00" },
    { id: "5", userId: "1", userName: "Admin Hệ thống", userRole: "Admin", action: "Sửa đổi quyền người dùng", target: "Nhóm: Bác sĩ", ipAddress: "192.168.1.100", userAgent: "Chrome/Windows", status: "WARNING", timestamp: "2024-01-15T09:10:00" },
    { id: "6", userId: "5", userName: "Hacker Test", userRole: "Unknown", action: "Cố gắng truy cập trái phép", target: "/admin/settings", ipAddress: "45.33.32.156", userAgent: "Unknown", status: "FAILED", timestamp: "2024-01-15T09:05:00" },
    { id: "7", userId: "2", userName: "BS. Nguyễn Văn An", userRole: "Doctor", action: "Cập nhật chẩn đoán", target: "BN-2024-0458", ipAddress: "192.168.1.105", userAgent: "Safari/MacOS", status: "SUCCESS", timestamp: "2024-01-15T09:00:00" },
    { id: "8", userId: "1", userName: "Admin Hệ thống", userRole: "Admin", action: "Thêm người dùng mới", target: "BS. Trần Thị F", ipAddress: "192.168.1.100", userAgent: "Chrome/Windows", status: "SUCCESS", timestamp: "2024-01-15T08:55:00" },
    { id: "9", userId: "3", userName: "Đào Thị C", userRole: "Receptionist", action: "Hủy lịch hẹn", target: "LH-2024-0892", ipAddress: "192.168.1.102", userAgent: "Firefox/Windows", status: "SUCCESS", timestamp: "2024-01-15T08:50:00" },
    { id: "10", userId: "4", userName: "Phạm Văn E", userRole: "Pharmacist", action: "Cập nhật tồn kho", target: "Paracetamol 500mg", ipAddress: "192.168.1.108", userAgent: "Chrome/Windows", status: "SUCCESS", timestamp: "2024-01-15T08:45:00" },
];

const STATUS_STYLES = {
    SUCCESS: { label: "Thành công", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: "check_circle" },
    FAILED: { label: "Thất bại", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: "cancel" },
    WARNING: { label: "Cảnh báo", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: "warning" },
};

export default function ActivityLogsPage() {
    const [logs] = useState<ActivityLog[]>(MOCK_LOGS);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesSearch =
                searchQuery === "" ||
                log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.target && log.target.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === "all" || log.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [logs, searchQuery, statusFilter]);

    const stats = {
        total: logs.length,
        success: logs.filter((l) => l.status === "SUCCESS").length,
        failed: logs.filter((l) => l.status === "FAILED").length,
        warning: logs.filter((l) => l.status === "WARNING").length,
    };

    const handleExport = () => {
        const headers = ["Thời gian", "Người dùng", "Vai trò", "Hành động", "Đối tượng", "IP", "Trạng thái"];
        const rows = filteredLogs.map((l) => [
            l.timestamp,
            l.userName,
            l.userRole,
            l.action,
            l.target || "-",
            l.ipAddress,
            l.status,
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `activity_logs_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                        Nhật ký hoạt động
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400">
                        Theo dõi và kiểm tra các hoạt động trong hệ thống
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Xuất nhật ký
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">history</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Tổng hoạt động</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stats.total}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                        <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Thành công</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stats.success}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600">
                        <span className="material-symbols-outlined">warning</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Cảnh báo</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stats.warning}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                        <span className="material-symbols-outlined">cancel</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">Thất bại</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stats.failed}</p>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                {/* Filters */}
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative w-full sm:w-72">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400"
                                placeholder="Tìm kiếm hoạt động..."
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="py-2.5 pl-3 pr-10 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 text-[#687582] dark:text-gray-400 cursor-pointer"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="SUCCESS">Thành công</option>
                            <option value="WARNING">Cảnh báo</option>
                            <option value="FAILED">Thất bại</option>
                        </select>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="py-2.5 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none dark:text-white"
                            placeholder="Từ ngày"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="py-2.5 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none dark:text-white"
                            placeholder="Đến ngày"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                            setDateFrom("");
                            setDateTo("");
                        }}
                        className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-[#687582] transition-colors"
                        title="Xóa bộ lọc"
                    >
                        <span className="material-symbols-outlined text-[20px]">filter_list_off</span>
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Thời gian</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Người dùng</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Hành động</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Đối tượng</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">IP</th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                                        {UI_TEXT.TABLE.NO_RESULTS}
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const statusInfo = STATUS_STYLES[log.status];
                                    return (
                                        <tr key={log.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6 text-sm text-[#687582] dark:text-gray-400">
                                                {new Date(log.timestamp).toLocaleString("vi-VN")}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-[#3C81C6]/10 flex items-center justify-center text-[#3C81C6]">
                                                        <span className="material-symbols-outlined text-[16px]">person</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-[#121417] dark:text-white">{log.userName}</p>
                                                        <p className="text-xs text-[#687582] dark:text-gray-400">{log.userRole}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-[#121417] dark:text-gray-200">{log.action}</td>
                                            <td className="py-4 px-6 text-sm text-[#687582] dark:text-gray-400">{log.target || "-"}</td>
                                            <td className="py-4 px-6 text-sm font-mono text-[#687582] dark:text-gray-400">{log.ipAddress}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
                                                    <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
