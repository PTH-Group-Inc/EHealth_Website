"use client";

import { useState, useMemo } from "react";

// Mock data
const MOCK_APPOINTMENTS = [
    { id: "LH001", patient: "Nguyễn Văn An", phone: "0901234567", doctor: "BS. Trần Minh", dept: "Nội khoa", date: "25/02/2025", time: "08:30", type: "Tái khám", status: "confirmed", note: "Tái khám theo dõi huyết áp" },
    { id: "LH002", patient: "Lê Thị Bình", phone: "0912345678", doctor: "BS. Phạm Hoa", dept: "Da liễu", date: "25/02/2025", time: "08:45", type: "Khám mới", status: "confirmed", note: "Ngứa da kéo dài" },
    { id: "LH003", patient: "Trần Văn Cường", phone: "0923456789", doctor: "BS. Ngô Đức", dept: "Tim mạch", date: "25/02/2025", time: "09:00", type: "Khám mới", status: "pending", note: "Đau ngực, khó thở" },
    { id: "LH004", patient: "Phạm Thị Dung", phone: "0934567890", doctor: "BS. Trần Minh", dept: "Nội khoa", date: "25/02/2025", time: "09:15", type: "Tái khám", status: "confirmed", note: "Kiểm tra kết quả xét nghiệm" },
    { id: "LH005", patient: "Hoàng Văn Em", phone: "0945678901", doctor: "BS. Lý Thanh", dept: "Nhi khoa", date: "25/02/2025", time: "09:30", type: "Khám mới", status: "pending", note: "Bé sốt cao, ho" },
    { id: "LH006", patient: "Vũ Thị Fương", phone: "0956789012", doctor: "BS. Phạm Hoa", dept: "Da liễu", date: "25/02/2025", time: "09:45", type: "Tái khám", status: "cancelled", note: "Bệnh nhân hủy lịch" },
    { id: "LH007", patient: "Đỗ Quang Giang", phone: "0967890123", doctor: "BS. Ngô Đức", dept: "Tim mạch", date: "25/02/2025", time: "10:00", type: "Khám mới", status: "confirmed", note: "Kiểm tra tim định kỳ" },
    { id: "LH008", patient: "Bùi Thị Hằng", phone: "0978901234", doctor: "BS. Lý Thanh", dept: "Nhi khoa", date: "25/02/2025", time: "10:15", type: "Khám mới", status: "pending", note: "Bé phát ban" },
];

const STATUS_MAP: Record<string, { label: string; class: string }> = {
    confirmed: { label: "Đã xác nhận", class: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" },
    pending: { label: "Chờ xác nhận", class: "bg-amber-50 dark:bg-amber-500/10 text-amber-600" },
    cancelled: { label: "Đã hủy", class: "bg-red-50 dark:bg-red-500/10 text-red-500" },
    completed: { label: "Hoàn thành", class: "bg-blue-50 dark:bg-blue-500/10 text-blue-600" },
};

export default function ReceptionistAppointments() {
    const [appointments] = useState(MOCK_APPOINTMENTS);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");
    const [showNewModal, setShowNewModal] = useState(false);

    const filtered = useMemo(() => {
        return appointments.filter((apt) => {
            const matchSearch = apt.patient.toLowerCase().includes(searchQuery.toLowerCase()) || apt.id.toLowerCase().includes(searchQuery.toLowerCase()) || apt.phone.includes(searchQuery);
            const matchStatus = statusFilter === "all" || apt.status === statusFilter;
            const matchDept = deptFilter === "all" || apt.dept === deptFilter;
            return matchSearch && matchStatus && matchDept;
        });
    }, [appointments, searchQuery, statusFilter, deptFilter]);

    const departments = Array.from(new Set(appointments.map((a) => a.dept)));

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#121417] dark:text-white">Quản lý Lịch hẹn</h1>
                        <p className="text-sm text-[#687582] mt-1">Xem và quản lý lịch hẹn khám bệnh của bệnh nhân</p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/portal/receptionist/appointments/new'}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#3C81C6]/20"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                        Tạo lịch hẹn mới
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Tổng lịch hẹn", value: appointments.length, icon: "calendar_month", color: "text-blue-600" },
                        { label: "Đã xác nhận", value: appointments.filter((a) => a.status === "confirmed").length, icon: "check_circle", color: "text-emerald-600" },
                        { label: "Chờ xác nhận", value: appointments.filter((a) => a.status === "pending").length, icon: "pending", color: "text-amber-600" },
                        { label: "Đã hủy", value: appointments.filter((a) => a.status === "cancelled").length, icon: "cancel", color: "text-red-500" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e] p-4 flex items-center gap-4">
                            <span className={`material-symbols-outlined ${stat.color}`} style={{ fontSize: "28px" }}>{stat.icon}</span>
                            <div>
                                <p className="text-xl font-bold text-[#121417] dark:text-white">{stat.value}</p>
                                <p className="text-xs text-[#687582]">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#1e242b] rounded-xl border border-[#dde0e4] dark:border-[#2d353e]">
                    {/* Filters */}
                    <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e] flex flex-col sm:flex-row gap-3 items-center">
                        <div className="relative flex-1 w-full sm:max-w-xs">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#687582]" style={{ fontSize: "20px" }}>search</span>
                            <input
                                type="text"
                                placeholder="Tìm theo tên, mã, SĐT..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6] transition-colors"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6]"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="px-3 py-2 bg-[#f6f7f8] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm outline-none focus:border-[#3C81C6]"
                        >
                            <option value="all">Tất cả khoa</option>
                            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#dde0e4] dark:border-[#2d353e]">
                                    <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Mã</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Bệnh nhân</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Giờ hẹn</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Bác sĩ</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Loại</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Trạng thái</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[#687582] uppercase">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((apt) => (
                                    <tr key={apt.id} className="border-b border-[#dde0e4] dark:border-[#2d353e] hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-4 py-3 text-sm font-mono text-[#3C81C6] font-medium">{apt.id}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">{apt.patient}</p>
                                            <p className="text-xs text-[#687582]">{apt.phone}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-[#121417] dark:text-white">{apt.time}</p>
                                            <p className="text-xs text-[#687582]">{apt.date}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-[#121417] dark:text-white">{apt.doctor}</p>
                                            <p className="text-xs text-[#687582]">{apt.dept}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${apt.type === "Tái khám" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" : "bg-violet-50 dark:bg-violet-500/10 text-violet-600"}`}>
                                                {apt.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_MAP[apt.status]?.class}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                {STATUS_MAP[apt.status]?.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {apt.status === "pending" && (
                                                    <button className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 transition-colors" title="Xác nhận">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                                                    </button>
                                                )}
                                                <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 transition-colors" title="Tiếp nhận">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>how_to_reg</span>
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#687582] transition-colors" title="Dời lịch">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>schedule</span>
                                                </button>
                                                {apt.status !== "cancelled" && (
                                                    <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors" title="Hủy">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between text-sm text-[#687582]">
                        <span>Hiển thị {filtered.length}/{appointments.length} lịch hẹn</span>
                    </div>
                </div>

                {/* New Appointment Modal */}
                {showNewModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
                        <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center justify-between">
                                <h2 className="text-lg font-bold text-[#121417] dark:text-white">Tạo lịch hẹn mới</h2>
                                <button onClick={() => setShowNewModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <span className="material-symbols-outlined text-[#687582]">close</span>
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Bệnh nhân</label>
                                    <input type="text" placeholder="Tìm hoặc nhập tên bệnh nhân..." className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Ngày hẹn</label>
                                        <input type="date" className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Giờ hẹn</label>
                                        <input type="time" className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Chuyên khoa</label>
                                    <select className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]">
                                        <option value="">Chọn chuyên khoa</option>
                                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Bác sĩ</label>
                                    <select className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6]">
                                        <option value="">Chọn bác sĩ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-white mb-1">Ghi chú</label>
                                    <textarea placeholder="Lý do khám, triệu chứng..." className="w-full px-3 py-2 border border-[#dde0e4] dark:border-[#2d353e] rounded-lg text-sm bg-white dark:bg-[#13191f] outline-none focus:border-[#3C81C6] resize-none h-20" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-[#dde0e4] dark:border-[#2d353e] flex justify-end gap-3">
                                <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm font-medium text-[#687582] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    Hủy
                                </button>
                                <button className="px-4 py-2 bg-[#3C81C6] hover:bg-[#2a6da8] text-white text-sm font-medium rounded-lg transition-colors">
                                    Tạo lịch hẹn
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
