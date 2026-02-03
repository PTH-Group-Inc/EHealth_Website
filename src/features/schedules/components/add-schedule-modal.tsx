"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { UI_TEXT } from "@/constants/ui-text";

interface Schedule {
    id: string;
    doctorId: string;
    doctorName: string;
    department: string;
    shift: "MORNING" | "AFTERNOON" | "NIGHT";
    date: string;
    status: "SCHEDULED" | "ON_DUTY" | "COMPLETED" | "ABSENT";
}

interface AddScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (schedule: Omit<Schedule, "id" | "status">) => void;
    initialDate?: string;
}

const MOCK_DOCTORS = [
    { id: "1", name: "BS. Nguyễn Văn An", department: "Khoa Nội" },
    { id: "2", name: "BS. Trần Thị Bình", department: "Khoa Ngoại" },
    { id: "3", name: "BS. Lê Văn Cường", department: "Khoa Nhi" },
    { id: "4", name: "BS. Phạm Thị Dung", department: "Khoa Sản" },
    { id: "5", name: "BS. Hoàng Văn Em", department: "Khoa Tim mạch" },
];

const SHIFTS = [
    { value: "MORNING", label: "Ca sáng", time: "7:00 - 12:00", icon: "wb_sunny" },
    { value: "AFTERNOON", label: "Ca chiều", time: "13:00 - 18:00", icon: "wb_twilight" },
    { value: "NIGHT", label: "Ca đêm", time: "19:00 - 7:00", icon: "nights_stay" },
];

export function AddScheduleModal({ isOpen, onClose, onSubmit, initialDate }: AddScheduleModalProps) {
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedShift, setSelectedShift] = useState<"MORNING" | "AFTERNOON" | "NIGHT">("MORNING");
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split("T")[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const doctor = MOCK_DOCTORS.find((d) => d.id === selectedDoctor);
        if (doctor) {
            onSubmit({
                doctorId: doctor.id,
                doctorName: doctor.name,
                department: doctor.department,
                shift: selectedShift,
                date: selectedDate,
            });
            setSelectedDoctor("");
            setSelectedShift("MORNING");
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm lịch trực mới" size="md">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Ngày trực <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                        required
                    />
                </div>

                {/* Doctor Selection */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Bác sĩ <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white appearance-none cursor-pointer"
                        required
                    >
                        <option value="">-- Chọn bác sĩ --</option>
                        {MOCK_DOCTORS.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                                {doc.name} - {doc.department}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Shift Selection */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-3">
                        Ca trực <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {SHIFTS.map((shift) => (
                            <button
                                key={shift.value}
                                type="button"
                                onClick={() => setSelectedShift(shift.value as typeof selectedShift)}
                                className={`p-4 rounded-xl border-2 transition-all text-center ${selectedShift === shift.value
                                    ? "border-[#3C81C6] bg-[#3C81C6]/5"
                                    : "border-gray-200 dark:border-gray-700 hover:border-[#3C81C6]/50"
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[24px] mb-2 block ${selectedShift === shift.value ? "text-[#3C81C6]" : "text-gray-400"}`}>
                                    {shift.icon}
                                </span>
                                <p className={`text-sm font-bold ${selectedShift === shift.value ? "text-[#3C81C6]" : "text-[#121417] dark:text-white"}`}>
                                    {shift.label}
                                </p>
                                <p className="text-xs text-[#687582] mt-0.5">{shift.time}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                {selectedDoctor && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <span className="font-bold">{MOCK_DOCTORS.find((d) => d.id === selectedDoctor)?.name}</span> sẽ trực{" "}
                            <span className="font-bold">{SHIFTS.find((s) => s.value === selectedShift)?.label}</span> vào ngày{" "}
                            <span className="font-bold">{new Date(selectedDate).toLocaleDateString("vi-VN")}</span>
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        {UI_TEXT.COMMON.CANCEL}
                    </button>
                    <button
                        type="submit"
                        disabled={!selectedDoctor}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Thêm lịch trực
                    </button>
                </div>
            </form>
        </Modal>
    );
}
