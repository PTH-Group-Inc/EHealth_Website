"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SERVICES = [
    { name: "Khám tổng quát", price: 200000 }, { name: "Khám chuyên khoa", price: 350000 },
    { name: "Xét nghiệm máu cơ bản", price: 250000 }, { name: "Xét nghiệm máu nâng cao", price: 500000 },
    { name: "Xét nghiệm nước tiểu", price: 100000 }, { name: "Chụp X-quang", price: 300000 },
    { name: "Siêu âm tổng quát", price: 350000 }, { name: "Siêu âm tim", price: 500000 },
    { name: "Điện tâm đồ (ECG)", price: 150000 }, { name: "CT Scan", price: 2000000 },
    { name: "MRI", price: 3500000 }, { name: "Nội soi dạ dày", price: 800000 },
];

const PAYMENT_METHODS = ["Tiền mặt", "Chuyển khoản", "Thẻ tín dụng", "Ví điện tử"];

export default function NewBillingPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [fd, setFd] = useState({
        patientName: "", patientId: "", phone: "", insurance: "",
        insurancePercent: "80", paymentMethod: "Tiền mặt", note: "",
    });
    const [selectedServices, setSelectedServices] = useState<number[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFd((p) => ({ ...p, [name]: value }));
    };

    const toggleService = (idx: number) => {
        setSelectedServices((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
    };

    const subtotal = selectedServices.reduce((sum, idx) => sum + SERVICES[idx].price, 0);
    const insuranceDiscount = fd.insurance ? Math.round(subtotal * (Number(fd.insurancePercent) || 0) / 100) : 0;
    const total = subtotal - insuranceDiscount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fd.patientName || selectedServices.length === 0) { alert("Vui lòng nhập tên bệnh nhân và chọn dịch vụ"); return; }
        setSaving(true);
        await new Promise((r) => setTimeout(r, 1000));
        setSaving(false);
        alert("Tạo hóa đơn thành công!");
        router.push("/portal/receptionist/billing");
    };

    const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/portal/receptionist/billing" className="hover:text-[#3C81C6]">Thanh toán</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Tạo hóa đơn mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Form */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                    <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                        <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]">receipt_long</span> Tạo hóa đơn mới
                        </h1>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Inp label="Tên bệnh nhân *" name="patientName" value={fd.patientName} onChange={handleChange} placeholder="Nguyễn Văn A" />
                            <Inp label="Mã bệnh nhân" name="patientId" value={fd.patientId} onChange={handleChange} placeholder="BN001" />
                            <Inp label="Số điện thoại" name="phone" value={fd.phone} onChange={handleChange} placeholder="0901 234 567" />
                            <Inp label="Số BHYT" name="insurance" value={fd.insurance} onChange={handleChange} placeholder="HC4012345678" />
                            {fd.insurance && (
                                <Inp label="% BHYT chi trả" name="insurancePercent" type="number" value={fd.insurancePercent} onChange={handleChange} placeholder="80" />
                            )}
                            <Sel label="Phương thức thanh toán" name="paymentMethod" value={fd.paymentMethod} onChange={handleChange} options={PAYMENT_METHODS} />
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[#121417] dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-[#3C81C6]">medical_services</span> Chọn dịch vụ
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {SERVICES.map((s, idx) => (
                                    <button key={idx} type="button" onClick={() => toggleService(idx)}
                                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedServices.includes(idx)
                                            ? "bg-[#3C81C6]/5 border-[#3C81C6]/30 ring-1 ring-[#3C81C6]/20"
                                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-[18px] ${selectedServices.includes(idx) ? "text-[#3C81C6]" : "text-gray-400"}`}>
                                                {selectedServices.includes(idx) ? "check_circle" : "radio_button_unchecked"}
                                            </span>
                                            <span className="text-sm text-[#121417] dark:text-white">{s.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-[#3C81C6]">{fmt(s.price)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                            <textarea name="note" value={fd.note} onChange={handleChange} rows={2} placeholder="Ghi chú thêm..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white resize-none" />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                                {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Tạo hóa đơn</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right: Summary */}
                <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm h-fit sticky top-6">
                    <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                        <h2 className="text-sm font-bold text-[#121417] dark:text-white">Tóm tắt hóa đơn</h2>
                    </div>
                    <div className="p-6 space-y-3">
                        {selectedServices.length === 0 ? (
                            <p className="text-sm text-[#687582] text-center py-4">Chưa chọn dịch vụ nào</p>
                        ) : (
                            selectedServices.map((idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-[#121417] dark:text-gray-300">{SERVICES[idx].name}</span>
                                    <span className="font-medium text-[#121417] dark:text-white">{fmt(SERVICES[idx].price)}</span>
                                </div>
                            ))
                        )}
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-[#687582]">Tạm tính</span><span className="font-medium">{fmt(subtotal)}</span></div>
                            {insuranceDiscount > 0 && (
                                <div className="flex justify-between text-sm"><span className="text-green-600">BHYT ({fd.insurancePercent}%)</span><span className="text-green-600 font-medium">-{fmt(insuranceDiscount)}</span></div>
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

function Inp({ label, name, type = "text", value, onChange, placeholder }: { label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400" /></div>);
}
function Sel({ label, name, value, onChange, options }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[] }) {
    return (<div><label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label><select name={name} value={value} onChange={onChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>);
}
