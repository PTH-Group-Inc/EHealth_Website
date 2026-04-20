"use client";

import { useCallback, useEffect, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { NOTIFICATION_ENDPOINTS, ROLE_ENDPOINTS } from "@/api/endpoints";
import { unwrapList } from "@/api/response";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader } from "@/components/shared/layout";

interface Role { id: string; name: string; }

export default function BroadcastPage() {
    const toast = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [form, setForm] = useState({
        title: "",
        content: "",
        target: "ALL" as "ALL" | "ROLES",
        selectedRoles: new Set<string>(),
        channels: new Set<string>(["INBOX"]),
        priority: "NORMAL" as "LOW" | "NORMAL" | "HIGH",
    });
    const [sending, setSending] = useState(false);

    const loadRoles = useCallback(async () => {
        try {
            const res = await axiosClient.get(ROLE_ENDPOINTS.LIST, { params: { limit: 100 } });
            const { data } = unwrapList<any>(res);
            setRoles(data.map((r: any) => ({ id: String(r.role_id ?? r.roles_id ?? r.id), name: r.name ?? r.role_name })));
        } catch {
            setRoles([]);
        }
    }, []);

    useEffect(() => { loadRoles(); }, [loadRoles]);

    const toggleRole = (id: string) => {
        const next = new Set(form.selectedRoles);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setForm({ ...form, selectedRoles: next });
    };

    const toggleChannel = (c: string) => {
        const next = new Set(form.channels);
        if (next.has(c)) next.delete(c);
        else next.add(c);
        setForm({ ...form, channels: next });
    };

    const handleSend = async () => {
        if (!form.title.trim() || !form.content.trim()) { toast.warning("Nhập tiêu đề + nội dung."); return; }
        if (form.target === "ROLES" && form.selectedRoles.size === 0) { toast.warning("Chọn ít nhất 1 vai trò."); return; }
        if (form.channels.size === 0) { toast.warning("Chọn ít nhất 1 kênh."); return; }

        if (!confirm(`Gửi broadcast "${form.title}" tới ${form.target === "ALL" ? "TẤT CẢ" : form.selectedRoles.size + " vai trò"}?`)) return;

        setSending(true);
        try {
            await axiosClient.post(NOTIFICATION_ENDPOINTS.ADMIN_BROADCAST, {
                title: form.title.trim(),
                content: form.content.trim(),
                target: form.target,
                role_ids: form.target === "ROLES" ? Array.from(form.selectedRoles) : undefined,
                channels: Array.from(form.channels),
                priority: form.priority,
            });
            toast.success("Đã gửi broadcast.");
            setForm({ title: "", content: "", target: "ALL", selectedRoles: new Set(), channels: new Set(["INBOX"]), priority: "NORMAL" });
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không gửi được.");
        } finally { setSending(false); }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Gửi thông báo hàng loạt"
                subtitle="Broadcast tới tất cả người dùng hoặc theo vai trò"
                icon="campaign"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Thông báo" }, { label: "Broadcast" }]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Form */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tiêu đề *</label>
                            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100}
                                placeholder="VD: Thông báo bảo trì hệ thống..."
                                className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Nội dung * ({form.content.length}/500)</label>
                            <textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value.slice(0, 500) })}
                                placeholder="Nội dung thông báo sẽ gửi tới người nhận..."
                                className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Mức độ ưu tiên</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["LOW", "NORMAL", "HIGH"] as const).map((p) => (
                                    <button key={p} onClick={() => setForm({ ...form, priority: p })}
                                        className={`px-3 py-2 rounded-xl border text-sm font-medium ${form.priority === p ? "border-[#3C81C6] bg-[#3C81C6]/10 text-[#3C81C6]" : "border-[#dde0e4] dark:border-[#2d353e] text-[#687582]"}`}>
                                        {p === "LOW" ? "Thấp" : p === "NORMAL" ? "Bình thường" : "Cao"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Người nhận</label>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <button onClick={() => setForm({ ...form, target: "ALL" })}
                                    className={`px-3 py-2 rounded-xl border text-sm font-medium ${form.target === "ALL" ? "border-[#3C81C6] bg-[#3C81C6]/10 text-[#3C81C6]" : "border-[#dde0e4] dark:border-[#2d353e] text-[#687582]"}`}>
                                    Tất cả user
                                </button>
                                <button onClick={() => setForm({ ...form, target: "ROLES" })}
                                    className={`px-3 py-2 rounded-xl border text-sm font-medium ${form.target === "ROLES" ? "border-[#3C81C6] bg-[#3C81C6]/10 text-[#3C81C6]" : "border-[#dde0e4] dark:border-[#2d353e] text-[#687582]"}`}>
                                    Theo vai trò
                                </button>
                            </div>
                            {form.target === "ROLES" && (
                                <div className="border border-[#dde0e4] dark:border-[#2d353e] rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                                    {roles.map((r) => (
                                        <label key={r.id} className="flex items-center gap-2 p-1.5 hover:bg-[#f8f9fa] dark:hover:bg-[#13191f] rounded cursor-pointer">
                                            <input type="checkbox" checked={form.selectedRoles.has(r.id)} onChange={() => toggleRole(r.id)} className="w-4 h-4 rounded border-[#dde0e4] text-[#3C81C6]" />
                                            <span className="text-sm text-[#121417] dark:text-white">{r.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Kênh gửi</label>
                            <div className="grid grid-cols-4 gap-2">
                                {["INBOX", "EMAIL", "SMS", "PUSH"].map((c) => (
                                    <label key={c} className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${form.channels.has(c) ? "border-[#3C81C6] bg-[#3C81C6]/10 text-[#3C81C6]" : "border-[#dde0e4] dark:border-[#2d353e] text-[#687582]"}`}>
                                        <input type="checkbox" checked={form.channels.has(c)} onChange={() => toggleChannel(c)} className="sr-only" />
                                        {c}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-5 sticky top-6">
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>visibility</span>Xem trước
                        </h3>
                        <div className="rounded-xl bg-gradient-to-br from-[#3C81C6]/10 to-[#1d4ed8]/10 border border-[#3C81C6]/20 p-3 mb-3">
                            <div className="flex items-start gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${form.priority === "HIGH" ? "bg-red-500" : form.priority === "LOW" ? "bg-gray-400" : "bg-[#3C81C6]"}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>campaign</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-[#121417] dark:text-white line-clamp-2">{form.title || "(Tiêu đề)"}</div>
                                    <div className="text-xs text-[#687582] mt-1 line-clamp-4">{form.content || "(Nội dung)"}</div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-xs mb-4">
                            <div className="flex justify-between"><span className="text-[#687582]">Người nhận</span><span className="font-semibold">{form.target === "ALL" ? "TẤT CẢ" : `${form.selectedRoles.size} vai trò`}</span></div>
                            <div className="flex justify-between"><span className="text-[#687582]">Kênh</span><span className="font-semibold">{form.channels.size} kênh</span></div>
                            <div className="flex justify-between"><span className="text-[#687582]">Ưu tiên</span><span className="font-semibold">{form.priority}</span></div>
                        </div>
                        <button onClick={handleSend} disabled={sending}
                            className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>send</span>
                            {sending ? "Đang gửi..." : "Gửi broadcast"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
