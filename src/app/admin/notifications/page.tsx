"use client";

import { useState, useEffect } from "react";
import {
    getNotificationCategories,
    createNotificationCategory,
    updateNotificationCategory,
    deleteNotificationCategory,
    getNotificationTemplates,
    createNotificationTemplate,
    updateNotificationTemplate,
    deleteNotificationTemplate,
    getNotificationRoleConfigs,
    updateNotificationRoleConfig,
    sendAdminBroadcast,
    NotificationCategory,
    NotificationTemplate,
} from "@/services/notificationService";
import { useToast } from "@/contexts/ToastContext";
import { getRoles } from "@/services/permissionService";


type ActiveTab = "categories" | "templates" | "roleconfigs" | "broadcast";

type RoleOption = { id: string; code: string; label: string };

export default function AdminNotifications() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<ActiveTab>("categories");
    const [categories, setCategories] = useState<NotificationCategory[]>([]);
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [roleConfigs, setRoleConfigs] = useState<any[]>([]);
    const [loadingCat, setLoadingCat] = useState(true);
    const [loadingTpl, setLoadingTpl] = useState(true);
    const [loadingRc, setLoadingRc] = useState(false);

    // Modal tạo/sửa category
    const [showCatModal, setShowCatModal] = useState(false);
    const [editingCat, setEditingCat] = useState<NotificationCategory | null>(null);
    const [catForm, setCatForm] = useState({ name: "", code: "", description: "" });
    const [savingCat, setSavingCat] = useState(false);

    // Modal tạo/sửa template
    const [showTplModal, setShowTplModal] = useState(false);
    const [editingTpl, setEditingTpl] = useState<NotificationTemplate | null>(null);
    const [tplForm, setTplForm] = useState({ categoryId: "", name: "", subject: "", content: "", variables: "" });
    const [savingTpl, setSavingTpl] = useState(false);

    // Broadcast
    const [bcForm, setBcForm] = useState({ title: "", content: "", roles: [] as string[], channels: [] as string[] });
    const [sendingBc, setSendingBc] = useState(false);

    // Roles loaded từ BE
    const [allRolesList, setAllRolesList] = useState<RoleOption[]>([]);

    const ALL_CHANNELS = ["in_app", "email", "sms"];
    const CHANNEL_LABELS: Record<string, string> = { in_app: "In-App", email: "Email", sms: "SMS" };

    // Fallback labels khi BE chưa trả về displayName
    const ROLE_LABEL_FALLBACK: Record<string, string> = {
        ADMIN: "Quản trị viên", admin: "Quản trị viên",
        DOCTOR: "Bác sĩ", doctor: "Bác sĩ",
        NURSE: "Y tá / Điều dưỡng", nurse: "Y tá / Điều dưỡng",
        PHARMACIST: "Dược sĩ", pharmacist: "Dược sĩ",
        STAFF: "Nhân viên", staff: "Nhân viên",
        RECEPTIONIST: "Lễ tân", receptionist: "Lễ tân",
        CASHIER: "Thu ngân", cashier: "Thu ngân",
        PATIENT: "Bệnh nhân", patient: "Bệnh nhân",
    };

    const labelForRole = (key: string): string => {
        if (!key) return "—";
        const role = allRolesList.find((r) => r.id === key || r.code === key);
        if (role?.label) return role.label;
        return ROLE_LABEL_FALLBACK[key] ?? ROLE_LABEL_FALLBACK[String(key).toUpperCase()] ?? key;
    };

    const ALL_ROLES = allRolesList.length > 0
        ? allRolesList.map((r) => r.code || r.id)
        : Object.keys(ROLE_LABEL_FALLBACK).filter((k) => k === k.toLowerCase());
    const ROLE_LABELS = new Proxy({} as Record<string, string>, {
        get: (_t, key: string) => labelForRole(key),
    });

    // Load roles thật từ BE để dùng cho cấu hình + broadcast
    useEffect(() => {
        getRoles()
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setAllRolesList(
                        data.map((r: any) => ({
                            id: String(r.id ?? r.name ?? ""),
                            code: String(r.code ?? r.name ?? ""),
                            label: r.displayName ?? r.name ?? r.code ?? "",
                        })),
                    );
                }
            })
            .catch(() => setAllRolesList([]));
    }, []);

    useEffect(() => {
        getNotificationCategories()
            .then(data => { if (data.length > 0) setCategories(data); else setCategories([]); })
            .catch(() => { setCategories([]); })
            .finally(() => setLoadingCat(false));
    }, []);

    useEffect(() => {
        getNotificationTemplates()
            .then(data => { if (data.length > 0) setTemplates(data); else setTemplates([]); })
            .catch(() => { setTemplates([]); })
            .finally(() => setLoadingTpl(false));
    }, []);

    useEffect(() => {
        if (activeTab === "roleconfigs") {
            setLoadingRc(true);
            getNotificationRoleConfigs()
                .then(data => {
                    const raw = data?.data ?? data ?? [];
                    setRoleConfigs(Array.isArray(raw) ? raw : []);
                })
                .catch(() => setRoleConfigs([]))
                .finally(() => setLoadingRc(false));
        }
    }, [activeTab]);

    // --- Category handlers ---
    const openCreateCat = () => {
        setEditingCat(null);
        setCatForm({ name: "", code: "", description: "" });
        setShowCatModal(true);
    };

    const openEditCat = (cat: NotificationCategory) => {
        setEditingCat(cat);
        setCatForm({ name: cat.name, code: cat.code, description: cat.description ?? "" });
        setShowCatModal(true);
    };

    const handleSaveCategory = async () => {
        if (!catForm.name || !catForm.code) { toast.error("Vui lòng điền tên và mã loại!"); return; }
        setSavingCat(true);
        try {
            if (editingCat) {
                await updateNotificationCategory(editingCat.id, catForm);
                setCategories(prev => prev.map(c => c.id === editingCat.id ? { ...c, ...catForm } : c));
                toast.success("Đã cập nhật loại thông báo!");
            } else {
                await createNotificationCategory(catForm);
                setCategories(prev => [...prev, { id: Date.now().toString(), ...catForm, isActive: true }]);
                toast.success("Đã tạo loại thông báo!");
            }
            setShowCatModal(false);
            setCatForm({ name: "", code: "", description: "" });
        } catch {
            toast.error(editingCat ? "Cập nhật thất bại!" : "Tạo loại thông báo thất bại!");
        } finally { setSavingCat(false); }
    };

    const handleDeleteCat = async (id: string) => {
        if (!confirm("Xóa loại thông báo này?")) return;
        try {
            await deleteNotificationCategory(id);
            setCategories(prev => prev.filter(c => c.id !== id));
            toast.success("Đã xóa loại thông báo!");
        } catch {
            toast.error("Xóa thất bại!");
        }
    };

    // --- Template handlers ---
    const openCreateTpl = () => {
        setEditingTpl(null);
        setTplForm({ categoryId: "", name: "", subject: "", content: "", variables: "" });
        setShowTplModal(true);
    };

    const openEditTpl = (tpl: NotificationTemplate) => {
        setEditingTpl(tpl);
        setTplForm({
            categoryId: tpl.categoryId,
            name: tpl.name,
            subject: tpl.subject ?? "",
            content: tpl.content,
            variables: (tpl.variables ?? []).join(", "),
        });
        setShowTplModal(true);
    };

    const handleSaveTemplate = async () => {
        if (!tplForm.name || !tplForm.content) { toast.error("Vui lòng điền tên và nội dung mẫu!"); return; }
        setSavingTpl(true);
        try {
            const vars = tplForm.variables ? tplForm.variables.split(",").map(v => v.trim()).filter(Boolean) : [];
            if (editingTpl) {
                await updateNotificationTemplate(editingTpl.id, { ...tplForm, variables: vars });
                setTemplates(prev => prev.map(t => t.id === editingTpl.id ? { ...t, ...tplForm, variables: vars } : t));
                toast.success("Đã cập nhật mẫu thông báo!");
            } else {
                await createNotificationTemplate({ ...tplForm, variables: vars });
                setTemplates(prev => [...prev, { id: Date.now().toString(), ...tplForm, variables: vars, isActive: true }]);
                toast.success("Đã tạo mẫu thông báo!");
            }
            setShowTplModal(false);
            setTplForm({ categoryId: "", name: "", subject: "", content: "", variables: "" });
        } catch {
            toast.error(editingTpl ? "Cập nhật mẫu thất bại!" : "Tạo mẫu thất bại!");
        } finally { setSavingTpl(false); }
    };

    const handleDeleteTpl = async (id: string) => {
        if (!confirm("Xóa mẫu thông báo này?")) return;
        try {
            await deleteNotificationTemplate(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success("Đã xóa mẫu thông báo!");
        } catch {
            toast.error("Xóa mẫu thất bại!");
        }
    };

    // --- Role config handler ---
    const handleToggleRoleConfig = async (roleId: string, categoryId: string, current: boolean) => {
        try {
            await updateNotificationRoleConfig(roleId, categoryId, { enabled: !current });
            setRoleConfigs(prev => prev.map((rc: any) => {
                if (rc.roleId === roleId) {
                    return {
                        ...rc,
                        categories: (rc.categories ?? []).map((c: any) =>
                            c.categoryId === categoryId ? { ...c, enabled: !current } : c
                        ),
                    };
                }
                return rc;
            }));
            toast.success("Đã cập nhật cấu hình!");
        } catch {
            toast.error("Cập nhật cấu hình thất bại!");
        }
    };

    // --- Broadcast ---
    const handleBroadcast = async () => {
        if (!bcForm.title || !bcForm.content) { toast.error("Vui lòng điền tiêu đề và nội dung!"); return; }
        if (bcForm.roles.length === 0) { toast.error("Chọn ít nhất một nhóm nhận!"); return; }
        if (bcForm.channels.length === 0) { toast.error("Chọn ít nhất một kênh gửi!"); return; }
        setSendingBc(true);
        try {
            await sendAdminBroadcast({
                title: bcForm.title,
                content: bcForm.content,
                targetRoles: bcForm.roles,
                channels: bcForm.channels,
            });
            toast.success(`Đã gửi thông báo tới ${bcForm.roles.length} nhóm qua ${bcForm.channels.length} kênh.`);
            setBcForm({ title: "", content: "", roles: [], channels: [] });
        } catch (err: any) {
            toast.error(err?.message || "Gửi thông báo thất bại!");
        } finally { setSendingBc(false); }
    };

    const toggleRole = (r: string) => setBcForm(prev => ({ ...prev, roles: prev.roles.includes(r) ? prev.roles.filter(x => x !== r) : [...prev.roles, r] }));
    const toggleChannel = (c: string) => setBcForm(prev => ({ ...prev, channels: prev.channels.includes(c) ? prev.channels.filter(x => x !== c) : [...prev.channels, c] }));
    const catOfTemplate = (categoryId: string) => categories.find(c => c.id === categoryId)?.name ?? "—";

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Quản lý Thông báo</h1>
                        <p className="text-sm text-[#687582] mt-1">Cấu hình loại, mẫu thông báo và gửi thông báo hàng loạt</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { l: "Loại thông báo", v: categories.length, i: "category", c: "text-blue-600" },
                        { l: "Loại đang bật", v: categories.filter(c => c.isActive).length, i: "check_circle", c: "text-emerald-600" },
                        { l: "Tổng mẫu", v: templates.length, i: "description", c: "text-violet-600" },
                        { l: "Mẫu đang dùng", v: templates.filter(t => t.isActive).length, i: "task_alt", c: "text-amber-600" },
                    ].map(s => (
                        <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-3">
                            <span className={`material-symbols-outlined ${s.c}`} style={{ fontSize: "24px" }}>{s.i}</span>
                            <div><p className="text-lg font-bold text-[#121417] dark:text-white">{s.v}</p><p className="text-[11px] text-[#687582]">{s.l}</p></div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
                    {([
                        ["categories", "Loại thông báo", "category"],
                        ["templates", "Mẫu thông báo", "description"],
                        ["roleconfigs", "Cấu hình Role", "manage_accounts"],
                        ["broadcast", "Gửi hàng loạt", "send"],
                    ] as const).map(([key, label, icon]) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-w-fit px-3 ${activeTab === key ? "bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white shadow-sm" : "text-[#687582] hover:text-[#121417]"}`}>
                            <span className="material-symbols-outlined text-[18px]">{icon}</span>{label}
                        </button>
                    ))}
                </div>

                {/* ===== Tab: Categories ===== */}
                {activeTab === "categories" && (
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                        <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#121417] dark:text-white">Danh sách loại thông báo ({categories.length})</p>
                            <button onClick={openCreateCat}
                                className="flex items-center gap-1.5 px-3 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors">
                                <span className="material-symbols-outlined text-[18px]">add</span>Thêm loại
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead><tr className="border-b border-[#dde0e4] dark:border-[#2d353e]">
                                    {["Tên loại", "Mã", "Mô tả", "Trạng thái", "Thao tác"].map(h => (
                                        <th key={h} className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {loadingCat ? (
                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#687582]">Đang tải...</td></tr>
                                    ) : categories.map(cat => (
                                        <tr key={cat.id} className="border-b border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-3 text-sm font-semibold text-[#121417] dark:text-white">{cat.name}</td>
                                            <td className="px-4 py-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-[#3C81C6]">{cat.code}</code></td>
                                            <td className="px-4 py-3 text-sm text-[#687582]">{cat.description ?? "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cat.isActive ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-gray-100 text-gray-500 dark:bg-gray-700"}`}>
                                                    {cat.isActive ? "Đang bật" : "Tắt"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openEditCat(cat)}
                                                        aria-label="Sửa loại thông báo"
                                                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-[#687582] hover:text-[#3C81C6] transition-colors" title="Sửa">
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    </button>
                                                    <button onClick={() => handleDeleteCat(cat.id)}
                                                        aria-label="Xóa loại thông báo"
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[#687582] hover:text-red-500 transition-colors" title="Xóa">
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===== Tab: Templates ===== */}
                {activeTab === "templates" && (
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                        <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#121417] dark:text-white">Mẫu thông báo ({templates.length})</p>
                            <button onClick={openCreateTpl}
                                className="flex items-center gap-1.5 px-3 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors">
                                <span className="material-symbols-outlined text-[18px]">add</span>Thêm mẫu
                            </button>
                        </div>
                        <div className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                            {loadingTpl ? (
                                <div className="p-8 text-center text-sm text-[#687582]">Đang tải...</div>
                            ) : templates.map(tpl => (
                                <div key={tpl.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white">{tpl.name}</p>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600">{catOfTemplate(tpl.categoryId)}</span>
                                                {!tpl.isActive && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">Tắt</span>}
                                            </div>
                                            {tpl.subject && <p className="text-xs text-[#687582] mb-1">Tiêu đề: <span className="italic">{tpl.subject}</span></p>}
                                            <p className="text-xs text-[#687582] line-clamp-2">{tpl.content}</p>
                                            {tpl.variables && tpl.variables.length > 0 && (
                                                <div className="flex gap-1 flex-wrap mt-2">
                                                    {tpl.variables.map(v => (
                                                        <code key={v} className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-1.5 py-0.5 rounded">{"{{" + v + "}}"}</code>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => openEditTpl(tpl)}
                                                aria-label="Sửa mẫu thông báo"
                                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-[#687582] hover:text-[#3C81C6] transition-colors" title="Sửa">
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                            <button onClick={() => handleDeleteTpl(tpl.id)}
                                                aria-label="Xóa mẫu thông báo"
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[#687582] hover:text-red-500 transition-colors" title="Xóa">
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== Tab: Role Configs ===== */}
                {activeTab === "roleconfigs" && (
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                        <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <p className="text-sm font-semibold text-[#121417] dark:text-white">Cấu hình thông báo theo vai trò</p>
                            <p className="text-xs text-[#687582] mt-0.5">Bật/tắt từng loại thông báo cho từng nhóm người dùng</p>
                        </div>
                        {loadingRc ? (
                            <div className="p-8 text-center text-sm text-[#687582]">Đang tải...</div>
                        ) : allRolesList.length === 0 && roleConfigs.length === 0 ? (
                            <div className="p-8 text-center">
                                <span className="material-symbols-outlined text-4xl text-[#b0b8c1] block mb-3">manage_accounts</span>
                                <p className="text-sm text-[#687582]">Không tải được danh sách vai trò. Kiểm tra kết nối tới <code className="text-xs">/api/roles</code>.</p>
                            </div>
                        ) : roleConfigs.length === 0 ? (
                            <div className="overflow-x-auto p-4">
                                <p className="text-xs text-[#687582] mb-3">Chưa có cấu hình. Bật toggle để khởi tạo cấu hình cho từng vai trò.</p>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800">
                                            <th className="px-4 py-2 text-left text-[#687582] text-xs font-semibold">Vai trò</th>
                                            {categories.map(c => (
                                                <th key={c.id} className="px-4 py-2 text-center text-[#687582] text-xs font-semibold">{c.name}</th>
                                            ))}
                                            {categories.length === 0 && (
                                                <th className="px-4 py-2 text-center text-[#687582] text-xs font-semibold">(Chưa có loại thông báo)</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ALL_ROLES.map(role => (
                                            <tr key={role} className="border-t border-[#dde0e4] dark:border-[#2d353e]">
                                                <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{labelForRole(role)}</td>
                                                {categories.map(c => (
                                                    <td key={c.id} className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleToggleRoleConfig(role, c.id, false)}
                                                            className="w-10 h-6 rounded-full bg-gray-200 dark:bg-gray-700 relative transition-colors hover:bg-[#3C81C6]/50"
                                                            title="Click để bật">
                                                            <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform" />
                                                        </button>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="overflow-x-auto p-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800">
                                            <th className="px-4 py-2 text-left text-[#687582] text-xs font-semibold">Vai trò</th>
                                            {categories.map(c => (
                                                <th key={c.id} className="px-4 py-2 text-center text-[#687582] text-xs font-semibold">{c.name}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roleConfigs.map((rc: any) => (
                                            <tr key={rc.roleId ?? rc.role} className="border-t border-[#dde0e4] dark:border-[#2d353e]">
                                                <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">
                                                    {ROLE_LABELS[rc.roleId ?? rc.role] ?? rc.roleId ?? rc.role}
                                                </td>
                                                {categories.map(c => {
                                                    const config = (rc.categories ?? []).find((x: any) => x.categoryId === c.id || x.categoryCode === c.code);
                                                    const enabled = config?.enabled ?? false;
                                                    return (
                                                        <td key={c.id} className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => handleToggleRoleConfig(rc.roleId ?? rc.role, c.id, enabled)}
                                                                className={`w-10 h-6 rounded-full relative transition-colors ${enabled ? 'bg-[#3C81C6]' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-5' : 'left-1'}`} />
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== Tab: Broadcast ===== */}
                {activeTab === "broadcast" && (
                    <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-6 space-y-5">
                        <div>
                            <h3 className="text-base font-bold text-[#121417] dark:text-white mb-4">Gửi thông báo hàng loạt</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Tiêu đề *</label>
                                    <input type="text" value={bcForm.title} onChange={e => setBcForm(p => ({ ...p, title: e.target.value }))} aria-label="Tiêu đề thông báo" placeholder="VD: Thông báo bảo trì hệ thống"
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Nội dung *</label>
                                    <textarea value={bcForm.content} onChange={e => setBcForm(p => ({ ...p, content: e.target.value }))} rows={4} placeholder="Nội dung thông báo..."
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 resize-none dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-2">Gửi đến nhóm *</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {ALL_ROLES.map(r => (
                                            <button key={r} onClick={() => toggleRole(r)}
                                                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${bcForm.roles.includes(r) ? "bg-[#3C81C6] text-white border-[#3C81C6]" : "bg-white dark:bg-[#13191f] text-[#687582] border-[#dde0e4] dark:border-[#2d353e] hover:border-[#3C81C6]"}`}>
                                                {ROLE_LABELS[r]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-2">Kênh gửi</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {ALL_CHANNELS.map(c => (
                                            <button key={c} onClick={() => toggleChannel(c)}
                                                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${bcForm.channels.includes(c) ? "bg-violet-600 text-white border-violet-600" : "bg-white dark:bg-[#13191f] text-[#687582] border-[#dde0e4] dark:border-[#2d353e] hover:border-violet-400"}`}>
                                                {CHANNEL_LABELS[c]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                                    <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5">warning</span>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">Thông báo sẽ được gửi ngay lập tức đến <strong>tất cả người dùng</strong> thuộc nhóm được chọn. Hành động này không thể hoàn tác.</p>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleBroadcast} disabled={sendingBc || !bcForm.title || !bcForm.content || bcForm.roles.length === 0 || bcForm.channels.length === 0}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 shadow-md shadow-blue-200 dark:shadow-none">
                                        <span className="material-symbols-outlined text-[18px]">{sendingBc ? "hourglass_top" : "send"}</span>
                                        {sendingBc ? "Đang gửi..." : "Gửi thông báo"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Category */}
            {showCatModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCatModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h2 className="text-base font-bold text-[#121417] dark:text-white">
                                {editingCat ? "Sửa loại thông báo" : "Tạo loại thông báo mới"}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Tên loại *</label>
                                <input type="text" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} aria-label="Tên loại thông báo" placeholder="VD: Lịch hẹn"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-[#3C81C6]/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Mã (code) *</label>
                                <input type="text" value={catForm.code} onChange={e => setCatForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, "_") }))} aria-label="Mã loại thông báo" placeholder="VD: APPOINTMENT"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-mono outline-none dark:text-white focus:ring-2 focus:ring-[#3C81C6]/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Mô tả</label>
                                <textarea value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} rows={2}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white resize-none" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#dde0e4] dark:border-[#2d353e] flex justify-end gap-3">
                            <button onClick={() => setShowCatModal(false)} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Hủy</button>
                            <button onClick={handleSaveCategory} disabled={savingCat}
                                className="px-5 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-xl disabled:opacity-40">
                                {savingCat ? "Đang lưu..." : editingCat ? "Cập nhật" : "Tạo loại"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Template */}
            {showTplModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTplModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h2 className="text-base font-bold text-[#121417] dark:text-white">
                                {editingTpl ? "Sửa mẫu thông báo" : "Tạo mẫu thông báo mới"}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Loại thông báo</label>
                                <select value={tplForm.categoryId} onChange={e => setTplForm(p => ({ ...p, categoryId: e.target.value }))}
                                    aria-label="Loại thông báo"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white">
                                    <option value="">-- Chọn loại --</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Tên mẫu *</label>
                                <input type="text" value={tplForm.name} onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))} aria-label="Tên mẫu thông báo" placeholder="VD: Xác nhận lịch hẹn"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-[#3C81C6]/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Tiêu đề email</label>
                                <input type="text" value={tplForm.subject} onChange={e => setTplForm(p => ({ ...p, subject: e.target.value }))} placeholder="VD: Xác nhận lịch khám ngày {{date}}"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Nội dung *</label>
                                <textarea value={tplForm.content} onChange={e => setTplForm(p => ({ ...p, content: e.target.value }))} rows={4} placeholder="Dùng {{biến}} để chèn dữ liệu động..."
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none dark:text-white resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Biến động (ngăn bởi dấu phẩy)</label>
                                <input type="text" value={tplForm.variables} onChange={e => setTplForm(p => ({ ...p, variables: e.target.value }))} aria-label="Biến động" placeholder="VD: patientName, date, time"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-mono outline-none dark:text-white" />
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#dde0e4] dark:border-[#2d353e] flex justify-end gap-3">
                            <button onClick={() => setShowTplModal(false)} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Hủy</button>
                            <button onClick={handleSaveTemplate} disabled={savingTpl}
                                className="px-5 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-xl disabled:opacity-40">
                                {savingTpl ? "Đang lưu..." : editingTpl ? "Cập nhật" : "Tạo mẫu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
