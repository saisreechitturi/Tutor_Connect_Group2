import sessionService from './sessionService';
import apiClient from './apiClient';
import availabilityService from './availabilityService';

jest.mock('./apiClient');
jest.mock('./availabilityService', () => ({
    __esModule: true,
    default: {
        getAvailableTimeSlots: jest.fn(),
    }
}));

describe('sessionService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createSession', () => {
        it('maps scheduledStart/end to scheduledAt + durationMinutes and rate from hourlyRate', async () => {
            const start = '2024-01-01T10:00:00.000Z';
            const end = '2024-01-01T11:30:00.000Z';
            const payload = {
                tutorId: 42,
                subjectId: 7,
                title: 'Algebra',
                description: 'Linear equations',
                scheduledStart: start,
                scheduledEnd: end,
                hourlyRate: 50,
            };

            apiClient.post.mockResolvedValue({ id: 'session-1', ...payload });

            const res = await sessionService.createSession(payload);

            expect(apiClient.post).toHaveBeenCalledWith('/sessions', expect.objectContaining({
                tutorId: 42,
                subjectId: 7,
                title: 'Algebra',
                description: 'Linear equations',
                scheduledAt: new Date(start).toISOString(),
                durationMinutes: 90,
                rate: 50,
            }));
            expect(res).toEqual({ id: 'session-1', ...payload });
        });

        it('prefers explicit rate over hourlyRate', async () => {
            const start = '2024-01-01T10:00:00.000Z';
            const end = '2024-01-01T11:00:00.000Z';
            const payload = {
                tutorId: 1,
                title: 'Physics',
                scheduledStart: start,
                scheduledEnd: end,
                rate: 65,
                hourlyRate: 50,
            };

            apiClient.post.mockResolvedValue({ ok: true });
            await sessionService.createSession(payload);
            expect(apiClient.post).toHaveBeenCalledWith('/sessions', expect.objectContaining({ rate: 65 }));
        });

        it('throws errors from api', async () => {
            const err = new Error('Validation failed');
            apiClient.post.mockRejectedValue(err);

            await expect(sessionService.createSession({
                tutorId: 1,
                title: 'Test',
                scheduledStart: '2024-01-01T10:00:00.000Z',
                scheduledEnd: '2024-01-01T10:30:00.000Z',
            })).rejects.toThrow('Validation failed');
        });
    });

    describe('checkAvailability', () => {
        it('returns true when exact slot is available', async () => {
            const start = '2024-01-01T10:00:00.000Z';
            const end = '2024-01-01T11:00:00.000Z';
            const date = '2024-01-01';

            availabilityService.getAvailableTimeSlots.mockResolvedValue({
                availableSlots: [
                    { date, startTime: '10:00', endTime: '11:00' },
                    { date, startTime: '12:00', endTime: '13:00' },
                ]
            });

            const ok = await sessionService.checkAvailability(5, start, end);
            expect(availabilityService.getAvailableTimeSlots).toHaveBeenCalledWith(5, { date, duration: 60 });
            expect(ok).toBe(true);
        });

        it('returns false when no matching slot', async () => {
            const start = '2024-01-01T09:00:00.000Z';
            const end = '2024-01-01T10:00:00.000Z';
            const date = '2024-01-01';

            availabilityService.getAvailableTimeSlots.mockResolvedValue({
                availableSlots: [
                    { date, startTime: '11:00', endTime: '12:00' }
                ]
            });

            const ok = await sessionService.checkAvailability(5, start, end);
            expect(ok).toBe(false);
        });
    });
});
