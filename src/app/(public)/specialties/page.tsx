"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PatientNavbar } from "@/components/patient/PatientNavbar";
import { PatientFooter } from "@/components/patient/PatientFooter";
import { SpecialtyCard } from "@/components/patient/SpecialtyCard";
import { getSpecialties, type Specialty } from "@/services/specialtyService";

export default function SpecialtiesPage() {
    const t = useTranslations("pages.public.specialties");
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadSpecialties();
    }, []);

    const loadSpecialties = async () => {
        try {
            setLoading(true);
            setError(false);
            const res = await getSpecialties({ limit: 50 });
            setSpecialties(res.data ?? []);
        } catch {
            setSpecialties([]);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const filtered = specialties.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-50/50">
            <PatientNavbar />

            {/* Hero Banner */}
            <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c] py-16 md:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#3C81C6]/15 rounded-full blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#60a5fa]/10 rounded-full blur-[100px]" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.06] backdrop-blur-sm rounded-full border border-white/[0.08] mb-6">
                        <span className="material-symbols-outlined text-[#60a5fa]" style={{ fontSize: "16px" }}>local_hospital</span>
                        <span className="text-[#60a5fa] text-sm font-medium">Chuyên khoa y tế</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        {t("title")}
                    </h1>
                    <p className="text-[#94a3b8] text-base md:text-lg max-w-2xl mx-auto mb-8">
                        {t("subtitle")}
                    </p>

                    {/* Search */}
                    <div className="max-w-lg mx-auto relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400" style={{ fontSize: "20px" }}>search</span>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm chuyên khoa..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 text-sm" />
                    </div>
                </div>
            </section>

            {/* Specialty Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                                <div className="w-14 h-14 rounded-2xl bg-gray-200 mb-4" />
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                                <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                                <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
                                <div className="flex gap-1.5 mb-4">
                                    <div className="h-5 bg-gray-100 rounded w-16" />
                                    <div className="h-5 bg-gray-100 rounded w-20" />
                                </div>
                                <div className="flex gap-2 pt-4 border-t border-gray-50">
                                    <div className="h-8 bg-gray-100 rounded-lg flex-1" />
                                    <div className="h-8 bg-gray-200 rounded-lg flex-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                            ) : error ? (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-red-300 mb-3" style={{ fontSize: "64px" }}>cloud_off</span>
                        <p className="text-gray-700 text-lg font-medium">Không thể tải danh sách chuyên khoa</p>
                        <p className="text-gray-400 text-sm mt-1 mb-4">Vui lòng thử lại sau</p>
                        <button onClick={loadSpecialties} className="px-4 py-2 text-sm font-medium text-white bg-[#3C81C6] rounded-xl hover:bg-[#2a6da8] transition-colors">
                            Thử lại
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="material-symbols-outlined text-gray-300 mb-3" style={{ fontSize: "64px" }}>search_off</span>
                        <p className="text-gray-500 text-lg font-medium">Không tìm thấy chuyên khoa</p>
                        <p className="text-gray-400 text-sm mt-1">Thử tìm kiếm với từ khoá khác</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map(spec => (
                            <SpecialtyCard
                                key={spec.id}
                                id={spec.id}
                                name={spec.name}
                                description={spec.description}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-[#3C81C6] to-[#2563eb] py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Không tìm thấy chuyên khoa phù hợp?</h2>
                    <p className="text-blue-100 mb-6">Gọi hotline để được tư vấn miễn phí bởi đội ngũ chuyên gia</p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <a href="tel:02812345678" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#3C81C6] font-semibold rounded-xl hover:shadow-lg transition-all active:scale-[0.97]">
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>call</span>
                            Gọi 1900 1234
                        </a>
                        <a href="/booking" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>calendar_month</span>
                            Đặt lịch khám
                        </a>
                    </div>
                </div>
            </section>

            <PatientFooter />
        </div>
    );
}
