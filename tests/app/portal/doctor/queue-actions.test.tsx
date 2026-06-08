import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthContext from '@/contexts/AuthContext';
import DoctorQueuePage from '@/app/portal/doctor/queue/page';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/portal/doctor/queue',
}));

const startExamMock = vi.fn().mockResolvedValue({ data: { id: 'enc-1' } });
const skipMock = vi.fn().mockResolvedValue({});
vi.mock('@/services/appointmentStatusService', () => ({
    appointmentStatusService: {
        getQueueToday: () => Promise.resolve({
            data: [
                { id: 'apt-1', patient_name: 'Nguyễn Văn A', queue_number: 1, status: 'WAITING', room_name: 'P101' },
                { id: 'apt-2', patient_name: 'Trần Thị B', queue_number: 2, status: 'IN_PROGRESS', room_name: 'P101' },
            ],
        }),
        getRoomStatus: () => Promise.resolve({ data: [] }),
        startExam: (...args: any[]) => startExamMock(...args),
        completeExam: vi.fn(),
        skip: (...args: any[]) => skipMock(...args),
        recall: vi.fn(),
    },
}));

const renderWithAuth = () =>
    render(
        <AuthContext.Provider value={{ user: { id: 'doc-1', role: 'doctor' } as any, login: vi.fn(), logout: vi.fn(), loading: false } as any}>
            <DoctorQueuePage />
        </AuthContext.Provider>
    );

describe('DoctorQueuePage — action gộp "Vào khám"', () => {
    beforeEach(() => {
        pushMock.mockClear();
        startExamMock.mockClear();
    });

    it('hiển thị nút "Vào khám" cho BN đang chờ', async () => {
        renderWithAuth();
        await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument());
        expect(screen.getAllByRole('button', { name: /vào khám/i }).length).toBeGreaterThan(0);
    });

    it('click "Vào khám" gọi startExam rồi navigate tới examination', async () => {
        renderWithAuth();
        await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument());
        const buttons = screen.getAllByRole('button', { name: /vào khám/i });
        fireEvent.click(buttons[0]);
        await waitFor(() => expect(startExamMock).toHaveBeenCalledWith('apt-1'));
        await waitFor(() =>
            expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/portal/doctor/examination?appointment=apt-1'))
        );
    });

    it('BN đang khám (in_progress) hiển thị "Tiếp tục khám" thay vì "Vào khám"', async () => {
        renderWithAuth();
        await waitFor(() => expect(screen.getByText('Trần Thị B')).toBeInTheDocument());
        expect(screen.getByRole('button', { name: /tiếp tục khám/i })).toBeInTheDocument();
    });

    it('KHÔNG còn nút "Hoàn tất" ở Queue (encounter tự đóng khi BS ký xong wizard)', async () => {
        renderWithAuth();
        await waitFor(() => expect(screen.getByText('Trần Thị B')).toBeInTheDocument());
        expect(screen.queryByRole('button', { name: /^hoàn tất$/i })).not.toBeInTheDocument();
    });
});
