"use client";

/**
 * Medical Records — Phase I.4 Nhóm 4 #1.
 * Spec: dòng 6067-6248 `/Users/minhquan/EH/Sửa giao diện tổng.md`.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { medicalRecordService, type MedicalRecordRow } from "@/services/medicalRecordService";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Nháp", cls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
    IN_PROGRESS: { label: "Đang lập", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    FINALIZED: { label: "Đã chốt", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    SIGNED: { label: "Đã ký", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    PENDING_SIGN: { label: "Chờ ký", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
};

const fmt = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; }
};

function normalize(r: any): MedicalRecordRow {
    return {
        id: r.id ?? r.encounter_id,
        encounterId: r.encounter_id ?? r.encounterId ?? r.id,
        patientId: r.patient_id ?? r.patientId,
        patientName: r.patient_name ?? r.patientName,
        doctorName: r.doctor_name ?? r.doctorName,
        visitDate: r.visit_date ?? r.visitDate ?? r.encounter_date ?? r.created_at,
        status: (r.status ?? "DRAFT").toString().toUpperCase(),
        completenessStatus: r.completeness_status ?? r.completenessStatus,
        signStatus: r.sign_status ?? r.signStatus,
    };
}

export default function DoctorMedicalRecordsPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<MedicalRecordRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { doctor_id: user?.id, limit: 100 };
            if (fromDate) params.from_date = fromDate;
            if (toDate) params.to_date = toDate;
            const res = await medicalRecordService.search(params);
            const data = (res as any)?.data ?? [];
            setItems(Array.isArray(data) ? data.map(normalize) : []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id, fromDate, toDate]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        return items.filter(r => {
            if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                if (!(r.patientName ?? "").toString().toLowerCase().includes(q) &&
                    !(r.encounterId ?? "").toString().toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [items, statusFilter, search]);

    const stats = useMemo(() => ({
        total: items.length,
        pending: items.filter(r => r.status === "DRAFT" || r.status === "IN_PROGRESS").length,
        finalized: items.filter(r => r.status === "FINALIZED" || r.status === "PENDING_SIGN").length,
        signed: items.filter(r => r.status === "SIGNED").length,
    }), [items]);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Hồ sơ bệnh án"
                subtitle="Tra cứu hồ sơ theo encounter / bệnh nhân, xem completeness và đi ký nhanh."
                icon="folder_shared"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Hồ sơ bệnh án" },
                ]}
                actions={
                    <Link
                        href="/portal/doctor/sign-off"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600"
                    >
                        <span className="material-symbols-outlined text-[18px]">draw</span>
                        Hồ sơ chờ ký
                    </Link>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng hồ sơ" value={stats.total} icon="folder" color="blue" loading={loading} />
                <StatCard label="Đang lập / nháp" value={stats.pending} icon="edit_document" color="violet" loading={loading} />
                <StatCard label="Chờ / đã chốt" value={stats.finalized} icon="task_alt" color="amber" loading={loading} href="/portal/doctor/sign-off" />
                <StatCard label="Đã ký" value={stats.signed} icon="verified" color="emerald" loading={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo bệnh nhân / encounter…" className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Encounter</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Ngày khám</th>
                                <th className="text-left px-4 py-3">Bác sĩ</th>
                                <th className="text-left px-4 py-3">Hoàn chỉnh</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7}><EmptyState icon="folder_open" title="Không có hồ sơ" description="Không có hồ sơ bệnh án khớp bộ lọc." /></td></tr>
                            ) : filtered.map(r => {
                                const st = STATUS_META[r.status ?? "DRAFT"] ?? { label: r.status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">#{(r.encounterId ?? "").slice(0, 8)}</td>
                                        <td className="px-4 py-3 font-medium">{r.patientName ?? "—"}</td>
                                        <td className="px-4 py-3">{fmt(r.visitDate)}</td>
                                        <td className="px-4 py-3">{r.doctorName ?? "—"}</td>
                                        <td className="px-4 py-3">
                                            {r.completenessStatus ? (
                                                <span className="text-xs text-[#687582]">{r.completenessStatus}</span>
                                            ) : "—"}
                                        </td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex gap-1">
                                                <Link href={`/portal/doctor/medical-records/${r.encounterId}`} className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                                                    Mở
                                                </Link>
                                                <Link href={`/portal/doctor/sign-off?encounterId=${r.encounterId}`} className="px-2 py-1 text-xs rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300">
                                                    Ký
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
