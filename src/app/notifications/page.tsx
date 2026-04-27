"use client";

import { useState, useEffect, Suspense } from "react";
import {
    getNotifications as getNotificationInbox,
    markNotificationAsRead as markNotificationRead,
    markAllNotificationsAsRead as markAllNotificationsRead,
    deleteNotification,
    patchMarkAllNotificationsRead,
    NotificationItem,
} from "@/services/notificationService";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_COLORS: Record<string, string> = {
    "Lịch hẹn": "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
    "Kết quả XN": "bg-purple-50 text-purple-600 dark:bg-purple-900/20",
    "Nhắc nhở": "bg-amber-50 text-amber-600 dark:bg-amber-900/20",
    "Đơn thuốc": "bg-teal-50 text-teal-600 dark:bg-teal-900/20",
    "Thanh toán": "bg-green-50 text-green-600 dark:bg-green-900/20",
    "Hệ thống": "bg-red-50 text-red-600 dark:bg-red-900/20",
};

function sanitizeContent(content?: string, payload?: any): string {
    if (!content) return "";
    // Xử lý ký tự \n hoặc /n nếu nó bị encode nhầm
    let str = content.replace(/\\n/g, '\n').replace(/\/n/g, '\n');
    let parsedPayload = payload;

    if (typeof payload === 'string') {
        try {
            parsedPayload = JSON.parse(payload);
        } catch (e) {
            // Keep original if parsing fails
        }
    }

    if (parsedPayload && typeof parsedPayload === 'object') {
        str = str.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const k = key.trim();
            return parsedPayload[k] !== undefined && parsedPayload[k] !== null ? String(parsedPayload[k]) : match;
        });
    }
    return str.trim();
}

const PayloadDisplay = ({ payload }: { payload?: any }) => {
    if (!payload) return null;
    let data = payload;
    if (typeof payload === 'string') {
        try { data = JSON.parse(payload); } catch (e) {}
    }
    if (typeof data !== 'object' || Object.keys(data).length === 0) return null;

    // Lọc ra các key không mong muốn (ví dụ uuid quá dài, internal keys)
    const entries = Object.entries(data).filter(([k, v]) => {
        if (typeof v === 'object' || v === null || v === '') return false;
        return true;
    });

    if (entries.length === 0) return null;

    return (
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-[13px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-3">
                Dữ liệu bổ sung
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-[#1a2128] p-4 rounded-xl border border-gray-100 dark:border-gray-800/50">
                {entries.map(([k, v]) => (
                    <div key={k} className="flex flex-col">
                        <span className="text-xs font-medium text-[#687582] capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-semibold text-[#121417] dark:text-white break-all">
                            {String(v)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

function HighlightedText({ text, payload }: { text: string, payload?: any }) {
    if (!text) return null;
    const cleanText = sanitizeContent(text, payload);
    const regex = /\b([A-Z]+(?:-[A-Z0-9]+)+|[A-Z]+(?:_[A-Z0-9]+)+)\b/g;
    const parts = cleanText.split(regex);
    
    return (
        <>
            {parts.map((part, i) => {
                if (part.match(regex)) {
                    return (
                        <span key={i} className="inline-block px-1.5 py-0.5 mx-0.5 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-semibold text-sm">
                            {part}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

function timeAgo(iso: string): string {
    if (!iso) return "";
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
}

function formatExactTime(iso: string): string {
    if (!iso) return "";
    return new Date(iso).toLocaleString("vi-VN", {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

type FilterType = "all" | "unread" | "read";

function NotificationsPageContent() {
    const searchParams = useSearchParams();
    const initialSelectedId = searchParams.get("id");
    
    const toast = useToast();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [filter, setFilter] = useState<FilterType>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);

    const LIMIT = 20;

    useEffect(() => {
        setPage(1);
        fetchInbox(1);
    }, []);

    useEffect(() => {
        if (initialSelectedId) {
            setSelectedId(initialSelectedId);
        }
    }, [initialSelectedId]);

    const fetchInbox = async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await getNotificationInbox({ page: pageNum, limit: LIMIT });
            const items: NotificationItem[] = res?.data ?? (res as any) ?? [];
            if (pageNum === 1) {
                setNotifications(items);
            } else {
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.user_notifications_id || n.id));
                    const newItems = items.filter(n => !existingIds.has(n.user_notifications_id || n.id));
                    return [...prev, ...newItems];
                });
            }
            setHasMore(items.length === LIMIT);
        } catch {
            if (pageNum === 1) setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchInbox(next);
    };

    // Derived data
    const categories = Array.from(new Set(notifications.map(n => n.category ?? n.type).filter(Boolean)));
    const unreadCount = notifications.filter(n => !(n.isRead ?? n.is_read)).length;

    const displayed = notifications.filter(n => {
        const isR = n.isRead ?? n.is_read;
        const cat = n.category ?? n.type;
        const readMatch = filter === "all" || (filter === "unread" && !isR) || (filter === "read" && isR);
        const catMatch = categoryFilter === "all" || cat === categoryFilter;
        return readMatch && catMatch;
    });

    const handleMarkRead = async (id: string) => {
        const notif = notifications.find(n => (n.user_notifications_id || n.id) === id);
        if (notif && !(notif.isRead ?? notif.is_read)) {
            setNotifications(prev => prev.map(n => (n.user_notifications_id || n.id) === id ? { ...n, isRead: true, is_read: true } : n));
            try {
                await markNotificationRead(id);
            } catch {}
        }
        setSelectedId(id);
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        setMarkingAll(true);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
        try {
            await patchMarkAllNotificationsRead();
            toast.success("Đã đánh dấu tất cả là đã đọc!");
        } catch {
            try {
                await markAllNotificationsRead();
                toast.success("Đã đánh dấu tất cả là đã đọc!");
            } catch {
                toast.success("Đã đánh dấu tất cả là đã đọc!");
            }
        } finally { setMarkingAll(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingId(id);
        try {
            // Chờ xóa thành công từ API rồi mới update UI
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => (n.user_notifications_id || n.id) !== id));
            if (selectedId === id) setSelectedId(null);
            toast.success("Đã xóa thông báo!");
        } catch (error) {
            toast.error("Xóa thông báo thất bại!");
        } finally {
            setDeletingId(null);
        }
    };

    const selectedNotif = notifications.find(n => (n.user_notifications_id || n.id) === selectedId);

    return (
        <div className="w-full h-[calc(100vh-100px)] bg-white dark:bg-[#13191f] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-[#13191f] border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        Tất cả thông báo
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-sm">
                                {unreadCount}
                            </span>
                        )}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} disabled={markingAll}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#3C81C6] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">done_all</span>
                            <span className="hidden sm:inline">{markingAll ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Body - 2 Pane Layout */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left Pane - List */}
                <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-[#13191f] h-1/2 md:h-full">
                    <div className="p-4 border-b border-gray-50 dark:border-gray-800/50 space-y-3 flex-shrink-0">
                        {/* Filters */}
                        <div className="flex gap-1 bg-[#f6f7f8] dark:bg-[#1e242b] rounded-xl p-1">
                            {([["all", "Tất cả", notifications.length], ["unread", "Chưa đọc", unreadCount], ["read", "Đã đọc", notifications.length - unreadCount]] as const).map(([key, label, count]) => (
                                <button key={key} onClick={() => setFilter(key)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === key ? "bg-white dark:bg-[#2d353e] text-[#121417] dark:text-white shadow-sm" : "text-[#687582] hover:text-[#121417] dark:hover:text-white"}`}>
                                    {label}
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${key === "unread" ? "bg-red-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-[#687582]"}`}>{count}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        
                        {/* Categories */}
                        {categories.length > 0 && (
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                                <button onClick={() => setCategoryFilter("all")}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === "all" ? "bg-[#3C81C6] text-white" : "bg-[#f6f7f8] dark:bg-[#1e242b] text-[#687582] hover:bg-gray-200 dark:hover:bg-gray-800"}`}>
                                    Tất cả
                                </button>
                                {categories.map(cat => (
                                    <button key={cat as string} onClick={() => setCategoryFilter(cat as string)}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat ? "bg-[#3C81C6] text-white" : `${CATEGORY_COLORS[cat as string] ?? "bg-[#f6f7f8] dark:bg-[#1e242b] text-[#687582]"} hover:opacity-80`}`}>
                                        {cat as string}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#fbfcfd] dark:bg-[#1a2026]">
                        {loading && notifications.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse bg-white dark:bg-[#13191f]">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-1" />
                                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
                                </div>
                            ))
                        ) : displayed.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-3 block">notifications_off</span>
                                <p className="text-sm font-medium text-[#121417] dark:text-white mb-1">Không có thông báo</p>
                                <p className="text-xs text-[#687582]">
                                    {filter === "unread" ? "Bạn đã đọc hết thông báo!" : categoryFilter !== "all" ? `Không có thông báo loại "${categoryFilter}"` : "Chưa có thông báo nào."}
                                </p>
                            </div>
                        ) : (
                            <>
                                {displayed.map((notif, index) => {
                                    const notifId = notif.user_notifications_id || notif.id || `temp-${index}`;
                                    const isR = notif.isRead ?? notif.is_read;
                                    const cat = notif.category ?? notif.type;
                                    const isSelected = selectedId === notifId;

                                    return (
                                        <div key={notifId}
                                            className={`group relative w-full text-left rounded-xl border transition-all cursor-pointer overflow-hidden ${
                                                isSelected 
                                                    ? "border-[#3C81C6] bg-blue-50/50 dark:bg-blue-900/20 shadow-sm" 
                                                    : !isR 
                                                        ? "border-blue-100 dark:border-blue-900/30 bg-white dark:bg-[#13191f] hover:border-blue-200 dark:hover:border-blue-800/50" 
                                                        : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#13191f] hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1e242b]"
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3C81C6]" />
                                            )}
                                            <button
                                                className="w-full text-left p-4 flex items-start gap-3"
                                                onClick={() => handleMarkRead(notifId)}>
                                                <div className="mt-1 flex-shrink-0">
                                                    {!isR ? (
                                                        <div className="w-2 h-2 rounded-full bg-[#3C81C6] ring-4 ring-blue-50 dark:ring-blue-900/20" />
                                                    ) : (
                                                        <div className="w-2 h-2 rounded-full bg-transparent" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <p className={`text-sm ${!isR ? "font-bold text-[#121417] dark:text-white" : "font-medium text-[#687582] dark:text-gray-300"} line-clamp-2`}>
                                                            {notif.title}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-[#687582] dark:text-gray-400 line-clamp-2 mb-2">
                                                        <HighlightedText text={notif.content ?? notif.body ?? ""} payload={notif.data_payload} />
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        {cat && (
                                                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${CATEGORY_COLORS[cat] ?? "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                                                                {cat}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-[#687582]">{timeAgo(notif.createdAt ?? notif.created_at ?? "")}</span>
                                                    </div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={e => handleDelete(notifId, e)}
                                                disabled={deletingId === notifId}
                                                className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-[#687582] hover:text-red-500 transition-all disabled:opacity-50"
                                                title="Xóa thông báo">
                                                <span className="material-symbols-outlined text-[16px]">
                                                    {deletingId === notifId ? "hourglass_top" : "delete"}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}

                                {hasMore && (
                                    <button onClick={loadMore}
                                        className="w-full py-3 mt-2 text-sm font-medium text-[#3C81C6] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors border border-transparent hover:border-[#3C81C6]/20 flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                        Tải thêm
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Pane - Detail View */}
                <div className="flex-1 bg-[#f8f9fa] dark:bg-[#0e1318] h-1/2 md:h-full overflow-y-auto">
                    {selectedNotif ? (
                        <div className="p-6 md:p-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {selectedNotif.category && (
                                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${CATEGORY_COLORS[selectedNotif.category ?? selectedNotif.type ?? ""] ?? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                                            {selectedNotif.category ?? selectedNotif.type}
                                        </span>
                                    )}
                                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                                        {formatExactTime(selectedNotif.createdAt ?? selectedNotif.created_at ?? "")}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(selectedNotif.user_notifications_id || selectedNotif.id || "", e)}
                                    disabled={deletingId === (selectedNotif.user_notifications_id || selectedNotif.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    title="Xóa thông báo này"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>

                            <h1 className="text-2xl font-bold text-[#121417] dark:text-white mb-6 leading-tight">
                                {selectedNotif.title}
                            </h1>

                            <div className="bg-white dark:bg-[#13191f] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm">
                                <p className="text-[#3a434d] dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-[15px]">
                                    <HighlightedText text={selectedNotif.content ?? selectedNotif.body ?? ""} payload={selectedNotif.data_payload} />
                                </p>

                                <PayloadDisplay payload={selectedNotif.data_payload} />

                                {(selectedNotif.actionUrl || selectedNotif.action_url) && (
                                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                        <Link 
                                            href={(selectedNotif.actionUrl || selectedNotif.action_url) as string}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2b6cb0] text-white rounded-xl font-medium transition-colors shadow-sm"
                                        >
                                            Xem chi tiết
                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                            <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">mail</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Chọn một thông báo</h3>
                            <p className="text-sm max-w-xs mx-auto">
                                Click vào một thông báo ở danh sách bên trái để xem nội dung chi tiết.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function NotificationsPage() {
    return (
        <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1400px] mx-auto">
            <Suspense fallback={<div className="flex items-center justify-center h-[50vh]"><div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin"></div></div>}>
                <NotificationsPageContent />
            </Suspense>
        </div>
    );
}
