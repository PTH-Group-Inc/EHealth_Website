"use client";

import React, { useState } from "react";
import { type PatientProfile } from "@/types/patient-profile";
import { getInsuranceStatusMeta } from "@/utils/patientProfileHelpers";
import { getImageUrl } from "@/utils/helpers";

import OverviewTab from "./tabs/OverviewTab";
import InsuranceTab from "./tabs/InsuranceTab";
import VitalsTab from "./tabs/VitalsTab";
import MedicalHistoryTab from "./tabs/MedicalHistoryTab";
import MedicationsTab from "./tabs/MedicationsTab";
import DocumentsTab from "./tabs/DocumentsTab";
import TimelineTab from "./tabs/TimelineTab";

interface PatientDetailProps {
    profile: PatientProfile;
    onBack: () => void;
    onEdit: () => void;
    onRefresh?: () => Promise<void> | void;
}

type TabId =
    | "overview"
    | "insurance"
    | "vitals"
    | "medical-history"
    | "medications"
    | "documents"
    | "timeline";

const TABS: Array<{ id: TabId; label: string }> = [
    { id: "overview", label: "Thông tin cá nhân" },
    { id: "insurance", label: "Bảo hiểm" },
    { id: "vitals", label: "Chỉ số" },
    { id: "medical-history", label: "Tiền sử" },
    { id: "medications", label: "Đơn thuốc" },
    { id: "documents", label: "Tài liệu" },
    { id: "timeline", label: "Dòng thời gian" },
];

export default function PatientDetail({ profile, onBack, onEdit, onRefresh }: PatientDetailProps) {
    const [activeTab, setActiveTab] = useState<TabId>("overview");
    const insuranceMeta = getInsuranceStatusMeta(profile.insuranceStatus);

    const renderActiveTab = () => {
        switch (activeTab) {
            case "overview":
                return <OverviewTab profile={profile} />;
            case "insurance":
                return <InsuranceTab profile={profile} onInsuranceChanged={onRefresh} />;
            case "vitals":
                return <VitalsTab profile={profile} />;
            case "medical-history":
                return <MedicalHistoryTab profile={profile} />;
            case "medications":
                return <MedicationsTab profile={profile} />;
            case "documents":
                return <DocumentsTab profile={profile} />;
            case "timeline":
                return <TimelineTab profile={profile} />;
            default:
                return <OverviewTab profile={profile} />;
        }
    };

    return (
        <div className="min-h-full w-full bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#0d1117_0%,#111821_100%)]">
            <div className="border-b border-slate-200/80 bg-white/90 px-5 py-5 backdrop-blur-sm dark:border-[#2d353e] dark:bg-[#111821]/90 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                        Danh sách hồ sơ
                    </button>

                    <button
                        onClick={onEdit}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#3C81C6] transition-all hover:border-[#3C81C6]/30 hover:bg-[#3C81C6]/5 dark:border-[#2d353e] dark:bg-[#111821]"
                        title="Chỉnh sửa thông tin hồ sơ"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                        Chỉnh sửa
                    </button>
                </div>

                <div className="mt-5 flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#3C81C6] to-[#2563eb] text-white shadow-md">
                        {profile.avatar ? (
                            <img src={getImageUrl(profile.avatar)} alt={profile.fullName} className="h-full w-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined" style={{ fontSize: "30px" }}>person</span>
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#3C81C6]/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#3C81C6]">
                                {profile.relationshipLabel}
                            </span>
                            {profile.isPrimary && (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                    Hồ sơ mặc định
                                </span>
                            )}
                            <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                    profile.isActive ? "bg-slate-100 text-slate-700" : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                {profile.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${insuranceMeta.className}`}>
                                {insuranceMeta.label}
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[30px]">
                            {profile.fullName}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Mã bệnh nhân:{" "}
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                {profile.patientCode || profile.id}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/92 px-5 py-3 backdrop-blur-sm dark:border-[#2d353e] dark:bg-[#111821]/95 sm:px-8">
                <div className="scrollbar-none -mb-1 overflow-x-auto pb-1">
                    <div className="inline-flex min-w-full gap-1 rounded-[22px] bg-slate-100 p-1.5 dark:bg-slate-800/90 sm:min-w-0">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`shrink-0 rounded-[18px] px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                        isActive
                                            ? "bg-white text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.08)] dark:bg-[#0f141b] dark:text-white"
                                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="px-5 py-6 sm:px-8 sm:py-8">
                {renderActiveTab()}
            </div>
        </div>
    );
}
