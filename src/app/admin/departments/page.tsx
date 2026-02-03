"use client";

import { useState, useMemo } from "react";
import { UI_TEXT } from "@/constants/ui-text";
import { MOCK_DEPARTMENTS } from "@/lib/mock-data/admin";
import { DEPARTMENT_STATUS } from "@/constants/status";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { DepartmentFormModal } from "@/features/departments/components/department-form-modal";
import { DepartmentDetailModal } from "@/features/departments/components/department-detail-modal";
import type { Department } from "@/types";

type SortField = "name" | "doctorCount" | "patientCount" | "status";
type SortOrder = "asc" | "desc";

export default function DepartmentsPage() {
    // State
    const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    // Filtered and sorted departments
    const filteredDepartments = useMemo(() => {
        let result = departments.filter((dept) => {
            return (
                searchQuery === "" ||
                dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dept.code.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case "name":
                    comparison = a.name.localeCompare(b.name);
                    break;
                case "doctorCount":
                    comparison = a.doctorCount - b.doctorCount;
                    break;
                case "patientCount":
                    comparison = (a.patientCount || 0) - (b.patientCount || 0);
                    break;
                case "status":
                    comparison = a.status.localeCompare(b.status);
                    break;
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return result;
    }, [departments, searchQuery, sortField, sortOrder]);

    // Handlers
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const handleAddDepartment = () => {
        setEditingDepartment(null);
        setIsModalOpen(true);
    };

    const handleEditDepartment = (department: Department) => {
        setEditingDepartment(department);
        setIsModalOpen(true);
    };

    const handleViewDepartment = (department: Department) => {
        setViewingDepartment(department);
        setIsDetailModalOpen(true);
    };

    const handleDeleteDepartment = (departmentId: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa khoa này?")) {
            setDepartments((prev) => prev.filter((d) => d.id !== departmentId));
        }
    };

    const handleSubmitDepartment = (deptData: Partial<Department>) => {
        if (editingDepartment) {
            setDepartments((prev) =>
                prev.map((d) => (d.id === editingDepartment.id ? { ...d, ...deptData } : d))
            );
        } else {
            const newDepartment: Department = {
                id: String(Date.now()),
                code: `DEPT-${String(departments.length + 1).padStart(3, "0")}`,
                name: deptData.name || "",
                description: deptData.description,
                icon: deptData.icon || "local_hospital",
                doctorCount: 0,
                patientCount: 0,
                appointmentToday: 0,
                location: deptData.location,
                capacity: deptData.capacity || 50,
                status: DEPARTMENT_STATUS.ACTIVE,
                createdAt: new Date().toISOString().split("T")[0],
                updatedAt: new Date().toISOString().split("T")[0],
            };
            setDepartments((prev) => [newDepartment, ...prev]);
        }
    };

    const handleExport = () => {
        const headers = ["Mã khoa", "Tên khoa", "Số bác sĩ", "Số bệnh nhân", "Sức chứa", "Vị trí", "Trạng thái"];
        const rows = filteredDepartments.map((d) => [
            d.code,
            d.name,
            d.doctorCount,
            d.patientCount || 0,
            d.capacity || 0,
            d.location || "",
            d.status,
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `departments_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case DEPARTMENT_STATUS.ACTIVE:
                return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500", label: UI_TEXT.STATUS.ACTIVE };
            case DEPARTMENT_STATUS.INACTIVE:
                return { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400", label: UI_TEXT.STATUS.INACTIVE };
            case DEPARTMENT_STATUS.MAINTENANCE:
                return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500", label: UI_TEXT.STATUS.MAINTENANCE };
            default:
                return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: status };
        }
    };

    const getLoadPercentage = (dept: Department) => {
        return dept.capacity ? Math.min(100, Math.round(((dept.appointmentToday || 0) / dept.capacity) * 100)) : 0;
    };

    // Dynamic stats
    const dynamicStats = {
        total: departments.length,
        active: departments.filter((d) => d.status === DEPARTMENT_STATUS.ACTIVE).length,
        totalDoctors: departments.reduce((sum, d) => sum + d.doctorCount, 0),
        totalPatients: departments.reduce((sum, d) => sum + (d.patientCount || 0), 0),
    };

    const SortIcon = ({ field }: { field: SortField }) => (
        <span className={`material-symbols-outlined text-[14px] ${sortField === field ? "text-[#3C81C6]" : "text-gray-400"}`}>
            {sortField === field ? (sortOrder === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
        </span>
    );

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                        {UI_TEXT.ADMIN.DEPARTMENTS.TITLE}
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400">
                        {UI_TEXT.ADMIN.DEPARTMENTS.SUBTITLE}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Tải xuống
                    </button>
                    <button
                        onClick={handleAddDepartment}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                    >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        {UI_TEXT.ADMIN.DEPARTMENTS.ADD_DEPARTMENT}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">category</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.DEPARTMENTS.TOTAL_DEPARTMENTS}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{dynamicStats.total}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                        <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.DEPARTMENTS.ACTIVE_DEPARTMENTS}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{dynamicStats.active}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                        <span className="material-symbols-outlined">stethoscope</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.DEPARTMENTS.TOTAL_DOCTORS}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{dynamicStats.totalDoctors}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600">
                        <span className="material-symbols-outlined">personal_injury</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.DEPARTMENTS.TOTAL_PATIENTS}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{dynamicStats.totalPatients}</p>
                    </div>
                </div>
            </div>

            {/* Search & Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all dark:text-white placeholder:text-gray-400"
                        placeholder={UI_TEXT.ADMIN.DEPARTMENTS.SEARCH_PLACEHOLDER}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-[#687582]">Sắp xếp:</span>
                    <button
                        onClick={() => handleSort("name")}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${sortField === "name" ? "bg-[#3C81C6]/10 text-[#3C81C6]" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                    >
                        Tên <SortIcon field="name" />
                    </button>
                    <button
                        onClick={() => handleSort("doctorCount")}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${sortField === "doctorCount" ? "bg-[#3C81C6]/10 text-[#3C81C6]" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                    >
                        Bác sĩ <SortIcon field="doctorCount" />
                    </button>
                    <button
                        onClick={() => handleSort("status")}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${sortField === "status" ? "bg-[#3C81C6]/10 text-[#3C81C6]" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                    >
                        Trạng thái <SortIcon field="status" />
                    </button>
                </div>
            </div>

            {/* Departments Grid */}
            {filteredDepartments.length === 0 ? (
                <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-2xl p-12 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-[#687582] mb-2">search_off</span>
                    <p className="text-[#687582] dark:text-gray-400">{UI_TEXT.TABLE.NO_RESULTS}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDepartments.map((dept) => {
                        const statusStyle = getStatusStyle(dept.status);
                        const loadPercent = getLoadPercentage(dept);

                        return (
                            <div
                                key={dept.id}
                                className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl p-5 shadow-sm hover:shadow-md transition-all group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-[#3C81C6]/10 flex items-center justify-center text-[#3C81C6]">
                                            <span className="material-symbols-outlined">{dept.icon || "local_hospital"}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-[#121417] dark:text-white">{dept.name}</h3>
                                            <p className="text-xs text-[#687582] dark:text-gray-400">{dept.code}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu
                                        items={[
                                            {
                                                label: "Xem chi tiết",
                                                icon: "visibility",
                                                onClick: () => handleViewDepartment(dept),
                                            },
                                            {
                                                label: "Chỉnh sửa",
                                                icon: "edit",
                                                onClick: () => handleEditDepartment(dept),
                                            },
                                            {
                                                label: "Xóa",
                                                icon: "delete",
                                                onClick: () => handleDeleteDepartment(dept.id),
                                                variant: "danger",
                                            },
                                        ]}
                                    />
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                                        <p className="text-lg font-bold text-[#121417] dark:text-white">{dept.doctorCount}</p>
                                        <p className="text-xs text-[#687582] dark:text-gray-400">Bác sĩ</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                                        <p className="text-lg font-bold text-[#121417] dark:text-white">{dept.patientCount || 0}</p>
                                        <p className="text-xs text-[#687582] dark:text-gray-400">BN hôm nay</p>
                                    </div>
                                </div>

                                {/* Load Progress */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-[#687582] dark:text-gray-400">Tải hiện tại</span>
                                        <span className="font-medium text-[#121417] dark:text-white">{loadPercent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${loadPercent > 80
                                                ? "bg-red-500"
                                                : loadPercent > 50
                                                    ? "bg-orange-500"
                                                    : "bg-green-500"
                                                }`}
                                            style={{ width: `${loadPercent}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                                        {statusStyle.label}
                                    </span>
                                    {dept.location && (
                                        <span className="text-xs text-[#687582] dark:text-gray-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                                            {dept.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Department Form Modal */}
            <DepartmentFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitDepartment}
                initialData={editingDepartment || undefined}
                mode={editingDepartment ? "edit" : "create"}
            />

            {/* Department Detail Modal */}
            <DepartmentDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                department={viewingDepartment}
            />
        </>
    );
}
