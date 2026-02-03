/**
 * API Endpoints Configuration
 * Tập trung tất cả các endpoint API
 * 
 * @description Dễ dàng quản lý và thay đổi endpoints
 */

// ============================================
// Authentication Endpoints
// Các API liên quan đến xác thực
// ============================================
export const AUTH_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    GOOGLE_LOGIN: '/api/auth/google',
};

// ============================================
// User Endpoints
// Các API liên quan đến người dùng
// ============================================
export const USER_ENDPOINTS = {
    LIST: '/api/users',
    DETAIL: (id: string) => `/api/users/${id}`,
    CREATE: '/api/users',
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    PROFILE: '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/change-password',
};

// ============================================
// Doctor Endpoints
// Các API liên quan đến bác sĩ
// ============================================
export const DOCTOR_ENDPOINTS = {
    LIST: '/api/doctors',
    DETAIL: (id: string) => `/api/doctors/${id}`,
    CREATE: '/api/doctors',
    UPDATE: (id: string) => `/api/doctors/${id}`,
    DELETE: (id: string) => `/api/doctors/${id}`,
    BY_DEPARTMENT: (departmentId: string) => `/api/doctors/department/${departmentId}`,
    SCHEDULE: (doctorId: string) => `/api/doctors/${doctorId}/schedule`,
};

// ============================================
// Patient Endpoints
// Các API liên quan đến bệnh nhân
// ============================================
export const PATIENT_ENDPOINTS = {
    LIST: '/api/patients',
    DETAIL: (id: string) => `/api/patients/${id}`,
    CREATE: '/api/patients',
    UPDATE: (id: string) => `/api/patients/${id}`,
    DELETE: (id: string) => `/api/patients/${id}`,
    MEDICAL_RECORDS: (patientId: string) => `/api/patients/${patientId}/medical-records`,
    PRESCRIPTIONS: (patientId: string) => `/api/patients/${patientId}/prescriptions`,
};

// ============================================
// Appointment Endpoints
// Các API liên quan đến lịch hẹn
// ============================================
export const APPOINTMENT_ENDPOINTS = {
    LIST: '/api/appointments',
    DETAIL: (id: string) => `/api/appointments/${id}`,
    CREATE: '/api/appointments',
    UPDATE: (id: string) => `/api/appointments/${id}`,
    CANCEL: (id: string) => `/api/appointments/${id}/cancel`,
    CONFIRM: (id: string) => `/api/appointments/${id}/confirm`,
    BY_DOCTOR: (doctorId: string) => `/api/appointments/doctor/${doctorId}`,
    BY_PATIENT: (patientId: string) => `/api/appointments/patient/${patientId}`,
};

// ============================================
// Department Endpoints
// Các API liên quan đến khoa/phòng ban
// ============================================
export const DEPARTMENT_ENDPOINTS = {
    LIST: '/api/departments',
    DETAIL: (id: string) => `/api/departments/${id}`,
    CREATE: '/api/departments',
    UPDATE: (id: string) => `/api/departments/${id}`,
    DELETE: (id: string) => `/api/departments/${id}`,
};

// ============================================
// Medicine Endpoints
// Các API liên quan đến thuốc
// ============================================
export const MEDICINE_ENDPOINTS = {
    LIST: '/api/medicines',
    DETAIL: (id: string) => `/api/medicines/${id}`,
    CREATE: '/api/medicines',
    UPDATE: (id: string) => `/api/medicines/${id}`,
    DELETE: (id: string) => `/api/medicines/${id}`,
    SEARCH: '/api/medicines/search',
    LOW_STOCK: '/api/medicines/low-stock',
};

// ============================================
// Prescription Endpoints
// Các API liên quan đến đơn thuốc
// ============================================
export const PRESCRIPTION_ENDPOINTS = {
    LIST: '/api/prescriptions',
    DETAIL: (id: string) => `/api/prescriptions/${id}`,
    CREATE: '/api/prescriptions',
    UPDATE: (id: string) => `/api/prescriptions/${id}`,
    DISPENSE: (id: string) => `/api/prescriptions/${id}/dispense`,
};

// ============================================
// Schedule Endpoints
// Các API liên quan đến lịch làm việc
// ============================================
export const SCHEDULE_ENDPOINTS = {
    LIST: '/api/schedules',
    CREATE: '/api/schedules',
    UPDATE: (id: string) => `/api/schedules/${id}`,
    DELETE: (id: string) => `/api/schedules/${id}`,
    BY_DOCTOR: (doctorId: string) => `/api/schedules/doctor/${doctorId}`,
};

// ============================================
// Report Endpoints
// Các API liên quan đến báo cáo
// ============================================
export const REPORT_ENDPOINTS = {
    DASHBOARD: '/api/reports/dashboard',
    REVENUE: '/api/reports/revenue',
    PATIENTS: '/api/reports/patients',
    APPOINTMENTS: '/api/reports/appointments',
    EXPORT_EXCEL: '/api/reports/export/excel',
    EXPORT_PDF: '/api/reports/export/pdf',
};

// ============================================
// Notification Endpoints
// Các API liên quan đến thông báo
// ============================================
export const NOTIFICATION_ENDPOINTS = {
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    DELETE: (id: string) => `/api/notifications/${id}`,
};
