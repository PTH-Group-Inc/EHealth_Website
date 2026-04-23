"use client";

/**
 * Medication Profile — Phase K.4 #2 + #3 + #4 (hồ sơ thuốc + adherence + treatment).
 * Spec: dòng 9519-9697.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { ehrService } from "@/services/ehrService";
import { getPatients } from "@/services/patientService";
import axiosClient from "@/api/axiosClient";

const TABS = [
    { key: "current", label: "Thuốc hiện tại", icon: "pill" },
    { key: "allergies", label: "Dị ứng", icon: "warning" },
    { key: "history", label: "Lịch sử thuốc", icon: "history" },
    { key: "interaction", label: "Tương tác", icon: "report" },
    { key: "adherence", label: "Tuân thủ", icon: "fact_check" },
    { key: "treatment", label: "Điều trị", icon: "medical_information" },
] as const;

type TabKey = typeof TABS[number]["key"];

function unwrapArr(v: any): any[] {
    if (Array.isArray(v)) return v;
    if (Array.isArray(v?.data)) return v.data;
    return [];
}

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };

export default function PharmacistMedicationProfilePage() {
    const sp = useSearchParams();
    const router = useRouter();
    const initialPatientId = sp.get("patientId") ?? "";
    const initialTab = (sp.get("tab") as TabKey) ?? "current";

    const [patientId, setPatientId] = useState(initialPatientId);
    const [tab, setTab] = useState<TabKey>(initialTab);
    const [patientOptions, setPatientOptions] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);

    const [current, setCurrent] = useState<any[]>([]);
    const [allergies, setAllergies] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [interaction, setInteraction] = useState<any>(null);
    const [adherence, setAdherence] = useState<any[]>([]);
    const [treatment, setTreatment] = useState<any[]>([]);
    const [newAdherence, setNewAdherence] = useState("");

    useEffect(() => {
        getPatients({ limit: 50 }).then((r: any) => setPatientOptions(r?.data ?? [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (!patientId) return;
        Promise.allSettled([
            ehrService.getHealthProfile(patientId),
            ehrService.getCurrentMedications(patientId),
            ehrService.getAllergies(patientId),
            ehrService.getMedicationTreatments(patientId),
            ehrService.getMedicationInteractionCheck(patientId),
            axiosClient.get(`/api/ehr/patients/${patientId}/medication-adherence`).then(r => r?.data?.data ?? r?.data ?? []).catch(() => []),
            axiosClient.get(`/api/ehr/patients/${patientId}/treatment-records`).then(r => r?.data?.data ?? r?.data ?? []).catch(() => []),
        ]).then(([p, c, a, h, i, ad, tr]) => {
            if (p.status === "fulfilled") setProfile(p.value);
            if (c.status === "fulfilled") setCurrent(unwrapArr(c.value));
            if (a.status === "fulfilled") setAllergies(unwrapArr(a.value));
            if (h.status === "fulfilled") setHistory(unwrapArr(h.value));
            if (i.status === "fulfilled") setInteraction(i.value);
            if (ad.status === "fulfilled") setAdherence(Array.isArray(ad.value) ? ad.value : unwrapArr(ad.value));
            if (tr.status === "fulfilled") setTreatment(Array.isArray(tr.value) ? tr.value : unwrapArr(tr.value));
        });
    }, [patientId]);

    const onTab = (t: TabKey) => {
        setTab(t);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", t);
        router.replace(url.pathname + url.search);
    };

    const onSetPatient = (id: string) => {
        setPatientId(id);
        const url = new URL(window.location.href);
        if (id) url.searchParams.set("patientId", id);
        else url.searchParams.delete("patientId");
        router.replace(url.pathname + url.search);
    };

    const onAddAdherence = async () => {
        if (!patientId || !newAdherence.trim()) return;
        try {
            await axiosClient.post(`/api/ehr/patients/${patientId}/medication-adherence`, { note: newAdherence });
            const r = await axiosClient.get(`/api/ehr/patients/${patientId}/medication-adherence`);
            setAdherence(r?.data?.data ?? r?.data ?? []);
            setNewAdherence("");
        } catch (e: any) { alert(e?.message ?? "Lưu thất bại"); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Hồ sơ thuốc bệnh nhân"
                subtitle="Thuốc hiện tại, dị ứng, lịch sử thuốc, tương tác, tuân thủ và điều trị."
                icon="pill"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/pharmacist" },
                    { label: "Bệnh nhân", href: "/portal/pharmacist/patients" },
                    { label: "Hồ sơ thuốc" },
                ]}
            />

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3">
                <span className="text-xs text-[#687582]">Bệnh nhân:</span>
                <select value={patientId} onChange={e => onSetPatient(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] flex-1 min-w-[200px]">
                    <option value="">— Chọn bệnh nhân —</option>
                    {patientOptions.map((p: any) => <option key={p.id} value={p.id}>{p.full_name ?? p.fullName} · {p.patient_code ?? p.code ?? ""}</option>)}
                </select>
            </div>

            {!patientId ? <EmptyState icon="person_search" title="Chưa chọn bệnh nhân" description="Chọn bệnh nhân để xem hồ sơ thuốc." />
            : (
                <>
                    {profile && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-base">{profile.full_name ?? profile.fullName ?? "—"}</p>
                                    <p className="text-xs text-[#687582]">{fmt(profile.date_of_birth)} · {profile.gender ?? "—"}</p>
                                </div>
                                {allergies.length > 0 && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                                        <span className="material-symbols-outlined text-[14px]">warning</span>
                                        {allergies.length} dị ứng
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <StatCard label="Thuốc hiện tại" value={current.length} icon="pill" color="blue" />
                        <StatCard label="Dị ứng" value={allergies.length} icon="warning" color={allergies.length > 0 ? "red" : "emerald"} />
                        <StatCard label="Lịch sử" value={history.length} icon="history" color="violet" />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => onTab(t.key)} className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-[#3C81C6] text-[#3C81C6]" : "border-transparent text-[#687582] hover:text-[#121417] dark:hover:text-white"}`}>
                                <span className="material-symbols-outlined text-[16px] mr-1 align-middle">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === "current" && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                            {current.length === 0 ? <p className="text-xs italic text-[#687582]">Không có thuốc đang dùng</p>
                            : (
                                <ul className="space-y-2">
                                    {current.map((m: any) => (
                                        <li key={m.id} className="text-sm border-b border-[#e5e7eb] dark:border-[#2d353e] pb-2">
                                            <p className="font-medium">{m.drug_name ?? m.name}</p>
                                            <p className="text-xs text-[#687582]">{m.dose ?? ""} · {m.frequency ?? ""} · từ {fmt(m.start_date)}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {tab === "allergies" && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                            {allergies.length === 0 ? <p className="text-xs italic text-emerald-600">Không có dị ứng</p>
                            : (
                                <ul className="space-y-2">
                                    {allergies.map((a: any) => (
                                        <li key={a.id} className="bg-rose-50 dark:bg-rose-900/20 rounded p-3 text-sm">
                                            <p className="font-bold text-rose-700">{a.allergen ?? a.name}</p>
                                            {a.severity && <p>Mức độ: {a.severity}</p>}
                                            {a.reaction && <p>Phản ứng: {a.reaction}</p>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {tab === "history" && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                            {history.length === 0 ? <p className="text-xs italic text-[#687582]">Chưa có lịch sử thuốc</p>
                            : (
                                <ul className="space-y-2">
                                    {history.map((h: any) => (
                                        <li key={h.id} className="text-sm border-b border-[#e5e7eb] dark:border-[#2d353e] pb-2">
                                            <p className="font-medium">{h.drug_name ?? h.title}</p>
                                            <p className="text-xs text-[#687582]">{fmt(h.start_date)} → {fmt(h.end_date)}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {tab === "interaction" && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                            {!interaction || (Array.isArray(interaction?.warnings) && interaction.warnings.length === 0)
                                ? <p className="text-xs italic text-emerald-600">Không phát hiện tương tác.</p>
                                : (
                                    <ul className="space-y-2">
                                        {(interaction.warnings ?? []).map((w: any, i: number) => (
                                            <li key={i} className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded p-3">
                                                ⚠ {typeof w === "string" ? w : (w.message ?? JSON.stringify(w))}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                        </div>
                    )}

                    {tab === "adherence" && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4 space-y-3">
                            {adherence.length === 0 ? <p className="text-xs italic text-[#687582]">Chưa có ghi nhận tuân thủ</p>
                            : (
                                <ul className="space-y-1 mb-3">
                                    {adherence.map((a: any) => (
                                        <li key={a.id} className="text-sm border-b border-[#e5e7eb] dark:border-[#2d353e] py-1.5">
                                            <p>{a.note ?? a.status ?? "—"}</p>
                                            <p className="text-xs text-[#687582]">{fmt(a.recorded_at ?? a.created_at)}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="flex gap-2">
                                <input value={newAdherence} onChange={e => setNewAdherence(e.target.value)} placeholder="Ghi nhận tuân thủ mới…" className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                                <button onClick={onAddAdherence} className="px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white">Thêm</button>
                            </div>
                        </div>
                    )}

                    {tab === "treatment" && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                            {treatment.length === 0 ? <p className="text-xs italic text-[#687582]">Chưa có lịch sử điều trị</p>
                            : (
                                <ul className="space-y-2">
                                    {treatment.map((t: any) => (
                                        <li key={t.id} className="text-sm border-b border-[#e5e7eb] dark:border-[#2d353e] pb-2">
                                            <p className="font-medium">{t.title ?? t.treatment_name ?? "Điều trị"}</p>
                                            <p className="text-xs text-[#687582]">{fmt(t.start_date)} → {fmt(t.end_date)} · {t.status ?? ""}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
