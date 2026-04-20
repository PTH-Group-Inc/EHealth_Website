/**
 * User Service
 * Xử lý các chức năng liên quan đến người dùng — đồng bộ Swagger API
 * 
 * Backend: http://160.250.186.97:3000/api-docs
 * Sections: 1.1 User Management, 1.6 Profile
 */

import axiosClient from '@/api/axiosClient';
import { USER_ENDPOINTS, PROFILE_ENDPOINTS } from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface User {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    role: string;
    status: 'active' | 'inactive' | 'locked' | 'pending';
    avatar?: string;
    department?: string;
    createdAt: string;
    updatedAt: string;
    dob?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | string;
    identity_card_number?: string;
    address?: string;
    roles?: string[];
}

export interface CreateUserData {
    email: string;
    phone?: string;
    password: string;
    roles?: string[];         // ["DOCTOR"] — mảng, backend format
    full_name?: string;       // backend format
    dob?: string;             // "1985-12-25"
    gender?: 'MALE' | 'FEMALE';
    identity_card_number?: string;
    address?: string;
    // Frontend aliases (camelCase) — sẽ map sang snake_case khi gửi
    fullName?: string;
    phoneNumber?: string;
    role?: string;
    departmentId?: string;
}

export interface UpdateUserData {
    email?: string;
    phone?: string;
    roles?: string[];
    status?: string;          // "ACTIVE" | "INACTIVE"
    full_name?: string;
    dob?: string;
    gender?: 'MALE' | 'FEMALE';
    identity_card_number?: string;
    avatar_url?: string;
    address?: string;
    // Frontend aliases
    fullName?: string;
    phoneNumber?: string;
    role?: string;
    departmentId?: string;
}

export interface UserListResponse {
    success: boolean;
    data: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// 1.1.1 Quản lý User
// ============================================

/** GET /api/users/account-status — Lấy danh sách trạng thái tài khoản */
export const getAccountStatuses = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.ACCOUNT_STATUS);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách trạng thái thất bại');
    }
};

/** GET /api/users — Lấy danh sách người dùng */
export const getUsers = async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
}): Promise<UserListResponse> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.LIST, { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách người dùng thất bại');
    }
};

/** GET /api/users/search — Tìm kiếm user */
export const searchUsers = async (params?: {
    page?: number;
    limit?: number;
    q?: string;               // Swagger dùng 'q', không phải 'keyword'
    role?: string;
    status?: string;
    keyword?: string;         // alias — sẽ map sang q
}): Promise<UserListResponse> => {
    try {
        const queryParams = { ...params, q: params?.q ?? params?.keyword };
        if (queryParams.keyword) delete queryParams.keyword;
        const response = await axiosClient.get(USER_ENDPOINTS.SEARCH, { params: queryParams });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tìm kiếm người dùng thất bại');
    }
};

/** GET /api/users/{userId} — Lấy chi tiết người dùng */
export const getUserById = async (id: string): Promise<User> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.DETAIL(id));
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin người dùng thất bại');
    }
};

/** POST /api/users — Tạo người dùng mới */
export const createUser = async (data: CreateUserData): Promise<User> => {
    try {
        const response = await axiosClient.post(USER_ENDPOINTS.CREATE, {
            email: data.email,
            phone: data.phone ?? data.phoneNumber,
            password: data.password,
            roles: data.roles ?? (data.role ? [data.role.toUpperCase()] : ["STAFF"]),
            full_name: data.full_name ?? data.fullName,
            dob: data.dob,
            gender: data.gender,
            identity_card_number: data.identity_card_number,
            address: data.address,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo người dùng thất bại');
    }
};

/** PUT /api/users/{userId} — Cập nhật người dùng */
export const updateUser = async (id: string, data: UpdateUserData): Promise<User> => {
    try {
        const payload: Record<string, any> = {};
        if (data.email) payload.email = data.email;
        if (data.phone ?? data.phoneNumber) payload.phone = data.phone ?? data.phoneNumber;
        if (data.roles ?? data.role) payload.roles = data.roles ?? (data.role ? [data.role.toUpperCase()] : undefined);
        if (data.status) payload.status = data.status.toUpperCase();
        if (data.full_name ?? data.fullName) payload.full_name = data.full_name ?? data.fullName;
        if (data.dob) payload.dob = data.dob;
        if (data.gender) payload.gender = data.gender;
        if (data.identity_card_number) payload.identity_card_number = data.identity_card_number;
        if (data.avatar_url) payload.avatar_url = data.avatar_url;
        if (data.address) payload.address = data.address;
        const response = await axiosClient.put(USER_ENDPOINTS.DETAIL(id), payload);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật người dùng thất bại');
    }
};

/** DELETE /api/users/{userId} — Xóa người dùng */
export const deleteUser = async (id: string): Promise<void> => {
    try {
        await axiosClient.delete(USER_ENDPOINTS.DETAIL(id));
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa người dùng thất bại');
    }
};

// ============================================
// Upload Avatar
// ============================================

export const uploadUserAvatar = async (id: string, file: File): Promise<{ success: boolean; data: { url: string; public_id: string } }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosClient.post(USER_ENDPOINTS.AVATAR(id), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tải ảnh đại diện thất bại');
    }
};

// ============================================
// 1.1.2 Khóa / mở khóa tài khoản
// ============================================

/** PATCH /api/users/{userId}/lock — Khóa tài khoản */
export const lockUser = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axiosClient.patch(USER_ENDPOINTS.LOCK(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Khóa tài khoản thất bại');
    }
};

/** PATCH /api/users/{userId}/unlock — Mở khóa tài khoản */
export const unlockUser = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axiosClient.patch(USER_ENDPOINTS.UNLOCK(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Mở khóa tài khoản thất bại');
    }
};

// ============================================
// 1.1.3 Quản lý trạng thái tài khoản
// ============================================

/** PATCH /api/users/{userId}/status — Cập nhật trạng thái */
export const updateUserStatus = async (id: string, data: { status: string; reason?: string }): Promise<any> => {
    try {
        const response = await axiosClient.patch(USER_ENDPOINTS.STATUS(id), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
    }
};

/** GET /api/users/{userId}/status-history — Lịch sử trạng thái */
export const getUserStatusHistory = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.STATUS_HISTORY(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy lịch sử trạng thái thất bại');
    }
};

// ============================================
// 1.1.4 Reset mật khẩu người dùng
// ============================================

/** POST /api/users/{userId}/reset-password — Admin reset mật khẩu */
export const adminResetPassword = async (id: string, newPassword?: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axiosClient.post(USER_ENDPOINTS.RESET_PASSWORD(id), {
            newPassword: newPassword || 'EHealth@123',
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Reset mật khẩu thất bại');
    }
};

/** POST /api/users/{userId}/change-password — User tự đổi mật khẩu */
export const adminChangePassword = async (id: string, data: { oldPassword: string; newPassword: string }): Promise<any> => {
    try {
        const response = await axiosClient.post(USER_ENDPOINTS.CHANGE_PASSWORD(id), {
            oldPassword: data.oldPassword,
            newPassword: data.newPassword,
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
};

// ============================================
// 1.1.5 Gán vai trò cho người dùng
// ============================================

/** GET /api/users/{userId}/roles — Lấy vai trò của user */
export const getUserRoles = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.ROLES(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy vai trò thất bại');
    }
};

/** POST /api/users/{userId}/roles — Gán vai trò cho user */
export const assignUserRole = async (id: string, data: { role: string }): Promise<any> => {
    try {
        const response = await axiosClient.post(USER_ENDPOINTS.ROLES(id), { role: data.role.toUpperCase() });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Gán vai trò thất bại');
    }
};

/** DELETE /api/users/{userId}/roles/{roleId} — Xóa vai trò */
export const removeUserRole = async (userId: string, roleId: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(USER_ENDPOINTS.ROLE_DELETE(userId, roleId));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa vai trò thất bại');
    }
};

// ============================================
// 1.1.6 Gán người dùng vào cơ sở y tế
// ============================================

/** GET /api/users/{userId}/facilities — Lấy cơ sở y tế */
export const getUserFacilities = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.FACILITIES(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy cơ sở y tế thất bại');
    }
};

/** POST /api/users/{userId}/facilities — Gán nhân sự vào Chi nhánh/Phòng ban */
export const assignUserFacility = async (id: string, data: { branchId: string; departmentId?: string; roleTitle?: string }): Promise<any> => {
    try {
        const response = await axiosClient.post(USER_ENDPOINTS.FACILITIES(id), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Gán cơ sở y tế thất bại');
    }
};

/** PUT /api/users/{userId}/facilities/{facilityId} — Cập nhật */
export const updateUserFacility = async (userId: string, facilityId: string, data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(USER_ENDPOINTS.FACILITY_UPDATE(userId, facilityId), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật cơ sở y tế thất bại');
    }
};

/** DELETE /api/users/{userId}/facilities/{facilityId} — Xóa */
export const removeUserFacility = async (userId: string, facilityId: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(USER_ENDPOINTS.FACILITY_DELETE(userId, facilityId));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa cơ sở y tế thất bại');
    }
};

// ============================================
// 1.1.7 Import người dùng hàng loạt
// ============================================

/** POST /api/users/import/validate — Validate import file */
export const validateUserImport = async (file: File): Promise<any> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosClient.post(USER_ENDPOINTS.IMPORT_VALIDATE, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Validate import thất bại');
    }
};

/** POST /api/users/import — Import users */
export const importUsers = async (file: File): Promise<any> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosClient.post(USER_ENDPOINTS.IMPORT, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Import users thất bại');
    }
};

/** GET /api/users/import/history — Lịch sử import */
export const getImportHistory = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.IMPORT_HISTORY);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy lịch sử import thất bại');
    }
};

// ============================================
// 1.1.8 Export danh sách người dùng
// ============================================

/** GET /api/users/export — Export users (GET) */
export const exportUsers = async (params?: any): Promise<Blob> => {
    try {
        const response = await axiosClient.get(USER_ENDPOINTS.EXPORT, {
            params,
            responseType: 'blob',
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Export users thất bại');
    }
};

/** POST /api/users/export — Export users (POST with filters) */
export const exportUsersWithFilters = async (data: any): Promise<Blob> => {
    try {
        const response = await axiosClient.post(USER_ENDPOINTS.EXPORT, data, {
            responseType: 'blob',
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Export users thất bại');
    }
};

// ============================================
// 1.6 Profile
// ============================================

/** GET /api/profile/me — Lấy thông tin profile */
export const getProfile = async (): Promise<User> => {
    try {
        const response = await axiosClient.get(PROFILE_ENDPOINTS.ME);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy thông tin profile thất bại');
    }
};

/** PUT /api/profile/me — Cập nhật profile */
export const updateProfile = async (data: {
    fullName?: string;
    phoneNumber?: string;
    avatar?: string;
}): Promise<User> => {
    try {
        const response = await axiosClient.put(PROFILE_ENDPOINTS.ME, {
            full_name: data.fullName,
            phone_number: data.phoneNumber,
            avatar: data.avatar,
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật profile thất bại');
    }
};

/** PUT /api/profile/password — Đổi mật khẩu */
export const changePassword = async (
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axiosClient.put(PROFILE_ENDPOINTS.CHANGE_PASSWORD, {
            current_password: currentPassword,
            new_password: newPassword,
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Đổi mật khẩu thất bại',
        };
    }
};

/** GET /api/profile/sessions — Xem lịch sử/thiết bị đăng nhập */
export const getProfileSessions = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(PROFILE_ENDPOINTS.SESSIONS);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách phiên đăng nhập thất bại');
    }
};

/** DELETE /api/profile/sessions — Đăng xuất tất cả thiết bị khác */
export const logoutAllProfileSessions = async (): Promise<any> => {
    try {
        const response = await axiosClient.delete(PROFILE_ENDPOINTS.SESSIONS_LOGOUT_ALL);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Đăng xuất tất cả thiết bị thất bại');
    }
};

/** DELETE /api/profile/sessions/{sessionId} — Đăng xuất thiết bị cụ thể */
export const deleteProfileSession = async (sessionId: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(PROFILE_ENDPOINTS.SESSION_DELETE(sessionId));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Đăng xuất thiết bị thất bại');
    }
};

/** PUT /api/profile/settings — Cài đặt cá nhân */
export const updateProfileSettings = async (data: any): Promise<any> => {
    try {
        const response = await axiosClient.put(PROFILE_ENDPOINTS.SETTINGS, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật cài đặt thất bại');
    }
};
