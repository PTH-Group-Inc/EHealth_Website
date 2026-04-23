"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { unwrapList } from "@/api/response";
import { useAuth } from "@/contexts/AuthContext";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { clinicalResultsService } from "@/services/clinicalResultsService";
import type { PatientProfile } from "@/types/patient-profile";
import type { VitalSign, HealthTimelineItem, MedicalHistoryItem, LabResult, Medication } from "@/types/patient-portal";
import { ehrService } from "@/services/ehrService";
import { medicalRecordService } from "@/services/medicalRecordService";
import { adaptPatientClinicalResult, adaptPatientRecordTimelineItem } from "@/utils/patientMedicalRecordAdapters";

type OverviewState = {
    summary: any | null;
    alerts: any[];
    tags: string[];
    diagnoses: any[];
    activeConditions: any[];
    insurance: any | null;
    notes: any[];
};

type VitalsState = {
    summary: any | null;
    abnormal: any[];
};

type LabState = {
    summary: any | null;
    abnormalIds: string[];
};

type MedicationState = {
    interactions: any[];
    timeline: any[];
};

type TimelineState = {
    summary: any | null;
};

const toNumber = (value: unknown, fallback = 0) => {
    if (value === null || value === undefined || value === "") return fallback;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    try {
        return await Promise.race<T>([
            promise,
            new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
        ]);
    } catch {
        return fallback;
    }
};

const formatDisplayDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

const formatDisplayDateTime = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const translateRiskLevel = (value?: string | null) => {
    const normalized = String(value ?? "").toUpperCase();
    if (normalized === "LOW") return "Thấp";
    if (normalized === "MODERATE") return "Trung bình";
    if (normalized === "HIGH") return "Cao";
    if (normalized === "CRITICAL") return "Rất cao";
    return value || "—";
};

const translateHistoryStatus = (value?: string | null) => {
    const normalized = String(value ?? "").toUpperCase();
    if (normalized === "ACTIVE") return "Đang theo dõi";
    if (normalized === "RESOLVED") return "Đã ổn định";
    if (normalized === "MONITORING") return "Theo dõi thêm";
    if (normalized === "INACTIVE") return "Không hoạt động";
    return value || "Đang theo dõi";
};

const translateTimelineType = (value?: string | null) => {
    const normalized = String(value ?? "").toUpperCase();
    if (normalized === "ENCOUNTER_START" || normalized === "ENCOUNTER_END" || normalized === "ENCOUNTER") return "Khám bệnh";
    if (normalized === "LAB_RESULT" || normalized === "LAB_ORDER") return "Xét nghiệm";
    if (normalized === "PRESCRIPTION" || normalized === "DISPENSED") return "Thuốc";
    if (normalized === "DIAGNOSIS") return "Chẩn đoán";
    if (normalized === "VITALS_RECORDED") return "Sinh hiệu";
    if (normalized === "TREATMENT_PLAN") return "Kế hoạch điều trị";
    if (normalized === "TREATMENT_NOTE") return "Diễn tiến điều trị";
    if (normalized === "EMR_SIGNED" || normalized === "EMR_FINALIZED") return "Hồ sơ bệnh án";
    return value || "Sự kiện";
};

const cleanAlertTitle = (value?: string | null) => {
    if (!value) return "Cảnh báo y tế";
    if (/bảo hiểm/i.test(value)) {
        return value.split(":")[0].trim();
    }
    return value;
};

const cleanAlertDescription = (value?: string | null) => {
    if (!value) return "Theo dõi thêm theo dữ liệu hồ sơ.";
    const withoutCodes = value
        .replace(/Mã\s*[A-ZÀ-Ỹa-zà-ỹ]*\s*:\s*[A-Z0-9-]+/g, "")
        .replace(/PRI-[A-Z0-9-]+/g, "")
        .trim();

    const jsDateMatch = withoutCodes.match(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s\d{4}[^,]*/);
    if (jsDateMatch) {
        const formattedDate = formatDisplayDate(jsDateMatch[0]);
        return withoutCodes.replace(jsDateMatch[0], formattedDate);
    }

    return withoutCodes || "Theo dõi thêm theo dữ liệu hồ sơ.";
};

const translateDynamicText = (value?: string | null) => {
    if (!value) return "";

    return value
        .replace(/\bFIRST_VISIT\b/gi, "khám lần đầu")
        .replace(/\bFOLLOW_UP\b/gi, "tái khám")
        .replace(/\bFIRST-VISIT\b/gi, "khám lần đầu")
        .replace(/\bFOLLOW-UP\b/gi, "tái khám")
        .replace(/\bfirst visit\b/gi, "lần khám đầu tiên")
        .replace(/\bfollow-up visit\b/gi, "lần khám tái khám")
        .replace(/\bvisit\b/gi, "khám")
        .replace(/\bdrug\b/gi, "thuốc")
        .replace(/\bdrugs\b/gi, "thuốc")
        .replace(/\bdispensed\b/gi, "đã phát thuốc")
        .replace(/\bprescription\b/gi, "đơn thuốc")
        .replace(/\bactive\b/gi, "đang theo dõi")
        .replace(/\bresolved\b/gi, "đã ổn định")
        .replace(/\bmonitoring\b/gi, "theo dõi thêm")
        .replace(/\bcompleted\b/gi, "hoàn thành")
        .replace(/\bin progress\b/gi, "đang thực hiện")
        .replace(/\bpending\b/gi, "đang chờ");
};

const translateLabCategory = (value?: string | null) => {
    const normalized = String(value ?? "").toUpperCase();
    if (normalized === "LABORATORY") return "Xét nghiệm";
    if (normalized === "IMAGING") return "Chẩn đoán hình ảnh";
    if (normalized === "PROCEDURE") return "Thủ thuật";
    if (normalized === "CẬN LÂM SÀNG" || normalized === "CÁº¬N LÃ‚M SÃ€NG") return "Cận lâm sàng";
    return translateDynamicText(value) || "Cận lâm sàng";
};

const translateAllergenType = (value?: string | null) => {
    const normalized = String(value ?? "").toUpperCase();
    if (normalized === "FOOD") return "Thực phẩm";
    if (normalized === "DRUG") return "Thuốc";
    if (normalized === "ENVIRONMENT") return "Môi trường";
    return translateDynamicText(value) || "Dị nguyên";
};

const translateSeverity = (value?: string | null) => {
    const normalized = String(value ?? "").toUpperCase();
    if (normalized === "MILD") return "Nhẹ";
    if (normalized === "MODERATE") return "Trung bình";
    if (normalized === "SEVERE") return "Nặng";
    if (normalized === "CRITICAL") return "Nguy kịch";
    return translateDynamicText(value) || "Cần theo dõi";
};

const translateWeightTrend = (value?: string | null) => {
    const normalized = String(value ?? "").toUpperCase();
    if (normalized === "INCREASING") return "Tăng";
    if (normalized === "DECREASING") return "Giảm";
    if (normalized === "STABLE") return "Ổn định";
    return translateDynamicText(value) || "Chưa xác định";
};

const getMedicationTimelinePresentation = (item: any) => {
    const eventType = String(item?.event_type ?? "").toUpperCase();
    const rawTitle = translateDynamicText(item?.title ?? "");
    const rawDescription = translateDynamicText(item?.description ?? "");
    const prescriptionCodeMatch = rawTitle.match(/RX-[A-Z0-9-]+/i);
    const prescriptionCode = prescriptionCodeMatch?.[0] ?? null;

    if (eventType === "DISPENSED") {
        return {
            title: "Đã phát thuốc",
            subtitle: rawDescription || "Thuốc đã được cấp phát cho bệnh nhân.",
            code: prescriptionCode,
        };
    }

    if (eventType === "PRESCRIPTION") {
        return {
            title: "Đã kê đơn thuốc",
            subtitle: rawDescription || "Bác sĩ đã kê đơn điều trị.",
            code: prescriptionCode,
        };
    }

    if (eventType === "TREATMENT_PLAN") {
        return {
            title: rawTitle || "Kế hoạch điều trị",
            subtitle: rawDescription || "Kế hoạch điều trị đang được theo dõi.",
            code: null,
        };
    }

    return {
        title: rawTitle || translateTimelineType(eventType),
        subtitle: rawDescription || translateTimelineType(eventType),
        code: prescriptionCode,
    };
};

const TABS = [
    { id: "overview", label: "Tổng quan", icon: "dashboard" },
    { id: "vitals", label: "Chỉ số sinh hiệu", icon: "monitor_heart" },
    { id: "history", label: "Tiền sử bệnh", icon: "history_edu" },
    { id: "lab", label: "Kết quả CLS", icon: "science" },
    { id: "medications", label: "Thuốc đang dùng", icon: "medication" },
    { id: "timeline", label: "Dòng thời gian", icon: "timeline" },
];

// ─── Adapter: chuyển dữ liệu API sang format UI ──────────────────────────────

function adaptVital(v: any): VitalSign {
    const weight = toNumber(v.weight ?? v.bodyWeight ?? v.mass, 0);
    const height = toNumber(v.height ?? v.bodyHeight ?? v.stature, 0);
    const bmi = toNumber(
        v.bmi ?? (weight && height ? weight / ((height / 100) ** 2) : 0),
        0,
    );

    return {
        id: v.id ?? v._id ?? String(Math.random()),
        date: v.date ?? v.measuredAt ?? v.encounter_start ?? v.createdAt ?? v.created_at ?? "",
        bloodPressureSystolic: toNumber(v.bloodPressureSystolic ?? v.blood_pressure_systolic ?? v.systolic ?? v.bp_systolic, 0),
        bloodPressureDiastolic: toNumber(v.bloodPressureDiastolic ?? v.blood_pressure_diastolic ?? v.diastolic ?? v.bp_diastolic, 0),
        heartRate: toNumber(v.heartRate ?? v.heart_rate ?? v.pulse, 0),
        temperature: toNumber(v.temperature ?? v.bodyTemperature, 0),
        weight,
        height,
        bmi,
        bloodSugar: toNumber(v.bloodSugar ?? v.blood_sugar ?? v.blood_glucose ?? v.glucose, 0),
        spo2: toNumber(v.spo2 ?? v.oxygenSaturation ?? v.oxygen_saturation, 0),
        respiratoryRate: toNumber(v.respiratoryRate ?? v.respiratory_rate ?? v.resp_rate, 0),
        recordedBy: v.recordedBy ?? v.recorded_by ?? v.doctor_name ?? v.staff_name ?? "",
        encounterDate: v.encounterDate ?? v.encounter_date ?? v.encounter_start ?? v.date ?? "",
        sourceType: v.sourceType ?? v.source_type ?? v.record_source ?? "CLINIC",
    };
}

const parseMetricValue = (value: unknown) => {
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const getMetricNumericValue = (metric: any) => {
    const parsed = parseMetricValue(metric?.metric_value);
    if (typeof parsed === "number") return parsed;
    if (parsed && typeof parsed === "object" && "value" in parsed) {
        return toNumber((parsed as { value?: unknown }).value, 0);
    }
    return toNumber(parsed, 0);
};

const applyHealthMetricsToVital = (baseVital: VitalSign | null, metrics: any[]) => {
    const latest = baseVital ? { ...baseVital } : adaptVital({});
    const mostRecentByCode = new Map<string, any>();

    metrics.forEach((metric) => {
        const code = String(metric?.metric_code ?? "");
        if (!code) return;
        const current = mostRecentByCode.get(code);
        if (!current || new Date(metric?.measured_at ?? 0).getTime() >= new Date(current?.measured_at ?? 0).getTime()) {
            mostRecentByCode.set(code, metric);
        }
    });

    mostRecentByCode.forEach((metric, code) => {
        const measuredAt = metric?.measured_at ?? latest.date;
        latest.date = measuredAt || latest.date;

        if (code === "BLOOD_PRESSURE") {
            const parsed = parseMetricValue(metric?.metric_value) as { systolic?: unknown; diastolic?: unknown } | null;
            latest.bloodPressureSystolic = toNumber(parsed?.systolic, latest.bloodPressureSystolic);
            latest.bloodPressureDiastolic = toNumber(parsed?.diastolic, latest.bloodPressureDiastolic);
            return;
        }

        const numericValue = getMetricNumericValue(metric);
        if (code === "HEART_RATE") latest.heartRate = numericValue;
        if (code === "TEMPERATURE") latest.temperature = numericValue;
        if (code === "SPO2") latest.spo2 = numericValue;
        if (code === "WEIGHT") latest.weight = numericValue;
        if (code === "HEIGHT") latest.height = numericValue;
        if (code === "BLOOD_SUGAR") latest.bloodSugar = numericValue;
    });

    if (latest.weight && latest.height) {
        latest.bmi = toNumber(latest.weight / ((latest.height / 100) ** 2), latest.bmi);
    }

    return latest;
};

const buildVitalsFromHealthMetrics = (metrics: any[]) => {
    const grouped = new Map<string, VitalSign>();

    metrics.forEach((metric) => {
        const measuredAt = String(metric?.measured_at ?? "");
        if (!measuredAt) return;

        const current = grouped.get(measuredAt) ?? {
            id: metric?.patient_health_metrics_id ?? `metric_${measuredAt}`,
            date: measuredAt,
            bloodPressureSystolic: Number.NaN,
            bloodPressureDiastolic: Number.NaN,
            heartRate: Number.NaN,
            temperature: Number.NaN,
            weight: Number.NaN,
            height: Number.NaN,
            bmi: Number.NaN,
            bloodSugar: Number.NaN,
            spo2: Number.NaN,
            respiratoryRate: Number.NaN,
            sourceType: metric?.source_type ?? "DEVICE",
        };

        current.id = current.id || metric?.patient_health_metrics_id || `metric_${measuredAt}`;
        current.date = measuredAt;
        current.sourceType = metric?.source_type ?? current.sourceType;

        const parsed = parseMetricValue(metric?.metric_value);
        const numericValue = getMetricNumericValue(metric);
        const code = String(metric?.metric_code ?? "").toUpperCase();

        if (code === "BLOOD_PRESSURE") {
            const bloodPressure = parsed as { systolic?: unknown; diastolic?: unknown } | null;
            current.bloodPressureSystolic = toNumber(bloodPressure?.systolic, current.bloodPressureSystolic);
            current.bloodPressureDiastolic = toNumber(bloodPressure?.diastolic, current.bloodPressureDiastolic);
        }
        if (code === "HEART_RATE") current.heartRate = numericValue;
        if (code === "TEMPERATURE") current.temperature = numericValue;
        if (code === "SPO2") current.spo2 = numericValue;
        if (code === "WEIGHT") current.weight = numericValue;
        if (code === "HEIGHT") current.height = numericValue;
        if (code === "BLOOD_SUGAR") current.bloodSugar = numericValue;

        if (current.weight && current.height) {
            current.bmi = toNumber(current.weight / ((current.height / 100) ** 2), current.bmi);
        }

        grouped.set(measuredAt, current);
    });

    return Array.from(grouped.values());
};

const mergeVitalsWithHealthMetrics = (rawVitals: any[], metrics: any[]) => {
    const mappedHistory = rawVitals.map(adaptVital);
    const metricHistory = buildVitalsFromHealthMetrics(metrics);
    const mergedByTimestamp = new Map<string, VitalSign>();

    [...mappedHistory, ...metricHistory].forEach((item, index) => {
        const timestampKey = item.date || `${item.id}_${index}`;
        const existing = mergedByTimestamp.get(timestampKey);

        if (!existing) {
            mergedByTimestamp.set(timestampKey, { ...item });
            return;
        }

        mergedByTimestamp.set(timestampKey, {
            ...existing,
            ...item,
            bloodPressureSystolic: item.bloodPressureSystolic || existing.bloodPressureSystolic,
            bloodPressureDiastolic: item.bloodPressureDiastolic || existing.bloodPressureDiastolic,
            heartRate: item.heartRate || existing.heartRate,
            temperature: item.temperature || existing.temperature,
            spo2: item.spo2 || existing.spo2,
            weight: item.weight || existing.weight,
            height: item.height || existing.height,
            bmi: item.bmi || existing.bmi,
            bloodSugar: item.bloodSugar || existing.bloodSugar,
        });
    });

    const sortedAsc = Array.from(mergedByTimestamp.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const carryForwarded = sortedAsc.map((item, index) => {
        if (index === 0) return { ...item };

        const previous = sortedAsc[index - 1];
        const merged = { ...item };

        if (!Number.isFinite(merged.bloodPressureSystolic) || merged.bloodPressureSystolic <= 0) merged.bloodPressureSystolic = previous.bloodPressureSystolic;
        if (!Number.isFinite(merged.bloodPressureDiastolic) || merged.bloodPressureDiastolic <= 0) merged.bloodPressureDiastolic = previous.bloodPressureDiastolic;
        if (!Number.isFinite(merged.heartRate) || merged.heartRate <= 0) merged.heartRate = previous.heartRate;
        if (!Number.isFinite(merged.temperature) || merged.temperature <= 0) merged.temperature = previous.temperature;
        if (!Number.isFinite(merged.weight) || merged.weight <= 0) merged.weight = previous.weight;
        if (!Number.isFinite(merged.height) || merged.height <= 0) merged.height = previous.height;
        if (!Number.isFinite(merged.bmi) || merged.bmi <= 0) merged.bmi = previous.bmi;
        if (!Number.isFinite(merged.bloodSugar ?? Number.NaN) || (merged.bloodSugar ?? 0) <= 0) merged.bloodSugar = previous.bloodSugar;
        if (!Number.isFinite(merged.spo2 ?? Number.NaN) || (merged.spo2 ?? 0) <= 0) merged.spo2 = previous.spo2;
        if (!Number.isFinite(merged.respiratoryRate ?? Number.NaN) || (merged.respiratoryRate ?? 0) <= 0) merged.respiratoryRate = previous.respiratoryRate;

        if ((!Number.isFinite(merged.bmi) || merged.bmi <= 0) && merged.weight > 0 && merged.height > 0) {
            merged.bmi = toNumber(merged.weight / ((merged.height / 100) ** 2), previous.bmi);
        }

        sortedAsc[index] = merged;
        return merged;
    });

    return carryForwarded
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const getBmiClassification = (bmi: number) => {
    if (!Number.isFinite(bmi) || bmi <= 0) return "Chưa phân loại";
    if (bmi < 18.5) return "Thiếu cân";
    if (bmi < 25) return "Bình thường";
    if (bmi < 30) return "Thừa cân";
    return "Béo phì";
};

const getWeightTrendValue = (vitals: VitalSign[]) => {
    const weights = vitals.filter((item) => item.weight > 0).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (weights.length < 2) return "UNKNOWN";
    const diff = weights[weights.length - 1].weight - weights[0].weight;
    if (Math.abs(diff) < 0.5) return "STABLE";
    return diff > 0 ? "INCREASING" : "DECREASING";
};

const buildVitalsSummaryFromHistory = (vitals: VitalSign[]) => {
    if (vitals.length === 0) return null;
    const sorted = vitals.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted.find((item) => Number.isFinite(item.bmi) && item.bmi > 0) ?? sorted[0];
    const latestWeightMeasurement = sorted.find((item) => Number.isFinite(item.weight) && item.weight > 0) ?? sorted[0];
    const bpItems = vitals.filter((item) => item.bloodPressureSystolic > 0 && item.bloodPressureDiastolic > 0);
    const avgSystolic = bpItems.length
        ? Math.round(bpItems.reduce((sum, item) => sum + item.bloodPressureSystolic, 0) / bpItems.length)
        : null;
    const avgDiastolic = bpItems.length
        ? Math.round(bpItems.reduce((sum, item) => sum + item.bloodPressureDiastolic, 0) / bpItems.length)
        : null;

    return {
        current_bmi: latest.bmi ?? 0,
        bmi_classification: getBmiClassification(toNumber(latest.bmi, 0)),
        avg_bp_systolic: avgSystolic,
        avg_bp_diastolic: avgDiastolic,
        total_measurements: vitals.length,
        weight_trend: getWeightTrendValue(vitals),
        latest_measurement_at: latestWeightMeasurement.date,
    };
};

const buildAbnormalVitals = (vitals: VitalSign[]) => {
    if (vitals.length === 0) return [];
    const latest = vitals.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const items: Array<{ metric_label: string; message: string; value: number; unit: string }> = [];
    const latestSpo2 = toNumber(latest.spo2, 0);

    if (latest.bloodPressureSystolic >= 140 || latest.bloodPressureDiastolic >= 90) {
        items.push({
            metric_label: "Huyết áp",
            message: `${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic} mmHg`,
            value: latest.bloodPressureSystolic,
            unit: "mmHg",
        });
    }
    if (latest.heartRate > 100 || (latest.heartRate > 0 && latest.heartRate < 60)) {
        items.push({
            metric_label: "Nhịp tim",
            message: `${latest.heartRate} bpm`,
            value: latest.heartRate,
            unit: "bpm",
        });
    }
    if (latest.temperature >= 37.5 || (latest.temperature > 0 && latest.temperature < 35.5)) {
        items.push({
            metric_label: "Nhiệt độ",
            message: `${latest.temperature} °C`,
            value: latest.temperature,
            unit: "°C",
        });
    }
    if (latestSpo2 > 0 && latestSpo2 < 95) {
        items.push({
            metric_label: "SpO2",
            message: `${latestSpo2}%`,
            value: latestSpo2,
            unit: "%",
        });
    }

    return items;
};

function adaptTimeline(t: any): HealthTimelineItem {
    const typeMap: Record<string, HealthTimelineItem["type"]> = {
        examination: "examination", lab_result: "lab_result", prescription: "prescription",
        surgery: "surgery", vaccination: "vaccination", vital_check: "vital_check",
        lab: "lab_result", visit: "examination", vaccine: "vaccination",
    };
    return {
        id: t.id ?? t._id ?? String(Math.random()),
        date: t.date ?? t.createdAt ?? "",
        type: typeMap[t.type] ?? "examination",
        title: t.title ?? t.name ?? t.description ?? "Sự kiện sức khoẻ",
        description: t.description ?? t.summary ?? "",
        doctorName: t.doctorName ?? t.doctor_name ?? t.doctor?.name,
        department: t.department ?? t.speciality,
        status: t.status ?? "completed",
        icon: t.icon ?? "health_and_safety",
        color: t.color ?? "text-blue-500 bg-blue-50",
    };
}

function adaptMedHistory(m: any): MedicalHistoryItem {
    const typeMap: Record<string, MedicalHistoryItem["type"]> = {
        chronic: "chronic", allergy: "allergy", surgery: "surgery",
        family: "family", risk_factor: "risk_factor",
        chronic_disease: "chronic", allergic: "allergy",
        PERSONAL: "chronic", FAMILY: "family", SURGICAL: "surgery",
        SPECIAL_CONDITION: "special_condition",
        special_condition: "special_condition",
    };
    const statusMap: Record<string, MedicalHistoryItem["status"]> = {
        ACTIVE: "active",
        RESOLVED: "resolved",
        INACTIVE: "monitoring",
        MONITORING: "monitoring",
    };
    return {
        id: m.id ?? m._id ?? m.patient_medical_histories_id ?? m.patient_allergies_id ?? String(Math.random()),
        type: typeMap[m.type ?? m.history_type] ?? "chronic",
        name: m.name ?? m.condition_name ?? m.allergen_name ?? m.condition ?? m.diagnosis ?? "",
        details: m.details ?? m.reaction ?? m.description ?? m.notes ?? "",
        diagnosedDate: m.diagnosedDate ?? m.diagnosis_date ?? m.diagnosed_date ?? m.onset_date ?? m.created_at,
        status: statusMap[m.status] ?? m.status ?? "active",
        severity: m.severity ?? m.reaction_severity ?? null,
        allergenType: m.allergen_type ?? m.type_of_allergen ?? null,
        conditionCode: m.condition_code ?? m.icd10_code ?? null,
        relationship: m.relationship ?? m.family_relationship ?? null,
        isActive: m.is_active ?? m.active ?? m.status === "ACTIVE",
    };
}

function adaptLabResult(r: any): LabResult {
    const items = r.results ?? r.items ?? r.parameters ?? [];
    return {
        id: r.id ?? r._id ?? String(Math.random()),
        date: r.date ?? r.performedAt ?? r.createdAt ?? "",
        testName: r.testName ?? r.test_name ?? r.name ?? "Xét nghiệm",
        category: r.category ?? r.type ?? "Xét nghiệm",
        doctorName: r.doctorName ?? r.doctor_name ?? r.doctor?.name ?? "",
        status: r.status ?? "completed",
        results: items.map((i: any) => ({
            name: i.name ?? i.parameter ?? "",
            value: String(i.value ?? ""),
            unit: i.unit ?? "",
            reference: i.reference ?? i.referenceRange ?? i.normal_range ?? "",
            status: i.status ?? (i.isNormal === false ? "high" : "normal"),
        })),
    };
}

function adaptClinicalResultToLabResult(result: any): LabResult {
    const collectItems = (input: any): any[] => {
        if (!input) return [];
        if (Array.isArray(input)) return input.flatMap(collectItems);
        if (typeof input !== "object") return [];
        if ("value" in input || "result" in input || "referenceRange" in input || "unit" in input) {
            return [input];
        }

        return Object.entries(input).flatMap(([key, value]) => {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                const detail = value as Record<string, any>;
                return [{
                    name: detail.name ?? key,
                    value: detail.value ?? detail.result ?? detail.text ?? detail.summary ?? "",
                    unit: detail.unit ?? "",
                    reference: detail.reference ?? detail.referenceRange ?? detail.normalRange ?? "",
                    status: detail.status ?? detail.flag ?? "",
                }];
            }

            return [{
                name: key,
                value,
                unit: "",
                reference: "",
                status: "",
            }];
        });
    };

    const details = result?.resultDetails;
    const detailItems = Array.isArray(details?.items)
        ? details.items
        : Array.isArray(details?.results)
            ? details.results
            : collectItems(details);
    const summary = typeof result?.resultSummary === "string" ? result.resultSummary.trim() : "";

    return {
        id: result?.orderId ?? String(Math.random()),
        date: result?.performedAt ?? result?.orderedAt ?? "",
        testName: result?.serviceName ?? "Xét nghiệm",
        category: result?.orderType || "Cận lâm sàng",
        doctorName: result?.doctorName || result?.ordererName || result?.performerName || "",
        status: result?.status === "pending" ? "pending" : "completed",
        orderId: result?.orderId,
        serviceCode: result?.serviceCode ?? result?.service_code,
        attachments: Array.isArray(result?.attachmentUrls) ? result.attachmentUrls : [],
        isAbnormal: Boolean(result?.isAbnormal),
        performedBy: result?.performerName ?? result?.doctorName ?? "",
        summary: summary || null,
        results: detailItems.length > 0
            ? detailItems.map((item: any) => ({
                name: item?.name ?? item?.label ?? item?.parameter ?? "Chỉ số",
                value: String(item?.value ?? item?.result ?? ""),
                unit: item?.unit ?? "",
                reference: item?.reference ?? item?.referenceRange ?? item?.normalRange ?? "",
                status: item?.status === "low" || item?.flag === "low"
                    ? "low"
                    : item?.status === "high" || item?.flag === "high" || item?.status === "abnormal"
                        ? "high"
                        : "normal",
            }))
            : summary
                ? [{
                    name: "Tóm tắt",
                    value: summary,
                    unit: "",
                    reference: "",
                    status: result?.isAbnormal ? "high" : "normal",
                }]
                : [],
    };
}

function adaptRecordTimelineToHealthTimeline(item: any): HealthTimelineItem {
    const adapted = adaptPatientRecordTimelineItem(item);
    const typeMap: Record<string, HealthTimelineItem["type"]> = {
        ENCOUNTER: "examination",
        DIAGNOSIS: "examination",
        PRESCRIPTION: "prescription",
        LAB_ORDER: "lab_result",
        LAB_RESULT: "lab_result",
        EMR_FINALIZED: "examination",
        EMR_SIGNED: "examination",
        EMR_OFFICIAL_SIGNED: "examination",
        SIGN_REVOKED: "examination",
    };

    return {
        id: adapted.id,
        date: adapted.date,
        type: typeMap[adapted.type] ?? "examination",
        title: adapted.title,
        description: adapted.description,
        doctorName: undefined,
        department: undefined,
        status: adapted.status,
        icon: adapted.icon,
        color: adapted.color,
        eventType: item?.event_type ?? adapted.type,
        encounterId: item?.encounter_id ?? item?.encounters_id ?? null,
        metadata: item?.metadata ?? null,
        source: item?.source ?? "EHR",
    };
}

function adaptMedication(m: any): Medication {
    const daysRemaining = Number(m.days_remaining);
    const normalizedStatus = String(m.status ?? "").toUpperCase();

    return {
        id: m.id ?? m._id ?? m.prescription_details_id ?? String(Math.random()),
        name: m.name ?? m.brand_name ?? m.drugName ?? m.drug_name ?? m.drug_name ?? m.medication ?? "",
        dosage: m.dosage ?? m.dose ?? "",
        frequency: m.frequency ?? m.schedule ?? "",
        startDate: m.startDate ?? m.start_date ?? m.prescribed_at ?? "",
        endDate: m.endDate ?? m.end_date,
        prescribedBy: m.prescribedBy ?? m.prescribed_by ?? m.doctor_name ?? m.doctor?.name ?? "",
        status: normalizedStatus === "COMPLETED" || normalizedStatus === "DISCONTINUED"
            ? "completed"
            : Number.isFinite(daysRemaining) && daysRemaining < 0
                ? "completed"
                : "active",
        notes: m.notes ?? m.usage_instruction ?? m.instructions ?? m.active_ingredients,
        prescriptionCode: m.prescription_code ?? "",
        route: m.route_of_administration ?? m.route ?? "",
        dispensingUnit: m.dispensing_unit ?? "",
        estimatedEndDate: m.estimated_end_date ?? "",
        activeIngredients: m.active_ingredients ?? "",
    };
}

function hasMeasuredValue(value: number | null | undefined) {
    return Number.isFinite(value) && Number(value) > 0;
}

function createMetricStatus(
    hasValue: boolean,
    isNormal: boolean,
    normalLabel = "Bình thường",
    warningLabel = "Cần theo dõi",
) {
    if (!hasValue) {
        return {
            ok: false,
            label: "Chưa có dữ liệu",
            tone: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300",
            icon: "info",
        };
    }

    return {
        ok: isNormal,
        label: isNormal ? normalLabel : warningLabel,
        tone: isNormal
            ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
            : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
        icon: isNormal ? "check_circle" : "warning",
    };
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function Skeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                </div>
            ))}
        </div>
    );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] py-16 text-center">
            <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 mb-3" style={{ fontSize: "56px" }}>{icon}</span>
            <p className="text-sm text-[#687582]">{message}</p>
        </div>
    );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function HealthRecordsPage() {
    usePageAIContext({ pageKey: 'health-records' });
    const { user } = useAuth();
    const tp = useTranslations("pages.portal.patient.healthRecords");
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedProfileId, setSelectedProfileId] = useState("");
    const [profiles, setProfiles] = useState<PatientProfile[]>([]);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const { patientProfileService, mapBEToFEProfile } = await import("@/services/patientProfileService");
                const beProfiles = await patientProfileService.getMyProfiles();
                const mapped = beProfiles.map((be) => mapBEToFEProfile(be, user?.id));
                setProfiles(mapped);
                if (mapped.length > 0 && !selectedProfileId) {
                    const cachedId = sessionStorage.getItem("patientPortal_selectedProfileId");
                    const exists = mapped.some((p) => p.id === cachedId);
                    setSelectedProfileId(exists ? cachedId! : mapped[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch profiles", error);
            }
        };
        if (user?.id) {
            fetchProfiles();
        }
    }, [user?.id]);

    // Track which tabs đã fetch rồi
    const [fetched, setFetched] = useState<Record<string, boolean>>({});

    // ── Data states ────────────────────────────────────────────────────
    const [latestVital, setLatestVital] = useState<VitalSign | null>(null);
    const [vitals, setVitals] = useState<VitalSign[]>([]);
    const [timeline, setTimeline] = useState<HealthTimelineItem[]>([]);
    const [medHistory, setMedHistory] = useState<MedicalHistoryItem[]>([]);
    const [labResults, setLabResults] = useState<LabResult[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [allergies, setAllergies] = useState<MedicalHistoryItem[]>([]);
    const [overviewState, setOverviewState] = useState<OverviewState>({
        summary: null,
        alerts: [],
        tags: [],
        diagnoses: [],
        activeConditions: [],
        insurance: null,
        notes: [],
    });
    const [vitalsState, setVitalsState] = useState<VitalsState>({ summary: null, abnormal: [] });
    const [riskFactors, setRiskFactors] = useState<MedicalHistoryItem[]>([]);
    const [specialConditions, setSpecialConditions] = useState<MedicalHistoryItem[]>([]);
    const [labState, setLabState] = useState<LabState>({ summary: null, abnormalIds: [] });
    const [medicationState, setMedicationState] = useState<MedicationState>({ interactions: [], timeline: [] });
    const [timelineState, setTimelineState] = useState<TimelineState>({ summary: null });
    const [timelineFilter, setTimelineFilter] = useState("ALL");

    // ── Loading states per tab ─────────────────────────────────────────
    const [loadingVitals, setLoadingVitals] = useState(false);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingLab, setLoadingLab] = useState(false);
    const [loadingMeds, setLoadingMeds] = useState(false);
    const [loadingOverview, setLoadingOverview] = useState(false);

    const patientId = selectedProfileId;

    // ── Fetch functions ────────────────────────────────────────────────

    const fetchOverview = useCallback(async () => {
        if (!patientId || !selectedProfileId) return;
        if (fetched[`overview_${selectedProfileId}`]) return;
        setLoadingOverview(true);
        try {
            const [profileRes, summaryRes, activeConditionsRes, diagnosisRes, insuranceRes, medsRes, allergiesRes, timelineRes, metricsRes] = await Promise.allSettled([
                ehrService.getHealthProfile(patientId),
                ehrService.getHealthSummary(patientId),
                ehrService.getActiveConditions(patientId),
                ehrService.getDiagnosisHistory(patientId, { limit: 5 }),
                ehrService.getInsuranceStatus(patientId),
                ehrService.getCurrentMedications(patientId),
                ehrService.getAllergies(patientId),
                ehrService.getHealthTimeline(patientId, { limit: 6 }),
                ehrService.getHealthMetrics(patientId, { limit: 50 }),
            ]);

            if (profileRes.status === "fulfilled") {
                const profile = profileRes.value ?? {};
                const latest = profile?.latest_vitals ?? profile?.latestVital ?? null;
                const healthMetrics = metricsRes.status === "fulfilled" ? metricsRes.value?.data ?? [] : [];
                const latestVitalWithMetrics = applyHealthMetricsToVital(latest ? adaptVital(latest) : null, healthMetrics);
                if (latestVitalWithMetrics?.date) {
                    setLatestVital(latestVitalWithMetrics);
                }
                if (Array.isArray(profile?.current_medications) && profile.current_medications.length > 0) {
                    setMedications(profile.current_medications.map(adaptMedication));
                }
                setOverviewState({
                    summary: profile?.health_summary ?? (summaryRes.status === "fulfilled" ? summaryRes.value : null),
                    alerts: profile?.alerts ?? [],
                    tags: Array.isArray(profile?.tags) ? profile.tags : [],
                    diagnoses: profile?.recent_diagnoses ?? (diagnosisRes.status === "fulfilled" ? diagnosisRes.value.data : []),
                    activeConditions: profile?.active_conditions ?? (activeConditionsRes.status === "fulfilled" ? activeConditionsRes.value.data : []),
                    insurance: profile?.insurance_info ?? (insuranceRes.status === "fulfilled" ? insuranceRes.value?.data?.[0] ?? null : null),
                    notes: Array.isArray(profile?.ehr_notes) ? profile.ehr_notes : [],
                });
            }
            if (medsRes.status === "fulfilled" && medsRes.value.data?.length) {
                setMedications(medsRes.value.data.map(adaptMedication));
            }
            if (allergiesRes.status === "fulfilled" && allergiesRes.value.data?.length) {
                setAllergies(allergiesRes.value.data.map((a: any) => adaptMedHistory({ ...a, type: "allergy" })));
            }
            if (timelineRes.status === "fulfilled") {
                setTimeline(timelineRes.value.data.map(adaptRecordTimelineToHealthTimeline));
            }
            setFetched(prev => ({ ...prev, [`overview_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingOverview(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    const fetchVitals = useCallback(async () => {
        if (!patientId || !selectedProfileId) return;
        if (fetched[`vitals_${selectedProfileId}`]) return;
        setLoadingVitals(true);
        try {
            const [latestResult, historyResult, summaryResult, abnormalResult, metricsResult] = await Promise.all([
                withTimeout(ehrService.getVitalLatest(patientId), 8000, null),
                withTimeout(ehrService.getVitalHistoryByProfile(patientId), 8000, { data: [] } as { data: any[] }),
                withTimeout(ehrService.getVitalSummary(patientId), 5000, null),
                withTimeout(ehrService.getVitalAbnormal(patientId), 5000, { data: [] } as { data: any[] }),
                withTimeout(ehrService.getHealthMetrics(patientId, { limit: 50 }), 8000, { data: [] } as { data: any[] }),
            ]);

            const latestFromApi = latestResult ? adaptVital(latestResult) : null;
            const historyItems = historyResult?.data ?? [];
            const healthMetrics = metricsResult?.data ?? [];
            const mergedVitals = mergeVitalsWithHealthMetrics(historyItems, healthMetrics);
            const mergedLatest = applyHealthMetricsToVital(latestFromApi, healthMetrics);
            const effectiveVitals = mergedVitals.length > 0
                ? mergedVitals
                : (mergedLatest?.date ? [mergedLatest] : []);
            const derivedSummary = buildVitalsSummaryFromHistory(effectiveVitals);
            const derivedAbnormal = buildAbnormalVitals(effectiveVitals);

            if (effectiveVitals[0]) {
                setLatestVital(effectiveVitals[0]);
            } else if (mergedLatest?.date) {
                setLatestVital(mergedLatest);
            }
            setVitals(effectiveVitals);
            setVitalsState({
                summary: derivedSummary
                    ? {
                        ...derivedSummary,
                        weight_trend: derivedSummary.weight_trend === "UNKNOWN" ? "Chưa xác định" : derivedSummary.weight_trend,
                    }
                    : summaryResult,
                abnormal: effectiveVitals.length > 0
                    ? derivedAbnormal
                    : (abnormalResult?.data ?? []),
            });
            setFetched(prev => ({ ...prev, [`vitals_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingVitals(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    const fetchHistory = useCallback(async () => {
        if (!patientId || !selectedProfileId) return;
        if (fetched[`history_${selectedProfileId}`]) return;
        setLoadingHistory(true);
        try {
            const profile = await withTimeout(ehrService.getHealthProfile(patientId), 8000, null);

            if (profile) {
                const activeConditions = Array.isArray(profile?.active_conditions) ? profile.active_conditions : [];
                const allergyItems = Array.isArray(profile?.allergies) ? profile.allergies : [];

                setMedHistory(activeConditions.map(adaptMedHistory));
                setAllergies(allergyItems.map((item: any) => adaptMedHistory({ ...item, type: "allergy" })));
            } else {
                setMedHistory([]);
                setAllergies([]);
            }

            setRiskFactors([]);
            setSpecialConditions([]);
            setFetched(prev => ({ ...prev, [`history_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingHistory(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    const fetchLab = useCallback(async () => {
        if (!patientId || !selectedProfileId) return;
        if (fetched[`lab_${selectedProfileId}`]) return;
        setLoadingLab(true);
        try {
            const [patientResultsRes, encounterResultsRes, labSummaryRes, abnormalRes, attachmentRes] = await Promise.allSettled([
                clinicalResultsService.getByPatient(patientId, { page: 1, limit: 100 }),
                (async () => {
                    const encountersRes = await medicalRecordService.getByPatient(patientId);
                    const encounterIds = unwrapList<any>(encountersRes).data
                        .map((encounter) => encounter?.encounters_id || encounter?.encounter_id || encounter?.id)
                        .filter(Boolean);

                    const settledResults = await Promise.allSettled(
                        encounterIds.map((encounterId) => clinicalResultsService.getByEncounter(encounterId, patientId)),
                    );

                    return settledResults.flatMap((result) =>
                        result.status === "fulfilled"
                            ? result.value.data
                            : [],
                    );
                })(),
                clinicalResultsService.getSummary(patientId),
                clinicalResultsService.getAbnormal(patientId),
                clinicalResultsService.getAttachments(patientId),
            ]);

            const patientResults = patientResultsRes.status === "fulfilled" ? patientResultsRes.value.data : [];
            const encounterResults = encounterResultsRes.status === "fulfilled" ? encounterResultsRes.value : [];
            const abnormalIds = abnormalRes.status === "fulfilled"
                ? abnormalRes.value.data
                    .map((item) => item.orderId ?? item.medical_orders_id ?? `${item.service_code ?? item.type}_${item.resultedAt ?? item.performed_at ?? ""}`)
                    .filter(Boolean)
                : [];
            const attachmentMap = new Map(
                (attachmentRes.status === "fulfilled" ? attachmentRes.value.data : []).map((item) => [
                    item.medical_orders_id,
                    item.attachment_urls ?? [],
                ]),
            );
            const deduped = Array.from(
                new Map(
                    [...patientResults, ...encounterResults]
                        .map(adaptPatientClinicalResult)
                        .map((item) => [
                            item.orderId ?? `${item.serviceName}_${item.performedAt}`,
                            {
                                ...item,
                                attachmentUrls: attachmentMap.get(item.orderId ?? "") ?? item.attachmentUrls ?? [],
                                isAbnormal: item.isAbnormal || abnormalIds.includes(item.orderId ?? `${item.serviceCode ?? item.serviceName}_${item.performedAt ?? ""}`),
                            },
                        ]),
                ).values(),
            );

            setLabResults(deduped.map(adaptClinicalResultToLabResult));
            setLabState({
                summary: labSummaryRes.status === "fulfilled" ? labSummaryRes.value : null,
                abnormalIds,
            });
            setFetched(prev => ({ ...prev, [`lab_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingLab(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    const fetchMedications = useCallback(async () => {
        if (!patientId || !selectedProfileId) return;
        if (fetched[`meds_${selectedProfileId}`]) return;
        setLoadingMeds(true);
        try {
            const [medsRes, interactionRes, timelineRes] = await Promise.allSettled([
                ehrService.getCurrentMedications(patientId),
                ehrService.getMedicationInteractionCheck(patientId),
                ehrService.getMedicationTimeline(patientId),
            ]);
            if (medsRes.status === "fulfilled" && medsRes.value.data?.length) {
                setMedications(medsRes.value.data.map(adaptMedication));
            }
            setMedicationState({
                interactions: interactionRes.status === "fulfilled"
                    ? interactionRes.value?.interactions ?? interactionRes.value?.warnings ?? []
                    : [],
                timeline: timelineRes.status === "fulfilled" ? timelineRes.value.data : [],
            });
            setFetched(prev => ({ ...prev, [`meds_${selectedProfileId}`]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingMeds(false);
        }
    }, [patientId, selectedProfileId, fetched]);

    const fetchTimeline = useCallback(async () => {
        if (!patientId || !selectedProfileId) return;
        const timelineKey = `timeline_${selectedProfileId}_${timelineFilter}`;
        if (fetched[timelineKey]) return;
        setLoadingTimeline(true);
        try {
            const params = timelineFilter === "ALL" ? { limit: 50 } : { limit: 50, event_type: timelineFilter };
            const [timelineRes, summaryRes] = await Promise.allSettled([
                ehrService.getHealthTimeline(patientId, params),
                ehrService.getHealthTimelineSummary(patientId),
            ]);
            const items = timelineRes.status === "fulfilled"
                ? timelineRes.value.data.map(adaptRecordTimelineToHealthTimeline)
                : [];
            if (items.length) setTimeline(items);
            if (summaryRes.status === "fulfilled") {
                setTimelineState({ summary: summaryRes.value });
            }
            setFetched(prev => ({ ...prev, [timelineKey]: true }));
        } catch {
            // giữ fallback mock
        } finally {
            setLoadingTimeline(false);
        }
    }, [patientId, selectedProfileId, fetched, timelineFilter]);

    // Lazy load khi chuyển tab
    useEffect(() => {
        if (!selectedProfileId) return;
        switch (activeTab) {
            case "overview": fetchOverview(); break;
            case "vitals": fetchVitals(); break;
            case "history": fetchHistory(); break;
            case "lab": fetchLab(); break;
            case "medications": fetchMedications(); break;
            case "timeline": fetchTimeline(); break;
        }
    }, [activeTab, selectedProfileId, timelineFilter, fetchHistory, fetchLab, fetchMedications, fetchOverview, fetchTimeline, fetchVitals]);

    // Reset fetched khi đổi profile
    const handleProfileChange = (profileId: string) => {
        setSelectedProfileId(profileId);
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem("patientPortal_selectedProfileId", profileId);
        }
        setFetched({});
        setLatestVital(null);
        setVitals([]);
        setTimeline([]);
        setMedHistory([]);
        setLabResults([]);
        setMedications([]);
        setAllergies([]);
        setOverviewState({ summary: null, alerts: [], tags: [], diagnoses: [], activeConditions: [], insurance: null, notes: [] });
        setVitalsState({ summary: null, abnormal: [] });
        setRiskFactors([]);
        setSpecialConditions([]);
        setLabState({ summary: null, abnormalIds: [] });
        setMedicationState({ interactions: [], timeline: [] });
        setTimelineState({ summary: null });
        setTimelineFilter("ALL");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#121417] dark:text-white">{tp("title")}</h1>
                <p className="text-sm text-[#687582] mt-0.5">{tp("subtitle")}</p>
                {profiles.length > 0 && (
                    <div className="mt-4 -mx-2 overflow-x-auto px-2 pb-2 hide-scrollbar">
                        <div className="flex min-w-max gap-3 pr-4 snap-x">
                        {profiles.map(p => (
                            <div
                                key={p.id}
                                onClick={() => handleProfileChange(p.id)}
                                className={`flex min-w-[240px] items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all snap-start ${selectedProfileId === p.id ? 'border-[#3C81C6] bg-blue-50/50 dark:bg-blue-900/20 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e242b] hover:border-blue-300 dark:hover:border-blue-800'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-[#3C81C6]/20 shrink-0">
                                    {p.fullName?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${selectedProfileId === p.id ? 'text-[#3C81C6]' : 'text-gray-900 dark:text-white'}`}>{p.fullName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.phone || "Chưa có SĐT"}</p>
                                </div>
                                {selectedProfileId === p.id && (
                                    <span className="material-symbols-outlined text-[#3C81C6] shrink-0" style={{ fontSize: "20px" }}>check_circle</span>
                                )}
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-hide">
                <div className="flex min-w-max gap-1.5 pr-4">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                        ${activeTab === tab.id ? "bg-[#3C81C6] text-white shadow-sm shadow-[#3C81C6]/20" : "bg-white dark:bg-[#1e242b] text-[#687582] hover:bg-gray-50 dark:hover:bg-[#252d36] border border-[#e5e7eb] dark:border-[#2d353e]"}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                {activeTab === "overview" && (loadingOverview ? <Skeleton rows={2} /> : <OverviewTab vital={latestVital} allergies={allergies} medications={medications} recentTimeline={timeline} overview={overviewState} />)}
                {activeTab === "vitals" && (loadingVitals ? <Skeleton rows={2} /> : <VitalsTab vitals={vitals} summary={vitalsState.summary} abnormal={vitalsState.abnormal} />)}
                {activeTab === "history" && (loadingHistory ? <Skeleton /> : <MedicalHistoryTab items={medHistory} allergies={allergies} riskFactors={riskFactors} specialConditions={specialConditions} />)}
                {activeTab === "lab" && (loadingLab ? <Skeleton /> : <LabResultsTab results={labResults} summary={labState.summary} abnormalIds={labState.abnormalIds} />)}
                {activeTab === "medications" && (loadingMeds ? <Skeleton /> : <MedicationsTab medications={medications} interactions={medicationState.interactions} timeline={medicationState.timeline} />)}
                {activeTab === "timeline" && (loadingTimeline ? <Skeleton /> : <TimelineTab items={timeline} summary={timelineState.summary} filter={timelineFilter} onFilterChange={setTimelineFilter} />)}
            </div>
        </div>
    );
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function OverviewTab({
    vital, allergies, medications, recentTimeline, overview
}: {
    vital: VitalSign | null;
    allergies: MedicalHistoryItem[];
    medications: Medication[];
    recentTimeline: HealthTimelineItem[];
    overview: OverviewState;
}) {
    const hasBloodPressure =
        hasMeasuredValue(vital?.bloodPressureSystolic) &&
        hasMeasuredValue(vital?.bloodPressureDiastolic);
    const hasHeartRate = hasMeasuredValue(vital?.heartRate);
    const hasBmi = hasMeasuredValue(vital?.bmi);
    const hasSpo2 = hasMeasuredValue(vital?.spo2);
    const hasBloodSugar = hasMeasuredValue(vital?.bloodSugar);
    const hasTemperature = hasMeasuredValue(vital?.temperature);
    const bloodSugarValue = hasBloodSugar ? `${vital?.bloodSugar}` : "—";
    const bloodSugarStatus = !hasBloodSugar
        ? {
            ok: false,
            label: "Chưa có dữ liệu",
            tone: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300",
            icon: "info",
        }
        : {
            ok: toNumber(vital?.bloodSugar, 0) >= 70 && toNumber(vital?.bloodSugar, 0) <= 140,
            label: toNumber(vital?.bloodSugar, 0) >= 70 && toNumber(vital?.bloodSugar, 0) <= 140 ? "Bình thường" : "Cần theo dõi",
            tone: toNumber(vital?.bloodSugar, 0) >= 70 && toNumber(vital?.bloodSugar, 0) <= 140
                ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
            icon: toNumber(vital?.bloodSugar, 0) >= 70 && toNumber(vital?.bloodSugar, 0) <= 140 ? "check_circle" : "warning",
        };

    const healthCards = [
        { label: "Huyết áp", value: vital ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}` : "—", unit: "mmHg", icon: "bloodtype", color: "from-red-500 to-rose-600", ok: !vital || vital.bloodPressureSystolic <= 130 },
        { label: "Nhịp tim", value: vital ? `${vital.heartRate}` : "—", unit: "bpm", icon: "cardiology", color: "from-pink-500 to-red-500", ok: true },
        { label: "BMI", value: vital ? toNumber(vital.bmi).toFixed(1) : "—", unit: "", icon: "monitor_weight", color: "from-blue-500 to-indigo-600", ok: !vital || (toNumber(vital.bmi) >= 18.5 && toNumber(vital.bmi) <= 25) },
        { label: "SpO2", value: vital ? `${vital.spo2 || "—"}` : "—", unit: "%", icon: "pulmonology", color: "from-cyan-500 to-teal-600", ok: true },
        { label: "Đường huyết", value: bloodSugarValue, unit: "mg/dL", icon: "water_drop", color: "from-amber-500 to-orange-500", ok: bloodSugarStatus.ok, statusLabel: bloodSugarStatus.label, statusTone: bloodSugarStatus.tone, statusIcon: bloodSugarStatus.icon },
        { label: "Nhiệt độ", value: vital ? toNumber(vital.temperature, 36.5).toFixed(1) : "—", unit: "°C", icon: "thermostat", color: "from-green-500 to-emerald-600", ok: true },
    ];
    const metricStatuses: Record<string, ReturnType<typeof createMetricStatus>> = {
        "Huyết áp": createMetricStatus(
            hasBloodPressure,
            toNumber(vital?.bloodPressureSystolic, 0) <= 130 && toNumber(vital?.bloodPressureDiastolic, 0) <= 85,
        ),
        "Nhịp tim": createMetricStatus(
            hasHeartRate,
            toNumber(vital?.heartRate, 0) >= 60 && toNumber(vital?.heartRate, 0) <= 100,
        ),
        BMI: createMetricStatus(
            hasBmi,
            toNumber(vital?.bmi, 0) >= 18.5 && toNumber(vital?.bmi, 0) < 25,
        ),
        SpO2: createMetricStatus(
            hasSpo2,
            toNumber(vital?.spo2, 0) >= 95,
        ),
        "Nhiệt độ": createMetricStatus(
            hasTemperature,
            toNumber(vital?.temperature, 0) >= 35.5 && toNumber(vital?.temperature, 0) <= 37.5,
        ),
    };
    const normalizedHealthCards = healthCards.map((card) => {
        const metricStatus = metricStatuses[card.label];
        if (!metricStatus) return card;

        return {
            ...card,
            value: metricStatus.label === "Chưa có dữ liệu" ? "—" : card.value,
            ok: metricStatus.ok,
            statusLabel: metricStatus.label,
            statusTone: metricStatus.tone,
            statusIcon: metricStatus.icon,
        };
    });
    const summaryCards = [
        { label: "Mức nguy cơ", value: translateRiskLevel(overview.summary?.risk_level), icon: "monitoring", tone: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
        { label: "Lượt khám", value: overview.summary?.total_encounters ?? "—", icon: "stethoscope", tone: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" },
        { label: "Bệnh đang theo dõi", value: overview.summary?.active_conditions_count ?? overview.activeConditions.length ?? 0, icon: "clinical_notes", tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
        { label: "Thuốc đang dùng", value: overview.summary?.active_medications_count ?? medications.filter((item) => item.status === "active").length, icon: "medication", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {normalizedHealthCards.map(c => (
                    <div key={c.label} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5 hover:shadow-lg hover:border-[#3C81C6]/20 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-lg`}>
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>{c.icon}</span>
                            </div>
                            <span className="text-xs font-semibold text-[#687582] uppercase tracking-wider">{c.label}</span>
                        </div>
                        <div className="flex items-end gap-1.5">
                            <span className="text-2xl font-bold text-[#121417] dark:text-white">{c.value}</span>
                            {c.unit && <span className="text-sm text-[#687582] mb-0.5">{c.unit}</span>}
                        </div>
                        <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.statusTone ?? (c.ok ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400")}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{c.statusIcon ?? (c.ok ? "check_circle" : "warning")}</span>
                            {c.statusLabel ?? (c.ok ? "Bình thường" : "Cần theo dõi")}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {summaryCards.map((card) => (
                    <div key={card.label} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.tone}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{card.icon}</span>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[#687582]">{card.label}</p>
                                <p className="text-lg font-bold text-[#121417] dark:text-white">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {(overview.tags.length > 0 || overview.alerts.length > 0 || overview.insurance) && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "20px" }}>notifications_active</span>Thẻ và cảnh báo hồ sơ
                        </h3>
                        {overview.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {overview.tags.map((tag, index) => {
                                    const tagObject = typeof tag === "object" && tag !== null ? tag as Record<string, any> : null;
                                    const label = typeof tag === "string"
                                        ? tag
                                        : tagObject?.name ?? tagObject?.code ?? `Tag ${index + 1}`;
                                    const key = typeof tag === "string"
                                        ? `${tag}_${index}`
                                        : tagObject?.tag_id ?? tagObject?.code ?? `${label}_${index}`;
                                    const tagColor = tagObject?.color_hex as string | undefined;

                                    return (
                                        <span
                                            key={key}
                                            className="px-3 py-1.5 rounded-full text-xs font-semibold border dark:bg-blue-500/10 dark:text-blue-300"
                                            style={tagColor
                                                ? {
                                                    color: tagColor,
                                                    borderColor: `${tagColor}33`,
                                                    backgroundColor: `${tagColor}14`,
                                                }
                                                : undefined}
                                        >
                                            {label}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                        {overview.alerts.length === 0 ? (
                            <p className="text-sm text-[#687582]">Hiện chưa có cảnh báo nổi bật từ hồ sơ EHR.</p>
                        ) : (
                            <div className="space-y-3">
                                {overview.alerts.slice(0, 4).map((alert, index) => (
                                    <div key={`${alert?.title ?? "alert"}_${index}`} className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/5 p-4">
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white">{cleanAlertTitle(alert?.title ?? alert?.name ?? alert?.risk_factor_name)}</p>
                                        <p className="text-xs text-[#687582] mt-1.5">{cleanAlertDescription(alert?.message ?? alert?.notes ?? alert?.description)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-green-500" style={{ fontSize: "20px" }}>shield</span>Bảo hiểm
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p className="text-[#121417] dark:text-white font-semibold">
                                {overview.insurance?.provider_name ?? overview.insurance?.insurance_provider ?? "Chưa có dữ liệu"}
                            </p>
                            <p className="text-[#687582]">Hiệu lực: {overview.summary?.has_active_insurance ? "Còn hiệu lực" : "Cần kiểm tra lại"}</p>
                            {overview.insurance?.end_date && (
                                <p className="text-[#687582]">Hạn sử dụng: {formatDisplayDate(overview.insurance?.end_date)}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-red-500" style={{ fontSize: "20px" }}>warning</span>Dị ứng
                    </h3>
                    {allergies.length === 0 ? (
                        <p className="text-xs text-[#687582]">Không có thông tin dị ứng</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {allergies.map(a => (
                                <span key={a.id} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 dark:border-red-500/20">{a.name}</span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-green-500" style={{ fontSize: "20px" }}>medication</span>Thuốc đang dùng
                    </h3>
                    {medications.filter(m => m.status === "active").length === 0 ? (
                        <p className="text-xs text-[#687582]">Không có thuốc đang dùng</p>
                    ) : (
                        <div className="space-y-2">
                            {medications.filter(m => m.status === "active").map(m => (
                                <div key={m.id} className="flex items-center gap-2 p-2 bg-[#f6f7f8] dark:bg-[#13191f] rounded-lg">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>pill</span>
                                    <div>
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white">{m.name}</p>
                                        <p className="text-xs text-[#687582]">{m.frequency}{m.route ? ` • ${m.route}` : ""}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>timeline</span>Hoạt động gần đây
                </h3>
                {recentTimeline.length === 0 ? (
                    <p className="text-xs text-[#687582] text-center py-4">Chưa có hoạt động nào</p>
                ) : (
                    <div className="space-y-3">
                        {recentTimeline.slice(0, 4).map(item => (
                            <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors">
                                <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{item.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{translateDynamicText(item.title)}</p>
                                    <p className="text-xs text-[#687582] truncate">{translateDynamicText(item.description)}</p>
                                </div>
                                <span className="text-xs text-[#687582] whitespace-nowrap">{formatDisplayDate(item.date)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TimelineTab({ items, summary, filter, onFilterChange }: { items: HealthTimelineItem[]; summary: any | null; filter: string; onFilterChange: (value: string) => void }) {
    const filterOptions = [
        { label: "Tất cả", value: "ALL" },
        { label: "Khám", value: "ENCOUNTER" },
        { label: "Xét nghiệm", value: "LAB_RESULT" },
        { label: "Đơn thuốc", value: "PRESCRIPTION" },
        { label: "Chẩn đoán", value: "DIAGNOSIS" },
    ];
    if (items.length === 0) return <EmptyState icon="timeline" message="Chưa có dữ liệu dòng thời gian" />;
    return (
        <div className="space-y-4">
            {summary && (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Tổng sự kiện</p>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{summary?.total_events ?? "—"}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Lần gần nhất</p>
                        <p className="text-base font-bold text-[#121417] dark:text-white">{formatDisplayDate(summary?.last_event_date)}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Xét nghiệm</p>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{summary?.events_by_type?.LAB_RESULT ?? summary?.events_by_type?.LAB_ORDER ?? 0}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Đơn thuốc</p>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{summary?.events_by_type?.PRESCRIPTION ?? 0}</p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-6">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
                    <h3 className="text-lg font-bold text-[#121417] dark:text-white">Dòng thời gian sức khỏe</h3>
                    <div className="flex gap-2 overflow-x-auto">
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onFilterChange(option.value)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors ${
                                    filter === option.value
                                        ? "bg-[#3C81C6] text-white border-[#3C81C6]"
                                        : "bg-[#f6f7f8] dark:bg-[#13191f] text-[#687582] border-[#e5e7eb] dark:border-[#2d353e]"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-[#e5e7eb] dark:bg-[#2d353e]" />
                    <div className="space-y-6">
                        {items.map(item => (
                            <div key={item.id} className="relative flex gap-4">
                                <div className={`relative z-10 w-9 h-9 rounded-full ${item.color} flex items-center justify-center flex-shrink-0 ring-4 ring-white dark:ring-[#1e242b]`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{item.icon}</span>
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="text-sm font-bold text-[#121417] dark:text-white">{translateDynamicText(item.title)}</h4>
                                            <p className="text-xs text-[#687582] mt-0.5">{translateDynamicText(item.description)}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                {item.eventType && <span className="px-2 py-1 rounded-full bg-[#f6f7f8] dark:bg-[#13191f] text-[10px] font-bold text-[#687582]">{translateTimelineType(item.eventType)}</span>}
                                                {item.encounterId && <span className="px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[10px] font-bold text-blue-700 dark:text-blue-300">Có liên kết lần khám</span>}
                                            </div>
                                            {item.doctorName && <p className="text-xs text-[#687582] mt-1">BS. {item.doctorName}{item.department && ` • ${item.department}`}</p>}
                                        </div>
                                        <span className="text-xs text-[#687582] whitespace-nowrap bg-[#f6f7f8] dark:bg-[#13191f] px-2 py-1 rounded-md">{formatDisplayDateTime(item.date)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MedicalHistoryTab({ items, allergies, riskFactors, specialConditions }: { items: MedicalHistoryItem[]; allergies: MedicalHistoryItem[]; riskFactors: MedicalHistoryItem[]; specialConditions: MedicalHistoryItem[] }) {
    if (items.length === 0 && allergies.length === 0 && riskFactors.length === 0 && specialConditions.length === 0) return <EmptyState icon="history_edu" message="Chưa có tiền sử bệnh" />;
    const cfg: Record<string, { label: string; icon: string; color: string }> = {
        chronic: { label: "Bệnh mãn tính", icon: "medical_information", color: "text-red-500 bg-red-50 dark:bg-red-500/10" },
        allergy: { label: "Dị ứng", icon: "warning", color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
        surgery: { label: "Phẫu thuật", icon: "surgical", color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
        family: { label: "Tiền sử gia đình", icon: "group", color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" },
        risk_factor: { label: "Yếu tố nguy cơ", icon: "report", color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10" },
        special_condition: { label: "Tình trạng đặc biệt", icon: "neurology", color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10" },
    };
    const grouped = items.reduce((acc, item) => { (acc[item.type] ||= []).push(item); return acc; }, {} as Record<string, MedicalHistoryItem[]>);
    if (riskFactors.length > 0) grouped.risk_factor = [...(grouped.risk_factor ?? []), ...riskFactors];
    if (specialConditions.length > 0) grouped.special_condition = [...(grouped.special_condition ?? []), ...specialConditions];

    return (
        <div className="space-y-4">
            {allergies.length > 0 && (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg text-amber-500 bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>warning</span>
                        </div>
                        Dị ứng
                        <span className="ml-auto text-xs bg-[#f6f7f8] dark:bg-[#13191f] text-[#687582] px-2 py-0.5 rounded-full">{allergies.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {allergies.map(item => (
                            <div key={item.id} className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/5 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-[#121417] dark:text-white">{item.name}</p>
                                        {item.details && <p className="text-xs text-[#687582] mt-1.5">{item.details}</p>}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {item.allergenType && <span className="px-2 py-1 rounded-full bg-white/70 dark:bg-[#13191f] text-[10px] font-bold text-[#687582]">{translateAllergenType(item.allergenType)}</span>}
                                            {item.severity && <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-500/10 text-[10px] font-bold text-red-700 dark:text-red-300">{translateSeverity(item.severity)}</span>}
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 text-[10px] font-bold rounded-full uppercase bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                        Cảnh báo
                                    </span>
                                </div>
                                {item.diagnosedDate && <p className="text-xs text-[#687582]/80 mt-3">Ghi nhận: {formatDisplayDateTime(item.diagnosedDate)}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {Object.entries(grouped).map(([type, group]) => {
                const c = cfg[type] || { label: type, icon: "info", color: "text-gray-500 bg-gray-50" };
                return (
                    <div key={type} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                        <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                            <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{c.icon}</span>
                            </div>
                            {c.label}
                            <span className="ml-auto text-xs bg-[#f6f7f8] dark:bg-[#13191f] text-[#687582] px-2 py-0.5 rounded-full">{group.length}</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.map(item => (
                                <div key={item.id} className="rounded-2xl border border-[#edf0f2] dark:border-[#2d353e] bg-[#fbfcfd] dark:bg-[#13191f] p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">{item.name}</p>
                                            {item.details && <p className="text-xs text-[#687582] mt-1.5 leading-5">{item.details}</p>}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {item.conditionCode && <span className="px-2 py-1 rounded-full bg-white dark:bg-[#1e242b] text-[10px] font-bold text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e]">{item.conditionCode}</span>}
                                                {item.relationship && <span className="px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-[10px] font-bold text-purple-700 dark:text-purple-300">{item.relationship}</span>}
                                                {item.severity && <span className="px-2 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-[10px] font-bold text-red-700 dark:text-red-300">{translateSeverity(item.severity)}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${item.status === "active" ? "bg-red-100 dark:bg-red-500/10 text-red-600" : item.status === "resolved" ? "bg-green-100 dark:bg-green-500/10 text-green-600" : "bg-blue-100 dark:bg-blue-500/10 text-blue-600"}`}>
                                                {translateHistoryStatus(item.status)}
                                            </span>
                                        </div>
                                    </div>
                                    {item.diagnosedDate && <p className="text-xs text-[#687582]/70 mt-3">Phát hiện: {formatDisplayDateTime(item.diagnosedDate)}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function LabResultsTab({ results, summary, abnormalIds }: { results: LabResult[]; summary: any | null; abnormalIds: string[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    if (results.length === 0) return <EmptyState icon="science" message="Chưa có kết quả xét nghiệm" />;
    return (
        <div className="space-y-4">
            {summary && (
                <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Tổng chỉ định</p>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{summary?.total_orders ?? "—"}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Đã có kết quả</p>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{summary?.total_with_results ?? "—"}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Chờ xử lý</p>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{summary?.total_pending ?? "—"}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Bất thường</p>
                        <p className="text-2xl font-bold text-red-600">{abnormalIds.length}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Gần nhất</p>
                        <p className="text-base font-bold text-[#121417] dark:text-white">{formatDisplayDate(summary?.latest_result_at)}</p>
                    </div>
                </div>
            )}
            {results.map(result => (
                <div key={result.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] overflow-hidden">
                    <button onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                        className="w-full flex items-center justify-between p-5 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f] transition-colors text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-500" style={{ fontSize: "22px" }}>science</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#121417] dark:text-white">{result.testName}</h4>
                                <div className="flex items-center gap-3 text-xs text-[#687582] mt-0.5">
                                    <span>{formatDisplayDateTime(result.date)}</span>
                                    {result.doctorName && <span>BS. {result.doctorName}</span>}
                                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-md font-medium">{translateLabCategory(result.category)}</span>
                                    {(result.isAbnormal || abnormalIds.includes(result.orderId ?? result.id)) && (
                                        <span className="px-2 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-md font-medium">Bất thường</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined text-[#687582] transition-transform ${expandedId === result.id ? "rotate-180" : ""}`} style={{ fontSize: "20px" }}>expand_more</span>
                    </button>
                    {expandedId === result.id && result.results.length > 0 && (
                        <div className="px-5 pb-5 border-t border-[#e5e7eb] dark:border-[#2d353e]">
                            <table className="w-full mt-4 text-sm">
                                <thead><tr className="text-xs font-semibold text-[#687582] uppercase">
                                    <th className="text-left py-2">Chỉ số</th><th className="text-center py-2">Kết quả</th><th className="text-center py-2">Đ.vị</th><th className="text-center py-2">Tham chiếu</th><th className="text-right py-2">Đánh giá</th>
                                </tr></thead>
                                <tbody>{result.results.map((r, i) => (
                                    <tr key={i} className="border-t border-[#e5e7eb]/50 dark:border-[#2d353e]/50">
                                        <td className="py-2.5 font-medium text-[#121417] dark:text-white">{r.name}</td>
                                        <td className={`py-2.5 text-center font-bold ${r.status === "normal" ? "text-green-600" : r.status === "low" ? "text-amber-600" : "text-red-600"}`}>{r.value}</td>
                                        <td className="py-2.5 text-xs text-[#687582] text-center">{r.unit}</td>
                                        <td className="py-2.5 text-xs text-[#687582] text-center">{r.reference}</td>
                                        <td className="py-2.5 text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "normal" ? "bg-green-100 text-green-700" : r.status === "low" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                                {r.status === "normal" ? "BT" : r.status === "low" ? "Thấp" : "Cao"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                            {result.attachments && result.attachments.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-bold uppercase text-[#687582] mb-2">Tệp đính kèm</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.attachments.map((attachment, index) => (
                                            <a
                                                key={`${attachment}_${index}`}
                                                href={attachment}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f] text-xs font-semibold text-[#3C81C6]"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>attach_file</span>
                                                Tệp {index + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function MedicationsTab({ medications, interactions, timeline }: { medications: Medication[]; interactions: any[]; timeline: any[] }) {
    const active = medications.filter(m => m.status === "active");
    const done = medications.filter(m => m.status !== "active");
    if (medications.length === 0 && interactions.length === 0 && timeline.length === 0) {
        return <EmptyState icon="medication" message="Chưa ghi nhận thuốc đang sử dụng hoặc lịch sử điều trị bằng thuốc" />;
    }
    return (
        <div className="space-y-6">
            {interactions.length > 0 && (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-amber-200 dark:border-amber-500/20 p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "20px" }}>warning</span>Cảnh báo tương tác và dị ứng thuốc
                    </h3>
                    <div className="space-y-3">
                        {interactions.slice(0, 4).map((interaction, index) => (
                            <div key={`${interaction?.message ?? "interaction"}_${index}`} className="rounded-xl bg-amber-50/70 dark:bg-amber-500/5 p-4">
                                <p className="text-sm font-semibold text-[#121417] dark:text-white">{translateDynamicText(interaction?.title ?? interaction?.pair ?? interaction?.drug_name ?? "Cảnh báo thuốc")}</p>
                                <p className="text-xs text-[#687582] mt-1.5">{translateDynamicText(interaction?.message ?? interaction?.description ?? interaction?.note ?? "Cần kiểm tra thêm với bác sĩ điều trị.")}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div>
                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-green-500" style={{ fontSize: "20px" }}>medication</span>Đang sử dụng ({active.length})
                </h3>
                {active.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d7dce1] dark:border-[#2d353e] bg-white dark:bg-[#1e242b] p-5">
                        <p className="text-sm font-semibold text-[#121417] dark:text-white">Hiện chưa ghi nhận thuốc đang sử dụng</p>
                        <p className="text-xs text-[#687582] mt-1.5">
                            Hồ sơ vẫn có {timeline.length} mốc điều trị liên quan đến thuốc hoặc kế hoạch điều trị trong dòng thời gian, nhưng hiện không có thuốc nào còn hiệu lực ở danh sách dùng hiện tại.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {active.map(m => (
                            <div key={m.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border-2 border-green-200 dark:border-green-500/20 p-5">
                                <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center"><span className="material-symbols-outlined text-green-600" style={{ fontSize: "22px" }}>pill</span></div>
                                <div>
                                        <h4 className="text-sm font-bold text-[#121417] dark:text-white">{m.name}</h4>
                                        <p className="text-xs text-green-700 dark:text-green-400 font-medium mt-0.5">{m.frequency}</p>
                                        <p className="text-xs text-[#687582] mt-1">Từ {formatDisplayDate(m.startDate)}{m.prescribedBy && ` • BS. ${m.prescribedBy}`}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {m.prescriptionCode && <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-500/10 text-[10px] font-bold text-green-700 dark:text-green-300">{m.prescriptionCode}</span>}
                                            {m.route && <span className="px-2 py-1 rounded-full bg-white dark:bg-[#13191f] text-[10px] font-bold text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e]">{m.route}</span>}
                                            {m.dispensingUnit && <span className="px-2 py-1 rounded-full bg-white dark:bg-[#13191f] text-[10px] font-bold text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e]">{m.dispensingUnit}</span>}
                                            {m.estimatedEndDate && <span className="px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[10px] font-bold text-blue-700 dark:text-blue-300">Đến {formatDisplayDate(m.estimatedEndDate)}</span>}
                                        </div>
                                        {m.notes && <p className="text-xs text-[#687582] mt-1 italic">{m.notes}</p>}
                                        {m.activeIngredients && <p className="text-xs text-[#687582] mt-1">Hoạt chất: {m.activeIngredients}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {done.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-[#687582] flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>history</span>Đã hoàn thành ({done.length})
                    </h3>
                    {done.map(m => (
                        <div key={m.id} className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4 opacity-70 flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>pill</span>
                            <div className="flex-1"><p className="text-sm font-semibold text-[#121417] dark:text-white">{m.name}</p><p className="text-xs text-[#687582]">{formatDisplayDate(m.startDate)}{m.endDate ? ` → ${formatDisplayDate(m.endDate)}` : ""}{m.prescribedBy ? ` • ${m.prescribedBy}` : ""}</p></div>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-[#687582]">Hoàn thành</span>
                        </div>
                    ))}
                </div>
            )}
            {timeline.length > 0 && (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>schedule</span>Diễn tiến điều trị thuốc
                    </h3>
                    <div className="space-y-3">
                        {timeline.slice(0, 4).map((item, index) => {
                            const presentation = getMedicationTimelinePresentation(item);

                            return (
                                <div key={item?.event_id ?? `${item?.reference_id ?? "med_timeline"}_${index}`} className="flex items-start justify-between gap-3 rounded-xl bg-[#f6f7f8] dark:bg-[#13191f] p-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">{presentation.title}</p>
                                            {presentation.code && (
                                                <span className="px-2 py-1 rounded-full bg-white dark:bg-[#1e242b] text-[10px] font-bold text-[#687582] border border-[#e5e7eb] dark:border-[#2d353e]">
                                                    {presentation.code}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#687582] mt-1">{presentation.subtitle}</p>
                                        <p className="text-[11px] text-[#687582] mt-2">{translateTimelineType(item?.event_type)}</p>
                                    </div>
                                    <span className="text-xs text-[#687582] whitespace-nowrap">{formatDisplayDate(item?.event_date ?? item?.prescribed_at ?? item?.created_at)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function VitalsTab({ vitals, summary, abnormal }: { vitals: VitalSign[]; summary: any | null; abnormal: any[] }) {
    if (vitals.length === 0) return <EmptyState icon="monitor_heart" message="Chưa có dữ liệu sinh hiệu" />;
    const sortedVitals = vitals
        .slice()
        .filter((item) => Number.isFinite(item.bloodPressureSystolic) && item.bloodPressureSystolic > 0 && Number.isFinite(item.bloodPressureDiastolic) && item.bloodPressureDiastolic > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-5);
    const maxPressure = Math.max(
        160,
        ...sortedVitals.flatMap((v) => [v.bloodPressureSystolic || 0, v.bloodPressureDiastolic || 0]),
    );

    return (
        <div className="space-y-6">
            {summary && (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">BMI hiện tại</p>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{toNumber(summary?.current_bmi).toFixed(1)}</p>
                        <p className="text-xs text-[#687582] mt-1">{translateDynamicText(summary?.bmi_classification) || "Chưa phân loại"}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">HA trung bình</p>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">
                            {summary?.avg_bp_systolic && summary?.avg_bp_diastolic
                                ? `${summary.avg_bp_systolic}/${summary.avg_bp_diastolic}`
                                : "—"}
                        </p>
                        <p className="text-xs text-[#687582] mt-1">Tổng {summary?.total_measurements ?? vitals.length} lần đo</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Xu hướng cân nặng</p>
                        <p className="text-2xl font-bold text-[#121417] dark:text-white">{summary?.weight_trend === "UNKNOWN" ? "Chưa xác định" : (translateWeightTrend(summary?.weight_trend) || "—")}</p>
                        <p className="text-xs text-[#687582] mt-1">Cập nhật {formatDisplayDate(summary?.latest_measurement_at)}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-4">
                        <p className="text-xs text-[#687582] uppercase">Bất thường</p>
                        <p className="text-2xl font-bold text-red-600">{abnormal.length}</p>
                        <p className="text-xs text-[#687582] mt-1">Cần theo dõi thêm</p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-6">
                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-5">
                    <span className="material-symbols-outlined text-red-500" style={{ fontSize: "20px" }}>bloodtype</span>Biểu đồ huyết áp
                </h3>
                <div className="flex items-end gap-3 h-40">
                    {sortedVitals.map(v => (
                        <div key={v.id} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="flex gap-1 items-end w-full justify-center" style={{ height: "120px" }}>
                                <div
                                    className="w-3 bg-gradient-to-t from-red-500 to-rose-400 rounded-t-md"
                                    style={{ height: `${Math.max((v.bloodPressureSystolic / maxPressure) * 100, v.bloodPressureSystolic ? 8 : 0)}%` }}
                                    title={`Tâm thu: ${v.bloodPressureSystolic}`}
                                />
                                <div
                                    className="w-3 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-md"
                                    style={{ height: `${Math.max((v.bloodPressureDiastolic / maxPressure) * 100, v.bloodPressureDiastolic ? 8 : 0)}%` }}
                                    title={`Tâm trương: ${v.bloodPressureDiastolic}`}
                                />
                            </div>
                            <span className="text-[10px] text-[#687582]">{String(v.date).slice(5, 10) || "—"}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs text-[#687582]">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gradient-to-r from-red-500 to-rose-400" />Tâm thu</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gradient-to-r from-blue-500 to-cyan-400" />Tâm trương</span>
                </div>
            </div>

            {abnormal.length > 0 && (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-amber-200 dark:border-amber-500/20 p-5">
                    <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "20px" }}>warning</span>Cảnh báo chỉ số bất thường
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {abnormal.slice(0, 4).map((item, index) => (
                            <div key={`${item?.metric_type ?? "abnormal"}_${index}`} className="rounded-xl bg-amber-50/70 dark:bg-amber-500/5 p-4">
                                <p className="text-sm font-semibold text-[#121417] dark:text-white">{item?.metric_label ?? item?.metric_type ?? "Chỉ số bất thường"}</p>
                                <p className="text-xs text-[#687582] mt-1.5">{item?.message ?? item?.description ?? `${item?.value ?? "—"} ${item?.unit ?? ""}`}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#e5e7eb] dark:border-[#2d353e] p-6">
                <h3 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>table_chart</span>Lịch sử đo chi tiết
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-xs font-semibold text-[#687582] uppercase border-b border-[#e5e7eb] dark:border-[#2d353e]">
                            <th className="text-left py-3">Ngày</th><th className="text-center py-3">HA</th><th className="text-center py-3">Nhịp tim</th><th className="text-center py-3">SpO2</th><th className="text-center py-3">Cân nặng</th><th className="text-center py-3">BMI</th>
                        </tr></thead>
                        <tbody>{vitals.map(v => (
                            <tr key={v.id} className="border-b border-[#e5e7eb]/50 dark:border-[#2d353e]/50 hover:bg-[#f6f7f8] dark:hover:bg-[#13191f]">
                                <td className="py-3 font-medium text-[#121417] dark:text-white">{formatDisplayDateTime(v.date)}</td>
                                <td className={`py-3 text-center ${v.bloodPressureSystolic > 130 ? "text-red-600 font-bold" : "text-[#121417] dark:text-white"}`}>{Number.isFinite(v.bloodPressureSystolic) && v.bloodPressureSystolic > 0 && Number.isFinite(v.bloodPressureDiastolic) && v.bloodPressureDiastolic > 0 ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : "—"}</td>
                                <td className="py-3 text-center text-[#121417] dark:text-white">{Number.isFinite(v.heartRate) && v.heartRate > 0 ? v.heartRate : "—"}</td>
                                <td className="py-3 text-center text-[#121417] dark:text-white">{Number.isFinite(v.spo2 ?? Number.NaN) && (v.spo2 ?? 0) > 0 ? `${v.spo2}%` : "—"}</td>
                                <td className="py-3 text-center text-[#121417] dark:text-white">{Number.isFinite(v.weight) && v.weight > 0 ? `${v.weight}kg` : "—"}</td>
                                <td className="py-3 text-center text-[#121417] dark:text-white">{Number.isFinite(v.bmi) && v.bmi > 0 ? toNumber(v.bmi).toFixed(1) : "—"}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
