"use client";

/**
 * Hồ sơ cá nhân — Phase I.7 Nhóm 7 (5 phân hệ).
 * Spec: dòng 7681-7995.
 *
 * 5 tab: profile / security / sessions / settings / notifications.
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import { profileService, type MyProfile, type ProfileSession } from "@/services/profileService";
import axiosClient from "@/api/axiosClient";

const TABS = [
    { key: "profile", label: "Hồ sơ", icon: "person" },
    { key: "security", label: "Bảo mật", icon: "lock" },
    { key: "sessions", label: "Phiên đăng nhập", icon: "devices" },
    { key: "settings", label: "Cài đặt", icon: "tune" },
    { key: "notifications", label: "Thông báo", icon: "notifications" },
] as const;

type TabKey = typeof TABS[number]["key"];

const fmtDateTime = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleString("vi-VN"); } catch { return v; } };

function ProfileTab() {
    const [me, setMe] = useState<MyProfile | null>(null);
    const [form, setForm] = useState<Partial<MyProfile>>({});
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        profileService.getMe().then(p => { setMe(p); setForm(p); }).catch(() => {});
    }, []);

    const onSave = async () => {
        setSaving(true);
        try {
            const updated = await profileService.updateMe(form);
            setMe(updated);
            alert("Đã lưu hồ sơ.");
        } catch (e: any) { alert(e?.message ?? "Lưu thất bại"); }
        finally { setSaving(false); }
    };

    const onUploadAvatar = async (file: File) => {
        setUploading(true);
        try {
            await profileService.uploadAvatar(file);
            const updated = await profileService.getMe();
            setMe(updated);
        } catch (e: any) { alert(e?.message ?? "Upload thất bại"); }
        finally { setUploading(false); }
    };

    const onRemoveAvatar = async () => {
        if (!confirm("Xoá ảnh đại diện?")) return;
        try { await profileService.deleteAvatar(); const updated = await profileService.getMe(); setMe(updated); }
        catch (e: any) { alert(e?.message ?? "Xoá thất bại"); }
    };

    if (!me) return <p className="text-center py-8 text-[#687582]">Đang tải hồ sơ…</p>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-5 text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mb-3">
                    {(me as any).avatarUrl || (me as any).avatar_url ? (
                        <img src={(me as any).avatarUrl ?? (me as any).avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span className="material-symbols-outlined text-[80px] text-gray-400 leading-[128px]">person</span>
                    )}
                </div>
                <p className="font-bold text-base">{me.fullName ?? (me as any).full_name ?? "—"}</p>
                <p className="text-xs text-[#687582]">{me.email}</p>
                <div className="mt-4 flex flex-col gap-2">
                    <label className="px-3 py-2 text-sm rounded-lg bg-[#3C81C6] text-white hover:bg-[#2a6da8] cursor-pointer">
                        {uploading ? "Đang upload…" : "Đổi avatar"}
                        <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onUploadAvatar(e.target.files[0])} />
                    </label>
                    {((me as any).avatarUrl || (me as any).avatar_url) && (
                        <button onClick={onRemoveAvatar} className="px-3 py-2 text-sm rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                            Xoá avatar
                        </button>
                    )}
                </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold mb-3">Thông tin cá nhân</h3>
                <div>
                    <label className="block text-xs text-[#687582] mb-1">Họ và tên</label>
                    <input value={form.fullName ?? (form as any).full_name ?? ""} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                </div>
                <div>
                    <label className="block text-xs text-[#687582] mb-1">Email</label>
                    <input value={form.email ?? ""} disabled className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-gray-50 dark:bg-gray-900 text-[#687582]" />
                </div>
                <div>
                    <label className="block text-xs text-[#687582] mb-1">Số điện thoại</label>
                    <input value={form.phone ?? ""} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                </div>
                <div className="flex justify-end">
                    <button onClick={onSave} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-[#3C81C6] text-white disabled:opacity-50">
                        {saving ? "Đang lưu…" : "Lưu thay đổi"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SecurityTab() {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [saving, setSaving] = useState(false);

    const onChange = async () => {
        if (next !== confirmPwd) { alert("Xác nhận mật khẩu không khớp."); return; }
        if (next.length < 8) { alert("Mật khẩu mới tối thiểu 8 ký tự."); return; }
        setSaving(true);
        try {
            await profileService.changePassword({ currentPassword: current, newPassword: next });
            alert("Đổi mật khẩu thành công.");
            setCurrent(""); setNext(""); setConfirmPwd("");
        } catch (e: any) { alert(e?.response?.data?.message ?? e?.message ?? "Đổi thất bại"); }
        finally { setSaving(false); }
    };

    return (
        <div className="max-w-xl bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold">Đổi mật khẩu</h3>
            <div>
                <label className="block text-xs text-[#687582] mb-1">Mật khẩu hiện tại</label>
                <input type="password" value={current} onChange={e => setCurrent(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
            </div>
            <div>
                <label className="block text-xs text-[#687582] mb-1">Mật khẩu mới</label>
                <input type="password" value={next} onChange={e => setNext(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
                <p className="text-xs text-[#687582] mt-1">Tối thiểu 8 ký tự.</p>
            </div>
            <div>
                <label className="block text-xs text-[#687582] mb-1">Xác nhận mật khẩu mới</label>
                <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
            </div>
            <button onClick={onChange} disabled={saving || !current || !next} className="w-full px-4 py-2 text-sm rounded-lg bg-[#3C81C6] text-white disabled:opacity-50">
                {saving ? "Đang đổi…" : "Đổi mật khẩu"}
            </button>
        </div>
    );
}

function SessionsTab() {
    const [items, setItems] = useState<ProfileSession[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await profileService.getSessions();
            setItems((res as any)?.data ?? []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const onLogoutAll = async () => {
        if (!confirm("Đăng xuất tất cả thiết bị khác?")) return;
        try { await profileService.logoutAllOthers(); await load(); }
        catch (e: any) { alert(e?.message ?? "Thao tác thất bại"); }
    };

    const onLogout = async (id: string) => {
        if (!confirm("Đăng xuất thiết bị này?")) return;
        try { await profileService.logoutSession(id); await load(); }
        catch (e: any) { alert(e?.message ?? "Thao tác thất bại"); }
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                <h3 className="text-sm font-bold">Phiên đăng nhập ({items.length})</h3>
                {items.length > 1 && (
                    <button onClick={onLogoutAll} className="px-3 py-1.5 text-xs rounded bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300">
                        Đăng xuất tất cả thiết bị khác
                    </button>
                )}
            </div>
            {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
            : items.length === 0 ? <EmptyState icon="devices" title="Chưa có session" />
            : (
                <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                    {items.map((s: any) => (
                        <li key={s.id} className="p-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-[24px] text-[#3C81C6]">devices</span>
                            <div className="flex-1">
                                <p className="font-medium text-sm">
                                    {s.deviceName ?? s.device_name ?? s.userAgent?.slice(0, 50) ?? "Thiết bị không xác định"}
                                    {s.isCurrent || s.is_current ? <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Hiện tại</span> : null}
                                </p>
                                <p className="text-xs text-[#687582]">IP: {s.ip ?? "—"}</p>
                                <p className="text-xs text-[#687582]">Đăng nhập: {fmtDateTime(s.loginAt ?? s.login_at)} · Hoạt động: {fmtDateTime(s.lastActiveAt ?? s.last_active_at)}</p>
                            </div>
                            {!(s.isCurrent || s.is_current) && (
                                <button onClick={() => onLogout(s.id)} className="px-2 py-1 text-xs rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                    Đăng xuất
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function SettingsTab() {
    const [me, setMe] = useState<any>(null);
    const [theme, setTheme] = useState("light");
    const [language, setLanguage] = useState("vi");
    const [emailNotif, setEmailNotif] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        profileService.getMe().then((p: any) => {
            setMe(p);
            const s = p?.settings ?? {};
            setTheme(s.theme ?? "light");
            setLanguage(s.language ?? "vi");
            setEmailNotif(s.email_notification ?? true);
        }).catch(() => {});
    }, []);

    const onSave = async () => {
        setSaving(true);
        try {
            await profileService.updateSettings({ theme, language, email_notification: emailNotif });
            alert("Đã lưu cài đặt.");
        } catch (e: any) { alert(e?.message ?? "Lưu thất bại"); }
        finally { setSaving(false); }
    };

    return (
        <div className="max-w-xl bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold">Tuỳ chọn cá nhân</h3>
            <div>
                <label className="block text-xs text-[#687582] mb-1">Giao diện</label>
                <select value={theme} onChange={e => setTheme(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                    <option value="light">Sáng</option>
                    <option value="dark">Tối</option>
                    <option value="system">Theo hệ thống</option>
                </select>
            </div>
            <div>
                <label className="block text-xs text-[#687582] mb-1">Ngôn ngữ</label>
                <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]">
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                    <option value="zh-CN">中文</option>
                </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)} />
                Nhận thông báo qua email
            </label>
            <button onClick={onSave} disabled={saving} className="w-full px-4 py-2 text-sm rounded-lg bg-[#3C81C6] text-white disabled:opacity-50">
                {saving ? "Đang lưu…" : "Lưu cài đặt"}
            </button>
        </div>
    );
}

function NotificationsTab() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await axiosClient.get("/api/notifications/inbox");
            const d = r?.data?.data ?? r?.data ?? [];
            setItems(Array.isArray(d) ? d : []);
        } catch { setItems([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = items.filter((n: any) => filter === "ALL" || !n.read_at && !n.is_read);

    const onMarkRead = async (id: string) => {
        try { await axiosClient.put(`/api/notifications/inbox/${id}/read`); await load(); }
        catch {}
    };

    const onMarkAllRead = async () => {
        try { await axiosClient.put(`/api/notifications/inbox/read-all`); await load(); }
        catch {}
    };

    return (
        <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                <div className="flex gap-2">
                    {["ALL", "UNREAD"].map(f => (
                        <button key={f} onClick={() => setFilter(f as any)} className={`px-2 py-1 text-xs rounded ${filter === f ? "bg-[#3C81C6] text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                            {f === "ALL" ? "Tất cả" : "Chưa đọc"}
                        </button>
                    ))}
                </div>
                <button onClick={onMarkAllRead} className="px-3 py-1.5 text-xs rounded bg-blue-50 text-blue-700">Đánh dấu tất cả đã đọc</button>
            </div>
            {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
            : filtered.length === 0 ? <EmptyState icon="notifications" title="Không có thông báo" />
            : (
                <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                    {filtered.map((n: any) => (
                        <li key={n.id} className={`p-4 flex items-start gap-3 ${!(n.read_at || n.is_read) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                            <span className="material-symbols-outlined text-[#3C81C6]">notifications</span>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{n.title ?? n.subject ?? "Thông báo"}</p>
                                <p className="text-sm text-[#687582]">{n.body ?? n.content ?? n.message}</p>
                                <p className="text-xs text-[#687582] mt-1">{fmtDateTime(n.created_at ?? n.createdAt)}</p>
                            </div>
                            {!(n.read_at || n.is_read) && (
                                <button onClick={() => onMarkRead(n.id)} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200">
                                    Đã đọc
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function DoctorSettingsPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const initialTab = (sp.get("tab") as TabKey) ?? "profile";
    const [tab, setTab] = useState<TabKey>(initialTab);

    const onTab = (t: TabKey) => {
        setTab(t);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", t);
        router.replace(url.pathname + url.search);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Hồ sơ cá nhân"
                subtitle="Profile, bảo mật, sessions, cài đặt và thông báo cá nhân."
                icon="account_circle"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Hồ sơ cá nhân" },
                ]}
            />

            <div className="flex flex-wrap gap-2 mb-4 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => onTab(t.key)}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key
                            ? "border-[#3C81C6] text-[#3C81C6]"
                            : "border-transparent text-[#687582] hover:text-[#121417] dark:hover:text-white"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[16px] mr-1 align-middle">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "profile" && <ProfileTab />}
            {tab === "security" && <SecurityTab />}
            {tab === "sessions" && <SessionsTab />}
            {tab === "settings" && <SettingsTab />}
            {tab === "notifications" && <NotificationsTab />}
        </div>
    );
}
