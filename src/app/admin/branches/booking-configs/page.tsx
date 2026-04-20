"use client";

import { useCallback, useEffect, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { BOOKING_CONFIG_ENDPOINTS, BRANCH_ENDPOINTS } from "@/api/endpoints";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader, EmptyState } from "@/components/shared/layout";

interface BookingConfig {
    advanceBookingDays: number;
    minHoursBeforeBooking: number;
    maxConcurrentPerSlot: number;
    allowOnlineBooking: boolean;
    allowWalkIn: boolean;
    requireDeposit: boolean;
    depositAmount: number;
    cancellationWindowHours: number;
    reschedulingWindowHours: number;
    autoConfirm: boolean;
    sendReminderHoursBefore: number;
    maxReschedulesPerAppointment: number;
}

const DEFAULT_CONFIG: BookingConfig = {
    advanceBookingDays: 30,
    minHoursBeforeBooking: 2,
    maxConcurrentPerSlot: 1,
    allowOnlineBooking: true,
    allowWalkIn: true,
    requireDeposit: false,
    depositAmount: 0,
    cancellationWindowHours: 24,
    reschedulingWindowHours: 12,
    autoConfirm: false,
    sendReminderHoursBefore: 24,
    maxReschedulesPerAppointment: 2,
};

interface BranchLite { id: string; name: string; }

function mapConfig(r: any): BookingConfig {
    return {
        advanceBookingDays: Number(r.advance_booking_days ?? r.advanceBookingDays ?? 30),
        minHoursBeforeBooking: Number(r.min_hours_before_booking ?? r.minHoursBeforeBooking ?? 2),
        maxConcurrentPerSlot: Number(r.max_concurrent_per_slot ?? r.maxConcurrentPerSlot ?? 1),
        allowOnlineBooking: Boolean(r.allow_online_booking ?? r.allowOnlineBooking ?? true),
        allowWalkIn: Boolean(r.allow_walk_in ?? r.allowWalkIn ?? true),
        requireDeposit: Boolean(r.require_deposit ?? r.requireDeposit ?? false),
        depositAmount: Number(r.deposit_amount ?? r.depositAmount ?? 0),
        cancellationWindowHours: Number(r.cancellation_window_hours ?? r.cancellationWindowHours ?? 24),
        reschedulingWindowHours: Number(r.rescheduling_window_hours ?? r.reschedulingWindowHours ?? 12),
        autoConfirm: Boolean(r.auto_confirm ?? r.autoConfirm ?? false),
        sendReminderHoursBefore: Number(r.send_reminder_hours_before ?? r.sendReminderHoursBefore ?? 24),
        maxReschedulesPerAppointment: Number(r.max_reschedules_per_appointment ?? r.maxReschedulesPerAppointment ?? 2),
    };
}

export default function BookingConfigsPage() {
    const toast = useToast();
    const [branches, setBranches] = useState<BranchLite[]>([]);
    const [branchId, setBranchId] = useState("");
    const [config, setConfig] = useState<BookingConfig>(DEFAULT_CONFIG);
    const [originalConfig, setOriginalConfig] = useState<BookingConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const loadBranches = useCallback(async () => {
        try {
            const res = await axiosClient.get(BRANCH_ENDPOINTS.DROPDOWN);
            const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
            const list = raw.map((d: any) => ({ id: String(d.branches_id ?? d.branch_id ?? d.id ?? ""), name: d.name ?? d.branch_name ?? "" })).filter((b) => b.id);
            setBranches(list);
            if (list.length > 0 && !branchId) setBranchId(list[0].id);
        } catch {
            setBranches([]);
        }
    }, [branchId]);

    const load = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axiosClient.get(BOOKING_CONFIG_ENDPOINTS.BY_BRANCH(branchId));
            const raw = res.data?.data ?? res.data ?? {};
            const mapped = mapConfig(raw);
            setConfig(mapped);
            setOriginalConfig(mapped);
        } catch (err: any) {
            if (err?.response?.status === 404) {
                setConfig(DEFAULT_CONFIG);
                setOriginalConfig(null);
            } else {
                setError("Không tải được cấu hình booking.");
                setConfig(DEFAULT_CONFIG);
                setOriginalConfig(null);
            }
        } finally {
            setLoading(false);
        }
    }, [branchId]);

    useEffect(() => { loadBranches(); }, [loadBranches]);
    useEffect(() => { load(); }, [load]);

    const hasChanges = originalConfig === null
        || JSON.stringify(originalConfig) !== JSON.stringify(config);

    const handleSave = async () => {
        if (!branchId) return;
        setSaving(true);
        try {
            await axiosClient.put(BOOKING_CONFIG_ENDPOINTS.UPDATE_BRANCH(branchId), {
                advance_booking_days: config.advanceBookingDays,
                min_hours_before_booking: config.minHoursBeforeBooking,
                max_concurrent_per_slot: config.maxConcurrentPerSlot,
                allow_online_booking: config.allowOnlineBooking,
                allow_walk_in: config.allowWalkIn,
                require_deposit: config.requireDeposit,
                deposit_amount: config.depositAmount,
                cancellation_window_hours: config.cancellationWindowHours,
                rescheduling_window_hours: config.reschedulingWindowHours,
                auto_confirm: config.autoConfirm,
                send_reminder_hours_before: config.sendReminderHoursBefore,
                max_reschedules_per_appointment: config.maxReschedulesPerAppointment,
            });
            toast.success("Đã lưu cấu hình booking.");
            setOriginalConfig(config);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Không lưu được.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (originalConfig) setConfig(originalConfig);
        else setConfig(DEFAULT_CONFIG);
    };

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Cấu hình booking theo chi nhánh"
                subtitle="Thiết lập quy tắc đặt lịch riêng cho từng chi nhánh (thời gian báo trước, sức chứa slot, đặt cọc...)"
                icon="tune"
                breadcrumbs={[{ label: "Quản trị", href: "/admin" }, { label: "Chi nhánh" }, { label: "Cấu hình booking" }]}
            />

            <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm p-4">
                <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">Chi nhánh</label>
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white">
                    <option value="">— Chọn chi nhánh —</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>

            {!branchId ? (
                <EmptyState icon="store" title="Chọn chi nhánh" description="Chọn một chi nhánh để xem & chỉnh cấu hình booking." />
            ) : loading ? (
                <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : (
                <>
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-600" style={{ fontSize: "20px" }}>warning</span>
                            <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
                        </div>
                    )}
                    {originalConfig === null && !error && (
                        <div className="px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                            <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>info</span>
                            <p className="text-sm text-blue-800 dark:text-blue-200">Chi nhánh chưa có cấu hình booking. Giá trị hiển thị là mặc định — lưu để tạo mới.</p>
                        </div>
                    )}

                    <ConfigSection title="Khung thời gian đặt lịch" icon="event">
                        <ConfigField label="Cho phép đặt trước tối đa (ngày)" value={config.advanceBookingDays}
                            onChange={(v) => setConfig({ ...config, advanceBookingDays: v })} min={1} max={365} suffix="ngày" hint="Bệnh nhân chỉ đặt được lịch trong khoảng N ngày sắp tới." />
                        <ConfigField label="Thời gian báo trước tối thiểu (giờ)" value={config.minHoursBeforeBooking}
                            onChange={(v) => setConfig({ ...config, minHoursBeforeBooking: v })} min={0} max={72} suffix="giờ" hint="Lịch phải được đặt trước ít nhất N giờ so với giờ khám." />
                        <ConfigField label="Sức chứa mỗi slot" value={config.maxConcurrentPerSlot}
                            onChange={(v) => setConfig({ ...config, maxConcurrentPerSlot: v })} min={1} max={20} suffix="người" hint="Mặc định mỗi slot chỉ 1 bệnh nhân. Tăng nếu cho phép multi-booking." />
                    </ConfigSection>

                    <ConfigSection title="Kênh đặt lịch" icon="apps">
                        <ToggleField label="Cho phép đặt online" description="Bệnh nhân có thể tự đặt qua web/app."
                            value={config.allowOnlineBooking} onChange={(v) => setConfig({ ...config, allowOnlineBooking: v })} />
                        <ToggleField label="Cho phép walk-in" description="Bệnh nhân đến trực tiếp không cần đặt trước."
                            value={config.allowWalkIn} onChange={(v) => setConfig({ ...config, allowWalkIn: v })} />
                        <ToggleField label="Tự động xác nhận lịch" description="Lịch được xác nhận ngay khi đặt, không cần staff duyệt."
                            value={config.autoConfirm} onChange={(v) => setConfig({ ...config, autoConfirm: v })} />
                    </ConfigSection>

                    <ConfigSection title="Đặt cọc" icon="payments">
                        <ToggleField label="Yêu cầu đặt cọc" description="Bắt buộc đặt cọc khi đặt lịch online."
                            value={config.requireDeposit} onChange={(v) => setConfig({ ...config, requireDeposit: v })} />
                        {config.requireDeposit && (
                            <ConfigField label="Số tiền đặt cọc" value={config.depositAmount}
                                onChange={(v) => setConfig({ ...config, depositAmount: v })} min={0} max={10000000} step={10000} suffix="VND" hint="Số tiền bệnh nhân phải thanh toán trước để giữ chỗ." />
                        )}
                    </ConfigSection>

                    <ConfigSection title="Chính sách hủy/đổi" icon="cancel">
                        <ConfigField label="Thời gian cho phép hủy (giờ trước giờ khám)" value={config.cancellationWindowHours}
                            onChange={(v) => setConfig({ ...config, cancellationWindowHours: v })} min={0} max={168} suffix="giờ" hint="Ví dụ 24h: bệnh nhân phải hủy trước 24h mới được hoàn tiền." />
                        <ConfigField label="Thời gian cho phép đổi lịch (giờ trước giờ khám)" value={config.reschedulingWindowHours}
                            onChange={(v) => setConfig({ ...config, reschedulingWindowHours: v })} min={0} max={168} suffix="giờ" />
                        <ConfigField label="Số lần đổi lịch tối đa" value={config.maxReschedulesPerAppointment}
                            onChange={(v) => setConfig({ ...config, maxReschedulesPerAppointment: v })} min={0} max={10} suffix="lần" />
                    </ConfigSection>

                    <ConfigSection title="Thông báo" icon="notifications">
                        <ConfigField label="Gửi nhắc lịch trước (giờ)" value={config.sendReminderHoursBefore}
                            onChange={(v) => setConfig({ ...config, sendReminderHoursBefore: v })} min={0} max={168} suffix="giờ" hint="Hệ thống sẽ gửi SMS/email nhắc lịch N giờ trước giờ khám." />
                    </ConfigSection>

                    <div className="sticky bottom-6 bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-lg p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm">
                            {hasChanges ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-amber-700 dark:text-amber-300 font-medium">Có thay đổi chưa lưu</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">Đã lưu</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleReset} disabled={!hasChanges || saving}
                                className="px-4 py-2 text-sm text-[#687582] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl disabled:opacity-50">
                                Huỷ thay đổi
                            </button>
                            <button onClick={handleSave} disabled={!hasChanges || saving}
                                className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#1d4ed8] rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 inline-flex items-center gap-1">
                                {saving ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang lưu...</>) : (<><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>Lưu cấu hình</>)}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function ConfigSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#1e242b] rounded-2xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-[#f8f9fa] dark:bg-[#13191f] border-b border-[#dde0e4] dark:border-[#2d353e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "20px" }}>{icon}</span>
                <h3 className="font-semibold text-[#121417] dark:text-white text-sm">{title}</h3>
            </div>
            <div className="p-4 space-y-4">{children}</div>
        </div>
    );
}

function ConfigField({ label, value, onChange, min, max, step, suffix, hint }: {
    label: string; value: number; onChange: (v: number) => void;
    min?: number; max?: number; step?: number; suffix?: string; hint?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#121417] dark:text-gray-300 mb-1.5">{label}</label>
            <div className="flex items-center gap-2">
                <input type="number" min={min} max={max} step={step ?? 1} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
                    className="w-40 px-4 py-2 bg-[#f8f9fa] dark:bg-[#13191f] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3C81C6]/20 dark:text-white" />
                {suffix && <span className="text-sm text-[#687582] dark:text-gray-400">{suffix}</span>}
            </div>
            {hint && <p className="text-[10px] text-[#687582] dark:text-gray-500 mt-1">{hint}</p>}
        </div>
    );
}

function ToggleField({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#13191f] cursor-pointer">
            <div className="flex-1">
                <div className="text-sm font-medium text-[#121417] dark:text-white">{label}</div>
                {description && <div className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">{description}</div>}
            </div>
            <div className="relative flex-shrink-0">
                <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
                <div className={`w-11 h-6 rounded-full transition-colors ${value ? "bg-[#3C81C6]" : "bg-gray-300 dark:bg-gray-700"}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : ""}`} />
                </div>
            </div>
        </label>
    );
}
