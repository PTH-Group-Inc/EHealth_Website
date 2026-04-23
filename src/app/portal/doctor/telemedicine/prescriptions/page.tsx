"use client";

/**
 * Tele Prescriptions — Phase I.6 #4.
 * Spec: dòng 7321-7423.
 */

import { useState, useEffect, useMemo } from "react";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import axiosClient from "@/api/axiosClient";

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };

export default function TelePrescriptionsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [restrictions, setRestrictions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            axiosClient.get("/api/teleconsultation/prescriptions"),
            axiosClient.get("/api/teleconsultation/prescriptions/drug-restrictions"),
        ]).then(([p, r]) => {
            if (p.status === "fulfilled") {
                const d = (p.value as any)?.data?.data ?? (p.value as any)?.data ?? [];
                setItems(Array.isArray(d) ? d : []);
            }
            if (r.status === "fulfilled") {
                const d = (r.value as any)?.data?.data ?? (r.value as any)?.data ?? [];
                setRestrictions(Array.isArray(d) ? d : []);
            }
            setLoading(false);
        });
    }, []);

    const stats = useMemo(() => ({
        total: items.length,
        sent: items.filter((p: any) => (p.status ?? "").toUpperCase() === "SENT").length,
        restrictions: restrictions.length,
    }), [items, restrictions]);

    const onAction = async (id: string, action: "prescribe" | "send" | "referral") => {
        try { await axiosClient.put(`/api/teleconsultation/prescriptions/${id}/${action}`); alert(`Đã ${action}`); window.location.reload(); }
        catch (e: any) { alert(e?.message ?? "Thao tác thất bại"); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Đơn thuốc từ xa"
                subtitle="Kê đơn telemedicine, lab orders, referral và stock check."
                icon="medication"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Telemedicine", href: "/portal/doctor/telemedicine" },
                    { label: "Đơn thuốc" },
                ]}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Tổng đơn" value={stats.total} icon="medication" color="blue" loading={loading} />
                <StatCard label="Đã gửi" value={stats.sent} icon="send" color="emerald" loading={loading} />
                <StatCard label="Drug restrictions" value={stats.restrictions} icon="warning" color="amber" loading={loading} />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                        <tr>
                            <th className="text-left px-4 py-3">Consultation</th>
                            <th className="text-left px-4 py-3">Bệnh nhân</th>
                            <th className="text-left px-4 py-3">Số item</th>
                            <th className="text-left px-4 py-3">Trạng thái</th>
                            <th className="text-left px-4 py-3">Ngày</th>
                            <th className="text-right px-4 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={6}><EmptyState icon="medication" title="Chưa có đơn từ xa" /></td></tr>
                        ) : items.map((p: any) => (
                            <tr key={p.id}>
                                <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">#{(p.consultation_id ?? "").slice(0, 8)}</td>
                                <td className="px-4 py-3 font-medium">{p.patient_name ?? "—"}</td>
                                <td className="px-4 py-3">{p.items_count ?? p.items?.length ?? 0}</td>
                                <td className="px-4 py-3">{p.status ?? "DRAFT"}</td>
                                <td className="px-4 py-3 text-[#687582]">{fmt(p.created_at)}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex gap-1">
                                        <button onClick={() => onAction(p.consultation_id ?? p.id, "prescribe")} className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700">Kê đơn</button>
                                        <button onClick={() => onAction(p.consultation_id ?? p.id, "send")} className="px-2 py-1 text-xs rounded bg-[#3C81C6] text-white">Gửi</button>
                                        <button onClick={() => onAction(p.consultation_id ?? p.id, "referral")} className="px-2 py-1 text-xs rounded bg-violet-50 text-violet-700">Referral</button>
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
