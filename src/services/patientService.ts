
import axiosClient from '@/api/axiosClient';
import {
    PATIENT_ENDPOINTS,
    PATIENT_ENDPOINTS_EXT,
    PATIENT_CONTACT_ENDPOINTS,
    RELATION_TYPE_ENDPOINTS,
    PATIENT_DOCUMENT_ENDPOINTS,
    MEDICAL_HISTORY_ENDPOINTS,
    PRESCRIPTION_ENDPOINTS,
} from '@/api/endpoints';

export const createPatientRelation = async (
    patientId: string,
    data: {
        contact_name: string;
        relation_type_id: string;
        phone_number: string;
        address?: string;
        is_emergency_contact?: boolean;
    }
): Promise<{ success: boolean; data?: PatientRelation; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_CONTACT_ENDPOINTS.CREATE, {
            patient_id: patientId,
            relation_type_id: data.relation_type_id,
            contact_name: data.contact_name,
            phone_number: data.phone_number,
            address: data.address,
            is_emergency_contact: Boolean(data.is_emergency_contact),
        });
        return { success: true, data: normalizePatientRelation(unwrap<any>(response) || response.data) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Thêm người thân thất bại' };
    }
};

export const updatePatientRelation = async (
    relationId: string,
    data: {
        contact_name: string;
        relation_type_id: string;
        phone_number: string;
        address?: string;
        is_emergency_contact?: boolean;
    }
): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.put(PATIENT_CONTACT_ENDPOINTS.UPDATE(relationId), data);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Cập nhật người thân thất bại' };
    }
};

export const removePatientRelation = async (relationId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.delete(PATIENT_CONTACT_ENDPOINTS.DELETE(relationId));
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Xóa người thân thất bại' };
    }
};

export const getRelationTypes = async (): Promise<{ success: boolean; data?: PatientRelationType[]; message?: string }> => {
    try {
        const response = await axiosClient.get(RELATION_TYPE_ENDPOINTS.LIST);
        const data = unwrap<PatientRelationType[]>(response) || [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Không thể tải danh mục quan hệ' };
    }
};

export const setPatientRelationEmergency = async (
    relationId: string,
    isEmergencyContact: boolean
): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.patch(PATIENT_CONTACT_ENDPOINTS.SET_EMERGENCY(relationId), {
            is_emergency_contact: isEmergencyContact,
        });
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Không thể cập nhật liên hệ khẩn cấp' };
    }
};

export const setPatientRelationLegalRepresentative = async (
    relationId: string,
    isLegalRepresentative: boolean
): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.patch(PATIENT_CONTACT_ENDPOINTS.SET_LEGAL_REPRESENTATIVE(relationId), {
            is_legal_representative: isLegalRepresentative,
        });
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Không thể cập nhật đại diện pháp lý' };
    }
};

export const getPatientRelationMedicalDecisionNote = async (
    relationId: string
): Promise<{ success: boolean; data?: { medical_decision_note: string | null }; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_CONTACT_ENDPOINTS.MEDICAL_DECISION_NOTE(relationId));
        return { success: true, data: unwrap<{ medical_decision_note: string | null }>(response) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Không thể tải ghi chú quyền quyết định y tế' };
    }
};

export const updatePatientRelationMedicalDecisionNote = async (
    relationId: string,
    medicalDecisionNote: string
): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.patch(PATIENT_CONTACT_ENDPOINTS.MEDICAL_DECISION_NOTE(relationId), {
            medical_decision_note: medicalDecisionNote,
        });
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Không thể cập nhật ghi chú quyền quyết định y tế' };
    }
};

// ============================================
// Types — theo đúng schema backend
// ============================================

export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED';
export type IdentityType = 'CCCD' | 'PASSPORT' | 'OTHER';
export type RelationType = 'PARENT' | 'SPOUSE' | 'CHILD' | 'SIBLING' | 'OTHER';

export interface PatientAvatarImage {
    url: string;
    public_id: string;
    uploaded_at: string;
}

export interface PatientRelationType {
    relation_types_id: string;
    code: string;
    name: string;
    description?: string | null;
    is_active: boolean;
}

export interface Patient {
    patient_id: string;
    patient_code: string;
    full_name: string;
    date_of_birth: string;
    gender: PatientGender;
    identity_type?: IdentityType;
    identity_number?: string;
    nationality?: string;
    blood_type?: string;
    allergies?: string;
    chronic_diseases?: string;
    status: PatientStatus;
    created_at: string;
    updated_at: string;
    // Joined fields (có thể có)
    contact?: PatientContact;
    contacts?: PatientContact[];
    insurance?: PatientInsurance[];
    // Flat/alias fields từ BE (optional — team PTH dùng format này)
    id?: string;
    phone_number?: string;
    email?: string;
    id_card_number?: string;
    address?: string;
    account_id?: string;
    account_phone?: string;
    account_email?: string;
    avatar_url?: PatientAvatarImage[];
}

export interface CreatePatientRequest {
    full_name: string;
    date_of_birth: string;
    gender?: PatientGender;
    identity_type?: IdentityType;
    identity_number?: string;
    id_card_number?: string;
    nationality?: string;
    phone_number?: string;
    email?: string;
    address?: string;
    province_id?: number;
    district_id?: number;
    ward_id?: number;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    blood_type?: string;
    allergies?: string;
    chronic_diseases?: string;
}

export interface UpdatePatientRequest {
    full_name?: string;
    date_of_birth?: string;
    gender?: PatientGender;
    identity_type?: IdentityType;
    identity_number?: string;
    id_card_number?: string;
    nationality?: string;
    phone_number?: string;
    email?: string;
    address?: string;
    province_id?: number;
    district_id?: number;
    ward_id?: number;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    blood_type?: string;
    allergies?: string;
    chronic_diseases?: string;
}

export interface PatientContact {
    contact_id: string;
    patient_id: string;
    phone_number: string;
    email?: string;
    street_address?: string;
    ward?: string;
    province?: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}

export interface PatientInsurance {
    insurance_id: string;
    patient_id: string;
    insurance_number: string;
    provider?: string;
    provider_name?: string;
    expiry_date?: string;
    end_date?: string;
    issued_date?: string;
    is_active: boolean;
    created_at: string;
}

export interface PatientDocument {
    document_id: string;
    patient_id: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    file_url?: string;
    document_type?: string;
    description?: string;
    uploaded_by?: string;
    created_at: string;
}

export interface PatientRelation {
    patient_contacts_id: string;
    patient_id: string;
    relation_type_id: string;
    contact_name: string;
    phone_number: string;
    address?: string | null;
    is_emergency_contact: boolean;
    is_legal_representative: boolean;
    medical_decision_note?: string | null;
    relation_type_code?: string;
    relation_type_name?: string;
    patient_name?: string;
    patient_code?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;

    // Compatibility aliases for older callers.
    relation_id?: string;
    full_name?: string;
    relationship?: RelationType;
    is_emergency?: boolean;
    has_legal_rights?: boolean;
}

export interface MedicalRecord {
    encounter_id?: string;
    record_id?: string;
    visit_date?: string;
    created_at?: string;
    doctor_name?: string;
    department_name?: string;
    diagnosis?: string;
    chief_complaint?: string;
    status?: string;
}

export interface PatientSummary {
    age?: number;
    tag_count?: number;
    insurance_count?: number;
    medical_history_count?: number;
    allergy_count?: number;
    [key: string]: any;
}

export interface PaginationInfo {
    total_items: number;
    total_pages: number;
    current_page: number;
    limit: number;
}

export interface PatientListResponse {
    success: boolean;
    message?: string;
    data?: {
        items: Patient[];
        pagination: PaginationInfo;
    };
}

// Helper unwrap pattern
function unwrap<T>(res: any): T | undefined {
    return res?.data?.data ?? res?.data ?? res;
}

function mapRelationCodeToLegacy(code?: string, name?: string): RelationType {
    const source = `${code || ''} ${name || ''}`.toUpperCase();
    if (/(FATHER|MOTHER|PARENT|CHA|MẸ|ME)/.test(source)) return 'PARENT';
    if (/(SPOUSE|HUSBAND|WIFE|VỢ|VO|CHỒNG|CHONG)/.test(source)) return 'SPOUSE';
    if (/(CHILD|SON|DAUGHTER|CON)/.test(source)) return 'CHILD';
    if (/(SIBLING|BROTHER|SISTER|ANH|CHỊ|CHI|EM)/.test(source)) return 'SIBLING';
    return 'OTHER';
}

function normalizePatientRelation(raw: any): PatientRelation {
    const legacyRelationship = mapRelationCodeToLegacy(raw?.relation_type_code, raw?.relation_type_name);

    return {
        patient_contacts_id: raw?.patient_contacts_id || raw?.relation_id || '',
        patient_id: raw?.patient_id || '',
        relation_type_id: raw?.relation_type_id || '',
        contact_name: raw?.contact_name || raw?.full_name || '',
        phone_number: raw?.phone_number || '',
        address: raw?.address ?? null,
        is_emergency_contact: Boolean(raw?.is_emergency_contact ?? raw?.is_emergency),
        is_legal_representative: Boolean(raw?.is_legal_representative ?? raw?.has_legal_rights),
        medical_decision_note: raw?.medical_decision_note ?? null,
        relation_type_code: raw?.relation_type_code,
        relation_type_name: raw?.relation_type_name,
        patient_name: raw?.patient_name,
        patient_code: raw?.patient_code,
        created_at: raw?.created_at || '',
        updated_at: raw?.updated_at || '',
        deleted_at: raw?.deleted_at ?? null,
        relation_id: raw?.patient_contacts_id || raw?.relation_id || '',
        full_name: raw?.contact_name || raw?.full_name || '',
        relationship: legacyRelationship,
        is_emergency: Boolean(raw?.is_emergency_contact ?? raw?.is_emergency),
        has_legal_rights: Boolean(raw?.is_legal_representative ?? raw?.has_legal_rights),
    };
}

async function resolveRelationTypeId(input: {
    relation_type_id?: string;
    relationship?: RelationType;
}): Promise<string | undefined> {
    if (input.relation_type_id) return input.relation_type_id;
    if (!input.relationship) return undefined;

    const response = await axiosClient.get(RELATION_TYPE_ENDPOINTS.LIST);
    const relationTypes = unwrap<PatientRelationType[]>(response) || [];

    const matched = relationTypes.find((item) => mapRelationCodeToLegacy(item.code, item.name) === input.relationship);
    return matched?.relation_types_id;
}

// ============================================
// API Functions — Patients
// ============================================

/**
 * Lấy danh sách bệnh nhân (phân trang + tìm kiếm nâng cao)
 */
export const getPatients = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PatientStatus;
    gender?: PatientGender;
    ageFrom?: number;
    ageTo?: number;
    tag?: string;
    hasInsurance?: boolean;
    createdFrom?: string;
    createdTo?: string;
}): Promise<PatientListResponse> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS.LIST, { params });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Lấy danh sách bệnh nhân thất bại',
        };
    }
};

/**
 * Lấy chi tiết một bệnh nhân
 */
export const getPatientDetail = async (patientId: string): Promise<{ success: boolean; data?: Patient; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS.DETAIL(patientId));
        const data = unwrap<Patient>(response);
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Bệnh nhân không tồn tại',
        };
    }
};

/**
 * Tạo hồ sơ bệnh nhân mới
 */
export const createPatient = async (data: CreatePatientRequest): Promise<{ success: boolean; data?: Patient; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS.CREATE, data);
        const patient = unwrap<Patient>(response);
        return { success: true, data: patient };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Tạo hồ sơ thất bại',
        };
    }
};

/**
 * Thêm thẻ bảo hiểm cho bệnh nhân
 */
export const addPatientInsurance = async (
    patientId: string,
    data: {
        provider_id: string;
        insurance_number: string;
        start_date: string;
        end_date: string;
        is_primary?: boolean;
    }
): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
        const response = await axiosClient.post(`/api/patients/${patientId}/insurances`, data);
        return { success: true, data: response.data?.data ?? response.data };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Thêm thẻ bảo hiểm thất bại',
        };
    }
};

/**
 * Cập nhật thông tin hành chính bệnh nhân
 */
export const updatePatient = async (patientId: string, data: UpdatePatientRequest): Promise<{ success: boolean; data?: Patient; message?: string }> => {
    try {
        const response = await axiosClient.put(PATIENT_ENDPOINTS.UPDATE(patientId), data);
        const patient = unwrap<Patient>(response);
        return { success: true, data: patient };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Cập nhật thất bại',
        };
    }
};

/**
 * Cập nhật trạng thái hồ sơ bệnh nhân
 */
export const updatePatientStatus = async (
    patientId: string,
    status: PatientStatus,
    statusReason?: string
): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.patch(PATIENT_ENDPOINTS.STATUS(patientId), {
            status,
            ...(statusReason && { status_reason: statusReason }),
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Cập nhật trạng thái thất bại',
        };
    }
};

/**
 * Liên kết hồ sơ bệnh nhân
 */
export const linkPatient = async (patientCode: string, identityNumber: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS.LINK, {
            patient_code: patientCode,
            identity_number: identityNumber,
        });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Liên kết thất bại',
        };
    }
};

/**
 * Lấy danh sách hồ sơ bệnh nhân bằng account_id
 */
export const getPatientsByAccountId = async (accountId: string): Promise<{ success: boolean; data?: Patient[]; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS.BY_ACCOUNT(accountId));
        const raw = unwrap<any>(response);
        const data = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.items)
                ? raw.items
                : [];
        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Không thể lấy danh sách hồ sơ bệnh nhân',
        };
    }
};

export const getPatientSummary = async (patientId: string): Promise<{ success: boolean; data?: PatientSummary; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS_EXT.SUMMARY(patientId));
        return { success: true, data: unwrap<PatientSummary>(response) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Không thể lấy tóm tắt hồ sơ" };
    }
};

export const getEmergencyContacts = async (patientId: string): Promise<{ success: boolean; data?: any[]; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS_EXT.EMERGENCY_CONTACTS(patientId));
        return { success: true, data: unwrap<any[]>(response) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Không thể lấy liên hệ khẩn cấp" };
    }
};

export const getLegalRepresentative = async (patientId: string): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS_EXT.LEGAL_REPRESENTATIVE(patientId));
        return { success: true, data: unwrap<any>(response) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Không thể lấy người đại diện pháp lý" };
    }
};

export const getPatientAppointments = async (patientId: string): Promise<{ success: boolean; data?: any[]; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS_EXT.PATIENT_APPOINTMENTS(patientId));
        return { success: true, data: unwrap<any[]>(response) };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Không thể lấy lịch hẹn của bệnh nhân" };
    }
};

/**
 * Lấy danh sách bảo hiểm của bệnh nhân
 */
export const getPatientInsurances = async (patientId: string): Promise<{ success: boolean; data?: PatientInsurance[]; message?: string }> => {
    try {
        const response = await axiosClient.get('/api/patient-insurances', { params: { patient_id: patientId } });
        const raw = response.data;
        // Unwrap: handle { data: { items: [] } }, { data: { data: [] } }, { data: { insurances: [] } }, { data: [] }, or [] directly
        let list = raw?.data?.items ?? raw?.data?.data ?? raw?.data?.insurances ?? raw?.data ?? raw ?? [];
        if (!Array.isArray(list)) list = [];
        return { success: true, data: list as PatientInsurance[] };
    } catch (error: any) {
        return { success: false, data: [], message: error.response?.data?.message || 'Không thể tải thông tin bảo hiểm' };
    }
};

/**
 * Liên kết hồ sơ bệnh nhân với tài khoản hiện tại
 */
export const linkAccount = async (patientId: string, accountId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.patch(PATIENT_ENDPOINTS.LINK_ACCOUNT(patientId), { account_id: accountId });
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Liên kết hồ sơ thất bại',
        };
    }
};

/**
 * Hủy liên kết hồ sơ bệnh nhân khỏi tài khoản hiện tại
 */
export const unlinkAccount = async (patientId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.patch(PATIENT_ENDPOINTS.UNLINK_ACCOUNT(patientId));
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || 'Hủy liên kết hồ sơ thất bại',
        };
    }
};

// ============================================
// Contact Management
// ============================================

/**
 * Lấy danh sách liên hệ của bệnh nhân
 */
export const getContacts = async (patientId: string): Promise<{ success: boolean; data?: PatientContact[]; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS.ADD_CONTACT(patientId));
        const raw = response.data;
        const data: PatientContact[] = raw?.data?.items ?? raw?.data ?? raw ?? [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy liên hệ thất bại' };
    }
};

/**
 * Cập nhật thông tin liên hệ chính
 */
export const updateContact = async (patientId: string, data: {
    phone_number?: string;
    email?: string;
    street_address?: string;
    ward?: string;
    province?: string;
}): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.put(PATIENT_ENDPOINTS.UPDATE_CONTACT(patientId), data);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Cập nhật liên hệ thất bại' };
    }
};

/**
 * Thêm liên hệ phụ
 */
export const addContact = async (patientId: string, data: {
    phone_number: string;
    email?: string;
    street_address?: string;
    ward?: string;
    province?: string;
}): Promise<{ success: boolean; data?: PatientContact; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS.ADD_CONTACT(patientId), data);
        const raw = response.data;
        return { success: true, data: raw?.data ?? raw };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Thêm liên hệ thất bại' };
    }
};

/**
 * Cập nhật liên hệ phụ
 */
export const editContact = async (patientId: string, contactId: string, data: {
    phone_number?: string;
    email?: string;
    street_address?: string;
    ward?: string;
    province?: string;
}): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.put(PATIENT_ENDPOINTS.EDIT_CONTACT(patientId, contactId), data);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Cập nhật liên hệ thất bại' };
    }
};

/**
 * Xóa liên hệ phụ
 */
export const deleteContact = async (patientId: string, contactId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.delete(PATIENT_ENDPOINTS.DELETE_CONTACT(patientId, contactId));
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Xóa liên hệ thất bại' };
    }
};

// ============================================
// Relations Management (Người thân)
// ============================================

/**
 * Lấy danh sách người thân
 */
export const getRelations = async (patientId: string): Promise<{ success: boolean; data?: PatientRelation[]; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS_EXT.ALL_RELATIONS(patientId));
        const raw = unwrap<any[]>(response) || [];
        const data: PatientRelation[] = Array.isArray(raw) ? raw.map(normalizePatientRelation) : [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy người thân thất bại' };
    }
};

/**
 * Thêm thông tin người thân
 */
export const addRelation = async (patientId: string, data: {
    contact_name?: string;
    relation_type_id?: string;
    phone_number: string;
    address?: string;
    is_emergency_contact?: boolean;
    full_name?: string;
    relationship?: RelationType;
    is_emergency?: boolean;
    has_legal_rights?: boolean;
}): Promise<{ success: boolean; data?: PatientRelation; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS.ADD_RELATION(patientId), data);
        const raw = response.data;
        return { success: true, data: raw?.data ?? raw };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Thêm người thân thất bại' };
    }
};

/**
 * Sửa thông tin người thân
 */
export const updateRelation = async (patientId: string, relationId: string, data: {
    full_name?: string;
    relationship?: RelationType;
    phone_number?: string;
    is_emergency?: boolean;
    has_legal_rights?: boolean;
}): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.put(PATIENT_ENDPOINTS.EDIT_RELATION(patientId, relationId), data);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Cập nhật người thân thất bại' };
    }
};

/**
 * Xóa thông tin người thân
 */
export const deleteRelation = async (patientId: string, relationId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await axiosClient.delete(PATIENT_ENDPOINTS.DELETE_RELATION(patientId, relationId));
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Xóa người thân thất bại' };
    }
};

// ============================================
// Medical Records
// ============================================

/**
 * Lấy lịch sử khám (encounters) theo bệnh nhân — dùng endpoint danh sách encounter đầy đủ
 */
export const getMedicalHistory = async (patientId: string): Promise<{ success: boolean; data?: any[]; message?: string }> => {
    try {
        const response = await axiosClient.get(`/api/medical-history`, {
            params: { patient_id: patientId, limit: 50 }
        });
        const raw = response.data;
        const data: any[] = raw?.data?.data ?? raw?.data?.items ?? raw?.data ?? raw ?? [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy lịch sử khám thất bại' };
    }
};

/**
 * Lấy chi tiết đầy đủ lượt khám — sinh hiệu, chẩn đoán ICD-10, đơn thuốc, xét nghiệm
 */
export const getEncounterDetail = async (encounterId: string): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
        const response = await axiosClient.get(`/api/medical-history/${encounterId}`);
        const raw = response.data;
        return { success: true, data: raw?.data ?? raw };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy chi tiết lượt khám thất bại' };
    }
};

/**
 * Lấy đơn thuốc theo bệnh nhân
 */
export const getPrescriptions = async (patientId: string): Promise<{ success: boolean; data?: any[]; message?: string }> => {
    try {
        const response = await axiosClient.get(`/api/prescriptions/by-patient/${patientId}`);
        const raw = response.data;
        const data: any[] = Array.isArray(raw?.data?.items) ? raw.data.items 
                          : Array.isArray(raw?.data?.data) ? raw.data.data
                          : Array.isArray(raw?.data) ? raw.data 
                          : Array.isArray(raw) ? raw 
                          : [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy đơn thuốc thất bại' };
    }
};

// ============================================
// Documents
// ============================================

/**
 * Lấy danh sách tài liệu của bệnh nhân
 */
export const getDocuments = async (patientId: string): Promise<{ success: boolean; data?: PatientDocument[]; message?: string }> => {
    try {
        const response = await axiosClient.get(PATIENT_ENDPOINTS_EXT.PATIENT_DOCUMENTS(patientId));
        const raw = response.data;
        const data: PatientDocument[] = raw?.data?.items ?? raw?.data ?? raw ?? [];
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Lấy tài liệu thất bại' };
    }
};

/**
 * Upload tài liệu bệnh nhân (FormData)
 * Backend expects: file, patient_id, document_type_id, document_name
 */
export const uploadDocument = async (patientId: string, formData: FormData): Promise<{ success: boolean; data?: PatientDocument; message?: string }> => {
    try {
        const response = await axiosClient.post(PATIENT_ENDPOINTS_EXT.UPLOAD_DOCUMENT(patientId), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const raw = response.data;
        return { success: true, data: raw?.data ?? raw };
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Tải lên tài liệu thất bại' };
    }
};

/**
 * Xóa tài liệu bệnh nhân
 */
export const deleteDocument = async (patientId: string, docId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        // Assume DOCUMENT_ENDPOINTS.DELETE exists in endpoints.ts for this
        const response = await axiosClient.delete(`/api/patients/${patientId}/documents/${docId}`);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || 'Xóa tài liệu thất bại' };
    }
};
