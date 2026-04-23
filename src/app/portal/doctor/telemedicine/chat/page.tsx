"use client";

/**
 * Medical Chat — Phase I.6 #6.
 * Spec: dòng 7523-7617. Layout 2 cột: conversation list + message thread.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import axiosClient from "@/api/axiosClient";

const fmt = (v?: string) => { if (!v) return ""; try { return new Date(v).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
const fmtDate = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };

export default function MedicalChatPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const endRef = useRef<HTMLDivElement>(null);

    const loadConversations = useCallback(async () => {
        setLoading(true);
        try {
            const [c, u] = await Promise.allSettled([
                axiosClient.get("/api/teleconsultation/medical-chat/conversations"),
                axiosClient.get("/api/teleconsultation/medical-chat/unread-count"),
            ]);
            if (c.status === "fulfilled") {
                const d = (c.value as any)?.data?.data ?? (c.value as any)?.data ?? [];
                setConversations(Array.isArray(d) ? d : []);
            }
            if (u.status === "fulfilled") {
                const d = (u.value as any)?.data?.data ?? (u.value as any)?.data ?? {};
                setUnreadCount(d.count ?? d.unread ?? 0);
            }
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    const loadMessages = useCallback(async (conversationId: string) => {
        try {
            const r = await axiosClient.get(`/api/teleconsultation/medical-chat/conversations/${conversationId}/messages`);
            const d = r?.data?.data ?? r?.data ?? [];
            setMessages(Array.isArray(d) ? d : []);
            await axiosClient.put(`/api/teleconsultation/medical-chat/conversations/${conversationId}/messages/read`).catch(() => {});
        } catch { setMessages([]); }
    }, []);

    useEffect(() => { if (selected) loadMessages(selected.id); }, [selected, loadMessages]);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const sendMessage = async () => {
        if (!selected || !text.trim()) return;
        try {
            await axiosClient.post(`/api/teleconsultation/medical-chat/conversations/${selected.id}/messages`, { content: text });
            setText("");
            await loadMessages(selected.id);
        } catch (e: any) { alert(e?.message ?? "Gửi thất bại"); }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto h-[calc(100vh-100px)]">
            <PageHeader
                title="Medical Chat"
                subtitle={`Chat tư vấn y khoa với bệnh nhân${unreadCount ? ` · ${unreadCount} chưa đọc` : ""}`}
                icon="chat"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/doctor" },
                    { label: "Telemedicine", href: "/portal/doctor/telemedicine" },
                    { label: "Medical Chat" },
                ]}
            />

            <div className="grid grid-cols-12 gap-3 h-[calc(100%-100px)]">
                {/* Conversation list */}
                <div className="col-span-4 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-[#e5e7eb] dark:border-[#2d353e] text-xs font-bold uppercase text-[#687582]">Hội thoại ({conversations.length})</div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? <p className="p-4 text-center text-xs text-[#687582]">Đang tải…</p>
                        : conversations.length === 0 ? <EmptyState icon="chat" title="Chưa có hội thoại" compact />
                        : (
                            <ul>
                                {conversations.map((c: any) => (
                                    <li
                                        key={c.id ?? c.conversation_id}
                                        onClick={() => setSelected(c)}
                                        className={`px-3 py-2.5 border-b border-[#e5e7eb] dark:border-[#2d353e] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected?.id === c.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium text-sm">{c.patient_name ?? c.patientName ?? "Bệnh nhân"}</p>
                                            {c.unread_count > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{c.unread_count}</span>}
                                        </div>
                                        <p className="text-xs text-[#687582] truncate mt-0.5">{c.last_message ?? c.lastMessage ?? "—"}</p>
                                        <p className="text-[10px] text-[#687582] mt-0.5">{fmtDate(c.updated_at ?? c.last_message_at)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Message thread */}
                <div className="col-span-8 bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden flex flex-col">
                    {!selected ? (
                        <EmptyState icon="forum" title="Chọn hội thoại" description="Chọn một hội thoại bên trái để xem tin nhắn." />
                    ) : (
                        <>
                            <div className="p-3 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                                <div>
                                    <p className="font-bold">{selected.patient_name ?? selected.patientName}</p>
                                    <p className="text-xs text-[#687582]">Conversation #{selected.id?.slice?.(0, 8)}</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {messages.length === 0 ? <p className="text-center text-xs text-[#687582] py-8">Chưa có tin nhắn</p>
                                : messages.map((m: any) => (
                                    <div key={m.id} className={`flex ${m.sender_role === "DOCTOR" || m.is_self ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[70%] rounded-lg p-2.5 text-sm ${m.sender_role === "DOCTOR" || m.is_self ? "bg-[#3C81C6] text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                                            <p>{m.content ?? m.message}</p>
                                            <p className="text-[10px] mt-1 opacity-75">{fmt(m.created_at ?? m.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={endRef} />
                            </div>
                            <div className="p-3 border-t border-[#e5e7eb] dark:border-[#2d353e] flex gap-2">
                                <input
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                                    placeholder="Nhập tin nhắn…"
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]"
                                />
                                <button onClick={sendMessage} className="px-4 py-2 text-sm rounded-lg bg-[#3C81C6] text-white">Gửi</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
