import { useEffect } from 'react';

/**
 * Cảnh báo bác sĩ trước khi rời trang khám nếu phiên khám chưa ký xong.
 * Gắn vào trang examination/wizard. Khi `dirty=true` (encounter đang IN_PROGRESS,
 * chưa COMPLETED) → trình duyệt hiện confirm gốc.
 */
export function useExaminationGuard(dirty: boolean): void {
    useEffect(() => {
        if (!dirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Bạn đang khám dở. Rời trang sẽ mất dữ liệu chưa lưu. Tiếp tục?';
            return e.returnValue;
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);
}
