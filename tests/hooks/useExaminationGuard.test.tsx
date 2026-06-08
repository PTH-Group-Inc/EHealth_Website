import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExaminationGuard } from '@/hooks/useExaminationGuard';

describe('useExaminationGuard', () => {
    let addSpy: any;
    let removeSpy: any;

    beforeEach(() => {
        addSpy = vi.spyOn(window, 'addEventListener');
        removeSpy = vi.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    it('gắn beforeunload listener khi dirty=true', () => {
        renderHook(() => useExaminationGuard(true));
        const calls = addSpy.mock.calls.filter((c: any[]) => c[0] === 'beforeunload');
        expect(calls.length).toBe(1);
    });

    it('KHÔNG gắn listener khi dirty=false', () => {
        renderHook(() => useExaminationGuard(false));
        const calls = addSpy.mock.calls.filter((c: any[]) => c[0] === 'beforeunload');
        expect(calls.length).toBe(0);
    });

    it('gỡ listener khi unmount', () => {
        const { unmount } = renderHook(() => useExaminationGuard(true));
        unmount();
        const calls = removeSpy.mock.calls.filter((c: any[]) => c[0] === 'beforeunload');
        expect(calls.length).toBe(1);
    });

    it('handler set returnValue để trigger native prompt', () => {
        renderHook(() => useExaminationGuard(true));
        const handler = addSpy.mock.calls.find((c: any[]) => c[0] === 'beforeunload')?.[1];
        expect(typeof handler).toBe('function');
        const evt: any = { preventDefault: vi.fn(), returnValue: '' };
        handler(evt);
        expect(evt.preventDefault).toHaveBeenCalled();
        expect(evt.returnValue).toBeTruthy();
    });
});
