"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Doctor detail page redirect
 * 
 * This page redirects to the merged staff detail page
 * as doctor and staff management has been consolidated
 * into a single unified page: /admin/users/staff/[id]
 */
export default function DoctorDetailPage() {
    const router = useRouter();
    const params = useParams();
    const doctorId = params.id as string;

    useEffect(() => {
        // Redirect to the new merged staff page
        if (doctorId) {
            router.replace(`/admin/users/staff/${doctorId}`);
        }
    }, [doctorId, router]);

    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#3C81C6]/20 border-t-[#3C81C6] rounded-full animate-spin mb-4" />
            <p className="text-sm text-[#687582]">Đang chuyển hướng...</p>
        </div>
    );
}
