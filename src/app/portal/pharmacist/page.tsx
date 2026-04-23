"use client";

/**
 * Pharmacist Dashboard — Phase K.1 #1.
 * Spec: dòng 8015-8122.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, StatCard, EmptyState } from "@/components/shared/layout";
import { dispensingService } from "@/services/dispensingService";
import { inventoryService } from "@/services/inventoryService";

const QUICK_ACTIONS = [
    { icon: "search", label: "Tra cứu đơn", href: "/portal/pharmacist/prescriptions", color: "from-blue-500 to-blue-600" },
    { icon: "local_pharmacy", label: "Cấp phát", href: "/portal/pharmacist/dispensing", color: "from-emerald-500 to-emerald-600" },
    { icon: "inventory_2", label: "Tồn kho", href: "/portal/pharmacist/inventory", color: "from-violet-500 to-violet-600" },
    { icon: "warning", label: "Cảnh báo", href: "/portal/pharmacist/alerts", color: "from-amber-500 to-amber-600" },
    { icon: "history", label: "Lịch sử của tôi", href: "/portal/pharmacist/my-history", color: "from-pink-500 to-pink-600" },
    { icon: "groups", label: "Bệnh nhân", href: "/portal/pharmacist/patients", color: "from-cyan-500 to-cyan-600" },
];

export default function PharmacistDashboard() {
    const { user } = useAuth();
    const [pendingCount, setPendingCount] = useState(0);
    const [lowStock, setLowStock] = useState<any[]>([]);
    const [expiring, setExpiring] = useState<any[]>([]);
    const [myHistory, setMyHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            inventoryService.getLowStock(),
            inventoryService.getExpiring(),
            user?.id ? dispensingService.getByPharmacist(user.id) : Promise.resolve(null),
        ]).then(([l, e, h]) => {
            if (l.status === "fulfilled") {
                const d = (l.value as any)?.data ?? l.value;
                setLowStock(Array.isArray(d) ? d : []);
            }
            if (e.status === "fulfilled") {
                const d = (e.value as any)?.data ?? e.value;
                setExpiring(Array.isArray(d) ? d : []);
            }
            if (h.status === "fulfilled" && h.value) {
                const d = (h.value as any)?.data ?? h.value;
                setMyHistory(Array.isArray(d) ? d : []);
            }
            setLoading(false);
        });
    }, [user?.id]);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Nhà thuốc"
                subtitle={`Xin chào ${user?.fullName ?? "dược sĩ"} — vận hành cấp phát hôm nay.`}
                icon="local_pharmacy"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Đơn chờ cấp phát" value={pendingCount} icon="hourglass_empty" color="amber" loading={loading} href="/portal/pharmacist/prescriptions" />
                <StatCard label="Tồn thấp" value={lowStock.length} icon="warning" color="red" loading={loading} href="/portal/pharmacist/alerts?tab=low_stock" />
                <StatCard label="Sắp hết hạn" value={expiring.length} icon="schedule" color="violet" loading={loading} href="/portal/pharmacist/alerts?tab=expiring" />
                <StatCard label="Đã cấp phát hôm nay" value={myHistory.length} icon="task_alt" color="emerald" loading={loading} href="/portal/pharmacist/my-history" />
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-bold mb-3 text-[#121417] dark:text-white">Quick actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {QUICK_ACTIONS.map(a => (
                        <Link key={a.label} href={a.href} className="group bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4 hover:shadow-md hover:border-[#3C81C6]/40 transition-all text-center">
                            <div className={`mx-auto inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} text-white mb-2 group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-outlined text-[24px]">{a.icon}</span>
                            </div>
                            <p className="text-xs font-medium text-[#121417] dark:text-white">{a.label}</p>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-amber-500">warning</span>
                        <h3 className="text-sm font-bold flex-1">Tồn thấp ({lowStock.length})</h3>
                        <Link href="/portal/pharmacist/alerts?tab=low_stock" className="text-xs text-[#3C81C6] hover:underline">Xem tất cả →</Link>
                    </div>
                    {lowStock.length === 0 ? <EmptyState icon="inventory_2" title="Không có cảnh báo" variant="success" compact />
                    : (
                        <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {lowStock.slice(0, 5).map((s: any, i: number) => (
                                <li key={s.id ?? i} className="px-4 py-2.5 flex justify-between text-sm">
                                    <div>
                                        <p className="font-medium">{s.drug_name ?? s.drugName ?? "—"}</p>
                                        <p className="text-xs text-[#687582]">{s.warehouse_name ?? "—"}</p>
                                    </div>
                                    <p className="text-amber-600 font-bold">{s.quantity ?? 0}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-rose-500">schedule</span>
                        <h3 className="text-sm font-bold flex-1">Sắp hết hạn ({expiring.length})</h3>
                        <Link href="/portal/pharmacist/alerts?tab=expiring" className="text-xs text-[#3C81C6] hover:underline">Xem tất cả →</Link>
                    </div>
                    {expiring.length === 0 ? <EmptyState icon="schedule" title="Không có lô sắp hết hạn" variant="success" compact />
                    : (
                        <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {expiring.slice(0, 5).map((s: any, i: number) => (
                                <li key={s.id ?? i} className="px-4 py-2.5 flex justify-between text-sm">
                                    <div>
                                        <p className="font-medium">{s.drug_name ?? "—"}</p>
                                        <p className="text-xs text-[#687582]">Batch: {s.batch_number ?? s.batch ?? "—"}</p>
                                    </div>
                                    <p className="text-rose-600 font-bold text-xs">{s.expiry_date ? new Date(s.expiry_date).toLocaleDateString("vi-VN") : "—"}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
