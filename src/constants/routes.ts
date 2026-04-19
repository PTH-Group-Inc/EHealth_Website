/**
 * Routes constants - Tất cả route strings được định nghĩa tại đây
 * KHÔNG hard-code route strings trong components
 */

export const ROUTES = {
  // Public routes (không cần đăng nhập)
  PUBLIC: {
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",
    OTP: "/otp",
    LANDING: "/",
    SPECIALTIES: "/specialties",
    DOCTORS: "/doctors",
    DOCTOR_DETAIL: (id: string) => `/doctors/${id}`,
    SERVICES: "/services",
    BOOKING: "/booking",
  },

  // Admin routes
  ADMIN: {
    DASHBOARD: "/admin",
    // Quản lý nhân sự
    USERS: "/admin/users",
    USERS_ROLES: "/admin/users/roles",
    DOCTORS: "/admin/doctors",
    // Quản lý bệnh viện
    DEPARTMENTS: "/admin/departments",
    HOSPITALS: "/admin/hospitals",
    TIME_SLOTS: "/admin/hospitals/time-slots",
    SCHEDULES: "/admin/schedules",
    // Kho thuốc
    MEDICINES: "/admin/medicines",
    MEDICINES_IMPORT: "/admin/medicines/import",
    MEDICINES_EXPORT: "/admin/medicines/export",
    MEDICINES_STOCK: "/admin/medicines/stock",
    // Thống kê & Khác
    STATISTICS: "/admin/statistics",
    STATISTICS_REVENUE: "/admin/statistics/revenue",
    ACTIVITY_LOGS: "/admin/activity-logs",
    SETTINGS: "/admin/settings",
    
    // --- New routes based on new menu structure ---
    // Nhóm 1. Quản trị hệ thống
    NOTIFICATIONS: "/admin/notifications",
    CATALOGS: "/admin/catalogs",
    SYSTEM_CONFIG: "/admin/system-config",

    // Nhóm 2. Quản lý cơ sở y tế
    BRANCHES: "/admin/branches",
    SPECIALTIES: "/admin/specialties",
    SERVICES: "/admin/services",
    ROOMS: "/admin/rooms",
    EQUIPMENT: "/admin/equipment",
    BEDS: "/admin/beds",

    // Nhóm 3. Quản lý khám chữa bệnh
    WORK_SCHEDULES: "/admin/work-schedules",
    SCHEDULE_CONFIGS: "/admin/schedule-configs",
    PATIENTS: "/admin/patients",
    APPOINTMENTS: "/admin/appointments",
    APPOINTMENT_OPS: "/admin/appointment-ops",
    APPOINTMENT_RESCHEDULING: "/admin/appointment-rescheduling",

    // Nhóm 4. Quản lý Hồ sơ bệnh án
    ENCOUNTERS: "/admin/encounters",
    CLINICAL_EXAMINATIONS: "/admin/clinical-examinations",
    DIAGNOSES: "/admin/diagnoses",
    MEDICAL_RECORDS: "/admin/medical-records",
    PRESCRIPTIONS: "/admin/prescriptions",
    TREATMENT_PLANS: "/admin/treatment-plans",
    EHR: "/admin/ehr",

    // Nhóm 5. Quản lý Dược – kho – tài chính
    PHARMACY_INVENTORY: "/admin/pharmacy-inventory",
    BILLING: "/admin/billing",
    CASHIER: "/admin/cashier",

    // Nhóm 6. Quản lý Khám từ xa
    TELEMEDICINE_CONFIGS: "/admin/telemedicine-configs",
    TELEMEDICINE_BOOKINGS: "/admin/telemedicine-bookings",
    TELEMEDICINE_RESULTS: "/admin/telemedicine-results",

    // Nhóm 7. Báo cáo
    REPORTS_DASHBOARD: "/admin/reports-dashboard",
  },

  // Portal routes (Doctor, Pharmacist, Staff)
  PORTAL: {
    DOCTOR: {
      DASHBOARD: "/portal/doctor",
      APPOINTMENTS: "/portal/doctor/appointments",
      QUEUE: "/portal/doctor/queue",
      EXAMINATION: "/portal/doctor/examination",
      MEDICAL_RECORDS: "/portal/doctor/medical-records",
      PRESCRIPTIONS: "/portal/doctor/prescriptions",
      AI_ASSISTANT: "/portal/doctor/ai-assistant",
      TELEMEDICINE: "/portal/doctor/telemedicine",
      SETTINGS: "/portal/doctor/settings",
    },
    PHARMACIST: {
      DASHBOARD: "/portal/pharmacist",
      PRESCRIPTIONS: "/portal/pharmacist/prescriptions",
      DISPENSING: "/portal/pharmacist/dispensing",
      INVENTORY: "/portal/pharmacist/inventory",
      SETTINGS: "/portal/pharmacist/settings",
    },
    STAFF: {
      DASHBOARD: "/portal/receptionist",
      RECEPTION: "/portal/receptionist/reception",
      APPOINTMENTS: "/portal/receptionist/appointments",
      QUEUE: "/portal/receptionist/queue",
      PATIENTS: "/portal/receptionist/patients",
      BILLING: "/portal/receptionist/billing",
      SETTINGS: "/portal/receptionist/settings",
    },
  },

  // Patient routes (cần đăng nhập role PATIENT)
  PATIENT: {
    DASHBOARD: "/patient",
    LOGIN: "/patient/login",
    REGISTER: "/patient/register",
    BOOKING_SUCCESS: "/patient/booking-success",
    APPOINTMENTS: "/patient/appointments",
    APPOINTMENT_DETAIL: (id: string) => `/patient/appointments/${id}`,
    PATIENT_PROFILES: "/patient/patient-profiles",
    PROFILE: "/patient/profile",
    MEDICAL_RECORDS: "/patient/medical-records",
    HEALTH_RECORDS: "/patient/health-records",
    BILLING: "/patient/billing",
    TELEMEDICINE: "/patient/telemedicine",
    AI_CONSULT: "/patient/ai-consult",
    MEDICATION_REMINDERS: "/patient/medication-reminders",
  },
} as const;

// Doctor sidebar menu items
export const DOCTOR_MENU_ITEMS = [
  {
    key: "dashboard",
    href: ROUTES.PORTAL.DOCTOR.DASHBOARD,
    icon: "home",
    label: "Trang chủ",
  },
  {
    key: "appointments",
    href: ROUTES.PORTAL.DOCTOR.APPOINTMENTS,
    icon: "calendar_month",
    label: "Lịch hẹn",
  },
  {
    key: "queue",
    href: ROUTES.PORTAL.DOCTOR.QUEUE,
    icon: "groups",
    label: "Hàng đợi",
  },
  {
    key: "examination",
    href: ROUTES.PORTAL.DOCTOR.EXAMINATION,
    icon: "stethoscope",
    label: "Khám bệnh",
  },
  {
    key: "medical-records",
    href: ROUTES.PORTAL.DOCTOR.MEDICAL_RECORDS,
    icon: "folder_shared",
    label: "Hồ sơ bệnh án",
  },
  {
    key: "prescriptions",
    href: ROUTES.PORTAL.DOCTOR.PRESCRIPTIONS,
    icon: "pill",
    label: "Kê đơn",
  },
  {
    key: "ai-assistant",
    href: ROUTES.PORTAL.DOCTOR.AI_ASSISTANT,
    icon: "smart_toy",
    label: "Trợ lý AI",
  },
  {
    key: "telemedicine",
    href: ROUTES.PORTAL.DOCTOR.TELEMEDICINE,
    icon: "videocam",
    label: "Khám từ xa",
  },
  {
    key: "settings",
    href: ROUTES.PORTAL.DOCTOR.SETTINGS,
    icon: "settings",
    label: "Cài đặt",
  },
] as const;

// Admin sidebar menu items — hỗ trợ nhóm + submenu
export interface AdminMenuItem {
  key: string;
  href?: string;
  icon: string;
  label: string;
  children?: { key: string; href: string; label: string }[];
}

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  {
    key: "dashboard",
    href: ROUTES.ADMIN.DASHBOARD,
    icon: "home",
    label: "Trang chủ",
  },
  {
    key: "system_admin",
    icon: "admin_panel_settings",
    label: "Quản trị hệ thống",
    children: [
      { key: "users", href: ROUTES.ADMIN.USERS, label: "Tài khoản" },
      { key: "doctors", href: ROUTES.ADMIN.DOCTORS, label: "Nhân sự y tế" },
      { key: "roles", href: ROUTES.ADMIN.USERS_ROLES, label: "Phân quyền" },
      { key: "notifications", href: ROUTES.ADMIN.NOTIFICATIONS, label: "Thông báo" },
      { key: "catalogs", href: ROUTES.ADMIN.CATALOGS, label: "Danh mục hệ thống" },
      { key: "system_config", href: ROUTES.ADMIN.SYSTEM_CONFIG, label: "Cấu hình hệ thống" },
    ],
  },
  {
    key: "facility_management",
    icon: "domain",
    label: "Quản lý cơ sở y tế",
    children: [
      { key: "hospitals", href: ROUTES.ADMIN.HOSPITALS, label: "Cơ sở y tế" },
      { key: "branches", href: ROUTES.ADMIN.BRANCHES, label: "Chi nhánh" },
      { key: "departments", href: ROUTES.ADMIN.DEPARTMENTS, label: "Phòng ban / khoa" },
      { key: "specialties", href: ROUTES.ADMIN.SPECIALTIES, label: "Chuyên khoa" },
      { key: "services", href: ROUTES.ADMIN.SERVICES, label: "Dịch vụ" },
      { key: "rooms", href: ROUTES.ADMIN.ROOMS, label: "Phòng khám" },
      { key: "equipment", href: ROUTES.ADMIN.EQUIPMENT, label: "Thiết bị" },
      { key: "beds", href: ROUTES.ADMIN.BEDS, label: "Giường bệnh" },
    ],
  },
  {
    key: "clinical_management",
    icon: "stethoscope",
    label: "Quản lý khám chữa bệnh",
    children: [
      { key: "work_schedules", href: ROUTES.ADMIN.WORK_SCHEDULES, label: "Lịch làm việc" },
      { key: "schedule_configs", href: ROUTES.ADMIN.SCHEDULE_CONFIGS, label: "Cấu hình lịch khám" },
      { key: "patients", href: ROUTES.ADMIN.PATIENTS, label: "Bệnh nhân" },
      { key: "appointments", href: ROUTES.ADMIN.APPOINTMENTS, label: "Lịch khám" },
      { key: "appointment_ops", href: ROUTES.ADMIN.APPOINTMENT_OPS, label: "Xác nhận / nhắc lịch / queue" },
      { key: "appointment_rescheduling", href: ROUTES.ADMIN.APPOINTMENT_RESCHEDULING, label: "Dời lịch / điều phối" },
    ],
  },
  {
    key: "medical_records",
    icon: "folder_shared",
    label: "Quản lý Hồ sơ bệnh án",
    children: [
      { key: "encounters", href: ROUTES.ADMIN.ENCOUNTERS, label: "Encounter" },
      { key: "clinical_examinations", href: ROUTES.ADMIN.CLINICAL_EXAMINATIONS, label: "Clinical examination" },
      { key: "diagnoses", href: ROUTES.ADMIN.DIAGNOSES, label: "Diagnosis" },
      { key: "patient_medical_records", href: ROUTES.ADMIN.MEDICAL_RECORDS, label: "Medical records" },
      { key: "prescriptions", href: ROUTES.ADMIN.PRESCRIPTIONS, label: "Prescription" },
      { key: "treatment_plans", href: ROUTES.ADMIN.TREATMENT_PLANS, label: "Treatment plan" },
      { key: "ehr", href: ROUTES.ADMIN.EHR, label: "EHR tổng hợp" },
    ],
  },
  {
    key: "pharmacy_finance",
    icon: "account_balance_wallet",
    label: "Dược – kho – tài chính",
    children: [
      { key: "pharmacy_inventory", href: ROUTES.ADMIN.PHARMACY_INVENTORY, label: "Dược & kho" },
      { key: "billing", href: ROUTES.ADMIN.BILLING, label: "Billing" },
      { key: "cashier", href: ROUTES.ADMIN.CASHIER, label: "Thu ngân / QR / đối soát" },
    ],
  },
  {
    key: "telemedicine",
    icon: "videocam",
    label: "Khám từ xa",
    children: [
      { key: "telemedicine_configs", href: ROUTES.ADMIN.TELEMEDICINE_CONFIGS, label: "Loại khám & cấu hình" },
      { key: "telemedicine_bookings", href: ROUTES.ADMIN.TELEMEDICINE_BOOKINGS, label: "Booking & room" },
      { key: "telemedicine_results", href: ROUTES.ADMIN.TELEMEDICINE_RESULTS, label: "Theo dõi khám online" }, // Shortened for display
    ],
  },
  {
    key: "reports",
    icon: "bar_chart",
    label: "Báo cáo",
    children: [
      { key: "reports_dashboard", href: ROUTES.ADMIN.REPORTS_DASHBOARD, label: "Dashboard" },
      { key: "statistics_revenue", href: ROUTES.ADMIN.STATISTICS_REVENUE, label: "Revenue" },
    ],
  },
];

// Staff sidebar menu items (formerly Receptionist)
export const STAFF_MENU_ITEMS = [
  {
    key: "dashboard",
    href: ROUTES.PORTAL.STAFF.DASHBOARD,
    icon: "home",
    label: "Trang chủ",
  },
  {
    key: "reception",
    href: ROUTES.PORTAL.STAFF.RECEPTION,
    icon: "how_to_reg",
    label: "Tiếp nhận BN",
  },
  {
    key: "appointments",
    href: ROUTES.PORTAL.STAFF.APPOINTMENTS,
    icon: "calendar_month",
    label: "Lịch hẹn",
  },
  {
    key: "queue",
    href: ROUTES.PORTAL.STAFF.QUEUE,
    icon: "groups",
    label: "Hàng đợi",
  },
  {
    key: "patients",
    href: ROUTES.PORTAL.STAFF.PATIENTS,
    icon: "person_add",
    label: "Bệnh nhân",
  },
  {
    key: "billing",
    href: ROUTES.PORTAL.STAFF.BILLING,
    icon: "receipt_long",
    label: "Thanh toán",
  },
  {
    key: "settings",
    href: ROUTES.PORTAL.STAFF.SETTINGS,
    icon: "settings",
    label: "Cài đặt",
  },
] as const;

// Backward compatibility alias
export const RECEPTIONIST_MENU_ITEMS = STAFF_MENU_ITEMS;

// Pharmacist sidebar menu items
export const PHARMACIST_MENU_ITEMS = [
  {
    key: "dashboard",
    href: ROUTES.PORTAL.PHARMACIST.DASHBOARD,
    icon: "home",
    label: "Trang chủ",
  },
  {
    key: "prescriptions",
    href: ROUTES.PORTAL.PHARMACIST.PRESCRIPTIONS,
    icon: "pill",
    label: "Đơn thuốc",
  },
  {
    key: "dispensing",
    href: ROUTES.PORTAL.PHARMACIST.DISPENSING,
    icon: "local_pharmacy",
    label: "Cấp phát",
  },
  {
    key: "inventory",
    href: ROUTES.PORTAL.PHARMACIST.INVENTORY,
    icon: "inventory_2",
    label: "Kho thuốc",
  },
  {
    key: "settings",
    href: ROUTES.PORTAL.PHARMACIST.SETTINGS,
    icon: "settings",
    label: "Cài đặt",
  },
] as const;

// Patient sidebar menu items
export const PATIENT_MENU_ITEMS = [
  {
    key: "dashboard",
    href: ROUTES.PATIENT.DASHBOARD,
    icon: "home",
    label: "Trang chủ",
  },
  {
    key: "appointments",
    href: ROUTES.PATIENT.APPOINTMENTS,
    icon: "calendar_month",
    label: "Lịch hẹn của tôi",
  },
  {
    key: "patient-profiles",
    href: ROUTES.PATIENT.PATIENT_PROFILES,
    icon: "family_restroom",
    label: "Hồ sơ bệnh nhân",
  },
  {
    key: "medical-records",
    href: ROUTES.PATIENT.MEDICAL_RECORDS,
    icon: "folder_shared",
    label: "Kết quả khám",
  },
  {
    key: "health-records",
    href: ROUTES.PATIENT.HEALTH_RECORDS,
    icon: "monitor_heart",
    label: "Hồ sơ sức khỏe",
  },
  {
    key: "medication-reminders",
    href: ROUTES.PATIENT.MEDICATION_REMINDERS,
    icon: "medication",
    label: "Nhắc thuốc",
  },
  {
    key: "billing",
    href: ROUTES.PATIENT.BILLING,
    icon: "receipt_long",
    label: "Thanh toán",
  },
  {
    key: "telemedicine",
    href: ROUTES.PATIENT.TELEMEDICINE,
    icon: "videocam",
    label: "Khám từ xa",
  },
  {
    key: "ai-consult",
    href: ROUTES.PATIENT.AI_CONSULT,
    icon: "smart_toy",
    label: "AI tư vấn",
  },
  {
    key: "profile",
    href: ROUTES.PATIENT.PROFILE,
    icon: "manage_accounts",
    label: "Tài khoản",
  },
] as const;
