import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import { extractErrorMessage } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { patientInsuranceService, type InsuranceProvider, type PatientInsuranceRecord } from "@/services/patientInsuranceService";
import { sortInsuranceRecords } from "@/utils/patientProfileHelpers";
import { type PatientProfile } from "@/types/patient-profile";

interface TabProps {
    profile: PatientProfile;
    onInsuranceChanged?: () => Promise<void> | void;
}

type InsuranceFormState = {
    provider_id: string;
    insurance_number: string;
    start_date: string;
    end_date: string;
    coverage_percent: string;
    is_primary: boolean;
};

const INITIAL_FORM = (): InsuranceFormState => ({
    provider_id: "",
    insurance_number: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    coverage_percent: "80",
    is_primary: true,
});

export default function InsuranceTab({ profile, onInsuranceChanged }: TabProps) {
    const { showToast } = useToast();
    const [insurances, setInsurances] = useState<PatientInsuranceRecord[]>([]);
    const [providers, setProviders] = useState<InsuranceProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedInsurance, setSelectedInsurance] = useState<PatientInsuranceRecord | null>(null);
    const [historyItems, setHistoryItems] = useState<any[]>([]);
    const [form, setForm] = useState<InsuranceFormState>(INITIAL_FORM());
    const [errors, setErrors] = useState<Record<string, string>>({});

    const loadInsuranceData = useCallback(async () => {
        if (!profile.id) return;

        try {
            setLoading(true);
            const [listRes, providerRes] = await Promise.all([
                patientInsuranceService.getByPatient(profile.id).catch(() => patientInsuranceService.getList({ patient_id: profile.id })),
                patientInsuranceService.getProviders({ limit: 200 }),
            ]);

            setInsurances(Array.isArray(listRes.data) ? listRes.data : []);
            setProviders(Array.isArray(providerRes.data) ? providerRes.data.filter((item) => item?.is_active !== false) : []);
        } catch {
            setInsurances([]);
            showToast("Không thể tải danh sách bảo hiểm.", "error");
        } finally {
            setLoading(false);
        }
    }, [profile.id, showToast]);

    useEffect(() => {
        loadInsuranceData();
    }, [loadInsuranceData]);

    const normalizedInsurances = useMemo(() => sortInsuranceRecords(insurances), [insurances]);

    const resetForm = () => {
        setForm(INITIAL_FORM());
        setErrors({});
        setSelectedInsurance(null);
    };

    const openCreate = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const openEdit = (insurance: PatientInsuranceRecord) => {
        setSelectedInsurance(insurance);
        setForm({
            provider_id: insurance.provider_id || "",
            insurance_number: insurance.insurance_number || "",
            start_date: insurance.start_date ? insurance.start_date.slice(0, 10) : "",
            end_date: insurance.end_date ? insurance.end_date.slice(0, 10) : "",
            coverage_percent: insurance.coverage_percent != null ? String(insurance.coverage_percent) : "80",
            is_primary: Boolean(insurance.is_primary),
        });
        setErrors({});
        setIsFormOpen(true);
    };

    const validateForm = () => {
        const nextErrors: Record<string, string> = {};

        if (!form.provider_id) nextErrors.provider_id = "Vui lòng chọn nhà cung cấp bảo hiểm.";
        if (!form.insurance_number.trim()) nextErrors.insurance_number = "Vui lòng nhập số thẻ bảo hiểm.";
        if (!form.start_date) nextErrors.start_date = "Vui lòng chọn ngày bắt đầu.";
        if (!form.end_date) nextErrors.end_date = "Vui lòng chọn ngày kết thúc.";
        if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
            nextErrors.end_date = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateForm()) return;

        try {
            setSubmitting(true);
            const payload = {
                provider_id: form.provider_id,
                insurance_number: form.insurance_number.trim().toUpperCase(),
                start_date: form.start_date,
                end_date: form.end_date,
                coverage_percent: Number(form.coverage_percent || 0),
                is_primary: form.is_primary,
            };

            if (selectedInsurance?.patient_insurances_id) {
                await patientInsuranceService.update(selectedInsurance.patient_insurances_id, payload);
                showToast("Cập nhật thẻ bảo hiểm thành công.", "success");
            } else {
                await patientInsuranceService.createForPatient(profile.id, payload);
                showToast("Liên kết thẻ bảo hiểm thành công.", "success");
            }

            setIsFormOpen(false);
            resetForm();
            await loadInsuranceData();
            await onInsuranceChanged?.();
        } catch (error) {
            showToast(extractErrorMessage(error), "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (insurance: PatientInsuranceRecord) => {
        if (!window.confirm("Bạn có chắc muốn xóa thẻ bảo hiểm này?")) return;

        try {
            await patientInsuranceService.delete(insurance.patient_insurances_id);
            showToast("Đã xóa thẻ bảo hiểm.", "success");
            await loadInsuranceData();
            await onInsuranceChanged?.();
        } catch (error) {
            showToast(extractErrorMessage(error), "error");
        }
    };

    const handleViewHistory = async (insurance: PatientInsuranceRecord) => {
        try {
            setSelectedInsurance(insurance);
            const res = await patientInsuranceService.getHistory(insurance.patient_insurances_id, { limit: 20 });
            setHistoryItems(Array.isArray(res.data) ? res.data : []);
            setIsHistoryOpen(true);
        } catch (error) {
            showToast(extractErrorMessage(error), "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#111821] lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Bảo hiểm y tế</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quản lý các thẻ đang liên kết với hồ sơ này. Thẻ chính sẽ được ưu tiên hiển thị ở ngoài danh sách hồ sơ.
                    </p>
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3C81C6] to-[#2563eb] px-4 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_card</span>
                    Liên kết thẻ mới
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3C81C6] border-t-transparent"></div>
                </div>
            ) : normalizedInsurances.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {normalizedInsurances.map((insurance) => (
                        <InsuranceCard
                            key={insurance.patient_insurances_id}
                            insurance={insurance}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onHistory={handleViewHistory}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-[#2d353e] dark:bg-[#13191f]">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#3C81C6]/10">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "40px" }}>health_and_safety</span>
                    </div>
                    <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Chưa liên kết bảo hiểm</h4>
                    <p className="mx-auto max-w-md text-sm text-gray-500">
                        Hãy liên kết thẻ bảo hiểm để hiển thị nhà cung cấp, thời hạn và trạng thái sử dụng rõ ràng hơn.
                    </p>
                </div>
            )}

            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={selectedInsurance ? "Cập nhật thẻ bảo hiểm" : "Liên kết thẻ bảo hiểm"}
                size="md"
            >
                <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
                    <Field label="Nhà cung cấp" error={errors.provider_id}>
                        <select
                            value={form.provider_id}
                            onChange={(e) => setForm((prev) => ({ ...prev, provider_id: e.target.value }))}
                            className="rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">-- Chọn nhà cung cấp --</option>
                            {providers.map((provider) => (
                                <option key={provider.insurance_providers_id} value={provider.insurance_providers_id}>
                                    {provider.provider_name}{provider.provider_code ? ` (${provider.provider_code})` : ""}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Số thẻ bảo hiểm" error={errors.insurance_number}>
                        <input
                            value={form.insurance_number}
                            onChange={(e) => setForm((prev) => ({ ...prev, insurance_number: e.target.value.toUpperCase() }))}
                            placeholder="Ví dụ: DK2-12345678901"
                            className="rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm uppercase text-gray-900 focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Ngày bắt đầu" error={errors.start_date}>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                                className="rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </Field>

                        <Field label="Ngày kết thúc" error={errors.end_date}>
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                                className="rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.6fr_0.4fr]">
                        <Field label="Tỷ lệ hưởng (%)">
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={form.coverage_percent}
                                onChange={(e) => setForm((prev) => ({ ...prev, coverage_percent: e.target.value }))}
                                className="rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </Field>

                        <label className="mt-7 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={form.is_primary}
                                onChange={(e) => setForm((prev) => ({ ...prev, is_primary: e.target.checked }))}
                                className="rounded border-gray-300 text-[#3C81C6] focus:ring-[#3C81C6]"
                            />
                            Đặt là thẻ chính
                        </label>
                    </div>

                    <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            disabled={submitting}
                            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 rounded-xl bg-[#3C81C6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2b6cb0]"
                        >
                            {submitting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                selectedInsurance ? "Lưu cập nhật" : "Liên kết thẻ"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Lịch sử thẻ bảo hiểm" size="md">
                <div className="mt-2 max-h-[60vh] space-y-3 overflow-y-auto">
                    <div className="rounded-xl bg-gray-50 p-4 dark:bg-[#13191f]">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {selectedInsurance?.insurance_number || "Không rõ số thẻ"}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            {selectedInsurance?.provider_name || "Không rõ nhà cung cấp"}
                        </p>
                    </div>
                    {historyItems.length > 0 ? historyItems.map((item, index) => (
                        <div key={item.audit_logs_id || item.id || index} className="rounded-xl border border-gray-100 p-4 dark:border-[#2d353e]">
                            <div className="flex items-center justify-between gap-3">
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                    {item.action_type || "UPDATE"}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : "Chưa rõ thời gian"}
                                </span>
                            </div>
                            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                                {item.user_email || item.user_name || "Hệ thống"}
                            </p>
                            {(item.new_values || item.old_values) && (
                                <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs whitespace-pre-wrap break-words text-gray-500 dark:bg-[#0f141b]">
                                    {JSON.stringify(item.new_values || item.old_values, null, 2)}
                                </pre>
                            )}
                        </div>
                    )) : (
                        <p className="text-sm text-gray-500">Chưa có lịch sử thay đổi nào cho thẻ này.</p>
                    )}
                </div>
            </Modal>
        </div>
    );
}

function InsuranceCard({
    insurance,
    onEdit,
    onDelete,
    onHistory,
}: {
    insurance: PatientInsuranceRecord & { effectiveStatus: string };
    onEdit: (insurance: PatientInsuranceRecord) => void;
    onDelete: (insurance: PatientInsuranceRecord) => void;
    onHistory: (insurance: PatientInsuranceRecord) => void;
}) {
    const statusMap: Record<string, { label: string; className: string }> = {
        active: { label: "Còn hiệu lực", className: "bg-emerald-50 text-emerald-700" },
        expiring: { label: "Sắp hết hạn", className: "bg-amber-50 text-amber-700" },
        expired: { label: "Hết hạn", className: "bg-rose-50 text-rose-700" },
    };
    const status = statusMap[insurance.effectiveStatus] || statusMap.active;

    return (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#111821]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {insurance.provider_name || "Nhà cung cấp bảo hiểm"}
                        </span>
                        {insurance.is_primary && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                                Thẻ chính
                            </span>
                        )}
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
                            {status.label}
                        </span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Số thẻ</p>
                    <p className="mt-2 break-all font-mono text-lg font-bold tracking-[0.16em] text-slate-900 dark:text-white">
                        {insurance.insurance_number}
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <IconButton icon="edit" title="Cập nhật thẻ" onClick={() => onEdit(insurance)} />
                    <IconButton icon="history" title="Lịch sử thay đổi" onClick={() => onHistory(insurance)} />
                    <IconButton icon="delete" title="Xóa thẻ" onClick={() => onDelete(insurance)} />
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <InsuranceMeta label="Ngày bắt đầu" value={insurance.start_date ? new Date(insurance.start_date).toLocaleDateString("vi-VN") : "Chưa có"} />
                <InsuranceMeta label="Ngày kết thúc" value={insurance.end_date ? new Date(insurance.end_date).toLocaleDateString("vi-VN") : "Chưa có"} />
                <InsuranceMeta label="Tỷ lệ hưởng" value={`${insurance.coverage_percent ?? 0}%`} />
                <InsuranceMeta label="Mã liên kết" value={insurance.patient_insurances_id} />
            </div>
        </div>
    );
}

function InsuranceMeta({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-[#0f141b]">
            <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">{label}</p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

function IconButton({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="rounded-xl bg-slate-100 p-2 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700" title={title} type="button">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-200" style={{ fontSize: "18px" }}>{icon}</span>
        </button>
    );
}
