"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { encounterService } from "@/services/encounterService";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import { formatDate, formatTime } from "@/utils/formatters";

interface EncounterDetail {
    id: string;
    code: string;
    patientId: string;
    patientName: string;
    patientCode: string;
    patientPhone: string;
    patientGender: string;
    patientDob: string;
    doctorId: string;
    doctorName: string;
    departmentName: string;
    type: string;
    status: string;
    startedAt: string;
    appointmentId: string;
    appointmentDate: string;
    roomId: string;
    roomName: string;
    chiefComplaint: string;
    notes: string;
}

function mapDetail(e: any): EncounterDetail {
    return {
        id: String(e.id ?? e.encounters_id ?? e.encounter_id ?? ""),
        code: e.code ?? e.encounter_code ?? e.encounters_id ?? "",
        patientId: String(e.patientId ?? e.patient_id ?? e.patient?.id ?? ""),
        patientName: e.patientName ?? e.patient_name ?? e.patient?.fullName ?? e.patient?.full_name ?? "",
        patientCode: e.patientCode ?? e.patient_code ?? e.patient?.patient_code ?? e.patient?.patientCode ?? "",
        patientPhone: e.patientPhone ?? e.patient_phone ?? e.patient?.phone ?? e.patient?.phone_number ?? "",
        patientGender: e.patientGender ?? e.patient_gender ?? e.patient?.gender ?? "",
        patientDob: e.patientDob ?? e.patient_dob ?? e.patient?.dateOfBirth ?? e.patient?.date_of_birth ?? "",
        doctorId: String(e.doctorId ?? e.doctor_id ?? e.doctor?.id ?? ""),
        doctorName: e.doctorName ?? e.doctor_name ?? e.doctor?.fullName ?? e.doctor?.full_name ?? "",
        departmentName: e.departmentName ?? e.department_name ?? e.department?.name ?? e.specialty_name ?? "",
        type: e.type ?? e.encounter_type ?? "FIRST_VISIT",
        status: String(e.status ?? "OPEN").toUpperCase(),
        startedAt: e.startedAt ?? e.started_at ?? e.start_time ?? e.createdAt ?? e.created_at ?? "",
        appointmentId: String(e.appointmentId ?? e.appointment_id ?? ""),
        appointmentDate: e.appointmentDate ?? e.appointment?.appointment_date ?? "",
        roomId: String(e.roomId ?? e.room_id ?? e.room?.id ?? ""),
        roomName: e.roomName ?? e.room_name ?? e.room?.name ?? "",
        chiefComplaint: e.chiefComplaint ?? e.chief_complaint ?? e.reason ?? e.conclusion ?? "",
        notes: e.notes ?? e.note ?? "",
    };
}

const STATUS_META: Record<string, { label: string; gradient: string; text: string; icon: string }> = {
    DRAFT: { label: "Nháp", gradient: "from-gray-400 to-gray-500", text: "text-gray-700", icon: "edit" },
    OPEN: { label: "Đang mở", gradient: "from-blue-500 to-blue-600", text: "text-blue-700", icon: "lock_open" },
    IN_PROGRESS: { label: "Đang khám", gradient: "from-amber-500 to-orange-500", text: "text-amber-700", icon: "stethoscope" },
    COMPLETED: { label: "Hoàn tất", gradient: "from-emerald-500 to-green-600", text: "text-emerald-700", icon: "task_alt" },
    CANCELLED: { label: "Đã huỷ", gradient: "from-red-500 to-red-600", text: "text-red-700", icon: "cancel" },
};

const NAV_TILES = [
    { key: "exam", icon: "monitor_heart", label: "Khám lâm sàng", desc: "Vitals + ghi nhận lâm sàng + finalize", color: "from-pink-500 to-rose-500", path: (id: string) => `/portal/doctor/clinical-exam/${id}` },
    { key: "dx", icon: "diagnosis", label: "Chẩn đoán", desc: "Tra cứu ICD + danh sách diagnosis + kết luận", color: "from-violet-500 to-purple-600", path: (id: string) => `/portal/doctor/diagnosis/${id}` },
    { key: "rx", icon: "pill", label: "Đơn thuốc", desc: "Kê toa + cấp phát + lịch sử kê", color: "from-emerald-500 to-teal-600", path: (id: string) => `/portal/doctor/prescriptions?encounterId=${id}` },
    { key: "mr", icon: "medical_information", label: "Hồ sơ bệnh án", desc: "Tổng hợp + ký + xuất bản", color: "from-blue-500 to-indigo-600", path: (id: string) => `/portal/doctor/medical-records/${id}` },
];

export default function EncounterDetailPage() {
    const router = useRouter();
    const params = useParams();
    const encounterId = String(params?.id ?? "");
    const [detail, setDetail] = useState<EncounterDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const load = useCallback(async () => {
        if (!encounterId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await encounterService.getById(encounterId);
            setDetail(mapDetail(res));
        } catch {
            setError("Không tải được chi tiết phiên khám. Có thể encounter này không tồn tại hoặc bạn không có quyền xem.");
            setDetail(null);
        } finally {
            setLoading(false);
        }
    }, [encounterId]);

    useEffect(() => { load(); }, [load]);

    const handleChangeStatus = async (next: string) => {
        if (!detail) return;
        setUpdatingStatus(true);
        try {
            await encounterService.updateStatus(detail.id, next);
            await load();
        } catch {
            setError("Không cập nhật được trạng thái. Vui lòng thử lại.");
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-10 w-1/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="p-6">
                <EmptyState
                    icon="error"
                    variant="warning"
                    title="Không tìm thấy phiên khám"
                    description={error ?? "Encounter không tồn tại hoặc đã bị xoá."}
                    action={
                        <Link href="/portal/doctor/encounters" className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-[#3C81C6] hover:bg-[#3C81C6]/[0.08] rounded-xl">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                            Quay lại danh sách
                        </Link>
                    }
                />
            </div>
        );
    }

    const status = STATUS_META[detail.status] ?? STATUS_META.OPEN;

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={`Phiên khám${detail.code ? ` #${detail.code}` : ""}`}
                subtitle={detail.patientName ? `Bệnh nhân: ${detail.patientName}` : undefined}
                icon="medical_services"
                breadcrumbs={[
                    { label: "Cổng bác sĩ", href: "/portal/doctor" },
                    { label: "Phiên khám", href: "/portal/doctor/encounters" },
                    { label: detail.code || detail.id.slice(0, 8) },
                ]}
                actions={
                    <Link
                        href="/portal/doctor/encounters"
                        className="px-3 py-2 text-sm text-[#687582] dark:text-gray-400 hover:text-[#3C81C6] inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                        Danh sách
                    </Link>
                }
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            <div className={`bg-gradient-to-r ${status.gradient} rounded-2xl p-5 text-white shadow-md`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[28px]">{status.icon}</span>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider opacity-80">Trạng thái</p>
                            <h2 className="text-2xl font-bold">{status.label}</h2>
                            {detail.startedAt && (
                                <p className="text-xs opacity-90 mt-1">
                                    Bắt đầu: {formatDate(detail.startedAt)} {formatTime(detail.startedAt)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {detail.status === "OPEN" && (
                            <button
                                onClick={() => handleChangeStatus("IN_PROGRESS")}
                                disabled={updatingStatus}
                                className="px-4 py-2 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>play_arrow</span>
                                Bắt đầu khám
                            </button>
                        )}
                        {detail.status === "IN_PROGRESS" && (
                            <button
                                onClick={() => handleChangeStatus("COMPLETED")}
                                disabled={updatingStatus}
                                className="px-4 py-2 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>done_all</span>
                                Hoàn tất
                            </button>
                        )}
                        {(detail.status === "OPEN" || detail.status === "IN_PROGRESS") && (
                            <button
                                onClick={() => handleChangeStatus("CANCELLED")}
                                disabled={updatingStatus}
                                className="px-3 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cancel</span>
                                Huỷ
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5">
                    <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>person</span>
                        Bệnh nhân
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                        <InfoLine icon="badge" label="Họ tên" value={detail.patientName || "—"} primary />
                        <InfoLine icon="qr_code_2" label="Mã bệnh nhân" value={detail.patientCode || "—"} mono />
                        <InfoLine icon="phone" label="Điện thoại" value={detail.patientPhone || "—"} />
                        <InfoLine icon="cake" label="Ngày sinh" value={detail.patientDob ? formatDate(detail.patientDob) : "—"} />
                        <InfoLine icon="wc" label="Giới tính" value={detail.patientGender === "MALE" ? "Nam" : detail.patientGender === "FEMALE" ? "Nữ" : detail.patientGender || "—"} />
                        {detail.patientId && (
                            <div className="md:col-span-2">
                                <Link href={`/portal/doctor/ehr/${detail.patientId}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#3C81C6] bg-[#3C81C6]/[0.08] hover:bg-[#3C81C6]/[0.16] rounded-lg transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>folder_shared</span>
                                    Xem hồ sơ EHR
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5">
                    <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>medical_services</span>
                        Phụ trách
                    </h3>
                    <div className="space-y-3">
                        <InfoLine icon="stethoscope" label="Bác sĩ" value={detail.doctorName || "Chưa gán"} />
                        <InfoLine icon="local_hospital" label="Khoa" value={detail.departmentName || "—"} />
                        <InfoLine icon="meeting_room" label="Phòng" value={detail.roomName || "Chưa gán"} />
                        {detail.appointmentId && (
                            <InfoLine icon="event" label="Lịch hẹn" value={detail.appointmentDate ? formatDate(detail.appointmentDate) : `#${detail.appointmentId.slice(0, 8)}`} />
                        )}
                    </div>
                </div>
            </div>

            {(detail.chiefComplaint || detail.notes) && (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5">
                    <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>description</span>
                        Lý do khám / Ghi chú
                    </h3>
                    {detail.chiefComplaint && (
                        <div className="mb-3">
                            <p className="text-[11px] font-semibold text-[#687582] dark:text-gray-500 uppercase mb-1">Lý do khám</p>
                            <p className="text-sm text-[#121417] dark:text-white">{detail.chiefComplaint}</p>
                        </div>
                    )}
                    {detail.notes && (
                        <div>
                            <p className="text-[11px] font-semibold text-[#687582] dark:text-gray-500 uppercase mb-1">Ghi chú</p>
                            <p className="text-sm text-[#121417] dark:text-white whitespace-pre-line">{detail.notes}</p>
                        </div>
                    )}
                </div>
            )}

            <div>
                <h3 className="text-sm font-bold text-[#687582] dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>hub</span>
                    Hub điều hướng EMR
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {NAV_TILES.map((tile) => (
                        <button
                            key={tile.key}
                            onClick={() => router.push(tile.path(detail.id))}
                            className={`group bg-gradient-to-br ${tile.color} text-white rounded-2xl p-4 text-left shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "22px" }}>{tile.icon}</span>
                            </div>
                            <h4 className="font-bold text-sm mb-1">{tile.label}</h4>
                            <p className="text-[11px] opacity-90 leading-relaxed">{tile.desc}</p>
                            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold opacity-90 group-hover:opacity-100">
                                Mở
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_forward</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function InfoLine({ icon, label, value, primary, mono }: { icon: string; label: string; value: string; primary?: boolean; mono?: boolean }) {
    return (
        <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[#687582] dark:text-gray-500 mt-0.5" style={{ fontSize: "16px" }}>{icon}</span>
            <div className="min-w-0">
                <p className="text-[11px] text-[#687582] dark:text-gray-500 uppercase tracking-wider">{label}</p>
                <p className={`text-sm ${primary ? "font-semibold" : ""} ${mono ? "font-mono" : ""} text-[#121417] dark:text-white truncate`}>{value}</p>
            </div>
        </div>
    );
}
