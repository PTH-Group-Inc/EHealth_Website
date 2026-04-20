"use client";

/**
 * VitalCard — mini card sinh hiệu (BP, HR, temp, SpO2, BMI, ...).
 * Có status color dựa trên range bình thường.
 */

export type VitalKind = "bp" | "heartRate" | "temperature" | "spo2" | "bmi" | "respRate" | "weight" | "height";

const VITAL_CONFIG: Record<VitalKind, { label: string; icon: string; unit: string; color: string; normal: [number, number]; }> = {
    bp: { label: "Huyết áp", icon: "bloodtype", unit: "mmHg", color: "text-red-500", normal: [90, 140] },
    heartRate: { label: "Nhịp tim", icon: "monitor_heart", unit: "bpm", color: "text-pink-500", normal: [60, 100] },
    temperature: { label: "Nhiệt độ", icon: "thermostat", unit: "°C", color: "text-orange-500", normal: [36.1, 37.5] },
    spo2: { label: "SpO₂", icon: "pulmonology", unit: "%", color: "text-blue-500", normal: [95, 100] },
    bmi: { label: "BMI", icon: "monitor_weight", unit: "", color: "text-violet-500", normal: [18.5, 24.9] },
    respRate: { label: "Nhịp thở", icon: "pulmonology", unit: "/phút", color: "text-teal-500", normal: [12, 20] },
    weight: { label: "Cân nặng", icon: "fitness_center", unit: "kg", color: "text-indigo-500", normal: [0, 999] },
    height: { label: "Chiều cao", icon: "height", unit: "cm", color: "text-violet-400", normal: [0, 300] },
};

export interface VitalCardProps {
    kind: VitalKind;
    value: number | string | null | undefined;
    secondary?: number | string;        // cho BP (diastolic)
    measuredAt?: string;
    trend?: "up" | "down" | "flat";
    compact?: boolean;
    overrideLabel?: string;
}

function evaluateStatus(kind: VitalKind, value: number, secondary?: number): "ok" | "low" | "high" | "unknown" {
    const [min, max] = VITAL_CONFIG[kind].normal;
    if (kind === "bp" && secondary !== undefined) {
        if (value > 140 || secondary > 90) return "high";
        if (value < 90 || secondary < 60) return "low";
        return "ok";
    }
    if (value < min) return "low";
    if (value > max) return "high";
    return "ok";
}

export function VitalCard({ kind, value, secondary, measuredAt, trend, compact, overrideLabel }: VitalCardProps) {
    const cfg = VITAL_CONFIG[kind];
    const num = typeof value === "number" ? value : parseFloat(String(value ?? ""));
    const isKnown = Number.isFinite(num);
    const status = isKnown ? evaluateStatus(kind, num, typeof secondary === "number" ? secondary : undefined) : "unknown";

    const statusClass = status === "high"
        ? "text-red-600 dark:text-red-400"
        : status === "low"
            ? "text-amber-600 dark:text-amber-400"
            : status === "ok"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-400 dark:text-gray-500";

    const statusLabel = status === "high" ? "Cao" : status === "low" ? "Thấp" : status === "ok" ? "Bình thường" : "";

    const displayValue = isKnown
        ? kind === "bp" && secondary !== undefined
            ? `${value}/${secondary}`
            : typeof value === "number" && Number.isInteger(value)
                ? value
                : (isKnown ? num.toFixed(1) : "—")
        : "—";

    return (
        <div className={`bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm ${compact ? "p-3" : "p-4"} hover:shadow-md hover:border-[#3C81C6]/40 transition-all`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#687582] dark:text-gray-400 uppercase tracking-wider">
                    {overrideLabel ?? cfg.label}
                </span>
                <span className={`material-symbols-outlined ${cfg.color}`} style={{ fontSize: compact ? "18px" : "20px" }}>
                    {cfg.icon}
                </span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`font-extrabold ${compact ? "text-xl" : "text-2xl"} text-[#121417] dark:text-white tabular-nums`}>
                    {displayValue}
                </span>
                {cfg.unit && <span className="text-xs text-[#687582] dark:text-gray-500">{cfg.unit}</span>}
                {trend && (
                    <span className={`material-symbols-outlined ml-auto ${statusClass}`} style={{ fontSize: "16px" }}>
                        {trend === "up" ? "trending_up" : trend === "down" ? "trending_down" : "trending_flat"}
                    </span>
                )}
            </div>
            {statusLabel && (
                <div className="mt-1.5 flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${status === "high" ? "bg-red-500" : status === "low" ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <span className={`text-[10px] font-bold ${statusClass}`}>{statusLabel}</span>
                    {measuredAt && (
                        <span className="text-[10px] text-[#687582] dark:text-gray-500 ml-auto">
                            {new Date(measuredAt).toLocaleDateString("vi-VN")}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default VitalCard;
