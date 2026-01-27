"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { UI_TEXT } from "@/constants/ui-text";
import { MOCK_DOCTORS } from "@/lib/mock-data/admin";

interface TimeSlot {
    id: string;
    startTime: string;
    endTime: string;
    maxPatients: number;
}

interface TimeSlotModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

const DEFAULT_SLOTS: TimeSlot[] = [
    { id: "1", startTime: "07:00", endTime: "08:00", maxPatients: 6 },
    { id: "2", startTime: "08:00", endTime: "09:00", maxPatients: 6 },
    { id: "3", startTime: "09:00", endTime: "10:00", maxPatients: 6 },
    { id: "4", startTime: "10:00", endTime: "11:00", maxPatients: 6 },
    { id: "5", startTime: "13:00", endTime: "14:00", maxPatients: 6 },
    { id: "6", startTime: "14:00", endTime: "15:00", maxPatients: 6 },
    { id: "7", startTime: "15:00", endTime: "16:00", maxPatients: 6 },
    { id: "8", startTime: "16:00", endTime: "17:00", maxPatients: 6 },
];

export function TimeSlotModal({ isOpen, onClose }: TimeSlotModalProps) {
    const [slots, setSlots] = useState<TimeSlot[]>(DEFAULT_SLOTS);
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]); // Mon-Fri

    const toggleDay = (dayIndex: number) => {
        setSelectedDays((prev) =>
            prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
        );
    };

    const updateSlot = (slotId: string, field: keyof TimeSlot, value: string | number) => {
        setSlots((prev) =>
            prev.map((s) => (s.id === slotId ? { ...s, [field]: value } : s))
        );
    };

    const addSlot = () => {
        const newSlot: TimeSlot = {
            id: String(Date.now()),
            startTime: "17:00",
            endTime: "18:00",
            maxPatients: 6,
        };
        setSlots((prev) => [...prev, newSlot]);
    };

    const removeSlot = (slotId: string) => {
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
    };

    const handleSave = () => {
        alert("Đã lưu cấu hình khung giờ!");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cấu hình khung giờ khám" size="lg">
            {/* Days Selection */}
            <div className="mb-6">
                <p className="text-sm font-medium text-[#121417] dark:text-white mb-3">
                    Ngày áp dụng
                </p>
                <div className="flex flex-wrap gap-2">
                    {DAYS.map((day, index) => (
                        <button
                            key={index}
                            onClick={() => toggleDay(index)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDays.includes(index)
                                    ? "bg-[#3C81C6] text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-[#687582] hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time Slots */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-[#121417] dark:text-white">
                        Khung giờ ({slots.length} slots)
                    </p>
                    <button
                        onClick={addSlot}
                        className="text-sm text-[#3C81C6] hover:underline flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Thêm khung giờ
                    </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                    {slots.map((slot) => (
                        <div
                            key={slot.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                        >
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) => updateSlot(slot.id, "startTime", e.target.value)}
                                    className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                />
                                <span className="text-[#687582]">-</span>
                                <input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) => updateSlot(slot.id, "endTime", e.target.value)}
                                    className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[#687582]">Tối đa:</span>
                                <input
                                    type="number"
                                    value={slot.maxPatients}
                                    onChange={(e) => updateSlot(slot.id, "maxPatients", Number(e.target.value))}
                                    min="1"
                                    max="20"
                                    className="w-16 px-2 py-2 text-sm text-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                />
                                <span className="text-xs text-[#687582]">BN</span>
                            </div>

                            <button
                                onClick={() => removeSlot(slot.id)}
                                className="ml-auto p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-6">
                <p className="text-sm text-[#121417] dark:text-white">
                    <span className="font-medium">Tổng số slot/ngày:</span> {slots.length} khung giờ
                </p>
                <p className="text-sm text-[#121417] dark:text-white">
                    <span className="font-medium">Tổng BN tối đa/ngày:</span>{" "}
                    {slots.reduce((sum, s) => sum + s.maxPatients, 0)} bệnh nhân
                </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                    {UI_TEXT.COMMON.CANCEL}
                </button>
                <button
                    onClick={handleSave}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-xl shadow-md shadow-blue-200 dark:shadow-none transition-all"
                >
                    {UI_TEXT.COMMON.SAVE}
                </button>
            </div>
        </Modal>
    );
}
