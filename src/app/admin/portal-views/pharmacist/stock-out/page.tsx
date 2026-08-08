import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function AdminPharmacistStockOutPage() {
    redirect(`${ROUTES.ADMIN.PORTAL_VIEWS.PHARMACIST.INVENTORY}?tab=out`);
}
