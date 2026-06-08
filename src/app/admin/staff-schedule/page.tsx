"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import axiosClient from "@/api/axiosClient";
import { STAFF_ENDPOINTS, STAFF_SCHEDULE_ENDPOINTS, MEDICAL_ROOM_ENDPOINTS } from "@/api/endpoints";
import { staffScheduleService, type StaffSchedule } from "@/services/staffScheduleService";
import { workShiftService, type WorkShift } from "@/services/workShiftService";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, FilterBar, EmptyState } from "@/components/shared/layout";
import { ScheduleCalendar, type ScheduleEvent } from "@/components/shared/calendar/ScheduleCalendar";

export default function StaffSchedulePage() {
    const toast = useToast();
    const t = useTranslations("pages.staffSchedule");
    const tc = useTranslations("common");
    const [month, setMonth] = useState<Date>(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
    const [shifts, setShifts] = useState<WorkShift[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<"calendar" | "list">("calendar");
    const [staffFilter, setStaffFilter] = useState("");
    const [shiftFilter, setShiftFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAutoModal, setShowAutoModal] = useState(false);
    const [autoForm, setAutoForm] = useState({
        from: new Date().toISOString().slice(0, 10),
        to: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        role: "DOCTOR",
        includeWeekends: false,
        shiftsPerDay: 2,
    });
    const [autoRunning, setAutoRunning] = useState(false);
    const [autoProgress, setAutoProgress] = useState<{ done: number; total: number; error: number }>({ done: 0, total: 0, error: 0 });

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const m = month.getMonth() + 1;
            const y = month.getFullYear();
            const [scheds, sh] = await Promise.allSettled([
                axiosClient.get(STAFF_SCHEDULE_ENDPOINTS.CALENDAR, { params: { month: m, year: y } }),
                workShiftService.getList(),
            ]);
            if (scheds.status === "fulfilled") {
                // BE trả: { success, data: { "YYYY-MM-DD": [...items], ... } }
                const payload: any = scheds.value?.data?.data ?? scheds.value?.data ?? {};
                let items: any[] = [];
                if (Array.isArray(payload)) {
                    items = payload;
                } else if (payload && typeof payload === "object") {
                    // Object keyed by date → flatten
                    items = Object.values(payload).flat() as any[];
                }
                setSchedules(items.map(mapSchedule));
            } else {
                setSchedules([]);
            }
            if (sh.status === "fulfilled") {
                const data: any = sh.value;
                const raw: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
                setShifts(raw.map((s) => ({
                    id: String(s.shifts_id ?? s.shift_id ?? s.id ?? s.code ?? ""),
                    name: s.name ?? "",
                    startTime: (s.start_time ?? "").slice(0, 5),
                    endTime: (s.end_time ?? "").slice(0, 5),
                    type: (s.type ?? s.code ?? "MORNING") as WorkShift["type"],
                    description: s.description ?? "",
                    isActive: typeof s.isActive === "boolean" ? s.isActive : String(s.status ?? "").toUpperCase() !== "INACTIVE",
                })));
            }
        } catch {
            setError("Không tải được lịch làm việc.");
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => { load(); }, [load]);

    const filteredSchedules = useMemo(() => {
        const q = staffFilter.trim().toLowerCase();
        return schedules.filter((s) => {
            if (shiftFilter !== "all" && s.shiftId !== shiftFilter) return false;
            if (statusFilter !== "all" && s.status !== statusFilter) return false;
            if (q && !`${s.staffName ?? ""} ${s.shiftName ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [schedules, staffFilter, shiftFilter, statusFilter]);

    const events: ScheduleEvent[] = useMemo(() => {
        return filteredSchedules.map((s): ScheduleEvent => ({
            id: s.id,
            date: s.workDate,
            title: s.staffName ?? "Nhân sự",
            shift: s.shiftName?.toUpperCase() === "AFTERNOON" || s.shiftName?.toUpperCase() === "NIGHT" || s.shiftName?.toUpperCase() === "MORNING"
                ? s.shiftName?.toUpperCase() as any
                : guessShiftFromTime(s.startTime),
            subtitle: s.shiftName,
            status: s.status,
        }));
    }, [filteredSchedules]);

    const goPrev = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    const goNext = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    const goToday = () => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); };

    const handleAutoAssign = async () => {
        if (!autoForm.from || !autoForm.to) { toast.warning("Chọn khoảng thời gian."); return; }
        if (autoForm.from > autoForm.to) { toast.warning("Ngày bắt đầu phải trước ngày kết thúc."); return; }
        const activeShifts = shifts.filter((s) => s.isActive).slice(0, Math.max(1, autoForm.shiftsPerDay));
        if (activeShifts.length === 0) { toast.warning("Không có ca làm việc nào hoạt động. Cấu hình ca trước."); return; }

        setAutoRunning(true);
        setAutoProgress({ done: 0, total: 0, error: 0 });

        try {
            // Fetch medical rooms
            const roomsRes = await axiosClient.get(MEDICAL_ROOM_ENDPOINTS.LIST, { params: { limit: 500 } });
            const allRooms: any[] = roomsRes.data?.data?.items ?? roomsRes.data?.data ?? roomsRes.data?.items ?? roomsRes.data ?? [];
            const activeRooms = allRooms.filter((r) => String(r.status ?? "").toUpperCase() === "ACTIVE");
            if (activeRooms.length === 0) { toast.warning("Không có phòng y tế nào đang hoạt động."); setAutoRunning(false); return; }

            const staffRes = await axiosClient.get(STAFF_ENDPOINTS.LIST, { params: { limit: 500, role: autoForm.role } });
            const raw: any[] = staffRes.data?.data?.items ?? staffRes.data?.data ?? staffRes.data?.items ?? staffRes.data ?? [];
            const staffList = (Array.isArray(raw) ? raw : []).filter((s: any) => {
                if (autoForm.role === "ALL") return true;
                const roles: string[] = Array.isArray(s.roles) ? s.roles.map((r: any) => String(r).toUpperCase()) : [];
                const r = String(s.role ?? s.position ?? "").toUpperCase();
                return roles.includes(autoForm.role.toUpperCase()) || r.includes(autoForm.role.toUpperCase());
            });
            if (staffList.length === 0) { toast.warning(`Không có nhân sự role=${autoForm.role}.`); setAutoRunning(false); return; }

            const start = new Date(autoForm.from);
            const end = new Date(autoForm.to);
            const days: string[] = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dow = d.getDay();
                if (!autoForm.includeWeekends && (dow === 0 || dow === 6)) continue;
                days.push(d.toISOString().slice(0, 10));
            }

            type Assignment = { work_date: string; staff_id: string; shift_id: string; medical_room_id: string };
            const assignments: Assignment[] = [];
            let staffIdx = 0;

            for (const day of days) {
                for (const shift of activeShifts) {
                    let roomIdx = 0;
                    // Phân bổ staff vào các phòng, mỗi shift lấy số lượng staff bằng số lượng phòng hoặc staff có sẵn
                    const assignCount = Math.min(staffList.length, activeRooms.length, 5); // Tối đa 5 người 1 ca để test
                    for (let i = 0; i < assignCount; i++) {
                        const staff = staffList[staffIdx % staffList.length];
                        const room = activeRooms[roomIdx % activeRooms.length];
                        
                        assignments.push({
                            work_date: day,
                            staff_id: String(staff.users_id ?? staff.user_id ?? staff.staffs_id ?? staff.staff_id ?? staff.id ?? ""),
                            shift_id: shift.id,
                            medical_room_id: String(room.medical_rooms_id ?? room.medical_room_id ?? room.id ?? ""),
                        });
                        
                        staffIdx += 1;
                        roomIdx += 1;
                    }
                }
            }

            setAutoProgress({ done: 50, total: 100, error: 0 });

            const res = await axiosClient.post(STAFF_SCHEDULE_ENDPOINTS.BATCH, { assignments });
            const resultData = res.data?.data;
            const successCount = resultData?.success ?? assignments.length;
            const failedCount = resultData?.failed ?? 0;

            setAutoProgress({ done: 100, total: 100, error: failedCount });

            toast.success(`Phân lịch AI hoàn tất: ${successCount} thành công, ${failedCount} lỗi.`);
            setShowAutoModal(false);
            await load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Lỗi khi chạy thuật toán phân lịch AI.");
        } finally {
            setAutoRunning(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon="calendar_month"
                breadcrumbs={[{ label: tc("role.admin"), href: "/admin" }, { label: t("title") }]}
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/admin/schedules/new"
                            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] hover:shadow-lg rounded-xl transition-all">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
                            Thêm lịch thủ công
                        </Link>
                        <button onClick={() => setShowAutoModal(true)}
                            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:shadow-lg rounded-xl transition-all">
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>auto_awesome</span>
                            AI tự động phân lịch
                        </button>
                        <div className="inline-flex bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl p-1">
                            <button onClick={() => setView("calendar")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${view === "calendar" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] dark:text-gray-400"}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_month</span>
                                Lịch
                            </button>
                            <button onClick={() => setView("list")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 ${view === "list" ? "bg-white dark:bg-[#1e242b] text-[#3C81C6] shadow-sm" : "text-[#687582] dark:text-gray-400"}`}>
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>list</span>
                                Danh sách
                            </button>
                        </div>
                    </div>
                }
            />

            <FilterBar
                searchPlaceholder="Tìm theo tên nhân sự..."
                searchValue={staffFilter}
                onSearchChange={setStaffFilter}
                filters={[
                    {
                        key: "shift",
                        label: "Ca",
                        value: shiftFilter,
                        onChange: setShiftFilter,
                        options: [{ value: "all", label: "Mọi ca" }, ...shifts.map((s) => ({ value: s.id, label: s.name }))],
                    },
                    {
                        key: "status",
                        label: "Trạng thái",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: "all", label: "Mọi trạng thái" },
                            { value: "SCHEDULED", label: "Đã lên lịch" },
                            { value: "ON_DUTY", label: "Đang trực" },
                            { value: "COMPLETED", label: "Hoàn tất" },
                            { value: "SUSPENDED", label: "Tạm ngưng" },
                            { value: "LEAVE", label: "Nghỉ phép" },
                        ],
                    },
                ]}
                onReset={() => { setStaffFilter(""); setShiftFilter("all"); setStatusFilter("all"); }}
            />

            {error && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                    <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                </div>
            )}

            {view === "calendar" ? (
                <ScheduleCalendar
                    month={month}
                    events={events}
                    loading={loading}
                    onPrevMonth={goPrev}
                    onNextMonth={goNext}
                    onToday={goToday}
                    onDayClick={(iso) => toast.info(`${events.filter((e) => e.date.startsWith(iso)).length} ca trong ngày ${iso}`)}
                />
            ) : loading ? (
                <div className="space-y-2">
                    {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
                </div>
            ) : filteredSchedules.length === 0 ? (
                <EmptyState icon="calendar_month" title="Không có lịch trong tháng" description="Chưa phân ca cho staff trong khoảng thời gian này." />
            ) : (
                <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-[#f8f9fa] dark:bg-[#13191f]">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Nhân sự</th>
                                <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Ngày</th>
                                <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Ca</th>
                                <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Giờ</th>
                                <th className="px-4 py-3 text-left font-semibold text-[#687582] dark:text-gray-400 uppercase text-[11px] tracking-wider">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#2d353e]">
                            {filteredSchedules.map((s) => (
                                <tr key={s.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#13191f]">
                                    <td className="px-4 py-3 font-medium text-[#121417] dark:text-white">{s.staffName ?? "—"}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-[#687582] dark:text-gray-400">{s.workDate}</td>
                                    <td className="px-4 py-3 text-[#687582] dark:text-gray-400">{s.shiftName ?? "—"}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-[#3C81C6]">{s.startTime ?? ""} – {s.endTime ?? ""}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${statusBadge(s.status)}`}>
                                            {statusLabel(s.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showAutoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !autoRunning && setShowAutoModal(false)}>
                    <div className="bg-white dark:bg-[#1e242b] rounded-2xl shadow-xl max-w-lg w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#121417] dark:text-white mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-violet-600">auto_awesome</span>
                            AI tự động phân lịch
                        </h3>
                        <p className="text-xs text-[#687582] mb-4">Phân phối đều nhân sự vào các ca trong khoảng thời gian. Round-robin theo role.</p>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Từ ngày</label>
                                    <input type="date" value={autoForm.from} onChange={(e) => setAutoForm({ ...autoForm, from: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Đến ngày</label>
                                    <input type="date" value={autoForm.to} onChange={(e) => setAutoForm({ ...autoForm, to: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Vai trò</label>
                                <select value={autoForm.role} onChange={(e) => setAutoForm({ ...autoForm, role: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white">
                                    <option value="DOCTOR">Bác sĩ</option>
                                    <option value="NURSE">Y tá</option>
                                    <option value="RECEPTIONIST">Lễ tân</option>
                                    <option value="PHARMACIST">Dược sĩ</option>
                                    <option value="ALL">Tất cả nhân sự</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Số ca/ngày (lấy {Math.max(1, autoForm.shiftsPerDay)} ca đầu)</label>
                                <input type="number" min={1} max={shifts.length || 3} value={autoForm.shiftsPerDay}
                                    onChange={(e) => setAutoForm({ ...autoForm, shiftsPerDay: Math.max(1, Number(e.target.value) || 1) })}
                                    className="w-full px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm dark:text-white" />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={autoForm.includeWeekends} onChange={(e) => setAutoForm({ ...autoForm, includeWeekends: e.target.checked })} className="w-4 h-4" />
                                <span className="text-sm text-[#121417] dark:text-white">Bao gồm cuối tuần (T7, CN)</span>
                            </label>
                            {autoRunning && autoProgress.total > 0 && (
                                <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Đang tạo lịch...</span>
                                        <span className="text-xs text-violet-700 dark:text-violet-300">{autoProgress.done}/{autoProgress.total} (lỗi: {autoProgress.error})</span>
                                    </div>
                                    <div className="w-full h-2 bg-violet-100 dark:bg-violet-900/40 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-600 transition-all" style={{ width: `${(autoProgress.done / autoProgress.total) * 100}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[#dde0e4] dark:border-[#2d353e]">
                            <button onClick={() => setShowAutoModal(false)} disabled={autoRunning} className="px-4 py-2 text-sm text-[#687582] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">Hủy</button>
                            <button onClick={handleAutoAssign} disabled={autoRunning} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-600 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>auto_awesome</span>
                                {autoRunning ? "Đang chạy..." : "Bắt đầu phân lịch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function mapSchedule(s: any): StaffSchedule {
    // BE staff-schedules/calendar trả: staff_schedules_id, user_id, working_date, full_name, room_name, shift_name, status: ACTIVE
    const rawStatus = String(s.status ?? "").toUpperCase();
    const isLeave = Boolean(s.is_leave);
    const status: StaffSchedule["status"] = isLeave
        ? "LEAVE"
        : rawStatus === "ACTIVE" || rawStatus === ""
            ? "SCHEDULED"
            : (rawStatus as StaffSchedule["status"]);
    return {
        id: String(s.staff_schedules_id ?? s.schedule_id ?? s.id ?? ""),
        staffId: String(s.user_id ?? s.staff_id ?? ""),
        staffName: s.staff_name ?? s.full_name ?? s.user?.full_name ?? "",
        shiftId: String(s.shift_id ?? ""),
        shiftName: s.shift_name ?? s.shift?.name ?? s.shift_code ?? "",
        workDate: (s.working_date ?? s.work_date ?? s.date ?? "").slice(0, 10),
        startTime: (s.start_time ?? "").slice(0, 5),
        endTime: (s.end_time ?? "").slice(0, 5),
        departmentId: s.department_id ?? s.medical_room_id ?? "",
        status,
        note: s.note ?? s.leave_reason ?? "",
        createdAt: s.created_at ?? "",
    };
}

function guessShiftFromTime(start?: string): "MORNING" | "AFTERNOON" | "NIGHT" {
    if (!start) return "MORNING";
    const h = parseInt(start.slice(0, 2), 10);
    if (h >= 5 && h < 12) return "MORNING";
    if (h >= 12 && h < 18) return "AFTERNOON";
    return "NIGHT";
}

function statusBadge(s?: string) {
    switch (s) {
        case "ON_DUTY": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
        case "COMPLETED": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
        case "SUSPENDED": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
        case "LEAVE": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
        default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
}

function statusLabel(s?: string) {
    switch (s) {
        case "ON_DUTY": return "Đang trực";
        case "COMPLETED": return "Hoàn tất";
        case "SUSPENDED": return "Tạm ngưng";
        case "LEAVE": return "Nghỉ phép";
        default: return "Đã lên lịch";
    }
}
