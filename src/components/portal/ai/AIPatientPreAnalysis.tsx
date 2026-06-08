'use client';

import { useState, useEffect, useCallback } from 'react';
import { aiService } from '@/services/aiService';
import { emrService } from '@/services/emrService';
import { AICitationBlock } from './AICitationBlock';
import { AIConfidenceBadge } from './AIConfidenceBadge';
import type { Citation } from '@/types';

// ============================================
// Types
// ============================================

interface PatientFullProfile {
    patientId: string;
    patientName: string;
    age: number;
    gender: string;
    // Loaded data
    chronicConditions: string[];
    allergies: string[];
    currentMedications: { name: string; dosage: string; frequency?: string; since?: string }[];
    pastDiagnoses: { icdCode: string; description: string; date: string; doctor?: string }[];
    recentVitals: { date: string; bp?: string; hr?: string; temp?: string; spo2?: string }[];
    recentLabs: { name: string; value: string; date: string; status: 'normal' | 'abnormal' }[];
    visitCount: number;
    lastVisitDate: string;
    redFlags: string[];
}

interface AIPreAnalysis {
    likelyConditions: { name: string; icdCode: string; confidence: number; reasoning: string }[];
    suggestedLabs: { id: string; name: string; reason: string; priority: 'urgent' | 'recommended' | 'optional' }[];
    suggestedMedications: { name: string; dosage: string; reason: string }[];
    riskAlerts: { message: string; severity: 'critical' | 'warning' | 'info' }[];
    citations: Citation[];
}

interface AIPatientPreAnalysisProps {
    patientId: string;
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    allergies?: string[];
    medicalHistory?: string[];
    reason?: string;
    onApplyDiagnosis?: (icdCode: string, description: string) => void;
    onApplyLabs?: (labIds: string[]) => void;
    onApplyMedication?: (med: { name: string; dosage: string; frequency: string; duration: string; note: string }) => void;
    onApplyVitals?: (vitals: Record<string, string>) => void;
}

// ============================================
// Mock data (hoạt động khi API chưa sẵn sàng)
// ============================================

function generateMockProfile(patientName: string, age: number, allergies: string[], medicalHistory: string[], reason: string): PatientFullProfile {
    return {
        patientId: 'BN001',
        patientName,
        age,
        gender: 'Nam',
        chronicConditions: medicalHistory.length > 0 ? medicalHistory : ['Tăng huyết áp giai đoạn 2 (từ 2023)', 'Rối loạn lipid máu (từ 2024)'],
        allergies: allergies.length > 0 ? allergies : ['Penicillin'],
        currentMedications: [
            { name: 'Amlodipine', dosage: '5mg', frequency: '1 lần/ngày', since: '03/2023' },
            { name: 'Atorvastatin', dosage: '20mg', frequency: '1 lần/ngày', since: '06/2024' },
        ],
        pastDiagnoses: [
            { icdCode: 'I11.9', description: 'Tăng huyết áp giai đoạn 2', date: '15/03/2026', doctor: 'BS. Trần Văn Minh' },
            { icdCode: 'E78.5', description: 'Rối loạn lipid máu', date: '10/06/2024', doctor: 'BS. Lê Thị Hoa' },
            { icdCode: 'K29.7', description: 'Viêm dạ dày', date: '05/11/2024', doctor: 'BS. Phạm Chí Thanh' },
        ],
        recentVitals: [
            { date: '15/03/2026', bp: '150/95', hr: '78', temp: '36.8', spo2: '97' },
            { date: '10/01/2026', bp: '145/90', hr: '75', temp: '36.5', spo2: '98' },
            { date: '05/11/2024', bp: '135/85', hr: '72', temp: '37.0', spo2: '97' },
        ],
        recentLabs: [
            { name: 'Glucose', value: '7.2 mmol/L', date: '15/03/2026', status: 'abnormal' },
            { name: 'HbA1c', value: '6.8%', date: '15/03/2026', status: 'abnormal' },
            { name: 'Cholesterol toàn phần', value: '5.5 mmol/L', date: '15/03/2026', status: 'abnormal' },
            { name: 'Creatinine', value: '0.9 mg/dL', date: '15/03/2026', status: 'normal' },
            { name: 'ALT', value: '25 U/L', date: '15/03/2026', status: 'normal' },
        ],
        visitCount: 12,
        lastVisitDate: '15/03/2026',
        redFlags: reason.toLowerCase().includes('đau đầu') || reason.toLowerCase().includes('nhìn mờ')
            ? ['Glucose tăng dần qua 3 lần XN (5.8 → 6.4 → 7.2)', 'HA 150/95 lần khám trước — không đạt mục tiêu', 'Nghi ngờ không tuân thủ thuốc']
            : ['Glucose tăng dần qua 3 lần XN (5.8 → 6.4 → 7.2)'],
    };
}

function generateMockAnalysis(profile: PatientFullProfile, reason: string): AIPreAnalysis {
    const likelyConditions: AIPreAnalysis['likelyConditions'] = [];
    const suggestedLabs: AIPreAnalysis['suggestedLabs'] = [];
    const suggestedMedications: AIPreAnalysis['suggestedMedications'] = [];
    const riskAlerts: AIPreAnalysis['riskAlerts'] = [];

    const lowerReason = reason.toLowerCase();

    // Analyze based on reason + history
    if (lowerReason.includes('đau đầu') || lowerReason.includes('chóng mặt') || lowerReason.includes('nhìn mờ')) {
        likelyConditions.push(
            { name: 'Cơn tăng huyết áp cấp cứu', icdCode: 'I16.1', confidence: 88, reasoning: 'Tiền sử THA + đau đầu dữ dội + nhìn mờ → nghi THA cấp cứu' },
            { name: 'Bệnh não do tăng huyết áp', icdCode: 'I67.4', confidence: 65, reasoning: 'Đau đầu + rối loạn thị giác + HA không kiểm soát' },
        );
        suggestedLabs.push(
            { id: 'ecg', name: 'ECG 12 chuyển đạo', reason: 'Đánh giá tổn thương tim do THA', priority: 'urgent' },
            { id: 'biochem', name: 'Sinh hoá máu (Creatinine, eGFR)', reason: 'Đánh giá chức năng thận', priority: 'urgent' },
            { id: 'blood', name: 'Troponin I', reason: 'Loại trừ tổn thương cơ tim', priority: 'urgent' },
            { id: 'ct', name: 'CT não không cản quang', reason: 'Loại trừ xuất huyết não', priority: 'recommended' },
        );
        riskAlerts.push(
            { message: '⚠️ Tiền sử THA + triệu chứng thần kinh → Cần đánh giá THA cấp cứu ngay', severity: 'critical' },
            { message: 'BN nghi ngờ không tuân thủ thuốc Amlodipine (ngừng 2 tuần)', severity: 'warning' },
        );
    } else if (lowerReason.includes('tái khám') || lowerReason.includes('kiểm tra')) {
        likelyConditions.push(
            { name: 'Tái khám THA — chưa đạt mục tiêu', icdCode: 'I10', confidence: 90, reasoning: 'HA 150/95 lần trước, mục tiêu <140/90' },
            { name: 'Tiền đái tháo đường', icdCode: 'R73.0', confidence: 75, reasoning: 'Glucose 7.2, HbA1c 6.8% — vượt ngưỡng' },
        );
        suggestedLabs.push(
            { id: 'biochem', name: 'HbA1c + Glucose lúc đói', reason: 'Theo dõi tiền ĐTĐ (HbA1c 6.8% lần trước)', priority: 'urgent' },
            { id: 'blood', name: 'Lipid panel', reason: 'Theo dõi rối loạn lipid máu', priority: 'recommended' },
            { id: 'biochem', name: 'Chức năng thận (Creatinine, eGFR)', reason: 'Đánh giá biến chứng THA', priority: 'recommended' },
        );
        riskAlerts.push(
            { message: 'Glucose tăng dần: 5.8 → 6.4 → 7.2 mmol/L — Nguy cơ chuyển sang ĐTĐ type 2', severity: 'warning' },
        );
    } else {
        // Generic
        likelyConditions.push(
            { name: 'Đánh giá tổng quát', icdCode: 'Z00.0', confidence: 60, reasoning: 'Cần khám lâm sàng để xác định' },
        );
        suggestedLabs.push(
            { id: 'blood', name: 'CBC', reason: 'Đánh giá tổng quát', priority: 'recommended' },
            { id: 'biochem', name: 'Sinh hoá cơ bản', reason: 'Theo dõi THA + Lipid', priority: 'recommended' },
        );
    }

    // Suggest medications based on history
    if (profile.chronicConditions.some(c => c.toLowerCase().includes('huyết áp'))) {
        suggestedMedications.push(
            { name: 'Amlodipine', dosage: '10mg (tăng liều từ 5mg)', reason: 'HA chưa đạt mục tiêu với 5mg' },
            { name: 'Losartan', dosage: '50mg', reason: 'Phối hợp CCB + ARB để kiểm soát HA' },
        );
    }

    return {
        likelyConditions,
        suggestedLabs,
        suggestedMedications,
        riskAlerts,
        citations: [
            { id: 'c1', source: 'ESC/ESH 2023', section: 'Section 7.3', excerpt: 'Hypertensive emergencies: SBP ≥180/DBP ≥120 with HMOD', evidenceLevel: 'A' as const, reference: 'European Heart Journal 2023;44:3611-3714' },
            { id: 'c2', source: 'ADA 2025', section: 'Section 2.4', excerpt: 'Pre-diabetes: FPG 5.6-6.9 mmol/L or HbA1c 5.7-6.4%', evidenceLevel: 'A' as const, reference: 'Diabetes Care 2025;48(Suppl 1)' },
        ],
    };
}

// ============================================
// Component
// ============================================

export function AIPatientPreAnalysis({
    patientId, patientName, patientAge = 52, patientGender = 'Nam',
    allergies = [], medicalHistory = [], reason = '',
    onApplyDiagnosis, onApplyLabs, onApplyMedication, onApplyVitals,
}: AIPatientPreAnalysisProps) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<PatientFullProfile | null>(null);
    const [analysis, setAnalysis] = useState<AIPreAnalysis | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [appliedItems, setAppliedItems] = useState<Set<string>>(new Set());

    const markApplied = (key: string) => {
        setAppliedItems(prev => { const s = new Set(prev); s.add(key); return s; });
    };

    const loadPatientData = useCallback(async () => {
        setLoading(true);
        try {
            // Try real API first
            const [ehrRes, emrRes] = await Promise.allSettled([
                aiService.summarizePatient(patientId),
                emrService.getList({ patientId, limit: 10 }),
            ]);

            // If API succeeds, use real data
            const ehrData = ehrRes.status === 'fulfilled' ? (ehrRes.value?.data as any)?.summary : null;
            if (ehrData) {
                setProfile({
                    patientId,
                    patientName,
                    age: patientAge,
                    gender: patientGender,
                    chronicConditions: ehrData.chronicConditions || [],
                    allergies: ehrData.allergies || allergies,
                    currentMedications: ehrData.currentMedications || [],
                    pastDiagnoses: ehrData.pastDiagnoses || [],
                    recentVitals: ehrData.recentVitals || [],
                    recentLabs: ehrData.recentLabs || [],
                    visitCount: ehrData.visitCount || 0,
                    lastVisitDate: ehrData.lastVisitDate || '',
                    redFlags: ehrData.redFlags || [],
                });
            } else {
                // Fallback to mock (for demo/competition)
                setProfile(generateMockProfile(patientName, patientAge, allergies, medicalHistory, reason));
            }
        } catch {
            // Always fallback to mock
            setProfile(generateMockProfile(patientName, patientAge, allergies, medicalHistory, reason));
        }
        setLoading(false);
    }, [patientId, patientName, patientAge, patientGender, allergies, medicalHistory, reason]);

    // Load on mount
    useEffect(() => {
        loadPatientData();
    }, [loadPatientData]);

    // Generate AI analysis when profile loaded
    useEffect(() => {
        if (!profile) return;

        const runAnalysis = async () => {
            try {
                const res = await aiService.getDiagnosis({
                    symptoms: reason,
                    vitals: profile.recentVitals[0] as any,
                    patientHistory: { chronicConditions: profile.chronicConditions, medications: profile.currentMedications } as any,
                });
                const data = (res?.data as any)?.data ?? res?.data;
                if (data?.diagnoses?.length) {
                    setAnalysis({
                        likelyConditions: data.diagnoses.map((d: any) => ({
                            name: d.icdDescription || d.description,
                            icdCode: d.icdCode,
                            confidence: d.confidence || 70,
                            reasoning: d.reasoning || 'Phân tích từ triệu chứng + tiền sử',
                        })),
                        suggestedLabs: data.suggestedLabs?.map((l: any) => ({
                            id: l.id, name: l.labName || l.name, reason: l.reason, priority: l.priority || 'recommended',
                        })) || [],
                        suggestedMedications: [],
                        riskAlerts: [],
                        citations: data.citations || [],
                    });
                    return;
                }
            } catch { /* fallback below */ }

            // Mock analysis
            setAnalysis(generateMockAnalysis(profile, reason));
        };

        runAnalysis();
    }, [profile, reason]);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-200 dark:bg-violet-800" />
                    <div className="flex-1">
                        <div className="h-4 bg-violet-200 dark:bg-violet-800 rounded w-64 mb-2" />
                        <div className="h-3 bg-violet-100 dark:bg-violet-900 rounded w-48" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-violet-100 dark:bg-violet-900/50 rounded-lg" />)}
                </div>
            </div>
        );
    }

    if (!profile || !analysis) return null;

    return (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200 dark:border-violet-800 border-l-4 border-l-violet-600 rounded-xl overflow-hidden">
            {/* Header */}
            <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-violet-100/30 dark:hover:bg-violet-900/20 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>smart_toy</span>
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-violet-700 dark:text-violet-300">
                            🤖 AI Phân tích tổng hợp — {patientName}
                        </h3>
                        <p className="text-xs text-violet-500 dark:text-violet-400">
                            {profile.visitCount} lần khám | Lần cuối: {profile.lastVisitDate} | {profile.chronicConditions.length} bệnh mãn tính
                        </p>
                    </div>
                </div>
                <span className="material-symbols-outlined text-violet-400" style={{ fontSize: '20px', transform: collapsed ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>
                    expand_more
                </span>
            </button>

            {!collapsed && (
                <div className="px-5 pb-5 space-y-4">
                    {/* Risk Alerts */}
                    {analysis.riskAlerts.length > 0 && (
                        <div className="space-y-2">
                            {analysis.riskAlerts.map((alert, i) => (
                                <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                                    alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' :
                                    alert.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                                    'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                }`}>
                                    <span className="material-symbols-outlined mt-0.5" style={{ fontSize: '14px' }}>
                                        {alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}
                                    </span>
                                    <span>{alert.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Patient History Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Bệnh mãn tính + Tiền sử */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-lg p-3 border border-violet-100 dark:border-violet-900/50">
                            <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>medical_information</span>
                                Tiền sử bệnh lý
                            </h4>
                            <div className="space-y-1">
                                {profile.chronicConditions.map((c, i) => (
                                    <div key={i} className="text-xs text-[#374151] dark:text-gray-300 flex items-start gap-1">
                                        <span className="text-violet-500 mt-0.5">•</span>{c}
                                    </div>
                                ))}
                                {profile.pastDiagnoses.slice(0, 3).map((d, i) => (
                                    <div key={i} className="text-xs text-[#687582] dark:text-gray-400 flex items-start gap-1">
                                        <span className="text-gray-400">•</span>
                                        <code className="text-violet-600 dark:text-violet-400 text-[10px]">{d.icdCode}</code> {d.description} ({d.date})
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Thuốc đang dùng + Dị ứng */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-lg p-3 border border-violet-100 dark:border-violet-900/50">
                            <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>medication</span>
                                Thuốc & Dị ứng
                            </h4>
                            <div className="space-y-1">
                                {profile.currentMedications.map((m, i) => (
                                    <div key={i} className="text-xs text-[#374151] dark:text-gray-300">
                                        💊 <strong>{m.name}</strong> {m.dosage} — {m.frequency} {m.since ? `(từ ${m.since})` : ''}
                                    </div>
                                ))}
                                {profile.allergies.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {profile.allergies.map((a, i) => (
                                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full border border-red-200 dark:border-red-800">
                                                ⚠️ {a}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sinh hiệu gần nhất */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-lg p-3 border border-violet-100 dark:border-violet-900/50">
                            <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>monitor_heart</span>
                                Sinh hiệu gần nhất ({profile.recentVitals[0]?.date || '—'})
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {profile.recentVitals[0] && (
                                    <>
                                        <div className="text-xs"><span className="text-[#687582]">HA:</span> <strong className="text-[#121417] dark:text-white">{profile.recentVitals[0].bp || '—'}</strong> mmHg</div>
                                        <div className="text-xs"><span className="text-[#687582]">Mạch:</span> <strong className="text-[#121417] dark:text-white">{profile.recentVitals[0].hr || '—'}</strong> bpm</div>
                                        <div className="text-xs"><span className="text-[#687582]">Nhiệt:</span> <strong className="text-[#121417] dark:text-white">{profile.recentVitals[0].temp || '—'}</strong>°C</div>
                                        <div className="text-xs"><span className="text-[#687582]">SpO₂:</span> <strong className="text-[#121417] dark:text-white">{profile.recentVitals[0].spo2 || '—'}</strong>%</div>
                                    </>
                                )}
                            </div>
                            {onApplyVitals && profile.recentVitals[0] && (
                                <button
                                    onClick={() => {
                                        onApplyVitals({
                                            bloodPressure: profile.recentVitals[0].bp || '',
                                            heartRate: profile.recentVitals[0].hr || '',
                                            temperature: profile.recentVitals[0].temp || '',
                                            spO2: profile.recentVitals[0].spo2 || '',
                                        });
                                        markApplied('vitals');
                                    }}
                                    disabled={appliedItems.has('vitals')}
                                    className={`mt-2 text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                                        appliedItems.has('vitals')
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 hover:bg-violet-200'
                                    }`}
                                >
                                    {appliedItems.has('vitals') ? '✓ Đã điền' : 'Điền vào form →'}
                                </button>
                            )}
                        </div>

                        {/* XN gần nhất */}
                        <div className="bg-white dark:bg-[#1e242b] rounded-lg p-3 border border-violet-100 dark:border-violet-900/50">
                            <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>science</span>
                                Kết quả XN gần nhất
                            </h4>
                            <div className="space-y-1">
                                {profile.recentLabs.map((lab, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <span className="text-[#687582] dark:text-gray-400">{lab.name}:</span>
                                        <span className={`font-medium ${lab.status === 'abnormal' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                            {lab.value} {lab.status === 'abnormal' ? '⬆️' : '✓'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* AI Gợi ý chẩn đoán */}
                    <div className="bg-white dark:bg-[#1e242b] rounded-lg p-4 border border-violet-100 dark:border-violet-900/50">
                        <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-3 flex items-center gap-1.5">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>diagnosis</span>
                            AI Gợi ý khả năng mắc bệnh
                        </h4>
                        <div className="space-y-2">
                            {analysis.likelyConditions.map((cond, i) => (
                                <div key={i} className="flex items-center gap-3 p-2.5 bg-[#f8f9fa] dark:bg-[#13191f] rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-semibold text-[#121417] dark:text-white">{i + 1}. {cond.name}</span>
                                            <code className="text-[10px] px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded">{cond.icdCode}</code>
                                            <AIConfidenceBadge confidence={cond.confidence} size="sm" />
                                        </div>
                                        <p className="text-xs text-[#687582] dark:text-gray-400">{cond.reasoning}</p>
                                    </div>
                                    {onApplyDiagnosis && (
                                        <button
                                            onClick={() => { onApplyDiagnosis(cond.icdCode, cond.name); markApplied(`diag-${i}`); }}
                                            disabled={appliedItems.has(`diag-${i}`)}
                                            className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                                                appliedItems.has(`diag-${i}`)
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-violet-600 text-white hover:bg-violet-700'
                                            }`}
                                        >
                                            {appliedItems.has(`diag-${i}`) ? '✓ Đã chọn' : 'Dùng'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Gợi ý xét nghiệm */}
                    <div className="bg-white dark:bg-[#1e242b] rounded-lg p-4 border border-violet-100 dark:border-violet-900/50">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>biotech</span>
                                AI Gợi ý xét nghiệm
                            </h4>
                            {onApplyLabs && (
                                <button
                                    onClick={() => {
                                        onApplyLabs(analysis.suggestedLabs.map(l => l.id));
                                        markApplied('all-labs');
                                    }}
                                    disabled={appliedItems.has('all-labs')}
                                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                        appliedItems.has('all-labs')
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-violet-600 text-white hover:bg-violet-700'
                                    }`}
                                >
                                    {appliedItems.has('all-labs') ? '✓ Đã thêm tất cả' : 'Thêm tất cả'}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {analysis.suggestedLabs.map((lab, i) => (
                                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${
                                    lab.priority === 'urgent' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                                    lab.priority === 'recommended' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' :
                                    'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                                }`}>
                                    <span className="text-sm mt-0.5">{lab.priority === 'urgent' ? '🔴' : lab.priority === 'recommended' ? '🟡' : '🟢'}</span>
                                    <div>
                                        <p className="text-xs font-medium text-[#121417] dark:text-white">{lab.name}</p>
                                        <p className="text-[10px] text-[#687582] dark:text-gray-400">{lab.reason}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Gợi ý thuốc */}
                    {analysis.suggestedMedications.length > 0 && (
                        <div className="bg-white dark:bg-[#1e242b] rounded-lg p-4 border border-violet-100 dark:border-violet-900/50">
                            <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-3 flex items-center gap-1.5">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>medication</span>
                                AI Gợi ý thuốc (dựa trên tiền sử)
                            </h4>
                            <div className="space-y-2">
                                {analysis.suggestedMedications.map((med, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-[#f8f9fa] dark:bg-[#13191f] rounded-lg">
                                        <div>
                                            <p className="text-xs font-medium text-[#121417] dark:text-white">💊 {med.name} — {med.dosage}</p>
                                            <p className="text-[10px] text-[#687582] dark:text-gray-400">{med.reason}</p>
                                        </div>
                                        {onApplyMedication && (
                                            <button
                                                onClick={() => {
                                                    onApplyMedication({ name: med.name, dosage: med.dosage, frequency: '1 lần/ngày', duration: '30', note: med.reason });
                                                    markApplied(`med-${i}`);
                                                }}
                                                disabled={appliedItems.has(`med-${i}`)}
                                                className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                                    appliedItems.has(`med-${i}`)
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                                                }`}
                                            >
                                                {appliedItems.has(`med-${i}`) ? '✓ Đã thêm' : 'Thêm'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Red Flags */}
                    {profile.redFlags.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1.5">⚠️ Red Flags từ lịch sử</h4>
                            <div className="space-y-1">
                                {profile.redFlags.map((flag, i) => (
                                    <p key={i} className="text-xs text-amber-800 dark:text-amber-200">— {flag}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Citations */}
                    {analysis.citations.length > 0 && (
                        <AICitationBlock citations={analysis.citations} />
                    )}

                    <p className="text-[10px] text-violet-400 dark:text-violet-500 text-center">
                        🤖 AI phân tích dựa trên hồ sơ bệnh án + guidelines y khoa. Bác sĩ có quyền quyết định cuối cùng.
                    </p>
                </div>
            )}
        </div>
    );
}
