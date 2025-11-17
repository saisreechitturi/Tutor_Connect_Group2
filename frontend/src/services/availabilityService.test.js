import availabilityService from './availabilityService';
import apiClient from './apiClient';

// Mock the apiClient
jest.mock('./apiClient');

describe('availabilityService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAvailability', () => {
        it('should fetch availability for a tutor', async () => {
            const mockResponse = {
                availability: {
                    recurringSlots: [
                        {
                            id: '1',
                            dayOfWeek: 1,
                            startTime: '09:00',
                            endTime: '17:00',

                        }
                    ],
                    specificSlots: []
                }
            };

            apiClient.get.mockResolvedValue(mockResponse);

            const tutorId = 'tutor-123';
            const result = await availabilityService.getAvailability(tutorId);

            expect(apiClient.get).toHaveBeenCalledWith('/availability/tutor-123');
            expect(result).toEqual(mockResponse);
        });

        it('should include query parameters when provided', async () => {
            const mockResponse = { availability: { recurringSlots: [], specificSlots: [] } };
            apiClient.get.mockResolvedValue(mockResponse);

            await availabilityService.getAvailability('tutor-123', {
                date: '2024-01-15',
                includeBooked: true
            });

            expect(apiClient.get).toHaveBeenCalledWith('/availability/tutor-123?date=2024-01-15&includeBooked=true');
        });
    });

    describe('createRecurringSlot', () => {
        it('should create a recurring availability slot', async () => {
            const mockResponse = {
                message: 'Availability slot created successfully',
                slot: {
                    id: 'slot-123',
                    dayOfWeek: 1,
                    startTime: '09:00',
                    endTime: '10:00'
                }
            };

            apiClient.post.mockResolvedValue(mockResponse);

            const tutorId = 'tutor-123';
            const slotData = {
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '10:00'
            };

            const result = await availabilityService.createRecurringSlot(tutorId, slotData);

            expect(apiClient.post).toHaveBeenCalledWith('/availability/tutor-123/recurring', slotData);
            expect(result).toEqual(mockResponse);
        });

        it('should handle overlap errors', async () => {
            const errorMessage = 'This time slot overlaps with existing availability';
            apiClient.post.mockRejectedValue(new Error(errorMessage));

            const tutorId = 'tutor-123';
            const slotData = {
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '10:00'
            };

            await expect(availabilityService.createRecurringSlot(tutorId, slotData))
                .rejects.toThrow(errorMessage);
        });
    });

    describe('createSpecificSlot', () => {
        it('should create a specific date availability slot', async () => {
            const mockResponse = {
                message: 'Specific availability created successfully',
                slot: {
                    id: 'slot-123',
                    date: '2024-01-15',
                    startTime: '10:00',
                    endTime: '11:00',
                    isAvailable: true
                }
            };

            apiClient.post.mockResolvedValue(mockResponse);

            const tutorId = 'tutor-123';
            const slotData = {
                date: '2024-01-15',
                startTime: '10:00',
                endTime: '11:00',
                isAvailable: true
            };

            const result = await availabilityService.createSpecificSlot(tutorId, slotData);

            expect(apiClient.post).toHaveBeenCalledWith('/availability/tutor-123/specific', slotData);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('updateSlot', () => {
        it('should update an availability slot', async () => {
            const mockResponse = {
                message: 'Availability slot updated successfully'
            };

            apiClient.put.mockResolvedValue(mockResponse);

            const tutorId = 'tutor-123';
            const slotId = 'slot-123';
            const slotData = {
                startTime: '10:00',
                endTime: '11:00'
            };

            const result = await availabilityService.updateSlot(tutorId, slotId, slotData);

            expect(apiClient.put).toHaveBeenCalledWith('/availability/tutor-123/slots/slot-123', slotData);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('deleteSlot', () => {
        it('should delete an availability slot', async () => {
            const mockResponse = {
                message: 'Availability slot deleted successfully'
            };

            apiClient.delete.mockResolvedValue(mockResponse);

            const tutorId = 'tutor-123';
            const slotId = 'slot-123';

            const result = await availabilityService.deleteSlot(tutorId, slotId);

            expect(apiClient.delete).toHaveBeenCalledWith('/availability/tutor-123/slots/slot-123');
            expect(result).toEqual(mockResponse);
        });

        it('should handle deletion errors for slots with upcoming sessions', async () => {
            const errorMessage = 'Cannot delete availability slot with upcoming sessions';
            apiClient.delete.mockRejectedValue(new Error(errorMessage));

            const tutorId = 'tutor-123';
            const slotId = 'slot-123';

            await expect(availabilityService.deleteSlot(tutorId, slotId))
                .rejects.toThrow(errorMessage);
        });
    });

    describe('getAvailableTimeSlots', () => {
        it('should fetch available time slots for booking', async () => {
            const mockResponse = {
                availableSlots: [
                    {
                        date: '2024-01-15',
                        startTime: '09:00',
                        endTime: '10:00',
                        duration: 60
                    },
                    {
                        date: '2024-01-15',
                        startTime: '10:15',
                        endTime: '11:15',
                        duration: 60
                    }
                ],
                duration: 60
            };

            apiClient.get.mockResolvedValue(mockResponse);

            const tutorId = 'tutor-123';
            const params = {
                date: '2024-01-15',
                duration: 60
            };

            const result = await availabilityService.getAvailableTimeSlots(tutorId, params);

            expect(apiClient.get).toHaveBeenCalledWith('/availability/tutor-123/bookable?date=2024-01-15&duration=60');
            expect(result).toEqual(mockResponse);
        });
    });
});
