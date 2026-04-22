"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ROLE_LABELS, ROLE_COLORS, type Role } from "@/constants/roles";
import { staffService, type StaffMember } from "@/services/staffService";
import { staffScheduleService, type StaffSchedule } from "@/services/staffScheduleService";
import { licenseService, type License } from "@/services/licenseService";
import axiosClient from "@/api/axiosClient";
import { STAFF_MANAGEMENT_ENDPOINTS } from "@/api/endpoints";

// ─── helpers ───────────────────────────────────────────────────────────────
function fmt(iso?: string) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch { return iso; }
}

function fmtDateTime(iso?: string) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
}

// ─── tab config ────────────────────────────────────────────────────────────
const TABS = [
    { key: "nhansu",       label: "Thông tin nhân sự",       icon: "badge" },
    { key: "chuyen-mon",   label: "Chuyên môn",               icon: "workspace_premium" },
    { key: "lich-lam-viec", label: "Lịch làm việc",           icon: "calendar_month" },
    { key: "phan-cong",    label: "Phân công & Vai trò",       icon: "account_tree" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// ─── schedule status helpers ────────────────────────────────────────────────
const SCHEDULE_STATUS_MAP: Record<string, { label: string; cls: string }> = {
    SCHEDULED:  { label: "Đã lên lịch",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    ON_DUTY:    { label: "Đang trực",    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    COMPLETED:  { label: "Hoàn thành",   cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
    SUSPENDED:  { label: "Tạm dừng",     cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    LEAVE:      { label: "Nghỉ phép",    cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

const LICENSE_STATUS_MAP: Record<string, { label: string; cls: string; icon: string }> = {
    ACTIVE:   { label: "Còn hiệu lực", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: "verified" },
    EXPIRING: { label: "Sắp hết hạn",  cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: "warning" },
    EXPIRED:  { label: "Hết hạn",      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: "gpp_bad" },
    REVOKED:  { label: "Đã thu hồi",   cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300", icon: "cancel" },
};

// ─── shared ui ─────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon }: { label: string; value?: string | number; icon: string }) {
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="material-symbols-outlined text-[18px] text-[#687582] shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-[#687582] dark:text-gray-400">{label}</p>
                <p className="text-sm font-medium text-[#121417] dark:text-white truncate">{value || "—"}</p>
            </div>
        </div>
    );
}

function Card({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#121417] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3C81C6] text-[20px]">{icon}</span>
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </div>
    );
}

function TabSpinner() {
    return (
        <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin" />
        </div>
    );
}

// ─── Tab: Thông tin nhân sự ─────────────────────────────────────────────────
function NhanSuTab({ staff }: { staff: StaffMember }) {
    const roleKey = (staff.role || "").toUpperCase() as Role;
    const roleColor = ROLE_COLORS[roleKey] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
    const statusColor = staff.status === "ACTIVE"
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : staff.status === "INACTIVE"
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    const statusLabel = staff.status === "ACTIVE" ? "Đang hoạt động" : staff.status === "INACTIVE" ? "Tạm ngừng" : "Đã khóa";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Hồ sơ cơ bản" icon="person">
                <InfoRow label="Họ và tên" value={staff.fullName} icon="person" />
                <InfoRow label="Email" value={staff.email} icon="email" />
                <InfoRow label="Số điện thoại" value={staff.phone} icon="phone" />
                <InfoRow label="Giới tính" value={staff.gender} icon="wc" />
                <InfoRow label="Ngày sinh" value={fmt(staff.dateOfBirth)} icon="cake" />
                <InfoRow label="Trình độ" value={staff.qualification} icon="school" />
            </Card>

            <Card title="Thông tin tài khoản" icon="manage_accounts">
                <InfoRow label="Mã nhân viên" value={staff.code || `NV${String(staff.id).padStart(5, "0")}`} icon="fingerprint" />
                <InfoRow label="Ngày tạo" value={fmt(staff.createdAt)} icon="event" />
                <InfoRow label="Cập nhật lần cuối" value={fmt(staff.updatedAt)} icon="update" />
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <span className="material-symbols-outlined text-[18px] text-[#687582] shrink-0">toggle_on</span>
                    <div className="flex-1">
                        <p className="text-xs text-[#687582] dark:text-gray-400">Trạng thái</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${statusColor}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {statusLabel}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <span className="material-symbols-outlined text-[18px] text-[#687582] shrink-0">shield_person</span>
                    <div className="flex-1">
                        <p className="text-xs text-[#687582] dark:text-gray-400">Vai trò</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium mt-0.5 ${roleColor.bg} ${roleColor.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot} mr-1.5`} />
                            {ROLE_LABELS[roleKey] || staff.role}
                        </span>
                    </div>
                </div>
            </Card>

            <Card title="Chuyên khoa & Phòng ban" icon="domain">
                <InfoRow label="Chuyên khoa" value={staff.specialization} icon="stethoscope" />
                <InfoRow label="Phòng ban" value={staff.departmentName} icon="domain" />
                <InfoRow label="Kinh nghiệm" value={staff.experience ? `${staff.experience} năm` : undefined} icon="work_history" />
                <InfoRow label="Đánh giá" value={staff.rating ? `${staff.rating} / 5` : undefined} icon="star" />
            </Card>

            {staff.bio && (
                <Card title="Giới thiệu bản thân" icon="article">
                    <p className="text-sm text-[#687582] dark:text-gray-400 leading-relaxed">{staff.bio}</p>
                </Card>
            )}
        </div>
    );
}

// ─── Tab: Chuyên môn ────────────────────────────────────────────────────────
function ChuyenMonTab({ staffId }: { staffId: string }) {
    const [doctorInfo, setDoctorInfo] = useState<any>(null);
    const [licenses, setLicenses] = useState<License[]>([]);
    const [sigUrl, setSigUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLicenseModal, setShowLicenseModal] = useState(false);
    const [editingLicense, setEditingLicense] = useState<License | null>(null);
    const [licenseForm, setLicenseForm] = useState<Partial<License>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.allSettled([
            axiosClient.get(STAFF_MANAGEMENT_ENDPOINTS.DOCTOR_INFO(staffId)).catch(() => null),
            axiosClient.get(STAFF_MANAGEMENT_ENDPOINTS.LICENSES(staffId)).catch(() => null),
            axiosClient.get(STAFF_MANAGEMENT_ENDPOINTS.SIGNATURE(staffId)).catch(() => null),
        ]).then(([diRes, licRes, sigRes]) => {
            if (diRes.status === "fulfilled" && diRes.value) {
                const d = diRes.value?.data?.data ?? diRes.value?.data;
                setDoctorInfo(d);
            }
            if (licRes.status === "fulfilled" && licRes.value) {
                const d = licRes.value?.data?.data ?? licRes.value?.data ?? [];
                setLicenses(Array.isArray(d) ? d : []);
            }
            if (sigRes.status === "fulfilled" && sigRes.value) {
                const d = sigRes.value?.data?.data ?? sigRes.value?.data;
                if (d?.url || d?.signature_url) setSigUrl(d.url ?? d.signature_url);
            }
        }).finally(() => setLoading(false));
    }, [staffId]);

    const openAdd = () => { setEditingLicense(null); setLicenseForm({}); setShowLicenseModal(true); };
    const openEdit = (lic: License) => { setEditingLicense(lic); setLicenseForm(lic); setShowLicenseModal(true); };
    const closeLicenseModal = () => setShowLicenseModal(false);

    const saveLicense = async () => {
        setSaving(true);
        try {
            if (editingLicense) {
                const updated = await licenseService.update(editingLicense.id, licenseForm);
                setLicenses((prev) => prev.map((l) => l.id === updated.id ? updated : l));
            } else {
                const created = await axiosClient.post(STAFF_MANAGEMENT_ENDPOINTS.CREATE_LICENSE(staffId), licenseForm)
                    .then((r) => r.data?.data ?? r.data);
                if (created) setLicenses((prev) => [...prev, created]);
            }
            closeLicenseModal();
        } catch { /* keep modal open */ }
        finally { setSaving(false); }
    };

    const deleteLicense = async (id: string) => {
        if (!confirm("Xóa giấy phép này?")) return;
        try {
            await axiosClient.delete(STAFF_MANAGEMENT_ENDPOINTS.DELETE_LICENSE(staffId, id));
            setLicenses((prev) => prev.filter((l) => l.id !== id));
        } catch { /* ignore */ }
    };

    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        try {
            const res = await axiosClient.patch(STAFF_MANAGEMENT_ENDPOINTS.SIGNATURE(staffId), fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const d = res.data?.data ?? res.data;
            if (d?.url || d?.signature_url) setSigUrl(d.url ?? d.signature_url);
        } catch { /* ignore */ }
    };

    if (loading) return <TabSpinner />;

    return (
        <div className="space-y-6">
            {/* Doctor info */}
            <Card title="Thông tin bác sĩ" icon="stethoscope">
                {doctorInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        <InfoRow label="Chuyên khoa" value={doctorInfo.specialty_name ?? doctorInfo.specialty} icon="stethoscope" />
                        <InfoRow label="Học hàm / Học vị" value={doctorInfo.title ?? doctorInfo.doctor_title} icon="military_tech" />
                        <InfoRow label="Phí tư vấn" value={doctorInfo.consultation_fee ? `${Number(doctorInfo.consultation_fee).toLocaleString("vi-VN")} ₫` : undefined} icon="payments" />
                        <InfoRow label="Số năm kinh nghiệm" value={doctorInfo.years_of_experience ?? doctorInfo.experience} icon="work_history" />
                        {doctorInfo.biography && (
                            <div className="col-span-full py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                <p className="text-xs text-[#687582] dark:text-gray-400 mb-1">Tiểu sử</p>
                                <p className="text-sm text-[#121417] dark:text-white leading-relaxed">{doctorInfo.biography}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-[#687582] dark:text-gray-400 text-center py-6">Chưa có thông tin bác sĩ.</p>
                )}
            </Card>

            {/* Licenses */}
            <Card title="Giấy phép & Chứng chỉ" icon="verified" action={
                <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3C81C6] text-white rounded-lg text-xs font-bold hover:bg-[#2a6da8] transition-colors">
                    <span className="material-symbols-outlined text-[16px]">add</span> Thêm
                </button>
            }>
                {licenses.length === 0 ? (
                    <p className="text-sm text-[#687582] dark:text-gray-400 text-center py-6">Chưa có giấy phép hành nghề.</p>
                ) : (
                    <div className="space-y-3">
                        {licenses.map((lic) => {
                            const st = LICENSE_STATUS_MAP[lic.status ?? "ACTIVE"] ?? LICENSE_STATUS_MAP.ACTIVE;
                            return (
                                <div key={lic.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${st.cls}`}>
                                            <span className="material-symbols-outlined text-[20px]">{st.icon}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[#121417] dark:text-white truncate">{lic.licenseType || "Giấy phép hành nghề"}</p>
                                            <p className="text-xs text-[#687582] dark:text-gray-400">Số: {lic.licenseNumber} • Cấp: {fmt(lic.issuedDate)}</p>
                                            {lic.issuedBy && <p className="text-xs text-[#687582] dark:text-gray-500">Cơ quan: {lic.issuedBy}</p>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                                        <p className="text-xs text-[#687582]">HSD: {fmt(lic.expiryDate)}</p>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openEdit(lic)} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[#687582] hover:text-[#3C81C6] transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                            <button onClick={() => deleteLicense(lic.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[#687582] hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Signature */}
            <Card title="Chữ ký chuyên môn" icon="draw">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-48 h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden shrink-0">
                        {sigUrl ? (
                            <img src={sigUrl} alt="Chữ ký" className="object-contain w-full h-full p-2" />
                        ) : (
                            <div className="flex flex-col items-center text-gray-300 dark:text-gray-600">
                                <span className="material-symbols-outlined text-3xl">signature</span>
                                <p className="text-xs mt-1">Chưa có</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400 mb-3">Upload ảnh chữ ký định dạng PNG/JPG (nền trắng hoặc trong suốt).</p>
                        <label className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors cursor-pointer w-fit">
                            <span className="material-symbols-outlined text-[18px]">upload</span>
                            {sigUrl ? "Cập nhật chữ ký" : "Tải lên chữ ký"}
                            <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                        </label>
                    </div>
                </div>
            </Card>

            {/* License modal */}
            {showLicenseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h3 className="font-bold text-[#121417] dark:text-white">
                                {editingLicense ? "Chỉnh sửa giấy phép" : "Thêm giấy phép"}
                            </h3>
                            <button onClick={closeLicenseModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {([
                                { key: "licenseNumber", label: "Số giấy phép *", type: "text" },
                                { key: "licenseType", label: "Loại giấy phép", type: "text" },
                                { key: "issuedBy", label: "Cơ quan cấp", type: "text" },
                                { key: "issuedDate", label: "Ngày cấp", type: "date" },
                                { key: "expiryDate", label: "Ngày hết hạn", type: "date" },
                                { key: "note", label: "Ghi chú", type: "text" },
                            ] as const).map(({ key, label, type }) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">{label}</label>
                                    <input
                                        type={type}
                                        value={(licenseForm as any)[key] ?? ""}
                                        onChange={(e) => setLicenseForm((f) => ({ ...f, [key]: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#13191f] text-sm text-[#121417] dark:text-white focus:outline-none focus:border-[#3C81C6] transition-colors"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button onClick={closeLicenseModal} className="flex-1 px-4 py-2.5 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                Hủy
                            </button>
                            <button onClick={saveLicense} disabled={saving || !licenseForm.licenseNumber} className="flex-1 px-4 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] disabled:opacity-50 transition-colors">
                                {saving ? "Đang lưu…" : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab: Lịch làm việc ─────────────────────────────────────────────────────
function LichLamViecTab({ staffId }: { staffId: string }) {
    const today = new Date();
    const [viewMode, setViewMode] = useState<"week" | "month">("week");
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState<{ workDate: string; shiftName: string; startTime: string; endTime: string; note: string }>({
        workDate: "", shiftName: "", startTime: "", endTime: "", note: "",
    });

    const reload = () => {
        setLoading(true);
        const from = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const to = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
        staffScheduleService.getByStaff(staffId, { from, to })
            .then((res) => setSchedules(Array.isArray(res) ? res : (res as any)?.data ?? []))
            .catch(() => setSchedules([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { reload(); }, [staffId, year, month]);

    const handleSuspend = async (id: string) => {
        setActionLoading(id + "-suspend");
        try {
            await staffScheduleService.suspend(id);
            setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, status: "SUSPENDED" } : s));
        } finally { setActionLoading(null); }
    };

    const handleResume = async (id: string) => {
        setActionLoading(id + "-resume");
        try {
            await staffScheduleService.resume(id);
            setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, status: "SCHEDULED" } : s));
        } finally { setActionLoading(null); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xóa ca trực này?")) return;
        setActionLoading(id + "-delete");
        try {
            await staffScheduleService.delete(id);
            setSchedules((prev) => prev.filter((s) => s.id !== id));
        } finally { setActionLoading(null); }
    };

    const handleCreate = async () => {
        if (!createForm.workDate) return;
        try {
            const created = await staffScheduleService.create({ staffId, ...createForm });
            if (created) setSchedules((prev) => [...prev, created as StaffSchedule]);
            setShowCreateModal(false);
        } catch { /* ignore */ }
    };

    const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

    // Build calendar grid for month view
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate();
    const calStart = (firstDay + 6) % 7; // Monday-based

    const scheduleByDate: Record<string, StaffSchedule[]> = {};
    for (const s of schedules) {
        const d = s.workDate?.split("T")[0];
        if (d) (scheduleByDate[d] = scheduleByDate[d] || []).push(s);
    }

    const monthNames = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
    const dayNames = ["T2","T3","T4","T5","T6","T7","CN"];

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 rounded-lg border border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <span className="text-sm font-bold text-[#121417] dark:text-white min-w-[120px] text-center">
                        {monthNames[month - 1]} {year}
                    </span>
                    <button onClick={nextMonth} className="p-2 rounded-lg border border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl overflow-hidden border border-[#dde0e4] dark:border-[#2d353e]">
                        {(["week", "month"] as const).map((m) => (
                            <button key={m} onClick={() => setViewMode(m)}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === m ? "bg-[#3C81C6] text-white" : "text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                                {m === "week" ? "Tuần" : "Tháng"}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3C81C6] text-white rounded-xl text-xs font-bold hover:bg-[#2a6da8] transition-colors">
                        <span className="material-symbols-outlined text-[16px]">add</span> Tạo ca
                    </button>
                </div>
            </div>

            {loading ? <TabSpinner /> : (
                <>
                    {/* Calendar (month view) */}
                    {viewMode === "month" && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                            <div className="grid grid-cols-7 border-b border-[#dde0e4] dark:border-[#2d353e]">
                                {dayNames.map((d) => (
                                    <div key={d} className="py-3 text-center text-xs font-bold text-[#687582] dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7">
                                {Array.from({ length: calStart }).map((_, i) => (
                                    <div key={`empty-${i}`} className="h-24 border-b border-r border-[#dde0e4] dark:border-[#2d353e] bg-gray-50/50 dark:bg-gray-800/20" />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                    const daySchedules = scheduleByDate[dateKey] || [];
                                    const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
                                    return (
                                        <div key={day} className="h-24 border-b border-r border-[#dde0e4] dark:border-[#2d353e] p-1.5 overflow-hidden">
                                            <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[#3C81C6] text-white" : "text-[#121417] dark:text-white"}`}>{day}</div>
                                            <div className="space-y-0.5">
                                                {daySchedules.slice(0, 2).map((s) => {
                                                    const st = SCHEDULE_STATUS_MAP[s.status ?? "SCHEDULED"] ?? SCHEDULE_STATUS_MAP.SCHEDULED;
                                                    return (
                                                        <div key={s.id} className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${st.cls}`}>
                                                            {s.shiftName || s.startTime || "Ca trực"}
                                                        </div>
                                                    );
                                                })}
                                                {daySchedules.length > 2 && <div className="text-[10px] text-[#687582]">+{daySchedules.length - 2} ca</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* List view */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h3 className="font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6] text-[18px]">event_note</span>
                                Danh sách ca trực ({schedules.length})
                            </h3>
                        </div>
                        {schedules.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-center">
                                <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">event_busy</span>
                                <p className="text-sm text-[#687582] dark:text-gray-400">Không có ca trực trong tháng này.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                                {schedules.map((s) => {
                                    const st = SCHEDULE_STATUS_MAP[s.status ?? "SCHEDULED"] ?? SCHEDULE_STATUS_MAP.SCHEDULED;
                                    return (
                                        <div key={s.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-blue-500 text-[20px]">calendar_today</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#121417] dark:text-white">{fmt(s.workDate)} — {s.shiftName || "Ca trực"}</p>
                                                {(s.startTime || s.endTime) && (
                                                    <p className="text-xs text-[#687582] dark:text-gray-400">{s.startTime} – {s.endTime}</p>
                                                )}
                                                {s.note && <p className="text-xs text-[#687582] dark:text-gray-500 italic">{s.note}</p>}
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${st.cls}`}>{st.label}</span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {s.status === "SCHEDULED" || s.status === "ON_DUTY" ? (
                                                    <button onClick={() => handleSuspend(s.id)} disabled={actionLoading === s.id + "-suspend"}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 hover:bg-orange-100 transition-colors disabled:opacity-50">
                                                        Tạm dừng
                                                    </button>
                                                ) : s.status === "SUSPENDED" ? (
                                                    <button onClick={() => handleResume(s.id)} disabled={actionLoading === s.id + "-resume"}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50">
                                                        Tiếp tục
                                                    </button>
                                                ) : null}
                                                <button onClick={() => handleDelete(s.id)} disabled={actionLoading === s.id + "-delete"}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[#687582] hover:text-red-500 transition-colors disabled:opacity-50">
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Create modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h3 className="font-bold text-[#121417] dark:text-white">Tạo ca trực mới</h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            {([
                                { key: "workDate", label: "Ngày trực *", type: "date" },
                                { key: "shiftName", label: "Tên ca", type: "text" },
                                { key: "startTime", label: "Giờ bắt đầu", type: "time" },
                                { key: "endTime", label: "Giờ kết thúc", type: "time" },
                                { key: "note", label: "Ghi chú", type: "text" },
                            ] as const).map(({ key, label, type }) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-[#687582] dark:text-gray-400 mb-1">{label}</label>
                                    <input
                                        type={type}
                                        value={createForm[key]}
                                        onChange={(e) => setCreateForm((f) => ({ ...f, [key]: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#13191f] text-sm text-[#121417] dark:text-white focus:outline-none focus:border-[#3C81C6] transition-colors"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Hủy</button>
                            <button onClick={handleCreate} disabled={!createForm.workDate} className="flex-1 px-4 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] disabled:opacity-50 transition-colors">Tạo ca</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab: Phân công cơ sở & vai trò ─────────────────────────────────────────
function PhanCongTab({ staffId }: { staffId: string }) {
    const [data, setData] = useState<{ branches: any[]; roles: any[] }>({ branches: [], roles: [] });
    const [loading, setLoading] = useState(true);
    const [branchInput, setBranchInput] = useState("");
    const [roleInput, setRoleInput] = useState("");
    const [saving, setSaving] = useState<"branch" | "role" | null>(null);

    const reload = () => {
        setLoading(true);
        Promise.allSettled([
            axiosClient.get(`/api/staff/${staffId}/branches`).catch(() => null),
            axiosClient.get(`/api/staff/${staffId}/roles`).catch(() => null),
        ]).then(([bRes, rRes]) => {
            const branches = bRes.status === "fulfilled" && bRes.value
                ? bRes.value.data?.data ?? bRes.value.data ?? [] : [];
            const roles = rRes.status === "fulfilled" && rRes.value
                ? rRes.value.data?.data ?? rRes.value.data ?? [] : [];
            setData({ branches: Array.isArray(branches) ? branches : [], roles: Array.isArray(roles) ? roles : [] });
        }).finally(() => setLoading(false));
    };

    useEffect(() => { reload(); }, [staffId]);

    const assignBranch = async () => {
        if (!branchInput.trim()) return;
        setSaving("branch");
        try {
            await axiosClient.post(STAFF_MANAGEMENT_ENDPOINTS.BRANCHES(staffId), { branchId: branchInput.trim() });
            setBranchInput("");
            reload();
        } finally { setSaving(null); }
    };

    const removeBranch = async (branchId: string) => {
        if (!confirm("Gỡ chi nhánh này?")) return;
        try {
            await axiosClient.delete(STAFF_MANAGEMENT_ENDPOINTS.REMOVE_BRANCH(staffId, branchId));
            reload();
        } catch { /* ignore */ }
    };

    const assignRole = async () => {
        if (!roleInput.trim()) return;
        setSaving("role");
        try {
            await axiosClient.post(STAFF_MANAGEMENT_ENDPOINTS.ROLES(staffId), { roleId: roleInput.trim() });
            setRoleInput("");
            reload();
        } finally { setSaving(null); }
    };

    const removeRole = async (roleId: string) => {
        if (!confirm("Gỡ vai trò này?")) return;
        try {
            await axiosClient.delete(STAFF_MANAGEMENT_ENDPOINTS.REMOVE_ROLE(staffId, roleId));
            reload();
        } catch { /* ignore */ }
    };

    if (loading) return <TabSpinner />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branches */}
            <Card title="Chi nhánh đang công tác" icon="location_city">
                <div className="flex gap-2 mb-4">
                    <input
                        value={branchInput}
                        onChange={(e) => setBranchInput(e.target.value)}
                        placeholder="Branch ID…"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#13191f] text-sm focus:outline-none focus:border-[#3C81C6] transition-colors"
                    />
                    <button onClick={assignBranch} disabled={saving === "branch" || !branchInput.trim()}
                        className="px-3 py-2 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] disabled:opacity-50 transition-colors">
                        {saving === "branch" ? "…" : "Thêm"}
                    </button>
                </div>
                {data.branches.length === 0 ? (
                    <p className="text-sm text-[#687582] dark:text-gray-400 text-center py-4">Chưa được phân công chi nhánh nào.</p>
                ) : (
                    <div className="space-y-2">
                        {data.branches.map((b: any, i: number) => (
                            <div key={b.id ?? b.branch_id ?? i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-blue-500 text-[16px]">location_city</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#121417] dark:text-white">{b.name ?? b.branch_name ?? b.branchName ?? "—"}</p>
                                        {b.address && <p className="text-xs text-[#687582]">{b.address}</p>}
                                    </div>
                                </div>
                                <button onClick={() => removeBranch(b.id ?? b.branch_id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[#687582] hover:text-red-500 transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Roles */}
            <Card title="Vai trò hệ thống" icon="shield_person">
                <div className="flex gap-2 mb-4">
                    <input
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        placeholder="Role ID…"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#13191f] text-sm focus:outline-none focus:border-[#3C81C6] transition-colors"
                    />
                    <button onClick={assignRole} disabled={saving === "role" || !roleInput.trim()}
                        className="px-3 py-2 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] disabled:opacity-50 transition-colors">
                        {saving === "role" ? "…" : "Thêm"}
                    </button>
                </div>
                {data.roles.length === 0 ? (
                    <p className="text-sm text-[#687582] dark:text-gray-400 text-center py-4">Chưa có vai trò nào được gán.</p>
                ) : (
                    <div className="space-y-2">
                        {data.roles.map((r: any, i: number) => {
                            const roleKey = (r.role_name ?? r.name ?? r.role ?? "").toUpperCase() as Role;
                            const rc = ROLE_COLORS[roleKey] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
                            return (
                                <div key={r.id ?? r.role_id ?? i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${rc.bg} ${rc.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${rc.dot} mr-1.5`} />
                                        {ROLE_LABELS[roleKey] || r.role_name || r.name || r.role}
                                    </span>
                                    <button onClick={() => removeRole(r.id ?? r.role_id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[#687582] hover:text-red-500 transition-colors">
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────
function StaffDetailContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const staffId = params.id as string;

    const [staff, setStaff] = useState<StaffMember | null>(null);
    const [loading, setLoading] = useState(true);

    const activeTab = (searchParams.get("tab") as TabKey) || "nhansu";
    const visitedTabs = useRef(new Set<TabKey>([activeTab]));

    const setTab = (key: TabKey) => {
        visitedTabs.current.add(key);
        const sp = new URLSearchParams(searchParams.toString());
        sp.set("tab", key);
        router.replace(`?${sp.toString()}`, { scroll: false });
    };

    useEffect(() => {
        if (!staffId) return;
        setLoading(true);
        staffService.getById(staffId)
            .then((d: any) => {
                if (d) setStaff(d);
                else setStaff(null);
            })
            .catch(() => setStaff(null))
            .finally(() => setLoading(false));
    }, [staffId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin mb-4" />
                <p className="text-sm text-[#687582]">Đang tải...</p>
            </div>
        );
    }

    if (!staff) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">person_off</span>
                <p className="text-lg text-gray-500 mb-4">Không tìm thấy nhân viên</p>
                <button onClick={() => router.back()} className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-colors">
                    Quay lại
                </button>
            </div>
        );
    }

    const roleKey = (staff.role || "").toUpperCase() as Role;
    const roleColor = ROLE_COLORS[roleKey] || { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };
    const statusColor = staff.status === "ACTIVE"
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : staff.status === "INACTIVE"
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    const statusLabel = staff.status === "ACTIVE" ? "Đang hoạt động" : staff.status === "INACTIVE" ? "Tạm ngừng" : "Đã khóa";

    return (
        <>
            {/* Breadcrumb + Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/users" className="hover:text-[#3C81C6] transition-colors">Nhân sự</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">{staff.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push(`/admin/users/${staffId}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-all shadow-md shadow-blue-200 dark:shadow-none"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Chỉnh sửa
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Quay lại
                    </button>
                </div>
            </div>

            {/* Profile Header */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm overflow-hidden">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-[#3C81C6] via-[#60a5fa] to-[#93c5fd] relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-[#1e242b] border-4 border-white dark:border-[#1e242b] shadow-lg flex items-center justify-center overflow-hidden">
                            {staff.avatar ? (
                                <img src={staff.avatar} alt={staff.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-4xl text-[#3C81C6]">person</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="pt-16 pb-4 px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-[#121417] dark:text-white">{staff.fullName}</h1>
                            <p className="text-[#687582] dark:text-gray-400 mt-0.5">{staff.email}</p>
                            <p className="text-sm text-[#687582] dark:text-gray-500">{staff.specialization || staff.departmentName}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${roleColor.bg} ${roleColor.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${roleColor.dot} mr-1.5`} />
                                    {ROLE_LABELS[roleKey] || staff.role}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {statusLabel}
                                </span>
                                {staff.code && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-[#687582] dark:text-gray-300">
                                        <span className="material-symbols-outlined text-[14px]">badge</span>
                                        {staff.code}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-8 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="flex gap-1 -mb-px overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? "border-[#3C81C6] text-[#3C81C6]"
                                        : "border-transparent text-[#687582] hover:text-[#3C81C6] hover:border-gray-300"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab content — render once mounted, keep in DOM to avoid refetch */}
            <div className={activeTab === "nhansu" ? "" : "hidden"}>
                {visitedTabs.current.has("nhansu") && <NhanSuTab staff={staff} />}
            </div>
            <div className={activeTab === "chuyen-mon" ? "" : "hidden"}>
                {visitedTabs.current.has("chuyen-mon") && <ChuyenMonTab staffId={staffId} />}
            </div>
            <div className={activeTab === "lich-lam-viec" ? "" : "hidden"}>
                {visitedTabs.current.has("lich-lam-viec") && <LichLamViecTab staffId={staffId} />}
            </div>
            <div className={activeTab === "phan-cong" ? "" : "hidden"}>
                {visitedTabs.current.has("phan-cong") && <PhanCongTab staffId={staffId} />}
            </div>
        </>
    );
}

export default function StaffDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin" />
            </div>
        }>
            <StaffDetailContent />
        </Suspense>
    );
}
