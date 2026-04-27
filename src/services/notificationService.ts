/**
 * Notification Service
 * Quản lý thông báo — đồng bộ Swagger API
 * 
 * Backend: http://160.250.186.97:3000/api-docs
 * Section: 1.7.1–1.7.5
 */

import axiosClient from '@/api/axiosClient';
import { NOTIFICATION_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface NotificationCategory {
    id: string;
    name: string;
    code: string;
    description?: string;
    isActive?: boolean;
}

export interface NotificationTemplate {
    id: string;
    categoryId: string;
    name: string;
    subject?: string;
    content: string;
    variables?: string[];
    isActive?: boolean;
}

export interface NotificationItem {
    id?: string;
    user_notifications_id?: string;
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
    data_payload?: any;
}

// ============================================
// 1.7.1 Notification Categories
// ============================================

/** GET /api/notifications/categories — Lấy danh sách loại thông báo */
export const getNotificationCategories = async (): Promise<NotificationCategory[]> => {
    try {
        const response = await axiosClient.get(NOTIFICATION_ENDPOINTS.CATEGORIES);
        return response.data.data || [];
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy loại thông báo thất bại');
    }
};

/** POST /api/notifications/categories — Tạo loại thông báo */
export const createNotificationCategory = async (data: Partial<NotificationCategory>): Promise<any> => {
    try {
        const response = await axiosClient.post(NOTIFICATION_ENDPOINTS.CATEGORIES, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo loại thông báo thất bại');
    }
};

/** PUT /api/notifications/categories/{id} — Cập nhật loại thông báo */
export const updateNotificationCategory = async (id: string, data: Partial<NotificationCategory>): Promise<any> => {
    try {
        const response = await axiosClient.put(NOTIFICATION_ENDPOINTS.CATEGORY_UPDATE(id), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật loại thông báo thất bại');
    }
};

/** DELETE /api/notifications/categories/{id} — Xóa loại thông báo */
export const deleteNotificationCategory = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(NOTIFICATION_ENDPOINTS.CATEGORY_DELETE(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa loại thông báo thất bại');
    }
};

// ============================================
// 1.7.2 Notification Templates
// ============================================

/** GET /api/notifications/templates — Lấy danh sách mẫu thông báo */
export const getNotificationTemplates = async (): Promise<NotificationTemplate[]> => {
    try {
        const response = await axiosClient.get(NOTIFICATION_ENDPOINTS.TEMPLATES);
        return response.data.data || [];
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy mẫu thông báo thất bại');
    }
};

/** POST /api/notifications/templates — Tạo mẫu thông báo */
export const createNotificationTemplate = async (data: Partial<NotificationTemplate>): Promise<any> => {
    try {
        const response = await axiosClient.post(NOTIFICATION_ENDPOINTS.TEMPLATES, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo mẫu thông báo thất bại');
    }
};

/** PUT /api/notifications/templates/{id} — Cập nhật mẫu */
export const updateNotificationTemplate = async (id: string, data: Partial<NotificationTemplate>): Promise<any> => {
    try {
        const response = await axiosClient.put(NOTIFICATION_ENDPOINTS.TEMPLATE_UPDATE(id), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật mẫu thông báo thất bại');
    }
};

/** DELETE /api/notifications/templates/{id} — Xóa mẫu */
export const deleteNotificationTemplate = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(NOTIFICATION_ENDPOINTS.TEMPLATE_DELETE(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa mẫu thông báo thất bại');
    }
};

// ============================================
// 1.7.3 Role-based Config
// ============================================

/** GET /api/notifications/role-configs — Xem ma trận cấu hình */
export const getNotificationRoleConfigs = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(NOTIFICATION_ENDPOINTS.ROLE_CONFIGS);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy cấu hình thông báo thất bại');
    }
};

/** PUT /api/notifications/role-configs/{roleId}/{categoryId} — Cấu hình chi tiết */
export const updateNotificationRoleConfig = async (
    roleId: string,
    categoryId: string,
    data: any
): Promise<any> => {
    try {
        const response = await axiosClient.put(
            NOTIFICATION_ENDPOINTS.ROLE_CONFIG_UPDATE(roleId, categoryId),
            data
        );
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật cấu hình thất bại');
    }
};

// ============================================
// 1.7.4 Broadcast
// ============================================

/** POST /api/notifications/inbox/admin-broadcast — Broadcast thông báo */
export const sendAdminBroadcast = async (data: {
    title: string;
    content: string;
    targetRoles?: string[];
}): Promise<any> => {
    try {
        const response = await axiosClient.post(NOTIFICATION_ENDPOINTS.ADMIN_BROADCAST, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Gửi broadcast thất bại');
    }
};

// ============================================
// 1.7.5 User Inbox
// ============================================

/** GET /api/notifications/inbox — Lấy hộp thư */
export const getNotifications = async (params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
}): Promise<{ data: NotificationItem[]; pagination?: any }> => {
    try {
        const response = await axiosClient.get(NOTIFICATION_ENDPOINTS.INBOX, { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông báo thất bại');
    }
};

/** PUT /api/notifications/inbox/{id}/read — Đánh dấu đã đọc */
export const markNotificationAsRead = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.put(NOTIFICATION_ENDPOINTS.MARK_READ(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Đánh dấu đã đọc thất bại');
    }
};

/** PUT /api/notifications/inbox/read-all — Đánh dấu tất cả đã đọc */
export const markAllNotificationsAsRead = async (): Promise<any> => {
    try {
        const response = await axiosClient.put(NOTIFICATION_ENDPOINTS.MARK_ALL_READ);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Đánh dấu tất cả đã đọc thất bại');
    }
};

// ============================================
// Inbox — các method bổ sung
// ============================================

// Local constants cho endpoints chưa có trong NOTIFICATION_ENDPOINTS
const INBOX_DELETE = (id: string) => `/api/notifications/inbox/${id}`;
const INBOX_MARK_READ_PATCH = (id: string) => `/api/notifications/inbox/${id}/read`;

/** DELETE /api/notifications/inbox/:id — Xóa thông báo */
export const deleteNotification = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(INBOX_DELETE(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa thông báo thất bại');
    }
};

/** PATCH /api/notifications/inbox/:id/read — Đánh dấu đã đọc (PATCH thay vì PUT) */
export const patchMarkNotificationRead = async (id: string): Promise<any> => {
    try {
        // Thử PATCH trước, fallback về PUT nếu server dùng PUT
        const response = await axiosClient.patch(INBOX_MARK_READ_PATCH(id));
        return response.data;
    } catch (error: any) {
        // Fallback PUT
        try {
            const res2 = await axiosClient.put(NOTIFICATION_ENDPOINTS.MARK_READ(id));
            return res2.data;
        } catch {
            throw new Error(error.response?.data?.message || 'Đánh dấu đã đọc thất bại');
        }
    }
};

/** PATCH /api/notifications/inbox/read-all — Đánh dấu tất cả (PATCH) */
export const patchMarkAllNotificationsRead = async (): Promise<any> => {
    try {
        const response = await axiosClient.patch('/api/notifications/inbox/read-all');
        return response.data;
    } catch (error: any) {
        // Fallback PUT
        try {
            const res2 = await axiosClient.put(NOTIFICATION_ENDPOINTS.MARK_ALL_READ);
            return res2.data;
        } catch {
            throw new Error(error.response?.data?.message || 'Đánh dấu tất cả đã đọc thất bại');
        }
    }
};

export default {
    // Categories
    getNotificationCategories, createNotificationCategory,
    updateNotificationCategory, deleteNotificationCategory,
    // Templates
    getNotificationTemplates, createNotificationTemplate,
    updateNotificationTemplate, deleteNotificationTemplate,
    // Role configs
    getNotificationRoleConfigs, updateNotificationRoleConfig,
    // Broadcast
    sendAdminBroadcast,
    // Inbox
    getNotifications, markNotificationAsRead, markAllNotificationsAsRead,
    deleteNotification, patchMarkNotificationRead, patchMarkAllNotificationsRead,
};
