"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { encounterService } from "@/services/encounterService";
import { PageHeader, StatCard, FilterBar, EmptyState } from "@/components/shared/layout";
import { EncounterCard } from "@/components/shared/cards/EncounterCard";
import { formatDate, formatTime } from "@/utils/formatters";

interface EncounterRow {
    id: string;
    code: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    departmentName: string;
    type: string;
    status: string;
    startedAt: string;
    diagnosis: string;
    icdCode: string;
    appointmentId: string;
    roomName: string;
}

function mapEncounter(e: any): EncounterRow {
    const rawStatus = String(e.status ?? e.encounter_status ?? "OPEN").toUpperCase();
    return {
        id: String(e.id ?? e.encounters_id ?? e.encounter_id ?? e.encounterId ?? ""),
        code: e.code ?? e.encounter_code ?? e.encounterCode ?? e.encounters_id ?? "",
        patientId: String(e.patientId ?? e.patient_id ?? e.patient?.id ?? ""),
        patientName: e.patientName ?? e.patient_name ?? e.patient?.fullName ?? e.patient?.full_name ?? "Bệnh nhân",
        doctorName: e.doctorName ?? e.doctor_name ?? e.doctor?.fullName ?? e.doctor?.full_name ?? "",
        departmentName: e.departmentName ?? e.department_name ?? e.department?.name ?? e.specialty_name ?? e.specialty ?? "",
        type: e.type ?? e.encounter_type ?? "FIRST_VISIT",
        status: rawStatus,
        startedAt: e.startedAt ?? e.started_at ?? e.start_time ?? e.visitDate ?? e.visit_date ?? e.createdAt ?? e.created_at ?? "",
        diagnosis: e.diagnosis ?? e.conclusion ?? e.chiefComplaint ?? e.chief_complaint ?? e.reason ?? "",
        icdCode: e.icdCode ?? e.icd_code ?? "",
        appointmentId: String(e.appointmentId ?? e.appointment_id ?? ""),
        roomName: e.roomName ?? e.room_name ?? e.room?.name ?? "",
    };
}

const STATUS_OPTIONS = [
    { value: "all", label: "Mọi trạng thái" },
    { value: "OPEN", label: "Đang mở" },
    { value: "IN_PROGRESS", label: "Đang khám" },
    { value: "COMPLETED", label: "Hoàn tất" },
    { value: "CANCELLED", label: "Đã huỷ" },
    { value: "DRAFT", label: "Nháp" },
];

const TYPE_OPTIONS = [
    { value: "all", label: "Mọi loại khám" },
    { value: "FIRST_VISIT", label: "Khám lần đầu" },
    { value: "FOLLOW_UP", label: "Tái khám" },
    { value: "EMERGENCY", label: "Cấp cứu" },
    { value: "CONSULTATION", label: "Tư vấn" },
    { value: "TELEMEDICINE", label: "Khám online" },
];

const STATUS_BADGE: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    OPEN: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    IN_PROGRESS: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    CANCELLED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
    DRAFT: "Nháp",
    OPEN: "Đang mở",
    IN_PROGRESS: "Đang khám",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã huỷ",
};

export default function DoctorEncountersPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [rows, setRows] = useState<EncounterRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"card" | "table">("card");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        encounterService
            .getList({ doctorId: user.id, limit: 100 })
            .then((res: any) => {
                if (cancelled) return;
                const items: any[] = res?.data?.items ?? res?.data ?? res ?? [];
                setRows(Array.isArray(items) ? items.map(mapEncounter) : []);
            })
            .catch(() => {
                if (cancelled) return;
                setError("Không tải được danh sách phiên khám. Hệ thống có thể đang bảo trì.");
                setRows([]);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user?.id]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (statusFilter !== "all" && r.status !== statusFilter) return false;
            if (typeFilter !== "all" && r.type !== typeFilter) return false;
            if (q) {
                const hay = `${r.patientName} ${r.code} ${r.diagnosis}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [rows, search, statusFilter, typeFilter]);

    const stats = useMemo(() => {
        const counters = { total: rows.length, inProgress: 0, completed: 0, open: 0 };
        for (const r of rows) {
            if (r.status === "IN_PROGRESS") counters.inProgress++;
            else if (r.status === "COMPLETED") counters.completed++;
            else if (r.status === "OPEN") counters.open++;
        }
        return counters;
    }, [rows]);

    const resetFilters = () => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Phiên khám (Encounter)"
                subtitle="Quản lý toàn bộ lượt tiếp nhận khám chữa bệnh"
                icon="medical_services"
                breadcrumbs={[
                    { label: "Cổng bác sĩ", href: "/portal/doctor" },
                    { label: "Phiên khám" },
                ]}
                actions={
                    <Link
                        href="/portal/doctor/queue"
                        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>queue</span>
                        Hàng đợi
                    </Link>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Tổng phiên khám" value={stats.total} icon="medical_services" color="blue" loading={loading} />
                <StatCard label="Đang mở" value={stats.open} icon="schedule" color="amber" loading={loading} />
                <StatCard label="Đang khám" value={stats.inProgress} icon="stethoscope" color="violet" loading={loading} />
                <StatCard label="Hoàn tất" value={stats.completed} icon="task_alt" color="emerald" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo tên bệnh nhân, mã encounter, chẩn đoán..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
                    { key: "status", label: "Trạng thái", options: STATUS_OPTIONS, value: statusFilter, onChange: setStatusFilter },
                    { key: "type", label: "Loại khám", options: TYPE_OPTIONS, value: typeFilter, onChange: setTypeFilter },
                ]}
                onReset={resetFilters}
                actions={
                    <div className="inline-flex bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl p-1">
                        <button
                            onClick={() => setViewMode("card")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${viewMode === "card" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] dark:text-gray-400"}`}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>grid_view</span>
                            Card
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${viewMode === "table" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] dark:text-gray-400"}`}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>table_rows</span>
                            Bảng
                        </button>
                    </div>
                }
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-44 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="medical_services"
                    title="Không có phiên khám phù hợp"
                    description={rows.length === 0 ? "Bạn chưa có phiên khám nào. Tạo encounter mới từ hàng đợi hoặc lịch hẹn." : "Thử thay đổi bộ lọc để xem nhiều kết quả hơn."}
                />
            ) : viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((r) => (
                        <EncounterCard
                            key={r.id}
                            code={r.code}
                            patientName={r.patientName}
                            doctorName={r.doctorName}
                            departmentName={r.departmentName}
                            type={r.type}
                            status={r.status}
                            startedAt={r.startedAt}
                            diagnosis={r.diagnosis}
                            icdCode={r.icdCode}
                            onOpen={() => router.push(`/portal/doctor/encounters/${r.id}`)}
                            onExamination={() => router.push(`/portal/doctor/clinical-exam/${r.id}`)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Mã</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Bệnh nhân</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Bác sĩ</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Phòng</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Thời điểm</th>
                                    <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Trạng thái</th>
                                    <th className="px-4 py-3 text-right font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#2d353e]">
                                {filtered.map((r) => (
                                    <tr key={r.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-[#687582] dark:text-gray-500">{r.code || "—"}</td>
                                        <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{r.patientName}</td>
                                        <td className="px-4 py-3 text-[#687582] dark:text-gray-400">{r.doctorName || "—"}</td>
                                        <td className="px-4 py-3 text-[#687582] dark:text-gray-400">{r.roomName || "—"}</td>
                                        <td className="px-4 py-3 text-[#687582] dark:text-gray-400 whitespace-nowrap">
                                            {r.startedAt ? <>{formatDate(r.startedAt)} <span className="text-[10px] opacity-70">{formatTime(r.startedAt)}</span></> : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-lg ${STATUS_BADGE[r.status] ?? STATUS_BADGE.OPEN}`}>
                                                {STATUS_LABEL[r.status] ?? r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/portal/doctor/encounters/${r.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#3C81C6] hover:bg-[#3C81C6]/[0.08] border border-[#3C81C6]/20 rounded-lg transition-colors"
                                            >
                                                Chi tiết
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_forward</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
