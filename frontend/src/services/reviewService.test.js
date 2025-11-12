import reviewService from './reviewService';
import apiClient from './apiClient';

// Mock the apiClient
jest.mock('./apiClient');

describe('reviewService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getByTutor', () => {
        it('should fetch reviews for a tutor with default params', async () => {
            const mockResponse = {
                reviews: [
                    {
                        id: '1',
                        rating: 5,
                        reviewText: 'Great tutor!',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        student: {
                            firstName: 'John',
                            lastName: 'Doe'
                        }
                    }
                ],
                pagination: {
                    total: 1,
                    limit: 5,
                    offset: 0,
                    hasMore: false
                }
            };

            apiClient.get.mockResolvedValue(mockResponse);

            const tutorId = 'tutor-123';
            const result = await reviewService.getByTutor(tutorId);

            expect(apiClient.get).toHaveBeenCalledWith('/reviews/tutor/tutor-123');
            expect(result).toEqual(mockResponse);
        });

        it('should fetch reviews with pagination params', async () => {
            const mockResponse = {
                reviews: [],
                pagination: {
                    total: 10,
                    limit: 5,
                    offset: 5,
                    hasMore: false
                }
            };

            apiClient.get.mockResolvedValue(mockResponse);

            const tutorId = 'tutor-123';
            const params = { limit: 5, offset: 5 };
            const result = await reviewService.getByTutor(tutorId, params);

            expect(apiClient.get).toHaveBeenCalledWith('/reviews/tutor/tutor-123?limit=5&offset=5');
            expect(result).toEqual(mockResponse);
        });

        it('should handle empty reviews', async () => {
            const mockResponse = {
                reviews: [],
                pagination: {
                    total: 0,
                    limit: 5,
                    offset: 0,
                    hasMore: false
                }
            };

            apiClient.get.mockResolvedValue(mockResponse);

            const tutorId = 'tutor-123';
            const result = await reviewService.getByTutor(tutorId);

            expect(result.reviews).toEqual([]);
            expect(result.pagination.total).toBe(0);
        });

        it('should handle API errors', async () => {
            const errorMessage = 'Network error';
            apiClient.get.mockRejectedValue(new Error(errorMessage));

            const tutorId = 'tutor-123';

            await expect(reviewService.getByTutor(tutorId)).rejects.toThrow(errorMessage);
        });
    });

    describe('create', () => {
        it('should create a review successfully', async () => {
            const mockResponse = {
                message: 'Review created successfully',
                review: {
                    id: 'review-123',
                    rating: 5,
                    reviewText: 'Excellent tutor',
                    isPublic: true,
                    createdAt: '2024-01-01T00:00:00.000Z'
                }
            };

            apiClient.post.mockResolvedValue(mockResponse);

            const payload = {
                sessionId: 'session-123',
                revieweeId: 'tutor-123',
                rating: 5,
                reviewText: 'Excellent tutor',
                isPublic: true
            };

            const result = await reviewService.create(payload);

            expect(apiClient.post).toHaveBeenCalledWith('/reviews', payload);
            expect(result).toEqual(mockResponse);
        });

        it('should handle validation errors', async () => {
            const errorMessage = 'Rating must be between 1 and 5';
            apiClient.post.mockRejectedValue(new Error(errorMessage));

            const payload = {
                sessionId: 'session-123',
                revieweeId: 'tutor-123',
                rating: 6, // Invalid rating
                reviewText: 'Test'
            };

            await expect(reviewService.create(payload)).rejects.toThrow(errorMessage);
        });
    });
});
