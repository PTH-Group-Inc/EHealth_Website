import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function AdminPharmacistDashboardPage() {
    redirect(`${ROUTES.ADMIN.PORTAL_VIEWS.PHARMACIST.PRESCRIPTIONS}?status=PENDING`);
}
