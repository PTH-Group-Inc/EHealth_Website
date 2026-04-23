"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getPatients, createPatient } from "@/services/patientService";
import { createAppointment, doctorAvailabilityService } from "@/services/appointmentService";
import { getDepartments } from "@/services/departmentService";
import { AITriageAssistant } from "@/components/portal/ai";
import { AISchedulingOptimizer } from "@/components/portal/ai";
import { usePageAIContext } from "@/hooks/usePageAIContext";

const WIZARD_STEPS = [
    { key: "patient", label: "Hồ sơ BN", icon: "person_search" },
    { key: "service", label: "Dịch vụ / Khoa", icon: "medical_services" },
    { key: "assign", label: "Gán BS & Slot", icon: "event_available" },
    { key: "confirm", label: "Xác nhận", icon: "verified" },
];

type DeptItem = { id: string; name: string; doctors: string[] };

export default function ReceptionPage() {
    const t = useTranslations("pages.portal.staff.reception");
    usePageAIContext({ pageKey: 'reception' });
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [searchType, setSearchType] = useState<"phone" | "cccd" | "bhyt">("phone");
    const [searchQuery, setSearchQuery] = useState("");
    const [foundPatient, setFoundPatient] = useState<{ id: string; name: string; age: number; gender: string; phone: string; address: string; insurance: string; lastVisit: string } | null>(null);
    const [isNewPatient, setIsNewPatient] = useState(false);
    const [searching, setSearching] = useState(false);
    const [newPatient, setNewPatient] = useState({ name: "", phone: "", gender: "male", age: "", address: "", insurance: "" });
    const [selectedDept, setSelectedDept] = useState("");
    const [serviceType, setServiceType] = useState("regular");
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [apiSlots, setApiSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [departments, setDepartments] = useState<DeptItem[]>([]);

    useEffect(() => {
        getDepartments()
            .then(res => {
                const items: any[] = (res as any)?.data?.data ?? (res as any)?.data ?? res ?? [];
                setDepartments(items.map((d: any) => ({
                    id: d.id ?? d._id ?? String(d.departmentId ?? ""),
                    name: d.name ?? d.departmentName ?? "",
                    doctors: d.doctors?.map((doc: any) => doc.fullName ?? doc.name ?? doc) ?? [],
                })));
            })
            .catch(() => setDepartments([]));
    }, []);

    const dept = departments.find(d => d.id === selectedDept);

    // Load available slots when doctor selected
    useEffect(() => {
        if (!selectedDoctor) { setApiSlots([]); return; }
        const today = new Date().toISOString().split("T")[0];
        // Find doctorId from department staff list (bestcaffort)
        const deptObj = departments.find(d => d.id === selectedDept);
        const doctorId = (deptObj?.doctors as any[])?.find((doc: any) => (doc.fullName ?? doc.name ?? doc) === selectedDoctor)?.id ?? "";
        if (!doctorId) return;
        doctorAvailabilityService.getSlots({ doctorId, date: today })
            .then((slots: any[]) => {
                if (slots.length > 0) {
                    setApiSlots(slots.map((s: any) => ({
                        time: s.startTime ?? s.time ?? "",
                        available: s.available !== false && (s.bookedCount ?? 0) < (s.maxPatients ?? 999),
                    })).filter(s => s.time));
                }
            })
            .catch(() => { setApiSlots([]); });
    }, [selectedDoctor, selectedDept]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const res = await getPatients({ search: searchQuery.trim(), limit: 5 });
            const items: any[] = (res as any)?.data?.data ?? (res as any)?.data ?? [];
            if (Array.isArray(items) && items.length > 0) {
                const p = items[0];
                setFoundPatient({
                    id: p.patient_code ?? p.id ?? "",
                    name: p.full_name ?? p.name ?? "",
                    age: p.age ?? (p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : 0),
                    gender: p.gender === "MALE" ? "Nam" : p.gender === "FEMALE" ? "Nữ" : p.gender ?? "",
                    phone: p.contact?.phone_number ?? p.phone ?? "",
                    address: p.contact?.street_address ?? p.address ?? "",
                    insurance: p.insurance_number ?? p.bhyt ?? "",
                    lastVisit: p.lastVisitDate ?? p.lastVisit ?? "—",
                });
                setIsNewPatient(false);
            } else {
                setFoundPatient(null);
                setIsNewPatient(true);
            }
        } catch {
            setFoundPatient(null);
            setIsNewPatient(true);
        } finally {
            setSearching(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 0: return foundPatient || (isNewPatient && newPatient.name && newPatient.phone);
            case 1: return !!selectedDept;
            case 2: return !!selectedDoctor && !!selectedSlot;
            case 3: return true;
            default: return false;
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            let patientId = foundPatient?.id ?? null;
            // Tạo bệnh nhân mới nếu là ca mới
            if (isNewPatient && newPatient.name && newPatient.phone) {
                const created = await createPatient({
                    full_name: newPatient.name,
                    date_of_birth: newPatient.age ? `${new Date().getFullYear() - parseInt(newPatient.age)}-01-01` : '',
                    gender: newPatient.gender === "male" ? "MALE" : "FEMALE",
                    phone_number: newPatient.phone,
                    address: newPatient.address || undefined,
                });
                patientId = (created as any)?.data?.id ?? (created as any)?.data?.patient_id ?? null;
            }
            // Tạo lịch hẹn
            if (patientId) {
                await createAppointment({
                    patientId,
                    departmentId: selectedDept,
                    doctorId: undefined,
                    date: new Date().toISOString().split("T")[0],
                    time: selectedSlot,
                    reason,
                    type: serviceType,
                } as any);
            }
            setDone(true);
        } catch {
            alert("Tiếp nhận thất bại. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        const patientName = foundPatient?.name || newPatient.name;
        return (
            <div className="p-6 md:p-8">
                <div className="max-w-lg mx-auto text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-5 animate-bounce">
                        <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
                    </div>
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white mb-2">Tiếp nhận thành công!</h1>
                    <p className="text-sm text-[#687582] mb-1">Bệnh nhân <strong>{patientName}</strong> đã được đưa vào hàng đợi.</p>
                    <p className="text-sm text-[#687582] mb-6">Bác sĩ: <strong>{selectedDoctor}</strong> • Lúc: <strong>{selectedSlot}</strong></p>
                    <div className="flex items-center justify-center gap-3">
                        <button onClick={() => router.push("/portal/receptionist/queue")} className="px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold transition-colors">Xem hàng đợi</button>
                        <button onClick={() => { setDone(false); setStep(0); setFoundPatient(null); setIsNewPatient(false); setSearchQuery(""); setSelectedDept(""); setSelectedDoctor(""); setSelectedSlot(""); setReason(""); }}
                            className="px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">person_add</span>Tiếp nhận tiếp
                        </button>
                    </div>
                    <button onClick={() => alert("In phiếu khám...")} className="mt-4 text-sm text-[#3C81C6] hover:text-[#2a6da8] flex items-center gap-1 mx-auto">
                        <span className="material-symbols-outlined text-[16px]">print</span>In phiếu khám
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8"><div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]">how_to_reg</span>{t("title")}
                </h1>
                <p className="text-sm text-[#687582] mt-1">{t("subtitle")}</p>
            </div>

            {/* Step Progress */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] px-5 py-4">
                <div className="flex items-center gap-0">
                    {WIZARD_STEPS.map((s, i) => {
                        const isDone = i < step;
                        const isCurrent = i === step;
                        return (
                            <div key={s.key} className="flex items-center flex-1 last:flex-none">
                                <button onClick={() => i <= step && setStep(i)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${isCurrent ? "bg-[#3C81C6] text-white shadow-md" : isDone ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer" : "text-[#b0b8c1] cursor-default"}`}>
                                    <span className="material-symbols-outlined text-[18px]">{isDone ? "check_circle" : s.icon}</span>
                                    <span className="hidden sm:inline">{s.label}</span>
                                </button>
                                {i < WIZARD_STEPS.length - 1 && <div className={`flex-1 h-[2px] mx-1 rounded ${isDone ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-6">
                {/* Step 0: Find Patient */}
                {step === 0 && (
                    <div className="space-y-5">
                        <h2 className="text-base font-bold text-[#121417] dark:text-white">Tìm hoặc tạo hồ sơ bệnh nhân</h2>
                        <div className="flex gap-2">
                            {([["phone", "SĐT"], ["cccd", "CCCD"], ["bhyt", "BHYT"]] as const).map(([type, label]) => (
                                <button key={type} onClick={() => setSearchType(type)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${searchType === type ? "bg-[#3C81C6] text-white" : "bg-gray-100 dark:bg-gray-800 text-[#687582]"}`}>{label}</button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#687582] text-[20px]">search</span>
                                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
                                    aria-label="Tìm kiếm bệnh nhân"
                                    placeholder={`Nhập ${searchType === "phone" ? "số điện thoại" : searchType === "cccd" ? "số CCCD" : "số BHYT"}...`}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <button onClick={handleSearch} disabled={searching} className="px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                                {searching ? "..." : "Tìm"}
                            </button>
                        </div>

                        {foundPatient && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
                                <p className="text-xs text-green-600 font-bold mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span>Tìm thấy hồ sơ</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p><span className="text-[#687582]">Tên:</span> <strong className="text-[#121417] dark:text-white">{foundPatient.name}</strong></p>
                                    <p><span className="text-[#687582]">Mã BN:</span> <strong>{foundPatient.id}</strong></p>
                                    <p><span className="text-[#687582]">Tuổi:</span> {foundPatient.age}, {foundPatient.gender}</p>
                                    <p><span className="text-[#687582]">SĐT:</span> {foundPatient.phone}</p>
                                    <p><span className="text-[#687582]">BHYT:</span> {foundPatient.insurance}</p>
                                    <p><span className="text-[#687582]">Khám gần nhất:</span> {foundPatient.lastVisit}</p>
                                </div>
                            </div>
                        )}

                        {isNewPatient && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <span className="material-symbols-outlined text-blue-500 text-[18px]">info</span>
                                    <p className="text-xs text-blue-700 dark:text-blue-400">Không tìm thấy hồ sơ. Vui lòng nhập thông tin bệnh nhân mới.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input type="text" value={newPatient.name} onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))} aria-label="Họ và tên" placeholder="Họ và tên *"
                                        className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                    <input type="text" value={newPatient.phone} onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} aria-label="Số điện thoại" placeholder="Số điện thoại *"
                                        className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                    <select value={newPatient.gender} onChange={e => setNewPatient(p => ({ ...p, gender: e.target.value }))}
                                        aria-label="Giới tính"
                                        className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white">
                                        <option value="male">Nam</option><option value="female">Nữ</option>
                                    </select>
                                    <input type="text" value={newPatient.age} onChange={e => setNewPatient(p => ({ ...p, age: e.target.value }))} aria-label="Tuổi" placeholder="Tuổi"
                                        className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white" />
                                    <input type="text" value={newPatient.insurance} onChange={e => setNewPatient(p => ({ ...p, insurance: e.target.value }))} aria-label="Số BHYT" placeholder="Số BHYT"
                                        className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white col-span-2 sm:col-span-1" />
                                    <input type="text" value={newPatient.address} onChange={e => setNewPatient(p => ({ ...p, address: e.target.value }))} aria-label="Địa chỉ" placeholder="Địa chỉ"
                                        className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white sm:col-span-2" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 1: Service/Department */}
                {step === 1 && (
                    <div className="space-y-5">
                        <h2 className="text-base font-bold text-[#121417] dark:text-white">Chọn dịch vụ & khoa khám</h2>
                        <div className="flex gap-3">
                            {[["regular", "Khám thường"], ["emergency", "Cấp cứu"], ["health_check", "KSKĐK"]].map(([v, l]) => (
                                <button key={v} onClick={() => setServiceType(v)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${serviceType === v ? "border-[#3C81C6] bg-[#3C81C6]/5 text-[#3C81C6]" : "border-gray-200 dark:border-gray-700 text-[#687582]"}`}>{l}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {departments.map(d => (
                                <button key={d.id} onClick={() => setSelectedDept(d.id)}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${selectedDept === d.id ? "border-[#3C81C6] bg-[#3C81C6]/5" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedDept === d.id ? "bg-[#3C81C6]/10 text-[#3C81C6]" : "bg-gray-100 dark:bg-gray-800 text-[#687582]"}`}>
                                        <span className="material-symbols-outlined">local_hospital</span>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${selectedDept === d.id ? "text-[#3C81C6]" : "text-[#121417] dark:text-white"}`}>{d.name}</p>
                                        <p className="text-xs text-[#687582]">{d.doctors.length} bác sĩ</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lý do khám</label>
                            <input type="text" value={reason} onChange={e => setReason(e.target.value)} aria-label="Lý do khám" placeholder="VD: Đau bụng, sốt cao, tái khám..."
                                className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                        </div>
                        {/* AI Triage */}
                        {reason.trim().length >= 5 && (
                            <AITriageAssistant reason={reason} />
                        )}
                    </div>
                )}

                {/* Step 2: Assign Doctor & Slot */}
                {step === 2 && (
                    <div className="space-y-5">
                        <h2 className="text-base font-bold text-[#121417] dark:text-white">Chọn bác sĩ & khung giờ</h2>
                        {/* AI Scheduling Optimizer */}
                        <AISchedulingOptimizer department={dept?.name} reason={reason} />
                        {dept && (
                            <>
                                <div>
                                    <p className="text-sm font-medium text-[#687582] mb-2">Bác sĩ ({dept.name})</p>
                                    <div className="flex flex-wrap gap-3">
                                        {dept.doctors.map(doc => (
                                            <button key={doc} onClick={() => setSelectedDoctor(doc)}
                                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${selectedDoctor === doc ? "border-[#3C81C6] bg-[#3C81C6]/5" : "border-gray-200 dark:border-gray-700"}`}>
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${selectedDoctor === doc ? "bg-[#3C81C6] text-white" : "bg-gray-100 dark:bg-gray-800 text-[#687582]"}`}>
                                                    <span className="material-symbols-outlined text-[18px]">person</span>
                                                </div>
                                                <span className={`text-sm font-medium ${selectedDoctor === doc ? "text-[#3C81C6]" : "text-[#121417] dark:text-white"}`}>{doc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#687582] mb-2">Khung giờ hôm nay</p>
                                    {apiSlots.length === 0 && (
                                        <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>info</span>
                                            Chưa có khung giờ — vui lòng chọn bác sĩ hoặc liên hệ phòng khám
                                        </p>
                                    )}
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {apiSlots.map(slot => (
                                            <button key={slot.time} onClick={() => slot.available && setSelectedSlot(slot.time)} disabled={!slot.available}
                                                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${selectedSlot === slot.time ? "bg-[#3C81C6] text-white shadow-md" : slot.available ? "bg-gray-50 dark:bg-gray-800 text-[#121417] dark:text-white hover:bg-gray-100" : "bg-gray-100 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through"}`}>
                                                {slot.time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <div className="space-y-5">
                        <h2 className="text-base font-bold text-[#121417] dark:text-white">Xác nhận tiếp nhận</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ConfirmCard icon="person" label="Bệnh nhân" value={foundPatient?.name || newPatient.name} sub={foundPatient ? `${foundPatient.age} tuổi, ${foundPatient.gender}` : `${newPatient.age || "?"} tuổi`} />
                            <ConfirmCard icon="local_hospital" label="Khoa" value={dept?.name || ""} sub={serviceType === "emergency" ? "Cấp cứu" : serviceType === "health_check" ? "Khám SKĐK" : "Khám thường"} />
                            <ConfirmCard icon="stethoscope" label="Bác sĩ" value={selectedDoctor} sub={`Slot: ${selectedSlot}`} />
                            <ConfirmCard icon="description" label="Lý do" value={reason || "Không ghi"} sub="" />
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <button onClick={() => step > 0 ? setStep(step - 1) : router.back()} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-[#687582] hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>{step === 0 ? "Huỷ" : "Quay lại"}
                </button>
                {step < 3 ? (
                    <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 shadow-md shadow-blue-200 dark:shadow-none">
                        Tiếp theo<span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                ) : (
                    <button onClick={handleSubmit} disabled={submitting}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-md shadow-green-200 dark:shadow-none">
                        {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xử lý...</> : <><span className="material-symbols-outlined text-[18px]">how_to_reg</span>Tiếp nhận & In phiếu</>}
                    </button>
                )}
            </div>
        </div></div>
    );
}

function ConfirmCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
    return (
        <div className="bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl p-4 border border-[#dde0e4] dark:border-[#2d353e]">
            <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-[#3C81C6] text-[16px]">{icon}</span>
                <span className="text-xs font-medium text-[#687582] uppercase">{label}</span>
            </div>
            <p className="text-sm font-bold text-[#121417] dark:text-white">{value}</p>
            {sub && <p className="text-xs text-[#687582] mt-0.5">{sub}</p>}
        </div>
    );
}
