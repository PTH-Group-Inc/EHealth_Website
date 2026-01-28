"use client";

import { useState, useEffect } from "react";
import { UI_TEXT } from "@/constants/ui-text";
import { MOCK_DOCTOR_PROFILE } from "@/lib/mock-data/doctor";

type SettingsTab = "profile" | "password" | "notifications" | "working_hours" | "appearance";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
    const [profile, setProfile] = useState(MOCK_DOCTOR_PROFILE);
    const [darkMode, setDarkMode] = useState(false);

    // Sync dark mode with system on mount
    useEffect(() => {
        setDarkMode(document.documentElement.classList.contains("dark"));
    }, []);

    const [notifications, setNotifications] = useState({
        newAppointment: true,
        appointmentReminder: true,
        patientMessage: true,
        systemUpdate: false,
        emailNotifications: true,
    });

    const [workingHours, setWorkingHours] = useState([
        { day: "Thứ 2", enabled: true, start: "08:00", end: "17:00" },
        { day: "Thứ 3", enabled: true, start: "08:00", end: "17:00" },
        { day: "Thứ 4", enabled: true, start: "08:00", end: "17:00" },
        { day: "Thứ 5", enabled: true, start: "08:00", end: "17:00" },
        { day: "Thứ 6", enabled: true, start: "08:00", end: "17:00" },
        { day: "Thứ 7", enabled: true, start: "08:00", end: "12:00" },
        { day: "Chủ nhật", enabled: false, start: "", end: "" },
    ]);

    const tabs: { key: SettingsTab; label: string; icon: string }[] = [
        { key: "profile", label: UI_TEXT.DOCTOR.SETTINGS.PROFILE, icon: "person" },
        { key: "password", label: UI_TEXT.DOCTOR.SETTINGS.PASSWORD, icon: "lock" },
        { key: "notifications", label: UI_TEXT.DOCTOR.SETTINGS.NOTIFICATIONS, icon: "notifications" },
        { key: "working_hours", label: UI_TEXT.DOCTOR.SETTINGS.WORKING_HOURS, icon: "schedule" },
        { key: "appearance", label: UI_TEXT.DOCTOR.SETTINGS.APPEARANCE, icon: "palette" },
    ];

    const handleSave = () => {
        alert("Đã lưu thay đổi thành công!");
    };

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        document.documentElement.classList.toggle("dark", newMode);
    };

    return (
        <div className="p-6 md:p-8 h-full">
            <div className="max-w-6xl mx-auto flex flex-col h-full gap-6">
                {/* Page Header */}
                <div>
                    <h2 className="text-2xl font-bold text-[#121417] dark:text-white">
                        {UI_TEXT.DOCTOR.SETTINGS.TITLE}
                    </h2>
                    <p className="text-sm text-[#687582] dark:text-gray-400">
                        {UI_TEXT.DOCTOR.SETTINGS.SUBTITLE}
                    </p>
                </div>

                {/* Settings Content */}
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Tabs Sidebar */}
                    <nav className="w-56 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm p-3 shrink-0">
                        <ul className="space-y-1">
                            {tabs.map((tab) => (
                                <li key={tab.key}>
                                    <button
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key
                                                ? "bg-[#3C81C6]/10 text-[#3C81C6]"
                                                : "text-[#687582] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {tab.icon}
                                        </span>
                                        {tab.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Tab Content */}
                    <div className="flex-1 bg-white dark:bg-[#1e242b] rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] shadow-sm overflow-y-auto">
                        {/* Profile Tab */}
                        {activeTab === "profile" && (
                            <div className="p-6 space-y-6">
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                    {UI_TEXT.DOCTOR.SETTINGS.PROFILE_INFO}
                                </h3>

                                {/* Avatar */}
                                <div className="flex items-center gap-6">
                                    <div className="size-24 rounded-xl bg-[#3C81C6]/10 border-2 border-[#3C81C6]/30 flex items-center justify-center overflow-hidden">
                                        <span className="material-symbols-outlined text-5xl text-[#3C81C6]">
                                            person
                                        </span>
                                    </div>
                                    <div>
                                        <button className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-medium rounded-lg transition-colors">
                                            Tải ảnh mới
                                        </button>
                                        <p className="text-xs text-[#687582] dark:text-gray-400 mt-2">
                                            JPG, PNG hoặc GIF. Kích thước tối đa 2MB.
                                        </p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                            Họ và tên
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.fullName}
                                            onChange={(e) =>
                                                setProfile({ ...profile, fullName: e.target.value })
                                            }
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) =>
                                                setProfile({ ...profile, email: e.target.value })
                                            }
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="tel"
                                            value={profile.phone}
                                            onChange={(e) =>
                                                setProfile({ ...profile, phone: e.target.value })
                                            }
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                            Khoa
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.department}
                                            disabled
                                            className="w-full px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[#687582] dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                            Chức danh
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.title}
                                            disabled
                                            className="w-full px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[#687582] dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                            Mã nhân viên
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.id}
                                            disabled
                                            className="w-full px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[#687582] dark:text-gray-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-lg transition-colors"
                                    >
                                        {UI_TEXT.DOCTOR.SETTINGS.SAVE_CHANGES}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Password Tab */}
                        {activeTab === "password" && (
                            <div className="p-6 space-y-6">
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                    {UI_TEXT.DOCTOR.SETTINGS.CHANGE_PASSWORD}
                                </h3>

                                <div className="max-w-md space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                            {UI_TEXT.DOCTOR.SETTINGS.CURRENT_PASSWORD}
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                            {UI_TEXT.DOCTOR.SETTINGS.NEW_PASSWORD}
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">
                                            {UI_TEXT.DOCTOR.SETTINGS.CONFIRM_PASSWORD}
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 focus:border-[#3C81C6] dark:text-white"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <p className="text-xs text-[#687582] dark:text-gray-400">
                                        Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường
                                        và số.
                                    </p>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-lg transition-colors"
                                    >
                                        {UI_TEXT.DOCTOR.SETTINGS.UPDATE_PASSWORD}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === "notifications" && (
                            <div className="p-6 space-y-6">
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                    {UI_TEXT.DOCTOR.SETTINGS.NOTIFICATION_SETTINGS}
                                </h3>

                                <div className="space-y-4">
                                    {[
                                        {
                                            key: "newAppointment",
                                            label: "Lịch hẹn mới",
                                            description: "Nhận thông báo khi có lịch hẹn mới",
                                        },
                                        {
                                            key: "appointmentReminder",
                                            label: "Nhắc nhở lịch hẹn",
                                            description: "Nhắc nhở 15 phút trước lịch hẹn",
                                        },
                                        {
                                            key: "patientMessage",
                                            label: "Tin nhắn bệnh nhân",
                                            description: "Thông báo khi bệnh nhân gửi tin nhắn",
                                        },
                                        {
                                            key: "systemUpdate",
                                            label: "Cập nhật hệ thống",
                                            description: "Thông báo về bảo trì và tính năng mới",
                                        },
                                        {
                                            key: "emailNotifications",
                                            label: "Thông báo qua Email",
                                            description: "Nhận bản sao thông báo qua email",
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.key}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-[#121417] dark:text-white">
                                                    {item.label}
                                                </p>
                                                <p className="text-xs text-[#687582] dark:text-gray-400">
                                                    {item.description}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setNotifications({
                                                        ...notifications,
                                                        [item.key]:
                                                            !notifications[
                                                            item.key as keyof typeof notifications
                                                            ],
                                                    })
                                                }
                                                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications]
                                                        ? "bg-[#3C81C6]"
                                                        : "bg-gray-300 dark:bg-gray-600"
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1 left-1 size-4 bg-white rounded-full shadow transition-transform ${notifications[
                                                            item.key as keyof typeof notifications
                                                        ]
                                                            ? "translate-x-5"
                                                            : ""
                                                        }`}
                                                ></span>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-lg transition-colors"
                                    >
                                        {UI_TEXT.DOCTOR.SETTINGS.SAVE_CHANGES}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Working Hours Tab */}
                        {activeTab === "working_hours" && (
                            <div className="p-6 space-y-6">
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                    {UI_TEXT.DOCTOR.SETTINGS.MANAGE_SCHEDULE}
                                </h3>

                                <div className="space-y-3">
                                    {workingHours.map((day, index) => (
                                        <div
                                            key={day.day}
                                            className={`flex items-center gap-4 p-4 rounded-lg ${day.enabled
                                                    ? "bg-gray-50 dark:bg-gray-800"
                                                    : "bg-gray-100/50 dark:bg-gray-900/50"
                                                }`}
                                        >
                                            <button
                                                onClick={() => {
                                                    const newHours = [...workingHours];
                                                    newHours[index].enabled = !newHours[index].enabled;
                                                    setWorkingHours(newHours);
                                                }}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${day.enabled
                                                        ? "bg-[#3C81C6]"
                                                        : "bg-gray-300 dark:bg-gray-600"
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1 left-1 size-4 bg-white rounded-full shadow transition-transform ${day.enabled ? "translate-x-5" : ""
                                                        }`}
                                                ></span>
                                            </button>
                                            <span
                                                className={`w-24 text-sm font-medium ${day.enabled
                                                        ? "text-[#121417] dark:text-white"
                                                        : "text-[#687582] dark:text-gray-500"
                                                    }`}
                                            >
                                                {day.day}
                                            </span>
                                            {day.enabled && (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        value={day.start}
                                                        onChange={(e) => {
                                                            const newHours = [...workingHours];
                                                            newHours[index].start = e.target.value;
                                                            setWorkingHours(newHours);
                                                        }}
                                                        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                                    />
                                                    <span className="text-[#687582] dark:text-gray-400">
                                                        -
                                                    </span>
                                                    <input
                                                        type="time"
                                                        value={day.end}
                                                        onChange={(e) => {
                                                            const newHours = [...workingHours];
                                                            newHours[index].end = e.target.value;
                                                            setWorkingHours(newHours);
                                                        }}
                                                        className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                                    <button
                                        onClick={handleSave}
                                        className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-lg transition-colors"
                                    >
                                        {UI_TEXT.DOCTOR.SETTINGS.SAVE_CHANGES}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === "appearance" && (
                            <div className="p-6 space-y-6">
                                <h3 className="text-lg font-bold text-[#121417] dark:text-white">
                                    {UI_TEXT.DOCTOR.SETTINGS.APPEARANCE_SETTINGS}
                                </h3>

                                <div className="space-y-6">
                                    {/* Dark Mode Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[#121417] dark:text-white">
                                                    {darkMode ? "dark_mode" : "light_mode"}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#121417] dark:text-white">
                                                    {UI_TEXT.DOCTOR.SETTINGS.DARK_MODE}
                                                </p>
                                                <p className="text-xs text-[#687582] dark:text-gray-400">
                                                    Bật chế độ tối cho giao diện
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleDarkMode}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${darkMode
                                                    ? "bg-[#3C81C6]"
                                                    : "bg-gray-300 dark:bg-gray-600"
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 left-1 size-4 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-5" : ""
                                                    }`}
                                            ></span>
                                        </button>
                                    </div>

                                    {/* Theme Preview */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${!darkMode
                                                    ? "border-[#3C81C6] bg-white"
                                                    : "border-gray-200 dark:border-gray-700 bg-white"
                                                }`}
                                            onClick={() => {
                                                setDarkMode(false);
                                                document.documentElement.classList.remove("dark");
                                            }}
                                        >
                                            <div className="h-20 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-3xl text-gray-400">
                                                    light_mode
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-center text-gray-800">
                                                {UI_TEXT.DOCTOR.SETTINGS.LIGHT_MODE}
                                            </p>
                                        </div>
                                        <div
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${darkMode
                                                    ? "border-[#3C81C6] bg-[#1e242b]"
                                                    : "border-gray-200 bg-[#1e242b]"
                                                }`}
                                            onClick={() => {
                                                setDarkMode(true);
                                                document.documentElement.classList.add("dark");
                                            }}
                                        >
                                            <div className="h-20 bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-3xl text-gray-500">
                                                    dark_mode
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-center text-gray-300">
                                                {UI_TEXT.DOCTOR.SETTINGS.DARK_MODE}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
