export interface VitalSign {
    id: string;
    date: string;
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
    bmi: number;
    bloodSugar?: number;
    spo2?: number;
    respiratoryRate?: number;
    recordedBy?: string;
    encounterDate?: string;
    sourceType?: string;
}

export interface HealthTimelineItem {
    id: string;
    date: string;
    type: "examination" | "lab_result" | "prescription" | "surgery" | "vaccination" | "vital_check" | "treatment_plan" | "manual_note";
    title: string;
    description: string;
    doctorName?: string;
    department?: string;
    status: "completed" | "pending" | "in_progress";
    icon: string;
    color: string;
    eventType?: string;
    encounterId?: string | null;
    metadata?: Record<string, unknown> | null;
    source?: string;
}

export interface MedicalHistoryItem {
    id: string;
    type: "chronic" | "allergy" | "surgery" | "family" | "risk_factor" | "special_condition";
    name: string;
    details: string;
    diagnosedDate?: string;
    status: "active" | "resolved" | "monitoring";
    severity?: string | null;
    allergenType?: string | null;
    conditionCode?: string | null;
    relationship?: string | null;
    isActive?: boolean;
}

export interface LabResult {
    id: string;
    date: string;
    testName: string;
    category: string;
    results: { name: string; value: string; unit: string; reference: string; status: "normal" | "high" | "low" }[];
    doctorName: string;
    status: "completed" | "pending";
    orderId?: string;
    serviceCode?: string;
    attachments?: string[];
    isAbnormal?: boolean;
    performedBy?: string;
    summary?: string | null;
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    prescribedBy: string;
    status: "active" | "completed" | "discontinued";
    notes?: string;
    prescriptionCode?: string;
    route?: string;
    dispensingUnit?: string;
    estimatedEndDate?: string;
    activeIngredients?: string;
}

export interface Invoice {
    id: string;
    code: string;
    date: string;
    dueDate?: string;
    patientName: string;
    items: { name: string; quantity: number; unitPrice: number; total: number }[];
    subtotal: number;
    insuranceCovered: number;
    discount: number;
    total: number;
    status: "pending" | "paid" | "overdue" | "refunded" | "partial" | "cancelled";
    paymentMethod?: string;
    paidAt?: string;
    appointmentId?: string;
    doctorName?: string;
    department?: string;
    facilityName?: string;
    encounterType?: string;
}

export interface Transaction {
    id: string;
    date: string;
    type: "payment" | "refund" | "deposit";
    amount: number;
    method: string;
    invoiceCode: string;
    status: "success" | "pending" | "failed";
    description: string;
}

export interface ServicePrice {
    id: string;
    category: string;
    serviceGroup: string;
    serviceCode?: string;
    name: string;
    price: number;
    insurancePrice: number;
    insuranceRate: number;
    description: string;
}
