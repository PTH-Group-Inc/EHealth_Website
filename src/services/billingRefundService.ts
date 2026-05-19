import axiosClient from "@/api/axiosClient";
import { BILLING_REFUND_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

// ============================================================
// Billing Refund Service (9.7)
// Yêu cầu hoàn tiền, điều chỉnh hóa đơn & timeline
// ============================================================

export interface RefundRequest {
    id: string;
    invoiceId?: string;
    amount?: number;
    reason?: string;
    status?: "pending" | "approved" | "rejected" | "processed" | "cancelled";
    createdAt?: string;
    [key: string]: any;
}

export interface RefundAdjustment {
    id: string;
    invoiceId?: string;
    amount?: number;
    type?: string;
    status?: string;
    [key: string]: any;
}

export interface RefundDashboardStats {
    totalPending?: number;
    totalApproved?: number;
    totalProcessed?: number;
    totalAmount?: number;
    [key: string]: any;
}

export const billingRefundService = {
    /** Danh sách yêu cầu hoàn tiền */
    getRequests: async (params?: Record<string, any>) => {
        const res = await axiosClient.get(BILLING_REFUND_ENDPOINTS.REQUESTS, { params });
        return unwrapList<RefundRequest>(res);
    },

    /** Chi tiết yêu cầu hoàn */
    getDetail: async (id: string) => {
        const res = await axiosClient.get(BILLING_REFUND_ENDPOINTS.REQUEST_DETAIL(id));
        return unwrap<RefundRequest>(res);
    },

    /** Tạo yêu cầu hoàn tiền cho hóa đơn */
    createRequest: async (invoiceId: string, data: Record<string, any>) => {
        const res = await axiosClient.post(BILLING_REFUND_ENDPOINTS.CREATE_REQUEST, {
            invoiceId,
            ...data,
        });
        return unwrap<RefundRequest>(res);
    },

    /** Duyệt yêu cầu (admin) */
    approve: async (id: string, note?: string) => {
        const res = await axiosClient.patch(BILLING_REFUND_ENDPOINTS.APPROVE(id), { note });
        return unwrap<RefundRequest>(res);
    },

    /** Từ chối yêu cầu */
    reject: async (id: string, reason: string) => {
        const res = await axiosClient.patch(BILLING_REFUND_ENDPOINTS.REJECT(id), { reason });
        return unwrap<RefundRequest>(res);
    },

    /** Thực hiện hoàn tiền */
    processRefund: async (id: string, payload?: Record<string, any>) => {
        const res = await axiosClient.patch(BILLING_REFUND_ENDPOINTS.PROCESS(id), payload ?? {});
        return unwrap<RefundRequest>(res);
    },

    /** Danh sách điều chỉnh */
    getAdjustments: async (params?: Record<string, any>) => {
        const res = await axiosClient.get(BILLING_REFUND_ENDPOINTS.ADJUSTMENTS, { params });
        return unwrapList<RefundAdjustment>(res);
    },

    /** Tạo điều chỉnh cho hóa đơn */
    createAdjustment: async (invoiceId: string, data: Record<string, any>) => {
        const res = await axiosClient.post(BILLING_REFUND_ENDPOINTS.CREATE_ADJUSTMENT, {
            invoiceId,
            ...data,
        });
        return unwrap<RefundAdjustment>(res);
    },

    /** Duyệt điều chỉnh */
    approveAdjustment: async (id: string) => {
        const res = await axiosClient.patch(BILLING_REFUND_ENDPOINTS.APPROVE_ADJUSTMENT(id), {});
        return unwrap<RefundAdjustment>(res);
    },

    /** Áp dụng điều chỉnh */
    applyAdjustment: async (id: string) => {
        const res = await axiosClient.patch(BILLING_REFUND_ENDPOINTS.APPLY_ADJUSTMENT(id), {});
        return unwrap<RefundAdjustment>(res);
    },

    /** Từ chối điều chỉnh */
    rejectAdjustment: async (id: string, reason: string) => {
        const res = await axiosClient.patch(BILLING_REFUND_ENDPOINTS.REJECT_ADJUSTMENT(id), { reject_reason: reason });
        return unwrap<RefundAdjustment>(res);
    },

    /** Timeline xử lý của 1 yêu cầu */
    getTimeline: async (id: string) => {
        const res = await axiosClient.get(BILLING_REFUND_ENDPOINTS.REQUEST_TIMELINE(id));
        return unwrapList<Record<string, any>>(res);
    },

    /** Thống kê dashboard */
    getDashboard: async () => {
        const res = await axiosClient.get(BILLING_REFUND_ENDPOINTS.DASHBOARD);
        return unwrap<RefundDashboardStats>(res);
    },
};

export default billingRefundService;
