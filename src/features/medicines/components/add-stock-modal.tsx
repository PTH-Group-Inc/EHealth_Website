"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { UI_TEXT } from "@/constants/ui-text";
import type { Medicine } from "@/types";

interface AddStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    medicine: Medicine | null;
    onSubmit: (medicineId: string, quantity: number, note: string) => void;
}

export function AddStockModal({ isOpen, onClose, medicine, onSubmit }: AddStockModalProps) {
    const [quantity, setQuantity] = useState(10);
    const [note, setNote] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (medicine && quantity > 0) {
            onSubmit(medicine.id, quantity, note);
            setQuantity(10);
            setNote("");
            onClose();
        }
    };

    if (!medicine) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nhập thêm kho" size="md">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Medicine Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-sm text-[#687582] dark:text-gray-400">Thuốc đang chọn:</p>
                    <p className="text-base font-bold text-[#121417] dark:text-white mt-1">{medicine.name}</p>
                    <p className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">
                        {medicine.code} • Tồn kho hiện tại: <span className="font-medium text-[#121417] dark:text-white">{medicine.stock}</span> {medicine.unit}
                    </p>
                </div>

                {/* Quantity */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Số lượng nhập thêm <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 10))}
                            className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-[#687582] flex items-center justify-center transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">remove</span>
                        </button>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                            min="1"
                            className="flex-1 px-4 py-3 text-center text-lg font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={() => setQuantity(quantity + 10)}
                            className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-[#687582] flex items-center justify-center transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                    </div>
                    <p className="text-xs text-[#687582] dark:text-gray-400 mt-2">
                        Sau khi nhập: <span className="font-medium text-green-600">{medicine.stock + quantity}</span> {medicine.unit}
                    </p>
                </div>

                {/* Quick buttons */}
                <div className="flex gap-2">
                    {[10, 20, 50, 100].map((num) => (
                        <button
                            key={num}
                            type="button"
                            onClick={() => setQuantity(num)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${quantity === num
                                    ? "bg-[#3C81C6] text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-[#687582] hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                        >
                            +{num}
                        </button>
                    ))}
                </div>

                {/* Note */}
                <div>
                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">
                        Ghi chú
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none"
                        placeholder="Lý do nhập kho, số lô, ngày sản xuất..."
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        {UI_TEXT.COMMON.CANCEL}
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md shadow-green-200 dark:shadow-none transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_box</span>
                        Nhập kho
                    </button>
                </div>
            </form>
        </Modal>
    );
}
