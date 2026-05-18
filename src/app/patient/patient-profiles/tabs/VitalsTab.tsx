import React, { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { EHR_ENDPOINTS, VITAL_SIGNS_ENDPOINTS } from "@/api/endpoints";
import { extractErrorMessage } from "@/api/response";
import Modal from "@/components/common/Modal";
import { useToast } from "@/contexts/ToastContext";
import { type PatientProfile } from "@/types/patient-profile";

interface TabProps {
    profile: PatientProfile;
}

type MetricOption = {
    code: string;
    name: string;
    unit: string;
    icon: string;
};

const METRIC_OPTIONS: MetricOption[] = [
    { code: "BLOOD_PRESSURE", name: "Huyết áp", unit: "mmHg", icon: "blood_pressure" },
    { code: "HEART_RATE", name: "Nhịp tim", unit: "bpm", icon: "favorite" },
    { code: "TEMPERATURE", name: "Nhiệt độ", unit: "°C", icon: "device_thermostat" },
    { code: "SPO2", name: "SpO2", unit: "%", icon: "spo2" },
    { code: "WEIGHT", name: "Cân nặng", unit: "kg", icon: "monitor_weight" },
    { code: "HEIGHT", name: "Chiều cao", unit: "cm", icon: "height" },
    { code: "BLOOD_SUGAR", name: "Đường huyết", unit: "mg/dL", icon: "bloodtype" },
];

function getInitialMeasuredAt() {
    const current = new Date();
    current.setMinutes(current.getMinutes() - current.getTimezoneOffset());
    return current.toISOString().slice(0, 16);
}

function parseMetricValue(metric: any) {
    try {
        return typeof metric?.metric_value === "string" ? JSON.parse(metric.metric_value) : metric?.metric_value;
    } catch {
        return metric?.metric_value;
    }
}

export default function VitalsTab({ profile }: TabProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [latestVitals, setLatestVitals] = useState<Record<string, any>>({});
    const [metricCode, setMetricCode] = useState("BLOOD_PRESSURE");
    const [metricValue1, setMetricValue1] = useState("");
    const [metricValue2, setMetricValue2] = useState("");
    const [measuredAt, setMeasuredAt] = useState(getInitialMeasuredAt);
    const [sourceType, setSourceType] = useState("DEVICE");
    const [deviceInfo, setDeviceInfo] = useState("");

    const activeMetric = useMemo(
        () => METRIC_OPTIONS.find((item) => item.code === metricCode) || METRIC_OPTIONS[0],
        [metricCode],
    );

    const loadVitals = useCallback(async () => {
        if (!profile.id) return;

        try {
            setLoading(true);

            const [latestResponse, metricsResponse] = await Promise.all([
                axiosClient.get(EHR_ENDPOINTS.VITALS_LATEST(profile.id)).catch(() => ({ data: { data: {} } })),
                axiosClient.get(VITAL_SIGNS_ENDPOINTS.HEALTH_METRICS(profile.id), { params: { limit: 50 } }).catch(() => ({ data: { data: [] } })),
            ]);

            const latest = { ...(latestResponse.data?.data || latestResponse.data || {}) };
            const metrics = Array.isArray(metricsResponse.data?.data) ? metricsResponse.data.data : [];
            const newestMetrics: Record<string, any> = {};

            metrics.forEach((metric: any) => {
                const code = metric.metric_code;
                if (!code) return;

                if (!newestMetrics[code] || new Date(metric.measured_at).getTime() > new Date(newestMetrics[code].measured_at).getTime()) {
                    newestMetrics[code] = metric;
                }
            });

            const latestCreatedAt = latest.created_at ? new Date(latest.created_at) : new Date(0);

            const bloodPressure = newestMetrics.BLOOD_PRESSURE;
            if (bloodPressure && new Date(bloodPressure.measured_at) >= latestCreatedAt) {
                const value = parseMetricValue(bloodPressure) || {};
                latest.blood_pressure_systolic = value.systolic;
                latest.blood_pressure_diastolic = value.diastolic;
            }

            const metricMap: Array<[string, string]> = [
                ["HEART_RATE", "pulse"],
                ["TEMPERATURE", "temperature"],
                ["SPO2", "spo2"],
                ["WEIGHT", "weight"],
                ["HEIGHT", "height"],
                ["BLOOD_SUGAR", "blood_sugar"],
            ];

            metricMap.forEach(([metricKey, targetKey]) => {
                const metric = newestMetrics[metricKey];
                if (!metric || new Date(metric.measured_at) < latestCreatedAt) return;
                const value = parseMetricValue(metric);
                latest[targetKey] = value?.value ?? value;
            });

            setLatestVitals(latest);
        } catch {
            showToast("Không thể tải chỉ số sinh tồn.", "error");
        } finally {
            setLoading(false);
        }
    }, [profile.id, showToast]);

    useEffect(() => {
        loadVitals();
    }, [loadVitals]);

    const resetForm = () => {
        setMetricCode("BLOOD_PRESSURE");
        setMetricValue1("");
        setMetricValue2("");
        setMeasuredAt(getInitialMeasuredAt());
        setSourceType("DEVICE");
        setDeviceInfo("");
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleMetricChange = (value: string) => {
        setMetricCode(value);
        setMetricValue1("");
        setMetricValue2("");
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!profile.id) return;

        try {
            setSubmitting(true);

            const payload = {
                metric_code: metricCode,
                metric_name: activeMetric.name,
                metric_value:
                    metricCode === "BLOOD_PRESSURE"
                        ? {
                            systolic: Number(metricValue1),
                            diastolic: Number(metricValue2),
                        }
                        : Number(metricValue1),
                unit: activeMetric.unit,
                measured_at: new Date(measuredAt).toISOString(),
                source_type: sourceType,
                device_info: deviceInfo.trim() || undefined,
            };

            await axiosClient.post(EHR_ENDPOINTS.ADD_HEALTH_METRIC(profile.id), payload);
            showToast("Đã lưu chỉ số sinh tồn.", "success");

            closeModal();
            await loadVitals();
        } catch (error) {
            showToast(extractErrorMessage(error), "error");
        } finally {
            setSubmitting(false);
        }
    };

    const cards = [
        { icon: "monitor_weight", title: "Cân nặng", value: latestVitals.weight || "--", unit: "kg" },
        { icon: "height", title: "Chiều cao", value: latestVitals.height || "--", unit: "cm" },
        { icon: "favorite", title: "Nhịp tim", value: latestVitals.pulse || "--", unit: "bpm" },
        {
            icon: "blood_pressure",
            title: "Huyết áp",
            value: latestVitals.blood_pressure_systolic ? `${latestVitals.blood_pressure_systolic}/${latestVitals.blood_pressure_diastolic}` : "--/--",
            unit: "mmHg",
        },
        { icon: "device_thermostat", title: "Nhiệt độ", value: latestVitals.temperature || "--", unit: "°C" },
        { icon: "spo2", title: "SpO2", value: latestVitals.spo2 || "--", unit: "%" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#111821] lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Chỉ số sinh tồn</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Ghi nhận nhanh huyết áp, nhiệt độ, nhịp tim và các chỉ số theo dõi thường xuyên của bệnh nhân.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3C81C6] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2b6cb0]"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                    Ghi nhận chỉ số
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3C81C6] border-t-transparent"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {cards.map((card) => (
                            <VitalCard key={card.title} {...card} />
                        ))}
                    </div>

                    <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#111821]">
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white">Lưu ý hiển thị</h4>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Hệ thống ưu tiên chỉ số đo gần nhất theo từng loại. Với huyết áp, hai giá trị tâm thu và tâm trương luôn được lưu cùng nhau để tránh lệch số liệu.
                        </p>
                    </div>
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Ghi nhận chỉ số sinh tồn"
                size="lg"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#2d353e] dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Hủy
                        </button>
                        <button
                            form="vitals-form"
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#3C81C6] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2b6cb0] disabled:opacity-60"
                        >
                            {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
                            Lưu chỉ số
                        </button>
                    </>
                }
            >
                <form id="vitals-form" onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Loại chỉ số <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={metricCode}
                            onChange={(event) => handleMetricChange(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                        >
                            {METRIC_OPTIONS.map((metric) => (
                                <option key={metric.code} value={metric.code}>
                                    {metric.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {metricCode === "BLOOD_PRESSURE" ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Tâm thu" required hint="Ví dụ: 120">
                                <input
                                    type="number"
                                    required
                                    value={metricValue1}
                                    onChange={(event) => setMetricValue1(event.target.value)}
                                    placeholder="120"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                                />
                            </Field>
                            <Field label="Tâm trương" required hint="Ví dụ: 80">
                                <input
                                    type="number"
                                    required
                                    value={metricValue2}
                                    onChange={(event) => setMetricValue2(event.target.value)}
                                    placeholder="80"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                                />
                            </Field>
                        </div>
                    ) : (
                        <Field
                            label={`Giá trị (${activeMetric.unit})`}
                            required
                            hint={`Ví dụ: ${metricCode === "HEART_RATE" ? "72" : metricCode === "TEMPERATURE" ? "36.8" : "98"}`}
                        >
                            <input
                                type="number"
                                step="any"
                                required
                                value={metricValue1}
                                onChange={(event) => setMetricValue1(event.target.value)}
                                placeholder="Nhập giá trị đo"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                            />
                        </Field>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
                        <Field label="Thời gian đo" required>
                            <input
                                type="datetime-local"
                                required
                                value={measuredAt}
                                onChange={(event) => setMeasuredAt(event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                            />
                        </Field>

                        <Field label="Nguồn dữ liệu">
                            <select
                                value={sourceType}
                                onChange={(event) => setSourceType(event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                            >
                                <option value="DEVICE">Thiết bị đo</option>
                                <option value="CLINIC">Khám lâm sàng</option>
                                <option value="SELF_REPORTED">Bệnh nhân tự khai báo</option>
                            </select>
                        </Field>
                    </div>

                    <Field label="Thiết bị / ghi chú">
                        <input
                            value={deviceInfo}
                            onChange={(event) => setDeviceInfo(event.target.value)}
                            placeholder="Ví dụ: Máy đo Omron tại nhà"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#3C81C6] focus:ring-4 focus:ring-[#3C81C6]/10 dark:border-[#2d353e] dark:bg-[#0f141b] dark:text-white"
                        />
                    </Field>
                </form>
            </Modal>
        </div>
    );
}

function VitalCard({ icon, title, value, unit }: { icon: string; title: string; value: string; unit: string }) {
    return (
        <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#2d353e] dark:bg-[#111821]">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]">{icon}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
            </div>
            <div className="mt-4 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
                <span className="pb-1 text-sm font-medium text-slate-400">{unit}</span>
            </div>
        </div>
    );
}

function Field({
    label,
    required = false,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
                {hint && <span className="text-xs text-slate-400">{hint}</span>}
            </div>
            {children}
        </div>
    );
}
