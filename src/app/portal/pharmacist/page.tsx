import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/**
 * Pharmacist portal landing — redirect thẳng về Hàng đợi đơn thuốc.
 * Theo nghiệp vụ PMIS chuẩn: dược sĩ vào ca làm việc đi thẳng vào nơi
 * đang có đơn chờ cấp phát (status=PENDING), không qua dashboard KPI.
 */
export default function PharmacistPortalLanding() {
    redirect(`${ROUTES.PORTAL.PHARMACIST.PRESCRIPTIONS}?status=PENDING`);
}
