/**
 * Format Utilities
 * Các hàm format dữ liệu
 */

// ============================================
// Format tiền VND
// ============================================
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

// Format số tiền rút gọn (1.5B, 25M, etc.)
export const formatCurrencyShort = (amount: number): string => {
    if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(1)} tỷ`;
    }
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)} triệu`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}k`;
    }
    return amount.toString();
};

// ============================================
// Format số
// ============================================
export const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
};

// ============================================
// Format ngày tháng
// ============================================
export const formatDate = (date: string | Date, format: 'short' | 'long' | 'full' = 'short'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;

    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
        short: { day: '2-digit', month: '2-digit', year: 'numeric' },
        long: { day: '2-digit', month: 'long', year: 'numeric' },
        full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
    };

    return d.toLocaleDateString('vi-VN', formatOptions[format]);
};

// Format thời gian
export const formatTime = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

// Format ngày giờ đầy đủ
export const formatDateTime = (date: string | Date): string => {
    return `${formatDate(date)} ${formatTime(date)}`;
};

// ============================================
// Format thời gian relative (1 giờ trước, 2 ngày trước, etc.)
// ============================================
export const formatRelativeTime = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return `${years} năm trước`;
    if (months > 0) return `${months} tháng trước`;
    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    if (seconds > 10) return `${seconds} giây trước`;
    return 'Vừa xong';
};

// ============================================
// Format số điện thoại
// ============================================
export const formatPhoneNumber = (phone: string): string => {
    // Loại bỏ các ký tự không phải số
    const cleaned = phone.replace(/\D/g, '');

    // Format theo định dạng Việt Nam: 0909 123 456
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }

    return phone;
};

// Ẩn một phần số điện thoại: 0909 *** 456
export const maskPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length >= 10) {
        return `${cleaned.slice(0, 4)} *** ${cleaned.slice(-3)}`;
    }

    return phone;
};

// ============================================
// Format kích thước file
// ============================================
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ============================================
// Format percentage
// ============================================
export const formatPercentage = (value: number, decimals: number = 0): string => {
    return `${value.toFixed(decimals)}%`;
};
