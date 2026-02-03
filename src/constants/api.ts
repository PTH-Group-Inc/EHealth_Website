/**
 * API Endpoints constants
 * Định nghĩa tất cả API endpoints để dễ dàng connect BE sau này
 * KHÔNG hard-code endpoint strings trong components
 */

export const API = {
    // Auth endpoints
    AUTH: {
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
        REFRESH: "/auth/refresh",
        ME: "/auth/me",
        FORGOT_PASSWORD: "/auth/forgot-password",
        VERIFY_OTP: "/auth/verify-otp",
        RESET_PASSWORD: "/auth/reset-password",
    },

    // Users management
    USERS: {
        LIST: "/users",
        DETAIL: (id: string) => `/users/${id}`,
        CREATE: "/users",
        UPDATE: (id: string) => `/users/${id}`,
        DELETE: (id: string) => `/users/${id}`,
        LOCK: (id: string) => `/users/${id}/lock`,
        UNLOCK: (id: string) => `/users/${id}/unlock`,
    },

    // Doctors management
    DOCTORS: {
        LIST: "/doctors",
        DETAIL: (id: string) => `/doctors/${id}`,
        CREATE: "/doctors",
        UPDATE: (id: string) => `/doctors/${id}`,
        DELETE: (id: string) => `/doctors/${id}`,
        SCHEDULES: (id: string) => `/doctors/${id}/schedules`,
    },

    // Departments
    DEPARTMENTS: {
        LIST: "/departments",
        DETAIL: (id: string) => `/departments/${id}`,
        CREATE: "/departments",
        UPDATE: (id: string) => `/departments/${id}`,
        DELETE: (id: string) => `/departments/${id}`,
    },

    // Medicines
    MEDICINES: {
        LIST: "/medicines",
        DETAIL: (id: string) => `/medicines/${id}`,
        CREATE: "/medicines",
        UPDATE: (id: string) => `/medicines/${id}`,
        DELETE: (id: string) => `/medicines/${id}`,
        IMPORT: "/medicines/import",
        EXPORT: "/medicines/export",
        LOW_STOCK: "/medicines/low-stock",
        EXPIRING: "/medicines/expiring",
    },

    // Appointments
    APPOINTMENTS: {
        LIST: "/appointments",
        DETAIL: (id: string) => `/appointments/${id}`,
        CREATE: "/appointments",
        UPDATE: (id: string) => `/appointments/${id}`,
        APPROVE: (id: string) => `/appointments/${id}/approve`,
        CANCEL: (id: string) => `/appointments/${id}/cancel`,
        CHECK_IN: (id: string) => `/appointments/${id}/check-in`,
    },

    // Patients
    PATIENTS: {
        LIST: "/patients",
        DETAIL: (id: string) => `/patients/${id}`,
        CREATE: "/patients",
        UPDATE: (id: string) => `/patients/${id}`,
        EMR: (id: string) => `/patients/${id}/emr`,
        VISITS: (id: string) => `/patients/${id}/visits`,
    },

    // Prescriptions
    PRESCRIPTIONS: {
        LIST: "/prescriptions",
        DETAIL: (id: string) => `/prescriptions/${id}`,
        CREATE: "/prescriptions",
        DISPENSE: (id: string) => `/prescriptions/${id}/dispense`,
    },

    // Statistics
    STATISTICS: {
        DASHBOARD: "/statistics/dashboard",
        REVENUE: "/statistics/revenue",
        PATIENTS: "/statistics/patients",
        DEPARTMENTS: "/statistics/departments",
    },

    // Activity Logs
    ACTIVITY_LOGS: {
        LIST: "/activity-logs",
    },

    // Notifications
    NOTIFICATIONS: {
        LIST: "/notifications",
        MARK_READ: (id: string) => `/notifications/${id}/read`,
        MARK_ALL_READ: "/notifications/read-all",
    },
} as const;
