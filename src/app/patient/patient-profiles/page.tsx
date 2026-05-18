"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { patientInsuranceService } from "@/services/patientInsuranceService";
import { mapBEToFEProfile, patientProfileService, type PatientProfileBE } from "@/services/patientProfileService";
import { updatePatientStatus } from "@/services/patientService";
import { RELATIONSHIP_OPTIONS, type AvatarImage, type PatientProfile } from "@/types/patient-profile";
import { validateFile } from "@/utils/fileValidation";
import { enrichPatientProfileInsurance, getInsuranceStatusMeta, toPatientRelationshipEnum } from "@/utils/patientProfileHelpers";
import { validateDob, validateIdNumber, validateName, validatePhone } from "@/utils/validation";
import { getImageUrl } from "@/utils/helpers";

type FormState = {
    fullName: string;
    dob: string;
    gender: PatientProfile["gender"];
    phone: string;
    email: string;
    idNumber: string;
    address: string;
    relationship: PatientProfile["relationship"];
    isPrimary: boolean;
};

const EMPTY_FORM: FormState = {
    fullName: "",
    dob: "",
    gender: "male",
    phone: "",
    email: "",
    idNumber: "",
    address: "",
    relationship: "other",
    isPrimary: false,
};

const AVATAR_ALLOWED_TYPES = ["jpg", "jpeg", "png", "webp"];

function normalizePhoneNumber(value: string) {
    return value.replace(/[\s().-]/g, "");
}

function toGenderEnum(value: PatientProfile["gender"]): "MALE" | "FEMALE" | "OTHER" {
    if (value === "male") return "MALE";
    if (value === "female") return "FEMALE";
    return "OTHER";
}

async function hydrateProfile(profile: PatientProfileBE, userId?: string) {
    const baseProfile = mapBEToFEProfile(profile, userId);

    try {
        const insuranceResponse = await patientInsuranceService.getByPatient(profile.id);
        return enrichPatientProfileInsurance(baseProfile, insuranceResponse.data || []);
    } catch {
        return baseProfile;
    }
}

export default function PatientProfilesPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tp = useTranslations("pages.portal.patient.patientProfiles");

    const [profiles, setProfiles] = useState<PatientProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"list" | "form">("list");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [pendingDisableId, setPendingDisableId] = useState<string | null>(null);
    const [initialAvatar, setInitialAvatar] = useState<AvatarImage | null>(null);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [selectedAvatarPreview, setSelectedAvatarPreview] = useState("");
    const [avatarMarkedForDeletion, setAvatarMarkedForDeletion] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement | null>(null);
    const generatedPreviewRef = useRef<string | null>(null);

    const loadProfiles = useCallback(async () => {
        if (!user?.id) {
            setProfiles([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const backendProfiles = await patientProfileService.getMyProfiles();
            const hydratedProfiles = await Promise.all(backendProfiles.map((profile) => hydrateProfile(profile, user.id)));

            hydratedProfiles.sort((left, right) => {
                const primaryDiff = Number(Boolean(right.isPrimary)) - Number(Boolean(left.isPrimary));
                if (primaryDiff !== 0) return primaryDiff;

                const activeDiff = Number(Boolean(right.isActive)) - Number(Boolean(left.isActive));
                if (activeDiff !== 0) return activeDiff;

                return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
            });

            setProfiles(hydratedProfiles);
        } catch (error) {
            console.error(error);
            showToast("Không thể tải danh sách hồ sơ bệnh nhân.", "error");
            setProfiles([]);
        } finally {
            setLoading(false);
        }
    }, [showToast, user?.id]);

    useEffect(() => {
        loadProfiles();
    }, [loadProfiles]);

    useEffect(() => {
        return () => {
            if (generatedPreviewRef.current) {
                URL.revokeObjectURL(generatedPreviewRef.current);
            }
        };
    }, []);

    const clearGeneratedPreview = useCallback(() => {
        if (generatedPreviewRef.current) {
            URL.revokeObjectURL(generatedPreviewRef.current);
            generatedPreviewRef.current = null;
        }
    }, []);

    const resetAvatarState = useCallback((avatar?: AvatarImage | null) => {
        clearGeneratedPreview();
        setInitialAvatar(avatar || null);
        setSelectedAvatarFile(null);
        setSelectedAvatarPreview("");
        setAvatarMarkedForDeletion(false);
        if (avatarInputRef.current) {
            avatarInputRef.current.value = "";
        }
    }, [clearGeneratedPreview]);

    useEffect(() => {
        if (!profiles.length) return;

        const action = searchParams?.get("action");
        const targetId = searchParams?.get("id");
        if (action !== "edit" || !targetId) return;

        const profile = profiles.find((item) => item.id === targetId);
        if (!profile) return;

        setEditingId(profile.id);
        setFormData({
            fullName: profile.fullName,
            dob: profile.dob,
            gender: profile.gender,
            phone: profile.phone,
            email: profile.email || "",
            idNumber: profile.idNumber || "",
            address: profile.address || "",
            relationship: profile.relationship,
            isPrimary: profile.isPrimary,
        });
        setErrors({});
        resetAvatarState(profile.avatarImages?.[0] || null);
        setView("form");
    }, [profiles, resetAvatarState, searchParams]);

    const activeProfiles = useMemo(() => profiles.filter((profile) => profile.isActive), [profiles]);
    const inactiveProfiles = useMemo(() => profiles.filter((profile) => !profile.isActive), [profiles]);

    const openCreate = () => {
        setEditingId(null);
        setErrors({});
        resetAvatarState(null);
        setFormData({
            ...EMPTY_FORM,
            relationship: profiles.length === 0 ? "self" : "other",
            isPrimary: profiles.length === 0,
        });
        setView("form");
    };

    const openEdit = (profile: PatientProfile) => {
        setEditingId(profile.id);
        setErrors({});
        resetAvatarState(profile.avatarImages?.[0] || null);
        setFormData({
            fullName: profile.fullName,
            dob: profile.dob,
            gender: profile.gender,
            phone: profile.phone,
            email: profile.email || "",
            idNumber: profile.idNumber || "",
            address: profile.address || "",
            relationship: profile.relationship,
            isPrimary: profile.isPrimary,
        });
        setView("form");
    };

    const closeForm = () => {
        setView("list");
        setEditingId(null);
        setErrors({});
        setFormData(EMPTY_FORM);
        resetAvatarState(null);

        if (searchParams?.get("action")) {
            router.replace("/patient/patient-profiles");
        }
    };

    const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validation = validateFile(file, {
            allowedTypes: AVATAR_ALLOWED_TYPES,
        });

        if (!validation.valid) {
            showToast(validation.message, "error");
            if (avatarInputRef.current) {
                avatarInputRef.current.value = "";
            }
            return;
        }

        clearGeneratedPreview();
        const previewUrl = URL.createObjectURL(file);
        generatedPreviewRef.current = previewUrl;
        setSelectedAvatarFile(file);
        setSelectedAvatarPreview(previewUrl);
        setAvatarMarkedForDeletion(false);
    };

    const handleAvatarRemove = () => {
        clearGeneratedPreview();
        setSelectedAvatarFile(null);
        setSelectedAvatarPreview("");

        if (initialAvatar?.public_id) {
            setAvatarMarkedForDeletion(true);
        }

        if (avatarInputRef.current) {
            avatarInputRef.current.value = "";
        }
    };

    const validateForm = () => {
        const nextErrors: Record<string, string> = {};

        const nameResult = validateName(formData.fullName, "Họ và tên");
        if (!nameResult.valid) nextErrors.fullName = nameResult.message;

        const phoneResult = validatePhone(formData.phone);
        if (!phoneResult.valid) nextErrors.phone = phoneResult.message;

        const dobResult = validateDob(formData.dob);
        if (!dobResult.valid) nextErrors.dob = dobResult.message;

        if (formData.idNumber) {
            const idResult = validateIdNumber(formData.idNumber);
            if (!idResult.valid) nextErrors.idNumber = idResult.message;
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            showToast("Vui lòng kiểm tra lại thông tin hồ sơ.", "error");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                full_name: formData.fullName.trim(),
                date_of_birth: formData.dob,
                gender: toGenderEnum(formData.gender),
                phone_number: normalizePhoneNumber(formData.phone),
                email: formData.email.trim() || undefined,
                id_card_number: formData.idNumber.trim() || undefined,
                address: formData.address.trim() || undefined,
                relationship: toPatientRelationshipEnum(formData.relationship) as PatientProfileBE["relationship"],
                is_default: formData.isPrimary,
            };

            const savedProfile = editingId
                ? await patientProfileService.update(editingId, payload)
                : await patientProfileService.create(payload);

            let avatarMessage: string | null = null;
            try {
                if (selectedAvatarFile) {
                    await patientProfileService.uploadAvatar(savedProfile.id, selectedAvatarFile);
                    avatarMessage = editingId ? "Ảnh hồ sơ đã được cập nhật." : "Ảnh hồ sơ đã được tải lên.";
                } else if (avatarMarkedForDeletion && initialAvatar?.public_id) {
                    await patientProfileService.deleteAvatar(savedProfile.id, initialAvatar.public_id);
                    avatarMessage = "Ảnh hồ sơ đã được xóa.";
                }
            } catch (avatarError: any) {
                showToast(
                    avatarError?.response?.data?.message || "Đã lưu hồ sơ nhưng chưa thể cập nhật ảnh.",
                    "warning",
                );
            }

            showToast(
                editingId ? "Đã cập nhật hồ sơ bệnh nhân." : "Đã tạo hồ sơ bệnh nhân mới.",
                "success",
            );
            if (avatarMessage) {
                showToast(avatarMessage, "success");
            }

            closeForm();
            await loadProfiles();
        } catch (error: any) {
            showToast(error?.response?.data?.message || "Không thể lưu hồ sơ bệnh nhân.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (profileId: string) => {
        try {
            const result = await updatePatientStatus(profileId, "INACTIVE");
            if (!result.success) {
                showToast(result.message || "Không thể ngưng sử dụng hồ sơ.", "error");
                return;
            }

            showToast("Đã ngưng sử dụng hồ sơ.", "success");
            setPendingDisableId(null);
            await loadProfiles();
        } catch {
            showToast("Không thể ngưng sử dụng hồ sơ.", "error");
        }
    };

    const handleReactivate = async (profileId: string) => {
        try {
            const result = await updatePatientStatus(profileId, "ACTIVE");
            if (!result.success) {
                showToast(result.message || "Không thể kích hoạt lại hồ sơ.", "error");
                return;
            }

            showToast("Đã kích hoạt lại hồ sơ.", "success");
            await loadProfiles();
        } catch {
            showToast("Không thể kích hoạt lại hồ sơ.", "error");
        }
    };

    const displayAvatar = selectedAvatarPreview || (!avatarMarkedForDeletion ? getImageUrl(initialAvatar?.url) || "" : "");
    const canRemoveAvatar = Boolean(selectedAvatarFile || (!avatarMarkedForDeletion && initialAvatar?.url));

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-[#3C81C6]" style={{ fontSize: "32px" }}>
                    progress_activity
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {view === "list" ? (
                <>
                    <section className="flex flex-col gap-3 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200/70 dark:bg-[#111821] dark:ring-[#2d353e] lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="flex items-center gap-2 text-[20px] font-bold leading-tight text-slate-900 dark:text-white">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "28px" }}>
                                    family_restroom
                                </span>
                                {tp("title")}
                            </h1>
                            <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                                {tp("subtitle")}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-gradient-to-r from-[#3C81C6] to-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#3C81C6]/20 transition-all hover:shadow-lg lg:self-auto"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                            Thêm hồ sơ
                        </button>
                    </section>

                    <section className="grid grid-cols-1 gap-4 min-[1200px]:grid-cols-2">
                        {activeProfiles.map((profile) => (
                            <ProfileCard
                                key={profile.id}
                                profile={profile}
                                onEdit={() => openEdit(profile)}
                                onDisable={() => setPendingDisableId(profile.id)}
                            />
                        ))}

                        <button
                            type="button"
                            onClick={openCreate}
                            className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-slate-200 bg-white p-5 text-slate-400 transition-all hover:border-[#3C81C6] hover:text-[#3C81C6] dark:border-[#2d353e] dark:bg-[#111821]"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-[#0f141b]">
                                <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>person_add</span>
                            </div>
                            <p className="text-base font-semibold">Thêm hồ sơ mới</p>
                            <p className="max-w-[240px] text-center text-sm">
                                Tạo thêm hồ sơ cho người thân để đặt lịch, quản lý bảo hiểm và theo dõi lịch sử khám riêng.
                            </p>
                        </button>
                    </section>

                    {inactiveProfiles.length > 0 && (
                        <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#111821]">
                            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Hồ sơ đang tạm ngưng</h3>
                            <div className="mt-4 space-y-3">
                                {inactiveProfiles.map((profile) => (
                                    <div
                                        key={profile.id}
                                        className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-[#0f141b] sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_off</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-700 dark:text-slate-200">{profile.fullName}</p>
                                                <p className="text-xs text-slate-400">{profile.relationshipLabel}</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleReactivate(profile.id)}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#3C81C6] shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-[#111821] dark:ring-[#2d353e]"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>restart_alt</span>
                                            Kích hoạt lại
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            ) : (
                <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#111821]">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-[#2d353e]">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="rounded-2xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>arrow_back</span>
                                </button>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        {editingId ? "Chỉnh sửa hồ sơ" : "Tạo hồ sơ mới"}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Form này đã có đủ nhóm thông tin cơ bản cho một hồ sơ bệnh nhân. Bảo hiểm và người thân quản lý ở các tab riêng sau khi tạo xong.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <section className="rounded-[24px] bg-slate-50 p-4 dark:bg-[#0f141b]">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Ảnh hồ sơ</h3>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#3C81C6] to-[#2563eb] text-white shadow-md">
                                            {displayAvatar ? (
                                                <img src={displayAvatar} alt="Ảnh hồ sơ bệnh nhân" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>person</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => avatarInputRef.current?.click()}
                                                className="rounded-2xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-[#3C81C6] hover:text-[#3C81C6] dark:border-[#2d353e] dark:text-slate-300"
                                            >
                                                {canRemoveAvatar ? "Đổi ảnh" : "Tải ảnh lên"}
                                            </button>
                                            {canRemoveAvatar && (
                                                <button
                                                    type="button"
                                                    onClick={handleAvatarRemove}
                                                    className="rounded-2xl px-4 py-2.5 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                >
                                                    Xóa ảnh
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp"
                                            className="hidden"
                                            onChange={handleAvatarFileChange}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Quan hệ với chủ tài khoản</label>
                                <div className="flex flex-wrap gap-2">
                                    {RELATIONSHIP_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFormData((current) => ({ ...current, relationship: option.value }))}
                                            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-all ${
                                                formData.relationship === option.value
                                                    ? "border-[#3C81C6] bg-[#3C81C6]/10 text-[#3C81C6]"
                                                    : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-[#2d353e] dark:text-slate-300"
                                            }`}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{option.icon}</span>
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormField
                                    label="Họ và tên"
                                    required
                                    value={formData.fullName}
                                    onChange={(value) => setFormData((current) => ({ ...current, fullName: value }))}
                                    error={errors.fullName}
                                />
                                <FormField
                                    label="Số điện thoại"
                                    required
                                    value={formData.phone}
                                    onChange={(value) => setFormData((current) => ({ ...current, phone: value }))}
                                    error={errors.phone}
                                    placeholder="Ví dụ: 0901234567"
                                />
                                <FormField
                                    label="Ngày sinh"
                                    required
                                    type="date"
                                    value={formData.dob}
                                    onChange={(value) => setFormData((current) => ({ ...current, dob: value }))}
                                    error={errors.dob}
                                />
                                <FormField
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(value) => setFormData((current) => ({ ...current, email: value }))}
                                    placeholder="email@example.com"
                                />
                                <FormField
                                    label="CCCD"
                                    value={formData.idNumber}
                                    onChange={(value) => setFormData((current) => ({ ...current, idNumber: value }))}
                                    error={errors.idNumber}
                                    placeholder="9 hoặc 12 chữ số"
                                />
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Giới tính</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: "male", label: "Nam" },
                                            { value: "female", label: "Nữ" },
                                            { value: "other", label: "Khác" },
                                        ].map((item) => (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() => setFormData((current) => ({ ...current, gender: item.value as PatientProfile["gender"] }))}
                                                className={`rounded-2xl border px-3 py-3 text-sm font-medium transition-all ${
                                                    formData.gender === item.value
                                                        ? "border-[#3C81C6] bg-[#3C81C6]/10 text-[#3C81C6]"
                                                        : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-[#2d353e] dark:text-slate-300"
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <FormField
                                label="Địa chỉ"
                                value={formData.address}
                                onChange={(value) => setFormData((current) => ({ ...current, address: value }))}
                                placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                            />

                            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-[#0f141b] dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={formData.isPrimary}
                                    onChange={(event) => setFormData((current) => ({ ...current, isPrimary: event.target.checked }))}
                                    disabled={Boolean(editingId && profiles.find((profile) => profile.id === editingId)?.isPrimary)}
                                    className="mt-0.5 rounded border-slate-300 text-[#3C81C6] focus:ring-[#3C81C6]"
                                />
                                <span>
                                    Đặt làm hồ sơ mặc định
                                    <span className="mt-1 block text-xs text-slate-500">
                                        Hồ sơ mặc định sẽ được ưu tiên khi đặt lịch và hiển thị nhanh ở các màn dành cho bệnh nhân.
                                    </span>
                                </span>
                            </label>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-[#2d353e]">
                            <button
                                type="button"
                                onClick={closeForm}
                                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#2d353e] dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3C81C6] to-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-60"
                            >
                                {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
                                {editingId ? "Lưu thay đổi" : "Tạo hồ sơ"}
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {pendingDisableId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={() => setPendingDisableId(null)}>
                    <div
                        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#111821]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10">
                            <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>person_off</span>
                        </div>
                        <h3 className="text-center text-lg font-semibold text-slate-900 dark:text-white">Ngưng sử dụng hồ sơ này?</h3>
                        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                            Hồ sơ sẽ tạm ẩn khỏi danh sách đặt lịch nhưng vẫn có thể kích hoạt lại khi cần.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setPendingDisableId(null)}
                                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#2d353e] dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeactivate(pendingDisableId)}
                                className="flex-1 rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
                            >
                                Ngưng sử dụng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileCard({
    profile,
    onEdit,
    onDisable,
}: {
    profile: PatientProfile;
    onEdit: () => void;
    onDisable: () => void;
}) {
    const insuranceMeta = getInsuranceStatusMeta(profile.insuranceStatus);

    return (
        <article className="group rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-[#2d353e] dark:bg-[#111821]">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#3C81C6] to-[#2563eb] text-white shadow-lg shadow-[#3C81C6]/20 sm:h-14 sm:w-14">
                        {profile.avatar ? (
                            <img src={getImageUrl(profile.avatar)} alt={profile.fullName} className="h-full w-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined" style={{ fontSize: "26px" }}>
                                {RELATIONSHIP_OPTIONS.find((item) => item.value === profile.relationship)?.icon || "person"}
                            </span>
                        )}
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-[22px]">{profile.fullName}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#3C81C6]/10 px-2.5 py-1 text-[11px] font-bold text-[#3C81C6]">
                                {profile.relationshipLabel}
                            </span>
                            {profile.isPrimary && (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                    Hồ sơ mặc định
                                </span>
                            )}
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${insuranceMeta.className}`}>
                                {insuranceMeta.label}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{profile.patientCode || profile.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#3C81C6] dark:hover:bg-slate-800"
                        title="Chỉnh sửa hồ sơ"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                    </button>
                    <button
                        type="button"
                        onClick={onDisable}
                        disabled={profile.isPrimary}
                        className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-rose-500/10"
                        title={profile.isPrimary ? "Không thể ngưng hồ sơ mặc định" : "Ngưng sử dụng hồ sơ"}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_off</span>
                    </button>
                </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <InfoRow icon="cake" label="Ngày sinh" value={profile.dob ? new Date(`${profile.dob}T00:00:00`).toLocaleDateString("vi-VN") : "Chưa cập nhật"} />
                <InfoRow icon="wc" label="Giới tính" value={profile.gender === "male" ? "Nam" : profile.gender === "female" ? "Nữ" : "Khác"} />
                <InfoRow icon="call" label="Số điện thoại" value={profile.phone || "Chưa cập nhật"} />
                <InfoRow icon="mail" label="Email" value={profile.email || "Chưa cập nhật"} />
                <InfoRow icon="badge" label="CCCD" value={profile.idNumber || "Chưa cập nhật"} />
                <InfoRow icon="health_and_safety" label="Thẻ BHYT" value={profile.insuranceNumber || "Chưa liên kết"} />
            </div>

            <div className="mt-3.5 flex flex-col gap-2.5 border-t border-slate-100 pt-3 dark:border-[#2d353e] sm:flex-row">
                <Link
                    href={`/patient/patient-profiles/${profile.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-[#3C81C6] transition-colors hover:bg-slate-200 dark:bg-[#0f141b] dark:hover:bg-slate-800"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>visibility</span>
                    Xem chi tiết
                </Link>
                <Link
                    href={`/booking?profileId=${profile.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3C81C6] to-[#2563eb] px-3 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_month</span>
                    Đặt lịch
                </Link>
            </div>
        </article>
    );
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2">
            <span className="material-symbols-outlined mt-0.5 text-slate-400" style={{ fontSize: "18px" }}>
                {icon}
            </span>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
            </div>
        </div>
    );
}

function FormField({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    error,
    required = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:ring-4 dark:bg-[#0f141b] dark:text-white ${
                    error
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-500/40 dark:focus:ring-rose-500/10"
                        : "border-slate-200 focus:border-[#3C81C6] focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:focus:ring-[#3C81C6]/10"
                }`}
            />
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </div>
    );
}
