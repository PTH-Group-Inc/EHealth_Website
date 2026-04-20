"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { encounterService } from "@/services/encounterService";
import { EmptyState } from "@/components/shared/layout/EmptyState";

/**
 * Wrapper màn khám lâm sàng theo route spec /portal/doctor/clinical-exam/[encounterId].
 * Trang khám wizard 6 bước thực sự nằm ở /portal/doctor/examination.
 * Page này load encounter để lấy patientId rồi redirect kèm đủ context.
 */
export default function ClinicalExamRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const encounterId = String(params?.encounterId ?? "");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!encounterId) return;
        let cancelled = false;
        encounterService
            .getById(encounterId)
            .then((res: any) => {
                if (cancelled) return;
                const patientId = res?.patientId ?? res?.patient_id ?? res?.patient?.id ?? "";
                const appointmentId = res?.appointmentId ?? res?.appointment_id ?? "";
                const qs = new URLSearchParams({ encounter: encounterId });
                if (patientId) qs.set("patient", String(patientId));
                if (appointmentId) qs.set("appointment", String(appointmentId));
                router.replace(`/portal/doctor/examination?${qs.toString()}`);
            })
            .catch(() => {
                if (cancelled) return;
                setError("Không tải được phiên khám. Có thể encounter không tồn tại.");
            });
        return () => { cancelled = true; };
    }, [encounterId, router]);

    if (error) {
        return (
            <div className="p-6">
                <EmptyState
                    icon="error"
                    variant="warning"
                    title="Không thể mở khám lâm sàng"
                    description={error}
                    action={
                        <Link href={`/portal/doctor/encounters/${encounterId}`} className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#3C81C6] hover:bg-[#3C81C6]/[0.08] rounded-xl">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                            Quay lại chi tiết phiên khám
                        </Link>
                    }
                />
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-12 h-12 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-[#687582] dark:text-gray-400">Đang chuẩn bị màn khám lâm sàng...</p>
        </div>
    );
}
