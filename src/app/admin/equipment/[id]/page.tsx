"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { MEDICAL_EQUIPMENT_ENDPOINTS, MEDICAL_ROOM_MANAGEMENT_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import { VerticalTimeline, type TimelineItemData, type TimelineVariant } from "@/components/shared/timeline";

interface EquipmentDetail {
    id: string;
    code: string;
    name: string;
    type?: string;
    model?: string;
    manufacturer?: string;
    roomId?: string;
    roomName?: string;
    status: string;
    purchaseDate?: string;
    warrantyUntil?: string;
    note?: string;
    createdAt?: string;
}

interface MaintenanceLog {
    id: string;
    type: "REPAIR" | "INSPECTION" | "CLEANING" | "CALIBRATION" | string;
    status: "PLANNED" | "IN_PROGRESS" | "DONE" | "CANCELLED" | string;
    title: string;
    description?: string;
    performedAt?: string;
    plannedAt?: string;
    performedBy?: string;
    cost?: number;
}

interface RoomLite { id: string; name: string; }

const STATUS_LABEL: Record<string, string> = {
    ACTIVE: "Hoạt động", INACTIVE: "Ngừng dùng", MAINTENANCE: "Bảo trì", BROKEN: "Hỏng",
};

const MAINT_TYPE_META: Record<string, { label: string; icon: string; variant: TimelineVariant }> = {
    REPAIR: { label: "Sửa chữa", icon: "build", variant: "warning" },
    INSPECTION: { label: "Kiểm tra", icon: "search", variant: "info" },
    CLEANING: { label: "Vệ sinh", icon: "cleaning_services", variant: "default" },
    CALIBRATION: { label: "Hiệu chuẩn", icon: "tune", variant: "info" },
};

const MAINT_STATUS_LABEL: Record<string, string> = {
    PLANNED: "Dự kiến", IN_PROGRESS: "Đang xử lý", DONE: "Hoàn tất", CANCELLED: "Huỷ",
};

function mapDetail(e: any): EquipmentDetail {
    return {
        id: String(e.equipments_id ?? e.equipment_id ?? e.id ?? ""),
        code: e.code ?? "",
        name: e.name ?? "",
        type: e.type ?? e.equipment_type ?? e.category ?? "",
        model: e.model ?? "",
        manufacturer: e.manufacturer ?? e.brand ?? "",
        roomId: e.room_id ?? e.medical_room_id ?? "",
        roomName: e.room_name ?? e.medical_room_name ?? "",
        status: String(e.status ?? "ACTIVE").toUpperCase(),
        purchaseDate: e.purchase_date ?? e.purchaseDate ?? "",
        warrantyUntil: e.warranty_until ?? e.warrantyUntil ?? "",
        note: e.note ?? e.description ?? "",
        createdAt: e.created_at ?? e.createdAt ?? "",
    };
}

function mapMaintenance(m: any): MaintenanceLog {
    return {
        id: String(m.maintenance_id ?? m.maintenances_id ?? m.id ?? Math.random()),
        type: String(m.type ?? m.maintenance_type ?? "INSPECTION").toUpperCase(),
        status: String(m.status ?? "DONE").toUpperCase(),
        title: m.title ?? m.summary ?? m.name ?? "Bảo trì",
        description: m.description ?? m.note ?? "",
        performedAt: m.performed_at ?? m.performedAt ?? m.completed_at ?? "",
        plannedAt: m.planned_at ?? m.plannedAt ?? m.scheduled_at ?? "",
        performedBy: m.performed_by ?? m.performer_name ?? m.technician ?? "",
        cost: typeof m.cost === "number" ? m.cost : typeof m.amount === "number" ? m.amount : undefined,
    };
}

export default function EquipmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const id = String(params?.id ?? "");

    const [detail, setDetail] = useState<EquipmentDetail | null>(null);
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [rooms, setRooms] = useState<RoomLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(true);
    const [showAssign, setShowAssign] = useState(false);
    const [assignRoomId, setAssignRoomId] = useState("");
    const [showMaintModal, setShowMaintModal] = useState(false);
    const [maintForm, setMaintForm] = useState({ type: "INSPECTION", title: "", description: "", plannedAt: "", performedBy: "", cost: "" });
    const [saving, setSaving] = useState(false);

    const loadDetail = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get(MEDICAL_EQUIPMENT_ENDPOINTS.DETAIL(id));
            const raw = unwrap<any>(res);
            setDetail(mapDetail(raw ?? {}));
        } catch {
            setDetail(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const res = await axiosClient.get(MEDICAL_EQUIPMENT_ENDPOINTS.MAINTENANCE_LOGS(id));
            const { data } = unwrapList<any>(res);
            setLogs(data.map(mapMaintenance));
        } catch {
            setLogs([]);
        } finally {
            setLogsLoading(false);
        }
    }, [id]);

    const loadRooms = useCallback(async () => {
        try {
            const res = await axiosClient.get(MEDICAL_ROOM_MANAGEMENT_ENDPOINTS.DROPDOWN);
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
            setRooms(raw.map((r) => ({
                id: String(r.medical_rooms_id ?? r.id ?? ""),
                name: r.name ?? r.room_name ?? "",
            })).filter((r) => r.id));
        } catch {
            setRooms([]);
        }
    }, []);

    useEffect(() => {
        if (!id) return;
        loadDetail();
        loadLogs();
        loadRooms();
    }, [id, loadDetail, loadLogs, loadRooms]);

    const timelineItems: TimelineItemData[] = useMemo(() => {
        return logs.map((log) => {
            const typeMeta = MAINT_TYPE_META[log.type] ?? { label: log.type, icon: "build", variant: "default" as TimelineVariant };
            const doneVariant: TimelineVariant = log.status === "DONE" ? "success" : log.status === "CANCELLED" ? "error" : typeMeta.variant;
            return {
                id: log.id,
                title: `${typeMeta.label} — ${log.title}`,
                description: log.description || undefined,
                timestamp: log.performedAt || log.plannedAt || undefined,
                variant: doneVariant,
                icon: typeMeta.icon,
                meta: [log.performedBy, MAINT_STATUS_LABEL[log.status] ?? log.status, log.cost ? `${log.cost.toLocaleString("vi-VN")}đ` : null].filter(Boolean).join(" · "),
            };
        });
    }, [logs]);

    const handleAssignRoom = async () => {
        if (!detail) return;
        setSaving(true);
        try {
            await axiosClient.put(MEDICAL_EQUIPMENT_ENDPOINTS.ASSIGN_ROOM(detail.id), { room_id: assignRoomId || null });
            toast.success(assignRoomId ? "Đã gán thiết bị vào phòng." : "Đã bỏ gán phòng.");
            setShowAssign(false);
            await loadDetail();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không gán được phòng.");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateMaintenance = async () => {
        if (!detail) return;
        if (!maintForm.title.trim()) {
            toast.warning("Vui lòng nhập tiêu đề bảo trì.");
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                type: maintForm.type,
                title: maintForm.title.trim(),
                description: maintForm.description.trim() || undefined,
                planned_at: maintForm.plannedAt || undefined,
                performed_by: maintForm.performedBy.trim() || undefined,
                cost: maintForm.cost ? Number(maintForm.cost) : undefined,
            };
            await axiosClient.post(MEDICAL_EQUIPMENT_ENDPOINTS.CREATE_MAINTENANCE(detail.id), payload);
            toast.success("Đã ghi nhận bảo trì.");
            setShowMaintModal(false);
            setMaintForm({ type: "INSPECTION", title: "", description: "", plannedAt: "", performedBy: "", cost: "" });
            await loadLogs();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Không lưu được bảo trì.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                <div className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="p-6">
                <EmptyState
                    icon="error"
                    title="Không tìm thấy thiết bị"
                    description="Thiết bị không tồn tại hoặc đã bị xoá."
                    action={<Link href="/admin/equipment" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">← Quay lại danh sách</Link>}
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={detail.name}
                subtitle={`Mã ${detail.code} · ${STATUS_LABEL[detail.status] ?? detail.status}`}
                icon="medical_services"
                breadcrumbs={[
                    { label: "Quản trị", href: "/admin" },
                    { label: "Thiết bị", href: "/admin/equipment" },
                    { label: detail.name },
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setAssignRoomId(detail.roomId ?? ""); setShowAssign(true); }} className="px-3 py-2 text-xs font-medium text-[#3C81C6] bg-[#3C81C6]/[0.08] hover:bg-[#3C81C6]/[0.16] rounded-xl inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>meeting_room</span>
                            Gán phòng
                        </button>
                        <button onClick={() => setShowMaintModal(true)} className="px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl inline-flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
                            Ghi nhận bảo trì
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">info</span>
                        Thông tin thiết bị
                    </h3>
                    <dl className="space-y-3 text-sm">
                        <InfoRow label="Loại" value={detail.type || "—"} />
                        <InfoRow label="Hãng" value={detail.manufacturer || "—"} />
                        <InfoRow label="Model" value={detail.model || "—"} />
                        <InfoRow label="Phòng hiện tại" value={detail.roomName || "Chưa gán"} highlight={!!detail.roomName} />
                        <InfoRow label="Ngày mua" value={detail.purchaseDate ? new Date(detail.purchaseDate).toLocaleDateString("vi-VN") : "—"} />
                        <InfoRow label="Hết bảo hành" value={detail.warrantyUntil ? new Date(detail.warrantyUntil).toLocaleDateString("vi-VN") : "—"} />
                        <InfoRow label="Trạng thái" value={STATUS_LABEL[detail.status] ?? detail.status} highlight />
                        {detail.note && (
                            <div>
                                <dt className="text-xs text-[#687582] dark:text-gray-500 mb-1">Ghi chú</dt>
                                <dd className="text-sm text-[#121417] dark:text-white whitespace-pre-wrap">{detail.note}</dd>
                            </div>
                        )}
                    </dl>
                    <div className="mt-4 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                        <button onClick={() => router.push("/admin/equipment")} className="w-full px-3 py-2 text-xs text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl inline-flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_back</span>
                            Quay lại danh sách
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">history</span>
                            Lịch sử bảo trì ({logs.length})
                        </span>
                    </h3>
                    {logsLoading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                        </div>
                    ) : logs.length === 0 ? (
                        <EmptyState
                            icon="history"
                            title="Chưa có ghi nhận bảo trì"
                            description="Thiết bị chưa có lịch sử bảo trì nào."
                            variant="info"
                        />
                    ) : (
                        <VerticalTimeline items={timelineItems} />
                    )}
                </div>
            </div>

            {showAssign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssign(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">meeting_room</span>
                            Gán thiết bị vào phòng
                        </h3>
                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chọn phòng</label>
                        <select value={assignRoomId} onChange={(e) => setAssignRoomId(e.target.value)} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                            <option value="">— Không gán —</option>
                            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowAssign(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">Huỷ</button>
                            <button onClick={handleAssignRoom} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl disabled:opacity-50">
                                {saving ? "Đang lưu..." : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMaintModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowMaintModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">build</span>
                            Ghi nhận bảo trì
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Loại bảo trì</label>
                                    <select value={maintForm.type} onChange={(e) => setMaintForm({ ...maintForm, type: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                        {Object.entries(MAINT_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ngày dự kiến</label>
                                    <input type="date" value={maintForm.plannedAt} onChange={(e) => setMaintForm({ ...maintForm, plannedAt: e.target.value })} className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tiêu đề *</label>
                                <input value={maintForm.title} onChange={(e) => setMaintForm({ ...maintForm, title: e.target.value })} placeholder="VD: Hiệu chuẩn định kỳ Q2" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mô tả</label>
                                <textarea rows={3} value={maintForm.description} onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} placeholder="Chi tiết công việc, linh kiện thay..." className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Người thực hiện</label>
                                    <input value={maintForm.performedBy} onChange={(e) => setMaintForm({ ...maintForm, performedBy: e.target.value })} placeholder="Tên kỹ thuật viên / đơn vị" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chi phí (VND)</label>
                                    <input type="number" value={maintForm.cost} onChange={(e) => setMaintForm({ ...maintForm, cost: e.target.value })} placeholder="0" className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowMaintModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">Huỷ</button>
                            <button onClick={handleCreateMaintenance} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? "Đang lưu..." : <><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>Lưu</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <dt className="text-xs text-[#687582] dark:text-gray-500 whitespace-nowrap">{label}</dt>
            <dd className={`text-xs text-right ${highlight ? "font-semibold text-[#3C81C6]" : "text-[#121417] dark:text-white"}`}>{value}</dd>
        </div>
    );
}
