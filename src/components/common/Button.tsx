/**
 * Button Component
 * Component nút bấm tái sử dụng
 * 
 * @description
 * Hỗ trợ nhiều variants và sizes
 */

"use client";

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/helpers';

// ============================================
// Types
// ============================================

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Kiểu hiển thị của button */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    /** Kích thước button */
    size?: 'sm' | 'md' | 'lg';
    /** Hiển thị trạng thái loading */
    loading?: boolean;
    /** Icon bên trái */
    leftIcon?: ReactNode;
    /** Icon bên phải */
    rightIcon?: ReactNode;
    /** Chiều rộng full */
    fullWidth?: boolean;
    children: ReactNode;
}

// ============================================
// Styles
// ============================================

const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
`;

const variantStyles = {
    primary: 'bg-[#3C81C6] hover:bg-[#2a6da8] text-white focus:ring-[#3C81C6]',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:text-gray-200 dark:hover:bg-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
};

const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

// ============================================
// Component
// ============================================

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && 'w-full',
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {/* Loading spinner */}
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            )}

            {/* Left icon */}
            {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}

            {/* Text */}
            <span>{children}</span>

            {/* Right icon */}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </button>
    );
}

export default Button;
