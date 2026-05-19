"use client";

/**
 * ProfileCard — form chỉnh sửa hồ sơ cá nhân unified.
 * Style section-based giống user-form-modal của admin (yêu cầu user):
 * - Vùng trái: Avatar upload + Vai trò (readonly cho self-edit)
 * - Vùng phải: Thông tin cá nhân + Địa chỉ + Công tác (optional)
 *
 * Dùng cho: doctor/receptionist/pharmacist tại trang settings tab "profile".
 * Admin vẫn dùng user-form-modal riêng vì có thêm field quyền (role, facility assign).
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { profileService, type MyProfile } from "@/services/profileService";
import { getImageUrl } from "@/utils/helpers";
import { useToast } from "@/contexts/ToastContext";

type RoleLabel = "Bác sĩ" | "Dược sĩ" | "Lễ tân" | "Quản trị viên" | "Nhân viên";

/** Convert ISO datetime or date string to yyyy-MM-dd for <input type="date"> */
const toDateInput = (v?: string | null): string => {
    if (!v) return "";
    // Already yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // ISO datetime — take first 10 chars
    try { return new Date(v).toISOString().slice(0, 10); } catch { return ""; }
};

const ROLE_META: Record<string, { label: RoleLabel; icon: string; desc: string }> = {
    ADMIN: { label: "Quản trị viên", icon: "shield_person", desc: "Toàn quyền hệ thống" },
    DOCTOR: { label: "Bác sĩ", icon: "stethoscope", desc: "Quản lý khám bệnh" },
    PHARMACIST: { label: "Dược sĩ", icon: "medical_information", desc: "Cấp phát thuốc & kho" },
    RECEPTIONIST: { label: "Lễ tân", icon: "support_agent", desc: "Tiếp đón bệnh nhân" },
    STAFF: { label: "Nhân viên", icon: "person", desc: "Nhân viên phòng khám" },
};

const roleMeta = (role?: string) => ROLE_META[(role ?? "STAFF").toUpperCase()] ?? ROLE_META.STAFF;

export interface ProfileCardProps {
    /** Role chính của user — readonly, chỉ admin mới đổi được */
    currentRole?: string;
    /** Có hiển thị section "Công tác & Phân công" không (tùy role) */
    showWorkAssignment?: boolean;
}

export function ProfileCard({ currentRole, showWorkAssignment = true }: ProfileCardProps) {
    const { showToast } = useToast();
    const [me, setMe] = useState<MyProfile | null>(null);
    const [form, setForm] = useState<Partial<MyProfile> & { address?: string; position?: string }>({});
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        profileService.getMe()
            .then(p => {
                setMe(p);
                setForm(p);
                const avatar = (p as any).avatarUrl ?? (p as any).avatar_url;
                if (avatar) setAvatarPreview(getImageUrl(avatar));
            })
            .catch(() => showToast("Không tải được hồ sơ", "error"));
    }, [showToast]);

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast("Ảnh tối đa 5MB", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);

        setUploadingAvatar(true);
        try {
            await profileService.uploadAvatar(file);
            const updated = await profileService.getMe();
            setMe(updated);
            const avatar = (updated as any).avatarUrl ?? (updated as any).avatar_url;
            if (avatar) setAvatarPreview(getImageUrl(avatar));
            showToast("Đã cập nhật ảnh đại diện", "success");
        } catch (err: any) {
            showToast(err?.message ?? "Upload thất bại", "error");
            setAvatarPreview(me ? getImageUrl((me as any).avatarUrl ?? (me as any).avatar_url) : null);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const onRemoveAvatar = async () => {
        if (!avatarPreview || !confirm("Xoá ảnh đại diện?")) return;
        try {
            await profileService.deleteAvatar();
            setAvatarPreview(null);
            const updated = await profileService.getMe();
            setMe(updated);
            showToast("Đã xoá ảnh đại diện", "success");
        } catch (err: any) {
            showToast(err?.message ?? "Xoá thất bại", "error");
        }
    };

    const onSave = async () => {
        setSaving(true);
        try {
            const updated = await profileService.updateMe(form);
            setMe(updated);
            showToast("Đã lưu hồ sơ", "success");
        } catch (err: any) {
            showToast(err?.response?.data?.message ?? err?.message ?? "Lưu thất bại", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!me) {
        return (
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-2xl p-8 text-center text-[#687582]">
                Đang tải hồ sơ…
            </div>
        );
    }

    const role = roleMeta(currentRole ?? (me as any).role);

    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                <h2 className="text-xl font-bold text-[#121417] dark:text-white">Chỉnh sửa hồ sơ</h2>
                <p className="text-sm text-[#687582] dark:text-gray-400 mt-1">Cập nhật thông tin cá nhân của bạn</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 p-6 md:items-start">
                {/* Left: Avatar + Role */}
                <div className="w-full md:w-[32%] flex flex-col items-center p-6 bg-gray-50/50 dark:bg-[#161b22]/30 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <h3 className="w-full text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-widest">
                        Ảnh đại diện
                    </h3>
                    <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-[#1e242b] shadow-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                            {avatarPreview ? (
                                <Image src={avatarPreview} alt="Avatar" width={128} height={128} className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">person</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                                <span className="material-symbols-outlined text-2xl mb-1">
                                    {uploadingAvatar ? "hourglass_empty" : "photo_camera"}
                                </span>
                                <span className="text-[10px] font-medium tracking-wide">
                                    {uploadingAvatar ? "Đang tải…" : "Thay đổi"}
                                </span>
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-[#3C81C6] text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-[#1e242b] hover:bg-[#2a6da8] transition-colors">
                            <span className="material-symbols-outlined text-[16px] leading-none">edit</span>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mb-4 leading-relaxed px-2">
                        Tỉ lệ 1:1.<br />Cho phép JPG, PNG, WEBP (tối đa 5MB).
                    </p>
                    {avatarPreview && (
                        <button
                            onClick={onRemoveAvatar}
                            className="text-xs text-rose-600 hover:underline mb-4"
                        >
                            Xoá ảnh
                        </button>
                    )}

                    <div className="w-full pt-6 mt-auto border-t border-[#dde0e4] dark:border-[#2d353e]">
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest">
                            Vai trò
                        </p>
                        <div className="p-3 rounded-xl border-2 border-[#3C81C6] bg-[#3C81C6]/5 dark:bg-[#3C81C6]/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#3C81C6]/10 text-[#3C81C6]">
                                <span className="material-symbols-outlined text-[20px]">{role.icon}</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#3C81C6]">{role.label}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{role.desc}</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-[#687582] mt-2">
                            Chỉ quản trị viên mới có thể đổi vai trò.
                        </p>
                    </div>
                </div>

                {/* Right: Form fields */}
                <div className="flex-1 space-y-6">
                    <section>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-[#121417] dark:text-white mb-4">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#3C81C6]/10 text-[#3C81C6]">
                                <span className="material-symbols-outlined text-[20px]">badge</span>
                            </span>
                            Thông tin cá nhân
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#687582] dark:text-gray-400 mb-1">Họ và tên</label>
                                <input
                                    value={form.fullName ?? (form as any).full_name ?? ""}
                                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#121417] focus:border-[#3C81C6] focus:ring-2 focus:ring-[#3C81C6]/20 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#687582] dark:text-gray-400 mb-1">Email</label>
                                <input
                                    value={form.email ?? ""}
                                    disabled
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-gray-50 dark:bg-gray-900 text-[#687582]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#687582] dark:text-gray-400 mb-1">Số điện thoại</label>
                                <input
                                    value={form.phone ?? ""}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="0xxxxxxxxx"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#121417] focus:border-[#3C81C6] focus:ring-2 focus:ring-[#3C81C6]/20 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#687582] dark:text-gray-400 mb-1">Ngày sinh</label>
                                <input
                                    type="date"
                                    value={toDateInput((form as any).date_of_birth ?? (form as any).dob)}
                                    onChange={e => setForm({ ...form, date_of_birth: e.target.value } as any)}
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#121417] focus:border-[#3C81C6] focus:ring-2 focus:ring-[#3C81C6]/20 outline-none transition-colors"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-[#687582] dark:text-gray-400 mb-1">Địa chỉ</label>
                                <input
                                    value={(form as any).address ?? ""}
                                    onChange={e => setForm({ ...form, address: e.target.value } as any)}
                                    placeholder="Số nhà, đường, quận, thành phố"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#121417] focus:border-[#3C81C6] focus:ring-2 focus:ring-[#3C81C6]/20 outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </section>

                    {showWorkAssignment && (
                        <section>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-[#121417] dark:text-white mb-4">
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600">
                                    <span className="material-symbols-outlined text-[20px]">work</span>
                                </span>
                                Công tác & Phân công
                            </h3>
                            <p className="text-xs text-[#687582] mb-3">Chỉ xem — liên hệ quản trị viên để thay đổi.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#687582] dark:text-gray-400 mb-1">Cơ sở y tế</label>
                                    <input value={(me as any).facilityName ?? "—"} disabled className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-gray-50 dark:bg-gray-900 text-[#687582]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#687582] dark:text-gray-400 mb-1">Chi nhánh</label>
                                    <input value={(me as any).branchName ?? "—"} disabled className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-gray-50 dark:bg-gray-900 text-[#687582]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#687582] dark:text-gray-400 mb-1">Khoa / Phòng ban</label>
                                    <input value={(me as any).departmentName ?? "—"} disabled className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-gray-50 dark:bg-gray-900 text-[#687582]" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#687582] dark:text-gray-400 mb-1">Chuyên khoa</label>
                                    <input value={(me as any).specialtyName ?? "—"} disabled className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-gray-50 dark:bg-gray-900 text-[#687582]" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-[#687582] dark:text-gray-400 mb-1">Vị trí công tác</label>
                                    <input value={(me as any).position ?? "—"} disabled className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#dde0e4] dark:border-[#2d353e] bg-gray-50 dark:bg-gray-900 text-[#687582]" />
                                </div>
                            </div>
                        </section>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                        <button
                            onClick={() => setForm(me)}
                            className="px-4 py-2.5 text-sm font-medium rounded-xl border border-[#dde0e4] dark:border-[#2d353e] text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Huỷ thay đổi
                        </button>
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="px-6 py-2.5 text-sm font-bold rounded-xl bg-[#3C81C6] text-white hover:bg-[#2a6da8] disabled:opacity-50 shadow-md shadow-blue-200 dark:shadow-none transition-all"
                        >
                            {saving ? "Đang lưu…" : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfileCard;
