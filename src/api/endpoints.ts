/**
 * API Endpoints Configuration
 * Tập trung tất cả các endpoint API — đồng bộ với Swagger docs
 * 
 * Backend: http://160.250.186.97:3000/api-docs
 * @description Dễ dàng quản lý và thay đổi endpoints
 * @lastSync 2026-03-08
 */

// ============================================
// 1.2 Authentication Endpoints
// ✅ Đã khớp Swagger API
// ============================================
export const AUTH_ENDPOINTS = {
    LOGIN_EMAIL: '/api/auth/login/email',
    LOGIN_PHONE: '/api/auth/login/phone',
    REGISTER_EMAIL: '/api/auth/register/email',
    REGISTER_PHONE: '/api/auth/register/phone',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    UNLOCK_ACCOUNT: '/api/auth/unlock-account',

    // 1.2.2 Session management
    SESSIONS: '/api/auth/sessions',
    SESSION_DELETE: (sessionId: string) => `/api/auth/sessions/${sessionId}`,
    SESSIONS_LOGOUT_ALL: '/api/auth/sessions/logout-all',    // POST: đăng xuất tất cả phiên

    // 1.3.7 User context — lấy role/menu/quyền sau khi đăng nhập
    ME_ROLES: '/api/auth/me/roles',
    ME_MENUS: '/api/auth/me/menus',
    ME_PERMISSIONS: '/api/auth/me/permissions',
};

// ============================================
// 1.6 Profile Endpoints
// ✅ Đã khớp Swagger: /api/profile/*
// ============================================
export const PROFILE_ENDPOINTS = {
    ME: '/api/profile/me',                    // GET: lấy profile, PUT: cập nhật profile
    CHANGE_PASSWORD: '/api/profile/password',  // PUT: đổi mật khẩu
    SESSIONS: '/api/profile/sessions',         // GET: xem lịch sử/thiết bị đăng nhập
    SESSIONS_LOGOUT_ALL: '/api/profile/sessions',         // DELETE: đăng xuất tất cả thiết bị khác
    SESSION_DELETE: (sessionId: string) => `/api/profile/sessions/${sessionId}`, // DELETE: đăng xuất thiết bị cụ thể
    SETTINGS: '/api/profile/settings',         // PUT: cài đặt cá nhân
};

// ============================================
// 1.1 User Management Endpoints
// ✅ Đã bổ sung đầy đủ theo Swagger
// ============================================
export const USER_ENDPOINTS = {
    // 1.1.1 Quản lý User
    ACCOUNT_STATUS: '/api/users/account-status', // GET: danh sách trạng thái tài khoản
    LIST: '/api/users',                           // GET: danh sách users
    CREATE: '/api/users',                         // POST: tạo user
    SEARCH: '/api/users/search',                  // GET: tìm kiếm user
    DETAIL: (id: string) => `/api/users/${id}`,   // GET: chi tiết user

    // 1.1.2 Khóa / mở khóa tài khoản
    LOCK: (id: string) => `/api/users/${id}/lock`,     // PATCH: khóa tài khoản
    UNLOCK: (id: string) => `/api/users/${id}/unlock`, // PATCH: mở khóa tài khoản

    // 1.1.3 Quản lý trạng thái tài khoản
    STATUS: (id: string) => `/api/users/${id}/status`,               // PATCH: cập nhật trạng thái
    STATUS_HISTORY: (id: string) => `/api/users/${id}/status-history`, // GET: lịch sử trạng thái

    // 1.1.4 Reset mật khẩu người dùng
    RESET_PASSWORD: (id: string) => `/api/users/${id}/reset-password`,   // POST: admin reset pw
    CHANGE_PASSWORD: (id: string) => `/api/users/${id}/change-password`, // POST: admin đổi pw

    // 1.1.5 Gán vai trò cho người dùng
    ROLES: (id: string) => `/api/users/${id}/roles`,                         // GET/POST
    ROLE_DELETE: (userId: string, roleId: string) => `/api/users/${userId}/roles/${roleId}`, // DELETE

    // 1.1.6 Gán người dùng vào cơ sở y tế
    FACILITIES: (id: string) => `/api/users/${id}/facilities`,                                         // GET/POST
    FACILITY_UPDATE: (userId: string, facilityId: string) => `/api/users/${userId}/facilities/${facilityId}`, // PUT
    FACILITY_DELETE: (userId: string, facilityId: string) => `/api/users/${userId}/facilities/${facilityId}`, // DELETE

    // 1.1.7 Import người dùng hàng loạt
    IMPORT: '/api/users/import',                   // POST: import users
    IMPORT_VALIDATE: '/api/users/import/validate', // POST: validate import file
    IMPORT_HISTORY: '/api/users/import/history',   // GET: lịch sử import

    // 1.1.8 Export danh sách người dùng
    EXPORT: '/api/users/export',                   // GET/POST: export users
};

// ============================================
// 1.1.9 Facility Endpoints (dropdown)
// ✅ Đã khớp Swagger
// ============================================
export const FACILITY_ENDPOINTS = {
    LIST: '/api/facilities',                // GET: dropdown danh sách cơ sở y tế
};

// ============================================
// 1.3 Role & Permission Management
// ✅ Bổ sung đầy đủ theo Swagger
// ============================================

// 1.3.1 Role Management
export const ROLE_ENDPOINTS = {
    LIST: '/api/roles',                                           // GET: danh sách roles
    CREATE: '/api/roles',                                         // POST: tạo role
    DETAIL: (roleId: string) => `/api/roles/${roleId}`,           // GET: chi tiết role
    UPDATE: (roleId: string) => `/api/roles/${roleId}`,           // PATCH: cập nhật role
    DELETE: (roleId: string) => `/api/roles/${roleId}`,           // DELETE: xóa role
    STATUS: (roleId: string) => `/api/roles/${roleId}/status`,    // PATCH: bật/tắt role

    // 1.3.3 Gán quyền cho vai trò
    PERMISSIONS: (roleId: string) => `/api/roles/${roleId}/permissions`,     // GET/PUT/POST
    PERMISSION_DELETE: (roleId: string, permId: string) => `/api/roles/${roleId}/permissions/${permId}`, // DELETE

    // 1.3.5 Menu theo vai trò
    MENUS: (roleId: string) => `/api/roles/${roleId}/menus`,                 // GET/POST
    MENU_DELETE: (roleId: string, menuId: string) => `/api/roles/${roleId}/menus/${menuId}`, // DELETE

    // 1.3.6 API theo vai trò
    API_PERMISSIONS: (roleId: string) => `/api/roles/${roleId}/api-permissions`,     // GET/POST
    API_PERMISSION_DELETE: (roleId: string, apiId: string) => `/api/roles/${roleId}/api-permissions/${apiId}`, // DELETE
};

// 1.3.2 Permission Management
export const PERMISSION_ENDPOINTS = {
    LIST: '/api/permissions',                                             // GET: danh sách permissions
    CREATE: '/api/permissions',                                           // POST: tạo permission
    DETAIL: (permId: string) => `/api/permissions/${permId}`,             // GET: chi tiết
    UPDATE: (permId: string) => `/api/permissions/${permId}`,             // PATCH: cập nhật
    DELETE: (permId: string) => `/api/permissions/${permId}`,             // DELETE: xóa
};

// 1.3.4 Module Management
export const MODULE_ENDPOINTS = {
    LIST: '/api/modules',                                                    // GET: danh sách modules
    PERMISSIONS: (moduleName: string) => `/api/modules/${moduleName}/permissions`, // GET: quyền theo module
};

// 1.3.5 Menu Management
export const MENU_ENDPOINTS = {
    LIST: '/api/menus',                                             // GET: danh sách menus
    CREATE: '/api/menus',                                           // POST: tạo menu
    UPDATE: (menuId: string) => `/api/menus/${menuId}`,             // PATCH: cập nhật
    DELETE: (menuId: string) => `/api/menus/${menuId}`,             // DELETE: xóa
};

// 1.3.6 API Permissions
export const API_PERMISSION_ENDPOINTS = {
    LIST: '/api/api-permissions',                                    // GET: danh sách API endpoints
    CREATE: '/api/api-permissions',                                  // POST: tạo API endpoint
    UPDATE: (apiId: string) => `/api/api-permissions/${apiId}`,      // PATCH: cập nhật
    DELETE: (apiId: string) => `/api/api-permissions/${apiId}`,      // DELETE: xóa
};

// ============================================
// 1.4 System Configuration Endpoints
// ✅ Mới — đầy đủ theo Swagger
// ============================================
export const SYSTEM_CONFIG_ENDPOINTS = {
    // 1.4.1 Thông tin cơ sở y tế
    FACILITY_INFO: '/api/system/facility-info',          // GET/PUT
    FACILITY_LOGO: '/api/system/facility-info/logo',     // POST: upload logo

    // 1.4.2 Thời gian làm việc
    WORKING_HOURS: '/api/system/working-hours',               // GET/PUT
    SLOT_CONFIG: '/api/system/working-hours/slot-config',     // GET/PUT

    // 1.4.3 Quy định nghiệp vụ
    BUSINESS_RULES: '/api/system/business-rules',                               // GET: tất cả
    BUSINESS_RULES_BULK: '/api/system/business-rules/bulk',                     // PUT: cập nhật nhiều
    BUSINESS_RULE: (key: string) => `/api/system/business-rules/${key}`,        // GET/PUT

    // 1.4.4 Bảo mật
    SECURITY_SETTINGS: '/api/system/security-settings',       // GET/PUT

    // 1.4.5 Đa ngôn ngữ
    I18N: '/api/system/i18n',                                 // GET/PUT
    I18N_SUPPORTED: '/api/system/i18n/supported',             // GET

    // 1.4.6 Email/SMS
    NOTIFICATION_CONFIG_EMAIL: '/api/system/notification-config/email', // GET/PUT
    NOTIFICATION_CONFIG_SMS: '/api/system/notification-config/sms',     // GET/PUT
    NOTIFICATION_CONFIG_TEST: '/api/system/notification-config/test',   // POST

    // 1.4.7 Tham số hệ thống
    SETTINGS: '/api/system/settings',                                      // GET/POST
    SETTINGS_MODULES: '/api/system/settings/modules',                      // GET: dropdown
    SETTING_BY_KEY: (key: string) => `/api/system/settings/${key}`,        // GET/PUT/DELETE

    // 1.4.8 Phân quyền cấu hình
    CONFIG_PERMISSIONS: '/api/system/config-permissions',   // GET/PUT
};

// ============================================
// 1.5.1 Specialty Endpoints
// ✅ Mới — theo Swagger
// ============================================
export const SPECIALTY_ENDPOINTS = {
    LIST: '/api/specialties',                                    // GET: danh sách chuyên khoa
    CREATE: '/api/specialties',                                  // POST: tạo chuyên khoa
    DETAIL: (id: string) => `/api/specialties/${id}`,            // GET: chi tiết
    UPDATE: (id: string) => `/api/specialties/${id}`,            // PUT: cập nhật
    DELETE: (id: string) => `/api/specialties/${id}`,            // DELETE: xóa mềm
    BY_FACILITY: (facilityId: string) => `/api/specialties/by-facility/${facilityId}`,
    SPECIALTY_SERVICES: (id: string) => `/api/specialty-services/${id}/services`,
};

// ============================================
// 1.5.2 Master Data Endpoints
// ✅ Đã bổ sung items export/import
// ============================================
export const MASTER_DATA_ENDPOINTS = {
    // Categories
    CATEGORIES_LIST: '/api/master-data/categories',
    CATEGORIES_CREATE: '/api/master-data/categories',
    CATEGORIES_DETAIL: (id: string) => `/api/master-data/categories/${id}`,
    CATEGORIES_UPDATE: (id: string) => `/api/master-data/categories/${id}`,
    CATEGORIES_DELETE: (id: string) => `/api/master-data/categories/${id}`,
    CATEGORIES_EXPORT: '/api/master-data/categories/export',
    CATEGORIES_IMPORT: '/api/master-data/categories/import',

    // Items within a category
    ITEMS_LIST: (categoryCode: string) => `/api/master-data/categories/${categoryCode}/items`,
    ITEMS_CREATE: (categoryCode: string) => `/api/master-data/categories/${categoryCode}/items`,
    ITEMS_EXPORT: (categoryCode: string) => `/api/master-data/categories/${categoryCode}/items/export`,
    ITEMS_IMPORT: (categoryCode: string) => `/api/master-data/categories/${categoryCode}/items/import`,

    // Items direct
    ITEMS_ALL: '/api/master-data/items',                        // GET: tất cả items (Admin)
    ITEMS_UPDATE: (id: string) => `/api/master-data/items/${id}`,
    ITEMS_DELETE: (id: string) => `/api/master-data/items/${id}`,
};

// ============================================
// 1.5.3 Pharmacy Endpoints
// ✅ Đã bổ sung PATCH status
// ============================================
export const PHARMACY_ENDPOINTS = {
    // --- Drug Categories ---
    CATEGORIES_LIST: '/api/pharmacy/categories',
    CATEGORIES_CREATE: '/api/pharmacy/categories',
    CATEGORIES_DETAIL: (id: string) => `/api/pharmacy/categories/${id}`,
    CATEGORIES_UPDATE: (id: string) => `/api/pharmacy/categories/${id}`,
    CATEGORIES_DELETE: (id: string) => `/api/pharmacy/categories/${id}`,
    CATEGORIES_EXPORT: '/api/pharmacy/categories/export',
    CATEGORIES_IMPORT: '/api/pharmacy/categories/import',
    CATEGORIES_STATUS: (id: string) => `/api/pharmacy/categories/${id}/status`, // PATCH: bật/tắt

    // --- Drugs (Danh mục thuốc) ---
    DRUGS_LIST: '/api/pharmacy/drugs',
    DRUGS_CREATE: '/api/pharmacy/drugs',
    DRUGS_DETAIL: (id: string) => `/api/pharmacy/drugs/${id}`,
    DRUGS_UPDATE: (id: string) => `/api/pharmacy/drugs/${id}`,
    DRUGS_DELETE: (id: string) => `/api/pharmacy/drugs/${id}`,
    DRUGS_ACTIVE: '/api/pharmacy/drugs/active',     // GET: danh sách thuốc active (cho dropdown)
    DRUGS_EXPORT: '/api/pharmacy/drugs/export',     // GET: xuất Excel
    DRUGS_IMPORT: '/api/pharmacy/drugs/import',     // POST: nhập từ Excel
    DRUGS_STATUS: (id: string) => `/api/pharmacy/drugs/${id}/status`, // PATCH: bật/tắt
};

// Backward compatibility — giữ tên cũ, map sang mới
export const MEDICINE_ENDPOINTS = {
    LIST: PHARMACY_ENDPOINTS.DRUGS_LIST,
    DETAIL: (id: string) => PHARMACY_ENDPOINTS.DRUGS_DETAIL(id),
    CREATE: PHARMACY_ENDPOINTS.DRUGS_CREATE,
    UPDATE: (id: string) => PHARMACY_ENDPOINTS.DRUGS_UPDATE(id),
    DELETE: (id: string) => PHARMACY_ENDPOINTS.DRUGS_DELETE(id),
    ACTIVE: PHARMACY_ENDPOINTS.DRUGS_ACTIVE,
    EXPORT: PHARMACY_ENDPOINTS.DRUGS_EXPORT,
    IMPORT: PHARMACY_ENDPOINTS.DRUGS_IMPORT,
};

// ============================================
// 1.5.4-1.5.5 Medical Services Endpoints
// ✅ Đã khớp Swagger
// ============================================
export const MEDICAL_SERVICE_ENDPOINTS = {
    // Master services (dịch vụ gốc)
    MASTER_LIST: '/api/medical-services/master',
    MASTER_CREATE: '/api/medical-services/master',
    MASTER_DETAIL: (id: string) => `/api/medical-services/master/${id}`,
    MASTER_UPDATE: (id: string) => `/api/medical-services/master/${id}`,
    MASTER_DELETE: (id: string) => `/api/medical-services/master/${id}`,
    MASTER_STATUS: (id: string) => `/api/medical-services/master/${id}/status`,

    // Facility services (dịch vụ theo cơ sở)
    FACILITY_SERVICES: (facilityId: string) => `/api/medical-services/facilities/${facilityId}/services`,
    FACILITY_ACTIVE_SERVICES: (facilityId: string) => `/api/medical-services/facilities/${facilityId}/active-services`,
};

// ============================================
// 1.7 Notification Endpoints
// ✅ Bổ sung CRUD categories, templates, role-configs
// ============================================
export const NOTIFICATION_ENDPOINTS = {
    // 1.7.1 Categories
    CATEGORIES: '/api/notifications/categories',                                    // GET/POST
    CATEGORY_UPDATE: (id: string) => `/api/notifications/categories/${id}`,          // PUT
    CATEGORY_DELETE: (id: string) => `/api/notifications/categories/${id}`,          // DELETE

    // 1.7.2 Templates
    TEMPLATES: '/api/notifications/templates',                                       // GET/POST
    TEMPLATE_UPDATE: (id: string) => `/api/notifications/templates/${id}`,            // PUT
    TEMPLATE_DELETE: (id: string) => `/api/notifications/templates/${id}`,            // DELETE

    // 1.7.3 Role-based config
    ROLE_CONFIGS: '/api/notifications/role-configs',                                  // GET: ma trận
    ROLE_CONFIG_UPDATE: (roleId: string, categoryId: string) =>
        `/api/notifications/role-configs/${roleId}/${categoryId}`,                     // PUT

    // 1.7.4 Broadcast
    ADMIN_BROADCAST: '/api/notifications/inbox/admin-broadcast',                      // POST

    // 1.7.5 User Inbox
    INBOX: '/api/notifications/inbox',                                                // GET
    MARK_READ: (id: string) => `/api/notifications/inbox/${id}/read`,                 // PUT
    MARK_ALL_READ: '/api/notifications/inbox/read-all',                               // PUT
};

// ============================================
// 1.8 Audit Log Endpoints
// ✅ Đã khớp Swagger
// ============================================
export const AUDIT_LOG_ENDPOINTS = {
    LIST: '/api/system/audit-logs',
    DETAIL: (id: string) => `/api/system/audit-logs/${id}`,
    EXPORT_EXCEL: '/api/system/audit-logs/export-excel',
};

// ============================================
// 1.1.x Staff Management Endpoints (Nhân sự y tế)
// ✅ Swagger: GET /api/staff — trả về bác sĩ, y tá, dược sĩ, v.v. (KHÔNG bao gồm PATIENT)
// ============================================
export const STAFF_ENDPOINTS = {
    LIST: '/api/staff',                               // GET: danh sách nhân sự (loại trừ PATIENT)
    DETAIL: (id: string) => `/api/staff/${id}`,       // GET: chi tiết nhân sự
    CREATE: '/api/staff',                             // POST: thêm nhân sự mới
    UPDATE: (id: string) => `/api/staff/${id}`,       // PUT: cập nhật
    DELETE: (id: string) => `/api/staff/${id}`,       // DELETE: xóa
    STATUS: (id: string) => `/api/staff/${id}/status`, // PATCH: bật/tắt
};

// ============================================
// Các endpoint chưa có trong Swagger — giữ nguyên cho tương lai
// ============================================

export const DOCTOR_ENDPOINTS = {
    LIST: '/api/doctors', // QC_SKIP: legacy placeholder, FE uses STAFF_ENDPOINTS for doctor listing
    DETAIL: (id: string) => `/api/doctors/${id}`, // QC_SKIP: legacy placeholder, FE uses STAFF_ENDPOINTS
    CREATE: '/api/doctors', // QC_SKIP: legacy placeholder, FE uses STAFF endpoints
    UPDATE: (id: string) => `/api/doctors/${id}`, // QC_SKIP: legacy placeholder, FE uses STAFF endpoints
    DELETE: (id: string) => `/api/doctors/${id}`, // QC_SKIP: legacy placeholder, FE uses STAFF endpoints
    BY_DEPARTMENT: (departmentId: string) => `/api/doctors/department/${departmentId}`, // QC_SKIP: legacy placeholder
    SCHEDULE: (doctorId: string) => `/api/doctors/${doctorId}/schedule`, // QC_SKIP: legacy placeholder, FE uses staff schedules
    SERVICES: (doctorId: string) => `/api/doctor-services/${doctorId}/services`, // GET
};

// ============================================
// Patient Profile (Multi-Profile) — Module 1
// ✅ Swagger: /api/patient/profiles/*
// 1 account → nhiều patient profiles (gia đình)
// ============================================
export const PATIENT_PROFILE_ENDPOINTS = {
    LIST: '/api/patient/profiles',
    DEFAULT: '/api/patient/profiles/default',
    DETAIL: (id: string) => `/api/patient/profiles/${id}`,
    CREATE: '/api/patient/profiles',
    UPDATE: (id: string) => `/api/patient/profiles/${id}`,
    DELETE: (id: string) => `/api/patient/profiles/${id}`,
    SET_DEFAULT: (id: string) => `/api/patient/profiles/${id}/set-default`,
    UPDATE_RELATIONSHIP: (id: string) => `/api/patient/profiles/${id}/relationship`,
    AVATAR_UPLOAD: (id: string) => `/api/patient/profiles/${id}/avatar`,
    AVATAR_DELETE: (id: string) => `/api/patient/profiles/${id}/avatar`,
};

export const PATIENT_ENDPOINTS = {
    LIST: '/api/patients',
    DETAIL: (id: string) => `/api/patients/${id}`,
    CREATE: '/api/patients',
    UPDATE: (id: string) => `/api/patients/${id}`,
    STATUS: (id: string) => `/api/patients/${id}/status`,
    LINK: '/api/patients/link',
    LINK_ACCOUNT: (id: string) => `/api/patients/${id}/link-account`,
    UNLINK_ACCOUNT: (id: string) => `/api/patients/${id}/unlink-account`,
    BY_ACCOUNT: (accountId: string) => `/api/patients/account/${accountId}`,
    UPDATE_CONTACT: (patientId: string) => `/api/patients/${patientId}/contact`,
    ADD_CONTACT: (patientId: string) => `/api/patients/${patientId}/contacts`,
    EDIT_CONTACT: (patientId: string, contactId: string) => `/api/patients/${patientId}/contacts/${contactId}`,
    DELETE_CONTACT: (patientId: string, contactId: string) => `/api/patients/${patientId}/contacts/${contactId}`,
    ADD_RELATION: (patientId: string) => `/api/patients/${patientId}/relations`,
    EDIT_RELATION: (patientId: string, relationId: string) => `/api/patients/${patientId}/relations/${relationId}`,
    DELETE_RELATION: (patientId: string, relationId: string) => `/api/patients/${patientId}/relations/${relationId}`,
    MEDICAL_RECORDS: (patientId: string) => `/api/patients/${patientId}/medical-records`,
    PRESCRIPTIONS: (patientId: string) => `/api/patients/${patientId}/prescriptions`,
    AUDIT_LOGS: (patientId: string) => `/api/patients/${patientId}/audit-logs`,
};

export const APPOINTMENT_ENDPOINTS = {
    LIST: '/api/appointments',
    DETAIL: (id: string) => `/api/appointments/${id}`,
    CREATE: '/api/appointments',
    UPDATE: (id: string) => `/api/appointments/${id}`,
    CANCEL: (id: string) => `/api/appointments/${id}`,
    CONFIRM: (id: string) => `/api/appointment-confirmations/${id}/confirm`,
    GENERATE_QR: (id: string) => `/api/appointment-status/generate-qr/${id}`,
    MY_APPOINTMENTS: '/api/appointments/my-appointments',
    AVAILABLE_SLOTS: '/api/appointments/available-slots',
    AVAILABLE_SLOTS_BY_DEPARTMENT: '/api/appointments/available-slots-by-department',
    BY_DOCTOR: (doctorId: string) => `/api/appointments/doctor/${doctorId}`,
    BY_PATIENT: (patientId: string) => `/api/appointments/patient/${patientId}`,
};

export const DEPARTMENT_ENDPOINTS = {
    LIST: '/api/departments',
    DETAIL: (id: string) => `/api/departments/${id}`,
    CREATE: '/api/departments',
    UPDATE: (id: string) => `/api/departments/${id}`,
    DELETE: (id: string) => `/api/departments/${id}`,
};

// ✅ Corrected từ Swagger thực tế
export const PRESCRIPTION_ENDPOINTS = {
    // Lấy đơn thuốc theo encounter (phiên khám)
    BY_ENCOUNTER: (encounterId: string) => `/api/prescriptions/${encounterId}`,
    SUMMARY: (encounterId: string) => `/api/prescriptions/${encounterId}/summary`,
    BY_DOCTOR: (doctorId: string) => `/api/prescriptions/by-doctor/${doctorId}`,
    BY_PATIENT: (patientId: string) => `/api/prescriptions/by-patient/${patientId}`,
    SEARCH: '/api/prescriptions/search',
    SEARCH_DRUGS: '/api/prescriptions/search-drugs',
    DETAILS: (prescriptionId: string) => `/api/prescriptions/${prescriptionId}/details`,
    UPDATE: (prescriptionId: string) => `/api/prescriptions/${prescriptionId}/update`,
    CANCEL: (prescriptionId: string) => `/api/prescriptions/${prescriptionId}/cancel`,
    CONFIRM: (prescriptionId: string) => `/api/prescriptions/${prescriptionId}/confirm`,
    // Backward compat — các endpoint cũ giữ lại
    LIST: '/api/prescriptions/by-doctor',
    CREATE: '/api/prescriptions',
    DETAIL: (id: string) => `/api/prescriptions/${id}`,
    DISPENSE: (id: string) => `/api/dispensing/${id}`,  // ✅ FIX: dùng /api/dispensing
};

// ✅ Corrected: /api/schedules không tồn tại — dùng /api/staff-schedules
export const SCHEDULE_ENDPOINTS = {
    LIST: '/api/staff-schedules',
    CREATE: '/api/staff-schedules',
    UPDATE: (id: string) => `/api/staff-schedules/${id}`,
    DELETE: (id: string) => `/api/staff-schedules/${id}`,
    BY_STAFF: (staffId: string) => `/api/staff-schedules/staff/${staffId}`,
    BY_DATE: (date: string) => `/api/staff-schedules/date/${date}`,
    CALENDAR: '/api/staff-schedules/calendar',
    SUSPEND: (id: string) => `/api/staff-schedules/${id}/suspend`,
    RESUME: (id: string) => `/api/staff-schedules/${id}/resume`,
    // Backward compat
    BY_DOCTOR: (doctorId: string) => `/api/staff-schedules/staff/${doctorId}`,
};

export const REPORT_ENDPOINTS = {
    DASHBOARD: '/api/reports/dashboard', // GET
    REVENUE: '/api/reports/revenue', // GET
    PATIENTS: '/api/reports/patients', // QC_SKIP: backend currently exposes dashboard and revenue only
    APPOINTMENTS: '/api/reports/appointments', // QC_SKIP: backend currently exposes dashboard and revenue only
    EXPORT_EXCEL: '/api/reports/export/excel', // QC_SKIP: backend currently exposes dashboard and revenue only
    EXPORT_PDF: '/api/reports/export/pdf', // QC_SKIP: backend currently exposes dashboard and revenue only
};

// ✅ Corrected: /api/emr không tồn tại — dùng /api/encounters + /api/medical-records
export const EMR_ENDPOINTS = {
    // Encounter (phiên khám)
    LIST: '/api/encounters',
    DETAIL: (id: string) => `/api/encounters/${id}`,
    CREATE: '/api/encounters',
    UPDATE: (id: string) => `/api/encounters/${id}`,
    BY_PATIENT: (patientId: string) => `/api/encounters/by-patient/${patientId}`,
    BY_APPOINTMENT: (appointmentId: string) => `/api/encounters/by-appointment/${appointmentId}`,
    STATUS: (id: string) => `/api/encounters/${id}/status`,
    // Medical records
    SIGN: (encounterId: string) => `/api/medical-records/${encounterId}/sign`,
    LOCK: (encounterId: string) => `/api/medical-records/${encounterId}/finalize`,
    SAVE_DRAFT: (encounterId: string) => `/api/medical-records/${encounterId}`,
    // Clinical examination (vitals, diagnosis)
    VITAL_SIGNS: (encounterId: string) => `/api/clinical-examinations/${encounterId}/vitals`,
    DIAGNOSES: (encounterId: string) => `/api/diagnoses/${encounterId}`,
    FINALIZE: (encounterId: string) => `/api/clinical-examinations/${encounterId}/finalize`,
};

export const DOCUMENT_ENDPOINTS = {
    LIST: (patientId: string) => `/api/patients/${patientId}/documents`,
    UPLOAD: (patientId: string) => `/api/patients/${patientId}/documents`,
    DETAIL: (patientId: string, docId: string) => `/api/patients/${patientId}/documents/${docId}`,
    DELETE: (patientId: string, docId: string) => `/api/patients/${patientId}/documents/${docId}`,
    VERSIONS: (patientId: string, docId: string) => `/api/patients/${patientId}/documents/${docId}/versions`,
};

// ✅ Corrected: PAY sử dụng /api/billing/payments, không phải /api/billing/invoices/{id}/pay
export const BILLING_ENDPOINTS = {
    // Invoices
    LIST: '/api/billing/invoices',
    DETAIL: (id: string) => `/api/billing/invoices/${id}`,
    CREATE: '/api/billing/invoices',
    BY_PATIENT: (patientId: string) => `/api/billing/invoices/by-patient/${patientId}`,
    BY_ENCOUNTER: (encounterId: string) => `/api/billing/invoices/by-encounter/${encounterId}`,
    GENERATE: (encounterId: string) => `/api/billing/invoices/generate/${encounterId}`,
    CANCEL: (id: string) => `/api/billing/invoices/${id}/cancel`,
    ITEMS: (id: string) => `/api/billing/invoices/${id}/items`,
    // Payments ✅ FIX
    PAY: '/api/billing/offline/pay',
    PAY_ONLINE: '/api/billing/payments',
    PAYMENTS: '/api/billing/payments',
    PAYMENT_DETAIL: (id: string) => `/api/billing/payments/${id}`,
    REFUND: (id: string) => `/api/billing/payments/${id}/refund`,
    // Transactions
    TRANSACTIONS: '/api/billing/offline/transactions',
    // Reconciliation
    RECONCILIATION: '/api/billing/reconciliation/sessions',
};

export const AI_ENDPOINTS = {
    CHAT: '/api/ai/chat', // QC_SKIP: generic AI endpoints are not part of the current backend deployment
    SYMPTOM_CHECK: '/api/ai/symptom-check', // QC_SKIP: generic AI endpoints are not part of the current backend deployment
    SUGGEST_APPOINTMENT: '/api/ai/suggest-appointment', // QC_SKIP: generic AI endpoints are not part of the current backend deployment
    SUMMARIZE_RECORD: (recordId: string) => `/api/ai/summarize/${recordId}`, // QC_SKIP: generic AI endpoints are not part of the current backend deployment
    ANALYZE: '/api/ai/analyze', // QC_SKIP: generic AI endpoints are not part of the current backend deployment
    LOGS: '/api/ai/logs', // QC_SKIP: generic AI endpoints are not part of the current backend deployment
    PREFERENCES: (doctorId: string) => `/api/ai/preferences/${doctorId}`, // QC_SKIP: generic AI endpoints are not part of the current backend deployment
};

// ✅ Corrected: /api/telemedicine không tồn tại — dùng /api/teleconsultation
export const TELEMEDICINE_ENDPOINTS = {
    // Booking
    LIST: '/api/teleconsultation/booking/my-bookings',
    BOOK: '/api/teleconsultation/booking',
    DETAIL: (id: string) => `/api/teleconsultation/booking/${id}`,
    CANCEL: (id: string) => `/api/teleconsultation/booking/${id}/cancel`,
    CONFIRM: (id: string) => `/api/teleconsultation/booking/${id}/confirm`,
    DOCTORS: '/api/teleconsultation/booking/doctors',
    SLOTS: '/api/teleconsultation/booking/slots',
    // Room
    ROOM: (id: string) => `/api/teleconsultation/room/${id}`,
    JOIN: (id: string) => `/api/teleconsultation/room/${id}/join`,
    LEAVE: (id: string) => `/api/teleconsultation/room/${id}/leave`,
    CLOSE_ROOM: (id: string) => `/api/teleconsultation/room/${id}/close`,
    ROOM_MESSAGES: (id: string) => `/api/teleconsultation/room/${id}/messages`,
    // Backward compat aliases
    CREATE: '/api/teleconsultation/booking',
    START: (id: string) => `/api/teleconsultation/room/${id}/join`,
    END: (id: string) => `/api/teleconsultation/room/${id}/leave`,
    CHAT: (id: string) => `/api/teleconsultation/room/${id}/messages`,
    SHARE_DOCUMENT: (id: string) => `/api/teleconsultation/room/${id}/files`,
    // Stats
    STATS: '/api/teleconsultation/stats',
    TYPES: '/api/teleconsultation/types',
};

// ✅ Corrected: /api/ehr/{patientId}/... → /api/ehr/patients/{patientId}/...
export const EHR_ENDPOINTS = {
    SUMMARY: (patientId: string) => `/api/ehr/patients/${patientId}/health-summary`,
    VITAL_HISTORY: (patientId: string) => `/api/ehr/patients/${patientId}/vitals`,
    VITALS_LATEST: (patientId: string) => `/api/ehr/patients/${patientId}/vitals/latest`,
    VITALS_TRENDS: (patientId: string) => `/api/ehr/patients/${patientId}/vitals/trends`,
    TREATMENT_HISTORY: (patientId: string) => `/api/ehr/patients/${patientId}/treatment-records`,
    TIMELINE: (patientId: string) => `/api/ehr/patients/${patientId}/timeline`,
    MEDICAL_HISTORY: (patientId: string) => `/api/ehr/patients/${patientId}/medical-histories`,
    ALLERGIES: (patientId: string) => `/api/ehr/patients/${patientId}/allergies`,
    CURRENT_MEDICATIONS: (patientId: string) => `/api/ehr/patients/${patientId}/current-medications`,
    DIAGNOSIS_HISTORY: (patientId: string) => `/api/ehr/patients/${patientId}/diagnosis-history`,
    PROFILE: (patientId: string) => `/api/ehr/patients/${patientId}/profile`,
    RISK_FACTORS: (patientId: string) => `/api/ehr/patients/${patientId}/risk-factors`,
    NOTES: (patientId: string) => `/api/ehr/patients/${patientId}/notes`,
    // Aliases (POST endpoints — dùng chung path với GET)
    ADD_HEALTH_METRIC: (patientId: string) => `/api/ehr/patients/${patientId}/health-metrics`,
    ADD_ALLERGY: (patientId: string) => `/api/ehr/patients/${patientId}/allergies`,
    ADD_MEDICAL_HISTORY: (patientId: string) => `/api/ehr/patients/${patientId}/medical-histories`,
};

// ============================================
// Encounter (Phiên khám bệnh)
// ✅ Swagger: /api/encounters/*
// ============================================
export const ENCOUNTER_ENDPOINTS = {
    LIST: '/api/encounters',
    ACTIVE: '/api/encounters/active',
    DETAIL: (id: string) => `/api/encounters/${id}`,
    CREATE: '/api/encounters',
    CREATE_FROM_APPOINTMENT: (appointmentId: string) => `/api/encounters/from-appointment/${appointmentId}`,
    BY_APPOINTMENT: (appointmentId: string) => `/api/encounters/by-appointment/${appointmentId}`,
    BY_PATIENT: (patientId: string) => `/api/encounters/by-patient/${patientId}`,
    STATUS: (id: string) => `/api/encounters/${id}/status`,
    ASSIGN_DOCTOR: (id: string) => `/api/encounters/${id}/assign-doctor`,
    ASSIGN_ROOM: (id: string) => `/api/encounters/${id}/assign-room`,
};

// ============================================
// Clinical Examination (Khám lâm sàng)
// ✅ Swagger: /api/clinical-examinations/*
// ============================================
export const CLINICAL_EXAM_ENDPOINTS = {
    BY_PATIENT: (patientId: string) => `/api/clinical-examinations/by-patient/${patientId}`,
    DETAIL: (encounterId: string) => `/api/clinical-examinations/${encounterId}`,
    VITALS: (encounterId: string) => `/api/clinical-examinations/${encounterId}/vitals`,
    SUMMARY: (encounterId: string) => `/api/clinical-examinations/${encounterId}/summary`,
    FINALIZE: (encounterId: string) => `/api/clinical-examinations/${encounterId}/finalize`,
};

// ============================================
// Diagnoses (Chẩn đoán)
// ✅ Swagger: /api/diagnoses/*
// ============================================
export const DIAGNOSIS_ENDPOINTS = {
    BY_ENCOUNTER: (encounterId: string) => `/api/diagnoses/${encounterId}`,
    BY_PATIENT: (patientId: string) => `/api/diagnoses/by-patient/${patientId}`,
    DETAIL: (diagnosisId: string) => `/api/diagnoses/${diagnosisId}`,
    UPDATE_TYPE: (diagnosisId: string) => `/api/diagnoses/${diagnosisId}/type`,
    CONCLUSION: (encounterId: string) => `/api/diagnoses/${encounterId}/conclusion`,
    SEARCH_ICD: '/api/diagnoses/search-icd',
};

// ============================================
// Medical Orders (Chỉ định xét nghiệm/dịch vụ)
// ✅ Swagger: /api/medical-orders/*
// ============================================
export const MEDICAL_ORDER_ENDPOINTS = {
    BY_ENCOUNTER: (encounterId: string) => `/api/medical-orders/${encounterId}`,
    BY_PATIENT: (patientId: string) => `/api/medical-orders/by-patient/${patientId}`,
    PENDING: '/api/medical-orders/pending',
    DETAIL: (orderId: string) => `/api/medical-orders/detail/${orderId}`,
    SUMMARY: (encounterId: string) => `/api/medical-orders/${encounterId}/summary`,
    UPDATE: (orderId: string) => `/api/medical-orders/${orderId}`,
    CANCEL: (orderId: string) => `/api/medical-orders/${orderId}/cancel`,
    START: (orderId: string) => `/api/medical-orders/${orderId}/start`,
    RESULT: (orderId: string) => `/api/medical-orders/${orderId}/result`,
    SEARCH_SERVICES: '/api/medical-orders/search-services',
};

// ============================================
// Medical Records (Hồ sơ bệnh án)
// ✅ Swagger: /api/medical-records/*
// ============================================
export const MEDICAL_RECORD_ENDPOINTS = {
    BY_PATIENT: (patientId: string) => `/api/medical-records/by-patient/${patientId}`,
    TIMELINE: (patientId: string) => `/api/medical-records/by-patient/${patientId}/timeline`,
    STATS: (patientId: string) => `/api/medical-records/by-patient/${patientId}/statistics`,
    DETAIL: (encounterId: string) => `/api/medical-records/${encounterId}`,
    SNAPSHOT: (encounterId: string) => `/api/medical-records/snapshot/${encounterId}`,
    FINALIZE: (encounterId: string) => `/api/medical-records/${encounterId}/finalize`,
    SIGN: (encounterId: string) => `/api/medical-records/${encounterId}/sign`,
    EXPORT: (encounterId: string) => `/api/medical-records/export/${encounterId}`,
    COMPLETENESS: (encounterId: string) => `/api/medical-records/${encounterId}/completeness`,
    SEARCH: '/api/medical-records/search',
};

// ============================================
// Dispensing (Cấp phát thuốc)
// ✅ Swagger: /api/dispensing/*
// ============================================
export const DISPENSING_ENDPOINTS = {
    DISPENSE: (prescriptionId: string) => `/api/dispensing/${prescriptionId}`,
    CANCEL: (dispenseOrderId: string) => `/api/dispensing/${dispenseOrderId}/cancel`,
    HISTORY: '/api/dispensing/history',
    BY_PHARMACIST: (pharmacistId: string) => `/api/dispensing/by-pharmacist/${pharmacistId}`,
    INVENTORY_CHECK: (drugId: string) => `/api/dispensing/inventory/${drugId}/check`,
    INVENTORY: (drugId: string) => `/api/dispensing/inventory/${drugId}`,
};

// ============================================
// Inventory (Tồn kho dược)
// ✅ Swagger: /api/inventory/*
// ============================================
export const INVENTORY_ENDPOINTS = {
    LIST: '/api/inventory',
    DETAIL: (batchId: string) => `/api/inventory/${batchId}`,
    LOW_STOCK: '/api/inventory/alerts/low-stock',
    EXPIRING: '/api/inventory/alerts/expiring',
};

// ============================================
// Stock In / Stock Out (Nhập/Xuất kho)
// ✅ Swagger: /api/stock-in/* /api/stock-out/*
// ============================================
export const STOCK_IN_ENDPOINTS = {
    LIST: '/api/stock-in',
    DETAIL: (orderId: string) => `/api/stock-in/${orderId}`,
    CONFIRM: (orderId: string) => `/api/stock-in/${orderId}/confirm`,
    RECEIVE: (orderId: string) => `/api/stock-in/${orderId}/receive`,
    CANCEL: (orderId: string) => `/api/stock-in/${orderId}/cancel`,
    ITEMS: (orderId: string) => `/api/stock-in/${orderId}/items`,
};

export const STOCK_OUT_ENDPOINTS = {
    LIST: '/api/stock-out',
    DETAIL: (orderId: string) => `/api/stock-out/${orderId}`,
    CONFIRM: (orderId: string) => `/api/stock-out/${orderId}/confirm`,
    CANCEL: (orderId: string) => `/api/stock-out/${orderId}/cancel`,
    ITEMS: (orderId: string) => `/api/stock-out/${orderId}/items`,
};

// ============================================
// Appointment Status / Queue (Hàng đợi khám)
// ✅ Swagger: /api/appointment-status/*
// ============================================
export const APPOINTMENT_STATUS_ENDPOINTS = {
    QUEUE_TODAY: '/api/appointment-status/queue/today',
    DASHBOARD_TODAY: '/api/appointment-status/dashboard/today',
    DASHBOARD_DATE: (date: string) => `/api/appointment-status/dashboard/${date}`,
    ROOM_STATUS: '/api/appointment-status/room-status',
    SETTINGS: '/api/appointment-status/settings',
    CHECK_IN: (id: string) => `/api/appointment-status/${id}/check-in`,
    START_EXAM: (id: string) => `/api/appointment-status/${id}/start-exam`,
    COMPLETE_EXAM: (id: string) => `/api/appointment-status/${id}/complete-exam`,
    NO_SHOW: (id: string) => `/api/appointment-status/${id}/no-show`,
    SKIP: (id: string) => `/api/appointment-status/${id}/skip`,
    RECALL: (id: string) => `/api/appointment-status/${id}/recall`,
    GENERATE_QR: (id: string) => `/api/appointment-status/generate-qr/${id}`,
    CHECK_IN_QR: '/api/appointment-status/check-in-qr',
};

// ============================================
// Appointment Confirmations (Xác nhận lịch hẹn)
// ✅ Swagger: /api/appointment-confirmations/*
// ============================================
export const APPOINTMENT_CONFIRMATION_ENDPOINTS = {
    CONFIRM: (id: string) => `/api/appointment-confirmations/${id}/confirm`,
    CHECK_IN: (id: string) => `/api/appointment-confirmations/${id}/check-in`,
    SEND_REMINDER: (id: string) => `/api/appointment-confirmations/${id}/send-reminder`,
    RESEND: (id: string) => `/api/appointment-confirmations/${id}/resend`,
    BATCH_CONFIRM: '/api/appointment-confirmations/batch-confirm',
    BATCH_REMINDER: '/api/appointment-confirmations/batch-send-reminder',
    REMINDER_SETTINGS: '/api/appointment-confirmations/reminder-settings',
};

// ============================================
// Branches (Chi nhánh)
// ✅ Swagger: /api/branches/*
// ============================================
export const BRANCH_ENDPOINTS = {
    LIST: '/api/branches',
    DROPDOWN: '/api/branches/dropdown',
    DETAIL: (id: string) => `/api/branches/${id}`,
    STATUS: (id: string) => `/api/branches/${id}/status`,
};

// ============================================
// Medical Rooms (Phòng khám)
// ✅ Swagger: /api/medical-rooms/*
// ============================================
export const MEDICAL_ROOM_ENDPOINTS = {
    LIST: '/api/medical-rooms',
    DROPDOWN: '/api/medical-rooms/dropdown',
    DETAIL: (id: string) => `/api/medical-rooms/${id}`,
    STATUS: (id: string) => `/api/medical-rooms/${id}/status`,
    SERVICES: (roomId: string) => `/api/medical-rooms/${roomId}/services`,
};

// ============================================
// Patient Insurance (Bảo hiểm bệnh nhân)
// ✅ Swagger: /api/patient-insurances/*
// ============================================
export const PATIENT_INSURANCE_ENDPOINTS = {
    LIST: '/api/patient-insurances',
    ACTIVE: '/api/patient-insurances/active',
    DETAIL: (id: string) => `/api/patient-insurances/${id}`,
    HISTORY: (id: string) => `/api/patient-insurances/${id}/history`,
};

// ============================================
// Leaves (Nghỉ phép nhân sự)
// ✅ Swagger: /api/leaves/*
// ============================================
export const LEAVE_ENDPOINTS = {
    LIST: '/api/leaves',
    DETAIL: (id: string) => `/api/leaves/${id}`,
    APPROVE: (id: string) => `/api/leaves/${id}/approve`,
    REJECT: (id: string) => `/api/leaves/${id}/reject`,
};

// ============================================
// Warehouses + Suppliers (Kho + Nhà cung cấp)
// ✅ Swagger: /api/warehouses/* /api/suppliers/*
// ============================================
export const WAREHOUSE_ENDPOINTS = {
    LIST: '/api/warehouses',
    DETAIL: (id: string) => `/api/warehouses/${id}`,
    TOGGLE: (id: string) => `/api/warehouses/${id}/toggle`,
};

export const SUPPLIER_ENDPOINTS = {
    LIST: '/api/suppliers',
    DETAIL: (id: string) => `/api/suppliers/${id}`,
};

// ============================================
// Treatment Plans (Kế hoạch điều trị)
// ✅ Swagger: /api/treatment-plans/*
// ============================================
export const TREATMENT_PLAN_ENDPOINTS = {
    LIST: '/api/treatment-plans', // QC_SKIP: backend does not expose an aggregate GET /api/treatment-plans endpoint
    BY_PATIENT: (patientId: string) => `/api/treatment-plans/by-patient/${patientId}`,
    DETAIL: (planId: string) => `/api/treatment-plans/${planId}`,
    STATUS: (planId: string) => `/api/treatment-plans/${planId}/status`,
    SUMMARY: (planId: string) => `/api/treatment-plans/${planId}/summary`,
};

// ============================================
// Sign Off (Ký duyệt hồ sơ)
// ✅ Swagger: /api/sign-off/*
// ============================================
export const SIGN_OFF_ENDPOINTS = {
    PENDING: '/api/sign-off/by-doctor/pending',
    DRAFT_SIGN: (encounterId: string) => `/api/sign-off/${encounterId}/draft-sign`,
    OFFICIAL_SIGN: (encounterId: string) => `/api/sign-off/${encounterId}/official-sign`,
    COMPLETE: (encounterId: string) => `/api/sign-off/${encounterId}/complete`,
    REVOKE: (encounterId: string) => `/api/sign-off/${encounterId}/revoke`,
    VERIFY: (encounterId: string) => `/api/sign-off/${encounterId}/verify`,
    SIGNATURES: (encounterId: string) => `/api/sign-off/${encounterId}/signatures`,
    AUDIT_LOG: (encounterId: string) => `/api/sign-off/${encounterId}/audit-log`,
    LOCK_STATUS: (encounterId: string) => `/api/sign-off/${encounterId}/lock-status`, // GET: trạng thái khóa
};

// ============================================
// USER NOTIFICATION Endpoints (Hộp thư thông báo người dùng)
// ✅ Swagger: /api/notifications/inbox/*
// ============================================
export const USER_NOTIFICATION_ENDPOINTS = {
    INBOX: '/api/notifications/inbox',                                                   // GET: danh sách thông báo
    MARK_READ: (id: string) => `/api/notifications/inbox/${id}/read`,                    // PUT: đánh dấu đã đọc
    MARK_ALL_READ: '/api/notifications/inbox/read-all',                                  // PUT: đánh dấu tất cả đã đọc
    ADMIN_BROADCAST: '/api/notifications/inbox/admin-broadcast',                         // POST: gửi broadcast thủ công
};

// ============================================
// Patient Management — BỔ SUNG CÁC ENDPOINT THIẾU
// ============================================

// Bổ sung PATIENT_ENDPOINTS với các method còn thiếu
// (Giữ const gốc, thêm const mới để không break)
export const PATIENT_ENDPOINTS_EXT = {
    // Từ patient.routes.ts mounted tại /api/patients
    WITH_INSURANCE: '/api/patients/with-insurance',                                    // GET
    WITHOUT_INSURANCE: '/api/patients/without-insurance',                              // GET
    FILTER_BY_TAGS: '/api/patients/filter-by-tags',                                   // GET
    ACCOUNT: (accountId: string) => `/api/patients/account/${accountId}`,              // GET
    SEARCH: '/api/patients/search',                                                    // GET: tìm kiếm nâng cao
    QUICK_SEARCH: '/api/patients/quick-search',                                        // GET: tìm nhanh
    SUMMARY: (id: string) => `/api/patients/${id}/summary`,                            // GET
    EMERGENCY_CONTACTS: (patientId: string) => `/api/patients/${patientId}/emergency-contacts`, // GET
    LEGAL_REPRESENTATIVE: (patientId: string) => `/api/patients/${patientId}/legal-representative`, // GET
    ALL_RELATIONS: (patientId: string) => `/api/patients/${patientId}/relations`,      // GET
    RELATIVES: (patientId: string) => `/api/patients/${patientId}/relatives`,          // GET
    GUARDIANS: (patientId: string) => `/api/patients/${patientId}/guardians`,          // GET
    AUDIT_LOGS: (id: string) => `/api/patients/${id}/audit-logs`,                      // GET
    INSURANCES: (patientId: string) => `/api/patients/${patientId}/insurances`,        // GET
    ADD_INSURANCE: (patientId: string) => `/api/patients/${patientId}/insurances`,     // POST
    DELETE: (id: string) => `/api/patients/${id}`,                                     // DELETE
    LINK_ACCOUNT: (id: string) => `/api/patients/${id}/link-account`,                  // PATCH
    UNLINK_ACCOUNT: (id: string) => `/api/patients/${id}/unlink-account`,              // PATCH
    INSURANCE_STATUS: (id: string) => `/api/patients/${id}/insurance-status`,          // PATCH
    PATIENT_TAGS: (patientId: string) => `/api/patients/${patientId}/tags`,            // GET
    ASSIGN_TAG: (patientId: string) => `/api/patients/${patientId}/tags`,              // POST
    REMOVE_TAG: (patientId: string, tagId: string) => `/api/patients/${patientId}/tags/${tagId}`, // DELETE
    PATIENT_APPOINTMENTS: (patientId: string) => `/api/patients/${patientId}/appointments`, // GET
    CREATE_APPOINTMENT: (patientId: string) => `/api/patients/${patientId}/appointments`, // POST
    PATIENT_DOCUMENTS: (patientId: string) => `/api/patients/${patientId}/documents`,   // GET
    UPLOAD_DOCUMENT: (patientId: string) => `/api/patients/${patientId}/documents`,     // POST
};

// ============================================
// 2.4.1 Patient Contact (Người thân bệnh nhân)
// ✅ Swagger: /api/patient-relations/*
// ============================================
export const PATIENT_CONTACT_ENDPOINTS = {
    LIST: '/api/patient-relations',                                                          // GET
    CREATE: '/api/patient-relations',                                                        // POST
    DETAIL: (id: string) => `/api/patient-relations/${id}`,                                  // GET
    UPDATE: (id: string) => `/api/patient-relations/${id}`,                                  // PUT
    DELETE: (id: string) => `/api/patient-relations/${id}`,                                  // DELETE
    SET_EMERGENCY: (id: string) => `/api/patient-relations/${id}/set-emergency`,             // PATCH
    SET_LEGAL_REPRESENTATIVE: (id: string) => `/api/patient-relations/${id}/set-legal-representative`, // PATCH
    MEDICAL_DECISION_NOTE: (id: string) => `/api/patient-relations/${id}/medical-decision-note`, // GET/PATCH
};

// ============================================
// 2.5 Patient Document (Tài liệu bệnh nhân)
// ✅ Swagger: /api/patient-documents/*
// ============================================
export const PATIENT_DOCUMENT_ENDPOINTS = {
    LIST: (patientId: string) => `/api/patient-documents?patient_id=${patientId}`,              // GET
    UPLOAD: '/api/patient-documents',                                                           // POST (multipart)
    DETAIL: (id: string) => `/api/patient-documents/${id}`,                                     // GET
    UPDATE: (id: string) => `/api/patient-documents/${id}`,                                     // PUT
    DELETE: (id: string) => `/api/patient-documents/${id}`,                                     // DELETE
    UPLOAD_VERSION: (id: string) => `/api/patient-documents/${id}/versions`,                    // POST
    LIST_VERSIONS: (id: string) => `/api/patient-documents/${id}/versions`,                     // GET
    GET_VERSION: (id: string, versionId: string) => `/api/patient-documents/${id}/versions/${versionId}`, // GET
    VIEW: (id: string) => `/api/patient-documents/${id}/view`,                                  // GET: xem file
    DOWNLOAD: (id: string) => `/api/patient-documents/${id}/download`,                          // GET: tải file
};

// ============================================
// 2.6 Patient Tag (Nhãn bệnh nhân)
// ✅ Swagger: /api/patient-tags/*
// ============================================
export const PATIENT_TAG_ENDPOINTS = {
    LIST: '/api/patient-tags',                                          // GET
    CREATE: '/api/patient-tags',                                        // POST
    DETAIL: (id: string) => `/api/patient-tags/${id}`,                  // GET
    UPDATE: (id: string) => `/api/patient-tags/${id}`,                  // PUT
    DELETE: (id: string) => `/api/patient-tags/${id}`,                  // DELETE
};

// ============================================
// 2.2 Medical History — Patient Management
// ✅ Swagger: /api/medical-history/*
// ============================================
export const MEDICAL_HISTORY_ENDPOINTS = {
    LIST: '/api/medical-history',                                                              // GET: danh sách encounter
    PATIENT_LATEST: (patientId: string) => `/api/medical-history/patient/${patientId}/latest`, // GET
    PATIENT_TIMELINE: (patientId: string) => `/api/medical-history/patient/${patientId}/timeline`, // GET
    PATIENT_SUMMARY: (patientId: string) => `/api/medical-history/patient/${patientId}/summary`, // GET
    MY_HISTORY: '/api/medical-history/my-history',                                             // GET: lịch sử của tôi
    ENCOUNTER_DETAIL: (encounterId: string) => `/api/medical-history/${encounterId}`,          // GET
};

// ============================================
// 2.3 Insurance Provider (Nhà cung cấp bảo hiểm)
// ✅ Swagger: /api/insurance-providers/*
// ============================================
export const INSURANCE_PROVIDER_ENDPOINTS = {
    LIST: '/api/insurance-providers',                                               // GET
    CREATE: '/api/insurance-providers',                                             // POST
    DETAIL: (id: string) => `/api/insurance-providers/${id}`,                       // GET
    UPDATE: (id: string) => `/api/insurance-providers/${id}`,                       // PUT
    DELETE: (id: string) => `/api/insurance-providers/${id}`,                       // DELETE
};

// ============================================
// 2.3 Insurance Coverage (Phạm vi bảo hiểm)
// ✅ Swagger: /api/insurance-coverage/*
// ============================================
export const INSURANCE_COVERAGE_ENDPOINTS = {
    LIST: '/api/insurance-coverage',                                                // GET
    CREATE: '/api/insurance-coverage',                                              // POST
    UPDATE: (id: string) => `/api/insurance-coverage/${id}`,                        // PUT
    DELETE: (id: string) => `/api/insurance-coverage/${id}`,                        // DELETE
};

// Bổ sung thêm method vào PATIENT_INSURANCE (bản gốc giữ nguyên)
export const PATIENT_INSURANCE_EXT_ENDPOINTS = {
    CREATE: '/api/patient-insurances',                                              // POST
    UPDATE: (id: string) => `/api/patient-insurances/${id}`,                        // PUT
    DELETE: (id: string) => `/api/patient-insurances/${id}`,                        // DELETE
    EXPIRED: '/api/patient-insurances/expired',                                     // GET: bảo hiểm hết hạn
};

// ============================================
// 2.4 Relation Type (Loại quan hệ)
// ✅ Swagger: /api/relation-types/*
// ============================================
export const RELATION_TYPE_ENDPOINTS = {
    LIST: '/api/relation-types',                                                    // GET
    CREATE: '/api/relation-types',                                                  // POST
    UPDATE: (id: string) => `/api/relation-types/${id}`,                            // PUT
    DELETE: (id: string) => `/api/relation-types/${id}`,                            // DELETE
};

// ============================================
// 2.5 Document Type (Loại tài liệu)
// ✅ Swagger: /api/document-types/*
// ============================================
export const DOCUMENT_TYPE_ENDPOINTS = {
    LIST: '/api/document-types',                                                    // GET
    CREATE: '/api/document-types',                                                  // POST
    UPDATE: (id: string) => `/api/document-types/${id}`,                            // PUT
    DELETE: (id: string) => `/api/document-types/${id}`,                            // DELETE
};

// ============================================
// 2.6.5 Patient Classification Rule (Quy tắc phân loại)
// ✅ Swagger: /api/patient-classification-rules/*
// ============================================
export const PATIENT_CLASSIFICATION_RULE_ENDPOINTS = {
    LIST: '/api/patient-classification-rules',                                      // GET
    CREATE: '/api/patient-classification-rules',                                    // POST
    DETAIL: (id: string) => `/api/patient-classification-rules/${id}`,              // GET
    UPDATE: (id: string) => `/api/patient-classification-rules/${id}`,              // PUT
    DELETE: (id: string) => `/api/patient-classification-rules/${id}`,              // DELETE
};

// ============================================
// Appointment Management — BỔ SUNG CÁC ENDPOINT THIẾU
// ============================================

// ============================================
// 3.9 Appointment Coordination (Điều phối lịch khám)
// ✅ Swagger: /api/appointment-coordination/*
// ============================================
export const APPOINTMENT_COORDINATION_ENDPOINTS = {
    DOCTOR_LOAD: '/api/appointment-coordination/doctor-load',                       // GET: phân tích tải bác sĩ
    SUGGEST_SLOTS: '/api/appointment-coordination/suggest-slots',                   // GET: gợi ý slot tốt nhất
    BALANCE_OVERVIEW: '/api/appointment-coordination/balance-overview',             // GET: tổng quan cân bằng
    AUTO_ASSIGN: '/api/appointment-coordination/auto-assign',                       // POST: tự động phân công
    AI_DATASET: '/api/appointment-coordination/ai-dataset',                         // GET: dataset cho AI
    PRIORITY: (appointmentId: string) => `/api/appointment-coordination/${appointmentId}/priority`, // PATCH
    REASSIGN_DOCTOR: (appointmentId: string) => `/api/appointment-coordination/${appointmentId}/reassign-doctor`, // PATCH
};

// ============================================
// 3.3 Doctor Availability (Lịch làm việc bác sĩ)
// ✅ Swagger: /api/doctor-availability/*
// ============================================
export const DOCTOR_AVAILABILITY_ENDPOINTS = {
    BY_SPECIALTY: (specialtyId: string) => `/api/doctor-availability/by-specialty/${specialtyId}`, // GET
    BY_DATE: (date: string) => `/api/doctor-availability/by-date/${date}`,          // GET
    DOCTOR: (doctorId: string) => `/api/doctor-availability/${doctorId}`,           // GET
    CONFLICTS: (doctorId: string) => `/api/doctor-availability/${doctorId}/conflicts`, // GET
    FACILITIES: (doctorId: string) => `/api/doctor-availability/${doctorId}/facilities`, // GET
};

// ============================================
// 3.3 Doctor Absence (Lịch vắng bác sĩ)
// ✅ Swagger: /api/doctor-absences/*
// ============================================
export const DOCTOR_ABSENCE_ENDPOINTS = {
    AFFECTED_APPOINTMENTS: '/api/doctor-absences/affected-appointments',            // GET
    LIST: '/api/doctor-absences',                                                   // GET
    CREATE: '/api/doctor-absences',                                                 // POST
    DETAIL: (absenceId: string) => `/api/doctor-absences/${absenceId}`,             // GET/PUT/DELETE
};

// ============================================
// 3.8 Appointment Change (Dời/Hủy lịch)
// ✅ Swagger: /api/appointment-changes/*
// ============================================
export const APPOINTMENT_CHANGE_ENDPOINTS = {
    STATS: '/api/appointment-changes/stats',                                                    // GET: thống kê
    RECENT: '/api/appointment-changes/recent',                                                  // GET: thay đổi gần đây
    HISTORY: (appointmentId: string) => `/api/appointment-changes/${appointmentId}/history`,    // GET
    CHECK_CANCEL_POLICY: (appointmentId: string) => `/api/appointment-changes/${appointmentId}/check-cancel-policy`, // GET
    CAN_RESCHEDULE: (appointmentId: string) => `/api/appointment-changes/${appointmentId}/can-reschedule`, // GET
};

// ============================================
// 3.2 Locked Slot (Slot bị khóa)
// ✅ Swagger: /api/locked-slots/*
// ============================================
export const LOCKED_SLOT_ENDPOINTS = {
    LOCK: '/api/locked-slots/lock',                                                 // POST: khóa slot
    LOCKED: '/api/locked-slots/locked',                                             // GET: danh sách slot bị khóa
    UNLOCK: (lockedSlotId: string) => `/api/locked-slots/lock/${lockedSlotId}`,     // DELETE: mở khóa
    LOCK_BY_SHIFT: '/api/locked-slots/lock-by-shift',                               // POST: khóa theo ca
    UNLOCK_BY_SHIFT: '/api/locked-slots/unlock-by-shift',                           // POST: mở khóa theo ca
};

// ============================================
// 3.2 Shift Service (Dịch vụ theo ca khám)
// ✅ Swagger: /api/shift-services/*
// ============================================
export const SHIFT_SERVICE_ENDPOINTS = {
    LIST: '/api/shift-services',                                                             // GET
    CREATE: '/api/shift-services',                                                           // POST
    BY_SHIFT: (shiftId: string) => `/api/shift-services/by-shift/${shiftId}`,               // GET
    BY_SERVICE: (facilityServiceId: string) => `/api/shift-services/by-service/${facilityServiceId}`, // GET
    DETAIL: (id: string) => `/api/shift-services/${id}`,                                     // GET/PUT/DELETE
    TOGGLE: (id: string) => `/api/shift-services/${id}/toggle`,                              // PATCH
};

// ============================================
// 3.2 Consultation Duration (Thời lượng khám)
// ✅ Swagger: /api/facilities/:facilityId/service-durations (mount vào /api/facilities)
// ============================================
export const CONSULTATION_DURATION_ENDPOINTS = {
    LIST: (facilityId: string) => `/api/facilities/${facilityId}/service-durations`,         // GET
    CREATE: (facilityId: string) => `/api/facilities/${facilityId}/service-durations`,       // POST
    UPDATE: (facilityId: string, serviceId: string) => `/api/facilities/${facilityId}/service-durations/${serviceId}`, // PUT
};

// ============================================
// EMR — BỔ SUNG CÁC ENDPOINT THIẾU
// ============================================

// ============================================
// 4.7 Treatment Progress (Tiến trình điều trị)
// ✅ Swagger: /api/treatment-plans/*
// ============================================
export const TREATMENT_PROGRESS_ENDPOINTS = {
    BY_PATIENT: (patientId: string) => `/api/treatment-plans/by-patient/${patientId}`,  // GET
    LIST: '/api/treatment-plans',                                                        // QC_SKIP: backend does not expose an aggregate GET /api/treatment-plans endpoint
    CREATE: '/api/treatment-plans',                                                      // POST
    DETAIL: (planId: string) => `/api/treatment-plans/${planId}`,                        // GET/PUT
    STATUS: (planId: string) => `/api/treatment-plans/${planId}/status`,                 // PATCH
    NOTES: (planId: string) => `/api/treatment-plans/${planId}/notes`,                   // GET/POST
    NOTE_DETAIL: (planId: string, noteId: string) => `/api/treatment-plans/${planId}/notes/${noteId}`, // GET/PUT
    FOLLOW_UPS: (planId: string) => `/api/treatment-plans/${planId}/follow-ups`,         // GET/POST
    FOLLOW_UP_CHAIN: (planId: string) => `/api/treatment-plans/${planId}/follow-up-chain`, // GET
    SUMMARY: (planId: string) => `/api/treatment-plans/${planId}/summary`,               // GET
};

// ============================================
// EHR — BỔ SUNG CÁC ENDPOINT THIẾU
// ============================================

// ============================================
// 6.1 Health Profile (Hồ sơ sức khỏe tổng hợp)
// ✅ Swagger: /api/ehr/patients/:patientId/*
// ============================================
export const HEALTH_PROFILE_ENDPOINTS = {
    PROFILE: (patientId: string) => `/api/ehr/patients/${patientId}/profile`,               // GET: hồ sơ sức khỏe
    HEALTH_SUMMARY: (patientId: string) => `/api/ehr/patients/${patientId}/health-summary`, // GET: tóm tắt sức khỏe
    LATEST_VITALS: (patientId: string) => `/api/ehr/patients/${patientId}/latest-vitals`,   // GET
    ACTIVE_CONDITIONS: (patientId: string) => `/api/ehr/patients/${patientId}/active-conditions`, // GET
    ALLERGY_LIST: (patientId: string) => `/api/ehr/patients/${patientId}/allergy-list`,     // GET
    CURRENT_MEDICATIONS: (patientId: string) => `/api/ehr/patients/${patientId}/current-medications`, // GET
    DIAGNOSIS_HISTORY: (patientId: string) => `/api/ehr/patients/${patientId}/diagnosis-history`, // GET
    INSURANCE_STATUS: (patientId: string) => `/api/ehr/patients/${patientId}/insurance-status`, // GET
    ALERTS: (patientId: string) => `/api/ehr/patients/${patientId}/alerts`,                 // GET/POST
    ALERT_DETAIL: (patientId: string, alertId: string) => `/api/ehr/patients/${patientId}/alerts/${alertId}`, // GET/PUT
    NOTES: (patientId: string) => `/api/ehr/patients/${patientId}/notes`,                   // GET
};

// ============================================
// 6.3 Medical History EHR (Tiền sử bệnh & yếu tố nguy cơ)
// ✅ Swagger: /api/ehr/patients/:patientId/medical-histories
// ============================================
export const MEDICAL_HISTORY_EHR_ENDPOINTS = {
    LIST: (patientId: string) => `/api/ehr/patients/${patientId}/medical-histories`,         // GET
    DETAIL: (patientId: string, historyId: string) => `/api/ehr/patients/${patientId}/medical-histories/${historyId}`, // GET
    CREATE: (patientId: string) => `/api/ehr/patients/${patientId}/medical-histories`,        // POST
    UPDATE: (patientId: string, historyId: string) => `/api/ehr/patients/${patientId}/medical-histories/${historyId}`, // PUT
    STATUS: (patientId: string, historyId: string) => `/api/ehr/patients/${patientId}/medical-histories/${historyId}/status`, // PATCH
    DELETE: (patientId: string, historyId: string) => `/api/ehr/patients/${patientId}/medical-histories/${historyId}`, // DELETE
    ALLERGIES: (patientId: string) => `/api/ehr/patients/${patientId}/allergies`,             // GET/POST
    ALLERGY_DETAIL: (patientId: string, allergyId: string) => `/api/ehr/patients/${patientId}/allergies/${allergyId}`, // GET/PUT
    RISK_FACTORS: (patientId: string) => `/api/ehr/patients/${patientId}/risk-factors`,      // GET/POST
    SPECIAL_CONDITIONS: (patientId: string) => `/api/ehr/patients/${patientId}/special-conditions`, // GET/POST
};

// ============================================
// 6.6 Vital Signs (Chỉ số sinh hiệu)
// ✅ Swagger: /api/ehr/patients/:patientId/vitals
// ============================================
export const VITAL_SIGNS_ENDPOINTS = {
    LIST: (patientId: string) => `/api/ehr/patients/${patientId}/vitals`,                    // GET
    LATEST: (patientId: string) => `/api/ehr/patients/${patientId}/vitals/latest`,           // GET
    TRENDS: (patientId: string) => `/api/ehr/patients/${patientId}/vitals/trends`,           // GET
    ABNORMAL: (patientId: string) => `/api/ehr/patients/${patientId}/vitals/abnormal`,       // GET
    SUMMARY: (patientId: string) => `/api/ehr/patients/${patientId}/vitals/summary`,         // GET
    HEALTH_METRICS: (patientId: string) => `/api/ehr/patients/${patientId}/health-metrics`,  // GET/POST
    HEALTH_METRICS_TIMELINE: (patientId: string) => `/api/ehr/patients/${patientId}/health-metrics/timeline`, // GET
};

// ============================================
// 6.5 Medication Treatment (Hồ sơ thuốc & điều trị)
// ✅ Swagger: /api/ehr/patients/:patientId/medication-records
// ============================================
export const MEDICATION_TREATMENT_ENDPOINTS = {
    LIST: (patientId: string) => `/api/ehr/patients/${patientId}/medication-records`,         // GET
    CURRENT: (patientId: string) => `/api/ehr/patients/${patientId}/medication-records/current`, // GET
    INTERACTION_CHECK: (patientId: string) => `/api/ehr/patients/${patientId}/medication-records/interaction-check`, // GET
    TIMELINE: (patientId: string) => `/api/ehr/patients/${patientId}/medication-records/timeline`, // GET
    DETAIL: (patientId: string, prescriptionId: string) => `/api/ehr/patients/${patientId}/medication-records/${prescriptionId}`, // GET
    TREATMENT_RECORDS: (patientId: string) => `/api/ehr/patients/${patientId}/treatment-records`, // GET
    TREATMENT_RECORD_DETAIL: (patientId: string, planId: string) => `/api/ehr/patients/${patientId}/treatment-records/${planId}`, // GET
    ADHERENCE: (patientId: string) => `/api/ehr/patients/${patientId}/medication-adherence`,  // GET/POST
};

// ============================================
// 6.4 Clinical Results (Kết quả xét nghiệm)
// ✅ Swagger: /api/ehr/patients/:patientId/clinical-results
// ============================================
export const CLINICAL_RESULTS_ENDPOINTS = {
    LIST: (patientId: string) => `/api/ehr/patients/${patientId}/clinical-results`,           // GET
    TRENDS: (patientId: string) => `/api/ehr/patients/${patientId}/clinical-results/trends`,  // GET
    SUMMARY: (patientId: string) => `/api/ehr/patients/${patientId}/clinical-results/summary`, // GET
    ATTACHMENTS: (patientId: string) => `/api/ehr/patients/${patientId}/clinical-results/attachments`, // GET
    ABNORMAL: (patientId: string) => `/api/ehr/patients/${patientId}/clinical-results/abnormal`, // GET
    BY_ENCOUNTER: (patientId: string, encounterId: string) => `/api/ehr/patients/${patientId}/clinical-results/by-encounter/${encounterId}`, // GET
    DETAIL: (patientId: string, orderId: string) => `/api/ehr/patients/${patientId}/clinical-results/${orderId}`, // GET
};

// ============================================
// 6.2 Health Timeline (Dòng thời gian sức khỏe)
// ✅ Swagger: /api/ehr/patients/:patientId/timeline
// ============================================
export const HEALTH_TIMELINE_ENDPOINTS = {
    LIST: (patientId: string) => `/api/ehr/patients/${patientId}/timeline`,                  // GET
    SUMMARY: (patientId: string) => `/api/ehr/patients/${patientId}/timeline/summary`,       // GET
    BY_ENCOUNTER: (patientId: string, encounterId: string) => `/api/ehr/patients/${patientId}/timeline/by-encounter/${encounterId}`, // GET
    TRACK_CONDITION: (patientId: string) => `/api/ehr/patients/${patientId}/timeline/track-condition`, // GET
    EVENTS: (patientId: string) => `/api/ehr/patients/${patientId}/timeline/events`,         // GET/POST
    EVENT_DETAIL: (patientId: string, eventId: string) => `/api/ehr/patients/${patientId}/timeline/events/${eventId}`, // GET/PUT
};

// ============================================
// 6.8 Data Integration (Đồng bộ dữ liệu)
// ✅ Swagger: /api/ehr/patients/:patientId/data-sources
// ============================================
export const DATA_INTEGRATION_ENDPOINTS = {
    DATA_SOURCES: (patientId: string) => `/api/ehr/patients/${patientId}/data-sources`,       // GET
    CREATE_DATA_SOURCE: (patientId: string) => `/api/ehr/patients/${patientId}/data-sources`, // POST
    DATA_SOURCE_DETAIL: (patientId: string, sourceId: string) => `/api/ehr/patients/${patientId}/data-sources/${sourceId}`, // PUT
    EXTERNAL_RECORDS: (patientId: string) => `/api/ehr/patients/${patientId}/external-records`, // GET/POST
    EXTERNAL_RECORD_DETAIL: (patientId: string, recordId: string) => `/api/ehr/patients/${patientId}/external-records/${recordId}`, // GET/PUT
    EXTERNAL_RECORD_STATUS: (patientId: string, recordId: string) => `/api/ehr/patients/${patientId}/external-records/${recordId}/status`, // PATCH
    DEVICE_SYNC: (patientId: string) => `/api/ehr/patients/${patientId}/device-sync`,         // GET/POST
    INTEGRATION_SUMMARY: (patientId: string) => `/api/ehr/patients/${patientId}/integration-summary`, // GET
};

// ============================================
// Medication Management — BỔ SUNG CÁC ENDPOINT THIẾU
// ============================================

// ============================================
// 5.1 Drug Category (Danh mục thuốc)
// ✅ Swagger: /api/pharmacy/categories/*
// Alias tách riêng DRUG_CATEGORY_ENDPOINTS
// ============================================
export const DRUG_CATEGORY_ENDPOINTS = {
    LIST: '/api/pharmacy/categories',                                              // GET
    CREATE: '/api/pharmacy/categories',                                            // POST
    EXPORT: '/api/pharmacy/categories/export',                                     // GET
    IMPORT: '/api/pharmacy/categories/import',                                     // POST
    DETAIL: (id: string) => `/api/pharmacy/categories/${id}`,                      // GET
    UPDATE: (id: string) => `/api/pharmacy/categories/${id}`,                      // PUT
    DELETE: (id: string) => `/api/pharmacy/categories/${id}`,                      // DELETE
};

// ============================================
// 5.10 Medication Instructions (Hướng dẫn dùng thuốc)
// ✅ Swagger: /api/medication-instructions/*
// ============================================
export const MED_INSTRUCTION_ENDPOINTS = {
    TEMPLATES: '/api/medication-instructions/templates',                           // GET
    CREATE_TEMPLATE: '/api/medication-instructions/templates',                     // POST
    UPDATE_TEMPLATE: (id: string) => `/api/medication-instructions/templates/${id}`, // PATCH
    DELETE_TEMPLATE: (id: string) => `/api/medication-instructions/templates/${id}`, // DELETE
    DRUG_DEFAULTS: '/api/medication-instructions/drugs',                           // GET: tất cả mặc định
    DRUG_DEFAULT: (drugId: string) => `/api/medication-instructions/drugs/${drugId}`, // GET
    UPSERT_DRUG_DEFAULT: (drugId: string) => `/api/medication-instructions/drugs/${drugId}`, // PUT
    DELETE_DRUG_DEFAULT: (drugId: string) => `/api/medication-instructions/drugs/${drugId}`, // DELETE
};

// ============================================
// Facility Management — BỔ SUNG CÁC ENDPOINT THIẾU
// ============================================

// Bổ sung FACILITY_ENDPOINTS (const gốc chỉ có LIST)
export const FACILITY_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/facilities',                                                        // GET
    DROPDOWN: '/api/facilities/dropdown',                                           // GET
    DETAIL: (id: string) => `/api/facilities/${id}`,                                // GET
    CREATE: '/api/facilities',                                                      // POST (multipart logo)
    UPDATE: (id: string) => `/api/facilities/${id}`,                                // PUT
    STATUS: (id: string) => `/api/facilities/${id}/status`,                         // PATCH
    DELETE: (id: string) => `/api/facilities/${id}`,                                // DELETE
};

// Bổ sung BRANCH_ENDPOINTS (const gốc có cơ bản)
export const BRANCH_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/branches',                                                          // GET
    DROPDOWN: '/api/branches/dropdown',                                             // GET
    DETAIL: (id: string) => `/api/branches/${id}`,                                  // GET
    CREATE: '/api/branches',                                                        // POST
    UPDATE: (id: string) => `/api/branches/${id}`,                                  // PUT
    STATUS: (id: string) => `/api/branches/${id}/status`,                           // PATCH
    DELETE: (id: string) => `/api/branches/${id}`,                                  // DELETE
};

// Bổ sung DEPARTMENT_ENDPOINTS (const gốc có cơ bản)
export const DEPARTMENT_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/departments',                                                        // GET
    DROPDOWN: '/api/departments/dropdown',                                           // GET
    DETAIL: (id: string) => `/api/departments/${id}`,                                // GET
    CREATE: '/api/departments',                                                      // POST
    UPDATE: (id: string) => `/api/departments/${id}`,                                // PUT
    STATUS: (id: string) => `/api/departments/${id}/status`,                         // PATCH
    DELETE: (id: string) => `/api/departments/${id}`,                                // DELETE
};

// ============================================
// 2.10 Medical Equipment (Thiết bị y tế)
// ✅ Swagger: /api/equipments/*
// ============================================
export const MEDICAL_EQUIPMENT_ENDPOINTS = {
    LIST: '/api/equipments',                                                              // GET
    DETAIL: (id: string) => `/api/equipments/${id}`,                                      // GET
    CREATE: '/api/equipments',                                                            // POST
    UPDATE: (id: string) => `/api/equipments/${id}`,                                      // PUT
    STATUS: (id: string) => `/api/equipments/${id}/status`,                               // PUT
    ASSIGN_ROOM: (id: string) => `/api/equipments/${id}/assign-room`,                     // PUT
    DELETE: (id: string) => `/api/equipments/${id}`,                                      // DELETE
    MAINTENANCE_LOGS: (id: string) => `/api/equipments/${id}/maintenance`,                // GET
    CREATE_MAINTENANCE: (id: string) => `/api/equipments/${id}/maintenance`,              // POST
    UPDATE_MAINTENANCE: (logId: string) => `/api/equipments/maintenance/${logId}`,        // PUT
    DELETE_MAINTENANCE: (logId: string) => `/api/equipments/maintenance/${logId}`,        // DELETE
};

// ============================================
// License (Giấy phép hành nghề)
// ✅ Swagger: /api/licenses/*
// ============================================
export const LICENSE_ENDPOINTS = {
    LIST: '/api/licenses',                                                          // GET
    CREATE: '/api/licenses',                                                        // POST
    EXPIRING: '/api/licenses/dashboard/expiring',                                   // GET: sắp hết hạn
    EXPIRED: '/api/licenses/dashboard/expired',                                     // GET: đã hết hạn
    DETAIL: (id: string) => `/api/licenses/${id}`,                                  // GET
    UPDATE: (id: string) => `/api/licenses/${id}`,                                  // PUT
    DELETE: (id: string) => `/api/licenses/${id}`,                                  // DELETE
    UPLOAD_FILE: (id: string) => `/api/licenses/${id}/upload`,                      // POST: upload file
    GET_FILE: (id: string) => `/api/licenses/${id}/file`,                           // GET
    DELETE_FILE: (id: string) => `/api/licenses/${id}/file`,                        // DELETE
};

// ============================================
// 2.11 Bed (Giường bệnh)
// ✅ Swagger: /api/beds/*
// ============================================
export const BED_ENDPOINTS = {
    LIST: '/api/beds',                                                              // GET
    DETAIL: (id: string) => `/api/beds/${id}`,                                      // GET
    CREATE: '/api/beds',                                                            // POST
    UPDATE: (id: string) => `/api/beds/${id}`,                                      // PUT
    ASSIGN: (id: string) => `/api/beds/${id}/assign`,                               // PUT
    STATUS: (id: string) => `/api/beds/${id}/status`,                               // PUT
    DELETE: (id: string) => `/api/beds/${id}`,                                      // DELETE
};

// ============================================
// Shift (Ca làm việc)
// ✅ Swagger: /api/shifts/*
// ============================================
export const SHIFT_ENDPOINTS = {
    LIST: '/api/shifts',                                                            // GET
    DETAIL: (id: string) => `/api/shifts/${id}`,                                    // GET
    CREATE: '/api/shifts',                                                          // POST
    UPDATE: (id: string) => `/api/shifts/${id}`,                                    // PUT
    DELETE: (id: string) => `/api/shifts/${id}`,                                    // DELETE
};

// ============================================
// Appointment Slot (Khung giờ khám)
// ✅ Swagger: /api/slots/*
// ============================================
export const APPOINTMENT_SLOT_ENDPOINTS = {
    LIST: '/api/slots',                                                             // GET
    DETAIL: (id: string) => `/api/slots/${id}`,                                     // GET
    CREATE: '/api/slots',                                                           // POST
    UPDATE: (id: string) => `/api/slots/${id}`,                                     // PUT
    DELETE: (id: string) => `/api/slots/${id}`,                                     // DELETE
};

// ============================================
// Doctor Service (Dịch vụ của bác sĩ)
// ✅ Swagger: /api/doctor-services/*
// ============================================
export const DOCTOR_SERVICE_ENDPOINTS = {
    ACTIVE_DOCTORS: '/api/doctor-services/active-doctors',                          // GET
    SERVICES_BY_DOCTOR: (doctorId: string) => `/api/doctor-services/${doctorId}/services`, // GET
    DOCTORS_BY_SERVICE: (facilityServiceId: string) => `/api/doctor-services/by-facility-service/${facilityServiceId}`, // GET
    ASSIGN_SERVICES: (doctorId: string) => `/api/doctor-services/${doctorId}/services`, // POST
    REMOVE_SERVICE: (doctorId: string, facilityServiceId: string) => `/api/doctor-services/${doctorId}/services/${facilityServiceId}`, // DELETE
};

// ============================================
// Shift Swap (Đổi ca)
// ✅ Swagger: /api/shift-swaps/*
// ============================================
export const SHIFT_SWAP_ENDPOINTS = {
    LIST: '/api/shift-swaps',                                                       // GET
    CREATE: '/api/shift-swaps',                                                     // POST
    DETAIL: (id: string) => `/api/shift-swaps/${id}`,                               // GET
    APPROVE: (id: string) => `/api/shift-swaps/${id}/approve`,                      // PATCH
    REJECT: (id: string) => `/api/shift-swaps/${id}/reject`,                        // PATCH
};

// ============================================
// Operating Hour (Giờ hoạt động)
// ✅ Swagger: /api/operating-hours/*
// ============================================
export const OPERATING_HOUR_ENDPOINTS = {
    LIST: '/api/operating-hours',                                                   // GET
    CREATE: '/api/operating-hours',                                                 // POST
    DETAIL: (id: string) => `/api/operating-hours/${id}`,                           // GET
    UPDATE: (id: string) => `/api/operating-hours/${id}`,                           // PUT
    DELETE: (id: string) => `/api/operating-hours/${id}`,                           // DELETE
};

// ============================================
// Room Maintenance (Bảo trì phòng)
// ✅ Swagger: /api/room-maintenance/*
// ============================================
export const ROOM_MAINTENANCE_ENDPOINTS = {
    ACTIVE: '/api/room-maintenance/active',                                                 // GET
    BY_ROOM: (roomId: string) => `/api/room-maintenance/${roomId}`,                         // GET/POST
    SCHEDULE_DETAIL: (maintenanceId: string) => `/api/room-maintenance/schedule/${maintenanceId}`, // GET/PUT
};

// ============================================
// 2.12 Booking Config (Cấu hình đặt lịch)
// ✅ Swagger: /api/booking-configs/*
// ============================================
export const BOOKING_CONFIG_ENDPOINTS = {
    BY_BRANCH: (branchId: string) => `/api/booking-configs/branch/${branchId}`,    // GET
    BY_BRANCH_RAW: (branchId: string) => `/api/booking-configs/branch/${branchId}/raw`, // GET
    UPDATE_BRANCH: (branchId: string) => `/api/booking-configs/branch/${branchId}`, // PUT
};

// ============================================
// Facility Status (Trạng thái hoạt động cơ sở)
// ✅ Swagger: /api/facility-status/*
// ============================================
export const FACILITY_STATUS_ENDPOINTS = {
    TODAY: '/api/facility-status/today',                                            // GET
    BY_DATE: (date: string) => `/api/facility-status/date/${date}`,                 // GET
    CALENDAR: '/api/facility-status/calendar',                                      // GET
};

// ============================================
// Closed Day (Ngày nghỉ đặc biệt)
// ✅ Swagger: /api/closed-days/*
// ============================================
export const CLOSED_DAY_ENDPOINTS = {
    LIST: '/api/closed-days',                                                       // GET
    CREATE: '/api/closed-days',                                                     // POST
    DELETE: (id: string) => `/api/closed-days/${id}`,                               // DELETE
};

// ============================================
// Holiday (Ngày lễ)
// ✅ Swagger: /api/holidays/*
// ============================================
export const HOLIDAY_ENDPOINTS = {
    LIST: '/api/holidays',                                                          // GET
    CREATE: '/api/holidays',                                                        // POST
    DETAIL: (id: string) => `/api/holidays/${id}`,                                  // GET
    UPDATE: (id: string) => `/api/holidays/${id}`,                                  // PUT
    DELETE: (id: string) => `/api/holidays/${id}`,                                  // DELETE
};

// ============================================
// Specialty Service (Dịch vụ theo chuyên khoa)
// ✅ Swagger: /api/specialty-services/*
// ============================================
export const SPECIALTY_SERVICE_ENDPOINTS = {
    SERVICES_BY_SPECIALTY: (specialtyId: string) => `/api/specialty-services/${specialtyId}/services`, // GET
    SPECIALTIES_BY_SERVICE: (serviceId: string) => `/api/specialty-services/by-service/${serviceId}`,  // GET
    ASSIGN_SERVICES: (specialtyId: string) => `/api/specialty-services/${specialtyId}/services`,         // POST
    REMOVE_SERVICE: (specialtyId: string, serviceId: string) => `/api/specialty-services/${specialtyId}/services/${serviceId}`, // DELETE
};

// ============================================
// Department Specialty (Chuyên khoa - Phòng ban)
// ✅ Swagger: /api/department-specialties/*
// ============================================
export const DEPARTMENT_SPECIALTY_ENDPOINTS = {
    BY_DEPARTMENT: (departmentId: string) => `/api/department-specialties/${departmentId}/specialties`, // GET
    BY_BRANCH: (branchId: string) => `/api/department-specialties/by-branch/${branchId}`,               // GET
    BY_FACILITY: (facilityId: string) => `/api/department-specialties/by-facility/${facilityId}`,       // GET
    ASSIGN: (departmentId: string) => `/api/department-specialties/${departmentId}/specialties`,         // POST
    REMOVE: (departmentId: string, specialtyId: string) => `/api/department-specialties/${departmentId}/specialties/${specialtyId}`, // DELETE
};

// Bổ sung STAFF_ENDPOINTS (const gốc chỉ có cơ bản)
export const STAFF_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/staff',                                                             // GET
    DETAIL: (staffId: string) => `/api/staff/${staffId}`,                           // GET
    CREATE: '/api/staff',                                                           // POST
    UPDATE: (staffId: string) => `/api/staff/${staffId}`,                           // PUT
    STATUS: (staffId: string) => `/api/staff/${staffId}/status`,                    // PUT
    SIGNATURE: (staffId: string) => `/api/staff/${staffId}/signature`,              // PATCH (multipart)
    DOCTOR_INFO: (staffId: string) => `/api/staff/${staffId}/doctor-info`,          // PUT
    LICENSES: (staffId: string) => `/api/staff/${staffId}/licenses`,                // GET
    CREATE_LICENSE: (staffId: string) => `/api/staff/${staffId}/licenses`,          // POST
    UPDATE_LICENSE: (staffId: string, licenseId: string) => `/api/staff/${staffId}/licenses/${licenseId}`, // PUT
    DELETE_LICENSE: (staffId: string, licenseId: string) => `/api/staff/${staffId}/licenses/${licenseId}`, // DELETE
    ROLES: (staffId: string) => `/api/staff/${staffId}/roles`,                      // POST
    REMOVE_ROLE: (staffId: string, roleId: string) => `/api/staff/${staffId}/roles/${roleId}`, // DELETE
    BRANCHES: (staffId: string) => `/api/staff/${staffId}/branches`,                // POST
    REMOVE_BRANCH: (staffId: string, branchId: string) => `/api/staff/${staffId}/branches/${branchId}`, // DELETE
};

// Bổ sung MEDICAL_ROOM_ENDPOINTS (const gốc có cơ bản)
export const MEDICAL_ROOM_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/medical-rooms',                                                      // GET
    DROPDOWN: '/api/medical-rooms/dropdown',                                         // GET
    DETAIL: (id: string) => `/api/medical-rooms/${id}`,                              // GET
    CREATE: '/api/medical-rooms',                                                    // POST
    UPDATE: (id: string) => `/api/medical-rooms/${id}`,                              // PUT
    STATUS: (id: string) => `/api/medical-rooms/${id}/status`,                       // PATCH
    DELETE: (id: string) => `/api/medical-rooms/${id}`,                              // DELETE
    ASSIGN_SERVICES: (roomId: string) => `/api/medical-rooms/${roomId}/services`,    // POST
    SERVICES: (roomId: string) => `/api/medical-rooms/${roomId}/services`,           // GET
    REMOVE_SERVICE: (roomId: string, serviceId: string) => `/api/medical-rooms/${roomId}/services/${serviceId}`, // DELETE
};

// Bổ sung MEDICAL_SERVICE_ENDPOINTS (const gốc thiếu import/export)
export const MEDICAL_SERVICE_MANAGEMENT_ENDPOINTS = {
    MASTER_LIST: '/api/medical-services/master',                                    // GET
    MASTER_EXPORT: '/api/medical-services/master/export',                           // GET
    MASTER_IMPORT: '/api/medical-services/master/import',                           // POST
    MASTER_DETAIL: (id: string) => `/api/medical-services/master/${id}`,            // GET
    MASTER_CREATE: '/api/medical-services/master',                                  // POST
    MASTER_UPDATE: (id: string) => `/api/medical-services/master/${id}`,            // PUT
    MASTER_STATUS: (id: string) => `/api/medical-services/master/${id}/status`,     // PATCH
    MASTER_DELETE: (id: string) => `/api/medical-services/master/${id}`,            // DELETE
    FACILITY_SERVICES: (facilityId: string) => `/api/medical-services/facilities/${facilityId}/services`, // GET
    FACILITY_SERVICES_EXPORT: (facilityId: string) => `/api/medical-services/facilities/${facilityId}/services/export`, // GET
    FACILITY_SERVICES_IMPORT: (facilityId: string) => `/api/medical-services/facilities/${facilityId}/services/import`, // POST
    FACILITY_ACTIVE_SERVICES: (facilityId: string) => `/api/medical-services/facilities/${facilityId}/active-services`, // GET
    FACILITY_SERVICE_DETAIL: (id: string) => `/api/medical-services/facilities/services/${id}`, // GET
    FACILITY_SERVICE_CREATE: (facilityId: string) => `/api/medical-services/facilities/${facilityId}/services`, // POST
    FACILITY_SERVICE_UPDATE: (id: string) => `/api/medical-services/facilities/services/${id}`, // PUT
    FACILITY_SERVICE_STATUS: (id: string) => `/api/medical-services/facilities/services/${id}/status`, // PATCH
};

// ============================================
// BILLING — BỔ SUNG CÁC ENDPOINT THIẾU
// ============================================

// ============================================
// 9.2 Billing Invoice (Hóa đơn)
// ✅ Swagger: /api/billing/invoices/*
// ============================================
export const BILLING_INVOICE_ENDPOINTS = {
    CREATE: '/api/billing/invoices',                                                             // POST
    GENERATE: (encounterId: string) => `/api/billing/invoices/generate/${encounterId}`,          // POST
    REVENUE_SUMMARY: (facilityId: string) => `/api/billing/invoices/summary/${facilityId}`,      // GET
    BY_ENCOUNTER: (encounterId: string) => `/api/billing/invoices/by-encounter/${encounterId}`,  // GET
    BY_PATIENT: (patientId: string) => `/api/billing/invoices/by-patient/${patientId}`,         // GET
    LIST: '/api/billing/invoices',                                                               // GET
    INSURANCE_CLAIM: (invoiceId: string) => `/api/billing/invoices/${invoiceId}/insurance-claim`, // GET
    DETAIL: (invoiceId: string) => `/api/billing/invoices/${invoiceId}`,                         // GET
    UPDATE: (invoiceId: string) => `/api/billing/invoices/${invoiceId}`,                         // PUT
    CANCEL: (invoiceId: string) => `/api/billing/invoices/${invoiceId}/cancel`,                  // PATCH
    ADD_ITEM: (invoiceId: string) => `/api/billing/invoices/${invoiceId}/items`,                 // POST
    UPDATE_ITEM: (invoiceId: string, itemId: string) => `/api/billing/invoices/${invoiceId}/items/${itemId}`, // PUT
    DELETE_ITEM: (invoiceId: string, itemId: string) => `/api/billing/invoices/${invoiceId}/items/${itemId}`, // DELETE
    RECALCULATE: (invoiceId: string) => `/api/billing/invoices/${invoiceId}/recalculate`,        // POST
};

// ============================================
// 9.2 Billing Payment (Thanh toán hóa đơn)
// ✅ Swagger: /api/billing/payments/*
// ============================================
export const BILLING_PAYMENT_ENDPOINTS = {
    CREATE: '/api/billing/payments',                                                             // POST
    BY_INVOICE: (invoiceId: string) => `/api/billing/payments/by-invoice/${invoiceId}`,         // GET
    REFUND: (paymentId: string) => `/api/billing/payments/${paymentId}/refund`,                  // POST
    DETAIL: (paymentId: string) => `/api/billing/payments/${paymentId}`,                         // GET
};

// ============================================
// 9.2 Billing Cashier Shift (Ca làm việc thu ngân — trong invoice routes)
// ✅ Swagger: /api/billing/cashier-shifts/*
// ============================================
export const BILLING_CASHIER_SHIFT_ENDPOINTS = {
    OPEN: '/api/billing/cashier-shifts',                                            // POST: mở ca
    LIST: '/api/billing/cashier-shifts',                                            // GET
    CLOSE: (shiftId: string) => `/api/billing/cashier-shifts/${shiftId}/close`,     // PATCH
    DETAIL: (shiftId: string) => `/api/billing/cashier-shifts/${shiftId}`,          // GET
};

// ============================================
// 9.4 Billing Offline Payment (Thanh toán tại quầy)
// ✅ Swagger: /api/billing/offline/*
// ============================================
export const BILLING_OFFLINE_PAYMENT_ENDPOINTS = {
    PAY: '/api/billing/offline/pay',                                                            // POST
    VOID_TRANSACTION: (transactionId: string) => `/api/billing/offline/transactions/${transactionId}/void`, // POST
    TRANSACTIONS: '/api/billing/offline/transactions',                                          // GET
    CREATE_TERMINAL: '/api/billing/offline/terminals',                                          // POST
    UPDATE_TERMINAL: (terminalId: string) => `/api/billing/offline/terminals/${terminalId}`,    // PUT
    TERMINALS: '/api/billing/offline/terminals',                                                // GET
    TERMINAL_DETAIL: (terminalId: string) => `/api/billing/offline/terminals/${terminalId}`,    // GET
    TOGGLE_TERMINAL: (terminalId: string) => `/api/billing/offline/terminals/${terminalId}/toggle`, // PATCH
    RECEIPT_BY_TRANSACTION: (transactionId: string) => `/api/billing/offline/receipts/by-transaction/${transactionId}`, // GET
    RECEIPT_DETAIL: (receiptId: string) => `/api/billing/offline/receipts/${receiptId}`,        // GET
    REPRINT_RECEIPT: (receiptId: string) => `/api/billing/offline/receipts/${receiptId}/reprint`, // POST
    SHIFT_CASH_DENOMINATION: (shiftId: string) => `/api/billing/offline/shifts/${shiftId}/cash-denomination`, // POST
    SHIFT_TRANSACTIONS: (shiftId: string) => `/api/billing/offline/shifts/${shiftId}/transactions`, // GET
    SHIFT_SUMMARY: (shiftId: string) => `/api/billing/offline/shifts/${shiftId}/summary`,       // GET
    DAILY_REPORT: '/api/billing/offline/reports/daily',                                         // GET
    CASHIER_PERFORMANCE: '/api/billing/offline/reports/cashier-performance',                    // GET
};

// ============================================
// 9.5 Billing Document (Chứng từ & Hóa đơn điện tử)
// ✅ Swagger: /api/billing/documents/*
// ============================================
export const BILLING_DOCUMENT_ENDPOINTS = {
    CREATE_E_INVOICE: '/api/billing/documents/e-invoices',                                      // POST
    CREATE_VAT_INVOICE: '/api/billing/documents/e-invoices/vat',                                // POST
    ISSUE_E_INVOICE: (id: string) => `/api/billing/documents/e-invoices/${id}/issue`,           // PATCH
    SIGN_E_INVOICE: (id: string) => `/api/billing/documents/e-invoices/${id}/sign`,             // PATCH
    SEND_E_INVOICE: (id: string) => `/api/billing/documents/e-invoices/${id}/send`,             // PATCH
    CANCEL_E_INVOICE: (id: string) => `/api/billing/documents/e-invoices/${id}/cancel`,         // POST
    REPLACE_E_INVOICE: (id: string) => `/api/billing/documents/e-invoices/${id}/replace`,       // POST
    ADJUST_E_INVOICE: (id: string) => `/api/billing/documents/e-invoices/${id}/adjust`,         // POST
    E_INVOICE_DETAIL: (id: string) => `/api/billing/documents/e-invoices/${id}`,                // GET
    E_INVOICES: '/api/billing/documents/e-invoices',                                            // GET
    LOOKUP_E_INVOICE: (code: string) => `/api/billing/documents/e-invoices/lookup/${code}`,     // GET
    PRINT_DATA: (id: string) => `/api/billing/documents/e-invoices/${id}/print-data`,           // GET
    PRINT_HISTORY: (id: string) => `/api/billing/documents/e-invoices/${id}/print-history`,     // GET
    SEARCH: '/api/billing/documents/search',                                                    // GET
    TIMELINE: (invoiceId: string) => `/api/billing/documents/invoices/${invoiceId}/timeline`,   // GET
    UPLOAD_ATTACHMENT: '/api/billing/documents/attachments',                                    // POST
    ATTACHMENTS: '/api/billing/documents/attachments',                                          // GET
    ATTACHMENT_DETAIL: (id: string) => `/api/billing/documents/attachments/${id}`,              // GET
    DELETE_ATTACHMENT: (id: string) => `/api/billing/documents/attachments/${id}`,              // DELETE
    ARCHIVE_ATTACHMENTS: '/api/billing/documents/attachments/archive',                          // PATCH
    DOC_CONFIG: (facilityId: string) => `/api/billing/documents/config/${facilityId}`,          // GET/PUT
};

// ============================================
// 9.1 Billing Pricing (Bảng giá dịch vụ)
// ✅ Swagger: /api/billing/pricing/*
// ============================================
export const BILLING_PRICING_ENDPOINTS = {
    CATALOG: '/api/billing/pricing/catalog',                                                    // GET
    FACILITY_CATALOG: (facilityId: string) => `/api/billing/pricing/catalog/${facilityId}`,     // GET
    POLICIES: (facilityServiceId: string) => `/api/billing/pricing/policies/${facilityServiceId}`, // GET
    CREATE_POLICY: '/api/billing/pricing/policies',                                             // POST
    BULK_CREATE: '/api/billing/pricing/policies/bulk',                                          // POST
    UPDATE_POLICY: (policyId: string) => `/api/billing/pricing/policies/${policyId}`,           // PUT
    DELETE_POLICY: (policyId: string) => `/api/billing/pricing/policies/${policyId}`,           // DELETE
    RESOLVE: '/api/billing/pricing/resolve',                                                    // GET
    SPECIALTY_PRICES: (facilityServiceId: string) => `/api/billing/pricing/specialty-prices/${facilityServiceId}`, // GET
    CREATE_SPECIALTY_PRICE: '/api/billing/pricing/specialty-prices',                            // POST
    UPDATE_SPECIALTY_PRICE: (specialtyPriceId: string) => `/api/billing/pricing/specialty-prices/${specialtyPriceId}`, // PUT
    DELETE_SPECIALTY_PRICE: (specialtyPriceId: string) => `/api/billing/pricing/specialty-prices/${specialtyPriceId}`, // DELETE
    HISTORY_BY_SERVICE: (facilityServiceId: string) => `/api/billing/pricing/history/${facilityServiceId}`, // GET
    HISTORY_BY_FACILITY: (facilityId: string) => `/api/billing/pricing/history/facility/${facilityId}`, // GET
    COMPARE: '/api/billing/pricing/compare',                                                    // GET
    SUMMARY: (facilityId: string) => `/api/billing/pricing/summary/${facilityId}`,              // GET
    EXPIRING_POLICIES: (facilityId: string) => `/api/billing/pricing/expiring-policies/${facilityId}`, // GET
};

// ============================================
// 9.8 Billing Pricing Policy (Chính sách giá & ưu đãi)
// ✅ Swagger: /api/billing/pricing-policies/*
// ============================================
export const BILLING_PRICING_POLICY_ENDPOINTS = {
    // Discounts
    CREATE_DISCOUNT: '/api/billing/pricing-policies/discounts',                     // POST
    DISCOUNTS: '/api/billing/pricing-policies/discounts',                           // GET
    CALCULATE_DISCOUNT: '/api/billing/pricing-policies/discounts/calculate',        // POST
    DISCOUNT_DETAIL: (id: string) => `/api/billing/pricing-policies/discounts/${id}`, // GET
    UPDATE_DISCOUNT: (id: string) => `/api/billing/pricing-policies/discounts/${id}`, // PUT
    DELETE_DISCOUNT: (id: string) => `/api/billing/pricing-policies/discounts/${id}`, // DELETE
    // Vouchers
    CREATE_VOUCHER: '/api/billing/pricing-policies/vouchers',                       // POST
    VOUCHERS: '/api/billing/pricing-policies/vouchers',                             // GET
    VALIDATE_VOUCHER: '/api/billing/pricing-policies/vouchers/validate',            // POST
    REDEEM_VOUCHER: '/api/billing/pricing-policies/vouchers/redeem',                // POST
    VOUCHER_DETAIL: (id: string) => `/api/billing/pricing-policies/vouchers/${id}`, // GET
    UPDATE_VOUCHER: (id: string) => `/api/billing/pricing-policies/vouchers/${id}`, // PUT
    DELETE_VOUCHER: (id: string) => `/api/billing/pricing-policies/vouchers/${id}`, // DELETE
    VOUCHER_USAGE: (id: string) => `/api/billing/pricing-policies/vouchers/${id}/usage`, // GET
    // Bundles
    CREATE_BUNDLE: '/api/billing/pricing-policies/bundles',                         // POST
    BUNDLES: '/api/billing/pricing-policies/bundles',                               // GET
    BUNDLE_DETAIL: (id: string) => `/api/billing/pricing-policies/bundles/${id}`,   // GET
    UPDATE_BUNDLE: (id: string) => `/api/billing/pricing-policies/bundles/${id}`,   // PUT
    DELETE_BUNDLE: (id: string) => `/api/billing/pricing-policies/bundles/${id}`,   // DELETE
    CALCULATE_BUNDLE: (id: string) => `/api/billing/pricing-policies/bundles/${id}/calculate`, // POST
    // Promotions & History
    ACTIVE_PROMOTIONS: '/api/billing/pricing-policies/active-promotions',           // GET
    HISTORY: '/api/billing/pricing-policies/history',                               // GET
};

// ============================================
// 9.7 Billing Refund (Hoàn tiền)
// ✅ Swagger: /api/billing/refunds/*
// ============================================
export const BILLING_REFUND_ENDPOINTS = {
    CREATE_REQUEST: '/api/billing/refunds/requests',                                            // POST
    REQUESTS: '/api/billing/refunds/requests',                                                  // GET
    REQUEST_DETAIL: (id: string) => `/api/billing/refunds/requests/${id}`,                      // GET
    APPROVE: (id: string) => `/api/billing/refunds/requests/${id}/approve`,                     // PATCH
    REJECT: (id: string) => `/api/billing/refunds/requests/${id}/reject`,                       // PATCH
    PROCESS: (id: string) => `/api/billing/refunds/requests/${id}/process`,                     // PATCH
    CANCEL: (id: string) => `/api/billing/refunds/requests/${id}/cancel`,                       // PATCH
    CREATE_ADJUSTMENT: '/api/billing/refunds/adjustments',                                      // POST
    ADJUSTMENTS: '/api/billing/refunds/adjustments',                                            // GET
    ADJUSTMENT_DETAIL: (id: string) => `/api/billing/refunds/adjustments/${id}`,                // GET
    APPROVE_ADJUSTMENT: (id: string) => `/api/billing/refunds/adjustments/${id}/approve`,       // PATCH
    APPLY_ADJUSTMENT: (id: string) => `/api/billing/refunds/adjustments/${id}/apply`,           // PATCH
    REJECT_ADJUSTMENT: (id: string) => `/api/billing/refunds/adjustments/${id}/reject`,         // PATCH
    DASHBOARD: '/api/billing/refunds/dashboard',                                                // GET
    REQUEST_TIMELINE: (id: string) => `/api/billing/refunds/requests/${id}/timeline`,           // GET
    TRANSACTION_HISTORY: (txnId: string) => `/api/billing/refunds/transaction/${txnId}/history`, // GET
};

// ============================================
// 9.6 Billing Reconciliation (Đối soát thanh toán)
// ✅ Swagger: /api/billing/reconciliation/*
// ============================================
export const BILLING_RECONCILIATION_ENDPOINTS = {
    RUN_ONLINE: '/api/billing/reconciliation/online',                                           // POST
    RUN_SHIFT: (shiftId: string) => `/api/billing/reconciliation/shift/${shiftId}`,             // POST
    SESSIONS: '/api/billing/reconciliation/sessions',                                           // GET
    SESSION_DETAIL: (id: string) => `/api/billing/reconciliation/sessions/${id}`,               // GET
    SHIFT_DISCREPANCY: (shiftId: string) => `/api/billing/reconciliation/shifts/${shiftId}/discrepancy`, // GET
    DISCREPANCY_REPORT: '/api/billing/reconciliation/discrepancy-report',                       // GET
    RESOLVE_ITEM: (itemId: string) => `/api/billing/reconciliation/items/${itemId}/resolve`,    // PATCH
    REVIEW_SESSION: (id: string) => `/api/billing/reconciliation/sessions/${id}/review`,        // PATCH
    APPROVE_SESSION: (id: string) => `/api/billing/reconciliation/sessions/${id}/approve`,      // PATCH
    REJECT_SESSION: (id: string) => `/api/billing/reconciliation/sessions/${id}/reject`,        // PATCH
    CREATE_SETTLEMENT: '/api/billing/reconciliation/settlements',                               // POST
    SUBMIT_SETTLEMENT: (id: string) => `/api/billing/reconciliation/settlements/${id}/submit`,  // PATCH
    APPROVE_SETTLEMENT: (id: string) => `/api/billing/reconciliation/settlements/${id}/approve`, // PATCH
    REJECT_SETTLEMENT: (id: string) => `/api/billing/reconciliation/settlements/${id}/reject`,  // PATCH
    SETTLEMENTS: '/api/billing/reconciliation/settlements',                                     // GET
    SETTLEMENT_DETAIL: (id: string) => `/api/billing/reconciliation/settlements/${id}`,         // GET
    HISTORY: '/api/billing/reconciliation/history',                                             // GET
    EXPORT_SETTLEMENT: (id: string) => `/api/billing/reconciliation/settlements/${id}/export`,  // GET
};

// ============================================
// 9.9 Billing Cashier Auth (Phân quyền thu ngân)
// ✅ Swagger: /api/billing/cashier-auth/*
// ============================================
export const BILLING_CASHIER_AUTH_ENDPOINTS = {
    CREATE_PROFILE: '/api/billing/cashier-auth/profiles',                                       // POST
    PROFILES: '/api/billing/cashier-auth/profiles',                                             // GET
    PROFILE_BY_USER: (userId: string) => `/api/billing/cashier-auth/profiles/by-user/${userId}`, // GET
    PROFILE_DETAIL: (id: string) => `/api/billing/cashier-auth/profiles/${id}`,                  // GET
    UPDATE_PROFILE: (id: string) => `/api/billing/cashier-auth/profiles/${id}`,                  // PUT
    DELETE_PROFILE: (id: string) => `/api/billing/cashier-auth/profiles/${id}`,                  // DELETE
    SET_LIMIT: '/api/billing/cashier-auth/limits',                                              // POST
    CHECK_LIMIT: '/api/billing/cashier-auth/limits/check',                                      // POST
    LIMIT: (profileId: string) => `/api/billing/cashier-auth/limits/${profileId}`,               // GET/PUT
    ACTIVE_SHIFTS: '/api/billing/cashier-auth/shifts/active',                                   // GET
    LOCK_SHIFT: (shiftId: string) => `/api/billing/cashier-auth/shifts/${shiftId}/lock`,         // PATCH
    UNLOCK_SHIFT: (shiftId: string) => `/api/billing/cashier-auth/shifts/${shiftId}/unlock`,     // PATCH
    FORCE_CLOSE_SHIFT: (shiftId: string) => `/api/billing/cashier-auth/shifts/${shiftId}/force-close`, // PATCH
    HANDOVER_SHIFT: (shiftId: string) => `/api/billing/cashier-auth/shifts/${shiftId}/handover`, // PATCH
    ACTIVITY_LOGS: '/api/billing/cashier-auth/activity-logs',                                   // GET
    LOGS_BY_SHIFT: (shiftId: string) => `/api/billing/cashier-auth/activity-logs/shift/${shiftId}`, // GET
    LOGS_BY_PROFILE: (profileId: string) => `/api/billing/cashier-auth/activity-logs/${profileId}`, // GET
    DASHBOARD: '/api/billing/cashier-auth/dashboard',                                           // GET
    STATS: (profileId: string) => `/api/billing/cashier-auth/stats/${profileId}`,               // GET
};

// ============================================
// 9.3 Billing Payment Gateway (SePay / Thanh toán online)
// ✅ Swagger: /api/billing/payments/*
// ============================================
export const BILLING_PAYMENT_GATEWAY_ENDPOINTS = {
    GENERATE_QR: '/api/billing/payments/qr-generate',                                          // POST
    ORDER_DETAIL: (orderId: string) => `/api/billing/payments/orders/${orderId}`,               // GET
    ORDER_STATUS: (orderId: string) => `/api/billing/payments/orders/${orderId}/status`,        // GET
    CANCEL_ORDER: (orderId: string) => `/api/billing/payments/orders/${orderId}/cancel`,        // POST
    ORDERS_BY_INVOICE: (invoiceId: string) => `/api/billing/payments/invoice/${invoiceId}/orders`, // GET
    WEBHOOK_SEPAY: '/api/billing/payments/webhook/sepay',                                       // POST
    MANUAL_VERIFY: (orderId: string) => `/api/billing/payments/webhook/verify/${orderId}`,      // GET
    GATEWAY_CONFIG: '/api/billing/payments/gateway/config',                                     // GET/PUT
    TEST_GATEWAY: '/api/billing/payments/gateway/test',                                         // POST
    ONLINE_HISTORY: '/api/billing/payments/online/history',                                     // GET
    ONLINE_STATS: '/api/billing/payments/online/stats',                                         // GET
};

// ============================================
// REMOTE CONSULTATION — BỔ SUNG CÁC ENDPOINT THIẾU
// ============================================

// ============================================
// 8.2 Tele Booking (Đặt lịch tư vấn từ xa)
// ✅ Swagger: /api/teleconsultation/booking/*
// ============================================
export const TELE_BOOKING_ENDPOINTS = {
    AVAILABLE_DOCTORS: '/api/teleconsultation/booking/doctors',                     // GET
    AVAILABLE_SLOTS: '/api/teleconsultation/booking/slots',                         // GET
    CHECK_DOCTOR: '/api/teleconsultation/booking/check-doctor',                     // GET
    MY_BOOKINGS: '/api/teleconsultation/booking/my-bookings',                       // GET
    CREATE: '/api/teleconsultation/booking',                                        // POST
    UPDATE: (sessionId: string) => `/api/teleconsultation/booking/${sessionId}`,    // PUT
    CONFIRM: (sessionId: string) => `/api/teleconsultation/booking/${sessionId}/confirm`, // POST
    CANCEL: (sessionId: string) => `/api/teleconsultation/booking/${sessionId}/cancel`,   // POST
    INITIATE_PAYMENT: (sessionId: string) => `/api/teleconsultation/booking/${sessionId}/payment`, // POST
    PAYMENT_CALLBACK: (sessionId: string) => `/api/teleconsultation/booking/${sessionId}/payment-callback`, // POST
    LIST: '/api/teleconsultation/booking',                                          // GET (admin/doctor)
    DETAIL: (sessionId: string) => `/api/teleconsultation/booking/${sessionId}`,    // GET
};

// ============================================
// 8.3 Tele Room (Phòng khám trực tuyến)
// ✅ Swagger: /api/teleconsultation/room/*
// ============================================
export const TELE_ROOM_ENDPOINTS = {
    ACTIVE: '/api/teleconsultation/room/active',                                    // GET (admin)
    OPEN: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/open`,      // POST
    JOIN: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/join`,      // POST
    LEAVE: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/leave`,    // POST
    CLOSE: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/close`,    // POST
    DETAIL: (consultationId: string) => `/api/teleconsultation/room/${consultationId}`,         // GET
    SEND_MESSAGE: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/messages`, // POST
    MESSAGES: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/messages`, // GET
    MARK_READ: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/messages/read`, // PUT
    UPLOAD_FILE: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/files`, // POST
    FILES: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/files`,     // GET
    DELETE_FILE: (consultationId: string, fileId: string) => `/api/teleconsultation/room/${consultationId}/files/${fileId}`, // DELETE
    UPDATE_MEDIA: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/media`, // PUT
    PARTICIPANTS: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/participants`, // GET
    KICK_USER: (consultationId: string, userId: string) => `/api/teleconsultation/room/${consultationId}/kick/${userId}`, // POST
    EVENTS: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/events`,   // GET
    NETWORK_REPORT: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/network-report`, // POST
    SUMMARY: (consultationId: string) => `/api/teleconsultation/room/${consultationId}/summary`, // GET
};

// ============================================
// 8.4 Tele Medical Chat (Trao đổi thông tin y tế)
// ✅ Swagger: /api/teleconsultation/medical-chat/*
// ============================================
export const TELE_MEDICAL_CHAT_ENDPOINTS = {
    UNREAD_COUNT: '/api/teleconsultation/medical-chat/unread-count',                // GET
    MY_PATIENTS: '/api/teleconsultation/medical-chat/my-patients',                  // GET (doctor)
    CREATE_CONVERSATION: '/api/teleconsultation/medical-chat/conversations',        // POST
    CONVERSATIONS: '/api/teleconsultation/medical-chat/conversations',              // GET
    CONVERSATION_DETAIL: (conversationId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}`, // GET
    CLOSE_CONVERSATION: (conversationId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}/close`, // PUT
    REOPEN_CONVERSATION: (conversationId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}/reopen`, // PUT
    SEND_MESSAGE: (conversationId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}/messages`, // POST
    MESSAGES: (conversationId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}/messages`, // GET
    PINNED_MESSAGES: (conversationId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}/messages/pinned`, // GET
    MARK_READ: (conversationId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}/messages/read`, // PUT
    TOGGLE_PIN: (conversationId: string, messageId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}/messages/${messageId}/pin`, // PUT
    DELETE_MESSAGE: (conversationId: string, messageId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}/messages/${messageId}`, // DELETE
    ATTACHMENTS: (conversationId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}/attachments`, // GET
    MEDICAL_ATTACHMENTS: (conversationId: string) => `/api/teleconsultation/medical-chat/conversations/${conversationId}/attachments/medical`, // GET
};

// ============================================
// 8.5 Tele Result (Kết quả khám từ xa)
// ✅ Swagger: /api/teleconsultation/results/*
// ============================================
export const TELE_RESULT_ENDPOINTS = {
    LIST: '/api/teleconsultation/results',                                                  // GET
    UNSIGNED: '/api/teleconsultation/results/unsigned',                                     // GET
    FOLLOW_UPS: '/api/teleconsultation/results/follow-ups',                                 // GET
    PATIENT_RESULTS: (patientId: string) => `/api/teleconsultation/results/patient/${patientId}`, // GET
    CREATE: (consultationId: string) => `/api/teleconsultation/results/${consultationId}`,  // POST
    UPDATE: (consultationId: string) => `/api/teleconsultation/results/${consultationId}`,  // PUT
    DETAIL: (consultationId: string) => `/api/teleconsultation/results/${consultationId}`,  // GET
    COMPLETE: (consultationId: string) => `/api/teleconsultation/results/${consultationId}/complete`, // PUT
    SIGN: (consultationId: string) => `/api/teleconsultation/results/${consultationId}/sign`, // PUT
    UPDATE_SYMPTOMS: (consultationId: string) => `/api/teleconsultation/results/${consultationId}/symptoms`, // PUT
    UPDATE_VITALS: (consultationId: string) => `/api/teleconsultation/results/${consultationId}/vitals`, // PUT
    UPDATE_REFERRAL: (consultationId: string) => `/api/teleconsultation/results/${consultationId}/referral`, // PUT
    UPDATE_FOLLOW_UP: (consultationId: string) => `/api/teleconsultation/results/${consultationId}/follow-up`, // PUT
    SUMMARY: (consultationId: string) => `/api/teleconsultation/results/${consultationId}/summary`, // GET
};

// ============================================
// 8.6 Tele Prescription (Kê đơn & chỉ định từ xa)
// ✅ Swagger: /api/teleconsultation/prescriptions/*
// ============================================
export const TELE_PRESCRIPTION_ENDPOINTS = {
    LIST: '/api/teleconsultation/prescriptions',                                            // GET
    DRUG_RESTRICTIONS: '/api/teleconsultation/prescriptions/drug-restrictions',             // GET
    PATIENT_PRESCRIPTIONS: (patientId: string) => `/api/teleconsultation/prescriptions/patient/${patientId}`, // GET
    CREATE: (consultationId: string) => `/api/teleconsultation/prescriptions/${consultationId}`, // POST
    DETAIL: (consultationId: string) => `/api/teleconsultation/prescriptions/${consultationId}`, // GET
    ADD_ITEM: (consultationId: string) => `/api/teleconsultation/prescriptions/${consultationId}/items`, // POST
    REMOVE_ITEM: (consultationId: string, detailId: string) => `/api/teleconsultation/prescriptions/${consultationId}/items/${detailId}`, // DELETE
    PRESCRIBE: (consultationId: string) => `/api/teleconsultation/prescriptions/${consultationId}/prescribe`, // PUT
    SEND_TO_PATIENT: (consultationId: string) => `/api/teleconsultation/prescriptions/${consultationId}/send`, // PUT
    STOCK_CHECK: (consultationId: string) => `/api/teleconsultation/prescriptions/${consultationId}/stock-check`, // GET
    CREATE_LAB_ORDER: (consultationId: string) => `/api/teleconsultation/prescriptions/${consultationId}/lab-orders`, // POST
    LAB_ORDERS: (consultationId: string) => `/api/teleconsultation/prescriptions/${consultationId}/lab-orders`, // GET
    UPDATE_REFERRAL: (consultationId: string) => `/api/teleconsultation/prescriptions/${consultationId}/referral`, // PUT
    SUMMARY: (consultationId: string) => `/api/teleconsultation/prescriptions/${consultationId}/summary`, // GET
};

// ============================================
// 8.7 Tele Follow-up (Theo dõi sau tư vấn)
// ✅ Swagger: /api/teleconsultation/follow-ups/*
// ============================================
export const TELE_FOLLOWUP_ENDPOINTS = {
    PLANS: '/api/teleconsultation/follow-ups/plans',                                        // GET
    UPCOMING: '/api/teleconsultation/follow-ups/plans/upcoming',                            // GET
    PATIENT_PLANS: (patientId: string) => `/api/teleconsultation/follow-ups/plans/patient/${patientId}`, // GET
    STATS: '/api/teleconsultation/follow-ups/stats',                                        // GET
    ATTENTION_UPDATES: '/api/teleconsultation/follow-ups/updates/attention',                // GET
    CREATE_PLAN: (consultationId: string) => `/api/teleconsultation/follow-ups/plans/${consultationId}`, // POST
    UPDATE_PLAN: (planId: string) => `/api/teleconsultation/follow-ups/plans/${planId}`,    // PUT
    PLAN_DETAIL: (planId: string) => `/api/teleconsultation/follow-ups/plans/${planId}`,    // GET
    COMPLETE_PLAN: (planId: string) => `/api/teleconsultation/follow-ups/plans/${planId}/complete`, // PUT
    CONVERT_PLAN: (planId: string) => `/api/teleconsultation/follow-ups/plans/${planId}/convert`, // PUT
    ADD_HEALTH_UPDATE: (planId: string) => `/api/teleconsultation/follow-ups/plans/${planId}/updates`, // POST
    HEALTH_UPDATES: (planId: string) => `/api/teleconsultation/follow-ups/plans/${planId}/updates`, // GET
    RESPOND_UPDATE: (updateId: string) => `/api/teleconsultation/follow-ups/updates/${updateId}/respond`, // PUT
    SEND_REMINDER: (planId: string) => `/api/teleconsultation/follow-ups/plans/${planId}/send-reminder`, // POST
    REPORT: (planId: string) => `/api/teleconsultation/follow-ups/plans/${planId}/report`,  // GET
};

// ============================================
// 8.1 Tele Consultation Type (Hình thức khám từ xa)
// ✅ Swagger: /api/teleconsultation/types|configs/*
// ============================================
export const TELE_CONSULTATION_TYPE_ENDPOINTS = {
    CREATE_TYPE: '/api/teleconsultation/types',                                              // POST
    ACTIVE_TYPES: '/api/teleconsultation/types/active',                                     // GET
    TYPES: '/api/teleconsultation/types',                                                    // GET
    TYPE_DETAIL: (typeId: string) => `/api/teleconsultation/types/${typeId}`,                // GET
    UPDATE_TYPE: (typeId: string) => `/api/teleconsultation/types/${typeId}`,                // PUT
    DELETE_TYPE: (typeId: string) => `/api/teleconsultation/types/${typeId}`,                // DELETE
    CREATE_CONFIG: '/api/teleconsultation/configs',                                          // POST
    BATCH_CONFIGS: '/api/teleconsultation/configs/batch',                                    // POST
    CONFIGS: '/api/teleconsultation/configs',                                                // GET
    CONFIG_DETAIL: (configId: string) => `/api/teleconsultation/configs/${configId}`,        // GET
    UPDATE_CONFIG: (configId: string) => `/api/teleconsultation/configs/${configId}`,        // PUT
    DELETE_CONFIG: (configId: string) => `/api/teleconsultation/configs/${configId}`,        // DELETE
    TYPE_SPECIALTIES: (typeId: string) => `/api/teleconsultation/types/${typeId}/specialties`, // GET
    SPECIALTIES_TYPES: (specialtyId: string) => `/api/teleconsultation/specialties/${specialtyId}/types`, // GET
    AVAILABILITY: '/api/teleconsultation/availability',                                      // GET
    STATS: '/api/teleconsultation/stats',                                                    // GET
};

// ============================================
// 8.8 Tele Quality (Chất lượng & đánh giá)
// ✅ Swagger: /api/teleconsultation/quality/*
// ============================================
export const TELE_QUALITY_ENDPOINTS = {
    REVIEWS: '/api/teleconsultation/quality/reviews',                                        // GET
    DOCTOR_REVIEWS: (doctorId: string) => `/api/teleconsultation/quality/reviews/doctor/${doctorId}`, // GET
    OVERVIEW: '/api/teleconsultation/quality/metrics/overview',                              // GET
    CONNECTION_STATS: '/api/teleconsultation/quality/metrics/connection',                    // GET
    TRENDS: '/api/teleconsultation/quality/metrics/trends',                                  // GET
    DOCTOR_METRICS: (doctorId: string) => `/api/teleconsultation/quality/metrics/doctor/${doctorId}`, // GET
    ALERTS: '/api/teleconsultation/quality/alerts',                                          // GET/POST
    ALERT_STATS: '/api/teleconsultation/quality/alerts/stats',                               // GET
    RESOLVE_ALERT: (alertId: string) => `/api/teleconsultation/quality/alerts/${alertId}/resolve`, // PUT
    CREATE_REVIEW: (consultationId: string) => `/api/teleconsultation/quality/reviews/${consultationId}`, // POST
    GET_REVIEW: (consultationId: string) => `/api/teleconsultation/quality/reviews/${consultationId}`, // GET
    DOCTOR_REPORT: (doctorId: string) => `/api/teleconsultation/quality/reports/doctor/${doctorId}`, // GET
    SYSTEM_REPORT: '/api/teleconsultation/quality/reports/summary',                          // GET
};

// ============================================
// 8.9 Tele Config (Cấu hình hệ thống tele)
// ✅ Swagger: /api/teleconsultation/admin/*
// ============================================
export const TELE_CONFIG_ENDPOINTS = {
    ALL_CONFIGS: '/api/teleconsultation/admin/configs',                                      // GET
    BATCH_UPDATE: '/api/teleconsultation/admin/configs/batch',                               // PUT
    RESET_DEFAULTS: '/api/teleconsultation/admin/configs/reset',                             // POST
    AUDIT_LOG: '/api/teleconsultation/admin/configs/audit-log',                              // GET
    CONFIG: (configKey: string) => `/api/teleconsultation/admin/configs/${configKey}`,       // GET/PUT
    PRICING: '/api/teleconsultation/admin/pricing',                                          // GET/POST
    PRICING_LOOKUP: '/api/teleconsultation/admin/pricing/lookup',                            // GET
    UPDATE_PRICING: (pricingId: string) => `/api/teleconsultation/admin/pricing/${pricingId}`, // PUT
    DELETE_PRICING: (pricingId: string) => `/api/teleconsultation/admin/pricing/${pricingId}`, // DELETE
    SLA_DASHBOARD: '/api/teleconsultation/admin/sla/dashboard',                              // GET
    SLA_BREACHES: '/api/teleconsultation/admin/sla/breaches',                                // GET
};

// ============================================
// AI — BỔ SUNG CÁC ENDPOINT THIẾU
// ============================================

// ============================================
// 7.1 AI Health Chat (Tư vấn sức khỏe AI)
// ✅ Swagger: /api/ai/health-chat/*
// ============================================
export const AI_HEALTH_CHAT_ENDPOINTS = {
    CREATE_SESSION: '/api/ai/health-chat/sessions',                                          // POST
    SEND_MESSAGE: (sessionId: string) => `/api/ai/health-chat/sessions/${sessionId}/messages`, // POST
    STREAM_MESSAGE: (sessionId: string) => `/api/ai/health-chat/sessions/${sessionId}/messages/stream`, // POST
    COMPLETE_SESSION: (sessionId: string) => `/api/ai/health-chat/sessions/${sessionId}/complete`, // PATCH
    SESSION_HISTORY: (sessionId: string) => `/api/ai/health-chat/sessions/${sessionId}`,     // GET
    USER_SESSIONS: '/api/ai/health-chat/sessions',                                           // GET
    FEEDBACK: (sessionId: string, messageId: string) => `/api/ai/health-chat/sessions/${sessionId}/messages/${messageId}/feedback`, // PATCH
    TOKEN_ANALYTICS: '/api/ai/health-chat/analytics/tokens',                                 // GET (admin)
    DELETE_SESSION: (sessionId: string) => `/api/ai/health-chat/sessions/${sessionId}`,      // DELETE
};

// ============================================
// 7.2 AI RAG (Knowledge Base)
// ✅ Swagger: /api/ai/rag/*
// ============================================
export const AI_RAG_ENDPOINTS = {
    UPLOAD: '/api/ai/rag/upload',                                                            // POST (multipart)
    DOCUMENTS: '/api/ai/rag/documents',                                                      // QC_SKIP: AI RAG backend is not deployed in the current environment
    DELETE_DOCUMENT: (id: string) => `/api/ai/rag/documents/${id}`,                          // DELETE
};

// ============================================
// Staff Schedule — Bổ sung STAFF_SCHEDULE_ENDPOINTS
// ✅ Swagger: /api/staff-schedules/*
// ============================================
export const STAFF_SCHEDULE_ENDPOINTS = {
    LIST: '/api/staff-schedules',                                                             // GET
    CREATE: '/api/staff-schedules',                                                           // POST
    CALENDAR: '/api/staff-schedules/calendar',                                                // GET
    BY_STAFF: (staffId: string) => `/api/staff-schedules/staff/${staffId}`,                   // GET
    BY_DATE: (date: string) => `/api/staff-schedules/date/${date}`,                           // GET
    DETAIL: (id: string) => `/api/staff-schedules/${id}`,                                     // GET
    UPDATE: (id: string) => `/api/staff-schedules/${id}`,                                     // PUT
    DELETE: (id: string) => `/api/staff-schedules/${id}`,                                     // DELETE
    SUSPEND: (id: string) => `/api/staff-schedules/${id}/suspend`,                            // PATCH
    RESUME: (id: string) => `/api/staff-schedules/${id}/resume`,                              // PATCH
};

// ============================================
// Leave Management — Bổ sung LEAVE_MANAGEMENT_ENDPOINTS
// ✅ Swagger: /api/leaves/*
// ============================================
export const LEAVE_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/leaves',                                                            // GET
    CREATE: '/api/leaves',                                                          // POST
    DETAIL: (id: string) => `/api/leaves/${id}`,                                    // GET
    UPDATE: (id: string) => `/api/leaves/${id}`,                                    // PUT
    DELETE: (id: string) => `/api/leaves/${id}`,                                    // DELETE
    APPROVE: (id: string) => `/api/leaves/${id}/approve`,                           // PATCH
    REJECT: (id: string) => `/api/leaves/${id}/reject`,                             // PATCH
};

// ============================================
// Specialty — Bổ sung SPECIALTY_MANAGEMENT_ENDPOINTS
// ✅ Swagger: /api/specialties/*
// ============================================
export const SPECIALTY_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/specialties',                                                       // GET
    CREATE: '/api/specialties',                                                     // POST
    DETAIL: (id: string) => `/api/specialties/${id}`,                               // GET
    UPDATE: (id: string) => `/api/specialties/${id}`,                               // PUT/PATCH
    DELETE: (id: string) => `/api/specialties/${id}`,                               // DELETE
};

// ============================================
// Inventory — Bổ sung INVENTORY_MANAGEMENT_ENDPOINTS
// ✅ Swagger: /api/inventory/*
// ============================================
export const INVENTORY_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/inventory',                                                         // GET
    CREATE: '/api/inventory',                                                       // POST
    DETAIL: (batchId: string) => `/api/inventory/${batchId}`,                       // GET
    UPDATE: (batchId: string) => `/api/inventory/${batchId}`,                       // PUT
    LOW_STOCK: '/api/inventory/alerts/low-stock',                                   // GET
    EXPIRING: '/api/inventory/alerts/expiring',                                     // GET
};

// ============================================
// Warehouse — Bổ sung WAREHOUSE_MANAGEMENT_ENDPOINTS
// ✅ Swagger: /api/warehouses/*
// ============================================
export const WAREHOUSE_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/warehouses',                                                        // GET
    CREATE: '/api/warehouses',                                                      // POST
    DETAIL: (id: string) => `/api/warehouses/${id}`,                                // GET
    UPDATE: (id: string) => `/api/warehouses/${id}`,                                // PUT
    TOGGLE: (id: string) => `/api/warehouses/${id}/toggle`,                         // PATCH
};

// ============================================
// Supplier — Bổ sung SUPPLIER_MANAGEMENT_ENDPOINTS
// ✅ Swagger: /api/suppliers/*
// ============================================
export const SUPPLIER_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/suppliers',                                                         // GET
    CREATE: '/api/suppliers',                                                       // POST
    DETAIL: (id: string) => `/api/suppliers/${id}`,                                 // GET
    UPDATE: (id: string) => `/api/suppliers/${id}`,                                 // PATCH
};

// ============================================
// Stock In — Bổ sung STOCK_IN_MANAGEMENT_ENDPOINTS
// ✅ Swagger: /api/stock-in/*
// ============================================
export const STOCK_IN_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/stock-in',                                                          // GET
    CREATE: '/api/stock-in',                                                        // POST
    ADD_ITEM: (orderId: string) => `/api/stock-in/${orderId}/items`,                // POST
    CONFIRM: (orderId: string) => `/api/stock-in/${orderId}/confirm`,               // PATCH
    RECEIVE: (orderId: string) => `/api/stock-in/${orderId}/receive`,               // PATCH
    CANCEL: (orderId: string) => `/api/stock-in/${orderId}/cancel`,                 // PATCH
    DETAIL: (orderId: string) => `/api/stock-in/${orderId}`,                        // GET
};

// ============================================
// Stock Out — Bổ sung STOCK_OUT_MANAGEMENT_ENDPOINTS
// ✅ Swagger: /api/stock-out/*
// ============================================
export const STOCK_OUT_MANAGEMENT_ENDPOINTS = {
    LIST: '/api/stock-out',                                                         // GET
    CREATE: '/api/stock-out',                                                       // POST
    ADD_ITEM: (orderId: string) => `/api/stock-out/${orderId}/items`,               // POST
    DELETE_ITEM: (orderId: string, detailId: string) => `/api/stock-out/${orderId}/items/${detailId}`, // DELETE
    CONFIRM: (orderId: string) => `/api/stock-out/${orderId}/confirm`,              // PATCH
    CANCEL: (orderId: string) => `/api/stock-out/${orderId}/cancel`,                // PATCH
    DETAIL: (orderId: string) => `/api/stock-out/${orderId}`,                       // GET
};

// ============================================
// 1.8 Audit Log Endpoints
// Swagger: /api/system/audit-logs/*
// ============================================
export const AUDIT_ENDPOINTS = {
    LIST: '/api/system/audit-logs',
    DETAIL: (id: string) => `/api/system/audit-logs/${id}`,
    EXPORT_EXCEL: '/api/system/audit-logs/export-excel',
};
