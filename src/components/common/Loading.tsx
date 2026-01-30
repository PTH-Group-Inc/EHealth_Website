/**
 * Loading Component
 * Component hiển thị trạng thái loading
 */

"use client";

import { cn } from '@/utils/helpers';

// ============================================
// Types
// ============================================

export interface LoadingProps {
    /** Kích thước spinner */
    size?: 'sm' | 'md' | 'lg';
    /** Hiển thị toàn trang */
    fullScreen?: boolean;
    /** Text loading */
    text?: string;
}

// ============================================
// Size styles
// ============================================

const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
};

// ============================================
// Component
// ============================================

export function Loading({ size = 'md', fullScreen = false, text }: LoadingProps) {
    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <div
                className={cn(
                    'rounded-full animate-spin',
                    'border-[#3C81C6] border-t-transparent',
                    sizeStyles[size]
                )}
            />
            {text && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    return spinner;
}

// ============================================
// Page Loading - Loading cho toàn trang
// ============================================

export function PageLoading() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loading size="lg" text="Đang tải..." />
        </div>
    );
}

// ============================================
// Skeleton - Loading placeholder
// ============================================

export interface SkeletonProps {
    /** Chiều rộng */
    width?: string | number;
    /** Chiều cao */
    height?: string | number;
    /** Bo tròn */
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    /** Số lượng skeleton */
    count?: number;
    /** Khoảng cách giữa các skeleton */
    gap?: number;
}

const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
};

export function Skeleton({
    width = '100%',
    height = '20px',
    rounded = 'md',
    count = 1,
    gap = 2,
}: SkeletonProps) {
    const style = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    if (count === 1) {
        return (
            <div
                className={cn(
                    'bg-gray-200 dark:bg-gray-700 animate-pulse',
                    roundedStyles[rounded]
                )}
                style={style}
            />
        );
    }

    return (
        <div className={`flex flex-col gap-${gap}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'bg-gray-200 dark:bg-gray-700 animate-pulse',
                        roundedStyles[rounded]
                    )}
                    style={style}
                />
            ))}
        </div>
    );
}

export default Loading;
