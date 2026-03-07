"use client";

import { useState } from "react";

const MOCK_INVOICES = [
    { id: "HD001", patient: "Nguyễn Văn An", patientId: "BN001", date: "28/02/2025", services: "Khám Tim mạch + Xét nghiệm máu", total: 850000, insurance: 680000, paid: 170000, status: "paid", method: "Tiền mặt" },
    { id: "HD002", patient: "Lê Thị Bình", patientId: "BN002", date: "28/02/2025", services: "Khám Nội tiết + Siêu âm", total: 1200000, insurance: 960000, paid: 0, status: "pending", method: "" },
    { id: "HD003", patient: "Trần Văn Cường", patientId: "BN003", date: "27/02/2025", services: "Khám Tim mạch + ECG", total: 650000, insurance: 520000, paid: 130000, status: "paid", method: "Chuyển khoản" },
    { id: "HD004", patient: "Phạm Thị Dung", patientId: "BN004", date: "27/02/2025", services: "Khám Tổng quát", total: 350000, insurance: 0, paid: 350000, status: "paid", method: "Tiền mặt" },
    { id: "HD005", patient: "Hoàng Văn Em", patientId: "BN005", date: "26/02/2025", services: "Khám Nhi khoa + Xét nghiệm", total: 500000, insurance: 400000, paid: 100000, status: "paid", method: "QR Pay" },
    { id: "HD006", patient: "Vũ Thị Fương", patientId: "BN006", date: "26/02/2025", services: "Khám Da liễu", total: 280000, insurance: 0, paid: 0, status: "cancelled", method: "" },
];

const SERVICE_PRICES = [
    { name: "Khám tổng quát", price: 200000 },
    { name: "Khám chuyên khoa", price: 350000 },
    { name: "Xét nghiệm máu cơ bản", price: 250000 },
    { name: "Xét nghiệm máu nâng cao", price: 500000 },
    { name: "Siêu âm bụng", price: 300000 },
    { name: "X-quang", price: 200000 },
    { name: "Điện tâm đồ (ECG)", price: 150000 },
    { name: "Nội soi", price: 800000 },
];

const statusMap: Record<string, { label: string; style: string }> = {
    pending: { label: "Chờ thanh toán", style: "bg-amber-50 text-amber-600 dark:bg-amber-900/20" },
    paid: { label: "Đã thanh toán", style: "bg-green-50 text-green-600 dark:bg-green-900/20" },
    cancelled: { label: "Đã hủy", style: "bg-red-50 text-red-600 dark:bg-red-900/20" },
};

export default function BillingPage() {
    const [invoices] = useState(MOCK_INVOICES);
    const [filter, setFilter] = useState("all");
    const [showCreate, setShowCreate] = useState(false);
    const [selectedServices, setSelectedServices] = useState<number[]>([]);

    const filtered = invoices.filter((inv) => filter === "all" || inv.status === filter);
    const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.paid, 0);
    const pendingAmount = invoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + i.total - i.insurance, 0);

    const formatCurrency = (n: number) => n.toLocaleString("vi-VN") + "đ";

    const toggleService = (i: number) => {
        setSelectedServices((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
    };

    return (
        <div className="p-6 md:p-8"><div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Thanh toán & Hóa đơn</h1>
                    <p className="text-sm text-[#687582] mt-1">Quản lý thanh toán viện phí và bảo hiểm</p>
                </div>
                <button onClick={() => window.location.href = '/portal/receptionist/billing/new'} className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>receipt_long</span>Tạo hóa đơn mới
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { l: "Tổng hóa đơn", v: invoices.length.toString(), i: "receipt", c: "from-blue-500 to-blue-600" },
                    { l: "Doanh thu hôm nay", v: formatCurrency(totalRevenue), i: "payments", c: "from-green-500 to-green-600" },
                    { l: "Chờ thanh toán", v: formatCurrency(pendingAmount), i: "pending_actions", c: "from-amber-500 to-amber-600" },
                    { l: "BHYT chi trả", v: formatCurrency(invoices.reduce((s, i) => s + i.insurance, 0)), i: "health_and_safety", c: "from-violet-500 to-violet-600" },
                ].map((s) => (
                    <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>{s.i}</span>
                        </div>
                        <div><p className="text-lg font-bold text-[#121417] dark:text-white">{s.v}</p><p className="text-xs text-[#687582]">{s.l}</p></div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {[{ k: "all", l: "Tất cả" }, { k: "pending", l: "Chờ thanh toán" }, { k: "paid", l: "Đã thanh toán" }, { k: "cancelled", l: "Đã hủy" }].map((f) => (
                    <button key={f.k} onClick={() => setFilter(f.k)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.k ? "bg-[#3C81C6] text-white" : "bg-white dark:bg-[#1e242b] text-[#687582] border border-[#dde0e4] dark:border-[#2d353e]"}`}>
                        {f.l}
                    </button>
                ))}
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-[#dde0e4] dark:border-[#2d353e] bg-[#f6f7f8] dark:bg-[#13191f]">
                            {["Mã HĐ", "Bệnh nhân", "Dịch vụ", "Tổng tiền", "BHYT", "Cần thanh toán", "Trạng thái", "Thao tác"].map((h) => (
                                <th key={h} className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {filtered.map((inv) => (
                                <tr key={inv.id} className="border-b border-[#dde0e4] dark:border-[#2d353e] last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                    <td className="px-4 py-3 text-sm font-mono text-[#3C81C6] font-medium">{inv.id}</td>
                                    <td className="px-4 py-3"><p className="text-sm font-semibold text-[#121417] dark:text-white">{inv.patient}</p><p className="text-xs text-[#687582]">{inv.date}</p></td>
                                    <td className="px-4 py-3 text-sm text-[#121417] dark:text-white max-w-[200px] truncate">{inv.services}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-[#121417] dark:text-white">{formatCurrency(inv.total)}</td>
                                    <td className="px-4 py-3 text-sm text-green-600">{inv.insurance > 0 ? `-${formatCurrency(inv.insurance)}` : "—"}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-[#121417] dark:text-white">{formatCurrency(inv.total - inv.insurance)}</td>
                                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusMap[inv.status].style}`}>{statusMap[inv.status].label}</span></td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            {inv.status === "pending" && (
                                                <button className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Thu tiền">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>payments</span>
                                                </button>
                                            )}
                                            <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="In hóa đơn">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>print</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Invoice Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex justify-between sticky top-0 bg-white dark:bg-[#1e242b] z-10">
                            <h2 className="text-lg font-bold text-[#121417] dark:text-white">Tạo hóa đơn mới</h2>
                            <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><span className="material-symbols-outlined text-[#687582]">close</span></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Mã bệnh nhân</label>
                                    <input placeholder="BN001" className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]" /></div>
                                <div><label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Số BHYT</label>
                                    <input placeholder="HC4012345678" className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]" /></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-white mb-2">Chọn dịch vụ</label>
                                <div className="space-y-2">
                                    {SERVICE_PRICES.map((s, i) => (
                                        <label key={i} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedServices.includes(i) ? "border-[#3C81C6] bg-blue-50 dark:bg-blue-900/10" : "border-[#dde0e4] dark:border-[#2d353e]"}`}>
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" checked={selectedServices.includes(i)} onChange={() => toggleService(i)} className="rounded" />
                                                <span className="text-sm text-[#121417] dark:text-white">{s.name}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-[#3C81C6]">{formatCurrency(s.price)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-[#f6f7f8] dark:bg-[#13191f] rounded-lg flex justify-between">
                                <span className="font-semibold text-[#121417] dark:text-white">Tổng cộng:</span>
                                <span className="text-lg font-bold text-[#3C81C6]">
                                    {formatCurrency(selectedServices.reduce((sum, i) => sum + SERVICE_PRICES[i].price, 0))}
                                </span>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#dde0e4] dark:border-[#2d353e] flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#1e242b]">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Hủy</button>
                            <button className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-medium rounded-lg flex items-center gap-2">
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>receipt_long</span>Tạo hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div></div>
    );
}
