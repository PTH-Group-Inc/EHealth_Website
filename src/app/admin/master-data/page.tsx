"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { MASTER_DATA_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface Category {
    id: string;
    code: string;
    name: string;
    description?: string;
    itemCount?: number;
}

interface Item {
    id: string;
    code: string;
    label: string;
    categoryCode: string;
    categoryName?: string;
    order?: number;
    isActive: boolean;
}

function mapCategory(r: any): Category {
    return {
        id: String(r.category_id ?? r.id ?? ""),
        code: r.code ?? r.category_code ?? "",
        name: r.name ?? r.category_name ?? "",
        description: r.description ?? "",
        itemCount: Number(r.item_count ?? r.itemCount ?? 0),
    };
}

function mapItem(r: any): Item {
    return {
        id: String(r.item_id ?? r.id ?? ""),
        code: r.code ?? r.item_code ?? "",
        label: r.label ?? r.name ?? "",
        categoryCode: r.category_code ?? r.categoryCode ?? "",
        categoryName: r.category_name ?? r.categoryName ?? "",
        order: Number(r.sort_order ?? r.order ?? 0),
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
    };
}

export default function MasterDataPage() {
    const toast = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCat, setSelectedCat] = useState<string>("");
    const [items, setItems] = useState<Item[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCategories = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(MASTER_DATA_ENDPOINTS.CATEGORIES_LIST, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            const cats = data.map(mapCategory);
            setCategories(cats);
            if (cats.length > 0 && !selectedCat) setSelectedCat(cats[0].code);
        } catch {
            setError("Không tải được danh mục.");
            setCategories([]);
        } finally { setLoading(false); }
    }, [selectedCat]);

    const loadItems = useCallback(async () => {
        if (!selectedCat) return;
        try {
            const res = await axiosClient.get(MASTER_DATA_ENDPOINTS.ITEMS_LIST(selectedCat), { params: { limit: 500 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapItem));
        } catch {
            setItems([]);
        }
    }, [selectedCat]);

    useEffect(() => { loadCategories(); }, [loadCategories]);
    useEffect(() => { loadItems(); }, [loadItems]);

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((i) => `${i.code} ${i.label}`.toLowerCase().includes(q));
    }, [items, search]);

    const handleDeleteItem = async (it: Item) => {
        if (!confirm(`Xoá item "${it.label}"?`)) return;
        try {
            await axiosClient.delete(MASTER_DATA_ENDPOINTS.ITEMS_DELETE(it.id));
            toast.success("Đã xoá."); await loadItems();
        } catch { toast.error("Không xoá được."); }
    };

    const handleDeleteCategory = async (c: Category) => {
        if (!confirm(`Xoá danh mục "${c.name}"? Tất cả item sẽ bị xoá theo.`)) return;
        try {
            await axiosClient.delete(MASTER_DATA_ENDPOINTS.CATEGORIES_DELETE(c.id));
            toast.success("Đã xoá."); await loadCategories();
        } catch { toast.error("Không xoá được."); }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Master Data"
                subtitle="Danh mục hệ thống + items (dùng chung cho toàn hệ thống)"
                icon="database"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Master Data" }]}
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng danh mục" value={categories.length} icon="folder" color="blue" loading={loading} />
                <StatCard label="Tổng items" value={categories.reduce((s, c) => s + (c.itemCount ?? 0), 0)} icon="list" color="emerald" loading={loading} />
                <StatCard label="Danh mục đang xem" value={items.length} icon="visibility" color="violet" loading={loading} />
                <StatCard label="Active" value={items.filter((i) => i.isActive).length} icon="check_circle" color="amber" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Categories list */}
                <div className="lg:col-span-1 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                        <h3 className="font-bold text-sm text-[#121417] dark:text-white">Danh mục ({categories.length})</h3>
                    </div>
                    {loading ? (
                        <div className="p-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
                    ) : categories.length === 0 ? (
                        <div className="p-4 text-xs text-[#687582] italic">Chưa có danh mục.</div>
                    ) : (
                        <div className="max-h-[600px] overflow-y-auto">
                            {categories.map((c, idx) => (
                                <div key={c.id || c.code || `cat-${idx}`}
                                    onClick={() => setSelectedCat(c.code)}
                                    className={`flex items-center justify-between gap-2 px-4 py-2.5 cursor-pointer border-b border-gray-50 dark:border-gray-800 ${selectedCat === c.code ? "bg-[#3C81C6]/10 border-l-4 border-l-[#3C81C6]" : "hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]"}`}>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-[#121417] dark:text-white truncate">{c.name}</div>
                                        <div className="text-xs font-mono text-[#687582] truncate">{c.code}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="text-xs font-semibold text-[#3C81C6]">{c.itemCount ?? 0}</div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c); }} className="px-1 py-0.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="lg:col-span-3 space-y-4">
                    <FilterBar searchPlaceholder="Tìm item theo code hoặc label..." searchValue={search} onSearchChange={setSearch} onReset={() => setSearch("")} />

                    {!selectedCat ? (
                        <EmptyState icon="folder_open" title="Chọn danh mục" description="Chọn một danh mục ở cột trái để xem items." />
                    ) : filteredItems.length === 0 ? (
                        <EmptyState icon="list" title="Danh mục rỗng" description={items.length === 0 ? "Chưa có item nào." : "Không khớp bộ lọc."} />
                    ) : (
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold text-[#687582]">Code</th>
                                        <th className="text-left px-4 py-3 font-semibold text-[#687582]">Label</th>
                                        <th className="text-right px-4 py-3 font-semibold text-[#687582]">Order</th>
                                        <th className="text-left px-4 py-3 font-semibold text-[#687582]">Trạng thái</th>
                                        <th className="text-right px-4 py-3 font-semibold text-[#687582]">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((it, idx) => (
                                        <tr key={it.id || `item-${idx}`} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                            <td className="px-4 py-2.5 font-mono text-xs text-[#3C81C6]">{it.code}</td>
                                            <td className="px-4 py-2.5 text-[#121417] dark:text-white">{it.label}</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-xs">{it.order ?? 0}</td>
                                            <td className="px-4 py-2.5">
                                                <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${it.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                                                    {it.isActive ? "Active" : "Inactive"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <button onClick={() => handleDeleteItem(it)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
