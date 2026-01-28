"use client";

import { useState, useMemo } from "react";
import { UI_TEXT } from "@/constants/ui-text";
import { MOCK_PATIENT_RECORDS } from "@/lib/mock-data/doctor";

type FilterTab = "all" | "recent" | "inpatient" | "starred";

export default function MedicalRecordsPage() {
    const [patients] = useState(MOCK_PATIENT_RECORDS);
    const [selectedPatient, setSelectedPatient] = useState(patients[0] || null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<FilterTab>("all");

    const filteredPatients = useMemo(() => {
        return patients.filter((patient) => {
            const matchesSearch =
                searchQuery === "" ||
                patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                patient.phone.includes(searchQuery);
            return matchesSearch;
        });
    }, [patients, searchQuery]);

    const tabs: { key: FilterTab; label: string; icon: string }[] = [
        { key: "all", label: UI_TEXT.DOCTOR.MEDICAL_RECORDS.ALL, icon: "folder" },
        { key: "recent", label: UI_TEXT.DOCTOR.MEDICAL_RECORDS.RECENT, icon: "schedule" },
        { key: "inpatient", label: UI_TEXT.DOCTOR.MEDICAL_RECORDS.INPATIENT, icon: "bed" },
        { key: "starred", label: UI_TEXT.DOCTOR.MEDICAL_RECORDS.STARRED, icon: "star" },
    ];

    return (
        <div className="flex h-full overflow-hidden">
            {/* Patient List Sidebar */}
            <aside className="w-80 bg-white dark:bg-[#1e242b] border-r border-[#e5e7eb] dark:border-[#2d353e] flex flex-col shrink-0">
                <div className="p-4 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3">
                        {UI_TEXT.DOCTOR.MEDICAL_RECORDS.PATIENT_LIST}
                    </h3>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white placeholder:text-gray-400"
                            placeholder={UI_TEXT.DOCTOR.MEDICAL_RECORDS.SEARCH_PLACEHOLDER}
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-4 py-2 border-b border-[#e5e7eb] dark:border-[#2d353e] flex gap-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === tab.key
                                ? "bg-[#3C81C6]/10 text-[#3C81C6]"
                                : "text-[#687582] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Patient List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredPatients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">
                                search_off
                            </span>
                            <p className="text-sm text-[#687582] dark:text-gray-400">
                                Không tìm thấy bệnh nhân
                            </p>
                        </div>
                    ) : (
                        filteredPatients.map((patient) => (
                            <button
                                key={patient.id}
                                onClick={() => setSelectedPatient(patient)}
                                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedPatient?.id === patient.id
                                    ? "bg-[#3C81C6]/10 border border-[#3C81C6]/30"
                                    : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="size-10 rounded-full bg-cover bg-center border border-gray-200 bg-gray-100 shrink-0"
                                        style={{
                                            backgroundImage: patient.avatar
                                                ? `url('${patient.avatar}')`
                                                : undefined,
                                        }}
                                    >
                                        {!patient.avatar && (
                                            <div className="size-full flex items-center justify-center text-gray-400">
                                                <span className="material-symbols-outlined">
                                                    person
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">
                                            {patient.fullName}
                                        </p>
                                        <p className="text-xs text-[#687582] dark:text-gray-400">
                                            {patient.id} • {patient.gender}, {patient.age}T
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-[#687582] dark:text-gray-400">
                                        {patient.lastVisit}
                                    </span>
                                    <span className="text-[#121417] dark:text-gray-300 truncate max-w-[120px]">
                                        {patient.currentDiagnosis}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </aside>

            {/* Patient Detail */}
            {selectedPatient ? (
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* Patient Header */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="size-20 rounded-xl bg-cover bg-center border-2 border-[#3C81C6]/30 shadow-lg"
                                        style={{
                                            backgroundImage: selectedPatient.avatar
                                                ? `url('${selectedPatient.avatar}')`
                                                : undefined,
                                            backgroundColor: selectedPatient.avatar
                                                ? undefined
                                                : "#e5e7eb",
                                        }}
                                    >
                                        {!selectedPatient.avatar && (
                                            <div className="size-full flex items-center justify-center text-gray-400">
                                                <span className="material-symbols-outlined text-4xl">
                                                    person
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#121417] dark:text-white">
                                            {selectedPatient.fullName}
                                        </h2>
                                        <p className="text-sm text-[#687582] dark:text-gray-400">
                                            {selectedPatient.id} • {selectedPatient.gender},{" "}
                                            {selectedPatient.age} tuổi
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-[#687582] dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">
                                                    cake
                                                </span>
                                                {selectedPatient.birthDate}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">
                                                    phone
                                                </span>
                                                {selectedPatient.phone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">
                                                    location_on
                                                </span>
                                                {selectedPatient.address}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => alert(`Đã ${selectedPatient.id} ${selectedPatient.fullName} vào danh sách theo dõi!`)}
                                        className="p-2 text-[#687582] hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Đánh dấu quan trọng"
                                    >
                                        <span className="material-symbols-outlined">star</span>
                                    </button>
                                    <button
                                        onClick={() => alert(`Đang xuất hồ sơ bệnh án của ${selectedPatient.fullName}...`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            download
                                        </span>
                                        {UI_TEXT.DOCTOR.MEDICAL_RECORDS.EXPORT_REPORT}
                                    </button>
                                </div>
                            </div>

                            {/* Allergies Warning */}
                            {selectedPatient.allergies &&
                                selectedPatient.allergies.length > 0 && (
                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                        <p className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">
                                                warning
                                            </span>
                                            Dị ứng & Cảnh báo
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {selectedPatient.allergies.map((allergy, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded"
                                                >
                                                    {allergy.name} - {allergy.reaction} ({allergy.year})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Timeline */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-[#3C81C6]">
                                    timeline
                                </span>
                                {UI_TEXT.DOCTOR.MEDICAL_RECORDS.TIMELINE}
                            </h3>

                            {selectedPatient.medicalHistory &&
                                selectedPatient.medicalHistory.length > 0 ? (
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#e5e7eb] dark:bg-[#2d353e]"></div>

                                    <div className="space-y-6">
                                        {selectedPatient.medicalHistory.map((record, index) => (
                                            <div key={index} className="relative pl-10">
                                                {/* Timeline dot */}
                                                <div
                                                    className={`absolute left-2.5 top-1 size-3 rounded-full ${record.isCurrent
                                                        ? "bg-[#3C81C6] ring-4 ring-[#3C81C6]/20"
                                                        : "bg-gray-300 dark:bg-gray-600"
                                                        }`}
                                                ></div>

                                                <div
                                                    className={`p-4 rounded-lg ${record.isCurrent
                                                        ? "bg-[#3C81C6]/5 border border-[#3C81C6]/20"
                                                        : "bg-gray-50 dark:bg-gray-800"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-[#121417] dark:text-white">
                                                                {record.diagnosis}
                                                            </span>
                                                            <span className="text-xs text-[#687582] dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                                                {record.icdCode}
                                                            </span>
                                                            {record.isCurrent && (
                                                                <span className="text-xs text-[#3C81C6] bg-[#3C81C6]/10 px-2 py-0.5 rounded font-medium">
                                                                    Lần khám này
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-[#687582] dark:text-gray-400">
                                                            {record.date}
                                                            {record.time && ` - ${record.time}`}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[#687582] dark:text-gray-400 mb-2">
                                                        {record.doctor} • {record.department}
                                                    </p>
                                                    {record.symptoms && (
                                                        <p className="text-sm text-[#121417] dark:text-gray-200 mb-1">
                                                            <span className="font-medium">Triệu chứng:</span>{" "}
                                                            {record.symptoms}
                                                        </p>
                                                    )}
                                                    {record.treatment && (
                                                        <p className="text-sm text-[#121417] dark:text-gray-200">
                                                            <span className="font-medium">Điều trị:</span>{" "}
                                                            {record.treatment}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">
                                        history
                                    </span>
                                    <p className="text-sm text-[#687582] dark:text-gray-400">
                                        Chưa có lịch sử khám
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Lab Results */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-600">
                                        biotech
                                    </span>
                                    {UI_TEXT.DOCTOR.MEDICAL_RECORDS.LAB_RESULTS}
                                </h3>
                                <button
                                    onClick={() => alert('Đang xem tất cả xét nghiệm...')}
                                    className="text-sm text-[#3C81C6] font-medium hover:underline"
                                >
                                    {UI_TEXT.COMMON.VIEW_ALL}
                                </button>
                            </div>

                            {selectedPatient.labResults &&
                                selectedPatient.labResults.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {selectedPatient.labResults.map((lab) => (
                                        <div
                                            key={lab.id}
                                            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div
                                                    className={`size-10 rounded-lg flex items-center justify-center ${lab.type === "pdf"
                                                        ? "bg-red-100 dark:bg-red-900/20 text-red-600"
                                                        : "bg-blue-100 dark:bg-blue-900/20 text-blue-600"
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined">
                                                        {lab.type === "pdf"
                                                            ? "picture_as_pdf"
                                                            : "image"}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">
                                                        {lab.name}
                                                    </p>
                                                    <p className="text-xs text-[#687582] dark:text-gray-400">
                                                        {lab.date}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-[#687582] dark:text-gray-400">
                                                BS. {lab.doctor} • {lab.result}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">
                                        science
                                    </span>
                                    <p className="text-sm text-[#687582] dark:text-gray-400">
                                        Chưa có kết quả xét nghiệm
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-[#687582] dark:text-gray-400">
                            <span>
                                {UI_TEXT.DOCTOR.MEDICAL_RECORDS.LAST_UPDATED}:{" "}
                                {UI_TEXT.DOCTOR.MEDICAL_RECORDS.JUST_NOW}
                            </span>
                            <button
                                onClick={() => alert(`Đang mở hồ sơ đầy đủ của ${selectedPatient?.fullName}...`)}
                                className="flex items-center gap-1 text-[#3C81C6] font-medium hover:underline"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    open_in_new
                                </span>
                                {UI_TEXT.DOCTOR.MEDICAL_RECORDS.VIEW_FULL_RECORD}
                            </button>
                        </div>
                    </div>
                </main>
            ) : (
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                            folder_open
                        </span>
                        <p className="text-lg font-medium text-[#687582] dark:text-gray-400">
                            Chọn một bệnh nhân để xem hồ sơ
                        </p>
                    </div>
                </main>
            )}
        </div>
    );
}
