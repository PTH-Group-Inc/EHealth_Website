/**
 * Mock Data cho Admin Dashboard
 * Dễ dàng thay thế bằng API calls sau khi có BE
 * 
 * @description
 * File này chứa dữ liệu giả lập để phát triển frontend
 * Sau khi có backend API, thay thế bằng services tương ứng
 */

import type {
    User,
    Doctor,
    Department,
    Medicine,
    DashboardStats,
    DepartmentLoad,
    ActivityLog,
} from "@/types";
import { ROLES } from "@/constants/roles";
import { USER_STATUS, DOCTOR_STATUS, DEPARTMENT_STATUS, MEDICINE_STATUS } from "@/constants/status";

// ============================================
// Dashboard Stats
// Thống kê tổng quan dashboard
// ============================================

export const MOCK_DASHBOARD_STATS: DashboardStats = {
    totalRevenue: 12500000000, // 12.5 tỷ
    revenueChange: 12,
    todayVisits: 1240,
    visitsChange: 5,
    doctorsOnDuty: 24,
    totalDoctors: 45,
    medicineAlerts: 8,
};

export const MOCK_DEPARTMENT_LOADS: DepartmentLoad[] = [
    { id: "1", name: "Khoa Nội tổng hợp", loadPercentage: 85 },
    { id: "2", name: "Khoa Ngoại", loadPercentage: 60 },
    { id: "3", name: "Khoa Nhi", loadPercentage: 45 },
    { id: "4", name: "Khoa Cấp cứu", loadPercentage: 30 },
    { id: "5", name: "Khoa Sản", loadPercentage: 72 },
];

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
    {
        id: "1",
        userId: "u1",
        userName: "BS. Nguyễn Văn A",
        userAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjL0c2y4C7gzoYwuNdRKhhhHj2aWy_DC_rBOyc5WDrWXI9A-brBCvlkygeSEIJMJHDj-ruFGs8BScjmbNFX-QcsJOu5y3uKdozvOuwBJAdisDbncX6dnDb9quaSA1I7fjYXjLTmSllKm7rr-8CFeLlNvL4nyGW6v7Sje2_IJPsqxKoDw45LZL6exhQoNzGLkip2AqRw__uvBhaE4fyUikKuDM11AD8eHTeIN3tKmXL_PZCX_hI3l1u8zvcamjC4FRh3XkO7ArWvhHw",
        action: "Cập nhật hồ sơ bệnh án #BA-9921",
        status: "SUCCESS",
        time: "10:45 AM",
        createdAt: "2024-01-27T10:45:00",
        updatedAt: "2024-01-27T10:45:00",
    },
    {
        id: "2",
        userId: "u2",
        userName: "Admin Quản trị",
        userAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQYIqPn_-s62aeppqoiMtHkuez698P9PXA0a03QBC6Wns_EQXjLkFJ_kJ7tzpoo_H3_6578fCpsYqlWJfw_vA4F3u8ONBugqU-9uZxbs3JMaXbLuLbBLdJSvRr8C2lzIA5O1q7CaeG3LI0a5VYEyfkU7hZU-J_MwS62b8d2X8QUV72FNA27BURKLxPpwBtvxL6J6Grch4aSlFi9g5EGsWwf5FzDDyl1Zz9Gq53I6G74TUGy4o-QzsXSD42oWJNRv5LKMCEdlkD0LIl",
        action: "Phê duyệt yêu cầu nghỉ phép của BS. Trần Thị B",
        status: "SUCCESS",
        time: "10:30 AM",
        createdAt: "2024-01-27T10:30:00",
        updatedAt: "2024-01-27T10:30:00",
    },
    {
        id: "3",
        userId: "sys",
        userName: "System Bot",
        action: "Tự động sao lưu dữ liệu hệ thống",
        status: "SUCCESS",
        time: "09:15 AM",
        createdAt: "2024-01-27T09:15:00",
        updatedAt: "2024-01-27T09:15:00",
    },
];

// ============================================
// Users - Danh sách người dùng
// ============================================

export const MOCK_USERS: User[] = [
    {
        id: "1",
        email: "admin@ehealth.vn",
        fullName: "Admin Quản trị",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQYIqPn_-s62aeppqoiMtHkuez698P9PXA0a03QBC6Wns_EQXjLkFJ_kJ7tzpoo_H3_6578fCpsYqlWJfw_vA4F3u8ONBugqU-9uZxbs3JMaXbLuLbBLdJSvRr8C2lzIA5O1q7CaeG3LI0a5VYEyfkU7hZU-J_MwS62b8d2X8QUV72FNA27BURKLxPpwBtvxL6J6Grch4aSlFi9g5EGsWwf5FzDDyl1Zz9Gq53I6G74TUGy4o-QzsXSD42oWJNRv5LKMCEdlkD0LIl",
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        lastAccess: "Vừa xong",
        createdAt: "2023-01-01",
        updatedAt: "2024-01-27",
    },
    {
        id: "2",
        email: "nguyenvana@ehealth.vn",
        fullName: "BS. Nguyễn Văn A",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjL0c2y4C7gzoYwuNdRKhhhHj2aWy_DC_rBOyc5WDrWXI9A-brBCvlkygeSEIJMJHDj-ruFGs8BScjmbNFX-QcsJOu5y3uKdozvOuwBJAdisDbncX6dnDb9quaSA1I7fjYXjLTmSllKm7rr-8CFeLlNvL4nyGW6v7Sje2_IJPsqxKoDw45LZL6exhQoNzGLkip2AqRw__uvBhaE4fyUikKuDM11AD8eHTeIN3tKmXL_PZCX_hI3l1u8zvcamjC4FRh3XkO7ArWvhHw",
        role: ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
        lastAccess: "2 giờ trước",
        createdAt: "2023-03-15",
        updatedAt: "2024-01-27",
    },
    {
        id: "3",
        email: "letan01@ehealth.vn",
        fullName: "Trần Thị B (Lễ tân)",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqJb3hZE7mNsgl_pBlG89fBjlt56Z3_-txezlqsCM5EGFDjKzg952j7uyAHlTmmODT1Wal5j26t4tilEQYB6VDl7CPTxe6fFvVGSOFXjnZeWeGo1O5bD1H9bfdcittfKzBYECLCYKFsFFmIjriwan_EjrTZ8lagdrMZ3fZWcIMiDyvDi2urqCT29nCy2SOPXaEF-IVI5WKSsPW7k6w6YpEu0D6sMGbXiCwEhAYyy52sOwxD863NgxJ08CIcxuxIJAIxZHn6JB5qA1v",
        role: ROLES.RECEPTIONIST,
        status: USER_STATUS.ACTIVE,
        lastAccess: "15 phút trước",
        createdAt: "2023-06-10",
        updatedAt: "2024-01-27",
    },
];

// ============================================
// Doctors - Danh sách bác sĩ
// ============================================

export const MOCK_DOCTORS: Doctor[] = [
    {
        id: "1",
        userId: "2",
        code: "DR-2024001",
        fullName: "BS. Nguyễn Văn A",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjL0c2y4C7gzoYwuNdRKhhhHj2aWy_DC_rBOyc5WDrWXI9A-brBCvlkygeSEIJMJHDj-ruFGs8BScjmbNFX-QcsJOu5y3uKdozvOuwBJAdisDbncX6dnDb9quaSA1I7fjYXjLTmSllKm7rr-8CFeLlNvL4nyGW6v7Sje2_IJPsqxKoDw45LZL6exhQoNzGLkip2AqRw__uvBhaE4fyUikKuDM11AD8eHTeIN3tKmXL_PZCX_hI3l1u8zvcamjC4FRh3XkO7ArWvhHw",
        email: "nguyenvana@ehealth.vn",
        departmentId: "1",
        departmentName: "Tim mạch",
        specialization: "Tim mạch",
        rating: 4.9,
        reviewCount: 120,
        status: DOCTOR_STATUS.ACTIVE,
        workingSchedule: [{ shift: "MORNING", days: ["T2", "T4", "T6"] }],
        createdAt: "2023-03-15",
        updatedAt: "2024-01-27",
    },
    {
        id: "2",
        userId: "6",
        code: "DR-2024002",
        fullName: "BS. Trần Thị B",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqJb3hZE7mNsgl_pBlG89fBjlt56Z3_-txezlqsCM5EGFDjKzg952j7uyAHlTmmODT1Wal5j26t4tilEQYB6VDl7CPTxe6fFvVGSOFXjnZeWeGo1O5bD1H9bfdcittfKzBYECLCYKFsFFmIjriwan_EjrTZ8lagdrMZ3fZWcIMiDyvDi2urqCT29nCy2SOPXaEF-IVI5WKSsPW7k6w6YpEu0D6sMGbXiCwEhAYyy52sOwxD863NgxJ08CIcxuxIJAIxZHn6JB5qA1v",
        email: "tranthib@ehealth.vn",
        departmentId: "2",
        departmentName: "Nhi khoa",
        specialization: "Nhi khoa",
        rating: 4.8,
        reviewCount: 85,
        status: DOCTOR_STATUS.ON_LEAVE,
        workingSchedule: [{ shift: "AFTERNOON", days: ["T3", "T5", "T7"] }],
        createdAt: "2023-04-20",
        updatedAt: "2024-01-27",
    },
];

// ============================================
// Departments - Danh sách khoa
// ============================================

export const MOCK_DEPARTMENTS: Department[] = [
    {
        id: "1",
        code: "K-001",
        name: "Khoa Tim Mạch",
        nameEn: "Cardiology Dept.",
        icon: "cardiology",
        color: "red",
        doctorCount: 15,
        status: DEPARTMENT_STATUS.ACTIVE,
        createdAt: "2023-01-01",
        updatedAt: "2024-01-27",
    },
    {
        id: "2",
        code: "K-002",
        name: "Khoa Nhi",
        nameEn: "Pediatrics Dept.",
        icon: "child_care",
        color: "blue",
        doctorCount: 12,
        status: DEPARTMENT_STATUS.ACTIVE,
        createdAt: "2023-01-01",
        updatedAt: "2024-01-27",
    },
];

// ============================================
// Medicines - Danh sách thuốc
// ============================================

export const MOCK_MEDICINES: Medicine[] = [
    {
        id: "1",
        code: "SP-2024-001",
        name: "Amoxicillin 500mg",
        activeIngredient: "Amoxicillin trihydrate",
        unit: "Hộp",
        unitDetail: "Hộp (10 vỉ x 10 viên)",
        price: 85000,
        stock: 1250,
        stockLevel: "HIGH",
        category: "Kháng sinh",
        status: MEDICINE_STATUS.IN_BUSINESS,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-27",
    },
    {
        id: "2",
        code: "SP-2024-002",
        name: "Panadol Extra",
        activeIngredient: "Paracetamol, Caffeine",
        unit: "Hộp",
        unitDetail: "Hộp (12 vỉ)",
        price: 120000,
        stock: 45,
        stockLevel: "LOW",
        category: "Giảm đau",
        status: MEDICINE_STATUS.IN_BUSINESS,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-27",
    },
];

// ============================================
// Stats Summary - Thống kê tổng hợp
// ============================================

export const MOCK_USER_STATS = {
    total: 248,
    active: 230,
    roles: 5,
    locked: 18,
};

export const MOCK_DOCTOR_STATS = {
    total: 128,
    onDuty: 42,
    pendingAssignment: 3,
    avgPerformance: 96,
};

export const MOCK_DEPARTMENT_STATS = {
    total: 24,
    active: 21,
    maintenance: 3,
    totalStaff: 128,
};

export const MOCK_MEDICINE_STATS = {
    total: 1240,
    lowStock: 45,
    expiringSoon: 12,
    totalValue: 8500000000,
};

// ============================================
// Chart Data - Dữ liệu biểu đồ
// ============================================

export const MOCK_PATIENT_GROWTH = [
    { month: "T1", value: 30 },
    { month: "T2", value: 45 },
    { month: "T3", value: 35 },
    { month: "T4", value: 50 },
    { month: "T5", value: 60 },
    { month: "T6", value: 55 },
    { month: "T7", value: 70 },
    { month: "T8", value: 85 },
    { month: "T9", value: 65 },
    { month: "T10", value: 75 },
    { month: "T11", value: 60 },
    { month: "T12", value: 40 },
];
