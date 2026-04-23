"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { dispensingService } from "@/services/dispensingService";
import { usePageAIContext } from "@/hooks/usePageAIContext";
import { AIDispensingAssistant } from "@/components/portal/ai";

type RxData = {
    id: string; patient: string; patientId: string; age: number; gender: string; phone: string;
    doctor: string; dept: string; diagnosis: string; date: string; note: string;
    medicines: { name: string; qty: string; dosage: string; lot?: string; expiry?: string }[];
};

export default function DispensingPage() {
    const t = useTranslations("pages.portal.pharmacist.dispensing");
    const router = useRouter();
    const searchParams = useSearchParams();
    const prescriptionId = searchParams.get("id");
    usePageAIContext({ pageKey: 'dispensing' });
    const [checkedMeds, setCheckedMeds] = useState<Record<number, boolean>>({});
    const [patientConfirmed, setPatientConfirmed] = useState(false);
    const [dispensing, setDispensing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [dispenseError, setDispenseError] = useState("");
    const [loading, setLoading] = useState(false);
    const [rx, setRx] = useState<RxData | null>(null);

    useEffect(() => {
        if (!prescriptionId) return;
        setLoading(true);
        // Dùng /api/dispensing/{prescriptionId} — đúng Swagger
        dispensingService.getPrescription(prescriptionId)
            .then(res => {
                const data = res?.data ?? res;
                if (data && data.id) setRx(data as RxData);
            })
            .catch(() => { setRx(null); })
            .finally(() => setLoading(false));
    }, [prescriptionId]);

    const allChecked = (rx?.medicines ?? []).every((_, i) => checkedMeds[i]);

    const toggleMed = (idx: number) => {
        setCheckedMeds(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const handleDispense = async () => {
        if (!allChecked || !patientConfirmed) return;
        setDispensing(true);
        setDispenseError("");
        try {
            const id = prescriptionId || rx?.id || "";
            await dispensingService.dispense(id, {
                items: (rx?.medicines ?? []).map((m, i) => ({ ...m, dispensed: checkedMeds[i] })),
                note: `Cấp phát cho ${rx?.patient ?? ""}`,
            });
            setCompleted(true);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Cấp phát thuốc thất bại. Vui lòng thử lại.";
            setDispenseError(msg);
        } finally {
            setDispensing(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Bạn có chắc muốn hủy đơn thuốc này?")) return;
        try {
            const id = prescriptionId || rx?.id || "";
            await dispensingService.cancel(id, "Hủy bởi dược sĩ");
            router.back();
        } catch {
            alert("Hủy đơn thất bại. Vui lòng thử lại.");
        }
    };

    if (completed) {
        return (
            <div className="p-6 md:p-8">
                <div className="max-w-lg mx-auto text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-5">
                        <span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
                    </div>
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white mb-2">Cấp phát thành công!</h1>
                    <p className="text-sm text-[#687582] mb-6">Đơn thuốc {rx?.id} đã được cấp phát cho bệnh nhân {rx?.patient}.</p>
                    <div className="flex items-center justify-center gap-3">
                        <button onClick={() => router.push("/portal/pharmacist/prescriptions")} className="px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold transition-colors">
                            Về danh sách đơn
                        </button>
                        <button onClick={() => window.print()} className="px-5 py-2.5 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">print</span>In nhãn thuốc
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!rx) {
        return (
            <div className="p-6 md:p-8">
                <div className="max-w-4xl mx-auto text-center py-20">
                    <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3 block">receipt_long</span>
                    <p className="text-sm text-[#687582] dark:text-gray-400">
                        {prescriptionId ? "Không tìm thấy đơn thuốc. Vui lòng kiểm tra lại." : "Vui lòng chọn đơn thuốc cần cấp phát từ danh sách."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8"><div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">local_pharmacy</span>
                        {t("title")} — {rx.id}
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">{t("subtitle")}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">cancel</span>Hủy đơn
                    </button>
                    <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>Quay lại
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {dispenseError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <span className="material-symbols-outlined text-red-600 text-[20px] mt-0.5">error</span>
                    <div>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">Cấp phát thất bại</p>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">{dispenseError}</p>
                    </div>
                    <button onClick={() => setDispenseError("")} className="ml-auto text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}

            {/* Patient Info */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-[#687582]">Bệnh nhân</span><p className="font-bold text-[#121417] dark:text-white">{rx.patient}</p></div>
                    <div><span className="text-[#687582]">Tuổi / Giới</span><p className="font-medium text-[#121417] dark:text-white">{rx.age} tuổi, {rx.gender}</p></div>
                    <div><span className="text-[#687582]">Bác sĩ</span><p className="font-medium text-[#121417] dark:text-white">{rx.doctor}</p></div>
                    <div><span className="text-[#687582]">Chẩn đoán</span><p className="font-medium text-[#121417] dark:text-white">{rx.diagnosis}</p></div>
                </div>
                {rx.note && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-[#687582]"><strong>Lời dặn BS:</strong> {rx.note}</p>
                    </div>
                )}
            </div>

            {/* AI Drug Interaction Checker */}
            <AIDispensingAssistant />

            {/* Medicine Checklist */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] overflow-hidden">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h2 className="text-base font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">medication</span>
                        Checklist thuốc ({Object.values(checkedMeds).filter(Boolean).length}/{rx.medicines?.length ?? 0})
                    </h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rx.medicines.map((med, i) => (
                        <div key={i} onClick={() => toggleMed(i)}
                            className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${checkedMeds[i] ? "bg-green-50/50 dark:bg-green-900/5" : "hover:bg-gray-50 dark:hover:bg-gray-800/30"}`}>
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checkedMeds[i] ? "border-green-500 bg-green-500" : "border-gray-300 dark:border-gray-600"}`}>
                                {checkedMeds[i] && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-bold ${checkedMeds[i] ? "text-green-700 dark:text-green-400 line-through" : "text-[#121417] dark:text-white"}`}>{med.name}</p>
                                <p className="text-xs text-[#687582] mt-0.5">{med.dosage}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-[#121417] dark:text-white">{med.qty}</p>
                                <p className="text-[10px] text-[#687582]">Lô: {med.lot} • HSD: {med.expiry}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Patient Confirmation */}
            <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${patientConfirmed ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-dashed border-gray-300 dark:border-gray-600"}`}>
                <input type="checkbox" checked={patientConfirmed} onChange={e => setPatientConfirmed(e.target.checked)} className="w-5 h-5 rounded text-green-600" />
                <div>
                    <p className="text-sm font-bold text-[#121417] dark:text-white">Xác nhận bệnh nhân đã nhận thuốc</p>
                    <p className="text-xs text-[#687582]">Bệnh nhân {rx.patient} đã được hướng dẫn cách dùng thuốc và xác nhận nhận đủ thuốc.</p>
                </div>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-[#687582] hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">print</span>In nhãn thuốc
                </button>
                <div className="flex items-center gap-2">
                    {!allChecked && <p className="text-xs text-amber-600">Chưa kiểm tra đủ thuốc</p>}
                    {!patientConfirmed && allChecked && <p className="text-xs text-amber-600">Chưa xác nhận bệnh nhân</p>}
                    <button onClick={handleDispense} disabled={!allChecked || !patientConfirmed || dispensing}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 shadow-md shadow-green-200 dark:shadow-none">
                        {dispensing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</> : <><span className="material-symbols-outlined text-[18px]">done_all</span>Hoàn thành cấp phát</>}
                    </button>
                </div>
            </div>
        </div></div>
    );
}
