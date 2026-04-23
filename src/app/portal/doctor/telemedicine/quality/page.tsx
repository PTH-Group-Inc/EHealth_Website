"use client";

/**
 * Tele Quality — Phase I.6 #7.
 * Spec: dòng 7621-7676.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { teleQualityService } from "@/services/teleQualityService";

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };

export default function TeleQualityPage() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        Promise.allSettled([
            teleQualityService.getDoctorMetrics(user.id),
            teleQualityService.getDoctorReviews(user.id),
        ]).then(([m, r]) => {
            if (m.status === "fulfilled") setMetrics(m.value);
            if (r.status === "fulfilled") setReviews((r.value as any)?.data ?? []);
            setLoading(false);
        });
    }, [user?.id]);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Chất lượng telemedicine"
                subtitle="Quality metrics & review của bác sĩ trong các phiên khám online."
                icon="thumb_up"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Telemedicine", href: "/portal/doctor/telemedicine" },
                    { label: "Chất lượng" },
                ]}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Rating TB" value={metrics?.average_rating ? Number(metrics.average_rating).toFixed(2) : "—"} icon="star" color="amber" loading={loading} />
                <StatCard label="Tổng review" value={metrics?.total_reviews ?? reviews.length} icon="reviews" color="blue" loading={loading} />
                <StatCard label="Phiên hoàn tất" value={metrics?.completed_sessions ?? 0} icon="task_alt" color="emerald" loading={loading} />
                <StatCard label="Phản hồi tốt" value={metrics?.positive_count ?? 0} icon="thumb_up" color="violet" loading={loading} />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] text-sm font-bold">
                    Reviews ({reviews.length})
                </div>
                {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
                : reviews.length === 0 ? <EmptyState icon="reviews" title="Chưa có review" description="Phiên khám của bạn chưa nhận được đánh giá nào." />
                : (
                    <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                        {reviews.map((r: any) => (
                            <li key={r.id ?? r.review_id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-amber-500 text-lg">{r.rating ?? 0}/5</span>
                                        <span className="text-xs text-[#687582]">· {r.patient_name ?? "Bệnh nhân ẩn danh"}</span>
                                    </div>
                                    <span className="text-xs text-[#687582]">{fmt(r.created_at ?? r.reviewed_at)}</span>
                                </div>
                                {r.comment && <p className="text-sm">{r.comment}</p>}
                                {r.consultation_id && <p className="text-xs text-[#687582] mt-1 font-mono">Consultation #{r.consultation_id.slice(0, 8)}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
