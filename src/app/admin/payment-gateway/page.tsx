"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { BILLING_PAYMENT_GATEWAY_ENDPOINTS, BILLING_CASHIER_AUTH_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";

type TabKey = "online" | "cashier";

interface OnlineOrder {
    id: string;
    orderCode: string;
    invoiceCode?: string;
    amount: number;
    status: "PENDING" | "PAID" | "CANCELLED" | "FAILED";
    method?: string;
    createdAt?: string;
    paidAt?: string;
}

interface CashierProfile {
    id: string;
    userId: string;
    userName: string;
    facilityName?: string;
    dailyLimit: number;
    isActive: boolean;
    lastShiftAt?: string;
}

function normalizeOnlineStatus(raw: any): OnlineOrder["status"] {
    const s = String(raw ?? "").toUpperCase();
    if (s === "PAID" || s === "COMPLETED" || s === "SUCCESS") return "PAID";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    if (s === "FAILED" || s === "ERROR") return "FAILED";
    return "PENDING";
}

function mapOrder(r: any): OnlineOrder {
    return {
        id: String(r.order_id ?? r.id ?? ""),
        orderCode: r.order_code ?? r.code ?? "",
        invoiceCode: r.invoice_code ?? r.invoiceCode ?? "",
        amount: Number(r.amount ?? 0),
        status: normalizeOnlineStatus(r.status),
        method: r.payment_method ?? r.method ?? "SePay",
        createdAt: r.created_at ?? "",
        paidAt: r.paid_at ?? r.paidAt ?? "",
    };
}

function mapProfile(r: any): CashierProfile {
    return {
        id: String(r.profile_id ?? r.id ?? ""),
        userId: String(r.user_id ?? r.userId ?? ""),
        userName: r.user_name ?? r.userName ?? r.full_name ?? "—",
        facilityName: r.facility_name ?? r.facilityName ?? "",
        dailyLimit: Number(r.daily_limit ?? r.dailyLimit ?? 0),
        isActive: Boolean(r.is_active ?? r.isActive ?? true),
        lastShiftAt: r.last_shift_at ?? r.lastShiftAt ?? "",
    };
}

function formatDT(d?: string): string {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatVND(n: number): string {
    return n.toLocaleString("vi-VN") + " ₫";
}

export default function PaymentGatewayPage() {
    const [tab, setTab] = useState<TabKey>("online");

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Cổng thanh toán & Thu ngân"
                subtitle="Cấu hình QR/SePay, lịch sử giao dịch online, phân quyền thu ngân"
                icon="qr_code_2"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Thanh toán" }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-1.5 inline-flex gap-1">
                {([
                    { key: "online", label: "Thanh toán online", icon: "qr_code_2" },
                    { key: "cashier", label: "Phân quyền thu ngân", icon: "badge" },
                ] as { key: TabKey; label: string; icon: string }[]).map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 ${tab === t.key ? "bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] text-white shadow-sm" : "text-[#687582] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "online" ? <OnlineTab /> : <CashierTab />}
        </div>
    );
}

function OnlineTab() {
    const toast = useToast();
    const [orders, setOrders] = useState<OnlineOrder[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showConfig, setShowConfig] = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [ordRes, statsRes] = await Promise.all([
                axiosClient.get(BILLING_PAYMENT_GATEWAY_ENDPOINTS.ONLINE_HISTORY, { params: { limit: 100 } }),
                axiosClient.get(BILLING_PAYMENT_GATEWAY_ENDPOINTS.ONLINE_STATS).catch(() => ({ data: {} })),
            ]);
            const { data } = unwrapList<any>(ordRes);
            setOrders(data.map(mapOrder));
            setStats(statsRes.data?.data ?? statsRes.data ?? {});
        } catch {
            setError("Không tải được lịch sử thanh toán online.");
            setOrders([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const computed = useMemo(() => ({
        total: Number(stats.total ?? orders.length),
        paid: Number(stats.paid ?? orders.filter((o) => o.status === "PAID").length),
        pending: Number(stats.pending ?? orders.filter((o) => o.status === "PENDING").length),
        amount: Number(stats.total_amount ?? orders.filter((o) => o.status === "PAID").reduce((s, o) => s + o.amount, 0)),
    }), [stats, orders]);

    const handleTestGateway = async () => {
        try {
            await axiosClient.post(BILLING_PAYMENT_GATEWAY_ENDPOINTS.TEST_GATEWAY);
            toast.success("Gateway OK.");
        } catch {
            toast.error("Gateway lỗi.");
        }
    };

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                <button onClick={handleTestGateway} className="px-3 py-1.5 text-xs text-[#3C81C6] border border-[#3C81C6]/40 hover:bg-[#3C81C6]/10 rounded-lg inline-flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>network_check</span>Test gateway
                </button>
                <button onClick={() => setShowConfig(true)} className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-lg inline-flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>settings</span>Cấu hình
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng order" value={computed.total} icon="qr_code_2" color="blue" loading={loading} />
                <StatCard label="Đã thanh toán" value={computed.paid} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Chờ TT" value={computed.pending} icon="hourglass_top" color="amber" loading={loading} />
                <StatCard label="Tổng tiền" value={formatVND(computed.amount)} icon="payments" color="violet" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-200">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : orders.length === 0 ? (
                <EmptyState icon="qr_code_2" title="Chưa có giao dịch online" description="Chưa có giao dịch QR/SePay nào." />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Mã order</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">HĐ</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Số tiền</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Phương thức</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Trạng thái</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o, idx) => (
                                    <tr key={o.id || `online-${idx}`} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                        <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{o.orderCode}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-[#687582]">{o.invoiceCode || "—"}</td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#121417] dark:text-white">{formatVND(o.amount)}</td>
                                        <td className="px-4 py-3 text-xs text-[#687582]">{o.method}</td>
                                        <td className="px-4 py-3">
                                            <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${
                                                o.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                                                o.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                                                "bg-red-100 text-red-700"
                                            }`}>{o.status}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[#687582]">{formatDT(o.paidAt || o.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showConfig && <GatewayConfigModal onClose={() => setShowConfig(false)} />}
        </>
    );
}

function GatewayConfigModal({ onClose }: { onClose: () => void }) {
    const toast = useToast();
    const [config, setConfig] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axiosClient.get(BILLING_PAYMENT_GATEWAY_ENDPOINTS.GATEWAY_CONFIG)
            .then((r) => setConfig(r.data?.data ?? r.data ?? {}))
            .catch(() => setConfig({}))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosClient.put(BILLING_PAYMENT_GATEWAY_ENDPOINTS.GATEWAY_CONFIG, config);
            toast.success("Đã lưu.");
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4">Cấu hình gateway (SePay)</h3>
                {loading ? (
                    <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Bank account</label>
                            <input value={config.bank_account ?? ""} onChange={(e) => setConfig({ ...config, bank_account: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Bank code</label>
                            <input value={config.bank_code ?? ""} onChange={(e) => setConfig({ ...config, bank_code: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Webhook secret</label>
                            <input type="password" value={config.webhook_secret ?? ""} onChange={(e) => setConfig({ ...config, webhook_secret: e.target.value })}
                                className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-mono dark:text-white" />
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">Huỷ</button>
                    <button onClick={handleSave} disabled={saving || loading} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CashierTab() {
    const toast = useToast();
    const [profiles, setProfiles] = useState<CashierProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await axiosClient.get(BILLING_CASHIER_AUTH_ENDPOINTS.PROFILES, { params: { limit: 200 } });
            const { data } = unwrapList<any>(res);
            setProfiles(data.map(mapProfile));
        } catch {
            setError("Không tải được phân quyền thu ngân.");
            setProfiles([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const stats = useMemo(() => ({
        total: profiles.length,
        active: profiles.filter((p) => p.isActive).length,
        totalLimit: profiles.reduce((s, p) => s + (p.dailyLimit ?? 0), 0),
    }), [profiles]);

    const handleDelete = async (p: CashierProfile) => {
        if (!confirm(`Xoá profile thu ngân "${p.userName}"?`)) return;
        try {
            await axiosClient.delete(BILLING_CASHIER_AUTH_ENDPOINTS.PROFILE_DETAIL(p.id));
            toast.success("Đã xoá."); await load();
        } catch { toast.error("Không xoá được."); }
    };

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng thu ngân" value={stats.total} icon="badge" color="blue" loading={loading} />
                <StatCard label="Đang hoạt động" value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Tổng hạn mức" value={formatVND(stats.totalLimit)} icon="account_balance" color="violet" loading={loading} />
                <StatCard label="Đang mở ca" value={0} icon="point_of_sale" color="amber" loading={loading} />
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-amber-50 text-sm text-amber-800">{error}</div>}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : profiles.length === 0 ? (
                <EmptyState icon="badge" title="Chưa có profile thu ngân" description="Tạo profile cho nhân sự thu ngân để cấp quyền POS." />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Thu ngân</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Cơ sở</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Hạn mức/ngày</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Ca gần nhất</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582]">Trạng thái</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profiles.map((p, idx) => (
                                    <tr key={p.id || `profile-${idx}`} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                        <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{p.userName}</td>
                                        <td className="px-4 py-3 text-xs text-[#687582]">{p.facilityName || "—"}</td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#121417] dark:text-white">{formatVND(p.dailyLimit)}</td>
                                        <td className="px-4 py-3 text-xs text-[#687582]">{formatDT(p.lastShiftAt)}</td>
                                        <td className="px-4 py-3">
                                            <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                                                {p.isActive ? "Hoạt động" : "Ngưng"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleDelete(p)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Xoá">
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
