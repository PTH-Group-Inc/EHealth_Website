import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function HomePage() {
    // Redirect root to admin dashboard
    redirect(ROUTES.ADMIN.DASHBOARD);
}
