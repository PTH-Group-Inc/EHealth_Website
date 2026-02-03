/**
 * Modal Component
 * Component modal dialog tái sử dụng
 */

"use client";

import { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/utils/helpers';

// ============================================
// Types
// ============================================

export interface ModalProps {
    /** Trạng thái mở/đóng */
    isOpen: boolean;
    /** Callback khi đóng modal */
    onClose: () => void;
    /** Tiêu đề modal */
    title?: string;
    /** Kích thước modal */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Cho phép đóng khi click overlay */
    closeOnOverlayClick?: boolean;
    /** Hiển thị nút đóng */
    showCloseButton?: boolean;
    /** Footer content */
    footer?: ReactNode;
    /** Content */
    children: ReactNode;
}

// ============================================
// Size styles
// ============================================

const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
};

// ============================================
// Component
// ============================================

export function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    closeOnOverlayClick = true,
    showCloseButton = true,
    footer,
    children,
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Đóng modal khi nhấn Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Không render nếu modal đóng
    if (!isOpen) return null;

    // Xử lý click overlay
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={handleOverlayClick}
        >
            <div
                ref={modalRef}
                className={cn(
                    'w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl',
                    'animate-scale-in',
                    sizeStyles[size]
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        {title && (
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    close
                                </span>
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modal;
