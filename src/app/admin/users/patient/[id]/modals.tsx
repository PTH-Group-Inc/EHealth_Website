"use client";
import { useState, useEffect } from "react";
import axiosClient from "@/api/axiosClient";
import { PATIENT_ENDPOINTS, PATIENT_CONTACT_ENDPOINTS, PATIENT_PROFILE_ENDPOINTS } from "@/api/endpoints";
import { getImageUrl } from "@/utils/helpers";

/* ══════════ SHARED MODAL OVERLAY ══════════ */
function ModalOverlay({ open, onClose, title, icon, children, width = "max-w-lg" }: {
    open: boolean; onClose: () => void; title: string; icon: string; children: React.ReactNode; width?: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className={`relative bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto border border-[#dde0e4] dark:border-[#2d353e]`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#dde0e4] dark:border-[#2d353e] sticky top-0 bg-white dark:bg-[#1e242b] z-10">
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">{icon}</span>{title}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined text-[20px] text-gray-500">close</span>
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

function InputField({ label, icon, ...props }: { label: string; icon: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
            <label className="block text-sm font-semibold text-[#121417] dark:text-white mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-gray-400">{icon}</span>{label}
            </label>
            <input {...props} className="w-full px-3 py-2.5 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-white dark:bg-[#2d353e] text-sm text-[#121417] dark:text-white focus:ring-2 focus:ring-[#3C81C6] focus:border-transparent outline-none transition-all" />
        </div>
    );
}

function SelectField({ label, icon, children, ...props }: { label: string; icon: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div>
            <label className="block text-sm font-semibold text-[#121417] dark:text-white mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-gray-400">{icon}</span>{label}
            </label>
            <select {...props} className="w-full px-3 py-2.5 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-white dark:bg-[#2d353e] text-sm text-[#121417] dark:text-white focus:ring-2 focus:ring-[#3C81C6] focus:border-transparent outline-none transition-all">
                {children}
            </select>
        </div>
    );
}

/* ══════════ 1. VIEW PROFILE DETAIL MODAL ══════════ */
export function ViewProfileModal({ open, onClose, profile }: { open: boolean; onClose: () => void; profile: any }) {
    if (!profile) return null;
    const fmt = (iso?: string) => { if (!iso) return "-"; try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso; } };
    const genderMap: Record<string, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };
    const rows = [
        { l: "Họ và tên", v: profile.full_name, i: "person" },
        { l: "Ngày sinh", v: fmt(profile.date_of_birth || profile.dob), i: "cake" },
        { l: "Giới tính", v: genderMap[profile.gender] || profile.gender || "-", i: "wc" },
        { l: "CCCD/CMND", v: profile.id_card_number || profile.identity_card_number || "-", i: "id_card" },
        { l: "Số điện thoại", v: profile.phone_number || "-", i: "call" },
        { l: "Email", v: profile.email || "-", i: "email" },
        { l: "Địa chỉ", v: profile.address || "-", i: "pin_drop" },
        { l: "Quan hệ", v: REL_LABELS[profile.relationship] || profile.relationship || "Bản thân", i: "family_restroom" },
        { l: "Mặc định", v: profile.is_default ? "Có" : "Không", i: "star" },
        { l: "Mã BN", v: profile.patient_code || profile.id || "-", i: "tag" },
    ];
    const avatar = profile.avatar_url || profile.avatar;

    return (
        <ModalOverlay open={open} onClose={onClose} title="Chi tiết hồ sơ bệnh nhân" icon="visibility">
            <div className="flex flex-col items-center mb-6 pt-2">
                <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-[#1e242b] shadow-md overflow-hidden flex items-center justify-center mb-3">
                    {avatar ? (
                        <img src={getImageUrl(avatar)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="material-symbols-outlined text-4xl text-gray-300">person</span>
                    )}
                </div>
                <h4 className="text-lg font-bold text-[#121417] dark:text-white">{profile.full_name}</h4>
                <p className="text-sm text-[#687582]">{REL_LABELS[profile.relationship] || "Bản thân"}</p>
            </div>
            <div className="space-y-3">
                {rows.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#dde0e4] dark:border-[#2d353e] last:border-0">
                        <span className="material-symbols-outlined text-[18px] text-[#687582]">{r.i}</span>
                        <div className="flex-1">
                            <p className="text-xs text-[#687582]">{r.l}</p>
                            <p className="text-sm font-medium text-[#121417] dark:text-white">{r.v}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ModalOverlay>
    );
}

/* ══════════ 2. ADD / EDIT PROFILE MODAL ══════════ */
const RELATIONSHIPS = ["SELF", "PARENT", "CHILD", "SPOUSE", "SIBLING", "OTHER"];
const REL_LABELS: Record<string, string> = { SELF: "Bản thân", PARENT: "Cha/Mẹ", CHILD: "Con", SPOUSE: "Vợ/Chồng", SIBLING: "Anh/Chị/Em", OTHER: "Khác" };
const GENDERS = [{ v: "MALE", l: "Nam" }, { v: "FEMALE", l: "Nữ" }, { v: "OTHER", l: "Khác" }];

export function ProfileFormModal({ open, onClose, onSuccess, profile, accountId }: {
    open: boolean; onClose: () => void; onSuccess: () => void; profile?: any; accountId: string;
}) {
    const isEdit = !!profile;
    const [form, setForm] = useState({ full_name: "", date_of_birth: "", gender: "MALE", phone_number: "", email: "", id_card_number: "", address: "", relationship: "SELF", is_default: false });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (profile) {
            setForm({
                full_name: profile.full_name || "",
                date_of_birth: (profile.date_of_birth || profile.dob || "").slice(0, 10),
                gender: profile.gender || "MALE",
                phone_number: profile.phone_number || "",
                email: profile.email || "",
                id_card_number: profile.id_card_number || profile.identity_card_number || "",
                address: profile.address || "",
                relationship: profile.relationship || "SELF",
                is_default: !!profile.is_default,
            });
        } else {
            setForm({ full_name: "", date_of_birth: "", gender: "MALE", phone_number: "", email: "", id_card_number: "", address: "", relationship: "SELF", is_default: false });
        }
        setAvatarFile(null);
        setError("");
    }, [profile, open]);

    useEffect(() => {
        if (!avatarFile) {
            setAvatarPreviewUrl("");
            return;
        }
        const url = URL.createObjectURL(avatarFile);
        setAvatarPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    const handleSave = async () => {
        if (!form.full_name.trim()) { setError("Họ và tên là bắt buộc"); return; }
        if (!form.date_of_birth) { setError("Ngày sinh là bắt buộc"); return; }
        setSaving(true); setError("");
        try {
            let patientId = String(profile?.id || "");
            if (isEdit) {
                // Admin edit: use PUT /api/patients/:id
                patientId = String(profile.id);
                await axiosClient.put(PATIENT_ENDPOINTS.UPDATE(patientId), {
                    full_name: form.full_name,
                    date_of_birth: form.date_of_birth,
                    gender: form.gender,
                    phone_number: form.phone_number || undefined,
                    email: form.email || undefined,
                    id_card_number: form.id_card_number || undefined,
                    address: form.address || undefined,
                    relationship: form.relationship,
                    is_default: form.is_default,
                });
            } else {
                // Admin create: POST /api/patients then link account
                const createRes = await axiosClient.post(PATIENT_ENDPOINTS.CREATE, {
                    full_name: form.full_name,
                    date_of_birth: form.date_of_birth,
                    gender: form.gender,
                    phone_number: form.phone_number || undefined,
                    email: form.email || undefined,
                    id_card_number: form.id_card_number || undefined,
                    address: form.address || undefined,
                    relationship: form.relationship,
                    is_default: form.is_default,
                });
                // Link the newly created patient to the target account
                patientId = String(createRes.data?.data?.id || "");
                if (patientId && accountId) {
                    await axiosClient.patch(PATIENT_ENDPOINTS.LINK_ACCOUNT(patientId), {
                        account_id: accountId,
                    });
                }
            }

            if (avatarFile && patientId) {
                try {
                    const formData = new FormData();
                    formData.append("avatar", avatarFile);
                    await axiosClient.post(PATIENT_PROFILE_ENDPOINTS.AVATAR_UPLOAD(patientId), formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                } catch (err: any) {
                    onSuccess();
                    setError(err?.response?.data?.message || "Lưu hồ sơ thành công nhưng upload avatar thất bại");
                    return;
                }
            }
            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.response?.data?.message || "Có lỗi xảy ra");
        } finally { setSaving(false); }
    };

    return (
        <ModalOverlay open={open} onClose={onClose} title={isEdit ? "Chỉnh sửa hồ sơ" : "Thêm hồ sơ mới"} icon={isEdit ? "edit" : "person_add"}>
            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#121417] dark:text-white mb-1.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">photo_camera</span>Avatar
                    </label>
                    <div className="flex items-center gap-4 p-3 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl bg-white dark:bg-[#2d353e]">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-[#dde0e4] dark:border-[#2d353e] overflow-hidden flex items-center justify-center shrink-0">
                            {avatarPreviewUrl || profile?.avatar_url || profile?.avatar ? (
                                <img
                                    src={avatarPreviewUrl || getImageUrl(profile?.avatar_url || profile?.avatar)}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="material-symbols-outlined text-3xl text-gray-300">person</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                id="patient-avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setAvatarFile(file);
                                }}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <label
                                    htmlFor="patient-avatar-upload"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-[#3C81C6] dark:text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">upload</span>
                                    {avatarFile ? "Đổi ảnh" : "Tải ảnh"}
                                </label>
                                {avatarFile && (
                                    <button
                                        type="button"
                                        onClick={() => setAvatarFile(null)}
                                        className="px-4 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Bỏ chọn
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-[#687582] dark:text-gray-400 mt-2">JPG/PNG/WebP — tối đa 5MB</p>
                        </div>
                    </div>
                </div>
                <div className="sm:col-span-2"><InputField label="Họ và tên *" icon="person" value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Nguyễn Văn A" /></div>
                <InputField label="Ngày sinh *" icon="cake" type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
                <SelectField label="Giới tính" icon="wc" value={form.gender} onChange={e => set("gender", e.target.value)}>
                    {GENDERS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
                </SelectField>
                <InputField label="Số điện thoại" icon="call" value={form.phone_number} onChange={e => set("phone_number", e.target.value)} placeholder="0901234567" />
                <InputField label="Email" icon="email" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
                <InputField label="CCCD/CMND" icon="id_card" value={form.id_card_number} onChange={e => set("id_card_number", e.target.value)} placeholder="012345678901" />
                <SelectField label="Quan hệ" icon="family_restroom" value={form.relationship} onChange={e => set("relationship", e.target.value)}>
                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{REL_LABELS[r]}</option>)}
                </SelectField>
                <div className="sm:col-span-2"><InputField label="Địa chỉ" icon="pin_drop" value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Đường ABC, Quận 1" /></div>
                <div className="sm:col-span-2 flex items-center gap-3">
                    <input type="checkbox" id="is_default" checked={form.is_default} onChange={e => set("is_default", e.target.checked)} className="w-4 h-4 text-[#3C81C6] rounded" />
                    <label htmlFor="is_default" className="text-sm font-medium text-[#121417] dark:text-white">Đặt làm hồ sơ mặc định</label>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                <button onClick={onClose} className="px-4 py-2.5 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Hủy</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-all disabled:opacity-50 flex items-center gap-2">
                    {saving && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                    {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo hồ sơ"}
                </button>
            </div>
        </ModalOverlay>
    );
}

/* ══════════ 3. ADD CONTACT MODAL ══════════ */
export function ContactFormModal({ open, onClose, onSuccess, profiles }: {
    open: boolean; onClose: () => void; onSuccess: () => void; profiles: any[];
}) {
    const [form, setForm] = useState({ patient_id: "", relation_type_id: "", contact_name: "", phone_number: "", address: "", is_emergency_contact: false });
    const [relationTypes, setRelationTypes] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setForm({ patient_id: profiles[0]?.id || "", relation_type_id: "", contact_name: "", phone_number: "", address: "", is_emergency_contact: false });
            setError("");
            axiosClient.get("/api/relation-types").then(res => {
                const items = res.data?.data || res.data || [];
                const list = Array.isArray(items) ? items : [];
                setRelationTypes(list.filter((rt: any) => rt?.is_active !== false));
            }).catch(() => setRelationTypes([]));
        }
    }, [open, profiles]);

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    const handleSave = async () => {
        if (!form.patient_id) { setError("Vui lòng chọn hồ sơ bệnh nhân"); return; }
        if (!form.contact_name.trim()) { setError("Họ tên liên hệ là bắt buộc"); return; }
        if (!form.phone_number.trim()) { setError("Số điện thoại là bắt buộc"); return; }
        if (!form.relation_type_id) { setError("Vui lòng chọn loại quan hệ"); return; }
        setSaving(true); setError("");
        try {
            await axiosClient.post(PATIENT_CONTACT_ENDPOINTS.CREATE, form);
            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.response?.data?.message || "Có lỗi xảy ra");
        } finally { setSaving(false); }
    };

    return (
        <ModalOverlay open={open} onClose={onClose} title="Thêm liên hệ người thân" icon="person_add">
            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">{error}</div>}
            <div className="space-y-4">
                <SelectField label="Hồ sơ bệnh nhân *" icon="folder_shared" value={form.patient_id} onChange={e => set("patient_id", e.target.value)}>
                    <option value="">-- Chọn hồ sơ --</option>
                    {profiles.map(p => (
                        <option key={`profile-${p.id}`} value={p.id}>
                            {p.full_name} {p.is_default ? "(Mặc định)" : ""} — {REL_LABELS[p.relationship] || p.relationship || "Bản thân"}
                        </option>
                    ))}
                </SelectField>
                <InputField label="Họ tên người liên hệ *" icon="person" value={form.contact_name} onChange={e => set("contact_name", e.target.value)} placeholder="Nguyễn Thị B" />
                <InputField label="Số điện thoại *" icon="call" value={form.phone_number} onChange={e => set("phone_number", e.target.value)} placeholder="0987654321" />
                <SelectField label="Loại quan hệ *" icon="family_restroom" value={form.relation_type_id} onChange={e => set("relation_type_id", e.target.value)}>
                    <option value="">-- Chọn quan hệ --</option>
                    {relationTypes.map((rt, i) => (
                        <option
                            key={`rel-type-${rt.relation_types_id || rt.relation_type_id || rt.id || i}`}
                            value={rt.relation_types_id || rt.relation_type_id || rt.id || ""}
                        >
                            {rt.name || rt.relation_type_name || rt.code || "--"}
                        </option>
                    ))}
                </SelectField>
                <InputField label="Địa chỉ" icon="pin_drop" value={form.address} onChange={e => set("address", e.target.value)} placeholder="456 Đường XYZ" />
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="is_emergency" checked={form.is_emergency_contact} onChange={e => set("is_emergency_contact", e.target.checked)} className="w-4 h-4 text-[#3C81C6] rounded" />
                    <label htmlFor="is_emergency" className="text-sm font-medium text-[#121417] dark:text-white">Đánh dấu liên hệ khẩn cấp</label>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                <button onClick={onClose} className="px-4 py-2.5 border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Hủy</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-[#3C81C6] text-white rounded-xl text-sm font-bold hover:bg-[#2a6da8] transition-all disabled:opacity-50 flex items-center gap-2">
                    {saving && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                    {saving ? "Đang lưu..." : "Thêm liên hệ"}
                </button>
            </div>
        </ModalOverlay>
    );
}
