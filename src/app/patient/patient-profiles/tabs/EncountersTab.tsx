import React, { useCallback, useEffect, useMemo, useState } from "react";
import { type PatientProfile } from "@/types/patient-profile";
import axiosClient from "@/api/axiosClient";
import { APPOINTMENT_ENDPOINTS, ENCOUNTER_ENDPOINTS, PATIENT_ENDPOINTS_EXT } from "@/api/endpoints";

interface TabProps {
    profile: PatientProfile;
}

export default function EncountersTab({ profile }: TabProps) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const patientId = profile.id;
            if (!patientId) return;

            const [encounterRes, appointmentRes] = await Promise.all([
                axiosClient.get(ENCOUNTER_ENDPOINTS.BY_PATIENT(patientId)).catch(() => null),
                axiosClient.get(PATIENT_ENDPOINTS_EXT.PATIENT_APPOINTMENTS(patientId)).catch(() => axiosClient.get(APPOINTMENT_ENDPOINTS.BY_PATIENT(patientId)).catch(() => null)),
            ]);

            const encounters = encounterRes?.data?.data || encounterRes?.data || [];
            const appointments = appointmentRes?.data?.data || appointmentRes?.data || [];

            const normalizedEncounters = Array.isArray(encounters) ? encounters.map((item: any) => ({
                id: item.encounters_id || item.encounter_id || item.id,
                type: "encounter",
                title: item.departmentName || item.department_name || item.specialty_name || "Khám bệnh",
                subtitle: item.reasonForVisit || item.reason_for_visit || item.notes || "Không có ghi chú",
                date: item.encounterDate || item.encounter_date || item.start_time || item.created_at,
                status: item.status || "COMPLETED",
                doctorName: item.doctor_name || item.doctorName || "",
            })) : [];

            const normalizedAppointments = Array.isArray(appointments) ? appointments.map((item: any) => ({
                id: item.appointments_id || item.id,
                type: "appointment",
                title: item.department_name || item.departmentName || item.specialty_name || "Lịch hẹn",
                subtitle: item.reason_for_visit || item.reason || item.notes || "Không có ghi chú",
                date: item.appointment_date || item.date || item.created_at,
                status: item.status || "PENDING",
                doctorName: item.doctor_name || item.doctorName || "",
            })) : [];

            setEvents([...normalizedAppointments, ...normalizedEncounters]);
        } catch (error) {
            console.error("Error fetching timeline events:", error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [profile.id]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    }, [events]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Khám bệnh & lịch hẹn</h3>
                    <p className="text-sm text-gray-500 mt-1">Gộp cả lịch hẹn và lần khám để theo dõi liên tục luồng điều trị.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : sortedEvents.length > 0 ? (
                <div className="space-y-4">
                    {sortedEvents.map((event) => (
                        <div key={`${event.type}-${event.id}`} className="bg-gray-50 dark:bg-[#13191f] rounded-2xl p-5 border border-gray-100 dark:border-[#2d353e]">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${event.type === "encounter" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>
                                            {event.type === "encounter" ? "Lần khám" : "Lịch hẹn"}
                                        </span>
                                        <span className="text-xs text-gray-400">{event.date ? new Date(event.date).toLocaleString("vi-VN") : "Chưa có thời gian"}</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-base">{event.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{event.subtitle}</p>
                                    {event.doctorName && <p className="text-sm text-gray-500 mt-2">Bác sĩ phụ trách: {event.doctorName}</p>}
                                </div>
                                <span className="px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider bg-white dark:bg-[#0f141b] text-[#3C81C6] border border-blue-100 dark:border-[#2d353e]">
                                    {event.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-[#13191f] rounded-2xl p-10 text-center border border-gray-100 dark:border-[#2d353e]">
                    <div className="w-16 h-16 bg-[#3C81C6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "32px" }}>stethoscope</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Chưa có lịch sử khám bệnh</h4>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">Các lịch hẹn, lần khám và trạng thái theo dõi sẽ hiển thị tại đây.</p>
                </div>
            )}
        </div>
    );
}
