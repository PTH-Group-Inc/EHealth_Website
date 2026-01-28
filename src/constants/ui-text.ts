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

    // Doctor Portal pages
    DOCTOR: {
        // Dashboard
        DASHBOARD: {
            TITLE: "Tổng quan",
            SUBTITLE: "Xin chào, đây là báo cáo hoạt động của bạn hôm nay.",
            TODAY_EXAMS: "Số ca khám hôm nay",
            WAITING_PATIENTS: "Bệnh nhân đang đợi",
            PERSONAL_REVENUE: "Doanh thu cá nhân",
            WEEKLY_STATS: "Thống kê lượt khám tuần này",
            TODAY_SCHEDULE: "Lịch trình hôm nay",
            HOSPITAL_ANNOUNCEMENTS: "Thông báo từ Bệnh viện",
        },

        // Appointments
        APPOINTMENTS: {
            TITLE: "Quản lý Lịch hẹn",
            SUBTITLE: "Xem và quản lý lịch hẹn khám bệnh.",
            NEW_APPOINTMENT: "Đặt lịch mới",
            PENDING_REQUESTS: "Yêu cầu chờ xác nhận",
            MANAGE_SLOTS: "Quản lý khung giờ trống",
            ACCEPT: "Chấp nhận",
            REJECT: "Từ chối",
            ONLINE_CONSULTATION: "Tư vấn Online",
            IN_PERSON: "Khám trực tiếp",
            TODAY: "Hôm nay",
            WEEK: "Tuần",
            MONTH: "Tháng",
        },

        // Queue
        QUEUE: {
            TITLE: "Hàng đợi thăm khám",
            SUBTITLE: "Quản lý hàng đợi bệnh nhân chờ khám.",
            REMAINING_PATIENTS: "Bệnh nhân còn lại",
            WAITING: "Đang chờ khám",
            EXAMINING: "Đang khám",
            COMPLETED: "Đã hoàn thành",
            CANCELLED: "Đã hủy",
            CALL_PATIENT: "Gọi bệnh nhân",
            START_EXAM: "Bắt đầu khám",
            VIEW_DETAILS: "Chi tiết",
            SEARCH_PLACEHOLDER: "Tìm kiếm bệnh nhân (Tên, Mã BN, SĐT)...",
            AVG_WAIT_TIME: "Chờ TB",
        },

        // Examination
        EXAMINATION: {
            TITLE: "Khám bệnh",
            SUBTITLE: "Thực hiện khám và ghi nhận thông tin bệnh nhân.",
            VITAL_SIGNS: "Sinh hiệu",
            PULSE: "Mạch (bpm)",
            BLOOD_PRESSURE: "Huyết áp (mmHg)",
            TEMPERATURE: "Nhiệt độ (°C)",
            SPO2: "SpO2 (%)",
            WEIGHT: "Cân nặng (kg)",
            CLINICAL_EXAM: "Khám lâm sàng",
            SYMPTOMS: "Triệu chứng cơ năng & Lý do khám",
            PHYSICAL_EXAM: "Triệu chứng thực thể (Khám)",
            DIAGNOSIS: "Chẩn đoán",
            ICD_CODE: "Mã bệnh (ICD-10)",
            PRELIMINARY_DIAGNOSIS: "Chẩn đoán sơ bộ",
            AI_SUMMARY: "AI Tóm tắt bệnh án",
            ALLERGIES_WARNING: "Dị ứng & Cảnh báo",
            MEDICAL_HISTORY: "Tiền sử bệnh lý",
            PRESCRIPTION_HISTORY: "Lịch sử đơn thuốc",
            PATIENT_HISTORY: "Lịch sử khám",
            PRINT_FORM: "In phiếu",
            SAVE_DRAFT: "Lưu nháp",
            CREATE_PRESCRIPTION: "Kê đơn thuốc",
            FINISH_EXAM: "Kết thúc khám",
            START_TIME: "Bắt đầu",
            DURATION: "Thời gian",
        },

        // Medical Records
        MEDICAL_RECORDS: {
            TITLE: "Hồ sơ bệnh án",
            SUBTITLE: "Quản lý và xem hồ sơ bệnh án của các bệnh nhân.",
            PATIENT_LIST: "Danh sách bệnh nhân",
            SEARCH_PLACEHOLDER: "Tìm tên, mã BN, SĐT...",
            ALL: "Tất cả",
            RECENT: "Gần đây",
            INPATIENT: "Nội trú",
            STARRED: "Đánh dấu sao",
            TIMELINE: "Timeline bệnh sử",
            LAB_RESULTS: "Kết quả Cận lâm sàng & Hình ảnh",
            EXPORT_REPORT: "Xuất báo cáo",
            VIEW_FULL_RECORD: "Xem bệnh án chi tiết",
            LAST_UPDATED: "Dữ liệu được cập nhật lần cuối",
            JUST_NOW: "Vừa xong",
        },

        // Prescriptions
        PRESCRIPTIONS: {
            TITLE: "Danh sách đơn thuốc",
            SUBTITLE: "Quản lý và theo dõi lịch sử kê đơn.",
            NEW_PRESCRIPTION: "Tạo đơn mới",
            SEARCH_PLACEHOLDER: "Tìm thuốc nhanh từ kho dược...",
            TODAY_PRESCRIPTIONS: "Tổng đơn thuốc hôm nay",
            PENDING_DISPENSE: "Chờ cấp phát",
            COMPLETED: "Đã hoàn thành",
            THIS_MONTH: "Tháng này",
            ALL_STATUS: "Tất cả trạng thái",
            PRESCRIPTION_ID: "Mã đơn",
            PATIENT: "Bệnh nhân",
            DIAGNOSIS: "Chẩn đoán",
            DATE: "Ngày kê",
            MAIN_MEDICINE: "Thuốc chính",
            STATUS: "Trạng thái",
        },

        // Reports
        REPORTS: {
            TITLE: "Báo cáo & Thống kê",
            SUBTITLE: "Xem thống kê hoạt động khám chữa bệnh của bạn.",
            TIME_FILTER: "Bộ lọc thời gian",
            THIS_WEEK: "Tuần này",
            THIS_MONTH: "Tháng này",
            THIS_QUARTER: "Quý này",
            TOTAL_EXAMS: "Tổng lượt khám",
            REVENUE: "Doanh thu",
            EXAMS_PER_DAY: "Số ca/ngày",
            AVG_RATING: "Đánh giá TB",
            EXAM_TREND: "Xu hướng khám theo thời gian",
            DISEASE_RATIO: "Tỷ lệ bệnh lý",
            TOP_DISEASES: "Top bệnh lý thường gặp",
            EXPORT_PDF: "Xuất PDF",
            EXPORT_EXCEL: "Xuất Excel",
        },

        // Settings
        SETTINGS: {
            TITLE: "Cài đặt",
            SUBTITLE: "Quản lý thông tin cá nhân và cài đặt hệ thống.",
            PROFILE: "Hồ sơ cá nhân",
            PROFILE_INFO: "Thông tin cá nhân",
            PASSWORD: "Mật khẩu",
            CHANGE_PASSWORD: "Đổi mật khẩu",
            CURRENT_PASSWORD: "Mật khẩu hiện tại",
            NEW_PASSWORD: "Mật khẩu mới",
            CONFIRM_PASSWORD: "Xác nhận mật khẩu",
            UPDATE_PASSWORD: "Cập nhật mật khẩu",
            NOTIFICATIONS: "Cài đặt thông báo",
            NOTIFICATION_SETTINGS: "Cài đặt thông báo",
            WORKING_HOURS: "Khung giờ làm việc",
            MANAGE_SCHEDULE: "Quản lý lịch làm việc",
            APPEARANCE: "Giao diện",
            APPEARANCE_SETTINGS: "Cài đặt giao diện",
            DARK_MODE: "Chế độ tối",
            LIGHT_MODE: "Chế độ sáng",
            SAVE_CHANGES: "Lưu thay đổi",
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
