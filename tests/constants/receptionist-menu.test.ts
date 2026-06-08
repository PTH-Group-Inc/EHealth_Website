import { describe, it, expect } from 'vitest';
import { RECEPTIONIST_MENU_GROUPS } from '@/constants/routes';

describe('RECEPTIONIST_MENU_GROUPS — gom 13 mục thành ~5 nhóm', () => {
    it('có nhóm "operations" chứa queue + room-status (Điều phối)', () => {
        const op = RECEPTIONIST_MENU_GROUPS.find(g => g.key === 'operations');
        expect(op?.children?.map(c => c.key)).toEqual(['queue', 'room-status']);
    });

    it('có nhóm "patient-flow" chứa patients + appointments + check-in', () => {
        const pf = RECEPTIONIST_MENU_GROUPS.find(g => g.key === 'patient-flow');
        expect(pf?.children?.map(c => c.key)).toEqual(['patients', 'appointments', 'check-in']);
    });

    it('có nhóm "finance" chứa billing + payments + refunds (Tài chính)', () => {
        const f = RECEPTIONIST_MENU_GROUPS.find(g => g.key === 'finance');
        expect(f?.children?.map(c => c.key)).toEqual(['billing', 'payments', 'refunds']);
    });

    it('có nhóm "data" chứa support-data + change-history + staff-info', () => {
        const d = RECEPTIONIST_MENU_GROUPS.find(g => g.key === 'data');
        expect(d?.children?.map(c => c.key)).toEqual(['support-data', 'change-history', 'staff-info']);
    });

    it('có nhóm "account" chứa settings', () => {
        const a = RECEPTIONIST_MENU_GROUPS.find(g => g.key === 'account');
        expect(a?.children?.map(c => c.key)).toEqual(['settings']);
    });

    it('KHÔNG còn reception (đã xoá)', () => {
        const all: string[] = [];
        for (const g of RECEPTIONIST_MENU_GROUPS) {
            g.children?.forEach(c => all.push(c.key));
        }
        expect(all).not.toContain('reception');
    });
});
