"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import {
    MEDICAL_ROOM_MANAGEMENT_ENDPOINTS,
    DEPARTMENT_MANAGEMENT_ENDPOINTS,
    BRANCH_MANAGEMENT_ENDPOINTS,
    MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS,
} from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

type RoomStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

interface Room {
    id: string;
    code: string;
    name: string;
    floor?: string;
    departmentId?: string;
    departmentName?: string;
    branchId?: string;
    branchName?: string;
    status: RoomStatus;
    capacity?: number;
    note?: string;
}

interface Department { id: string; name: string; }
interface Branch { id: string; name: string; }
interface MedicalServiceLite { id: string; code?: string; name: string; }

interface FormState {
    id?: string;
    code: string;
    name: string;
    floor: string;
    capacity: string;
    departmentId: string;
    branchId: string;
    note: string;
}

const EMPTY_FORM: FormState = { code: "", name: "", floor: "", capacity: "", departmentId: "", branchId: "", note: "" };

const STATUS_META: Record<RoomStatus, { label: string; bg: string; color: string }> = {
    ACTIVE: { label: "Hoạt động", bg: "from-emerald-500 to-teal-500", color: "emerald" },
    INACTIVE: { label: "Tạm dừng", bg: "from-gray-400 to-gray-500", color: "gray" },
    MAINTENANCE: { label: "Bảo trì", bg: "from-amber-500 to-orange-500", color: "amber" },
};

function normalizeStatus(s: any): RoomStatus {
    const v = String(s ?? "").toUpperCase();
    if (v === "MAINTENANCE") return "MAINTENANCE";
    if (v === "INACTIVE" || v === "DISABLED") return "INACTIVE";
    return "ACTIVE";
}

function mapRoom(r: any): Room {
    return {
        id: String(r.medical_rooms_id ?? r.medical_room_id ?? r.rooms_id ?? r.id ?? ""),
        code: r.code ?? r.room_code ?? "",
        name: r.name ?? r.room_name ?? "",
        floor: r.floor ?? r.level ?? "",
        departmentId: r.department_id ?? r.departments_id ?? "",
        departmentName: r.department_name ?? "",
        branchId: r.branch_id ?? r.branches_id ?? "",
        branchName: r.branch_name ?? "",
        status: normalizeStatus(r.status),
        capacity: typeof r.capacity === "number" ? r.capacity : undefined,
        note: r.note ?? r.description ?? "",
    };
}

function mapService(s: any): MedicalServiceLite {
    return {
        id: String(s.services_id ?? s.service_id ?? s.id ?? ""),
        code: s.code ?? s.service_code ?? "",
        name: s.name ?? s.service_name ?? "",
    };
}

export default function ClinicRoomsAdminPage() {
    const toast = useToast();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const [assignFor, setAssignFor] = useState<Room | null>(null);
    const [assignedServices, setAssignedServices] = useState<MedicalServiceLite[]>([]);
    const [masterServices, setMasterServices] = useState<MedicalServiceLite[]>([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignSearch, setAssignSearch] = useState("");
    const [pendingServiceId, setPendingServiceId] = useState("");

    const loadDepts = useCallback(async () => {
        try {
            const res = await axiosClient.get(DEPARTMENT_MANAGEMENT_ENDPOINTS.LIST, { params: { limit: 500 } });
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            setDepartments(raw.map((d) => ({ id: String(d.departments_id ?? d.department_id ?? d.id ?? ""), name: d.name ?? "" })).filter((d) => d.id));
        } catch {
            setDepartments([]);
        }
    }, []);

    const loadBranches = useCallback(async () => {
        try {
            const res = await axiosClient.get(BRANCH_MANAGEMENT_ENDPOINTS.DROPDOWN);
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            setBranches(raw.map((b) => ({ id: String(b.branches_id ?? b.branch_id ?? b.id ?? ""), name: b.name ?? "" })).filter((b) => b.id));
        } catch {
            setBranches([]);
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(MEDICAL_ROOM_MANAGEMENT_ENDPOINTS.LIST);
            const { data } = unwrapList<any>(res);
            setRooms(data.map(mapRoom));
        } catch {
            setError("Không tải được danh sách phòng khám.");
            setRooms([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDepts();
        loadBranches();
        load();
    }, [loadDepts, loadBranches, load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rooms.filter((r) => {
            if (deptFilter !== "all" && r.departmentId !== deptFilter) return false;
            if (statusFilter !== "all" && r.status !== statusFilter) return false;
            if (q && !`${r.code} ${r.name} ${r.floor ?? ""} ${r.departmentName ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [rooms, search, deptFilter, statusFilter]);

    const stats = useMemo(() => ({
        total: rooms.length,
        active: rooms.filter((r) => r.status === "ACTIVE").length,
        maintenance: rooms.filter((r) => r.status === "MAINTENANCE").length,
        departments: new Set(rooms.map((r) => r.departmentId).filter(Boolean)).size,
    }), [rooms]);

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, departmentId: departments[0]?.id ?? "", branchId: branches[0]?.id ?? "" });
        setShowModal(true);
    };

    const openEdit = (r: Room) => {
        setForm({
            id: r.id,
            code: r.code,
            name: r.name,
            floor: r.floor ?? "",
            capacity: r.capacity != null ? String(r.capacity) : "",
            departmentId: r.departmentId ?? "",
            branchId: r.branchId ?? "",
            note: r.note ?? "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) {
            toast.warning("Vui lòng nhập mã và tên phòng.");
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                code: form.code.trim(),
                name: form.name.trim(),
                floor: form.floor.trim() || undefined,
                capacity: form.capacity ? Number(form.capacity) : undefined,
                note: form.note.trim() || undefined,
            };
            if (form.departmentId) payload.department_id = form.departmentId;
            if (form.branchId) payload.branch_id = form.branchId;

            if (form.id) {
                await axiosClient.put(MEDICAL_ROOM_MANAGEMENT_ENDPOINTS.UPDATE(form.id), payload);
                toast.success("Đã cập nhật phòng khám.");
            } else {
                await axiosClient.post(MEDICAL_ROOM_MANAGEMENT_ENDPOINTS.CREATE, payload);
                toast.success("Đã tạo phòng khám.");
            }
            setShowModal(false);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không lưu được phòng khám.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (r: Room) => {
        const next: RoomStatus = r.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        try {
            await axiosClient.patch(MEDICAL_ROOM_MANAGEMENT_ENDPOINTS.STATUS(r.id), { status: next });
            toast.success(`Đã đổi trạng thái: ${STATUS_META[next].label}`);
            await load();
        } catch {
            toast.error("Không đổi được trạng thái.");
        }
    };

    const handleDelete = async (r: Room) => {
        if (!confirm(`Bạn chắc chắn xoá phòng "${r.name}"?`)) return;
        try {
            await axiosClient.delete(MEDICAL_ROOM_MANAGEMENT_ENDPOINTS.DELETE(r.id));
            toast.success("Đã xoá phòng.");
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không xoá được phòng.");
        }
    };

    const openAssign = async (r: Room) => {
        setAssignFor(r);
        setAssignSearch("");
        setPendingServiceId("");
        setAssignLoading(true);
        try {
            const [currentRes, masterRes] = await Promise.all([
                axiosClient.get(MEDICAL_ROOM_MANAGEMENT_ENDPOINTS.SERVICES(r.id)),
                axiosClient.get(MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS.MASTER_LIST, { params: { limit: 500 } }),
            ]);
            const current: any[] = Array.isArray(currentRes.data?.data) ? currentRes.data.data : Array.isArray(currentRes.data) ? currentRes.data : [];
            const master: any[] = Array.isArray(masterRes.data?.data) ? masterRes.data.data : [];
            setAssignedServices(current.map(mapService).filter((s) => s.id));
            setMasterServices(master.map(mapService).filter((s) => s.id));
        } catch {
            setAssignedServices([]);
            setMasterServices([]);
            toast.error("Không tải được dịch vụ.");
        } finally {
            setAssignLoading(false);
        }
    };

    const availableServices = useMemo(() => {
        const assignedIds = new Set(assignedServices.map((s) => s.id));
        const q = assignSearch.trim().toLowerCase();
        return masterServices.filter((s) => !assignedIds.has(s.id) && (!q || `${s.code ?? ""} ${s.name}`.toLowerCase().includes(q)));
    }, [masterServices, assignedServices, assignSearch]);

    const handleAddService = async () => {
        if (!assignFor || !pendingServiceId) return;
        try {
            await axiosClient.post(MEDICAL_ROOM_MANAGEMENT_ENDPOINTS.ASSIGN_SERVICES(assignFor.id), { service_id: pendingServiceId });
            toast.success("Đã gán dịch vụ vào phòng.");
            const added = masterServices.find((s) => s.id === pendingServiceId);
            if (added) setAssignedServices((prev) => [...prev, added]);
            setPendingServiceId("");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không gán được dịch vụ.");
        }
    };

    const handleRemoveService = async (serviceId: string) => {
        if (!assignFor) return;
        try {
            await axiosClient.delete(MEDICAL_ROOM_MANAGEMENT_ENDPOINTS.REMOVE_SERVICE(assignFor.id, serviceId));
            setAssignedServices((prev) => prev.filter((s) => s.id !== serviceId));
            toast.success("Đã bỏ gán dịch vụ.");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không bỏ gán được dịch vụ.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Phòng khám"
                subtitle="Quản lý phòng chức năng và gán dịch vụ thực hiện trong từng phòng"
                icon="meeting_room"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Phòng khám" }]}
                actions={
                    <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        Tạo phòng
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng phòng" value={stats.total} icon="meeting_room" color="blue" loading={loading} />
                <StatCard label="Hoạt động" value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Bảo trì" value={stats.maintenance} icon="build" color="amber" loading={loading} />
                <StatCard label="Khoa phòng" value={stats.departments} icon="domain" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo mã, tên, tầng, khoa..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: "dept", label: "Khoa", value: deptFilter, onChange: setDeptFilter,
                        options: [{ value: "all", label: "Mọi khoa" }, ...departments.map((d) => ({ value: d.id, label: d.name }))],
                    },
                    {
                        key: "status", label: "Trạng thái", value: statusFilter, onChange: setStatusFilter,
                        options: [{ value: "all", label: "Mọi trạng thái" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))],
                    },
                ]}
                onReset={() => { setSearch(""); setDeptFilter("all"); setStatusFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-44 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="meeting_room"
                    title="Chưa có phòng khám"
                    description={rooms.length === 0 ? "Tạo phòng đầu tiên để bắt đầu gán dịch vụ." : "Không có phòng phù hợp bộ lọc."}
                    action={rooms.length === 0 ? (
                        <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">
                            + Tạo phòng
                        </button>
                    ) : undefined}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((r) => {
                        const meta = STATUS_META[r.status];
                        return (
                            <div key={r.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all overflow-hidden">
                                <div className={`h-1.5 bg-gradient-to-r ${meta.bg}`} />
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.bg} flex items-center justify-center text-white flex-shrink-0`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>meeting_room</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-[#121417] dark:text-white truncate" title={r.name}>{r.name}</h3>
                                                <p className="text-xs text-[#687582] dark:text-gray-400 font-mono">{r.code}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                                            meta.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                            meta.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                        }`}>{meta.label}</span>
                                    </div>

                                    <div className="space-y-1 text-xs text-[#687582] dark:text-gray-400 mb-3">
                                        {r.departmentName && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "14px" }}>domain</span>
                                                <span className="truncate">{r.departmentName}</span>
                                            </div>
                                        )}
                                        {(r.floor || r.capacity != null) && (
                                            <div className="flex items-center gap-3">
                                                {r.floor && (
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>stacks</span>Tầng {r.floor}</span>
                                                )}
                                                {r.capacity != null && (
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>groups</span>{r.capacity} chỗ</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 pt-3 border-t border-gray-50 dark:border-gray-800">
                                        <button onClick={() => openAssign(r)} className="flex-1 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-300 rounded-lg transition-colors inline-flex items-center justify-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>assignment</span>
                                            Dịch vụ
                                        </button>
                                        <button onClick={() => handleToggleStatus(r)} className={`px-2 py-1 text-xs rounded-lg ${
                                            r.status === "ACTIVE" ? "text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300"
                                        }`} title={r.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{r.status === "ACTIVE" ? "pause" : "play_arrow"}</span>
                                        </button>
                                        <button onClick={() => openEdit(r)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-lg" title="Sửa">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(r)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Xoá">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{form.id ? "edit" : "add"}</span>
                            {form.id ? "Sửa phòng khám" : "Tạo phòng khám mới"}
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mã *</label>
                                    <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="VD: ROOM-101" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên *</label>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Phòng khám 101" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Khoa</label>
                                    <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                        <option value="">— Chọn khoa —</option>
                                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chi nhánh</label>
                                    <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                        <option value="">— Chọn chi nhánh —</option>
                                        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tầng</label>
                                    <input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="VD: 1" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Sức chứa</label>
                                    <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="0" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                                <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang lưu...</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>Lưu</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {assignFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setAssignFor(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-5 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-violet-600">assignment</span>
                                    Dịch vụ tại {assignFor.name}
                                </h3>
                                <p className="text-xs text-[#687582] dark:text-gray-500 mt-0.5">Chọn dịch vụ master để gán, hoặc bỏ gán dịch vụ đã có.</p>
                            </div>
                            <button onClick={() => setAssignFor(null)} className="text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-1.5">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-[#121417] dark:text-white uppercase mb-2">Đã gán ({assignedServices.length})</h4>
                                {assignLoading ? (
                                    <div className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                                ) : assignedServices.length === 0 ? (
                                    <p className="text-xs text-[#687582] dark:text-gray-500 py-3">Chưa gán dịch vụ nào.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {assignedServices.map((s) => (
                                            <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium">
                                                {s.name}
                                                <button onClick={() => handleRemoveService(s.id)} className="hover:bg-emerald-100 dark:hover:bg-emerald-800/50 rounded">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-[#121417] dark:text-white uppercase mb-2">Thêm dịch vụ</h4>
                                <input
                                    value={assignSearch}
                                    onChange={(e) => setAssignSearch(e.target.value)}
                                    placeholder="Tìm dịch vụ master..."
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white mb-2"
                                />
                                <div className="max-h-52 overflow-y-auto border border-[#dde0e4] dark:border-[#2d353e] rounded-xl">
                                    {availableServices.length === 0 ? (
                                        <p className="text-xs text-[#687582] dark:text-gray-500 p-4 text-center">Không còn dịch vụ chưa gán.</p>
                                    ) : (
                                        availableServices.slice(0, 50).map((s) => (
                                            <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-b-0">
                                                <input type="radio" name="service" value={s.id} checked={pendingServiceId === s.id} onChange={() => setPendingServiceId(s.id)} />
                                                <span className="font-mono text-[10px] text-[#687582]">{s.code}</span>
                                                <span className="flex-1 truncate text-[#121417] dark:text-white">{s.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-end gap-2">
                            <button onClick={() => setAssignFor(null)} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">Đóng</button>
                            <button onClick={handleAddService} disabled={!pendingServiceId} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                                Gán dịch vụ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
