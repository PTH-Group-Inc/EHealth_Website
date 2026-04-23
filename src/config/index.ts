/**
 * App Configuration
 * Cấu hình chung cho ứng dụng
 * 
 * @description
 * Tập trung các cấu hình để dễ dàng quản lý
 * Sử dụng environment variables cho các giá trị nhạy cảm
 */

// ============================================
// Environment Detection
// ============================================
export const ENV = {
    // 'development' | 'production' | 'test'
    NODE_ENV: process.env.NODE_ENV || 'development',
    // Custom env flag
    APP_ENV: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development',
    IS_DEV: (process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV) === 'development',
    IS_PROD: (process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV) === 'production',
};

// ============================================
// API Configuration — Tự động switch theo môi trường
//
// Priority:
//   1. NEXT_PUBLIC_API_URL từ .env.local (override thủ công)
//   2. NEXT_PUBLIC_API_URL từ .env.development / .env.production (auto load)
//   3. Fallback mặc định theo NODE_ENV
// ============================================
const DEFAULT_DEV_API = 'http://160.250.186.97:3000';
// Production: empty = same-origin (browser gọi /api/... cùng FE domain, Next.js rewrites proxy sang BE)
const DEFAULT_PROD_API = '';

export const API_CONFIG = {
    // URL của Backend API — tự động chọn theo môi trường
    // Ưu tiên NEXT_PUBLIC_API_URL (rỗng trong prod = same-origin relative URL → axios gọi /api/...)
    BASE_URL: process.env.NEXT_PUBLIC_API_URL !== undefined
        ? process.env.NEXT_PUBLIC_API_URL
        : (ENV.IS_PROD ? DEFAULT_PROD_API : DEFAULT_DEV_API),

    // Thời gian timeout cho mỗi request (30 giây)
    TIMEOUT: 30000,

    // Số lần thử lại khi request thất bại
    RETRY_COUNT: 3,
};

// Log API URL khi khởi động (dev mode only)
if (typeof window !== 'undefined' && ENV.IS_DEV) {
    // eslint-disable-next-line no-console
    console.log(`%c[EHealth] API: ${API_CONFIG.BASE_URL} (${ENV.APP_ENV})`, 'color:#3C81C6;font-weight:bold');
}

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
