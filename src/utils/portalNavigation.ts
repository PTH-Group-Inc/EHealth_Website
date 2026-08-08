/**
 * Utility giúp chuyển hướng URL Portal mượt mà giữa Portal độc lập và Admin Panel.
 * 
 * - Nếu đang ở `/admin/...`, đường dẫn `/portal/doctor/...` sẽ tự động chuyển sang `/admin/portal-views/doctor/...`
 * - Nếu đang ở `/portal/...`, đường dẫn giữ nguyên `/portal/doctor/...`
 */

export function getPortalPath(targetPath: string, currentPathname: string): string {
    if (!targetPath) return targetPath;
    if (currentPathname && currentPathname.startsWith('/admin')) {
        if (targetPath.startsWith('/portal/doctor')) {
            return targetPath.replace('/portal/doctor', '/admin/portal-views/doctor');
        }
        if (targetPath.startsWith('/portal/receptionist')) {
            return targetPath.replace('/portal/receptionist', '/admin/portal-views/receptionist');
        }
        if (targetPath.startsWith('/portal/pharmacist')) {
            return targetPath.replace('/portal/pharmacist', '/admin/portal-views/pharmacist');
        }
    }
    return targetPath;
}
