"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axiosClient from "@/api/axiosClient";
import { EHR_ENDPOINTS } from "@/api/endpoints";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import { HealthTimeline, type HealthEvent, type HealthEventType } from "@/components/shared/timeline/HealthTimeline";
import { VitalCard } from "@/components/shared/cards/VitalCard";
import { formatDate } from "@/utils/formatters";

interface PatientProfile {
    id: string;
    name: string;
    code: string;
    gender: string;
    dob: string;
    phone: string;
    bhyt: string;
    address: string;
    bloodType: string;
}

interface VitalLatest {
    bp?: string;
    heartRate?: number;
    temperature?: number;
    spo2?: number;
    bmi?: number;
    weight?: number;
    height?: number;
    respiratoryRate?: number;
    measuredAt?: string;
}

const TABS = [
    { key: "overview", label: "Tổng quan", icon: "dashboard" },
    { key: "timeline", label: "Timeline", icon: "timeline" },
    { key: "conditions", label: "Bệnh nền", icon: "monitor_heart" },
    { key: "medications", label: "Thuốc đang dùng", icon: "pill" },
    { key: "vitals", label: "Sinh hiệu", icon: "ecg" },
] as const;

type TabKey = typeof TABS[number]["key"];

const TIMELINE_TYPE_MAP: Record<string, HealthEventType> = {
    encounter: "encounter",
    visit: "encounter",
    diagnosis: "diagnosis",
    prescription: "prescription",
    rx: "prescription",
    lab: "lab",
    imaging: "imaging",
    image: "imaging",
    vital: "vital",
    vaccination: "vaccination",
    appointment: "appointment",
    admission: "admission",
    discharge: "discharge",
};

export default function EhrDashboardPage() {
    const params = useParams();
    const patientId = String(params?.patientId ?? "");

    const [tab, setTab] = useState<TabKey>("overview");
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [vitals, setVitals] = useState<VitalLatest>({});
    const [conditions, setConditions] = useState<any[]>([]);
    const [allergies, setAllergies] = useState<any[]>([]);
    const [medications, setMedications] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<HealthEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        setError(null);
        try {
            const results = await Promise.allSettled([
                axiosClient.get(EHR_ENDPOINTS.PROFILE(patientId)).then((r) => r.data?.data ?? r.data),
                axiosClient.get(EHR_ENDPOINTS.SUMMARY(patientId)).then((r) => r.data?.data ?? r.data),
                axiosClient.get(EHR_ENDPOINTS.VITALS_LATEST(patientId)).then((r) => r.data?.data ?? r.data),
                axiosClient.get(EHR_ENDPOINTS.DIAGNOSIS_HISTORY(patientId)).then((r) => r.data?.data ?? r.data),
                axiosClient.get(EHR_ENDPOINTS.ALLERGIES(patientId)).then((r) => r.data?.data ?? r.data),
                axiosClient.get(EHR_ENDPOINTS.CURRENT_MEDICATIONS(patientId)).then((r) => r.data?.data ?? r.data),
                axiosClient.get(EHR_ENDPOINTS.TIMELINE(patientId)).then((r) => r.data?.data ?? r.data),
            ]);
            const [p, s, v, c, a, m, t] = results;
            if (p.status === "fulfilled" && p.value) setProfile(mapProfile(p.value, patientId));
            if (s.status === "fulfilled") setSummary(s.value);
            if (v.status === "fulfilled" && v.value) setVitals(mapVitals(v.value));
            if (c.status === "fulfilled") setConditions(Array.isArray(c.value) ? c.value : []);
            if (a.status === "fulfilled") setAllergies(Array.isArray(a.value) ? a.value : []);
            if (m.status === "fulfilled") setMedications(Array.isArray(m.value) ? m.value : []);
            if (t.status === "fulfilled") setTimeline(mapTimeline(t.value));
        } catch {
            setError("Không tải được hồ sơ EHR.");
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const ageText = useMemo(() => {
        if (!profile?.dob) return "";
        const dob = new Date(profile.dob);
        if (isNaN(dob.getTime())) return "";
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
        return `${age} tuổi`;
    }, [profile?.dob]);

    if (loading && !profile) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-10 w-1/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-44 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Hồ sơ y tế điện tử (EHR)"
                subtitle={profile?.name ? `Bệnh nhân: ${profile.name}` : "Bức tranh 360° lịch sử sức khỏe bệnh nhân"}
                icon="folder_shared"
                breadcrumbs={[
                    { label: "Cổng bác sĩ", href: "/portal/doctor" },
                    { label: "EHR" },
                    { label: profile?.code || patientId.slice(0, 8) },
                ]}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            <div className="bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-2xl p-5 text-white shadow-md">
                <div className="flex items-start gap-4 flex-wrap">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-white text-[36px]">
                            {profile?.gender === "FEMALE" ? "face_3" : "face"}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold truncate">{profile?.name || "Bệnh nhân"}</h2>
                        <div className="flex items-center gap-3 text-xs opacity-90 mt-1 flex-wrap">
                            {profile?.code && <span className="font-mono">#{profile.code}</span>}
                            {ageText && <span>· {ageText}</span>}
                            {profile?.gender && <span>· {profile.gender === "MALE" ? "Nam" : profile.gender === "FEMALE" ? "Nữ" : profile.gender}</span>}
                            {profile?.bloodType && <span>· Nhóm máu {profile.bloodType}</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs opacity-90 mt-2 flex-wrap">
                            {profile?.phone && (
                                <span className="inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>phone</span>
                                    {profile.phone}
                                </span>
                            )}
                            {profile?.bhyt && (
                                <span className="inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>health_and_safety</span>
                                    BHYT: {profile.bhyt}
                                </span>
                            )}
                            {profile?.address && (
                                <span className="inline-flex items-center gap-1 truncate max-w-md">
                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>home</span>
                                    {profile.address}
                                </span>
                            )}
                        </div>
                    </div>
                    {allergies.length > 0 && (
                        <div className="px-3 py-2 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-300/40">
                            <p className="text-[10px] font-bold uppercase opacity-80">Dị ứng</p>
                            <p className="text-sm font-semibold">{allergies.length} loại</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                <div className="flex border-b border-[#dde0e4] dark:border-[#2d353e] overflow-x-auto">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors inline-flex items-center gap-2 ${
                                tab === t.key
                                    ? "border-[#3C81C6] text-[#3C81C6]"
                                    : "border-transparent text-[#687582] dark:text-gray-400 hover:text-[#3C81C6]"
                            }`}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    {tab === "overview" && (
                        <OverviewTab summary={summary} vitals={vitals} allergies={allergies} medications={medications} conditions={conditions} />
                    )}
                    {tab === "timeline" && (
                        <HealthTimeline events={timeline} loading={loading} />
                    )}
                    {tab === "conditions" && (
                        <ConditionsTab conditions={conditions} />
                    )}
                    {tab === "medications" && (
                        <MedicationsTab medications={medications} />
                    )}
                    {tab === "vitals" && (
                        <VitalsTab vitals={vitals} />
                    )}
                </div>
            </div>
        </div>
    );
}

function OverviewTab({ summary, vitals, allergies, medications, conditions }: { summary: any; vitals: VitalLatest; allergies: any[]; medications: any[]; conditions: any[] }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xs font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>monitor_heart</span>
                    Sinh hiệu mới nhất
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {vitals.bp && <VitalCard kind="bp" value={vitals.bp} measuredAt={vitals.measuredAt} />}
                    {typeof vitals.heartRate === "number" && <VitalCard kind="heartRate" value={vitals.heartRate} measuredAt={vitals.measuredAt} />}
                    {typeof vitals.temperature === "number" && <VitalCard kind="temperature" value={vitals.temperature} measuredAt={vitals.measuredAt} />}
                    {typeof vitals.spo2 === "number" && <VitalCard kind="spo2" value={vitals.spo2} measuredAt={vitals.measuredAt} />}
                </div>
                {!vitals.bp && typeof vitals.heartRate !== "number" && (
                    <EmptyState icon="ecg" title="Chưa có sinh hiệu" description="Cần đo và lưu sinh hiệu trong phiên khám gần nhất." compact />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard
                    title="Bệnh nền hoạt động"
                    icon="vital_signs"
                    color="from-violet-500 to-purple-600"
                    value={conditions.length}
                    items={conditions.slice(0, 3).map((c) => c.name ?? c.diagnosis ?? c.code ?? "")}
                />
                <SummaryCard
                    title="Dị ứng"
                    icon="warning"
                    color="from-red-500 to-rose-600"
                    value={allergies.length}
                    items={allergies.slice(0, 3).map((a) => a.allergen ?? a.name ?? a.substance ?? "")}
                />
                <SummaryCard
                    title="Thuốc đang dùng"
                    icon="pill"
                    color="from-emerald-500 to-teal-600"
                    value={medications.length}
                    items={medications.slice(0, 3).map((m) => m.name ?? m.medicineName ?? m.medicine_name ?? "")}
                />
            </div>

            {summary?.notes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>sticky_note_2</span>
                        Ghi chú lâm sàng
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-line">{summary.notes}</p>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ title, icon, color, value, items }: { title: string; icon: string; color: string; value: number; items: string[] }) {
    return (
        <div className="bg-white dark:bg-[#13191f] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] p-4">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{icon}</span>
                </div>
                <span className="text-2xl font-extrabold text-[#121417] dark:text-white">{value}</span>
            </div>
            <h4 className="text-xs font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
            {items.filter(Boolean).length > 0 ? (
                <ul className="text-xs text-[#121417] dark:text-gray-300 space-y-1 leading-relaxed">
                    {items.filter(Boolean).map((it, i) => <li key={i} className="truncate">• {it}</li>)}
                </ul>
            ) : (
                <p className="text-xs text-[#687582] dark:text-gray-500">Không có dữ liệu</p>
            )}
        </div>
    );
}

function ConditionsTab({ conditions }: { conditions: any[] }) {
    if (conditions.length === 0) {
        return <EmptyState icon="vital_signs" title="Không có bệnh nền hoạt động" description="Bệnh nhân chưa có chẩn đoán bệnh nền nào." />;
    }
    return (
        <div className="space-y-2">
            {conditions.map((c, i) => (
                <div key={c.id ?? i} className="flex items-start gap-3 p-3 bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <span className="material-symbols-outlined text-violet-500 mt-0.5" style={{ fontSize: "20px" }}>vital_signs</span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            {(c.icdCode ?? c.icd_code ?? c.code) && (
                                <span className="font-mono text-sm font-bold text-[#3C81C6]">{c.icdCode ?? c.icd_code ?? c.code}</span>
                            )}
                            <span className="text-sm text-[#121417] dark:text-white">{c.name ?? c.diagnosis ?? c.description}</span>
                        </div>
                        {c.notes && <p className="text-xs text-[#687582] dark:text-gray-400 mt-1">{c.notes}</p>}
                        {(c.diagnosedAt ?? c.diagnosed_at) && (
                            <p className="text-[11px] text-[#687582] dark:text-gray-500 mt-1 font-mono">
                                Chẩn đoán: {formatDate(c.diagnosedAt ?? c.diagnosed_at)}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function MedicationsTab({ medications }: { medications: any[] }) {
    if (medications.length === 0) {
        return <EmptyState icon="pill" title="Không có thuốc đang dùng" description="Bệnh nhân hiện không có toa thuốc đang hoạt động." />;
    }
    return (
        <div className="space-y-2">
            {medications.map((m, i) => (
                <div key={m.id ?? i} className="flex items-start gap-3 p-3 bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: "20px" }}>pill</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-[#121417] dark:text-white">{m.name ?? m.medicineName ?? m.medicine_name}</h4>
                        {(m.dosage || m.frequency) && (
                            <p className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">
                                {m.dosage} {m.frequency && <span>· {m.frequency}</span>}
                            </p>
                        )}
                        {m.instructions && (
                            <p className="text-xs text-[#687582] dark:text-gray-500 mt-1 italic">&ldquo;{m.instructions}&rdquo;</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function VitalsTab({ vitals }: { vitals: VitalLatest }) {
    const cards: { kind: "bp" | "heartRate" | "temperature" | "spo2" | "bmi" | "respRate" | "weight" | "height"; value: any }[] = [];
    if (vitals.bp) cards.push({ kind: "bp", value: vitals.bp });
    if (typeof vitals.heartRate === "number") cards.push({ kind: "heartRate", value: vitals.heartRate });
    if (typeof vitals.temperature === "number") cards.push({ kind: "temperature", value: vitals.temperature });
    if (typeof vitals.spo2 === "number") cards.push({ kind: "spo2", value: vitals.spo2 });
    if (typeof vitals.bmi === "number") cards.push({ kind: "bmi", value: vitals.bmi });
    if (typeof vitals.respiratoryRate === "number") cards.push({ kind: "respRate", value: vitals.respiratoryRate });
    if (typeof vitals.weight === "number") cards.push({ kind: "weight", value: vitals.weight });
    if (typeof vitals.height === "number") cards.push({ kind: "height", value: vitals.height });

    if (cards.length === 0) {
        return <EmptyState icon="ecg" title="Chưa có sinh hiệu" description="Cần đo và lưu sinh hiệu trong phiên khám." />;
    }
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {cards.map((c, i) => (
                <VitalCard key={i} kind={c.kind} value={c.value} measuredAt={vitals.measuredAt} />
            ))}
        </div>
    );
}

function mapProfile(p: any, fallbackId: string): PatientProfile {
    return {
        id: String(p.id ?? p.patient_id ?? p.patientId ?? fallbackId),
        name: p.fullName ?? p.full_name ?? p.name ?? "",
        code: p.patientCode ?? p.patient_code ?? p.code ?? "",
        gender: String(p.gender ?? "").toUpperCase(),
        dob: p.dateOfBirth ?? p.date_of_birth ?? p.dob ?? "",
        phone: p.phone ?? p.phone_number ?? "",
        bhyt: p.bhytNumber ?? p.bhyt_number ?? p.insuranceNumber ?? p.insurance_number ?? "",
        address: p.address ?? "",
        bloodType: p.bloodType ?? p.blood_type ?? "",
    };
}

function mapVitals(v: any): VitalLatest {
    return {
        bp: v.bloodPressure ?? v.blood_pressure ?? v.bp ?? "",
        heartRate: numOrUndef(v.heartRate ?? v.heart_rate ?? v.hr),
        temperature: numOrUndef(v.temperature ?? v.temp),
        spo2: numOrUndef(v.spo2 ?? v.SpO2 ?? v.oxygenSaturation),
        bmi: numOrUndef(v.bmi),
        weight: numOrUndef(v.weight),
        height: numOrUndef(v.height),
        respiratoryRate: numOrUndef(v.respiratoryRate ?? v.respiratory_rate ?? v.rr),
        measuredAt: v.measuredAt ?? v.measured_at ?? v.recordedAt ?? v.recorded_at ?? v.createdAt ?? v.created_at ?? "",
    };
}

function numOrUndef(v: any): number | undefined {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function mapTimeline(raw: any): HealthEvent[] {
    const arr: any[] = Array.isArray(raw) ? raw : (raw?.items ?? raw?.events ?? []);
    return arr.map((e: any, i: number): HealthEvent => {
        const typeRaw = String(e.type ?? e.eventType ?? e.event_type ?? "encounter").toLowerCase();
        return {
            id: e.id ?? e.event_id ?? `t-${i}`,
            type: TIMELINE_TYPE_MAP[typeRaw] ?? "note",
            title: e.title ?? e.label ?? e.summary ?? typeRaw,
            description: e.description ?? e.detail ?? e.content ?? "",
            timestamp: e.timestamp ?? e.eventDate ?? e.event_date ?? e.createdAt ?? e.created_at ?? "",
            doctor: e.doctorName ?? e.doctor_name ?? e.doctor?.fullName ?? "",
            facility: e.facilityName ?? e.facility_name ?? e.department ?? "",
        };
    });
}
