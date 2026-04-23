"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getDepartments } from "@/services/departmentService";
import { staffService } from "@/services/staffService";
import { getPatients } from "@/services/patientService";
import { createAppointment } from "@/services/appointmentService";


export default function NewAppointmentPage() {
    const t = useTranslations("pages.portal.staff.appointmentsNew");
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [patientSearch, setPatientSearch] = useState("");
    const [searching, setSearching] = useState(false);
    const [foundPatients, setFoundPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [fd, setFd] = useState({
        patientName: "", phone: "", cccd: "", dob: "", gender: "Nam",
        department: "", departmentId: "", doctor: "", doctorId: "",
        date: "", time: "", type: "Khám mới", insurance: "", note: "",
    });
    const [deptList, setDeptList] = useState<{ id: string; name: string }[]>([]);
    const [doctorsByDept, setDoctorsByDept] = useState<Record<string, { id: string; name: string }[]>>({});

    useEffect(() => {
        // Load departments
        getDepartments()
            .then(res => {
                const items: any[] = (res as any)?.data?.data ?? (res as any)?.data ?? res ?? [];
                setDeptList(items.map((d: any) => ({ id: d.id ?? "", name: d.name ?? "" })));
            })
            .catch(() => {
                setDeptList([]);
            });

        // Load doctors
        staffService.getList({ limit: 200 })
            .then((res: any) => {
                const items: any[] = res?.data?.data ?? res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    const byDept: Record<string, { id: string; name: string }[]> = {};
                    items.forEach((d: any) => {
                        const dept = d.department?.name ?? d.departmentName ?? "Khác";
                        if (!byDept[dept]) byDept[dept] = [];
                        byDept[dept].push({ id: d.id ?? "", name: d.full_name ?? d.fullName ?? d.name ?? "" });
                    });
                    setDoctorsByDept(byDept);
                }
            })
            .catch(() => {});
    }, []);

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
        setSelectedPatient(p);
        setFd(prev => ({
            ...prev,
            patientName: p.full_name ?? p.fullName ?? p.name ?? "",
            phone: p.contact?.phone_number ?? p.phone ?? "",
            dob: p.date_of_birth ?? p.dob ?? "",
            gender: p.gender === "MALE" ? "Nam" : p.gender === "FEMALE" ? "Nữ" : p.gender ?? "Nam",
            insurance: p.insurance_number ?? p.bhyt ?? "",
        }));
        setFoundPatients([]);
        setPatientSearch("");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === "department") {
            const dept = deptList.find(d => d.name === value);
            setFd((p) => ({ ...p, department: value, departmentId: dept?.id ?? "", doctor: "", doctorId: "" }));
        } else if (name === "doctor") {
            const docs = doctorsByDept[fd.department] ?? [];
            const doc = docs.find(d => d.name === value);
            setFd((p) => ({ ...p, doctor: value, doctorId: doc?.id ?? "" }));
        } else {
            setFd((p) => ({ ...p, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fd.patientName && !selectedPatient) { alert("Vui lòng chọn bệnh nhân"); return; }
        if (!fd.date) { alert("Vui lòng chọn ngày"); return; }
        if (!fd.time) { alert("Vui lòng chọn giờ"); return; }
        if (!fd.patientName || !fd.phone) {
            alert("Vui lòng nhập đầy đủ thông tin bệnh nhân"); return;
        }
        setSaving(true);
        try {
            await createAppointment({
                patientId: selectedPatient?.id ?? undefined,
                patientName: fd.patientName,
                phone: fd.phone,
                departmentId: fd.departmentId || undefined,
                departmentName: fd.department || undefined,
                doctorId: fd.doctorId || undefined,
                doctorName: fd.doctor || undefined,
                date: fd.date,
                time: fd.time,
                type: fd.type === "Khám mới" ? "first_visit" : fd.type === "Tái khám" ? "re_examination" : fd.type,
                note: fd.note || undefined,
            });
            router.push("/portal/receptionist/appointments");
        } catch {
            alert("Đặt lịch hẹn thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const availableDoctors = fd.department ? (doctorsByDept[fd.department] ?? []) : [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/portal/receptionist/appointments" className="hover:text-[#3C81C6]">Lịch hẹn</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Đặt lịch hẹn mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">event_available</span> {t("title")}
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Patient search */}
                    <div>
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">search</span>
                            Tìm bệnh nhân (tùy chọn)
                        </h3>
                        <div className="flex gap-2">
                            <input type="text" value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handlePatientSearch())}
                                placeholder="Nhập tên, SĐT hoặc mã bệnh nhân..."
                                className="flex-1 py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            <button type="button" onClick={handlePatientSearch} disabled={searching}
                                className="px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                                {searching ? "..." : "Tìm"}
                            </button>
                        </div>
                        {foundPatients.length > 0 && (
                            <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                {foundPatients.map((p, i) => (
                                    <button key={p.id ?? i} type="button" onClick={() => selectPatient(p)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors">
                                        <p className="text-sm font-medium text-[#121417] dark:text-white">{p.full_name ?? p.fullName ?? p.name ?? "—"}</p>
                                        <p className="text-xs text-[#687582]">{p.contact?.phone_number ?? p.phone ?? ""} • {p.patient_code ?? p.id}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedPatient && (
                            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm">
                                <span className="material-symbols-outlined text-emerald-600 text-[16px]">person_check</span>
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{selectedPatient.full_name ?? selectedPatient.name}</span>
                                <button type="button" onClick={() => setSelectedPatient(null)} className="ml-auto text-gray-400 hover:text-red-500">
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <h3 className="col-span-full text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">person</span> Thông tin bệnh nhân
                        </h3>
                        <Inp label="Họ và tên *" name="patientName" value={fd.patientName} onChange={handleChange} placeholder="Nguyễn Văn A" />
                        <Inp label="Số điện thoại *" name="phone" value={fd.phone} onChange={handleChange} placeholder="0901 234 567" />
                        <Inp label="CCCD" name="cccd" value={fd.cccd} onChange={handleChange} placeholder="012345678901" />
                        <Inp label="Ngày sinh" name="dob" type="date" value={fd.dob} onChange={handleChange} />
                        <Sel label="Giới tính" name="gender" value={fd.gender} onChange={handleChange} options={["Nam", "Nữ"]} />
                        <Inp label="Số BHYT" name="insurance" value={fd.insurance} onChange={handleChange} placeholder="HC4012345678" />

                        <h3 className="col-span-full text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">calendar_month</span> Thông tin lịch hẹn
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chuyên khoa</label>
                            <select name="department" value={fd.department} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="">-- Chọn --</option>
                                {deptList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bác sĩ</label>
                            <select name="doctor" value={fd.doctor} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="">-- Chọn --</option>
                                {availableDoctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                        <Inp label="Ngày hẹn *" name="date" type="date" value={fd.date} onChange={handleChange} />
                        <Inp label="Giờ hẹn *" name="time" type="time" value={fd.time} onChange={handleChange} />
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Loại khám</label>
                            <div className="flex gap-2">
                                {["Khám mới", "Tái khám"].map((t) => (
                                    <button key={t} type="button" onClick={() => setFd((p) => ({ ...p, type: t }))}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${fd.type === t ? "bg-[#3C81C6]/10 border-[#3C81C6]/30 text-[#3C81C6]" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>{t}</button>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                            <textarea name="note" value={fd.note} onChange={handleChange} rows={2} placeholder="Triệu chứng, lý do khám..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Đặt lịch hẹn</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Inp({ label, name, type = "text", value, onChange, placeholder }: { label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" /></div>);
}
function Sel({ label, name, value, onChange, options }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><select name={name} value={value} onChange={onChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>);
}
