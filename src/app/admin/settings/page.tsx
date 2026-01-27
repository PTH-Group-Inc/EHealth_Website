"use client";

import { useState } from "react";
import { UI_TEXT } from "@/constants/ui-text";

interface UserProfile {
    fullName: string;
    email: string;
    phone: string;
    avatar?: string;
    role: string;
    department?: string;
    createdAt: string;
}

const MOCK_USER: UserProfile = {
    fullName: "Nguyễn Văn Admin",
    email: "admin@ehealth.vn",
    phone: "0912345678",
    role: "Quản trị viên",
    department: "Phòng CNTT",
    createdAt: "2023-01-15",
};

export default function SettingsPage() {
    const [user, setUser] = useState<UserProfile>(MOCK_USER);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(MOCK_USER);
    const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences">("profile");

    const handleSave = () => {
        setUser(editForm);
        setIsEditing(false);
    };

    return (
        <>
            {/* Page Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">
                    Cài đặt tài khoản
                </h1>
                <p className="text-[#687582] dark:text-gray-400">
                    Quản lý thông tin cá nhân và cài đặt bảo mật
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                {[
                    { id: "profile", label: "Thông tin cá nhân", icon: "person" },
                    { id: "security", label: "Bảo mật", icon: "lock" },
                    { id: "preferences", label: "Tùy chọn", icon: "tune" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                            ? "bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white shadow-sm"
                            : "text-[#687582] hover:text-[#121417] dark:hover:text-white"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                {activeTab === "profile" && (
                    <div className="p-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6 pb-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <div className="w-24 h-24 rounded-full bg-[#3C81C6]/10 flex items-center justify-center text-[#3C81C6]">
                                <span className="material-symbols-outlined text-[48px]">person</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">{user.fullName}</h3>
                                <p className="text-sm text-[#687582] dark:text-gray-400">{user.role}</p>
                                <button className="mt-2 text-sm text-[#3C81C6] hover:underline flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                                    Thay đổi ảnh đại diện
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                                        Họ và tên
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.fullName}
                                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                        />
                                    ) : (
                                        <p className="px-4 py-3 text-sm text-[#121417] dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl">{user.fullName}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                                        Email
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                        />
                                    ) : (
                                        <p className="px-4 py-3 text-sm text-[#121417] dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl">{user.email}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                                        Số điện thoại
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                        />
                                    ) : (
                                        <p className="px-4 py-3 text-sm text-[#121417] dark:text-white bg-gray-50 dark:bg-gray-800 rounded-xl">{user.phone}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                                        Phòng ban
                                    </label>
                                    <p className="px-4 py-3 text-sm text-[#687582] bg-gray-50 dark:bg-gray-800 rounded-xl">{user.department || "Chưa cập nhật"}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditForm(user);
                                            }}
                                            className="px-5 py-2.5 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                        >
                                            {UI_TEXT.COMMON.CANCEL}
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-5 py-2.5 text-sm font-bold text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-xl shadow-md transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">save</span>
                                            {UI_TEXT.COMMON.SAVE}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-5 py-2.5 text-sm font-bold text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-xl shadow-md transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                        Chỉnh sửa thông tin
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "security" && (
                    <div className="p-6 space-y-6">
                        {/* Change Password */}
                        <div className="pb-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h3 className="text-base font-bold text-[#121417] dark:text-white mb-4">Đổi mật khẩu</h3>
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                                        Mật khẩu hiện tại
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                                        Mật khẩu mới
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                                        Xác nhận mật khẩu mới
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button className="px-5 py-2.5 text-sm font-bold text-white bg-[#3C81C6] hover:bg-[#2a6da8] rounded-xl shadow-md transition-all">
                                    Cập nhật mật khẩu
                                </button>
                            </div>
                        </div>

                        {/* Two Factor */}
                        <div>
                            <h3 className="text-base font-bold text-[#121417] dark:text-white mb-4">Xác thực hai yếu tố</h3>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div>
                                    <p className="text-sm font-medium text-[#121417] dark:text-white">Xác thực qua SMS</p>
                                    <p className="text-xs text-[#687582]">Nhận mã OTP qua số điện thoại đã đăng ký</p>
                                </div>
                                <button className="px-4 py-2 text-sm font-medium text-[#3C81C6] border border-[#3C81C6] rounded-lg hover:bg-[#3C81C6]/10 transition-colors">
                                    Kích hoạt
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "preferences" && (
                    <div className="p-6 space-y-6">
                        {/* Language */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px] text-[#687582]">language</span>
                                <div>
                                    <p className="text-sm font-medium text-[#121417] dark:text-white">Ngôn ngữ</p>
                                    <p className="text-xs text-[#687582]">Chọn ngôn ngữ hiển thị</p>
                                </div>
                            </div>
                            <select className="px-4 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white">
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        {/* Timezone */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px] text-[#687582]">schedule</span>
                                <div>
                                    <p className="text-sm font-medium text-[#121417] dark:text-white">Múi giờ</p>
                                    <p className="text-xs text-[#687582]">Thiết lập múi giờ hiển thị</p>
                                </div>
                            </div>
                            <select className="px-4 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white">
                                <option value="Asia/Ho_Chi_Minh">GMT+7 (Hà Nội)</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </div>

                        {/* Email Notifications */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px] text-[#687582]">mail</span>
                                <div>
                                    <p className="text-sm font-medium text-[#121417] dark:text-white">Thông báo Email</p>
                                    <p className="text-xs text-[#687582]">Nhận thông báo quan trọng qua email</p>
                                </div>
                            </div>
                            <button className="relative w-11 h-6 rounded-full transition-colors bg-[#3C81C6]">
                                <span className="absolute top-1 left-6 w-4 h-4 bg-white rounded-full shadow-sm"></span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
