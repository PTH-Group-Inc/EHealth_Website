"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import {
    MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS,
    FACILITY_MANAGEMENT_ENDPOINTS,
} from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type ServiceStatus = "ACTIVE" | "INACTIVE";

interface MasterService {
    id: string;
    code: string;
    name: string;
    group?: string;
    category?: string;
    price?: number;
    duration?: number;
    status: ServiceStatus;
    description?: string;
}

interface FacilityService {
    id: string;
    serviceId: string;
    serviceName: string;
    serviceCode?: string;
    facilityId: string;
    facilityName?: string;
    price?: number;
    duration?: number;
    status: ServiceStatus;
    specialtyName?: string;
}

interface Facility { id: string; name: string; }

interface MasterFormState {
    id?: string;
    code: string;
    name: string;
    group: string;
    category: string;
    price: string;
    duration: string;
    description: string;
}

interface FacilityFormState {
    id?: string;
    facilityId: string;
    serviceId: string;
    price: string;
    duration: string;
}

const EMPTY_MASTER: MasterFormState = { code: "", name: "", group: "", category: "", price: "", duration: "30", description: "" };
const EMPTY_FACILITY: FacilityFormState = { facilityId: "", serviceId: "", price: "", duration: "30" };

function normalizeStatus(s: any): ServiceStatus {
    const v = String(s ?? "").toUpperCase();
    return v === "INACTIVE" || v === "DISABLED" ? "INACTIVE" : "ACTIVE";
}

function mapMaster(s: any): MasterService {
    return {
        id: String(s.services_id ?? s.service_id ?? s.id ?? ""),
        code: s.code ?? s.service_code ?? "",
        name: s.name ?? s.service_name ?? "",
        group: s.service_group ?? s.group ?? "",
        category: s.category_name ?? s.category ?? "",
        price: typeof s.price === "number" ? s.price : typeof s.default_price === "number" ? s.default_price : undefined,
        duration: typeof s.duration_minutes === "number" ? s.duration_minutes : typeof s.duration === "number" ? s.duration : undefined,
        status: normalizeStatus(s.status),
        description: s.description ?? "",
    };
}

function mapFacilityService(s: any): FacilityService {
    return {
        id: String(s.facility_services_id ?? s.facility_service_id ?? s.id ?? ""),
        serviceId: String(s.services_id ?? s.service_id ?? ""),
        serviceName: s.service_name ?? s.name ?? "",
        serviceCode: s.service_code ?? s.code ?? "",
        facilityId: String(s.facilities_id ?? s.facility_id ?? ""),
        facilityName: s.facility_name ?? "",
        price: typeof s.price === "number" ? s.price : undefined,
        duration: typeof s.duration_minutes === "number" ? s.duration_minutes : typeof s.duration === "number" ? s.duration : undefined,
        status: normalizeStatus(s.status),
        specialtyName: s.specialty_name ?? "",
    };
}

export default function ServicesAdminPage() {
    const toast = useToast();
    const [tab, setTab] = useState<"master" | "facility">("master");

    // Master state
    const [master, setMaster] = useState<MasterService[]>([]);
    const [masterLoading, setMasterLoading] = useState(true);
    const [masterError, setMasterError] = useState<string | null>(null);
    const [masterSearch, setMasterSearch] = useState("");
    const [masterStatusFilter, setMasterStatusFilter] = useState("all");
    const [showMasterModal, setShowMasterModal] = useState(false);
    const [masterForm, setMasterForm] = useState<MasterFormState>(EMPTY_MASTER);
    const [savingMaster, setSavingMaster] = useState(false);

    // Facility state
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [selectedFacilityId, setSelectedFacilityId] = useState("");
    const [facilityServices, setFacilityServices] = useState<FacilityService[]>([]);
    const [fsLoading, setFsLoading] = useState(false);
    const [fsError, setFsError] = useState<string | null>(null);
    const [fsSearch, setFsSearch] = useState("");
    const [fsStatusFilter, setFsStatusFilter] = useState("all");
    const [showFacilityModal, setShowFacilityModal] = useState(false);
    const [facilityForm, setFacilityForm] = useState<FacilityFormState>(EMPTY_FACILITY);
    const [savingFacility, setSavingFacility] = useState(false);

    const loadMaster = useCallback(async () => {
        setMasterLoading(true);
        setMasterError(null);
        try {
            const res = await axiosClient.get(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.MASTER_LIST, { params: { limit: 500 } });
            const { data } = unwrapList<any>(res);
            setMaster(data.map(mapMaster));
        } catch {
            setMasterError("Không tải được dịch vụ master.");
            setMaster([]);
        } finally {
            setMasterLoading(false);
        }
    }, []);

    const loadFacilities = useCallback(async () => {
        try {
            const res = await axiosClient.get(FACILITY_MANAGEMENT_ENDPOINTS.DROPDOWN);
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            const list: Facility[] = raw.map((f: any) => ({
                id: String(f.facilities_id ?? f.facility_id ?? f.id ?? ""),
                name: f.name ?? f.facility_name ?? "",
            })).filter((f) => f.id);
            setFacilities(list);
            if (list.length && !selectedFacilityId) setSelectedFacilityId(list[0].id);
        } catch {
            setFacilities([]);
        }
    }, [selectedFacilityId]);

    const loadFacilityServices = useCallback(async (facilityId: string) => {
        if (!facilityId) return;
        setFsLoading(true);
        setFsError(null);
        try {
            const res = await axiosClient.get(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.FACILITY_SERVICES(facilityId));
            const { data } = unwrapList<any>(res);
            setFacilityServices(data.map(mapFacilityService));
        } catch {
            setFsError("Không tải được dịch vụ của cơ sở.");
            setFacilityServices([]);
        } finally {
            setFsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMaster();
        loadFacilities();
    }, [loadMaster, loadFacilities]);

    useEffect(() => {
        if (tab === "facility" && selectedFacilityId) {
            loadFacilityServices(selectedFacilityId);
        }
    }, [tab, selectedFacilityId, loadFacilityServices]);

    const masterFiltered = useMemo(() => {
        const q = masterSearch.trim().toLowerCase();
        return master.filter((s) => {
            if (masterStatusFilter !== "all" && s.status !== masterStatusFilter) return false;
            if (q && !`${s.code} ${s.name} ${s.group ?? ""} ${s.category ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [master, masterSearch, masterStatusFilter]);

    const fsFiltered = useMemo(() => {
        const q = fsSearch.trim().toLowerCase();
        return facilityServices.filter((s) => {
            if (fsStatusFilter !== "all" && s.status !== fsStatusFilter) return false;
            if (q && !`${s.serviceCode ?? ""} ${s.serviceName} ${s.specialtyName ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [facilityServices, fsSearch, fsStatusFilter]);

    const masterStats = useMemo(() => ({
        total: master.length,
        active: master.filter((s) => s.status === "ACTIVE").length,
        groups: new Set(master.map((s) => s.group).filter(Boolean)).size,
        facilities: facilities.length,
    }), [master, facilities]);

    const fsStats = useMemo(() => ({
        total: facilityServices.length,
        active: facilityServices.filter((s) => s.status === "ACTIVE").length,
        avgPrice: facilityServices.length
            ? Math.round(facilityServices.filter((s) => s.price).reduce((sum, s) => sum + (s.price ?? 0), 0) / Math.max(1, facilityServices.filter((s) => s.price).length))
            : 0,
    }), [facilityServices]);

    // ---- Master actions ----
    const openCreateMaster = () => { setMasterForm(EMPTY_MASTER); setShowMasterModal(true); };
    const openEditMaster = (s: MasterService) => {
        setMasterForm({
            id: s.id,
            code: s.code,
            name: s.name,
            group: s.group ?? "",
            category: s.category ?? "",
            price: s.price != null ? String(s.price) : "",
            duration: s.duration != null ? String(s.duration) : "30",
            description: s.description ?? "",
        });
        setShowMasterModal(true);
    };

    const handleSaveMaster = async () => {
        if (!masterForm.code.trim() || !masterForm.name.trim()) {
            toast.warning("Vui lòng nhập mã và tên dịch vụ.");
            return;
        }
        setSavingMaster(true);
        try {
            const payload: any = {
                code: masterForm.code.trim(),
                name: masterForm.name.trim(),
                service_group: masterForm.group.trim() || undefined,
                category_name: masterForm.category.trim() || undefined,
                price: masterForm.price ? Number(masterForm.price) : undefined,
                duration_minutes: masterForm.duration ? Number(masterForm.duration) : undefined,
                description: masterForm.description.trim() || undefined,
            };
            if (masterForm.id) {
                await axiosClient.put(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.MASTER_UPDATE(masterForm.id), payload);
                toast.success("Đã cập nhật dịch vụ.");
            } else {
                await axiosClient.post(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.MASTER_CREATE, payload);
                toast.success("Đã tạo dịch vụ mới.");
            }
            setShowMasterModal(false);
            await loadMaster();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không lưu được dịch vụ.");
        } finally {
            setSavingMaster(false);
        }
    };

    const handleToggleMasterStatus = async (s: MasterService) => {
        const next = s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        try {
            await axiosClient.patch(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.MASTER_STATUS(s.id), { status: next });
            toast.success(next === "ACTIVE" ? "Đã kích hoạt." : "Đã tạm dừng.");
            await loadMaster();
        } catch {
            toast.error("Không đổi được trạng thái.");
        }
    };

    const handleDeleteMaster = async (s: MasterService) => {
        if (!confirm(`Xoá dịch vụ "${s.name}"?`)) return;
        try {
            await axiosClient.delete(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.MASTER_DELETE(s.id));
            toast.success("Đã xoá dịch vụ.");
            await loadMaster();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không xoá được dịch vụ (có thể đã dùng).");
        }
    };

    // ---- Facility actions ----
    const openCreateFacility = () => {
        if (!selectedFacilityId) {
            toast.warning("Chọn cơ sở trước.");
            return;
        }
        const assignedIds = new Set(facilityServices.map((fs) => fs.serviceId));
        const firstAvailable = master.find((s) => s.status === "ACTIVE" && !assignedIds.has(s.id));
        setFacilityForm({
            facilityId: selectedFacilityId,
            serviceId: firstAvailable?.id ?? "",
            price: firstAvailable?.price != null ? String(firstAvailable.price) : "",
            duration: firstAvailable?.duration != null ? String(firstAvailable.duration) : "30",
        });
        setShowFacilityModal(true);
    };

    const openEditFacility = (s: FacilityService) => {
        setFacilityForm({
            id: s.id,
            facilityId: s.facilityId,
            serviceId: s.serviceId,
            price: s.price != null ? String(s.price) : "",
            duration: s.duration != null ? String(s.duration) : "30",
        });
        setShowFacilityModal(true);
    };

    const handleSaveFacility = async () => {
        if (!facilityForm.facilityId || !facilityForm.serviceId) {
            toast.warning("Chọn cơ sở và dịch vụ.");
            return;
        }
        setSavingFacility(true);
        try {
            const payload: any = {
                services_id: facilityForm.serviceId,
                price: facilityForm.price ? Number(facilityForm.price) : undefined,
                duration_minutes: facilityForm.duration ? Number(facilityForm.duration) : undefined,
            };
            if (facilityForm.id) {
                await axiosClient.put(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.FACILITY_SERVICE_UPDATE(facilityForm.id), payload);
                toast.success("Đã cập nhật dịch vụ tại cơ sở.");
            } else {
                await axiosClient.post(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.FACILITY_SERVICE_CREATE(facilityForm.facilityId), payload);
                toast.success("Đã gán dịch vụ cho cơ sở.");
            }
            setShowFacilityModal(false);
            await loadFacilityServices(selectedFacilityId);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không lưu được dịch vụ tại cơ sở.");
        } finally {
            setSavingFacility(false);
        }
    };

    const handleToggleFacilityStatus = async (s: FacilityService) => {
        const next = s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        try {
            await axiosClient.patch(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.FACILITY_SERVICE_STATUS(s.id), { status: next });
            toast.success(next === "ACTIVE" ? "Đã kích hoạt." : "Đã tạm dừng.");
            await loadFacilityServices(selectedFacilityId);
        } catch {
            toast.error("Không đổi được trạng thái.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Dịch vụ y tế"
                subtitle="Quản lý danh mục dịch vụ gốc và dịch vụ triển khai tại từng cơ sở"
                icon="medical_information"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Dịch vụ" }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] p-1 inline-flex gap-1">
                <button
                    onClick={() => setTab("master")}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all inline-flex items-center gap-2 ${
                        tab === "master"
                            ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm"
                            : "text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>list_alt</span>
                    Danh mục gốc
                </button>
                <button
                    onClick={() => setTab("facility")}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all inline-flex items-center gap-2 ${
                        tab === "facility"
                            ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm"
                            : "text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>domain</span>
                    Theo cơ sở
                </button>
            </div>

            {tab === "master" ? (
                <>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-w-[320px]">
                            <StatCard label="Tổng dịch vụ" value={masterStats.total} icon="medical_information" color="blue" loading={masterLoading} />
                            <StatCard label="Đang hoạt động" value={masterStats.active} icon="check_circle" color="emerald" loading={masterLoading} />
                            <StatCard label="Nhóm dịch vụ" value={masterStats.groups} icon="category" color="violet" loading={masterLoading} />
                            <StatCard label="Cơ sở" value={masterStats.facilities} icon="domain" color="amber" loading={masterLoading} />
                        </div>
                        <button onClick={openCreateMaster} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                            Tạo dịch vụ
                        </button>
                    </div>

                    <FilterBar
                        searchPlaceholder="Tìm theo mã, tên, nhóm, loại..."
                        searchValue={masterSearch}
                        onSearchChange={setMasterSearch}
                        filters={[
                            {
                                key: "status", label: "Trạng thái", value: masterStatusFilter, onChange: setMasterStatusFilter,
                                options: [
                                    { value: "all", label: "Mọi trạng thái" },
                                    { value: "ACTIVE", label: "Hoạt động" },
                                    { value: "INACTIVE", label: "Tạm dừng" },
                                ],
                            },
                        ]}
                        onReset={() => { setMasterSearch(""); setMasterStatusFilter("all"); }}
                    />

                    {masterError && (
                        <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                            <p className="text-sm text-amber-800 dark:text-amber-200">{masterError}</p>
                        </div>
                    )}

                    {masterLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                        </div>
                    ) : masterFiltered.length === 0 ? (
                        <EmptyState
                            icon="medical_information"
                            title="Chưa có dịch vụ"
                            description={master.length === 0 ? "Tạo dịch vụ đầu tiên trong danh mục." : "Không có dịch vụ phù hợp bộ lọc."}
                            action={master.length === 0 ? (
                                <button onClick={openCreateMaster} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">+ Tạo dịch vụ</button>
                            ) : undefined}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {masterFiltered.map((s) => (
                                <div key={s.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all overflow-hidden">
                                    <div className={`h-1.5 ${s.status === "ACTIVE" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-gray-400 to-gray-500"}`} />
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white flex-shrink-0">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>medical_information</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white truncate" title={s.name}>{s.name}</h3>
                                                    <p className="text-xs text-[#687582] dark:text-gray-400 font-mono">{s.code}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                                s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                            }`}>{s.status === "ACTIVE" ? "Hoạt động" : "Tạm dừng"}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-[10px] mb-2">
                                            {s.group && <span className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">{s.group}</span>}
                                            {s.category && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">{s.category}</span>}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-[#687582] dark:text-gray-400 mb-3">
                                            {s.price != null && (
                                                <span className="flex items-center gap-1 text-[#3C81C6] font-semibold">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>payments</span>
                                                    {s.price.toLocaleString("vi-VN")}đ
                                                </span>
                                            )}
                                            {s.duration != null && (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>timer</span>
                                                    {s.duration}p
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 pt-3 border-t border-gray-50 dark:border-gray-800">
                                            <button onClick={() => openEditMaster(s)} className="flex-1 px-3 py-1.5 text-xs font-medium text-[#3C81C6] bg-[#3C81C6]/[0.08] hover:bg-[#3C81C6]/[0.16] rounded-lg inline-flex items-center justify-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                                Sửa
                                            </button>
                                            <button onClick={() => handleToggleMasterStatus(s)} className={`px-2 py-1 text-xs rounded-lg ${
                                                s.status === "ACTIVE" ? "text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300"
                                            }`} title={s.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{s.status === "ACTIVE" ? "pause" : "play_arrow"}</span>
                                            </button>
                                            <button onClick={() => handleDeleteMaster(s)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Xoá">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1 min-w-[320px]">
                            <StatCard label="Dịch vụ tại cơ sở" value={fsStats.total} icon="medical_information" color="blue" loading={fsLoading} />
                            <StatCard label="Đang bán" value={fsStats.active} icon="check_circle" color="emerald" loading={fsLoading} />
                            <StatCard label="Giá TB" value={fsStats.avgPrice ? `${fsStats.avgPrice.toLocaleString("vi-VN")}đ` : "—"} icon="payments" color="violet" loading={fsLoading} />
                        </div>
                        <button onClick={openCreateFacility} disabled={!selectedFacilityId} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                            Gán dịch vụ
                        </button>
                    </div>

                    <FilterBar
                        searchPlaceholder="Tìm theo mã, tên, chuyên khoa..."
                        searchValue={fsSearch}
                        onSearchChange={setFsSearch}
                        filters={[
                            {
                                key: "facility", label: "Cơ sở", value: selectedFacilityId, onChange: setSelectedFacilityId,
                                options: facilities.map((f) => ({ value: f.id, label: f.name })),
                            },
                            {
                                key: "status", label: "Trạng thái", value: fsStatusFilter, onChange: setFsStatusFilter,
                                options: [
                                    { value: "all", label: "Mọi trạng thái" },
                                    { value: "ACTIVE", label: "Đang bán" },
                                    { value: "INACTIVE", label: "Tạm dừng" },
                                ],
                            },
                        ]}
                        onReset={() => { setFsSearch(""); setFsStatusFilter("all"); }}
                    />

                    {fsError && (
                        <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                            <p className="text-sm text-amber-800 dark:text-amber-200">{fsError}</p>
                        </div>
                    )}

                    {fsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                        </div>
                    ) : !selectedFacilityId ? (
                        <EmptyState icon="domain" title="Chưa chọn cơ sở" description="Chọn cơ sở để xem dịch vụ được triển khai." variant="info" />
                    ) : fsFiltered.length === 0 ? (
                        <EmptyState
                            icon="medical_information"
                            title="Cơ sở chưa có dịch vụ"
                            description={facilityServices.length === 0 ? "Gán dịch vụ từ danh mục gốc để bắt đầu." : "Không có dịch vụ phù hợp bộ lọc."}
                            action={facilityServices.length === 0 ? (
                                <button onClick={openCreateFacility} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">+ Gán dịch vụ</button>
                            ) : undefined}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {fsFiltered.map((s) => (
                                <div key={s.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all overflow-hidden">
                                    <div className={`h-1.5 ${s.status === "ACTIVE" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-gray-400 to-gray-500"}`} />
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-bold text-[#121417] dark:text-white truncate" title={s.serviceName}>{s.serviceName}</h3>
                                                <p className="text-xs text-[#687582] dark:text-gray-400 font-mono">{s.serviceCode}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                                s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                            }`}>{s.status === "ACTIVE" ? "Đang bán" : "Tạm dừng"}</span>
                                        </div>
                                        {s.specialtyName && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">{s.specialtyName}</span>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-[#687582] dark:text-gray-400 mt-2 mb-3">
                                            {s.price != null && (
                                                <span className="flex items-center gap-1 text-[#3C81C6] font-semibold">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>payments</span>
                                                    {s.price.toLocaleString("vi-VN")}đ
                                                </span>
                                            )}
                                            {s.duration != null && (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>timer</span>
                                                    {s.duration}p
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 pt-3 border-t border-gray-50 dark:border-gray-800">
                                            <button onClick={() => openEditFacility(s)} className="flex-1 px-3 py-1.5 text-xs font-medium text-[#3C81C6] bg-[#3C81C6]/[0.08] hover:bg-[#3C81C6]/[0.16] rounded-lg inline-flex items-center justify-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                                Sửa
                                            </button>
                                            <button onClick={() => handleToggleFacilityStatus(s)} className={`px-2 py-1 text-xs rounded-lg ${
                                                s.status === "ACTIVE" ? "text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300"
                                            }`} title={s.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{s.status === "ACTIVE" ? "pause" : "play_arrow"}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {showMasterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowMasterModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{masterForm.id ? "edit" : "add"}</span>
                            {masterForm.id ? "Sửa dịch vụ" : "Tạo dịch vụ mới"}
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mã *</label>
                                    <input value={masterForm.code} onChange={(e) => setMasterForm({ ...masterForm, code: e.target.value })} placeholder="VD: XN-CBC" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên dịch vụ *</label>
                                    <input value={masterForm.name} onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })} placeholder="VD: Công thức máu" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Nhóm</label>
                                    <input value={masterForm.group} onChange={(e) => setMasterForm({ ...masterForm, group: e.target.value })} placeholder="Xét nghiệm, CĐHA..." className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Loại</label>
                                    <input value={masterForm.category} onChange={(e) => setMasterForm({ ...masterForm, category: e.target.value })} placeholder="Huyết học, Sinh hóa..." className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Giá (VND)</label>
                                    <input type="number" value={masterForm.price} onChange={(e) => setMasterForm({ ...masterForm, price: e.target.value })} placeholder="150000" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Thời lượng (phút)</label>
                                    <input type="number" value={masterForm.duration} onChange={(e) => setMasterForm({ ...masterForm, duration: e.target.value })} placeholder="30" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mô tả</label>
                                <textarea rows={2} value={masterForm.description} onChange={(e) => setMasterForm({ ...masterForm, description: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowMasterModal(false)} disabled={savingMaster} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSaveMaster} disabled={savingMaster} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1">
                                {savingMaster ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang lưu...</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>Lưu</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showFacilityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowFacilityModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{facilityForm.id ? "edit" : "add"}</span>
                            {facilityForm.id ? "Sửa dịch vụ tại cơ sở" : "Gán dịch vụ cho cơ sở"}
                        </h3>
                        <div className="space-y-3">
                            {!facilityForm.id && (
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Dịch vụ từ danh mục *</label>
                                    <select value={facilityForm.serviceId} onChange={(e) => {
                                        const picked = master.find((m) => m.id === e.target.value);
                                        setFacilityForm({
                                            ...facilityForm,
                                            serviceId: e.target.value,
                                            price: picked?.price != null ? String(picked.price) : facilityForm.price,
                                            duration: picked?.duration != null ? String(picked.duration) : facilityForm.duration,
                                        });
                                    }} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                        <option value="">— Chọn dịch vụ —</option>
                                        {master.filter((s) => s.status === "ACTIVE" && !facilityServices.some((fs) => fs.serviceId === s.id)).map((s) => (
                                            <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Giá tại cơ sở (VND)</label>
                                    <input type="number" value={facilityForm.price} onChange={(e) => setFacilityForm({ ...facilityForm, price: e.target.value })} placeholder="0" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Thời lượng (phút)</label>
                                    <input type="number" value={facilityForm.duration} onChange={(e) => setFacilityForm({ ...facilityForm, duration: e.target.value })} placeholder="30" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowFacilityModal(false)} disabled={savingFacility} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSaveFacility} disabled={savingFacility} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1">
                                {savingFacility ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang lưu...</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>Lưu</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
