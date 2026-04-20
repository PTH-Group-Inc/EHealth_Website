"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axiosClient from "@/api/axiosClient";
import { DIAGNOSIS_ENDPOINTS } from "@/api/endpoints";
import { encounterService } from "@/services/encounterService";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import { IcdSearchInput } from "@/components/shared/forms/IcdSearchInput";
import { formatDate, formatTime } from "@/utils/formatters";

interface DiagnosisRow {
    id: string;
    code: string;
    description: string;
    type: string;
    notes: string;
    createdAt: string;
}

const DIAGNOSIS_TYPES = [
    { value: "PRIMARY", label: "Chẩn đoán chính", icon: "star", color: "text-violet-700 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800" },
    { value: "SECONDARY", label: "Chẩn đoán phụ", icon: "add_circle", color: "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
    { value: "DIFFERENTIAL", label: "Chẩn đoán phân biệt", icon: "compare_arrows", color: "text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
    { value: "PROVISIONAL", label: "Chẩn đoán sơ bộ", icon: "draft", color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700" },
];

function mapDiagnosis(d: any): DiagnosisRow {
    return {
        id: String(d.id ?? d.diagnosis_id ?? d.diagnosesId ?? ""),
        code: d.icdCode ?? d.icd_code ?? d.code ?? "",
        description: d.description ?? d.icd_description ?? d.icdDescription ?? "",
        type: String(d.type ?? d.diagnosis_type ?? d.diagnosisType ?? "PRIMARY").toUpperCase(),
        notes: d.notes ?? d.note ?? "",
        createdAt: d.createdAt ?? d.created_at ?? "",
    };
}

export default function DiagnosisPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const encounterId = String(params?.encounterId ?? "");

    const [encounter, setEncounter] = useState<any>(null);
    const [list, setList] = useState<DiagnosisRow[]>([]);
    const [conclusion, setConclusion] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingConclusion, setSavingConclusion] = useState(false);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [newCode, setNewCode] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newType, setNewType] = useState("PRIMARY");
    const [newNotes, setNewNotes] = useState("");

    const loadAll = useCallback(async () => {
        if (!encounterId) return;
        setLoading(true);
        setError(null);
        try {
            const [enc, dx, conc] = await Promise.allSettled([
                encounterService.getById(encounterId),
                encounterService.getDiagnoses(encounterId),
                axiosClient.get(DIAGNOSIS_ENDPOINTS.CONCLUSION(encounterId)).then((r) => r.data?.data ?? r.data),
            ]);
            if (enc.status === "fulfilled") setEncounter(enc.value);
            if (dx.status === "fulfilled") {
                const arr = Array.isArray(dx.value) ? dx.value : (dx.value?.data ?? dx.value?.items ?? []);
                setList(Array.isArray(arr) ? arr.map(mapDiagnosis) : []);
            }
            if (conc.status === "fulfilled") {
                const c = conc.value;
                setConclusion(typeof c === "string" ? c : (c?.conclusion ?? c?.text ?? ""));
            }
        } catch {
            setError("Không tải được dữ liệu chẩn đoán.");
        } finally {
            setLoading(false);
        }
    }, [encounterId]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const grouped = useMemo(() => {
        const map: Record<string, DiagnosisRow[]> = {};
        for (const t of DIAGNOSIS_TYPES) map[t.value] = [];
        for (const d of list) {
            (map[d.type] ?? (map[d.type] = [])).push(d);
        }
        return map;
    }, [list]);

    const handleAdd = async () => {
        if (!newCode || !newDescription) {
            toast.warning("Vui lòng chọn mã ICD-10 trước.");
            return;
        }
        setAdding(true);
        try {
            await encounterService.addDiagnosis(encounterId, {
                icdCode: newCode,
                icd_code: newCode,
                description: newDescription,
                icdDescription: newDescription,
                type: newType,
                diagnosis_type: newType,
                notes: newNotes,
            });
            toast.success("Đã thêm chẩn đoán.");
            setNewCode(""); setNewDescription(""); setNewNotes(""); setNewType("PRIMARY");
            await loadAll();
        } catch {
            toast.error("Không thêm được chẩn đoán. Vui lòng thử lại.");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn chắc chắn xoá chẩn đoán này?")) return;
        try {
            await axiosClient.delete(DIAGNOSIS_ENDPOINTS.DETAIL(id));
            toast.success("Đã xoá chẩn đoán.");
            await loadAll();
        } catch {
            toast.error("Không xoá được chẩn đoán.");
        }
    };

    const handleSaveConclusion = async () => {
        setSavingConclusion(true);
        try {
            await axiosClient.put(DIAGNOSIS_ENDPOINTS.CONCLUSION(encounterId), { conclusion });
            toast.success("Đã lưu kết luận chẩn đoán.");
        } catch {
            toast.error("Không lưu được kết luận.");
        } finally {
            setSavingConclusion(false);
        }
    };

    const patientName = encounter?.patientName ?? encounter?.patient_name ?? encounter?.patient?.fullName ?? encounter?.patient?.full_name ?? "";

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Chẩn đoán"
                subtitle={patientName ? `Bệnh nhân: ${patientName}` : "Quản lý ICD-10 + kết luận chẩn đoán cho phiên khám"}
                icon="diagnosis"
                breadcrumbs={[
                    { label: "Cổng bác sĩ", href: "/portal/doctor" },
                    { label: "Phiên khám", href: "/portal/doctor/encounters" },
                    { label: encounterId.slice(0, 8), href: `/portal/doctor/encounters/${encounterId}` },
                    { label: "Chẩn đoán" },
                ]}
                actions={
                    <Link
                        href={`/portal/doctor/encounters/${encounterId}`}
                        className="px-3 py-2 text-sm text-[#687582] dark:text-gray-400 hover:text-[#3C81C6] inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                        Hub phiên khám
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
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5">
                        <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>add_circle</span>
                            Thêm chẩn đoán mới
                        </h3>
                        <div className="space-y-3">
                            <IcdSearchInput
                                label="Mã ICD-10"
                                required
                                selectedCode={newCode}
                                selectedDescription={newDescription}
                                onSelect={(code, desc) => { setNewCode(code); setNewDescription(desc); }}
                                onClear={() => { setNewCode(""); setNewDescription(""); }}
                            />
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Loại chẩn đoán</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {DIAGNOSIS_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setNewType(t.value)}
                                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all inline-flex items-center justify-center gap-1.5 ${
                                                newType === t.value ? `${t.color} ring-2 ring-offset-1 dark:ring-offset-[#1e242b] ring-[#3C81C6]/30` : "bg-white dark:bg-[#13191f] border-[#dde0e4] dark:border-[#2d353e] text-[#687582] dark:text-gray-400 hover:border-[#3C81C6]/40"
                                            }`}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{t.icon}</span>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú (tuỳ chọn)</label>
                                <textarea
                                    value={newNotes}
                                    onChange={(e) => setNewNotes(e.target.value)}
                                    rows={2}
                                    placeholder="Mô tả thêm về tình trạng bệnh, mức độ, biến chứng..."
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={!newCode || adding}
                                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1"
                            >
                                {adding ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang thêm...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                                        Thêm chẩn đoán
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5">
                        <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>list_alt</span>
                            Danh sách chẩn đoán ({list.length})
                        </h3>
                        {loading ? (
                            <div className="space-y-2">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                                ))}
                            </div>
                        ) : list.length === 0 ? (
                            <EmptyState icon="diagnosis" title="Chưa có chẩn đoán" description="Thêm chẩn đoán đầu tiên bằng cách tra cứu ICD-10 ở trên." compact />
                        ) : (
                            <div className="space-y-4">
                                {DIAGNOSIS_TYPES.map((t) => grouped[t.value]?.length > 0 && (
                                    <div key={t.value}>
                                        <p className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md uppercase tracking-wider mb-2 ${t.color}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{t.icon}</span>
                                            {t.label}
                                        </p>
                                        <div className="space-y-2">
                                            {grouped[t.value].map((d) => (
                                                <div key={d.id} className="flex items-start justify-between gap-3 px-3 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl group">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-baseline gap-2 flex-wrap">
                                                            <span className="font-mono text-sm font-bold text-[#3C81C6]">{d.code}</span>
                                                            <span className="text-sm text-[#121417] dark:text-white">{d.description}</span>
                                                        </div>
                                                        {d.notes && (
                                                            <p className="text-xs text-[#687582] dark:text-gray-400 mt-1">{d.notes}</p>
                                                        )}
                                                        {d.createdAt && (
                                                            <p className="text-[11px] text-[#687582] dark:text-gray-500 mt-1 font-mono">
                                                                {formatDate(d.createdAt)} {formatTime(d.createdAt)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(d.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                        aria-label="Xoá"
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5">
                        <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>summarize</span>
                            Kết luận chẩn đoán
                        </h3>
                        <textarea
                            value={conclusion}
                            onChange={(e) => setConclusion(e.target.value)}
                            rows={8}
                            placeholder="Tóm tắt kết luận chẩn đoán cho phiên khám này..."
                            className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none"
                        />
                        <button
                            type="button"
                            onClick={handleSaveConclusion}
                            disabled={savingConclusion}
                            className="mt-3 w-full px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1"
                        >
                            {savingConclusion ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>
                                    Lưu kết luận
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-4">
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>tips_and_updates</span>
                            Hướng dẫn nhanh
                        </h4>
                        <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1.5 leading-relaxed">
                            <li>• Mỗi encounter chỉ có 1 chẩn đoán <b>chính</b>.</li>
                            <li>• Chẩn đoán <b>phụ</b> dùng cho bệnh kèm theo.</li>
                            <li>• Chẩn đoán <b>phân biệt</b> khi đang theo dõi.</li>
                            <li>• Lưu kết luận trước khi finalize hồ sơ bệnh án.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
