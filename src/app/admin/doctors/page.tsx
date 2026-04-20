"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UI_TEXT } from "@/constants/ui-text";
import { DOCTOR_STATUS } from "@/constants/status";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { DoctorFormModal } from "@/features/doctors/components/doctor-form-modal";
import { TimeSlotModal } from "@/features/doctors/components/time-slot-modal";
import { staffService, unwrapStaffList } from "@/services/staffService";
import { getDepartments, unwrapDepartments } from "@/services/departmentService";
import type { Doctor } from "@/types";
import { DoctorCard } from "@/components/shared/cards";
import { EmptyState } from "@/components/shared/layout";

type SortField = "fullName" | "departmentName" | "rating" | "status";
type SortOrder = "asc" | "desc";

export default function DoctorsPage() {
    // State
    const router = useRouter();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTimeSlotOpen, setIsTimeSlotOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
    const [sortField, setSortField] = useState<SortField>("fullName");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    const [stats, setStats] = useState({ totalDoctors: 0, activeDoctors: 0, pendingAssignment: 0, avgPerformance: 0 });
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [viewMode, setViewMode] = useState<"table" | "card">("card");

    useEffect(() => {
        setIsLoading(true);
        // Dùng /api/staff?role=DOCTOR — endpoint chính xác từ Swagger
        Promise.allSettled([
            staffService.getList({ role: "DOCTOR", limit: 200 }),
            getDepartments({ limit: 100 }),
        ]).then(([doctorsResult, deptsResult]) => {
            if (doctorsResult.status === 'fulfilled') {
                const items = unwrapStaffList(doctorsResult.value);
                if (items.length > 0) {
                    setDoctors(items.map((d) => ({
                        id: String(d.id || ''),
                        userId: String(d.id || ''),
                        code: d.code ?? String(d.id || ''),
                        fullName: d.fullName,
                        departmentId: d.departmentId ?? "",
                        departmentName: d.departmentName ?? "",
                        specialization: d.specialization ?? "",
                        phone: d.phone ?? "",
                        email: d.email ?? "",
                        rating: d.rating ?? 0,
                        reviewCount: 0,
                        status: d.status === "ACTIVE" ? "ACTIVE" : d.status === "INACTIVE" ? "OFFLINE" : "OFFLINE",
                        avatar: d.avatar,
                        experience: d.experience ?? 0,
                        workingSchedule: [],
                        createdAt: d.createdAt ?? "",
                        updatedAt: d.updatedAt ?? "",
                    })) as unknown as Doctor[]);
                    const active = items.filter(d => d.status === "ACTIVE").length;
                    setStats(prev => ({ ...prev, totalDoctors: items.length, activeDoctors: active }));
                }
            }
            if (deptsResult.status === 'fulfilled') {
                const items = unwrapDepartments(deptsResult.value);
                if (items.length > 0) {
                    setDepartments(items.map(d => ({ id: d.id, name: d.name })));
                }
            }
        }).finally(() => setIsLoading(false));
    }, []);

    // Filtered and sorted doctors
    const filteredDoctors = useMemo(() => {
        let result = doctors.filter((doctor) => {
            const matchesSearch =
                searchQuery === "" ||
                (doctor.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (doctor.code || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDepartment =
                departmentFilter === "all" || doctor.departmentId === departmentFilter;
            return matchesSearch && matchesDepartment;
        });

        result.sort((a, b) => {
            let comparison = 0;
            if (sortField === "fullName") {
                comparison = (a.fullName || "").localeCompare(b.fullName || "");
            } else if (sortField === "departmentName") {
                comparison = (a.departmentName || "").localeCompare(b.departmentName || "");
            } else if (sortField === "rating") {
                comparison = (a.rating ?? 0) - (b.rating ?? 0);
            } else if (sortField === "status") {
                comparison = (a.status || "").localeCompare(b.status || "");
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        return result;
    }, [doctors, searchQuery, departmentFilter, sortField, sortOrder]);

    // Toggle sort
    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    // Export to CSV
    const handleExport = () => {
        const headers = ["Mã", "Họ tên", "Khoa", "Đánh giá", "Trạng thái"];
        const rows = filteredDoctors.map((d) => [
            d.code,
            d.fullName,
            d.departmentName,
            d.rating.toString(),
            d.status,
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `doctors_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    // Handlers
    const handleAddDoctor = () => {
        setEditingDoctor(null);
        setIsModalOpen(true);
    };

    const handleEditDoctor = (doctor: Doctor) => {
        setEditingDoctor(doctor);
        setIsModalOpen(true);
    };

    const handleDeleteDoctor = (doctorId: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa bác sĩ này?")) {
            setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
        }
    };

    const handleSubmitDoctor = (doctorData: Partial<Doctor>) => {
        if (editingDoctor) {
            setDoctors((prev) =>
                prev.map((d) => (d.id === editingDoctor.id ? { ...d, ...doctorData } : d))
            );
        } else {
            const newDoctor: Doctor = {
                id: String(Date.now()),
                userId: String(Date.now()),
                code: `DR-${new Date().getFullYear()}${String(doctors.length + 1).padStart(3, "0")}`,
                fullName: doctorData.fullName || "",
                email: doctorData.email || "",
                phone: doctorData.phone,
                departmentId: doctorData.departmentId || "",
                departmentName: doctorData.departmentName || "",
                specialization: doctorData.specialization || "",
                rating: 5.0,
                reviewCount: 0,
                status: DOCTOR_STATUS.ACTIVE,
                createdAt: new Date().toISOString().split("T")[0],
                updatedAt: new Date().toISOString().split("T")[0],
            };
            setDoctors((prev) => [newDoctor, ...prev]);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case DOCTOR_STATUS.ACTIVE:
                return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: UI_TEXT.STATUS.ACTIVE };
            case DOCTOR_STATUS.ON_LEAVE:
                return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: UI_TEXT.STATUS.ON_LEAVE };
            case DOCTOR_STATUS.EXAMINING:
                return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: UI_TEXT.STATUS.EXAMINING };
            default:
                return { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300", label: UI_TEXT.STATUS.OFFLINE };
        }
    };

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                        {UI_TEXT.ADMIN.DOCTORS.TITLE}
                    </h1>
                    <p className="text-[#687582] dark:text-gray-400">
                        {UI_TEXT.ADMIN.DOCTORS.SUBTITLE}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsTimeSlotOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                        {UI_TEXT.ADMIN.DOCTORS.CONFIGURE_SLOTS}
                    </button>
                    <button
                        onClick={() => router.push("/admin/doctors/new")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                    >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        {UI_TEXT.ADMIN.DOCTORS.ADD_DOCTOR}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined">stethoscope</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.DOCTORS.TOTAL_DOCTORS}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{doctors.length}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined">how_to_reg</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.DOCTORS.ON_DUTY}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">
                            {doctors.filter((d) => d.status === DOCTOR_STATUS.ACTIVE || d.status === DOCTOR_STATUS.EXAMINING).length}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.DOCTORS.PENDING_ASSIGNMENT}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stats.pendingAssignment}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <span className="material-symbols-outlined">speed</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{UI_TEXT.ADMIN.DOCTORS.AVG_PERFORMANCE}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{stats.avgPerformance}%</p>
                    </div>
                </div>
            </div>

            {/* Doctors Table */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                {/* Table Header */}
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex flex-col sm:flex-row justify-between gap-4 items-center">
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                        <div className="relative w-full sm:w-72">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] transition-all dark:text-white placeholder:text-gray-400"
                                placeholder={UI_TEXT.ADMIN.DOCTORS.SEARCH_PLACEHOLDER}
                            />
                        </div>
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="py-2.5 pl-3 pr-10 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all text-[#687582] dark:text-gray-400 cursor-pointer"
                        >
                            <option value="all">Tất cả khoa</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <button
                                onClick={() => setViewMode("card")}
                                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${viewMode === "card" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] hover:text-[#3C81C6]"}`}
                                title="Xem dạng thẻ"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>grid_view</span>
                                Thẻ
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${viewMode === "table" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] hover:text-[#3C81C6]"}`}
                                title="Xem dạng bảng"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>table_rows</span>
                                Bảng
                            </button>
                        </div>
                        <button
                            onClick={handleExport}
                            className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-[#687582] transition-colors"
                            title="Xuất dữ liệu"
                        >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setDepartmentFilter("all");
                            }}
                            className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-[#687582] transition-colors"
                            title="Xóa bộ lọc"
                        >
                            <span className="material-symbols-outlined text-[20px]">filter_list_off</span>
                        </button>
                    </div>
                </div>

                {/* Card view */}
                {viewMode === "card" && (
                    <div className="p-4">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-40 bg-gray-50 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredDoctors.length === 0 ? (
                            <EmptyState icon="stethoscope" title="Chưa có bác sĩ nào" description="Thêm bác sĩ mới để bắt đầu quản lý." />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredDoctors.map((doctor, idx) => (
                                    <DoctorCard
                                        key={`${doctor.id || doctor.code || "doc"}-${idx}`}
                                        id={doctor.id}
                                        fullName={doctor.fullName}
                                        avatarUrl={doctor.avatar}
                                        code={doctor.code}
                                        specialization={doctor.specialization}
                                        departmentName={doctor.departmentName}
                                        phone={doctor.phone}
                                        email={doctor.email}
                                        rating={doctor.rating}
                                        reviewCount={doctor.reviewCount}
                                        experience={doctor.experience}
                                        status={doctor.status}
                                        onView={() => router.push(`/admin/doctors/${doctor.id}`)}
                                        onEdit={() => handleEditDoctor(doctor)}
                                        onSchedule={() => setIsTimeSlotOpen(true)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Table Content */}
                {viewMode === "table" && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <tr>
                                <th onClick={() => toggleSort("fullName")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Thông tin Bác sĩ
                                        {sortField === "fullName" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th onClick={() => toggleSort("departmentName")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Chuyên khoa
                                        {sortField === "departmentName" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th onClick={() => toggleSort("rating")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Đánh giá
                                        {sortField === "rating" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">Ca làm việc</th>
                                <th onClick={() => toggleSort("status")} className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase cursor-pointer hover:text-[#3C81C6] select-none">
                                    <span className="flex items-center gap-1">
                                        Trạng thái
                                        {sortField === "status" && <span className="material-symbols-outlined text-[14px]">{sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}</span>}
                                    </span>
                                </th>
                                <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase text-right">{UI_TEXT.COMMON.ACTIONS}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <div className="w-8 h-8 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin mx-auto mb-2" />
                                        Đang tải danh sách bác sĩ...
                                    </td>
                                </tr>
                            ) : filteredDoctors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                                        {UI_TEXT.TABLE.NO_RESULTS}
                                    </td>
                                </tr>
                            ) : (
                                filteredDoctors.map((doctor, idx) => {
                                    const statusStyle = getStatusStyle(doctor.status);
                                    return (
                                        <tr key={`${doctor.id || doctor.code || 'doc'}-${idx}`} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200 bg-gray-100"
                                                        style={{ backgroundImage: doctor.avatar ? `url('${doctor.avatar}')` : undefined }}
                                                    >
                                                        {!doctor.avatar && (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                <span className="material-symbols-outlined">person</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#121417] dark:text-white">{doctor.fullName}</p>
                                                        <p className="text-xs text-[#687582] dark:text-gray-400">{doctor.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm text-[#121417] dark:text-gray-200">{doctor.departmentName}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-yellow-500 text-[18px]">star</span>
                                                    <span className="text-sm font-medium text-[#121417] dark:text-white">{doctor.rating}</span>
                                                    <span className="text-xs text-[#687582] dark:text-gray-400">({doctor.reviewCount})</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {doctor.workingSchedule && doctor.workingSchedule.length > 0 ? (
                                                    <p className="text-xs text-[#687582] dark:text-gray-400">
                                                        {doctor.workingSchedule[0].shift === "MORNING" ? "Sáng" : doctor.workingSchedule[0].shift === "AFTERNOON" ? "Chiều" : "Tối"}: {doctor.workingSchedule[0].days.join(", ")}
                                                    </p>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {statusStyle.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <DropdownMenu
                                                    items={[
                                                        {
                                                            label: "Xem chi tiết",
                                                            icon: "visibility",
                                                            onClick: () => router.push(`/admin/doctors/${doctor.id}`),
                                                        },
                                                        {
                                                            label: "Chỉnh sửa",
                                                            icon: "edit",
                                                            onClick: () => router.push(`/admin/doctors/${doctor.id}/edit`),
                                                        },
                                                        {
                                                            label: "Xem lịch trực",
                                                            icon: "calendar_month",
                                                            onClick: () => router.push("/admin/schedules"),
                                                        },
                                                        {
                                                            label: "Xóa",
                                                            icon: "delete",
                                                            onClick: () => handleDeleteDoctor(doctor.id),
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
                )}
            </div>

            {/* Doctor Form Modal */}
            <DoctorFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitDoctor}
                initialData={editingDoctor || undefined}
                mode={editingDoctor ? "edit" : "create"}
            />

            {/* Time Slot Modal */}
            <TimeSlotModal
                isOpen={isTimeSlotOpen}
                onClose={() => setIsTimeSlotOpen(false)}
            />
        </>
    );
}
