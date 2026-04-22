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
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
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
                </div>
            )}
        </div>
    );
}
