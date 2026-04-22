"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { UI_TEXT } from "@/constants/ui-text";
import type { User } from "@/types";

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newPassword?: string) => void;
    user: User | null;
}

export function ResetPasswordModal({
    isOpen,
    onClose,
    onSubmit,
    user,
}: ResetPasswordModalProps) {
    const [password, setPassword] = useState("");
    const [autoGenerate, setAutoGenerate] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(autoGenerate ? undefined : password);
    };

    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Đặt Lại Mật Khẩu`}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                    <h4 className="text-[14px] font-semibold text-[#121417] dark:text-white mb-1">
                        Cấp lại mật khẩu cho {user.fullName}
                    </h4>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
                        Tài khoản đăng nhập email: <span className="font-semibold text-gray-800 dark:text-gray-200">{user.email}</span>
                    </p>

                    <label className="flex items-center gap-3 mb-4 cursor-pointer">
                        <div className="relative flex items-center justify-center w-5 h-5">
                            <input 
                                type="checkbox" 
                                checked={autoGenerate}
                                onChange={(e) => setAutoGenerate(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 peer-checked:bg-[#3C81C6] peer-checked:border-[#3C81C6] transition-colors flex items-center justify-center">
                                {autoGenerate && <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>}
                            </div>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Sinh mật khẩu ngẫu nhiên & gửi qua Email</span>
                    </label>

                    {!autoGenerate && (
                        <div>
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Mật khẩu mới <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nhập tối thiểu 6 ký tự bảo mật"
                                    required={!autoGenerate}
                                    minLength={6}
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6] rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white"
                                />
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">password</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        {UI_TEXT.COMMON.CANCEL}
                    </button>
                    <button
                        type="submit"
                        disabled={!autoGenerate && password.length < 6}
                        className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none disabled:cursor-not-allowed rounded-xl shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5"
                    >
                        Xác Nhận
                        <span className="material-symbols-outlined text-[18px]">key</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}
