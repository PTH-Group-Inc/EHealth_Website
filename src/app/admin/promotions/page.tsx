"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { BILLING_PRICING_POLICY_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

type TabKey = "discounts" | "vouchers" | "bundles";

interface Discount {
    id: string;
    name: string;
    code?: string;
    discountType: "PERCENT" | "AMOUNT";
    discountValue: number;
    validFrom?: string;
    validTo?: string;
    isActive: boolean;
    usedCount?: number;
}

interface Voucher {
    id: string;
    name: string;
    code: string;
    discountType: "PERCENT" | "AMOUNT";
    discountValue: number;
    validFrom?: string;
    validTo?: string;
    maxUse?: number;
    usedCount?: number;
    isActive: boolean;
}

interface Bundle {
    id: string;
    name: string;
    code?: string;
    serviceCount: number;
    totalPrice: number;
    bundlePrice: number;
    savings: number;
    isActive: boolean;
}

function mapDiscount(r: any): Discount {
    const dv = Number(r.discount_value ?? r.discountValue ?? 0);
    return {
        id: String(r.discount_id ?? r.id ?? ""),
        name: r.name ?? "",
        code: r.code ?? "",
        discountType: (r.discount_type ?? r.discountType ?? "PERCENT") === "AMOUNT" ? "AMOUNT" : "PERCENT",
        discountValue: dv,
        validFrom: r.valid_from ?? r.validFrom ?? "",
        validTo: r.valid_to ?? r.validTo ?? "",
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
        usedCount: Number(r.used_count ?? r.usedCount ?? 0),
    };
}

function mapVoucher(r: any): Voucher {
    return {
        id: String(r.voucher_id ?? r.id ?? ""),
        name: r.name ?? "",
        code: r.code ?? "",
        discountType: (r.discount_type ?? "PERCENT") === "AMOUNT" ? "AMOUNT" : "PERCENT",
        discountValue: Number(r.discount_value ?? 0),
        validFrom: r.valid_from ?? "",
        validTo: r.valid_to ?? "",
        maxUse: Number(r.max_use ?? r.maxUse ?? 0),
        usedCount: Number(r.used_count ?? r.usedCount ?? 0),
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
    };
}

function mapBundle(r: any): Bundle {
    const total = Number(r.total_price ?? r.totalPrice ?? 0);
    const bp = Number(r.bundle_price ?? r.bundlePrice ?? 0);
    return {
        id: String(r.bundle_id ?? r.id ?? ""),
        name: r.name ?? "",
        code: r.code ?? "",
        serviceCount: Number(r.service_count ?? r.serviceCount ?? 0),
        totalPrice: total,
        bundlePrice: bp,
        savings: total - bp,
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
    };
}

function formatDate(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatVND(n: number): string {
    return n.toLocaleString("vi-VN") + " ₫";
}

function formatDiscount(type: string, value: number): string {
    return type === "PERCENT" ? `${value}%` : formatVND(value);
}

export default function PromotionsPage() {
    const [tab, setTab] = useState<TabKey>("discounts");

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Khuyến mãi & Ưu đãi"
                subtitle="Quản lý chiết khấu, voucher, và gói dịch vụ combo"
                icon="local_offer"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Khuyến mãi" }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-1.5 inline-flex gap-1">
                {([
                    { key: "discounts", label: "Chiết khấu", icon: "discount" },
                    { key: "vouchers", label: "Voucher", icon: "confirmation_number" },
                    { key: "bundles", label: "Gói combo", icon: "widgets" },
                ] as { key: TabKey; label: string; icon: string }[]).map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 ${tab === t.key ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm" : "text-[#687582] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "discounts" && <DiscountsTab />}
            {tab === "vouchers" && <VouchersTab />}
            {tab === "bundles" && <BundlesTab />}
        </div>
    );
}

function DiscountsTab() {
    const toast = useToast();
    const [items, setItems] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(BILLING_PRICING_POLICY_ENDPOINTS.DISCOUNTS, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapDiscount));
        } catch {
            setError("Không tải được danh sách chiết khấu.");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (d: Discount) => {
        if (!confirm(`Xoá chiết khấu "${d.name}"?`)) return;
        try {
            await axiosClient.delete(BILLING_PRICING_POLICY_ENDPOINTS.DELETE_DISCOUNT(d.id));
            toast.success("Đã xoá.");
            await load();
        } catch {
            toast.error("Không xoá được.");
        }
    };

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng chiết khấu" value={items.length} icon="discount" color="blue" loading={loading} />
                <StatCard label="Đang áp dụng" value={items.filter((d) => d.isActive).length} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Loại %" value={items.filter((d) => d.discountType === "PERCENT").length} icon="percent" color="violet" loading={loading} />
                <StatCard label="Lượt sử dụng" value={items.reduce((s, d) => s + (d.usedCount ?? 0), 0)} icon="shopping_cart" color="amber" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-200">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="discount" title="Chưa có chiết khấu" description="Tạo chiết khấu để áp dụng tự động cho khách hàng." />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Tên / Mã</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Giá trị</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Hiệu lực</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Đã dùng</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((d) => (
                                    <tr key={d.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                        <td className="px-4 py-3"><div className="font-semibold text-[#121417] dark:text-white">{d.name}</div>{d.code && <div className="text-xs font-mono text-[#687582]">{d.code}</div>}</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-[#3C81C6]">{formatDiscount(d.discountType, d.discountValue)}</td>
                                        <td className="px-4 py-3 text-xs text-[#687582]">{formatDate(d.validFrom)} → {formatDate(d.validTo)}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-[#121417] dark:text-white">{d.usedCount ?? 0}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleDelete(d)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Xoá">
                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}

function VouchersTab() {
    const toast = useToast();
    const [items, setItems] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(BILLING_PRICING_POLICY_ENDPOINTS.VOUCHERS, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapVoucher));
        } catch {
            setError("Không tải được voucher.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (v: Voucher) => {
        if (!confirm(`Xoá voucher "${v.name}"?`)) return;
        try {
            await axiosClient.delete(BILLING_PRICING_POLICY_ENDPOINTS.DELETE_VOUCHER(v.id));
            toast.success("Đã xoá."); await load();
        } catch { toast.error("Không xoá được."); }
    };

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng voucher" value={items.length} icon="confirmation_number" color="blue" loading={loading} />
                <StatCard label="Đang áp dụng" value={items.filter((v) => v.isActive).length} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Đã dùng" value={items.reduce((s, v) => s + (v.usedCount ?? 0), 0)} icon="shopping_cart" color="violet" loading={loading} />
                <StatCard label="Còn lại" value={items.reduce((s, v) => s + Math.max(0, (v.maxUse ?? 0) - (v.usedCount ?? 0)), 0)} icon="inventory_2" color="amber" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="confirmation_number" title="Chưa có voucher" description="Tạo voucher với mã khách hàng nhập để được giảm giá." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((v) => (
                        <div key={v.id} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 rounded-full -mr-8 -mt-8" />
                            <div className="relative">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="font-bold text-[#121417] dark:text-white">{v.name}</div>
                                    <button onClick={() => handleDelete(v)} className="px-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded">
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                    </button>
                                </div>
                                <div className="inline-block font-mono text-xs font-bold px-2 py-1 bg-white dark:bg-[#1e242b] text-amber-700 dark:text-amber-300 rounded mb-2 border border-dashed border-amber-400">{v.code}</div>
                                <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">{formatDiscount(v.discountType, v.discountValue)}</div>
                                <div className="text-xs text-[#687582] dark:text-gray-400 space-y-0.5">
                                    <div>Đã dùng: <b>{v.usedCount ?? 0}/{v.maxUse ?? "∞"}</b></div>
                                    <div>{formatDate(v.validFrom)} → {formatDate(v.validTo)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

function BundlesTab() {
    const toast = useToast();
    const [items, setItems] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(BILLING_PRICING_POLICY_ENDPOINTS.BUNDLES, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setItems(data.map(mapBundle));
        } catch {
            setError("Không tải được bundle.");
            setItems([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (b: Bundle) => {
        if (!confirm(`Xoá bundle "${b.name}"?`)) return;
        try {
            await axiosClient.delete(BILLING_PRICING_POLICY_ENDPOINTS.DELETE_BUNDLE(b.id));
            toast.success("Đã xoá."); await load();
        } catch { toast.error("Không xoá được."); }
    };

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng combo" value={items.length} icon="widgets" color="blue" loading={loading} />
                <StatCard label="Đang bán" value={items.filter((b) => b.isActive).length} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Tổng tiết kiệm" value={formatVND(items.reduce((s, b) => s + b.savings, 0))} icon="savings" color="violet" loading={loading} />
                <StatCard label="TB số DV/combo" value={items.length ? Math.round(items.reduce((s, b) => s + b.serviceCount, 0) / items.length) : 0} icon="medical_services" color="amber" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : items.length === 0 ? (
                <EmptyState icon="widgets" title="Chưa có combo" description="Tạo combo để gộp nhiều dịch vụ bán theo giá ưu đãi." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((b) => {
                        const savePct = b.totalPrice > 0 ? Math.round((b.savings / b.totalPrice) * 100) : 0;
                        return (
                            <div key={b.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white"><span className="material-symbols-outlined" style={{ fontSize: "20px" }}>widgets</span></div>
                                        <div><div className="font-bold text-[#121417] dark:text-white">{b.name}</div>{b.code && <div className="text-xs font-mono text-[#687582]">{b.code}</div>}</div>
                                    </div>
                                    <button onClick={() => handleDelete(b)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <div><div className="text-xs text-[#687582]">Gốc</div><div className="font-mono text-xs line-through text-[#687582]">{formatVND(b.totalPrice)}</div></div>
                                    <div><div className="text-xs text-[#687582]">Combo</div><div className="font-mono text-sm font-bold text-[#3C81C6]">{formatVND(b.bundlePrice)}</div></div>
                                    <div><div className="text-xs text-[#687582]">Tiết kiệm</div><div className="font-mono text-sm font-bold text-emerald-600">-{savePct}%</div></div>
                                </div>
                                <div className="mt-2 text-xs text-[#687582]">Gồm <b>{b.serviceCount}</b> dịch vụ</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
