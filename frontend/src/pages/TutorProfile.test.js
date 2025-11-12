import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TutorProfile from './TutorProfile';
import { tutorService, reviewService } from '../services';

// Mock the services
jest.mock('../services', () => ({
    tutorService: {
        getTutorById: jest.fn()
    },
    reviewService: {
        getByTutor: jest.fn()
    }
}));

// Mock react-router-dom's useParams
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => ({ id: 'tutor-123' })
}));

const mockTutor = {
    id: 'tutor-123',
    firstName: 'John',
    lastName: 'Doe',
    rating: 4.5,
    totalSessions: 50,
    hourlyRate: 50,
    experienceYears: 5,
    subjects: [
        { id: '1', name: 'Mathematics' },
        { id: '2', name: 'Physics' }
    ],
    bio: 'Experienced tutor with 5 years of teaching.'
};

const mockReviews = {
    reviews: [
        {
            id: 'review-1',
            rating: 5,
            reviewText: 'Excellent tutor!',
            createdAt: '2024-01-01T00:00:00.000Z',
            subjectName: 'Mathematics',
            student: {
                firstName: 'Jane',
                lastName: 'Smith',
                avatar: null
            }
        },
        {
            id: 'review-2',
            rating: 4,
            reviewText: 'Very helpful',
            createdAt: '2024-01-02T00:00:00.000Z',
            subjectName: 'Physics',
            student: {
                firstName: 'Bob',
                lastName: 'Johnson',
                avatar: null
            }
        }
    ],
    pagination: {
        total: 2,
        limit: 5,
        offset: 0,
        hasMore: false
    }
};

const renderTutorProfile = () => {
    return render(
        <BrowserRouter>
            <TutorProfile />
        </BrowserRouter>
    );
};

describe('TutorProfile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display loading state initially', () => {
        tutorService.getTutorById.mockImplementation(() => new Promise(() => {}));
        reviewService.getByTutor.mockImplementation(() => new Promise(() => {}));

        renderTutorProfile();

        expect(screen.getByText('Loading tutor profile...')).toBeInTheDocument();
    });

    it('should display tutor profile with reviews', async () => {
        tutorService.getTutorById.mockResolvedValue(mockTutor);
        reviewService.getByTutor.mockResolvedValue(mockReviews);

        renderTutorProfile();

        // Wait for tutor data to load
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Check tutor details
        expect(screen.getByRole('heading', { name: 'John Doe' })).toBeInTheDocument();
        expect(screen.getByText('Mathematics')).toBeInTheDocument();
        expect(screen.getByText('Physics')).toBeInTheDocument();

        // Wait for reviews to load
        await waitFor(() => {
            expect(screen.getByText('Excellent tutor!')).toBeInTheDocument();
        });

        // Check reviews
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Very helpful')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should display empty state when no reviews', async () => {
        tutorService.getTutorById.mockResolvedValue(mockTutor);
        reviewService.getByTutor.mockResolvedValue({
            reviews: [],
            pagination: {
                total: 0,
                limit: 5,
                offset: 0,
                hasMore: false
            }
        });

        renderTutorProfile();

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('No reviews yet')).toBeInTheDocument();
        });

        expect(screen.getByText('Be the first to book a session and leave a review!')).toBeInTheDocument();
    });

    it('should display error state when reviews fail to load', async () => {
        tutorService.getTutorById.mockResolvedValue(mockTutor);
        reviewService.getByTutor.mockRejectedValue(new Error('Failed to fetch reviews'));

        renderTutorProfile();

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch reviews')).toBeInTheDocument();
        });

        expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should retry loading reviews when Try Again is clicked', async () => {
        tutorService.getTutorById.mockResolvedValue(mockTutor);
        reviewService.getByTutor
            .mockRejectedValueOnce(new Error('Failed to fetch reviews'))
            .mockResolvedValueOnce(mockReviews);

        renderTutorProfile();

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch reviews')).toBeInTheDocument();
        });

        const retryButton = screen.getByText('Try Again');
        fireEvent.click(retryButton);

        await waitFor(() => {
            expect(screen.getByText('Excellent tutor!')).toBeInTheDocument();
        });
    });

    it('should handle pagination', async () => {
        tutorService.getTutorById.mockResolvedValue(mockTutor);
        reviewService.getByTutor.mockResolvedValue({
            reviews: mockReviews.reviews,
            pagination: {
                total: 10,
                limit: 5,
                offset: 0,
                hasMore: true
            }
        });

        renderTutorProfile();

        await waitFor(() => {
            expect(screen.getByText('Showing 1 - 5 of 10')).toBeInTheDocument();
        });

        const nextButton = screen.getByText('Next');
        expect(nextButton).not.toBeDisabled();

        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
    });
});
