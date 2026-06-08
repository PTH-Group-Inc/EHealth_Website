import { describe, it, expect } from 'vitest';
import { DOCTOR_MENU_GROUPS, getDoctorMenuItemByHref } from '@/constants/routes';

describe('DOCTOR_MENU_GROUPS — luồng nghiệp vụ rút gọn', () => {
    it('có đúng 4 nhóm chính', () => {
        const keys = DOCTOR_MENU_GROUPS.map(g => g.key);
        expect(keys).toEqual(['today', 'history', 'work-schedule', 'support']);
    });

    it('nhóm "today" chứa Hàng đợi và Lịch hẹn', () => {
        const today = DOCTOR_MENU_GROUPS.find(g => g.key === 'today');
        expect(today?.children?.map(c => c.key)).toEqual(['queue', 'appointments']);
    });

    it('nhóm "history" chứa Phiên khám và Bệnh nhân', () => {
        const hist = DOCTOR_MENU_GROUPS.find(g => g.key === 'history');
        expect(hist?.children?.map(c => c.key)).toEqual(['encounters', 'patients']);
    });

    it('nhóm "work-schedule" chứa Lịch làm việc / Nghỉ phép / Đổi ca', () => {
        const ws = DOCTOR_MENU_GROUPS.find(g => g.key === 'work-schedule');
        expect(ws?.children?.map(c => c.key)).toEqual(['schedule', 'leaves', 'shift-swaps']);
    });

    it('nhóm "support" chứa AI / Telemedicine / Cài đặt', () => {
        const sp = DOCTOR_MENU_GROUPS.find(g => g.key === 'support');
        expect(sp?.children?.map(c => c.key)).toEqual(['ai-assistant', 'telemedicine', 'settings']);
    });

    it('KHÔNG còn các item rời rạc của wizard trong sidebar', () => {
        const allKeys: string[] = [];
        for (const g of DOCTOR_MENU_GROUPS) {
            if (g.key) allKeys.push(g.key);
            g.children?.forEach(c => allKeys.push(c.key));
        }
        expect(allKeys).not.toContain('examination');
        expect(allKeys).not.toContain('medical-orders');
        expect(allKeys).not.toContain('medical-records');
        expect(allKeys).not.toContain('sign-off');
        expect(allKeys).not.toContain('ehr');
        expect(allKeys).not.toContain('prescriptions');
        expect(allKeys).not.toContain('treatment-plans');
        expect(allKeys).not.toContain('tasks');
        expect(allKeys).not.toContain('alerts');
    });
});

describe('getDoctorMenuItemByHref — breadcrumb lookup', () => {
    it('tìm thấy child item theo href', () => {
        const r = getDoctorMenuItemByHref('/portal/doctor/queue');
        expect(r).toEqual({ key: 'queue', href: '/portal/doctor/queue', label: 'Hàng đợi' });
    });

    it('tìm thấy item của nhóm "history"', () => {
        const r = getDoctorMenuItemByHref('/portal/doctor/encounters');
        expect(r?.key).toBe('encounters');
    });

    it('trả undefined nếu href không match', () => {
        expect(getDoctorMenuItemByHref('/portal/doctor/__nonexistent__')).toBeUndefined();
    });
});
