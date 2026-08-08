import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function AdminPharmacistAlertsPage() {
    redirect(`${ROUTES.ADMIN.PORTAL_VIEWS.PHARMACIST.INVENTORY}?tab=alerts`);
}
