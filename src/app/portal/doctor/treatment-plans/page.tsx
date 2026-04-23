"use client";

/**
 * Treatment Plans — Phase I.3 Nhóm 3 #7.
 * Spec: dòng 5983-6055 `/Users/minhquan/EH/Sửa giao diện tổng.md`.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { treatmentPlanService, type TreatmentPlan, type TreatmentPlanNote } from "@/services/treatmentPlanService";
import { getPatients } from "@/services/patientService";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Nháp", cls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
    ACTIVE: { label: "Đang điều trị", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    PAUSED: { label: "Tạm ngưng", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

const fmt = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; }
};

export default function DoctorTreatmentPlansPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialPatientId = searchParams.get("patientId") ?? "";

    const [patientId, setPatientId] = useState(initialPatientId);
    const [patientOptions, setPatientOptions] = useState<{ id: string; label: string }[]>([]);
    const [plans, setPlans] = useState<TreatmentPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<TreatmentPlan | null>(null);
    const [notes, setNotes] = useState<TreatmentPlanNote[]>([]);
    const [followUps, setFollowUps] = useState<any[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);

    // Load patient options for picker
    useEffect(() => {
        getPatients({ limit: 50 }).then((res: any) => {
            const data = res?.data ?? [];
            const opts = (Array.isArray(data) ? data : []).map((p: any) => ({
                id: p.id ?? p.patient_id,
                label: `${p.full_name ?? p.fullName ?? "(không tên)"} ${p.patient_code ? `· ${p.patient_code}` : ""}`,
            }));
            setPatientOptions(opts);
        }).catch(() => setPatientOptions([]));
    }, []);

    const load = useCallback(async () => {
        if (!patientId) { setPlans([]); return; }
        setLoading(true);
        try {
            const res = await treatmentPlanService.getByPatient(patientId);
            const data = (res as any)?.data ?? [];
            setPlans(Array.isArray(data) ? data : []);
        } catch {
            setPlans([]);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => { load(); }, [load]);

    const stats = useMemo(() => ({
        total: plans.length,
        active: plans.filter((p: any) => (p.status ?? "").toUpperCase() === "ACTIVE").length,
        completed: plans.filter((p: any) => (p.status ?? "").toUpperCase() === "COMPLETED").length,
    }), [plans]);

    const onOpen = async (p: TreatmentPlan) => {
        setSelected(p);
        setNotes([]);
        setFollowUps([]);
        setLoadingDetail(true);
        const [n, f] = await Promise.allSettled([
            treatmentPlanService.getNotes(p.id),
            treatmentPlanService.getFollowUpChain(p.id),
        ]);
        if (n.status === "fulfilled") setNotes(((n.value as any)?.data ?? []) as TreatmentPlanNote[]);
        if (f.status === "fulfilled") setFollowUps(((f.value as any)?.data ?? []) as any[]);
        setLoadingDetail(false);
    };

    const onAddNote = async () => {
        if (!selected || !newNote.trim()) return;
        setSavingNote(true);
        try {
            await treatmentPlanService.addNote(selected.id, newNote);
            setNewNote("");
            const res = await treatmentPlanService.getNotes(selected.id);
            setNotes(((res as any)?.data ?? []) as TreatmentPlanNote[]);
        } catch (e: any) {
            alert(e?.message ?? "Thêm note thất bại");
        } finally {
            setSavingNote(false);
        }
    };

    const onUpdateStatus = async (status: string) => {
        if (!selected) return;
        try {
            await treatmentPlanService.updateStatus(selected.id, { status });
            setSelected({ ...selected, status });
            await load();
        } catch (e: any) {
            alert(e?.message ?? "Cập nhật trạng thái thất bại");
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Treatment Plans"
                subtitle="Kế hoạch điều trị theo bệnh nhân — notes & follow-up chain."
                icon="medical_information"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Treatment Plans" },
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Tổng plan" value={stats.total} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Đang điều trị" value={stats.active} icon="play_circle" color="violet" loading={loading} />
                <StatCard label="Hoàn tất" value={stats.completed} icon="task_alt" color="emerald" loading={loading} />
            </div>

            {/* Patient picker */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3">
                <span className="text-xs text-[#687582]">Chọn bệnh nhân:</span>
                <select
                    value={patientId}
                    onChange={e => {
                        setPatientId(e.target.value);
                        const url = new URL(window.location.href);
                        if (e.target.value) url.searchParams.set("patientId", e.target.value);
                        else url.searchParams.delete("patientId");
                        router.replace(url.pathname + url.search);
                    }}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] flex-1 min-w-[200px]"
                >
                    <option value="">— Chọn bệnh nhân —</option>
                    {patientOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
            </div>

            {!patientId ? (
                <EmptyState icon="person_search" title="Chưa chọn bệnh nhân" description="Chọn bệnh nhân để xem treatment plans." />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-sm text-[#687582]">Đang tải…</div>
                    ) : plans.length === 0 ? (
                        <EmptyState icon="medical_information" title="Chưa có treatment plan" description="Bệnh nhân này chưa có kế hoạch điều trị nào." />
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                                <tr>
                                    <th className="text-left px-4 py-3">Tên plan</th>
                                    <th className="text-left px-4 py-3">Bắt đầu</th>
                                    <th className="text-left px-4 py-3">Kết thúc</th>
                                    <th className="text-left px-4 py-3">Trạng thái</th>
                                    <th className="text-right px-4 py-3">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                                {plans.map((p: any) => {
                                    const st = STATUS_META[(p.status ?? "DRAFT").toUpperCase()] ?? { label: p.status, cls: "bg-gray-100 text-gray-700" };
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => onOpen(p)}>
                                            <td className="px-4 py-3 font-medium">{p.title ?? p.name ?? "Plan"}</td>
                                            <td className="px-4 py-3">{fmt(p.start_date ?? p.startDate)}</td>
                                            <td className="px-4 py-3">{fmt(p.end_date ?? p.endDate)}</td>
                                            <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">Chi tiết</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Detail modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold">{(selected as any).title ?? (selected as any).name ?? "Treatment Plan"}</h3>
                                <p className="text-xs text-[#687582] font-mono mt-0.5">#{selected.id?.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-[#687582]">Bắt đầu</p>
                                    <p className="font-medium">{fmt((selected as any).start_date ?? selected.startDate)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582]">Kết thúc</p>
                                    <p className="font-medium">{fmt((selected as any).end_date ?? selected.endDate)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-[#687582] mb-1">Trạng thái</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(STATUS_META).map(([k, v]) => (
                                            <button
                                                key={k}
                                                onClick={() => onUpdateStatus(k)}
                                                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${(selected.status ?? "").toUpperCase() === k
                                                    ? `${v.cls} ring-1 ring-current`
                                                    : "bg-gray-100 dark:bg-gray-800 text-[#687582] hover:bg-gray-200 dark:hover:bg-gray-700"
                                                    }`}
                                            >
                                                {v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {selected.summary && (
                                <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-3">
                                    <p className="text-xs text-[#687582] mb-1">Tóm tắt</p>
                                    <p>{selected.summary}</p>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-3">
                                <p className="text-xs text-[#687582] mb-2 font-semibold">Notes ({notes.length})</p>
                                {loadingDetail && notes.length === 0 ? (
                                    <p className="text-xs italic text-[#687582]">Đang tải…</p>
                                ) : notes.length === 0 ? (
                                    <p className="text-xs italic text-[#687582]">Chưa có note</p>
                                ) : (
                                    <ul className="space-y-2 mb-3">
                                        {notes.map(n => (
                                            <li key={n.id} className="text-xs bg-gray-50 dark:bg-gray-800/50 rounded p-2">
                                                <p className="text-[#121417] dark:text-white">{n.content}</p>
                                                <p className="text-[10px] text-[#687582] mt-1">{n.authorName ?? "—"} · {fmt(n.createdAt)}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        placeholder="Thêm note mới…"
                                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                    />
                                    <button
                                        onClick={onAddNote}
                                        disabled={savingNote || !newNote.trim()}
                                        className="px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white disabled:opacity-50"
                                    >
                                        Thêm
                                    </button>
                                </div>
                            </div>

                            {/* Follow-up chain */}
                            <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-3">
                                <p className="text-xs text-[#687582] mb-2 font-semibold">Follow-up chain ({followUps.length})</p>
                                {followUps.length === 0 ? (
                                    <p className="text-xs italic text-[#687582]">Chưa có follow-up</p>
                                ) : (
                                    <ul className="space-y-1">
                                        {followUps.map((f: any, i: number) => (
                                            <li key={f.id ?? i} className="text-xs flex justify-between border-b border-[#e5e7eb] dark:border-[#2d353e] py-1">
                                                <span>{fmt(f.scheduled_date ?? f.date)} · {f.note ?? f.title ?? "Follow-up"}</span>
                                                <span className="text-[#687582]">{f.status ?? ""}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end">
                            <button onClick={() => setSelected(null)} className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
