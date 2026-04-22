/**
 * Unit tests cho src/utils/validation.ts
 * Check nghiệp vụ: họ tên VN, SĐT VN, CCCD/CMND, BHYT, email, ngày, huyết áp, vital signs.
 */

import { describe, it, expect } from 'vitest';
import {
    validateName,
    validatePhone,
    validateDob,
    validateIdNumber,
    validateBHYT,
    validateEmail,
    validateDateRange,
    validateAppointmentDate,
    validateBloodPressure,
    validateVitalSign,
    validateRequired,
} from '@/utils/validation';

describe('validateName — quy tắc họ tên', () => {
    it('Chấp nhận tên tiếng Việt có dấu', () => {
        expect(validateName('Nguyễn Minh Quân').valid).toBe(true);
    });
    it('Từ chối rỗng', () => {
        expect(validateName('   ').valid).toBe(false);
    });
    it('Từ chối < 2 ký tự', () => {
        expect(validateName('A').valid).toBe(false);
    });
    it('Từ chối > 100 ký tự', () => {
        expect(validateName('A'.repeat(101)).valid).toBe(false);
    });
    it('Từ chối chứa số', () => {
        expect(validateName('Nguyen 123').valid).toBe(false);
    });
});

describe('validatePhone — SĐT Việt Nam', () => {
    it.each([
        ['0912345678', true],   // 09x
        ['0398765432', true],   // 03x
        ['0512345678', true],   // 05x
        ['0712345678', true],   // 07x
        ['0812345678', true],   // 08x
    ])('Đầu số hợp lệ: %s → %s', (phone, valid) => {
        expect(validatePhone(phone).valid).toBe(valid);
    });

    it.each([
        ['', 'rỗng'],
        ['abcdef0123', 'có chữ'],
        ['091234567', 'thiếu số (9 chữ số)'],
        ['09123456789', 'dư số (11 chữ số)'],
        ['0212345678', 'đầu số 02 không hợp lệ'],
        ['1234567890', 'không bắt đầu bằng 0'],
    ])('Từ chối %s (%s)', (phone) => {
        expect(validatePhone(phone).valid).toBe(false);
    });

    it('Chấp nhận có dấu cách / gạch ngang', () => {
        expect(validatePhone('091-234 5678').valid).toBe(true);
    });
});

describe('validateDob — ngày sinh', () => {
    it('Chấp nhận rỗng (optional)', () => {
        expect(validateDob('').valid).toBe(true);
    });
    it('Từ chối ngày ở tương lai', () => {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        const iso = future.toISOString().slice(0, 10);
        expect(validateDob(iso).valid).toBe(false);
    });
    it('Từ chối tuổi > 150', () => {
        expect(validateDob('1800-01-01').valid).toBe(false);
    });
    it('Chấp nhận ngày sinh bình thường', () => {
        expect(validateDob('2000-01-01').valid).toBe(true);
    });
});

describe('validateIdNumber — CCCD/CMND', () => {
    it('Chấp nhận rỗng (optional)', () => {
        expect(validateIdNumber('').valid).toBe(true);
    });
    it('Chấp nhận CCCD 12 chữ số', () => {
        expect(validateIdNumber('001234567890').valid).toBe(true);
    });
    it('Chấp nhận CMND 9 chữ số', () => {
        expect(validateIdNumber('123456789').valid).toBe(true);
    });
    it('Từ chối 11 chữ số (không phải 9 hay 12)', () => {
        expect(validateIdNumber('12345678901').valid).toBe(false);
    });
    it('Từ chối có chữ', () => {
        expect(validateIdNumber('12345678a').valid).toBe(false);
    });
});

describe('validateBHYT — số thẻ bảo hiểm y tế', () => {
    it('Chấp nhận 2 chữ cái + 13 số', () => {
        expect(validateBHYT('HS4792845123456').valid).toBe(true);
    });
    it('Chấp nhận có dấu gạch giữa', () => {
        expect(validateBHYT('HS-4792845-123456').valid).toBe(true);
    });
    it('Từ chối ký tự thứ 1-2 là số', () => {
        expect(validateBHYT('123792845123456').valid).toBe(false);
    });
    it('Từ chối thiếu số (< 15)', () => {
        expect(validateBHYT('HS479284512345').valid).toBe(false);
    });
});

describe('validateEmail', () => {
    it('Chấp nhận email hợp lệ', () => {
        expect(validateEmail('user@ehealth.vn').valid).toBe(true);
    });
    it('Từ chối không có @', () => {
        expect(validateEmail('user.ehealth.vn').valid).toBe(false);
    });
    it('Từ chối không có domain', () => {
        expect(validateEmail('user@').valid).toBe(false);
    });
    it('Từ chối rỗng', () => {
        expect(validateEmail('').valid).toBe(false);
    });
});

describe('validateDateRange', () => {
    it('Chấp nhận startDate = endDate', () => {
        expect(validateDateRange('2026-04-17', '2026-04-17').valid).toBe(true);
    });
    it('Từ chối endDate < startDate', () => {
        expect(validateDateRange('2026-04-17', '2026-04-01').valid).toBe(false);
    });
    it('Chấp nhận 1 field rỗng', () => {
        expect(validateDateRange('', '2026-04-17').valid).toBe(true);
    });
});

describe('validateAppointmentDate — ngày đặt lịch khám', () => {
    // Dùng local date (YYYY-MM-DD theo TZ máy chạy test), không dùng toISOString
    // vì toISOString() trả UTC → edge case khi chạy gần nửa đêm local + TZ lệch UTC
    // (ví dụ GMT+7 lúc 02:00 local = UTC 19:00 ngày trước → toISOString = ngày hôm qua).
    const localDateString = (offsetDays = 0): string => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    it('Chấp nhận ngày hôm nay', () => {
        expect(validateAppointmentDate(localDateString(0)).valid).toBe(true);
    });
    it('Chấp nhận ngày tương lai', () => {
        expect(validateAppointmentDate(localDateString(7)).valid).toBe(true);
    });
    it('Từ chối ngày quá khứ', () => {
        expect(validateAppointmentDate('2020-01-01').valid).toBe(false);
    });
    it('Từ chối rỗng', () => {
        expect(validateAppointmentDate('').valid).toBe(false);
    });
});

describe('validateBloodPressure — huyết áp y tế', () => {
    it('Chấp nhận 120/80', () => {
        expect(validateBloodPressure('120/80').valid).toBe(true);
    });
    it('Từ chối dạng sai (không có /)', () => {
        expect(validateBloodPressure('12080').valid).toBe(false);
    });
    it('Từ chối tâm thu quá cao (> 250)', () => {
        expect(validateBloodPressure('300/80').valid).toBe(false);
    });
    it('Từ chối tâm trương >= tâm thu (bất khả thi sinh lý)', () => {
        expect(validateBloodPressure('80/120').valid).toBe(false);
    });
    it('Từ chối tâm trương quá thấp (< 30)', () => {
        expect(validateBloodPressure('120/20').valid).toBe(false);
    });
});

describe('validateVitalSign — range các chỉ số sinh hiệu', () => {
    it('Heart rate 72 bpm hợp lệ', () => {
        expect(validateVitalSign('72', 'heartRate').valid).toBe(true);
    });
    it('Heart rate 20 bpm (quá thấp) — từ chối', () => {
        expect(validateVitalSign('20', 'heartRate').valid).toBe(false);
    });
    it('Nhiệt độ 37.5°C hợp lệ', () => {
        expect(validateVitalSign('37.5', 'temperature').valid).toBe(true);
    });
    it('Nhiệt độ 50°C không hợp lệ', () => {
        expect(validateVitalSign('50', 'temperature').valid).toBe(false);
    });
    it('SpO2 98% hợp lệ', () => {
        expect(validateVitalSign('98', 'spO2').valid).toBe(true);
    });
    it('SpO2 40% không hợp lệ (< 50)', () => {
        expect(validateVitalSign('40', 'spO2').valid).toBe(false);
    });
    it('Cân nặng 65kg hợp lệ', () => {
        expect(validateVitalSign('65', 'weight').valid).toBe(true);
    });
    it('Chấp nhận rỗng (optional)', () => {
        expect(validateVitalSign('', 'heartRate').valid).toBe(true);
    });
    it('Giá trị không phải số — từ chối', () => {
        expect(validateVitalSign('abc', 'heartRate').valid).toBe(false);
    });
});

describe('validateRequired', () => {
    it('Chấp nhận có giá trị', () => {
        expect(validateRequired('Abc', 'Họ tên').valid).toBe(true);
    });
    it('Từ chối rỗng (chỉ whitespace)', () => {
        expect(validateRequired('   ', 'Họ tên').valid).toBe(false);
    });
});
