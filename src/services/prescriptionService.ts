import axiosClient from '@/api/axiosClient';
import { PRESCRIPTION_ENDPOINTS, PATIENT_ENDPOINTS, PHARMACY_ENDPOINTS } from '@/api/endpoints';

export const prescriptionService = {
    // GET /api/prescriptions/search — danh sách đơn thuốc (dược sĩ dùng)
    search: (params?: { status?: string; limit?: number; page?: number; patientId?: string; doctorId?: string }) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.SEARCH, { params }).then(r => r.data),

    // GET /api/prescriptions/by-doctor/{doctorId}
    getByDoctor: (doctorId: string) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.BY_DOCTOR(doctorId)).then(r => r.data),

    // GET /api/prescriptions/{encounterId}
    getByEncounter: (encounterId: string) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.BY_ENCOUNTER(encounterId)).then(r => r.data?.data ?? r.data),

    getByPatient: (patientId: string, params?: Record<string, any>) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.BY_PATIENT(patientId), { params }).then(r => r.data),

    getDetail: (id: string) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.DETAIL(id)).then(r => r.data?.data ?? r.data),

    getDetails: (id: string) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.DETAILS(id)).then(r => r.data?.data ?? r.data),

    // POST /api/prescriptions/{encounterId} — tạo đơn thuốc cho encounter
    create: (data: Record<string, any>) => {
        const encounterId = data.encounterId;
        if (encounterId) {
            return axiosClient.post(PRESCRIPTION_ENDPOINTS.BY_ENCOUNTER(encounterId), data).then(r => r.data?.data ?? r.data);
        }
        // Fallback
        return axiosClient.post(PRESCRIPTION_ENDPOINTS.CREATE, data).then(r => r.data?.data ?? r.data);
    },

    // POST /api/prescriptions/{prescriptionId}/details — thêm dòng thuốc
    addDetail: (prescriptionId: string, data: Record<string, any>) =>
        axiosClient.post(PRESCRIPTION_ENDPOINTS.DETAILS(prescriptionId), data).then(r => r.data?.data ?? r.data),

    update: (id: string, data: Record<string, any>) =>
        axiosClient.patch(PRESCRIPTION_ENDPOINTS.UPDATE(id), data).then(r => r.data),

    dispense: (id: string, data: Record<string, any>) =>
        axiosClient.post(PRESCRIPTION_ENDPOINTS.DISPENSE(id), data).then(r => r.data),

    // GET /api/pharmacy/drugs/active — tìm thuốc active (cho dropdown)
    searchDrugsActive: (q: string) =>
        axiosClient.get(PHARMACY_ENDPOINTS.DRUGS_ACTIVE, { params: { search: q, limit: 20 } })
            .then(r => {
                const items = r.data?.data?.items ?? r.data?.data ?? r.data ?? [];
                return Array.isArray(items) ? items : [];
            }),

    // Backward-compat alias
    getList: (params?: Record<string, any>) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.SEARCH, { params }).then(r => r.data),

    // PATCH status — chuyển trạng thái đơn thuốc (pending → checking → dispensed)
    // Dùng CONFIRM endpoint hoặc update tùy API
    updateStatus: (id: string, status: 'checking' | 'dispensed' | 'cancelled', note?: string) => {
        if (status === 'dispensed') {
            return axiosClient.patch(PRESCRIPTION_ENDPOINTS.CONFIRM(id), { note }).then(r => r.data);
        }
        if (status === 'cancelled') {
            return axiosClient.patch(PRESCRIPTION_ENDPOINTS.CANCEL(id), { reason: note }).then(r => r.data);
        }
        // checking — dùng update
        return axiosClient.put(PRESCRIPTION_ENDPOINTS.UPDATE(id), { status: 'CHECKING', note }).then(r => r.data);
    },

    cancel: (id: string, reason?: string) =>
        axiosClient.patch(PRESCRIPTION_ENDPOINTS.CANCEL(id), { reason }).then(r => r.data),

    confirm: (id: string) =>
        axiosClient.patch(PRESCRIPTION_ENDPOINTS.CONFIRM(id), {}).then(r => r.data),

    // Tìm kiếm bệnh nhân để kê đơn nhanh
    searchPatients: (q: string) =>
        axiosClient.get(PATIENT_ENDPOINTS.LIST, { params: { search: q, limit: 20 } })
            .then(r => {
                const items: any[] = r.data?.data?.items ?? r.data?.data ?? r.data ?? [];
                return items.map((p: any) => ({ id: p.id, name: p.fullName ?? p.name ?? '' }));
            }),

    // Tìm kiếm thuốc từ danh mục dược
    searchDrugs: (q: string) =>
        axiosClient.get(PRESCRIPTION_ENDPOINTS.SEARCH_DRUGS, { params: { q, limit: 20 } })
            .then(r => r.data?.data ?? r.data ?? []),
};
