import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

/**
 * Doctor portal landing — redirect thẳng về Hàng đợi.
 * Theo nghiệp vụ chuẩn HIS/EMR: BS đăng nhập xong đi thẳng vào nơi
 * đang có bệnh nhân chờ khám, không qua dashboard trung gian.
 */
export default function DoctorPortalLanding() {
    redirect(ROUTES.PORTAL.DOCTOR.QUEUE);
}
