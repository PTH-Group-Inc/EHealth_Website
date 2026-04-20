"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROLES, ROLE_LABELS, type Role } from "@/constants/roles";
import { createUser } from "@/services/userService";
import { facilityService } from "@/services/facilityService";
import { branchService } from "@/services/branchService";
import { getDepartments, unwrapDepartments } from "@/services/departmentService";
import { getSpecialties, getSpecialtiesByDepartment } from "@/services/specialtyService";
import { validateName, validatePhone, validateEmail, validateDob } from "@/utils/validation";
import { CustomSelect } from "@/components/ui/custom-select";

const ROLE_ICONS: Record<Role, string> = {
    [ROLES.ADMIN]: "admin_panel_settings",
    [ROLES.DOCTOR]: "stethoscope",
    [ROLES.PHARMACIST]: "local_pharmacy",
    [ROLES.STAFF]: "support_agent",
    [ROLES.PATIENT]: "healing",
};

export default function NewUserPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        role: ROLES.STAFF as Role,
        password: "",
        confirmPassword: "",
        gender: "male",
        dateOfBirth: "",
        identity_card_number: "",
        address: "",
        
        // Cascading work assignments
        facilityId: "",
        branchId: "",
        departmentId: "",
        specialtyId: "",
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Cascading options state
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
    const isCustomer = currentRole === ROLES.PATIENT;
    const showSpecialty = currentRole === ROLES.DOCTOR || currentRole === ROLES.PHARMACIST;

    // Fetch Facilities on mount
    useEffect(() => {
        setLoadingDropdowns(p => ({ ...p, facility: true }));
        facilityService.getList({ limit: 100 })
            .then(res => setFacilities(res.data || []))
            .catch(() => {})
            .finally(() => setLoadingDropdowns(p => ({ ...p, facility: false })));
    }, []);

    // Fetch Branches when Facility changes
    useEffect(() => {
        if (!formData.facilityId) {
            setBranches([]);
            setFormData(prev => ({ ...prev, branchId: "", departmentId: "", specialtyId: "" }));
            return;
        }
        setLoadingDropdowns(p => ({ ...p, branch: true }));
        branchService.getList({ facility_id: formData.facilityId, limit: 100 } as any)
            .then(res => setBranches(res.data || []))
            .catch(() => {})
            .finally(() => setLoadingDropdowns(p => ({ ...p, branch: false })));
        
        // Reset children
        setFormData(prev => ({ ...prev, branchId: "", departmentId: "", specialtyId: "" }));
    }, [formData.facilityId]);

    // Fetch Departments when Branch changes
    useEffect(() => {
        if (!formData.branchId) {
            setDepartments([]);
            setFormData(prev => ({ ...prev, departmentId: "", specialtyId: "" }));
            return;
        }
        setLoadingDropdowns(p => ({ ...p, department: true }));
        getDepartments({ branch_id: formData.branchId, limit: 100 } as any)
            .then(res => setDepartments(unwrapDepartments(res)))
            .catch(() => {})
            .finally(() => setLoadingDropdowns(p => ({ ...p, department: false })));
        
        // Reset child
        setFormData(prev => ({ ...prev, departmentId: "", specialtyId: "" }));
    }, [formData.branchId]);

    // Fetch Specialties when Department/Role changes
    useEffect(() => {
        if (!showSpecialty || !formData.departmentId) {
            setSpecialties([]);
            setFormData(prev => ({ ...prev, specialtyId: "" }));
            return;
        }
        setLoadingDropdowns(p => ({ ...p, specialty: true }));
        getSpecialtiesByDepartment(formData.departmentId)
            .then(res => {
                const items = (res as any)?.data?.items ?? (res as any)?.items ?? (res as any)?.data?.data ?? res?.data ?? res ?? [];
                setSpecialties(Array.isArray(items) ? items : []);
            })
            .catch(() => {})
            .finally(() => setLoadingDropdowns(p => ({ ...p, specialty: false })));
        
        setFormData(prev => ({ ...prev, specialtyId: "" }));
    }, [formData.departmentId, showSpecialty]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleSelectChange = (name: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [name]: String(value) }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleRoleSelect = (role: Role) => {
        setFormData((prev) => ({ 
            ...prev, 
            role,
            // Nếu đổi sang không phải BS/DS thì xoá specialtyId
            specialtyId: (role === ROLES.DOCTOR || role === ROLES.PHARMACIST) ? prev.specialtyId : ""
        }));
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

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const nameRes = validateName(formData.fullName);
        if (!nameRes.valid) newErrors.fullName = nameRes.message;
        const emailRes = validateEmail(formData.email);
        if (!emailRes.valid) newErrors.email = emailRes.message;
        const phoneRes = validatePhone(formData.phone);
        if (!phoneRes.valid) newErrors.phone = phoneRes.message;
        if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu";
        else if (formData.password.length < 6) newErrors.password = "Mật khẩu tối thiểu 6 ký tự";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        
        if (formData.dateOfBirth) {
            const dobRes = validateDob(formData.dateOfBirth);
            if (!dobRes.valid) newErrors.dateOfBirth = dobRes.message;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            return;
        }
        
        setSaving(true);
        setApiError(null);
        try {
            await createUser({
                fullName: formData.fullName,
                full_name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                phoneNumber: formData.phone,
                role: formData.role,
                roles: [formData.role.toUpperCase()],
                password: formData.password,
                gender: formData.gender === "male" ? "MALE" : formData.gender === "female" ? "FEMALE" : undefined,
                dob: formData.dateOfBirth || undefined,
                address: formData.address || undefined,
                identity_card_number: formData.identity_card_number || undefined,
                facility_id: formData.facilityId || undefined,
                branch_id: formData.branchId || undefined,
                department_id: formData.departmentId || undefined,
                specialty_id: formData.specialtyId || undefined,
            } as any);
            router.push("/admin/users");
        } catch (err: any) {
            setApiError(err?.message || "Tạo tài khoản thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-[#687582] mb-2">
                        <Link href="/admin/users" className="hover:text-[#3C81C6] transition-colors font-medium">Người dùng</Link>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        <span className="text-[#121417] dark:text-white font-medium">Thêm người dùng mới</span>
                    </div>
                    <h1 className="text-2xl font-black text-[#121417] dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <span className="material-symbols-outlined text-[20px]">person_add</span>
                        </div>
                        Tạo Tài Khoản
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 text-[#687582]">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                        Hủy bỏ
                    </button>
                    <button onClick={handleSubmit} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-[#3C81C6] to-[#2a6da8] hover:from-[#2a6da8] hover:to-[#1e5282] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2">
                        {saving ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang thiết lập...</>
                        ) : (
                            <><span className="material-symbols-outlined text-[18px]">check_circle</span> Hoàn tất tạo</>
                        )}
                    </button>
                </div>
            </div>

            {apiError && (
                <div className="flex items-center gap-3 px-5 py-4 mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl animate-in fade-in slide-in-from-top-4">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                    </div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">{apiError}</p>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* ---------- LEFT COLUMN (Sidebar Layout) ---------- */}
                <div className="w-full lg:w-[320px] flex flex-col gap-6 lg:sticky lg:top-8">
                    
                    {/* Avatar Upload */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-2xl shadow-sm p-6 flex flex-col items-center">
                        <h3 className="w-full text-sm font-bold text-[#121417] dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">image</span>
                            Ảnh đại diện
                        </h3>
                        
                        <div className="relative group w-32 h-32 rounded-full border-4 border-white dark:border-[#1e242b] shadow-xl overflow-hidden mb-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-[48px] text-gray-300">account_circle</span>
                            )}
                            
                            {/* Hover overlay */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white"
                            >
                                <span className="material-symbols-outlined text-[24px] mb-1">photo_camera</span>
                                <span className="text-[10px] font-bold">Thay ảnh</span>
                            </div>
                        </div>

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        
                        <div className="flex items-center gap-2">
                            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-[#3C81C6] text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors">
                                Tải ảnh lên
                            </button>
                            {avatarPreview && (
                                <button onClick={handleRemoveAvatar} className="px-3 py-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                            )}
                        </div>
                        {errors.avatar && <p className="text-xs text-red-500 mt-2 text-center">{errors.avatar}</p>}
                        <p className="text-[11px] text-gray-400 text-center mt-4">Nên dùng ảnh vuông, dung lượng tối đa 5MB. Định dạng JPG, PNG.</p>
                    </div>

                    {/* Role Selection Blocks */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-[#dde0e4] dark:border-[#2d353e] bg-gray-50/50 dark:bg-[#161b22]/50">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]">verified_user</span>
                                Vai trò & Phân quyền
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chọn vai trò để cấu hình form nhập liệu phù hợp.</p>
                        </div>
                        
                        <div className="p-3 grid grid-cols-1 gap-2">
                            {Object.values(ROLES).map((role) => {
                                const isSelected = formData.role === role;
                                return (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => handleRoleSelect(role)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left w-full
                                            ${isSelected 
                                                ? "border-[#3C81C6] bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-[#3C81C6]" 
                                                : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                            ${isSelected ? "bg-[#3C81C6] text-white shadow-md shadow-blue-500/30" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}
                                        `}>
                                            <span className="material-symbols-outlined text-[18px]">{ROLE_ICONS[role]}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${isSelected ? "text-[#3C81C6]" : "text-[#121417] dark:text-white"}`}>
                                                {ROLE_LABELS[role]}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <span className="material-symbols-outlined text-[#3C81C6]">check_circle</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ---------- RIGHT COLUMN (Main Form) ---------- */}
                <div className="flex-1 flex flex-col gap-6 min-w-0 pb-10">
                    
                    {/* Section: Thông tin cá nhân */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-3xl shadow-sm">
                        <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#3C81C6]">
                                <span className="material-symbols-outlined">badge</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#121417] dark:text-white">Thông tin cơ bản</h2>
                                <p className="text-xs text-gray-500">Các thông tin cá nhân định danh người dùng</p>
                            </div>
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <FormField label="Họ và tên *" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} placeholder="VD: Nguyễn Văn A" icon="person" />
                            <FormField label="Email *" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="example@ehealth.vn" icon="email" />
                            <FormField label="Số điện thoại *" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="0901 234 567" icon="phone" />
                            
                            <div>
                                <label className="block text-sm font-bold text-[#121417] dark:text-gray-300 mb-2">Giới tính</label>
                                <div className="flex items-center gap-4 bg-gray-50 dark:bg-[#161b22] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="gender" value="male" checked={formData.gender === "male"} onChange={handleChange} className="w-4 h-4 text-[#3C81C6]" />
                                        <span className="text-sm font-medium dark:text-gray-200">Nam</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="gender" value="female" checked={formData.gender === "female"} onChange={handleChange} className="w-4 h-4 text-[#3C81C6]" />
                                        <span className="text-sm font-medium dark:text-gray-200">Nữ</span>
                                    </label>
                                </div>
                            </div>

                            <FormField label="Số CMND/CCCD" name="identity_card_number" value={formData.identity_card_number} onChange={handleChange} placeholder="079199XXXXXX" icon="id_card" />
                            <FormField label="Ngày sinh" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} error={errors.dateOfBirth} icon="cake" />
                            <div className="md:col-span-2">
                                <FormField label="Địa chỉ" name="address" value={formData.address} onChange={handleChange} placeholder="Số nhà, đường, phường/xã, quận/huyện..." icon="location_on" />
                            </div>
                        </div>
                    </div>

                    {/* Section: Phân công (Not for PATIENT) */}
                    {!isCustomer && (
                        <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-3xl shadow-sm animate-in fade-in duration-300">
                            <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                    <span className="material-symbols-outlined">domain</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#121417] dark:text-white">Công tác & Phân công</h2>
                                    <p className="text-xs text-gray-500">Thông tin làm việc, phòng khám, cơ sở y tế</p>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                
                                {/* Cơ sở y tế */}
                                <div>
                                    <label className="block text-sm font-bold text-[#121417] dark:text-gray-300 mb-2">Cơ sở y tế</label>
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

                                {/* Chi nhánh */}
                                <div>
                                    <label className="block text-sm font-bold text-[#121417] dark:text-gray-300 mb-2">Chi nhánh</label>
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

                                {/* Phòng ban */}
                                <div>
                                    <label className="block text-sm font-bold text-[#121417] dark:text-gray-300 mb-2">Khoa / Phòng ban</label>
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

                                {/* Chuyên khoa */}
                                {showSpecialty && (
                                    <div className="animate-in fade-in duration-300">
                                        <label className="block text-sm font-bold text-[#121417] dark:text-gray-300 mb-2">Chuyên khoa</label>
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
                            </div>
                        </div>
                    )}

                    {/* Section: Bảo mật */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-3xl shadow-sm">
                        <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-700 dark:text-gray-300">
                                <span className="material-symbols-outlined">security</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#121417] dark:text-white">Bảo mật tài khoản</h2>
                                <p className="text-xs text-gray-500">Thông tin đăng nhập hệ thống</p>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <FormField label="Mật khẩu *" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="Tối thiểu 6 ký tự" icon="lock" />
                            <FormField label="Xác nhận mật khẩu *" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="Nhập lại mật khẩu để kiểm tra" icon="lock_reset" />
                        </div>
                    </div>

                    {/* Action Bar (Mobile only, Desktop is at top) */}
                    <div className="md:hidden flex flex-col gap-3 mt-4">
                        <button onClick={handleSubmit} disabled={saving} className="w-full py-3.5 bg-gradient-to-r from-[#3C81C6] to-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang tạo...</> : "Tạo Tài Khoản"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Reusable Form Field Component with nice styling
function FormField({ label, name, type = "text", value, onChange, error, placeholder, icon, bgColor = "bg-gray-50 dark:bg-[#161b22]" }: {
    label: string; name: string; type?: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
                    className={`w-full py-3.5 ${icon ? "pl-11" : "pl-4"} pr-4 text-sm font-medium ${bgColor} border ${error ? "border-red-400 ring-2 ring-red-400/20" : "border-gray-200 dark:border-gray-700"} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 dark:text-white placeholder:text-gray-400 transition-all hover:bg-white dark:hover:bg-gray-800`}
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
