"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { UI_TEXT } from "@/constants/ui-text";
import { branchService, type Branch } from "@/services/branchService";
import { getDepartments, type Department } from "@/services/departmentService";
import type { User } from "@/types";

interface AssignFacilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { branchId: string; departmentId?: string; roleTitle?: string }) => void;
    user: User | null;
}

export function AssignFacilityModal({
    isOpen,
    onClose,
    onSubmit,
    user,
}: AssignFacilityModalProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    
    const [formData, setFormData] = useState({
        branchId: "",
        departmentId: "",
        roleTitle: "",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({ branchId: "", departmentId: "", roleTitle: "" });
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [branchesRes, deptsRes] = await Promise.all([
                branchService.getDropdown(),
                getDepartments({ limit: 100 })
            ]);
            setBranches(branchesRes.data || []);
            setDepartments(deptsRes.data || []);
        } catch (error) {
            console.error("Failed to load facilities", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            branchId: formData.branchId,
            departmentId: formData.departmentId || undefined,
            roleTitle: formData.roleTitle || undefined,
        });
    };

    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Gán Cơ Sở Y Tế`}
            size="md"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                    <h4 className="text-[14px] font-semibold text-[#121417] dark:text-white mb-1">
                        Nhân sự: {user.fullName}
                    </h4>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
                        Chọn chi nhánh và khoa phòng làm việc cho nhân viên này.
                    </p>

                    {loading ? (
                        <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C81C6]"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                    Chi nhánh <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    title="Chọn chi nhánh"
                                    value={formData.branchId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                                    className="w-full px-5 py-3.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6] focus:border-[#3C81C6] text-sm text-[#121417] dark:text-white shadow-sm transition-all"
                                >
                                    <option value="" disabled>-- Chọn chi nhánh --</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                    Khoa / Phòng ban (Tùy chọn)
                                </label>
                                <select
                                    title="Chọn khoa/phòng ban"
                                    value={formData.departmentId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                                    className="w-full px-5 py-3.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6] focus:border-[#3C81C6] text-sm text-[#121417] dark:text-white shadow-sm transition-all"
                                >
                                    <option value="">-- Có thể để trống --</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                    Chức danh tại cơ sở (Tùy chọn)
                                </label>
                                <input
                                    type="text"
                                    value={formData.roleTitle}
                                    onChange={(e) => setFormData(prev => ({ ...prev, roleTitle: e.target.value }))}
                                    placeholder="VD: Bác sĩ trưởng khoa, Y tá trưởng..."
                                    className="w-full px-5 py-3 bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6] rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white"
                                />
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
                        disabled={!formData.branchId || loading}
                        className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#3C81C6] to-[#4A90E2] hover:from-[#2a6da8] hover:to-[#387DCB] disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                    >
                        Xác Nhận
                        <span className="material-symbols-outlined text-[18px]">domain_add</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}
