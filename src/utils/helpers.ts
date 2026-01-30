/**
 * Helper Utilities
 * Các hàm tiện ích chung
 */

// ============================================
// Generate unique ID
// ============================================
export const generateId = (prefix: string = ''): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}-${timestamp}${random}` : `${timestamp}${random}`;
};

// ============================================
// Deep clone object
// ============================================
export const deepClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

// ============================================
// Debounce function
// Trì hoãn thực thi function
// ============================================
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
};

// ============================================
// Throttle function
// Giới hạn tần suất thực thi function
// ============================================
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
};

// ============================================
// Capitalize first letter
// ============================================
export const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// ============================================
// Slugify string
// ============================================
export const slugify = (str: string): string => {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

// ============================================
// Get initials from name
// Lấy chữ cái đầu từ tên
// ============================================
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

// ============================================
// Sleep / Delay
// ============================================
export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

// ============================================
// Check if value is empty
// ============================================
export const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

// ============================================
// Group array by key
// ============================================
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {} as Record<string, T[]>);
};

// ============================================
// Sort array by key
// ============================================
export const sortBy = <T>(
    array: T[],
    key: keyof T,
    order: 'asc' | 'desc' = 'asc'
): T[] => {
    return [...array].sort((a, b) => {
        const valueA = a[key];
        const valueB = b[key];

        if (valueA < valueB) return order === 'asc' ? -1 : 1;
        if (valueA > valueB) return order === 'asc' ? 1 : -1;
        return 0;
    });
};

// ============================================
// Get random item from array
// ============================================
export const randomItem = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
};

// ============================================
// Chunk array into smaller arrays
// ============================================
export const chunk = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

// ============================================
// Remove duplicates from array
// ============================================
export const unique = <T>(array: T[]): T[] => {
    return Array.from(new Set(array));
};

// Unique by key
export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
    const seen = new Set();
    return array.filter((item) => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
};

// ============================================
// Classname helper (tương tự clsx)
// ============================================
export const cn = (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
};

// ============================================
// Copy to clipboard
// ============================================
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

// ============================================
// Download file from URL
// ============================================
export const downloadFile = (url: string, filename: string): void => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ============================================
// Parse query string to object
// ============================================
export const parseQueryString = (queryString: string): Record<string, string> => {
    const params = new URLSearchParams(queryString);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
        result[key] = value;
    });
    return result;
};

// ============================================
// Convert object to query string
// ============================================
export const toQueryString = (obj: Record<string, any>): string => {
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
        }
    });
    return params.toString();
};
