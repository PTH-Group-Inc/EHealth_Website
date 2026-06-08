/**
 * Telemedicine Service (mở rộng)
 * Phase: Teleconsultation — 131 endpoints
 * Backend: http://160.250.186.97:3000
 * Endpoints: /api/teleconsultation/*
 */

import axiosClient from '@/api/axiosClient';
import { TELEMEDICINE_ENDPOINTS } from '@/api/endpoints';
import { unwrap, unwrapList, extractErrorMessage } from '@/api/response';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface TelemedicineSession {
    id: string;
    patient: string;
    patientId: string;
    doctor: string;
    doctorId?: string;
    date: string;
    time: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    department?: string;
    reason?: string;
    roomUrl?: string;
    createdAt?: string;
    type?: 'video' | 'audio' | 'chat';
    doctorName?: string;
    duration?: number;
    diagnosis?: string;
    prescription?: boolean;
    rating?: number;
}

export interface TelemedicineListResponse {
    data: TelemedicineSession[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface BookingDoctor {
    id: string;
    name: string;
    specialty?: string;
    department?: string;
    avatar?: string;
    rating?: number;
    experience?: string;
}

export interface BookingSlot {
    id: string;
    time: string;
    date: string;
    available: boolean;
}

export interface ConsultationType {
    id: string;
    name: string;
    type: 'video' | 'audio' | 'chat';
    description?: string;
    price?: number;
    duration?: number;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    sender: string;
    senderRole: 'patient' | 'doctor';
    message: string;
    timestamp: string;
    attachments?: { url: string; name: string; type: string }[];
}

export interface ConsultationResult {
    id?: string;
    sessionId: string;
    diagnosis?: string;
    notes?: string;
    recommendations?: string;
    followUpDate?: string;
    createdAt?: string;
}

export interface Prescription {
    id?: string;
    sessionId: string;
    patientId: string;
    medications: { name: string; dosage: string; frequency: string; duration: string }[];
    notes?: string;
    createdAt?: string;
}

export interface FollowUp {
    id?: string;
    sessionId: string;
    patientId: string;
    scheduledDate: string;
    reason?: string;
    notes?: string;
    status?: string;
}

export interface QualityRating {
    sessionId: string;
    rating: number;
    comment?: string;
    categories?: { [key: string]: number };
}

export interface RoomInfo {
    id: string;
    sessionId: string;
    status: string;
    roomUrl?: string;
    startedAt?: string;
    endedAt?: string;
    participants?: { id: string; name: string; role: string }[];
}

export interface DoctorStats {
    today: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    total?: number;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export const telemedicineService = {
    // ═══════════════════════════════════════════════
    // BOOKING — 7 functions
    // ═══════════════════════════════════════════════

    /** Lấy danh sách booking theo filter */
    getList: (params?: {
        page?: number;
        limit?: number;
        doctorId?: string;
        patientId?: string;
        status?: string;
        from?: string;
        to?: string;
    }): Promise<TelemedicineListResponse> => {
        // Doctor portal passes doctorId → use admin/doctor endpoint
        const url = params?.doctorId
            ? TELEMEDICINE_ENDPOINTS.DOCTOR_LIST
            : TELEMEDICINE_ENDPOINTS.LIST;
        return axiosClient
            .get(url, { params })
            .then(r => unwrapList<TelemedicineSession>(r))
            .catch(() => ({ data: [] }));
    },

    /** Chi tiết một booking */
    getById: (id: string): Promise<TelemedicineSession> =>
        axiosClient
            .get(TELEMEDICINE_ENDPOINTS.DETAIL(id))
            .then(r => unwrap<TelemedicineSession>(r)),

    /** Tạo booking mới */
    create: (data: {
        doctorId: string;
        patientId?: string;
        type: 'video' | 'audio' | 'chat';
        slotId?: string;
        date?: string;
        time?: string;
        reason?: string;
        typeId?: string;
    }): Promise<TelemedicineSession> =>
        axiosClient
            .post(TELEMEDICINE_ENDPOINTS.CREATE, data)
            .then(r => unwrap<TelemedicineSession>(r)),

    /** Hủy booking */
    cancel: (id: string, reason?: string): Promise<void> =>
        axiosClient
            .post(TELEMEDICINE_ENDPOINTS.CANCEL(id), { reason })
            .then(() => {}),

    /** Xác nhận booking (bác sĩ) */
    confirm: (id: string): Promise<void> =>
        axiosClient
            .post(TELEMEDICINE_ENDPOINTS.CONFIRM(id))
            .then(() => {}),

    /** Tìm bác sĩ theo chuyên khoa */
    getDoctors: (params?: {
        specialty?: string;
        date?: string;
        type?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: BookingDoctor[] }> =>
        axiosClient
            .get(TELEMEDICINE_ENDPOINTS.DOCTORS, { params })
            .then(r => unwrapList<BookingDoctor>(r))
            .catch(() => ({ data: [] })),

    /** Lấy slot khả dụng của bác sĩ */
    getSlots: (params: {
        doctorId: string;
        date?: string;
        type?: string;
    }): Promise<{ data: BookingSlot[] }> =>
        axiosClient
            .get(TELEMEDICINE_ENDPOINTS.SLOTS, { params })
            .then(r => unwrapList<BookingSlot>(r))
            .catch(() => ({ data: [] })),

    // ═══════════════════════════════════════════════
    // ROOM — 6 functions
    // ═══════════════════════════════════════════════

    /** Lấy thông tin phòng khám */
    getRoom: (sessionId: string): Promise<RoomInfo> =>
        axiosClient
            .get(TELEMEDICINE_ENDPOINTS.ROOM(sessionId))
            .then(r => unwrap<RoomInfo>(r)),

    /** Tham gia phòng khám (patient / doctor join) */
    joinRoom: (sessionId: string): Promise<{ roomUrl?: string; token?: string }> =>
        axiosClient
            .post(TELEMEDICINE_ENDPOINTS.JOIN(sessionId))
            .then(r => unwrap<{ roomUrl?: string; token?: string }>(r)),

    /** Rời phòng khám */
    leaveRoom: (sessionId: string): Promise<void> =>
        axiosClient
            .post(TELEMEDICINE_ENDPOINTS.LEAVE(sessionId))
            .then(() => {}),

    /** Đóng / kết thúc phòng khám (bác sĩ) */
    closeRoom: (sessionId: string): Promise<void> =>
        axiosClient
            .post(TELEMEDICINE_ENDPOINTS.CLOSE_ROOM(sessionId))
            .then(() => {}),

    /** Lấy tin nhắn trong phòng */
    getRoomMessages: (sessionId: string): Promise<{ data: ChatMessage[] }> =>
        axiosClient
            .get(TELEMEDICINE_ENDPOINTS.ROOM_MESSAGES(sessionId))
            .then(r => unwrapList<ChatMessage>(r))
            .catch(() => ({ data: [] })),

    // Backward compat aliases
    start: (id: string): Promise<{ roomUrl?: string }> =>
        axiosClient
            .post(TELEMEDICINE_ENDPOINTS.START(id))
            .then(r => unwrap<{ roomUrl?: string }>(r)),

    end: (id: string): Promise<void> =>
        axiosClient
            .post(TELEMEDICINE_ENDPOINTS.END(id))
            .then(() => {}),

    // ═══════════════════════════════════════════════
    // CHAT (Medical Chat) — 3 functions
    // ═══════════════════════════════════════════════

    /** Lấy lịch sử chat của session */
    getChatMessages: (sessionId: string, params?: { page?: number; limit?: number }): Promise<{ data: ChatMessage[] }> =>
        axiosClient
            .get(`/api/teleconsultation/medical-chat`, { params: { sessionId, ...params } })
            .then(r => unwrapList<ChatMessage>(r))
            .catch(() => ({ data: [] })),

    /** Gửi tin nhắn chat */
    sendMessage: (sessionId: string, message: string, attachments?: File[]): Promise<ChatMessage> => {
        if (attachments && attachments.length > 0) {
            const formData = new FormData();
            formData.append('message', message);
            attachments.forEach(f => formData.append('attachments', f));
            return axiosClient
                .post(`/api/teleconsultation/medical-chat/${sessionId}/messages`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                })
                .then(r => unwrap<ChatMessage>(r));
        }
        return axiosClient
            .post(`/api/teleconsultation/medical-chat/${sessionId}/messages`, { message })
            .then(r => unwrap<ChatMessage>(r));
    },

    /** Upload file đính kèm trong chat */
    uploadAttachment: (sessionId: string, file: File): Promise<{ url: string; name: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosClient
            .post(`/api/teleconsultation/medical-chat/${sessionId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then(r => unwrap<{ url: string; name: string }>(r));
    },

    // Backward compat
    sendChat: (sessionId: string, message: string): Promise<ChatMessage> =>
        axiosClient
            .post(TELEMEDICINE_ENDPOINTS.CHAT(sessionId), { message })
            .then(r => unwrap<ChatMessage>(r)),

    shareDocument: (sessionId: string, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosClient
            .post(TELEMEDICINE_ENDPOINTS.SHARE_DOCUMENT(sessionId), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            .then(r => unwrap<any>(r));
    },

    // ═══════════════════════════════════════════════
    // RESULTS — 4 functions
    // ═══════════════════════════════════════════════

    /** Tạo kết quả khám */
    createResult: (data: ConsultationResult): Promise<ConsultationResult> =>
        axiosClient
            .post(`/api/teleconsultation/results`, data)
            .then(r => unwrap<ConsultationResult>(r)),

    /** Cập nhật kết quả khám */
    updateResult: (id: string, data: Partial<ConsultationResult>): Promise<ConsultationResult> =>
        axiosClient
            .put(`/api/teleconsultation/results/${id}`, data)
            .then(r => unwrap<ConsultationResult>(r)),

    /** Chi tiết kết quả khám */
    getResult: (id: string): Promise<ConsultationResult> =>
        axiosClient
            .get(`/api/teleconsultation/results/${id}`)
            .then(r => unwrap<ConsultationResult>(r)),

    /** Danh sách kết quả theo session */
    listResults: (params?: { sessionId?: string; patientId?: string }): Promise<{ data: ConsultationResult[] }> =>
        axiosClient
            .get(`/api/teleconsultation/results`, { params })
            .then(r => unwrapList<ConsultationResult>(r))
            .catch(() => ({ data: [] })),

    // ═══════════════════════════════════════════════
    // PRESCRIPTIONS — 3 functions
    // ═══════════════════════════════════════════════

    /** Kê đơn từ xa */
    createPrescription: (data: Prescription): Promise<Prescription> =>
        axiosClient
            .post(`/api/teleconsultation/prescriptions`, data)
            .then(r => unwrap<Prescription>(r)),

    /** Danh sách đơn thuốc */
    listPrescriptions: (params?: { sessionId?: string; patientId?: string }): Promise<{ data: Prescription[] }> =>
        axiosClient
            .get(`/api/teleconsultation/prescriptions`, { params })
            .then(r => unwrapList<Prescription>(r))
            .catch(() => ({ data: [] })),

    /** Chi tiết đơn thuốc */
    getPrescription: (id: string): Promise<Prescription> =>
        axiosClient
            .get(`/api/teleconsultation/prescriptions/${id}`)
            .then(r => unwrap<Prescription>(r)),

    // ═══════════════════════════════════════════════
    // FOLLOW-UPS — 3 functions
    // ═══════════════════════════════════════════════

    /** Tạo lịch tái khám */
    createFollowUp: (data: FollowUp): Promise<FollowUp> =>
        axiosClient
            .post(`/api/teleconsultation/follow-ups`, data)
            .then(r => unwrap<FollowUp>(r)),

    /** Danh sách lịch tái khám */
    listFollowUps: (params?: { sessionId?: string; patientId?: string; status?: string }): Promise<{ data: FollowUp[] }> =>
        axiosClient
            .get(`/api/teleconsultation/follow-ups`, { params })
            .then(r => unwrapList<FollowUp>(r))
            .catch(() => ({ data: [] })),

    /** Chi tiết lịch tái khám */
    getFollowUp: (id: string): Promise<FollowUp> =>
        axiosClient
            .get(`/api/teleconsultation/follow-ups/${id}`)
            .then(r => unwrap<FollowUp>(r)),

    // ═══════════════════════════════════════════════
    // TYPES & CONFIGS — 2 functions
    // ═══════════════════════════════════════════════

    /** Lấy danh sách loại tư vấn */
    getTypes: (): Promise<{ data: ConsultationType[] }> =>
        axiosClient
            .get(TELEMEDICINE_ENDPOINTS.TYPES)
            .then(r => unwrapList<ConsultationType>(r))
            .catch(() => ({ data: [] })),

    /** Lấy cấu hình hệ thống */
    getConfigs: (): Promise<any> =>
        axiosClient
            .get(`/api/teleconsultation/configs`)
            .then(r => unwrap<any>(r))
            .catch(() => ({})),

    // ═══════════════════════════════════════════════
    // QUALITY — 2 functions
    // ═══════════════════════════════════════════════

    /** Đánh giá chất lượng phiên khám */
    rateSession: (data: QualityRating): Promise<void> =>
        axiosClient
            .post(`/api/teleconsultation/quality`, data)
            .then(() => {}),

    /** Lấy đánh giá của session */
    getRatings: (params?: { sessionId?: string; doctorId?: string }): Promise<{ data: QualityRating[] }> =>
        axiosClient
            .get(`/api/teleconsultation/quality`, { params })
            .then(r => unwrapList<QualityRating>(r))
            .catch(() => ({ data: [] })),

    // ═══════════════════════════════════════════════
    // STATS — 1 function
    // ═══════════════════════════════════════════════

    /** Thống kê tổng quan cho bác sĩ */
    getStats: (params?: { doctorId?: string; from?: string; to?: string }): Promise<DoctorStats> =>
        axiosClient
            .get(TELEMEDICINE_ENDPOINTS.STATS, { params })
            .then(r => unwrap<DoctorStats>(r))
            .catch(() => ({ today: 0, inProgress: 0, completed: 0, cancelled: 0 })),
};
