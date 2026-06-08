import { aiService } from '@/services/aiService';
import type { PageContext } from '@/contexts/AICopilotContext';

// ============================================
// Types
// ============================================

export interface CommandResult {
    type: 'icd' | 'drug' | 'diagnosis' | 'summary' | 'protocol' | 'interaction' | 'text';
    content: string;
    applyable: boolean;
    applyPayload?: Record<string, unknown>;
    citations?: string[];
}

export interface Command {
    trigger: string;
    label: string;
    description: string;
    icon: string;
    roles: string[];
    execute: (args: string, context: PageContext | null) => Promise<CommandResult>;
}

// ============================================
// Command Registry
// ============================================

export const COMMANDS: Command[] = [
    {
        trigger: '/icd',
        label: 'Tra cứu ICD-10',
        description: '/icd [query] — VD: /icd viêm phổi',
        icon: 'search',
        roles: ['doctor'],
        execute: async (args, _ctx) => {
            try {
                const res = await aiService.lookupICD10(args);
                const data = (res?.data as any)?.data ?? res?.data;
                const message = data?.message || data?.content || `Kết quả ICD-10 cho "${args}"`;
                return {
                    type: 'icd',
                    content: message,
                    applyable: true,
                    applyPayload: { icdCode: extractFirstICD(message) },
                };
            } catch {
                return { type: 'text', content: `Không tìm được ICD-10 cho "${args}"`, applyable: false };
            }
        },
    },
    {
        trigger: '/drug',
        label: 'Tra cứu thuốc',
        description: '/drug [tên thuốc] — VD: /drug amoxicillin',
        icon: 'medication',
        roles: ['doctor', 'pharmacist'],
        execute: async (args, _ctx) => {
            try {
                const res = await aiService.chat({ message: `Thông tin thuốc: ${args}`, context: { type: 'drug_info' } });
                const data = (res?.data as any)?.data ?? res?.data;
                return { type: 'drug', content: data?.message || data?.content || '', applyable: false };
            } catch {
                return { type: 'text', content: `Không tìm được thông tin thuốc "${args}"`, applyable: false };
            }
        },
    },
    {
        trigger: '/diagnose',
        label: 'Gợi ý chẩn đoán',
        description: '/diagnose — phân tích từ context hiện tại',
        icon: 'diagnosis',
        roles: ['doctor'],
        execute: async (_args, ctx) => {
            const symptoms = (ctx?.formData as any)?.symptoms || '';
            const vitals = (ctx?.formData as any)?.vitals;
            if (!symptoms) {
                return { type: 'text', content: 'Chưa có triệu chứng trong context. Vui lòng nhập triệu chứng trước.', applyable: false };
            }
            try {
                const res = await aiService.getDiagnosis({ symptoms, vitals });
                const data = (res?.data as any)?.data ?? res?.data;
                const diagnoses = data?.diagnoses || [];
                if (diagnoses.length === 0) {
                    return { type: 'text', content: 'Không tìm thấy chẩn đoán phù hợp.', applyable: false };
                }
                const top = diagnoses[0];
                const content = diagnoses.map((d: any, i: number) =>
                    `**${i + 1}. ${d.icdDescription || d.description || ''}** (${d.icdCode || ''}) — ${d.confidence || 0}%`
                ).join('\n');
                return {
                    type: 'diagnosis',
                    content,
                    applyable: true,
                    applyPayload: {
                        diagnosis: top.icdDescription || top.description,
                        icdCode: top.icdCode,
                    },
                };
            } catch {
                return { type: 'text', content: 'Không thể phân tích chẩn đoán lúc này.', applyable: false };
            }
        },
    },
    {
        trigger: '/summary',
        label: 'Tóm tắt bệnh nhân',
        description: '/summary — tóm tắt hồ sơ BN hiện tại',
        icon: 'summarize',
        roles: ['doctor', 'pharmacist', 'receptionist'],
        execute: async (_args, ctx) => {
            if (!ctx?.patientId) {
                return { type: 'text', content: 'Chưa có bệnh nhân trong context.', applyable: false };
            }
            try {
                const res = await aiService.summarizePatient(ctx.patientId);
                const data = (res?.data as any)?.data ?? res?.data;
                const summary = data?.summary;
                if (!summary) return { type: 'text', content: 'Không có dữ liệu tóm tắt.', applyable: false };
                const lines = [
                    `**Bệnh nhân:** ${summary.patientName || ctx.patientName || ''}`,
                    summary.chronicConditions?.length ? `**Bệnh mãn tính:** ${summary.chronicConditions.join(', ')}` : '',
                    summary.allergies?.length ? `**Dị ứng:** ${summary.allergies.join(', ')}` : '',
                    summary.redFlags?.length ? `**⚠️ Red flags:** ${summary.redFlags.join(', ')}` : '',
                    summary.currentMedications?.length ? `**Thuốc:** ${summary.currentMedications.map((m: any) => m.name).join(', ')}` : '',
                ].filter(Boolean).join('\n');
                return { type: 'summary', content: lines, applyable: false };
            } catch {
                return { type: 'text', content: 'Không thể tóm tắt lúc này.', applyable: false };
            }
        },
    },
    {
        trigger: '/protocol',
        label: 'Phác đồ điều trị',
        description: '/protocol [bệnh] — VD: /protocol tăng huyết áp',
        icon: 'description',
        roles: ['doctor'],
        execute: async (args, _ctx) => {
            try {
                const res = await aiService.chat({ message: `Phác đồ điều trị: ${args}`, context: { type: 'protocol' } });
                const data = (res?.data as any)?.data ?? res?.data;
                return { type: 'protocol', content: data?.message || data?.content || '', applyable: false };
            } catch {
                return { type: 'text', content: `Không tìm được phác đồ cho "${args}"`, applyable: false };
            }
        },
    },
    {
        trigger: '/interaction',
        label: 'Tương tác thuốc',
        description: '/interaction [thuốc1] [thuốc2]',
        icon: 'compare_arrows',
        roles: ['doctor', 'pharmacist'],
        execute: async (args, _ctx) => {
            const drugs = args.split(/\s+/).filter(Boolean);
            if (drugs.length < 2) {
                return { type: 'text', content: 'Cần ít nhất 2 thuốc. VD: /interaction warfarin aspirin', applyable: false };
            }
            try {
                const res = await aiService.checkDrugInteraction({
                    drugs: drugs.map(d => ({ name: d, dosage: '' })),
                    allergies: [],
                });
                const data = (res?.data as any)?.data ?? res?.data;
                const interactions = data?.interactions || [];
                if (interactions.length === 0) {
                    return { type: 'interaction', content: `✅ Không phát hiện tương tác giữa ${drugs.join(' + ')}`, applyable: false };
                }
                const content = interactions.map((i: any) =>
                    `**${i.drugA} + ${i.drugB}:** ${i.severity} — ${i.detail}`
                ).join('\n');
                return { type: 'interaction', content, applyable: false };
            } catch {
                return { type: 'text', content: 'Không thể kiểm tra tương tác lúc này.', applyable: false };
            }
        },
    },
];

/** Parse command from input text. Returns [command, args] or null */
export function parseCommand(input: string): [Command, string] | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return null;
    for (const cmd of COMMANDS) {
        if (trimmed === cmd.trigger || trimmed.startsWith(cmd.trigger + ' ')) {
            const args = trimmed.slice(cmd.trigger.length).trim();
            return [cmd, args];
        }
    }
    return null;
}

/** Get commands available for a given role */
export function getCommandsForRole(role: string): Command[] {
    return COMMANDS.filter(c => c.roles.includes(role));
}

/** Extract first ICD code (pattern: letter + digits) from text */
function extractFirstICD(text: string): string {
    const match = text.match(/[A-Z]\d{2}(?:\.\d{1,2})?/);
    return match ? match[0] : '';
}
