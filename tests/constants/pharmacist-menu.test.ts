import { describe, it, expect } from 'vitest';
import { PHARMACIST_MENU_GROUPS, getPharmacistMenuItemByHref } from '@/constants/routes';

describe('PHARMACIST_MENU_GROUPS — 4 nhóm theo luồng nghiệp vụ PMIS', () => {
    it('có đúng 4 nhóm chính', () => {
        expect(PHARMACIST_MENU_GROUPS.map(g => g.key)).toEqual(['operations', 'warehouse', 'data', 'account']);
    });

    it('nhóm "operations": prescriptions + my-history', () => {
        const op = PHARMACIST_MENU_GROUPS.find(g => g.key === 'operations');
        expect(op?.children?.map(c => c.key)).toEqual(['prescriptions', 'my-history']);
    });

    it('nhóm "warehouse": inventory (đã gộp stock-in/out/alerts thành tabs nội bộ)', () => {
        const w = PHARMACIST_MENU_GROUPS.find(g => g.key === 'warehouse');
        expect(w?.children?.map(c => c.key)).toEqual(['inventory']);
    });

    it('nhóm "data": patients + master-data', () => {
        const d = PHARMACIST_MENU_GROUPS.find(g => g.key === 'data');
        expect(d?.children?.map(c => c.key)).toEqual(['patients', 'master-data']);
    });

    it('nhóm "account": settings', () => {
        const a = PHARMACIST_MENU_GROUPS.find(g => g.key === 'account');
        expect(a?.children?.map(c => c.key)).toEqual(['settings']);
    });

    it('KHÔNG còn wizard sub-step / sub-page rời rạc', () => {
        const all: string[] = [];
        for (const g of PHARMACIST_MENU_GROUPS) {
            if (g.key) all.push(g.key);
            g.children?.forEach(c => all.push(c.key));
        }
        for (const banned of ['dispensing', 'medication-profile', 'stock-in', 'stock-out', 'alerts', 'dashboard']) {
            expect(all).not.toContain(banned);
        }
    });
});

describe('getPharmacistMenuItemByHref', () => {
    it('tìm thấy child theo href', () => {
        const r = getPharmacistMenuItemByHref('/portal/pharmacist/prescriptions');
        expect(r?.key).toBe('prescriptions');
    });
    it('trả undefined nếu không match', () => {
        expect(getPharmacistMenuItemByHref('/portal/pharmacist/__nope__')).toBeUndefined();
    });
});
