import React, { useEffect, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { EHR_ENDPOINTS } from "@/api/endpoints";
import { extractErrorMessage } from "@/api/response";
import Modal from "@/components/common/Modal";
import { useToast } from "@/contexts/ToastContext";
import { type PatientProfile } from "@/types/patient-profile";
import {
    getAllergenTypeLabel,
    getHistoryStatusLabel,
    getHistoryTypeLabel,
    getSeverityLabel,
} from "@/utils/patientProfileHelpers";

interface TabProps {
    profile: PatientProfile;
}

type AllergyItem = {
    id: string;
    allergenName: string;
    allergenType?: string;
    reaction?: string;
    severity?: string;
    notes?: string;
};

type HistoryItem = {
    id: string;
    conditionName: string;
    historyType?: string;
    diagnosisDate?: string;
    status?: string;
    notes?: string;
};

const EMPTY_ALLERGY_FORM = {
    allergenName: "",
    reaction: "",
    severity: "MILD",
};

const EMPTY_HISTORY_FORM = {
    conditionName: "",
    diagnosisYear: "",
    historyStatus: "ACTIVE",
};

function normalizeAllergy(item: any, index: number): AllergyItem {
    if (typeof item === "string") {
        return {
            id: `allergy-${index}-${item}`,
            allergenName: item,
        };
    }

    return {
        id: item?.patient_allergies_id || item?.id || `allergy-${index}`,
        allergenName: item?.allergen_name || item?.name || item?.allergen || "Dị ứng chưa rõ tên",
        allergenType: item?.allergen_type,
        reaction: item?.reaction,
        severity: item?.severity,
        notes: item?.notes,
    };
}

function normalizeHistory(item: any, index: number): HistoryItem {
    return {
        id: item?.patient_medical_histories_id || item?.id || `history-${index}`,
        conditionName: item?.condition_name || item?.name || "Bệnh lý chưa rõ tên",
        historyType: item?.history_type,
        diagnosisDate: item?.diagnosis_date,
        status: item?.status,
        notes: item?.notes,
    };
}

export default function MedicalHistoryTab({ profile }: TabProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formType, setFormType] = useState<"allergy" | "history">("allergy");
    const [allergyForm, setAllergyForm] = useState(EMPTY_ALLERGY_FORM);
    const [historyForm, setHistoryForm] = useState(EMPTY_HISTORY_FORM);
    const [allergies, setAllergies] = useState<AllergyItem[]>([]);
    const [histories, setHistories] = useState<HistoryItem[]>([]);

    const loadMedicalHistory = async () => {
        if (!profile.id) return;

        try {
            setLoading(true);
            const [allergyResponse, historyResponse] = await Promise.all([
                axiosClient.get(EHR_ENDPOINTS.ALLERGIES(profile.id)).catch(() => ({ data: { data: [] } })),
                axiosClient.get(EHR_ENDPOINTS.MEDICAL_HISTORY(profile.id)).catch(() => ({ data: { data: [] } })),
            ]);

            const rawAllergies = Array.isArray(allergyResponse.data?.data) ? allergyResponse.data.data : [];
            const rawHistory = Array.isArray(historyResponse.data?.data) ? historyResponse.data.data : [];

            setAllergies(rawAllergies.map(normalizeAllergy));
            setHistories(rawHistory.map(normalizeHistory));
        } catch {
            showToast("Không thể tải tiền sử y tế của bệnh nhân.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMedicalHistory();
    }, [profile.id]);

    const closeModal = () => {
        setIsModalOpen(false);
        setSubmitting(false);
        setAllergyForm(EMPTY_ALLERGY_FORM);
        setHistoryForm(EMPTY_HISTORY_FORM);
        setFormType("allergy");
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!profile.id) return;

        try {
            setSubmitting(true);

            if (formType === "allergy") {
                await axiosClient.post(EHR_ENDPOINTS.ADD_ALLERGY(profile.id), {
                    allergen_name: allergyForm.allergenName.trim(),
                    allergen_type: "OTHER",
                    reaction: allergyForm.reaction.trim(),
                    severity: allergyForm.severity,
                });
                showToast("Đã thêm dị ứng mới.", "success");
            } else {
                await axiosClient.post(EHR_ENDPOINTS.ADD_MEDICAL_HISTORY(profile.id), {
                    condition_name: historyForm.conditionName.trim(),
                    history_type: "PERSONAL",
                    diagnosis_date: historyForm.diagnosisYear ? `${historyForm.diagnosisYear}-01-01` : undefined,
                    status: historyForm.historyStatus,
                });
                showToast("Đã thêm tiền sử bệnh lý.", "success");
            }

            closeModal();
            await loadMedicalHistory();
        } catch (error) {
            showToast(extractErrorMessage(error), "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3C81C6] border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#111821] lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Tiền sử y tế và dị ứng</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Ghi nhận dị ứng, bệnh nền và các thông tin cần lưu ý để bác sĩ tra cứu nhanh trước mỗi lần khám.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3C81C6] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2b6cb0]"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                    Thêm thông tin
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#111821]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                            <span className="material-symbols-outlined">warning</span>
                        </div>
                        <div>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white">Dị ứng</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Hiển thị gọn theo tác nhân, phản ứng và mức độ.</p>
                        </div>
                    </div>

                    {allergies.length > 0 ? (
                        <div className="mt-5 space-y-3">
                            {allergies.map((allergy) => (
                                <div
                                    key={allergy.id}
                                    className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 dark:border-rose-500/20 dark:bg-rose-500/10"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{allergy.allergenName}</h5>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <Badge>{getAllergenTypeLabel(allergy.allergenType)}</Badge>
                                                {allergy.severity && <Badge tone="rose">{getSeverityLabel(allergy.severity)}</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    {(allergy.reaction || allergy.notes) && (
                                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                                            {allergy.reaction || allergy.notes}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyPanel
                            icon="warning"
                            title="Chưa ghi nhận dị ứng"
                            description="Hiện chưa có thông tin dị ứng nào cho hồ sơ này."
                        />
                    )}
                </section>

                <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#111821]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                            <span className="material-symbols-outlined">personal_injury</span>
                        </div>
                        <div>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white">Bệnh nền và thủ thuật</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Hiển thị ngắn gọn theo trạng thái, mốc chẩn đoán và ghi chú nếu có.</p>
                        </div>
                    </div>

                    {histories.length > 0 ? (
                        <div className="mt-5 space-y-3">
                            {histories.map((history) => (
                                <div
                                    key={history.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2d353e] dark:bg-[#0f141b]"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{history.conditionName}</h5>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <Badge tone="blue">{getHistoryStatusLabel(history.status)}</Badge>
                                                {history.historyType && <Badge>{getHistoryTypeLabel(history.historyType)}</Badge>}
                                                {history.diagnosisDate && (
                                                    <Badge>
                                                        Chẩn đoán từ {new Date(history.diagnosisDate).toLocaleDateString("vi-VN")}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {history.notes && (
                                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{history.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyPanel
                            icon="clinical_notes"
                            title="Chưa có tiền sử bệnh lý"
                            description="Bạn có thể thêm bệnh nền, chẩn đoán cũ hoặc các ghi chú theo dõi quan trọng."
                        />
                    )}
                </section>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={formType === "allergy" ? "Thêm dị ứng mới" : "Thêm tiền sử bệnh lý"}
                size="lg"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#2d353e] dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Hủy
                        </button>
                        <button
                            form="medical-history-form"
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#3C81C6] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2b6cb0] disabled:opacity-60"
                        >
                            {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
                            Lưu thông tin
                        </button>
                    </>
                }
            >
                <div className="space-y-5">
                    <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                        <button
                            type="button"
                            onClick={() => setFormType("allergy")}
                            className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                                formType === "allergy"
                                    ? "bg-white text-slate-900 shadow-sm dark:bg-[#111821] dark:text-white"
                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            Dị ứng
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormType("history")}
                            className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                                formType === "history"
                                    ? "bg-white text-slate-900 shadow-sm dark:bg-[#111821] dark:text-white"
                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            }`}
                        >
                            Bệnh nền
                        </button>
                    </div>

                    <form id="medical-history-form" onSubmit={handleSubmit} className="space-y-4">
                        {formType === "allergy" ? (
                            <>
                                <Field label="Tên dị ứng" required>
                                    <input
                                        value={allergyForm.allergenName}
                                        onChange={(event) => setAllergyForm((current) => ({ ...current, allergenName: event.target.value }))}
                                        required
                                        placeholder="Ví dụ: Penicillin, tôm cua..."
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                                    />
                                </Field>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
                                    <Field label="Biểu hiện / phản ứng" required>
                                        <input
                                            value={allergyForm.reaction}
                                            onChange={(event) => setAllergyForm((current) => ({ ...current, reaction: event.target.value }))}
                                            required
                                            placeholder="Ví dụ: nổi mẩn, khó thở..."
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                                        />
                                    </Field>

                                    <Field label="Mức độ" required>
                                        <select
                                            value={allergyForm.severity}
                                            onChange={(event) => setAllergyForm((current) => ({ ...current, severity: event.target.value }))}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                                        >
                                            <option value="MILD">Nhẹ</option>
                                            <option value="MODERATE">Trung bình</option>
                                            <option value="SEVERE">Nặng</option>
                                        </select>
                                    </Field>
                                </div>
                            </>
                        ) : (
                            <>
                                <Field label="Tên bệnh / vấn đề cần theo dõi" required>
                                    <input
                                        value={historyForm.conditionName}
                                        onChange={(event) => setHistoryForm((current) => ({ ...current, conditionName: event.target.value }))}
                                        required
                                        placeholder="Ví dụ: Tăng huyết áp, đái tháo đường..."
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                                    />
                                </Field>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Field label="Năm chẩn đoán">
                                        <input
                                            type="number"
                                            min="1900"
                                            max={String(new Date().getFullYear())}
                                            value={historyForm.diagnosisYear}
                                            onChange={(event) => setHistoryForm((current) => ({ ...current, diagnosisYear: event.target.value }))}
                                            placeholder="Ví dụ: 2020"
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                                        />
                                    </Field>

                                    <Field label="Trạng thái theo dõi" required>
                                        <select
                                            value={historyForm.historyStatus}
                                            onChange={(event) => setHistoryForm((current) => ({ ...current, historyStatus: event.target.value }))}
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                                        >
                                            <option value="ACTIVE">Đang theo dõi</option>
                                            <option value="RESOLVED">Đã ổn định</option>
                                            <option value="INACTIVE">Tạm ngưng</option>
                                        </select>
                                    </Field>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </Modal>
        </div>
    );
}

function EmptyPanel({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-[#2d353e] dark:bg-[#0f141b]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <span className="material-symbols-outlined text-slate-400">{icon}</span>
            </div>
            <h5 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h5>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
    );
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "blue" | "rose" }) {
    const toneMap = {
        slate: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
        rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    };

    return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneMap[tone]}`}>{children}</span>;
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            {children}
        </div>
    );
}
