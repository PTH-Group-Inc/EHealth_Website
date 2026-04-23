"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { TELE_QUALITY_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

type TabKey = "overview" | "reviews" | "alerts";

interface Review {
    id: string;
    patientName: string;
    doctorName: string;
    rating: number;
    comment?: string;
    createdAt?: string;
}

interface Alert {
    id: string;
    level: "INFO" | "WARNING" | "CRITICAL";
    title: string;
    description?: string;
    doctorName?: string;
    isResolved: boolean;
    createdAt?: string;
}

function mapReview(r: any): Review {
    return {
        id: String(r.review_id ?? r.id ?? ""),
        patientName: r.patient_name ?? r.patientName ?? "—",
        doctorName: r.doctor_name ?? r.doctorName ?? "—",
        rating: Number(r.rating ?? r.overall_rating ?? 0),
        comment: r.comment ?? r.feedback ?? "",
        createdAt: r.created_at ?? "",
    };
}

function mapAlert(r: any): Alert {
    const lvl = String(r.level ?? r.severity ?? "INFO").toUpperCase();
    return {
        id: String(r.alert_id ?? r.id ?? ""),
        level: lvl === "CRITICAL" ? "CRITICAL" : lvl === "WARNING" ? "WARNING" : "INFO",
        title: r.title ?? r.message ?? "",
        description: r.description ?? r.details ?? "",
        doctorName: r.doctor_name ?? r.doctorName ?? "",
        isResolved: Boolean(r.is_resolved ?? r.isResolved ?? false),
        createdAt: r.created_at ?? "",
    };
}

function formatDT(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TeleQualityPage() {
    const tr = useTranslations("pages.tele.quality");
    const tc = useTranslations("common");
    const [tab, setTab] = useState<TabKey>("overview");

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={tr("title")}
                subtitle={tr("subtitle")}
                icon="star_rate"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: "Telemedicine" }, { label: tr("title") }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-1.5 inline-flex gap-1">
                {([
                    { key: "overview", label: "Tổng quan", icon: "analytics" },
                    { key: "reviews", label: "Đánh giá", icon: "star_rate" },
                    { key: "alerts", label: "Cảnh báo", icon: "warning" },
                ] as { key: TabKey; label: string; icon: string }[]).map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 ${tab === t.key ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm" : "text-[#687582] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "overview" && <OverviewTab />}
            {tab === "reviews" && <ReviewsTab />}
            {tab === "alerts" && <AlertsTab />}
        </div>
    );
}

function OverviewTab() {
    const [overview, setOverview] = useState<any>({});
    const [connection, setConnection] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axiosClient.get(TELE_QUALITY_ENDPOINTS.OVERVIEW).then((r) => r.data?.data ?? r.data).catch(() => ({})),
            axiosClient.get(TELE_QUALITY_ENDPOINTS.CONNECTION_STATS).then((r) => r.data?.data ?? r.data).catch(() => ({})),
        ]).then(([o, c]) => {
            setOverview(o);
            setConnection(c);
            setLoading(false);
        });
    }, []);

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng phiên khám" value={overview.total_consultations ?? 0} icon="videocam" color="blue" loading={loading} />
                <StatCard label="Điểm TB" value={`${overview.average_rating ?? 0}/5`} icon="star_rate" color="amber" loading={loading} />
                <StatCard label="Kết nối tốt" value={`${connection.good_connection_percentage ?? 0}%`} icon="network_check" color="emerald" loading={loading} />
                <StatCard label="Cảnh báo mở" value={overview.open_alerts ?? 0} icon="warning" color="red" loading={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                    <h3 className="font-bold text-[#121417] dark:text-white mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[#3C81C6]">signal_cellular_alt</span>Chất lượng kết nối</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between"><span className="text-[#687582]">Latency TB</span><span className="font-mono font-semibold">{connection.avg_latency_ms ?? 0} ms</span></div>
                        <div className="flex items-center justify-between"><span className="text-[#687582]">Packet loss</span><span className="font-mono font-semibold">{connection.avg_packet_loss ?? 0}%</span></div>
                        <div className="flex items-center justify-between"><span className="text-[#687582]">Phiên rớt</span><span className="font-mono font-semibold text-red-600">{connection.dropped_sessions ?? 0}</span></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                    <h3 className="font-bold text-[#121417] dark:text-white mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-amber-600">star_rate</span>Đánh giá</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between"><span className="text-[#687582]">Điểm TB</span><span className="font-mono font-semibold">{overview.average_rating ?? 0}/5</span></div>
                        <div className="flex items-center justify-between"><span className="text-[#687582]">Tổng review</span><span className="font-mono font-semibold">{overview.total_reviews ?? 0}</span></div>
                        <div className="flex items-center justify-between"><span className="text-[#687582]">Tỉ lệ 5 sao</span><span className="font-mono font-semibold text-emerald-600">{overview.five_star_percentage ?? 0}%</span></div>
                    </div>
                </div>
            </div>
        </>
    );
}

function ReviewsTab() {
    const [items, setItems] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(TELE_QUALITY_ENDPOINTS.REVIEWS, { params: { limit: 100 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapReview));
        } catch {
            setError("Không tải được đánh giá.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <>
            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="star_rate" title="Chưa có đánh giá" description="Sau mỗi phiên khám, bệnh nhân có thể để lại đánh giá." />
            ) : (
                <div className="space-y-3">
                    {items.map((r) => (
                        <div key={r.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                    <div className="font-bold text-[#121417] dark:text-white">{r.patientName}</div>
                                    <div className="text-xs text-[#687582]">đánh giá <b>BS. {r.doctorName}</b></div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <span key={i} className={`material-symbols-outlined ${i <= r.rating ? "text-amber-500" : "text-gray-300"}`} style={{ fontSize: "18px", fontVariationSettings: `"FILL" ${i <= r.rating ? 1 : 0}` }}>star</span>
                                    ))}
                                    <span className="ml-1 font-bold text-sm text-[#121417] dark:text-white">{r.rating}/5</span>
                                </div>
                            </div>
                            {r.comment && <p className="text-sm text-[#687582] dark:text-gray-400 italic">&ldquo;{r.comment}&rdquo;</p>}
                            <div className="text-xs text-[#687582] dark:text-gray-500 mt-2">{formatDT(r.createdAt)}</div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

function AlertsTab() {
    const toast = useToast();
    const [items, setItems] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(TELE_QUALITY_ENDPOINTS.ALERTS, { params: { limit: 100 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapAlert));
        } catch {
            setError("Không tải được cảnh báo.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleResolve = async (a: Alert) => {
        try {
            await axiosClient.put(TELE_QUALITY_ENDPOINTS.RESOLVE_ALERT(a.id));
            toast.success("Đã xử lý."); await load();
        } catch { toast.error("Không xử lý được."); }
    };

    const open = useMemo(() => items.filter((a) => !a.isResolved), [items]);
    const resolved = useMemo(() => items.filter((a) => a.isResolved), [items]);

    return (
        <>
            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="warning" title="Không có cảnh báo" description="Hệ thống đang vận hành bình thường." />
            ) : (
                <>
                    {open.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-red-700 dark:text-red-300 mb-2">Đang mở ({open.length})</h3>
                            <div className="space-y-2">
                                {open.map((a) => (
                                    <AlertRow key={a.id} alert={a} onResolve={() => handleResolve(a)} />
                                ))}
                            </div>
                        </div>
                    )}
                    {resolved.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 mb-2 mt-4">Đã xử lý ({resolved.length})</h3>
                            <div className="space-y-2">
                                {resolved.slice(0, 20).map((a) => (
                                    <AlertRow key={a.id} alert={a} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

function AlertRow({ alert, onResolve }: { alert: Alert; onResolve?: () => void }) {
    const levelColor = alert.level === "CRITICAL" ? "red" : alert.level === "WARNING" ? "amber" : "blue";
    return (
        <div className={`bg-white dark:bg-[#1e242b] rounded-xl border shadow-sm p-3 flex items-start gap-3 ${alert.isResolved ? "opacity-60 border-[#dde0e4] dark:border-[#2d353e]" : `border-${levelColor}-300 dark:border-${levelColor}-800`}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white ${levelColor === "red" ? "bg-red-500" : levelColor === "amber" ? "bg-amber-500" : "bg-blue-500"}`}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{alert.level === "CRITICAL" ? "error" : "warning"}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[#121417] dark:text-white">{alert.title}</div>
                {alert.description && <div className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">{alert.description}</div>}
                <div className="flex items-center gap-2 text-xs text-[#687582] mt-1">
                    {alert.doctorName && <span>BS. {alert.doctorName}</span>}
                    <span>·</span>
                    <span>{formatDT(alert.createdAt)}</span>
                </div>
            </div>
            {onResolve && (
                <button onClick={onResolve} className="px-2 py-1 text-xs text-emerald-600 border border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">Xử lý</button>
            )}
        </div>
    );
}
