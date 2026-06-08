'use client';

import { useEffect, useRef } from 'react';
import { useAICopilot } from '@/contexts/AICopilotContext';
import { useAIPreferences } from '@/hooks/useAIPreferences';
import { aiService } from '@/services/aiService';

// ============================================
// Debounce helper (internal)
// ============================================

function useDebouncedEffect(fn: () => void, deps: unknown[], delay: number) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(fn, delay);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

// ============================================
// Urgent keywords for receptionist triage
// ============================================

const URGENT_KEYWORDS = ['đau ngực', 'khó thở', 'co giật', 'bất tỉnh', 'xuất huyết'];

// ============================================
// useAIAmbientEngine
// ============================================

/**
 * Background hook that watches formData changes (debounced 1500ms)
 * and runs role-specific AI checks, pushing alerts to the copilot bus.
 * Silent fail on all API errors — never blocks user workflow.
 */
export function useAIAmbientEngine() {
    const { pushAlert, setEngineStatus, pageContext, role } = useAICopilot();
    const { preferences } = useAIPreferences();

    const formData = pageContext?.formData;

    useDebouncedEffect(() => {
        // Only run if AI features are enabled
        if (!preferences.enableAutoSymptomAnalysis && !preferences.enableDrugInteractionCheck) return;
        if (!formData) return;

        // No ambient checks for patient/admin
        if (role === 'patient' || role === 'admin') return;

        const run = async () => {
            setEngineStatus('analyzing');

            try {
                if (role === 'doctor') {
                    await runDoctorChecks(formData, pushAlert);
                } else if (role === 'pharmacist') {
                    await runPharmacistChecks(formData, pushAlert);
                } else if (role === 'receptionist') {
                    runReceptionistChecks(formData, pushAlert);
                }
                setEngineStatus('ready');
            } catch {
                // Silent fail
                setEngineStatus('idle');
            }
        };

        run();
    }, [formData, role, preferences.enableAutoSymptomAnalysis, preferences.enableDrugInteractionCheck], 1500);
}

// ============================================
// Doctor checks
// ============================================

async function runDoctorChecks(
    formData: Record<string, unknown>,
    pushAlert: ReturnType<typeof useAICopilot>['pushAlert']
) {
    // --- Vital signs check ---
    const systolic = parseFloat(String(formData.systolic ?? formData.bpSystolic ?? ''));
    const diastolic = parseFloat(String(formData.diastolic ?? formData.bpDiastolic ?? ''));
    const spo2 = parseFloat(String(formData.spo2 ?? formData.SpO2 ?? ''));
    const temp = parseFloat(String(formData.temperature ?? formData.temp ?? ''));

    if (!isNaN(systolic) && !isNaN(diastolic)) {
        if (systolic >= 180 || diastolic >= 120) {
            pushAlert({
                severity: 'critical',
                message: `Huyết áp nguy hiểm: ${systolic}/${diastolic} mmHg — Cần xử lý ngay!`,
                icon: 'monitor_heart',
                sourceField: 'blood_pressure',
            });
        } else if (systolic >= 140 || diastolic >= 90) {
            pushAlert({
                severity: 'warning',
                message: `Huyết áp cao: ${systolic}/${diastolic} mmHg — Theo dõi sát.`,
                icon: 'monitor_heart',
                sourceField: 'blood_pressure',
            });
        }
    }

    if (!isNaN(spo2) && spo2 < 92) {
        pushAlert({
            severity: 'critical',
            message: `SpO2 thấp nguy hiểm: ${spo2}% — Cần can thiệp oxy ngay!`,
            icon: 'pulmonology',
            sourceField: 'spo2',
        });
    }

    if (!isNaN(temp) && temp >= 39) {
        pushAlert({
            severity: 'warning',
            message: `Sốt cao: ${temp}°C — Cần theo dõi và xử lý hạ sốt.`,
            icon: 'thermostat',
            sourceField: 'temperature',
        });
    }

    // --- Symptom analysis ---
    const symptoms = String(formData.symptoms ?? formData.chiefComplaint ?? '');
    if (symptoms.length > 20) {
        try {
            const res = await aiService.getDiagnosis({
                symptoms,
                vitals: formData,
            });
            const data = ((res?.data as any)?.data ?? res?.data) as Record<string, unknown> | null | undefined;
            if (data) {
                // Try to extract top diagnosis from various response shapes
                const suggestions = (data.suggestions as Array<Record<string, unknown>> | undefined)
                    ?? (data.diagnoses as Array<Record<string, unknown>> | undefined)
                    ?? [];
                const top = suggestions[0];
                if (top) {
                    const diagName = String(top.icdDescription ?? top.content ?? top.name ?? '');
                    const icdCode = String(top.icdCode ?? '');
                    const displayName = icdCode ? `${icdCode} – ${diagName}` : diagName;
                    if (displayName.trim()) {
                        pushAlert({
                            severity: 'info',
                            message: `AI gợi ý chẩn đoán: ${displayName}`,
                            icon: 'diagnosis',
                            sourceField: 'symptoms_diagnosis',
                            autoFillPayload: {
                                diagnosis: diagName,
                                icdCode: top.icdCode,
                                suggestedLabs: top.suggestedLabs,
                            },
                        });
                    }
                }
            }
        } catch {
            // Silent fail
        }
    }
}

// ============================================
// Pharmacist checks
// ============================================

async function runPharmacistChecks(
    formData: Record<string, unknown>,
    pushAlert: ReturnType<typeof useAICopilot>['pushAlert']
) {
    const drugs = formData.drugs as Array<{ name: string; dosage: string }> | undefined;
    if (!Array.isArray(drugs) || drugs.length < 2) return;

    try {
        const res = await aiService.checkDrugInteraction({
            drugs,
            allergies: (formData.allergies as string[]) ?? [],
            patientProfile: formData.patientProfile as Record<string, unknown> | undefined,
        });
        const data = ((res?.data as any)?.data ?? res?.data) as Record<string, unknown> | null | undefined;
        if (data) {
            const interactions = (data.interactions as Array<Record<string, unknown>> | undefined) ?? [];
            const serious = interactions.filter(
                i => i.severity === 'serious' || i.severity === 'contraindicated'
            );
            if (serious.length > 0) {
                const first = serious[0];
                pushAlert({
                    severity: 'critical',
                    message: `Tương tác thuốc nghiêm trọng: ${first.drugA ?? ''} + ${first.drugB ?? ''} — ${first.detail ?? 'Xem xét lại đơn thuốc!'}`,
                    icon: 'medication_liquid',
                    sourceField: 'drug_interaction',
                });
            }
        }
    } catch {
        // Silent fail
    }
}

// ============================================
// Receptionist checks (sync — no API calls)
// ============================================

function runReceptionistChecks(
    formData: Record<string, unknown>,
    pushAlert: ReturnType<typeof useAICopilot>['pushAlert']
) {
    const reason = String(formData.reason ?? formData.visitReason ?? '').toLowerCase();
    if (!reason) return;

    const matched = URGENT_KEYWORDS.find(kw => reason.includes(kw));
    if (matched) {
        pushAlert({
            severity: 'critical',
            message: `Cảnh báo triage: Lý do khám có dấu hiệu khẩn cấp ("${matched}") — Ưu tiên xử lý ngay!`,
            icon: 'emergency',
            sourceField: 'triage_reason',
        });
    }
}
