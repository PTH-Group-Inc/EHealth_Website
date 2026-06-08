/**
 * Encounter Service — Phiên khám bệnh
 * Swagger: /api/encounters/*
 * Backend: http://160.250.186.97:3000/api-docs
 */

import axiosClient from '@/api/axiosClient';
import {
    ENCOUNTER_ENDPOINTS,
    CLINICAL_EXAM_ENDPOINTS,
    DIAGNOSIS_ENDPOINTS,
    MEDICAL_RECORD_ENDPOINTS,
    SIGN_OFF_ENDPOINTS,
    MEDICAL_ORDER_ENDPOINTS,
    PATIENT_ENDPOINTS,
} from '@/api/endpoints';

export const encounterService = {
    // Encounter CRUD
    getList: (params?: { page?: number; limit?: number; status?: string; doctorId?: string; patientId?: string }) =>
        axiosClient.get(ENCOUNTER_ENDPOINTS.LIST, { params }).then(r => r.data),

    getActive: () =>
        axiosClient.get(ENCOUNTER_ENDPOINTS.ACTIVE).then(r => r.data),

    getById: (id: string) =>
        axiosClient.get(ENCOUNTER_ENDPOINTS.DETAIL(id)).then(r => r.data?.data ?? r.data),

    create: (data: Record<string, any>) =>
        axiosClient.post(ENCOUNTER_ENDPOINTS.CREATE, data).then(r => r.data?.data ?? r.data),

    createFromAppointment: (appointmentId: string) =>
        axiosClient.post(ENCOUNTER_ENDPOINTS.CREATE_FROM_APPOINTMENT(appointmentId), {}).then(r => r.data?.data ?? r.data),

    getByAppointment: (appointmentId: string) =>
        axiosClient.get(ENCOUNTER_ENDPOINTS.BY_APPOINTMENT(appointmentId)).then(r => r.data?.data ?? r.data),

    getByPatient: (patientId: string) =>
        axiosClient.get(ENCOUNTER_ENDPOINTS.BY_PATIENT(patientId)).then(r => r.data),

    updateStatus: (id: string, status: string, data?: Record<string, any>) =>
        axiosClient.patch(ENCOUNTER_ENDPOINTS.STATUS(id), { new_status: status, ...data }).then(r => r.data),

    assignDoctor: (id: string, doctorId: string) =>
        axiosClient.put(ENCOUNTER_ENDPOINTS.ASSIGN_DOCTOR(id), { doctorId }).then(r => r.data),

    assignRoom: (id: string, roomId: string) =>
        axiosClient.put(ENCOUNTER_ENDPOINTS.ASSIGN_ROOM(id), { roomId }).then(r => r.data),

    // Clinical examination (vitals)
    getVitals: (encounterId: string) =>
        axiosClient.get(CLINICAL_EXAM_ENDPOINTS.VITALS(encounterId)).then(r => r.data?.data ?? r.data),

    saveVitals: (encounterId: string, data: Record<string, any>) =>
        axiosClient.patch(CLINICAL_EXAM_ENDPOINTS.VITALS(encounterId), data).then(r => r.data?.data ?? r.data),

    finalizeExam: (encounterId: string) =>
        axiosClient.post(CLINICAL_EXAM_ENDPOINTS.FINALIZE(encounterId), {}).then(r => r.data),

    getExamSummary: (encounterId: string) =>
        axiosClient.get(CLINICAL_EXAM_ENDPOINTS.SUMMARY(encounterId)).then(r => r.data?.data ?? r.data),

    // Diagnoses
    getDiagnoses: (encounterId: string) =>
        axiosClient.get(DIAGNOSIS_ENDPOINTS.BY_ENCOUNTER(encounterId)).then(r => r.data?.data ?? r.data),

    addDiagnosis: (encounterId: string, data: Record<string, any>) =>
        axiosClient.post(DIAGNOSIS_ENDPOINTS.BY_ENCOUNTER(encounterId), data).then(r => r.data?.data ?? r.data),

    updateDiagnosis: (diagnosisId: string, data: Record<string, any>) =>
        axiosClient.put(DIAGNOSIS_ENDPOINTS.DETAIL(diagnosisId), data).then(r => r.data?.data ?? r.data),

    searchICD: (query: string) =>
        axiosClient.get(DIAGNOSIS_ENDPOINTS.SEARCH_ICD, { params: { q: query } }).then(r => r.data?.data ?? r.data ?? []),

    // Medical records
    getMedicalRecord: (encounterId: string) =>
        axiosClient.get(MEDICAL_RECORD_ENDPOINTS.DETAIL(encounterId)).then(r => r.data?.data ?? r.data),

    saveMedicalRecord: (encounterId: string, data: Record<string, any>) =>
        axiosClient.put(MEDICAL_RECORD_ENDPOINTS.DETAIL(encounterId), data).then(r => r.data?.data ?? r.data),

    finalizeMedicalRecord: (encounterId: string) =>
        axiosClient.post(MEDICAL_RECORD_ENDPOINTS.FINALIZE(encounterId), {}).then(r => r.data),

    signMedicalRecord: (encounterId: string) =>
        axiosClient.post(MEDICAL_RECORD_ENDPOINTS.SIGN(encounterId), {}).then(r => r.data),

    // Sign-off workflow
    draftSign: (encounterId: string) =>
        axiosClient.post(SIGN_OFF_ENDPOINTS.DRAFT_SIGN(encounterId), {}).then(r => r.data),

    officialSign: (encounterId: string, pin?: string) =>
        axiosClient.post(SIGN_OFF_ENDPOINTS.OFFICIAL_SIGN(encounterId), { pin }).then(r => r.data),

    completeSignOff: (encounterId: string) =>
        axiosClient.post(SIGN_OFF_ENDPOINTS.COMPLETE(encounterId), {}).then(r => r.data),

    // Medical Orders (chỉ định xét nghiệm / dịch vụ)
    getMedicalOrders: (encounterId: string) =>
        axiosClient.get(MEDICAL_ORDER_ENDPOINTS.BY_ENCOUNTER(encounterId)).then(r => r.data?.data ?? r.data ?? []),

    createMedicalOrder: (encounterId: string, data: Record<string, any>) =>
        axiosClient.post(MEDICAL_ORDER_ENDPOINTS.BY_ENCOUNTER(encounterId), data).then(r => r.data?.data ?? r.data),

    cancelMedicalOrder: (orderId: string, reason?: string) =>
        axiosClient.post(MEDICAL_ORDER_ENDPOINTS.CANCEL(orderId), { reason }).then(r => r.data),

    // Patient info
    getPatient: (patientId: string) =>
        axiosClient.get(PATIENT_ENDPOINTS.DETAIL(patientId)).then(r => r.data?.data ?? r.data),

    searchPatients: (q: string) =>
        axiosClient.get(PATIENT_ENDPOINTS.LIST, { params: { search: q, limit: 20 } }).then(r => r.data?.data ?? r.data ?? []),
};
