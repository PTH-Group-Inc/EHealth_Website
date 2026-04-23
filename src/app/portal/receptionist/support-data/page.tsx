"use client";

/**
 * Support Data Hub — Phase J.4 (6 phân hệ).
 * Spec: dòng 11264-11680.
 *
 * 6 tab: doctors / coordination / booking-config / operating / facilities / services.
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/shared/layout";
import axiosClient from "@/api/axiosClient";

const TABS = [
    { key: "doctors", label: "Bác sĩ / khả dụng", icon: "person_search" },
    { key: "coordination", label: "Gợi ý slot", icon: "auto_awesome" },
    { key: "booking", label: "Booking config", icon: "tune" },
    { key: "operating", label: "Slot / ca / giờ làm", icon: "schedule" },
    { key: "facilities", label: "Cơ sở / chi nhánh", icon: "business" },
    { key: "services", label: "Dịch vụ / chuyên khoa", icon: "medical_services" },
] as const;

type TabKey = typeof TABS[number]["key"];

const fmt = (v?: string) => { if (!v) return "—"; try { return new Date(v).toLocaleDateString("vi-VN"); } catch { return v; } };

function fetchData(url: string): Promise<any[]> {
    return axiosClient.get(url).then(r => {
        const d = r?.data?.data ?? r?.data ?? [];
        return Array.isArray(d) ? d : [];
    }).catch(() => []);
}

function DoctorsTab() {
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
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3 mb-3">
                <label className="block text-xs text-[#687582] mb-1">Tra cứu bác sĩ rảnh ngày</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417]" />
            </div>
            {loading ? <p className="p-8 text-center text-sm text-[#687582]">Đang tải…</p>
            : items.length === 0 ? <EmptyState icon="person_off" title="Không có dữ liệu" />
            : (
                <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-[#687582]">
                            <tr><th className="text-left px-4 py-3">Bác sĩ</th><th className="text-left px-4 py-3">Chuyên khoa</th><th className="text-left px-4 py-3">Khả dụng</th><th className="text-left px-4 py-3">Slot</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                            {items.map((d: any, i: number) => (
                                <tr key={d.id ?? i}>
                                    <td className="px-4 py-3 font-medium">{d.doctor_name ?? d.doctorName ?? d.full_name}</td>
                                    <td className="px-4 py-3">{d.specialty_name ?? d.specialty ?? "—"}</td>
                                    <td className="px-4 py-3">{d.is_available || d.available ? <span className="text-emerald-600">Có</span> : <span className="text-rose-600">Bận</span>}</td>
                                    <td className="px-4 py-3">{d.available_slots ?? d.slot_count ?? 0}</td>
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
    const [load, setLoad] = useState<any[]>([]);
    const [balance, setBalance] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            fetchData("/api/appointment-coordination/doctor-load"),
            axiosClient.get("/api/appointment-coordination/balance-overview").then(r => r?.data?.data ?? r?.data).catch(() => null),
        ]).then(([l, b]) => {
            if (l.status === "fulfilled") setLoad(l.value);
            if (b.status === "fulfilled") setBalance(b.value);
            setLoading(false);
        });
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] text-sm font-bold">Tải bác sĩ</div>
                {loading ? <p className="p-4 text-xs text-[#687582]">Đang tải…</p>
                : load.length === 0 ? <EmptyState icon="balance" title="Không có dữ liệu" compact />
                : (
                    <ul className="divide-y divide-[#e5e7eb] dark:divide-[#2d353e]">
                        {load.slice(0, 10).map((d: any, i: number) => (
                            <li key={d.id ?? i} className="px-4 py-2 flex justify-between text-sm">
                                <span>{d.doctor_name ?? "—"}</span>
                                <span className="font-bold">{d.appointment_count ?? d.load_count ?? 0} lịch</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#2d353e] text-sm font-bold">Tổng quan cân bằng</div>
                <div className="p-4 text-sm">
                    {!balance ? <p className="italic text-[#687582]">Chưa có dữ liệu</p>
                    : <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(balance, null, 2)}</pre>}
                </div>
            </div>
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
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-3 mb-3">
                <label className="block text-xs text-[#687582] mb-1">Chi nhánh</label>
                <select value={branchId} onChange={e => setBranchId(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-[#e5e7eb] dark:border-[#2d353e] bg-white dark:bg-[#121417] w-full">
                    {branches.map((b: any) => <option key={b.id ?? b.branch_id} value={b.id ?? b.branch_id}>{b.name ?? b.branch_name}</option>)}
                </select>
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                {loading ? <p className="text-xs text-[#687582]">Đang tải…</p>
                : !config ? <EmptyState icon="tune" title="Không có config" compact />
                : <pre className="text-xs whitespace-pre-wrap overflow-x-auto">{JSON.stringify(config, null, 2)}</pre>}
            </div>
        </div>
    );
}

function OperatingTab() {
    const [slots, setSlots] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [hours, setHours] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [todayStatus, setTodayStatus] = useState<any>(null);

    useEffect(() => {
        Promise.allSettled([
            fetchData("/api/slots"),
            fetchData("/api/shifts"),
            fetchData("/api/operating-hours"),
            fetchData("/api/holidays"),
            axiosClient.get("/api/facility-status/today").then(r => r?.data?.data ?? r?.data).catch(() => null),
        ]).then(([s, sh, h, ho, t]) => {
            if (s.status === "fulfilled") setSlots(s.value);
            if (sh.status === "fulfilled") setShifts(sh.value);
            if (h.status === "fulfilled") setHours(h.value);
            if (ho.status === "fulfilled") setHolidays(ho.value);
            if (t.status === "fulfilled") setTodayStatus(t.value);
        });
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                <h4 className="text-sm font-bold mb-2">Tình trạng cơ sở hôm nay</h4>
                {!todayStatus ? <p className="text-xs italic text-[#687582]">Chưa có</p>
                : <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(todayStatus, null, 2)}</pre>}
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                <h4 className="text-sm font-bold mb-2">Slots ({slots.length})</h4>
                <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
                    {slots.slice(0, 20).map((s: any, i: number) => <li key={s.id ?? i}>· {s.code ?? s.name ?? `Slot ${s.start_time}`}</li>)}
                </ul>
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                <h4 className="text-sm font-bold mb-2">Ca làm việc ({shifts.length})</h4>
                <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
                    {shifts.slice(0, 20).map((s: any, i: number) => <li key={s.id ?? i}>· {s.name ?? s.code} ({s.start_time}–{s.end_time})</li>)}
                </ul>
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                <h4 className="text-sm font-bold mb-2">Giờ hoạt động</h4>
                <ul className="text-xs space-y-1">
                    {hours.slice(0, 7).map((h: any, i: number) => <li key={i}>· {h.day ?? h.day_of_week}: {h.open_time ?? "—"}-{h.close_time ?? "—"}</li>)}
                </ul>
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4 md:col-span-2">
                <h4 className="text-sm font-bold mb-2">Ngày nghỉ / lễ ({holidays.length})</h4>
                <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                    {holidays.map((h: any, i: number) => <li key={h.id ?? i}>· {fmt(h.date)} — {h.name ?? h.reason}</li>)}
                </ul>
            </div>
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
                { title: "Cơ sở y tế", data: facs, icon: "domain" },
                { title: "Chi nhánh", data: branches, icon: "business" },
                { title: "Khoa / phòng ban", data: depts, icon: "category" },
                { title: "Phòng khám", data: rooms, icon: "meeting_room" },
            ].map(b => (
                <div key={b.title} className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#3C81C6]">{b.icon}</span>{b.title} ({b.data.length})</h4>
                    <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
                        {b.data.slice(0, 15).map((x: any, i: number) => <li key={x.id ?? i}>· {x.name ?? x.label ?? "—"}</li>)}
                    </ul>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                <h4 className="text-sm font-bold mb-2">Chuyên khoa ({specs.length})</h4>
                <ul className="text-xs space-y-1 max-h-64 overflow-y-auto">
                    {specs.map((s: any, i: number) => <li key={s.id ?? i}>· {s.name}</li>)}
                </ul>
            </div>
            <div className="bg-white dark:bg-[#1e242b] border border-[#e5e7eb] dark:border-[#2d353e] rounded-xl p-4">
                <h4 className="text-sm font-bold mb-2">Dịch vụ master ({services.length})</h4>
                <ul className="text-xs space-y-1 max-h-64 overflow-y-auto">
                    {services.map((s: any, i: number) => <li key={s.id ?? i}>· {s.name} {s.code ? `(${s.code})` : ""}</li>)}
                </ul>
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
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <PageHeader
                title="Dữ liệu hỗ trợ đặt lịch"
                subtitle="Tra cứu bác sĩ, slot, cơ sở, dịch vụ phục vụ đặt lịch tại quầy."
                icon="database"
                breadcrumbs={[
                    { label: "Portal", href: "/portal/receptionist" },
                    { label: "Dữ liệu hỗ trợ" },
                ]}
            />

            <div className="flex flex-wrap gap-2 mb-4 border-b border-[#e5e7eb] dark:border-[#2d353e]">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => onTab(t.key)} className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-[#3C81C6] text-[#3C81C6]" : "border-transparent text-[#687582] hover:text-[#121417] dark:hover:text-white"}`}>
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
