"use client";

/**
 * Pharmacist Patients — Phase K.4 #1.
 * Spec: dòng 9439-9516.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { getPatients } from "@/services/patientService";

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };
const genderLabel = (g?: string) => g === "MALE" ? "Nam" : g === "FEMALE" ? "Nữ" : "—";

export default function PharmacistPatientsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await getPatients({ limit: 100, search: search || undefined });
            setItems((r as any)?.data ?? []);
        } finally { setLoading(false); }
    }, [search]);

    useEffect(() => {
        const t = setTimeout(load, search ? 400 : 0);
        return () => clearTimeout(t);
    }, [load, search]);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Bệnh nhân"
                subtitle="Tra cứu nhanh bệnh nhân để mở hồ sơ thuốc hoặc đối chiếu đơn."
                icon="groups"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/pharmacist" },
                    { label: "Bệnh nhân" },
                ]}
            />

            <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard label="Tổng BN" value={items.length} icon="people" color="blue" loading={loading} />
                <StatCard label="Đang hoạt động" value={items.filter((p: any) => (p.status ?? "ACTIVE").toUpperCase() === "ACTIVE").length} icon="check_circle" color="emerald" loading={loading} />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3 mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên / mã BN / SĐT…" className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
                : items.length === 0 ? <EmptyState icon="person_search" title="Không tìm thấy bệnh nhân" />
                : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Mã</th>
                                <th className="text-left px-4 py-3">Họ tên</th>
                                <th className="text-left px-4 py-3">Giới tính</th>
                                <th className="text-left px-4 py-3">SĐT</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {items.map((p: any) => (
                                <tr key={p.id}>
                                    <td className="px-4 py-3 font-mono text-xs">{p.patient_code ?? "—"}</td>
                                    <td className="px-4 py-3 font-medium">{p.full_name ?? p.fullName ?? "—"}</td>
                                    <td className="px-4 py-3">{genderLabel(p.gender)}</td>
                                    <td className="px-4 py-3">{p.phone_number ?? "—"}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/portal/pharmacist/medication-profile?patientId=${p.id}`} className="px-2 py-1 text-xs rounded bg-[#3C81C6] text-white">Hồ sơ thuốc</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
