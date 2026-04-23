"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { unwrapList } from "@/api/response";
import { useAuth } from "@/contexts/AuthContext";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { medicalRecordService } from "@/services/medicalRecordService";
import type { PatientMedicalRecordListItemVM, PatientRecordTimelineItemVM } from "@/types/patient-medical-record";
import type { PatientProfile } from "@/types/patient-profile";
import { adaptPatientMedicalRecordListItem, adaptPatientRecordTimelineItem } from "@/utils/patientMedicalRecordAdapters";

const STATUS_STYLES: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    pending: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
};

const TRUST_STYLES: Record<string, string> = {
    verified: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    finalized: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    draft: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
};

const EXAM_ONLY_KEYWORDS = [
    "xet nghiem",
    "can lam sang",
    "chan doan hinh anh",
    "diagnostic imaging",
    
    "laboratory",
    "laboratory medicine",
    "lab",
];

function normalizeVietnamese(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function isExamOnlyEncounter(record: PatientMedicalRecordListItemVM) {
    const specialty = normalizeVietnamese(record.specialtyName || "");
    const encounterType = normalizeVietnamese(record.encounterType || "");
    const encounterTypeLabel = normalizeVietnamese(record.encounterTypeLabel || "");
    const primaryDiagnosis = normalizeVietnamese(record.primaryDiagnosis || "");

    return EXAM_ONLY_KEYWORDS.some((keyword) =>
        specialty.includes(keyword)
        || encounterType.includes(keyword)
        || encounterTypeLabel.includes(keyword)
        || primaryDiagnosis === keyword,
    );
}

function toTimestamp(value?: string | null) {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function EmptyState({ title, message, icon = "folder_open" }: { title: string; message: string; icon?: string }) {
    return (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-16 text-center dark:border-[#2d353e] dark:bg-[#1e242b]">
            <span className="material-symbols-outlined mb-4 text-gray-300 dark:text-gray-600" style={{ fontSize: "56px" }}>{icon}</span>
            <h3 className="mb-1 text-lg font-semibold text-[#121417] dark:text-white">{title}</h3>
            <p className="text-sm text-[#687582]">{message}</p>
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    subtext,
    accent,
}: {
    icon: string;
    label: string;
    value: string;
    subtext?: string;
    accent: string;
}) {
    return (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 dark:border-[#2d353e] dark:bg-[#1e242b]">
            <div className="flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>{icon}</span>
                </div>
                <div className="min-w-0">
                    <p className="text-sm text-[#687582]">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-[#121417] dark:text-white">{value}</p>
                    {subtext ? <p className="mt-1 text-xs text-[#687582]">{subtext}</p> : null}
                </div>
            </div>
        </div>
    );
}

function RecordCard({ record }: { record: PatientMedicalRecordListItemVM }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white transition-all hover:border-[#3C81C6]/30 hover:shadow-lg dark:border-[#2d353e] dark:bg-[#1e242b] dark:hover:shadow-black/20">
            <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10 text-[#3C81C6]">
                            <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>clinical_notes</span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[#121417] dark:text-white">{record.specialtyName}</h3>
                            <p className="mt-0.5 text-xs text-[#687582]">Mã lần khám: {record.encounterId}</p>
                            <p className="mt-1 text-xs text-[#687582]">{record.formattedDate}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[record.status] || STATUS_STYLES.pending}`}>
                            {record.statusLabel}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${TRUST_STYLES[record.trustState] || TRUST_STYLES.draft}`}>
                            {record.trustLabel}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm lg:grid-cols-2">
                    <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined mt-0.5 text-[#687582]" style={{ fontSize: "18px" }}>stethoscope</span>
                        <div>
                            <p className="text-[#687582]">Bác sĩ điều trị</p>
                            <p className="font-medium text-[#121417] dark:text-white">{record.doctorName}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined mt-0.5 text-[#687582]" style={{ fontSize: "18px" }}>vaccines</span>
                        <div>
                            <p className="text-[#687582]">Chẩn đoán chính</p>
                            <p className="font-medium text-[#121417] dark:text-white">{record.primaryDiagnosis}</p>
                            {record.icd10Code ? <p className="mt-0.5 text-xs text-[#687582]">ICD-10: {record.icd10Code}</p> : null}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#3C81C6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#3C81C6] dark:bg-[#3C81C6]/15">
                        {record.encounterTypeLabel}
                    </span>
                    {record.visitNumber ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700/40 dark:text-slate-300">
                            Lượt khám #{record.visitNumber}
                        </span>
                    ) : null}
                    {record.hasSignature ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            Hồ sơ đã được xác nhận
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="flex justify-end border-t border-[#e5e7eb] bg-gray-50 px-5 py-3 dark:border-[#2d353e] dark:bg-black/20">
                <Link
                    href={`/patient/medical-records/${record.encounterId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#3C81C6]/30 bg-white px-4 py-2 text-sm font-semibold text-[#3C81C6] shadow-sm transition-colors hover:border-[#3C81C6] hover:bg-[#3C81C6] hover:text-white dark:bg-[#2d353e]"
                >
                    Xem chi tiết
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
                </Link>
            </div>
        </div>
    );
}

export default function MedicalRecordsPage() {
    usePageAIContext({ pageKey: "medical-records" });
    const router = useRouter();
    const { user } = useAuth();
    const tp = useTranslations("pages.portal.patient.medicalRecords");

    const [profiles, setProfiles] = useState<PatientProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState("");
    const [records, setRecords] = useState<PatientMedicalRecordListItemVM[]>([]);
    const [timeline, setTimeline] = useState<PatientRecordTimelineItemVM[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePanel, setActivePanel] = useState<"records" | "timeline">("records");

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const { patientProfileService, mapBEToFEProfile } = await import("@/services/patientProfileService");
                const beProfiles = await patientProfileService.getMyProfiles();
                const mapped = beProfiles.map((be) => mapBEToFEProfile(be, user?.id));
                setProfiles(mapped);

                if (mapped.length > 0) {
                    const cachedId = sessionStorage.getItem("patientPortal_selectedProfileId");
                    const exists = mapped.some((profile) => profile.id === cachedId);
                    setSelectedProfileId(exists ? cachedId || mapped[0].id : mapped[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch profiles", error);
            }
        };

        if (user?.id) {
            fetchProfiles();
        }
    }, [user?.id]);

    useEffect(() => {
        if (!selectedProfileId) return;

        const loadPage = async () => {
            setLoading(true);
            try {
                const [recordsRes, timelineRes] = await Promise.all([
                    medicalRecordService.getByPatient(selectedProfileId),
                    medicalRecordService.getTimeline(selectedProfileId),
                ]);

                const cleanedRecords = unwrapList<any>(recordsRes).data
                    .map(adaptPatientMedicalRecordListItem)
                    .filter((record) => !isExamOnlyEncounter(record))
                    .sort((a, b) => toTimestamp(b.startTime) - toTimestamp(a.startTime));

                setRecords(cleanedRecords);
                setTimeline(
                    unwrapList<any>(timelineRes).data
                        .map(adaptPatientRecordTimelineItem)
                        .filter((item) => item.type !== "LAB_ORDER" && item.type !== "LAB_RESULT")
                        .sort((a, b) => toTimestamp(b.rawDate) - toTimestamp(a.rawDate)),
                );
            } catch (error) {
                console.error("Failed to load medical records", error);
                setRecords([]);
                setTimeline([]);
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [selectedProfileId]);

    const derivedStats = useMemo(() => {
        const totalEncounters = records.length;
        const totalFinalized = records.filter((record) => record.isFinalized).length;
        const lastEncounter = records[0] || null;

        const diagnosisCounts = new Map<string, number>();
        const encounterTypeCounts = new Map<string, number>();

        records.forEach((record) => {
            if (record.primaryDiagnosis && normalizeVietnamese(record.primaryDiagnosis) !== "chua co chan doan chinh") {
                diagnosisCounts.set(record.primaryDiagnosis, (diagnosisCounts.get(record.primaryDiagnosis) || 0) + 1);
            }
            encounterTypeCounts.set(record.encounterTypeLabel, (encounterTypeCounts.get(record.encounterTypeLabel) || 0) + 1);
        });

        const topDiagnosis = Array.from(diagnosisCounts.entries()).sort((a, b) => b[1] - a[1])[0];
        const topEncounterType = Array.from(encounterTypeCounts.entries()).sort((a, b) => b[1] - a[1])[0];

        return {
            totalEncounters,
            totalFinalized,
            completionRate: totalEncounters > 0 ? Math.round((totalFinalized / totalEncounters) * 100) : 0,
            lastEncounterLabel: lastEncounter ? `${lastEncounter.formattedDate} • ${lastEncounter.doctorName}` : "Chưa có lượt khám",
            lastEncounterDate: lastEncounter?.formattedDate || "--",
            topDiagnosisLabel: topDiagnosis?.[0] || "Chưa có dữ liệu nổi bật",
            topDiagnosisCount: topDiagnosis?.[1] || 0,
            topEncounterTypeLabel: topEncounterType?.[0] || "Khám bệnh",
        };
    }, [records]);

    const handleProfileChange = (profileId: string) => {
        setSelectedProfileId(profileId);
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("patientPortal_selectedProfileId", profileId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">{tp("title")}</h1>
                    <p className="mt-0.5 max-w-3xl text-sm text-[#687582]">
                        {tp("subtitle")}
                    </p>
                </div>
                <div className="self-start rounded-xl border border-[#e5e7eb] bg-[#f6f7f8] p-1 dark:border-[#2d353e] dark:bg-[#13191f]">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setActivePanel("records")}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                                activePanel === "records"
                                    ? "bg-white text-[#121417] shadow-sm dark:bg-[#1e242b] dark:text-white"
                                    : "text-[#687582] hover:text-[#121417] dark:hover:text-white"
                            }`}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>view_agenda</span>
                            Hồ sơ khám
                        </button>
                        <button
                            type="button"
                            onClick={() => setActivePanel("timeline")}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                                activePanel === "timeline"
                                    ? "bg-white text-[#121417] shadow-sm dark:bg-[#1e242b] dark:text-white"
                                    : "text-[#687582] hover:text-[#121417] dark:hover:text-white"
                            }`}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>timeline</span>
                            Dòng thời gian
                        </button>
                    </div>
                </div>
            </div>

            {profiles.length > 0 ? (
                <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2 snap-x">
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
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>check_circle</span>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : null}

            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-32 animate-pulse rounded-2xl border border-[#e5e7eb] bg-white p-5 dark:border-[#2d353e] dark:bg-[#1e242b]" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    <SummaryCard icon="folder_shared" label="Tổng số lần khám" value={String(derivedStats.totalEncounters)} subtext={`Loại thường gặp: ${derivedStats.topEncounterTypeLabel}`} accent="bg-[#3C81C6]/10 text-[#3C81C6]" />
                    <SummaryCard icon="verified" label="Hồ sơ đã hoàn tất" value={String(derivedStats.totalFinalized)} subtext={`${derivedStats.completionRate}% hồ sơ đã hoàn tất`} accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300" />
                    <SummaryCard icon="schedule" label="Lần khám gần nhất" value={derivedStats.lastEncounterDate} subtext={derivedStats.lastEncounterLabel} accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" />
                    <SummaryCard icon="clinical_notes" label="Chẩn đoán nổi bật" value={derivedStats.topDiagnosisCount > 0 ? `${derivedStats.topDiagnosisCount} lần` : "--"} subtext={derivedStats.topDiagnosisLabel} accent="bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300" />
                </div>
            )}

            {activePanel === "records" ? (
                <div>
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="h-48 animate-pulse rounded-2xl border border-[#e5e7eb] bg-white p-5 dark:border-[#2d353e] dark:bg-[#1e242b]" />
                            ))}
                        </div>
                    ) : records.length === 0 ? (
                        <EmptyState title="Chưa có hồ sơ khám" message="Hồ sơ sẽ xuất hiện tại đây sau khi có lần khám phù hợp." />
                    ) : (
                        <div className="space-y-4">
                            {records.map((record) => (
                                <RecordCard key={record.encounterId} record={record} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 dark:border-[#2d353e] dark:bg-[#1e242b]">
                    {timeline.length === 0 ? (
                        <EmptyState
                            title="Chưa có dữ liệu dòng thời gian"
                            message="Thông tin lần khám, chẩn đoán và đơn thuốc sẽ xuất hiện tại đây sau mỗi lần khám."
                            icon="timeline"
                        />
                    ) : (
                        <div className="relative">
                            <div className="absolute bottom-0 left-[18px] top-0 w-0.5 bg-[#e5e7eb] dark:bg-[#2d353e]" />
                            <div className="space-y-6">
                                {timeline.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => item.encounterId && router.push(`/patient/medical-records/${item.encounterId}`)}
                                        className="group relative flex w-full gap-4 text-left"
                                    >
                                        <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#1e242b] ${item.color}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{item.icon}</span>
                                        </div>
                                        <div className="flex-1 pb-6">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-sm font-bold text-[#121417] transition-colors group-hover:text-[#3C81C6] dark:text-white">
                                                            {item.title}
                                                        </h4>
                                                        <span className="rounded-full bg-[#f6f7f8] px-2 py-0.5 text-[10px] font-semibold text-[#687582] dark:bg-[#13191f]">
                                                            {item.statusLabel}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-[#687582]">{item.description}</p>
                                                </div>
                                                <span className="whitespace-nowrap rounded-md bg-[#f6f7f8] px-2 py-1 text-xs text-[#687582] dark:bg-[#13191f]">
                                                    {item.date}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
