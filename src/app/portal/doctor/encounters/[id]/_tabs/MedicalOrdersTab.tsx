"use client";

import { useEffect, useState } from "react";
import { medicalOrderService } from "@/services/medicalOrderService";
import { EmptyState } from "@/components/shared/layout";

interface Props { encounterId: string }

export default function MedicalOrdersTab({ encounterId }: Props) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        const fetcher = (medicalOrderService as any).getByEncounter
            ? (medicalOrderService as any).getByEncounter(encounterId)
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

    if (loading) return <div className="p-6 text-center text-[#687582]">Đang tải y lệnh / chỉ định…</div>;
    if (items.length === 0) return <EmptyState icon="assignment" title="Chưa có y lệnh" description="Phiên khám này chưa có y lệnh / chỉ định nào." />;

    return (
        <div className="space-y-2">
            {items.map((o: any) => (
                <div key={o.id ?? o.orderId} className="p-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-lg">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#121417] dark:text-white">
                                {o.title ?? o.orderName ?? o.testName ?? `Y lệnh #${o.id?.slice(0, 8) ?? ""}`}
                            </p>
                            <p className="text-sm text-[#687582] mt-1 truncate">
                                {o.type ?? o.orderType ?? "—"} {o.note ? `· ${o.note}` : ""}
                            </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 flex-shrink-0">
                            {o.status ?? "PENDING"}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
