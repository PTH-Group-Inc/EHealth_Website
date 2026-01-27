/**
 * UI Text constants - Tất cả labels, text được định nghĩa tại đây
 * KHÔNG hard-code text strings trong components
 */

export const UI_TEXT = {
    // App common
    APP: {
        NAME: "E-Health Admin",
        TAGLINE: "Hệ thống Y tế Số",
    },

    // Auth
    AUTH: {
        LOGIN_BUTTON: "Đăng nhập",
        LOGOUT_BUTTON: "Đăng xuất",
        FORGOT_PASSWORD: "Quên mật khẩu?",
        EMAIL_PLACEHOLDER: "Nhập email của bạn",
        PASSWORD_PLACEHOLDER: "Nhập mật khẩu",
    },

    // Common buttons & actions
    COMMON: {
        SAVE: "Lưu",
        CANCEL: "Hủy",
        DELETE: "Xóa",
        EDIT: "Sửa",
        CREATE: "Tạo mới",
        ADD: "Thêm",
        SEARCH: "Tìm kiếm",
        FILTER: "Bộ lọc",
        EXPORT: "Xuất dữ liệu",
        IMPORT: "Nhập dữ liệu",
        REFRESH: "Làm mới",
        BACK: "Quay lại",
        NEXT: "Tiếp theo",
        PREVIOUS: "Trước",
        VIEW_ALL: "Xem tất cả",
        VIEW_DETAILS: "Xem chi tiết",
        CLOSE: "Đóng",
        CONFIRM: "Xác nhận",
        LOADING: "Đang tải...",
        NO_DATA: "Không có dữ liệu",
        ACTIONS: "Hành động",
    },

    // Admin pages
    ADMIN: {
        // Dashboard
        DASHBOARD: {
            TITLE: "Tổng quan hệ thống",
            SUBTITLE: "Xin chào, đây là báo cáo hoạt động ngày hôm nay.",
            TOTAL_REVENUE: "Tổng doanh thu",
            TODAY_VISITS: "Lượt khám hôm nay",
            DOCTORS_ON_DUTY: "Bác sĩ trực",
            MEDICINE_ALERTS: "Cảnh báo kho thuốc",
            PATIENT_GROWTH: "Tăng trưởng bệnh nhân",
            DEPARTMENT_STATUS: "Trạng thái Khoa phòng",
            RECENT_ACTIVITIES: "Hoạt động hệ thống mới nhất",
        },

        // Users
        USERS: {
            TITLE: "Người dùng & Phân quyền",
            SUBTITLE: "Quản lý danh sách tài khoản, vai trò và phân quyền truy cập hệ thống.",
            ADD_USER: "Thêm người dùng",
            CONFIGURE_PERMISSIONS: "Thiết lập quyền",
            TOTAL_USERS: "Tổng người dùng",
            ACTIVE_USERS: "Đang hoạt động",
            ROLES_COUNT: "Vai trò (Roles)",
            LOCKED_USERS: "Bị khóa",
            SEARCH_PLACEHOLDER: "Tìm kiếm tài khoản, email...",
            ALL_ROLES: "Tất cả vai trò",
        },

        // Doctors
        DOCTORS: {
            TITLE: "Quản lý Nhân sự & Bác sĩ",
            SUBTITLE: "Theo dõi, quản lý thông tin và lịch làm việc của đội ngũ y bác sĩ.",
            ADD_DOCTOR: "Thêm bác sĩ mới",
            CONFIGURE_SLOTS: "Cấu hình khung giờ",
            TOTAL_DOCTORS: "Tổng số bác sĩ",
            ON_DUTY: "Bác sĩ đang trực",
            PENDING_ASSIGNMENT: "Chờ phân công",
            AVG_PERFORMANCE: "Hiệu suất trung bình",
            SEARCH_PLACEHOLDER: "Tìm kiếm theo tên, mã bác sĩ...",
        },

        // Departments
        DEPARTMENTS: {
            TITLE: "Quản lý Chuyên khoa",
            SUBTITLE: "Danh sách các chuyên khoa và quản lý thông tin khoa trong bệnh viện.",
            ADD_DEPARTMENT: "Thêm chuyên khoa mới",
            TOTAL_DEPARTMENTS: "Tổng số chuyên khoa",
            ACTIVE_DEPARTMENTS: "Đang hoạt động",
            TOTAL_DOCTORS: "Tổng số bác sĩ",
            TOTAL_PATIENTS: "Tổng bệnh nhân",
            ACTIVE: "Đang hoạt động",
            MAINTENANCE: "Bảo trì / Tạm ngưng",
            TOTAL_STAFF: "Tổng nhân sự",
            SEARCH_PLACEHOLDER: "Tìm kiếm tên khoa, mã khoa...",
        },

        // Medicines
        MEDICINES: {
            TITLE: "Quản lý Master Data Thuốc",
            SUBTITLE: "Danh sách thuốc, quản lý kho và theo dõi Master Data sản phẩm y tế.",
            ADD_MEDICINE: "Thêm thuốc mới",
            IMPORT_EXCEL: "Nhập thuốc Excel",
            TOTAL_MEDICINES: "Tổng danh mục thuốc",
            LOW_STOCK: "Tồn kho thấp",
            EXPIRING_SOON: "Hết hạn trong 30 ngày",
            TOTAL_VALUE: "Tổng giá trị kho",
            SEARCH_PLACEHOLDER: "Tìm kiếm tên thuốc, hoạt chất, mã thuốc...",
            ALL_CATEGORIES: "Tất cả danh mục",
        },

        // Schedules
        SCHEDULES: {
            TITLE: "Quản lý Lịch trực",
            SUBTITLE: "Phân công và quản lý lịch trực của đội ngũ y bác sĩ.",
        },

        // Statistics
        STATISTICS: {
            TITLE: "Thống kê & Báo cáo",
            SUBTITLE: "Xem các báo cáo thống kê hoạt động của bệnh viện.",
        },

        // Activity Logs
        ACTIVITY_LOGS: {
            TITLE: "Nhật ký hoạt động",
            SUBTITLE: "Theo dõi lịch sử các hoạt động trên hệ thống.",
        },
    },

    // Status labels
    STATUS: {
        ACTIVE: "Đang hoạt động",
        INACTIVE: "Không hoạt động",
        LOCKED: "Đã khóa",
        OFFLINE: "Offline",
        ONLINE: "Online",
        ON_LEAVE: "Nghỉ phép",
        EXAMINING: "Đang khám",
        MAINTENANCE: "Bảo trì",
        SUSPENDED: "Tạm ngưng",
        IN_BUSINESS: "Đang kinh doanh",
        OUT_OF_STOCK: "Hết hàng",
        LOW_STOCK: "Tồn kho thấp",
    },

    // Table
    TABLE: {
        SHOWING: "Hiển thị",
        TO: "đến",
        OF: "trong tổng số",
        RESULTS: "kết quả",
        NO_RESULTS: "Không tìm thấy kết quả",
    },

    // Breadcrumb
    BREADCRUMB: {
        HOME: "Trang chủ",
    },
} as const;
