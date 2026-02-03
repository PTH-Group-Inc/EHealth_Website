"use client";

import { useState, useRef, useEffect } from "react";
import { UI_TEXT } from "@/constants/ui-text";

interface Notification {
    id: string;
    type: "info" | "warning" | "success" | "error";
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: "1",
        type: "warning",
        title: "Thuốc sắp hết hạn",
        message: "5 loại thuốc sẽ hết hạn trong 30 ngày tới",
        time: "5 phút trước",
        read: false,
    },
    {
        id: "2",
        type: "info",
        title: "Lịch trực mới",
        message: "Lịch trực tuần sau đã được cập nhật",
        time: "1 giờ trước",
        read: false,
    },
    {
        id: "3",
        type: "success",
        title: "Nhập kho thành công",
        message: "Đã nhập 50 đơn vị Amoxicillin 500mg",
        time: "2 giờ trước",
        read: true,
    },
    {
        id: "4",
        type: "error",
        title: "Tồn kho thấp",
        message: "Paracetamol 500mg còn 12 đơn vị",
        time: "3 giờ trước",
        read: true,
    },
];

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "warning":
                return { icon: "warning", color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20" };
            case "success":
                return { icon: "check_circle", color: "text-green-500 bg-green-50 dark:bg-green-900/20" };
            case "error":
                return { icon: "error", color: "text-red-500 bg-red-50 dark:bg-red-900/20" };
            default:
                return { icon: "info", color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" };
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                        <h3 className="font-bold text-[#121417] dark:text-white">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-[#3C81C6] hover:underline"
                            >
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-[#687582] dark:text-gray-400">
                                <span className="material-symbols-outlined text-3xl mb-2 block">notifications_off</span>
                                <p className="text-sm">Không có thông báo mới</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const typeStyle = getTypeIcon(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => markAsRead(notification.id)}
                                        className={`p-4 border-b border-[#dde0e4] dark:border-[#2d353e] last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${!notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeStyle.color}`}>
                                                <span className="material-symbols-outlined text-[18px]">{typeStyle.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm font-medium text-[#121417] dark:text-white ${!notification.read ? "font-bold" : ""}`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <span className="w-2 h-2 rounded-full bg-[#3C81C6] flex-shrink-0 mt-1.5"></span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#687582] dark:text-gray-400 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-[#687582] dark:text-gray-500 mt-1">
                                                    {notification.time}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-[#dde0e4] dark:border-[#2d353e]">
                        <button className="w-full py-2 text-sm text-[#3C81C6] hover:bg-[#3C81C6]/5 rounded-lg transition-colors font-medium">
                            Xem tất cả thông báo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
