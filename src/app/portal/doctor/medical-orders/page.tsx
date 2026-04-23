"use client";

/**
 * Medical Orders / Chỉ định — Phase I.3 Nhóm 3 #5.
 * Spec: dòng 5799-5875 `/Users/minhquan/EH/Sửa giao diện tổng.md`.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { medicalOrderService, type MedicalOrder } from "@/services/medicalOrderService";

const STATUS_META: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ thực hiện", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    IN_PROGRESS: { label: "Đang thực hiện", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    COMPLETED: { label: "Hoàn tất", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
};

const fmtDate = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; }
};

function normalize(o: any): MedicalOrder {
    return {
        id: o.id ?? o.order_id,
        encounterId: o.encounter_id ?? o.encounterId,
        patientId: o.patient_id ?? o.patientId,
        serviceId: o.service_id ?? o.serviceId,
        serviceName: o.service_name ?? o.serviceName ?? o.name,
        status: (o.status ?? "PENDING").toString().toUpperCase(),
        ...o,
        patientName: o.patient_name ?? o.patientName,
        createdAt: o.created_at ?? o.createdAt,
        priority: o.priority,
    };
}

export default function DoctorMedicalOrdersPage() {
    const [items, setItems] = useState<MedicalOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<MedicalOrder | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await medicalOrderService.getPending();
            const data = (res as any)?.data ?? [];
            setItems(Array.isArray(data) ? data.map(normalize) : []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        return items.filter(o => {
            if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                if (!(o.serviceName ?? "").toString().toLowerCase().includes(q) &&
                    !((o as any).patientName ?? "").toString().toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [items, statusFilter, search]);

    const stats = useMemo(() => ({
        total: items.length,
        pending: items.filter(o => o.status === "PENDING").length,
        inProgress: items.filter(o => o.status === "IN_PROGRESS").length,
        completed: items.filter(o => o.status === "COMPLETED").length,
    }), [items]);

    const onAction = async (id: string, action: "start" | "cancel") => {
        setBusy(id);
        try {
            if (action === "start") await medicalOrderService.start(id);
            if (action === "cancel") {
                const reason = prompt("Lý do huỷ:") ?? "";
                if (!reason) { setBusy(null); return; }
                await medicalOrderService.cancel(id, reason);
            }
            await load();
        } catch (e: any) {
            alert(e?.response?.data?.message ?? e?.message ?? "Thao tác thất bại");
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Medical Orders / Chỉ định"
                subtitle="Y lệnh / chỉ định cận lâm sàng đang chờ và đang thực hiện."
                icon="experiment"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Medical Orders" },
                ]}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng" value={stats.total} icon="list_alt" color="blue" loading={loading} />
                <StatCard label="Chờ thực hiện" value={stats.pending} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Đang thực hiện" value={stats.inProgress} icon="science" color="violet" loading={loading} />
                <StatCard label="Hoàn tất" value={stats.completed} icon="task_alt" color="emerald" loading={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm theo dịch vụ / bệnh nhân…"
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                >
                    <option value="ALL">Mọi trạng thái</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr>
                                <th className="text-left px-4 py-3">Dịch vụ</th>
                                <th className="text-left px-4 py-3">Bệnh nhân</th>
                                <th className="text-left px-4 py-3">Encounter</th>
                                <th className="text-left px-4 py-3">Tạo lúc</th>
                                <th className="text-left px-4 py-3">Trạng thái</th>
                                <th className="text-right px-4 py-3">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6}><EmptyState icon="science" title="Không có chỉ định" description="Hiện không có order nào khớp bộ lọc." variant="success" /></td></tr>
                            ) : filtered.map(o => {
                                const st = STATUS_META[o.status ?? "PENDING"] ?? { label: o.status, cls: "bg-gray-100 text-gray-700" };
                                return (
                                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-medium">{o.serviceName ?? "—"}</td>
                                        <td className="px-4 py-3">{(o as any).patientName ?? <span className="text-[#687582]">—</span>}</td>
                                        <td className="px-4 py-3">
                                            {o.encounterId ? (
                                                <Link href={`/portal/doctor/examination?encounterId=${o.encounterId}`} className="font-mono text-xs text-[#3C81C6] hover:underline">
                                                    #{o.encounterId.slice(0, 8)}
                                                </Link>
                                            ) : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-[#687582]">{fmtDate((o as any).createdAt)}</td>
                                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex gap-1">
                                                {o.status === "PENDING" && (
                                                    <button onClick={() => onAction(o.id, "start")} disabled={busy === o.id} className="px-2 py-1 text-xs rounded-md bg-[#3C81C6] text-white hover:bg-[#2a6da8] disabled:opacity-50">
                                                        Bắt đầu
                                                    </button>
                                                )}
                                                {(o.status === "PENDING" || o.status === "IN_PROGRESS") && (
                                                    <button onClick={() => onAction(o.id, "cancel")} disabled={busy === o.id} className="px-2 py-1 text-xs rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50">
                                                        Huỷ
                                                    </button>
                                                )}
                                                <button onClick={() => setSelected(o)} className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-lg font-bold">Chi tiết chỉ định</h3>
                            <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            <div>
                                <p className="text-xs text-[#687582]">Dịch vụ</p>
                                <p className="font-medium">{selected.serviceName ?? "—"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-[#687582]">Bệnh nhân</p>
                                    <p className="font-medium">{(selected as any).patientName ?? "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[#687582]">Tạo lúc</p>
                                    <p>{fmtDate((selected as any).createdAt)}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-[#687582]">Trạng thái</p>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_META[selected.status ?? "PENDING"]?.cls ?? "bg-gray-100 text-gray-700"}`}>
                                    {STATUS_META[selected.status ?? "PENDING"]?.label ?? selected.status}
                                </span>
                            </div>
                            {selected.result && (
                                <div className="border-t border-[#e5e7eb] dark:border-[#2d353e] pt-3">
                                    <p className="text-xs text-[#687582] mb-1">Kết quả</p>
                                    <pre className="text-xs bg-gray-50 dark:bg-gray-800/50 rounded p-2 overflow-x-auto">{JSON.stringify(selected.result, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#e5e7eb] dark:border-[#2d353e] flex justify-end gap-2">
                            {selected.encounterId && (
                                <Link href={`/portal/doctor/examination?encounterId=${selected.encounterId}`} className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                                    Mở encounter
                                </Link>
                            )}
                            <button onClick={() => setSelected(null)} className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
