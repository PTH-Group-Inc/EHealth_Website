"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { UI_TEXT } from "@/constants/ui-text";
import { auditService, AuditLog } from "@/services/auditService";
import { useToast } from "@/contexts/ToastContext";

const STATUS_STYLES = {
    SUCCESS: { label: "Thành công", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: "check_circle" },
    FAILED: { label: "Thất bại", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: "cancel" },
    WARNING: { label: "Cảnh báo", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: "warning" },
};

export default function ActivityLogsPage() {
    const toast = useToast();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20 };
            if (actionFilter !== "all") params.action_type = actionFilter;
            if (dateFrom) params.start_date = dateFrom;
            if (dateTo) params.end_date = dateTo;

            const res = await auditService.getLogs(params);
            setLogs(res.data);
            setTotal(res.pagination.total);
            setTotalPages(res.pagination.totalPages);
        } catch (err: any) {
            toast.error(err.message || "Không thể tải nhật ký hoạt động");
        } finally {
            setLoading(false);
        }
    }, [page, actionFilter, dateFrom, dateTo, toast]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesSearch =
                searchQuery === "" ||
                log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.target && log.target.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = statusFilter === "all" || log.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [logs, searchQuery, statusFilter]);

    const stats = {
        total: total,
        success: logs.filter((l) => l.status === "SUCCESS").length,
        failed: logs.filter((l) => l.status === "FAILED").length,
        warning: logs.filter((l) => l.status === "WARNING").length,
    };

    const handleExport = async () => {
        try {
            const params: any = {};
            if (actionFilter !== "all") params.action_type = actionFilter;
            if (dateFrom) params.start_date = dateFrom;
            if (dateTo) params.end_date = dateTo;

            const blob = await auditService.exportExcel(params);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `AuditLogs_Export_${new Date().toISOString().split("T")[0]}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Đã xuất nhật ký thành công!");
        } catch (err: any) {
            toast.error(err.message || "Có lỗi khi xuất nhật ký");
        }
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setActionFilter("all");
        setDateFrom("");
        setDateTo("");
        setPage(1);
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
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="py-2.5 pl-3 pr-10 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 text-[#687582] dark:text-gray-400 cursor-pointer"
                        >
                            <option value="all">Tất cả hành động</option>
                            <option value="CREATE">Tạo mới</option>
                            <option value="UPDATE">Cập nhật</option>
                            <option value="DELETE">Xóa</option>
                            <option value="LOGIN">Đăng nhập</option>
                        </select>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="py-2.5 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none dark:text-white"
                            placeholder="Từ ngày"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="py-2.5 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none dark:text-white"
                            placeholder="Đến ngày"
                        />
                    </div>
                    <button
                        onClick={handleClearFilters}
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
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 block animate-spin">progress_activity</span>
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                                        {UI_TEXT.TABLE.NO_RESULTS}
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const statusKey = log.status as keyof typeof STATUS_STYLES;
                                    const statusUpper = log.status?.toUpperCase?.() as keyof typeof STATUS_STYLES;
                                    const statusInfo = STATUS_STYLES[statusKey] ?? STATUS_STYLES[statusUpper] ?? { label: log.status ?? "N/A", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", icon: "info" };
                                    return (
                                        <tr key={log.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6 text-sm text-[#687582] dark:text-gray-400">
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString("vi-VN") : "-"}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-[#3C81C6]/10 flex items-center justify-center text-[#3C81C6]">
                                                        <span className="material-symbols-outlined text-[16px]">person</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-[#121417] dark:text-white">{log.userName || log.userEmail}</p>
                                                        <p className="text-xs text-[#687582] dark:text-gray-400">{log.userEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-[#121417] dark:text-gray-200">{log.action}</td>
                                            <td className="py-4 px-6 text-sm text-[#687582] dark:text-gray-400">{log.target || "-"}</td>
                                            <td className="py-4 px-6 text-sm font-mono text-[#687582] dark:text-gray-400">{log.ipAddress || "-"}</td>
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                        <p className="text-sm text-[#687582] dark:text-gray-400">
                            Trang {page} / {totalPages} — Tổng {total} bản ghi
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-[#687582] dark:text-gray-400"
                            >
                                Trước
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-[#687582] dark:text-gray-400"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
