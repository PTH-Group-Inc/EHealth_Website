"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import axiosClient from "@/api/axiosClient";
import { PROFILE_ENDPOINTS } from "@/api/endpoints";
import { getProfileSessions, deleteProfileSession } from "@/services/authService";
import { validateName, validatePhone, validateDob, validateIdNumber } from "@/utils/validation";

const TABS = [
    { id: "personal", label: "Thông tin cá nhân", icon: "person" },
    { id: "family", label: "Người thân", icon: "group" },
    { id: "security", label: "Bảo mật", icon: "lock" },
];

interface ProfileData {
    fullName: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    idNumber: string;
    address: string;
    avatar?: string;
}

interface FamilyMember {
    id: string;
    name: string;
    dob: string;
    gender: string;
    relation: string;
    phone: string;
}

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("personal");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<ProfileData>({
        fullName: user?.fullName || "",
        phone: user?.phone || "",
        email: user?.email || "",
        dob: "",
        gender: "MALE",
        idNumber: "",
        address: "",
    });
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [showAddFamily, setShowAddFamily] = useState(false);
    const [newFamily, setNewFamily] = useState<Partial<FamilyMember>>({ name: "", dob: "", gender: "male", relation: "", phone: "" });

    // Password change
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Sessions
    const [sessions, setSessions] = useState<any[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    const validateProfile = (): boolean => {
        const errs: Record<string, string> = {};
        const nameRes = validateName(profile.fullName);
        if (!nameRes.valid) errs.fullName = nameRes.message;
        if (profile.phone) {
            const phoneRes = validatePhone(profile.phone);
            if (!phoneRes.valid) errs.phone = phoneRes.message;
        }
        if (profile.dob) {
            const dobRes = validateDob(profile.dob);
            if (!dobRes.valid) errs.dob = dobRes.message;
        }
        if (profile.idNumber) {
            const idRes = validateIdNumber(profile.idNumber);
            if (!idRes.valid) errs.idNumber = idRes.message;
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    useEffect(() => {
        loadProfile();
    }, []);

    // Load sessions khi chuyển sang tab security
    useEffect(() => {
        if (activeTab === "security") {
            loadSessions();
        }
    }, [activeTab]);

    const loadSessions = async () => {
        setSessionsLoading(true);
        try {
            const res = await getProfileSessions();
            const data = res?.data || res?.sessions || [];
            setSessions(Array.isArray(data) ? data : []);
        } catch {
            setSessions([]);
        } finally {
            setSessionsLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            const result = await deleteProfileSession(sessionId);
            if (result.success) {
                setSessions(prev => prev.filter(s => (s.id || s.sessionId) !== sessionId));
                showToast("Đã thu hồi phiên đăng nhập", "success");
            } else {
                showToast(result.message || "Thu hồi thất bại", "error");
            }
        } catch {
            showToast("Đã xảy ra lỗi. Vui lòng thử lại.", "error");
        }
    };

    const loadProfile = async () => {
        try {
            const res = await axiosClient.get(PROFILE_ENDPOINTS.ME);
            const data = res.data?.data || res.data;
            if (data) {
                setProfile({
                    fullName: data.full_name || data.fullName || user?.fullName || "",
                    phone: data.phone_number || data.phone || user?.phone || "",
                    email: data.email || user?.email || "",
                    dob: data.dob || data.dateOfBirth || "",
                    gender: data.gender || "MALE",
                    idNumber: data.identity_card_number || data.idNumber || data.citizenId || "",
                    address: data.address || "",
                    avatar: data.avatar_url?.[0]?.url || data.avatar,
                });
            }
        } catch { /* use defaults */ }
    };

    const handleSave = async () => {
        if (!validateProfile()) {
            showToast("Vui lòng kiểm tra lại thông tin", "error");
            return;
        }
        try {
            setSaving(true);
            await axiosClient.put(PROFILE_ENDPOINTS.ME, {
                full_name: profile.fullName,
                phone_number: profile.phone,
                dob: profile.dob || undefined,
                gender: profile.gender,
                identity_card_number: profile.idNumber || undefined,
                address: profile.address || undefined,
            });
            // Update user context so navbar/sidebar reflect changes
            updateUser({ fullName: profile.fullName, phone: profile.phone });
            // Reload from server to stay in sync
            await loadProfile();
            setEditing(false);
            showToast("Cập nhật thông tin thành công!", "success");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.";
            showToast(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) return;
        try {
            setSaving(true);
            await axiosClient.put(PROFILE_ENDPOINTS.CHANGE_PASSWORD, {
                currentPassword: passwords.current,
                newPassword: passwords.new,
            });
            setPasswords({ current: "", new: "", confirm: "" });
            showToast("Đổi mật khẩu thành công!", "success");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Đổi mật khẩu thất bại.";
            showToast(msg, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleAddFamily = async () => {
        if (!newFamily.name || !newFamily.relation) return;
        try {
            if (user?.id) {
                showToast("Quản lý người thân được thực hiện trong mục Hồ sơ BN.", "error");
            }
            setFamilyMembers(prev => [...prev, { ...newFamily, id: `fm-${Date.now()}` } as FamilyMember]);
            setShowAddFamily(false);
            setNewFamily({ name: "", dob: "", gender: "male", relation: "", phone: "" });
            showToast("Thêm người thân thành công!", "success");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Thêm người thân thất bại.";
            showToast(msg, "error");
        }
    };

    const updateProfile = (key: keyof ProfileData, value: string) => setProfile(prev => ({ ...prev, [key]: value }));

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingAvatar(true);
            const formData = new FormData();
            formData.append("avatar", file);

            const res = await axiosClient.post(PROFILE_ENDPOINTS.AVATAR, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            showToast("Tải ảnh đại diện thành công", "success");
            await loadProfile();
            
            if (res.data?.data?.url) {
                updateUser({ avatar: res.data.data.url });
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Tải ảnh thất bại";
            showToast(msg, "error");
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hồ sơ bệnh nhân</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Quản lý thông tin cá nhân và sức khoẻ</p>
                </div>
            </div>

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative">
                    {profile.avatar ? (
                        <div className="w-20 h-20 rounded-full border border-gray-200 overflow-hidden shadow-lg">
                            <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#3C81C6]/20">
                            {profile.fullName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                    )}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50">
                        <span className={`material-symbols-outlined ${uploadingAvatar ? "animate-spin" : ""}`} style={{ fontSize: "14px" }}>
                            {uploadingAvatar ? "hourglass_empty" : "edit"}
                        </span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleAvatarUpload} 
                        accept="image/*" 
                        className="hidden" 
                    />
                </div>
                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-gray-900">{profile.fullName || "Bệnh nhân"}</h2>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                        {profile.phone && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>call</span>
                                {profile.phone}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {TABS.filter(tab => tab.id !== "family").map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                        ${activeTab === tab.id ? "bg-[#3C81C6] text-white shadow-sm shadow-[#3C81C6]/20" : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                {/* ===== Personal Info ===== */}
                {activeTab === "personal" && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h3>
                            {!editing ? (
                                <button onClick={() => setEditing(true)}
                                    className="px-4 py-2 text-sm font-medium text-[#3C81C6] bg-[#3C81C6]/[0.06] rounded-xl hover:bg-[#3C81C6]/[0.12] transition-colors flex items-center gap-1.5">
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
                                    Chỉnh sửa
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Huỷ</button>
                                    <button onClick={handleSave} disabled={saving}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-[#3C81C6] rounded-xl hover:bg-[#2a6da8] disabled:opacity-50 transition-colors">
                                        {saving ? "Đang lưu..." : "Lưu"}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ProfileField label="Họ và tên" icon="person" value={profile.fullName} onChange={v => { updateProfile("fullName", v); setErrors(e => ({ ...e, fullName: "" })); }} disabled={!editing} error={errors.fullName} />
                            <ProfileField label="Số điện thoại" icon="call" value={profile.phone} onChange={v => { updateProfile("phone", v); setErrors(e => ({ ...e, phone: "" })); }} disabled={!editing} error={errors.phone} />
                            <ProfileField label="Email" icon="mail" value={profile.email} onChange={v => updateProfile("email", v)} disabled />
                            <ProfileField label="Ngày sinh" icon="cake" value={profile.dob} onChange={v => { updateProfile("dob", v); setErrors(e => ({ ...e, dob: "" })); }} disabled={!editing} type="date" error={errors.dob} />
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Giới tính</label>
                                <div className="flex gap-2">
                                    {[{ v: "MALE", l: "Nam" }, { v: "FEMALE", l: "Nữ" }].map(g => (
                                        <button key={g.v} onClick={() => editing && updateProfile("gender", g.v)}
                                            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all
                                            ${profile.gender === g.v ? "border-[#3C81C6] bg-[#3C81C6]/[0.06] text-[#3C81C6]" : "border-gray-200 text-gray-500"}
                                            ${!editing ? "opacity-60 cursor-not-allowed" : ""}`}>
                                            {g.l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <ProfileField label="CCCD/CMND" icon="badge" value={profile.idNumber} onChange={v => { updateProfile("idNumber", v); setErrors(e => ({ ...e, idNumber: "" })); }} disabled={!editing} error={errors.idNumber} />
                            <div className="sm:col-span-2">
                                <ProfileField label="Địa chỉ" icon="location_on" value={profile.address} onChange={v => updateProfile("address", v)} disabled={!editing} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== Family Members ===== */}
                {activeTab === "family" && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Người thân</h3>
                            <button onClick={() => setShowAddFamily(true)}
                                className="px-4 py-2 text-sm font-medium text-[#3C81C6] bg-[#3C81C6]/[0.06] rounded-xl hover:bg-[#3C81C6]/[0.12] transition-colors flex items-center gap-1.5">
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person_add</span>
                                Thêm người thân
                            </button>
                        </div>

                        {familyMembers.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-gray-300 mb-3" style={{ fontSize: "56px" }}>group_off</span>
                                <p className="text-gray-500 font-medium">Chưa có thông tin người thân</p>
                                <p className="text-gray-400 text-sm mt-1">Thêm người thân để đặt lịch khám hộ</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {familyMembers.map(fm => (
                                    <div key={fm.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#3C81C6]/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "20px" }}>person</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{fm.name}</p>
                                                <p className="text-xs text-gray-400">{fm.relation} • {fm.gender === "MALE" ? "Nam" : "Nữ"}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 rounded-lg text-gray-400 hover:text-[#3C81C6] hover:bg-[#3C81C6]/[0.06] transition-colors">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                                            </button>
                                            <button className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add family modal */}
                        {showAddFamily && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowAddFamily(false)}>
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thêm người thân</h3>
                                    <div className="space-y-3">
                                        <ProfileField label="Họ tên" icon="person" value={newFamily.name || ""} onChange={v => setNewFamily(p => ({ ...p, name: v }))} />
                                        <ProfileField label="Số điện thoại" icon="call" value={newFamily.phone || ""} onChange={v => setNewFamily(p => ({ ...p, phone: v }))} />
                                        <ProfileField label="Ngày sinh" icon="cake" value={newFamily.dob || ""} onChange={v => setNewFamily(p => ({ ...p, dob: v }))} type="date" />
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Mối quan hệ</label>
                                            <select value={newFamily.relation || ""} onChange={e => setNewFamily(p => ({ ...p, relation: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30">
                                                <option value="">— Chọn —</option>
                                                <option value="Vợ/Chồng">Vợ/Chồng</option>
                                                <option value="Con">Con</option>
                                                <option value="Cha/Mẹ">Cha/Mẹ</option>
                                                <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                                                <option value="Khác">Khác</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={() => setShowAddFamily(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Huỷ</button>
                                        <button onClick={handleAddFamily} className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#3C81C6] rounded-xl hover:bg-[#2a6da8] transition-colors">Thêm</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== Security ===== */}
                {activeTab === "security" && (
                    <div className="space-y-8">
                        {/* Đổi mật khẩu */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Đổi mật khẩu</h3>
                            <div className="max-w-md space-y-4">
                                <ProfileField label="Mật khẩu hiện tại" icon="lock" value={passwords.current} onChange={v => setPasswords(p => ({ ...p, current: v }))} type="password" />
                                <ProfileField label="Mật khẩu mới" icon="lock" value={passwords.new} onChange={v => setPasswords(p => ({ ...p, new: v }))} type="password" />
                                <ProfileField label="Xác nhận mật khẩu mới" icon="lock" value={passwords.confirm} onChange={v => setPasswords(p => ({ ...p, confirm: v }))} type="password" />
                                {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                                    <p className="text-xs text-red-500">Mật khẩu xác nhận không khớp</p>
                                )}
                                <button onClick={handleChangePassword} disabled={!passwords.current || !passwords.new || passwords.new !== passwords.confirm || saving}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#3C81C6] rounded-xl hover:bg-[#2a6da8] disabled:opacity-50 transition-colors">
                                    {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
                                </button>
                            </div>
                        </div>

                        {/* Phiên đăng nhập */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Phiên đăng nhập</h3>
                                <button onClick={loadSessions} disabled={sessionsLoading}
                                    className="p-2 rounded-lg text-gray-400 hover:text-[#3C81C6] hover:bg-[#3C81C6]/[0.06] transition-colors">
                                    <span className={`material-symbols-outlined ${sessionsLoading ? "animate-spin" : ""}`} style={{ fontSize: "18px" }}>refresh</span>
                                </button>
                            </div>

                            {sessionsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined text-gray-300 mb-2" style={{ fontSize: "48px" }}>devices</span>
                                    <p className="text-gray-500 text-sm">Không có phiên đăng nhập nào khác</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sessions.map((session: any) => {
                                        const sessionId = session.id || session.sessionId;
                                        return (
                                            <div key={sessionId} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-[#3C81C6]/20 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "20px" }}>
                                                            {session.deviceName?.toLowerCase().includes("mobile") ? "phone_android" : "computer"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {session.deviceName || session.clientInfo?.deviceName || "Thiết bị không xác định"}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {session.ipAddress || session.ip || "IP không xác định"}
                                                            {session.lastActive && ` • ${new Date(session.lastActive).toLocaleDateString("vi-VN")}`}
                                                            {session.isCurrent && <span className="ml-2 text-green-600 font-medium">• Phiên hiện tại</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!session.isCurrent && (
                                                    <button
                                                        onClick={() => handleRevokeSession(sessionId)}
                                                        className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                                    >
                                                        Thu hồi
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProfileField({ label, icon, value, onChange, disabled = false, type = "text", error }: {
    label: string; icon: string; value: string; onChange: (v: string) => void; disabled?: boolean; type?: string; error?: string;
}) {
    return (
        <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
            <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400" style={{ fontSize: "18px" }}>{icon}</span>
                <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors
                    ${error ? "border-red-300 focus:ring-red-300/30" : "border-gray-200 focus:ring-[#3C81C6]/30"}
                    ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white text-gray-700"}`} />
            </div>
            {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "12px" }}>error</span>{error}</p>}
        </div>
    );
}
