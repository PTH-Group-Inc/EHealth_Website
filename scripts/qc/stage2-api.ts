/**
 * Stage 2 - API contract check
 *   - Probe GET-capable endpoints from src/api/endpoints.ts
 *   - Pick a better role token for doctor/patient scoped APIs
 *   - Flag only real endpoint mismatches as errors; missing domain data stays warning
 */

import axios from 'axios';
import { join } from 'path';
import { loginAdmin, loginAll } from './auth-helper';
import { scanEndpoints, substitutePath, EndpointInfo } from './endpoint-scanner';
import { QC_CONFIG, QcIssue, QcStageResult } from './types';

const SKIP_GROUPS = new Set<string>([]);
const SKIP_NAMES = new Set<string>([
    'LOGOUT',
    'LOGOUT_ALL',
    'RESEND',
    'RESEND_OTP',
    'UPLOAD',
    'UPLOAD_AVATAR',
    'DELETE',
    'DISABLE',
    'ENABLE',
    'RESET_PASSWORD',
    'FORGOT_PASSWORD',
    'VERIFY_EMAIL',
    'UNLOCK_ACCOUNT',
    'REFRESH_TOKEN',
    'LOGIN',
    'LOGIN_EMAIL',
    'LOGIN_PHONE',
    'REGISTER',
    'REGISTER_EMAIL',
    'REGISTER_PHONE',
]);

function shouldSkip(endpoint: EndpointInfo): boolean {
    if (endpoint.qcSkip) return true;
    if (!endpoint.methods.includes('GET')) return true;
    if (SKIP_GROUPS.has(endpoint.group)) return true;
    if (SKIP_NAMES.has(endpoint.name)) return true;

    if (/^(CREATE|UPDATE|DELETE|REMOVE|CANCEL|CONFIRM|APPROVE|REJECT|SUBMIT|SEND|DISPATCH|PAY|REFUND|CHECK_IN|CHECK_OUT|SET_DEFAULT|TOGGLE|START|STOP|RESTART|PAUSE)/.test(endpoint.name)) {
        return true;
    }

    return false;
}

function preferredRoleForEndpoint(endpoint: EndpointInfo): 'admin' | 'doctor' | 'patient' {
    if (endpoint.group === 'SIGN_OFF_ENDPOINTS') return 'doctor';
    if (endpoint.group === 'TREATMENT_PLAN_ENDPOINTS') return 'doctor';
    if (endpoint.group === 'TELE_MEDICAL_CHAT_ENDPOINTS') return 'doctor';
    if (endpoint.group === 'TELE_PRESCRIPTION_ENDPOINTS') return 'doctor';
    if (endpoint.group === 'TELE_FOLLOWUP_ENDPOINTS') return 'doctor';
    if (endpoint.group === 'TELE_BOOKING_ENDPOINTS') return 'patient';
    return 'admin';
}

async function fetchKnownIds(token: string): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    const headers = { Authorization: `Bearer ${token}` };

    const tryList = async (url: string, keys: string[]) => {
        try {
            const res = await axios.get(`${QC_CONFIG.beUrl}${url}`, { headers, timeout: QC_CONFIG.apiTimeoutMs });
            const data = res.data?.data ?? res.data;
            const arr = Array.isArray(data) ? data : (data?.items ?? data?.list ?? []);
            const first = Array.isArray(arr) ? arr[0] : null;
            if (!first) return;

            for (const key of keys) {
                if (out[key] === undefined && first[key] !== undefined) {
                    out[key] = String(first[key]);
                }
            }
        } catch {
            // Ignore discovery failures; the caller will skip unresolved templates.
        }
    };

    await tryList('/api/users?limit=1', ['id', 'user_id', 'userId']);
    await tryList('/api/staff?limit=1', ['doctor_id', 'doctorId', 'id', 'staff_id']);
    await tryList('/api/patients?limit=1', ['patient_id', 'patientId', 'id']);
    await tryList('/api/facilities?limit=1', ['facility_id', 'facilityId', 'branch_id', 'branchId', 'id']);
    await tryList('/api/specialties?limit=1', ['specialty_id', 'specialtyId', 'id']);
    await tryList('/api/departments?limit=1', ['department_id', 'departmentId', 'id']);
    await tryList('/api/roles?limit=1', ['role_id', 'roleId', 'roles_id', 'id']);
    await tryList('/api/appointments?limit=1', ['appointment_id', 'appointmentId', 'id']);
    await tryList('/api/billing/invoices?limit=1', ['invoice_id', 'invoiceId', 'id']);
    await tryList('/api/notifications?limit=1', ['notification_id', 'notificationId', 'id']);

    return out;
}

function readDetail(payload: unknown): string {
    if (typeof payload === 'string') {
        return payload.slice(0, 300);
    }

    const record = payload as { message?: string } | null;
    return (record?.message ?? JSON.stringify(payload).slice(0, 300));
}

export async function runApiContractCheck(): Promise<QcStageResult> {
    const startedAt = new Date().toISOString();
    const start = Date.now();
    const issues: QcIssue[] = [];

    console.log('[QC Stage 2] Login admin...');
    let adminToken = '';
    let tokensByRole: Partial<Record<'admin' | 'doctor' | 'patient', string>> = {};

    try {
        const { token } = await loginAdmin();
        adminToken = token;
        const allTokens = await loginAll();
        tokensByRole = {
            admin: allTokens.admin?.token || token,
            doctor: allTokens.doctor?.token || token,
            patient: allTokens.patient?.token || token,
        };
    } catch (err: any) {
        issues.push({
            stage: 'api',
            severity: 'critical',
            title: 'Khong login duoc admin - BE khong chay hoac DB trong',
            detail: err.message,
        });

        return {
            stage: 'api',
            startedAt,
            finishedAt: new Date().toISOString(),
            durationMs: Date.now() - start,
            totalChecked: 0,
            passed: 0,
            failed: 1,
            issues,
        };
    }

    console.log('[QC Stage 2] Fetching known IDs for path-param endpoints...');
    const knownIds = await fetchKnownIds(adminToken);
    console.log(`[QC Stage 2] Known IDs: ${Object.keys(knownIds).join(', ') || '(none)'}`);

    const allEndpoints = scanEndpoints(join(process.cwd()));
    const candidates = allEndpoints.filter(endpoint => !shouldSkip(endpoint));

    let totalChecked = 0;
    let passed = 0;
    let failed = 0;

    console.log(`[QC Stage 2] Testing ${candidates.length} endpoints (GET-ish, skipping mutations)...`);

    const batchSize = 8;
    for (let index = 0; index < candidates.length; index += batchSize) {
        const batch = candidates.slice(index, index + batchSize);
        await Promise.all(batch.map(async endpoint => {
            if (endpoint.isTemplate && endpoint.placeholders.some(placeholder => knownIds[placeholder] === undefined)) {
                return;
            }

            const realPath = endpoint.isTemplate ? substitutePath(endpoint, knownIds) : endpoint.path;
            if (realPath.includes('${')) return;

            const selectedRole = preferredRoleForEndpoint(endpoint);
            const selectedToken = tokensByRole[selectedRole] || adminToken;

            totalChecked += 1;

            try {
                const res = await axios.get(`${QC_CONFIG.beUrl}${realPath}`, {
                    headers: { Authorization: `Bearer ${selectedToken}` },
                    timeout: QC_CONFIG.apiTimeoutMs,
                    validateStatus: () => true,
                });

                const status = res.status;
                const detail = readDetail(res.data);

                if (status >= 200 && status < 400) {
                    passed += 1;
                    return;
                }

                if (status === 404) {
                    const isEndpointMissing =
                        detail.includes(`Endpoint '${realPath}'`) ||
                        detail.includes('không tồn tại trên hệ thống') ||
                        detail.includes('khÃ´ng tá»“n táº¡i trÃªn há»‡ thá»‘ng');

                    if (isEndpointMissing) {
                        failed += 1;
                        issues.push({
                            stage: 'api',
                            severity: 'error',
                            title: `404 - Endpoint khong ton tai: ${endpoint.group}.${endpoint.name}`,
                            url: realPath,
                            httpStatus: status,
                            detail,
                        });
                    } else {
                        passed += 1;
                        issues.push({
                            stage: 'api',
                            severity: 'warning',
                            title: `404 - Resource khong ton tai: ${endpoint.group}.${endpoint.name}`,
                            url: realPath,
                            httpStatus: status,
                            detail,
                        });
                    }
                    return;
                }

                if (status >= 500) {
                    failed += 1;
                    issues.push({
                        stage: 'api',
                        severity: 'critical',
                        title: `5xx - Server crash: ${endpoint.group}.${endpoint.name}`,
                        url: realPath,
                        httpStatus: status,
                        detail,
                    });
                    return;
                }

                issues.push({
                    stage: 'api',
                    severity: 'warning',
                    title: `${status} - ${endpoint.group}.${endpoint.name}`,
                    url: realPath,
                    httpStatus: status,
                    detail,
                });
                passed += 1;
            } catch (err: any) {
                failed += 1;
                issues.push({
                    stage: 'api',
                    severity: 'critical',
                    title: `Network error: ${endpoint.group}.${endpoint.name}`,
                    url: realPath,
                    detail: err.message,
                });
            }
        }));
    }

    return {
        stage: 'api',
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
        totalChecked,
        passed,
        failed,
        issues,
    };
}

if (require.main === module) {
    runApiContractCheck().then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.failed > 0 ? 1 : 0);
    });
}
