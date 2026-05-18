/**
 * Toast Context
 * Quản lý thông báo (toast notifications) toàn ứng dụng
 * 
 * @description
 * - Hiển thị thông báo success, error, warning, info
 * - Tự động ẩn sau thời gian cài đặt
 */

"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================
// Types
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'ai';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: (id: string) => void;

    // Shortcuts
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
    aiAlert: (message: string) => void;
}

// ============================================
// Context
// ============================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

interface ToastProviderProps {
    children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    // ============================================
    // Ẩn toast
    // ============================================
    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    // ============================================
    // Hiển thị toast
    // ============================================
    const showToast = useCallback((
        message: string,
        type: ToastType = 'info',
        duration: number = 3000
    ) => {
        const id = `toast-${Date.now()}-${Math.random()}`;

        const newToast: Toast = {
            id,
            type,
            message,
            duration,
        };

        setToasts((prev) => [...prev, newToast]);

        // Tự động ẩn sau thời gian duration
        setTimeout(() => {
            hideToast(id);
        }, duration);
    }, [hideToast]);

    // ============================================
    // Shortcuts
    // ============================================
    const success = useCallback((message: string) => {
        showToast(message, 'success');
    }, [showToast]);

    const error = useCallback((message: string) => {
        showToast(message, 'error', 5000); // Error hiển thị lâu hơn
    }, [showToast]);

    const warning = useCallback((message: string) => {
        showToast(message, 'warning');
    }, [showToast]);

    const info = useCallback((message: string) => {
        showToast(message, 'info');
    }, [showToast]);

    const aiAlert = useCallback((message: string) => {
        showToast(message, 'ai', 8000);
    }, [showToast]);

    // ============================================
    // Context Value
    // ============================================
    const value: ToastContextType = {
        toasts,
        showToast,
        hideToast,
        success,
        error,
        warning,
        info,
        aiAlert,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// ============================================
// Toast Item Component
// ============================================

interface ToastItemProps {
    toast: Toast;
    onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
    // AI type gets special treatment
    if (toast.type === 'ai') {
        return (
            <div className="bg-violet-50 border border-violet-300 text-violet-800 dark:bg-violet-950/30 dark:border-violet-800 dark:text-violet-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[400px] animate-slide-in">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                <p className="flex-1 text-sm">{toast.message}</p>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-violet-200/50 dark:hover:bg-violet-800/50 rounded transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>
        );
    }

    // Màu sắc theo type
    const colors: Record<Exclude<ToastType, 'ai'>, string> = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };

    // Icon theo type
    const icons: Record<Exclude<ToastType, 'ai'>, string> = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info',
    };

    const colorClass = colors[toast.type as Exclude<ToastType, 'ai'>] ?? 'bg-blue-500';
    const iconName = icons[toast.type as Exclude<ToastType, 'ai'>] ?? 'info';

    return (
        <div
            className={`${colorClass} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[400px] animate-slide-in`}
        >
            <span className="material-symbols-outlined text-[20px]">
                {iconName}
            </span>
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
        </div>
    );
}

// ============================================
// Custom Hook
// ============================================

export function useToast() {
    const context = useContext(ToastContext);

    if (context === undefined) {
        throw new Error('useToast phải được sử dụng bên trong ToastProvider');
    }

    return context;
}

export default ToastContext;
