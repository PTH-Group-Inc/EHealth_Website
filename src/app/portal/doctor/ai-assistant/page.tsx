"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { aiService, type HealthChatSession, type RAGDocument, type RAGSearchResult } from "@/services/aiService";
import { AIContextSidebar, AILogViewer } from "@/components/portal/ai";
import { useAuth } from "@/contexts/AuthContext";

type Message = { id: number; role: "user" | "ai"; text: string; time: string };

const QUICK_PROMPTS = [
    { icon: "diagnosis", label: "Gợi ý chẩn đoán", prompt: "Bệnh nhân nữ 42 tuổi, sốt 38.5°C, ho khan, đau họng 3 ngày. Gợi ý chẩn đoán?" },
    { icon: "medication", label: "Tra tương tác thuốc", prompt: "Kiểm tra tương tác giữa Amoxicillin và Omeprazole" },
    { icon: "search", label: "Tra cứu ICD-10", prompt: "Tra cứu mã ICD-10 cho viêm phổi" },
    { icon: "description", label: "Tìm phác đồ", prompt: "Phác đồ điều trị tăng huyết áp giai đoạn 1" },
    { icon: "science", label: "Phân tích xét nghiệm", prompt: "WBC 15.2, CRP 45mg/L, Neutrophil 85%. Phân tích kết quả?" },
    { icon: "vaccines", label: "Liều dùng thuốc", prompt: "Liều dùng Amoxicillin cho trẻ 5 tuổi, 18kg?" },
];

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatMd(text: string): string {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">$1</code>')
        .replace(/^&gt; (.*)/gm, '<div class="pl-3 border-l-2 border-[#3C81C6] text-[#687582] italic">$1</div>')
        .replace(/^- (.*)/gm, '<div class="flex gap-1.5"><span class="text-[#3C81C6]">•</span><span>$1</span></div>')
        .replace(/\| (.*)/g, '<span class="font-mono text-xs">| $1</span>')
        .replace(/\n/g, '<br/>');
}

function getTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DOCTOR_SESSION_KEY = "ehealth_doctor_ai_session_id";

export default function AIAssistantPage() {
    const t = useTranslations("pages.portal.doctor.aiAssistant");
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { id: 0, role: "ai", text: "Xin chào BS! Tôi là **EHealth AI Assistant**\n\nTôi có thể hỗ trợ bạn:\n- Gợi ý chẩn đoán dựa trên triệu chứng\n- Tra cứu tương tác thuốc\n- Tìm phác đồ điều trị\n- Phân tích kết quả xét nghiệm\n- Tra mã ICD-10\n- Tìm kiếm tài liệu y khoa (RAG)\n\nHãy nhập câu hỏi hoặc chọn gợi ý bên dưới.", time: getTime() },
    ]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // AI Enhancement state
    const [activeTab, setActiveTab] = useState<"chat" | "logs" | "rag">("chat");
    const [aiContext, setAiContext] = useState<{ patientId?: string; patientName?: string; patientInfo?: string; currentStep?: string } | null>(null);
    const [deepAnalysisMode, setDeepAnalysisMode] = useState(false);

    // RAG state
    const [ragDocuments, setRagDocuments] = useState<RAGDocument[]>([]);
    const [ragLoading, setRagLoading] = useState(false);
    const [ragUploading, setRagUploading] = useState(false);
    const [ragSearchQuery, setRagSearchQuery] = useState("");
    const [ragResults, setRagResults] = useState<RAGSearchResult[]>([]);
    const [ragSearching, setRagSearching] = useState(false);
    const ragFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing, streamingText]);

    // Khôi phục session
    useEffect(() => {
        const saved = localStorage.getItem(DOCTOR_SESSION_KEY);
        if (saved) setSessionId(saved);
    }, []);

    // Load RAG documents khi switch tab
    useEffect(() => {
        if (activeTab === "rag") fetchRAGDocuments();
    }, [activeTab]);

    const fetchRAGDocuments = async () => {
        setRagLoading(true);
        try {
            const res = await aiService.getRAGDocuments({ limit: 50 });
            const raw = (res as any)?.data?.data ?? (res as any)?.data ?? [];
            setRagDocuments(Array.isArray(raw) ? raw : []);
        } catch {
            setRagDocuments([]);
        } finally {
            setRagLoading(false);
        }
    };

    const handleRAGUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setRagUploading(true);
        try {
            const res = await aiService.uploadRAGDocument(file, {
                uploadedBy: user?.id ?? 'doctor',
            });
            const doc = (res as any)?.data?.data ?? (res as any)?.data;
            if (doc) setRagDocuments(prev => [doc, ...prev]);
        } catch (err: any) {
            console.error('Upload RAG failed:', err.message);
        } finally {
            setRagUploading(false);
            if (ragFileRef.current) ragFileRef.current.value = '';
        }
    };

    const handleRAGSearch = async () => {
        if (!ragSearchQuery.trim()) return;
        setRagSearching(true);
        setRagResults([]);
        try {
            const res = await aiService.searchRAG({ query: ragSearchQuery.trim(), topK: 5 });
            const results = (res as any)?.data?.data ?? (res as any)?.data ?? [];
            setRagResults(Array.isArray(results) ? results : []);
        } catch {
            setRagResults([]);
        } finally {
            setRagSearching(false);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;
        const userMsg: Message = { id: Date.now(), role: "user", text: text.trim(), time: getTime() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setTyping(true);

        let responseText = "";
        try {
            // Tạo session nếu chưa có
            let sid = sessionId;
            if (!sid) {
                try {
                    const createRes = await aiService.createHealthChatSession({
                        title: text.trim().slice(0, 60),
                        context: { role: 'doctor', ...(aiContext ?? {}) },
                    });
                    const created = (createRes as any)?.data?.data ?? (createRes as any)?.data;
                    sid = created?.id ?? created?.sessionId ?? null;
                    if (sid) {
                        setSessionId(sid);
                        localStorage.setItem(DOCTOR_SESSION_KEY, sid);
                    }
                } catch {
                    // Fallback sang API cũ nếu health-chat không dùng được
                }
            }

            // Thử SSE streaming với health-chat session
            if (sid) {
                let streamedContent = '';
                let streamSuccess = false;
                try {
                    const token = localStorage.getItem('accessToken') ?? localStorage.getItem('token') ?? undefined;
                    const ctx: Record<string, unknown> = {};
                    if (aiContext) Object.assign(ctx, aiContext);
                    if (deepAnalysisMode) ctx.history = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

                    const gen = aiService.sendHealthChatMessageStream(sid, { content: text.trim(), context: ctx }, token);
                    setTyping(false);
                    setStreamingText('');
                    for await (const chunk of gen) {
                        streamedContent += chunk;
                        setStreamingText(streamedContent);
                    }
                    streamSuccess = true;
                    setStreamingText('');
                } catch {
                    streamedContent = '';
                    streamSuccess = false;
                }

                if (streamSuccess && streamedContent) {
                    responseText = streamedContent;
                } else {
                    // Fallback JSON
                    try {
                        const msgRes = await aiService.sendHealthChatMessage(sid, {
                            content: text.trim(),
                            context: aiContext ?? undefined,
                        });
                        const msgData = (msgRes as any)?.data?.data ?? (msgRes as any)?.data;
                        responseText = msgData?.message?.content ?? msgData?.content ?? msgData?.reply ?? '';
                    } catch {
                        responseText = '';
                    }
                }
            }

            // Fallback sang API cũ /api/ai/chat nếu vẫn rỗng
            if (!responseText) {
                const chatPayload: { message: string; context?: Record<string, unknown>; history?: { role: string; content: string }[] } = {
                    message: text.trim(),
                };
                if (aiContext) chatPayload.context = { ...aiContext };
                if (deepAnalysisMode) {
                    chatPayload.history = messages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
                }
                const res = await aiService.chat(chatPayload);
                const data = res?.data as any;
                responseText = data?.message || data?.reply || data?.content || '';
            }

            if (!responseText) responseText = 'Xin lỗi, tôi không nhận được phản hồi. Vui lòng thử lại.';
        } catch {
            responseText = 'Có lỗi xảy ra khi kết nối AI. Vui lòng thử lại sau.';
        } finally {
            setTyping(false);
            setStreamingText('');
        }

        const aiReply: Message = { id: Date.now() + 1, role: "ai", text: responseText, time: getTime() };
        setMessages(prev => [...prev, aiReply]);
    };

    const startNewSession = async () => {
        if (sessionId) {
            try { await aiService.completeHealthChatSession(sessionId); } catch {}
        }
        setSessionId(null);
        localStorage.removeItem(DOCTOR_SESSION_KEY);
        setMessages([messages[0]]);
    };

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* AI Context Sidebar */}
            <AIContextSidebar
                context={aiContext}
                onUpdateContext={setAiContext}
                onClearContext={() => setAiContext(null)}
                deepAnalysisMode={deepAnalysisMode}
                onToggleDeepAnalysis={setDeepAnalysisMode}
            />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex-shrink-0 px-6 py-4 border-b border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#1e242b]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[20px]">smart_toy</span>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-[#121417] dark:text-white">{t("title")}</h1>
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Đang hoạt động • Health Chat API
                            </p>
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                            {/* Tabs */}
                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                                <button onClick={() => setActiveTab("chat")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "chat" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582]"}`}>
                                    Chat
                                </button>
                                <button onClick={() => setActiveTab("rag")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "rag" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582]"}`}>
                                    Tài liệu RAG
                                </button>
                                <button onClick={() => setActiveTab("logs")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "logs" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582]"}`}>
                                    Lịch sử AI
                                </button>
                            </div>
                            <button onClick={startNewSession} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#687582] transition-colors" title="Cuộc hội thoại mới">
                                <span className="material-symbols-outlined text-[20px]">add_comment</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Log Viewer Tab */}
                {activeTab === "logs" && (
                    <div className="flex-1 overflow-y-auto">
                        <AILogViewer doctorId={user?.id} visible={activeTab === "logs"} />
                    </div>
                )}

                {/* RAG Tab */}
                {activeTab === "rag" && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Upload */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3">Upload tài liệu y khoa</h3>
                            <div className="flex items-center gap-3">
                                <input
                                    ref={ragFileRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt,.csv"
                                    onChange={handleRAGUpload}
                                    className="hidden"
                                    id="rag-upload"
                                />
                                <label htmlFor="rag-upload"
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${ragUploading ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
                                    <span className="material-symbols-outlined text-[18px]">{ragUploading ? "hourglass_top" : "upload_file"}</span>
                                    {ragUploading ? "Đang upload..." : "Chọn tài liệu"}
                                </label>
                                <p className="text-xs text-[#687582]">PDF, DOC, DOCX, TXT — tối đa 10MB</p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5">
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3">Tìm kiếm trong tài liệu</h3>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={ragSearchQuery}
                                    onChange={e => setRagSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleRAGSearch()}
                                    placeholder="VD: Phác đồ điều trị viêm phổi cộng đồng..."
                                    className="flex-1 px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 dark:text-white"
                                />
                                <button onClick={handleRAGSearch} disabled={ragSearching || !ragSearchQuery.trim()}
                                    className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-colors flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">{ragSearching ? "hourglass_top" : "search"}</span>
                                    Tìm kiếm
                                </button>
                            </div>

                            {ragResults.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold text-[#687582]">{ragResults.length} kết quả tìm thấy</p>
                                    {ragResults.map((r, i) => (
                                        <div key={i} className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                                                    {r.documentName ?? 'Tài liệu'}
                                                </span>
                                                <span className="text-[10px] text-[#687582]">
                                                    Độ liên quan: {Math.round((r.score ?? 0) * 100)}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#121417] dark:text-gray-300 line-clamp-3">{r.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {ragSearching && (
                                <div className="text-center py-4">
                                    <div className="flex gap-1 justify-center">
                                        <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Document list */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-[#121417] dark:text-white">Tài liệu đã upload ({ragDocuments.length})</h3>
                                <button onClick={fetchRAGDocuments} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-[#687582]">
                                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                                </button>
                            </div>
                            {ragLoading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
                                </div>
                            ) : ragDocuments.length === 0 ? (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined text-3xl text-[#b0b8c1] block mb-2">folder_open</span>
                                    <p className="text-sm text-[#687582]">Chưa có tài liệu nào. Upload để bắt đầu.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#dde0e4] dark:divide-[#2d353e]">
                                    {ragDocuments.map(doc => (
                                        <div key={doc.id} className="flex items-center gap-3 py-2.5">
                                            <span className="material-symbols-outlined text-violet-500 text-[20px]">description</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[#121417] dark:text-white truncate">{doc.name}</p>
                                                <p className="text-[10px] text-[#687582]">
                                                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('vi-VN') : ''}
                                                    {doc.status && ` • ${doc.status}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Chat Tab */}
                {activeTab === "chat" && (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8f9fa] dark:bg-[#13191f]">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "ai" && (
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="material-symbols-outlined text-white text-[14px]">smart_toy</span>
                                        </div>
                                    )}
                                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                        ? "bg-[#3C81C6] text-white rounded-br-md"
                                        : "bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] text-[#121417] dark:text-gray-200 rounded-bl-md"
                                    }`}>
                                        <div className="text-sm whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMd(msg.text) }} />
                                        <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-blue-200" : "text-[#b0b8c1]"}`}>{msg.time}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Streaming text */}
                            {streamingText && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="material-symbols-outlined text-white text-[14px]">smart_toy</span>
                                    </div>
                                    <div className="max-w-[70%] rounded-2xl rounded-bl-md px-4 py-3 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e]">
                                        <div className="text-sm whitespace-pre-wrap leading-relaxed text-[#121417] dark:text-gray-200"
                                            dangerouslySetInnerHTML={{ __html: formatMd(streamingText) }} />
                                        <span className="inline-block w-1 h-4 bg-violet-500 ml-0.5 animate-pulse align-middle" />
                                    </div>
                                </div>
                            )}

                            {typing && !streamingText && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-white text-[14px]">smart_toy</span>
                                    </div>
                                    <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-2xl rounded-bl-md px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-[#3C81C6] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="w-2 h-2 bg-[#3C81C6] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 bg-[#3C81C6] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Quick Prompts */}
                        <div className="flex-shrink-0 px-6 py-3 border-t border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#1e242b] overflow-x-auto">
                            <div className="flex gap-2">
                                {QUICK_PROMPTS.map(qp => (
                                    <button key={qp.label} onClick={() => sendMessage(qp.prompt)} disabled={typing || !!streamingText}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f6f7f8] dark:bg-[#13191f] hover:bg-[#eef0f2] dark:hover:bg-[#1a2030] rounded-lg text-xs font-medium text-[#687582] hover:text-[#3C81C6] whitespace-nowrap transition-colors border border-transparent hover:border-[#3C81C6]/20 disabled:opacity-50">
                                        <span className="material-symbols-outlined text-[14px]">{qp.icon}</span>{qp.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="flex-shrink-0 px-6 py-4 border-t border-[#dde0e4] dark:border-[#2d353e] bg-white dark:bg-[#1e242b]">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <input type="text" value={input} onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                                        placeholder="Nhập câu hỏi cho AI (VD: Gợi ý chẩn đoán cho bệnh nhân sốt cao, ho)..."
                                        disabled={typing || !!streamingText}
                                        className="w-full px-4 py-3 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 disabled:opacity-50 dark:text-white" />
                                </div>
                                <button onClick={() => sendMessage(input)} disabled={!input.trim() || typing || !!streamingText}
                                    className="w-11 h-11 rounded-xl bg-[#3C81C6] hover:bg-[#2a6da8] text-white flex items-center justify-center transition-colors disabled:opacity-40 shadow-md shadow-blue-200 dark:shadow-none">
                                    <span className="material-symbols-outlined text-[20px]">send</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
