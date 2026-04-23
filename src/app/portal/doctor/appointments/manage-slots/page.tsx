"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { scheduleService } from "@/services/scheduleService";
import { doctorAvailabilityService } from "@/services/appointmentService";
import { useAuth } from "@/contexts/AuthContext";

interface DaySlot {
    day: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
    maxPatients: string;
}

const DEFAULT_SLOTS: DaySlot[] = [
    { day: "Thứ 2", enabled: true, startTime: "08:00", endTime: "17:00", maxPatients: "20" },
    { day: "Thứ 3", enabled: true, startTime: "08:00", endTime: "17:00", maxPatients: "20" },
    { day: "Thứ 4", enabled: true, startTime: "08:00", endTime: "17:00", maxPatients: "20" },
    { day: "Thứ 5", enabled: true, startTime: "08:00", endTime: "17:00", maxPatients: "20" },
    { day: "Thứ 6", enabled: true, startTime: "08:00", endTime: "17:00", maxPatients: "20" },
    { day: "Thứ 7", enabled: false, startTime: "08:00", endTime: "12:00", maxPatients: "10" },
    { day: "Chủ nhật", enabled: false, startTime: "", endTime: "", maxPatients: "0" },
];

export default function ManageSlotsPage() {
    const t = useTranslations("pages.portal.doctor.manageSlots");
    const router = useRouter();
    const { user } = useAuth();
    const [slots, setSlots] = useState<DaySlot[]>(DEFAULT_SLOTS);
    const [slotDuration, setSlotDuration] = useState("30");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        const today = new Date();
        const nextWeekDate = new Date(today);
        nextWeekDate.setDate(today.getDate() + 7);

        // Ưu tiên doctor-availability API
        doctorAvailabilityService.getSlots({
            doctorId: user.id,
            date: today.toISOString().split("T")[0],
        })
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    const DAY_MAP: Record<string, string> = { "1": "Thứ 2", "2": "Thứ 3", "3": "Thứ 4", "4": "Thứ 5", "5": "Thứ 6", "6": "Thứ 7", "0": "Chủ nhật" };
                    const enabledDays = new Set(data.map((s: any) => new Date(s.date ?? s.workDate ?? "").getDay().toString()));
                    setSlots((prev) => prev.map((s) => {
                        const dayNum = Object.entries(DAY_MAP).find(([, v]) => v === s.day)?.[0];
                        const matched = data.find((d: any) => new Date(d.date ?? d.workDate ?? "").getDay().toString() === dayNum);
                        return dayNum ? {
                            ...s,
                            enabled: enabledDays.has(dayNum),
                            startTime: matched?.startTime ?? s.startTime,
                            endTime: matched?.endTime ?? s.endTime,
                            maxPatients: matched?.maxPatients ? String(matched.maxPatients) : s.maxPatients,
                        } : s;
                    }));
                }
            })
            .catch(() => {
                // Fallback: scheduleService
                const from = new Date(today); from.setDate(today.getDate() - today.getDay() + 1);
                const to = new Date(from); to.setDate(from.getDate() + 6);
                scheduleService.getByDoctor(user.id, { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] })
                    .then((data) => {
                        if (Array.isArray(data) && data.length > 0) {
                            const DAY_MAP: Record<string, string> = { "1": "Thứ 2", "2": "Thứ 3", "3": "Thứ 4", "4": "Thứ 5", "5": "Thứ 6", "6": "Thứ 7", "0": "Chủ nhật" };
                            const enabledDays = new Set(data.map((s) => new Date(s.date).getDay().toString()));
                            setSlots((prev) => prev.map((s) => {
                                const dayNum = Object.entries(DAY_MAP).find(([, v]) => v === s.day)?.[0];
                                return dayNum ? { ...s, enabled: enabledDays.has(dayNum) } : s;
                            }));
                        }
                    })
                    .catch(() => {/* keep default */});
            });
    }, [user?.id]);

    const updateSlot = (index: number, field: keyof DaySlot, value: string | boolean) => {
        setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (user?.id) {
                const DAY_NUM: Record<string, number> = { "Thứ 2": 1, "Thứ 3": 2, "Thứ 4": 3, "Thứ 5": 4, "Thứ 6": 5, "Thứ 7": 6, "Chủ nhật": 0 };
                const today = new Date();
                const enabledSlots = slots.filter((s) => s.enabled && s.startTime && s.endTime);
                for (const s of enabledSlots) {
                    const dayNum = DAY_NUM[s.day];
                    if (dayNum === undefined) continue;
                    const nextDate = new Date(today);
                    const diff = (dayNum - today.getDay() + 7) % 7 || 7;
                    nextDate.setDate(today.getDate() + diff);
                    const dateStr = nextDate.toISOString().split("T")[0];
                    // Ưu tiên doctor-availability API
                    await doctorAvailabilityService.create({
                        doctorId: user.id,
                        date: dateStr,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        maxPatients: parseInt(s.maxPatients) || 20,
                    }).catch(() => {
                        // Fallback: scheduleService
                        scheduleService.create({
                            doctorId: user.id,
                            date: dateStr,
                            shift: s.startTime < "12:00" ? "MORNING" : s.startTime < "17:00" ? "AFTERNOON" : "NIGHT",
                        } as any).catch(() => {});
                    });
                }
            }
        } catch { /* ignore */ }
        setSaving(false);
        router.push("/portal/doctor/appointments");
    };

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500">
                    <Link href="/portal/doctor" className="hover:text-[#3C81C6]">Trang chủ</Link>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <Link href="/portal/doctor/appointments" className="hover:text-[#3C81C6]">Lịch hẹn</Link>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Quản lý khung giờ</span>
                </div>

                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#121417] dark:text-white">
                            {t("title")}
                        </h1>
                        <p className="text-sm text-[#687582] dark:text-gray-400 mt-1">
                            {t("subtitle")}
                        </p>
                    </div>
                </div>

                {/* Slot Duration Setting */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] p-6">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-[#3C81C6]">timer</span>
                        Cài đặt chung
                    </h3>
                    <div className="flex items-center gap-4">
                        <label className="text-sm text-[#687582] dark:text-gray-400">
                            Thời gian mỗi lượt khám:
                        </label>
                        <select
                            value={slotDuration}
                            onChange={(e) => setSlotDuration(e.target.value)}
                            className="px-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                        >
                            <option value="15">15 phút</option>
                            <option value="20">20 phút</option>
                            <option value="30">30 phút</option>
                            <option value="45">45 phút</option>
                            <option value="60">60 phút</option>
                        </select>
                    </div>
                </div>

                {/* Schedule Grid */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e]">
                    <div className="p-5 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-[#3C81C6]">calendar_month</span>
                            Lịch làm việc hàng tuần
                        </h3>
                    </div>
                    <div className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                        {slots.map((slot, index) => (
                            <div
                                key={slot.day}
                                className={`p-5 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${slot.enabled ? "bg-white dark:bg-[#1e242b]" : "bg-gray-50 dark:bg-gray-900/30 opacity-60"
                                    }`}
                            >
                                {/* Day Name & Toggle */}
                                <div className="flex items-center gap-3 w-32">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={slot.enabled}
                                            onChange={(e) => updateSlot(index, "enabled", e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#3C81C6]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-[#3C81C6]"></div>
                                    </label>
                                    <span className="text-sm font-semibold text-[#121417] dark:text-white">
                                        {slot.day}
                                    </span>
                                </div>

                                {/* Time Inputs */}
                                {slot.enabled && (
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-[#687582]">Từ</label>
                                            <input
                                                type="time"
                                                value={slot.startTime}
                                                onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                                                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20"
                                            />
                                        </div>
                                        <span className="text-[#687582]">—</span>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-[#687582]">Đến</label>
                                            <input
                                                type="time"
                                                value={slot.endTime}
                                                onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                                                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <label className="text-xs text-[#687582]">Tối đa</label>
                                            <input
                                                type="number"
                                                value={slot.maxPatients}
                                                onChange={(e) => updateSlot(index, "maxPatients", e.target.value)}
                                                className="w-16 px-3 py-2 text-sm text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20"
                                                min="0"
                                            />
                                            <span className="text-xs text-[#687582]">BN</span>
                                        </div>
                                    </div>
                                )}

                                {!slot.enabled && (
                                    <p className="text-sm text-[#687582] dark:text-gray-500 italic">
                                        Nghỉ
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <button
                        onClick={() => router.push("/portal/doctor/appointments")}
                        className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-sm font-medium transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[20px]">save</span> Lưu thay đổi</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
