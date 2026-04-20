"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Invoice, Transaction, ServicePrice } from "@/types/patient-portal";
import { billingService } from "@/services/billingService";
import { patientProfileService, type PatientProfileBE } from "@/services/patientProfileService";
import { unwrapList, unwrap } from "@/api/response";
import { useAuth } from "@/contexts/AuthContext";

const TABS = [
    { id: "pending", label: "Chờ thanh toán", icon: "pending_actions" },
    { id: "history", label: "Lịch sử",        icon: "receipt_long" },
    { id: "prices",  label: "Bảng giá",        icon: "payments" },
];

const formatVND = (n: number) => (n || 0).toLocaleString("vi-VN") + "đ";

const formatFullDate = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const formatShortDate = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

type QRState = "idle" | "loading" | "showing" | "success" | "error";

const SERVICE_GROUP_LABELS: Record<string, string> = {
    KHAM: "Khám bệnh",
    XN: "Xét nghiệm",
    CDHA: "Chẩn đoán hình ảnh",
    THUTHUAT: "Thủ thuật",
};

// Extended invoice type to hold raw date info from BE
interface InvoiceExtended extends Invoice {
    createdAtRaw?: string;
    updatedAtRaw?: string;
}

// Countdown Timer component for QR expiry
function CountdownTimer({ expiresAt, onExpired }: { expiresAt: string; onExpired?: () => void }) {
    const [remaining, setRemaining] = useState(0);

    useEffect(() => {
        const calcRemaining = () => {
            const exp = new Date(expiresAt).getTime();
            const now = Date.now();
            return Math.max(0, Math.floor((exp - now) / 1000));
        };
        setRemaining(calcRemaining());
        const interval = setInterval(() => {
            const r = calcRemaining();
            setRemaining(r);
            if (r <= 0) {
                clearInterval(interval);
                onExpired?.();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, onExpired]);

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const isUrgent = remaining <= 60;
    const percentage = Math.max(0, (remaining / (15 * 60)) * 100);

    return (
        <div className="space-y-1.5">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-[#3C81C6]'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className={`flex items-center justify-center gap-1.5 text-sm font-mono font-bold ${isUrgent ? 'text-red-500 animate-pulse' : 'text-[#3C81C6]'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>timer</span>
                <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
                <span className="text-xs font-normal text-gray-500 font-sans">còn lại</span>
            </div>
        </div>
    );
}

export default function BillingPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab]         = useState("pending");
    const [selectedProfileId, setSelectedProfileId] = useState("");
    const [profiles, setProfiles] = useState<PatientProfileBE[]>([]);
    const [profilesLoaded, setProfilesLoaded] = useState(false);
    const [facilityId, setFacilityId] = useState<string>("");

    // ── Invoices state ────────────────────────────────────────────────────────
    const [invoices, setInvoices]           = useState<InvoiceExtended[]>([]);
    const [transactions, setTransactions]   = useState<Transaction[]>([]);
    const [catalog, setCatalog]             = useState<ServicePrice[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [invoiceError, setInvoiceError]   = useState<string | null>(null);

    // ── Detail modal ──────────────────────────────────────────────────────────
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceExtended | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<any | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // ── Payment / QR ──────────────────────────────────────────────────────────
    const [showPayModal, setShowPayModal]   = useState(false);
    const [qrState, setQrState]             = useState<QRState>("idle");
    const [qrImage, setQrImage]             = useState<string>("");
    const [qrOrderId, setQrOrderId]         = useState<string>("");
    const [qrOrderCode, setQrOrderCode]     = useState<string>("");
    const [qrExpiresAt, setQrExpiresAt]     = useState<string>("");
    const [qrBankInfo, setQrBankInfo]       = useState<{ bank: string; account: string; holder: string } | null>(null);
    const [qrError, setQrError]             = useState<string>("");
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // ── Catalog filter ────────────────────────────────────────────────────────
    const [priceCategory, setPriceCategory] = useState("all");



    useEffect(() => {
        if (!user?.id) return;

        const loadProfiles = async () => {
            try {
                const response = await patientProfileService.getMyProfiles();
                if (response.length > 0) {
                    setProfiles(response);
                    const cachedId = sessionStorage.getItem("patientPortal_selectedProfileId");
                    const exists = response.some((profile) => profile.id === cachedId);
                    setSelectedProfileId(exists ? cachedId! : response[0].id);
                } else {
                    setProfiles([]);
                }
            } catch {
                setProfiles([]);
            } finally {
                setProfilesLoaded(true);
            }
        };

        void loadProfiles();
    }, [user?.id]);

    // ── Load invoices from API ────────────────────────────────────────────────
    const fetchInvoices = useCallback(async () => {
        if (!profilesLoaded) return;
        if (!selectedProfileId) {
            setInvoices([]);
            setLoadingInvoices(false);
            return;
        }
        setLoadingInvoices(true);
        setInvoiceError(null);
        try {
            const res = await billingService.getByPatient(selectedProfileId, { limit: 50 });
            const { data } = unwrapList<any>(res);
            if (data.length > 0) {
                const statusMap: Record<string, Invoice["status"]> = {
                    UNPAID: "pending", PENDING: "pending", OVERDUE: "overdue",
                    PAID: "paid", PARTIAL: "paid",
                    REFUNDED: "refunded", CANCELLED: "refunded",
                };
                const mapped: InvoiceExtended[] = data.map((inv: any) => {
                    const rawStatus = (inv.status ?? "pending").toString().toUpperCase();
                    const createdAt = inv.created_at ?? inv.createdAt;
                    const paidAt = inv.paid_at ?? inv.paidAt ?? inv.updated_at ?? inv.updatedAt ?? "";
                    return {
                        id:              inv.invoices_id ?? inv.id ?? inv._id ?? "",
                        code:            inv.invoice_code ?? inv.invoiceNumber ?? inv.code ?? inv.invoices_id ?? "",
                        date:            createdAt ? new Date(createdAt).toLocaleDateString("vi-VN") : (inv.date ?? ""),
                        createdAtRaw:    createdAt ?? "",
                        updatedAtRaw:    inv.updated_at ?? inv.updatedAt ?? "",
                        patientName:     inv.patient_name ?? inv.patientName ?? inv.patient ?? "",
                        doctorName:      inv.doctor_name ?? inv.doctorName ?? inv.created_by_name ?? "",
                        department:      inv.department_name ?? inv.department ?? inv.departmentName ?? "",
                        facilityName:    inv.facility_name ?? inv.facilityName ?? "",
                        encounterType:   inv.encounter_type ?? inv.encounterType ?? "",
                        status:          statusMap[rawStatus] ?? (rawStatus.toLowerCase() as Invoice["status"]),
                        subtotal:        Number(inv.total_amount ?? inv.subtotal ?? 0),
                        insuranceCovered: Number(inv.insurance_amount ?? inv.insuranceCovered ?? 0),
                        discount:        Number(inv.discount_amount ?? inv.discount ?? 0),
                        total:           Number(inv.net_amount ?? inv.total ?? inv.totalAmount ?? 0),
                        paymentMethod:   inv.payment_method ?? inv.paymentMethod ?? "",
                        paidAt,
                        items:           (inv.items ?? []).map((item: any) => ({
                            name:      item.service_name ?? item.name ?? item.serviceName ?? "",
                            quantity:  Number(item.quantity ?? 1),
                            unitPrice: Number(item.unit_price ?? item.unitPrice ?? item.price ?? 0),
                            total:     Number(item.total_amount ?? item.total ?? item.totalPrice ?? 0),
                        })),
                    };
                });
                setInvoices(mapped);
                const firstFacId = data[0]?.facility_id ?? data[0]?.facilityId ?? "";
                if (firstFacId) setFacilityId(firstFacId);
            } else {
                setInvoices([]);
            }
        } catch {
            setInvoiceError("Không thể tải hóa đơn từ máy chủ.");
        } finally {
            setLoadingInvoices(false);
        }
    }, [profilesLoaded, selectedProfileId]);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    // ── Load catalog from API ────────────────────────────────────────────────
    useEffect(() => {
        if (!facilityId) return;
        setLoadingCatalog(true);
        billingService.getCatalogByFacility(facilityId, { limit: 200 })
            .then(res => {
                const { data } = unwrapList<any>(res);
                if (data.length > 0) {
                    const mapped: ServicePrice[] = data.map((s: any) => {
                        const basePrice = Number(s.base_price ?? 0);
                        const insPrice  = Number(s.insurance_price ?? 0);
                        const insRate   = basePrice > 0 && insPrice > 0
                            ? Math.round(((basePrice - insPrice) / basePrice) * 100)
                            : Number(s.insurance_rate ?? s.insuranceRate ?? 0);
                        return {
                            id:            s.facility_services_id ?? s.services_id ?? s.id ?? "",
                            serviceCode:   s.service_code ?? s.code ?? "",
                            name:          s.service_name ?? s.name ?? "",
                            serviceGroup:  s.service_group ?? "",
                            category:      s.department_name ?? s.category_name ?? s.service_group ?? "Khác",
                            description:   s.description ?? "",
                            price:         basePrice,
                            insurancePrice: insPrice,
                            insuranceRate: insRate,
                        };
                    });
                    setCatalog(mapped);
                }
            })
            .catch(() => { setCatalog([]); })
            .finally(() => setLoadingCatalog(false));
    }, [facilityId]);

    const pending = invoices.filter(i => i.status === "pending" || i.status === "overdue");
    const paid    = invoices.filter(i => i.status === "paid" || i.status === "refunded");
    const totalPending = pending.reduce((s, i) => s + i.total, 0);

    const serviceGroups = Array.from(new Set(catalog.map(s => s.serviceGroup).filter(Boolean)));
    const categories = ["all", ...serviceGroups];

    // ── Stop polling ──────────────────────────────────────────────────────────
    const stopPoll = () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    useEffect(() => () => stopPoll(), []);

    // ── Create QR & start polling ─────────────────────────────────────────────
    const handleCreateQR = async (inv: Invoice) => {
        setQrState("loading");
        setQrError("");
        setQrImage("");
        setQrOrderCode("");
        setQrExpiresAt("");
        setQrBankInfo(null);
        try {
            const res = await billingService.createQR({
                invoiceId:   inv.id,
                amount:      inv.total,
                description: `Thanh toán ${inv.code}`,
            });
            const data = unwrap<any>(res);
            const orderId  = data.orderId ?? data.order_id ?? data.payment_orders_id ?? data.transferId ?? "";
            const imgUrl   = data.qrImageUrl ?? data.qrCode ?? data.qrDataURL ?? data.qr_code_url ?? "";
            const orderCode = data.order_code ?? data.orderCode ?? orderId;
            const expiresAt = data.expires_at ?? data.expiresAt ?? "";
            setQrOrderId(orderId);
            setQrImage(imgUrl);
            setQrOrderCode(orderCode);
            setQrExpiresAt(expiresAt);

            // Parse bank info from QR URL if available
            try {
                const qrUrl = new URL(imgUrl);
                const acc  = qrUrl.searchParams.get("acc") ?? "";
                const bank = qrUrl.searchParams.get("bank") ?? "";
                // Patient users cannot rely on the admin-only gateway config endpoint here.
                const holder = data.account_holder ?? data.accountHolder ?? data.holder ?? "";
                if (acc || bank || holder) {
                    setQrBankInfo({
                        account: data.bank_account_number ?? data.account_number ?? acc,
                        bank:    data.bank_name ?? data.bankName ?? bank,
                        holder,
                    });
                }
            } catch { /* ignore URL parse error */ }

            setQrState("showing");

            // Poll payment status every 5 seconds (max 5 minutes)
            if (data.orderId || data.order_id || data.payment_orders_id || data.transferId) {
                const oid = data.orderId ?? data.order_id ?? data.payment_orders_id ?? data.transferId;
                let pollCount = 0;
                const MAX_POLLS = 60;
                pollRef.current = setInterval(async () => {
                    pollCount++;
                    if (pollCount >= MAX_POLLS) {
                        stopPoll();
                        setQrState("error");
                        setQrError("QR thanh toán đã hết hạn. Vui lòng thử lại.");
                        return;
                    }
                    try {
                        const statusRes = await billingService.getQRStatus(oid);
                        const st = unwrap<any>(statusRes);
                        const status = String(st?.status ?? st?.paymentStatus ?? "").toLowerCase();
                        if (status === "paid" || status === "success" || status === "completed") {
                            stopPoll();
                            setQrState("success");
                            setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: "paid" } : i));
                        }
                    } catch { /* ignore poll errors */ }
                }, 5000);
            }
        } catch {
            setQrState("error");
            setQrError("Không thể tạo mã QR. Vui lòng thử lại.");
        }
    };

    const handleViewDetail = async (inv: InvoiceExtended) => {
        setSelectedInvoice(inv);
        setShowDetailModal(true);
        setDetailData(null);
        setDetailLoading(true);
        try {
            const res = await billingService.getDetail(inv.id);
            const d = unwrap<any>(res);
            setDetailData(d);
        } catch {
            setDetailData(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedInvoice(null);
        setDetailData(null);
    };

    const handleOpenPayModal = (inv: InvoiceExtended) => {
        setSelectedInvoice(inv);
        setShowPayModal(true);
        setQrState("idle");
        setQrImage("");
        setQrOrderId("");
        setQrError("");
        setQrExpiresAt("");
        stopPoll();
    };

    const handleClosePayModal = () => {
        setShowPayModal(false);
        setSelectedInvoice(null);
        setQrState("idle");
        stopPoll();
    };

    // ── Download PDF ──────────────────────────────────────────────────────────
    const handleDownloadPDF = async (inv: Invoice) => {
        try {
            const res = await billingService.getInvoicePDF(inv.id);
            const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `hoadon_${inv.code}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            alert("Không thể tải PDF. Vui lòng thử lại.");
        }
    };

    // ── Status config ─────────────────────────────────────────────────────────
    const getStatusBadge = (status: string) => {
        const cfg: Record<string, { label: string; cls: string }> = {
            pending:  { label: "Chờ thanh toán", cls: "bg-amber-100 text-amber-700" },
            paid:     { label: "Đã thanh toán",  cls: "bg-green-100 text-green-700" },
            overdue:  { label: "Quá hạn",        cls: "bg-red-100 text-red-700" },
            refunded: { label: "Đã hoàn",        cls: "bg-gray-100 text-gray-600" },
        };
        return cfg[status] || cfg.pending;
    };

    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417]">Thanh toán & Hóa đơn</h1>
                    <p className="text-sm text-[#687582] mt-0.5">Quản lý hóa đơn, thanh toán và tra cứu bảng giá</p>
                </div>
                {totalPending > 0 && (
                    <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-right">
                        <p className="text-xs text-amber-600 font-medium">Chờ thanh toán</p>
                        <p className="text-lg font-bold text-amber-700">{formatVND(totalPending)}</p>
                    </div>
                )}
            </div>

            {/* Error */}
            {invoiceError && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    {invoiceError}
                </div>
            )}

            {/* Profile selector */}
            {profiles.length > 0 && (
                <div className="flex snap-x gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    {profiles.map((profile) => (
                        <div
                            key={profile.id}
                            onClick={() => {
                                setSelectedProfileId(profile.id);
                                sessionStorage.setItem("patientPortal_selectedProfileId", profile.id);
                            }}
                            className={`min-w-[240px] cursor-pointer snap-start rounded-2xl border p-3 transition-all ${
                                selectedProfileId === profile.id
                                    ? "border-[#3C81C6] bg-blue-50/50 shadow-sm"
                                    : "border-gray-200 bg-white hover:border-blue-300"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3C81C6] to-[#60a5fa] text-sm font-bold text-white shadow-md shadow-[#3C81C6]/20">
                                    {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`truncate text-sm font-bold ${selectedProfileId === profile.id ? "text-[#3C81C6]" : "text-gray-900"}`}>
                                        {profile.full_name}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">{profile.phone_number || "Chưa có SĐT"}</p>
                                </div>
                                {selectedProfileId === profile.id && (
                                    <span className="material-symbols-outlined shrink-0 text-[#3C81C6]" style={{ fontSize: "20px" }}>check_circle</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs – matching appointments page style */}
            <div className="scrollbar-hide flex gap-1 overflow-x-auto pb-1">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? "bg-[#3C81C6] text-white shadow-sm shadow-[#3C81C6]/20"
                                : "border border-[#e5e7eb] bg-white text-[#687582] hover:bg-gray-50"
                        }`}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
                        {tab.label}
                        {tab.id === "pending" && pending.length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">{pending.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loadingInvoices && (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 rounded bg-gray-200" />
                                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                                    <div className="h-3 w-1/4 rounded bg-gray-100" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Pending tab ──────────────────────────────────────────────── */}
            {!loadingInvoices && activeTab === "pending" && (
                <div className="space-y-4">
                    {pending.length === 0 ? (
                        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
                            <span className="material-symbols-outlined mb-4 text-gray-300" style={{ fontSize: "64px" }}>payments</span>
                            <h3 className="mb-1 text-lg font-semibold text-gray-700">Không có hóa đơn chờ thanh toán</h3>
                            <p className="text-sm text-gray-400">Tất cả hóa đơn đã được thanh toán</p>
                        </div>
                    ) : (
                        pending.map(inv => (
                            <div key={inv.id} className="group rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:shadow-md hover:border-[#3C81C6]/30">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                    {/* Icon */}
                                    <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${
                                        inv.status === "overdue" ? "bg-red-50" : "bg-gradient-to-br from-[#3C81C6]/10 to-[#60a5fa]/10"
                                    }`}>
                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "24px" }}>receipt_long</span>
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="flex items-center gap-2 font-semibold text-gray-900 group-hover:text-[#3C81C6] transition-colors">
                                                    {inv.code}
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getStatusBadge(inv.status).cls}`}>
                                                        {getStatusBadge(inv.status).label}
                                                    </span>
                                                </h3>
                                                {inv.patientName && (
                                                    <p className="mt-0.5 text-sm text-gray-600">{inv.patientName}</p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-bold text-[#3C81C6]">{formatVND(inv.total)}</p>
                                                {inv.insuranceCovered > 0 && (
                                                    <p className="text-[10px] text-blue-500">BHYT: {formatVND(inv.insuranceCovered)}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                                            <span className="inline-flex items-center gap-1.5 font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "15px" }}>schedule</span>
                                                {inv.createdAtRaw ? formatFullDate(inv.createdAtRaw) : inv.date}
                                            </span>
                                            {inv.doctorName && (
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "14px" }}>stethoscope</span>
                                                    <span className="font-medium text-gray-700">{inv.doctorName}</span>
                                                </span>
                                            )}
                                            {inv.facilityName && (
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "14px" }}>local_hospital</span>
                                                    <span className="font-medium text-gray-700 max-w-[200px] truncate">{inv.facilityName}</span>
                                                </span>
                                            )}
                                            {inv.items.length > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "14px" }}>list</span>
                                                    {inv.items.length} dịch vụ
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-4">
                                    <button onClick={() => handleViewDetail(inv)}
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
                                        Xem chi tiết
                                    </button>
                                    <button onClick={() => handleOpenPayModal(inv)}
                                        className="rounded-lg bg-gradient-to-r from-[#3C81C6] to-[#2563eb] px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-[#3C81C6]/20 transition-all hover:shadow-md flex items-center gap-1">
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>payment</span>
                                        Thanh toán
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── History tab ──────────────────────────────────────────────── */}
            {!loadingInvoices && activeTab === "history" && (
                <div className="space-y-4">
                    {paid.length === 0 ? (
                        <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
                            <span className="material-symbols-outlined mb-4 text-gray-300" style={{ fontSize: "64px" }}>receipt_long</span>
                            <h3 className="mb-1 text-lg font-semibold text-gray-700">Chưa có lịch sử thanh toán</h3>
                            <p className="text-sm text-gray-400">Lịch sử sẽ hiển thị sau khi thanh toán</p>
                        </div>
                    ) : (
                        paid.map(inv => (
                            <div key={inv.id} className="group rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:shadow-md hover:border-[#3C81C6]/30">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-green-50">
                                        <span className="material-symbols-outlined text-green-500" style={{ fontSize: "24px" }}>check_circle</span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="flex items-center gap-2 font-semibold text-gray-900 group-hover:text-[#3C81C6] transition-colors">
                                                    {inv.code}
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getStatusBadge(inv.status).cls}`}>
                                                        {getStatusBadge(inv.status).label}
                                                    </span>
                                                </h3>
                                                {inv.patientName && (
                                                    <p className="mt-0.5 text-sm text-gray-600">{inv.patientName}</p>
                                                )}
                                            </div>
                                            <p className="text-lg font-bold text-green-600 shrink-0">{formatVND(inv.total)}</p>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                                            <span className="inline-flex items-center gap-1.5 font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "15px" }}>schedule</span>
                                                {inv.createdAtRaw ? formatFullDate(inv.createdAtRaw) : inv.date}
                                            </span>
                                            {inv.doctorName && (
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "14px" }}>stethoscope</span>
                                                    <span className="font-medium text-gray-700">{inv.doctorName}</span>
                                                </span>
                                            )}
                                            {inv.items.length > 0 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "14px" }}>list</span>
                                                    {inv.items.length} dịch vụ
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-4">
                                    <button onClick={() => handleViewDetail(inv)}
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
                                        Xem chi tiết
                                    </button>
                                    {inv.status === "paid" && (
                                        <button onClick={() => handleDownloadPDF(inv)}
                                            className="rounded-lg border border-[#3C81C6]/20 bg-[#3C81C6]/[0.08] px-3 py-1.5 text-xs font-medium text-[#3C81C6] transition-colors hover:bg-[#3C81C6]/[0.15] flex items-center gap-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>download</span>
                                            Tải PDF
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── Prices tab ──────────────────────────────────────────────── */}
            {activeTab === "prices" && (
                <div className="space-y-4">
                    {loadingCatalog && (
                        <div className="flex items-center justify-center py-10 gap-3 text-gray-500">
                            <div className="w-5 h-5 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Đang tải bảng giá...</span>
                        </div>
                    )}
                    {!loadingCatalog && !facilityId && catalog.length === 0 && (
                        <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center">
                            <span className="material-symbols-outlined text-gray-300 mb-2" style={{ fontSize: "48px" }}>payments</span>
                            <p className="text-sm text-gray-500">Bảng giá sẽ hiển thị sau khi bạn có hóa đơn</p>
                        </div>
                    )}
                    {!loadingCatalog && catalog.length > 0 && (
                    <>
                    {/* Category filter */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setPriceCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                    priceCategory === cat
                                        ? "bg-[#3C81C6] text-white"
                                        : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                {cat === "all" ? "Tất cả" : (SERVICE_GROUP_LABELS[cat] ?? cat)}
                            </button>
                        ))}
                    </div>

                    {(() => {
                        const filtered = catalog.filter(s =>
                            priceCategory === "all" || s.serviceGroup === priceCategory
                        );
                        return (
                            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh sách dịch vụ</span>
                                    <span className="text-xs text-gray-400">Tìm thấy {filtered.length} dịch vụ</span>
                                </div>
                                {filtered.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <span className="material-symbols-outlined text-gray-300 mb-2" style={{ fontSize: "40px" }}>search_off</span>
                                        <p className="text-sm text-gray-500">Không tìm thấy dịch vụ phù hợp</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                                                <th className="text-left py-3 px-5">Dịch vụ</th>
                                                <th className="text-center py-3 px-3 hidden sm:table-cell">Nhóm</th>
                                                <th className="text-right py-3 px-3">Giá thường</th>
                                                <th className="text-right py-3 px-4 hidden md:table-cell">Giá BHYT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map(s => (
                                                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                    <td className="py-3 px-5">
                                                        <p className="font-medium text-gray-900">{s.name}</p>
                                                        {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                                                        {s.serviceCode && <p className="text-[10px] text-gray-400 mt-0.5 font-mono">#{s.serviceCode}</p>}
                                                    </td>
                                                    <td className="py-3 px-3 text-center hidden sm:table-cell">
                                                        <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-500 rounded-md whitespace-nowrap">
                                                            {SERVICE_GROUP_LABELS[s.serviceGroup] ?? s.serviceGroup ?? s.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-bold text-gray-900 whitespace-nowrap">
                                                        {s.price > 0 ? formatVND(s.price) : <span className="text-gray-400 font-normal text-xs">Liên hệ</span>}
                                                    </td>
                                                    <td className="py-3 px-4 text-right hidden md:table-cell whitespace-nowrap">
                                                        {s.insurancePrice > 0
                                                            ? <span className="font-semibold text-blue-600">{formatVND(s.insurancePrice)}</span>
                                                            : <span className="text-gray-400 text-xs">—</span>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        );
                    })()}
                    </>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* Invoice Detail Modal                                               */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {showDetailModal && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={handleCloseDetailModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>receipt_long</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{selectedInvoice.code}</h3>
                                        <p className="text-xs text-gray-500">
                                            {formatFullDate(selectedInvoice.createdAtRaw) || selectedInvoice.date}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getStatusBadge(selectedInvoice.status).cls}`}>
                                        {getStatusBadge(selectedInvoice.status).label}
                                    </span>
                                    <button onClick={handleCloseDetailModal}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                        <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "20px" }}>close</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-5">

                            {/* Loading */}
                            {detailLoading && (
                                <div className="flex items-center gap-2 py-4 justify-center text-sm text-gray-500">
                                    <div className="w-4 h-4 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                    Đang tải chi tiết...
                                </div>
                            )}

                            {/* Patient & Doctor info */}
                            {!detailLoading && (
                                <div className="space-y-2 text-sm">
                                    {selectedInvoice.patientName && (
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Bệnh nhân</span>
                                            <span className="font-medium text-gray-900">{selectedInvoice.patientName}</span>
                                        </div>
                                    )}
                                    {selectedInvoice.doctorName && (
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Bác sĩ</span>
                                            <span className="font-medium text-gray-900">{selectedInvoice.doctorName}</span>
                                        </div>
                                    )}
                                    {(detailData?.facility_name || selectedInvoice.facilityName) && (
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Cơ sở</span>
                                            <span className="font-medium text-gray-900">{detailData?.facility_name || selectedInvoice.facilityName}</span>
                                        </div>
                                    )}
                                    {(detailData?.encounter_type || selectedInvoice.encounterType) && (
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Loại khám</span>
                                            <span className="font-medium text-gray-900">{detailData?.encounter_type || selectedInvoice.encounterType}</span>
                                        </div>
                                    )}
                                    {selectedInvoice.paidAt && selectedInvoice.status === "paid" && (
                                        <div className="flex justify-between py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Thanh toán lúc</span>
                                            <span className="font-medium text-green-600">{formatFullDate(selectedInvoice.paidAt)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {detailData?.notes && (
                                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                                    <span className="material-symbols-outlined mt-0.5" style={{ fontSize: "16px" }}>info</span>
                                    <p><span className="font-semibold">Ghi chú:</span> {detailData.notes}</p>
                                </div>
                            )}

                            {/* Service items table */}
                            {(() => {
                                const items: any[] = detailData?.items?.length ? detailData.items : selectedInvoice.items;
                                if (!items.length) return null;
                                return (
                                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                                        <div className="px-4 py-2.5 bg-gray-50 flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <span>Dịch vụ</span>
                                            <span>Thành tiền</span>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {items.map((item: any, i: number) => {
                                                const name = item.item_name ?? item.name ?? "";
                                                const qty = Number(item.quantity ?? 1);
                                                const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
                                                const patientPays = detailData?.items?.length
                                                    ? Number(item.patient_pays ?? item.patientPays ?? 0)
                                                    : Number(item.total ?? 0);
                                                return (
                                                    <div key={i} className="flex justify-between items-center px-4 py-3 text-sm">
                                                        <div className="flex-1 min-w-0 mr-3">
                                                            <p className="font-medium text-gray-900">{name}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                SL: {qty}{unitPrice > 0 ? ` × ${formatVND(unitPrice)}` : ""}
                                                            </p>
                                                        </div>
                                                        <span className="font-semibold text-gray-900 shrink-0">{formatVND(patientPays)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Totals */}
                            <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Tạm tính</span>
                                    <span>{formatVND(selectedInvoice.subtotal)}</span>
                                </div>
                                {selectedInvoice.insuranceCovered > 0 && (
                                    <div className="flex justify-between text-blue-600">
                                        <span>BHYT chi trả</span>
                                        <span>-{formatVND(selectedInvoice.insuranceCovered)}</span>
                                    </div>
                                )}
                                {selectedInvoice.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Giảm giá</span>
                                        <span>-{formatVND(selectedInvoice.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                                    <span className="text-gray-900">Tổng cộng</span>
                                    <span className="text-[#3C81C6]">{formatVND(selectedInvoice.total)}</span>
                                </div>
                                {detailData && Number(detailData.paid_amount ?? 0) > 0 && (
                                    <div className="flex justify-between text-green-600 text-xs">
                                        <span>Đã thanh toán</span>
                                        <span>{formatVND(Number(detailData.paid_amount))}</span>
                                    </div>
                                )}
                                {detailData && Number(detailData.net_amount ?? 0) > Number(detailData.paid_amount ?? 0) && (
                                    <div className="flex justify-between text-amber-600 text-xs font-semibold">
                                        <span>Còn lại</span>
                                        <span>{formatVND(Number(detailData.net_amount) - Number(detailData.paid_amount ?? 0))}</span>
                                    </div>
                                )}
                            </div>

                            {/* Payment history */}
                            {detailData?.payments?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                        Lịch sử thanh toán ({detailData.payments.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {detailData.payments.map((p: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-green-500" style={{ fontSize: "18px" }}>check_circle</span>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {p.payment_method ?? p.paymentMethod ?? "Thanh toán"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatFullDate(p.payment_date ?? p.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-green-600 text-sm">{formatVND(Number(p.amount ?? 0))}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 flex gap-3">
                            {(selectedInvoice.status === "pending" || selectedInvoice.status === "overdue") && (
                                <button onClick={() => {
                                    handleCloseDetailModal();
                                    setTimeout(() => handleOpenPayModal(selectedInvoice), 100);
                                }}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-[#3C81C6] to-[#2563eb] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#3C81C6]/20 transition-all hover:shadow-lg flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>payment</span>
                                    Thanh toán ngay
                                </button>
                            )}
                            {selectedInvoice.status === "paid" && (
                                <button onClick={() => handleDownloadPDF(selectedInvoice)}
                                    className="flex-1 rounded-xl border border-[#3C81C6]/20 bg-[#3C81C6]/[0.08] py-2.5 text-sm font-medium text-[#3C81C6] transition-colors hover:bg-[#3C81C6]/[0.15] flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
                                    Tải PDF
                                </button>
                            )}
                            <button onClick={handleCloseDetailModal}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* Pay Modal — SePay QR — Clean layout                                */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {showPayModal && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={handleClosePayModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>payment</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Thanh toán hóa đơn</h3>
                                        <p className="text-xs text-gray-500">{selectedInvoice.code} — <span className="font-bold text-[#3C81C6]">{formatVND(selectedInvoice.total)}</span></p>
                                    </div>
                                </div>
                                <button onClick={handleClosePayModal}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "20px" }}>close</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-5">
                            {/* ── Idle: choose method ── */}
                            {qrState === "idle" && (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500 text-center mb-4">Chọn phương thức thanh toán</p>
                                    <button
                                        onClick={() => handleCreateQR(selectedInvoice)}
                                        className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-[#3C81C6] hover:bg-blue-50/50 transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>qr_code_2</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900">Chuyển khoản qua QR Code</p>
                                            <p className="text-xs text-gray-500">Quét mã QR bằng app ngân hàng / ví điện tử</p>
                                        </div>
                                        <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "18px" }}>chevron_right</span>
                                    </button>
                                    {["VNPay", "MoMo", "ZaloPay"].map(m => (
                                        <button key={m} className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl text-left opacity-50 cursor-not-allowed">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "20px" }}>account_balance</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">{m}</p>
                                                <p className="text-xs text-gray-400">Sắp có</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ── Loading QR ── */}
                            {qrState === "loading" && (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="w-8 h-8 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-gray-500">Đang tạo mã QR...</p>
                                </div>
                            )}

                            {/* ── Showing QR — SePay style layout ── */}
                            {qrState === "showing" && (
                                <div className="space-y-5">

                                    {/* Countdown timer */}
                                    {qrExpiresAt && (
                                        <CountdownTimer
                                            expiresAt={qrExpiresAt}
                                            onExpired={() => {
                                                stopPoll();
                                                setQrState("error");
                                                setQrError("QR thanh toán đã hết hạn. Vui lòng thử lại.");
                                            }}
                                        />
                                    )}

                                    {/* Two-column: QR left, Bank info right */}
                                    <div className="flex flex-col sm:flex-row gap-5">
                                        {/* Left: QR Code */}
                                        <div className="flex flex-col items-center gap-3 sm:w-[220px] shrink-0">
                                            <p className="text-xs text-gray-500 text-center">
                                                <b>Bước 1:</b> Mở Ví điện tử/Ngân hàng<br/>
                                                <b>Bước 2:</b> Chọn <span className="material-symbols-outlined align-middle" style={{ fontSize: "14px" }}>qr_code_scanner</span> và quét mã
                                            </p>
                                            <div className="p-2 border-2 border-blue-200 rounded-xl bg-white">
                                                {qrImage ? (
                                                    <img src={qrImage} alt="QR Code" className="w-[180px] h-[180px] object-contain" />
                                                ) : (
                                                    <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-50 rounded-lg">
                                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "64px" }}>qr_code_2</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Transfer info – clean label/value pairs */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-bold text-[#3C81C6] mb-4 uppercase">Thông tin chuyển khoản</h4>
                                            <div className="space-y-3 text-sm">
                                                {qrBankInfo?.bank && (
                                                    <div className="flex gap-2">
                                                        <span className="text-gray-500 shrink-0 w-[110px]">Ngân hàng:</span>
                                                        <span className="font-bold text-gray-900">{qrBankInfo.bank}</span>
                                                    </div>
                                                )}
                                                {qrBankInfo?.account && (
                                                    <div className="flex gap-2">
                                                        <span className="text-gray-500 shrink-0 w-[110px]">Số tài khoản:</span>
                                                        <span className="font-bold text-gray-900 font-mono">{qrBankInfo.account}</span>
                                                    </div>
                                                )}
                                                {qrBankInfo?.holder && (
                                                    <div className="flex gap-2">
                                                        <span className="text-gray-500 shrink-0 w-[110px]">Chủ tài khoản:</span>
                                                        <span className="font-bold text-gray-900 uppercase">{qrBankInfo.holder}</span>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <span className="text-gray-500 shrink-0 w-[110px]">Số tiền:</span>
                                                    <span className="font-bold text-red-600 text-base">{formatVND(selectedInvoice.total)}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="text-gray-500 shrink-0 w-[110px]">Nội dung CK:</span>
                                                    <span className="font-bold text-gray-900 font-mono px-2 py-0.5 border border-gray-300 rounded bg-gray-50">
                                                        {qrOrderCode || qrOrderId || selectedInvoice.code}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Warning note */}
                                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                                    <b>CHÚ Ý:</b> CHUYỂN KHOẢN QUA QUÉT QR CODE ĐỂ XỬ LÝ ĐƠN HÀNG TỰ ĐỘNG
                                                    (Không chuyển khoản thủ công hay sửa thông tin khi thực hiện)
                                                </p>
                                            </div>

                                            {/* Waiting status */}
                                            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                                                <div className="w-4 h-4 border-2 border-[#3C81C6] border-t-transparent rounded-full animate-spin shrink-0" />
                                                Đang chờ xác nhận giao dịch...
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoice items summary table */}
                                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                                        <div className="px-4 py-2.5 bg-gray-50 flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <span>Sản phẩm</span>
                                            <span>Tổng</span>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {selectedInvoice.items.length > 0 ? selectedInvoice.items.map((item, i) => (
                                                <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm">
                                                    <span className="text-gray-900 truncate flex-1 mr-2">{item.name} × {item.quantity}</span>
                                                    <span className="font-semibold text-red-600 shrink-0">{formatVND(item.total || item.unitPrice * item.quantity)}</span>
                                                </div>
                                            )) : (
                                                <div className="px-4 py-3 text-sm text-gray-500">{selectedInvoice.code}</div>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-100 divide-y divide-gray-50">
                                            {selectedInvoice.insuranceCovered > 0 && (
                                                <div className="flex justify-between px-4 py-2 text-sm text-blue-600">
                                                    <span>BHYT chi trả</span>
                                                    <span>-{formatVND(selectedInvoice.insuranceCovered)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between px-4 py-2.5 font-bold text-sm">
                                                <span className="text-gray-900">Tổng cộng:</span>
                                                <span className="text-red-600">{formatVND(selectedInvoice.total)}</span>
                                            </div>
                                            <div className="flex justify-between px-4 py-2.5 text-sm">
                                                <span className="text-gray-500 font-medium">Phương thức thanh toán:</span>
                                                <span className="text-gray-900">Chuyển khoản qua QR Code</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Success ── */}
                            {qrState === "success" && (
                                <div className="flex flex-col items-center gap-4 py-10">
                                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-green-500" style={{ fontSize: "40px" }}>check_circle</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-gray-900">Thanh toán thành công!</p>
                                        <p className="text-sm text-gray-500 mt-1">{formatVND(selectedInvoice.total)} đã được ghi nhận.</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatFullDate(new Date().toISOString())}</p>
                                    </div>
                                </div>
                            )}

                            {/* ── Error ── */}
                            {qrState === "error" && (
                                <div className="flex flex-col items-center gap-4 py-10">
                                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-red-500" style={{ fontSize: "40px" }}>error</span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-base font-bold text-gray-900 mb-1">Thanh toán thất bại</p>
                                        <p className="text-sm text-red-600">{qrError}</p>
                                    </div>
                                    <button onClick={() => setQrState("idle")} className="px-5 py-2.5 text-sm font-medium text-[#3C81C6] border border-[#3C81C6]/30 rounded-xl hover:bg-blue-50 transition-colors">
                                        Thử lại
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 flex gap-3">
                            {qrState === "showing" && (
                                <button onClick={() => { setQrState("idle"); stopPoll(); }} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                    Đổi phương thức
                                </button>
                            )}
                            <button onClick={handleClosePayModal} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                {qrState === "success" ? "Xong" : "Đóng"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
