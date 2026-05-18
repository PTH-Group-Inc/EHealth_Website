"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosClient from "@/api/axiosClient";
import { STAFF_SCHEDULE_ENDPOINTS } from "@/api/endpoints";
import { staffService, unwrapStaffList } from "@/services/staffService";
import { workShiftService, type WorkShift } from "@/services/workShiftService";
import { getDepartments, unwrapDepartments } from "@/services/departmentService";

export default function NewSchedulePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [doctorList, setDoctorList] = useState<{ id: string; name: string }[]>([]);
    const [deptList, setDeptList] = useState<{ id: string; name: string }[]>([]);
    const [shiftList, setShiftList] = useState<WorkShift[]>([]);
    const [formData, setFormData] = useState({
        doctorId: "", departmentId: "", shiftId: "",
        dateStart: new Date().toISOString().split("T")[0],
        dateEnd: "", repeat: "none", note: "",
    });

    useEffect(() => {
        staffService.getList({ role: 'DOCTOR', limit: 200 })
            .then((res: any) => {
                const items = unwrapStaffList(res);
                setDoctorList(items.map(d => ({ id: d.id, name: d.fullName })));
            })
            .catch(() => { });
        getDepartments({ limit: 100 })
            .then((res: any) => {
                const items = unwrapDepartments(res);
                setDeptList(items.map((d: any) => ({ id: String(d.id ?? d.departments_id ?? ""), name: d.name })));
            })
            .catch(() => { });
        workShiftService.getList()
            .then((res: any) => {
                const raw: any[] = Array.isArray(res?.data) ? res.data : [];
                const mapped: WorkShift[] = raw.map((s: any) => ({
                    id: String(s.id ?? s.shifts_id ?? s.shift_id ?? ""),
                    name: s.name ?? "",
                    startTime: (s.startTime ?? s.start_time ?? "").slice(0, 5),
                    endTime: (s.endTime ?? s.end_time ?? "").slice(0, 5),
                    type: (s.type ?? s.code ?? "MORNING") as WorkShift["type"],
                    description: s.description ?? "",
                    isActive: typeof s.isActive === "boolean" ? s.isActive : String(s.status ?? "").toUpperCase() !== "INACTIVE",
                }));
                setShiftList(mapped.filter((s) => s.isActive && s.id));
                if (mapped[0]) setFormData((p) => ({ ...p, shiftId: mapped[0].id }));
            })
            .catch(() => { });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const buildDateRange = (): string[] => {
        const days: string[] = [];
        const start = new Date(formData.dateStart);
        const end = formData.dateEnd ? new Date(formData.dateEnd) : start;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (formData.repeat === "weekly" && d.getTime() !== start.getTime() && (d.getTime() - start.getTime()) % (7 * 86400000) !== 0) continue;
            if (formData.repeat === "biweekly" && (d.getTime() - start.getTime()) % (14 * 86400000) !== 0) continue;
            days.push(d.toISOString().slice(0, 10));
            if (formData.repeat === "none") break;
        }
        return days;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.doctorId) { alert("Vui lòng chọn bác sĩ"); return; }
        if (!formData.shiftId) { alert("Vui lòng chọn ca trực"); return; }
        setSaving(true);
        try {
            const days = buildDateRange();
            let success = 0, fail = 0;
            for (const day of days) {
                try {
                    await axiosClient.post(STAFF_SCHEDULE_ENDPOINTS.CREATE, {
                        staff_id: formData.doctorId,
                        shift_id: formData.shiftId,
                        work_date: day,
                        department_id: formData.departmentId || undefined,
                        note: formData.note || undefined,
                        status: "SCHEDULED",
                    });
                    success += 1;
                } catch {
                    fail += 1;
                }
            }
            if (success > 0) {
                router.push("/admin/schedules");
            } else {
                alert(`Thêm lịch trực thất bại (${fail}/${days.length}). Vui lòng kiểm tra ca và quyền.`);
            }
        } catch (err: any) {
            alert(err?.response?.data?.message ?? "Thêm lịch trực thất bại. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#687582]">
                    <Link href="/admin/schedules" className="hover:text-[#3C81C6] transition-colors">Lịch trực</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-[#121417] dark:text-white font-medium">Thêm lịch trực mới</span>
                </div>
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e242b] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-6 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <h1 className="text-xl font-bold text-[#121417] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3C81C6]">calendar_add_on</span>
                        Thêm lịch trực mới
                    </h1>
                    <p className="text-sm text-[#687582] mt-1">Phân công lịch trực cho bác sĩ</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Bác sĩ *</label>
                            <select name="doctorId" value={formData.doctorId} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="">-- Chọn bác sĩ --</option>
                                {doctorList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Khoa</label>
                            <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="">-- Chọn khoa --</option>
                                {deptList.filter((d) => d.id && d.name).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ca trực *</label>
                            {shiftList.length === 0 ? (
                                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-300">
                                    Chưa có ca làm việc hoạt động. <Link href="/admin/shifts" className="underline font-semibold">Cấu hình ca</Link> trước khi thêm lịch trực.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {shiftList.map((s) => {
                                        const color = s.type === "AFTERNOON" || (s.startTime && parseInt(s.startTime, 10) >= 12 && parseInt(s.startTime, 10) < 18)
                                            ? "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
                                            : s.type === "NIGHT" || (s.startTime && parseInt(s.startTime, 10) >= 18)
                                                ? "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700"
                                                : "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700";
                                        return (
                                            <button key={s.id} type="button" onClick={() => setFormData((prev) => ({ ...prev, shiftId: s.id }))}
                                                className={`p-3 rounded-xl border text-center transition-all ${formData.shiftId === s.id ? color + " ring-2 ring-current/20" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                                                <p className="text-sm font-bold">{s.name}</p>
                                                <p className="text-xs opacity-70">{s.startTime}–{s.endTime}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Lặp lại</label>
                            <select name="repeat" value={formData.repeat} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                                <option value="none">Không lặp</option>
                                <option value="daily">Hàng ngày</option>
                                <option value="weekly">Hàng tuần</option>
                                <option value="biweekly">2 tuần / lần</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ngày bắt đầu *</label>
                            <input type="date" name="dateStart" value={formData.dateStart} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ngày kết thúc</label>
                            <input type="date" name="dateEnd" value={formData.dateEnd} onChange={handleChange} className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Ghi chú</label>
                            <textarea name="note" value={formData.note} onChange={handleChange} rows={2} placeholder="Ghi chú thêm về lịch trực..." className="w-full py-2.5 px-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white placeholder:text-gray-400 resize-none" />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-[#687582] hover:bg-gray-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : <><span className="material-symbols-outlined text-[18px]">save</span> Thêm lịch trực</>}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
