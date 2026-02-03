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
  },

  // Admin routes
  ADMIN: {
    DASHBOARD: "/admin",
    USERS: "/admin/users",
    DOCTORS: "/admin/doctors",
    DEPARTMENTS: "/admin/departments",
    MEDICINES: "/admin/medicines",
    SCHEDULES: "/admin/schedules",
    STATISTICS: "/admin/statistics",
    ACTIVITY_LOGS: "/admin/activity-logs",
    SETTINGS: "/admin/settings",
  },

  // Portal routes (Doctor, Pharmacist, Receptionist)
  PORTAL: {
    DOCTOR: {
      DASHBOARD: "/portal/doctor",
      APPOINTMENTS: "/portal/doctor/appointments",
      QUEUE: "/portal/doctor/queue",
      EXAMINATION: "/portal/doctor/examination",
      MEDICAL_RECORDS: "/portal/doctor/medical-records",
      PRESCRIPTIONS: "/portal/doctor/prescriptions",
      REPORTS: "/portal/doctor/reports",
      SETTINGS: "/portal/doctor/settings",
    },
    PHARMACIST: {
      DASHBOARD: "/portal/pharmacist",
      PRESCRIPTIONS: "/portal/pharmacist/prescriptions",
    },
    RECEPTIONIST: {
      DASHBOARD: "/portal/receptionist",
      APPOINTMENTS: "/portal/receptionist/appointments",
      QUEUE: "/portal/receptionist/queue",
    },
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
    key: "reports",
    href: ROUTES.PORTAL.DOCTOR.REPORTS,
    icon: "assessment",
    label: "Báo cáo",
  },
  {
    key: "settings",
    href: ROUTES.PORTAL.DOCTOR.SETTINGS,
    icon: "settings",
    label: "Cài đặt",
  },
] as const;

// Admin sidebar menu items
export const ADMIN_MENU_ITEMS = [
  {
    key: "dashboard",
    href: ROUTES.ADMIN.DASHBOARD,
    icon: "dashboard",
    label: "Trang chủ",
  },
  {
    key: "users",
    href: ROUTES.ADMIN.USERS,
    icon: "group",
    label: "Người dùng & Phân quyền",
  },
  {
    key: "doctors",
    href: ROUTES.ADMIN.DOCTORS,
    icon: "stethoscope",
    label: "Quản lý Bác sĩ",
  },
  {
    key: "departments",
    href: ROUTES.ADMIN.DEPARTMENTS,
    icon: "category",
    label: "Chuyên khoa",
  },
  {
    key: "medicines",
    href: ROUTES.ADMIN.MEDICINES,
    icon: "medication",
    label: "Danh mục Thuốc",
  },
  {
    key: "schedules",
    href: ROUTES.ADMIN.SCHEDULES,
    icon: "calendar_month",
    label: "Lịch trực",
  },
  {
    key: "statistics",
    href: ROUTES.ADMIN.STATISTICS,
    icon: "bar_chart",
    label: "Thống kê",
  },
  {
    key: "activity-logs",
    href: ROUTES.ADMIN.ACTIVITY_LOGS,
    icon: "history",
    label: "Nhật ký hoạt động",
  },
] as const;
