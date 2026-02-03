/**
 * Validation Utilities
 * Các hàm validate dữ liệu
 */

// ============================================
// Validate Email
// ============================================
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// ============================================
// Validate số điện thoại Việt Nam
// ============================================
export const isValidPhoneNumber = (phone: string): boolean => {
    // Số điện thoại VN: 10 số, bắt đầu bằng 0
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

// ============================================
// Validate password
// ============================================
export interface PasswordValidation {
    isValid: boolean;
    errors: string[];
}

export const validatePassword = (password: string): PasswordValidation => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Mật khẩu phải chứa ít nhất 1 chữ hoa');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Mật khẩu phải chứa ít nhất 1 chữ thường');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Mật khẩu phải chứa ít nhất 1 số');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// ============================================
// Validate required field
// ============================================
export const isRequired = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
};

// ============================================
// Validate min/max length
// ============================================
export const hasMinLength = (value: string, min: number): boolean => {
    return value.length >= min;
};

export const hasMaxLength = (value: string, max: number): boolean => {
    return value.length <= max;
};

// ============================================
// Validate CMND/CCCD
// ============================================
export const isValidIdNumber = (id: string): boolean => {
    // CMND cũ: 9 số, CCCD mới: 12 số
    const idRegex = /^([0-9]{9}|[0-9]{12})$/;
    return idRegex.test(id.replace(/\s/g, ''));
};

// ============================================
// Validate URL
// ============================================
export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// ============================================
// Validate ngày sinh
// ============================================
export const isValidBirthDate = (date: string | Date): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();

    // Phải là ngày trong quá khứ
    if (d >= now) return false;

    // Không được quá 150 tuổi
    const maxAge = 150;
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - maxAge);
    if (d < minDate) return false;

    return true;
};
