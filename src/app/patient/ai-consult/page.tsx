"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { aiService, type HealthChatSession } from "@/services/aiService";

interface AiChatMessage {
    id: string;
    role: "user" | "ai";
    message: string;
    timestamp: string;
    suggestions?: string[];
    specialtyRecommendation?: { name: string; icon: string; reason: string };
}

const AI_QUICK_PROMPTS = [
    { icon: "sentiment_stressed", label: "Đau đầu", prompt: "Tôi bị đau đầu" },
    { icon: "thermostat", label: "Sốt", prompt: "Tôi bị sốt" },
    { icon: "gastroenterology", label: "Đau bụng", prompt: "Tôi bị đau bụng" },
    { icon: "pulmonology", label: "Ho / Khó thở", prompt: "Tôi bị ho và khó thở" },
    { icon: "dermatology", label: "Da liễu", prompt: "Tôi bị nổi mẩn ngứa" },
    { icon: "cardiology", label: "Đau ngực", prompt: "Tôi bị đau ngực" },
    { icon: "psychology", label: "Mệt mỏi / Stress", prompt: "Tôi thường xuyên mệt mỏi và stress" },
    { icon: "visibility", label: "Mắt mờ", prompt: "Mắt tôi nhìn mờ gần đây" },
];

const SESSION_KEY = "ehealth_ai_session_id";

function escapeHtml(text: string) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export default function AiConsultPage() {
    const tp = useTranslations("pages.portal.patient.aiConsult");
    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState<HealthChatSession[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamingText, setStreamingText] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping, streamingText]);

    // Khôi phục session từ localStorage
    useEffect(() => {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
            setSessionId(saved);
            loadSession(saved);
        }
    }, []);

    const loadSession = async (sid: string) => {
        try {
            const res = await aiService.getHealthChatSession(sid);
            const data = (res as any)?.data?.data ?? (res as any)?.data;
            if (data?.messages && Array.isArray(data.messages)) {
                const msgs: AiChatMessage[] = data.messages.map((m: any) => ({
                    id: m.id ?? String(Math.random()),
                    role: m.role === 'assistant' ? 'ai' : 'user',
                    message: m.content ?? m.message ?? '',
                    timestamp: m.createdAt
                        ? new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : '',
                }));
                setMessages(msgs);
            }
        } catch {
            // Session đã hết hạn hoặc không tồn tại — xóa cache
            localStorage.removeItem(SESSION_KEY);
            setSessionId(null);
        }
    };

    const fetchSessions = useCallback(async () => {
        setLoadingSessions(true);
        try {
            const res = await aiService.getHealthChatSessions({ limit: 20 });
            const raw = (res as any)?.data?.data ?? (res as any)?.data ?? [];
            setSessions(Array.isArray(raw) ? raw : []);
        } catch {
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    }, []);

    const openHistory = () => {
        setShowHistory(true);
        fetchSessions();
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;
        setError(null);

        const userMsg: AiChatMessage = {
            id: `m-${Date.now()}`,
            role: "user",
            message: text.trim(),
            timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            // Tạo session nếu chưa có
            let sid = sessionId;
            if (!sid) {
                const createRes = await aiService.createHealthChatSession({ title: text.trim().slice(0, 60) });
                const created = (createRes as any)?.data?.data ?? (createRes as any)?.data;
                sid = created?.id ?? created?.sessionId ?? null;
                if (sid) {
                    setSessionId(sid);
                    localStorage.setItem(SESSION_KEY, sid);
                }
            }

            if (!sid) {
                throw new Error('Không thể tạo phiên tư vấn');
            }

            // Thử SSE streaming trước
            let streamedContent = '';
            let streamSuccess = false;
            try {
                const token = localStorage.getItem('accessToken') ?? localStorage.getItem('token') ?? undefined;
                const gen = aiService.sendHealthChatMessageStream(sid, { content: text.trim() }, token);
                setIsTyping(false);
                setStreamingText('');
                for await (const chunk of gen) {
                    streamedContent += chunk;
                    setStreamingText(streamedContent);
                }
                streamSuccess = true;
                setStreamingText('');
            } catch {
                // Streaming không khả dụng — dùng JSON
                streamedContent = '';
                streamSuccess = false;
            }

            if (!streamSuccess) {
                const msgRes = await aiService.sendHealthChatMessage(sid, { content: text.trim() });
                const msgData = (msgRes as any)?.data?.data ?? (msgRes as any)?.data;
                streamedContent =
                    msgData?.message?.content ??
                    msgData?.content ??
                    msgData?.reply ??
                    'Xin lỗi, tôi không nhận được phản hồi. Vui lòng thử lại.';
            }

            const aiMsg: AiChatMessage = {
                id: `m-${Date.now()}-ai`,
                role: "ai",
                message: streamedContent,
                timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err: any) {
            setError(err.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsTyping(false);
            setStreamingText('');
        }
    };

    const loadHistorySession = async (session: HealthChatSession) => {
        setShowHistory(false);
        setMessages([]);
        setSessionId(session.id);
        localStorage.setItem(SESSION_KEY, session.id);
        await loadSession(session.id);
    };

    const startNew = async () => {
        // Đóng session cũ nếu còn active
        if (sessionId) {
            try { await aiService.completeHealthChatSession(sessionId); } catch {}
        }
        setMessages([]);
        setSessionId(null);
        localStorage.removeItem(SESSION_KEY);
        setError(null);
    };

    const deleteSession = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await aiService.deleteHealthChatSession(id);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (sessionId === id) {
                setMessages([]);
                setSessionId(null);
                localStorage.removeItem(SESSION_KEY);
            }
        } catch {}
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "28px" }}>smart_toy</span>
                        {tp("title")}
                    </h1>
                    <p className="text-sm text-[#687582] mt-0.5">{tp("subtitle")}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={openHistory}
                        className="px-3 py-2 text-sm font-medium text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl hover:bg-gray-50 dark:hover:bg-[#252d36] flex items-center gap-1.5">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>history</span>
                        Lịch sử
                    </button>
                    {messages.length > 0 && (
                        <button onClick={startNew}
                            className="px-3 py-2 text-sm font-medium text-[#3C81C6] bg-[#3C81C6]/[0.06] rounded-xl hover:bg-[#3C81C6]/[0.12] flex items-center gap-1.5">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                            Cuộc mới
                        </button>
                    )}
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400" style={{ fontSize: "18px" }}>info</span>
                <p className="text-xs text-amber-700 dark:text-amber-400">AI chỉ mang tính tham khảo, <strong>không thay thế</strong> chẩn đoán và điều trị của bác sĩ.</p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-red-500" style={{ fontSize: "18px" }}>error</span>
                    <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                    </button>
                </div>
            )}

            {/* Chat area */}
            <div className="flex-1 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {messages.length === 0 && !showHistory ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center shadow-xl shadow-[#3C81C6]/20 mb-4">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "32px" }}>smart_toy</span>
                            </div>
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-1">Xin chào! Tôi là EHealth AI</h3>
                            <p className="text-sm text-[#687582] max-w-md mb-6">Hãy mô tả triệu chứng của bạn, tôi sẽ giúp phân tích sơ bộ và gợi ý chuyên khoa phù hợp.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-lg">
                                {AI_QUICK_PROMPTS.map(p => (
                                    <button key={p.label} onClick={() => sendMessage(p.prompt)}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] hover:border-[#3C81C6] hover:bg-[#3C81C6]/[0.04] transition-all group">
                                        <span className="material-symbols-outlined text-[#687582] group-hover:text-[#3C81C6] transition-colors" style={{ fontSize: "22px" }}>{p.icon}</span>
                                        <span className="text-xs font-medium text-[#687582] group-hover:text-[#3C81C6]">{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] ${msg.role === "user" ? "" : "flex gap-3"}`}>
                                        {msg.role === "ai" && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>smart_toy</span>
                                            </div>
                                        )}
                                        <div>
                                            <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${msg.role === "user" ? "bg-[#3C81C6] text-white rounded-br-md" : "bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white rounded-bl-md"}`}>
                                                {msg.role === "ai" ? (
                                                    <span dangerouslySetInnerHTML={{ __html: escapeHtml(msg.message).replace(/\n/g, '<br/>') }} />
                                                ) : msg.message}
                                            </div>
                                            {msg.specialtyRecommendation && (
                                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                                                    <p className="text-xs font-bold text-blue-800 dark:text-blue-400 mb-2">Gợi ý chuyên khoa:</p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-blue-600" style={{ fontSize: "20px" }}>{msg.specialtyRecommendation.icon}</span>
                                                            <div>
                                                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">{msg.specialtyRecommendation.name}</p>
                                                                <p className="text-xs text-blue-600 dark:text-blue-400">{msg.specialtyRecommendation.reason}</p>
                                                            </div>
                                                        </div>
                                                        <Link href={`/booking?specialtyName=${encodeURIComponent(msg.specialtyRecommendation.name)}`}
                                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#3C81C6] rounded-lg hover:bg-[#2a6da8] whitespace-nowrap">
                                                            Đặt lịch →
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                            <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-right text-[#687582]" : "text-[#687582]"}`}>{msg.timestamp}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Streaming text bubble */}
                            {streamingText && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>smart_toy</span>
                                    </div>
                                    <div className="px-4 py-3 bg-[#f6f7f8] dark:bg-[#13191f] rounded-2xl rounded-bl-md text-sm text-[#121417] dark:text-white max-w-[85%]">
                                        <span dangerouslySetInnerHTML={{ __html: escapeHtml(streamingText).replace(/\n/g, '<br/>') }} />
                                        <span className="inline-block w-1 h-4 bg-[#3C81C6] ml-0.5 animate-pulse align-middle" />
                                    </div>
                                </div>
                            )}

                            {isTyping && !streamingText && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>smart_toy</span>
                                    </div>
                                    <div className="px-4 py-3 bg-[#f6f7f8] dark:bg-[#13191f] rounded-2xl rounded-bl-md">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-[#687582] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-2 h-2 bg-[#687582] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-2 h-2 bg-[#687582] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                    <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)}
                            placeholder="Mô tả triệu chứng của bạn..."
                            className="flex-1 px-4 py-3 border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl text-sm bg-[#f6f7f8] dark:bg-[#13191f] text-[#121417] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 placeholder-[#687582]" />
                        <button type="submit" disabled={!input.trim() || isTyping || !!streamingText}
                            className="px-5 py-3 bg-gradient-to-r from-[#3C81C6] to-[#2563eb] text-white rounded-xl shadow-md hover:shadow-lg disabled:opacity-40 transition-all">
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>send</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* History Panel */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowHistory(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-[#e5e7eb] dark:border-[#2d353e] flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#121417] dark:text-white">Lịch sử tư vấn</h3>
                            <button onClick={() => setShowHistory(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <span className="material-symbols-outlined text-[#687582]">close</span>
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            {loadingSessions ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : sessions.length === 0 ? (
                                <p className="text-sm text-[#687582] text-center py-8">Chưa có lịch sử tư vấn</p>
                            ) : (
                                sessions.map(session => (
                                    <div key={session.id} className="relative group">
                                        <button onClick={() => loadHistorySession(session)}
                                            className="w-full text-left p-4 rounded-xl border border-[#e5e7eb] dark:border-[#2d353e] hover:border-[#3C81C6] hover:bg-[#3C81C6]/[0.04] transition-all">
                                            <div className="flex items-center justify-between pr-8">
                                                <h4 className="text-sm font-bold text-[#121417] dark:text-white truncate">
                                                    {session.title ?? `Phiên tư vấn`}
                                                </h4>
                                                {session.status === 'completed' && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 dark:bg-green-500/10 text-green-700 flex-shrink-0">Đã tư vấn</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#687582] mt-1">
                                                {session.createdAt ? new Date(session.createdAt).toLocaleDateString('vi-VN') : ''}
                                                {session.messageCount ? ` • ${session.messageCount} tin nhắn` : ''}
                                            </p>
                                        </button>
                                        <button onClick={e => deleteSession(session.id, e)}
                                            className="absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-[#687582] hover:text-red-500 transition-all">
                                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
