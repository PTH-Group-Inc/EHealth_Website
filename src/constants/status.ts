/**
 * Status constants
 * KHÔNG hard-code status strings trong components
 */

// User status
export const USER_STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    LOCKED: "LOCKED",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// Doctor status
export const DOCTOR_STATUS = {
    ACTIVE: "ACTIVE",
    ON_LEAVE: "ON_LEAVE",
    EXAMINING: "EXAMINING",
    OFFLINE: "OFFLINE",
} as const;

export type DoctorStatus = (typeof DOCTOR_STATUS)[keyof typeof DOCTOR_STATUS];

// Department status
export const DEPARTMENT_STATUS = {
    ACTIVE: "ACTIVE",
    MAINTENANCE: "MAINTENANCE",
    INACTIVE: "INACTIVE",
} as const;

export type DepartmentStatus = (typeof DEPARTMENT_STATUS)[keyof typeof DEPARTMENT_STATUS];

// Medicine status
export const MEDICINE_STATUS = {
    IN_BUSINESS: "IN_BUSINESS",
    SUSPENDED: "SUSPENDED",
    OUT_OF_STOCK: "OUT_OF_STOCK",
} as const;

export type MedicineStatus = (typeof MEDICINE_STATUS)[keyof typeof MEDICINE_STATUS];

// Appointment status
export const APPOINTMENT_STATUS = {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    WAITING: "WAITING",
    EXAMINING: "EXAMINING",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
} as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

// Prescription status
export const PRESCRIPTION_STATUS = {
    PENDING: "PENDING",
    DISPENSED: "DISPENSED",
    CANCELLED: "CANCELLED",
} as const;

export type PrescriptionStatus = (typeof PRESCRIPTION_STATUS)[keyof typeof PRESCRIPTION_STATUS];

// Stock level
export const STOCK_LEVEL = {
    HIGH: "HIGH",
    NORMAL: "NORMAL",
    LOW: "LOW",
    OUT: "OUT",
} as const;

export type StockLevel = (typeof STOCK_LEVEL)[keyof typeof STOCK_LEVEL];
