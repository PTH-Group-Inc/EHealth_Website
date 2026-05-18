import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "@/components/common/Modal";
import { useToast } from "@/contexts/ToastContext";
import { type PatientProfile } from "@/types/patient-profile";
import {
    createPatientRelation,
    getPatientRelationMedicalDecisionNote,
    getRelationTypes,
    getRelations,
    removePatientRelation,
    setPatientRelationEmergency,
    setPatientRelationLegalRepresentative,
    updatePatientRelation,
    updatePatientRelationMedicalDecisionNote,
    type PatientRelation,
    type PatientRelationType,
} from "@/services/patientService";

interface TabProps {
    profile: PatientProfile;
}

type RelationFormState = {
    contact_name: string;
    relation_type_id: string;
    phone_number: string;
    address: string;
    is_emergency_contact: boolean;
    is_legal_representative: boolean;
    medical_decision_note: string;
};

const INITIAL_FORM: RelationFormState = {
    contact_name: "",
    relation_type_id: "",
    phone_number: "",
    address: "",
    is_emergency_contact: false,
    is_legal_representative: false,
    medical_decision_note: "",
};

export default function OverviewTab({ profile }: TabProps) {
    const { showToast } = useToast();
    const [relations, setRelations] = useState<PatientRelation[]>([]);
    const [relationTypes, setRelationTypes] = useState<PatientRelationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRelation, setSelectedRelation] = useState<PatientRelation | null>(null);
    const [form, setForm] = useState<RelationFormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const loadOverviewData = useCallback(async () => {
        if (!profile.id) {
            setRelations([]);
            setRelationTypes([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [relationsRes, relationTypesRes] = await Promise.all([getRelations(profile.id), getRelationTypes()]);

            if (relationsRes.success) {
                setRelations(Array.isArray(relationsRes.data) ? relationsRes.data : []);
            } else {
                setRelations([]);
                showToast(relationsRes.message || "Không thể tải danh sách người thân.", "error");
            }

            if (relationTypesRes.success) {
                setRelationTypes((relationTypesRes.data || []).filter((item) => item.is_active !== false));
            } else {
                setRelationTypes([]);
                showToast(relationTypesRes.message || "Không thể tải danh mục quan hệ.", "error");
            }
        } finally {
            setLoading(false);
        }
    }, [profile.id, showToast]);

    useEffect(() => {
        loadOverviewData();
    }, [loadOverviewData]);

    const sortedRelations = useMemo(() => {
        return [...relations].sort((a, b) => {
            const legalDiff = Number(Boolean(b.is_legal_representative)) - Number(Boolean(a.is_legal_representative));
            if (legalDiff !== 0) return legalDiff;

            const emergencyDiff = Number(Boolean(b.is_emergency_contact)) - Number(Boolean(a.is_emergency_contact));
            if (emergencyDiff !== 0) return emergencyDiff;

            return (a.contact_name || "").localeCompare(b.contact_name || "", "vi");
        });
    }, [relations]);

    const resetForm = () => {
        setSelectedRelation(null);
        setForm(INITIAL_FORM);
        setErrors({});
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = async (relation: PatientRelation) => {
        setSelectedRelation(relation);
        setErrors({});
        setForm({
            contact_name: relation.contact_name || relation.full_name || "",
            relation_type_id: relation.relation_type_id || "",
            phone_number: relation.phone_number || "",
            address: relation.address || "",
            is_emergency_contact: Boolean(relation.is_emergency_contact),
            is_legal_representative: Boolean(relation.is_legal_representative),
            medical_decision_note: relation.medical_decision_note || "",
        });
        setIsModalOpen(true);

        const noteRes = await getPatientRelationMedicalDecisionNote(relation.patient_contacts_id);
        if (noteRes.success && noteRes.data) {
            setForm((prev) => ({
                ...prev,
                medical_decision_note: noteRes.data?.medical_decision_note || "",
            }));
        }
    };

    const validateForm = () => {
        const nextErrors: Record<string, string> = {};

        if (!form.contact_name.trim()) nextErrors.contact_name = "Vui lòng nhập tên người thân.";
        if (!form.relation_type_id) nextErrors.relation_type_id = "Vui lòng chọn quan hệ.";
        if (!form.phone_number.trim()) nextErrors.phone_number = "Vui lòng nhập số điện thoại.";

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateForm()) return;

        try {
            setSubmitting(true);
            const payload = {
                contact_name: form.contact_name.trim(),
                relation_type_id: form.relation_type_id,
                phone_number: form.phone_number.trim(),
                address: form.address.trim() || undefined,
                is_emergency_contact: form.is_emergency_contact,
            };

            let relationId = selectedRelation?.patient_contacts_id || "";

            if (selectedRelation?.patient_contacts_id) {
                const updateRes = await updatePatientRelation(selectedRelation.patient_contacts_id, payload);
                if (!updateRes.success) {
                    showToast(updateRes.message || "Không thể cập nhật người thân.", "error");
                    return;
                }
            } else {
                const createRes = await createPatientRelation(profile.id, payload);
                if (!createRes.success || !createRes.data?.patient_contacts_id) {
                    showToast(createRes.message || "Không thể thêm người thân.", "error");
                    return;
                }
                relationId = createRes.data.patient_contacts_id;
            }

            const legalRes = await setPatientRelationLegalRepresentative(relationId, form.is_legal_representative);
            if (!legalRes.success) {
                showToast(legalRes.message || "Không thể cập nhật đại diện pháp lý.", "error");
                return;
            }

            const noteRes = await updatePatientRelationMedicalDecisionNote(relationId, form.medical_decision_note.trim());
            if (!noteRes.success) {
                showToast(noteRes.message || "Không thể cập nhật ghi chú quyền quyết định y tế.", "error");
                return;
            }

            showToast(selectedRelation ? "Đã cập nhật người thân." : "Đã thêm người thân.", "success");
            closeModal();
            await loadOverviewData();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (relation: PatientRelation) => {
        if (!window.confirm("Bạn có chắc muốn xóa người thân này?")) return;

        const res = await removePatientRelation(relation.patient_contacts_id);
        if (!res.success) {
            showToast(res.message || "Không thể xóa người thân.", "error");
            return;
        }

        showToast("Đã xóa người thân.", "success");
        await loadOverviewData();
    };

    const handleToggleEmergency = async (relation: PatientRelation) => {
        const res = await setPatientRelationEmergency(relation.patient_contacts_id, !relation.is_emergency_contact);
        if (!res.success) {
            showToast(res.message || "Không thể cập nhật liên hệ khẩn cấp.", "error");
            return;
        }

        showToast(relation.is_emergency_contact ? "Đã gỡ liên hệ khẩn cấp." : "Đã đặt làm liên hệ khẩn cấp.", "success");
        await loadOverviewData();
    };

    const handleToggleLegal = async (relation: PatientRelation) => {
        const res = await setPatientRelationLegalRepresentative(relation.patient_contacts_id, !relation.is_legal_representative);
        if (!res.success) {
            showToast(res.message || "Không thể cập nhật đại diện pháp lý.", "error");
            return;
        }

        showToast(relation.is_legal_representative ? "Đã gỡ đại diện pháp lý." : "Đã đặt làm đại diện pháp lý.", "success");
        await loadOverviewData();
    };

    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-[#2d353e] dark:bg-[#13191f]">
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>badge</span>
                    Thông tin hành chính
                </h3>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <InfoTile label="Họ và tên" value={profile.fullName} />
                    <InfoTile label="Mã bệnh nhân" value={profile.patientCode || profile.id} />
                    <InfoTile label="Quan hệ hồ sơ" value={profile.relationshipLabel} />
                    <InfoTile label="Trạng thái hồ sơ" value={profile.isActive ? "Đang hoạt động" : "Đã ngưng"} />
                    <InfoTile label="Ngày sinh" value={profile.dob ? new Date(profile.dob).toLocaleDateString("vi-VN") : "Chưa cập nhật"} />
                    <InfoTile label="Giới tính" value={profile.gender === "male" ? "Nam" : profile.gender === "female" ? "Nữ" : "Khác"} />
                    <InfoTile label="CCCD/CMND" value={profile.idNumber || "Chưa cập nhật"} />
                    <InfoTile label="Số điện thoại" value={profile.phone || "Chưa cập nhật"} />
                    <InfoTile label="Email" value={profile.email || "Chưa cập nhật"} />
                    <InfoTile label="Địa chỉ" value={profile.address || "Chưa cập nhật"} className="md:col-span-2 xl:col-span-3" />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-[#2d353e] dark:bg-[#13191f]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>
                                family_restroom
                            </span>
                            Người thân
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Quản lý người thân, liên hệ khẩn cấp và đại diện pháp lý của hồ sơ này.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#3C81C6] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2b6cb0]"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>
                        Thêm người thân
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3C81C6] border-t-transparent"></div>
                    </div>
                ) : sortedRelations.length > 0 ? (
                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {sortedRelations.map((relation) => (
                            <RelativeCard
                                key={relation.patient_contacts_id}
                                relation={relation}
                                onEdit={() => openEditModal(relation)}
                                onDelete={() => handleDelete(relation)}
                                onToggleEmergency={() => handleToggleEmergency(relation)}
                                onToggleLegal={() => handleToggleLegal(relation)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-[#2d353e] dark:bg-[#0f141b]">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#3C81C6]/10">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "32px" }}>group</span>
                        </div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white">Chưa có người thân nào</h4>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                            Thêm người thân để tiện theo dõi liên hệ khẩn cấp và người đại diện pháp lý cho hồ sơ này.
                        </p>
                    </div>
                )}
            </section>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={selectedRelation ? "Cập nhật người thân" : "Thêm người thân"}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Tên người thân" error={errors.contact_name}>
                            <input
                                value={form.contact_name}
                                onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                                className="rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </Field>

                        <Field label="Quan hệ" error={errors.relation_type_id}>
                            <select
                                value={form.relation_type_id}
                                onChange={(e) => setForm((prev) => ({ ...prev, relation_type_id: e.target.value }))}
                                className="rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">-- Chọn quan hệ --</option>
                                {relationTypes.map((item) => (
                                    <option key={item.relation_types_id} value={item.relation_types_id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Số điện thoại" error={errors.phone_number}>
                            <input
                                value={form.phone_number}
                                onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                                className="rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </Field>

                        <Field label="Địa chỉ">
                            <input
                                value={form.address}
                                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                                className="rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </Field>
                    </div>

                    <Field label="Ghi chú quyền quyết định y tế">
                        <textarea
                            value={form.medical_decision_note}
                            onChange={(e) => setForm((prev) => ({ ...prev, medical_decision_note: e.target.value }))}
                            rows={3}
                            placeholder="Chỉ lưu khi có nội dung cụ thể."
                            className="rounded-xl border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 focus:border-[#3C81C6] focus:ring-[#3C81C6] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </Field>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-[#0f141b] dark:text-slate-200">
                            <input
                                type="checkbox"
                                checked={form.is_emergency_contact}
                                onChange={(e) => setForm((prev) => ({ ...prev, is_emergency_contact: e.target.checked }))}
                                className="rounded border-gray-300 text-[#3C81C6] focus:ring-[#3C81C6]"
                            />
                            Đặt làm liên hệ khẩn cấp
                        </label>

                        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-[#0f141b] dark:text-slate-200">
                            <input
                                type="checkbox"
                                checked={form.is_legal_representative}
                                onChange={(e) => setForm((prev) => ({ ...prev, is_legal_representative: e.target.checked }))}
                                className="rounded border-gray-300 text-[#3C81C6] focus:ring-[#3C81C6]"
                            />
                            Đặt làm đại diện pháp lý
                        </label>
                    </div>

                    <div className="mt-2 flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={closeModal}
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
                                selectedRelation ? "Lưu cập nhật" : "Thêm người thân"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function InfoTile({ label, value, className = "" }: { label: string; value: string; className?: string }) {
    return (
        <div className={`rounded-2xl bg-slate-50 p-4 dark:bg-[#0f141b] ${className}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
            <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}

function RelativeCard({
    relation,
    onEdit,
    onDelete,
    onToggleEmergency,
    onToggleLegal,
}: {
    relation: PatientRelation;
    onEdit: () => void;
    onDelete: () => void;
    onToggleEmergency: () => void;
    onToggleLegal: () => void;
}) {
    return (
        <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-5 shadow-sm transition-colors hover:border-[#3C81C6]/30 dark:border-[#2d353e] dark:bg-[#0f141b]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                            {relation.contact_name || relation.full_name || "Chưa có tên"}
                        </h4>
                        {relation.is_legal_representative && <Badge tone="indigo">Đại diện pháp lý</Badge>}
                        {relation.is_emergency_contact && <Badge tone="rose">Khẩn cấp</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {relation.relation_type_name || "Chưa có quan hệ"} • {relation.phone_number || "Chưa có số điện thoại"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {relation.address || "Chưa có địa chỉ"}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-[#3C81C6]/40 hover:text-[#3C81C6] dark:border-[#2d353e] dark:text-slate-300"
                >
                    Sửa
                </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton label={relation.is_emergency_contact ? "Gỡ khẩn cấp" : "Đặt khẩn cấp"} onClick={onToggleEmergency} />
                <ActionButton label={relation.is_legal_representative ? "Gỡ đại diện" : "Đặt đại diện"} onClick={onToggleLegal} />
                <ActionButton label="Xóa" tone="danger" onClick={onDelete} />
            </div>
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

function Badge({ children, tone }: { children: React.ReactNode; tone: "indigo" | "rose" }) {
    const tones = {
        indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
        rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    };

    return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

function ActionButton({
    label,
    onClick,
    tone = "default",
}: {
    label: string;
    onClick: () => void;
    tone?: "default" | "danger";
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                tone === "danger"
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300"
                    : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#13191f] dark:text-slate-300"
            }`}
        >
            {label}
        </button>
    );
}
