"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { medicationReminderService, type MedicationReminderAdherenceRecordBE, type MedicationReminderCurrentMedicationBE } from "@/services/medicationReminderService";
import { mapBEToFEProfile, patientProfileService } from "@/services/patientProfileService";
import type { MedicationLog, MedicationReminder } from "@/types/medication-reminder";
import type { PatientProfile } from "@/types/patient-profile";

type TabKey = "today" | "list" | "stats";

const COLORS = [
    "from-[#3C81C6] to-[#2563eb]",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-green-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-teal-600",
    "from-amber-500 to-orange-600",
];

const DEFAULT_SCHEDULES: Record<number, string[]> = {
    1: ["08:00"],
    2: ["08:00", "20:00"],
    3: ["07:00", "13:00", "20:00"],
    4: ["06:00", "12:00", "18:00", "22:00"],
};

function getTodayString() {
    return new Date().toISOString().split("T")[0];
}

function addDays(dateString: string, days: number) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
}

function parseFrequencyCount(value?: string | null) {
    const normalized = String(value ?? "").toLowerCase();
    const perDayMatch = normalized.match(/(\d+)\s*(x|lan|lần|\/)\s*(ngay|ngày|day)/i);
    if (perDayMatch) return Math.min(Math.max(Number(perDayMatch[1]), 1), 4);

    const leadingNumber = normalized.match(/(\d+)/);
    if (leadingNumber) return Math.min(Math.max(Number(leadingNumber[1]), 1), 4);

    return 1;
}

function buildMedicationReminder(item: MedicationReminderCurrentMedicationBE, profileId: string, index: number): MedicationReminder {
    const frequency = parseFrequencyCount(item.frequency);
    const startDate = item.prescribed_at?.split("T")[0] ?? "";
    const endDate = item.days_remaining !== null && item.days_remaining !== undefined
        ? addDays(startDate || getTodayString(), Math.max(item.days_remaining, 0))
        : "";

    return {
        id: item.prescription_details_id,
        profileId,
        medicationName: item.brand_name || item.active_ingredients || "Thuốc đang dùng",
        dosage: item.dosage || item.dispensing_unit || "Theo đơn",
        frequency,
        frequencyLabel: item.frequency || `${frequency} lần/ngày`,
        timesOfDay: DEFAULT_SCHEDULES[frequency] || DEFAULT_SCHEDULES[1],
        instructions: item.usage_instruction || item.active_ingredients || "Dùng theo hướng dẫn bác sĩ",
        startDate,
        endDate,
        prescriptionId: item.prescription_code,
        prescriptionDetailId: item.prescription_details_id,
        doctorName: item.doctor_name ?? undefined,
        daysRemaining: item.days_remaining,
        isActive: true,
        color: COLORS[index % COLORS.length],
        createdAt: item.prescribed_at,
    };
}

function buildMedicationLog(record: MedicationReminderAdherenceRecordBE, profileId: string): MedicationLog {
    return {
        id: record.adherence_id,
        reminderId: record.prescription_detail_id,
        profileId,
        date: record.adherence_date,
        scheduledTime: "",
        status: record.taken ? "taken" : "skipped",
        actualTime: record.created_at ? new Date(record.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : undefined,
        note: record.skip_reason ?? undefined,
    };
}

function formatShortDate(value?: string) {
    if (!value) return "Chưa rõ";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN");
}

function getStatusMeta(log?: MedicationLog) {
    if (!log) {
        return {
            label: "Chưa ghi nhận",
            tone: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300",
            icon: "schedule",
        };
    }

    if (log.status === "taken") {
        return {
            label: log.actualTime ? `Đã uống lúc ${log.actualTime}` : "Đã uống hôm nay",
            tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
            icon: "check_circle",
        };
    }

    return {
        label: "Đã bỏ qua hôm nay",
        tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
        icon: "skip_next",
    };
}

function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
    return (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-14 text-center dark:border-[#2d353e] dark:bg-[#1e242b]">
            <span className="material-symbols-outlined mb-3 text-gray-300 dark:text-gray-600" style={{ fontSize: "52px" }}>{icon}</span>
            <h3 className="text-base font-bold text-[#121417] dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-[#687582]">{message}</p>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    return (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
            <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{icon}</span>
                </div>
                <div>
                    <p className="text-xs text-[#687582]">{label}</p>
                    <p className="text-lg font-bold text-[#121417] dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
}

function MedicationCard({ reminder, todayLog, onTake, onSkip, submittingId }: {
    reminder: MedicationReminder;
    todayLog?: MedicationLog;
    onTake?: (reminder: MedicationReminder) => void;
    onSkip?: (reminder: MedicationReminder) => void;
    submittingId?: string | null;
}) {
    const status = getStatusMeta(todayLog);
    const isSubmitting = submittingId === reminder.id;
    const hasLogged = Boolean(todayLog);

    return (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-[#2d353e] dark:bg-[#1e242b]">
            <div className="flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${reminder.color} text-white shadow-md`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>medication</span>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-[#121417] dark:text-white">{reminder.medicationName}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.tone}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{status.icon}</span>
                            {status.label}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-[#687582]">{reminder.dosage} • {reminder.frequencyLabel}</p>
                    <p className="mt-1 text-xs text-[#687582]">{reminder.instructions}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#687582]">
                        {reminder.timesOfDay.map((time) => (
                            <span key={`${reminder.id}_${time}`} className="rounded-full bg-[#f6f7f8] px-2.5 py-1 dark:bg-[#13191f]">
                                {time}
                            </span>
                        ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#687582]">
                        <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>calendar_month</span>
                            {formatShortDate(reminder.startDate)}{reminder.endDate ? ` → ${formatShortDate(reminder.endDate)}` : ""}
                        </span>
                        {reminder.doctorName ? (
                            <span className="inline-flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>stethoscope</span>
                                {reminder.doctorName}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            {onTake && onSkip ? (
                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[#e5e7eb] pt-4 dark:border-[#2d353e]">
                    <button
                        type="button"
                        onClick={() => onSkip(reminder)}
                        disabled={hasLogged || isSubmitting}
                        className="rounded-xl border border-[#e5e7eb] px-3 py-2 text-xs font-semibold text-[#687582] transition-colors hover:bg-[#f6f7f8] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2d353e] dark:hover:bg-[#13191f]"
                    >
                        Bỏ qua hôm nay
                    </button>
                    <button
                        type="button"
                        onClick={() => onTake(reminder)}
                        disabled={hasLogged || isSubmitting}
                        className="rounded-xl bg-[#3C81C6] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? "Đang lưu..." : "Đã uống hôm nay"}
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export default function MedicationRemindersPage() {
    usePageAIContext({ pageKey: "medication-reminders" });
    const { user } = useAuth();
    const { showToast } = useToast();
    const tp = useTranslations("pages.portal.patient.medicationReminders");

    const [profiles, setProfiles] = useState<PatientProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState("");
    const [activeTab, setActiveTab] = useState<TabKey>("today");
    const [reminders, setReminders] = useState<MedicationReminder[]>([]);
    const [logs, setLogs] = useState<MedicationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const beProfiles = await patientProfileService.getMyProfiles();
                const mapped = beProfiles.map((profile) => mapBEToFEProfile(profile, user?.id));
                setProfiles(mapped);

                if (mapped.length > 0) {
                    const cachedId = sessionStorage.getItem("patientPortal_selectedProfileId");
                    const exists = mapped.some((profile) => profile.id === cachedId);
                    setSelectedProfileId(exists ? cachedId || mapped[0].id : mapped[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch profiles", error);
                showToast("Không tải được hồ sơ bệnh nhân", "error");
            }
        };

        if (user?.id) {
            fetchProfiles();
        }
    }, [showToast, user?.id]);

    useEffect(() => {
        if (!selectedProfileId) return;

        const loadReminderData = async () => {
            setLoading(true);
            try {
                const today = new Date();
                const fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 6);

                const [currentMedications, adherence] = await Promise.all([
                    medicationReminderService.getCurrentMedications(selectedProfileId),
                    medicationReminderService.getAdherence(selectedProfileId, {
                        from_date: fromDate.toISOString().split("T")[0],
                        to_date: today.toISOString().split("T")[0],
                    }),
                ]);

                setReminders(currentMedications.map((item, index) => buildMedicationReminder(item, selectedProfileId, index)));
                setLogs(adherence.records.map((record) => buildMedicationLog(record, selectedProfileId)));
            } catch (error) {
                console.error("Failed to load medication reminders", error);
                setReminders([]);
                setLogs([]);
                showToast("Không tải được dữ liệu nhắc thuốc", "error");
            } finally {
                setLoading(false);
            }
        };

        loadReminderData();
    }, [selectedProfileId, showToast]);

    const handleProfileChange = (profileId: string) => {
        setSelectedProfileId(profileId);
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("patientPortal_selectedProfileId", profileId);
        }
    };

    const todayString = getTodayString();
    const profileReminders = useMemo(
        () => reminders.filter((reminder) => reminder.profileId === selectedProfileId),
        [reminders, selectedProfileId],
    );

    const todayLogsMap = useMemo(() => {
        const map = new Map<string, MedicationLog>();
        logs
            .filter((log) => log.date === todayString)
            .forEach((log) => {
                const existing = map.get(log.reminderId);
                if (!existing) {
                    map.set(log.reminderId, log);
                    return;
                }

                const currentTime = existing.actualTime ?? "";
                const nextTime = log.actualTime ?? "";
                if (nextTime >= currentTime) {
                    map.set(log.reminderId, log);
                }
            });
        return map;
    }, [logs, todayString]);

    const todaySchedule = useMemo(
        () => profileReminders.map((reminder) => ({
            reminder,
            log: todayLogsMap.get(reminder.id),
        })),
        [profileReminders, todayLogsMap],
    );

    const compliance = useMemo(() => {
        const days: { date: string; taken: number; total: number; rate: number }[] = [];

        for (let offset = 6; offset >= 0; offset -= 1) {
            const date = new Date();
            date.setDate(date.getDate() - offset);
            const dateString = date.toISOString().split("T")[0];

            const dayLogs = logs.filter((log) => log.date === dateString);
            const takenReminderIds = new Set(dayLogs.filter((log) => log.status === "taken").map((log) => log.reminderId));
            const total = profileReminders.length;
            const taken = takenReminderIds.size;

            days.push({
                date: dateString,
                taken,
                total,
                rate: total > 0 ? Math.round((taken / total) * 100) : 0,
            });
        }

        return days;
    }, [logs, profileReminders]);

    const overallCompliance = compliance.length > 0
        ? Math.round(compliance.reduce((sum, item) => sum + item.rate, 0) / compliance.length)
        : 0;

    const handleSubmitAdherence = async (reminder: MedicationReminder, taken: boolean) => {
        if (!reminder.prescriptionDetailId) {
            showToast("Không tìm thấy mã chi tiết thuốc để ghi nhận", "error");
            return;
        }

        if (todayLogsMap.has(reminder.id)) {
            showToast("Thuốc này đã được ghi nhận hôm nay", "info");
            return;
        }

        setSubmittingId(reminder.id);
        try {
            const created = await medicationReminderService.createAdherence(selectedProfileId, {
                prescription_detail_id: reminder.prescriptionDetailId,
                adherence_date: todayString,
                taken,
                skip_reason: taken ? undefined : "PATIENT_SKIPPED",
            });

            setLogs((prev) => [...prev, buildMedicationLog(created, selectedProfileId)]);
            showToast(taken ? "Đã ghi nhận uống thuốc hôm nay" : "Đã ghi nhận bỏ qua hôm nay", "success");
        } catch (error) {
            console.error("Failed to save adherence", error);
            showToast("Không thể lưu ghi nhận dùng thuốc", "error");
        } finally {
            setSubmittingId(null);
        }
    };

    const tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: "today", label: "Hôm nay", icon: "today" },
        { key: "list", label: "Danh sách thuốc", icon: "medication" },
        { key: "stats", label: "Thống kê", icon: "analytics" },
    ];

    if (loading && !selectedProfileId) {
        return (
            <div className="flex justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-[#3C81C6]" style={{ fontSize: "32px" }}>progress_activity</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-[#121417] dark:text-white">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "28px" }}>medication</span>
                    {tp("title")}
                </h1>
                <p className="mt-1 text-sm text-[#687582]">{tp("subtitle")}</p>
            </div>

            {profiles.length > 0 ? (
                <div className="-mx-2 overflow-x-auto px-2 pb-2 hide-scrollbar">
                    <div className="flex min-w-max gap-3 pr-4 snap-x">
                        {profiles.map((profile) => (
                            <div
                                key={profile.id}
                                onClick={() => handleProfileChange(profile.id)}
                                className={`flex min-w-[240px] cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all snap-start ${
                                    selectedProfileId === profile.id
                                        ? "border-[#3C81C6] bg-blue-50/50 shadow-sm dark:bg-blue-900/20"
                                        : "border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-[#1e242b] dark:hover:border-blue-800"
                                }`}
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] text-sm font-bold text-white shadow-md shadow-[#3C81C6]/20">
                                    {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`truncate text-sm font-bold ${selectedProfileId === profile.id ? "text-[#3C81C6]" : "text-gray-900 dark:text-white"}`}>
                                        {profile.fullName}
                                    </p>
                                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{profile.phone || "Chưa có SĐT"}</p>
                                </div>
                                {selectedProfileId === profile.id ? (
                                    <span className="material-symbols-outlined text-[#3C81C6] shrink-0" style={{ fontSize: "20px" }}>check_circle</span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard icon="medication" label="Thuốc đang dùng" value={String(profileReminders.length)} color="text-[#3C81C6] bg-[#3C81C6]/10" />
                <StatCard icon="schedule" label="Cần ghi nhận hôm nay" value={String(todaySchedule.length)} color="text-violet-600 bg-violet-50 dark:bg-violet-500/10" />
                <StatCard icon="check_circle" label="Đã uống hôm nay" value={String(todaySchedule.filter((item) => item.log?.status === "taken").length)} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" />
                <StatCard icon="trending_up" label="Tuân thủ 7 ngày" value={`${overallCompliance}%`} color={overallCompliance >= 80 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : "text-amber-600 bg-amber-50 dark:bg-amber-500/10"} />
            </div>

            <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-[#13191f]">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                            activeTab === tab.key
                                ? "bg-white text-[#3C81C6] shadow-sm dark:bg-[#1e242b]"
                                : "text-[#687582] hover:text-[#121417] dark:hover:text-white"
                        }`}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-32 animate-pulse rounded-2xl border border-[#e5e7eb] bg-white dark:border-[#2d353e] dark:bg-[#1e242b]" />
                    ))}
                </div>
            ) : activeTab === "today" ? (
                todaySchedule.length === 0 ? (
                    <EmptyState
                        icon="medication"
                        title="Chưa có thuốc đang dùng"
                        message="Hồ sơ này hiện chưa có thuốc đang dùng từ đơn đã phát."
                    />
                ) : (
                    <div className="space-y-4">
                        {todaySchedule.map(({ reminder, log }) => (
                            <MedicationCard
                                key={reminder.id}
                                reminder={reminder}
                                todayLog={log}
                                onTake={(item) => handleSubmitAdherence(item, true)}
                                onSkip={(item) => handleSubmitAdherence(item, false)}
                                submittingId={submittingId}
                            />
                        ))}
                    </div>
                )
            ) : activeTab === "list" ? (
                profileReminders.length === 0 ? (
                    <EmptyState
                        icon="inventory_2"
                        title="Chưa có danh sách thuốc"
                        message="Danh sách sẽ xuất hiện khi hồ sơ có đơn thuốc đang còn hiệu lực."
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {profileReminders.map((reminder) => (
                            <MedicationCard key={reminder.id} reminder={reminder} todayLog={todayLogsMap.get(reminder.id)} />
                        ))}
                    </div>
                )
            ) : (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 dark:border-[#2d353e] dark:bg-[#1e242b]">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#121417] dark:text-white">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>bar_chart</span>
                            Tuân thủ 7 ngày gần nhất
                        </h3>
                        {compliance.every((item) => item.total === 0) ? (
                            <p className="text-sm text-[#687582]">Chưa có đủ dữ liệu để tính tỷ lệ tuân thủ.</p>
                        ) : (
                            <div className="flex h-40 items-end gap-2">
                                {compliance.map((day) => {
                                    const dayName = new Date(`${day.date}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "short" });
                                    const isToday = day.date === todayString;
                                    return (
                                        <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                                            <span className="text-[10px] font-bold text-[#121417] dark:text-white">{day.rate}%</span>
                                            <div className="h-[100px] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                                <div
                                                    className={`w-full rounded-lg transition-all ${day.rate >= 80 ? "bg-gradient-to-t from-emerald-500 to-emerald-400" : day.rate >= 50 ? "bg-gradient-to-t from-amber-500 to-amber-400" : "bg-gradient-to-t from-red-500 to-red-400"}`}
                                                    style={{ height: `${day.rate}%`, marginTop: `${100 - day.rate}%` }}
                                                />
                                            </div>
                                            <span className={`text-[10px] ${isToday ? "font-bold text-[#3C81C6]" : "text-gray-400"}`}>
                                                {isToday ? "Nay" : dayName}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 text-center dark:border-[#2d353e] dark:bg-[#1e242b]">
                            <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${overallCompliance >= 80 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-amber-50 dark:bg-amber-500/10"}`}>
                                <span className={`text-2xl font-black ${overallCompliance >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{overallCompliance}%</span>
                            </div>
                            <p className="text-sm font-bold text-[#121417] dark:text-white">Tỷ lệ tuân thủ</p>
                            <p className="text-xs text-[#687582]">Theo số thuốc cần ghi nhận mỗi ngày</p>
                        </div>
                        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 text-center dark:border-[#2d353e] dark:bg-[#1e242b]">
                            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#3C81C6]/10">
                                <span className="text-2xl font-black text-[#3C81C6]">{compliance.reduce((sum, item) => sum + item.taken, 0)}</span>
                            </div>
                            <p className="text-sm font-bold text-[#121417] dark:text-white">Lần đã uống</p>
                            <p className="text-xs text-[#687582]">Tổng số ghi nhận đạt trong 7 ngày</p>
                        </div>
                        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 text-center dark:border-[#2d353e] dark:bg-[#1e242b]">
                            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                                <span className="text-2xl font-black text-red-500">
                                    {compliance.reduce((sum, item) => sum + Math.max(item.total - item.taken, 0), 0)}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-[#121417] dark:text-white">Lần chưa đạt</p>
                            <p className="text-xs text-[#687582]">Bao gồm bỏ qua hoặc chưa ghi nhận</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
