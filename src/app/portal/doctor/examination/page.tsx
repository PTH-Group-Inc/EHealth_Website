"use client";

import { useState } from "react";
import { UI_TEXT } from "@/constants/ui-text";
import { MOCK_PATIENT_QUEUE, MOCK_DOCTOR_PRESCRIPTIONS } from "@/lib/mock-data/doctor";

export default function ExaminationPage() {
    const [queue] = useState(MOCK_PATIENT_QUEUE);
    const [selectedPatient, setSelectedPatient] = useState(queue[0] || null);
    const [prescriptionHistory] = useState(MOCK_DOCTOR_PRESCRIPTIONS.slice(0, 3));

    // Form states
    const [vitalSigns, setVitalSigns] = useState({
        pulse: "",
        bloodPressure: "",
        temperature: "",
        spo2: "",
        weight: "",
    });

    const [clinicalExam, setClinicalExam] = useState({
        symptoms: "",
        physicalExam: "",
    });

    const [diagnosis, setDiagnosis] = useState({
        icdCode: "",
        icdName: "",
        preliminary: "",
    });

    const handleSaveDraft = () => {
        alert("Đã lưu nháp thành công!");
    };

    const handleCreatePrescription = () => {
        alert("Chuyển đến trang kê đơn thuốc...");
    };

    const handleFinishExam = () => {
        if (confirm("Bạn có chắc chắn muốn kết thúc khám cho bệnh nhân này?")) {
            alert("Đã kết thúc khám thành công!");
        }
    };

    if (!selectedPatient) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                        person_search
                    </span>
                    <p className="text-lg font-medium text-[#687582] dark:text-gray-400">
                        Không có bệnh nhân trong hàng đợi
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden">
            {/* Patient Queue Sidebar */}
            <aside className="w-72 bg-white dark:bg-[#1e242b] border-r border-[#e5e7eb] dark:border-[#2d353e] flex flex-col shrink-0">
                <div className="p-4 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6] text-[20px]">
                            groups
                        </span>
                        Hàng đợi
                        <span className="ml-auto bg-[#3C81C6]/10 text-[#3C81C6] text-xs font-bold px-2 py-0.5 rounded-full">
                            {queue.length}
                        </span>
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {queue.map((patient) => (
                        <button
                            key={patient.id}
                            onClick={() => setSelectedPatient(patient)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${selectedPatient?.id === patient.id
                                    ? "bg-[#3C81C6]/10 border border-[#3C81C6]/30"
                                    : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center justify-center size-7 rounded-full text-xs font-bold ${patient.status === "examining"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-200 text-gray-700"
                                        }`}
                                >
                                    {patient.queueNumber}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">
                                        {patient.fullName}
                                    </p>
                                    <p className="text-xs text-[#687582] dark:text-gray-400">
                                        {patient.gender}, {patient.age}T
                                    </p>
                                </div>
                                {patient.status === "examining" && (
                                    <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Examination Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Patient Header */}
                <header className="bg-white dark:bg-[#1e242b] border-b border-[#e5e7eb] dark:border-[#2d353e] p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="size-14 rounded-xl bg-cover bg-center border-2 border-[#3C81C6]/30 shadow-lg"
                                style={{
                                    backgroundImage: selectedPatient.avatar
                                        ? `url('${selectedPatient.avatar}')`
                                        : undefined,
                                    backgroundColor: selectedPatient.avatar ? undefined : "#e5e7eb",
                                }}
                            >
                                {!selectedPatient.avatar && (
                                    <div className="size-full flex items-center justify-center text-gray-400">
                                        <span className="material-symbols-outlined text-3xl">
                                            person
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-[#121417] dark:text-white">
                                        {selectedPatient.fullName}
                                    </h2>
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded">
                                        Đang khám
                                    </span>
                                </div>
                                <p className="text-sm text-[#687582] dark:text-gray-400">
                                    {selectedPatient.id} • {selectedPatient.gender},{" "}
                                    {selectedPatient.age} tuổi • SN: {selectedPatient.birthDate}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#687582] dark:text-gray-400">
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[18px]">
                                    schedule
                                </span>
                                <span>Bắt đầu: {selectedPatient.checkInTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[18px]">
                                    timer
                                </span>
                                <span>15 phút</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Forms */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Vital Signs */}
                            <section className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
                                <h3 className="text-base font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-red-500">
                                        monitor_heart
                                    </span>
                                    {UI_TEXT.DOCTOR.EXAMINATION.VITAL_SIGNS}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">
                                            {UI_TEXT.DOCTOR.EXAMINATION.PULSE}
                                        </label>
                                        <input
                                            type="text"
                                            value={vitalSigns.pulse}
                                            onChange={(e) =>
                                                setVitalSigns({ ...vitalSigns, pulse: e.target.value })
                                            }
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                            placeholder="75"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">
                                            {UI_TEXT.DOCTOR.EXAMINATION.BLOOD_PRESSURE}
                                        </label>
                                        <input
                                            type="text"
                                            value={vitalSigns.bloodPressure}
                                            onChange={(e) =>
                                                setVitalSigns({
                                                    ...vitalSigns,
                                                    bloodPressure: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                            placeholder="120/80"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">
                                            {UI_TEXT.DOCTOR.EXAMINATION.TEMPERATURE}
                                        </label>
                                        <input
                                            type="text"
                                            value={vitalSigns.temperature}
                                            onChange={(e) =>
                                                setVitalSigns({
                                                    ...vitalSigns,
                                                    temperature: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                            placeholder="37.0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">
                                            {UI_TEXT.DOCTOR.EXAMINATION.SPO2}
                                        </label>
                                        <input
                                            type="text"
                                            value={vitalSigns.spo2}
                                            onChange={(e) =>
                                                setVitalSigns({ ...vitalSigns, spo2: e.target.value })
                                            }
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                            placeholder="98"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">
                                            {UI_TEXT.DOCTOR.EXAMINATION.WEIGHT}
                                        </label>
                                        <input
                                            type="text"
                                            value={vitalSigns.weight}
                                            onChange={(e) =>
                                                setVitalSigns({ ...vitalSigns, weight: e.target.value })
                                            }
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                            placeholder="65"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Clinical Examination */}
                            <section className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
                                <h3 className="text-base font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-[#3C81C6]">
                                        clinical_notes
                                    </span>
                                    {UI_TEXT.DOCTOR.EXAMINATION.CLINICAL_EXAM}
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">
                                            {UI_TEXT.DOCTOR.EXAMINATION.SYMPTOMS}
                                        </label>
                                        <textarea
                                            value={clinicalExam.symptoms}
                                            onChange={(e) =>
                                                setClinicalExam({
                                                    ...clinicalExam,
                                                    symptoms: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white resize-none"
                                            rows={3}
                                            placeholder="Mô tả triệu chứng cơ năng của bệnh nhân..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">
                                            {UI_TEXT.DOCTOR.EXAMINATION.PHYSICAL_EXAM}
                                        </label>
                                        <textarea
                                            value={clinicalExam.physicalExam}
                                            onChange={(e) =>
                                                setClinicalExam({
                                                    ...clinicalExam,
                                                    physicalExam: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white resize-none"
                                            rows={3}
                                            placeholder="Ghi nhận kết quả khám thực thể..."
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Diagnosis */}
                            <section className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
                                <h3 className="text-base font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-purple-600">
                                        assignment
                                    </span>
                                    {UI_TEXT.DOCTOR.EXAMINATION.DIAGNOSIS}
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">
                                                {UI_TEXT.DOCTOR.EXAMINATION.ICD_CODE}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={diagnosis.icdCode}
                                                    onChange={(e) =>
                                                        setDiagnosis({
                                                            ...diagnosis,
                                                            icdCode: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                                    placeholder="Tìm mã ICD-10..."
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687582]">
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        search
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">
                                                Tên bệnh
                                            </label>
                                            <input
                                                type="text"
                                                value={diagnosis.icdName}
                                                onChange={(e) =>
                                                    setDiagnosis({
                                                        ...diagnosis,
                                                        icdName: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                                placeholder="Tên bệnh theo ICD-10"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">
                                            {UI_TEXT.DOCTOR.EXAMINATION.PRELIMINARY_DIAGNOSIS}
                                        </label>
                                        <textarea
                                            value={diagnosis.preliminary}
                                            onChange={(e) =>
                                                setDiagnosis({
                                                    ...diagnosis,
                                                    preliminary: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white resize-none"
                                            rows={2}
                                            placeholder="Nhập chẩn đoán sơ bộ..."
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column - AI Summary & History */}
                        <div className="space-y-6">
                            {/* AI Summary Widget */}
                            <section className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30 shadow-sm p-5">
                                <h3 className="text-base font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-purple-600">
                                        auto_awesome
                                    </span>
                                    {UI_TEXT.DOCTOR.EXAMINATION.AI_SUMMARY}
                                </h3>

                                {/* Allergies */}
                                {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                        <p className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1 mb-1">
                                            <span className="material-symbols-outlined text-[16px]">
                                                warning
                                            </span>
                                            {UI_TEXT.DOCTOR.EXAMINATION.ALLERGIES_WARNING}
                                        </p>
                                        <ul className="text-xs text-red-600 dark:text-red-400">
                                            {selectedPatient.allergies.map((allergy, index) => (
                                                <li key={index}>• {allergy}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Medical History */}
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-[#687582] dark:text-gray-400 mb-2">
                                        {UI_TEXT.DOCTOR.EXAMINATION.MEDICAL_HISTORY}
                                    </p>
                                    {selectedPatient.medicalHistory &&
                                        selectedPatient.medicalHistory.length > 0 ? (
                                        <ul className="text-xs text-[#121417] dark:text-gray-300 space-y-1">
                                            {selectedPatient.medicalHistory.map((item, index) => (
                                                <li key={index} className="flex items-start gap-1">
                                                    <span className="material-symbols-outlined text-[14px] text-[#3C81C6] mt-0.5">
                                                        check_circle
                                                    </span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-[#687582] dark:text-gray-400 italic">
                                            Không có tiền sử
                                        </p>
                                    )}
                                </div>

                                {/* Current Reason */}
                                <div>
                                    <p className="text-xs font-bold text-[#687582] dark:text-gray-400 mb-1">
                                        Lý do khám hôm nay
                                    </p>
                                    <p className="text-sm text-[#121417] dark:text-white">
                                        {selectedPatient.reason}
                                    </p>
                                </div>
                            </section>

                            {/* Prescription History */}
                            <section className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-5">
                                <h3 className="text-base font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-green-600">
                                        medication
                                    </span>
                                    {UI_TEXT.DOCTOR.EXAMINATION.PRESCRIPTION_HISTORY}
                                </h3>
                                <div className="space-y-3">
                                    {prescriptionHistory.map((prescription) => (
                                        <div
                                            key={prescription.id}
                                            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-[#3C81C6]">
                                                    {prescription.id}
                                                </span>
                                                <span className="text-[10px] text-[#687582] dark:text-gray-400">
                                                    {prescription.date.split(" - ")[0]}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#121417] dark:text-gray-200 mb-1">
                                                {prescription.diagnosis}
                                            </p>
                                            <p className="text-xs text-[#687582] dark:text-gray-400 truncate">
                                                {prescription.medicines}
                                            </p>
                                        </div>
                                    ))}
                                    <button className="w-full text-center text-xs text-[#3C81C6] font-medium hover:underline py-2">
                                        Xem tất cả lịch sử →
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <footer className="bg-white dark:bg-[#1e242b] border-t border-[#e5e7eb] dark:border-[#2d353e] p-4">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <button className="flex items-center gap-2 px-4 py-2.5 text-[#687582] hover:text-[#121417] dark:text-gray-400 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">print</span>
                            {UI_TEXT.DOCTOR.EXAMINATION.PRINT_FORM}
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSaveDraft}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#121417] dark:text-white rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">save</span>
                                {UI_TEXT.DOCTOR.EXAMINATION.SAVE_DRAFT}
                            </button>
                            <button
                                onClick={handleCreatePrescription}
                                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    medication
                                </span>
                                {UI_TEXT.DOCTOR.EXAMINATION.CREATE_PRESCRIPTION}
                            </button>
                            <button
                                onClick={handleFinishExam}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    check_circle
                                </span>
                                {UI_TEXT.DOCTOR.EXAMINATION.FINISH_EXAM}
                            </button>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
