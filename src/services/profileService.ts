/**
 * Profile Service — Hồ sơ cá nhân + bảo mật + sessions + settings.
 * Swagger: /api/profile/*
 */

import axiosClient from "@/api/axiosClient";
import { PROFILE_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export interface MyProfile {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    role?: string;
    settings?: any;
    [key: string]: any;
}

export interface ProfileSession {
    id: string;
    deviceName?: string;
    userAgent?: string;
    ip?: string;
    loginAt?: string;
    lastActiveAt?: string;
    isCurrent?: boolean;
    [key: string]: any;
}

export const profileService = {
    getMe: async () => {
        const res = await axiosClient.get(PROFILE_ENDPOINTS.ME);
        return unwrap<MyProfile>(res);
    },

    updateMe: async (data: Partial<MyProfile>) => {
        const res = await axiosClient.put(PROFILE_ENDPOINTS.ME, data);
        return unwrap<MyProfile>(res);
    },

    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
        const res = await axiosClient.put(PROFILE_ENDPOINTS.CHANGE_PASSWORD, {
            current_password: data.currentPassword,
            new_password: data.newPassword,
        });
        return unwrap<any>(res);
    },

    uploadAvatar: async (file: File) => {
        const formData = new FormData();
        formData.append("avatar", file);
        const res = await axiosClient.post("/api/profile/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return unwrap<{ url?: string }>(res);
    },

    deleteAvatar: async () => {
        const res = await axiosClient.delete("/api/profile/avatar");
        return unwrap<any>(res);
    },

    getSessions: async () => {
        const res = await axiosClient.get(PROFILE_ENDPOINTS.SESSIONS);
        return unwrapList<ProfileSession>(res);
    },

    logoutAllOthers: async () => {
        const res = await axiosClient.delete(PROFILE_ENDPOINTS.SESSIONS_LOGOUT_ALL);
        return unwrap<any>(res);
    },

    logoutSession: async (sessionId: string) => {
        const res = await axiosClient.delete(PROFILE_ENDPOINTS.SESSION_DELETE(sessionId));
        return unwrap<any>(res);
    },

    updateSettings: async (settings: any) => {
        const res = await axiosClient.put(PROFILE_ENDPOINTS.SETTINGS, settings);
        return unwrap<any>(res);
    },
};

export default profileService;
