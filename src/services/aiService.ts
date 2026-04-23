import axiosClient from '@/api/axiosClient';
import { AI_ENDPOINTS } from '@/api/endpoints';
import { API_CONFIG } from '@/config';
import type { AISearchResponsePayload } from '@/utils/aiSearch';

// ============================================
// Health Chat endpoints (local constants — không có trong endpoints.ts)
// ============================================
const BASE_URL = API_CONFIG.BASE_URL;

const HC = {
    SESSIONS: '/api/ai/health-chat/sessions',
    SESSION: (id: string) => `/api/ai/health-chat/sessions/${id}`,
    MESSAGES: (id: string) => `/api/ai/health-chat/sessions/${id}/messages`,
    MESSAGES_STREAM: (id: string) => `/api/ai/health-chat/sessions/${id}/messages/stream`,
    COMPLETE: (id: string) => `/api/ai/health-chat/sessions/${id}/complete`,
    ANALYTICS_TOKENS: '/api/ai/health-chat/analytics/tokens',
};

const RAG = {
    UPLOAD: '/api/ai/rag/documents/upload',
    DOCUMENTS: '/api/ai/rag/documents',
    SEARCH: '/api/ai/rag/search',
};

// ============================================
// Types cho Health Chat
// ============================================

export interface HealthChatSession {
    id: string;
    title?: string;
    status?: 'active' | 'completed';
    createdAt?: string;
    updatedAt?: string;
    messageCount?: number;
}

export interface HealthChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
    tokens?: number;
}

export interface HealthChatSendResponse {
    message: HealthChatMessage;
    sessionId: string;
}

export interface RAGDocument {
    id: string;
    name: string;
    size?: number;
    createdAt?: string;
    status?: string;
}

export interface RAGSearchResult {
    content: string;
    score: number;
    documentId?: string;
    documentName?: string;
}
import type {
    AISuggestion,
    AIDiagnosisSuggestion,
    AIDrugCheck,
    AIDrugSuggestion,
    AIVitalAlert,
    AIPatientSummary,
    AIBriefingItem,
    AITrendAlert,
    AILabSuggestion,
    AIPreferences,
    AIAuditEntry,
    Citation,
} from '@/types';

// ============================================
// Response types cho AI API
// ============================================

export interface AIAnalyzeResponse<T = AISuggestion> {
    suggestions: T[];
    citations: Citation[];
    processingTime?: number;
}

export interface AIChatResponse {
    message: string;
    citations: Citation[];
    confidence: number;
}

export interface AIDiagnosisResponse {
    diagnoses: AIDiagnosisSuggestion[];
    suggestedLabs: AILabSuggestion[];
    citations: Citation[];
}

export interface AIDrugInteractionResponse {
    interactions: AIDrugCheck[];
    allergyConflicts: { drug: string; allergy: string; citations: Citation[] }[];
    overallSafe: boolean;
}

export interface AIVitalCheckResponse {
    alerts: AIVitalAlert[];
    overallStatus: 'normal' | 'warning' | 'critical';
}

export interface AIBriefingResponse {
    items: AIBriefingItem[];
    generatedAt: string;
}

export interface AIPatientSummaryResponse {
    summary: AIPatientSummary;
    generatedAt: string;
}

export interface AITrendResponse {
    trends: AITrendAlert[];
}

export interface AIPrescriptionAuditResponse {
    issues: {
        prescriptionId: string;
        severity: 'serious' | 'caution' | 'info';
        title: string;
        detail: string;
        citations: Citation[];
    }[];
}

export interface AITriageResponse {
    urgency: 'urgent' | 'routine' | 'elective';
    reasoning: string;
    citations: Citation[];
    confidence: number;
}

// ============================================
// AI Service
// ============================================

export const aiService = {
    // --- Existing endpoints ---

    chat: (data: { message: string; context?: Record<string, unknown>; history?: { role: string; content: string }[] }) =>
        axiosClient.post<AIChatResponse>(AI_ENDPOINTS.CHAT, data),

    checkSymptoms: (data: { symptoms: string[]; patientId?: string; vitals?: Record<string, unknown>; patientHistory?: Record<string, unknown> }) =>
        axiosClient.post<AIDiagnosisResponse>(AI_ENDPOINTS.SYMPTOM_CHECK, data),

    suggestAppointment: (data: Record<string, unknown>) =>
        axiosClient.post(AI_ENDPOINTS.SUGGEST_APPOINTMENT, data),

    summarizeRecord: (recordId: string) =>
        axiosClient.get<AIPatientSummaryResponse>(AI_ENDPOINTS.SUMMARIZE_RECORD(recordId)),

    analyze: (data: Record<string, unknown>) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, data),

    getLogs: (params?: Record<string, unknown>) =>
        axiosClient.get(AI_ENDPOINTS.LOGS, { params }),

    // --- New AI-100 endpoints ---

    /** Kiểm tra bất thường sinh hiệu */
    checkVitals: (data: {
        vitals: Record<string, unknown>;
        patientAge: number;
        patientHistory?: Record<string, unknown>;
    }) =>
        axiosClient.post<AIVitalCheckResponse>(AI_ENDPOINTS.ANALYZE, {
            type: 'vital_anomaly',
            ...data,
        }),

    /** Gợi ý chẩn đoán với citations (enhanced symptom check) */
    getDiagnosis: (data: {
        symptoms: string;
        vitals?: Record<string, unknown>;
        patientHistory?: Record<string, unknown>;
    }) =>
        axiosClient.post<AIDiagnosisResponse>(AI_ENDPOINTS.SYMPTOM_CHECK, {
            ...data,
            includeCitations: true,
        }),

    /** Kiểm tra tương tác thuốc */
    checkDrugInteraction: (data: {
        drugs: { name: string; dosage: string }[];
        allergies: string[];
        patientProfile?: { weight?: number; age?: number; eGFR?: number };
    }) =>
        axiosClient.post<AIDrugInteractionResponse>(AI_ENDPOINTS.ANALYZE, {
            type: 'drug_interaction',
            ...data,
        }),

    /** Gợi ý thuốc theo chẩn đoán */
    suggestDrug: (data: {
        diagnosis: string;
        icdCode?: string;
        patientProfile?: { weight?: number; age?: number; eGFR?: number; allergies?: string[] };
    }) =>
        axiosClient.post<AIAnalyzeResponse<AIDrugSuggestion>>(AI_ENDPOINTS.CHAT, {
            message: `Suggest medication for: ${data.diagnosis}`,
            context: { type: 'drug_suggestion', ...data },
        }),

    /** Tra cứu ICD-10 */
    lookupICD10: (query: string) =>
        axiosClient.post<AIChatResponse>(AI_ENDPOINTS.CHAT, {
            message: query,
            context: { type: 'icd_lookup' },
        }),

    /** Tóm tắt hồ sơ bệnh nhân */
    summarizePatient: (patientId: string) =>
        axiosClient.get<AIPatientSummaryResponse>(AI_ENDPOINTS.SUMMARIZE_RECORD(patientId)),

    /** AI Briefing hàng ngày cho bác sĩ */
    getDailyBriefing: (doctorId: string) =>
        axiosClient.post<AIBriefingResponse>(AI_ENDPOINTS.ANALYZE, {
            type: 'daily_briefing',
            doctorId,
        }),

    /** Phát hiện xu hướng bất thường từ dữ liệu xét nghiệm */
    detectTrends: (data: {
        patientId: string;
        timeline?: Record<string, unknown>[];
    }) =>
        axiosClient.post<AITrendResponse>(AI_ENDPOINTS.ANALYZE, {
            type: 'lab_trend',
            ...data,
        }),

    /** Kiểm tra an toàn đơn thuốc */
    auditPrescription: (data: {
        prescriptions: Record<string, unknown>[];
        patientProfiles?: Record<string, unknown>[];
    }) =>
        axiosClient.post<AIPrescriptionAuditResponse>(AI_ENDPOINTS.ANALYZE, {
            type: 'prescription_audit',
            ...data,
        }),

    /** Đánh giá mức độ khẩn cấp (triage) */
    triageAssessment: (data: {
        reason: string;
        patientAge?: number;
        history?: Record<string, unknown>;
    }) =>
        axiosClient.post<AITriageResponse>(AI_ENDPOINTS.SYMPTOM_CHECK, {
            ...data,
            context: { type: 'triage' },
        }),

    /** Theo dõi tái khám quá hạn */
    trackFollowUps: (doctorId: string) =>
        axiosClient.post<AIAnalyzeResponse>(AI_ENDPOINTS.ANALYZE, {
            type: 'follow_up_tracking',
            doctorId,
        }),

    /** Tạo ghi chú phiên khám (SOAP format) */
    generateSessionNotes: (data: {
        encounterId: string;
        chatHistory?: { role: string; content: string }[];
    }) =>
        axiosClient.post<AIChatResponse>(AI_ENDPOINTS.ANALYZE, {
            type: 'session_notes',
            ...data,
        }),

    // --- AI Preferences ---

    getPreferences: (doctorId: string) =>
        axiosClient.get<AIPreferences>(AI_ENDPOINTS.PREFERENCES(doctorId)),

    savePreferences: (doctorId: string, prefs: AIPreferences) =>
        axiosClient.put(AI_ENDPOINTS.PREFERENCES(doctorId), prefs),

    // --- 100% AI Extreme methods ---

    /** Inventory forecasting for pharmacist */
    forecastInventory: (data: { drugs?: string[] }) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, { type: 'inventory_forecast', ...data }),

    /** Queue wait time prediction for receptionist */
    predictQueue: (data?: Record<string, unknown>) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, { type: 'queue_prediction', ...data }),

    /** System anomaly detection for admin */
    detectSystemAnomalies: (data?: Record<string, unknown>) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, { type: 'system_anomaly', ...data }),

    /** Staffing optimization for admin */
    optimizeStaffing: (data?: Record<string, unknown>) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, { type: 'staffing_optimization', ...data }),

    /** Revenue insight for admin */
    getRevenueInsight: (data?: Record<string, unknown>) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, { type: 'revenue_insight', ...data }),

    /** AI-powered semantic search */
    semanticSearch: (data: { query: string; role: string; types?: string[] }) =>
        axiosClient.post<AISearchResponsePayload>(AI_ENDPOINTS.CHAT, {
            message: data.query,
            context: { type: 'search', role: data.role, types: data.types },
        }),

    /** OCR / image analysis */
    analyzeImage: (data: { imageBase64: string; context?: string }) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, { type: 'image_ocr', ...data }),

    /** Cross-patient pattern detection */
    detectCrossPatientPatterns: (data?: Record<string, unknown>) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, { type: 'cross_patient_pattern', ...data }),

    /** Similar case matching */
    findSimilarCases: (data: { diagnosis?: string; icdCode?: string }) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, { type: 'similar_cases', ...data }),

    /** Role bridge summary (handoff between roles) */
    getRoleBridgeSummary: (data: { fromRole: string; toRole: string; patientId: string }) =>
        axiosClient.post(AI_ENDPOINTS.ANALYZE, { type: 'role_bridge', ...data }),

    // ============================================
    // AI Health Chat Session API
    // ============================================

    /** Tạo session mới — POST /api/ai/health-chat/sessions */
    createHealthChatSession: (data?: { title?: string; patientId?: string; context?: Record<string, unknown> }) =>
        axiosClient.post<{ data: HealthChatSession }>(HC.SESSIONS, data ?? {}),

    /** Lấy danh sách sessions của user — GET /api/ai/health-chat/sessions */
    getHealthChatSessions: (params?: { page?: number; limit?: number }) =>
        axiosClient.get<{ data: HealthChatSession[]; pagination?: any }>(HC.SESSIONS, { params }),

    /** Lấy chi tiết session — GET /api/ai/health-chat/sessions/:id */
    getHealthChatSession: (sessionId: string) =>
        axiosClient.get<{ data: HealthChatSession & { messages: HealthChatMessage[] } }>(HC.SESSION(sessionId)),

    /** Cập nhật session — PUT /api/ai/health-chat/sessions/:id */
    updateHealthChatSession: (sessionId: string, data: { title?: string }) =>
        axiosClient.put(HC.SESSION(sessionId), data),

    /** Gửi tin nhắn (JSON) — POST /api/ai/health-chat/sessions/:id/messages */
    sendHealthChatMessage: (sessionId: string, data: { content: string; context?: Record<string, unknown> }) =>
        axiosClient.post<{ data: HealthChatSendResponse }>(HC.MESSAGES(sessionId), data),

    /** Kết thúc session — POST /api/ai/health-chat/sessions/:id/complete */
    completeHealthChatSession: (sessionId: string) =>
        axiosClient.post(HC.COMPLETE(sessionId)),

    /** Xóa session — DELETE /api/ai/health-chat/sessions/:id */
    deleteHealthChatSession: (sessionId: string) =>
        axiosClient.delete(HC.SESSION(sessionId)),

    /** Thống kê token (admin) — GET /api/ai/health-chat/analytics/tokens */
    getTokenAnalytics: (params?: { from?: string; to?: string }) =>
        axiosClient.get(HC.ANALYTICS_TOKENS, { params }),

    /**
     * Gửi tin nhắn với SSE streaming — POST .../messages/stream
     * Trả về async generator từng chunk text
     */
    sendHealthChatMessageStream: async function* (
        sessionId: string,
        data: { content: string; context?: Record<string, unknown> },
        token?: string,
    ): AsyncGenerator<string> {
        const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? localStorage.getItem('token') : null);
        const response = await fetch(`${BASE_URL}${HC.MESSAGES_STREAM(sessionId)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify(data),
        });
        if (!response.ok || !response.body) {
            throw new Error(`Stream error: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const raw = line.slice(6).trim();
                    if (raw === '[DONE]') return;
                    try {
                        const parsed = JSON.parse(raw);
                        const chunk: string = parsed?.delta ?? parsed?.content ?? parsed?.text ?? parsed?.message ?? '';
                        if (chunk) yield chunk;
                    } catch {
                        // chunk không phải JSON — yield thẳng
                        if (raw) yield raw;
                    }
                }
            }
        }
    },

    // ============================================
    // AI RAG
    // ============================================

    /** Upload tài liệu RAG — POST /api/ai/rag/documents/upload */
    uploadRAGDocument: (file: File, metadata?: Record<string, string>) => {
        const form = new FormData();
        form.append('file', file);
        if (metadata) {
            Object.entries(metadata).forEach(([k, v]) => form.append(k, v));
        }
        return axiosClient.post<{ data: RAGDocument }>(RAG.UPLOAD, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    /** Lấy danh sách tài liệu RAG — GET /api/ai/rag/documents */
    getRAGDocuments: (params?: { page?: number; limit?: number }) =>
        axiosClient.get<{ data: RAGDocument[] }>(RAG.DOCUMENTS, { params }),

    /** Tìm kiếm knowledge base — POST /api/ai/rag/search */
    searchRAG: (data: { query: string; topK?: number; threshold?: number }) =>
        axiosClient.post<{ data: RAGSearchResult[] }>(RAG.SEARCH, data),
};
