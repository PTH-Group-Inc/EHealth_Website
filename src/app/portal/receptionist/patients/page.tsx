"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getPatients, Patient, PatientGender, PatientStatus } from "@/services/patientService";

// ==================== HELPERS ====================
function fmtDob(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function calcAge(dob?: string): string {
    if (!dob) return "—";
    const d = new Date(dob);
    if (isNaN(d.getTime())) return "—";
    const age = new Date().getFullYear() - d.getFullYear();
    return String(age);
}

function fmtDate(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function getPrimaryAvatarUrl(patient: Patient): string {
    return Array.isArray(patient.avatar_url) ? patient.avatar_url[0]?.url || "" : "";
}

// ==================== TYPES ====================
interface FilterState {
    search: string;
    gender: string;
    status: string;
    hasInsurance: string;
    ageFrom: string;
    ageTo: string;
}

// ==================== PAGE ====================
export default function ReceptionistPatients() {
    const t = useTranslations("pages.portal.staff.patients");
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showFilter, setShowFilter] = useState(false);
    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [filter, setFilter] = useState<FilterState>({
        search: "",
        gender: "",
        status: "",
        hasInsurance: "",
        ageFrom: "",
        ageTo: "",
    });

    // Stats tính từ list hiện tại
    const withInsurance = patients.filter(p => {
        // Kiểm tra qua contact hoặc insurance array nếu có
        const ins = (p as any).insurance_number || (p as any).insurance;
        return ins && ins !== "" && ins !== null;
    }).length;
    const insurancePct = patients.length > 0 ? Math.round(withInsurance / patients.length * 100) : 0;

    const fetchPatients = useCallback(async (pg: number, f: FilterState) => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, any> = {
                page: pg,
                limit: 20,
            };
            if (f.search) params.search = f.search;
            if (f.gender) params.gender = f.gender as PatientGender;
            if (f.status) params.status = f.status as PatientStatus;
            if (f.ageFrom) params.ageFrom = Number(f.ageFrom);
            if (f.ageTo) params.ageTo = Number(f.ageTo);
            if (f.hasInsurance === "yes") params.hasInsurance = true;
            if (f.hasInsurance === "no") params.hasInsurance = false;

            const res = await getPatients(params);
            const items: Patient[] = res?.data?.items ?? (res as any)?.data ?? [];
            const pag = res?.data?.pagination;
            setPatients(items);
            setTotalPages(pag?.total_pages ?? 1);
            setTotalItems(pag?.total_items ?? items.length);
        } catch {
            setError("Không thể tải danh sách bệnh nhân. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchPatients(1, filter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearchChange = (val: string) => {
        setFilter(f => ({ ...f, search: val }));
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        searchDebounce.current = setTimeout(() => {
            setPage(1);
            fetchPatients(1, { ...filter, search: val });
        }, 400);
    };

    const handleFilterChange = (key: keyof FilterState, val: string) => {
        const updated = { ...filter, [key]: val };
        setFilter(updated);
        if (key !== "search") {
            setPage(1);
            fetchPatients(1, updated);
        }
    };

    const handlePageChange = (pg: number) => {
        setPage(pg);
        fetchPatients(pg, filter);
    };

    const handleExportCSV = () => {
        const headers = ["Mã BN", "Họ tên", "Ngày sinh", "Giới tính", "Trạng thái", "Ngày đăng ký"];
        const rows = patients.map(p => [
            p.patient_code ?? p.patient_id,
            p.full_name,
            fmtDob(p.date_of_birth),
            p.gender === "MALE" ? "Nam" : p.gender === "FEMALE" ? "Nữ" : p.gender,
            p.status,
            fmtDate(p.created_at),
        ]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "danh-sach-benh-nhan.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    const resetFilter = () => {
        const def: FilterState = { search: "", gender: "", status: "", hasInsurance: "", ageFrom: "", ageTo: "" };
        setFilter(def);
        setPage(1);
        fetchPatients(1, def);
    };

    const genderLabel = (g: string) => g === "MALE" ? "Nam" : g === "FEMALE" ? "Nữ" : g === "OTHER" ? "Khác" : "—";
    const statusLabel = (s: string) => {
        if (s === "ACTIVE") return { label: "Hoạt động", cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" };
        if (s === "INACTIVE") return { label: "Ngưng", cls: "bg-gray-100 dark:bg-gray-700 text-gray-600" };
        if (s === "DECEASED") return { label: "Đã mất", cls: "bg-red-50 dark:bg-red-500/10 text-red-600" };
        return { label: s, cls: "bg-gray-100 text-gray-600" };
    };

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500 mb-2">
                            <span className="material-symbols-outlined text-[14px]">home</span>
                            <span>Trang chủ</span>
                            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                            <span className="text-[#121417] dark:text-white font-medium">Bệnh nhân</span>
                        </div>
                        <h1 className="text-2xl font-bold text-[#121417] dark:text-white">{t("title")}</h1>
                        <p className="text-sm text-[#687582] mt-1">Tổng cộng {totalItems.toLocaleString("vi-VN")} hồ sơ</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-medium text-[#687582] hover:text-[#121417] dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>Xuất CSV
                        </button>
                        <button onClick={() => router.push('/portal/receptionist/patients/new')} className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#3C81C6]/20">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>Đăng ký BN mới
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { l: "Tổng bệnh nhân", v: totalItems.toLocaleString("vi-VN"), i: "groups", c: "from-blue-500 to-blue-600" },
                        { l: "Trang hiện tại", v: `${patients.length} hồ sơ`, i: "person", c: "from-emerald-500 to-emerald-600" },
                        { l: "Có BHYT (trang này)", v: patients.length > 0 ? `${insurancePct}%` : "—", i: "health_and_safety", c: "from-violet-500 to-violet-600" },
                    ].map((s) => (
                        <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5 flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center flex-shrink-0`}>
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "22px" }}>{s.i}</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#121417] dark:text-white">{s.v}</p>
                                <p className="text-sm text-[#687582]">{s.l}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter & Search */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="p-4 flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>search</span>
                            <input
                                type="text"
                                placeholder="Tìm tên, mã BN, SĐT, CCCD..."
                                value={filter.search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] dark:text-white"
                            />
                        </div>
                        {/* Quick filters */}
                        <select
                            value={filter.gender}
                            onChange={(e) => handleFilterChange("gender", e.target.value)}
                            className="px-3 py-2.5 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm text-[#687582] dark:text-gray-300 outline-none focus:border-[#3C81C6] min-w-[120px]"
                        >
                            <option value="">Giới tính</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                            <option value="OTHER">Khác</option>
                        </select>
                        <select
                            value={filter.status}
                            onChange={(e) => handleFilterChange("status", e.target.value)}
                            className="px-3 py-2.5 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm text-[#687582] dark:text-gray-300 outline-none focus:border-[#3C81C6] min-w-[130px]"
                        >
                            <option value="">Trạng thái</option>
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Ngưng</option>
                            <option value="DECEASED">Đã mất</option>
                        </select>
                        <button
                            onClick={() => setShowFilter(v => !v)}
                            className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors ${showFilter ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-[#f6f7f8] dark:bg-[#13191f] border-[#dde0e4] dark:border-[#2d353e] text-[#687582] dark:text-gray-300 hover:border-[#3C81C6]"}`}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>tune</span>
                            Lọc nâng cao
                        </button>
                        {(filter.search || filter.gender || filter.status || filter.hasInsurance || filter.ageFrom || filter.ageTo) && (
                            <button onClick={resetFilter} className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors border border-red-200 dark:border-red-500/20">
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>restart_alt</span>Xóa lọc
                            </button>
                        )}
                    </div>

                    {/* Advanced Filter Panel */}
                    {showFilter && (
                        <div className="px-4 pb-4 pt-0 border-t border-[#dde0e4] dark:border-[#2d353e] grid grid-cols-2 md:grid-cols-4 gap-3 mt-0 pt-3">
                            <div>
                                <label className="block text-xs font-medium text-[#687582] mb-1.5">BHYT</label>
                                <select
                                    value={filter.hasInsurance}
                                    onChange={(e) => handleFilterChange("hasInsurance", e.target.value)}
                                    className="w-full px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm dark:text-white outline-none focus:border-[#3C81C6]"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="yes">Có BHYT</option>
                                    <option value="no">Không có BHYT</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#687582] mb-1.5">Tuổi từ</label>
                                <input
                                    type="number" min={0} max={150}
                                    value={filter.ageFrom}
                                    onChange={(e) => handleFilterChange("ageFrom", e.target.value)}
                                    placeholder="VD: 18"
                                    className="w-full px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm dark:text-white outline-none focus:border-[#3C81C6]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#687582] mb-1.5">Tuổi đến</label>
                                <input
                                    type="number" min={0} max={150}
                                    value={filter.ageTo}
                                    onChange={(e) => handleFilterChange("ageTo", e.target.value)}
                                    placeholder="VD: 60"
                                    className="w-full px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm dark:text-white outline-none focus:border-[#3C81C6]"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => fetchPatients(1, filter)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>search</span>
                                    Áp dụng
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-[#687582]">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <span className="material-symbols-outlined text-red-400 text-[40px]">error_outline</span>
                            <p className="text-sm text-red-500">{error}</p>
                            <button onClick={() => fetchPatients(page, filter)} className="text-sm text-[#3C81C6] hover:underline">Thử lại</button>
                        </div>
                    )}

                    {/* Table Content */}
                    {!loading && !error && (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-[#dde0e4] dark:border-[#2d353e] bg-[#f6f7f8] dark:bg-[#13191f]">
                                            {["Mã BN", "Họ tên", "Ngày sinh / Tuổi", "Giới tính", "Trạng thái", "Ngày đăng ký", "Thao tác"].map((h) => (
                                                <th key={h} className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0f1f3] dark:divide-[#2d353e]">
                                        {patients.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-16 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <span className="material-symbols-outlined text-[#dde0e4] text-[48px]">person_search</span>
                                                        <p className="text-sm text-[#687582]">Không tìm thấy bệnh nhân nào</p>
                                                        {(filter.search || filter.gender || filter.status) && (
                                                            <button onClick={resetFilter} className="text-sm text-[#3C81C6] hover:underline">Xóa bộ lọc</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            patients.map((p) => {
                                                const st = statusLabel(p.status);
                                                return (
                                                    <tr key={p.patient_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-mono text-[#3C81C6] font-medium">
                                                            {p.patient_code ?? p.patient_id}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#2a6da8] text-sm font-semibold text-white">
                                                                    {getPrimaryAvatarUrl(p) ? (
                                                                        <img src={getPrimaryAvatarUrl(p)} alt={p.full_name} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        p.full_name.charAt(0)
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-[#121417] dark:text-white">{p.full_name}</p>
                                                                    {p.identity_number && (
                                                                        <p className="text-xs text-[#687582]">CCCD: {p.identity_number}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm text-[#121417] dark:text-white">{fmtDob(p.date_of_birth)}</p>
                                                            <p className="text-xs text-[#687582]">{calcAge(p.date_of_birth)} tuổi</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-[#121417] dark:text-white">{genderLabel(p.gender)}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>
                                                                {st.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-[#687582]">{fmtDate(p.created_at)}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => router.push(`/portal/receptionist/patients/${p.patient_id}`)}
                                                                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors"
                                                                    title="Xem hồ sơ"
                                                                >
                                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => router.push(`/portal/receptionist/patients/${p.patient_id}`)}
                                                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#687582] transition-colors"
                                                                    title="Sửa thông tin"
                                                                >
                                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => router.push('/portal/receptionist/appointments/new')}
                                                                    className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 transition-colors"
                                                                    title="Đặt lịch hẹn"
                                                                >
                                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>event_available</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-4 py-3 border-t border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                                    <p className="text-sm text-[#687582]">
                                        Trang {page} / {totalPages} — {totalItems.toLocaleString("vi-VN")} bệnh nhân
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            disabled={page <= 1}
                                            onClick={() => handlePageChange(page - 1)}
                                            className="p-1.5 rounded-lg border border-[#dde0e4] dark:border-[#2d353e] text-[#687582] disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span>
                                        </button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pg = page <= 3 ? i + 1 : page + i - 2;
                                            if (pg < 1 || pg > totalPages) return null;
                                            return (
                                                <button
                                                    key={pg}
                                                    onClick={() => handlePageChange(pg)}
                                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pg === page ? "bg-[#3C81C6] text-white" : "text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 border border-[#dde0e4] dark:border-[#2d353e]"}`}
                                                >
                                                    {pg}
                                                </button>
                                            );
                                        })}
                                        <button
                                            disabled={page >= totalPages}
                                            onClick={() => handlePageChange(page + 1)}
                                            className="p-1.5 rounded-lg border border-[#dde0e4] dark:border-[#2d353e] text-[#687582] disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {totalPages <= 1 && (
                                <div className="px-4 py-3 border-t border-[#dde0e4] dark:border-[#2d353e] text-sm text-[#687582]">
                                    Hiển thị {patients.length} / {totalItems} bệnh nhân
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
