"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getNotifications, markNotificationAsRead, patchMarkAllNotificationsRead } from "@/services/notificationService";
import { useRouter } from "next/navigation";
import { NotificationInboxModal, HighlightedText } from "./NotificationInboxModal";

interface NotificationItem {
    id: string;
    title: string;
    content?: string;
    body?: string;
    category?: string;
    type?: string;
    isRead?: boolean;
    is_read?: boolean;
    createdAt?: string;
    created_at?: string;
    actionUrl?: string;
    action_url?: string;
    user_notifications_id?: string;
    data_payload?: any;
}

const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
    appointment: { icon: "calendar_month", color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
    "Lịch hẹn": { icon: "calendar_month", color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
    medication: { icon: "medication", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
    "Nhắc thuốc": { icon: "medication", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
    payment: { icon: "payments", color: "text-violet-500 bg-violet-50 dark:bg-violet-900/20" },
    "Thanh toán": { icon: "payments", color: "text-violet-500 bg-violet-50 dark:bg-violet-900/20" },
    result: { icon: "lab_research", color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
    "Kết quả": { icon: "lab_research", color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
    system: { icon: "info", color: "text-gray-500 bg-gray-50 dark:bg-gray-800" },
};

function timeAgo(iso?: string): string {
    if (!iso) return "";
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(iso).toLocaleDateString("vi-VN");
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [inboxModalOpen, setInboxModalOpen] = useState(false);
    const [initialSelectedId, setInitialSelectedId] = useState<string | null>(null);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getNotifications({ page: 1, limit: 10 });
            const raw = (res as any)?.data?.data ?? (res as any)?.data ?? [];
            const list: NotificationItem[] = Array.isArray(raw) ? raw : [];
            setItems(list);
            setUnreadCount(list.filter(n => !(n.isRead ?? n.is_read)).length);
        } catch {
            setItems([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60_000); // poll mỗi 1 phút
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const handleMarkRead = async (id: string) => {
        try {
            await markNotificationAsRead(id);
            setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            // silent
        }
    };

    const handleItemClick = (id: string | undefined) => {
        if (!id) return;
        handleMarkRead(id);
        setOpen(false);
        setInitialSelectedId(id);
        setInboxModalOpen(true);
    };

    const handleMarkAllRead = async () => {
        try {
            await patchMarkAllNotificationsRead();
            setItems(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
            setUnreadCount(0);
        } catch {
            // silent
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors"
                aria-label="Thông báo"
            >
                <span className="material-symbols-outlined text-[#687582]" style={{ fontSize: "22px" }}>
                    notifications
                </span>
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#1e242b]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2d353e] z-50 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#2d353e]">
                        <div>
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white">Thông báo</h3>
                            <p className="text-xs text-gray-500">{unreadCount > 0 ? `${unreadCount} chưa đọc` : "Tất cả đã đọc"}</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-[#3C81C6] hover:underline font-medium"
                            >
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <span className="material-symbols-outlined text-5xl mb-2">notifications_off</span>
                                <p className="text-sm">Chưa có thông báo</p>
                            </div>
                        ) : (
                            items.map((n, idx) => {
                                const isRead = n.isRead ?? n.is_read ?? false;
                                const cat = n.category ?? n.type ?? "system";
                                const icon = CATEGORY_ICONS[cat] ?? CATEGORY_ICONS.system;
                                const time = timeAgo(n.createdAt ?? n.created_at);
                                const rawUrl = n.actionUrl ?? n.action_url;
                                const url = typeof rawUrl === 'string' && rawUrl.startsWith('/') ? rawUrl : undefined;
                                const content = n.content ?? n.body ?? "";
                                const notifId = n.user_notifications_id || n.id;
                                const itemKey = String(notifId || `notification-${idx}`);

                                const inner = (
                                    <div className={`flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#13191f] transition-colors cursor-pointer border-b border-gray-50 dark:border-[#2d353e]/50 ${!isRead ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}>
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${icon.color}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{icon.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!isRead ? "font-bold text-[#121417] dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"} line-clamp-1`}>
                                                {n.title}
                                            </p>
                                            {content && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 whitespace-pre-wrap"><HighlightedText text={content} payload={(n as any).data_payload} /></p>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-1">{time}</p>
                                        </div>
                                        {!isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
                                    </div>
                                );

                                return (
                                    <div key={itemKey} onClick={() => handleItemClick(notifId)}>
                                        {inner}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 dark:border-[#2d353e] px-4 py-2.5">
                        <button
                            onClick={() => {
                                setOpen(false);
                                setInitialSelectedId(null);
                                setInboxModalOpen(true);
                            }}
                            className="block w-full text-center text-sm text-[#3C81C6] hover:underline font-medium"
                        >
                            Xem tất cả thông báo
                        </button>
                    </div>
                </div>
            )}
            
            <NotificationInboxModal
                isOpen={inboxModalOpen}
                onClose={() => setInboxModalOpen(false)}
                initialSelectedId={initialSelectedId}
            />
        </div>
    );
}
