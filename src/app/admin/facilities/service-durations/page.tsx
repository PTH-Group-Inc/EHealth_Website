"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import {
    CONSULTATION_DURATION_ENDPOINTS,
    MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS,
    FACILITY_MANAGEMENT_ENDPOINTS,
} from "@/api/endpoints";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface Duration {
    facilityServiceId: string;
    serviceName: string;
    durationMinutes: number;
    draft?: number;
}

interface FacilityLite { id: string; name: string; }

function mapDuration(r: any): Duration {
    return {
        facilityServiceId: String(r.facility_service_id ?? r.facility_services_id ?? r.service_id ?? r.id ?? ""),
        serviceName: r.service_name ?? r.name ?? "",
        durationMinutes: Number(r.duration_minutes ?? r.durationMinutes ?? r.default_duration ?? 30),
    };
}

export default function ServiceDurationsPage() {
    const toast = useToast();
    const [facilities, setFacilities] = useState<FacilityLite[]>([]);
    const [facilityId, setFacilityId] = useState("");
    const [durations, setDurations] = useState<Duration[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [bulkValue, setBulkValue] = useState<number>(30);
    const [saving, setSaving] = useState<string | null>(null);

    const loadFacilities = useCallback(async () => {
        try {
            const res = await axiosClient.get(FACILITY_MANAGEMENT_ENDPOINTS.DROPDOWN);
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            const list = raw.map((d: any) => ({ id: String(d.facility_id ?? d.facilities_id ?? d.id ?? ""), name: d.name ?? d.facility_name ?? "" })).filter((f) => f.id);
            setFacilities(list);
            if (list.length > 0 && !facilityId) setFacilityId(list[0].id);
        } catch {
            setFacilities([]);
        }
    }, [facilityId]);

    const load = useCallback(async () => {
        if (!facilityId) return;
        setLoading(true);
        setError(null);
        try {
            // Try consultation-durations endpoint first
            try {
                const res = await axiosClient.get(CONSULTATION_DURATION_ENDPOINTS.LIST(facilityId));
                const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
                if (raw.length > 0) {
                    setDurations(raw.map(mapDuration));
                    return;
                }
            } catch {
                // fallback to facility services below
            }

            // Fallback: list facility services and assume default duration
            const res = await axiosClient.get(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.FACILITY_ACTIVE_SERVICES(facilityId));
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            setDurations(raw.map((r: any) => ({
                facilityServiceId: String(r.facility_services_id ?? r.facility_service_id ?? r.id ?? ""),
                serviceName: r.name ?? r.service_name ?? "",
                durationMinutes: Number(r.duration_minutes ?? r.default_duration ?? 30),
            })).filter((d: Duration) => d.facilityServiceId));
        } catch {
            setError("Không tải được danh sách dịch vụ của cơ sở.");
            setDurations([]);
        } finally {
            setLoading(false);
        }
    }, [facilityId]);

    useEffect(() => { loadFacilities(); }, [loadFacilities]);
    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return durations;
        return durations.filter((d) => d.serviceName.toLowerCase().includes(q));
    }, [durations, search]);

    const stats = useMemo(() => {
        const vals = durations.map((d) => d.durationMinutes);
        return {
            total: durations.length,
            avg: vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
            min: vals.length > 0 ? Math.min(...vals) : 0,
            max: vals.length > 0 ? Math.max(...vals) : 0,
        };
    }, [durations]);

    const updateDraft = (svcId: string, value: number) => {
        setDurations((prev) => prev.map((d) => d.facilityServiceId === svcId ? { ...d, draft: value } : d));
    };

    const handleSaveOne = async (d: Duration) => {
        const value = d.draft ?? d.durationMinutes;
        if (value < 5 || value > 480) { toast.warning("Thời lượng phải từ 5 đến 480 phút."); return; }
        setSaving(d.facilityServiceId);
        try {
            await axiosClient.patch(CONSULTATION_DURATION_ENDPOINTS.UPDATE(facilityId, d.facilityServiceId), {
                duration_minutes: value,
            });
            toast.success(`Đã cập nhật: ${d.serviceName}`);
            setDurations((prev) => prev.map((x) => x.facilityServiceId === d.facilityServiceId ? { ...x, durationMinutes: value, draft: undefined } : x));
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally {
            setSaving(null);
        }
    };

    const handleApplyBulk = async () => {
        if (bulkValue < 5 || bulkValue > 480) { toast.warning("Thời lượng phải từ 5 đến 480 phút."); return; }
        if (!confirm(`Áp dụng ${bulkValue} phút cho tất cả ${durations.length} dịch vụ?`)) return;
        setSaving("__bulk__");
        try {
            await axiosClient.patch(CONSULTATION_DURATION_ENDPOINTS.CREATE(facilityId), {
                duration_minutes: bulkValue,
                apply_all: true,
            });
            toast.success(`Đã áp dụng ${bulkValue} phút cho tất cả dịch vụ.`);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không áp dụng được (BE có thể chưa hỗ trợ bulk).");
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Thời lượng dịch vụ theo cơ sở"
                subtitle="Cấu hình thời lượng khám/xử lý cho từng dịch vụ tại mỗi cơ sở — dùng cho logic chia slot"
                icon="timer"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Thời lượng dịch vụ" }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Cơ sở y tế</label>
                <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                    <option value="">— Chọn cơ sở —</option>
                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </div>

            {facilityId && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Tổng dịch vụ" value={stats.total} icon="medical_services" color="blue" loading={loading} />
                        <StatCard label="Trung bình (phút)" value={stats.avg} icon="timer" color="emerald" loading={loading} />
                        <StatCard label="Ngắn nhất" value={stats.min} icon="speed" color="amber" loading={loading} />
                        <StatCard label="Dài nhất" value={stats.max} icon="hourglass_full" color="violet" loading={loading} />
                    </div>

                    <div className="bg-gradient-to-r from-[#3C81C6]/10 to-[#1d4ed8]/10 dark:from-[#3C81C6]/20 dark:to-[#1d4ed8]/20 border border-[#3C81C6]/20 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "24px" }}>bolt</span>
                        <div className="flex-1 min-w-[200px]">
                            <div className="font-semibold text-[#121417] dark:text-white text-sm">Áp dụng hàng loạt</div>
                            <div className="text-xs text-[#687582] dark:text-gray-400">Đặt cùng một thời lượng cho tất cả dịch vụ.</div>
                        </div>
                        <input type="number" min={5} max={480} step={5} value={bulkValue} onChange={(e) => setBulkValue(Number(e.target.value) || 30)}
                            className="w-24 px-3 py-2 bg-white dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                        <span className="text-sm text-[#687582] dark:text-gray-400">phút</span>
                        <button onClick={handleApplyBulk} disabled={saving === "__bulk__" || durations.length === 0}
                            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                            {saving === "__bulk__" ? "Đang áp dụng..." : "Áp dụng"}
                        </button>
                    </div>

                    <FilterBar searchPlaceholder="Tìm dịch vụ..." searchValue={search} onSearchChange={setSearch} onReset={() => setSearch("")} />

                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                            <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
                    ) : filtered.length === 0 ? (
                        <EmptyState icon="medical_services" title={durations.length === 0 ? "Cơ sở chưa có dịch vụ" : "Không tìm thấy dịch vụ"} description={durations.length === 0 ? "Thêm dịch vụ cho cơ sở tại trang Dịch vụ y tế." : "Thử đổi từ khoá tìm kiếm."} />
                    ) : (
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Dịch vụ</th>
                                        <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400 w-40">Thời lượng hiện tại</th>
                                        <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400 w-48">Thời lượng mới</th>
                                        <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400 w-32">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((d) => {
                                        const hasChange = d.draft !== undefined && d.draft !== d.durationMinutes;
                                        return (
                                            <tr key={d.facilityServiceId} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                                <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{d.serviceName || d.facilityServiceId}</td>
                                                <td className="px-4 py-3">
                                                    <div className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-[#121417] dark:text-white">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>timer</span>
                                                        {d.durationMinutes} phút
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <input type="number" min={5} max={480} step={5} value={d.draft ?? d.durationMinutes} onChange={(e) => updateDraft(d.facilityServiceId, Number(e.target.value) || 0)}
                                                            className="w-24 px-3 py-1.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                                        <span className="text-xs text-[#687582] dark:text-gray-400">phút</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleSaveOne(d)}
                                                        disabled={!hasChange || saving === d.facilityServiceId}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1 ${hasChange ? "text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] shadow-sm hover:shadow-md" : "text-gray-400 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"} disabled:opacity-50`}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>save</span>
                                                        Lưu
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
