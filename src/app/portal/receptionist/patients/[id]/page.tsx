"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
    getPatientDetail,
    updatePatient,
    getContacts,
    updateContact,
    addContact,
    deleteContact,
    getRelations,
    addRelation,
    deleteRelation,
    getMedicalHistory,
    getEncounterDetail,
    getPrescriptions,
    getDocuments,
    uploadDocument,
    deleteDocument,
    updatePatientStatus,
    getPatientInsurances,
    Patient,
    PatientContact,
    PatientInsurance,
    PatientRelation,
    MedicalRecord,
    RelationType,
} from "@/services/patientService";
import { prescriptionService } from "@/services/prescriptionService";
import { toast } from "react-hot-toast";
import { validateFile } from "@/utils/fileValidation";

// ==================== HELPERS ====================
function fmtDob(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function calcAge(dob?: string): number {
    if (!dob) return 0;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return 0;
    return new Date().getFullYear() - d.getFullYear();
}

function fmtDatetime(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function genderLabel(g?: string): string {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    if (g === "OTHER") return "Khác";
    return g ?? "—";
}

function statusInfo(s?: string) {
    if (s === "ACTIVE") return { label: "Đang hoạt động", cls: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700", dot: "bg-emerald-500" };
    if (s === "INACTIVE") return { label: "Ngưng theo dõi", cls: "bg-gray-100 dark:bg-gray-700 text-gray-600", dot: "bg-gray-400" };
    if (s === "DECEASED") return { label: "Đã mất", cls: "bg-red-100 dark:bg-red-500/10 text-red-700", dot: "bg-red-500" };
    return { label: s ?? "—", cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
}

function fmtFileSize(bytes?: number): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPrimaryAvatarUrl(patient?: Patient | null): string {
    return (Array.isArray(patient?.avatar_url) && patient.avatar_url.length > 0) ? patient.avatar_url[patient.avatar_url.length - 1]?.url || "" : "";
}

// ==================== COMPONENTS ====================
function LoadingSpinner({ text = "Đang tải..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-7 h-7 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#687582]">{text}</p>
        </div>
    );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="material-symbols-outlined text-[#dde0e4] text-[40px]">{icon}</span>
            <p className="text-sm text-[#687582]">{text}</p>
        </div>
    );
}

function ErrorMsg({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="material-symbols-outlined text-red-400 text-[36px]">error_outline</span>
            <p className="text-sm text-red-500">{msg}</p>
            {onRetry && <button onClick={onRetry} className="text-sm text-[#3C81C6] hover:underline">Thử lại</button>}
        </div>
    );
}

// ==================== PAGE ====================
const TABS = [
    { key: "info", label: "Thông tin chung", icon: "person" },
    { key: "insurance", label: "Bảo hiểm", icon: "health_and_safety" },
    { key: "history", label: "Lịch sử khám", icon: "history" },
    { key: "prescriptions", label: "Đơn thuốc", icon: "medication" },
    { key: "documents", label: "Tài liệu", icon: "folder" },
    { key: "relations", label: "Người thân", icon: "family_restroom" },
];

export default function PatientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;

    // Patient info
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loadingPatient, setLoadingPatient] = useState(true);
    const [errorPatient, setErrorPatient] = useState<string | null>(null);

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Patient>>({});

    // Tabs
    const [activeTab, setActiveTab] = useState("info");
    const loadedTabs = useRef<Set<string>>(new Set(["info"]));

    // Medical history
    const [history, setHistory] = useState<MedicalRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [errorHistory, setErrorHistory] = useState<string | null>(null);
    // Modal Lịch sử khám
    const [selectedHistory, setSelectedHistory] = useState<any>(null);
    const [encounterDetail, setEncounterDetail] = useState<any>(null);
    const [loadingEncounterDetail, setLoadingEncounterDetail] = useState(false);

    // Modal Đơn thuốc
    const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
    const [prescriptionDetails, setPrescriptionDetails] = useState<any[]>([]);
    const [loadingPrescriptionDetails, setLoadingPrescriptionDetails] = useState(false);

    // Prescriptions
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loadingRx, setLoadingRx] = useState(false);
    const [errorRx, setErrorRx] = useState<string | null>(null);

    // Documents
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [errorDocs, setErrorDocs] = useState<string | null>(null);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Insurance
    const [insurances, setInsurances] = useState<PatientInsurance[]>([]);
    const [loadingInsurance, setLoadingInsurance] = useState(false);
    const [errorInsurance, setErrorInsurance] = useState<string | null>(null);

    // Relations
    const [relations, setRelations] = useState<PatientRelation[]>([]);
    const [loadingRelations, setLoadingRelations] = useState(false);
    const [errorRelations, setErrorRelations] = useState<string | null>(null);
    const [showAddRelation, setShowAddRelation] = useState(false);
    const [relationForm, setRelationForm] = useState({ full_name: "", relationship: "PARENT" as RelationType, phone_number: "", is_emergency: false });
    const [savingRelation, setSavingRelation] = useState(false);

    // ===== Fetch patient =====
    const fetchPatient = async () => {
        setLoadingPatient(true);
        setErrorPatient(null);
        try {
            const res = await getPatientDetail(patientId);
            if (res.success && res.data) {
                setPatient(res.data);
                setEditForm({
                    full_name: res.data.full_name,
                    date_of_birth: res.data.date_of_birth,
                    gender: res.data.gender,
                    identity_type: res.data.identity_type,
                    identity_number: res.data.identity_number,
                    nationality: res.data.nationality,
                    blood_type: res.data.blood_type,
                    allergies: res.data.allergies,
                    chronic_diseases: res.data.chronic_diseases,
                });
            } else {
                setErrorPatient(res.message || "Không tìm thấy bệnh nhân");
            }
        } catch {
            setErrorPatient("Không thể tải thông tin bệnh nhân");
        } finally {
            setLoadingPatient(false);
        }
    };

    useEffect(() => {
        if (patientId) {
            fetchPatient();
            fetchInsurances();
            fetchRelations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    // ===== Lazy load tabs =====
    const handleTabChange = (tabKey: string) => {
        setActiveTab(tabKey);
        if (loadedTabs.current.has(tabKey)) return;
        loadedTabs.current.add(tabKey);

        if (tabKey === "history") fetchHistory();
        if (tabKey === "prescriptions") fetchPrescriptions();
        if (tabKey === "documents") fetchDocuments();
    };

    // ===== Insurance =====
    const fetchInsurances = async () => {
        setLoadingInsurance(true);
        setErrorInsurance(null);
        try {
            const res = await getPatientInsurances(patientId);
            if (res.success) {
                const arr = Array.isArray(res.data) ? res.data : [];
                setInsurances(arr);
            } else {
                setErrorInsurance(res.message ?? "Lỗi tải bảo hiểm");
            }
        } catch {
            setErrorInsurance("Không thể tải thông tin bảo hiểm");
        } finally {
            setLoadingInsurance(false);
        }
    };




    // ===== Medical History =====
    const fetchHistory = async () => {
        setLoadingHistory(true);
        setErrorHistory(null);
        try {
            const res = await getMedicalHistory(patientId);
            if (res.success) setHistory(res.data ?? []);
            else setErrorHistory(res.message ?? "Lỗi tải lịch sử");
        } catch {
            setErrorHistory("Không thể tải lịch sử khám");
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleViewEncounter = async (enc: any) => {
        setSelectedHistory(enc);
        setEncounterDetail(null);
        setLoadingEncounterDetail(true);
        try {
            const encId = enc.encounters_id || enc.encounter_id || enc.id;
            if (encId) {
                const res = await getEncounterDetail(encId);
                if (res.success) setEncounterDetail(res.data);
            }
        } catch (e) {
            console.error("Failed to load encounter detail", e);
        } finally {
            setLoadingEncounterDetail(false);
        }
    };

    // ===== Prescriptions =====
    const fetchPrescriptions = async () => {
        setLoadingRx(true);
        setErrorRx(null);
        try {
            const res = await getPrescriptions(patientId);
            if (res.success) setPrescriptions(res.data ?? []);
            else setErrorRx(res.message ?? "Lỗi tải đơn thuốc");
        } catch {
            setErrorRx("Không thể tải đơn thuốc");
        } finally {
            setLoadingRx(false);
        }
    };

    const handleViewPrescription = async (rx: any) => {
        setSelectedPrescription(rx);
        setLoadingPrescriptionDetails(true);
        try {
            const details = await prescriptionService.getDetails(rx.prescriptions_id || rx.id);
            setPrescriptionDetails(Array.isArray(details) ? details : []);
        } catch {
            toast.error("Không thể tải chi tiết đơn thuốc");
        } finally {
            setLoadingPrescriptionDetails(false);
        }
    };

    // ===== Documents =====
    const fetchDocuments = async () => {
        setLoadingDocs(true);
        setErrorDocs(null);
        try {
            const res = await getDocuments(patientId);
            if (res.success) setDocuments(res.data ?? []);
            else setErrorDocs(res.message ?? "Lỗi tải tài liệu");
        } catch {
            setErrorDocs("Không thể tải tài liệu");
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validation = validateFile(file, { maxSize: 5 * 1024 * 1024, allowedTypes: ["pdf", "jpg", "jpeg", "png", "doc", "docx"] });
        if (!validation.valid) { alert(validation.message); if (fileInputRef.current) fileInputRef.current.value = ""; return; }
        setUploadingDoc(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("patient_id", patientId);
            fd.append("document_type_id", "GENERAL");
            fd.append("document_name", file.name);
            const res = await uploadDocument(patientId, fd);
            if (res.success) fetchDocuments();
            else alert(res.message || "Tải lên thất bại");
        } catch {
            alert("Tải lên tài liệu thất bại");
        } finally {
            setUploadingDoc(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (!confirm("Xóa tài liệu này?")) return;
        const res = await deleteDocument(patientId, docId);
        if (res.success) fetchDocuments();
        else alert(res.message || "Xóa thất bại");
    };

    // ===== Relations =====
    const fetchRelations = async () => {
        setLoadingRelations(true);
        setErrorRelations(null);
        try {
            const res = await getRelations(patientId);
            if (res.success) setRelations(res.data ?? []);
            else setErrorRelations(res.message ?? "Lỗi tải người thân");
        } catch {
            setErrorRelations("Không thể tải thông tin người thân");
        } finally {
            setLoadingRelations(false);
        }
    };

    const handleAddRelation = async () => {
        if (!relationForm.full_name || !relationForm.phone_number) return;
        setSavingRelation(true);
        try {
            const res = await addRelation(patientId, {
                full_name: relationForm.full_name,
                relationship: relationForm.relationship,
                phone_number: relationForm.phone_number,
                is_emergency: relationForm.is_emergency,
            });
            if (res.success) {
                setShowAddRelation(false);
                setRelationForm({ full_name: "", relationship: "PARENT", phone_number: "", is_emergency: false });
                fetchRelations();
            } else {
                alert(res.message || "Thêm người thân thất bại");
            }
        } catch {
            alert("Thêm người thân thất bại");
        } finally {
            setSavingRelation(false);
        }
    };

    const handleDeleteRelation = async (relId: string) => {
        if (!confirm("Xóa người thân này?")) return;
        const res = await deleteRelation(patientId, relId);
        if (res.success) fetchRelations();
        else alert(res.message || "Xóa thất bại");
    };

    // ===== Update Patient =====
    const handleSaveInfo = async () => {
        if (!patient) return;
        setSaving(true);
        try {
            const idToUpdate = patient.patient_id || patient.id;
            if (!idToUpdate) throw new Error("Missing patient ID");
            const res = await updatePatient(idToUpdate, {
                full_name: editForm.full_name,
                date_of_birth: editForm.date_of_birth,
                gender: editForm.gender,
                identity_type: editForm.identity_type,
                identity_number: editForm.identity_number,
                nationality: editForm.nationality,
                blood_type: editForm.blood_type,
                allergies: editForm.allergies,
                chronic_diseases: editForm.chronic_diseases,
            });
            if (res.success) {
                setEditing(false);
                fetchPatient();
            } else {
                alert(res.message || "Cập nhật thất bại");
            }
        } catch {
            alert("Cập nhật thất bại");
        } finally {
            setSaving(false);
        }
    };

    // ===== RENDER =====
    if (loadingPatient) {
        return (
            <div className="p-6 md:p-8">
                <LoadingSpinner text="Đang tải hồ sơ bệnh nhân..." />
            </div>
        );
    }

    if (errorPatient || !patient) {
        return (
            <div className="p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined text-[#687582]">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-bold text-[#121417] dark:text-white">Hồ sơ bệnh nhân</h1>
                    </div>
                    <ErrorMsg msg={errorPatient ?? "Không tìm thấy bệnh nhân"} onRetry={fetchPatient} />
                </div>
            </div>
        );
    }

    const st = statusInfo(patient.status);
    const age = calcAge(patient.date_of_birth);
    const primaryContact = patient.contact;

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Breadcrumb + Header */}
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#687582] dark:text-gray-500 mb-3">
                        <Link href="/portal/receptionist" className="hover:text-[#3C81C6]">Trang chủ</Link>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <Link href="/portal/receptionist/patients" className="hover:text-[#3C81C6]">Bệnh nhân</Link>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <span className="text-[#121417] dark:text-white font-medium">{patient.full_name}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <span className="material-symbols-outlined text-[#687582]">arrow_back</span>
                            </button>
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3C81C6] to-[#2a6da8] flex items-center justify-center overflow-hidden text-white text-xl font-bold flex-shrink-0">
                                {getPrimaryAvatarUrl(patient) ? (
                                    <Image src={getPrimaryAvatarUrl(patient)} alt={patient.full_name} width={56} height={56} className="h-full w-full object-cover" />
                                ) : (
                                    patient.full_name.charAt(0)
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#121417] dark:text-white">{patient.full_name}</h1>
                                <p className="text-sm text-[#687582] mt-0.5">
                                    Mã BN: <span className="font-mono text-[#3C81C6] font-medium">{patient.patient_code ?? patient.patient_id ?? patient.id}</span>
                                    {" · "}{genderLabel(patient.gender)}{" · "}{age > 0 ? `${age} tuổi` : "—"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${st.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                            </span>
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>Chỉnh sửa
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditing(false)} className="px-4 py-2 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm font-medium text-[#687582] hover:bg-gray-50 transition-colors">
                                        Hủy
                                    </button>
                                    <button onClick={handleSaveInfo} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                                        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">save</span>}
                                        Lưu
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick info cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {(() => {
                        const activeInsurance = insurances.find((ins: any) => ins.status === "ACTIVE" || (!ins.expiry_date || new Date(ins.expiry_date) > new Date()));
                        const insuranceValue = activeInsurance ? (activeInsurance.provider_name ?? (activeInsurance as any).insurance_provider ?? "Có BHYT") : "Không";
                        const insuranceColor = activeInsurance ? "emerald" : "blue";
                        
                        const emergencyContact = relations.find(r => r.is_emergency || r.is_emergency_contact);
                        const emergencyValue = emergencyContact ? `${emergencyContact.full_name || emergencyContact.contact_name} - ${emergencyContact.phone_number}` : "Chưa cập nhật";
                        const emergencyColor = emergencyContact ? "amber" : "blue";

                        return [
                            { icon: "call", label: "Điện thoại", value: patient.phone_number ?? primaryContact?.phone_number ?? "—", color: "blue" },
                            { icon: "badge", label: "CCCD/CMND", value: patient.id_card_number ?? patient.identity_number ?? "—", color: "blue" },
                            { icon: "location_on", label: "Địa chỉ", value: patient.address ?? "—", color: "red" },
                            { icon: "warning", label: "Dị ứng", value: (patient as any).allergies || "Không có", color: (patient as any).allergies ? "amber" : "blue" },
                            { icon: "health_and_safety", label: "Bảo hiểm", value: insuranceValue, color: insuranceColor },
                            { icon: "contact_emergency", label: "LH Khẩn cấp", value: emergencyValue, color: emergencyColor },
                        ];
                    })().map((item) => {
                        const colorMap: Record<string, string> = {
                            blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                            red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                            amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
                            emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
                        };
                        return (
                            <div key={item.label} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-3.5 flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[item.color] ?? colorMap.blue}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{item.icon}</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-[#687582]">{item.label}</p>
                                    <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{item.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    {/* Tab headers */}
                    <div className="p-4 md:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex flex-nowrap overflow-x-auto gap-2 pb-4 hide-scrollbar">
                            {TABS.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => handleTabChange(t.key)}
                                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-300 ${activeTab === t.key
                                            ? "bg-[#3C81C6] text-white shadow-md shadow-blue-500/20"
                                            : "bg-gray-50 dark:bg-[#171c23] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 md:p-6">
                        {/* ====== TAB: THÔNG TIN CHUNG ====== */}
                        {activeTab === "info" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Thông tin cá nhân */}
                                <div className="space-y-5">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">badge</span>
                                        Thông tin cá nhân
                                    </h3>
                                    {editing ? (
                                        <div className="space-y-4">
                                            <InfoField label="Họ và tên">
                                                <input className={inputCls} value={editForm.full_name ?? ""} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
                                            </InfoField>
                                            <InfoField label="Ngày sinh">
                                                <input type="date" className={inputCls} value={editForm.date_of_birth?.split("T")[0] ?? ""} onChange={e => setEditForm(p => ({ ...p, date_of_birth: e.target.value }))} />
                                            </InfoField>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoField label="Giới tính">
                                                    <select className={inputCls} value={editForm.gender ?? ""} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value as any }))}>
                                                        <option value="MALE">Nam</option>
                                                        <option value="FEMALE">Nữ</option>
                                                        <option value="OTHER">Khác</option>
                                                    </select>
                                                </InfoField>
                                                <InfoField label="Quốc tịch">
                                                    <input className={inputCls} value={editForm.nationality ?? ""} onChange={e => setEditForm(p => ({ ...p, nationality: e.target.value }))} />
                                                </InfoField>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoField label="Điện thoại">
                                                    <input className={inputCls} value={editForm.phone_number ?? ""} onChange={e => setEditForm(p => ({ ...p, phone_number: e.target.value }))} />
                                                </InfoField>
                                                <InfoField label="Email">
                                                    <input className={inputCls} value={editForm.email ?? ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                                                </InfoField>
                                            </div>
                                            <InfoField label="Địa chỉ">
                                                <input className={inputCls} value={editForm.address ?? ""} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
                                            </InfoField>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoField label="Loại giấy tờ">
                                                    <select className={inputCls} value={editForm.identity_type ?? ""} onChange={e => setEditForm(p => ({ ...p, identity_type: e.target.value as any }))}>
                                                        <option value="">-- Chọn --</option>
                                                        <option value="CCCD">CCCD</option>
                                                        <option value="PASSPORT">Hộ chiếu</option>
                                                        <option value="OTHER">Khác</option>
                                                    </select>
                                                </InfoField>
                                                <InfoField label="Số giấy tờ">
                                                    <input className={inputCls} value={editForm.identity_number ?? editForm.id_card_number ?? ""} onChange={e => setEditForm(p => ({ ...p, identity_number: e.target.value }))} />
                                                </InfoField>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {[
                                                { l: "Họ và tên", v: patient.full_name },
                                                { l: "Ngày sinh", v: fmtDob(patient.date_of_birth) },
                                                { l: "Tuổi", v: age > 0 ? `${age} tuổi` : "—" },
                                                { l: "Giới tính", v: genderLabel(patient.gender) },
                                                { l: "Điện thoại", v: patient.phone_number },
                                                { l: "Email", v: patient.email },
                                                { l: "Địa chỉ", v: patient.address },
                                                { l: "Loại giấy tờ", v: patient.identity_type },
                                                { l: "Số giấy tờ", v: patient.identity_number ?? patient.id_card_number },
                                                { l: "Quốc tịch", v: patient.nationality },
                                            ].map(f => <InfoRow key={f.l} label={f.l} value={f.v} />)}
                                        </div>
                                    )}
                                </div>

                                {/* Thông tin y tế */}
                                <div className="space-y-5">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">medical_information</span>
                                        Thông tin y tế
                                    </h3>
                                    {editing ? (
                                        <div className="space-y-4">
                                            <InfoField label="Email">
                                                <input type="email" className={inputCls} value={editForm.email ?? ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                                            </InfoField>
                                            <InfoField label="Dị ứng">
                                                <textarea className={inputCls + " resize-none"} rows={2} value={editForm.allergies ?? ""} onChange={e => setEditForm(p => ({ ...p, allergies: e.target.value }))} />
                                            </InfoField>
                                            <InfoField label="Bệnh mãn tính">
                                                <textarea className={inputCls + " resize-none"} rows={3} value={editForm.chronic_diseases ?? ""} onChange={e => setEditForm(p => ({ ...p, chronic_diseases: e.target.value }))} />
                                            </InfoField>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <InfoRow label="Email" value={patient.email ?? "—"} />
                                            <div className="flex items-start gap-2">
                                                <span className="text-[13px] text-[#687582] w-32 flex-shrink-0">Dị ứng:</span>
                                                <span className={`text-[13px] font-medium ${(patient as any).allergies ? "text-red-600" : "text-[#121417] dark:text-white"}`}>
                                                    {(patient as any).allergies || "Không có"}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="text-[13px] text-[#687582] w-32 flex-shrink-0">Bệnh mãn tính:</span>
                                                <span className="text-[13px] font-medium text-[#121417] dark:text-white">{(patient as any).chronic_diseases || "Không có"}</span>
                                            </div>
                                            <InfoRow label="Trạng thái" value={st.label} />
                                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                                <InfoRow label="Ngày tạo hồ sơ" value={fmtDatetime(patient.created_at)} />
                                            </div>
                                            <InfoRow label="Cập nhật" value={fmtDatetime(patient.updated_at)} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ====== TAB: BẢO HIỂM ====== */}
                        {activeTab === "insurance" && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">health_and_safety</span>
                                        Thông tin bảo hiểm
                                    </h3>
                                </div>
                                {loadingInsurance ? (
                                    <LoadingSpinner text="Đang tải bảo hiểm..." />
                                ) : errorInsurance ? (
                                    <ErrorMsg msg={errorInsurance} onRetry={fetchInsurances} />
                                ) : !Array.isArray(insurances) || insurances.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="material-symbols-outlined text-[48px] text-[#cdd5de] dark:text-gray-600 mb-3 block">shield</span>
                                        <p className="text-sm text-[#687582]">Chưa có thông tin bảo hiểm</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {insurances.map((ins: any, idx: number) => {
                                            const isActive = ins.status === "ACTIVE" || (!ins.expiry_date || new Date(ins.expiry_date) > new Date());
                                            return (
                                                <div key={ins.insurance_id ?? idx} className="group relative overflow-hidden bg-white dark:bg-[#171c23] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 hover:border-emerald-500/30 hover:shadow-md transition-all duration-300">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                                <span className="material-symbols-outlined text-[20px] text-emerald-600">health_and_safety</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{ins.provider_name ?? ins.insurance_provider ?? "Nhà cung cấp"}</h4>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{ins.insurance_number || ins.card_number || "Chưa có mã thẻ"}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                                                            {isActive ? "Đang hoạt động" : "Hết hạn"}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-gray-500">Mức hưởng</p>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{ins.coverage_percent ? `${ins.coverage_percent}%` : "—"}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-gray-500">Ngày hiệu lực</p>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{ins.start_date ? fmtDob(ins.start_date) : "—"}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-gray-500">Ngày hết hạn</p>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{ins.end_date ? fmtDob(ins.end_date) : "—"}</p>
                                                        </div>
                                                        {ins.notes && (
                                                            <div className="col-span-2 space-y-1">
                                                                <p className="text-xs text-gray-500">Ghi chú</p>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{ins.notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}



                        {/* ====== TAB: LỊCH SỬ KHÁM ====== */}
                        {activeTab === "history" && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-[#121417] dark:text-white uppercase tracking-wider">Lịch sử khám bệnh</h3>
                                {loadingHistory && <LoadingSpinner />}
                                {!loadingHistory && errorHistory && <ErrorMsg msg={errorHistory} onRetry={fetchHistory} />}
                                {!loadingHistory && !errorHistory && history.length === 0 && (
                                    <EmptyState icon="history" text="Chưa có lịch sử khám" />
                                )}
                                {!loadingHistory && history.map((v: any, idx: number) => (
                                    <div 
                                        key={v.encounters_id ?? v.encounter_id ?? idx} 
                                        onClick={() => handleViewEncounter(v)}
                                        className="group relative overflow-hidden p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121417] hover:border-[#3C81C6]/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#3C81C6] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "24px" }}>stethoscope</span>
                                            </div>
                                            <div className="flex-1 space-y-1.5 w-full">
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <h4 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-[#3C81C6] transition-colors">
                                                        {v.primary_diagnosis || v.chief_complaint || v.diagnosis || "Khám bệnh"}
                                                    </h4>
                                                    {v.encounter_type && (
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                                                            {v.encounter_type === "OUTPATIENT" ? "Ngoại trú" : v.encounter_type === "INPATIENT" ? "Nội trú" : v.encounter_type === "EMERGENCY" ? "Cấp cứu" : v.encounter_type}
                                                        </span>
                                                    )}
                                                    {v.status && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${v.status === "COMPLETED" || v.status === "CLOSED" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700" : v.status === "IN_PROGRESS" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                                                            {v.status === "COMPLETED" ? "Hoàn thành" : v.status === "CLOSED" ? "Đã đóng" : v.status === "IN_PROGRESS" ? "Đang khám" : v.status === "WAITING_FOR_RESULTS" ? "Chờ KQ" : v.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {v.doctor_name && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[15px]">person</span>
                                                            <span>{v.doctor_title ? `${v.doctor_title} ` : "BS. "}{v.doctor_name}</span>
                                                        </div>
                                                    )}
                                                    {(v.specialty_name || v.department_name) && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[15px]">domain</span>
                                                            <span>{v.specialty_name || v.department_name}</span>
                                                        </div>
                                                    )}
                                                    {v.room_name && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[15px]">meeting_room</span>
                                                            <span>{v.room_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {v.chief_complaint && v.primary_diagnosis && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Lý do: {v.chief_complaint}</p>
                                                )}
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-3 md:pt-0 md:pl-4 mt-3 md:mt-0 w-full md:w-auto">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                                    <span>{fmtDatetime(v.start_time ?? v.visit_date ?? v.created_at)}</span>
                                                </div>
                                                <button className="text-xs font-medium text-[#3C81C6] hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                                    Xem chi tiết <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ====== TAB: ĐƠN THUỐC ====== */}
                        {activeTab === "prescriptions" && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-[#121417] dark:text-white uppercase tracking-wider">Đơn thuốc</h3>
                                {loadingRx && <LoadingSpinner />}
                                {!loadingRx && errorRx && <ErrorMsg msg={errorRx} onRetry={fetchPrescriptions} />}
                                {!loadingRx && !errorRx && (!Array.isArray(prescriptions) || prescriptions.length === 0) && (
                                    <EmptyState icon="medication" text="Chưa có đơn thuốc" />
                                )}
                                {!loadingRx && Array.isArray(prescriptions) && prescriptions.map((rx, idx) => (
                                    <div key={rx.prescription_id ? `${rx.prescription_id}-${idx}` : `rx-${idx}`} className="group relative overflow-hidden p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121417] hover:border-teal-500/30 hover:shadow-lg transition-all duration-300">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                <span className="material-symbols-outlined text-teal-600" style={{ fontSize: "24px" }}>medication</span>
                                            </div>
                                            <div className="flex-1 space-y-1 w-full">
                                                <div className="flex items-center justify-between md:justify-start gap-3">
                                                    <h4 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">
                                                        {rx.prescription_code ? `Đơn thuốc: ${rx.prescription_code}` : (rx.medicines ?? rx.drug_name ?? `Đơn thuốc #${idx + 1}`)}
                                                    </h4>
                                                    {rx.status && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${rx.status === "DISPENSED" || rx.status === "dispensed" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"}`}>
                                                            {rx.status === "DISPENSED" || rx.status === "dispensed" ? "Đã cấp phát" : rx.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[16px]">medical_services</span>
                                                        <span className="truncate max-w-[200px]">{rx.medicines ?? rx.drug_name ?? "Các loại thuốc"}</span>
                                                    </div>
                                                    {rx.doctor_name && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[16px]">person</span>
                                                            <span>BS. {rx.doctor_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-3 md:pt-0 md:pl-4 mt-3 md:mt-0 w-full md:w-auto">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                                    <span>{fmtDatetime(rx.created_at ?? rx.prescription_date)}</span>
                                                </div>
                                                <button onClick={() => handleViewPrescription(rx)} className="text-xs font-medium text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                                    Chi tiết <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ====== TAB: TÀI LIỆU ====== */}
                        {activeTab === "documents" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white uppercase tracking-wider">Tài liệu bệnh nhân</h3>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingDoc}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {uploadingDoc ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">upload_file</span>}
                                        Tải lên tài liệu
                                    </button>
                                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadDoc} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                                </div>
                                {loadingDocs && <LoadingSpinner />}
                                {!loadingDocs && errorDocs && <ErrorMsg msg={errorDocs} onRetry={fetchDocuments} />}
                                {!loadingDocs && !errorDocs && documents.length === 0 && (
                                    <EmptyState icon="folder_open" text="Chưa có tài liệu" />
                                )}
                                {!loadingDocs && documents.map((d, idx) => (
                                    <div key={d.document_id ?? idx} className="group relative overflow-hidden p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121417] hover:border-orange-500/30 hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform duration-300">
                                                <span className="material-symbols-outlined text-orange-500" style={{ fontSize: "24px" }}>description</span>
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-orange-600 transition-colors" title={d.file_name ?? d.document_type ?? `Tài liệu #${idx + 1}`}>
                                                    {d.file_name ?? d.document_type ?? `Tài liệu #${idx + 1}`}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                    {d.document_type && (
                                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">folder</span>{d.document_type}</span>
                                                    )}
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">database</span>{fmtFileSize(d.file_size)}</span>
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span>{fmtDatetime(d.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
                                            {d.file_url && (
                                                <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-500/20 text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors" title="Mở tài liệu">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>open_in_new</span>
                                                </a>
                                            )}
                                            <button onClick={() => handleDeleteDoc(d.document_id)} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors" title="Xóa tài liệu">
                                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ====== TAB: NGƯỜI THÂN ====== */}
                        {activeTab === "relations" && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white uppercase tracking-wider">Người thân / Liên hệ khẩn cấp</h3>
                                    <button
                                        onClick={() => setShowAddRelation(v => !v)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                                        Thêm người thân
                                    </button>
                                </div>

                                {showAddRelation && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-500/20 space-y-3">
                                        <h4 className="text-sm font-semibold text-[#121417] dark:text-white">Thêm người thân mới</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-[#687582] mb-1 block">Họ tên *</label>
                                                <input className={inputCls} aria-label="Họ tên người thân" placeholder="Nguyễn Thị B" value={relationForm.full_name} onChange={e => setRelationForm(p => ({ ...p, full_name: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs text-[#687582] mb-1 block">Số điện thoại *</label>
                                                <input className={inputCls} aria-label="Số điện thoại người thân" placeholder="0901234567" value={relationForm.phone_number} onChange={e => setRelationForm(p => ({ ...p, phone_number: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs text-[#687582] mb-1 block">Quan hệ</label>
                                                <select className={inputCls} aria-label="Quan hệ với bệnh nhân" value={relationForm.relationship} onChange={e => setRelationForm(p => ({ ...p, relationship: e.target.value as any }))}>
                                                    <option value="PARENT">Phụ huynh</option>
                                                    <option value="SPOUSE">Vợ/Chồng</option>
                                                    <option value="CHILD">Con</option>
                                                    <option value="SIBLING">Anh/Chị/Em</option>
                                                    <option value="OTHER">Khác</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2 pt-4">
                                                <input type="checkbox" id="chk-emergency" checked={relationForm.is_emergency} onChange={e => setRelationForm(p => ({ ...p, is_emergency: e.target.checked }))} className="w-4 h-4 accent-[#3C81C6]" />
                                                <label htmlFor="chk-emergency" className="text-sm text-[#121417] dark:text-white">Liên hệ khẩn cấp</label>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => setShowAddRelation(false)} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-[#687582] hover:bg-gray-50">Hủy</button>
                                            <button onClick={handleAddRelation} disabled={savingRelation || !relationForm.full_name || !relationForm.phone_number} className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                                                {savingRelation && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                                Lưu
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {loadingRelations && <LoadingSpinner />}
                                {!loadingRelations && errorRelations && <ErrorMsg msg={errorRelations} onRetry={fetchRelations} />}
                                {!loadingRelations && !errorRelations && relations.length === 0 && (
                                    <EmptyState icon="family_restroom" text="Chưa có thông tin người thân" />
                                )}
                                {!loadingRelations && relations.map((r) => (
                                    <div key={r.relation_id || r.patient_contacts_id} className="group p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121417] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-violet-500/30 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                <span className="material-symbols-outlined text-violet-600" style={{ fontSize: "24px" }}>person</span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors">
                                                        {r.full_name || r.contact_name || "Chưa cập nhật"}
                                                    </h4>
                                                    {r.is_emergency && (
                                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">Khẩn cấp</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[16px]">call</span>
                                                        <span>{r.phone_number || "—"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[16px]">group</span>
                                                        <span>{relLabel((r.relationship || r.relation_type_code || "OTHER") as any)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteRelation(r.relation_id || r.patient_contacts_id)} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors self-end md:self-auto" title="Xóa người thân">
                                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for Medical History Details */}
            {selectedHistory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#121417] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100 dark:border-gray-800">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Chi tiết lượt khám
                                    {selectedHistory.status && (
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${selectedHistory.status === "COMPLETED" || selectedHistory.status === "CLOSED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                            {selectedHistory.status === "COMPLETED" ? "Hoàn thành" : selectedHistory.status === "CLOSED" ? "Đã đóng" : selectedHistory.status === "IN_PROGRESS" ? "Đang khám" : selectedHistory.status}
                                        </span>
                                    )}
                                    {selectedHistory.encounter_type && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 uppercase">
                                            {selectedHistory.encounter_type === "OUTPATIENT" ? "Ngoại trú" : selectedHistory.encounter_type === "INPATIENT" ? "Nội trú" : selectedHistory.encounter_type === "EMERGENCY" ? "Cấp cứu" : selectedHistory.encounter_type}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">{fmtDatetime(selectedHistory.start_time ?? selectedHistory.created_at)}</p>
                            </div>
                            <button onClick={() => { setSelectedHistory(null); setEncounterDetail(null); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {loadingEncounterDetail ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="w-8 h-8 border-4 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-gray-500">Đang tải chi tiết...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Thông tin cơ bản */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="space-y-0.5"><p className="text-[11px] text-gray-400 uppercase">Bác sĩ</p><p className="text-sm font-medium text-gray-900 dark:text-white">{selectedHistory.doctor_title ? `${selectedHistory.doctor_title} ` : ""}{selectedHistory.doctor_name || "—"}</p></div>
                                        <div className="space-y-0.5"><p className="text-[11px] text-gray-400 uppercase">Chuyên khoa</p><p className="text-sm font-medium text-gray-900 dark:text-white">{selectedHistory.specialty_name || "—"}</p></div>
                                        <div className="space-y-0.5"><p className="text-[11px] text-gray-400 uppercase">Phòng khám</p><p className="text-sm font-medium text-gray-900 dark:text-white">{selectedHistory.room_name || "—"}</p></div>
                                        <div className="space-y-0.5"><p className="text-[11px] text-gray-400 uppercase">Thời gian</p><p className="text-sm font-medium text-gray-900 dark:text-white">{fmtDatetime(selectedHistory.start_time ?? selectedHistory.created_at)}</p></div>
                                    </div>

                                    {/* Sinh hiệu */}
                                    {encounterDetail?.clinical_examination && (() => {
                                        const ce = encounterDetail.clinical_examination;
                                        const hasVitals = ce.pulse || ce.blood_pressure_systolic || ce.temperature || ce.spo2 || ce.weight || ce.height;
                                        if (!hasVitals) return null;
                                        return (
                                            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 space-y-2">
                                                <p className="text-xs font-semibold text-[#3C81C6] uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[16px]">monitor_heart</span> Sinh hiệu
                                                </p>
                                                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                                    {ce.pulse && <div><p className="text-[11px] text-gray-400">Mạch</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{ce.pulse} <span className="text-[10px] text-gray-400">bpm</span></p></div>}
                                                    {(ce.blood_pressure_systolic || ce.blood_pressure_diastolic) && <div><p className="text-[11px] text-gray-400">Huyết áp</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{ce.blood_pressure_systolic || "—"}/{ce.blood_pressure_diastolic || "—"} <span className="text-[10px] text-gray-400">mmHg</span></p></div>}
                                                    {ce.temperature && <div><p className="text-[11px] text-gray-400">Nhiệt độ</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{ce.temperature}°C</p></div>}
                                                    {ce.respiratory_rate && <div><p className="text-[11px] text-gray-400">Nhịp thở</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{ce.respiratory_rate} <span className="text-[10px] text-gray-400">l/p</span></p></div>}
                                                    {ce.spo2 && <div><p className="text-[11px] text-gray-400">SpO2</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{ce.spo2}%</p></div>}
                                                    {ce.weight && <div><p className="text-[11px] text-gray-400">Cân nặng</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{ce.weight} kg</p></div>}
                                                    {ce.height && <div><p className="text-[11px] text-gray-400">Chiều cao</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{ce.height} cm</p></div>}
                                                    {ce.bmi && <div><p className="text-[11px] text-gray-400">BMI</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{ce.bmi}</p></div>}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Khám lâm sàng */}
                                    {encounterDetail?.clinical_examination && (() => {
                                        const ce = encounterDetail.clinical_examination;
                                        if (!ce.chief_complaint && !ce.medical_history_notes && !ce.physical_examination) return null;
                                        return (
                                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[16px]">clinical_notes</span> Khám lâm sàng
                                                </p>
                                                {ce.chief_complaint && <div><p className="text-[11px] text-gray-400 mb-0.5">Lý do khám / Triệu chứng chính</p><p className="text-sm text-gray-900 dark:text-white">{ce.chief_complaint}</p></div>}
                                                {ce.medical_history_notes && <div className="pt-2 border-t border-gray-200 dark:border-gray-700"><p className="text-[11px] text-gray-400 mb-0.5">Tiền sử bệnh</p><p className="text-sm text-gray-900 dark:text-white">{ce.medical_history_notes}</p></div>}
                                                {ce.physical_examination && <div className="pt-2 border-t border-gray-200 dark:border-gray-700"><p className="text-[11px] text-gray-400 mb-0.5">Khám thực thể</p><p className="text-sm text-gray-900 dark:text-white">{ce.physical_examination}</p></div>}
                                            </div>
                                        );
                                    })()}

                                    {/* Fallback: nếu chưa có encounterDetail, hiện thông tin cơ bản từ selectedHistory */}
                                    {!encounterDetail && (selectedHistory.chief_complaint || selectedHistory.primary_diagnosis) && (
                                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
                                            {selectedHistory.chief_complaint && <div><p className="text-[11px] text-gray-400 uppercase mb-0.5">Triệu chứng chính</p><p className="text-sm text-gray-900 dark:text-white">{selectedHistory.chief_complaint}</p></div>}
                                            {selectedHistory.primary_diagnosis && <div className="pt-2 border-t border-gray-200 dark:border-gray-700"><p className="text-[11px] text-gray-400 uppercase mb-0.5">Chẩn đoán chính</p><p className="text-sm font-medium text-[#3C81C6]">{selectedHistory.primary_diagnosis}</p></div>}
                                        </div>
                                    )}

                                    {/* Chẩn đoán ICD-10 */}
                                    {encounterDetail?.diagnoses && encounterDetail.diagnoses.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px]">diagnosis</span> Chẩn đoán ({encounterDetail.diagnoses.length})
                                            </p>
                                            <div className="space-y-2">
                                                {encounterDetail.diagnoses.map((d: any, i: number) => (
                                                    <div key={d.encounter_diagnoses_id || i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${d.diagnosis_type === "PRIMARY" ? "bg-red-100 text-red-700" : d.diagnosis_type === "FINAL" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                                                            {d.diagnosis_type === "PRIMARY" ? "Chính" : d.diagnosis_type === "FINAL" ? "Cuối cùng" : d.diagnosis_type === "SECONDARY" ? "Phụ" : d.diagnosis_type || "—"}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{d.diagnosis_name}</p>
                                                            <p className="text-xs text-gray-500">ICD-10: <span className="font-mono font-semibold">{d.icd10_code}</span></p>
                                                            {d.notes && <p className="text-xs text-gray-400 mt-0.5">{d.notes}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Đơn thuốc */}
                                    {encounterDetail?.prescription && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px]">medication</span> Đơn thuốc — {encounterDetail.prescription.prescription_code || ""}
                                                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${encounterDetail.prescription.status === "DISPENSED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {encounterDetail.prescription.status === "DISPENSED" ? "Đã cấp" : encounterDetail.prescription.status || "—"}
                                                </span>
                                            </p>
                                            {encounterDetail.prescription.clinical_diagnosis && (
                                                <p className="text-xs text-gray-500">Chẩn đoán: <span className="text-gray-700 dark:text-gray-300">{encounterDetail.prescription.clinical_diagnosis}</span></p>
                                            )}
                                            {encounterDetail.prescription.details && encounterDetail.prescription.details.length > 0 && (
                                                <div className="space-y-1.5">
                                                    {encounterDetail.prescription.details.map((drug: any, i: number) => (
                                                        <div key={i} className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-teal-50/30 transition-colors">
                                                            <div className="flex justify-between items-start">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{drug.drug_name}</p>
                                                                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{drug.quantity} {drug.unit || "viên"}</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
                                                                {drug.dosage && <span>Liều: <span className="text-gray-700 dark:text-gray-300">{drug.dosage}</span></span>}
                                                                {drug.frequency && <span>Tần suất: <span className="text-gray-700 dark:text-gray-300">{drug.frequency}</span></span>}
                                                                {drug.duration_days && <span>Số ngày: <span className="text-gray-700 dark:text-gray-300">{drug.duration_days} ngày</span></span>}
                                                            </div>
                                                            {drug.usage_instruction && <p className="text-xs text-gray-400 mt-1">HD: {drug.usage_instruction}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Chỉ định CLS */}
                                    {encounterDetail?.medical_orders && encounterDetail.medical_orders.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px]">science</span> Chỉ định CLS ({encounterDetail.medical_orders.length})
                                            </p>
                                            <div className="space-y-1.5">
                                                {encounterDetail.medical_orders.map((o: any, i: number) => (
                                                    <div key={o.medical_orders_id || i} className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{o.service_name}</p>
                                                            <p className="text-xs text-gray-500">{o.service_code}{o.clinical_indicator ? ` · ${o.clinical_indicator}` : ""}</p>
                                                            {o.result_summary && <p className="text-xs text-emerald-600 mt-0.5">KQ: {o.result_summary}</p>}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${o.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : o.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                                                                {o.status === "COMPLETED" ? "Có KQ" : o.status === "PENDING" ? "Chờ KQ" : o.status || "—"}
                                                            </span>
                                                            {o.priority === "URGENT" && <p className="text-[10px] text-red-500 font-medium mt-0.5">Khẩn cấp</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Trường hợp không có dữ liệu chi tiết */}
                                    {!loadingEncounterDetail && !encounterDetail && (
                                        <div className="text-center py-6 text-sm text-gray-400">Không tải được chi tiết lượt khám này.</div>
                                    )}
                                </>
                            )}
                        </div>
                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end shrink-0">
                            <button 
                                onClick={() => { setSelectedHistory(null); setEncounterDetail(null); }}
                                className="px-5 py-2.5 text-sm font-medium rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Prescription Details */}
            {selectedPrescription && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-[#121417] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Chi tiết đơn thuốc
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${selectedPrescription.status === "DISPENSED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                        {selectedPrescription.status === "DISPENSED" ? "Đã cấp phát" : selectedPrescription.status || "Chưa xác định"}
                                    </span>
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Mã đơn: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedPrescription.prescription_code || selectedPrescription.id || "—"}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => { setSelectedPrescription(null); setPrescriptionDetails([]); }}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Bác sĩ kê đơn</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedPrescription.doctor_name || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Ngày kê</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{fmtDatetime(selectedPrescription.created_at ?? selectedPrescription.prescribed_at ?? selectedPrescription.prescription_date)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500">Chẩn đoán / Ghi chú</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedPrescription.clinical_diagnosis || selectedPrescription.doctor_notes || selectedPrescription.diagnosis || "Không có ghi chú"}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Danh sách thuốc ({prescriptionDetails.length})</h4>
                                {loadingPrescriptionDetails ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : prescriptionDetails.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-500">Không có dữ liệu chi tiết thuốc</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {prescriptionDetails.map((detail, idx) => (
                                            <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-teal-100 dark:hover:border-teal-900/50 hover:bg-teal-50/30 transition-all">
                                                <div className="flex justify-between items-start gap-4 mb-2">
                                                    <div>
                                                        <h5 className="font-semibold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs">{idx + 1}</span>
                                                            {detail.brand_name || detail.drug_name || "Thuốc không tên"}
                                                        </h5>
                                                        <p className="text-xs text-gray-500 mt-0.5">{detail.active_ingredients || "—"}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="inline-flex items-center justify-center px-2.5 py-1 font-bold text-teal-700 bg-teal-50 rounded-lg whitespace-nowrap">
                                                            {detail.quantity} {detail.dispensing_unit || detail.unit || "viên"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mt-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm">
                                                    <div>
                                                        <span className="text-gray-500 block text-xs">Liều dùng</span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{detail.dosage || "—"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block text-xs">Tần suất</span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{detail.frequency || "—"}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-gray-500 block text-xs">Cách dùng</span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{detail.usage_instruction || detail.route_of_administration || detail.notes || "—"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end shrink-0">
                            <button 
                                onClick={() => { setSelectedPrescription(null); setPrescriptionDetails([]); }}
                                className="px-5 py-2.5 text-sm font-medium rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== Shared sub-components =====
const inputCls = "w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex items-start gap-2">
            <span className="text-[13px] text-[#687582] w-32 flex-shrink-0">{label}:</span>
            <span className="text-[13px] font-medium text-[#121417] dark:text-white break-words w-full">{value || "—"}</span>
        </div>
    );
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm text-[#687582] mb-1">{label}</label>
            {children}
        </div>
    );
}

function relLabel(rel: RelationType): string {
    const map: Record<RelationType, string> = {
        PARENT: "Phụ huynh",
        SPOUSE: "Vợ/Chồng",
        CHILD: "Con",
        SIBLING: "Anh/Chị/Em",
        OTHER: "Khác",
    };
    return map[rel] ?? rel;
}
