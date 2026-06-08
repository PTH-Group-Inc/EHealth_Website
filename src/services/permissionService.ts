/**
 * Permission & Role Service
 * Quản lý vai trò, quyền, modules, menus, API permissions — đồng bộ Swagger API
 * 
 * Backend: http://160.250.186.97:3000/api-docs
 * Sections: 1.3.1–1.3.7
 */

import axiosClient from '@/api/axiosClient';
import {
    ROLE_ENDPOINTS,
    PERMISSION_ENDPOINTS,
    MODULE_ENDPOINTS,
    MENU_ENDPOINTS,
    API_PERMISSION_ENDPOINTS,
} from '@/api/endpoints';

// ============================================
// Types
// ============================================

export interface RoleData {
    id: string;
    name: string;
    displayName: string;
    description: string;
    permissions: string[];
    userCount: number;
    isSystem: boolean;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PermissionData {
    id: string;
    code: string;
    name: string;
    module: string;
    group: string;
    description: string;
}

export interface PermissionGroup {
    group: string;
    groupLabel: string;
    permissions: PermissionData[];
}

export interface MenuData {
    id: string;
    name: string;
    path: string;
    icon?: string;
    parentId?: string;
    order?: number;
    isVisible?: boolean;
}

export interface ApiPermissionData {
    id: string;
    method: string;
    path: string;
    description?: string;
    module?: string;
}

// ============================================
// 1.3.1 Role Management
// ============================================

/** GET /api/roles — Lấy danh sách vai trò */
export const getRoles = async (): Promise<RoleData[]> => {
    try {
        const response = await axiosClient.get(ROLE_ENDPOINTS.LIST);
        return response.data.data || [];
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Lỗi lấy danh sách vai trò:', error);
        }
        return [];
    }
};

/** POST /api/roles — Tạo vai trò mới */
export const createRole = async (data: Partial<RoleData> & { code?: string }): Promise<{ success: boolean; message: string }> => {
    try {
        // Swagger: { code, name, description }
        const response = await axiosClient.post(ROLE_ENDPOINTS.CREATE, {
            code: data.code ?? data.name?.toUpperCase().replace(/\s+/g, '_'),
            name: data.displayName ?? data.name,
            description: data.description,
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Tạo vai trò thất bại',
        };
    }
};

/** GET /api/roles/{roleId} — Lấy chi tiết vai trò */
export const getRoleDetail = async (id: string): Promise<RoleData | null> => {
    try {
        const response = await axiosClient.get(ROLE_ENDPOINTS.DETAIL(id));
        return response.data.data || null;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Lỗi lấy chi tiết vai trò:', error);
        }
        return null;
    }
};

/** PATCH /api/roles/{roleId} — Cập nhật vai trò */
export const updateRole = async (id: string, data: Partial<RoleData>): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axiosClient.patch(ROLE_ENDPOINTS.UPDATE(id), data);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Cập nhật vai trò thất bại',
        };
    }
};

/** DELETE /api/roles/{roleId} — Xóa vai trò */
export const deleteRole = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axiosClient.delete(ROLE_ENDPOINTS.DELETE(id));
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Xóa vai trò thất bại',
        };
    }
};

/** PATCH /api/roles/{roleId}/status — Bật/tắt vai trò */
export const toggleRoleStatus = async (id: string, data: { status: 'ACTIVE' | 'INACTIVE' } | { isActive: boolean }): Promise<any> => {
    try {
        // Swagger: { status: "INACTIVE" }
        const payload = 'status' in data ? data : { status: data.isActive ? 'ACTIVE' : 'INACTIVE' };
        const response = await axiosClient.patch(ROLE_ENDPOINTS.STATUS(id), payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật trạng thái vai trò thất bại');
    }
};

// ============================================
// 1.3.2 Permission Management
// ============================================

/** GET /api/permissions — Lấy danh sách quyền */
export const getPermissions = async (): Promise<PermissionGroup[]> => {
    try {
        const response = await axiosClient.get(PERMISSION_ENDPOINTS.LIST);
        const rawData = response.data.data || [];
        
        // Group flat permissions by module
        const map = new Map<string, PermissionData[]>();
        for (const p of rawData) {
            const mod = p.module || 'OTHER';
            if (!map.has(mod)) map.set(mod, []);
            map.get(mod)!.push(p);
        }
        
        const groups: PermissionGroup[] = Array.from(map.entries()).map(([module, perms]) => ({
            group: module,
            groupLabel: module,
            permissions: perms
        }));
        
        return groups;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Lỗi lấy danh sách quyền:', error);
        }
        return [];
    }
};

/** POST /api/permissions — Tạo quyền mới */
export const createPermission = async (data: Partial<PermissionData>): Promise<any> => {
    try {
        // Swagger: { code, module, description }
        const response = await axiosClient.post(PERMISSION_ENDPOINTS.CREATE, {
            code: data.code,
            module: data.module,
            description: data.description,
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo quyền thất bại');
    }
};

/** GET /api/permissions/{permissionId} — Chi tiết quyền */
export const getPermissionDetail = async (id: string): Promise<PermissionData | null> => {
    try {
        const response = await axiosClient.get(PERMISSION_ENDPOINTS.DETAIL(id));
        return response.data.data || null;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy chi tiết quyền thất bại');
    }
};

/** PATCH /api/permissions/{permissionId} — Cập nhật quyền */
export const updatePermission = async (id: string, data: Partial<PermissionData>): Promise<any> => {
    try {
        // Swagger: { module, description }
        const response = await axiosClient.patch(PERMISSION_ENDPOINTS.UPDATE(id), {
            module: data.module,
            description: data.description,
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật quyền thất bại');
    }
};

/** DELETE /api/permissions/{permissionId} — Xóa quyền */
export const deletePermission = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(PERMISSION_ENDPOINTS.DELETE(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa quyền thất bại');
    }
};

// ============================================
// 1.3.3 Gán quyền cho vai trò
// ============================================

/** GET /api/roles/{roleId}/permissions — Lấy quyền của vai trò */
export const getRolePermissions = async (roleId: string): Promise<any> => {
    try {
        const response = await axiosClient.get(ROLE_ENDPOINTS.PERMISSIONS(roleId));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy quyền của vai trò thất bại');
    }
};

/** PUT /api/roles/{roleId}/permissions — Thay thế danh sách quyền */
export const assignPermissions = async (
    roleId: string,
    permissionIds: string[]
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axiosClient.put(
            ROLE_ENDPOINTS.PERMISSIONS(roleId),
            { permissions: permissionIds }
        );
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Gán quyền thất bại',
        };
    }
};

/** POST /api/roles/{roleId}/permissions — Gán thêm quyền lẻ */
export const addRolePermission = async (roleId: string, permissionId: string): Promise<any> => {
    try {
        // Swagger: { permission_id: "PATIENT_VIEW" }
        const response = await axiosClient.post(ROLE_ENDPOINTS.PERMISSIONS(roleId), { permission_id: permissionId });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Gán quyền thất bại');
    }
};

/** DELETE /api/roles/{roleId}/permissions/{permissionId} — Xóa quyền lẻ */
export const removeRolePermission = async (roleId: string, permissionId: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(ROLE_ENDPOINTS.PERMISSION_DELETE(roleId, permissionId));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa quyền thất bại');
    }
};

// ============================================
// 1.3.4 Phân quyền theo module
// ============================================

/** GET /api/modules — Lấy danh sách modules */
export const getModules = async (): Promise<any> => {
    try {
        const response = await axiosClient.get(MODULE_ENDPOINTS.LIST);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách modules thất bại');
    }
};

/** GET /api/modules/{moduleName}/permissions — Quyền theo module */
export const getModulePermissions = async (moduleName: string): Promise<any> => {
    try {
        const response = await axiosClient.get(MODULE_ENDPOINTS.PERMISSIONS(moduleName));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy quyền theo module thất bại');
    }
};

// ============================================
// 1.3.5 Menu Management
// ============================================

/** GET /api/menus — Lấy danh sách menu hệ thống */
export const getMenus = async (): Promise<MenuData[]> => {
    try {
        const response = await axiosClient.get(MENU_ENDPOINTS.LIST);
        return response.data.data || [];
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy danh sách menu thất bại');
    }
};

/** POST /api/menus — Tạo menu */
export const createMenu = async (data: Partial<MenuData>): Promise<any> => {
    try {
        const response = await axiosClient.post(MENU_ENDPOINTS.CREATE, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo menu thất bại');
    }
};

/** PATCH /api/menus/{menuId} — Cập nhật menu */
export const updateMenu = async (id: string, data: Partial<MenuData>): Promise<any> => {
    try {
        const response = await axiosClient.patch(MENU_ENDPOINTS.UPDATE(id), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật menu thất bại');
    }
};

/** DELETE /api/menus/{menuId} — Xóa menu */
export const deleteMenu = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(MENU_ENDPOINTS.DELETE(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa menu thất bại');
    }
};

/** GET /api/roles/{roleId}/menus — Menu của vai trò */
export const getRoleMenus = async (roleId: string): Promise<any> => {
    try {
        const response = await axiosClient.get(ROLE_ENDPOINTS.MENUS(roleId));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy menu vai trò thất bại');
    }
};

/** POST /api/roles/{roleId}/menus — Gán menu cho vai trò */
export const addRoleMenu = async (roleId: string, menuId: string): Promise<any> => {
    try {
        const response = await axiosClient.post(ROLE_ENDPOINTS.MENUS(roleId), { menuId });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Gán menu thất bại');
    }
};

/** DELETE /api/roles/{roleId}/menus/{menuId} — Xóa menu khỏi vai trò */
export const removeRoleMenu = async (roleId: string, menuId: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(ROLE_ENDPOINTS.MENU_DELETE(roleId, menuId));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa menu khỏi vai trò thất bại');
    }
};

// ============================================
// 1.3.6 API Permissions
// ============================================

/** GET /api/api-permissions — Lấy danh sách API endpoints */
export const getApiPermissions = async (): Promise<ApiPermissionData[]> => {
    try {
        const response = await axiosClient.get(API_PERMISSION_ENDPOINTS.LIST);
        return response.data.data || [];
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy API permissions thất bại');
    }
};

/** POST /api/api-permissions — Tạo API endpoint */
export const createApiPermission = async (data: Partial<ApiPermissionData>): Promise<any> => {
    try {
        const response = await axiosClient.post(API_PERMISSION_ENDPOINTS.CREATE, data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Tạo API permission thất bại');
    }
};

/** PATCH /api/api-permissions/{id} — Cập nhật API endpoint */
export const updateApiPermission = async (id: string, data: Partial<ApiPermissionData>): Promise<any> => {
    try {
        const response = await axiosClient.patch(API_PERMISSION_ENDPOINTS.UPDATE(id), data);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật API permission thất bại');
    }
};

/** DELETE /api/api-permissions/{id} — Xóa API endpoint */
export const deleteApiPermission = async (id: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(API_PERMISSION_ENDPOINTS.DELETE(id));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa API permission thất bại');
    }
};

/** GET /api/roles/{roleId}/api-permissions — API của vai trò */
export const getRoleApiPermissions = async (roleId: string): Promise<any> => {
    try {
        const response = await axiosClient.get(ROLE_ENDPOINTS.API_PERMISSIONS(roleId));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lấy API của vai trò thất bại');
    }
};

/** PUT /api/roles/{roleId}/api-permissions — Thay thế toàn bộ API cho vai trò */
export const replaceRoleApiPermissions = async (roleId: string, apiIds: string[]): Promise<any> => {
    try {
        const response = await axiosClient.put(ROLE_ENDPOINTS.API_PERMISSIONS(roleId), { api_ids: apiIds });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Cập nhật API thất bại');
    }
};

/** POST /api/roles/{roleId}/api-permissions — Gán API cho vai trò */
export const addRoleApiPermission = async (roleId: string, apiId: string): Promise<any> => {
    try {
        const response = await axiosClient.post(ROLE_ENDPOINTS.API_PERMISSIONS(roleId), { apiId });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Gán API thất bại');
    }
};

/** DELETE /api/roles/{roleId}/api-permissions/{apiId} — Xóa API khỏi vai trò */
export const removeRoleApiPermission = async (roleId: string, apiId: string): Promise<any> => {
    try {
        const response = await axiosClient.delete(ROLE_ENDPOINTS.API_PERMISSION_DELETE(roleId, apiId));
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Xóa API khỏi vai trò thất bại');
    }
};

export default {
    // Roles
    getRoles,
    createRole,
    getRoleDetail,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    // Permissions
    getPermissions,
    createPermission,
    getPermissionDetail,
    updatePermission,
    deletePermission,
    // Role-Permission
    getRolePermissions,
    assignPermissions,
    addRolePermission,
    removeRolePermission,
    // Modules
    getModules,
    getModulePermissions,
    // Menus
    getMenus,
    createMenu,
    updateMenu,
    deleteMenu,
    getRoleMenus,
    addRoleMenu,
    removeRoleMenu,
    // API Permissions
    getApiPermissions,
    createApiPermission,
    updateApiPermission,
    deleteApiPermission,
    getRoleApiPermissions,
    addRoleApiPermission,
    removeRoleApiPermission,
};
