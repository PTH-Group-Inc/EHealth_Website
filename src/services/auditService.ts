/**
 * Audit Service
 * Quản lý nhật ký hệ thống — đồng bộ Swagger API
 * Backend: /api/system/audit-logs/*
 */

import axiosClient from '@/api/axiosClient';
import { AUDIT_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    userAvatar?: string;
    action: string;
    actionType: string;
    moduleName: string;
    target?: string;
    targetId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress: string;
    userAgent: string;
    status: 'SUCCESS' | 'FAILED' | 'WARNING';
    timestamp: string;
}

export interface AuditLogListResponse {
    data: AuditLog[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// ============================================
// Helpers
// ============================================

/** Map trạng thái HTTP method → status hiển thị */
function deriveStatus(raw: any): 'SUCCESS' | 'FAILED' | 'WARNING' {
    const status = (raw.status ?? raw.http_status ?? '').toString().toUpperCase();
    if (status === 'FAILED' || status === 'ERROR') return 'FAILED';
    if (status === 'WARNING') return 'WARNING';
    return 'SUCCESS';
}

/** Map action_type sang label tiếng Việt */
function mapActionLabel(actionType: string): string {
    const map: Record<string, string> = {
        CREATE: 'Tạo mới',
        UPDATE: 'Cập nhật',
        DELETE: 'Xóa',
        LOGIN: 'Đăng nhập',
        LOGOUT: 'Đăng xuất',
        IMPORT: 'Nhập dữ liệu',
        EXPORT: 'Xuất dữ liệu',
    };
    return map[actionType?.toUpperCase()] ?? actionType ?? 'N/A';
}

/** Unwrap 1 audit log từ backend (snake_case → camelCase) */
function unwrapLog(raw: any): AuditLog {
    return {
        id: raw.log_id ?? raw.id ?? '',
        userId: raw.user_id ?? '',
        userName: raw.user_name ?? raw.user_email?.split('@')[0] ?? '',
        userEmail: raw.user_email ?? '',
        userRole: raw.user_role ?? raw.role ?? 'N/A',
        userAvatar: raw.avatar ?? raw.avatar_url ?? undefined,
        action: mapActionLabel(raw.action_type),
        actionType: raw.action_type ?? '',
        moduleName: raw.module_name ?? '',
        target: raw.module_name ?? raw.target_id ?? undefined,
        targetId: raw.target_id ?? undefined,
        oldValue: raw.old_value ?? undefined,
        newValue: raw.new_value ?? undefined,
        ipAddress: raw.ip_address ?? '',
        userAgent: raw.user_agent ?? '',
        status: deriveStatus(raw),
        timestamp: raw.created_at ?? '',
    };
}

/** Unwrap danh sách audit logs từ response backend */
function unwrapLogs(res: any): AuditLog[] {
    const raw = res?.data ?? res?.items ?? res ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map(unwrapLog);
}

// ============================================
// Service
// ============================================

export const auditService = {
    /**
     * GET /api/system/audit-logs — Danh sách audit logs có phân trang & filter
     */
    getLogs: async (params?: {
        page?: number;
        limit?: number;
        module_name?: string;
        action_type?: string;
        user_id?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<AuditLogListResponse> => {
        try {
            const response = await axiosClient.get(AUDIT_ENDPOINTS.LIST, { params });
            const resData = response.data;
            return {
                data: unwrapLogs(resData),
                pagination: {
                    total: resData.pagination?.total ?? 0,
                    page: resData.pagination?.page ?? params?.page ?? 1,
                    limit: resData.pagination?.limit ?? params?.limit ?? 20,
                    totalPages: resData.pagination?.total_pages ?? resData.pagination?.totalPages ?? 0,
                },
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Lấy nhật ký hoạt động thất bại');
        }
    },

    /**
     * GET /api/system/audit-logs/:id — Chi tiết 1 dòng log
     */
    getLogById: async (id: string): Promise<AuditLog> => {
        try {
            const response = await axiosClient.get(AUDIT_ENDPOINTS.DETAIL(id));
            const raw = response.data?.data ?? response.data;
            return unwrapLog(raw);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Lấy chi tiết nhật ký thất bại');
        }
    },

    /**
     * GET /api/system/audit-logs/export-excel — Xuất Excel
     * Trả về Blob để download
     */
    exportExcel: async (params?: {
        user_id?: string;
        module_name?: string;
        action_type?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<Blob> => {
        try {
            const response = await axiosClient.get(AUDIT_ENDPOINTS.EXPORT_EXCEL, {
                params,
                responseType: 'blob',
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Xuất nhật ký thất bại');
        }
    },
};
