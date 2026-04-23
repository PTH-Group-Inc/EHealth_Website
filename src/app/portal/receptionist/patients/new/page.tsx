"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { EHR_ENDPOINTS } from "@/api/endpoints";
import { extractErrorMessage } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { patientInsuranceService, type InsuranceProvider } from "@/services/patientInsuranceService";
import { createPatient } from "@/services/patientService";
import { validateBHYT, validateDob, validateEmail, validateIdNumber, validateName, validatePhone } from "@/utils/validation";

type FormState = {
    name: string;
    phone: string;
    cccd: string;
    dob: string;
    gender: "MALE" | "FEMALE";
    email: string;
    address: string;
    insurance: string;
    insuranceProviderId: string;
    insuranceStart: string;
    insuranceExpiry: string;
    emergencyContact: string;
    emergencyPhone: string;
    bloodType: string;
    allergies: string;
    medicalHistory: string;
};

const INITIAL_FORM: FormState = {
    name: "",
    phone: "",
    cccd: "",
    dob: "",
    gender: "MALE",
    email: "",
    address: "",
    insurance: "",
    insuranceProviderId: "",
    insuranceStart: "",
    insuranceExpiry: "",
    emergencyContact: "",
    emergencyPhone: "",
    bloodType: "",
    allergies: "",
    medicalHistory: "",
};

function normalizePhoneNumber(value: string) {
    return value.replace(/[\s().-]/g, "");
}

function splitByCommaOrLine(value: string) {
    return value
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function splitHistoryEntries(value: string) {
    return value
        .split(/[\n;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

export default function NewPatientPage() {
    const t = useTranslations("pages.portal.staff.patientsNew");
    const router = useRouter();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [providers, setProviders] = useState<InsuranceProvider[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [formData, setFormData] = useState<FormState>(INITIAL_FORM);

    useEffect(() => {
        const loadProviders = async () => {
            try {
                const response = await patientInsuranceService.getProviders({ limit: 200 });
                setProviders((response.data || []).filter((item) => item.is_active !== false));
            } catch (error) {
                console.error(error);
                setProviders([]);
            } finally {
                setLoadingProviders(false);
            }
        };

        loadProviders();
    }, []);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));

        if (errors[name]) {
            setErrors((current) => ({ ...current, [name]: "" }));
        }
    };

    const validate = () => {
        const nextErrors: Record<string, string> = {};

        const nameResult = validateName(formData.name);
        if (!nameResult.valid) nextErrors.name = nameResult.message;

        const phoneResult = validatePhone(formData.phone);
        if (!phoneResult.valid) nextErrors.phone = phoneResult.message;

        const dobResult = validateDob(formData.dob);
        if (!dobResult.valid) nextErrors.dob = dobResult.message;

        if (formData.cccd) {
            const idResult = validateIdNumber(formData.cccd);
            if (!idResult.valid) nextErrors.cccd = idResult.message;
        }

        if (formData.email) {
            const emailResult = validateEmail(formData.email);
            if (!emailResult.valid) nextErrors.email = emailResult.message;
        }

        if (formData.insurance) {
            const insuranceResult = validateBHYT(formData.insurance);
            if (!insuranceResult.valid) nextErrors.insurance = insuranceResult.message;
            if (!formData.insuranceProviderId) nextErrors.insuranceProviderId = "Vui lòng chọn nhà cung cấp bảo hiểm.";
            if (!formData.insuranceStart) nextErrors.insuranceStart = "Vui lòng chọn ngày bắt đầu bảo hiểm.";
            if (!formData.insuranceExpiry) nextErrors.insuranceExpiry = "Vui lòng chọn ngày hết hạn bảo hiểm.";
            if (formData.insuranceStart && formData.insuranceExpiry && new Date(formData.insuranceStart) > new Date(formData.insuranceExpiry)) {
                nextErrors.insuranceExpiry = "Ngày hết hạn phải sau hoặc bằng ngày bắt đầu.";
            }
        }

        if (formData.emergencyPhone) {
            const emergencyPhoneResult = validatePhone(formData.emergencyPhone);
            if (!emergencyPhoneResult.valid) nextErrors.emergencyPhone = emergencyPhoneResult.message;
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            const response = await createPatient({
                full_name: formData.name.trim(),
                date_of_birth: formData.dob,
                gender: formData.gender,
                identity_type: formData.cccd ? "CCCD" : undefined,
                identity_number: formData.cccd || undefined,
                id_card_number: formData.cccd || undefined,
                phone_number: normalizePhoneNumber(formData.phone),
                email: formData.email.trim() || undefined,
                address: formData.address.trim() || undefined,
                emergency_contact_name: formData.emergencyContact.trim() || undefined,
                emergency_contact_phone: formData.emergencyPhone ? normalizePhoneNumber(formData.emergencyPhone) : undefined,
            });

            if (!response.success || !response.data) {
                throw new Error(response.message || "Tạo hồ sơ bệnh nhân thất bại.");
            }

            const patientId = response.data.patient_id || response.data.id;
            if (!patientId) {
                throw new Error("Không lấy được mã bệnh nhân sau khi tạo hồ sơ.");
            }

            const warnings: string[] = [];

            if (formData.insurance && formData.insuranceProviderId && formData.insuranceStart && formData.insuranceExpiry) {
                try {
                    await patientInsuranceService.createForPatient(patientId, {
                        provider_id: formData.insuranceProviderId,
                        insurance_number: formData.insurance.trim().toUpperCase(),
                        start_date: formData.insuranceStart,
                        end_date: formData.insuranceExpiry,
                        coverage_percent: 80,
                        is_primary: true,
                    });
                } catch (error) {
                    console.error(error);
                    warnings.push("thẻ bảo hiểm");
                }
            }

            const allergyItems = splitByCommaOrLine(formData.allergies);
            if (allergyItems.length > 0) {
                const allergyResults = await Promise.allSettled(
                    allergyItems.map((item) =>
                        axiosClient.post(EHR_ENDPOINTS.ADD_ALLERGY(patientId), {
                            allergen_name: item,
                            allergen_type: "OTHER",
                            reaction: "Chưa ghi rõ phản ứng",
                            severity: "MILD",
                        }),
                    ),
                );

                if (allergyResults.some((result) => result.status === "rejected")) {
                    warnings.push("dị ứng");
                }
            }

            const historyItems = splitHistoryEntries(formData.medicalHistory);
            if (historyItems.length > 0) {
                const historyResults = await Promise.allSettled(
                    historyItems.map((item) =>
                        axiosClient.post(EHR_ENDPOINTS.ADD_MEDICAL_HISTORY(patientId), {
                            condition_name: item,
                            history_type: "PERSONAL",
                            status: "ACTIVE",
                        }),
                    ),
                );

                if (historyResults.some((result) => result.status === "rejected")) {
                    warnings.push("tiền sử bệnh lý");
                }
            }

            showToast("Đã tiếp nhận bệnh nhân mới.", "success");
            if (warnings.length > 0) {
                showToast(`Hồ sơ đã tạo, nhưng còn mục chưa lưu xong: ${warnings.join(", ")}.`, "info");
            }

            if (formData.bloodType) {
                showToast("Nhóm máu hiện chưa có API lưu từ màn tiếp nhận nên tạm chưa ghi nhận tự động.", "info");
            }

            router.push(`/portal/receptionist/patients/${patientId}`);
        } catch (error: any) {
            console.error(error);
            showToast(error?.message || extractErrorMessage(error) || "Tiếp nhận bệnh nhân thất bại.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/portal/receptionist/patients" className="transition-colors hover:text-[#3C81C6]">
                        Bệnh nhân
                    </Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="font-medium text-slate-900 dark:text-white">Tiếp nhận bệnh nhân mới</span>
                </div>

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-[#1e242b] dark:text-slate-300"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Quay lại
                </button>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-[#2d353e] dark:bg-[#111821]">
                <div className="border-b border-slate-200 px-6 py-5 dark:border-[#2d353e]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3C81C6]/10 text-[#3C81C6]">
                            <span className="material-symbols-outlined">person_add</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t("title")}</h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {t("subtitle")}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6">
                    <section className="space-y-5">
                        <SectionTitle icon="badge" title="Thông tin cá nhân" />
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            <InputField label="Họ và tên" name="name" value={formData.name} onChange={handleChange} error={errors.name} required placeholder="Nguyễn Văn A" />
                            <InputField label="Số điện thoại" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} required placeholder="0901 234 567" />
                            <InputField label="CCCD / CMND" name="cccd" value={formData.cccd} onChange={handleChange} error={errors.cccd} placeholder="012345678901" />
                            <InputField label="Ngày sinh" name="dob" type="date" value={formData.dob} onChange={handleChange} error={errors.dob} required />
                            <SelectField
                                label="Giới tính"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                options={[
                                    { label: "Nam", value: "MALE" },
                                    { label: "Nữ", value: "FEMALE" },
                                ]}
                            />
                            <InputField label="Email" name="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="email@example.com" />
                            <div className="md:col-span-2 xl:col-span-3">
                                <InputField
                                    label="Địa chỉ"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-5 border-t border-slate-100 pt-8 dark:border-[#2d353e]">
                        <SectionTitle icon="health_and_safety" title="Bảo hiểm và thông tin y tế" />
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                            <InputField label="Số BHYT" name="insurance" value={formData.insurance} onChange={handleChange} error={errors.insurance} placeholder="HC4012345678" />
                            <SelectField
                                label="Nhà cung cấp"
                                name="insuranceProviderId"
                                value={formData.insuranceProviderId}
                                onChange={handleChange}
                                error={errors.insuranceProviderId}
                                disabled={loadingProviders}
                                options={[
                                    { label: loadingProviders ? "Đang tải..." : "-- Chọn nhà cung cấp --", value: "" },
                                    ...providers.map((provider) => ({
                                        label: provider.provider_code ? `${provider.provider_name} (${provider.provider_code})` : provider.provider_name,
                                        value: provider.insurance_providers_id,
                                    })),
                                ]}
                            />
                            <InputField label="Bắt đầu BHYT" name="insuranceStart" type="date" value={formData.insuranceStart} onChange={handleChange} error={errors.insuranceStart} />
                            <InputField label="Hết hạn BHYT" name="insuranceExpiry" type="date" value={formData.insuranceExpiry} onChange={handleChange} error={errors.insuranceExpiry} />
                            <SelectField
                                label="Nhóm máu"
                                name="bloodType"
                                value={formData.bloodType}
                                onChange={handleChange}
                                helperText="Hiện chưa có API lưu nhóm máu từ màn tiếp nhận."
                                options={[
                                    { label: "-- Chưa rõ --", value: "" },
                                    { label: "A+", value: "A+" },
                                    { label: "A-", value: "A-" },
                                    { label: "B+", value: "B+" },
                                    { label: "B-", value: "B-" },
                                    { label: "AB+", value: "AB+" },
                                    { label: "AB-", value: "AB-" },
                                    { label: "O+", value: "O+" },
                                    { label: "O-", value: "O-" },
                                ]}
                            />
                            <div className="md:col-span-2 xl:col-span-3">
                                <TextAreaField
                                    label="Dị ứng"
                                    name="allergies"
                                    value={formData.allergies}
                                    onChange={handleChange}
                                    helperText="Nhập cách nhau bằng dấu phẩy hoặc xuống dòng. Hệ thống sẽ tạo từng mục dị ứng riêng."
                                    placeholder="Ví dụ: Penicillin, hải sản, phấn hoa..."
                                />
                            </div>
                            <div className="md:col-span-2 xl:col-span-4">
                                <TextAreaField
                                    label="Tiền sử bệnh lý"
                                    name="medicalHistory"
                                    value={formData.medicalHistory}
                                    onChange={handleChange}
                                    helperText="Mỗi dòng hoặc mỗi dấu chấm phẩy sẽ được lưu thành một mục tiền sử riêng."
                                    placeholder={"Ví dụ: Tăng huyết áp\nĐái tháo đường type 2"}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-5 border-t border-slate-100 pt-8 dark:border-[#2d353e]">
                        <SectionTitle icon="emergency" title="Liên hệ khẩn cấp" />
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <InputField label="Người liên hệ" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="Họ tên người thân" />
                            <InputField label="Số điện thoại người liên hệ" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} error={errors.emergencyPhone} placeholder="0901 xxx xxx" />
                        </div>
                    </section>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6 dark:border-[#2d353e]">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-gray-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#3C81C6] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:bg-[#2a6da8] disabled:opacity-60 dark:shadow-none"
                        >
                            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
                            Tiếp nhận bệnh nhân
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
    return (
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">{icon}</span>
            {title}
        </h2>
    );
}

function InputField({
    label,
    name,
    value,
    onChange,
    type = "text",
    placeholder,
    error,
    helperText,
    required = false,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-200">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 dark:bg-slate-900 dark:text-white ${
                    error
                        ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 dark:border-rose-500/40"
                        : "border-slate-200 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-gray-700"
                }`}
            />
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
            {!error && helperText && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
        </div>
    );
}

function SelectField({
    label,
    name,
    value,
    onChange,
    options,
    error,
    helperText,
    disabled = false,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{ label: string; value: string }>;
    error?: string;
    helperText?: string;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-200">{label}</label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all dark:bg-slate-900 dark:text-white ${
                    error
                        ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 dark:border-rose-500/40"
                        : "border-slate-200 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-gray-700"
                }`}
            >
                {options.map((option) => (
                    <option key={`${name}-${option.value}`} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
            {!error && helperText && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
        </div>
    );
}

function TextAreaField({
    label,
    name,
    value,
    onChange,
    placeholder,
    helperText,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    helperText?: string;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-200">{label}</label>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows={3}
                placeholder={placeholder}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-gray-700 dark:bg-slate-900 dark:text-white"
            />
            {helperText && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
        </div>
    );
}
