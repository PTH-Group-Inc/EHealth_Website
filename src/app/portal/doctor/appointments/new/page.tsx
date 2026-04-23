"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createAppointment, doctorAvailabilityService } from "@/services/appointmentService";
import { getDepartments } from "@/services/departmentService";
import { staffService } from "@/services/staffService";
import { getPatients } from "@/services/patientService";
import { useAuth } from "@/contexts/AuthContext";

export default function NewAppointmentPage() {
    const t = useTranslations("pages.portal.doctor.appointmentsNew");
    const router = useRouter();
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [deptList, setDeptList] = useState<string[]>([]);
    const [deptIdMap, setDeptIdMap] = useState<Record<string, string>>({});
    const [doctorsByDept, setDoctorsByDept] = useState<Record<string, { id: string; name: string }[]>>({});
    const [formData, setFormData] = useState({
        patientName: "", phone: "", patientId: "", department: "", doctor: "", doctorId: "",
        date: "", time: "", type: "Khám mới", note: "",
    });
    // Patient search
    const [patientSearch, setPatientSearch] = useState("");
    const [searching, setSearching] = useState(false);
    const [foundPatients, setFoundPatients] = useState<any[]>([]);
    // Availability slots
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    useEffect(() => {
        getDepartments()
            .then((res: any) => {
                const items: any[] = res?.data?.data ?? res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    setDeptList(items.map((d: any) => d.name));
                    const idMap: Record<string, string> = {};
                    items.forEach((d: any) => { idMap[d.name] = d.id; });
                    setDeptIdMap(idMap);
                }
            })
            .catch(() => {});
        staffService.getList({ limit: 200 })
            .then((res: any) => {
                const items: any[] = res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    const byDept: Record<string, { id: string; name: string }[]> = {};
                    items.forEach((d: any) => {
                        const dept = d.department?.name ?? d.departmentName ?? "Khác";
                        if (!byDept[dept]) byDept[dept] = [];
                        byDept[dept].push({ id: d.id, name: d.full_name ?? d.fullName ?? d.name ?? "" });
                    });
                    setDoctorsByDept(byDept);
                }
            })
            .catch(() => {});
    }, []);

    // Load available slots when doctor or date changes
    useEffect(() => {
        const doctorId = formData.doctorId || user?.id;
        if (doctorId && formData.date) {
            doctorAvailabilityService.getSlots({ doctorId, date: formData.date })
                .then((slots: any[]) => {
                    if (slots.length > 0) {
                        const times = slots
                            .filter((s: any) => s.available !== false)
                            .map((s: any) => s.startTime ?? s.time ?? "")
                            .filter(Boolean);
                        setAvailableSlots(times);
                    } else {
                        setAvailableSlots([]);
                    }
                })
                .catch(() => setAvailableSlots([]));
        }
    }, [formData.doctorId, formData.date, user?.id]);

    const handlePatientSearch = async () => {
        if (!patientSearch.trim()) return;
        setSearching(true);
        try {
            const res = await getPatients({ search: patientSearch.trim(), limit: 5 });
            const items: any[] = (res as any)?.data?.data ?? (res as any)?.data ?? [];
            setFoundPatients(Array.isArray(items) ? items : []);
        } catch {
            setFoundPatients([]);
        } finally {
            setSearching(false);
        }
    };

    const selectPatient = (p: any) => {
        setFormData(prev => ({
            ...prev,
            patientId: p.id ?? "",
            patientName: p.full_name ?? p.fullName ?? p.name ?? "",
            phone: p.contact?.phone_number ?? p.phone ?? "",
        }));
        setFoundPatients([]);
        setPatientSearch("");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === "department") {
            setFormData((prev) => ({ ...prev, department: value, doctor: "", doctorId: "" }));
        } else if (name === "doctor") {
            const docs = availableDoctorsApi.length > 0 ? availableDoctorsApi : [];
            const doc = docs.find(d => d.name === value);
            setFormData((prev) => ({ ...prev, doctor: value, doctorId: doc?.id ?? "" }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientName || !formData.phone || !formData.date || !formData.time) {
            alert("Vui lòng nhập đầy đủ thông tin"); return;
        }
        setSaving(true);
        try {
            await createAppointment({
                patientId: formData.patientId || undefined,
                patientName: formData.patientName,
                phone: formData.phone,
                departmentId: deptIdMap[formData.department] ?? undefined,
                departmentName: formData.department || undefined,
                doctorId: formData.doctorId || user?.id || undefined,
                doctorName: formData.doctor || undefined,
                date: formData.date,
                time: formData.time,
                type: formData.type === "Khám mới" ? "first_visit" : formData.type === "Tái khám" ? "re_examination" : formData.type,
                note: formData.note || undefined,
            });
            router.push("/portal/doctor/appointments");
        } catch {
            alert("Tạo lịch hẹn thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const availableDoctorsApi = formData.department ? (doctorsByDept[formData.department] || []) : [];
    const availableDoctors = availableDoctorsApi.map((d) => d.name);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/portal/doctor/appointments" className="hover:text-[#3C81C6]">Lịch hẹn</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Tạo lịch hẹn mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">calendar_add_on</span> {t("title")}
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Patient search */}
                    <div>
                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tìm bệnh nhân</label>
                        <div className="flex gap-2">
                            <input type="text" value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handlePatientSearch())}
                                placeholder="Tên, SĐT hoặc mã BN..."
                                className="flex-1 py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            <button type="button" onClick={handlePatientSearch} disabled={searching}
                                className="px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm transition-colors disabled:opacity-60">
                                {searching ? "..." : "Tìm"}
                            </button>
                        </div>
                        {foundPatients.length > 0 && (
                            <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                {foundPatients.map((p, i) => (
                                    <button key={p.id ?? i} type="button" onClick={() => selectPatient(p)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors">
                                        <p className="text-sm font-medium text-[#121417] dark:text-white">{p.full_name ?? p.name ?? "—"}</p>
                                        <p className="text-xs text-[#687582]">{p.contact?.phone_number ?? p.phone ?? ""} • {p.patient_code ?? p.id}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Inp label="Tên bệnh nhân *" name="patientName" value={formData.patientName} onChange={handleChange} placeholder="Nhập họ tên" icon="person" />
                        <Inp label="Số điện thoại *" name="phone" value={formData.phone} onChange={handleChange} placeholder="0901 234 567" icon="phone" />
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chuyên khoa</label>
                            <select name="department" value={formData.department} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="">-- Chọn chuyên khoa --</option>
                                {deptList.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bác sĩ</label>
                            <select name="doctor" value={formData.doctor} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="">-- Chọn bác sĩ --</option>
                                {availableDoctors.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <Inp label="Ngày hẹn *" name="date" type="date" value={formData.date} onChange={handleChange} icon="event" />
                        {availableSlots.length > 0 ? (
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Giờ hẹn * <span className="text-xs text-emerald-600">(slot trống)</span></label>
                                <div className="flex flex-wrap gap-2">
                                    {availableSlots.map(t => (
                                        <button key={t} type="button" onClick={() => setFormData(p => ({ ...p, time: t }))}
                                            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${formData.time === t ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white hover:border-[#3C81C6]"}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Inp label="Giờ hẹn *" name="time" type="time" value={formData.time} onChange={handleChange} icon="schedule" />
                        )}
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Loại khám</label>
                            <div className="flex gap-2">
                                {["Khám mới", "Tái khám", "Cấp cứu"].map((t) => (
                                    <button key={t} type="button" onClick={() => setFormData((p) => ({ ...p, type: t }))}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${formData.type === t ? "bg-[#3C81C6]/10 border-[#3C81C6]/30 text-[#3C81C6]" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                            <textarea name="note" value={formData.note} onChange={handleChange} rows={2} placeholder="Lý do khám, triệu chứng..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Tạo lịch hẹn</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Inp({ label, name, type = "text", value, onChange, placeholder, icon }: { label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; icon?: string }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><div className="relative">{icon && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]"><span className="material-symbols-outlined text-[18px]">{icon}</span></span>}<input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full py-2.5 ${icon ? "pl-10" : "pl-4"} pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400`} /></div></div>);
}
