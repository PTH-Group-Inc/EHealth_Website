"use client";

/**
 * Bệnh nhân (doctor portal) — Phase I.3 Nhóm 3 #1.
 * Spec: dòng 5441-5557 `/Users/minhquan/EH/Sửa giao diện tổng.md`.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import {
    getPatients,
    getPatientDetail,
    getPatientSummary,
    getEmergencyContacts,
    getPatientAppointments,
} from "@/services/patientService";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: "Đang hoạt động", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    INACTIVE: { label: "Tạm khoá", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    DECEASED: { label: "Đã mất", cls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
};

const fmt = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; }
};
const genderLabel = (g?: string) => g === "MALE" ? "Nam" : g === "FEMALE" ? "Nữ" : g === "OTHER" ? "Khác" : "—";

interface PatientRow {
    id: string;
    code: string;
    fullName: string;
    gender?: string;
    phone?: string;
    hasInsurance?: boolean;
    status?: string;
    dob?: string;
}

function normalizePatient(p: any): PatientRow {
    return {
        id: p.id ?? p.patient_id ?? p.patients_id,
        code: p.patient_code ?? p.code ?? "",
        fullName: p.full_name ?? p.fullName ?? p.name ?? "(không rõ tên)",
        gender: p.gender,
        phone: p.phone_number ?? p.phone,
        hasInsurance: p.has_insurance ?? p.hasInsurance ?? !!p.insurance_number,
        status: (p.status ?? "ACTIVE").toString().toUpperCase(),
        dob: p.date_of_birth ?? p.dob,
    };
}

export default function DoctorPatientsPage() {
    const [items, setItems] = useState<PatientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [insuranceFilter, setInsuranceFilter] = useState<"ALL" | "WITH" | "WITHOUT">("ALL");
    const [selected, setSelected] = useState<PatientRow | null>(null);
    const [detail, setDetail] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [emergency, setEmergency] = useState<any[]>([]);
    const [appts, setAppts] = useState<any[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPatients({ limit: 100, search: search || undefined });
            const data = (res as any)?.data ?? [];
            setItems(Array.isArray(data) ? data.map(normalizePatient) : []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const t = setTimeout(load, search ? 400 : 0);
        return () => clearTimeout(t);
    }, [load, search]);

    const filtered = useMemo(() => {
        return items.filter(p => {
            if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
            if (insuranceFilter === "WITH" && !p.hasInsurance) return false;
            if (insuranceFilter === "WITHOUT" && p.hasInsurance) return false;
            return true;
        });
    }, [items, statusFilter, insuranceFilter]);

    const stats = useMemo(() => ({
        total: items.length,
        active: items.filter(p => p.status === "ACTIVE").length,
        insured: items.filter(p => p.hasInsurance).length,
    }), [items]);

    const onOpen = async (p: PatientRow) => {
        setSelected(p);
        setDetail(null);
        setSummary(null);
        setEmergency([]);
        setAppts([]);
        setLoadingDetail(true);
        const [d, s, e, a] = await Promise.allSettled([
            getPatientDetail(p.id),
            getPatientSummary(p.id),
            getEmergencyContacts(p.id),
            getPatientAppointments(p.id),
        ]);
        if (d.status === "fulfilled" && d.value.success) setDetail(d.value.data);
        if (s.status === "fulfilled" && s.value.success) setSummary(s.value.data);
        if (e.status === "fulfilled" && e.value.success) setEmergency(e.value.data ?? []);
        if (a.status === "fulfilled" && a.value.success) setAppts(a.value.data ?? []);
        setLoadingDetail(false);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Bệnh nhân"
                subtitle="Tra cứu, mở hồ sơ và điều hướng nhanh sang encounter / EHR / lịch khám."
                icon="groups"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Bệnh nhân" },
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Tổng bệnh nhân" value={stats.total} icon="people" color="blue" loading={loading} />
                <StatCard label="Đang hoạt động" value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Có bảo hiểm" value={stats.insured} icon="health_and_safety" color="violet" loading={loading} />
            </div>

            {/* Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm theo tên / mã / SĐT…"
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] text-[#121417] dark:text-white"
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                >
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select
                    value={insuranceFilter}
                    onChange={e => setInsuranceFilter(e.target.value as any)}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                >
                    <option value="ALL">Mọi BHYT</option>
                    <option value="WITH">Có BHYT</option>
                    <option value="WITHOUT">Không BHYT</option>
                </select>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Mã BN</th>
                                <th className="text-left px-4 py-3">Họ tên</th>
                                <th className="text-left px-4 py-3">Giới tính</th>
                                <th className="text-left px-4 py-3">SĐT</th>
                                <th className="text-left px-4 py-3">BHYT</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7}><EmptyState icon="person_search" title="Không tìm thấy bệnh nhân" description="Thử tìm theo tên hoặc mã khác." /></td></tr>
                            ) : filtered.map(p => {
                                const st = STATUS_META[p.status ?? "ACTIVE"] ?? { label: p.status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => onOpen(p)}>
                                        <td className="px-4 py-3 font-mono text-xs text-[#687582]">{p.code || "—"}</td>
                                        <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{p.fullName}</td>
                                        <td className="px-4 py-3">{genderLabel(p.gender)}</td>
                                        <td className="px-4 py-3">{p.phone ?? "—"}</td>
                                        <td className="px-4 py-3">
                                            {p.hasInsurance ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                                                    <span className="material-symbols-outlined text-[14px]">verified</span> Có
                                                </span>
                                            ) : (
                                                <span className="text-[#687582] text-xs">Không</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="inline-flex gap-1">
                                                <Link href={`/portal/doctor/ehr?patientId=${p.id}`} className="px-2 py-1 text-xs rounded-md bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300">
                                                    EHR
                                                </Link>
                                                <Link href={`/portal/doctor/encounters?patientId=${p.id}`} className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                                                    Encounters
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

            {/* Detail modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">{selected.fullName}</h3>
                                <p className="text-xs text-[#687582] mt-0.5 font-mono">{selected.code}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 text-sm">
                            {loadingDetail && <p className="text-center text-[#687582]">Đang tải dữ liệu…</p>}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Giới tính</p>
                                    <p className="font-medium">{genderLabel(detail?.gender ?? selected.gender)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Ngày sinh</p>
                                    <p className="font-medium">{fmt(detail?.date_of_birth ?? detail?.dob ?? selected.dob)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">SĐT</p>
                                    <p className="font-medium">{detail?.phone_number ?? selected.phone ?? "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582] mb-1">Email</p>
                                    <p className="font-medium">{detail?.email ?? "—"}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-[#687582] mb-1">Địa chỉ</p>
                                    <p>{detail?.address ?? "—"}</p>
                                </div>
                            </div>

                            {/* Summary */}
                            {summary && (
                                <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-4">
                                    <p className="text-xs text-[#687582] mb-2">Tóm tắt</p>
                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                        {Object.entries(summary).slice(0, 6).map(([k, v]) => (
                                            <div key={k} className="bg-gray-50 dark:bg-gray-800/50 rounded p-2">
                                                <p className="text-[#687582]">{k}</p>
                                                <p className="font-bold">{String(v ?? "—")}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Emergency contacts */}
                            <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-4">
                                <p className="text-xs text-[#687582] mb-2">Liên hệ khẩn cấp</p>
                                {emergency.length === 0 ? (
                                    <p className="text-xs italic text-[#687582]">Chưa có</p>
                                ) : (
                                    <ul className="space-y-1">
                                        {emergency.map((c: any, i: number) => (
                                            <li key={i} className="text-sm">
                                                <span className="font-medium">{c.contact_name ?? c.full_name}</span> — <span className="text-[#687582]">{c.phone_number ?? c.phone}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Recent appointments */}
                            <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-4">
                                <p className="text-xs text-[#687582] mb-2">Lịch khám gần đây</p>
                                {appts.length === 0 ? (
                                    <p className="text-xs italic text-[#687582]">Chưa có lịch khám</p>
                                ) : (
                                    <ul className="space-y-1 text-sm">
                                        {appts.slice(0, 5).map((a: any, i: number) => (
                                            <li key={i} className="flex justify-between">
                                                <span>{fmt(a.appointment_date ?? a.date)} • {a.service_name ?? a.serviceName ?? "Khám"}</span>
                                                <span className="text-[#687582]">{a.status}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-between gap-2">
                            <div className="flex gap-2">
                                <Link href={`/portal/doctor/ehr?patientId=${selected.id}`} className="px-3 py-2 text-sm rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300">
                                    Mở EHR
                                </Link>
                                <Link href={`/portal/doctor/encounters?patientId=${selected.id}`} className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                                    Encounters
                                </Link>
                                <Link href={`/portal/doctor/treatment-plans?patientId=${selected.id}`} className="px-3 py-2 text-sm rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    Treatment plans
                                </Link>
                            </div>
                            <button onClick={() => setSelected(null)} className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
