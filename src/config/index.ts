/**
 * App Configuration
 * Cấu hình chung cho ứng dụng
 * 
 * @description
 * Tập trung các cấu hình để dễ dàng quản lý
 * Sử dụng environment variables cho các giá trị nhạy cảm
 */

// ============================================
// API Configuration
// Cấu hình kết nối API Backend
// ============================================
export const API_CONFIG = {
    // URL của Backend API (lấy từ env hoặc dùng giá trị mặc định)
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',

    // Thời gian timeout cho mỗi request (30 giây)
    TIMEOUT: 30000,

    // Số lần thử lại khi request thất bại
    RETRY_COUNT: 3,
};

// ============================================
// App Configuration  
// Cấu hình ứng dụng
// ============================================
export const APP_CONFIG = {
    // Tên ứng dụng
    APP_NAME: 'E-Health',

    // Mô tả
    APP_DESCRIPTION: 'Hệ thống quản lý y tế số',

    // Phiên bản
    VERSION: '1.0.0',

    // Số item trên mỗi trang (phân trang)
    DEFAULT_PAGE_SIZE: 10,

    // Các kích thước trang có thể chọn
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// ============================================
// Auth Configuration
// Cấu hình xác thực
// ============================================
export const AUTH_CONFIG = {
    // Key lưu trữ trong localStorage
    ACCESS_TOKEN_KEY: 'accessToken',
    REFRESH_TOKEN_KEY: 'refreshToken',
    USER_KEY: 'user',

    // Thời gian (phút) trước khi access token hết hạn để refresh
    REFRESH_BEFORE_EXPIRE_MINUTES: 5,
};

// ============================================
// Date/Time Configuration
// Cấu hình ngày giờ
// ============================================
export const DATE_CONFIG = {
    // Format hiển thị ngày
    DATE_FORMAT: 'DD/MM/YYYY',

    // Format hiển thị ngày giờ
    DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',

    // Format hiển thị giờ
    TIME_FORMAT: 'HH:mm',

    // Locale mặc định
    LOCALE: 'vi-VN',
};

// ============================================
// File Upload Configuration
// Cấu hình upload file
// ============================================
export const UPLOAD_CONFIG = {
    // Kích thước file tối đa (5MB)
    MAX_FILE_SIZE: 5 * 1024 * 1024,

    // Các định dạng ảnh được chấp nhận
    ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

    // Các định dạng document được chấp nhận
    ACCEPTED_DOC_TYPES: ['application/pdf', 'application/msword'],
};
