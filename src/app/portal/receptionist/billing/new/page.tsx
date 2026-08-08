"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { billingService } from "@/services/billingService";
import { getPortalPath } from "@/utils/portalNavigation";
import { unwrap, unwrapList } from "@/api/response";
import axiosClient from "@/api/axiosClient";

// ─── Types ──────────────────────────────────────────────────────────────────
interface PatientResult {
    id: string;
    fullName: string;
    patientCode?: string;
    phone?: string;
    insuranceNumber?: string;
}

interface Encounter {
    id: string;
    encounterNumber?: string;
    createdAt?: string;
    status?: string;
    doctorName?: string;
    department?: string;
}

interface ServiceItem {
    name: string;
    price: number;
    quantity: number;
    serviceId?: string;
    category?: string;
}

interface PricingPolicy {
    id: string;
    name: string;
    discountPercent?: number;
    discountAmount?: number;
}

const PAYMENT_METHODS = ["Tiền mặt", "Chuyển khoản", "Thẻ tín dụng", "Ví điện tử", "QR SePay"];

const fmt = (n: number) => (n || 0).toLocaleString("vi-VN") + "đ";

export default function NewBillingPage() {
    const router = useRouter();
    const pathname = usePathname();

    // ── Patient search ──────────────────────────────────────────────────────
    const [patientQuery, setPatientQuery]       = useState("");
    const [patientResults, setPatientResults]   = useState<PatientResult[]>([]);
    const [searchingPatient, setSearchingPatient] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ── Encounter ────────────────────────────────────────────────────────────
    const [encounters, setEncounters]   = useState<Encounter[]>([]);
    const [selectedEncounter, setSelectedEncounter] = useState<string>("");
    const [loadingEncounters, setLoadingEncounters] = useState(false);

    // ── Catalog / Services ───────────────────────────────────────────────────
    const [catalog, setCatalog]           = useState<ServiceItem[]>([]);
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [catalogCategory, setCatalogCategory] = useState("all");
    const [loadingCatalog, setLoadingCatalog] = useState(false);

    // ── Pricing policies ─────────────────────────────────────────────────────
    const [policies, setPolicies]               = useState<PricingPolicy[]>([]);
    const [selectedPolicy, setSelectedPolicy]   = useState<string>("");

    // ── Form ─────────────────────────────────────────────────────────────────
    const [fd, setFd] = useState({
        insuranceNumber: "",
        insurancePercent: "80",
        paymentMethod: "Tiền mặt",
        note: "",
    });
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState<string | null>(null);

    // ── Load catalog on mount ─────────────────────────────────────────────────
    useEffect(() => {
        setLoadingCatalog(true);
        billingService.getCatalog()
            .then(res => {
                const { data } = unwrapList<any>(res);
                if (data.length > 0) {
                    const mapped: ServiceItem[] = data.map((s: any) => ({
                        serviceId: s.id ?? s._id,
                        name:      s.name ?? s.serviceName ?? "",
                        price:     Number(s.price ?? s.unitPrice ?? 0),
                        quantity:  1,
                        category:  s.category ?? s.categoryName ?? "Khác",
                    }));
                    setCatalog(mapped);
                }
            })
            .catch(() => { /* keep fallback */ })
            .finally(() => setLoadingCatalog(false));

        billingService.listActivePolicies()
            .then(res => {
                const { data } = unwrapList<PricingPolicy>(res);
                if (data.length > 0) setPolicies(data);
            })
            .catch(() => { /* no policies */ });
    }, []);

    // ── Patient search with debounce ──────────────────────────────────────────
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (!patientQuery || patientQuery.length < 2) { setPatientResults([]); return; }
        searchTimeoutRef.current = setTimeout(async () => {
            setSearchingPatient(true);
            try {
                const res = await axiosClient.get('/api/patients/search', { params: { q: patientQuery, limit: 8 } });
                const { data } = unwrapList<PatientResult>(res);
                setPatientResults(data);
            } catch {
                setPatientResults([]);
            } finally {
                setSearchingPatient(false);
            }
        }, 400);
    }, [patientQuery]);

    // ── Load encounters when patient selected ─────────────────────────────────
    useEffect(() => {
        if (!selectedPatient) { setEncounters([]); setSelectedEncounter(""); return; }
        setLoadingEncounters(true);
        axiosClient.get(`/api/encounters/by-patient/${selectedPatient.id}`, { params: { limit: 20, status: 'completed,active' } })
            .then(res => {
                const { data } = unwrapList<Encounter>(res);
                setEncounters(data);
                if (data.length > 0) setSelectedEncounter(data[0].id);
            })
            .catch(() => setEncounters([]))
            .finally(() => setLoadingEncounters(false));
    }, [selectedPatient]);

    // ── Load items from encounter ─────────────────────────────────────────────
    const loadEncounterItems = async (encounterId: string) => {
        try {
            const res = await billingService.getByEncounter(encounterId);
            const inv = unwrap<any>(res);
            if (inv?.items?.length) {
                // Map encounter items to catalog indices or add as custom
                const mapped: ServiceItem[] = inv.items.map((item: any) => ({
                    name:     item.name ?? item.serviceName ?? "",
                    price:    Number(item.price ?? item.unitPrice ?? 0),
                    quantity: Number(item.quantity ?? 1),
                    serviceId: item.serviceId,
                    category: item.category ?? "Dịch vụ",
                }));
                setCatalog(prev => {
                    const existing = prev.map(s => s.name);
                    const newItems = mapped.filter(m => !existing.includes(m.name));
                    return [...prev, ...newItems];
                });
            }
        } catch { /* ignore */ }
    };

    const handleEncounterChange = (id: string) => {
        setSelectedEncounter(id);
        if (id) loadEncounterItems(id);
    };

    // ── Service toggle ────────────────────────────────────────────────────────
    const toggleService = (idx: number) => {
        setSelectedServices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };

    // ── Calculations ──────────────────────────────────────────────────────────
    const subtotal = selectedServices.reduce((sum, idx) => sum + catalog[idx].price * catalog[idx].quantity, 0);
    const insuranceDiscount = fd.insuranceNumber
        ? Math.round(subtotal * (Number(fd.insurancePercent) || 0) / 100)
        : 0;

    const policyObj = policies.find(p => p.id === selectedPolicy);
    const policyDiscount = policyObj
        ? (policyObj.discountPercent ? Math.round(subtotal * policyObj.discountPercent / 100) : (policyObj.discountAmount ?? 0))
        : 0;

    const total = Math.max(0, subtotal - insuranceDiscount - policyDiscount);

    const categories = ["all", ...Array.from(new Set(catalog.map(s => s.category ?? "Khác")))];
    const filteredCatalog = catalogCategory === "all"
        ? catalog
        : catalog.filter(s => s.category === catalogCategory);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) { setError("Vui lòng chọn bệnh nhân."); return; }
        if (selectedServices.length === 0) { setError("Vui lòng chọn ít nhất một dịch vụ."); return; }
        setSaving(true);
        setError(null);
        try {
            const payload = {
                patientId:       selectedPatient.id,
                patientName:     selectedPatient.fullName,
                patientCode:     selectedPatient.patientCode,
                phone:           selectedPatient.phone,
                encounterId:     selectedEncounter || undefined,
                insuranceNumber: fd.insuranceNumber || undefined,
                insurancePercent: fd.insuranceNumber ? Number(fd.insurancePercent) : undefined,
                policyId:        selectedPolicy || undefined,
                paymentMethod:   fd.paymentMethod,
                items:           selectedServices.map(idx => ({
                    name:     catalog[idx].name,
                    price:    catalog[idx].price,
                    quantity: catalog[idx].quantity,
                    serviceId: catalog[idx].serviceId,
                    total:    catalog[idx].price * catalog[idx].quantity,
                })),
                subtotal,
                insuranceDiscount,
                policyDiscount,
                total,
                note: fd.note || undefined,
            };
            await billingService.createInvoice(payload);
            router.push(getPortalPath("/portal/receptionist/billing", pathname));
        } catch {
            setError("Tạo hóa đơn thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6 md:p-8">
            <h1 className="sr-only">Tạo hóa đơn mới</h1>
            {/* Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/portal/receptionist/billing" className="hover:text-[#3C81C6]">Thanh toán</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Tạo hóa đơn mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors dark:text-white">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-400">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left: Form ── */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Patient search */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                        <div className="p-5 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h2 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6] text-[18px]">person_search</span>
                                Thông tin bệnh nhân
                            </h2>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Search box */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Tìm kiếm bệnh nhân *</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#687582] text-[18px]">search</span>
                                    <input
                                        type="text"
                                        value={patientQuery}
                                        onChange={e => setPatientQuery(e.target.value)}
                                        placeholder="Nhập tên, mã BN hoặc số điện thoại..."
                                        className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400"
                                    />
                                    {searchingPatient && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                    )}
                                </div>
                                {/* Dropdown results */}
                                {patientResults.length > 0 && (
                                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {patientResults.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPatient(p);
                                                    setPatientQuery(p.fullName);
                                                    setPatientResults([]);
                                                    setFd(prev => ({ ...prev, insuranceNumber: p.insuranceNumber ?? "" }));
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <p className="font-semibold text-[#121417] dark:text-white">{p.fullName}</p>
                                                <p className="text-xs text-[#687582]">
                                                    {p.patientCode && `Mã: ${p.patientCode}`}
                                                    {p.phone && ` • ${p.phone}`}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected patient info */}
                            {selectedPatient && (
                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>verified_user</span>
                                    <div>
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white">{selectedPatient.fullName}</p>
                                        <p className="text-xs text-[#687582]">
                                            {selectedPatient.patientCode && `Mã BN: ${selectedPatient.patientCode}`}
                                            {selectedPatient.phone && ` • ĐT: ${selectedPatient.phone}`}
                                        </p>
                                    </div>
                                    <button onClick={() => { setSelectedPatient(null); setPatientQuery(""); setEncounters([]); }} className="ml-auto p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800">
                                        <span className="material-symbols-outlined text-[#687582] text-[16px]">close</span>
                                    </button>
                                </div>
                            )}

                            {/* Encounter selector */}
                            {selectedPatient && (
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">
                                        Phiên khám (Encounter)
                                        {loadingEncounters && <span className="ml-2 text-xs text-[#687582]">Đang tải...</span>}
                                    </label>
                                    <select
                                        value={selectedEncounter}
                                        onChange={e => handleEncounterChange(e.target.value)}
                                        className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                    >
                                        <option value="">— Không chọn phiên khám —</option>
                                        {encounters.map(enc => (
                                            <option key={enc.id} value={enc.id}>
                                                {enc.encounterNumber ?? enc.id}
                                                {enc.createdAt && ` — ${new Date(enc.createdAt).toLocaleDateString("vi-VN")}`}
                                                {enc.doctorName && ` — ${enc.doctorName}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Insurance + payment */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Số BHYT</label>
                                    <input
                                        type="text"
                                        value={fd.insuranceNumber}
                                        onChange={e => setFd(p => ({ ...p, insuranceNumber: e.target.value }))}
                                        placeholder="HC4012345678"
                                        className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400"
                                    />
                                </div>
                                {fd.insuranceNumber && (
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">% BHYT chi trả</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={fd.insurancePercent}
                                            onChange={e => setFd(p => ({ ...p, insurancePercent: e.target.value }))}
                                            className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Phương thức thanh toán</label>
                                    <select
                                        value={fd.paymentMethod}
                                        onChange={e => setFd(p => ({ ...p, paymentMethod: e.target.value }))}
                                        className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                    >
                                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                {policies.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chính sách giảm giá</label>
                                        <select
                                            value={selectedPolicy}
                                            onChange={e => setSelectedPolicy(e.target.value)}
                                            className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white"
                                        >
                                            <option value="">— Không áp dụng —</option>
                                            {policies.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                    {p.discountPercent ? ` (${p.discountPercent}%)` : ""}
                                                    {p.discountAmount ? ` (-${fmt(p.discountAmount)})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Service catalog */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                        <div className="p-5 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                            <h2 className="text-sm font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6] text-[18px]">medical_services</span>
                                Chọn dịch vụ
                                {loadingCatalog && <span className="text-xs text-[#687582] font-normal ml-1">Đang tải...</span>}
                            </h2>
                            {selectedServices.length > 0 && (
                                <span className="text-xs font-medium text-[#3C81C6] bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                    Đã chọn {selectedServices.length} dịch vụ
                                </span>
                            )}
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Category filter */}
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCatalogCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${catalogCategory === cat ? "bg-[#3C81C6] text-white" : "bg-gray-50 dark:bg-gray-800 text-[#687582] border border-gray-200 dark:border-gray-700 hover:bg-gray-100"}`}
                                    >
                                        {cat === "all" ? "Tất cả" : cat}
                                    </button>
                                ))}
                            </div>
                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                                {filteredCatalog.map((s, visIdx) => {
                                    const realIdx = catalog.indexOf(s);
                                    const selected = selectedServices.includes(realIdx);
                                    return (
                                        <button
                                            key={realIdx}
                                            type="button"
                                            onClick={() => toggleService(realIdx)}
                                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selected
                                                ? "bg-[#3C81C6]/5 border-[#3C81C6]/30 ring-1 ring-[#3C81C6]/20"
                                                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`material-symbols-outlined text-[18px] ${selected ? "text-[#3C81C6]" : "text-gray-400"}`}>
                                                    {selected ? "check_circle" : "radio_button_unchecked"}
                                                </span>
                                                <div>
                                                    <span className="text-sm text-[#121417] dark:text-white">{s.name}</span>
                                                    {s.category && <span className="block text-[10px] text-[#687582]">{s.category}</span>}
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-[#3C81C6] ml-2 flex-shrink-0">{fmt(s.price)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm p-5">
                        <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                        <textarea
                            value={fd.note}
                            onChange={e => setFd(p => ({ ...p, note: e.target.value }))}
                            rows={2}
                            placeholder="Ghi chú thêm..."
                            className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none placeholder:text-gray-400"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">save</span> Tạo hóa đơn</>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Right: Summary ── */}
                <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm h-fit sticky top-6">
                    <div className="p-5 border-b border-[#dde0e4] dark:border-[#2d353e]">
                        <h2 className="text-sm font-bold text-[#121417] dark:text-white">Tóm tắt hóa đơn</h2>
                    </div>
                    <div className="p-5 space-y-3">
                        {selectedPatient && (
                            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                                <span className="material-symbols-outlined text-[#3C81C6] text-[16px]">person</span>
                                <span className="text-sm font-semibold text-[#121417] dark:text-white">{selectedPatient.fullName}</span>
                            </div>
                        )}
                        {selectedServices.length === 0 ? (
                            <p className="text-sm text-[#687582] text-center py-4">Chưa chọn dịch vụ nào</p>
                        ) : (
                            selectedServices.map((idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-[#121417] dark:text-gray-300 flex-1 pr-2">{catalog[idx].name}</span>
                                    <span className="font-medium text-[#121417] dark:text-white flex-shrink-0">{fmt(catalog[idx].price)}</span>
                                </div>
                            ))
                        )}
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#687582]">Tạm tính</span>
                                <span className="font-medium dark:text-white">{fmt(subtotal)}</span>
                            </div>
                            {insuranceDiscount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-600">BHYT ({fd.insurancePercent}%)</span>
                                    <span className="text-green-600 font-medium">-{fmt(insuranceDiscount)}</span>
                                </div>
                            )}
                            {policyDiscount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-600">{policyObj?.name ?? "Giảm giá"}</span>
                                    <span className="text-blue-600 font-medium">-{fmt(policyDiscount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-bold border-t border-gray-100 dark:border-gray-800 pt-2">
                                <span className="text-[#121417] dark:text-white">Tổng cộng</span>
                                <span className="text-[#3C81C6]">{fmt(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
