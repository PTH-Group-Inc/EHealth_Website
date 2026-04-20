"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { SUPPLIER_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState, StatCard } from "@/components/shared/layout";

interface Supplier {
    id: string;
    code: string;
    name: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    address?: string;
    contactPerson?: string;
    status: "ACTIVE" | "INACTIVE";
    note?: string;
}

interface FormState {
    id?: string;
    code: string;
    name: string;
    taxCode: string;
    phone: string;
    email: string;
    address: string;
    contactPerson: string;
    note: string;
}

const EMPTY_FORM: FormState = { code: "", name: "", taxCode: "", phone: "", email: "", address: "", contactPerson: "", note: "" };

function mapSupplier(r: any): Supplier {
    return {
        id: String(r.suppliers_id ?? r.supplier_id ?? r.id ?? ""),
        code: r.code ?? r.supplier_code ?? "",
        name: r.name ?? r.supplier_name ?? "",
        taxCode: r.tax_code ?? r.taxCode ?? "",
        phone: r.phone ?? r.phone_number ?? "",
        email: r.email ?? "",
        address: r.address ?? "",
        contactPerson: r.contact_person ?? r.contactPerson ?? "",
        status: (r.status ?? "ACTIVE") === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        note: r.note ?? r.description ?? "",
    };
}

export default function SuppliersPage() {
    const toast = useToast();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(SUPPLIER_ENDPOINTS.LIST, { params: { limit: 500 } });
            const { data } = unwrapList<any>(res);
            setSuppliers(data.map(mapSupplier));
        } catch {
            setError("Không tải được danh sách nhà cung cấp.");
            setSuppliers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return suppliers.filter((s) => {
            if (statusFilter !== "all" && s.status !== statusFilter) return false;
            if (q && !`${s.code} ${s.name} ${s.taxCode ?? ""} ${s.phone ?? ""} ${s.contactPerson ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [suppliers, search, statusFilter]);

    const stats = useMemo(() => ({
        total: suppliers.length,
        active: suppliers.filter((s) => s.status === "ACTIVE").length,
        inactive: suppliers.filter((s) => s.status === "INACTIVE").length,
        withContact: suppliers.filter((s) => s.phone || s.email).length,
    }), [suppliers]);

    const openCreate = () => { setForm(EMPTY_FORM); setShowModal(true); };
    const openEdit = (s: Supplier) => {
        setForm({
            id: s.id, code: s.code, name: s.name,
            taxCode: s.taxCode ?? "", phone: s.phone ?? "", email: s.email ?? "",
            address: s.address ?? "", contactPerson: s.contactPerson ?? "", note: s.note ?? "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.name.trim()) { toast.warning("Nhập mã và tên NCC."); return; }
        setSaving(true);
        try {
            const payload = {
                code: form.code.trim(),
                name: form.name.trim(),
                tax_code: form.taxCode.trim() || undefined,
                phone: form.phone.trim() || undefined,
                email: form.email.trim() || undefined,
                address: form.address.trim() || undefined,
                contact_person: form.contactPerson.trim() || undefined,
                note: form.note.trim() || undefined,
            };
            if (form.id) {
                await axiosClient.put(SUPPLIER_ENDPOINTS.DETAIL(form.id), payload);
                toast.success("Đã cập nhật NCC.");
            } else {
                await axiosClient.post(SUPPLIER_ENDPOINTS.LIST, payload);
                toast.success("Đã tạo NCC.");
            }
            setShowModal(false);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (s: Supplier) => {
        if (!confirm(`Xoá NCC "${s.name}"?`)) return;
        try {
            await axiosClient.delete(SUPPLIER_ENDPOINTS.DETAIL(s.id));
            toast.success("Đã xoá.");
            await load();
        } catch {
            toast.error("Không xoá được.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Nhà cung cấp"
                subtitle="Quản lý thông tin các nhà cung cấp thuốc và vật tư y tế"
                icon="local_shipping"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Nhà cung cấp" }]}
                actions={
                    <button onClick={openCreate} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md inline-flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        Thêm NCC
                    </button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tổng NCC" value={stats.total} icon="local_shipping" color="blue" loading={loading} />
                <StatCard label="Đang hợp tác" value={stats.active} icon="check_circle" color="emerald" loading={loading} />
                <StatCard label="Ngưng" value={stats.inactive} icon="cancel" color="red" loading={loading} />
                <StatCard label="Có liên hệ" value={stats.withContact} icon="contact_phone" color="violet" loading={loading} />
            </div>

            <FilterBar
                searchPlaceholder="Tìm theo mã, tên, MST, SĐT..."
                searchValue={search}
                onSearchChange={setSearch}
                filters={[{
                    key: "status", label: "Trạng thái", value: statusFilter, onChange: setStatusFilter,
                    options: [{ value: "all", label: "Tất cả" }, { value: "ACTIVE", label: "Đang hợp tác" }, { value: "INACTIVE", label: "Ngưng" }],
                }]}
                onReset={() => { setSearch(""); setStatusFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon="local_shipping" title={suppliers.length === 0 ? "Chưa có NCC" : "Không khớp bộ lọc"} description={suppliers.length === 0 ? "Thêm NCC đầu tiên để bắt đầu nhập kho." : "Thử đổi từ khoá."} />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Mã / Tên</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">MST</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Liên hệ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Địa chỉ</th>
                                    <th className="text-left px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Trạng thái</th>
                                    <th className="text-right px-4 py-3 font-semibold text-[#687582] dark:text-gray-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => (
                                    <tr key={s.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-[#121417] dark:text-white">{s.name}</div>
                                            <div className="text-xs font-mono text-[#687582] dark:text-gray-400">{s.code}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-[#121417] dark:text-white">{s.taxCode || "—"}</td>
                                        <td className="px-4 py-3 text-xs">
                                            {s.contactPerson && <div className="font-medium text-[#121417] dark:text-white">{s.contactPerson}</div>}
                                            {s.phone && <div className="text-[#3C81C6]">{s.phone}</div>}
                                            {s.email && <div className="text-[#687582] dark:text-gray-400">{s.email}</div>}
                                            {!s.phone && !s.email && !s.contactPerson && <span className="text-[#687582] dark:text-gray-500">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[#687582] dark:text-gray-400 max-w-xs truncate" title={s.address}>{s.address || "—"}</td>
                                        <td className="px-4 py-3">
                                            <div className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md ${s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                                                {s.status === "ACTIVE" ? "Đang hợp tác" : "Ngưng"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(s)} className="px-2 py-1 text-[#3C81C6] hover:bg-[#3C81C6]/[0.1] rounded-md" title="Sửa">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(s)} className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Xoá">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">{form.id ? "edit" : "add"}</span>
                            {form.id ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <FormInput label="Mã NCC *" value={form.code} onChange={(v) => setForm({ ...form, code: v })} placeholder="VD: NCC001" />
                                <FormInput label="Mã số thuế" value={form.taxCode} onChange={(v) => setForm({ ...form, taxCode: v })} />
                            </div>
                            <FormInput label="Tên NCC *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                            <div className="grid grid-cols-2 gap-3">
                                <FormInput label="Người liên hệ" value={form.contactPerson} onChange={(v) => setForm({ ...form, contactPerson: v })} />
                                <FormInput label="SĐT" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                            </div>
                            <FormInput label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
                            <FormInput label="Địa chỉ" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
                            <FormTextarea label="Ghi chú" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowModal(false)} disabled={saving} className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Huỷ</button>
                            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                                {saving ? "Đang lưu..." : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FormInput({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label>
            <input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
        </div>
    );
}

function FormTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label>
            <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
        </div>
    );
}
