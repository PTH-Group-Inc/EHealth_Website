"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getDrugs } from "@/services/medicineService";
import { inventoryService } from "@/services/inventoryService";

type RequestType = "import" | "export" | "transfer" | "cancel";
type RequestStatus = "pending" | "approved" | "rejected";

const TYPE_CONFIG: Record<RequestType, { label: string; icon: string; cls: string }> = {
    import: { label: "Nhập kho", icon: "archive", cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600" },
    export: { label: "Xuất kho", icon: "unarchive", cls: "bg-purple-50 dark:bg-purple-900/20 text-purple-600" },
    transfer: { label: "Chuyển kho", icon: "swap_horiz", cls: "bg-teal-50 dark:bg-teal-900/20 text-teal-600" },
    cancel: { label: "Huỷ thuốc", icon: "delete_forever", cls: "bg-red-50 dark:bg-red-900/20 text-red-600" },
};

const STATUS_CONFIG: Record<RequestStatus, { label: string; cls: string; icon: string }> = {
    pending: { label: "Chờ duyệt", cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800", icon: "hourglass_top" },
    approved: { label: "Đã duyệt", cls: "bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800", icon: "check_circle" },
    rejected: { label: "Từ chối", cls: "bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800", icon: "cancel" },
};

type InventoryItem = { id: string; name: string; group: string; unit: string; stock: number; min: number; price: number; expiry: string; supplier: string };
type RequestItem = { id: string; type: RequestType; medicine: string; qty: number; reason: string; date: string; status: RequestStatus };

export default function PharmacistInventory() {
    const t = useTranslations("pages.portal.pharmacist.inventory");
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [requests, setRequests] = useState<RequestItem[]>([]);

    useEffect(() => {
        // Thử lấy dữ liệu tồn kho thực từ /api/inventory trước
        inventoryService.getList({ limit: 500 })
            .then(res => {
                const items: any[] = res?.data?.data ?? res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    setInventory(items.map((d: any) => ({
                        id: d.id ?? d.drugId,
                        name: d.drugName ?? d.name ?? "",
                        group: d.category ?? d.drugCategory ?? "",
                        unit: d.unit ?? "",
                        stock: d.quantity ?? d.currentStock ?? 0,
                        min: d.minQuantity ?? d.reorderPoint ?? 50,
                        price: d.price ?? d.unitPrice ?? 0,
                        expiry: d.expiryDate ?? d.nearestExpiry ?? "",
                        supplier: d.supplierName ?? d.manufacturer ?? "",
                    })));
                }
            })
            .catch(() => {
                // Fallback về danh mục thuốc từ /api/pharmacy/drugs
                getDrugs({ limit: 200 })
                    .then(res => {
                        const data = res?.data ?? [];
                        if (Array.isArray(data) && data.length > 0) {
                            setInventory(data.map((d: any) => ({
                                id: d.id, name: d.name, group: d.category,
                                unit: d.unit, stock: d.quantity, min: d.minQuantity,
                                price: d.price, expiry: d.expiryDate, supplier: d.manufacturer,
                            })));
                        }
                    })
                    .catch(() => { setInventory([]); });
            });
    }, []);
    const [search, setSearch] = useState("");
    const [groupFilter, setGroupFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestType, setRequestType] = useState<RequestType>("import");
    const [reqForm, setReqForm] = useState({ medicine: "", qty: "", reason: "" });
    const [activeTab, setActiveTab] = useState<"inventory" | "requests">("inventory");

    const groups = Array.from(new Set(inventory.map((i) => i.group)));

    const filtered = useMemo(() => inventory.filter((i) => {
        const ms = i.name.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search);
        const mg = groupFilter === "all" || i.group === groupFilter;
        const mst = stockFilter === "all" || (stockFilter === "low" && i.stock < i.min) || (stockFilter === "ok" && i.stock >= i.min);
        return ms && mg && mst;
    }), [inventory, search, groupFilter, stockFilter]);

    const lowCount = inventory.filter((i) => i.stock < i.min).length;
    const pendingCount = requests.filter(r => r.status === "pending").length;
    const expiringCount = inventory.filter((i) => {
        if (!i.expiry) return false;
        // Hỗ trợ cả định dạng "MM/YYYY" (mock) và "YYYY-MM-DD" (API)
        const parts = i.expiry.includes("-") ? i.expiry.split("-") : i.expiry.split("/").reverse();
        const expDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        return expDate <= threeMonthsLater;
    }).length;
    const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";

    const handleCreateRequest = async () => {
        if (!reqForm.medicine || !reqForm.qty) return;
        const newReq = {
            id: `YC-${String(requests.length + 1).padStart(3, "0")}`,
            type: requestType,
            medicine: reqForm.medicine,
            qty: parseInt(reqForm.qty),
            reason: reqForm.reason,
            date: new Date().toLocaleDateString("vi-VN"),
            status: "pending" as RequestStatus,
        };
        try {
            await inventoryService.createStockIn({
                drugName: reqForm.medicine,
                quantity: parseInt(reqForm.qty),
                reason: reqForm.reason,
                type: requestType,
            });
            alert("Gửi yêu cầu thành công");
        } catch {
            alert("Gửi yêu cầu thất bại. Vui lòng thử lại.");
            return;
        }
        setRequests(prev => [newReq, ...prev]);
        setShowRequestModal(false);
        setReqForm({ medicine: "", qty: "", reason: "" });
    };

    const openRequestFor = (type: RequestType, medName?: string) => {
        setRequestType(type);
        setReqForm({ medicine: medName || "", qty: "", reason: "" });
        setShowRequestModal(true);
    };

    return (
        <div className="p-6 md:p-8"><div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">{t("title")}</h1>
                    <p className="text-sm text-[#687582] mt-1">{t("subtitle")}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => openRequestFor("import")} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>archive</span>Yêu cầu nhập
                    </button>
                    <button onClick={() => openRequestFor("export")} className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>unarchive</span>Yêu cầu xuất
                    </button>
                    <button onClick={() => openRequestFor("cancel")} className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete_forever</span>Yêu cầu huỷ
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                    { l: "Tổng danh mục", v: inventory.length.toString(), i: "medication", c: "text-blue-600" },
                    { l: "Tồn kho đủ", v: (inventory.length - lowCount).toString(), i: "check_circle", c: "text-emerald-600" },
                    { l: "Sắp hết", v: lowCount.toString(), i: "warning", c: "text-amber-600" },
                    { l: "Sắp hết hạn", v: expiringCount.toString(), i: "event_busy", c: "text-red-500" },
                    { l: "YC chờ duyệt", v: pendingCount.toString(), i: "hourglass_top", c: "text-orange-600" },
                ].map((s) => (
                    <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-3">
                        <span className={`material-symbols-outlined ${s.c}`} style={{ fontSize: "24px" }}>{s.i}</span>
                        <div><p className="text-lg font-bold text-[#121417] dark:text-white">{s.v}</p><p className="text-[10px] text-[#687582]">{s.l}</p></div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {([["inventory", "Tồn kho", "inventory_2"], ["requests", "Yêu cầu", "assignment"]] as const).map(([key, label, icon]) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === key ? "bg-white dark:bg-[#1e242b] text-[#121417] dark:text-white shadow-sm" : "text-[#687582] hover:text-[#121417]"}`}>
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>{label}
                        {key === "requests" && pendingCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white">{pendingCount}</span>}
                    </button>
                ))}
            </div>

            {/* Inventory Tab */}
            {activeTab === "inventory" && (
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex flex-col sm:flex-row gap-3 items-center">
                        <div className="relative flex-1 w-full sm:max-w-xs">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>search</span>
                            <input type="text" placeholder="Tìm thuốc..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] dark:text-white" />
                        </div>
                        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}
                            className="px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] dark:text-white">
                            <option value="all">Tất cả nhóm</option>
                            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}
                            className="px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] dark:text-white">
                            <option value="all">Tất cả tồn kho</option>
                            <option value="low">Sắp hết</option>
                            <option value="ok">Đủ hàng</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b border-[#dde0e4] dark:border-[#2d353e]">
                                {["Mã", "Tên thuốc", "Nhóm", "Tồn kho", "Đơn giá", "Hạn dùng", "NCC", "Thao tác"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={8} className="py-12 text-center text-[#687582] dark:text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                                        Kho thuốc trống hoặc không có dữ liệu
                                    </td></tr>
                                )}
                                {filtered.map((item) => (
                                    <tr key={item.id} className="border-b border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-4 py-3 text-sm font-mono text-[#3C81C6] font-medium">{item.id}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-[#121417] dark:text-white">{item.name}</td>
                                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600">{item.group}</span></td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${item.stock < item.min ? "text-red-500" : "text-[#121417] dark:text-white"}`}>{item.stock}</span>
                                                <span className="text-xs text-[#687582]">/ {item.min} {item.unit}</span>
                                                {item.stock < item.min && <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "16px" }}>warning</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#121417] dark:text-white">{fmt(item.price)}</td>
                                        <td className="px-4 py-3 text-sm text-[#687582]">{item.expiry}</td>
                                        <td className="px-4 py-3 text-sm text-[#687582]">{item.supplier}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openRequestFor("import", item.name)} title="Yêu cầu nhập"
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors opacity-0 group-hover:opacity-100">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>archive</span>
                                                </button>
                                                <button onClick={() => openRequestFor("export", item.name)} title="Yêu cầu xuất"
                                                    className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 text-purple-600 transition-colors opacity-0 group-hover:opacity-100">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>unarchive</span>
                                                </button>
                                                <button onClick={() => openRequestFor("cancel", item.name)} title="Yêu cầu huỷ"
                                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete_forever</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-[#dde0e4] dark:border-[#2d353e] text-sm text-[#687582]">Hiển thị {filtered.length}/{inventory.length} thuốc</div>
                </div>
            )}

            {/* Requests Tab */}
            {activeTab === "requests" && (
                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-[#b0b8c1] mb-2 block">assignment</span>
                            <p className="text-sm text-[#687582]">Chưa có yêu cầu nào</p>
                        </div>
                    ) : (
                        requests.map(req => {
                            const tc = TYPE_CONFIG[req.type];
                            const sc = STATUS_CONFIG[req.status];
                            return (
                                <div key={req.id} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5 hover:shadow-sm transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.cls}`}>
                                            <span className="material-symbols-outlined">{tc.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-xs font-mono font-bold text-[#3C81C6]">{req.id}</span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.cls}`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>{sc.icon}</span>{sc.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tc.cls}`}>{tc.label}</span>
                                            </div>
                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">{req.medicine} — <span className="text-[#3C81C6]">x{req.qty}</span></p>
                                            {req.reason && <p className="text-xs text-[#687582] mt-1">{req.reason}</p>}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs text-[#687582]">{req.date}</p>
                                            {req.status === "pending" && (
                                                <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))}
                                                    className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-0.5 ml-auto">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>Huỷ
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRequestModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                            <h2 className="text-lg font-bold text-[#121417] dark:text-white flex items-center gap-2">
                                <span className={`material-symbols-outlined ${TYPE_CONFIG[requestType].cls.split(" ").find(c => c.startsWith("text-"))}`}>{TYPE_CONFIG[requestType].icon}</span>
                                Tạo yêu cầu {TYPE_CONFIG[requestType].label}
                            </h2>
                            <p className="text-xs text-[#687582] mt-1">Yêu cầu sẽ được gửi đến Admin để phê duyệt</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Request Type Tabs */}
                            <div className="flex gap-2">
                                {(Object.entries(TYPE_CONFIG) as [RequestType, typeof TYPE_CONFIG["import"]][]).map(([key, cfg]) => (
                                    <button key={key} onClick={() => setRequestType(key)}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${requestType === key ? cfg.cls + " ring-2 ring-offset-1" : "bg-gray-100 dark:bg-gray-800 text-[#687582]"}`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{cfg.icon}</span>{cfg.label}
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Tên thuốc *</label>
                                <input type="text" value={reqForm.medicine} onChange={e => setReqForm(p => ({ ...p, medicine: e.target.value }))} placeholder="VD: Amoxicillin 500mg"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Số lượng *</label>
                                <input type="number" value={reqForm.qty} onChange={e => setReqForm(p => ({ ...p, qty: e.target.value }))} placeholder="500"
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1">Lý do</label>
                                <textarea value={reqForm.reason} onChange={e => setReqForm(p => ({ ...p, reason: e.target.value }))} rows={2} placeholder="Mô tả lý do..."
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 resize-none dark:text-white" />
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                                <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5">info</span>
                                <p className="text-xs text-amber-700 dark:text-amber-400">Yêu cầu sẽ được gửi đến <strong>Admin</strong> để phê duyệt. Bạn sẽ nhận thông báo khi có kết quả.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#dde0e4] dark:border-[#2d353e] flex justify-end gap-3">
                            <button onClick={() => setShowRequestModal(false)} className="px-4 py-2.5 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Huỷ</button>
                            <button onClick={handleCreateRequest} disabled={!reqForm.medicine || !reqForm.qty}
                                className="px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 shadow-md shadow-blue-200 dark:shadow-none flex items-center gap-2">
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>send</span>Gửi yêu cầu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div></div>
    );
}
