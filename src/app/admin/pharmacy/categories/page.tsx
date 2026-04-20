"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { PHARMACY_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface DrugCategory {
    id: string;
    code: string;
    name: string;
    description?: string;
    drugCount?: number;
    isActive: boolean;
}

interface FormState {
    id?: string;
    code: string;
    name: string;
    description: string;
}

const EMPTY_FORM: FormState = { code: "", name: "", description: "" };

function mapCategory(r: any): DrugCategory {
    return {
        id: String(r.category_id ?? r.id ?? ""),
        code: r.code ?? r.category_code ?? "",
        name: r.name ?? r.category_name ?? "",
        description: r.description ?? "",
        drugCount: Number(r.drug_count ?? r.drugCount ?? 0),
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
    };
}

export default function PharmacyCategoriesPage() {
    const toast = useToast();
    const [items, setItems] = useState<DrugCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(PHARMACY_ENDPOINTS.CATEGORIES_LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapCategory));
        } catch {
            setError("Không tải được danh mục thuốc.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((c) => `${c.code} ${c.name} ${c.description ?? ""}`.toLowerCase().includes(q));
    }, [items, search]);

    const stats = useMemo(() => ({
        total: items.length,
        active: items.filter((c) => c.isActive).length,
        drugs: items.reduce((s, c) => s + (c.drugCount ?? 0), 0),
        avg: items.length ? Math.round(items.reduce((s, c) => s + (c.drugCount ?? 0), 0) / items.length) : 0,
    }), [items]);

    const openCreate = () => { setForm(EMPTY_FORM); setShowModal(true); };
    const openEdit = (c: DrugCategory) => {
        setForm({ id: c.id, code: c.code, name: c.name, description: c.description ?? "" });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) { toast.warning("Nhập mã và tên nhóm thuốc."); return; }
        setSaving(true);
        try {
            const payload = {
                code: form.code.trim(),
                name: form.name.trim(),
                description: form.description.trim() || undefined,
            };
            if (form.id) {
                await axiosClient.put(PHARMACY_ENDPOINTS.CATEGORIES_UPDATE(form.id), payload);
                toast.success("Đã cập nhật.");
            } else {
                await axiosClient.post(PHARMACY_ENDPOINTS.CATEGORIES_CREATE, payload);
                toast.success("Đã tạo.");
            }
            setShowModal(false);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally { setSaving(false); }
    };

    const handleToggle = async (c: DrugCategory) => {
        try {
            await axiosClient.patch(PHARMACY_ENDPOINTS.CATEGORIES_STATUS(c.id));
            toast.success(c.isActive ? "Đã vô hiệu hoá." : "Đã kích hoạt."); await load();
        } catch { toast.error("Không đổi được trạng thái."); }
    };

    const handleDelete = async (c: DrugCategory) => {
        if (!confirm(`Xoá nhóm "${c.name}"?`)) return;
        try {
            await axiosClient.delete(PHARMACY_ENDPOINTS.CATEGORIES_DELETE(c.id));
            toast.success("Đã xoá."); await load();
        } catch { toast.error("Không xoá được (có thể còn thuốc liên kết)."); }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Nhóm thuốc (Categories)"
                subtitle="Phân loại thuốc theo nhóm (kháng sinh, giảm đau, tim mạch, ...)"
                icon="category"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Dược & kho" }, { label: "Nhóm thuốc" }]}
                actions={
                    <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        Thêm nhóm
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng nhóm" value={stats.total} icon="category" color="blue" loading={loading} />
                <StatCard label="Đang dùng" value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Tổng thuốc" value={stats.drugs} icon="medication" color="violet" loading={loading} />
                <StatCard label="TB thuốc/nhóm" value={stats.avg} icon="bar_chart" color="amber" loading={loading} />
            </div>

            <FilterBar searchPlaceholder="Tìm mã hoặc tên nhóm..." searchValue={search} onSearchChange={setSearch} onReset={() => setSearch("")} />

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="category" title={items.length === 0 ? "Chưa có nhóm thuốc" : "Không khớp tìm kiếm"} description={items.length === 0 ? "Thêm nhóm thuốc đầu tiên." : ""} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((c, idx) => (
                        <div key={c.id || c.code || `cat-${idx}`} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                            <div className={`h-1.5 bg-gradient-to-r ${c.isActive ? "from-[#3C81C6] to-[#1d4ed8]" : "from-gray-300 to-gray-400"}`} />
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white">
                                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>category</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#121417] dark:text-white">{c.name}</div>
                                            <div className="text-xs font-mono text-[#687582]">{c.code}</div>
                                        </div>
                                    </div>
                                    <div className="font-mono text-sm font-bold text-[#3C81C6]">{c.drugCount ?? 0}</div>
                                </div>
                                {c.description && <p className="text-xs text-[#687582] dark:text-gray-400 mb-3 line-clamp-2">{c.description}</p>}
                                <div className="flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <button onClick={() => handleToggle(c)} className="flex-1 px-2 py-1 text-xs text-[#3C81C6] hover:bg-[#3C81C6]/10 rounded-md">
                                        {c.isActive ? "Ngưng" : "Kích hoạt"}
                                    </button>
                                    <button onClick={() => openEdit(c)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title="Sửa">
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(c)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Xoá">
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{form.id ? "edit" : "add"}</span>
                            {form.id ? "Sửa nhóm thuốc" : "Thêm nhóm thuốc"}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mã *</label>
                                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    placeholder="VD: ANTIBIOTIC"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-mono dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên nhóm *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="VD: Kháng sinh"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mô tả</label>
                                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">Huỷ</button>
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
