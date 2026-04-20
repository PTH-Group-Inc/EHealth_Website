"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getMyAppointments, type Appointment } from "@/services/appointmentService";
import { AppointmentStatusBadge } from "@/components/patient/AppointmentStatusBadge";
import { loadFromStorage, STORAGE_KEYS } from "@/utils/localStorage";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { AISymptomCheckerWidget, AIHealthCoach, AIAppointmentSuggester } from "@/components/portal/ai";
import { ehrService } from "@/services/ehrService";
import { patientProfileService } from "@/services/patientProfileService";
import { telemedicineService, type TelemedicineSession } from "@/services/telemedicineService";
import { VitalCard } from "@/components/shared/cards";

interface MedicationReminder {
    id: string; profileId: string; medicationName: string; dosage: string;
    frequency: number; timesOfDay: string[]; instructions?: string;
    startDate: string; endDate?: string; isActive: boolean; color: string;
}
interface MedicationLog {
    id: string; reminderId: string; profileId: string; date: string;
    time: string; status: "taken" | "missed" | "skipped"; note?: string;
}

export default function PatientDashboard() {
    const { user } = useAuth();
    usePageAIContext({ pageKey: 'patient-dashboard' });
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    // Vital signs từ API
    const [latestVital, setLatestVital] = useState<{
        bloodPressureSystolic: number; bloodPressureDiastolic: number;
        heartRate: number; bmi: number; spo2?: number;
    } | null>(null);
    const [loadingVitals, setLoadingVitals] = useState(true);

    // Thuốc đang dùng từ API
    const [activeMedCount, setActiveMedCount] = useState<number | null>(null);

    // Medication data from localStorage (synced with medication-reminders page)
    const [reminders, setReminders] = useState<MedicationReminder[]>([]);
    const [medLogs, setMedLogs] = useState<MedicationLog[]>([]);

    // Telemedicine sessions từ API
    const [upcomingTele, setUpcomingTele] = useState<TelemedicineSession[]>([]);

    useEffect(() => {
        loadData();
        loadEHRData();
        loadTele();
        // Load medication data từ localStorage
        const storedRem = loadFromStorage<MedicationReminder[]>(STORAGE_KEYS.MEDICATION_REMINDERS, []);
        const storedLogs = loadFromStorage<MedicationLog[]>(STORAGE_KEYS.MEDICATION_LOGS, []);
        setReminders(storedRem);
        setMedLogs(storedLogs);
    }, [user?.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getMyAppointments({ status: "PENDING,CONFIRMED", limit: 5 });
            if (res.data && res.data.length > 0) setUpcomingAppointments(res.data);
            else setUpcomingAppointments([]);
        } catch {
            setUpcomingAppointments([]);
        } finally { setLoading(false); }
    };

    const loadEHRData = async () => {
        if (!user?.id) return;
        setLoadingVitals(true);
        try {
            // EHR endpoints cần patient_id (không phải user/account_id)
            // → Lấy default profile trước, rồi query EHR theo patient_id thật
            let patientId: string | null = null;
            try {
                const def = await patientProfileService.getDefault();
                patientId = def?.id ?? null;
            } catch { /* không có profile mặc định, bỏ qua */ }
            if (!patientId) {
                setLoadingVitals(false);
                return;
            }

            const [vitalRes, medRes] = await Promise.allSettled([
                ehrService.getVitalLatest(patientId),
                ehrService.getCurrentMedications(patientId),
            ]);

            // Vital signs
            if (vitalRes.status === "fulfilled" && vitalRes.value) {
                const v = vitalRes.value;
                setLatestVital({
                    bloodPressureSystolic: Number(v.bloodPressureSystolic ?? v.systolic ?? v.bp_systolic ?? 0),
                    bloodPressureDiastolic: Number(v.bloodPressureDiastolic ?? v.diastolic ?? v.bp_diastolic ?? 0),
                    heartRate: Number(v.heartRate ?? v.heart_rate ?? v.pulse ?? 0),
                    bmi: Number(v.bmi ?? 0),
                    spo2: v.spo2 != null ? Number(v.spo2) : v.oxygenSaturation != null ? Number(v.oxygenSaturation) : undefined,
                });
            }

            // Active medications count
            if (medRes.status === "fulfilled" && medRes.value.data) {
                const activeMeds = medRes.value.data.filter((m: any) => (m.status ?? "active") === "active");
                setActiveMedCount(activeMeds.length);
            }
        } catch {
            // API fail → hiển thị "—"
        } finally {
            setLoadingVitals(false);
        }
    };

    const loadTele = async () => {
        try {
            const res = await telemedicineService.getList({ patientId: user?.id ?? "", status: "scheduled" });
            setUpcomingTele(res.data ?? []);
        } catch {
            setUpcomingTele([]);
        }
    };

    const greeting = () => { const h = new Date().getHours(); if (h < 12) return "Chào buổi sáng"; if (h < 18) return "Chào buổi chiều"; return "Chào buổi tối"; };

    // Tính today schedule từ localStorage reminders
    const todayStr = new Date().toISOString().split("T")[0];
    const activeRemindersList = reminders.filter(r => r.isActive && r.startDate <= todayStr && (!r.endDate || r.endDate >= todayStr));
    const todayMeds = activeRemindersList.flatMap(r =>
        r.timesOfDay.map(time => ({
            time,
            reminder: r,
            log: medLogs.find(l => l.reminderId === r.id && l.date === todayStr && l.time === time),
        }))
    ).sort((a, b) => a.time.localeCompare(b.time));

    const vitalCards = [
        { label: "Huyết áp", value: latestVital ? `${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic}` : "—", unit: "mmHg", icon: "bloodtype", ok: !latestVital || latestVital.bloodPressureSystolic <= 130 },
        { label: "Nhịp tim", value: latestVital ? `${latestVital.heartRate}` : "—", unit: "bpm", icon: "cardiology", ok: true },
        { label: "BMI", value: latestVital ? Number(latestVital.bmi).toFixed(1) : "—", unit: "", icon: "monitor_weight", ok: !latestVital || Number(latestVital.bmi) <= 25 },
        { label: "SpO2", value: latestVital ? `${latestVital.spo2 ?? "—"}` : "—", unit: "%", icon: "pulmonology", ok: true },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-[#3C81C6] to-[#2563eb] rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                <div className="relative">
                    <p className="text-blue-100 text-sm font-medium mb-1">{greeting()}</p>
                    <h1 className="text-2xl font-bold mb-2">{user?.fullName || "Bệnh nhân"} 👋</h1>
                    <p className="text-blue-100 text-sm max-w-lg">
                        Chào mừng bạn đến với cổng bệnh nhân EHealth. Quản lý lịch hẹn, xem kết quả khám và cập nhật hồ sơ sức khoẻ tại đây.
                    </p>
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: "calendar_month", label: "Đặt lịch khám", desc: "Đặt lịch mới", href: "/booking", color: "from-[#3C81C6] to-[#2563eb]" },
                    { icon: "event_note", label: "Lịch hẹn", desc: `${upcomingAppointments.length} sắp tới`, href: "/patient/appointments", color: "from-emerald-500 to-emerald-600" },
                    { icon: "medication", label: "Nhắc thuốc", desc: activeMedCount !== null ? `${activeMedCount} thuốc đang dùng` : "Quản lý thuốc", href: "/patient/medication-reminders", color: "from-violet-500 to-violet-600" },
                    { icon: "smart_toy", label: "AI tư vấn", desc: "Hỏi triệu chứng", href: "/patient/ai-consult", color: "from-cyan-500 to-teal-600" },
                ].map(item => (
                    <Link key={item.label} href={item.href}
                        className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5 hover:shadow-lg hover:border-[#3C81C6]/20 transition-all group">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg mb-3`}>
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "22px" }}>{item.icon}</span>
                        </div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white group-hover:text-[#3C81C6] transition-colors">{item.label}</h3>
                        <p className="text-xs text-[#687582] mt-0.5">{item.desc}</p>
                    </Link>
                ))}
            </div>

            {/* Health Stats Quick View — từ API */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {loadingVitals ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] p-3 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
                                <div className="space-y-1.5">
                                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-14" />
                                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-20" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        <VitalCard kind="bp" value={latestVital?.bloodPressureSystolic ?? null} secondary={latestVital?.bloodPressureDiastolic} compact />
                        <VitalCard kind="heartRate" value={latestVital?.heartRate ?? null} compact />
                        <VitalCard kind="bmi" value={latestVital?.bmi ?? null} compact />
                        <VitalCard kind="spo2" value={latestVital?.spo2 ?? null} compact />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming appointments */}
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e]">
                    <div className="flex items-center justify-between p-5 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                        <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>event_upcoming</span>
                            Lịch hẹn sắp tới
                        </h2>
                        <Link href="/patient/appointments" className="text-sm text-[#3C81C6] font-medium hover:underline">Xem tất cả →</Link>
                    </div>
                    <div className="p-5">
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                                        <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" /><div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" /></div>
                                    </div>
                                ))}
                            </div>
                        ) : upcomingAppointments.length === 0 ? (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 mb-3" style={{ fontSize: "48px" }}>event_upcoming</span>
                                <p className="text-sm text-[#687582] mb-4">Chưa có lịch hẹn nào sắp tới</p>
                                <Link href="/booking" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>Đặt lịch khám
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingAppointments.map(apt => (
                                    <Link key={apt.id} href={`/patient/appointments/${apt.id}`}
                                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors group">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10 flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-base font-bold text-[#3C81C6] leading-none">{apt.date?.split("-")[2] || "--"}</span>
                                            <span className="text-[9px] text-[#3C81C6]/70 font-medium">T{apt.date?.split("-")[1] || "--"}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-[#121417] dark:text-white group-hover:text-[#3C81C6] transition-colors truncate">{apt.doctorName || "Bác sĩ"}</h4>
                                            <p className="text-xs text-[#687582] truncate">{apt.departmentName || "Chuyên khoa"} • {apt.time || "--:--"}</p>
                                        </div>
                                        <AppointmentStatusBadge status={apt.status} />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column Widgets */}
                <div className="space-y-6">
                    {/* Upcoming Tele */}
                    {upcomingTele.length > 0 && (
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>videocam</span>
                                    Lịch khám từ xa
                                </h3>
                                <Link href="/patient/telemedicine" className="text-xs text-[#3C81C6] font-medium hover:underline">Xem →</Link>
                            </div>
                            {upcomingTele.map(s => (
                                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f] mb-2 last:mb-0">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white" style={{ fontSize: "18px" }}>videocam</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{s.doctorName}</p>
                                        <p className="text-xs text-[#687582]">{s.date} • {s.time} • {s.department}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Medication Reminder Widget — localStorage */}
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-violet-500" style={{ fontSize: "20px" }}>medication</span>
                                Nhắc thuốc hôm nay
                            </h3>
                            <Link href="/patient/medication-reminders" className="text-xs text-[#3C81C6] font-medium hover:underline">Xem tất cả →</Link>
                        </div>
                        {todayMeds.length === 0 ? (
                            <p className="text-xs text-[#687582] text-center py-4">Không có thuốc cần uống hôm nay</p>
                        ) : (
                            <div className="space-y-2">
                                {todayMeds.slice(0, 4).map((item, idx) => {
                                    const isTaken = item.log?.status === "taken";
                                    const isMissed = item.log?.status === "missed";
                                    return (
                                        <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                                            isTaken ? "bg-emerald-50/50 dark:bg-emerald-500/5" : isMissed ? "bg-red-50/50 dark:bg-red-500/5" : "bg-[#f6f7f8] dark:bg-[#13191f]"
                                        }`}>
                                            <span className={`text-xs font-bold w-12 text-center ${
                                                isTaken ? "text-emerald-600" : isMissed ? "text-red-500" : "text-[#121417] dark:text-white"
                                            }`}>{item.time}</span>
                                            <div className={`w-0.5 h-6 rounded-full bg-gradient-to-b ${item.reminder.color}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold truncate ${isTaken ? "text-emerald-700 dark:text-emerald-400 line-through" : "text-[#121417] dark:text-white"}`}>
                                                    {item.reminder.medicationName}
                                                </p>
                                                <p className="text-[10px] text-[#687582]">{item.reminder.dosage}</p>
                                            </div>
                                            {isTaken && <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: "16px" }}>check_circle</span>}
                                            {isMissed && <span className="material-symbols-outlined text-red-400" style={{ fontSize: "16px" }}>error</span>}
                                        </div>
                                    );
                                })}
                                {todayMeds.length > 4 && (
                                    <p className="text-[10px] text-center text-[#687582]">+{todayMeds.length - 4} thuốc khác</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3">Truy cập nhanh</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { icon: "folder_shared", label: "Kết quả khám", href: "/patient/medical-records", color: "text-violet-500 bg-violet-50 dark:bg-violet-500/10" },
                                { icon: "family_restroom", label: "Hồ sơ BN", href: "/patient/patient-profiles", color: "text-[#3C81C6] bg-[#3C81C6]/10" },
                                { icon: "receipt_long", label: "Thanh toán", href: "/patient/billing", color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
                                { icon: "videocam", label: "Khám từ xa", href: "/patient/telemedicine", color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10" },
                                { icon: "manage_accounts", label: "Tài khoản", href: "/patient/profile", color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10" },
                                { icon: "monitor_heart", label: "Hồ sơ sức khỏe", href: "/patient/health-records", color: "text-green-500 bg-green-50 dark:bg-green-500/10" },
                            ].map(l => (
                                <Link key={l.label} href={l.href} className="flex items-center gap-2 p-3 rounded-xl hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                    <div className={`w-8 h-8 rounded-lg ${l.color} flex items-center justify-center`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{l.icon}</span>
                                    </div>
                                    <span className="text-sm font-medium text-[#121417] dark:text-white">{l.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== AI WIDGETS ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AISymptomCheckerWidget />
                <AIHealthCoach />
                <AIAppointmentSuggester />
            </div>

            {/* Health tips */}
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: "22px" }}>favorite</span>
                    Lời khuyên sức khoẻ
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { icon: "water_drop", title: "Uống đủ nước", desc: "Nên uống 2–3 lít nước mỗi ngày để cơ thể hoạt động tốt nhất", color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
                        { icon: "directions_run", title: "Vận động thường xuyên", desc: "30 phút vận động mỗi ngày giúp tăng cường sức đề kháng", color: "text-green-500 bg-green-50 dark:bg-green-500/10" },
                        { icon: "bedtime", title: "Ngủ đủ giấc", desc: "7–8 tiếng ngủ mỗi đêm giúp cơ thể phục hồi và tái tạo năng lượng", color: "text-violet-500 bg-violet-50 dark:bg-violet-500/10" },
                    ].map(tip => (
                        <div key={tip.title} className="flex gap-3 p-3 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f]">
                            <div className={`w-10 h-10 rounded-xl ${tip.color} flex items-center justify-center flex-shrink-0`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{tip.icon}</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-[#121417] dark:text-white">{tip.title}</h4>
                                <p className="text-xs text-[#687582] mt-0.5 leading-relaxed">{tip.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
