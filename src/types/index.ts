/**
 * Shared TypeScript types
 * Định nghĩa types sẵn sàng cho API response/request
 */

import type { Role } from "@/constants/roles";
import type {
    UserStatus,
    DoctorStatus,
    DepartmentStatus,
    MedicineStatus,
    AppointmentStatus,
} from "@/constants/status";

// ============================================
// Base types
// ============================================

export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}

// API Response wrapper (chuẩn bị cho BE)
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ApiError {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
}

// ============================================
// User types
// ============================================

export interface User extends BaseEntity {
    email: string;
    fullName: string;
    avatar?: string;
    role: Role;
    status: UserStatus;
    lastAccess?: string;
}

// ============================================
// Doctor types
// ============================================

export interface Doctor extends BaseEntity {
    userId: string;
    code: string; // DR-2024001
    fullName: string;
    avatar?: string;
    email: string;
    phone?: string;
    departmentId: string;
    departmentName: string;
    specialization: string;
    rating: number;
    reviewCount: number;
    status: DoctorStatus;
    workingSchedule?: WorkingSchedule[];
}

export interface WorkingSchedule {
    shift: "MORNING" | "AFTERNOON" | "NIGHT";
    days: string[]; // ["T2", "T4", "T6"]
}

// ============================================
// Department types
// ============================================

export interface Department extends BaseEntity {
    code: string; // K-001
    name: string;
    nameEn?: string;
    description?: string;
    icon?: string;
    color?: string;
    location?: string;
    capacity?: number;
    doctorCount: number;
    patientCount?: number;
    appointmentToday?: number;
    status: DepartmentStatus;
}

// ============================================
// Medicine types
// ============================================

export interface Medicine extends BaseEntity {
    code: string; // SP-2024-001
    name: string;
    activeIngredient: string;
    unit: string;
    unitDetail?: string; // "Hộp (10 vỉ x 10 viên)"
    price: number;
    stock: number;
    stockLevel: "HIGH" | "NORMAL" | "LOW" | "OUT";
    category: string;
    status: MedicineStatus;
    expiryDate?: string;
}

// ============================================
// Appointment types
// ============================================

export interface Appointment extends BaseEntity {
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    departmentId: string;
    departmentName: string;
    date: string;
    time: string;
    status: AppointmentStatus;
    notes?: string;
}

// ============================================
// Statistics types
// ============================================

export interface DashboardStats {
    totalRevenue: number;
    revenueChange: number;
    todayVisits: number;
    visitsChange: number;
    doctorsOnDuty: number;
    totalDoctors: number;
    medicineAlerts: number;
}

export interface DepartmentLoad {
    id: string;
    name: string;
    loadPercentage: number;
}

export interface ActivityLog extends BaseEntity {
    userId: string;
    userName: string;
    userAvatar?: string;
    action: string;
    status: "SUCCESS" | "PENDING" | "FAILED";
    time: string;
}
