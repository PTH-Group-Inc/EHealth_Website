"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import PatientDetail from "../PatientDetail";
import { patientProfileService, mapBEToFEProfile } from "@/services/patientProfileService";
import { patientInsuranceService } from "@/services/patientInsuranceService";
import { enrichPatientProfileInsurance } from "@/utils/patientProfileHelpers";
import type { PatientProfile } from "@/types/patient-profile";

export default function PatientProfileDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        try {
            const backendProfile = await patientProfileService.getById(id);
            const insuranceResponse = await patientInsuranceService.getByPatient(id).catch(() => ({ data: [] }));
            const mappedProfile = enrichPatientProfileInsurance(
                mapBEToFEProfile(backendProfile, user?.id),
                insuranceResponse.data || [],
            );

            setProfile(mappedProfile);
        } catch {
            showToast("Không tìm thấy hồ sơ bệnh nhân.", "error");
            router.push("/patient/patient-profiles");
        } finally {
            setLoading(false);
        }
    }, [id, router, showToast, user?.id]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gray-50 dark:bg-[#0d1117]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3C81C6] border-t-transparent"></div>
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <div className="h-full w-full">
            <PatientDetail
                profile={profile}
                onBack={() => router.push("/patient/patient-profiles")}
                onEdit={() => router.push(`/patient/patient-profiles?action=edit&id=${profile.id}`)}
                onRefresh={loadProfile}
            />
        </div>
    );
}
