"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface DropdownMenuItem {
    label: string;
    icon?: string;
    onClick: () => void;
    variant?: "default" | "danger";
}

interface DropdownMenuProps {
    items: DropdownMenuItem[];
    trigger?: React.ReactNode;
}

export function DropdownMenu({ items, trigger }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [openUpward, setOpenUpward] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Estimate or measure actual menu height
            const menuHeight = menuRef.current ? menuRef.current.offsetHeight : (items.length * 40 + 20);
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldOpenUpward = spaceBelow < menuHeight + 10 && rect.top > menuHeight + 10;
            
            setOpenUpward(shouldOpenUpward);
            setCoords({
                top: shouldOpenUpward ? rect.top - menuHeight - 6 : rect.bottom + 6,
                left: Math.max(12, rect.right - 224),
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            // Request animation frame or timeout to measure offsetHeight correctly on next tick after render
            const timer = setTimeout(updatePosition, 0);
            
            // Listen to scroll events on any elements (using useCapture = true)
            window.addEventListener("scroll", updatePosition, true);
            window.addEventListener("resize", updatePosition);
            
            return () => {
                clearTimeout(timer);
                window.removeEventListener("scroll", updatePosition, true);
                window.removeEventListener("resize", updatePosition);
            };
        }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                {trigger || <span className="material-symbols-outlined text-[20px]">more_vert</span>}
            </button>

            {isOpen && mounted && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: "fixed",
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                    }}
                    className="w-56 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-[9999] p-1.5 animate-in fade-in zoom-in-95 duration-100"
                >
                    <div className="flex flex-col gap-0.5">
                    {items.map((item, index) => {
                        const isDanger = item.variant === "danger";
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-[14px] rounded-lg transition-all duration-200 ${
                                    isDanger
                                        ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            >
                                {item.icon && (
                                    <span 
                                        className={`material-symbols-outlined text-[20px] ${
                                            isDanger ? "text-red-500" : "text-gray-400 dark:text-gray-500"
                                        }`}
                                    >
                                        {item.icon}
                                    </span>
                                )}
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
