"use client";

import { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import { UI_TEXT } from "@/constants/ui-text";
import type { User } from "@/types";
import { CustomSelect } from "@/components/ui/custom-select";
import { facilityService } from "@/services/facilityService";
import { branchService } from "@/services/branchService";
import { getDepartments, unwrapDepartments } from "@/services/departmentService";
import { getSpecialties, getSpecialtiesByDepartment } from "@/services/specialtyService";

interface ExtendedUser extends User {
    dob?: string;
    gender?: string;
    identity_card_number?: string;
    address?: string;
    facilityId?: string;
    branchId?: string;
    departmentId?: string;
    specialtyId?: string;
    role_title?: string;
    title?: string;
    biography?: string;
    consultation_fee?: string;
}

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (user: Partial<ExtendedUser> & { file?: File }) => void;
    initialData?: ExtendedUser;
    mode: "create" | "edit";
}

export function UserFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
}: UserFormModalProps) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        role: ROLES.STAFF as string,
        password: "",
        dob: "",
        gender: "MALE",
        identity_card_number: "",
        address: "",
        facilityId: "",
        branchId: "",
        departmentId: "",
        specialtyId: "",
        role_title: "",
        title: "",
        biography: "",
        consultation_fee: "",
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [facilities, setFacilities] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [specialties, setSpecialties] = useState<any[]>([]);

    const [loadingDropdowns, setLoadingDropdowns] = useState({
        facility: false,
        branch: false,
        department: false,
        specialty: false,
    });

    const currentRole = formData.role;
    const showSpecialty = currentRole === ROLES.DOCTOR || currentRole === ROLES.PHARMACIST;

    // Fetch Facilities on mount
    useEffect(() => {
        if (!isOpen) return;
        setLoadingDropdowns(p => ({ ...p, facility: true }));
        facilityService.getList({ limit: 100 })
            .then(res => setFacilities(res.data || []))
            .catch(() => {})
            .finally(() => setLoadingDropdowns(p => ({ ...p, facility: false })));
    }, [isOpen]);

    // Fetch Branches when Facility changes
    useEffect(() => {
        if (!isOpen || !formData.facilityId) {
            setBranches([]);
            return;
        }
        setLoadingDropdowns(p => ({ ...p, branch: true }));
        branchService.getList({ facility_id: formData.facilityId, limit: 100 } as any)
            .then(res => setBranches(res.data || []))
            .catch(() => {})
            .finally(() => setLoadingDropdowns(p => ({ ...p, branch: false })));
    }, [formData.facilityId, isOpen]);

    // Fetch Departments when Branch changes
    useEffect(() => {
        if (!isOpen || !formData.branchId) {
            setDepartments([]);
            return;
        }
        setLoadingDropdowns(p => ({ ...p, department: true }));
        getDepartments({ branch_id: formData.branchId, limit: 100 } as any)
            .then(res => setDepartments(unwrapDepartments(res)))
            .catch(() => {})
            .finally(() => setLoadingDropdowns(p => ({ ...p, department: false })));
    }, [formData.branchId, isOpen]);

    // Fetch Specialties when Department/Role changes
    useEffect(() => {
        if (!isOpen || !showSpecialty || !formData.departmentId) {
            setSpecialties([]);
            return;
        }
        setLoadingDropdowns(p => ({ ...p, specialty: true }));
        getSpecialtiesByDepartment(formData.departmentId)
            .then(res => {
                setSpecialties(Array.isArray(res) ? res : []);
            })
            .catch(() => {})
            .finally(() => setLoadingDropdowns(p => ({ ...p, specialty: false })));
    }, [formData.departmentId, showSpecialty, isOpen]);

    useEffect(() => {
        if (isOpen) {
            let roleFallback = initialData?.role 
                || (Array.isArray((initialData as any)?.roles) && (initialData as any)?.roles.length > 0 ? (initialData as any)?.roles[0] : (ROLES.STAFF as string));
            
            if (typeof roleFallback === 'string') {
                roleFallback = roleFallback.toUpperCase();
            }

            setFormData({
                fullName: initialData?.fullName || (initialData as any)?.full_name || "",
                email: initialData?.email || "",
                phone: initialData?.phone || (initialData as any)?.phoneNumber || "",
                role: roleFallback,
                password: "",
                dob: initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : "",
                gender: initialData?.gender || "MALE",
                identity_card_number: initialData?.identity_card_number || "",
                address: initialData?.address || "",
                facilityId: initialData?.facilityId || (initialData as any)?.facility_id || "",
                branchId: initialData?.branchId || (initialData as any)?.branch_id || "",
                departmentId: initialData?.departmentId || (initialData as any)?.department_id || "",
                specialtyId: initialData?.specialtyId || (initialData as any)?.specialty_id || "",
                role_title: initialData?.role_title || "",
                title: initialData?.title || "",
                biography: initialData?.biography || "",
                consultation_fee: initialData?.consultation_fee?.toString() || "",
            });
            setAvatarPreview(initialData?.avatar || null);
            setAvatarFile(null);
            setErrors({});
        }
    }, [isOpen, initialData]);

    const handleSelectChange = (name: string, val: string | number) => {
        const value = String(val);
        setFormData((prev) => {
            const next = { ...prev, [name]: value };
            if (name === "facilityId") { next.branchId = ""; next.departmentId = ""; next.specialtyId = ""; }
            else if (name === "branchId") { next.departmentId = ""; next.specialtyId = ""; }
            else if (name === "departmentId") { next.specialtyId = ""; }
            return next;
        });
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, avatar: "Kích thước ảnh tối đa 5MB" }));
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, avatar: "" }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
        if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email không hợp lệ";

        if (mode === "create" && !formData.password) {
            newErrors.password = "Vui lòng nhập mật khẩu";
        } else if (mode === "create" && formData.password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSubmit({
            ...initialData,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role as Role,
            roles: [formData.role as string],
            dob: formData.dob || undefined,
            gender: formData.gender,
            identity_card_number: formData.identity_card_number || undefined,
            address: formData.address || undefined,
            facilityId: formData.facilityId || undefined,
            branchId: formData.branchId || undefined,
            departmentId: formData.departmentId || undefined,
            specialtyId: formData.specialtyId || undefined,
            role_title: formData.role_title || undefined,
            title: formData.title || undefined,
            biography: formData.biography || undefined,
            consultation_fee: formData.consultation_fee || undefined,
            ...(formData.password ? { password: formData.password } : {}),
            file: avatarFile || undefined,
            avatar: avatarPreview || undefined
        });

        onClose();
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={mode === "create" ? "Thêm Người Dùng" : "Chỉnh Sửa Hồ Sơ"}
            size="xl"
        >
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8 pb-2 md:items-start">
                {/* Left Sidebar: Avatar & Quick Info */}
                <div className="w-full md:w-[32%] flex flex-col items-center p-6 bg-gray-50/50 dark:bg-[#161b22]/30 rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] md:sticky md:top-0">
                    <h3 className="w-full text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-widest">
                        Ảnh Đại Diện
                    </h3>
                    <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-[#1e242b] shadow-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">person</span>
                            )}
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                                <span className="material-symbols-outlined text-2xl mb-1">photo_camera</span>
                                <span className="text-[10px] font-medium tracking-wide">Thay đổi</span>
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-[#3C81C6] text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-[#1e242b] hover:bg-[#2a6da8] transition-colors">
                            <span className="material-symbols-outlined text-[16px] leading-none">edit</span>
                        </div>
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/webp" 
                        className="hidden" 
                    />
                    
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed px-4">
                        Tỉ lệ 1:1.<br/>Cho phép định dạng JPG, PNG, WEBP (Tối đa 5MB).
                    </p>
                    {errors.avatar && <p className="text-xs text-red-500 mt-[-10px] mb-4 text-center">{errors.avatar}</p>}

                    <div className="w-full space-y-4 pt-6 mt-auto border-t border-[#dde0e4] dark:border-[#2d353e]">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Vai trò
                            </label>
                            <div className="flex flex-col gap-2">
                                {Object.entries(ROLES).map(([key, value]) => {
                                    const roleVal = value as Role;
                                    const isSelected = formData.role === roleVal;
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => setFormData((prev) => ({ ...prev, role: roleVal }))}
                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                                                isSelected 
                                                    ? "border-[#3C81C6] bg-[#3C81C6]/5 dark:bg-[#3C81C6]/10" 
                                                    : "border-transparent bg-white dark:bg-[#1e242b] hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                                                    isSelected ? "bg-[#3C81C6]/10 text-[#3C81C6]" : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                                                }`}>
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {roleVal === ROLES.ADMIN ? "shield_person" : roleVal === ROLES.DOCTOR ? "stethoscope" : roleVal === ROLES.PHARMACIST ? "medical_information" : "person"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold ${isSelected ? "text-[#3C81C6]" : "text-[#121417] dark:text-gray-200"}`}>
                                                        {ROLE_LABELS[roleVal] || roleVal}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                                        {roleVal === ROLES.ADMIN ? "Toàn quyền hệ thống" : roleVal === ROLES.DOCTOR ? "Quản lý khám bệnh" : roleVal === ROLES.PHARMACIST ? "Hỗ trợ y tế" : "Nhân viên phòng khám"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                isSelected ? "border-[#3C81C6]" : "border-gray-300 dark:border-gray-600"
                                            }`}>
                                                {isSelected && <div className="w-2.5 h-2.5 bg-[#3C81C6] rounded-full" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="w-full md:w-[68%] flex flex-col pt-1">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-[#121417] dark:text-white">Thông tin cá nhân</h3>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Hồ sơ định danh và phương thức liên lạc</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 mb-auto">
                        <div className="md:col-span-2">
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Họ và Tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Ví dụ: Nguyễn Văn A"
                                className={`w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border ${errors.fullName ? "border-red-500 focus:ring-red-500" : "border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6]"} rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white`}
                            />
                            {errors.fullName && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.fullName}</p>}
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Số Điện Thoại
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="0901 234 567"
                                className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6] rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="example@ehealth.vn"
                                className={`w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border ${errors.email ? "border-red-500 focus:ring-red-500" : "border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6]"} rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white`}
                            />
                            {errors.email && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Giới Tính
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-5 py-3.5 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6] focus:border-[#3C81C6] text-sm text-[#121417] dark:text-white shadow-sm transition-all cursor-pointer appearance-none"
                                style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23687582%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                            >
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Chưa xác định</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Ngày Sinh
                            </label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6] rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                CMND / CCCD
                            </label>
                            <input
                                type="text"
                                name="identity_card_number"
                                value={formData.identity_card_number}
                                onChange={handleChange}
                                placeholder="Nhập số CMND hoặc thẻ Căn cước"
                                className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6] rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                Địa Chỉ
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Nhập địa chỉ đầy đủ (Số nhà, Phường/Xã, Quận/Huyện...)"
                                className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6] rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white"
                            />
                        </div>
                    </div>

                    {currentRole !== ROLES.PATIENT && currentRole !== 'USER' && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-3xl shadow-sm mt-5 mb-8 animate-in fade-in duration-300">
                            <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                    <span className="material-symbols-outlined text-[20px]">badge</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#121417] dark:text-white">Công tác & Phân công</h2>
                                    <p className="text-xs text-gray-500">Phân luồng cơ sở và phòng ban</p>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                
                                <div>
                                    <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">Cơ sở y tế</label>
                                    <CustomSelect
                                        options={facilities}
                                        value={formData.facilityId}
                                        onChange={(val) => handleSelectChange("facilityId", val)}
                                        placeholder="-- Chọn cơ sở --"
                                        icon="business"
                                        disabled={loadingDropdowns.facility}
                                        loading={loadingDropdowns.facility}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">Chi nhánh</label>
                                    <CustomSelect
                                        options={branches}
                                        value={formData.branchId}
                                        onChange={(val) => handleSelectChange("branchId", val)}
                                        placeholder="-- Chọn chi nhánh --"
                                        icon="store"
                                        disabled={loadingDropdowns.branch || !formData.facilityId}
                                        loading={loadingDropdowns.branch}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">Khoa / Phòng ban</label>
                                    <CustomSelect
                                        options={departments}
                                        value={formData.departmentId}
                                        onChange={(val) => handleSelectChange("departmentId", val)}
                                        placeholder="-- Chọn phòng ban --"
                                        icon="account_tree"
                                        disabled={loadingDropdowns.department || !formData.branchId}
                                        loading={loadingDropdowns.department}
                                    />
                                </div>

                                {showSpecialty && (
                                    <div className="animate-in fade-in duration-300">
                                        <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">Chuyên khoa</label>
                                        <CustomSelect
                                            options={specialties}
                                            value={formData.specialtyId}
                                            onChange={(val) => handleSelectChange("specialtyId", val)}
                                            placeholder="-- Chọn chuyên khoa --"
                                            icon="psychology"
                                            disabled={loadingDropdowns.specialty || !formData.departmentId}
                                            loading={loadingDropdowns.specialty}
                                        />
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <FormField label="Vị trí công tác" name="role_title" value={formData.role_title as string} onChange={handleChange} placeholder="VD: Trưởng khoa, Quản lý..." icon="work" />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentRole === ROLES.DOCTOR && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-3xl shadow-sm mb-8 animate-in fade-in duration-300">
                            <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                    <span className="material-symbols-outlined">medical_information</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#121417] dark:text-white">Thông tin Chuyên môn</h2>
                                    <p className="text-xs text-gray-500">Dành riêng cho Bác sĩ</p>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <FormField label="Chức danh / Học vị" name="title" value={formData.title as string} onChange={handleChange} placeholder="VD: Ths. Bs., TS. Bs..." icon="badge" />
                                <FormField label="Giá khám bệnh (VND)" name="consultation_fee" type="number" value={formData.consultation_fee as string} onChange={handleChange} placeholder="VD: 500000" icon="payments" />
                                <div className="md:col-span-2">
                                    <FormField label="Tiểu sử / Giới thiệu" name="biography" value={formData.biography as string} onChange={handleChange} placeholder="Nhập tiểu sử, kinh nghiệm công tác..." icon="description" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        {mode === "create" && (
                            <div className="md:col-span-2 mt-2 pt-6 border-t border-[#dde0e4] dark:border-[#2d353e]">
                                <label className="block text-[13px] font-semibold text-[#121417] dark:text-gray-300 mb-2">
                                    Mật Khẩu <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Nhập tối thiểu 6 ký tự bảo mật"
                                        className={`w-full px-5 py-3.5 bg-gray-50/50 dark:bg-[#1a2027]/50 border ${errors.password ? "border-red-500 focus:ring-red-500" : "border-[#dde0e4] dark:border-[#2d353e] focus:border-[#3C81C6] focus:ring-[#3C81C6]"} rounded-xl text-sm transition-all shadow-sm focus:bg-white dark:focus:bg-[#1e242b] focus:ring-2 focus:ring-opacity-20 outline-none text-[#121417] dark:text-white`}
                                    />
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">lock</span>
                                </div>
                                {errors.password && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.password}</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-[#dde0e4] dark:border-[#2d353e]">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2.5 text-sm font-semibold text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                        >
                            {UI_TEXT.COMMON.CANCEL}
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#3C81C6] to-[#4A90E2] hover:from-[#2a6da8] hover:to-[#387DCB] rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                        >
                            {mode === "create" ? UI_TEXT.COMMON.CREATE : UI_TEXT.COMMON.SAVE}
                            <span className="material-symbols-outlined text-[18px]">
                                {mode === "create" ? "person_add" : "check_circle"}
                            </span>
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}


// Reusable Form Field Component with nice styling
function FormField({ label, name, type = "text", value, onChange, error, placeholder, icon, bgColor = "bg-gray-50 dark:bg-[#161b22]" }: {
    label: string; name: string; type?: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    error?: string; placeholder?: string; icon?: string; bgColor?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-bold text-[#121417] dark:text-gray-300 mb-2">{label}</label>
            <div className="relative group">
                {icon && (
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-4 transition-colors ${error ? "text-red-500" : "text-gray-400 group-focus-within:text-[#3C81C6]"}`}>
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </span>
                )}
                <input
                    type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
                    className={`w-full py-3.5 ${icon ? "pl-11" : "pl-4"} pr-4 text-sm font-medium ${bgColor} border ${error ? "border-red-400 ring-2 ring-red-400/20" : "border-[#dde0e4] dark:border-[#2d353e]"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 dark:text-white placeholder:text-gray-400 transition-all hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-[#1e242b]`}
                />
            </div>
            {error && (
                <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1 animate-in fade-in">
                    <span className="material-symbols-outlined text-[14px]">info</span> {error}
                </p>
            )}
        </div>
    );
}
