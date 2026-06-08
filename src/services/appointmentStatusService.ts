/**
 * Appointment Status Service — Quản lý hàng đợi khám
 * Swagger: /api/appointment-status/*
 * Backend: http://160.250.186.97:3000/api-docs
 */

import axiosClient from '@/api/axiosClient';
import { APPOINTMENT_STATUS_ENDPOINTS, APPOINTMENT_ENDPOINTS } from '@/api/endpoints';

export const appointmentStatusService = {
    /**
     * GET /api/appointment-status/queue/today — Hàng đợi hôm nay
     */
    getQueueToday: (params?: { departmentId?: string; roomId?: string; doctorId?: string; include_all?: boolean }) =>
        axiosClient.get(APPOINTMENT_STATUS_ENDPOINTS.QUEUE_TODAY, { params }).then(r => r.data),

    /**
     * GET /api/appointment-status/dashboard/today — Dashboard hôm nay
     */
    getDashboardToday: () =>
        axiosClient.get(APPOINTMENT_STATUS_ENDPOINTS.DASHBOARD_TODAY).then(r => r.data),

    /**
     * GET /api/appointment-status/dashboard/{date}
     */
    getDashboardByDate: (date: string) =>
        axiosClient.get(APPOINTMENT_STATUS_ENDPOINTS.DASHBOARD_DATE(date)).then(r => r.data),

    /**
     * GET /api/appointment-status/room-status — Trạng thái phòng khám
     */
    getRoomStatus: () =>
        axiosClient.get(APPOINTMENT_STATUS_ENDPOINTS.ROOM_STATUS).then(r => r.data),

    /**
     * PATCH /api/appointment-status/rooms/{id}/release — Giải phóng phòng
     */
    forceReleaseRoom: (roomId: string) =>
        axiosClient.patch(APPOINTMENT_STATUS_ENDPOINTS.FORCE_RELEASE(roomId), {}).then(r => r.data),

    /**
     * GET /api/appointment-status/settings — Cài đặt hàng đợi
     */
    getSettings: () =>
        axiosClient.get(APPOINTMENT_STATUS_ENDPOINTS.SETTINGS).then(r => r?.data?.data ?? r?.data ?? r),

    /**
     * POST /api/appointment-status/{id}/check-in — Check-in bệnh nhân
     */
    checkIn: (id: string, data?: { qrCode?: string }) =>
        axiosClient.post(APPOINTMENT_STATUS_ENDPOINTS.CHECK_IN(id), data ?? {}).then(r => r.data),

    /**
     * POST /api/appointment-status/check-in-qr — Check-in bằng QR
     */
    checkInByQR: (qrCode: string) =>
        axiosClient.post(APPOINTMENT_STATUS_ENDPOINTS.CHECK_IN_QR, { qrCode }).then(r => r?.data?.data ?? r?.data ?? r),

    /**
     * POST /api/appointment-status/{id}/start-exam — Bắt đầu khám
     */
    startExam: (id: string) =>
        axiosClient.patch(APPOINTMENT_STATUS_ENDPOINTS.START_EXAM(id), {}).then(r => r.data),

    /**
     * POST /api/appointment-status/{id}/complete-exam — Hoàn thành khám
     */
    completeExam: (id: string) =>
        axiosClient.patch(APPOINTMENT_STATUS_ENDPOINTS.COMPLETE_EXAM(id), {}).then(r => r.data),

    /**
     * PATCH /api/appointment-status/{id}/no-show — Không đến
     */
    markNoShow: (id: string) =>
        axiosClient.patch(APPOINTMENT_STATUS_ENDPOINTS.NO_SHOW(id), {}).then(r => r.data),

    /**
     * PATCH /api/appointment-status/{id}/skip — Bỏ qua
     */
    skip: (id: string) =>
        axiosClient.patch(APPOINTMENT_STATUS_ENDPOINTS.SKIP(id), {}).then(r => r.data),

    /**
     * PATCH /api/appointment-status/{id}/recall — Gọi lại
     */
    recall: (id: string) =>
        axiosClient.patch(APPOINTMENT_STATUS_ENDPOINTS.RECALL(id), {}).then(r => r.data),

    /**
     * GET /api/appointment-status/generate-qr/{id} — Tạo QR check-in
     */
    generateQR: (id: string) =>
        axiosClient.get(APPOINTMENT_STATUS_ENDPOINTS.GENERATE_QR(id)).then(r => r.data?.data ?? r.data),

    /**
     * POST /api/appointment-confirmations/{id}/confirm — Xác nhận lịch khám (PENDING → CONFIRMED)
     * Tự động xử lý invoice/billing kèm theo
     */
    confirmAppointment: (id: string) =>
        axiosClient.patch(APPOINTMENT_ENDPOINTS.CONFIRM(id), {}).then(r => r?.data?.data ?? r?.data ?? r),

    /**
     * DELETE /api/appointments/{id} — Hủy lịch khám (PENDING → CANCELLED)
     * Tự động cascade hủy invoice + refund nếu có
     */
    cancelAppointment: (id: string, reason: string = 'Lễ tân hủy lịch') =>
        axiosClient.delete(APPOINTMENT_ENDPOINTS.CANCEL(id), { data: { cancellation_reason: reason } }).then(r => r?.data?.data ?? r?.data ?? r),
};
