"use client";

import { useState, useEffect, useRef } from "react";
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
    return Array.isArray(patient?.avatar_url) ? patient.avatar_url[0]?.url || "" : "";
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
    { key: "contact", label: "Liên hệ", icon: "call" },
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

    // Contact tab
    const [contacts, setContacts] = useState<PatientContact[]>([]);
    const [loadingContact, setLoadingContact] = useState(false);
    const [errorContact, setErrorContact] = useState<string | null>(null);
    const [showAddContact, setShowAddContact] = useState(false);
    const [contactForm, setContactForm] = useState({ phone_number: "", email: "", street_address: "", ward: "", province: "" });
    const [savingContact, setSavingContact] = useState(false);

    // Medical history
    const [history, setHistory] = useState<MedicalRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [errorHistory, setErrorHistory] = useState<string | null>(null);

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
        if (patientId) fetchPatient();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId]);

    // ===== Lazy load tabs =====
    const handleTabChange = (tabKey: string) => {
        setActiveTab(tabKey);
        if (loadedTabs.current.has(tabKey)) return;
        loadedTabs.current.add(tabKey);

        if (tabKey === "insurance") fetchInsurances();
        if (tabKey === "contact") fetchContacts();
        if (tabKey === "history") fetchHistory();
        if (tabKey === "prescriptions") fetchPrescriptions();
        if (tabKey === "documents") fetchDocuments();
        if (tabKey === "relations") fetchRelations();
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

    // ===== Contacts =====
    const fetchContacts = async () => {
        setLoadingContact(true);
        setErrorContact(null);
        try {
            const res = await getContacts(patientId);
            if (res.success) setContacts(res.data ?? []);
            else setErrorContact(res.message ?? "Lỗi tải liên hệ");
        } catch {
            setErrorContact("Không thể tải thông tin liên hệ");
        } finally {
            setLoadingContact(false);
        }
    };

    const handleAddContact = async () => {
        if (!contactForm.phone_number) return;
        setSavingContact(true);
        try {
            const res = await addContact(patientId, {
                phone_number: contactForm.phone_number,
                email: contactForm.email || undefined,
                street_address: contactForm.street_address || undefined,
                ward: contactForm.ward || undefined,
                province: contactForm.province || undefined,
            });
            if (res.success) {
                setShowAddContact(false);
                setContactForm({ phone_number: "", email: "", street_address: "", ward: "", province: "" });
                fetchContacts();
            } else {
                alert(res.message || "Thêm liên hệ thất bại");
            }
        } catch {
            alert("Thêm liên hệ thất bại");
        } finally {
            setSavingContact(false);
        }
    };

    const handleDeleteContact = async (contactId: string) => {
        if (!confirm("Xóa liên hệ này?")) return;
        const res = await deleteContact(patientId, contactId);
        if (res.success) fetchContacts();
        else alert(res.message || "Xóa thất bại");
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
            const res = await updatePatient(patient.patient_id, {
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
    const primaryContact = patient.contact ?? contacts[0];

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
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
                                    <img src={getPrimaryAvatarUrl(patient)} alt={patient.full_name} className="h-full w-full object-cover" />
                                ) : (
                                    patient.full_name.charAt(0)
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[#121417] dark:text-white">{patient.full_name}</h1>
                                <p className="text-sm text-[#687582] mt-0.5">
                                    Mã BN: <span className="font-mono text-[#3C81C6] font-medium">{patient.patient_code ?? patient.patient_id}</span>
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
                    {[
                        { icon: "call", label: "Điện thoại", value: primaryContact?.phone_number ?? "—", color: "blue" },
                        { icon: "badge", label: "CCCD/CMND", value: patient.identity_number ?? "—", color: "blue" },
                        { icon: "bloodtype", label: "Nhóm máu", value: patient.blood_type ?? "—", color: "red" },
                        { icon: "warning", label: "Dị ứng", value: patient.allergies || "Không có", color: patient.allergies ? "amber" : "blue" },
                        { icon: "health_and_safety", label: "Bảo hiểm", value: patient.has_insurance ? "Có BHYT" : "Không", color: patient.has_insurance ? "emerald" : "blue" },
                        { icon: "calendar_today", label: "Ngày đăng ký", value: fmtDatetime(patient.created_at), color: "blue" },
                    ].map((item) => {
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
                    <div className="flex border-b border-[#dde0e4] dark:border-[#2d353e] overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? "border-[#3C81C6] text-[#3C81C6]"
                                        : "border-transparent text-[#687582] hover:text-[#121417] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/30"
                                }`}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
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
                                            <InfoField label="Giới tính">
                                                <select className={inputCls} value={editForm.gender ?? ""} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value as any }))}>
                                                    <option value="MALE">Nam</option>
                                                    <option value="FEMALE">Nữ</option>
                                                    <option value="OTHER">Khác</option>
                                                </select>
                                            </InfoField>
                                            <InfoField label="Loại giấy tờ">
                                                <select className={inputCls} value={editForm.identity_type ?? ""} onChange={e => setEditForm(p => ({ ...p, identity_type: e.target.value as any }))}>
                                                    <option value="">-- Chọn --</option>
                                                    <option value="CCCD">CCCD</option>
                                                    <option value="PASSPORT">Hộ chiếu</option>
                                                    <option value="OTHER">Khác</option>
                                                </select>
                                            </InfoField>
                                            <InfoField label="Số giấy tờ">
                                                <input className={inputCls} value={editForm.identity_number ?? ""} onChange={e => setEditForm(p => ({ ...p, identity_number: e.target.value }))} />
                                            </InfoField>
                                            <InfoField label="Quốc tịch">
                                                <input className={inputCls} value={editForm.nationality ?? ""} onChange={e => setEditForm(p => ({ ...p, nationality: e.target.value }))} />
                                            </InfoField>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {[
                                                { l: "Họ và tên", v: patient.full_name },
                                                { l: "Ngày sinh", v: fmtDob(patient.date_of_birth) },
                                                { l: "Tuổi", v: `${age} tuổi` },
                                                { l: "Giới tính", v: genderLabel(patient.gender) },
                                                { l: "Loại giấy tờ", v: patient.identity_type ?? "—" },
                                                { l: "Số giấy tờ", v: patient.identity_number ?? "—" },
                                                { l: "Quốc tịch", v: patient.nationality ?? "—" },
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
                                            <InfoField label="Nhóm máu">
                                                <select className={inputCls} value={editForm.blood_type ?? ""} onChange={e => setEditForm(p => ({ ...p, blood_type: e.target.value }))}>
                                                    <option value="">-- Chưa rõ --</option>
                                                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                                </select>
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
                                            <InfoRow label="Nhóm máu" value={patient.blood_type ?? "—"} />
                                            <div className="flex items-start gap-2">
                                                <span className="text-sm text-[#687582] w-36 flex-shrink-0">Dị ứng:</span>
                                                <span className={`text-sm font-medium ${patient.allergies ? "text-red-600" : "text-[#121417] dark:text-white"}`}>
                                                    {patient.allergies || "Không có"}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="text-sm text-[#687582] w-36 flex-shrink-0">Bệnh mãn tính:</span>
                                                <span className="text-sm font-medium text-[#121417] dark:text-white">{patient.chronic_diseases || "Không có"}</span>
                                            </div>
                                            <InfoRow label="Trạng thái" value={st.label} />
                                            <InfoRow label="Ngày đăng ký" value={fmtDatetime(patient.created_at)} />
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
                                                <div key={ins.insurance_id ?? idx} className="bg-gray-50 dark:bg-[#171c23] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-[20px] text-[#3C81C6]">verified_user</span>
                                                            <span className="text-sm font-semibold text-[#121417] dark:text-white">{ins.provider_name ?? ins.insurance_provider ?? "Nhà cung cấp"}</span>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                                                            {isActive ? "Đang hoạt động" : "Hết hạn"}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <InfoRow label="Số thẻ BHYT" value={ins.card_number ?? ins.insurance_number ?? "—"} />
                                                        <InfoRow label="Loại bảo hiểm" value={ins.coverage_type ?? ins.insurance_type ?? "—"} />
                                                        <InfoRow label="Ngày hiệu lực" value={ins.effective_date ? fmtDob(ins.effective_date) : "—"} />
                                                        <InfoRow label="Ngày hết hạn" value={ins.expiry_date ? fmtDob(ins.expiry_date) : "—"} />
                                                        {ins.notes && <InfoRow label="Ghi chú" value={ins.notes} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ====== TAB: LIÊN HỆ ====== */}
                        {activeTab === "contact" && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-[#121417] dark:text-white uppercase tracking-wider">Thông tin liên hệ</h3>
                                    <button
                                        onClick={() => setShowAddContact(v => !v)}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        Thêm liên hệ
                                    </button>
                                </div>

                                {/* Add contact form */}
                                {showAddContact && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-500/20 space-y-3">
                                        <h4 className="text-sm font-semibold text-[#121417] dark:text-white">Thêm liên hệ mới</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-[#687582] mb-1 block">Số điện thoại *</label>
                                                <input className={inputCls} aria-label="Số điện thoại" placeholder="0901234567" value={contactForm.phone_number} onChange={e => setContactForm(p => ({ ...p, phone_number: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs text-[#687582] mb-1 block">Email</label>
                                                <input className={inputCls} aria-label="Email" placeholder="email@example.com" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-[#687582] mb-1 block">Địa chỉ</label>
                                                <input className={inputCls} aria-label="Địa chỉ" placeholder="Số nhà, đường..." value={contactForm.street_address} onChange={e => setContactForm(p => ({ ...p, street_address: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs text-[#687582] mb-1 block">Phường/Xã</label>
                                                <input className={inputCls} aria-label="Phường/Xã" value={contactForm.ward} onChange={e => setContactForm(p => ({ ...p, ward: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="text-xs text-[#687582] mb-1 block">Tỉnh/Thành</label>
                                                <input className={inputCls} aria-label="Tỉnh/Thành" value={contactForm.province} onChange={e => setContactForm(p => ({ ...p, province: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => setShowAddContact(false)} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-[#687582] hover:bg-gray-50">Hủy</button>
                                            <button onClick={handleAddContact} disabled={savingContact || !contactForm.phone_number} className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                                                {savingContact && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                                Lưu
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {loadingContact && <LoadingSpinner />}
                                {!loadingContact && errorContact && <ErrorMsg msg={errorContact} onRetry={fetchContacts} />}
                                {!loadingContact && !errorContact && contacts.length === 0 && (
                                    <EmptyState icon="call" text="Chưa có thông tin liên hệ" />
                                )}
                                {!loadingContact && contacts.map((c) => (
                                    <div key={c.contact_id} className="p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] flex items-start justify-between gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-[#121417] dark:text-white">{c.phone_number}</p>
                                                {c.is_primary && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 font-medium">Chính</span>
                                                )}
                                            </div>
                                            {c.email && <p className="text-xs text-[#687582]">{c.email}</p>}
                                            {c.street_address && <p className="text-xs text-[#687582]">{[c.street_address, c.ward, c.province].filter(Boolean).join(", ")}</p>}
                                        </div>
                                        {!c.is_primary && (
                                            <button onClick={() => handleDeleteContact(c.contact_id)} aria-label="Xóa liên hệ" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 hover:text-red-600 transition-colors flex-shrink-0" title="Xóa">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
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
                                {!loadingHistory && history.map((v, idx) => (
                                    <div key={v.encounter_id ?? v.record_id ?? idx} className="flex items-center gap-4 p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-blue-600" style={{ fontSize: "20px" }}>stethoscope</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">{v.diagnosis ?? v.chief_complaint ?? "Khám bệnh"}</p>
                                            <p className="text-xs text-[#687582]">
                                                {[v.doctor_name, v.department_name].filter(Boolean).join(" · ")}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm text-[#121417] dark:text-white">{fmtDatetime(v.visit_date ?? v.created_at)}</p>
                                            {v.status && (
                                                <span className={`text-xs ${v.status === "COMPLETED" || v.status === "completed" ? "text-emerald-600" : "text-amber-600"}`}>
                                                    {v.status === "COMPLETED" || v.status === "completed" ? "Hoàn thành" : v.status}
                                                </span>
                                            )}
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
                                    <div key={rx.prescription_id ? `${rx.prescription_id}-${idx}` : `rx-${idx}`} className="flex items-center gap-4 p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-teal-600" style={{ fontSize: "20px" }}>medication</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">
                                                {rx.medicines ?? rx.drug_name ?? rx.prescription_id ?? `Đơn #${idx + 1}`}
                                            </p>
                                            <p className="text-xs text-[#687582]">
                                                {rx.doctor_name ?? ""}{rx.encounter_id ? ` · Mã: ${rx.encounter_id}` : ""}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm text-[#121417] dark:text-white">{fmtDatetime(rx.created_at ?? rx.prescription_date)}</p>
                                            {rx.status && (
                                                <span className={`text-xs ${rx.status === "DISPENSED" || rx.status === "dispensed" ? "text-emerald-600" : "text-amber-600"}`}>
                                                    {rx.status === "DISPENSED" || rx.status === "dispensed" ? "Đã cấp phát" : rx.status}
                                                </span>
                                            )}
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
                                    <div key={d.document_id ?? idx} className="flex items-center gap-4 p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-orange-600" style={{ fontSize: "20px" }}>description</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#121417] dark:text-white truncate">{d.file_name ?? d.document_type ?? `Tài liệu #${idx + 1}`}</p>
                                            <p className="text-xs text-[#687582]">{d.document_type ?? ""} · {fmtFileSize(d.file_size)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-sm text-[#687582]">{fmtDatetime(d.created_at)}</span>
                                            {d.file_url && (
                                                <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-[#687582] hover:text-[#3C81C6] transition-colors" title="Tải xuống">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
                                                </a>
                                            )}
                                            <button onClick={() => handleDeleteDoc(d.document_id)} aria-label="Xóa tài liệu" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-[#687582] hover:text-red-500 transition-colors" title="Xóa">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
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
                                                <select className={inputCls} aria-label="Quan hệ với bệnh nhân" value={relationForm.relationship} onChange={e => setRelationForm(p => ({ ...p, relationship: e.target.value as RelationType }))}>
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
                                    <div key={r.relation_id} className="p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-violet-600" style={{ fontSize: "20px" }}>person</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-[#121417] dark:text-white">{r.full_name || r.contact_name || "Chưa cập nhật"}</p>
                                                    {r.is_emergency && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 dark:bg-red-500/20 text-red-600 font-medium">Khẩn cấp</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#687582]">{r.phone_number} · {relLabel(r.relationship || "OTHER")}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteRelation(r.relation_id || r.patient_contacts_id)} aria-label="Xóa người thân" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-[#687582] hover:text-red-500 transition-colors flex-shrink-0" title="Xóa">
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== Shared sub-components =====
const inputCls = "w-full py-2 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex items-start gap-2">
            <span className="text-sm text-[#687582] w-36 flex-shrink-0">{label}:</span>
            <span className="text-sm font-medium text-[#121417] dark:text-white">{value || "—"}</span>
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
