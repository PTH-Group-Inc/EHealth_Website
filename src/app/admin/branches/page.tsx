"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { BRANCH_MANAGEMENT_ENDPOINTS, FACILITY_MANAGEMENT_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface Branch {
    id: string;
    code: string;
    name: string;
    facilityId?: string;
    facilityName?: string;
    address?: string;
    phone?: string;
    email?: string;
    status: "ACTIVE" | "INACTIVE" | string;
    createdAt?: string;
}

interface FacilityLite {
    id: string;
    name: string;
    code?: string;
}

interface FormState {
    id?: string;
    code: string;
    name: string;
    facilityId: string;
    address: string;
    phone: string;
    email: string;
}

const EMPTY_FORM: FormState = { code: "", name: "", facilityId: "", address: "", phone: "", email: "" };

function mapBranch(b: any): Branch {
    const rawStatus = String(b.status ?? "").toUpperCase();
    return {
        id: String(b.branches_id ?? b.branch_id ?? b.id ?? ""),
        code: b.code ?? b.branch_code ?? "",
        name: b.name ?? b.branch_name ?? "",
        facilityId: b.facility_id ?? b.facilityId ?? b.facilities_id ?? "",
        facilityName: b.facility_name ?? b.facilityName ?? "",
        address: b.address ?? "",
        phone: b.phone ?? b.phone_number ?? "",
        email: b.email ?? "",
        status: rawStatus === "INACTIVE" || rawStatus === "DISABLED" ? "INACTIVE" : "ACTIVE",
        createdAt: b.created_at ?? b.createdAt ?? "",
    };
}

function mapFacility(f: any): FacilityLite {
    return {
        id: String(f.facilities_id ?? f.facility_id ?? f.id ?? ""),
        name: f.name ?? f.facility_name ?? "",
        code: f.code ?? f.facility_code ?? "",
    };
}

export default function BranchesAdminPage() {
    const toast = useToast();
    const t = useTranslations("pages.branches");
    const tc = useTranslations("common");
    const [branches, setBranches] = useState<Branch[]>([]);
    const [facilities, setFacilities] = useState<FacilityLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [facilityFilter, setFacilityFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const loadFacilities = useCallback(async () => {
        try {
            const res = await axiosClient.get(FACILITY_MANAGEMENT_ENDPOINTS.DROPDOWN);
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            setFacilities(raw.map(mapFacility).filter((f) => f.id));
        } catch {
            setFacilities([]);
        }
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(BRANCH_MANAGEMENT_ENDPOINTS.LIST);
            const { data } = unwrapList<any>(res);
            setBranches(data.map(mapBranch));
        } catch {
            setError("Không tải được danh sách chi nhánh.");
            setBranches([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFacilities();
        load();
    }, [loadFacilities, load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return branches.filter((b) => {
            if (facilityFilter !== "all" && b.facilityId !== facilityFilter) return false;
            if (statusFilter !== "all" && b.status !== statusFilter) return false;
            if (q && !`${b.code} ${b.name} ${b.address ?? ""} ${b.phone ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [branches, search, facilityFilter, statusFilter]);

    const stats = useMemo(() => {
        const active = branches.filter((b) => b.status === "ACTIVE").length;
        return {
            total: branches.length,
            active,
            inactive: branches.length - active,
            facilities: new Set(branches.map((b) => b.facilityId).filter(Boolean)).size,
        };
    }, [branches]);

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, facilityId: facilities[0]?.id ?? "" });
        setShowModal(true);
    };

    const openEdit = (b: Branch) => {
        setForm({
            id: b.id,
            code: b.code,
            name: b.name,
            facilityId: b.facilityId ?? "",
            address: b.address ?? "",
            phone: b.phone ?? "",
            email: b.email ?? "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) {
            toast.warning("Vui lòng nhập mã và tên chi nhánh.");
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                code: form.code.trim(),
                name: form.name.trim(),
                address: form.address.trim() || undefined,
                phone: form.phone.trim() || undefined,
                email: form.email.trim() || undefined,
            };
            if (form.facilityId) payload.facility_id = form.facilityId;

            if (form.id) {
                await axiosClient.put(BRANCH_MANAGEMENT_ENDPOINTS.UPDATE(form.id), payload);
                toast.success("Đã cập nhật chi nhánh.");
            } else {
                await axiosClient.post(BRANCH_MANAGEMENT_ENDPOINTS.CREATE, payload);
                toast.success("Đã tạo chi nhánh mới.");
            }
            setShowModal(false);
            await load();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || "Không lưu được chi nhánh.";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (b: Branch) => {
        const next = b.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        try {
            await axiosClient.patch(BRANCH_MANAGEMENT_ENDPOINTS.STATUS(b.id), { status: next });
            toast.success(next === "ACTIVE" ? "Đã kích hoạt chi nhánh." : "Đã tạm dừng chi nhánh.");
            await load();
        } catch {
            toast.error("Không đổi được trạng thái.");
        }
    };

    const handleDelete = async (b: Branch) => {
        if (!confirm(`Bạn chắc chắn xoá chi nhánh "${b.name}"?`)) return;
        try {
            await axiosClient.delete(BRANCH_MANAGEMENT_ENDPOINTS.DELETE(b.id));
            toast.success("Đã xoá chi nhánh.");
            await load();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Không xoá được chi nhánh (có thể đã liên kết dữ liệu).";
            toast.error(msg);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="apartment"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
                actions={
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        {t("addButton")}
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label={t("stats.total")} value={stats.total} icon="apartment" color="blue" loading={loading} />
                <StatCard label={t("stats.active")} value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label={t("stats.inactive")} value={stats.inactive} icon="pause_circle" color="amber" loading={loading} />
                <StatCard label={t("stats.facilities")} value={stats.facilities} icon="domain" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder={t("filter.searchPlaceholder")}
                searchValue={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: "facility",
                        label: "Cơ sở y tế",
                        value: facilityFilter,
                        onChange: setFacilityFilter,
                        options: [
                            { value: "all", label: "Mọi cơ sở" },
                            ...facilities.map((f) => ({ value: f.id, label: f.name })),
                        ],
                    },
                    {
                        key: "status",
                        label: "Trạng thái",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: "all", label: "Mọi trạng thái" },
                            { value: "ACTIVE", label: "Hoạt động" },
                            { value: "INACTIVE", label: "Tạm dừng" },
                        ],
                    },
                ]}
                onReset={() => { setSearch(""); setFacilityFilter("all"); setStatusFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-44 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="apartment"
                    title="Chưa có chi nhánh"
                    description={branches.length === 0 ? "Tạo chi nhánh đầu tiên để bắt đầu vận hành." : "Không có chi nhánh phù hợp bộ lọc."}
                    action={
                        branches.length === 0 ? (
                            <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl">
                                + Tạo chi nhánh
                            </button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((b) => (
                        <div
                            key={b.id}
                            className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm hover:shadow-md transition-all overflow-hidden"
                        >
                            <div className={`h-1.5 ${b.status === "ACTIVE" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-gray-400 to-gray-500"}`} />
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3C81C6] to-[#1d4ed8] flex items-center justify-center text-white flex-shrink-0">
                                            <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>apartment</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-[#121417] dark:text-white truncate" title={b.name}>{b.name}</h3>
                                            <p className="text-xs text-[#687582] dark:text-gray-400 font-mono">{b.code || "—"}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                                            b.status === "ACTIVE"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                        }`}
                                    >
                                        {b.status === "ACTIVE" ? t("statusLabel.active") : t("statusLabel.inactive")}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-xs text-[#687582] dark:text-gray-400 mb-3">
                                    {b.facilityName && (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>domain</span>
                                            <span className="truncate">{b.facilityName}</span>
                                        </div>
                                    )}
                                    {b.address && (
                                        <div className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-[#3C81C6] mt-0.5" style={{ fontSize: "16px" }}>location_on</span>
                                            <span className="line-clamp-2">{b.address}</span>
                                        </div>
                                    )}
                                    {b.phone && (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>call</span>
                                            <span>{b.phone}</span>
                                        </div>
                                    )}
                                    {b.email && (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>mail</span>
                                            <span className="truncate">{b.email}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-50 dark:border-gray-800">
                                    <button
                                        onClick={() => openEdit(b)}
                                        className="flex-1 px-3 py-1.5 text-xs font-medium text-[#3C81C6] bg-[#3C81C6]/[0.08] hover:bg-[#3C81C6]/[0.16] rounded-lg transition-colors inline-flex items-center justify-center gap-1"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                                        Sửa
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(b)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${
                                            b.status === "ACTIVE"
                                                ? "text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300"
                                                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300"
                                        }`}
                                        title={b.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                            {b.status === "ACTIVE" ? "pause" : "play_arrow"}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(b)}
                                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Xoá"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{form.id ? "edit" : "add"}</span>
                            {form.id ? "Sửa chi nhánh" : "Tạo chi nhánh mới"}
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mã chi nhánh *</label>
                                    <input
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        placeholder="VD: BR-HN-01"
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tên chi nhánh *</label>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="VD: Chi nhánh Hà Nội"
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Cơ sở y tế</label>
                                <select
                                    value={form.facilityId}
                                    onChange={(e) => setForm({ ...form, facilityId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                >
                                    <option value="">— Chọn cơ sở —</option>
                                    {facilities.map((f) => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Địa chỉ</label>
                                <input
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    placeholder="Số nhà, đường, phường, quận, thành phố"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Số điện thoại</label>
                                    <input
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="028 3823 xxxx"
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="branch@ehealth.vn"
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50">
                                Huỷ
                            </button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>
                                        Lưu
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
