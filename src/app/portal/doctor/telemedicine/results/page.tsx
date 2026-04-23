"use client";

/**
 * Tele Results — Phase I.6 #3.
 * Spec: dòng 7223-7317.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import axiosClient from "@/api/axiosClient";

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };

export default function TeleResultsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"all" | "unsigned" | "follow_ups">("all");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = tab === "unsigned" ? "/api/teleconsultation/results/unsigned"
                : tab === "follow_ups" ? "/api/teleconsultation/results/follow-ups"
                : "/api/teleconsultation/results";
            const r = await axiosClient.get(url);
            const d = r?.data?.data ?? r?.data ?? [];
            setItems(Array.isArray(d) ? d : []);
        } catch { setItems([]); }
        finally { setLoading(false); }
    }, [tab]);

    useEffect(() => { load(); }, [load]);

    const stats = useMemo(() => ({
        total: items.length,
        unsigned: items.filter((r: any) => !r.signed_at && !r.signedAt).length,
    }), [items]);

    const onSign = async (id: string) => {
        if (!confirm("Ký kết quả khám online này?")) return;
        try { await axiosClient.put(`/api/teleconsultation/results/${id}/sign`); await load(); }
        catch (e: any) { alert(e?.message ?? "Ký thất bại"); }
    };
    const onComplete = async (id: string) => {
        try { await axiosClient.put(`/api/teleconsultation/results/${id}/complete`); await load(); }
        catch (e: any) { alert(e?.message ?? "Complete thất bại"); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Kết quả khám online"
                subtitle="Tạo, sửa, complete và ký kết quả phiên khám telemedicine."
                icon="fact_check"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Telemedicine", href: "/portal/doctor/telemedicine" },
                    { label: "Kết quả khám" },
                ]}
            />

            <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-3">
                <StatCard label="Tổng kết quả" value={stats.total} icon="fact_check" color="blue" loading={loading} />
                <StatCard label="Chưa ký" value={stats.unsigned} icon="hourglass_empty" color="amber" loading={loading} />
            </div>

            <div className="flex gap-2 mb-4">
                {[
                    { k: "all", l: "Tất cả" },
                    { k: "unsigned", l: "Chưa ký" },
                    { k: "follow_ups", l: "Cần follow-up" },
                ].map(t => (
                    <button key={t.k} onClick={() => setTab(t.k as any)} className={`px-3 py-1.5 text-sm rounded-lg border ${tab === t.k ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                        {t.l}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                        <tr>
                            <th className="text-left px-4 py-3">Consultation</th>
                            <th className="text-left px-4 py-3">Bệnh nhân</th>
                            <th className="text-left px-4 py-3">Ngày</th>
                            <th className="text-left px-4 py-3">Trạng thái</th>
                            <th className="text-left px-4 py-3">Ký</th>
                            <th className="text-right px-4 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={6}><EmptyState icon="fact_check" title="Chưa có kết quả" /></td></tr>
                        ) : items.map((r: any) => (
                            <tr key={r.id ?? r.consultation_id}>
                                <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">#{(r.consultation_id ?? r.id ?? "").toString().slice(0, 8)}</td>
                                <td className="px-4 py-3 font-medium">{r.patient_name ?? r.patientName ?? "—"}</td>
                                <td className="px-4 py-3">{fmt(r.created_at ?? r.createdAt)}</td>
                                <td className="px-4 py-3">{r.status ?? "—"}</td>
                                <td className="px-4 py-3">{r.signed_at ? <span className="text-emerald-600 text-xs">Đã ký</span> : <span className="text-amber-600 text-xs">Chưa ký</span>}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex gap-1">
                                        {!(r.completed_at ?? r.completedAt) && <button onClick={() => onComplete(r.id ?? r.consultation_id)} className="px-2 py-1 text-xs rounded bg-violet-50 text-violet-700">Complete</button>}
                                        {!r.signed_at && <button onClick={() => onSign(r.id ?? r.consultation_id)} className="px-2 py-1 text-xs rounded bg-[#3C81C6] text-white">Ký</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
