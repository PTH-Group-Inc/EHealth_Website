"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

const MOCK_PATIENTS = [
    { id: "BN001", name: "Nguyễn Văn An", dob: "15/03/1980", gender: "Nam", phone: "0901234567", cccd: "012345678901", address: "Q.1, TP.HCM", insurance: "HC4012345678", visits: 12, lastVisit: "20/02/2025" },
    { id: "BN002", name: "Lê Thị Bình", dob: "22/07/1993", gender: "Nữ", phone: "0912345678", cccd: "012345678902", address: "Q.3, TP.HCM", insurance: "HC4012345679", visits: 5, lastVisit: "18/02/2025" },
    { id: "BN003", name: "Trần Văn Cường", dob: "08/11/1967", gender: "Nam", phone: "0923456789", cccd: "012345678903", address: "Q.7, TP.HCM", insurance: "HC4012345680", visits: 8, lastVisit: "15/02/2025" },
    { id: "BN004", name: "Phạm Thị Dung", dob: "30/01/1997", gender: "Nữ", phone: "0934567890", cccd: "012345678904", address: "Q.Bình Thạnh", insurance: "", visits: 2, lastVisit: "10/02/2025" },
    { id: "BN005", name: "Hoàng Văn Em", dob: "12/09/2020", gender: "Nam", phone: "0945678901", cccd: "", address: "Q.Gò Vấp", insurance: "HC4012345682", visits: 15, lastVisit: "24/02/2025" },
    { id: "BN006", name: "Vũ Thị Fương", dob: "05/06/1985", gender: "Nữ", phone: "0956789012", cccd: "012345678906", address: "Q.2, TP.HCM", insurance: "HC4012345683", visits: 3, lastVisit: "05/02/2025" },
];

export default function ReceptionistPatients() {
    const router = useRouter();
    const [patients, setPatients] = useState(MOCK_PATIENTS);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [newPatient, setNewPatient] = useState({ name: "", phone: "", dob: "", gender: "Nam", cccd: "", insurance: "", address: "", history: "" });

    const handleRegister = () => {
        if (!newPatient.name || !newPatient.phone) { alert("Vui lòng nhập họ tên và số điện thoại"); return; }
        const newId = `BN${String(patients.length + 1).padStart(3, "0")}`;
        setPatients([...patients, {
            id: newId, name: newPatient.name, dob: newPatient.dob || "--", gender: newPatient.gender,
            phone: newPatient.phone, cccd: newPatient.cccd, address: newPatient.address || "--",
            insurance: newPatient.insurance, visits: 0, lastVisit: "Mới đăng ký"
        }]);
        setNewPatient({ name: "", phone: "", dob: "", gender: "Nam", cccd: "", insurance: "", address: "", history: "" });
        setShowModal(false);
    };

    const filtered = useMemo(() => patients.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search) || p.phone.includes(search) || p.cccd.includes(search)
    ), [patients, search]);

    return (
        <div className="p-6 md:p-8"><div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Quản lý Bệnh nhân</h1>
                    <p className="text-sm text-[#687582] mt-1">Đăng ký mới và quản lý thông tin bệnh nhân</p>
                </div>
                <button onClick={() => window.location.href = '/portal/receptionist/patients/new'} className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#3C81C6]/20">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>Đăng ký BN mới
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { l: "Tổng bệnh nhân", v: "10,847", i: "groups", c: "from-blue-500 to-blue-600" },
                    { l: "Đăng ký hôm nay", v: "8", i: "person_add", c: "from-emerald-500 to-emerald-600" },
                    { l: "Có BHYT", v: "78%", i: "health_and_safety", c: "from-violet-500 to-violet-600" },
                ].map((s) => (
                    <div key={s.l} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-white" style={{ fontSize: "22px" }}>{s.i}</span>
                        </div>
                        <div><p className="text-2xl font-bold text-[#121417] dark:text-white">{s.v}</p><p className="text-sm text-[#687582]">{s.l}</p></div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>search</span>
                        <input type="text" placeholder="Tìm tên, mã BN, SĐT, CCCD..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6]" />
                    </div>
                    <button className="px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm text-[#687582] hover:text-[#121417] transition-colors flex items-center gap-1.5">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>Xuất Excel
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-[#dde0e4] dark:border-[#2d353e]">
                            {["Mã BN", "Họ tên", "Ngày sinh", "SĐT", "BHYT", "Lần khám", "Khám gần nhất", "Thao tác"].map((h) => (
                                <th key={h} className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id} className="border-b border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-4 py-3 text-sm font-mono text-[#3C81C6] font-medium">{p.id}</td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-semibold text-[#121417] dark:text-white">{p.name}</p>
                                        <p className="text-xs text-[#687582]">{p.gender} • {p.address}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#121417] dark:text-white">{p.dob}</td>
                                    <td className="px-4 py-3 text-sm text-[#121417] dark:text-white">{p.phone}</td>
                                    <td className="px-4 py-3">
                                        {p.insurance ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                                                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>check</span>Có
                                            </span>
                                        ) : (
                                            <span className="text-xs text-[#687582]">Không</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-[#121417] dark:text-white">{p.visits}</td>
                                    <td className="px-4 py-3 text-sm text-[#687582]">{p.lastVisit}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => router.push(`/portal/receptionist/patients/${p.id}`)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors" title="Xem hồ sơ">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>
                                            </button>
                                            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#687582] transition-colors" title="Sửa">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                                            </button>
                                            <button className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 transition-colors" title="Đặt lịch">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>event_available</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-[#dde0e4] dark:border-[#2d353e] text-sm text-[#687582]">
                    Hiển thị {filtered.length} bệnh nhân
                </div>
            </div>

            {/* New Patient Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1e242b] z-10">
                            <h2 className="text-lg font-bold text-[#121417] dark:text-white">Đăng ký bệnh nhân mới</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><span className="material-symbols-outlined text-[#687582]">close</span></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { l: "Họ và tên *", p: "Nhập họ tên đầy đủ", t: "text", k: "name" },
                                { l: "Số điện thoại *", p: "0901234567", t: "tel", k: "phone" },
                            ].map((f) => (
                                <div key={f.l}><label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">{f.l}</label>
                                    <input type={f.t} placeholder={f.p} value={newPatient[f.k as keyof typeof newPatient]} onChange={(e) => setNewPatient({ ...newPatient, [f.k]: e.target.value })} className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]" /></div>
                            ))}
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Ngày sinh *</label>
                                    <input type="date" value={newPatient.dob} onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })} className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]" /></div>
                                <div><label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Giới tính *</label>
                                    <select value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]">
                                        <option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
                            </div>
                            {[
                                { l: "CCCD/CMND", p: "Số căn cước công dân", k: "cccd" },
                                { l: "Số BHYT", p: "HC4012345678", k: "insurance" },
                                { l: "Địa chỉ", p: "Địa chỉ cư trú", k: "address" },
                            ].map((f) => (
                                <div key={f.l}><label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">{f.l}</label>
                                    <input type="text" placeholder={f.p} value={newPatient[f.k as keyof typeof newPatient]} onChange={(e) => setNewPatient({ ...newPatient, [f.k]: e.target.value })} className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]" /></div>
                            ))}
                            <div><label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Tiền sử bệnh</label>
                                <textarea placeholder="Dị ứng, bệnh nền..." value={newPatient.history} onChange={(e) => setNewPatient({ ...newPatient, history: e.target.value })} className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6] resize-none h-16" /></div>
                        </div>
                        <div className="p-6 border-t border-[#dde0e4] dark:border-[#2d353e] flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#1e242b]">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Hủy</button>
                            <button onClick={handleRegister} className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>Đăng ký & In phiếu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div></div>
    );
}
