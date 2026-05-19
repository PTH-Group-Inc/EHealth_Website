import { redirect } from "next/navigation";

export default function AlertsRedirect() {
    redirect("/portal/pharmacist/inventory?tab=alerts");
}
