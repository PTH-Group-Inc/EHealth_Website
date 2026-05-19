"use client";

import { useEffect, useState } from "react";
import { prescriptionService } from "@/services/prescriptionService";
import { EmptyState } from "@/components/shared/layout";

interface Props { encounterId: string }

export default function PrescriptionsTab({ encounterId }: Props) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        const fetcher = (prescriptionService as any).getByEncounter
            ? (prescriptionService as any).getByEncounter(encounterId)
            : Promise.resolve({ data: [] });

        fetcher
            .then((r: any) => {
                if (cancelled) return;
                const data = r?.data ?? r ?? [];
                setItems(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (!cancelled) setItems([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [encounterId]);

    if (loading) return <div className="p-6 text-center text-[#687582]">Đang tải đơn thuốc…</div>;
    if (items.length === 0) return <EmptyState icon="medication" title="Chưa có đơn thuốc" description="Phiên khám này chưa kê đơn nào." />;

    return (
        <div className="space-y-2">
            {items.map((p: any) => (
                <div key={p.id ?? p.prescriptionId} className="p-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-[#121417] dark:text-white">Đơn #{p.code ?? p.id?.slice(0, 8)}</p>
                            <p className="text-sm text-[#687582] mt-1">{p.diagnosis ?? "—"}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{p.status ?? "DRAFT"}</span>
                    </div>
                    {p.items && Array.isArray(p.items) && (
                        <ul className="mt-2 text-sm text-[#687582] list-disc pl-5">
                            {p.items.slice(0, 5).map((m: any, i: number) => (
                                <li key={i}>{m.drugName ?? m.name} — {m.dosage ?? ""} {m.frequency ?? ""}</li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}
