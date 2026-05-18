"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import axiosClient from "@/api/axiosClient";

const TABS = [
    { key: "doctors", label: "Bác sĩ", icon: "person_search" },
    { key: "coordination", label: "Điều phối", icon: "auto_awesome" },
    { key: "booking", label: "Cấu hình", icon: "tune" },
    { key: "operating", label: "Hoạt động", icon: "schedule" },
    { key: "facilities", label: "Cơ sở", icon: "business" },
    { key: "services", label: "Dịch vụ", icon: "medical_services" },
] as const;

type TabKey = typeof TABS[number]["key"];

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };

function fetchData(url: string): Promise<any[]> {
    return axiosClient.get(url).then(r => {
        const d = r?.data?.data ?? r?.data ?? [];
        if (Array.isArray(d)) return d;
        if (typeof d === 'object' && d !== null) {
            return Object.values(d).flat();
        }
        return [];
    }).catch(() => []);
}

function DoctorsTab() {
    const router = useRouter();
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!date) return;
        setLoading(true);
        fetchData(`/api/doctor-availability/by-date/${date}`).then(d => { setItems(d); setLoading(false); });
    }, [date]);

    return (
        <div>
            <div className="flex items-center justify-between bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded p-2 mb-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Ngày</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-[#2d353e] bg-gray-50 dark:bg-[#121417] focus:ring-1 focus:ring-blue-500 outline-none transition-shadow" />
                </div>
                <button onClick={() => setDate(new Date().toISOString().slice(0, 10))} className="px-3 py-1 text-xs font-medium text-white bg-[#3C81C6] hover:bg-[#2b6cb0] rounded transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">refresh</span> Làm mới
                </button>
            </div>
            {loading ? <p className="p-4 text-center text-xs text-gray-500">Đang tải…</p>
            : items.length === 0 ? <EmptyState icon="person_off" title="Không có bác sĩ khả dụng" compact />
            : (
                <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm overflow-hidden">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 dark:bg-[#252b33] text-gray-500 border-b border-gray-200 dark:border-[#2d353e]">
                            <tr><th className="text-left px-3 py-2 font-medium">Bác sĩ</th><th className="text-left px-3 py-2 font-medium">Chuyên khoa</th><th className="text-left px-3 py-2 font-medium">Khả dụng</th><th className="text-center px-3 py-2 font-medium">Slot trống</th><th className="text-right px-3 py-2 font-medium">Thao tác</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#2d353e]">
                            {items.map((d: any, i: number) => (
                                <tr key={d.id ?? i} className="hover:bg-gray-50 dark:hover:bg-[#252b33] transition-colors">
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100 font-medium">{d.doctor_name ?? d.doctorName ?? d.full_name}</td>
                                    <td className="px-3 py-2 text-gray-500">{d.specialty_name ?? d.specialty ?? "—"}</td>
                                    <td className="px-3 py-2">
                                        {d.is_available || d.available ? <span className="text-emerald-600 font-medium">Có</span> : <span className="text-rose-600 font-medium">Bận</span>}
                                    </td>
                                    <td className="px-3 py-2 text-center">{d.available_slots ?? d.slot_count ?? 0}</td>
                                    <td className="px-3 py-2 text-right">
                                        <button onClick={() => router.push(`/portal/receptionist/appointments/new?doctor_id=${d.doctor_id ?? d.id}`)} className="text-[#3C81C6] hover:text-[#2b6cb0] font-medium mr-3">Đặt khám</button>
                                        <button className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Xem lịch</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function CoordinationTab() {
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [load, setLoad] = useState<any[]>([]);
    const [balance, setBalance] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!date) return;
        setLoading(true);
        Promise.allSettled([
            fetchData(`/api/appointment-coordination/doctor-load?date=${date}`),
            axiosClient.get(`/api/appointment-coordination/balance-overview?date=${date}`).then(r => r?.data?.data ?? r?.data).catch(() => null),
        ]).then(([l, b]) => {
            if (l.status === "fulfilled") setLoad(l.value);
            if (b.status === "fulfilled") setBalance(b.value);
            setLoading(false);
        });
    }, [date]);

    return (
        <div>
            <div className="flex items-center justify-between bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded p-2 mb-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Ngày</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-[#2d353e] bg-gray-50 dark:bg-[#121417] focus:ring-1 focus:ring-[#3C81C6] outline-none transition-shadow" />
                </div>
                 <button onClick={() => setDate(new Date().toISOString().slice(0, 10))} className="px-3 py-1 text-xs font-medium text-white bg-[#3C81C6] hover:bg-[#2b6cb0] rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">sync</span> Phân tích
                </button>
            </div>
            
            {loading ? <p className="p-4 text-center text-xs text-gray-500">Đang tải dữ liệu…</p> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm">
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2d353e] bg-gray-50 dark:bg-[#252b33]">
                            <h3 className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-[#3C81C6]">group</span> Tải bác sĩ</h3>
                        </div>
                        <div className="p-0">
                            {load.length === 0 ? <EmptyState icon="balance" title="Không có dữ liệu" compact />
                            : (
                                <ul className="divide-y divide-gray-100 dark:divide-[#2d353e] max-h-[300px] overflow-y-auto text-xs">
                                    {load.map((d: any, i: number) => {
                                        const percent = d.load_percentage ?? d.percentage ?? 0;
                                        return (
                                            <li key={d.id ?? i} className="px-3 py-2 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-[#252b33]">
                                                <div>
                                                    <div className="text-gray-900 dark:text-white font-medium">{d.doctor_name ?? "—"}</div>
                                                    <div className="text-[10px] text-gray-500">{d.appointment_count ?? d.load_count ?? 0} lịch chờ</div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-medium ${percent > 80 ? 'text-rose-600' : percent > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>{percent}%</span>
                                                    <span className="text-[9px] text-gray-400 uppercase">{d.status ?? "NORMAL"}</span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm flex flex-col">
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2d353e] bg-gray-50 dark:bg-[#252b33]">
                            <h3 className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-amber-500">analytics</span> Tổng quan</h3>
                        </div>
                        <div className="p-3 flex-1 text-xs bg-gray-50/50 dark:bg-transparent">
                            {!balance ? <div className="h-full flex items-center justify-center"><p className="italic text-gray-500">Chưa có dữ liệu</p></div>
                            : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white dark:bg-[#1e242b] p-2 rounded border border-gray-200 dark:border-[#2d353e]">
                                            <div className="text-[10px] text-gray-500 mb-0.5">Điểm cân bằng</div>
                                            <div className="text-base font-bold text-[#3C81C6]">{balance.balance_score ?? 0}/100</div>
                                        </div>
                                        <div className="bg-white dark:bg-[#1e242b] p-2 rounded border border-gray-200 dark:border-[#2d353e]">
                                            <div className="text-[10px] text-gray-500 mb-0.5">Tổng lịch</div>
                                            <div className="text-base font-bold text-gray-900 dark:text-white">{balance.total_appointments ?? 0}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-[#1e242b] p-2 rounded border border-gray-200 dark:border-[#2d353e]">
                                        <div className="text-[10px] font-medium mb-1.5 text-gray-700 dark:text-gray-300">Thống kê</div>
                                        <div className="flex justify-between text-[11px] mb-1 text-gray-600 dark:text-gray-400"><span>TB:</span> <span>{balance.average_load ?? 0}</span></div>
                                        <div className="flex justify-between text-[11px] mb-1 text-gray-600 dark:text-gray-400"><span>Min:</span> <span>{balance.min_load ?? 0}</span></div>
                                        <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-400"><span>Max:</span> <span>{balance.max_load ?? 0}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BookingConfigTab() {
    const [branches, setBranches] = useState<any[]>([]);
    const [branchId, setBranchId] = useState("");
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData("/api/branches/dropdown").then(b => {
            setBranches(b);
            if (b.length > 0) setBranchId(b[0].id ?? b[0].branch_id);
        });
    }, []);

    useEffect(() => {
        if (!branchId) return;
        setLoading(true);
        axiosClient.get(`/api/booking-configs/branch/${branchId}`)
            .then(r => setConfig(r?.data?.data ?? r?.data))
            .catch(() => setConfig(null))
            .finally(() => setLoading(false));
    }, [branchId]);

    return (
        <div>
            <div className="flex items-center justify-between bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded p-2 mb-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Chi nhánh</label>
                    <select value={branchId} onChange={e => setBranchId(e.target.value)} className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-[#2d353e] bg-gray-50 dark:bg-[#121417] focus:ring-1 focus:ring-[#3C81C6] outline-none min-w-[150px]">
                        {branches.map((b: any, i: number) => <option key={b.id ?? b.branch_id ?? b.branches_id ?? `branch-${i}`} value={b.id ?? b.branch_id ?? b.branches_id}>{b.name ?? b.branch_name}</option>)}
                    </select>
                </div>
                <button className="px-3 py-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] hover:bg-gray-50 rounded transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">edit</span> Thay đổi
                </button>
            </div>
            
            {loading ? <p className="text-xs text-center text-gray-500 p-4">Đang tải…</p>
            : !config ? <EmptyState icon="tune" title="Không có cấu hình nào" compact />
            : (
                <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm text-xs">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2d353e] bg-gray-50 dark:bg-[#252b33]">
                        <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-emerald-600">settings_suggest</span> Chi tiết Cấu hình</h3>
                    </div>
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Quy Tắc Đặt Khám</h4>
                            <div className="space-y-1.5 text-gray-700 dark:text-gray-300">
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#2d353e]/50"><span>Max đặt trước:</span> <span className="font-medium">{config.advance_booking_days} ngày</span></div>
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#2d353e]/50"><span>Tối thiểu đặt trước:</span> <span className="font-medium">{config.minimum_booking_hours} giờ</span></div>
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#2d353e]/50"><span>Cho phép huỷ trước:</span> <span className="font-medium">{config.cancellation_allowed_hours} giờ</span></div>
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#2d353e]/50"><span>Max bệnh nhân / slot:</span> <span className="font-medium">{config.max_patients_per_slot}</span></div>
                                <div className="flex justify-between py-1"><span>TG nghỉ giữa slot:</span> <span className="font-medium">{config.buffer_duration} phút</span></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Thanh Toán & Hệ Thống</h4>
                            <div className="space-y-1.5 text-gray-700 dark:text-gray-300">
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#2d353e]/50"><span>Thu phí đặt lịch:</span> <span>{config.pre_booking_enabled ? <span className="text-amber-600 font-medium">Bật</span> : "Tắt"}</span></div>
                                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-[#2d353e]/50"><span>Mức phí thu:</span> <span><span className="text-emerald-600 font-medium">{config.pre_booking_fee ? `${config.pre_booking_fee.toLocaleString()} VND` : '0 VND'}</span></span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OperatingTab() {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [facilityId, setFacilityId] = useState("");
    const [slots, setSlots] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [hours, setHours] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [todayStatus, setTodayStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData("/api/facilities/dropdown").then(f => {
            setFacilities(f);
            if (f.length > 0) setFacilityId(f[0].id ?? f[0].facility_id);
        });
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.allSettled([
            fetchData("/api/slots"),
            fetchData("/api/shifts"),
            fetchData("/api/operating-hours"),
            fetchData("/api/holidays"),
            facilityId ? axiosClient.get(`/api/facility-status/today?facility_id=${facilityId}`).then(r => r?.data?.data ?? r?.data).catch(() => null) : Promise.resolve(null),
        ]).then(([s, sh, h, ho, t]) => {
            if (s.status === "fulfilled") setSlots(s.value);
            if (sh.status === "fulfilled") setShifts(sh.value);
            if (h.status === "fulfilled") setHours(h.value);
            if (ho.status === "fulfilled") setHolidays(ho.value);
            if (t.status === "fulfilled") setTodayStatus(t.value);
            setLoading(false);
        });
    }, [facilityId]);

    return (
        <div>
            <div className="flex items-center justify-between bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded p-2 mb-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Cơ sở</label>
                    <select value={facilityId} onChange={e => setFacilityId(e.target.value)} className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-[#2d353e] bg-gray-50 dark:bg-[#121417] focus:ring-1 focus:ring-[#3C81C6] outline-none min-w-[150px]">
                        <option value="">-- Chọn cơ sở --</option>
                        {facilities.map((f: any, i: number) => <option key={f.id ?? f.facility_id ?? i} value={f.id ?? f.facility_id}>{f.name}</option>)}
                    </select>
                </div>
            </div>

            {loading ? <p className="text-xs text-center text-gray-500 p-4">Đang tải…</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm md:col-span-2 flex items-center p-3 gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                        <span className="material-symbols-outlined text-[20px] text-[#3C81C6]">storefront</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">Trạng thái cơ sở hôm nay</h4>
                        {!todayStatus ? <p className="text-[10px] text-gray-500">Chưa có thông tin</p>
                        : (
                            <div className="flex items-center gap-2 text-[11px]">
                                {todayStatus.is_open ? <span className="text-emerald-600 font-medium">ĐANG MỞ CỬA</span> : <span className="text-rose-600 font-medium">ĐÓNG CỬA</span>}
                                {todayStatus.is_open && <span className="text-gray-500">Giờ mở: <span className="font-medium text-gray-900 dark:text-white">{todayStatus.open_time} - {todayStatus.close_time}</span></span>}
                                {todayStatus.reason && <span className="text-gray-500">Lý do: {todayStatus.reason} {todayStatus.note ? `(${todayStatus.note})` : ''}</span>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2d353e] flex justify-between items-center bg-gray-50 dark:bg-[#252b33]">
                        <h4 className="font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-[#3C81C6]">event_available</span> Slots ({slots.length})</h4>
                    </div>
                    <ul className="p-1 space-y-0.5 max-h-[300px] overflow-y-auto">
                        {slots.map((s: any, i: number) => (
                            <li key={s.id ?? i} className="px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded flex flex-col gap-0.5 text-gray-900 dark:text-gray-100">
                                <span className="font-medium text-[11px] text-[#3C81C6]">{s.name ? s.name : `Slot ${s.start_time}`}</span> 
                                <span className="text-gray-500 text-[10px] font-mono bg-gray-100 dark:bg-[#121417] px-1 py-0.5 rounded w-fit">{s.start_time} - {s.end_time}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2d353e] flex justify-between items-center bg-gray-50 dark:bg-[#252b33]">
                        <h4 className="font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-amber-500">work_history</span> Ca ({shifts.length})</h4>
                    </div>
                    <ul className="p-1 space-y-0.5 max-h-[300px] overflow-y-auto">
                        {shifts.map((s: any, i: number) => <li key={s.id ?? i} className="px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded flex justify-between items-center text-gray-900 dark:text-gray-100"><span className="font-medium text-[11px] text-amber-600">{s.name ?? s.code}</span> <span className="text-gray-500 font-mono text-[10px] bg-gray-100 dark:bg-[#121417] px-1 py-0.5 rounded">{s.start_time} - {s.end_time}</span></li>)}
                    </ul>
                </div>

                <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2d353e] flex justify-between items-center bg-gray-50 dark:bg-[#252b33]">
                        <h4 className="font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-emerald-600">access_time</span> Giờ HĐ</h4>
                    </div>
                    <ul className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                        {hours.slice(0, 7).map((h: any, i: number) => {
                            const daysOfWeek = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
                            const dayIndex = parseInt(h.day_of_week);
                            const dayName = !isNaN(dayIndex) ? daysOfWeek[dayIndex] : (h.day ?? h.day_of_week);
                            return (
                                <li key={i} className="flex justify-between items-center px-1 py-1 border-b border-gray-100 dark:border-[#2d353e]/50 last:border-0">
                                    <span className="text-gray-900 dark:text-gray-100 font-medium">{dayName}</span>
                                    {h.is_closed ? <span className="text-rose-500 font-medium">Đóng cửa</span> : <span className="text-gray-500 bg-gray-100 dark:bg-[#121417] px-2 py-0.5 rounded font-mono text-[10px]">{h.open_time ?? "—"} - {h.close_time ?? "—"}</span>}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2d353e] flex justify-between items-center bg-gray-50 dark:bg-[#252b33]">
                        <h4 className="font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-rose-500">celebration</span> Ngày lễ</h4>
                    </div>
                    <ul className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                        {holidays.length === 0 ? <li className="text-gray-500 text-center italic text-[10px] py-4">Không có ngày lễ</li> :
                        holidays.map((h: any, i: number) => (
                            <li key={h.holiday_id ?? h.id ?? i} className="flex flex-col gap-0.5 px-1 border-b border-gray-50 dark:border-[#2d353e]/50 last:border-0 pb-1">
                                <div className="flex justify-between items-center"><span className="text-gray-900 dark:text-white font-medium text-[12px] text-rose-600">{h.title ?? h.name ?? h.reason}</span> <span className="text-gray-500 text-[10px] font-mono">{fmt(h.holiday_date ?? h.date)}</span></div>
                                <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-[#252b33] px-1 py-0.5 rounded self-start mt-1 font-mono">{h.is_closed ? "Đóng cửa" : `Mở cửa: ${h.special_open_time ?? h.open_time ?? "—"} - ${h.special_close_time ?? h.close_time ?? "—"}`}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            )}
        </div>
    );
}

function FacilitiesTab() {
    const [facs, setFacs] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [depts, setDepts] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);

    useEffect(() => {
        Promise.allSettled([
            fetchData("/api/facilities/dropdown"),
            fetchData("/api/branches/dropdown"),
            fetchData("/api/departments/dropdown"),
            fetchData("/api/medical-rooms"),
        ]).then(([f, b, d, r]) => {
            if (f.status === "fulfilled") setFacs(f.value);
            if (b.status === "fulfilled") setBranches(b.value);
            if (d.status === "fulfilled") setDepts(d.value);
            if (r.status === "fulfilled") setRooms(r.value);
        });
    }, []);

    const cards = [
        { title: "Cơ sở", data: facs, icon: "domain", color: "text-blue-500" },
        { title: "Chi nhánh", data: branches, icon: "business", color: "text-indigo-500" },
        { title: "Khoa/Phòng", data: depts, icon: "category", color: "text-emerald-500" },
        { title: "Phòng khám", data: rooms, icon: "meeting_room", color: "text-amber-500" },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {cards.map(b => (
                <div key={b.title} className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm flex flex-col h-[200px]">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2d353e] bg-gray-50 dark:bg-[#252b33] flex justify-between items-center">
                        <h4 className="font-medium flex items-center gap-1"><span className={`material-symbols-outlined text-[16px] ${b.color}`}>{b.icon}</span> {b.title} <span className="bg-gray-200 dark:bg-gray-700 text-[9px] px-1.5 rounded-full ml-1">{b.data.length}</span></h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1">
                        {b.data.length === 0 ? <div className="h-full flex items-center justify-center text-gray-500 italic text-[10px]">Trống</div> :
                        <ul className="space-y-0.5">
                            {b.data.map((x: any, i: number) => <li key={x?.id ?? i} className="px-2 py-1 hover:bg-gray-50 dark:hover:bg-[#252b33] rounded text-gray-900 dark:text-white truncate">{x?.name ?? x?.label ?? x?.code ?? "—"}</li>)}
                        </ul>
                        }
                    </div>
                </div>
            ))}
        </div>
    );
}

function ServicesTab() {
    const [specs, setSpecs] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);

    useEffect(() => {
        Promise.allSettled([
            fetchData("/api/specialties"),
            fetchData("/api/medical-services/master"),
        ]).then(([s, m]) => {
            if (s.status === "fulfilled") setSpecs(s.value);
            if (m.status === "fulfilled") setServices(m.value);
        });
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm flex flex-col h-[300px]">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2d353e] bg-gray-50 dark:bg-[#252b33] flex justify-between items-center">
                    <h4 className="font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-[#3C81C6]">psychology</span> Chuyên khoa ({specs.length})</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-1">
                    <ul className="space-y-0.5">
                        {specs.map((s: any, i: number) => (
                            <li key={s?.id ?? i} className="px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-[#252b33] rounded flex flex-col gap-0.5 border-b border-gray-50 dark:border-[#2d353e]/50 last:border-0">
                                <span className="text-gray-900 dark:text-white font-medium">{s?.name}</span>
                                {s?.description && <span className="text-gray-500 text-[9px] line-clamp-1">{s.description}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <div className="bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-[#2d353e] rounded shadow-sm flex flex-col h-[300px]">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2d353e] bg-gray-50 dark:bg-[#252b33] flex justify-between items-center">
                    <h4 className="font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-emerald-600">medical_services</span> Dịch vụ ({services.length})</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-1">
                    <ul className="space-y-0.5">
                        {services.map((s: any, i: number) => (
                            <li key={s?.id ?? i} className="px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-[#252b33] rounded flex justify-between items-center border-b border-gray-50 dark:border-[#2d353e]/50 last:border-0">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-gray-900 dark:text-white font-medium">{s?.name}</span>
                                    <span className="text-gray-500 font-mono text-[9px]">{s?.code ?? "NO_CODE"}</span>
                                </div>
                                <span className="font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded text-[10px]">{s?.price ? `${s.price.toLocaleString()}đ` : "---"}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function ReceptionistSupportDataPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const initialTab = (sp.get("tab") as TabKey) ?? "doctors";
    const [tab, setTab] = useState<TabKey>(initialTab);

    const onTab = (t: TabKey) => {
        setTab(t);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", t);
        router.replace(url.pathname + url.search);
    };

    return (
        <div className="p-3 md:p-4 max-w-6xl mx-auto">
            <PageHeader
                title="Dữ liệu hỗ trợ"
                subtitle="Tra cứu nhanh thông tin phục vụ đặt lịch tại quầy."
                icon="database"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Dữ liệu" },
                ]}
            />

            <div className="flex flex-wrap gap-1 mb-4 border-b border-gray-200 dark:border-[#2d353e]">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => onTab(t.key)} className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${tab === t.key ? "border-[#3C81C6] text-[#3C81C6]" : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}>
                        <span className="material-symbols-outlined text-[16px] mr-1 align-middle">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "doctors" && <DoctorsTab />}
            {tab === "coordination" && <CoordinationTab />}
            {tab === "booking" && <BookingConfigTab />}
            {tab === "operating" && <OperatingTab />}
            {tab === "facilities" && <FacilitiesTab />}
            {tab === "services" && <ServicesTab />}
        </div>
    );
}
