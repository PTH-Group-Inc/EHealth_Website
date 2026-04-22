"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface CustomSelectOption {
    id: string | number;
    name: string;
}

interface CustomSelectProps {
    options: CustomSelectOption[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    icon?: string;
    disabled?: boolean;
    loading?: boolean;
}

export function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "-- Chọn --",
    icon,
    disabled = false,
    loading = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => String(opt.id) === String(value));

    return (
        <div className={`relative w-full text-[#121417] dark:text-gray-300 ${isOpen ? 'z-[60]' : 'z-10'}`} ref={containerRef}>
            <button
                type="button"
                className={`w-full flex items-center justify-between py-3.5 ${icon ? 'pl-11' : 'pl-4'} pr-4 text-sm font-medium border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 ${
                    disabled || loading
                        ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed opacity-70"
                        : "bg-white dark:bg-[#0d1117] border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#161b22] cursor-pointer shadow-sm text-[#121417] dark:text-white"
                }`}
                onClick={() => {
                    if (!disabled && !loading) setIsOpen((prev) => !prev);
                }}
            >
                {icon && (
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-4 transition-colors ${
                        disabled || loading ? "text-gray-400" : "text-[#3C81C6]"
                    }`}>
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </span>
                )}
                
                <span className={`block truncate ${!selectedOption ? (disabled || loading ? "text-gray-400" : "text-gray-500 font-normal") : "font-semibold"}`}>
                    {loading ? "Đang tải..." : selectedOption ? selectedOption.name : placeholder}
                </span>

                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    keyboard_arrow_down
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-black/50 overflow-hidden transform origin-top"
                    >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {options.length === 0 ? (
                                <div className="p-3 text-sm text-center text-gray-500">
                                    Không có dữ liệu
                                </div>
                            ) : (
                                options.map((opt) => (
                                    <div
                                        key={opt.id}
                                        className={`px-4 py-2.5 my-0.5 text-sm font-medium rounded-lg cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                                            String(opt.id) === String(value)
                                                ? "bg-blue-50 dark:bg-blue-900/20 text-[#3C81C6]"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        }`}
                                        onClick={() => {
                                            onChange(opt.id);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <span className="truncate">{opt.name}</span>
                                        {String(opt.id) === String(value) && (
                                            <span className="material-symbols-outlined text-[18px]">check</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
