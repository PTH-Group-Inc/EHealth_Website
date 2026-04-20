"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { workShiftService, type WorkShift } from "@/services/workShiftService";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState } from "@/components/shared/layout";

const SHIFT_TYPES = [
    { value: "all", label: "Mọi ca" },
    { value: "MORNING", label: "Sáng", color: "amber", icon: "wb_sunny" },
    { value: "AFTERNOON", label: "Chiều", color: "blue", icon: "wb_twilight" },
    { value: "NIGHT", label: "Tối", color: "violet", icon: "bedtime" },
    { value: "FULL_DAY", label: "Cả ngày", color: "emerald", icon: "today" },
];

const TYPE_META: Record<string, { label: string; icon: string; bg: string }> = {
    MORNING: { label: "Sáng", icon: "wb_sunny", bg: "from-amber-500 to-orange-500" },
    AFTERNOON: { label: "Chiều", icon: "wb_twilight", bg: "from-blue-500 to-cyan-500" },
    NIGHT: { label: "Tối", icon: "bedtime", bg: "from-violet-500 to-purple-600" },
    FULL_DAY: { label: "Cả ngày", icon: "today", bg: "from-emerald-500 to-teal-600" },
};

interface FormState {
    id?: string;
    name: string;
    startTime: string;
    endTime: string;
    type: string;
    description: string;
    isActive: boolean;
}

const EMPTY_FORM: FormState = { name: "", startTime: "07:00", endTime: "11:00", type: "MORNING", description: "", isActive: true };

function mapShift(s: any): WorkShift {
    const status = String(s.status ?? "").toUpperCase();
    return {
        id: String(s.id ?? s.shifts_id ?? s.shift_id ?? s.code ?? ""),
        name: s.name ?? "",
        startTime: (s.startTime ?? s.start_time ?? "").slice(0, 5),
        endTime: (s.endTime ?? s.end_time ?? "").slice(0, 5),
        type: (s.type ?? s.code ?? "MORNING") as WorkShift["type"],
        description: s.description ?? "",
        isActive: typeof s.isActive === "boolean" ? s.isActive : status !== "INACTIVE" && status !== "DISABLED",
        createdAt: s.createdAt ?? s.created_at ?? "",
        updatedAt: s.updatedAt ?? s.updated_at ?? "",
    };
}

export default function ShiftsAdminPage() {
    const toast = useToast();
    const [shifts, setShifts] = useState<WorkShift[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await workShiftService.getList();
            const raw: any[] = Array.isArray(res?.data) ? res.data : [];
            setShifts(raw.map(mapShift));
        } catch {
            setError("Không tải được danh sách ca làm việc.");
            setShifts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return shifts.filter((s) => {
            if (typeFilter !== "all" && s.type !== typeFilter) return false;
            if (q && !`${s.name} ${s.description ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [shifts, search, typeFilter]);

    const handleOpenCreate = () => { setForm(EMPTY_FORM); setShowModal(true); };
    const handleOpenEdit = (s: WorkShift) => {
        setForm({
            id: s.id,
            name: s.name,
            startTime: s.startTime,
            endTime: s.endTime,
            type: s.type ?? "MORNING",
            description: s.description ?? "",
            isActive: s.isActive ?? true,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.startTime || !form.endTime) {
            toast.warning("Vui lòng nhập đầy đủ tên ca và giờ.");
            return;
        }
        setSaving(true);
        try {
            if (form.id) {
                await workShiftService.update(form.id, form);
                toast.success("Đã cập nhật ca.");
            } else {
                await workShiftService.create(form);
                toast.success("Đã tạo ca mới.");
            }
            setShowModal(false);
            await load();
        } catch {
            toast.error("Không lưu được ca làm việc.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn chắc chắn xoá ca này?")) return;
        try {
            await workShiftService.delete(id);
            toast.success("Đã xoá ca.");
            await load();
        } catch {
            toast.error("Không xoá được ca.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Ca làm việc"
                subtitle="Định nghĩa các ca chuẩn của hệ thống (sáng / chiều / tối / cả ngày)"
                icon="schedule"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Ca làm việc" }]}
                actions={
                    <button
                        onClick={handleOpenCreate}
                        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        Tạo ca mới
                    </button>
                }
            />

            <FilterBar
                searchPlaceholder="Tìm theo tên ca, mô tả..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: "type",
                        label: "Loại ca",
                        value: typeFilter,
                        onChange: setTypeFilter,
                        options: SHIFT_TYPES.map((t) => ({ value: t.value, label: t.label })),
                    },
                ]}
                onReset={() => { setSearch(""); setTypeFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="schedule"
                    title="Chưa có ca làm việc"
                    description={shifts.length === 0 ? "Tạo ca đầu tiên để bắt đầu phân lịch nhân sự." : "Không có ca nào phù hợp bộ lọc."}
                    action={
                        shifts.length === 0 ? (
                            <button onClick={handleOpenCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">
                                + Tạo ca mới
                            </button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((s) => {
                        const meta = TYPE_META[s.type ?? ""] ?? { label: s.type, icon: "schedule", bg: "from-gray-500 to-gray-600" };
                        return (
                            <div key={s.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all overflow-hidden group">
                                <div className={`h-2 bg-gradient-to-r ${meta.bg}`} />
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.bg} flex items-center justify-center text-white flex-shrink-0`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{meta.icon}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-[#121417] dark:text-white truncate">{s.name}</h3>
                                                <p className="text-xs text-[#687582] dark:text-gray-400">{meta.label}</p>
                                            </div>
                                        </div>
                                        {s.isActive === false && (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                                Tạm dừng
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-mono text-[#3C81C6] mb-2">
                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>schedule</span>
                                        {s.startTime} – {s.endTime}
                                    </div>
                                    {s.description && (
                                        <p className="text-xs text-[#687582] dark:text-gray-400 line-clamp-2 mb-3">{s.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50 dark:border-gray-800">
                                        <button onClick={() => handleOpenEdit(s)} className="flex-1 px-3 py-1.5 text-xs font-medium text-[#3C81C6] bg-[#3C81C6]/[0.08] hover:bg-[#3C81C6]/[0.16] rounded-lg transition-colors inline-flex items-center justify-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                            Sửa
                                        </button>
                                        <button onClick={() => handleDelete(s.id)} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
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
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{form.id ? "edit" : "add"}</span>
                            {form.id ? "Sửa ca làm việc" : "Tạo ca làm việc mới"}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên ca *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Ca sáng 7h-11h"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bắt đầu *</label>
                                    <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Kết thúc *</label>
                                    <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Loại ca</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                    {SHIFT_TYPES.filter((t) => t.value !== "all").map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded text-[#3C81C6]" />
                                <span className="text-sm text-[#121417] dark:text-white">Đang hoạt động</span>
                            </label>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving}
                                className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50">
                                Huỷ
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>
                                        Lưu
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
