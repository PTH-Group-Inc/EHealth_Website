"use client";

/**
 * Pharmacist Prescriptions — Phase K.2 #1 + #2.
 * Spec: dòng 8443-8627.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import axiosClient from "@/api/axiosClient";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ cấp phát", cls: "bg-amber-100 text-amber-700" },
    CONFIRMED: { label: "Đã xác nhận", cls: "bg-blue-100 text-blue-700" },
    DISPENSED: { label: "Đã cấp phát", cls: "bg-emerald-100 text-emerald-700" },
    PARTIAL: { label: "Cấp một phần", cls: "bg-violet-100 text-violet-700" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-100 text-rose-700" },
};

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };

export default function PharmacistPrescriptionsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [stats, setStats] = useState<any>({});

    const load = useCallback(async () => {
        setLoading(true);
        const [l, s] = await Promise.allSettled([
            axiosClient.get("/api/prescriptions/search", { params: { limit: 200 } }),
            axiosClient.get("/api/prescriptions/search/stats"),
        ]);
        if (l.status === "fulfilled") {
            const d = (l.value as any)?.data?.data ?? (l.value as any)?.data ?? [];
            setItems(Array.isArray(d) ? d : []);
        }
        if (s.status === "fulfilled") setStats((s.value as any)?.data?.data ?? (s.value as any)?.data ?? {});
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => items.filter((p: any) => {
        const status = (p.status ?? "PENDING").toUpperCase();
        if (statusFilter !== "ALL" && status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (p.patient_name ?? "").toLowerCase().includes(q) ||
                   (p.prescription_code ?? p.code ?? "").toLowerCase().includes(q);
        }
        return true;
    }), [items, statusFilter, search]);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Đơn thuốc"
                subtitle="Tra cứu và mở đơn thuốc để thực hiện cấp phát."
                icon="pill"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/pharmacist" },
                    { label: "Đơn thuốc" },
                ]}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng đơn" value={stats.total ?? items.length} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Chờ cấp phát" value={stats.pending ?? items.filter((i: any) => (i.status ?? "").toUpperCase() === "PENDING").length} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Đã cấp phát" value={stats.dispensed ?? items.filter((i: any) => (i.status ?? "").toUpperCase() === "DISPENSED").length} icon="task_alt" color="emerald" loading={loading} />
                <StatCard label="Một phần" value={stats.partial ?? 0} icon="schedule" color="violet" loading={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm BN / mã đơn…" className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Mã đơn</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Bác sĩ</th>
                                <th className="text-left px-4 py-3">Item</th>
                                <th className="text-left px-4 py-3">Ngày tạo</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7}><EmptyState icon="pill" title="Không có đơn thuốc" /></td></tr>
                            ) : filtered.map((p: any) => {
                                const status = (p.status ?? "PENDING").toUpperCase();
                                const meta = STATUS_META[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{p.prescription_code ?? `#${(p.id ?? "").toString().slice(0, 8)}`}</td>
                                        <td className="px-4 py-3 font-medium">{p.patient_name ?? "—"}</td>
                                        <td className="px-4 py-3 text-[#687582]">{p.doctor_name ?? "—"}</td>
                                        <td className="px-4 py-3">{p.items_count ?? p.items?.length ?? 0}</td>
                                        <td className="px-4 py-3 text-[#687582]">{fmt(p.created_at)}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/portal/pharmacist/dispensing?prescriptionId=${p.id}`} className="px-2 py-1 text-xs rounded bg-[#3C81C6] text-white">Cấp phát</Link>
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
