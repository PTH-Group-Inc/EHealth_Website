"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axiosClient from "@/api/axiosClient";
import { MEDICAL_RECORD_ENDPOINTS } from "@/api/endpoints";
import { encounterService } from "@/services/encounterService";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import { formatDate, formatTime } from "@/utils/formatters";

interface CompletenessRow {
    section: string;
    label: string;
    complete: boolean;
    detail?: string;
}

export default function MedicalRecordDetailPage() {
    const params = useParams();
    const toast = useToast();
    const encounterId = String(params?.encounterId ?? "");

    const [encounter, setEncounter] = useState<any>(null);
    const [record, setRecord] = useState<any>(null);
    const [snapshot, setSnapshot] = useState<any>(null);
    const [completeness, setCompleteness] = useState<{ score: number; rows: CompletenessRow[] }>({ score: 0, rows: [] });
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadAll = useCallback(async () => {
        if (!encounterId) return;
        setLoading(true);
        setError(null);
        try {
            const [enc, rec, snap, comp] = await Promise.allSettled([
                encounterService.getById(encounterId),
                encounterService.getMedicalRecord(encounterId),
                axiosClient.get(MEDICAL_RECORD_ENDPOINTS.SNAPSHOT(encounterId)).then((r) => r.data?.data ?? r.data),
                axiosClient.get(MEDICAL_RECORD_ENDPOINTS.COMPLETENESS(encounterId)).then((r) => r.data?.data ?? r.data),
            ]);
            if (enc.status === "fulfilled") setEncounter(enc.value);
            if (rec.status === "fulfilled") setRecord(rec.value);
            if (snap.status === "fulfilled") setSnapshot(snap.value);
            if (comp.status === "fulfilled") {
                const c = comp.value;
                const score = typeof c?.score === "number" ? c.score : typeof c?.percent === "number" ? c.percent : 0;
                const rawRows: any[] = c?.sections ?? c?.rows ?? c?.checks ?? [];
                const rows: CompletenessRow[] = rawRows.length > 0
                    ? rawRows.map((r: any) => ({
                        section: String(r.section ?? r.key ?? ""),
                        label: r.label ?? r.name ?? r.section ?? "",
                        complete: Boolean(r.complete ?? r.done ?? r.passed ?? false),
                        detail: r.detail ?? r.note ?? "",
                    }))
                    : defaultCompleteness(c);
                setCompleteness({ score, rows });
            } else {
                setCompleteness({ score: 0, rows: defaultCompleteness(null) });
            }
        } catch {
            setError("Không tải được hồ sơ bệnh án.");
        } finally {
            setLoading(false);
        }
    }, [encounterId]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleAction = async (kind: "finalize" | "sign" | "export") => {
        setActioning(kind);
        try {
            if (kind === "finalize") {
                await encounterService.finalizeMedicalRecord(encounterId);
                toast.success("Đã chốt hồ sơ bệnh án.");
            } else if (kind === "sign") {
                await encounterService.signMedicalRecord(encounterId);
                toast.success("Đã ký hồ sơ bệnh án.");
            } else if (kind === "export") {
                const res = await axiosClient.get(MEDICAL_RECORD_ENDPOINTS.EXPORT(encounterId), { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement("a");
                a.href = url;
                a.download = `medical-record-${encounterId}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Đã tải hồ sơ.");
            }
            await loadAll();
        } catch {
            toast.error("Hành động không thành công. Vui lòng thử lại.");
        } finally {
            setActioning(null);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-10 w-1/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const patientName = encounter?.patientName ?? encounter?.patient_name ?? encounter?.patient?.fullName ?? "";
    const isFinalized = record?.status === "FINALIZED" || record?.finalized;
    const isSigned = record?.status === "SIGNED" || record?.signed;
    const score = completeness.score;
    const scoreColor = score >= 90 ? "emerald" : score >= 60 ? "amber" : "red";
    const scoreColorMap = {
        emerald: { bg: "from-emerald-500 to-green-600", text: "text-emerald-700", ring: "ring-emerald-200 dark:ring-emerald-900/40" },
        amber: { bg: "from-amber-500 to-orange-500", text: "text-amber-700", ring: "ring-amber-200 dark:ring-amber-900/40" },
        red: { bg: "from-red-500 to-rose-600", text: "text-red-700", ring: "ring-red-200 dark:ring-red-900/40" },
    } as const;
    const scoreCls = scoreColorMap[scoreColor];

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Hồ sơ bệnh án"
                subtitle={patientName ? `Bệnh nhân: ${patientName}` : "Tổng hợp + ký + xuất bản hồ sơ encounter"}
                icon="medical_information"
                breadcrumbs={[
                    { label: "Cổng bác sĩ", href: "/portal/doctor" },
                    { label: "Phiên khám", href: "/portal/doctor/encounters" },
                    { label: encounterId.slice(0, 8), href: `/portal/doctor/encounters/${encounterId}` },
                    { label: "Hồ sơ bệnh án" },
                ]}
                actions={
                    <Link
                        href={`/portal/doctor/encounters/${encounterId}`}
                        className="px-3 py-2 text-sm text-[#687582] dark:text-gray-400 hover:text-[#3C81C6] inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                        Hub
                    </Link>
                }
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`bg-gradient-to-br ${scoreCls.bg} rounded-2xl p-5 text-white shadow-md ring-4 ${scoreCls.ring}`}>
                    <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Độ đầy đủ hồ sơ</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold">{score}</span>
                        <span className="text-xl font-bold opacity-80">%</span>
                    </div>
                    <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all" style={{ width: `${score}%` }} />
                    </div>
                    <p className="text-[11px] opacity-90 mt-2">
                        {score >= 90 ? "Đầy đủ — sẵn sàng ký" : score >= 60 ? "Còn thiếu vài phần" : "Cần bổ sung trước khi finalize"}
                    </p>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5">
                    <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>checklist</span>
                        Kiểm tra hoàn thiện
                    </h3>
                    <div className="space-y-2">
                        {completeness.rows.map((row) => (
                            <div key={row.section} className="flex items-start gap-3 p-2.5 rounded-xl bg-[#f8f9fa] dark:bg-[#13191f]">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${row.complete ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-gray-200 dark:bg-gray-800 text-gray-400"}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{row.complete ? "check" : "remove"}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-medium ${row.complete ? "text-[#121417] dark:text-white" : "text-[#687582] dark:text-gray-400"}`}>
                                        {row.label}
                                    </p>
                                    {row.detail && (
                                        <p className="text-xs text-[#687582] dark:text-gray-500 mt-0.5">{row.detail}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ActionTile
                    icon="lock"
                    title="Finalize"
                    desc="Chốt hồ sơ — không sửa được sau khi finalize."
                    color="from-amber-500 to-orange-500"
                    disabled={isFinalized || actioning !== null}
                    busy={actioning === "finalize"}
                    onClick={() => handleAction("finalize")}
                    badge={isFinalized ? "Đã chốt" : undefined}
                />
                <ActionTile
                    icon="draw"
                    title="Ký hồ sơ"
                    desc="Bác sĩ chính ký xác nhận sau khi finalize."
                    color="from-violet-500 to-purple-600"
                    disabled={!isFinalized || isSigned || actioning !== null}
                    busy={actioning === "sign"}
                    onClick={() => handleAction("sign")}
                    badge={isSigned ? "Đã ký" : undefined}
                />
                <ActionTile
                    icon="download"
                    title="Xuất hồ sơ"
                    desc="Tải PDF hồ sơ bệnh án (yêu cầu đã ký)."
                    color="from-blue-500 to-indigo-600"
                    disabled={!isSigned || actioning !== null}
                    busy={actioning === "export"}
                    onClick={() => handleAction("export")}
                />
            </div>

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5">
                <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>preview</span>
                    Snapshot hồ sơ
                </h3>
                {snapshot ? (
                    <pre className="text-xs text-[#121417] dark:text-gray-200 bg-[#f8f9fa] dark:bg-[#13191f] rounded-xl p-4 overflow-auto max-h-96 leading-relaxed font-mono whitespace-pre-wrap">
{JSON.stringify(snapshot, null, 2)}
                    </pre>
                ) : (
                    <EmptyState icon="description" title="Chưa có snapshot" description="Snapshot sẽ được tạo sau khi finalize hồ sơ." compact />
                )}
                {record?.updatedAt && (
                    <p className="text-[11px] text-[#687582] dark:text-gray-500 mt-3 font-mono">
                        Cập nhật lần cuối: {formatDate(record.updatedAt)} {formatTime(record.updatedAt)}
                    </p>
                )}
            </div>
        </div>
    );
}

function ActionTile({ icon, title, desc, color, disabled, busy, onClick, badge }: {
    icon: string; title: string; desc: string; color: string; disabled?: boolean; busy?: boolean; onClick: () => void; badge?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`relative bg-gradient-to-br ${color} rounded-2xl p-4 text-left text-white shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        >
            {badge && (
                <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold bg-white/20 backdrop-blur-sm rounded-full">
                    {badge}
                </span>
            )}
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                {busy ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <span className="material-symbols-outlined text-white" style={{ fontSize: "22px" }}>{icon}</span>
                )}
            </div>
            <h4 className="font-bold text-sm mb-1">{title}</h4>
            <p className="text-[11px] opacity-90 leading-relaxed">{desc}</p>
        </button>
    );
}

function defaultCompleteness(raw: any): CompletenessRow[] {
    const has = (key: string) => Boolean(raw?.[key]);
    return [
        { section: "vitals", label: "Sinh hiệu (Vitals)", complete: has("vitals") || has("hasVitals") },
        { section: "diagnosis", label: "Chẩn đoán + ICD-10", complete: has("diagnosis") || has("hasDiagnosis") },
        { section: "exam", label: "Khám lâm sàng", complete: has("examination") || has("hasExamination") },
        { section: "prescription", label: "Đơn thuốc / chỉ định", complete: has("prescription") || has("hasPrescription") },
        { section: "conclusion", label: "Kết luận chẩn đoán", complete: has("conclusion") || has("hasConclusion") },
    ];
}
