"use client";

/**
 * EHR — Phase I.5 Nhóm 5 (7 tabs).
 * Spec: dòng 6487-7010.
 *
 * 7 tab: overview / timeline / medical-history / allergies / clinical-results / medications / vitals.
 * URL pattern: /portal/doctor/ehr?patientId=...&tab=...
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import { ehrService } from "@/services/ehrService";
import { getPatients } from "@/services/patientService";

const TABS = [
    { key: "overview", label: "Tổng quan", icon: "dashboard" },
    { key: "timeline", label: "Timeline", icon: "timeline" },
    { key: "history", label: "Tiền sử bệnh", icon: "history" },
    { key: "allergies", label: "Dị ứng & nguy cơ", icon: "warning" },
    { key: "clinical", label: "Cận lâm sàng", icon: "science" },
    { key: "medications", label: "Thuốc & điều trị", icon: "pill" },
    { key: "vitals", label: "Sinh hiệu", icon: "ecg" },
] as const;

type TabKey = typeof TABS[number]["key"];

const fmt = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; }
};
const fmtDateTime = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleString("vi-VN"); } catch { return v; }
};

function unwrapArr(v: any): any[] {
    if (Array.isArray(v)) return v;
    if (Array.isArray(v?.data)) return v.data;
    return [];
}

function Card({ icon, title, children, action }: { icon: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#3C81C6]">{icon}</span>
                <h3 className="text-sm font-bold flex-1">{title}</h3>
                {action}
            </div>
            <div className="p-4 text-sm">{children}</div>
        </div>
    );
}

function OverviewTab({ patientId }: { patientId: string }) {
    const [profile, setProfile] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [vitals, setVitals] = useState<any>(null);
    const [conditions, setConditions] = useState<any[]>([]);
    const [allergies, setAllergies] = useState<any[]>([]);
    const [meds, setMeds] = useState<any[]>([]);
    const [insurance, setInsurance] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        Promise.allSettled([
            ehrService.getHealthProfile(patientId),
            ehrService.getHealthSummary(patientId),
            ehrService.getVitalLatest(patientId),
            ehrService.getActiveConditions(patientId),
            ehrService.getAllergies(patientId),
            ehrService.getCurrentMedications(patientId),
            ehrService.getInsuranceStatus(patientId),
            ehrService.getAlerts(patientId),
        ]).then(([p, s, v, c, a, m, i, al]) => {
            if (p.status === "fulfilled") setProfile(p.value);
            if (s.status === "fulfilled") setSummary(s.value);
            if (v.status === "fulfilled") setVitals(v.value);
            if (c.status === "fulfilled") setConditions(unwrapArr(c.value));
            if (a.status === "fulfilled") setAllergies(unwrapArr(a.value));
            if (m.status === "fulfilled") setMeds(unwrapArr(m.value));
            if (i.status === "fulfilled") setInsurance(unwrapArr(i.value));
            if (al.status === "fulfilled") setAlerts(Array.isArray(al.value) ? al.value : unwrapArr(al.value));
        });
    }, [patientId]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card icon="badge" title="Hồ sơ">
                <dl className="space-y-1.5">
                    <div className="flex gap-2"><dt className="text-xs text-[#687582] w-24">Họ tên</dt><dd className="font-medium">{profile?.full_name ?? profile?.fullName ?? "—"}</dd></div>
                    <div className="flex gap-2"><dt className="text-xs text-[#687582] w-24">Ngày sinh</dt><dd>{fmt(profile?.date_of_birth ?? profile?.dob)}</dd></div>
                    <div className="flex gap-2"><dt className="text-xs text-[#687582] w-24">Giới tính</dt><dd>{profile?.gender ?? "—"}</dd></div>
                    <div className="flex gap-2"><dt className="text-xs text-[#687582] w-24">SĐT</dt><dd>{profile?.phone_number ?? profile?.phone ?? "—"}</dd></div>
                    <div className="flex gap-2"><dt className="text-xs text-[#687582] w-24">Nhóm máu</dt><dd>{profile?.blood_type ?? "—"}</dd></div>
                </dl>
            </Card>

            <Card icon="health_and_safety" title="Bảo hiểm">
                {insurance.length === 0 ? <p className="text-xs italic text-[#687582]">Không có thông tin BHYT</p> : (
                    <ul className="space-y-1">
                        {insurance.slice(0, 3).map((ins: any, i: number) => (
                            <li key={i}><span className="font-medium">{ins.insurance_number ?? ins.policy_number ?? "BHYT"}</span> · <span className="text-[#687582]">{ins.status ?? ins.valid_to ?? "—"}</span></li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card icon="ecg" title="Sinh hiệu gần nhất">
                {!vitals ? <p className="text-xs italic text-[#687582]">Chưa có</p> : (
                    <dl className="grid grid-cols-2 gap-2">
                        {vitals.bp && <div><dt className="text-xs text-[#687582]">HA</dt><dd className="font-bold">{vitals.bp}</dd></div>}
                        {vitals.heart_rate && <div><dt className="text-xs text-[#687582]">Mạch</dt><dd className="font-bold">{vitals.heart_rate} bpm</dd></div>}
                        {vitals.temperature && <div><dt className="text-xs text-[#687582]">Nhiệt độ</dt><dd className="font-bold">{vitals.temperature}°C</dd></div>}
                        {vitals.spo2 && <div><dt className="text-xs text-[#687582]">SpO₂</dt><dd className="font-bold">{vitals.spo2}%</dd></div>}
                    </dl>
                )}
                <p className="text-xs text-[#687582] mt-2">{fmtDateTime(vitals?.measured_at ?? vitals?.measuredAt)}</p>
            </Card>

            <Card icon="monitor_heart" title="Bệnh nền active">
                {conditions.length === 0 ? <p className="text-xs italic text-[#687582]">Không có</p> : (
                    <ul className="space-y-1">
                        {conditions.slice(0, 5).map((c: any, i: number) => (
                            <li key={c.id ?? i}>• {c.name ?? c.condition_name ?? c.icd_code ?? "Bệnh"}</li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card icon="warning" title="Dị ứng">
                {allergies.length === 0 ? <p className="text-xs italic text-[#687582]">Không có ghi nhận dị ứng</p> : (
                    <ul className="space-y-1">
                        {allergies.slice(0, 5).map((a: any, i: number) => (
                            <li key={a.id ?? i} className="text-rose-600">• {a.allergen ?? a.name} {a.severity ? `(${a.severity})` : ""}</li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card icon="pill" title="Thuốc đang dùng">
                {meds.length === 0 ? <p className="text-xs italic text-[#687582]">Không có thuốc đang dùng</p> : (
                    <ul className="space-y-1">
                        {meds.slice(0, 5).map((m: any, i: number) => (
                            <li key={m.id ?? i}>• {m.drug_name ?? m.name} {m.dose ? `· ${m.dose}` : ""}</li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card icon="report" title="Cảnh báo">
                {alerts.length === 0 ? <p className="text-xs italic text-[#687582]">Không có cảnh báo</p> : (
                    <ul className="space-y-1">
                        {alerts.slice(0, 5).map((a: any, i: number) => (
                            <li key={a.id ?? i} className="text-amber-600">⚠ {a.message ?? a.title ?? "Cảnh báo"}</li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card icon="summarize" title="Health summary">
                {!summary ? <p className="text-xs italic text-[#687582]">Chưa có summary</p> : (
                    <pre className="text-xs whitespace-pre-wrap">{typeof summary === "string" ? summary : JSON.stringify(summary, null, 2)}</pre>
                )}
            </Card>
        </div>
    );
}

function TimelineTab({ patientId }: { patientId: string }) {
    const [items, setItems] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);

    useEffect(() => {
        Promise.allSettled([
            ehrService.getHealthTimeline(patientId),
            ehrService.getHealthTimelineSummary(patientId),
        ]).then(([t, s]) => {
            if (t.status === "fulfilled") setItems(unwrapArr(t.value));
            if (s.status === "fulfilled") setSummary(s.value);
        });
    }, [patientId]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
                <Card icon="timeline" title={`Sự kiện (${items.length})`}>
                    {items.length === 0 ? <EmptyState icon="timeline" title="Chưa có sự kiện" compact /> : (
                        <ol className="border-l-2 border-[#e5e7eb] dark:border-[#2d353e] ml-2 space-y-3">
                            {items.map((e: any, i: number) => (
                                <li key={e.id ?? i} className="ml-4 relative">
                                    <span className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-[#3C81C6] border-2 border-white dark:border-[#1e242b]" />
                                    <p className="font-medium">{e.title ?? e.event_type ?? e.type ?? "Sự kiện"}</p>
                                    <p className="text-xs text-[#687582]">{fmt(e.date ?? e.timestamp ?? e.created_at)}</p>
                                    {e.description && <p className="text-xs">{e.description}</p>}
                                </li>
                            ))}
                        </ol>
                    )}
                </Card>
            </div>
            <Card icon="summarize" title="Summary">
                {!summary ? <p className="text-xs italic text-[#687582]">Chưa có</p> : (
                    <pre className="text-xs whitespace-pre-wrap">{typeof summary === "string" ? summary : JSON.stringify(summary, null, 2)}</pre>
                )}
            </Card>
        </div>
    );
}

function HistoryTab({ patientId }: { patientId: string }) {
    const [items, setItems] = useState<any[]>([]);
    useEffect(() => { ehrService.getMedicalHistoryByProfile(patientId).then((r: any) => setItems(unwrapArr(r))).catch(() => setItems([])); }, [patientId]);
    return (
        <Card icon="history" title={`Tiền sử bệnh (${items.length})`}>
            {items.length === 0 ? <EmptyState icon="history" title="Chưa ghi nhận tiền sử" compact /> : (
                <ul className="space-y-2">
                    {items.map((h: any) => (
                        <li key={h.id} className="border-b border-[#e5e7eb] dark:border-[#2d353e] pb-2">
                            <p className="font-medium">{h.condition_name ?? h.title ?? h.type}</p>
                            <p className="text-xs text-[#687582]">{h.history_type ?? h.type} · {fmt(h.recorded_at ?? h.created_at)}</p>
                            {h.description && <p className="text-xs mt-1">{h.description}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

function AllergiesTab({ patientId }: { patientId: string }) {
    const [allergies, setAllergies] = useState<any[]>([]);
    const [risks, setRisks] = useState<any[]>([]);
    const [special, setSpecial] = useState<any[]>([]);
    useEffect(() => {
        Promise.allSettled([
            ehrService.getAllergies(patientId),
            ehrService.getRiskFactors(patientId),
            ehrService.getSpecialConditions(patientId),
        ]).then(([a, r, s]) => {
            if (a.status === "fulfilled") setAllergies(unwrapArr(a.value));
            if (r.status === "fulfilled") setRisks(unwrapArr(r.value));
            if (s.status === "fulfilled") setSpecial(unwrapArr(s.value));
        });
    }, [patientId]);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card icon="warning" title={`Dị ứng (${allergies.length})`}>
                {allergies.length === 0 ? <p className="text-xs italic text-[#687582]">Không có</p> : (
                    <ul className="space-y-1.5">
                        {allergies.map((a: any) => (
                            <li key={a.id} className="bg-rose-50 dark:bg-rose-900/20 rounded p-2 text-xs">
                                <p className="font-bold text-rose-700">{a.allergen ?? a.name}</p>
                                {a.severity && <p>Mức độ: {a.severity}</p>}
                                {a.reaction && <p>Phản ứng: {a.reaction}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
            <Card icon="report" title={`Yếu tố nguy cơ (${risks.length})`}>
                {risks.length === 0 ? <p className="text-xs italic text-[#687582]">Không có</p> : (
                    <ul className="space-y-1.5">
                        {risks.map((r: any) => (
                            <li key={r.id} className="bg-amber-50 dark:bg-amber-900/20 rounded p-2 text-xs">
                                <p className="font-bold text-amber-700">{r.factor ?? r.name}</p>
                                {r.severity && <p>Mức độ: {r.severity}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
            <Card icon="medical_information" title={`Tình trạng đặc biệt (${special.length})`}>
                {special.length === 0 ? <p className="text-xs italic text-[#687582]">Không có</p> : (
                    <ul className="space-y-1.5">
                        {special.map((s: any) => (
                            <li key={s.id} className="bg-violet-50 dark:bg-violet-900/20 rounded p-2 text-xs">
                                <p className="font-bold text-violet-700">{s.condition ?? s.name}</p>
                                {s.note && <p>{s.note}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}

function ClinicalTab({ patientId }: { patientId: string }) {
    const [items, setItems] = useState<any[]>([]);
    useEffect(() => { ehrService.getClinicalResults(patientId).then((r: any) => setItems(unwrapArr(r))).catch(() => setItems([])); }, [patientId]);
    return (
        <Card icon="science" title={`Kết quả cận lâm sàng (${items.length})`}>
            {items.length === 0 ? <EmptyState icon="science" title="Chưa có kết quả" compact /> : (
                <table className="w-full text-sm">
                    <thead className="text-xs text-[#687582] uppercase">
                        <tr><th className="text-left py-2">Dịch vụ</th><th className="text-left py-2">Ngày</th><th className="text-left py-2">Kết quả</th><th className="text-left py-2">Bất thường</th></tr>
                    </thead>
                    <tbody>
                        {items.map((r: any) => (
                            <tr key={r.id} className="border-t border-[#e5e7eb] dark:border-[#2d353e]">
                                <td className="py-2">{r.service_name ?? r.test_name}</td>
                                <td className="py-2 text-[#687582]">{fmt(r.result_date ?? r.created_at)}</td>
                                <td className="py-2">{r.result_value ?? "—"}</td>
                                <td className="py-2">{r.is_abnormal ? <span className="text-rose-600 font-bold">Bất thường</span> : <span className="text-emerald-600">OK</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Card>
    );
}

function MedicationsTab({ patientId }: { patientId: string }) {
    const [current, setCurrent] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [interaction, setInteraction] = useState<any>(null);
    useEffect(() => {
        Promise.allSettled([
            ehrService.getCurrentMedications(patientId),
            ehrService.getMedicationTreatments(patientId),
            ehrService.getMedicationInteractionCheck(patientId),
        ]).then(([c, h, i]) => {
            if (c.status === "fulfilled") setCurrent(unwrapArr(c.value));
            if (h.status === "fulfilled") setHistory(unwrapArr(h.value));
            if (i.status === "fulfilled") setInteraction(i.value);
        });
    }, [patientId]);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card icon="pill" title={`Thuốc hiện tại (${current.length})`}>
                {current.length === 0 ? <p className="text-xs italic text-[#687582]">Không có</p> : (
                    <ul className="space-y-1.5">
                        {current.map((m: any) => (
                            <li key={m.id} className="text-sm border-b border-[#e5e7eb] dark:border-[#2d353e] pb-1.5">
                                <p className="font-medium">{m.drug_name ?? m.name}</p>
                                <p className="text-xs text-[#687582]">{m.dose} · {m.frequency} · từ {fmt(m.start_date)}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
            <Card icon="warning" title="Cảnh báo tương tác">
                {!interaction || (Array.isArray(interaction?.warnings) && interaction.warnings.length === 0) ? (
                    <p className="text-xs italic text-emerald-600">Không phát hiện tương tác.</p>
                ) : (
                    <ul className="space-y-1">
                        {(interaction.warnings ?? []).map((w: any, i: number) => (
                            <li key={i} className="text-sm text-amber-600">⚠ {typeof w === "string" ? w : (w.message ?? JSON.stringify(w))}</li>
                        ))}
                    </ul>
                )}
            </Card>
            <div className="lg:col-span-2">
                <Card icon="history" title={`Lịch sử điều trị (${history.length})`}>
                    {history.length === 0 ? <EmptyState icon="history" title="Chưa có" compact /> : (
                        <ul className="space-y-1.5">
                            {history.map((h: any) => (
                                <li key={h.id} className="text-sm border-b border-[#e5e7eb] dark:border-[#2d353e] pb-1.5">
                                    <p className="font-medium">{h.title ?? h.treatment_name ?? "Điều trị"}</p>
                                    <p className="text-xs text-[#687582]">{fmt(h.start_date)} → {fmt(h.end_date)}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
}

function VitalsTab({ patientId }: { patientId: string }) {
    const [latest, setLatest] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [abnormal, setAbnormal] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    useEffect(() => {
        Promise.allSettled([
            ehrService.getVitalLatest(patientId),
            ehrService.getVitalHistoryByProfile(patientId, { limit: 30 }),
            ehrService.getVitalAbnormal(patientId),
            ehrService.getVitalSummary(patientId),
        ]).then(([l, h, a, s]) => {
            if (l.status === "fulfilled") setLatest(l.value);
            if (h.status === "fulfilled") setHistory(unwrapArr(h.value));
            if (a.status === "fulfilled") setAbnormal(unwrapArr(a.value));
            if (s.status === "fulfilled") setSummary(s.value);
        });
    }, [patientId]);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card icon="ecg" title="Sinh hiệu mới nhất">
                {!latest ? <p className="text-xs italic text-[#687582]">Chưa có</p> : (
                    <dl className="grid grid-cols-2 gap-3">
                        {Object.entries(latest).filter(([k]) => !["id", "patient_id", "created_at"].includes(k)).slice(0, 8).map(([k, v]) => (
                            <div key={k}>
                                <dt className="text-xs text-[#687582] capitalize">{k.replace(/_/g, " ")}</dt>
                                <dd className="font-bold">{String(v ?? "—")}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </Card>
            <Card icon="warning" title={`Sinh hiệu bất thường (${abnormal.length})`}>
                {abnormal.length === 0 ? <p className="text-xs italic text-emerald-600">Không có sinh hiệu bất thường.</p> : (
                    <ul className="space-y-1.5">
                        {abnormal.slice(0, 8).map((a: any, i: number) => (
                            <li key={a.id ?? i} className="text-sm text-rose-600 border-b border-rose-200 dark:border-rose-900/30 pb-1.5">
                                {a.metric ?? a.type}: {a.value} · {fmt(a.measured_at)}
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
            <div className="lg:col-span-2">
                <Card icon="history" title={`Lịch sử (${history.length} bản ghi)`}>
                    {history.length === 0 ? <EmptyState icon="ecg" title="Chưa có dữ liệu" compact /> : (
                        <table className="w-full text-xs">
                            <thead className="text-[#687582] uppercase">
                                <tr>
                                    <th className="text-left py-1.5">Thời điểm</th>
                                    <th className="text-left py-1.5">HA</th>
                                    <th className="text-left py-1.5">Mạch</th>
                                    <th className="text-left py-1.5">Nhiệt độ</th>
                                    <th className="text-left py-1.5">SpO₂</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.slice(0, 20).map((v: any, i: number) => (
                                    <tr key={v.id ?? i} className="border-t border-[#e5e7eb] dark:border-[#2d353e]">
                                        <td className="py-1.5">{fmtDateTime(v.measured_at ?? v.created_at)}</td>
                                        <td>{v.bp ?? "—"}</td>
                                        <td>{v.heart_rate ?? "—"}</td>
                                        <td>{v.temperature ?? "—"}</td>
                                        <td>{v.spo2 ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default function DoctorEHRPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const initialPatientId = sp.get("patientId") ?? "";
    const initialTab = (sp.get("tab") as TabKey) ?? "overview";

    const [patientId, setPatientId] = useState(initialPatientId);
    const [tab, setTab] = useState<TabKey>(initialTab);
    const [patientOptions, setPatientOptions] = useState<{ id: string; label: string }[]>([]);

    useEffect(() => {
        getPatients({ limit: 50 }).then((res: any) => {
            const data = res?.data ?? [];
            setPatientOptions((Array.isArray(data) ? data : []).map((p: any) => ({
                id: p.id ?? p.patient_id,
                label: `${p.full_name ?? p.fullName ?? "(không tên)"} · ${p.patient_code ?? p.code ?? ""}`,
            })));
        }).catch(() => setPatientOptions([]));
    }, []);

    const updateUrl = (pid: string, t: TabKey) => {
        const url = new URL(window.location.href);
        if (pid) url.searchParams.set("patientId", pid); else url.searchParams.delete("patientId");
        url.searchParams.set("tab", t);
        router.replace(url.pathname + url.search);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="EHR — Hồ sơ sức khoẻ điện tử"
                subtitle="Bức tranh 360° của bệnh nhân: tổng quan, timeline, tiền sử, dị ứng, cận lâm sàng, thuốc, sinh hiệu."
                icon="folder_special"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "EHR" },
                ]}
            />

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3">
                <span className="text-xs text-[#687582]">Bệnh nhân:</span>
                <select
                    value={patientId}
                    onChange={e => { setPatientId(e.target.value); updateUrl(e.target.value, tab); }}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] flex-1 min-w-[200px]"
                >
                    <option value="">— Chọn bệnh nhân —</option>
                    {patientOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
            </div>

            {!patientId ? (
                <EmptyState icon="person_search" title="Chưa chọn bệnh nhân" description="Chọn bệnh nhân để xem EHR đầy đủ." />
            ) : (
                <>
                    <div className="flex flex-wrap gap-2 mb-4 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                        {TABS.map(t => (
                            <button
                                key={t.key}
                                onClick={() => { setTab(t.key); updateUrl(patientId, t.key); }}
                                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key
                                    ? "border-[#3C81C6] text-[#3C81C6]"
                                    : "border-transparent text-[#687582] hover:text-[#121417] dark:hover:text-white"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[16px] mr-1 align-middle">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === "overview" && <OverviewTab patientId={patientId} />}
                    {tab === "timeline" && <TimelineTab patientId={patientId} />}
                    {tab === "history" && <HistoryTab patientId={patientId} />}
                    {tab === "allergies" && <AllergiesTab patientId={patientId} />}
                    {tab === "clinical" && <ClinicalTab patientId={patientId} />}
                    {tab === "medications" && <MedicationsTab patientId={patientId} />}
                    {tab === "vitals" && <VitalsTab patientId={patientId} />}
                </>
            )}
        </div>
    );
}
