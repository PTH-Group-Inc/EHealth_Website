"use client";

import { useState, useEffect } from "react";
import {
    getNotifications as getNotificationInbox,
    markNotificationAsRead as markNotificationRead,
    markAllNotificationsAsRead as markAllNotificationsRead,
    deleteNotification,
    patchMarkAllNotificationsRead,
    NotificationItem,
} from "@/services/notificationService";
import { useToast } from "@/contexts/ToastContext";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_COLORS: Record<string, string> = {
    "Lịch hẹn": "bg-blue-50 text-blue-600 dark:bg-blue-900/20",
    "Kết quả XN": "bg-purple-50 text-purple-600 dark:bg-purple-900/20",
    "Nhắc nhở": "bg-amber-50 text-amber-600 dark:bg-amber-900/20",
    "Đơn thuốc": "bg-teal-50 text-teal-600 dark:bg-teal-900/20",
    "Thanh toán": "bg-green-50 text-green-600 dark:bg-green-900/20",
    "Hệ thống": "bg-red-50 text-red-600 dark:bg-red-900/20",
};

export function sanitizeContent(content?: string, payload?: any): string {
    if (!content) return "";
    // Chuyển /n thành \n để hiển thị đồng nhất
    let str = content.replace(/\\n/g, '\n').replace(/\/n/g, '\n').replace(/\r\n/g, '\n');
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
    
    // Sửa lỗi dính chữ khi có dấu hai chấm ":"
    str = str.replace(/([a-zA-ZáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ]+):([^\s\n])/g, '$1: $2');

    return str.trim();
}

export const VALUE_TRANSLATIONS: Record<string, string> = {
    "CANCELLED": "Đã hủy",
    "PENDING": "Chờ xử lý",
    "COMPLETED": "Hoàn thành",
    "FAILED": "Thất bại",
    "PAID": "Đã thanh toán",
    "UNPAID": "Chưa thanh toán",
    "ENCOUNTER": "Khám bệnh",
    "APPOINTMENT": "Lịch hẹn",
    "PAYMENT": "Thanh toán",
    "SYSTEM": "Hệ thống",
    "PRESCRIPTION": "Đơn thuốc",
    "LAB_RESULT": "Kết quả XN",
    "REMINDER": "Nhắc nhở"
};

const KEY_TRANSLATIONS: Record<string, string> = {
    invoice_code: "Mã hóa đơn",
    patient_id: "Mã bệnh nhân",
    encounter_id: "Mã phiên khám",
    total_amount: "Tổng tiền",
    discount_amount: "Giảm giá",
    insurance_amount: "Bảo hiểm chi trả",
    net_amount: "Cần thanh toán",
    paid_amount: "Đã thanh toán",
    status: "Trạng thái",
    created_by: "Người tạo",
    created_at: "Thời gian tạo",
    facility_id: "Mã cơ sở",
    notes: "Ghi chú",
    cancelled_reason: "Lý do hủy",
    cancelled_by: "Người hủy",
    cancelled_at: "Thời gian hủy",
    updated_at: "Thời gian cập nhật",
    appointment_id: "Mã lịch hẹn",
    invoice_type: "Loại hóa đơn",
    description: "Mô tả",
    amount: "Số tiền",
    payment_method: "Phương thức thanh toán",
    transaction_id: "Mã giao dịch",
    payment_date: "Ngày thanh toán",
    cashier_id: "Thu ngân",
    refund_amount: "Tiền hoàn lại",
    refund_reason: "Lý do hoàn tiền",
    appointment_date: "Ngày hẹn",
    appointment_time: "Giờ hẹn",
    doctor_id: "Bác sĩ",
    patient_name: "Tên bệnh nhân",
    doctor_name: "Tên bác sĩ",
    specialty: "Chuyên khoa",
    room: "Phòng khám",
    test_code: "Mã xét nghiệm",
    test_name: "Tên xét nghiệm",
    result: "Kết quả",
    normal_range: "Chỉ số bình thường",
    unit: "Đơn vị",
    prescription_code: "Mã đơn thuốc",
    medication: "Tên thuốc",
    dosage: "Liều lượng",
    usage: "Cách dùng",
    quantity: "Số lượng",
    days: "Số ngày",
    reminder_type: "Loại nhắc nhở",
    reminder_date: "Ngày nhắc",
    message: "Lời nhắn",
    slot_time: "Thời gian khám",
    "slot time": "Thời gian khám",
    slotTime: "Thời gian khám",
    appointment_code: "Mã lịch hẹn",
    "appointment code": "Mã lịch hẹn",
    appointmentCode: "Mã lịch hẹn",
    cancellation_reason: "Lý do hủy",
    "cancellation reason": "Lý do hủy",
    cancellationReason: "Lý do hủy",
    deposit_amount: "Tiền cọc",
    "deposit amount": "Tiền cọc",
    depositAmount: "Tiền cọc"
};

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
        
        const lowerK = k.toLowerCase();
        // Ẩn các ID nội bộ
        if (lowerK === 'id' || lowerK.endsWith('_id') || lowerK.endsWith(' id')) return false;
        if (lowerK.includes('uuid')) return false;
        // Ẩn các trường thời gian tạo/cập nhật mặc định hoặc trường nội bộ
        if (['created_at', 'updated_at', 'deleted_at', 'created at', 'updated at', 'deleted at'].includes(lowerK)) return false;
        if (lowerK.includes('source') || lowerK.includes('seed')) return false;

        return true;
    });

    if (entries.length === 0) return null;

    return (
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-[13px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-3">
                Thông tin chi tiết
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-[#1a2128] p-4 rounded-xl border border-gray-100 dark:border-gray-800/50">
                {entries.map(([k, v]) => {
                    const strVal = String(v);
                    const displayVal = VALUE_TRANSLATIONS[strVal.toUpperCase()] || strVal;
                    return (
                        <div key={k} className="flex flex-col">
                            <span className="text-xs font-medium text-[#687582] capitalize">
                                {KEY_TRANSLATIONS[k] || k.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-semibold text-[#121417] dark:text-white break-words mt-0.5">
                                <HighlightedText text={String(displayVal)} />
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export function HighlightedText({ text, payload }: { text: string, payload?: any }) {
    if (!text) return null;
    const cleanText = sanitizeContent(text, payload);
    // Regex for codes like APP-20260425-FA0B, INV-20260425-N8C9, PAT_SEED_1004, and Times/Dates
    const regex = /\b([A-Z]+(?:-[A-Z0-9]+)+|[A-Z]+(?:_[A-Z0-9]+)+|\d{2}:\d{2}(?::\d{2})?(?:\s*-\s*\d{2}:\d{2}(?::\d{2})?)?|\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/g;
    const parts = cleanText.split(regex);
    
    return (
        <span className="whitespace-pre-wrap">
            {parts.map((part, i) => {
                if (part.match(regex)) {
                    return (
                        <span key={i} className="inline-block px-1.5 py-0.5 mx-0.5 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-semibold text-[13px]">
                            {part}
                        </span>
                    );
                }
                const lines = part.split('\n');
                return (
                    <span key={i}>
                        {lines.map((line, j) => (
                            <span key={j}>
                                {line}
                                {j < lines.length - 1 && <br />}
                            </span>
                        ))}
                    </span>
                );
            })}
        </span>
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

interface NotificationInboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialSelectedId?: string | null;
}

export function NotificationInboxModal({ isOpen, onClose, initialSelectedId }: NotificationInboxModalProps) {
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
        if (isOpen) {
            setPage(1);
            fetchInbox(1);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && initialSelectedId) {
            setSelectedId(initialSelectedId);
        }
    }, [isOpen, initialSelectedId]);

    // Setup esc listener and body scroll lock
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const fetchInbox = async (pageNum = 1) => {
        setLoading(true);
        try {
            // Thêm timestamp để bypass cache nếu có
            const timestamp = new Date().getTime();
            const res = await getNotificationInbox({ page: pageNum, limit: LIMIT, t: timestamp } as any);
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
    const categoriesRaw = Array.from(new Set(notifications.map(n => n.category ?? n.type).filter(Boolean)));
    const categories = categoriesRaw.map(c => VALUE_TRANSLATIONS[String(c).toUpperCase()] || String(c));
    const unreadCount = notifications.filter(n => !(n.isRead ?? n.is_read)).length;

    const displayed = notifications.filter(n => {
        const isR = n.isRead ?? n.is_read;
        const catRaw = String(n.category ?? n.type);
        const cat = VALUE_TRANSLATIONS[catRaw.toUpperCase()] || catRaw;
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

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-6xl h-full max-h-[85vh] bg-[#f6f7f8] dark:bg-[#0e1318] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-[#13191f] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
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
                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-2" />
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Body - 2 Pane Layout */}
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Left Pane - List */}
                            <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#13191f] h-1/2 md:h-full">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-800/50 space-y-3 flex-shrink-0">
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
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    {loading && notifications.length === 0 ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse">
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
                                            {displayed.map(notif => {
                                                const notifId = notif.user_notifications_id || notif.id || `temp-${Math.random()}`;
                                                const isR = notif.isRead ?? notif.is_read;
                                                const catRaw = String(notif.category ?? notif.type ?? "");
                                                const cat = VALUE_TRANSLATIONS[catRaw.toUpperCase()] || catRaw;
                                                const isSelected = selectedId === notifId;

                                                return (
                                                    <div key={notifId}
                                                        className={`group relative w-full text-left rounded-xl border transition-all cursor-pointer overflow-hidden ${
                                                            isSelected 
                                                                ? "border-[#3C81C6] bg-blue-50/50 dark:bg-blue-900/20 shadow-sm" 
                                                                : !isR 
                                                                    ? "border-blue-100 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-900/10 hover:border-blue-200 dark:hover:border-blue-800/50" 
                                                                    : "border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1e242b]"
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
                                                                    <div className="w-2 h-2 rounded-full bg-[#3C81C6]" />
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
                                                        {/* Delete button */}
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
                                                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${CATEGORY_COLORS[VALUE_TRANSLATIONS[String(selectedNotif.category ?? selectedNotif.type).toUpperCase()] || String(selectedNotif.category ?? selectedNotif.type)] ?? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                                                        {VALUE_TRANSLATIONS[String(selectedNotif.category ?? selectedNotif.type).toUpperCase()] || String(selectedNotif.category ?? selectedNotif.type)}
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
                                                        onClick={onClose}
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
