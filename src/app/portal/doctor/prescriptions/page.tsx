"use client";

import { useState, useMemo } from "react";
import { UI_TEXT } from "@/constants/ui-text";
import { MOCK_DOCTOR_PRESCRIPTIONS } from "@/lib/mock-data/doctor";

type StatusFilter = "all" | "pending" | "completed" | "cancelled";

type Prescription = typeof MOCK_DOCTOR_PRESCRIPTIONS[0];

export default function PrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState(MOCK_DOCTOR_PRESCRIPTIONS);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [selectedMonth, setSelectedMonth] = useState("this_month");

    // Modal states
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [newModalOpen, setNewModalOpen] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

    const filteredPrescriptions = useMemo(() => {
        return prescriptions.filter((prescription) => {
            const matchesSearch =
                searchQuery === "" ||
                prescription.patientName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                prescription.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prescription.medicines.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || prescription.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [prescriptions, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: prescriptions.length,
            pending: prescriptions.filter((p) => p.status === "pending").length,
            completed: prescriptions.filter((p) => p.status === "completed").length,
        };
    }, [prescriptions]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "pending":
                return {
                    bg: "bg-orange-100 dark:bg-orange-900/30",
                    text: "text-orange-700 dark:text-orange-400",
                    label: UI_TEXT.DOCTOR.PRESCRIPTIONS.PENDING_DISPENSE,
                    dot: "bg-orange-500",
                };
            case "completed":
                return {
                    bg: "bg-green-100 dark:bg-green-900/30",
                    text: "text-green-700 dark:text-green-400",
                    label: UI_TEXT.DOCTOR.PRESCRIPTIONS.COMPLETED,
                    dot: "bg-green-500",
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

    const handleView = (prescription: Prescription) => {
        setSelectedPrescription(prescription);
        setViewModalOpen(true);
    };

    const handlePrint = (prescription: Prescription) => {
        alert(`Đang in đơn thuốc ${prescription.id}...`);
        // In real app, this would trigger print dialog
    };

    const handleMarkCompleted = (id: string) => {
        setPrescriptions(prev =>
            prev.map(p => p.id === id ? { ...p, status: "completed" } : p)
        );
        setViewModalOpen(false);
        alert("Đã cập nhật trạng thái thành hoàn thành!");
    };

    const handleCancelPrescription = (id: string) => {
        if (confirm("Bạn có chắc muốn hủy đơn thuốc này?")) {
            setPrescriptions(prev =>
                prev.map(p => p.id === id ? { ...p, status: "cancelled" } : p)
            );
            setViewModalOpen(false);
            alert("Đã hủy đơn thuốc!");
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[#121417] dark:text-white">
                            {UI_TEXT.DOCTOR.PRESCRIPTIONS.TITLE}
                        </h2>
                        <p className="text-sm text-[#687582] dark:text-gray-400">
                            {UI_TEXT.DOCTOR.PRESCRIPTIONS.SUBTITLE}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setNewModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            {UI_TEXT.DOCTOR.PRESCRIPTIONS.NEW_PRESCRIPTION}
                        </button>
                    </div>
                </div>

                {/* Stats Card */}
                <div className="bg-gradient-to-r from-[#3C81C6] to-[#2a6da8] rounded-xl p-6 text-white shadow-lg shadow-blue-200 dark:shadow-none">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-100">
                                {UI_TEXT.DOCTOR.PRESCRIPTIONS.TODAY_PRESCRIPTIONS}
                            </p>
                            <h3 className="text-4xl font-bold mt-1">{stats.total}</h3>
                            <p className="text-sm text-blue-100 mt-2">
                                <span className="text-white font-medium">{stats.pending}</span>{" "}
                                chờ cấp phát •{" "}
                                <span className="text-white font-medium">{stats.completed}</span>{" "}
                                hoàn thành
                            </p>
                        </div>
                        <div className="size-16 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl">
                                medication
                            </span>
                        </div>
                    </div>
                </div>

                {/* Prescriptions Table */}
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl shadow-sm">
                    {/* Table Header */}
                    <div className="p-4 border-b border-[#e5e7eb] dark:border-[#2d353e] flex flex-col md:flex-row justify-between gap-4 items-center">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
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
                                    placeholder={UI_TEXT.DOCTOR.PRESCRIPTIONS.SEARCH_PLACEHOLDER}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="py-2.5 px-3 text-sm bg-[#f8fafc] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 text-[#687582] dark:text-gray-400 cursor-pointer"
                            >
                                <option value="this_month">
                                    {UI_TEXT.DOCTOR.PRESCRIPTIONS.THIS_MONTH}
                                </option>
                                <option value="last_month">Tháng trước</option>
                                <option value="all">Tất cả</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value as StatusFilter)
                                }
                                className="py-2.5 px-3 text-sm bg-[#f8fafc] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 text-[#687582] dark:text-gray-400 cursor-pointer"
                            >
                                <option value="all">
                                    {UI_TEXT.DOCTOR.PRESCRIPTIONS.ALL_STATUS}
                                </option>
                                <option value="pending">Chờ cấp phát</option>
                                <option value="completed">Đã hoàn thành</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        {UI_TEXT.DOCTOR.PRESCRIPTIONS.PRESCRIPTION_ID}
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        {UI_TEXT.DOCTOR.PRESCRIPTIONS.PATIENT}
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        {UI_TEXT.DOCTOR.PRESCRIPTIONS.DIAGNOSIS}
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        {UI_TEXT.DOCTOR.PRESCRIPTIONS.DATE}
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        {UI_TEXT.DOCTOR.PRESCRIPTIONS.MAIN_MEDICINE}
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase">
                                        {UI_TEXT.DOCTOR.PRESCRIPTIONS.STATUS}
                                    </th>
                                    <th className="py-4 px-6 text-xs font-semibold text-[#687582] dark:text-gray-400 uppercase text-right">
                                        {UI_TEXT.COMMON.ACTIONS}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {filteredPrescriptions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-12 text-center text-[#687582] dark:text-gray-400"
                                        >
                                            <span className="material-symbols-outlined text-4xl mb-2 block">
                                                search_off
                                            </span>
                                            Không tìm thấy đơn thuốc
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPrescriptions.map((prescription) => {
                                        const statusStyle = getStatusStyle(prescription.status);
                                        return (
                                            <tr
                                                key={prescription.id}
                                                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="py-4 px-6">
                                                    <span className="text-sm font-bold text-[#3C81C6]">
                                                        {prescription.id}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="size-9 rounded-full bg-cover bg-center border border-gray-200 bg-gray-100"
                                                            style={{
                                                                backgroundImage:
                                                                    prescription.patientAvatar
                                                                        ? `url('${prescription.patientAvatar}')`
                                                                        : undefined,
                                                            }}
                                                        >
                                                            {!prescription.patientAvatar && (
                                                                <div className="size-full flex items-center justify-center text-gray-400">
                                                                    <span className="material-symbols-outlined text-[18px]">
                                                                        person
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">
                                                                {prescription.patientName}
                                                            </p>
                                                            <p className="text-xs text-[#687582] dark:text-gray-400">
                                                                {prescription.patientGender},{" "}
                                                                {prescription.patientAge} tuổi
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-sm text-[#121417] dark:text-gray-200">
                                                        {prescription.diagnosis}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-sm text-[#687582] dark:text-gray-400">
                                                        {prescription.date}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-sm text-[#687582] dark:text-gray-400 max-w-xs truncate">
                                                        {prescription.medicines}
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
                                                        <button
                                                            onClick={() => handleView(prescription)}
                                                            className="p-2 text-[#687582] hover:text-[#3C81C6] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                            title="Xem chi tiết"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                visibility
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() => handlePrint(prescription)}
                                                            className="p-2 text-[#687582] hover:text-[#3C81C6] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                            title="In đơn thuốc"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                print
                                                            </span>
                                                        </button>
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
                            Hiển thị {filteredPrescriptions.length} trong tổng số{" "}
                            {prescriptions.length} đơn thuốc
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

            {/* View Prescription Modal */}
            {viewModalOpen && selectedPrescription && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                Chi tiết đơn thuốc
                            </h3>
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="size-14 rounded-full bg-cover bg-center border border-gray-200 bg-gray-100"
                                    style={{
                                        backgroundImage: selectedPrescription.patientAvatar
                                            ? `url('${selectedPrescription.patientAvatar}')`
                                            : undefined,
                                    }}
                                >
                                    {!selectedPrescription.patientAvatar && (
                                        <div className="size-full flex items-center justify-center text-gray-400">
                                            <span className="material-symbols-outlined text-2xl">person</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#121417] dark:text-white">
                                        {selectedPrescription.patientName}
                                    </h4>
                                    <p className="text-sm text-[#687582]">
                                        {selectedPrescription.patientGender}, {selectedPrescription.patientAge} tuổi
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Mã đơn thuốc</p>
                                    <p className="font-medium text-[#3C81C6]">{selectedPrescription.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Ngày kê</p>
                                    <p className="font-medium text-[#121417] dark:text-white">{selectedPrescription.date}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-[#687582] mb-1">Chẩn đoán</p>
                                <p className="font-medium text-[#121417] dark:text-white">{selectedPrescription.diagnosis}</p>
                            </div>

                            <div>
                                <p className="text-xs text-[#687582] mb-1">Thuốc kê</p>
                                <p className="font-medium text-[#121417] dark:text-white">{selectedPrescription.medicines}</p>
                            </div>

                            <div>
                                <p className="text-xs text-[#687582] mb-1">Trạng thái</p>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(selectedPrescription.status).bg} ${getStatusStyle(selectedPrescription.status).text}`}>
                                    <span className={`size-1.5 rounded-full ${getStatusStyle(selectedPrescription.status).dot}`}></span>
                                    {getStatusStyle(selectedPrescription.status).label}
                                </span>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end gap-3">
                            {selectedPrescription.status === "pending" && (
                                <>
                                    <button
                                        onClick={() => handleCancelPrescription(selectedPrescription.id)}
                                        className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Hủy đơn
                                    </button>
                                    <button
                                        onClick={() => handleMarkCompleted(selectedPrescription.id)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Đánh dấu hoàn thành
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => handlePrint(selectedPrescription)}
                                className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                In đơn thuốc
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Prescription Modal */}
            {newModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-lg w-full">
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                Tạo đơn thuốc mới
                            </h3>
                            <button
                                onClick={() => setNewModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                    Bệnh nhân
                                </label>
                                <select className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    <option>Chọn bệnh nhân...</option>
                                    <option>Phạm Thị Lan</option>
                                    <option>Trần Văn Bình</option>
                                    <option>Lê Thị Mai</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                    Chẩn đoán
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                    placeholder="Nhập chẩn đoán..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                    Thuốc kê đơn
                                </label>
                                <textarea
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none"
                                    rows={3}
                                    placeholder="Nhập danh sách thuốc..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                    Ghi chú
                                </label>
                                <textarea
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none"
                                    rows={2}
                                    placeholder="Ghi chú cho bệnh nhân..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end gap-3">
                            <button
                                onClick={() => setNewModalOpen(false)}
                                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    setNewModalOpen(false);
                                    alert("Đã tạo đơn thuốc mới!");
                                }}
                                className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Tạo đơn thuốc
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
