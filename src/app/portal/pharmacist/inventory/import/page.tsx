import { redirect } from "next/navigation";

export default function StockInRedirect() {
    redirect("/portal/pharmacist/inventory?tab=in");
}
