"use client";

/**
 * Sign-off — Phase I.4 Nhóm 4 #2 + #3 (Ký hồ sơ + Hồ sơ chờ ký).
 * Spec: dòng 6251-6483.
 *
 * Hai chế độ:
 * - Không có ?encounterId → list pending sign-off.
 * - Có ?encounterId → detail panel ký (status / verify / signatures / audit log / actions).
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, EmptyState, StatCard } from "@/components/shared/layout";
import { medicalSignoffService, type SignoffRecord, type Signature } from "@/services/medicalSignoffService";

const fmt = (v?: string) => {
    if (!v) return "—";
    try { return new Date(v).toLocaleString("vi-VN"); } catch { return v; }
};

function PendingList({ onOpen }: { onOpen: (encounterId: string) => void }) {
    const [items, setItems] = useState<SignoffRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        medicalSignoffService.getPending()
            .then((res: any) => {
                const data = res?.data ?? [];
                setItems(Array.isArray(data) ? data.map((r: any) => ({
                    id: r.id ?? r.encounter_id,
                    encounterId: r.encounter_id ?? r.encounterId,
                    patientName: r.patient_name ?? r.patientName,
                    visitDate: r.visit_date ?? r.visitDate ?? r.created_at,
                    status: (r.status ?? "PENDING").toString().toUpperCase(),
                    verifyStatus: r.verify_status ?? r.verifyStatus,
                    locked: r.locked ?? r.lock_status,
                    recordType: r.record_type ?? r.type,
                })) : []);
            })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => items.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (r as any).patientName?.toLowerCase().includes(q) ||
               (r.encounterId ?? "").toLowerCase().includes(q);
    }), [items, search]);

    const stats = useMemo(() => ({
        total: items.length,
        urgent: items.filter((r: any) => r.priority === "URGENT").length,
        verifyOk: items.filter((r: any) => r.verifyStatus === "OK" || r.verifyStatus === "PASSED").length,
    }), [items]);

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Tổng chờ ký" value={stats.total} icon="hourglass_empty" color="amber" loading={loading} />
                <StatCard label="Khẩn" value={stats.urgent} icon="priority_high" color="red" loading={loading} />
                <StatCard label="Verify OK" value={stats.verifyOk} icon="verified" color="emerald" loading={loading} />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3 mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bệnh nhân / encounter…" className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                        <tr>
                            <th className="text-left px-4 py-3">Encounter</th>
                            <th className="text-left px-4 py-3">Bệnh nhân</th>
                            <th className="text-left px-4 py-3">Ngày khám</th>
                            <th className="text-left px-4 py-3">Loại</th>
                            <th className="text-left px-4 py-3">Verify</th>
                            <th className="text-left px-4 py-3">Lock</th>
                            <th className="text-right px-4 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-[#687582]">Đang tải…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7}><EmptyState icon="task_alt" title="Hết hồ sơ chờ ký" description="Bạn đã ký xong tất cả hồ sơ cần xử lý." variant="success" /></td></tr>
                        ) : filtered.map((r: any) => (
                            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">#{(r.encounterId ?? "").slice(0, 8)}</td>
                                <td className="px-4 py-3 font-medium">{r.patientName ?? "—"}</td>
                                <td className="px-4 py-3 text-[#687582]">{fmt(r.visitDate)}</td>
                                <td className="px-4 py-3">{r.recordType ?? "—"}</td>
                                <td className="px-4 py-3">{r.verifyStatus ?? "—"}</td>
                                <td className="px-4 py-3">{r.locked ? <span className="text-rose-600 text-xs">Khoá</span> : <span className="text-emerald-600 text-xs">Mở</span>}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex gap-1">
                                        <Link href={`/portal/doctor/medical-records/${r.encounterId}`} className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                                            Mở hồ sơ
                                        </Link>
                                        <button onClick={() => onOpen(r.encounterId)} className="px-2 py-1 text-xs rounded-md bg-[#3C81C6] text-white hover:bg-[#2a6da8]">
                                            Đi tới ký
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function SignoffDetail({ encounterId, onBack }: { encounterId: string; onBack: () => void }) {
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [verify, setVerify] = useState<any>(null);
    const [audit, setAudit] = useState<any[]>([]);
    const [lock, setLock] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [pin, setPin] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const [s, v, a, l] = await Promise.allSettled([
            medicalSignoffService.getSignatures(encounterId),
            medicalSignoffService.verify(encounterId),
            medicalSignoffService.getAuditLog(encounterId),
            medicalSignoffService.getLockStatus(encounterId),
        ]);
        setSignatures(s.status === "fulfilled" ? ((s.value as any)?.data ?? []) : []);
        setVerify(v.status === "fulfilled" ? v.value : null);
        setAudit(a.status === "fulfilled" ? ((a.value as any)?.data ?? []) : []);
        setLock(l.status === "fulfilled" ? l.value : null);
        setLoading(false);
    }, [encounterId]);

    useEffect(() => { load(); }, [load]);

    const doSign = async (kind: "draft" | "official" | "complete") => {
        setBusy(true);
        try {
            if (kind === "draft") await medicalSignoffService.draftSign(encounterId, {});
            if (kind === "official") await medicalSignoffService.officialSign(encounterId, { pin });
            if (kind === "complete") await medicalSignoffService.complete(encounterId, {});
            await load();
        } catch (e: any) {
            alert(e?.response?.data?.message ?? e?.message ?? "Ký thất bại");
        } finally { setBusy(false); }
    };

    return (
        <div>
            <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm text-[#3C81C6] hover:underline">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Quay lại danh sách
            </button>

            {loading ? (
                <p className="text-center py-12 text-[#687582]">Đang tải…</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Block 1: Trạng thái */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">info</span>
                            Trạng thái ký
                        </h3>
                        <dl className="space-y-2 text-sm">
                            <div>
                                <dt className="text-xs text-[#687582]">Encounter</dt>
                                <dd className="font-mono text-xs">#{encounterId.slice(0, 8)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-[#687582]">Lock status</dt>
                                <dd>{lock?.locked ? <span className="text-rose-600">Đã khoá ({lock.reason ?? "n/a"})</span> : <span className="text-emerald-600">Còn chỉnh sửa được</span>}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-[#687582]">Số chữ ký</dt>
                                <dd className="font-bold">{signatures.length}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Block 2: Verify */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-600">verified</span>
                            Kiểm tra hợp lệ
                        </h3>
                        {!verify ? (
                            <p className="text-xs text-[#687582]">Không có dữ liệu verify.</p>
                        ) : (
                            <div className="text-sm">
                                <p className={(verify as any).valid ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                                    {(verify as any).valid ? "Hợp lệ — đủ điều kiện ký" : "Chưa đủ điều kiện ký"}
                                </p>
                                {(verify as any).warnings && (
                                    <ul className="mt-2 text-xs space-y-1">
                                        {(verify as any).warnings.map((w: string, i: number) => (
                                            <li key={i} className="text-amber-600">• {w}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Block 3: Actions */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-violet-600">draw</span>
                            Hành động ký
                        </h3>
                        <div className="space-y-3">
                            <button
                                disabled={busy || lock?.locked}
                                onClick={() => doSign("draft")}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 disabled:opacity-50"
                            >
                                Ký nháp (Draft)
                            </button>
                            <input
                                type="password"
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                placeholder="PIN ký số"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                            />
                            <button
                                disabled={busy || lock?.locked}
                                onClick={() => doSign("official")}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white hover:bg-[#2a6da8] disabled:opacity-50"
                            >
                                Ký chính thức
                            </button>
                            <button
                                disabled={busy}
                                onClick={() => doSign("complete")}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 disabled:opacity-50"
                            >
                                Hoàn tất ký
                            </button>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4 lg:col-span-2">
                        <h3 className="text-sm font-bold mb-3">Chữ ký ({signatures.length})</h3>
                        {signatures.length === 0 ? (
                            <p className="text-xs italic text-[#687582]">Chưa có chữ ký nào.</p>
                        ) : (
                            <ul className="space-y-2">
                                {signatures.map(s => (
                                    <li key={s.id} className="flex justify-between text-sm border-b border-[#e5e7eb] dark:border-[#2d353e] py-2">
                                        <div>
                                            <p className="font-medium">{(s as any).signerName ?? s.signerId}</p>
                                            <p className="text-xs text-[#687582]">{s.type ?? "Chữ ký"}</p>
                                        </div>
                                        <p className="text-xs text-[#687582]">{fmt(s.signedAt)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Audit log */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                        <h3 className="text-sm font-bold mb-3">Audit log ({audit.length})</h3>
                        {audit.length === 0 ? (
                            <p className="text-xs italic text-[#687582]">Chưa có hoạt động nào.</p>
                        ) : (
                            <ul className="space-y-1 text-xs">
                                {audit.slice(0, 10).map((a: any, i: number) => (
                                    <li key={a.id ?? i} className="border-b border-[#e5e7eb] dark:border-[#2d353e] py-1">
                                        <p>{a.action ?? a.event_type ?? "Sự kiện"}</p>
                                        <p className="text-[#687582]">{fmt(a.created_at ?? a.timestamp)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DoctorSignOffPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const encounterId = sp.get("encounterId");

    const handleOpen = (id: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set("encounterId", id);
        router.replace(url.pathname + url.search);
    };

    const handleBack = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("encounterId");
        router.replace(url.pathname + url.search);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title={encounterId ? "Ký hồ sơ" : "Hồ sơ chờ ký"}
                subtitle={encounterId
                    ? "Trạng thái / verify / chữ ký / audit log của một encounter."
                    : "Tổng hợp tất cả hồ sơ bạn cần ký."}
                icon="draw"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Sign-off", href: "/portal/doctor/sign-off" },
                    ...(encounterId ? [{ label: `#${encounterId.slice(0, 8)}` }] : []),
                ]}
            />
            {encounterId
                ? <SignoffDetail encounterId={encounterId} onBack={handleBack} />
                : <PendingList onOpen={handleOpen} />}
        </div>
    );
}
