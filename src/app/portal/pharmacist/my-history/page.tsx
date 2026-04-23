"use client";

/**
 * Pharmacist My History — Phase K.1 #5.
 * Spec: dòng 8353-8421.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { dispensingService } from "@/services/dispensingService";

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleString("vi-VN"); } catch { return v; } };

export default function PharmacistMyHistoryPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [date, setDate] = useState("");

    const load = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const r = await dispensingService.getByPharmacist(user.id);
            const data = (r as any)?.data ?? r;
            setItems(Array.isArray(data) ? data : []);
        } finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => items.filter((r: any) => {
        if (date && !(r.dispensed_at ?? "").startsWith(date)) return false;
        if (search) {
            const q = search.toLowerCase();
            return (r.patient_name ?? "").toLowerCase().includes(q) ||
                   (r.prescription_id ?? "").toLowerCase().includes(q);
        }
        return true;
    }), [items, search, date]);

    const today = new Date().toISOString().slice(0, 10);
    const stats = {
        total: items.length,
        today: items.filter((r: any) => (r.dispensed_at ?? "").startsWith(today)).length,
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Lịch sử cấp phát của tôi"
                subtitle="Các lượt cấp phát do chính bạn xử lý."
                icon="history"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/pharmacist" },
                    { label: "Lịch sử của tôi" },
                ]}
            />

            <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard label="Tổng" value={stats.total} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Hôm nay" value={stats.today} icon="today" color="emerald" loading={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm BN / mã đơn…" className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
                : filtered.length === 0 ? <EmptyState icon="history" title="Chưa có cấp phát nào" />
                : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Dispense #</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Đơn thuốc</th>
                                <th className="text-left px-4 py-3">Số item</th>
                                <th className="text-left px-4 py-3">Lúc</th>
                                <th className="text-right px-4 py-3">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {filtered.map((r: any, i: number) => (
                                <tr key={r.id ?? i}>
                                    <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">#{(r.id ?? "").toString().slice(0, 8)}</td>
                                    <td className="px-4 py-3 font-medium">{r.patient_name ?? "—"}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{r.prescription_id?.slice?.(0, 8) ?? "—"}</td>
                                    <td className="px-4 py-3">{r.items_count ?? r.items?.length ?? 0}</td>
                                    <td className="px-4 py-3 text-[#687582]">{fmt(r.dispensed_at ?? r.created_at)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/portal/pharmacist/dispensing?prescriptionId=${r.prescription_id}`} className="text-xs text-[#3C81C6] hover:underline">Mở</Link>
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
