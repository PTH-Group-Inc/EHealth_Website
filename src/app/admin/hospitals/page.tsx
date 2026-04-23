"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { facilityService } from "@/services/facilityService";

interface Hospital {
    id: string;
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    type: string;
    status: "active" | "inactive";
    doctorCount: number;
    departmentCount: number;
}


export default function HospitalsPage() {
    const t = useTranslations("pages.hospitals");
    const tc = useTranslations("common");
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        facilityService.getList({ limit: 100 })
            .then((res: any) => {
                const items: any[] = res?.data?.items ?? res?.items ?? res?.data?.data ?? res?.data ?? res ?? [];
                if (Array.isArray(items) && items.length > 0) {
                    setHospitals(items.map((f: any) => ({
                        id: f.facilities_id ?? f.id ?? "",
                        name: f.name ?? "",
                        code: f.code ?? f.facilities_id ?? f.id ?? "",
                        address: f.address ?? "",
                        phone: f.phone ?? "",
                        email: f.email ?? "",
                        type: f.type ?? "Phòng khám đa khoa",
                        status: (f.status ?? "active").toLowerCase(),
                        doctorCount: f.doctor_count ?? f.doctorCount ?? 0,
                        departmentCount: f.department_count ?? f.departmentCount ?? 0,
                    })));
                }
            })
            .catch(() => { /* API không khả dụng, hiển thị trống */ });
    }, []);

    const filtered = hospitals.filter(
        (h) => (h.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (h.code || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#121417] dark:text-white">{t("title")}</h1>
                    <p className="text-[#687582] dark:text-gray-400">{t("subtitle")}</p>
                </div>
                <button
                    onClick={() => alert("Liên hệ Admin hệ thống để thêm cơ sở mới")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#3C81C6] hover:bg-[#2a6da8] text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all">
                    <span className="material-symbols-outlined text-[20px]">add_business</span>
                    {t("addButton")}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined">domain</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{t("stats.total")}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{hospitals.length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{tc("status.active")}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{hospitals.filter(h => h.status === "active").length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e242b] p-4 rounded-xl border border-[#dde0e4] dark:border-[#2d353e] shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <span className="material-symbols-outlined">stethoscope</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#687582] dark:text-gray-400">{t("stats.doctors")}</p>
                        <p className="text-xl font-bold text-[#121417] dark:text-white">{hospitals.reduce((a, h) => a + h.doctorCount, 0)}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-[#1e242b] border border-[#dde0e4] dark:border-[#2d353e] rounded-xl shadow-sm">
                <div className="p-4 border-b border-[#dde0e4] dark:border-[#2d353e]">
                    <div className="relative w-full sm:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#687582]">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </span>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/20 transition-all dark:text-white placeholder:text-gray-400"
                            placeholder={t("filter.searchPlaceholder")} />
                    </div>
                </div>

                {/* Hospital Cards */}
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filtered.map((hospital) => (
                        <div key={hospital.id} className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-base font-bold text-[#121417] dark:text-white">{hospital.name}</h3>
                                    <p className="text-xs text-[#687582] dark:text-gray-400 mt-0.5">{hospital.code} • {hospital.type}</p>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${hospital.status === "active" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                                    {hospital.status === "active" ? t("statusLabel.active") : t("statusLabel.inactive")}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm text-[#687582] dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                                    {hospital.address}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">call</span>
                                    {hospital.phone}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-xs text-[#687582] dark:text-gray-400">
                                    <span className="font-bold text-[#121417] dark:text-white">{hospital.doctorCount}</span> {t("units.doctors")}
                                </span>
                                <span className="text-xs text-[#687582] dark:text-gray-400">
                                    <span className="font-bold text-[#121417] dark:text-white">{hospital.departmentCount}</span> {t("units.departments")}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
