"use client";

/**
 * EncounterCard — card encounter (lần khám) cho doctor portal + EHR timeline.
 */

import { formatDate, formatTime } from "@/utils/formatters";

const STATUS_STYLE: Record<string, { badge: string; label: string }> = {
    DRAFT: { badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", label: "Nháp" },
    OPEN: { badge: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", label: "Đang mở" },
    IN_PROGRESS: { badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", label: "Đang khám" },
    COMPLETED: { badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", label: "Hoàn tất" },
    CANCELLED: { badge: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300", label: "Huỷ" },
};

const TYPE_LABEL: Record<string, { label: string; icon: string }> = {
    FIRST_VISIT: { label: "Khám lần đầu", icon: "person_add" },
    FOLLOW_UP: { label: "Tái khám", icon: "refresh" },
    EMERGENCY: { label: "Cấp cứu", icon: "emergency" },
    CONSULTATION: { label: "Tư vấn", icon: "chat" },
    TELEMEDICINE: { label: "Khám online", icon: "video_call" },
};

export interface EncounterCardProps {
    code?: string;
    patientName?: string;
    doctorName?: string;
    departmentName?: string;
    type?: string;
    status?: string;
    startedAt?: string;
    diagnosis?: string;
    icdCode?: string;
    onOpen?: () => void;
    onExamination?: () => void;
    onFinalize?: () => void;
}

export function EncounterCard({
    code,
    patientName,
    doctorName,
    departmentName,
    type = "FIRST_VISIT",
    status = "OPEN",
    startedAt,
    diagnosis,
    icdCode,
    onOpen,
    onExamination,
    onFinalize,
}: EncounterCardProps) {
    const s = STATUS_STYLE[status] ?? STATUS_STYLE.OPEN;
    const t = TYPE_LABEL[type] ?? { label: type, icon: "medical_services" };

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md hover:border-[#3C81C6]/40 transition-all group">
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{t.icon}</span>
                        </div>
                        <div className="min-w-0">
                            {code && <p className="text-[11px] font-mono text-[#687582] dark:text-gray-500">#{code}</p>}
                            <h3 className="font-semibold text-sm text-[#121417] dark:text-white truncate">{patientName || t.label}</h3>
                        </div>
                    </div>
                    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-lg ${s.badge} flex-shrink-0`}>
                        {s.label}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#687582] dark:text-gray-400 mb-3">
                    {doctorName && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: "14px" }}>stethoscope</span>
                            <span className="truncate">{doctorName}</span>
                        </div>
                    )}
                    {departmentName && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: "14px" }}>local_hospital</span>
                            <span className="truncate">{departmentName}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: "14px" }}>category</span>
                        <span className="truncate">{t.label}</span>
                    </div>
                    {startedAt && (
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: "14px" }}>schedule</span>
                            <span className="truncate">{formatDate(startedAt)} {formatTime(startedAt)}</span>
                        </div>
                    )}
                </div>

                {diagnosis && (
                    <div className="py-2 px-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg mb-3">
                        <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>diagnosis</span>
                            Chẩn đoán {icdCode && <span className="font-mono opacity-70">({icdCode})</span>}
                        </p>
                        <p className="text-xs text-[#121417] dark:text-white line-clamp-2">{diagnosis}</p>
                    </div>
                )}

                {(onOpen || onExamination || onFinalize) && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50 dark:border-gray-800">
                        {onExamination && (status === "OPEN" || status === "IN_PROGRESS") && (
                            <button onClick={onExamination}
                                className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#3C81C6] hover:bg-[#2b6cb0] rounded-lg transition-colors inline-flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>medical_services</span>
                                Khám
                            </button>
                        )}
                        {onFinalize && status === "IN_PROGRESS" && (
                            <button onClick={onFinalize}
                                className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg transition-colors inline-flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>done_all</span>
                                Hoàn tất
                            </button>
                        )}
                        {onOpen && (
                            <button onClick={onOpen}
                                className="px-3 py-1.5 text-xs font-medium text-[#3C81C6] hover:bg-[#3C81C6]/[0.08] border border-[#3C81C6]/20 rounded-lg transition-colors">
                                Chi tiết
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EncounterCard;
