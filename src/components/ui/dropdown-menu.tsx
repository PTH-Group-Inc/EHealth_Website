"use client";

import { useState, useRef, useEffect } from "react";

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
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                {trigger || <span className="material-symbols-outlined text-[20px]">more_vert</span>}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                item.onClick();
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${item.variant === "danger"
                                    ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    : "text-[#121417] dark:text-white"
                                }`}
                        >
                            {item.icon && (
                                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                            )}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
