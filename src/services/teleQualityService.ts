import axiosClient from "@/api/axiosClient";
import { TELE_QUALITY_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

// ============================================================
// Tele Quality Service (8.8)
// Metric chất lượng, cảnh báo, đánh giá từ BN
// ============================================================

export interface QualityMetric {
    sessionId?: string;
    latency?: number;
    jitter?: number;
    packetLoss?: number;
    bitrate?: number;
    timestamp?: string;
    [key: string]: any;
}

export interface QualityAlert {
    id: string;
    sessionId?: string;
    type?: string;
    severity?: "info" | "warning" | "critical";
    resolved?: boolean;
    createdAt?: string;
    [key: string]: any;
}

export interface QualityReview {
    id: string;
    consultationId?: string;
    rating?: number;
    comment?: string;
    createdAt?: string;
    [key: string]: any;
}

export interface QualityDashboard {
    totalSessions?: number;
    avgRating?: number;
    alertCount?: number;
    [key: string]: any;
}

export const teleQualityService = {
    /** Metric chất lượng tổng quan (latency, jitter, packet loss) */
    getMetrics: async (params?: Record<string, any>) => {
        const res = await axiosClient.get(TELE_QUALITY_ENDPOINTS.OVERVIEW, { params });
        return unwrap<QualityMetric[]>(res);
    },

    /** Metric chất lượng cho 1 phiên */
    getMetricsBySession: async (sessionId: string) => {
        const res = await axiosClient.get(TELE_QUALITY_ENDPOINTS.CONNECTION_STATS, {
            params: { sessionId },
        });
        return unwrap<QualityMetric>(res);
    },

    /** Báo lỗi cuộc gọi cho 1 phiên */
    reportIssue: async (sessionId: string, data: Record<string, any>) => {
        const res = await axiosClient.post(TELE_QUALITY_ENDPOINTS.ALERTS, {
            sessionId,
            ...data,
        });
        return unwrap<QualityAlert>(res);
    },

    /** Danh sách cảnh báo chất lượng */
    getAlerts: async (params?: Record<string, any>) => {
        const res = await axiosClient.get(TELE_QUALITY_ENDPOINTS.ALERTS, { params });
        return unwrapList<QualityAlert>(res);
    },

    /** Đánh giá từ bệnh nhân */
    getReviews: async (params?: Record<string, any>) => {
        const res = await axiosClient.get(TELE_QUALITY_ENDPOINTS.REVIEWS, { params });
        return unwrapList<QualityReview>(res);
    },

    /** Gửi đánh giá cho 1 phiên tư vấn */
    createReview: async (sessionId: string, data: Record<string, any>) => {
        const res = await axiosClient.post(
            TELE_QUALITY_ENDPOINTS.CREATE_REVIEW(sessionId),
            data
        );
        return unwrap<QualityReview>(res);
    },

    /** Thống kê đánh giá (theo bác sĩ nếu có doctorId) */
    getReviewStats: async (doctorId?: string) => {
        const url = doctorId
            ? TELE_QUALITY_ENDPOINTS.DOCTOR_REVIEWS(doctorId)
            : TELE_QUALITY_ENDPOINTS.REVIEWS;
        const res = await axiosClient.get(url, { params: { stats: true } });
        return unwrap<Record<string, any>>(res);
    },

    /** Dashboard chất lượng (admin) */
    getQualityDashboard: async () => {
        const res = await axiosClient.get(TELE_QUALITY_ENDPOINTS.SYSTEM_REPORT);
        return unwrap<QualityDashboard>(res);
    },

    /** Metric chất lượng theo bác sĩ */
    getDoctorMetrics: async (doctorId: string) => {
        const res = await axiosClient.get(TELE_QUALITY_ENDPOINTS.DOCTOR_METRICS(doctorId));
        return unwrap<Record<string, any>>(res);
    },

    /** Danh sách đánh giá theo bác sĩ */
    getDoctorReviews: async (doctorId: string, params?: Record<string, any>) => {
        const res = await axiosClient.get(TELE_QUALITY_ENDPOINTS.DOCTOR_REVIEWS(doctorId), { params });
        return unwrapList<QualityReview>(res);
    },

    /** Thống kê cảnh báo chất lượng */
    getAlertStats: async () => {
        const res = await axiosClient.get(TELE_QUALITY_ENDPOINTS.ALERT_STATS);
        return unwrap<Record<string, any>>(res);
    },
};

export default teleQualityService;
