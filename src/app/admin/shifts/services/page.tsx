"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import {
    SHIFT_SERVICE_ENDPOINTS,
    SHIFT_ENDPOINTS,
    MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS,
    FACILITY_MANAGEMENT_ENDPOINTS,
} from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

interface ShiftService {
    id: string;
    shiftId: string;
    facilityServiceId: string;
    shiftName?: string;
    serviceName?: string;
    isActive: boolean;
    createdAt?: string;
}

interface ShiftLite { id: string; name: string; startTime?: string; endTime?: string; }
interface ServiceLite { id: string; name: string; }
interface FacilityLite { id: string; name: string; }

function mapShiftService(r: any): ShiftService {
    return {
        id: String(r.shift_services_id ?? r.shift_service_id ?? r.id ?? ""),
        shiftId: String(r.shift_id ?? r.shiftId ?? r.shifts_id ?? ""),
        facilityServiceId: String(r.facility_service_id ?? r.facilityServiceId ?? r.facility_services_id ?? ""),
        shiftName: r.shift_name ?? r.shiftName ?? "",
        serviceName: r.service_name ?? r.serviceName ?? "",
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
        createdAt: r.created_at ?? r.createdAt ?? "",
    };
}

export default function ShiftServicesPage() {
    const toast = useToast();
    const [facilities, setFacilities] = useState<FacilityLite[]>([]);
    const [facilityId, setFacilityId] = useState<string>("");
    const [shifts, setShifts] = useState<ShiftLite[]>([]);
    const [services, setServices] = useState<ServiceLite[]>([]);
    const [assignments, setAssignments] = useState<ShiftService[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedShift, setSelectedShift] = useState<string | null>(null);
    const [showAssign, setShowAssign] = useState(false);
    const [draft, setDraft] = useState({ shiftId: "", serviceIds: new Set<string>() });
    const [saving, setSaving] = useState(false);

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

    const loadDropdowns = useCallback(async () => {
        if (!facilityId) return;
        try {
            const [sRes, svRes] = await Promise.all([
                axiosClient.get(SHIFT_ENDPOINTS.LIST, { params: { limit: 200 } }),
                axiosClient.get(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.FACILITY_ACTIVE_SERVICES(facilityId)),
            ]);
            const sRaw: any[] = Array.isArray(sRes.data?.data) ? sRes.data.data : Array.isArray(sRes.data) ? sRes.data : [];
            const svRaw: any[] = Array.isArray(svRes.data?.data) ? svRes.data.data : Array.isArray(svRes.data) ? svRes.data : [];
            setShifts(sRaw.map((s: any) => ({
                id: String(s.shifts_id ?? s.shift_id ?? s.id ?? ""),
                name: s.name ?? s.shift_name ?? "",
                startTime: (s.start_time ?? s.startTime ?? "").slice(0, 5),
                endTime: (s.end_time ?? s.endTime ?? "").slice(0, 5),
            })).filter((s) => s.id));
            setServices(svRaw.map((s: any) => ({
                id: String(s.facility_services_id ?? s.facility_service_id ?? s.id ?? ""),
                name: s.name ?? s.service_name ?? "",
            })).filter((s) => s.id));
        } catch {
            setShifts([]);
            setServices([]);
        }
    }, [facilityId]);

    const loadAssignments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get(SHIFT_SERVICE_ENDPOINTS.LIST, { params: { limit: 500 } });
            const { data } = unwrapList<any>(res);
            setAssignments(data.map(mapShiftService));
        } catch {
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadFacilities(); }, [loadFacilities]);
    useEffect(() => { loadDropdowns(); loadAssignments(); }, [loadDropdowns, loadAssignments]);

    const shiftMap = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);
    const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

    const byShift = useMemo(() => {
        const map = new Map<string, ShiftService[]>();
        assignments.forEach((a) => {
            if (!map.has(a.shiftId)) map.set(a.shiftId, []);
            map.get(a.shiftId)!.push(a);
        });
        return map;
    }, [assignments]);

    const stats = useMemo(() => ({
        shifts: shifts.length,
        services: services.length,
        assignments: assignments.length,
        active: assignments.filter((a) => a.isActive).length,
    }), [shifts, services, assignments]);

    const openAssign = (shiftId: string) => {
        const existing = new Set(byShift.get(shiftId)?.map((a) => a.facilityServiceId) ?? []);
        setDraft({ shiftId, serviceIds: existing });
        setShowAssign(true);
    };

    const toggleService = (svcId: string) => {
        setDraft((prev) => {
            const next = new Set(prev.serviceIds);
            if (next.has(svcId)) next.delete(svcId);
            else next.add(svcId);
            return { ...prev, serviceIds: next };
        });
    };

    const handleSave = async () => {
        if (!draft.shiftId) return;
        setSaving(true);
        try {
            const existing = byShift.get(draft.shiftId) ?? [];
            const existingIds = new Set(existing.map((a) => a.facilityServiceId));
            const toAdd: string[] = [];
            const toRemove: string[] = [];

            draft.serviceIds.forEach((id) => { if (!existingIds.has(id)) toAdd.push(id); });
            existing.forEach((a) => { if (!draft.serviceIds.has(a.facilityServiceId)) toRemove.push(a.id); });

            await Promise.all([
                ...toAdd.map((svcId) =>
                    axiosClient.post(SHIFT_SERVICE_ENDPOINTS.CREATE, {
                        shift_id: draft.shiftId,
                        facility_service_id: svcId,
                    })
                ),
                ...toRemove.map((assignId) => axiosClient.delete(SHIFT_SERVICE_ENDPOINTS.DETAIL(assignId))),
            ]);
            toast.success(`Đã gán ${draft.serviceIds.size} dịch vụ vào ca.`);
            setShowAssign(false);
            await loadAssignments();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (a: ShiftService) => {
        try {
            await axiosClient.patch(SHIFT_SERVICE_ENDPOINTS.TOGGLE(a.id));
            toast.success(a.isActive ? "Đã tạm dừng." : "Đã kích hoạt.");
            await loadAssignments();
        } catch {
            toast.error("Không đổi được trạng thái.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Gán dịch vụ vào ca làm việc"
                subtitle="Cấu hình dịch vụ nào được phục vụ trong ca nào của cơ sở"
                icon="medical_services"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Ca làm việc" }, { label: "Gán dịch vụ" }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Cơ sở y tế</label>
                <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                    <option value="">— Chọn cơ sở —</option>
                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Số ca" value={stats.shifts} icon="schedule" color="blue" loading={loading} />
                <StatCard label="Dịch vụ" value={stats.services} icon="medical_services" color="violet" loading={loading} />
                <StatCard label="Gán" value={stats.assignments} icon="link" color="emerald" loading={loading} />
                <StatCard label="Đang dùng" value={stats.active} icon="check_circle" color="amber" loading={loading} />
            </div>

            {!facilityId ? (
                <EmptyState icon="store" title="Chọn cơ sở y tế" description="Chọn cơ sở để xem gán dịch vụ theo ca." />
            ) : loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : shifts.length === 0 ? (
                <EmptyState icon="schedule" title="Chưa có ca làm việc" description="Tạo ca làm việc trước tại trang Ca làm việc." />
            ) : (
                <div className="space-y-3">
                    {shifts.map((shift) => {
                        const svcs = byShift.get(shift.id) ?? [];
                        const isExpanded = selectedShift === shift.id;
                        return (
                            <div key={shift.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                                <div className="p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white">
                                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>schedule</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#121417] dark:text-white">{shift.name}</div>
                                            {shift.startTime && <div className="text-xs font-mono text-[#687582] dark:text-gray-400">{shift.startTime}–{shift.endTime}</div>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 rounded-lg bg-[#3C81C6]/10 text-[#3C81C6] text-xs font-semibold">{svcs.length} dịch vụ</div>
                                        <button onClick={() => setSelectedShift(isExpanded ? null : shift.id)}
                                            className="px-3 py-1.5 text-xs text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                                            {isExpanded ? "Ẩn" : "Xem"}
                                        </button>
                                        <button onClick={() => openAssign(shift.id)}
                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-lg inline-flex items-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                            Gán DV
                                        </button>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-800">
                                        {svcs.length === 0 ? (
                                            <div className="text-sm text-[#687582] dark:text-gray-500 italic py-3">Chưa gán dịch vụ nào cho ca này.</div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 pt-3">
                                                {svcs.map((a) => {
                                                    const svc = serviceMap.get(a.facilityServiceId);
                                                    return (
                                                        <div key={a.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${a.isActive ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800"}`}>
                                                            <div className="text-xs text-[#121417] dark:text-white truncate">{svc?.name || a.serviceName || a.facilityServiceId}</div>
                                                            <button onClick={() => handleToggle(a)}
                                                                className={`px-2 py-0.5 text-[10px] font-medium rounded ${a.isActive ? "text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                                                                {a.isActive ? "Đang dùng" : "Tắt"}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showAssign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssign(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-xl w-full p-5 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">medical_services</span>
                            Gán dịch vụ vào ca: {shiftMap.get(draft.shiftId)?.name}
                        </h3>
                        <p className="text-xs text-[#687582] dark:text-gray-400 mb-3">Đã chọn <b>{draft.serviceIds.size}</b>/{services.length} dịch vụ</p>
                        <div className="flex-1 overflow-y-auto space-y-1 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl p-3">
                            {services.length === 0 ? (
                                <div className="text-sm text-[#687582] dark:text-gray-500 italic py-4 text-center">Cơ sở chưa có dịch vụ nào đang hoạt động.</div>
                            ) : services.map((svc) => (
                                <label key={svc.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] cursor-pointer">
                                    <input type="checkbox" checked={draft.serviceIds.has(svc.id)} onChange={() => toggleService(svc.id)}
                                        className="w-4 h-4 rounded border-[#dde0e4] text-[#3C81C6] focus:ring-[#3C81C6]" />
                                    <span className="text-sm text-[#121417] dark:text-white flex-1">{svc.name}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowAssign(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                                {saving ? "Đang lưu..." : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
