"use client";

import { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PatientNavbar } from "@/components/patient/PatientNavbar";
import { PatientFooter } from "@/components/patient/PatientFooter";
import { BookingStepIndicator } from "@/components/patient/BookingStepIndicator";
import { TimeSlotPicker } from "@/components/patient/TimeSlotPicker";
import { DoctorCard } from "@/components/patient/DoctorCard";
import { getSpecialties, getSpecialtiesByFacility, type Specialty } from "@/services/specialtyService";
import { doctorService, type Doctor } from "@/services/doctorService";
import { createAppointment, confirmAppointment, generateAppointmentQr, getAvailableSlots, getAvailableSlotsByDepartment, preBookAppointment } from "@/services/appointmentService";
import { PreBookingPaymentModal } from "@/components/shared/PreBookingPaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_SPECIALTIES, filterMockDoctors, getMockDoctorById } from "@/data/patient-mock";
import { MOCK_MEDICAL_SERVICES, getServicesBySpecialtyId, getSpecialtyIdsByServiceId, SERVICE_CATEGORIES, type MedicalServiceItem } from "@/data/medical-services-mock";
import { MOCK_PATIENT_PROFILES, getProfilesByUserId, type PatientProfile } from "@/data/patient-profiles-mock";
import { patientProfileService } from "@/services/patientProfileService";
import { telemedicineService } from "@/services/telemedicineService";
import { validateName, validatePhone, validateAppointmentDate } from "@/utils/validation";
import { getImageUrl } from "@/utils/helpers";

const STEPS = [
    { label: "Hình thức", icon: "category" },
    { label: "Ngày giờ", icon: "calendar_month" },
    { label: "Thông tin", icon: "person" },
    { label: "Xác nhận", icon: "fact_check" },
    { label: "Hoàn tất", icon: "check_circle" },
];

interface PatientForm {
    fullName: string;
    phone: string;
    dob: string;
    gender: string;
    idNumber: string;
    insuranceNumber: string;
    address: string;
    symptoms: string;
    bookingFor: "self" | "relative";
    relativeName: string;
    relativePhone: string;
    relativeRelation: string;
}

const emptyForm: PatientForm = {
    fullName: "", phone: "", dob: "", gender: "", idNumber: "", insuranceNumber: "",
    address: "", symptoms: "", bookingFor: "self", relativeName: "", relativePhone: "", relativeRelation: "",
};

function BookingPageInner() {
    const t = useTranslations("pages.public.booking");
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated } = useAuth();

    const initDoctorId = searchParams.get("doctorId") || "";
    const initDoctorName = searchParams.get("doctorName") || "";
    const initSpecialtyId = searchParams.get("specialtyId") || "";
    const initSpecialtyName = searchParams.get("specialtyName") || "";
    const initServiceId = searchParams.get("serviceId") || "";
    const initDate = searchParams.get("date") || "";
    const initTime = searchParams.get("time") || "";

    const initStep = parseInt(searchParams.get("step") || "1", 10);
    const [step, _setStep] = useState(initStep);
    const [bookingType, setBookingType] = useState<"specialty" | "doctor" | "service">(
        initDoctorId || initDoctorName ? "doctor" : initServiceId ? "service" : "specialty"
    );

    // Sync step from URL if user clicks browser back button
    useEffect(() => {
        const urlStep = parseInt(searchParams.get("step") || "1", 10);
        if (urlStep !== step) {
            _setStep(urlStep);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.get("step")]);

    // Sync step state → URL (runs AFTER render, not during)
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        const urlStep = params.get("step");
        if (urlStep !== step.toString()) {
            params.set("step", step.toString());
            router.push(`?${params.toString()}`, { scroll: false });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    const setStep = (newStep: number | ((s: number) => number)) => {
        _setStep(newStep);
    };
    const [consultType, setConsultType] = useState<"in-person" | "online">("in-person");
    const [selectedFacility, setSelectedFacility] = useState("");

    const [selectedBranch, setSelectedBranch] = useState("");
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState(initSpecialtyId);
    const [selectedDoctor, setSelectedDoctor] = useState(initDoctorId);
    const [selectedService, setSelectedService] = useState(initServiceId);
    const [selectedDate, setSelectedDate] = useState(initDate);
    const [selectedTime, setSelectedTime] = useState(initTime);
    const [selectedSlotId, setSelectedSlotId] = useState("");
    const [form, setForm] = useState<PatientForm>(emptyForm);
    const [agreedTerms, setAgreedTerms] = useState(false);
    
    // UI state
    const [bookingCode, setBookingCode] = useState("");
    const [qrToken, setQrToken] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [payingData, setPayingData] = useState<{ appointmentId: string; invoiceId?: string; qrData: string; amount: number } | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string>("");
    const [serviceFilter, setServiceFilter] = useState("all");
    const [availableSlots, setAvailableSlots] = useState<{ id?: string, time: string; available: boolean; remaining: number }[]>([]);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [facilityClosedMessage, setFacilityClosedMessage] = useState("");

    // Data
    const [facilities, setFacilities] = useState<any[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorObj, setSelectedDoctorObj] = useState<Doctor | null>(null);
    const [patientProfiles, setPatientProfiles] = useState<PatientProfile[]>([]);
    const [fetchedServices, setFetchedServices] = useState<any[]>([]);
    const [isFetchingServices, setIsFetchingServices] = useState(false);

    // ==========================================
    // Persist State across F5 Refreshes
    // ==========================================
    const [isClientSessionReady, setIsClientSessionReady] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem("ehealth_booking_state");
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (data.consultType) setConsultType(data.consultType);
                if (data.selectedFacility) setSelectedFacility(data.selectedFacility);
                if (data.selectedBranch) setSelectedBranch(data.selectedBranch);
                if (data.selectedSpecialty) setSelectedSpecialty(data.selectedSpecialty);
                if (data.selectedDoctor) setSelectedDoctor(data.selectedDoctor);
                if (data.selectedService) setSelectedService(data.selectedService);
                if (data.selectedDate) setSelectedDate(data.selectedDate);
                if (data.selectedTime) setSelectedTime(data.selectedTime);
                if (data.selectedSlotId) setSelectedSlotId(data.selectedSlotId);
                if (data.form) setForm(data.form);
                if (data.agreedTerms !== undefined) setAgreedTerms(data.agreedTerms);
                if (data.selectedProfileId) setSelectedProfileId(data.selectedProfileId);
            } catch (err) {}
        }
        setIsClientSessionReady(true);
    }, []);

    useEffect(() => {
        if (!isClientSessionReady) return;
        
        if (step === 5) {
            sessionStorage.removeItem("ehealth_booking_state");
        } else {
            sessionStorage.setItem("ehealth_booking_state", JSON.stringify({
                consultType, selectedFacility, selectedBranch, selectedSpecialty,
                selectedDoctor, selectedService, selectedDate, selectedTime,
                selectedSlotId, form, agreedTerms, selectedProfileId
            }));
        }
    }, [isClientSessionReady, step, consultType, selectedFacility, selectedBranch, selectedSpecialty, selectedDoctor, selectedService, selectedDate, selectedTime, selectedSlotId, form, agreedTerms, selectedProfileId]);

    // Load available services dynamically based on selected doctor OR specialty
    useEffect(() => {
        let isMounted = true;
        const fetchServices = async () => {
            // Resolve the correct doctor_id for the doctor-services API
            // Backend expects doctors_id (e.g. DOC_08), NOT users_id (USR_DOC_08)
            const resolvedDoctorId = selectedDoctorObj?.doctorId;

            try {
                setIsFetchingServices(true);
                // 1. Cả chuyên khoa và bác sĩ đều được chọn -> Lấy cả 2 gộp lại (để "hiện ra thêm" dịch vụ bác sĩ)
                if (selectedDoctor && selectedSpecialty) {
                    const { getServicesBySpecialty } = await import('@/services/specialtyService');
                    const promises: Promise<any>[] = [
                        getServicesBySpecialty(selectedSpecialty, selectedFacility)
                    ];
                    // Only fetch doctor services if we have the real doctors_id
                    if (resolvedDoctorId) {
                        promises.unshift(doctorService.getServices(resolvedDoctorId));
                    } else {
                        promises.unshift(Promise.resolve([]));
                    }
                    const [docData, specData] = await Promise.all(promises);
                    const map = new Map();
                    // Load specialty services first
                    (specData || []).forEach((s: any) => {
                        const id = s.service_id || s.id || s.services_id;
                        if (id && !map.has(id)) map.set(id, s);
                    });
                    // Append doctor services
                    (docData || []).forEach((s: any) => {
                        const id = s.service_id || s.id || s.services_id;
                        if (id) {
                            // Override if the existing one has no price, or just add
                            if (!map.has(id) || !map.get(id).base_price) {
                                map.set(id, s);
                            }
                        }
                    });
                    if (isMounted) setFetchedServices(Array.from(map.values()));
                }
                // 2. Tải theo bác sĩ nếu chỉ chọn bác sĩ
                else if (selectedDoctor && resolvedDoctorId) {
                    const data = await doctorService.getServices(resolvedDoctorId);
                    if (isMounted) setFetchedServices(data || []);
                } 
                // 3. Tải theo chuyên khoa nếu có chọn chuyên khoa (mà chưa chọn bác sĩ)
                //    SKIP khi bookingType === "service" vì selectedSpecialty chỉ dùng cho slot, không reload services
                else if (selectedSpecialty && bookingType !== "service") {
                    const { getServicesBySpecialty } = await import('@/services/specialtyService');
                    const data = await getServicesBySpecialty(selectedSpecialty, selectedFacility);
                    if (isMounted) setFetchedServices(data || []);
                } 
                // 4. Tải tất cả dịch vụ nếu chọn tab "Theo dịch vụ"
                else if (bookingType === "service") {
                    const { medicalServiceApi } = await import('@/services/medicalService');
                    if (selectedFacility) {
                        const res = await medicalServiceApi.getFacilityActiveServices(selectedFacility, { limit: 200 });
                        if (isMounted) setFetchedServices(res.data || []);
                    } else {
                        const res = await medicalServiceApi.getMasterList({ limit: 200 });
                        if (isMounted) setFetchedServices(res.data || []);
                    }
                }
                // 5. Không có điều kiện
                else {
                    if (isMounted) setFetchedServices([]);
                }
            } catch (error) {
                if (isMounted) setFetchedServices([]);
            } finally {
                if (isMounted) setIsFetchingServices(false);
            }
        };
        fetchServices();
        return () => { isMounted = false; };
    }, [selectedSpecialty, selectedDoctor, selectedFacility, selectedDoctorObj, bookingType, selectedBranch]);

    // Filtered services
    const filteredServices = (() => {
        let svcs = [...fetchedServices];
        if (serviceFilter !== "all") {
            svcs = svcs.filter(s => s.service_group === serviceFilter);
        }
        return svcs;
    })();

    // Suggested specialties based on selected service
    const suggestedSpecialties = (() => {
        if (!selectedService) return [];
        const fetchSvc = fetchedServices.find(s => (s.service_id || s.id || s.services_id) === selectedService);
        if (fetchSvc) {
            // 1. Nếu service có specialties_id hoặc specialty_id → match trực tiếp
            if (fetchSvc.specialties_id || fetchSvc.specialty_id) {
                const spId = fetchSvc.specialties_id || fetchSvc.specialty_id;
                return specialties.filter(s => s.id === spId || (s as any).specialties_id === spId);
            }
            // 2. Nếu service chỉ có department_id → tìm specialty nào có cùng department_id
            if (fetchSvc.department_id) {
                const matched = specialties.filter(s => (s as any).department_id === fetchSvc.department_id);
                if (matched.length > 0) return matched;
                // department_id ≠ specialty_id, không nên fallback
            }
        }
        const specIds = getSpecialtyIdsByServiceId(selectedService);
        return specialties.filter(s => specIds.includes(s.id));
    })();

    // Services available for selected doctor
    const doctorServices = fetchedServices;

    useEffect(() => { 
        import('@/services/facilityService').then(mod => {
            mod.facilityService.getList({ limit: 50, status: 'ACTIVE' }).then(res => {
                if (res.data && res.data.length > 0) {
                    setFacilities(res.data);
                    setSelectedFacility(res.data[0].id);
                } else {
                    setFacilities([{ id: "fac-01", name: "EHealth Hospital Quận 7", address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM" }]);
                    setSelectedFacility("fac-01");
                }
            }).catch(e => {
                console.error(e);
                setFacilities([{ id: "fac-01", name: "EHealth Hospital Quận 7", address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM" }]);
                setSelectedFacility("fac-01");
            });
        });
    }, []);

    // Fetch branches dynamically whenever selectedFacility changes
    useEffect(() => {
        if (!selectedFacility) return;
        let isMounted = true;
        import('@/services/branchService').then(mod => {
            mod.branchService.getList({ facility_id: selectedFacility, status: 'ACTIVE' }).then((res: any) => {
                if (isMounted) {
                    if (res.data && res.data.length > 0) {
                        setBranches(res.data);
                        setSelectedBranch(res.data[0].id);
                    } else {
                        setBranches([]);
                        setSelectedBranch("");
                    }
                }
            }).catch(e => {
                if (isMounted) {
                    setBranches([]);
                    setSelectedBranch("");
                }
            });
        });
        return () => { isMounted = false; };
    }, [selectedFacility]);
    useEffect(() => { loadSpecialties(); }, [selectedFacility, selectedBranch]);
    useEffect(() => { if (selectedSpecialty || selectedFacility) loadDoctors(); }, [selectedSpecialty, selectedFacility, selectedBranch]);
    useEffect(() => { if (initDoctorId) loadSelectedDoctor(initDoctorId); }, [initDoctorId]);
    useEffect(() => {
        if (initDoctorName) {
            const { data } = filterMockDoctors({ search: initDoctorName, limit: 1 });
            if (data.length > 0) {
                setSelectedDoctorObj(data[0]);
                setSelectedDoctor(data[0].id);
            }
        }
    }, [initDoctorName]);
    useEffect(() => {
        if (initSpecialtyName && specialties.length > 0) {
            const found = specialties.find(s => s.name === initSpecialtyName);
            if (found) setSelectedSpecialty(found.id);
        }
    }, [initSpecialtyName, specialties]);
    useEffect(() => {
        if (user && isAuthenticated) {
            const loadProfiles = async () => {
                let profiles: PatientProfile[] = [];
                try {
                    const data = await patientProfileService.getMyProfiles();
                    if (data && data.length > 0) {
                        profiles = data.map((p: any, index: number) => ({
                            id: p.id || p.patients_id,
                            userId: user.id || "patient-001",
                            relationship: p.relationship === "SELF" ? "self" : (p.relationship || "self").toLowerCase(),
                            relationshipLabel: p.relationship === "SELF" ? "Bản thân" : (p.relationship || "Khác"),
                            fullName: p.full_name,
                            phone: p.phone_number,
                            dob: p.date_of_birth ? p.date_of_birth.toString().split("T")[0] : "",
                            gender: p.gender === "MALE" ? "male" : p.gender === "FEMALE" ? "female" : "other",
                            address: p.address,
                            idNumber: p.id_card_number || p.identity_card_number,
                            insuranceNumber: p.health_insurance_code,
                            isPrimary: p.is_default || index === 0,
                            isActive: p.status === "ACTIVE" || true,
                            createdAt: p.created_at || new Date().toISOString(),
                            updatedAt: p.updated_at || new Date().toISOString(),
                        } as unknown as PatientProfile));
                    }
                } catch (err) {
                    console.error("Lỗi load profiles:", err);
                    profiles = [];
                }
                
                setPatientProfiles(profiles);

                // Bỏ qua việc overwrite form nếu đã có session state được load (người dùng vừa F5)
                const stored = sessionStorage.getItem("ehealth_booking_state");
                if (stored) return;

                setForm(prev => ({ ...prev, fullName: user.fullName || "", phone: user.phone || "" }));
                const primary = profiles.find(p => p.isPrimary) || profiles[0];
                if (primary) {
                    setSelectedProfileId(primary.id);
                    setForm(prev => ({
                        ...prev,
                        fullName: primary.fullName || "",
                        phone: primary.phone || "",
                        dob: primary.dob || "",
                        gender: primary.gender || "male",
                        idNumber: primary.idNumber || "",
                        insuranceNumber: primary.insuranceNumber || "",
                        address: primary.address || "",
                        bookingFor: primary.relationship === "self" ? "self" : "relative",
                    }));
                }
            };
            loadProfiles();
        }
    }, [user, isAuthenticated]);

    useEffect(() => {
        if (!selectedDate) return;
        // Nếu không có doctor và (không phải đặt lịch theo chuyên khoa/dịch vụ hoặc thiếu chi nhánh, chuyên khoa) thì return
        if (!selectedDoctor && (!['specialty', 'service'].includes(bookingType) || !selectedFacility || !selectedSpecialty)) return;
        
        let isMounted = true;
        const fetchSlots = async () => {
            try {
                setIsFetchingSlots(true);
                setFacilityClosedMessage("");
                let data = [];

                if (selectedDoctor) {
                    // Fix #1: Pass facility_id directly — BE auto-resolves to branch_id
                    const facilityId = selectedDoctorObj?.facilities?.[0]?.facility_id || selectedDoctorObj?.facilities?.[0]?.branch_id || selectedFacility || "";
                    if (!facilityId) {
                        if (isMounted) setAvailableSlots([]);
                        return;
                    }
                    
                    const res = await getAvailableSlots({ date: selectedDate, doctor_id: selectedDoctorObj?.doctorId || selectedDoctor, branch_id: selectedBranch || facilityId });
                    if (res && res.length === 1 && res[0]._facilityClosedFlag === true) {
                        if (isMounted) setFacilityClosedMessage("Cơ sở đóng cửa vào ngày này. Vui lòng chọn ngày khác.");
                        data = [];
                    } else if (res && res.length > 0) {
                        data = res;
                    } else {
                        data = [];
                    }
                } else if (['specialty', 'service'].includes(bookingType) && selectedFacility && selectedSpecialty) {
                    // Fix #2: Resolve department_id from specialties data (loaded via API with department_id)
                    const matchedSpecialty = specialties.find(s => s.id === selectedSpecialty);
                    let resolvedDepartmentId = (matchedSpecialty as any)?.department_id;
                    
                    // Fallback: nếu specialties chưa có department_id, gọi trực tiếp API để resolve
                    if (!resolvedDepartmentId) {
                        try {
                            const deptMapping = await getSpecialtiesByFacility(selectedFacility);
                            const match = deptMapping?.find((dm: any) => dm.specialty_id === selectedSpecialty);
                            resolvedDepartmentId = match?.department_id;
                        } catch { /* ignore */ }
                    }
                    
                    if (!resolvedDepartmentId) {
                        console.warn('[fetchSlots] Không tìm được department_id cho specialty:', selectedSpecialty);
                        if (isMounted) { setAvailableSlots([]); setIsFetchingSlots(false); }
                        return;
                    }
                    const res = await getAvailableSlotsByDepartment({ 
                        department_id: resolvedDepartmentId, 
                        facility_id: selectedFacility, branch_id: selectedBranch,
                        start_date: selectedDate,
                        days: 1
                    });
                    // Fix #4: Check if facility is closed
                    if (res && res.length > 0) {
                        if (res[0].is_facility_open === false) {
                            if (isMounted) setFacilityClosedMessage("Cơ sở đóng cửa vào ngày này. Vui lòng chọn ngày khác.");
                            data = [];
                        } else if (res[0].slots) {
                            data = res[0].slots;
                        }
                    }
                }

                if (!isMounted) return;
                
                const mappedSlots = data.map((slot: any) => ({
                    id: slot.slot_id,
                    time: slot.start_time.substring(0, 5),
                    available: slot.is_available,
                    remaining: Math.max(0, slot.max_capacity - slot.booked_count),
                }));
                mappedSlots.sort((a: any, b: any) => a.time.localeCompare(b.time));
                setAvailableSlots(mappedSlots);
            } catch (error) {
                console.error("Lỗi lấy slot:", error);
                if (isMounted) setAvailableSlots([]);
            } finally {
                if (isMounted) setIsFetchingSlots(false);
            }
        };
        fetchSlots();
        return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, selectedDoctor, selectedDoctorObj, bookingType, selectedFacility, selectedSpecialty, selectedBranch, specialties]);

    const loadSpecialties = async () => {
        try {
            const res = await getSpecialties({ limit: 50 });
            let specialtiesData = (res.data && res.data.length > 0) ? res.data : MOCK_SPECIALTIES;
            
            // Enrich specialties with department_id from facility mapping & filter by branch
            if (selectedFacility) {
                try {
                    const deptMapping = await getSpecialtiesByFacility(selectedFacility);
                    if (deptMapping && deptMapping.length > 0) {
                        // Filter by selected branch if one is chosen
                        const filteredMapping = selectedBranch
                            ? deptMapping.filter((dm: any) => dm.branch_id === selectedBranch)
                            : deptMapping;
                        
                        // Only keep specialties that exist in the (branch-filtered) mapping
                        specialtiesData = specialtiesData
                            .map((s: any) => {
                                const match = filteredMapping.find((dm: any) => dm.specialty_id === s.id || dm.specialty_id === s.specialties_id);
                                return match ? { ...s, department_id: match.department_id } : null;
                            })
                            .filter(Boolean);
                    }
                } catch { /* fallback: no department_id enrichment */ }
            }
            setSpecialties(specialtiesData);
        } catch { setSpecialties(MOCK_SPECIALTIES); }
    };
    const loadDoctors = async () => {
        try {
            const params: any = { limit: 20 };
            if (selectedSpecialty) params.specialty_id = selectedSpecialty;
            if (selectedFacility) params.facility_id = selectedFacility;
            if (selectedBranch) params.branch_id = selectedBranch;
            const res = await doctorService.getList(params);
            if (res.data && res.data.length > 0) setDoctors(res.data);
            else {
                const mock = filterMockDoctors({ departmentId: selectedSpecialty, limit: 20 });
                setDoctors(mock.data);
            }
        } catch {
            const mock = filterMockDoctors({ departmentId: selectedSpecialty, limit: 20 });
            setDoctors(mock.data);
        }
    };
    const loadSelectedDoctor = async (docId: string) => {
        try {
            const doc = await doctorService.getById(docId);
            if (doc && doc.id) {
                setSelectedDoctorObj(doc);
                setSelectedDoctor(docId);
                // Auto-set branch from doctor's branch if available
                if (doc.branchId) setSelectedBranch(doc.branchId);
            }
            else {
                const mock = getMockDoctorById(docId);
                if (mock) { setSelectedDoctorObj(mock); setSelectedDoctor(docId); }
            }
        } catch {
            const mock = getMockDoctorById(docId);
            if (mock) { setSelectedDoctorObj(mock); setSelectedDoctor(docId); }
        }
    };

    // When service is selected, auto-select specialty if only one match
    const handleServiceSelect = async (svcId: string) => {
        if (selectedService === svcId) {
            setSelectedService("");
            setSelectedSpecialty("");
            return;
        }
        setSelectedService(svcId);
        const fetchSvc = fetchedServices.find(s => (s.service_id || s.id || s.services_id) === svcId);
        if (fetchSvc) {
            // 1. Service có specialties_id hoặc specialty_id → dùng trực tiếp
            if (fetchSvc.specialties_id || fetchSvc.specialty_id) {
                setSelectedSpecialty(fetchSvc.specialties_id || fetchSvc.specialty_id);
                return;
            }
            // 2. Service chỉ có department_id → tìm specialty nào có cùng department_id (enriched)
            if (fetchSvc.department_id) {
                const matchedSpec = specialties.find(s => (s as any).department_id === fetchSvc.department_id);
                if (matchedSpec) {
                    setSelectedSpecialty(matchedSpec.id);
                    return;
                }
                // KHÔNG fallback department_id làm specialty (DEPT_SAN ≠ SPC_SAN)
            }
        }
        // 3. Reverse lookup: tìm specialties gán cho service này qua API hoặc mock
        const specIds = getSpecialtyIdsByServiceId(svcId);
        if (specIds.length === 1) {
            setSelectedSpecialty(specIds[0]);
        } else if (specIds.length === 0) {
            // Thử gọi API reverse lookup
            try {
                const { default: axiosClient } = await import('@/api/axiosClient');
                const res = await axiosClient.get(`/api/specialty-services/by-service/${svcId}`);
                const specList = res.data?.data || [];
                if (specList.length === 1) {
                    setSelectedSpecialty(specList[0].specialty_id);
                } else if (specList.length > 1) {
                    // Nếu service thuộc nhiều chuyên khoa, ưu tiên chuyên khoa đã enrich trong specialties state
                    const matchInState = specList.find((sp: any) => specialties.some(s => s.id === sp.specialty_id));
                    setSelectedSpecialty(matchInState?.specialty_id || specList[0].specialty_id);
                } else {
                    setSelectedSpecialty("");
                }
            } catch {
                setSelectedSpecialty("");
            }
        } else {
            setSelectedSpecialty("");
        }
    };

    // Apply profile to form
    const applyProfile = (profileId: string) => {
        setSelectedProfileId(profileId);
        const profile = patientProfiles.find(p => p.id === profileId);
        if (profile) {
            setForm(prev => ({
                ...prev,
                fullName: profile.fullName,
                phone: profile.phone,
                dob: profile.dob,
                gender: profile.gender,
                idNumber: profile.idNumber || "",
                insuranceNumber: profile.insuranceNumber || "",
                address: profile.address || "",
                bookingFor: profile.relationship === "self" ? "self" : "relative",
            }));
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 5));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const canProceedStep1 = selectedFacility && (
        (bookingType === "doctor" && selectedDoctor) ||
        (bookingType === "specialty" && selectedSpecialty) ||
        (bookingType === "service" && selectedService && selectedSpecialty)
    );
    const canProceedStep2 = selectedDate && selectedTime && validateAppointmentDate(selectedDate).valid;
    const canProceedStep3 = isAuthenticated && form.fullName && form.phone && form.gender
        && validateName(form.fullName).valid && validatePhone(form.phone).valid;
    const canProceedStep4 = agreedTerms;

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Phải có patient profile ID thật từ bảng patients, không dùng user account ID
            const patientId = selectedProfileId;
            if (!patientId) {
                alert("Vui lòng chọn hồ sơ bệnh nhân trước khi đặt lịch.");
                return;
            }
            if (!selectedSlotId && !selectedDate) {
                alert("Vui lòng chọn ngày và giờ khám.");
                return;
            }

            let appointment: any;
            if (consultType === "online") {
                const sessionRes = await telemedicineService.create({
                    patient_id: patientId,
                    specialty_id: selectedSpecialty || undefined,
                    facility_id: selectedFacility || undefined,
                    type_id: "TCT_VIDEO",
                    doctor_id: selectedDoctorObj?.doctorId || undefined,
                    slot_id: selectedSlotId || undefined,
                    booking_date: selectedDate,
                    booking_start_time: selectedTime,
                    reason_for_visit: form.symptoms,
                } as any);
                appointment = sessionRes;
            } else {
                // Pre-Booking flow: tạo appointment PENDING + invoice + QR cọc SePay.
                // Khách quét QR → BE nhận webhook → trạng thái tự chuyển sang PAID/SCHEDULED.
                try {
                    const pre = await preBookAppointment({
                        patientId,
                        doctorId: selectedDoctorObj?.doctorId || undefined,
                        facilityId: selectedFacility || undefined,
                        branchId: selectedBranch || undefined,
                        specialtyId: selectedSpecialty || undefined,
                        serviceId: selectedService || undefined,
                        slotId: selectedSlotId || undefined,
                        appointmentDate: selectedDate,
                        reasonForVisit: form.symptoms,
                        notes: form.symptoms,
                        bookingChannel: "WEB_PORTAL",
                    });

                    const aptId = pre?.appointment?.appointments_id || pre?.appointment?.id || "";
                    const invId = pre?.invoice?.invoices_id || pre?.invoice?.id;
                    const qr = pre?.payment?.qrTemplateData || pre?.payment?.qr_url || pre?.payment?.qrString || "";
                    const amount = Number(pre?.invoice?.total_amount ?? 0);

                    appointment = { ...pre.appointment, id: aptId };

                    if (aptId && qr) {
                        setPayingData({ appointmentId: aptId, invoiceId: invId, qrData: qr, amount });
                        // step 5 hiển thị sau khi Paid callback (xem onPaid của modal).
                        return;
                    }

                    // Fallback: BE không trả QR → giữ luồng cũ cho an toàn.
                    if (aptId) {
                        await confirmAppointment(aptId);
                        try {
                            const qrRes = await generateAppointmentQr(aptId);
                            setQrToken(qrRes.qr_token);
                        } catch { /* ignore */ }
                    }
                } catch (err: any) {
                    // Nếu BE chưa triển khai pre-book (404/405/501) → fallback API cũ.
                    const statusCode = err?.response?.status;
                    if (statusCode && ![404, 405, 501].includes(statusCode)) {
                        throw err;
                    }
                    appointment = await createAppointment({
                        patientId,
                        doctorId: selectedDoctorObj?.doctorId || undefined,
                        facilityId: selectedFacility || undefined,
                        branchId: selectedBranch || undefined,
                        specialtyId: selectedSpecialty || undefined,
                        serviceId: selectedService || undefined,
                        slotId: selectedSlotId || undefined,
                        date: selectedDate,
                        time: selectedTime,
                        type: "first_visit",
                        reason: form.symptoms,
                    });
                    const appId = appointment?.appointments_id || appointment?.id;
                    if (appId) {
                        appointment = { ...appointment, id: appId };
                        try { await confirmAppointment(appId); } catch { /* ignore */ }
                        try { const qrRes = await generateAppointmentQr(appId); setQrToken(qrRes.qr_token); } catch { /* ignore */ }
                    }
                }
            }

            const bookingId = appointment?.id || appointment?.appointments_id || appointment?.session_id || appointment?.session_code || `EH-${Date.now().toString(36).toUpperCase()}`;
            setBookingCode(bookingId);
            setStep(5);
        } catch (err: any) {
            console.error("Lỗi khi đặt lịch:", err);
            const msg = err?.response?.data?.message || err?.message || "Đã xảy ra lỗi khi đặt lịch. Vui lòng thử lại sau!";
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const updateForm = (key: keyof PatientForm, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const getSelectedServiceObj = (): any => {
        // Search fetched services first (real API data)
        const fetchSvc = fetchedServices.find(s => (s.service_id || s.id || s.services_id) === selectedService);
        if (fetchSvc) return { ...fetchSvc, name: fetchSvc.service_name || fetchSvc.name, price: Number(fetchSvc.price || fetchSvc.base_price || 0) };
        // Fallback to mock
        return MOCK_MEDICAL_SERVICES.find(s => s.id === selectedService);
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <PatientNavbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
                    <p className="text-gray-500 text-sm">{t("subtitle")}</p>
                </div>

                {/* Steps */}
                <div className="mb-8">
                    <BookingStepIndicator currentStep={step} steps={STEPS} />
                </div>

                {/* Step content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

                    {/* ========== STEP 1 ========== */}
                    {step === 1 && (
                        <div className="space-y-6">
                            
                            {/* Facility Selection */}
                            {facilities.length > 0 && (
                                <div className="p-4 bg-[#3C81C6]/[0.02] rounded-xl border border-[#3C81C6]/10 mb-6">
                                    <h2 className="text-sm font-bold text-[#3C81C6] flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>domain</span>
                                        Cơ sở khám bệnh
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {facilities.map(fac => (
                                            <button key={fac.id} onClick={() => { setSelectedFacility(fac.id); setSelectedDoctor(""); setSelectedDoctorObj(null); }}
                                                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                                                ${selectedFacility === fac.id ? "border-[#3C81C6] bg-white shadow-sm ring-1 ring-[#3C81C6]/20" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                                                <div className={`mt-0.5 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedFacility === fac.id ? "bg-[#3C81C6]/10 text-[#3C81C6]" : "bg-gray-100 text-gray-500"}`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>location_on</span>
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${selectedFacility === fac.id ? "text-[#3C81C6]" : "text-gray-900"}`}>{fac.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{fac.address}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Branch Selection */}
                            {selectedFacility && branches.length > 0 && (
                                <div className="p-4 bg-[#3C81C6]/[0.02] rounded-xl border border-[#3C81C6]/10 mb-6">
                                    <h2 className="text-sm font-bold text-[#3C81C6] flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>storefront</span>
                                        Chi nhánh
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {branches.map(br => (
                                            <button key={br.id} onClick={() => { setSelectedBranch(br.id); setSelectedDoctor(""); setSelectedDoctorObj(null); setSelectedSpecialty(""); setSelectedService(""); setAvailableSlots([]); }}
                                                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all
                                                ${selectedBranch === br.id ? "border-[#3C81C6] bg-white shadow-sm ring-1 ring-[#3C81C6]/20" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                                                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedBranch === br.id ? "bg-[#3C81C6]/10 text-[#3C81C6]" : "bg-gray-100 text-gray-500"}`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>apartment</span>
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${selectedBranch === br.id ? "text-[#3C81C6]" : "text-gray-900"}`}>{br.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{br.address || "Chi tiết đang cập nhật"}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>category</span>
                                Chọn hình thức khám
                            </h2>

                            {/* Booking type — 3 options */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { type: "specialty" as const, icon: "medical_services", label: "Theo chuyên khoa", desc: "Chọn chuyên khoa trước, rồi lọc bác sĩ" },
                                    { type: "doctor" as const, icon: "person_search", label: "Theo bác sĩ", desc: "Chọn trực tiếp bác sĩ bạn muốn" },
                                    { type: "service" as const, icon: "health_and_safety", label: "Theo dịch vụ", desc: "Chọn dịch vụ, hệ thống gợi ý phù hợp" },
                                ].map(opt => (
                                    <button key={opt.type} onClick={() => { 
                                        setBookingType(opt.type); 
                                        setSelectedService(""); 
                                        setSelectedSpecialty(""); 
                                        setSelectedDoctor(""); 
                                        setSelectedDoctorObj(null);
                                        // Clear query parameters to avoid sticky initialization
                                        const params = new URLSearchParams(searchParams.toString());
                                        params.delete("doctorId");
                                        params.delete("doctorName");
                                        params.delete("specialtyId");
                                        params.delete("serviceId");
                                        try {
                                            router.replace(`?${params.toString()}`, { scroll: false });
                                        } catch (e) {}
                                    }}
                                        className={`text-left p-4 rounded-xl border-2 transition-all
                                        ${bookingType === opt.type ? "border-[#3C81C6] bg-[#3C81C6]/[0.04] shadow-sm" : "border-gray-100 hover:border-gray-200"}`}>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bookingType === opt.type ? "bg-[#3C81C6] text-white" : "bg-gray-100 text-gray-500"}`}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>{opt.icon}</span>
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">{opt.label}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 ml-[52px]">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Consultation type */}
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Hình thức khám</label>
                                <div className="flex gap-3">
                                    {[
                                        { t: "in-person" as const, icon: "person", label: "Trực tiếp tại viện" },
                                        { t: "online" as const, icon: "videocam", label: "Tư vấn online" },
                                    ].map(c => (
                                        <button key={c.t} onClick={() => setConsultType(c.t)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all
                                            ${consultType === c.t ? "border-[#3C81C6] bg-[#3C81C6]/[0.04] text-[#3C81C6]" : "border-gray-100 text-gray-600 hover:border-gray-200"}`}>
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{c.icon}</span>
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ===== BY SPECIALTY ===== */}
                            {bookingType === "specialty" && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Chọn chuyên khoa</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {specialties.map(s => (
                                                <button key={s.id} onClick={() => { setSelectedSpecialty(s.id); setSelectedDoctor(""); setSelectedDoctorObj(null); setSelectedService(""); }}
                                                    className={`group flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center
                                                    ${selectedSpecialty === s.id ? "border-[#3C81C6] bg-gradient-to-b from-white to-[#3C81C6]/10 shadow-sm" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"}`}>
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${selectedSpecialty === s.id ? "bg-[#3C81C6] text-white" : "bg-gray-50 text-[#3C81C6]"}`}>
                                                        {s.logo_url ? (
                                                            <img src={s.logo_url} alt={s.name} className="w-8 h-8 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                                                        ) : (
                                                            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>stethoscope</span>
                                                        )}
                                                    </div>
                                                    <p className={`text-sm font-medium ${selectedSpecialty === s.id ? "text-gray-900" : "text-gray-600"}`}>{s.name}</p>
                                                    {selectedSpecialty === s.id && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#3C81C6] flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-white" style={{ fontSize: "14px", fontVariationSettings: "'wght' 600" }}>check</span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Optional: filter doctor */}
                                    {selectedSpecialty && doctors.length > 0 && (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "16px" }}>person_search</span>
                                                Chọn bác sĩ khám <span className="text-xs text-gray-400 font-normal">(tùy chọn)</span>
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {doctors.map(doc => (
                                                    <button key={doc.id} onClick={() => { setSelectedDoctor(doc.id); setSelectedDoctorObj(doc); }}
                                                        className={`text-left flex items-center gap-3 p-3 rounded-xl border transition-all
                                                        ${selectedDoctor === doc.id ? "border-[#3C81C6] bg-[#3C81C6]/[0.02] shadow-sm ring-1 ring-[#3C81C6]/30" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                                                        <img src={doc.avatar ? getImageUrl(doc.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.fullName)}&background=3C81C6&color=fff`} 
                                                            alt={doc.fullName} 
                                                            className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-100" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-sm font-bold truncate ${selectedDoctor === doc.id ? "text-[#3C81C6]" : "text-gray-900"}`}>{doc.fullName}</p>
                                                            <p className="text-xs text-gray-500 truncate">{doc.specialization}</p>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <span className="material-symbols-outlined text-amber-400" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>star</span>
                                                                <span className="text-xs font-bold text-gray-700">{doc.rating || '5.0'}</span>
                                                                <span className="text-[10px] text-gray-400 ml-1">({(doc as any).experience_years || 5} năm kinh nghiệm)</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Real Services from API */}
                                    {selectedSpecialty && (
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                            <label className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>vaccines</span>
                                                Chọn dịch vụ thực hiện <span className="text-xs text-gray-500 font-normal">(tùy chọn)</span>
                                            </label>
                                            
                                            {/* Category filter */}
                                            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                                                {[
                                                    { key: "all", label: "Tất cả", icon: "apps" },
                                                    { key: "KHAM", label: "Khám bệnh", icon: "stethoscope" },
                                                    { key: "XN", label: "Xét nghiệm", icon: "biotech" },
                                                    { key: "CDHA", label: "Chẩn đoán HA", icon: "image_search" },
                                                    { key: "THUTHUAT", label: "Thủ thuật", icon: "healing" },
                                                    { key: "PHAUTHU", label: "Phẫu thuật", icon: "local_hospital" },
                                                    { key: "SANKHOA", label: "Sản khoa", icon: "pregnant_woman" },
                                                    { key: "PHCN", label: "Phục hồi CN", icon: "assist_walker" },
                                                ].map(cat => (
                                                    <button key={cat.key} onClick={() => setServiceFilter(cat.key)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${serviceFilter === cat.key
                                                            ? "bg-[#3C81C6] text-white shadow-sm"
                                                            : "bg-gray-50 text-gray-500 border border-gray-100 hover:border-[#3C81C6] hover:text-[#3C81C6]"}`}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{cat.icon}</span>
                                                        {cat.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {isFetchingServices ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                                                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: "16px" }}>progress_activity</span>
                                                    Đang tải danh sách dịch vụ...
                                                </div>
                                            ) : fetchedServices.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {filteredServices.map((svc, idx) => {
                                                        const svcId = svc.service_id || svc.id || svc.services_id || `svc-${idx}`;
                                                        return (
                                                        <button key={svcId} onClick={() => setSelectedService(svcId === selectedService ? "" : svcId)}
                                                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${selectedService === svcId ? "border-[#3C81C6] bg-[#3C81C6] text-white shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:border-[#3C81C6]/50"}`}>
                                                            {svc.service_name || svc.name} — {Number(svc.price ?? svc.base_price ?? 0).toLocaleString("vi-VN")}đ
                                                        </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500 py-1">Không có dịch vụ liên quan do cơ sở/bác sĩ này cung cấp.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ===== BY DOCTOR ===== */}
                            {bookingType === "doctor" && (
                                <div className="space-y-4">
                                    {selectedDoctorObj ? (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-2 block">Bác sĩ đã chọn</label>
                                            <DoctorCard id={selectedDoctorObj.id} fullName={selectedDoctorObj.fullName} department={selectedDoctorObj.departmentName}
                                                rating={selectedDoctorObj.rating} avatar={selectedDoctorObj.avatar} compact />
                                            <button onClick={() => { 
                                                setSelectedDoctor(""); 
                                                setSelectedDoctorObj(null); 
                                                const params = new URLSearchParams(searchParams.toString());
                                                params.delete("doctorId");
                                                params.delete("doctorName");
                                                try { router.replace(`?${params.toString()}`, { scroll: false }); } catch(e){}
                                            }}
                                                className="mt-2 text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span> Đổi bác sĩ
                                            </button>
                                            {/* Doctor's services */}
                                            {fetchedServices.length > 0 && (
                                                <div className="mt-5 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                                    <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "18px" }}>health_and_safety</span>
                                                        Dịch vụ bác sĩ hỗ trợ <span className="text-xs text-gray-500 font-normal">(tùy chọn)</span>
                                                    </label>
                                                    
                                                    {/* Category filter */}
                                                    <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                                                        {[
                                                            { key: "all", label: "Tất cả", icon: "apps" },
                                                            { key: "KHAM", label: "Khám bệnh", icon: "stethoscope" },
                                                            { key: "XN", label: "Xét nghiệm", icon: "biotech" },
                                                            { key: "CDHA", label: "Chẩn đoán HA", icon: "image_search" },
                                                            { key: "THUTHUAT", label: "Thủ thuật", icon: "healing" },
                                                            { key: "PHAUTHU", label: "Phẫu thuật", icon: "local_hospital" },
                                                            { key: "SANKHOA", label: "Sản khoa", icon: "pregnant_woman" },
                                                            { key: "PHCN", label: "Phục hồi CN", icon: "assist_walker" },
                                                        ].map(cat => (
                                                            <button key={cat.key} onClick={() => setServiceFilter(cat.key)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${serviceFilter === cat.key
                                                                    ? "bg-[#3C81C6] text-white shadow-sm"
                                                                    : "bg-gray-50 text-gray-500 border border-gray-100 hover:border-[#3C81C6] hover:text-[#3C81C6]"}`}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{cat.icon}</span>
                                                                {cat.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {filteredServices.map((svc, idx) => {
                                                            const svcId = svc.service_id || svc.id || svc.services_id || `svc-${idx}`;
                                                            return (
                                                            <button key={svcId} onClick={() => setSelectedService(svcId === selectedService ? "" : svcId)}
                                                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${selectedService === svcId ? "border-[#3C81C6] bg-[#3C81C6] text-white shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:border-[#3C81C6]/50"}`}>
                                                                {svc.service_name || svc.name} — {Number(svc.price ?? svc.base_price ?? 0).toLocaleString("vi-VN")}đ
                                                            </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 text-sm mb-3">Chưa chọn bác sĩ</p>
                                            <Link href="/doctors" className="px-4 py-2 text-sm font-medium text-[#3C81C6] bg-[#3C81C6]/10 rounded-xl hover:bg-[#3C81C6]/20 transition-colors">
                                                Tìm bác sĩ →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ===== BY SERVICE ===== */}
                            {bookingType === "service" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Chọn dịch vụ y tế</label>
                                        {/* Category filter */}
                                        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                                            {[
                                                { key: "all", label: "Tất cả", icon: "apps" },
                                                { key: "KHAM", label: "Khám bệnh", icon: "stethoscope" },
                                                { key: "XN", label: "Xét nghiệm", icon: "biotech" },
                                                { key: "CDHA", label: "Chẩn đoán HA", icon: "image_search" },
                                                { key: "THUTHUAT", label: "Thủ thuật", icon: "healing" },
                                                { key: "PHAUTHU", label: "Phẫu thuật", icon: "local_hospital" },
                                                { key: "SANKHOA", label: "Sản khoa", icon: "pregnant_woman" },
                                                { key: "PHCN", label: "Phục hồi CN", icon: "assist_walker" },
                                            ].map(cat => (
                                                <button key={cat.key} onClick={() => setServiceFilter(cat.key)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${serviceFilter === cat.key
                                                        ? "bg-[#3C81C6] text-white shadow-sm"
                                                        : "bg-gray-50 text-gray-500 border border-gray-100 hover:border-[#3C81C6] hover:text-[#3C81C6]"}`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{cat.icon}</span>
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Service grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredServices.map((svc, idx) => {
                                                const svcId = svc.service_id || svc.id || svc.services_id || `svc-${idx}`;
                                                return (
                                                <button key={svcId} onClick={() => handleServiceSelect(svcId)}
                                                    className={`relative group flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center
                                                    ${selectedService === svcId ? "border-[#3C81C6] bg-gradient-to-b from-white to-[#3C81C6]/10 shadow-sm ring-1 ring-[#3C81C6]/20" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"}`}>
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${selectedService === svcId ? "bg-[#3C81C6] text-white" : "bg-gray-50 text-[#3C81C6] group-hover:bg-[#3C81C6]/10"}`}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{svc.icon || 'health_and_safety'}</span>
                                                    </div>
                                                    <p className={`text-[13px] font-semibold leading-snug line-clamp-2 ${selectedService === svcId ? "text-[#3C81C6]" : "text-gray-700"}`}>
                                                        {svc.service_name || svc.name}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-[#3C81C6] mt-1.5">
                                                        {Number(svc.price ?? svc.base_price ?? 0).toLocaleString("vi-VN")}đ
                                                    </p>
                                                    {selectedService === svcId && (
                                                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#3C81C6] flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-white" style={{ fontSize: "12px", fontVariationSettings: "'wght' 600" }}>check</span>
                                                        </div>
                                                    )}
                                                </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Suggested specialties after service selected */}
                                    {selectedService && suggestedSpecialties.length !== 1 && (
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "16px" }}>lightbulb</span>
                                                {suggestedSpecialties.length > 1 ? "Chọn chuyên khoa phù hợp" : "Vui lòng chọn một chuyên khoa để tiếp tục"}
                                            </label>
                                            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                {(suggestedSpecialties.length > 0 ? suggestedSpecialties : specialties).map(sp => (
                                                    <button key={sp.id} onClick={() => setSelectedSpecialty(sp.id)}
                                                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${selectedSpecialty === sp.id ? "border-[#3C81C6] bg-[#3C81C6]/10 text-[#3C81C6]" : "border-gray-100 text-gray-600 hover:border-gray-200"}`}>
                                                        {sp.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedService && suggestedSpecialties.length === 1 && (
                                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                                            <span className="material-symbols-outlined text-green-600" style={{ fontSize: "18px" }}>check_circle</span>
                                            <span className="text-sm text-green-700">Chuyên khoa: <strong>{suggestedSpecialties[0]?.name}</strong></span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== STEP 2 ========== */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>calendar_month</span>
                                Chọn ngày giờ khám
                            </h2>
                            <TimeSlotPicker
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                                selectedTime={selectedTime}
                                onTimeChange={setSelectedTime}
                                selectedSlotId={selectedSlotId}
                                onSlotIdChange={setSelectedSlotId}
                                slots={selectedDate ? availableSlots : undefined}
                                loading={isFetchingSlots}
                            />
                            {/* Fix #4: Show facility closed message */}
                            {facilityClosedMessage && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-700">
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>event_busy</span>
                                    <span className="text-sm font-medium">{facilityClosedMessage}</span>
                                </div>
                            )}
                            {selectedDate && !validateAppointmentDate(selectedDate).valid && (
                                <p className="text-sm text-red-500 mt-2 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>error</span>
                                    {validateAppointmentDate(selectedDate).message}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ========== STEP 3 ========== */}
                    {step === 3 && (
                        <div className="space-y-6">
                            {!isAuthenticated ? (
                                <div className="text-center py-10 space-y-4">
                                    <div className="w-16 h-16 bg-blue-50 text-[#3C81C6] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>lock</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Vui lòng đăng nhập</h2>
                                    <p className="text-sm text-gray-500 max-w-sm mx-auto">Bạn cần đăng nhập để điền thông tin bệnh nhân và hoàn tất đặt lịch khám.</p>
                                    <div className="pt-4 flex justify-center">
                                        <Link href={`/login`} className="inline-flex items-center gap-2 px-6 py-3 bg-[#3C81C6] text-white font-medium rounded-xl hover:bg-[#3C81C6]/90 transition-colors">
                                            Đăng nhập ngay
                                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>login</span>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>person</span>
                                        Thông tin bệnh nhân
                                    </h2>

                                    {/* Patient profile selector */}
                                    {patientProfiles.length > 0 ? (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "16px" }}>family_restroom</span>
                                                    Chọn hồ sơ bệnh nhân
                                                </label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                                    {patientProfiles.map(profile => (
                                                        <button key={profile.id} onClick={() => applyProfile(profile.id)}
                                                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedProfileId === profile.id
                                                                ? "border-[#3C81C6] bg-[#3C81C6]/[0.04]"
                                                                : "border-gray-100 hover:border-gray-200"}`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${selectedProfileId === profile.id ? "bg-[#3C81C6]" : "bg-gray-300"}`}>
                                                                    {profile.fullName.charAt(0)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-gray-900 truncate">{profile.fullName}</p>
                                                                    <p className="text-[10px] text-gray-500">{profile.relationshipLabel}</p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    <Link href="/patient/profile"
                                                        className="p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#3C81C6] flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#3C81C6] transition-colors">
                                                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
                                                        <span className="text-[10px] font-medium">Thêm mới</span>
                                                    </Link>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <FormField label="Họ và tên *" icon="person" value={form.fullName} onChange={v => updateForm("fullName", v)} placeholder="Nguyễn Văn A" />
                                                    {form.fullName && !validateName(form.fullName).valid && <p className="text-xs text-red-500 mt-1">{validateName(form.fullName).message}</p>}
                                                </div>
                                                <div>
                                                    <FormField label="Số điện thoại *" icon="call" value={form.phone} onChange={v => updateForm("phone", v)} placeholder="0901 234 567" type="tel" />
                                                    {form.phone && !validatePhone(form.phone).valid && <p className="text-xs text-red-500 mt-1">{validatePhone(form.phone).message}</p>}
                                                </div>
                                                <FormField label="Ngày sinh" icon="cake" value={form.dob} onChange={v => updateForm("dob", v)} type="date" />
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Giới tính *</label>
                                                    <div className="flex gap-2">
                                                        {[{ v: "male", l: "Nam" }, { v: "female", l: "Nữ" }, { v: "other", l: "Khác" }].map(g => (
                                                            <button key={g.v} onClick={() => updateForm("gender", g.v)}
                                                                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all
                                                                ${form.gender === g.v ? "border-[#3C81C6] bg-[#3C81C6]/[0.06] text-[#3C81C6]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                                                {g.l}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <FormField label="CCCD" icon="badge" value={form.idNumber} onChange={v => updateForm("idNumber", v)} placeholder="001234567890" />
                                                <FormField label="Số BHYT" icon="health_and_safety" value={form.insuranceNumber} onChange={v => updateForm("insuranceNumber", v)} placeholder="HS4010..." />
                                            </div>

                                            <FormField label="Địa chỉ" icon="location_on" value={form.address} onChange={v => updateForm("address", v)} placeholder="Số nhà, đường, quận, TP" full />

                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Triệu chứng / Lý do khám</label>
                                                <textarea value={form.symptoms} onChange={e => updateForm("symptoms", e.target.value)}
                                                    placeholder="Mô tả triệu chứng hoặc lý do bạn muốn khám..."
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 bg-gray-50 min-h-[100px] resize-none" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-5 bg-orange-50 text-orange-800 rounded-2xl border border-orange-100 flex items-start flex-col gap-3">
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>warning</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base mt-2">Chưa có hồ sơ bệnh nhân</p>
                                                    <p className="text-sm mt-2 font-medium">Tài khoản này chưa có hồ sơ bệnh nhân. Bạn cần tạo ít nhất một hồ sơ bệnh nhân để có thể đặt lịch khám.</p>
                                                    <Link href="/patient/profile" className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-white border-2 border-orange-200 text-orange-700 font-bold text-sm rounded-xl hover:bg-orange-100 transition-colors">
                                                        Tạo hồ sơ ngay
                                                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_forward</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ========== STEP 4 ========== */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3C81C6]" style={{ fontSize: "22px" }}>fact_check</span>
                                Xác nhận lịch hẹn
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SummaryItem icon="medical_services" label="Chuyên khoa" value={specialties.find(s => s.id === selectedSpecialty)?.name || selectedDoctorObj?.departmentName || "—"} />
                                <SummaryItem icon="person" label="Bác sĩ" value={selectedDoctorObj?.fullName || "Hệ thống sẽ phân bổ"} />
                                {selectedService && <SummaryItem icon="health_and_safety" label="Dịch vụ" value={getSelectedServiceObj()?.name || "—"} />}
                                <SummaryItem icon="calendar_today" label="Ngày khám" value={selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—"} />
                                <SummaryItem icon="schedule" label="Giờ khám" value={selectedTime || "—"} />
                                <SummaryItem icon="location_on" label="Địa điểm" value={consultType === "online" ? "Tư vấn online (Video call)" : (() => {
                                    const branch = branches.find(b => b.branch_id === selectedBranch || b.id === selectedBranch);
                                    return branch ? `${branch.name || branch.branch_name} — ${branch.address}` : "EHealth Hospital — 123 Nguyễn Văn Linh, Q.7";
                                })()} />
                                <SummaryItem icon="payments" label="Phí khám (dự kiến)" value={(() => {
                                    const s = getSelectedServiceObj();
                                    if (!s) return "400.000 — 500.000đ";
                                    return s.priceRange || `${Number(s.price ?? s.base_price ?? 0).toLocaleString("vi-VN")}đ`;
                                })()} />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Thông tin bệnh nhân</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-gray-400">Họ tên:</span> <span className="font-medium text-gray-700">{form.fullName}</span></div>
                                    <div><span className="text-gray-400">SĐT:</span> <span className="font-medium text-gray-700">{form.phone}</span></div>
                                    {form.dob && <div><span className="text-gray-400">Ngày sinh:</span> <span className="font-medium text-gray-700">{new Date(form.dob + "T00:00:00").toLocaleDateString("vi-VN")}</span></div>}
                                    {form.insuranceNumber && <div><span className="text-gray-400">BHYT:</span> <span className="font-medium text-gray-700">{form.insuranceNumber}</span></div>}
                                    {form.symptoms && <div className="col-span-2"><span className="text-gray-400">Triệu chứng:</span> <span className="text-gray-700">{form.symptoms}</span></div>}
                                </div>
                            </div>

                            {/* Policy */}
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>info</span>
                                    Chính sách lịch hẹn
                                </h4>
                                <ul className="text-xs text-amber-700 space-y-1">
                                    <li>• Đến sớm 15 phút trước giờ hẹn để hoàn tất thủ tục</li>
                                    <li>• Hủy lịch trước 2 giờ để tránh mất phí</li>
                                    <li>• Mang theo CCCD/CMND và thẻ BHYT (nếu có)</li>
                                </ul>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} className="sr-only peer" />
                                <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:bg-[#3C81C6] peer-checked:border-[#3C81C6] flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
                                    {agreedTerms && <span className="material-symbols-outlined text-white" style={{ fontSize: "16px" }}>check</span>}
                                </div>
                                <span className="text-sm text-gray-600">Tôi đã đọc và đồng ý với <a href="#" className="text-[#3C81C6] font-medium hover:underline">chính sách bảo mật</a> và <a href="#" className="text-[#3C81C6] font-medium hover:underline">điều khoản sử dụng</a></span>
                            </label>
                        </div>
                    )}

                    {/* ========== STEP 5 — Success ========== */}
                    {step === 5 && (
                        <div className="text-center py-8 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-500/25 animate-bounce">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: "40px" }}>check_circle</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Đặt lịch thành công!</h2>
                                <p className="text-gray-500">Lịch hẹn của bạn đã được ghi nhận. Chúng tôi sẽ xác nhận qua SMS trong vòng 30 phút.</p>
                            </div>

                            {qrToken ? (
                                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Mã QR Check-in Tự Động</p>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrToken}`} alt="QR Code" className="w-48 h-48" />
                                    <p className="text-xs text-gray-500 mt-2 text-center">Vui lòng quét QR này tại Kiosk hoặc Quầy Lễ Tân khi đến khám.</p>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm text-gray-500">Mã lịch hẹn:</span>
                                    <span className="text-lg font-bold text-[#3C81C6]">{bookingCode}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-3 flex-wrap">
                                <Link href={consultType === 'online' ? "/patient/telemedicine" : "/patient/appointments"}
                                    className="px-5 py-3 bg-[#3C81C6] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.97]">
                                    Xem lịch hẹn của tôi
                                </Link>
                                <button onClick={() => { setStep(1); setSelectedDate(""); setSelectedTime(""); setForm(emptyForm); setAgreedTerms(false); }}
                                    className="px-5 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                    Đặt lịch khác
                                </button>
                            </div>

                            <div className="max-w-md mx-auto text-left p-5 bg-blue-50 border border-blue-100 rounded-xl">
                                <h4 className="text-sm font-bold text-blue-900 mb-2">📋 Hướng dẫn trước khi đến khám</h4>
                                <ul className="text-xs text-blue-700 space-y-1.5">
                                    <li>• Mang theo CCCD/CMND bản gốc</li>
                                    <li>• Mang theo thẻ BHYT (nếu có)</li>
                                    <li>• Nhịn ăn 8 tiếng nếu có xét nghiệm máu</li>
                                    <li>• Đến trước giờ hẹn 15 phút</li>
                                    <li>• Mang theo kết quả khám trước đó (nếu có)</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    {step < 5 && (
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                            <button type="button" onClick={prevStep} disabled={step === 1}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5">
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                                Quay lại
                            </button>

                            {step < 4 ? (
                                <button type="button" onClick={nextStep}
                                    disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2) || (step === 3 && !canProceedStep3)}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#3C81C6] to-[#2563eb] rounded-xl shadow-md shadow-[#3C81C6]/20 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center gap-1.5">
                                    Tiếp tục
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
                                </button>
                            ) : (
                                <button type="button" onClick={handleSubmit} disabled={!canProceedStep4 || submitting}
                                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-md shadow-green-500/20 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center gap-1.5">
                                    {submitting ? (
                                        <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Đang xử lý...</>
                                    ) : (
                                        <>Xác nhận đặt lịch <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check</span></>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <PatientFooter />

            {payingData && (
                <PreBookingPaymentModal
                    appointmentId={payingData.appointmentId}
                    invoiceId={payingData.invoiceId}
                    qrData={payingData.qrData}
                    amount={payingData.amount}
                    onPaid={() => {
                        const bookingId = payingData.appointmentId || `EH-${Date.now().toString(36).toUpperCase()}`;
                        setBookingCode(bookingId);
                        setStep(5);
                        setPayingData(null);
                        setSubmitting(false);
                    }}
                    onClose={() => {
                        // Người dùng đóng modal khi chưa thanh toán → lịch vẫn PENDING, có thể thanh toán tiếp ở /patient/appointments.
                        const bookingId = payingData.appointmentId;
                        setBookingCode(bookingId);
                        setPayingData(null);
                        setSubmitting(false);
                        setStep(5);
                    }}
                />
            )}
        </div>
    );
}

// ——— Helper components ———

function FormField({ label, icon, value, onChange, placeholder, type = "text", full = false }: {
    label: string; icon: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; full?: boolean;
}) {
    return (
        <div className={full ? "col-span-full" : ""}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
            <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400" style={{ fontSize: "18px" }}>{icon}</span>
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C81C6]/30 focus:border-[#3C81C6]/30 bg-gray-50 placeholder-gray-400" />
            </div>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin" /></div>}>
            <BookingPageInner />
        </Suspense>
    );
}

function SummaryItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <span className="material-symbols-outlined text-[#3C81C6] mt-0.5" style={{ fontSize: "18px" }}>{icon}</span>
            <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
