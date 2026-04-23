"use client";

/**
 * Pharmacy Alerts — Phase K.1 #3 + #4 (Cảnh báo tồn + hạn dùng).
 * Spec: dòng 8213-8349.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { inventoryService } from "@/services/inventoryService";

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };

export default function PharmacyAlertsPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const [tab, setTab] = useState<"low_stock" | "expiring">((sp.get("tab") as any) ?? "low_stock");
    const [lowStock, setLowStock] = useState<any[]>([]);
    const [expiring, setExpiring] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const [l, e] = await Promise.allSettled([
            inventoryService.getLowStock(),
            inventoryService.getExpiring(),
        ]);
        if (l.status === "fulfilled") setLowStock(((l.value as any)?.data ?? l.value ?? []));
        if (e.status === "fulfilled") setExpiring(((e.value as any)?.data ?? e.value ?? []));
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const onTab = (t: typeof tab) => {
        setTab(t);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", t);
        router.replace(url.pathname + url.search);
    };

    const items = tab === "low_stock" ? lowStock : expiring;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Cảnh báo tồn kho"
                subtitle="Lô tồn thấp và lô sắp hết hạn — ưu tiên xử lý theo mức độ nghiêm trọng."
                icon="warning"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/pharmacist" },
                    { label: "Cảnh báo" },
                ]}
            />

            <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard label="Tồn thấp" value={lowStock.length} icon="warning" color="amber" loading={loading} />
                <StatCard label="Sắp hết hạn" value={expiring.length} icon="schedule" color="red" loading={loading} />
            </div>

            <div className="flex gap-2 mb-4">
                <button onClick={() => onTab("low_stock")} className={`px-3 py-1.5 text-sm rounded-lg border ${tab === "low_stock" ? "bg-amber-500 text-white border-amber-500" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                    Tồn thấp ({lowStock.length})
                </button>
                <button onClick={() => onTab("expiring")} className={`px-3 py-1.5 text-sm rounded-lg border ${tab === "expiring" ? "bg-rose-500 text-white border-rose-500" : "bg-white dark:bg-[#1e242b] border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                    Sắp hết hạn ({expiring.length})
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
                : items.length === 0 ? <EmptyState icon="check_circle" title="Không có cảnh báo" variant="success" />
                : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Thuốc</th>
                                <th className="text-left px-4 py-3">Batch</th>
                                <th className="text-left px-4 py-3">Kho</th>
                                <th className="text-right px-4 py-3">Số lượng</th>
                                {tab === "expiring" && <th className="text-left px-4 py-3">Hạn dùng</th>}
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {items.map((s: any, i: number) => (
                                <tr key={s.id ?? i} className={tab === "expiring" ? "bg-rose-50/30 dark:bg-rose-900/10" : ""}>
                                    <td className="px-4 py-3 font-medium">{s.drug_name ?? "—"}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{s.batch_number ?? s.batch ?? "—"}</td>
                                    <td className="px-4 py-3">{s.warehouse_name ?? "—"}</td>
                                    <td className={`px-4 py-3 text-right font-bold ${tab === "low_stock" ? "text-amber-600" : ""}`}>{s.quantity ?? 0}</td>
                                    {tab === "expiring" && <td className="px-4 py-3 text-rose-600 font-bold">{fmt(s.expiry_date)}</td>}
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/portal/pharmacist/inventory?batch=${s.id ?? s.batch_id ?? ""}`} className="text-xs text-[#3C81C6] hover:underline">Xem batch</Link>
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
