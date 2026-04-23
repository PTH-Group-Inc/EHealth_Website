/**
 * Appointment Service
 * Xử lý các chức năng liên quan đến lịch hẹn khám
 */

import axiosClient from '@/api/axiosClient';
import { APPOINTMENT_ENDPOINTS, APPOINTMENT_STATUS_ENDPOINTS, APPOINTMENT_CONFIRMATION_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    departmentId: string;
    departmentName: string;
    date: string;
    time: string;
    type: string;
    status: string;
    reason?: string;
    notes?: string;
    phone?: string;
    age?: number;
    gender?: string;
    queueStatus?: string;
    checkInTime?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAppointmentData {
    patientId?: string;
    patientName?: string;
    phone?: string;
    doctorId?: string;
    doctorName?: string;
    departmentId?: string;
    departmentName?: string;
    date: string;          // YYYY-MM-DD — sẽ map sang appointment_date
    time: string;          // HH:mm — dùng để resolve slot nếu chưa có slotId
    type?: string;
    reason?: string;
    note?: string;
    serviceId?: string;
    // BE schema mới (Module 3.3)
    slotId?: string;
    shiftId?: string;
    branchId?: string;
    facilityId?: string;
    specialtyId?: string;
    slot_id?: string;
    bookingChannel?: 'WEB' | 'APP' | 'DIRECT_CLINIC' | 'HOTLINE';
}

export interface AppointmentListResponse {
    success: boolean;
    data: Appointment[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// Helpers — unwrap response
// ============================================
const unwrapList = (res: any): Appointment[] => {
    const d = res?.data?.data ?? res?.data ?? res;
    return Array.isArray(d) ? d : [];
};

const unwrapOne = (res: any): any => res?.data?.data ?? res?.data ?? res;

// ============================================
// Lấy danh sách lịch hẹn
// ============================================
export const getAppointments = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    date?: string;
    doctorId?: string;
    patientId?: string;
}): Promise<AppointmentListResponse> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.LIST, { params });
        const raw = response.data;
        // Normalize pagination wrapper
        if (raw?.data && Array.isArray(raw.data)) {
            return { success: true, data: raw.data, pagination: raw.pagination ?? { page: 1, limit: 20, total: raw.data.length, totalPages: 1 } };
        }
        const items = Array.isArray(raw) ? raw : (raw?.items ?? raw?.appointments ?? []);
        return { success: true, data: items, pagination: { page: 1, limit: items.length, total: items.length, totalPages: 1 } };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách lịch hẹn thất bại');
    }
};

// ============================================
// Lấy lịch hẹn của bệnh nhân đang đăng nhập
// BE auto-resolve patient_id từ token
// ============================================
export interface MyAppointmentsResponse {
    success?: boolean;
    data: Appointment[];
    pagination?: any;
}

const normalizeAppointment = (a: any): Appointment => ({
    ...a,
    id: a.appointments_id || a.id,
    patientId: a.patient_id || a.patientId,
    patientName: a.patient_name || a.patientName,
    doctorId: a.doctor_id || a.doctorId,
    doctorName: a.doctor_name || a.doctorName,
    departmentId: a.department_id || a.departmentId,
    departmentName: a.department_name || a.departmentName || a.specialty_name,
    date: a.appointment_date || a.date,
    time: a.slot_start_time || a.time,
    status: a.status,
    reason: a.reason_for_visit || a.reason,
    createdAt: a.created_at || a.createdAt,
    updatedAt: a.updated_at || a.updatedAt,
});

export const getMyAppointments = async (
    params?: { status?: string; patient_id?: string; fromDate?: string; toDate?: string; page?: number; limit?: number }
): Promise<MyAppointmentsResponse> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.MY_APPOINTMENTS, { params });
        const raw = response.data;
        return {
            ...raw,
            data: Array.isArray(raw?.data) ? raw.data.map(normalizeAppointment) : [],
        };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy lịch hẹn của tôi thất bại');
    }
};

// ============================================
// Lấy chi tiết lịch hẹn
// ============================================
export const getAppointmentById = async (id: string): Promise<Appointment> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.DETAIL(id));
        return normalizeAppointment(unwrapOne(response));
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin lịch hẹn thất bại');
    }
};

// ============================================
// Tạo lịch hẹn mới
// BE schema (Module 3.3): { patient_id, branch_id, slot_id|shift_id,
//                            appointment_date, booking_channel, ... }
// ============================================
export const createAppointment = async (data: CreateAppointmentData): Promise<Appointment> => {
    try {
        // Resolve slot/branch nếu FE chỉ có doctorId + date + time
        // Support cả camelCase (slotId) và snake_case (slot_id)
        let slotId = data.slotId || (data as any).slot_id;
        let branchId = data.branchId || (data as any).branch_id || (data as any).facilityId;
        let shiftId = data.shiftId || (data as any).shift_id;

        if (!slotId && !shiftId && data.doctorId && data.date && data.time) {
            try {
                const slots = await doctorAvailabilityService.getSlots({
                    doctorId: data.doctorId,
                    date: data.date,
                });
                const hhmm = data.time.slice(0, 5);
                const matched = (slots as any[]).find(s => {
                    const t = (s.start_time || s.startTime || s.time || '').toString();
                    return t.slice(0, 5) === hhmm;
                });
                if (matched) {
                    slotId = matched.slot_id || matched.id || matched.slotId;
                    branchId = matched.branch_id || matched.branchId || branchId;
                    shiftId = matched.shift_id || matched.shiftId || shiftId;
                }
            } catch { /* resolver fail — để BE validate sẽ throw */ }
        }

        const payload: Record<string, any> = {
            appointment_date: data.date,
            booking_channel: data.bookingChannel || 'WEB',
        };
        if (data.patientId) payload.patient_id = data.patientId;
        if (slotId) payload.slot_id = slotId;
        if (shiftId) payload.shift_id = shiftId;
        if (branchId) payload.branch_id = branchId;
        if (data.doctorId) payload.doctor_id = data.doctorId;
        if (data.reason) payload.reason_for_visit = data.reason;
        if (data.note) payload.symptoms_notes = data.note;
        if (data.serviceId) payload.facility_service_id = data.serviceId;
        // Back-compat: giữ lại tên field cũ cho các validator linh hoạt
        if (data.patientName) payload.patient_name = data.patientName;
        if (data.phone) payload.phone = data.phone;

        const response = await axiosClient.post(APPOINTMENT_ENDPOINTS.CREATE, payload);
        return unwrapOne(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo lịch hẹn thất bại');
    }
};

// ============================================
// Cập nhật lịch hẹn
// ============================================
export const updateAppointment = async (
    id: string,
    data: Partial<CreateAppointmentData>
): Promise<Appointment> => {
    try {
        const payload: Record<string, any> = {};
        if (data.patientId) payload.patient_id = data.patientId;
        if (data.doctorId) payload.doctor_id = data.doctorId;
        if (data.date) payload.date = data.date;
        if (data.time) payload.time = data.time;
        if (data.type) payload.type = data.type;
        if (data.reason) payload.reason = data.reason;
        const response = await axiosClient.put(APPOINTMENT_ENDPOINTS.UPDATE(id), payload);
        return unwrapOne(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật lịch hẹn thất bại');
    }
};

// ============================================
// Xác nhận lịch hẹn
// ============================================
export const confirmAppointment = async (id: string): Promise<Appointment> => {
    try {
        const response = await axiosClient.patch(APPOINTMENT_ENDPOINTS.CONFIRM(id), {});
        return unwrapOne(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xác nhận lịch hẹn thất bại');
    }
};

// ============================================
// Hủy lịch hẹn
// ============================================
export const cancelAppointment = async (id: string, reason?: string): Promise<void> => {
    try {
        await axiosClient.delete(APPOINTMENT_ENDPOINTS.CANCEL(id), {
            data: { cancellation_reason: reason || 'Bệnh nhân huỷ lịch' },
        });
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Hủy lịch hẹn thất bại');
    }
};

// ============================================
// Tạo mã QR check-in cho lịch hẹn
// ============================================
export const generateAppointmentQr = async (id: string): Promise<{ qr_token: string; expires_at: string }> => {
    try {
        const response = await axiosClient.post(APPOINTMENT_ENDPOINTS.GENERATE_QR(id));
        return response.data?.data ?? response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo mã QR thất bại');
    }
};

// ============================================
// Đánh giá lịch khám
// ============================================
export const submitAppointmentReview = async (id: string, rating: number, feedback: string): Promise<Appointment> => {
    try {
        const response = await axiosClient.post(`/api/appointments/${id}/review`, { rating, feedback });
        return response.data?.data ?? response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Gửi đánh giá thất bại');
    }
};

// ============================================
// Lấy lịch hẹn theo bác sĩ
// ============================================
export const getAppointmentsByDoctor = async (
    doctorId: string,
    params?: { date?: string; status?: string }
): Promise<Appointment[]> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.BY_DOCTOR(doctorId), { params });
        return unwrapList(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy lịch hẹn theo bác sĩ thất bại');
    }
};

// ============================================
// Lấy lịch hẹn theo bệnh nhân
// ============================================
export const getAppointmentsByPatient = async (
    patientId: string,
    params?: { status?: string }
): Promise<Appointment[]> => {
    try {
        const response = await axiosClient.get(APPOINTMENT_ENDPOINTS.BY_PATIENT(patientId), { params });
        return unwrapList(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy lịch hẹn theo bệnh nhân thất bại');
    }
};

// ============================================
// Lấy danh sách slot khám khả dụng
// GET /api/appointments/available-slots
// ============================================
export const getAvailableSlots = async (params: {
    date?: string;
    doctor_id?: string;
    service_id?: string;
    branch_id?: string;
    facility_id?: string;
    exclude_appointment_id?: string;
}): Promise<any[]> => {
    try {
        const response = await axiosClient.get('/api/appointments/available-slots', { params });
        const d = response?.data?.data ?? response?.data ?? response;
        return Array.isArray(d) ? d : [];
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách slot thất bại');
    }
};

// ============================================
// Lấy danh sách slot khám theo khoa/chuyên khoa
// GET /api/appointments/available-slots-by-department
// ============================================
export const getAvailableSlotsByDepartment = async (params: {
    department_id: string;
    facility_id: string;
    branch_id?: string;
    start_date?: string;
    days?: number;
}): Promise<any[]> => {
    try {
        const response = await axiosClient.get('/api/appointments/available-slots-by-department', { params });
        const d = response?.data?.data ?? response?.data ?? response;
        return Array.isArray(d) ? d : [];
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách slot theo khoa thất bại');
    }
};

// ============================================
// Pre-Booking Payment (thanh toán cọc đặt lịch — SePay QR)
// ============================================

export type PreBookingChannel =
    | 'WEB_PORTAL'
    | 'PATIENT_APP'
    | 'ZALO_MINI_APP'
    | 'WEB'
    | 'APP';

export interface PreBookRequest {
    patientId: string;
    branchId?: string;
    facilityId?: string;
    appointmentDate: string;   // YYYY-MM-DD
    slotId?: string;
    shiftId?: string;
    doctorId?: string;
    specialtyId?: string;
    serviceId?: string;
    notes?: string;
    reasonForVisit?: string;
    bookingChannel: PreBookingChannel;
}

export interface PreBookResponse {
    appointment?: { appointments_id?: string; id?: string; status?: string;[key: string]: any };
    invoice?: { invoices_id?: string; id?: string; total_amount?: number; status?: string;[key: string]: any };
    payment?: { qrTemplateData?: string; qrString?: string; qr_url?: string;[key: string]: any };
    [key: string]: any;
}

export const preBookAppointment = async (data: PreBookRequest): Promise<PreBookResponse> => {
    const payload: Record<string, any> = {
        appointment_date: data.appointmentDate,
        booking_channel: data.bookingChannel,
    };
    if (data.patientId) payload.patient_id = data.patientId;
    if (data.branchId) payload.branch_id = data.branchId;
    if (data.facilityId) payload.facility_id = data.facilityId;
    if (data.slotId) payload.slot_id = data.slotId;
    if (data.shiftId) payload.shift_id = data.shiftId;
    if (data.doctorId) payload.doctor_id = data.doctorId;
    if (data.specialtyId) payload.specialty_id = data.specialtyId;
    if (data.serviceId) payload.facility_service_id = data.serviceId;
    if (data.notes) payload.notes = data.notes;
    if (data.reasonForVisit) payload.reason_for_visit = data.reasonForVisit;

    try {
        const res = await axiosClient.post(APPOINTMENT_ENDPOINTS.PRE_BOOK, payload);
        return unwrapOne(res) as PreBookResponse;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo lịch và thanh toán cọc thất bại');
    }
};

export const regenerateAppointmentQr = async (
    id: string,
): Promise<{ appointment_id: string; invoice_id: string; amount: number; qrTemplateData?: string; qr_url?: string }> => {
    try {
        const res = await axiosClient.post(APPOINTMENT_ENDPOINTS.REGENERATE_QR(id), {});
        return unwrapOne(res);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo lại QR thanh toán thất bại');
    }
};

export interface PaymentStatus {
    isPaid: boolean;
    appointment_status?: string;
    invoice_status?: string;
    [key: string]: any;
}

export const getAppointmentPaymentStatus = async (id: string): Promise<PaymentStatus> => {
    try {
        const res = await axiosClient.get(APPOINTMENT_ENDPOINTS.PAYMENT_STATUS(id));
        const d = unwrapOne(res) as any;
        return {
            isPaid: !!(d?.isPaid ?? d?.is_paid),
            appointment_status: d?.appointment_status ?? d?.appointmentStatus,
            invoice_status: d?.invoice_status ?? d?.invoiceStatus,
            ...d,
        };
    } catch (error: any) {
        // Không throw — UI vẫn polling tiếp
        return { isPaid: false };
    }
};

// ============================================
// Dời lịch / Update lý do khám / Check conflict (doctor actions — Nhóm 2)
// ============================================
export const rescheduleAppointment = async (
    id: string,
    data: { newDate?: string; newSlotId?: string; newShiftId?: string; reason?: string }
): Promise<any> => {
    try {
        const payload: Record<string, any> = {};
        if (data.newDate) payload.new_date = data.newDate;
        if (data.newSlotId) payload.new_slot_id = data.newSlotId;
        if (data.newShiftId) payload.new_shift_id = data.newShiftId;
        if (data.reason) payload.reason = data.reason;
        const response = await axiosClient.patch(APPOINTMENT_ENDPOINTS.RESCHEDULE(id), payload);
        return unwrapOne(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Dời lịch thất bại');
    }
};

export const updateVisitReason = async (id: string, reason: string): Promise<any> => {
    try {
        const response = await axiosClient.patch(APPOINTMENT_ENDPOINTS.VISIT_REASON(id), {
            reason_for_visit: reason,
        });
        return unwrapOne(response);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật lý do khám thất bại');
    }
};

export const checkAppointmentConflict = async (data: {
    doctorId?: string;
    date: string;
    slotId?: string;
    shiftId?: string;
    excludeAppointmentId?: string;
}): Promise<{ hasConflict: boolean; conflicts?: any[] }> => {
    try {
        const payload: Record<string, any> = { date: data.date };
        if (data.doctorId) payload.doctor_id = data.doctorId;
        if (data.slotId) payload.slot_id = data.slotId;
        if (data.shiftId) payload.shift_id = data.shiftId;
        if (data.excludeAppointmentId) payload.exclude_appointment_id = data.excludeAppointmentId;
        const response = await axiosClient.post(APPOINTMENT_ENDPOINTS.CHECK_CONFLICT, payload);
        const d = response?.data?.data ?? response?.data ?? {};
        return {
            hasConflict: d.has_conflict ?? d.hasConflict ?? false,
            conflicts: d.conflicts ?? [],
        };
    } catch (error: any) {
        // Không throw — trả về false để UI không crash
        return { hasConflict: false, conflicts: [] };
    }
};

// ============================================
// Doctor Availability (slot trống BS)
// /api/doctor-availability
// ============================================
export const doctorAvailabilityService = {
    /**
     * GET /api/doctor-availability/:doctorId?date=Y
     * Lấy lịch làm việc của 1 bác sĩ theo ngày.
     */
    getSlots: (params: { doctorId: string; date: string }) =>
        axiosClient.get(`/api/doctor-availability/${params.doctorId}`, {
            params: { date: params.date },
        }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            if (Array.isArray(d)) return d;
            if (d && typeof d === 'object') {
                return d[params.date] || d.slots || [];
            }
            return [];
        }),

    /** GET /api/doctor-availability/available — Tất cả slot trống */
    getAvailable: (params?: { date?: string; departmentId?: string }) =>
        axiosClient.get('/api/doctor-availability/available', { params }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),

    /** POST /api/doctor-availability — Tạo slot */
    create: (data: { doctorId: string; date: string; startTime: string; endTime: string; maxPatients?: number }) =>
        axiosClient.post('/api/doctor-availability', data).then(r => r?.data?.data ?? r?.data ?? r),

    /** PUT /api/doctor-availability/:id */
    update: (id: string, data: object) =>
        axiosClient.put(`/api/doctor-availability/${id}`, data).then(r => r?.data?.data ?? r?.data ?? r),

    /** DELETE /api/doctor-availability/:id */
    delete: (id: string) =>
        axiosClient.delete(`/api/doctor-availability/${id}`).then(r => r?.data ?? r),

    /** GET /api/doctor-availability/:doctorId/conflicts — các xung đột lịch */
    getConflicts: (doctorId: string, params?: { from?: string; to?: string }) =>
        axiosClient.get(`/api/doctor-availability/${doctorId}/conflicts`, { params }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),

    /** GET /api/doctor-availability/:doctorId/facilities — cơ sở / nơi làm việc */
    getFacilities: (doctorId: string) =>
        axiosClient.get(`/api/doctor-availability/${doctorId}/facilities`).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),
};

// ============================================
// Appointment Slots
// /api/appointment-slots
// ============================================
export const appointmentSlotsService = {
    getAll: (params?: { doctorId?: string; date?: string; status?: string }) =>
        axiosClient.get('/api/appointment-slots', { params }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),

    getById: (id: string) =>
        axiosClient.get(`/api/appointment-slots/${id}`).then(r => r?.data?.data ?? r?.data ?? r),

    create: (data: object) =>
        axiosClient.post('/api/appointment-slots', data).then(r => r?.data?.data ?? r?.data ?? r),

    update: (id: string, data: object) =>
        axiosClient.put(`/api/appointment-slots/${id}`, data).then(r => r?.data?.data ?? r?.data ?? r),

    delete: (id: string) =>
        axiosClient.delete(`/api/appointment-slots/${id}`).then(r => r?.data ?? r),
};

// ============================================
// Appointment Changes (dời lịch)
// /api/appointment-changes
// ============================================
export const appointmentChangesService = {
    getAll: (params?: { appointmentId?: string; status?: string }) =>
        axiosClient.get('/api/appointment-changes', { params }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),

    getById: (id: string) =>
        axiosClient.get(`/api/appointment-changes/${id}`).then(r => r?.data?.data ?? r?.data ?? r),

    request: (data: { appointmentId: string; newDate: string; newSlotId: string; reason?: string }) =>
        axiosClient.post('/api/appointment-changes', data).then(r => r?.data?.data ?? r?.data ?? r),

    approve: (id: string) =>
        axiosClient.post(`/api/appointment-changes/${id}/approve`, {}).then(r => r?.data?.data ?? r?.data ?? r),

    reject: (id: string, reason?: string) =>
        axiosClient.post(`/api/appointment-changes/${id}/reject`, { reason }).then(r => r?.data?.data ?? r?.data ?? r),
};

// ============================================
// Appointment Confirmations
// /api/appointment-confirmations
// ============================================
export const appointmentConfirmationService = {
    confirm: (id: string) =>
        axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.CONFIRM(id), {}).then(r => r?.data?.data ?? r?.data ?? r),

    checkIn: (id: string) =>
        axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.CHECK_IN(id), {}).then(r => r?.data?.data ?? r?.data ?? r),

    sendReminder: (id: string) =>
        axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.SEND_REMINDER(id), {}).then(r => r?.data?.data ?? r?.data ?? r),

    /**
     * Gửi lại email/notification cho appointment
     * Module 2 — Email Appointment Flow
     * @param id appointment id
     * @param templateCode optional, BE auto-detect theo status nếu không truyền
     */
    resendNotification: (id: string, templateCode?: string) =>
        axiosClient.post(
            APPOINTMENT_CONFIRMATION_ENDPOINTS.RESEND(id),
            templateCode ? { template_code: templateCode } : {},
        ).then(r => r?.data?.data ?? r?.data ?? r),

    batchConfirm: (ids: string[]) =>
        axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.BATCH_CONFIRM, { ids }).then(r => r?.data?.data ?? r?.data ?? r),

    batchReminder: (ids: string[]) =>
        axiosClient.post(APPOINTMENT_CONFIRMATION_ENDPOINTS.BATCH_REMINDER, { ids }).then(r => r?.data?.data ?? r?.data ?? r),

    getReminderSettings: () =>
        axiosClient.get(APPOINTMENT_CONFIRMATION_ENDPOINTS.REMINDER_SETTINGS).then(r => r?.data?.data ?? r?.data ?? r),

    updateReminderSettings: (data: object) =>
        axiosClient.put(APPOINTMENT_CONFIRMATION_ENDPOINTS.REMINDER_SETTINGS, data).then(r => r?.data?.data ?? r?.data ?? r),
};

// ============================================
// Doctor Absences
// /api/doctor-absences
// ============================================
export const doctorAbsencesService = {
    getAll: (params?: { doctorId?: string; fromDate?: string; toDate?: string }) =>
        axiosClient.get('/api/doctor-absences', { params }).then(r => {
            const d = r?.data?.data ?? r?.data ?? r;
            return Array.isArray(d) ? d : [];
        }),

    getById: (id: string) =>
        axiosClient.get(`/api/doctor-absences/${id}`).then(r => r?.data?.data ?? r?.data ?? r),

    create: (data: { doctorId: string; fromDate: string; toDate: string; reason?: string }) =>
        axiosClient.post('/api/doctor-absences', data).then(r => r?.data?.data ?? r?.data ?? r),

    delete: (id: string) =>
        axiosClient.delete(`/api/doctor-absences/${id}`).then(r => r?.data ?? r),
};
