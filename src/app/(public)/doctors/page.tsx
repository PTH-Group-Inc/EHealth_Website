"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { PatientNavbar } from "@/components/patient/PatientNavbar";
import { PatientFooter } from "@/components/patient/PatientFooter";
import { DoctorCard } from "@/components/patient/DoctorCard";
import { doctorService, type Doctor, formatCurrency } from "@/services/doctorService";
import { getSpecialties, type Specialty } from "@/services/specialtyService";
import { MOCK_SPECIALTIES, filterMockDoctors } from "@/data/patient-mock";
import { DoctorFilterSidebar } from "@/components/patient/DoctorFilterSidebar";
import { facilityService, type Facility } from "@/services/facilityService";
import { branchService, type Branch } from "@/services/branchService";
import { medicalServiceApi, type MedicalService } from "@/services/medicalService";

function DoctorsPageInner() {
    const t = useTranslations("pages.public.doctors");
    const searchParams = useSearchParams();
    const rawSpecialty = searchParams.get("specialtyId");
    const initialSpecialty = rawSpecialty && rawSpecialty !== "undefined" && rawSpecialty !== "null" ? rawSpecialty : "";

    const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
    const [totalDoctors, setTotalDoctors] = useState(0);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [services, setServices] = useState<MedicalService[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
    const [selectedGender, setSelectedGender] = useState("");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000000]);
    const [selectedFacility, setSelectedFacility] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [selectedService, setSelectedService] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 12;

    useEffect(() => {
        loadSpecialties();
        loadFacilities();
        loadServices();
    }, []);

    // Load branches khi selectedFacility thay đổi
    useEffect(() => {
        loadBranches(selectedFacility);
        if (selectedFacility) {
            setSelectedBranch(""); 
        }
    }, [selectedFacility]);

    // Reset page khi filter thay đổi
    useEffect(() => {
        setPage(1);
    }, [selectedSpecialty, selectedGender, priceRange, selectedFacility, selectedBranch, selectedService, search]);

    // Fetch dữ liệu mới khi params hoặc page thay đổi
    useEffect(() => {
        loadDoctors();
    }, [page, search, selectedSpecialty, selectedGender, priceRange, selectedFacility, selectedBranch, selectedService]);

    const loadSpecialties = async () => {
        try {
            const res = await getSpecialties({ limit: 50 });
            if (res.data && res.data.length > 0) {
                setSpecialties(res.data);
            } else {
                setSpecialties(MOCK_SPECIALTIES);
            }
        } catch {
            setSpecialties(MOCK_SPECIALTIES);
        }
    };

    const loadFacilities = async () => {
        try {
            const res = await facilityService.getList({ limit: 50 });
            if (res.data) setFacilities(res.data);
        } catch {
            console.error("Failed to load facilities");
        }
    };

    const loadBranches = async (facilityId?: string) => {
        try {
            const res = await branchService.getList({ limit: 100, facility_id: facilityId || undefined });
            if (res.data) setBranches(res.data as any);
        } catch {
            console.error("Failed to load branches");
        }
    };

    const loadServices = async () => {
        try {
            const res = await medicalServiceApi.getMasterList({ limit: 100 });
            if (res.data) setServices(res.data);
        } catch {
            console.error("Failed to load services");
        }
    };

    const loadDoctors = async () => {
        try {
            setLoading(true);
            const res = await doctorService.getList({
                page: page,
                limit: ITEMS_PER_PAGE,
                search: search || undefined,
                specialty_id: selectedSpecialty || undefined,
                gender: selectedGender || undefined,
                facility_id: selectedFacility || undefined,
                branch_id: selectedBranch || undefined,
                service_id: selectedService || undefined,
                min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
                max_price: priceRange[1] < 15000000 ? priceRange[1] : undefined,
            });

            if (res.data) {
                setAllDoctors(res.data);
                if (res.pagination) {
                    setTotalPages(res.pagination.totalPages || 1);
                    setTotalDoctors(res.pagination.total || res.data.length);
                } else {
                    setTotalPages(1);
                    setTotalDoctors(res.data.length);
                }
            } else {
                setAllDoctors([]);
                setTotalPages(1);
                setTotalDoctors(0);
            }
        } catch {
            setAllDoctors([]);
            setTotalPages(1);
            setTotalDoctors(0);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedSpecialty("");
        setSelectedGender("");
        setPriceRange([0, 15000000]);
        setSelectedFacility("");
        setSelectedBranch("");
        setSelectedService("");
        setPage(1);
    };

    const hasFilters = Boolean(search || selectedSpecialty || selectedGender || priceRange[0] > 0 || priceRange[1] < 15000000 || selectedFacility || selectedBranch || selectedService);
    const paginatedDoctors = allDoctors;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <PatientNavbar />

            {/* Hero */}
            <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c] py-14 md:py-20 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#3C81C6]/15 rounded-full blur-[100px]" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        {t("title")}
                    </h1>
                    <p className="text-[#94a3b8] text-base md:text-lg max-w-2xl mx-auto mb-8">
                        {t("subtitle")}
                    </p>

                    {/* Search */}
                    <div className="max-w-xl mx-auto relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400" style={{ fontSize: "20px" }}>search</span>
                        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Tìm theo tên bác sĩ, chuyên khoa..."
                            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/50 text-sm" />
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="flex gap-8">
                    {/* Sidebar Filters — Desktop */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-6">
                            <DoctorFilterSidebar 
                                specialties={specialties}
                                selectedSpecialty={selectedSpecialty}
                                setSelectedSpecialty={selectedSpecialtyVal => { setSelectedSpecialty(selectedSpecialtyVal); setPage(1); }}
                                selectedGender={selectedGender}
                                setSelectedGender={selectedGenderVal => { setSelectedGender(selectedGenderVal); setPage(1); }}
                                priceRange={priceRange}
                                setPriceRange={priceRangeVal => { setPriceRange(priceRangeVal); setPage(1); }}
                                facilities={facilities}
                                selectedFacility={selectedFacility}
                                setSelectedFacility={selectedFacilityVal => { setSelectedFacility(selectedFacilityVal); setPage(1); }}
                                branches={branches}
                                selectedBranch={selectedBranch}
                                setSelectedBranch={selectedBranchVal => { setSelectedBranch(selectedBranchVal); setPage(1); }}
                                services={services}
                                selectedService={selectedService}
                                setSelectedService={selectedServiceVal => { setSelectedService(selectedServiceVal); setPage(1); }}
                                hasFilters={hasFilters}
                                clearFilters={clearFilters}
                            />
                        </div>
                    </aside>

                    {/* Mobile filter toggle */}
                    <div className="lg:hidden fixed bottom-6 right-6 z-40">
                        <button onClick={() => setShowFilters(!showFilters)}
                            className="w-14 h-14 rounded-full bg-[#3C81C6] text-white shadow-xl shadow-[#3C81C6]/30 flex items-center justify-center active:scale-95 transition-transform">
                            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>tune</span>
                        </button>
                    </div>

                    {/* Doctor Grid */}
                    <div className="flex-1 min-w-0">
                        {/* Results count */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-gray-500">
                                {loading ? "Đang tải..." : `Tìm thấy ${totalDoctors} bác sĩ`}
                            </p>
                            <select className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30">
                                <option>Sắp xếp: Đánh giá cao</option>
                                <option>Kinh nghiệm nhiều</option>
                                <option>Giá thấp → cao</option>
                                <option>Giá cao → thấp</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 rounded-xl bg-gray-200" />
                                            <div className="flex-1">
                                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                                                <div className="h-3 bg-gray-100 rounded w-2/3" />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                                            <div className="h-8 bg-gray-100 rounded-lg flex-1" />
                                            <div className="h-8 bg-gray-200 rounded-lg flex-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : paginatedDoctors.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                                <span className="material-symbols-outlined text-gray-300 mb-3" style={{ fontSize: "64px" }}>person_search</span>
                                <p className="text-gray-500 text-lg font-medium">Không tìm thấy bác sĩ</p>
                                <p className="text-gray-400 text-sm mt-1 mb-4">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
                                <button onClick={clearFilters} className="px-4 py-2 text-sm font-medium text-[#3C81C6] bg-[#3C81C6]/10 rounded-xl hover:bg-[#3C81C6]/20 transition-colors">
                                    Xoá bộ lọc
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {paginatedDoctors.map(doc => (
                                        <DoctorCard
                                            key={doc.id}
                                            id={doc.id}
                                            doctorId={doc.doctorId as string}
                                            fullName={doc.fullName}
                                            title={doc.doctorTitle || doc.qualification || undefined}
                                            department={doc.departmentName}
                                            specialization={doc.specialization}
                                            experience={doc.experience}
                                            rating={doc.rating}
                                            avatar={doc.avatar}
                                            available={doc.status === "active"}
                                            fee={doc.consultationFee ? formatCurrency(doc.consultationFee) : undefined}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span>
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                                            const p = i + 1;
                                            return (
                                                <button key={p} onClick={() => setPage(p)}
                                                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all
                                                    ${page === p ? "bg-[#3C81C6] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}>
                                                    {p}
                                                </button>
                                            );
                                        })}
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            <PatientFooter />
        </div>
    );
}

export default function DoctorsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin" /></div>}>
            <DoctorsPageInner />
        </Suspense>
    );
}
