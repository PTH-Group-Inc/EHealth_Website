import { redirect } from "next/navigation";

export default function StockOutRedirect() {
    redirect("/portal/pharmacist/inventory?tab=out");
}
