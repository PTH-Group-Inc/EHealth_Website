/**
 * Shared TypeScript types
 * Định nghĩa types sẵn sàng cho API response/request
 */

import type { Role } from "@/constants/roles";
import type {
    UserStatus,
    DoctorStatus,
    DepartmentStatus,
    MedicineStatus,
    AppointmentStatus,
} from "@/constants/status";

// ============================================
// Base types
// ============================================

export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}

// API Response wrapper (chuẩn bị cho BE)
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ApiError {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
}

// ============================================
// User types
// ============================================

export interface User extends BaseEntity {
    email: string;
    fullName: string;
    phone?: string;
    avatar?: string;
    role: Role;
    status: UserStatus;
    lastAccess?: string;
}

// ============================================
// Doctor types
// ============================================

export interface Doctor extends BaseEntity {
    userId: string;
    code: string; // DR-2024001
    fullName: string;
    avatar?: string;
    email: string;
    phone?: string;
    departmentId: string;
    departmentName: string;
    specialization: string;
    experience?: number;
    rating: number;
    reviewCount: number;
    status: DoctorStatus;
    workingSchedule?: WorkingSchedule[];
}

export interface WorkingSchedule {
    shift: "MORNING" | "AFTERNOON" | "NIGHT";
    days: string[]; // ["T2", "T4", "T6"]
}

// ============================================
// Department types
// ============================================

export interface Department extends BaseEntity {
    code: string; // K-001
    name: string;
    nameEn?: string;
    description?: string;
    icon?: string;
    color?: string;
    location?: string;
    capacity?: number;
    doctorCount: number;
    patientCount?: number;
    appointmentToday?: number;
    status: DepartmentStatus;
}

// ============================================
// Medicine types
// ============================================

export interface Medicine extends BaseEntity {
    code: string; // SP-2024-001
    name: string;
    activeIngredient: string;
    unit: string;
    unitDetail?: string; // "Hộp (10 vỉ x 10 viên)"
    price: number;
    stock: number;
    stockLevel: "HIGH" | "NORMAL" | "LOW" | "OUT";
    category: string;
    status: MedicineStatus;
    expiryDate?: string;
}

// ============================================
// Appointment types
// ============================================

export interface Appointment extends BaseEntity {
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    departmentId: string;
    departmentName: string;
    date: string;
    time: string;
    status: AppointmentStatus;
    notes?: string;
}

// ============================================
// Statistics types
// ============================================

export interface DashboardStats {
    totalRevenue: number;
    revenueChange: number;
    todayVisits: number;
    visitsChange: number;
    doctorsOnDuty: number;
    totalDoctors: number;
    medicineAlerts: number;
}

export interface DepartmentLoad {
    id: string;
    name: string;
    loadPercentage: number;
}

export interface ActivityLog extends BaseEntity {
    userId: string;
    userName: string;
    userAvatar?: string;
    action: string;
    status: "SUCCESS" | "PENDING" | "FAILED";
    time: string;
}

// ============================================
// AI types (Evidence-based RAG)
// ============================================

export interface Citation {
    id: string;
    source: string; // "ESC/ESH 2023", "DrugBank", "BYT QĐ 3192"
    section: string; // "Section 7.3", "Table 12"
    excerpt: string; // Trích đoạn gốc từ tài liệu
    evidenceLevel: "A" | "B" | "C" | "BYT_VN" | "Expert";
    reference: string; // DOI hoặc số hiệu văn bản
}

export interface AISuggestion {
    id: string;
    type: "diagnosis" | "drug" | "lab" | "vital_alert" | "summary" | "triage";
    content: string;
    confidence: number; // 0-100, dựa trên mức khớp với tài liệu
    citations: Citation[];
    metadata?: Record<string, unknown>;
}

export interface AIDiagnosisSuggestion extends AISuggestion {
    type: "diagnosis";
    icdCode: string;
    icdDescription: string;
    matchingSymptoms: string[];
    excludeSymptoms: string[];
    suggestedLabs: string[];
    sensitivity?: number;
    specificity?: number;
}

export interface AIDrugCheck {
    drugA: string;
    drugB: string;
    severity: "safe" | "caution" | "serious" | "contraindicated";
    detail: string;
    citations: Citation[];
}

export interface AIDrugSuggestion extends AISuggestion {
    type: "drug";
    drugName: string;
    standardDosage: string;
    adjustedDosage?: string; // Dựa trên cân nặng/eGFR
    interactions: AIDrugCheck[];
    allergyCheck: { safe: boolean; conflictingAllergy?: string };
}

export interface AILabSuggestion {
    id: string;
    labName: string;
    reason: string;
    priority: "urgent" | "necessary" | "supplementary";
    relatedDiagnosis: string;
    citations: Citation[];
}

export interface AIVitalAlert {
    id: string;
    parameter: string; // "blood_pressure", "heart_rate", etc.
    value: string;
    severity: "critical" | "warning" | "info";
    message: string;
    clinicalAssessment: string[];
    suggestedLabs: AILabSuggestion[];
    citations: Citation[];
    confidence: number;
}

export interface AIAuditEntry {
    timestamp: string;
    step: string;
    aiAction: string;
    citations: Citation[];
    doctorResponse: "accepted" | "dismissed" | "modified";
    notes?: string;
}

export interface AIPreferences {
    enableExamSuggestions: boolean;
    enableAutoSymptomAnalysis: boolean;
    enableDashboardBriefing: boolean;
    enableDrugInteractionCheck: boolean;
    confidenceThreshold: number; // 0-100, default 60
    enableSessionMemory: boolean;
    enableAutoNotes: boolean;
    // 100% AI Extreme
    enableAmbientEngine: boolean;
    enableProactiveAlerts: boolean;
    enableVoiceInput: boolean;
    enableSmartSearch: boolean;
    enableAdaptiveUI: boolean;
    enableGamification: boolean;
}

export interface AIBriefingItem {
    id: string;
    type: "allergy_warning" | "follow_up_alert" | "performance" | "anomaly";
    severity: "critical" | "warning" | "info";
    title: string;
    content: string;
    patientId?: string;
    patientName?: string;
    citations: Citation[];
}

export interface AIPatientSummary {
    patientId: string;
    patientName: string;
    chronicConditions: string[];
    currentMedications: { name: string; dosage: string; compliance?: string }[];
    allergies: string[];
    redFlags: string[];
    recentDiagnosis?: { icdCode: string; description: string; date: string };
    citations: Citation[];
}

export interface AITrendAlert {
    id: string;
    parameter: string; // "glucose", "blood_pressure", etc.
    values: { date: string; value: number }[];
    trend: "increasing" | "decreasing" | "fluctuating";
    clinicalSignificance: string;
    citations: Citation[];
}

export type AIAlertSeverity = 'critical' | 'warning' | 'info';

export interface AIProactiveAlert {
    id: string;
    severity: AIAlertSeverity;
    message: string;
    icon: string;
    sourceField?: string;
    timestamp: number;
    dismissed: boolean;
    autoFillPayload?: Record<string, unknown>;
}

export type AIEngineStatus = 'idle' | 'analyzing' | 'alert' | 'ready';
