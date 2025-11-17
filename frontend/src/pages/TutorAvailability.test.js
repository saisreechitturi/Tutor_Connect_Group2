import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TutorAvailability from './TutorAvailability';
import { availabilityService } from '../services';
import { useAuth } from '../context/AuthContext';

// Mock the services and hooks
jest.mock('../services', () => ({
    availabilityService: {
        getAvailability: jest.fn(),
        createRecurringSlot: jest.fn(),
        createSpecificSlot: jest.fn(),
        updateSlot: jest.fn(),
        deleteSlot: jest.fn()
    }
}));

jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn()
}));

const mockUser = {
    id: 'tutor-123',
    role: 'tutor',
    firstName: 'John',
    lastName: 'Doe'
};

const mockAvailability = {
    availability: {
        recurringSlots: [
            {
                id: 'slot-1',
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '17:00',
                isAvailable: true
            },
            {
                id: 'slot-2',
                dayOfWeek: 3,
                startTime: '10:00',
                endTime: '16:00',

                isAvailable: true
            }
        ],
        specificSlots: [
            {
                id: 'slot-3',
                date: '2024-01-15',
                startTime: '09:00',
                endTime: '12:00',
                isAvailable: false
            }
        ]
    }
};

const renderTutorAvailability = () => {
    return render(
        <BrowserRouter>
            <TutorAvailability />
        </BrowserRouter>
    );
};

describe('TutorAvailability', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: mockUser });
    });

    it('should display loading state initially', () => {
        availabilityService.getAvailability.mockImplementation(() => new Promise(() => { }));

        renderTutorAvailability();

        expect(screen.getByText('Loading availability...')).toBeInTheDocument();
    });

    it('should display availability slots after loading', async () => {
        availabilityService.getAvailability.mockResolvedValue(mockAvailability);

        renderTutorAvailability();

        await waitFor(() => {
            expect(screen.getByText('Manage Availability')).toBeInTheDocument();
        });

        // Check that Monday slot is displayed
        expect(screen.getByText('Monday')).toBeInTheDocument();
        expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument();
        expect(screen.getByText(/Max 3 sessions/)).toBeInTheDocument();

        // Check that Wednesday slot is displayed
        expect(screen.getByText('Wednesday')).toBeInTheDocument();
        expect(screen.getByText('10:00 - 16:00')).toBeInTheDocument();
    });

    it('should display empty state when no recurring slots', async () => {
        availabilityService.getAvailability.mockResolvedValue({
            availability: {
                recurringSlots: [],
                specificSlots: []
            }
        });

        renderTutorAvailability();

        await waitFor(() => {
            expect(screen.getByText('No weekly availability set')).toBeInTheDocument();
        });

        expect(screen.getByText('Add Your First Time Slot')).toBeInTheDocument();
    });

    it('should display error state when loading fails', async () => {
        availabilityService.getAvailability.mockRejectedValue(new Error('Failed to load availability'));

        renderTutorAvailability();

        await waitFor(() => {
            expect(screen.getByText('Failed to load availability')).toBeInTheDocument();
        });

        expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should switch between tabs', async () => {
        availabilityService.getAvailability.mockResolvedValue(mockAvailability);

        renderTutorAvailability();

        await waitFor(() => {
            expect(screen.getByText('Manage Availability')).toBeInTheDocument();
        });

        // Initially on weekly tab
        expect(screen.getByText('Recurring Weekly Availability')).toBeInTheDocument();

        // Click specific dates tab
        const specificTab = screen.getByText('Specific Dates');
        fireEvent.click(specificTab);

        // Should show specific dates content
        expect(screen.getByText('Specific Date Overrides')).toBeInTheDocument();
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Blocked/)).toBeInTheDocument();
    });

    it('should handle delete slot with confirmation', async () => {
        availabilityService.getAvailability.mockResolvedValue(mockAvailability);
        availabilityService.deleteSlot.mockResolvedValue({ message: 'Slot deleted successfully' });

        // Mock window.confirm
        global.confirm = jest.fn(() => true);

        renderTutorAvailability();

        await waitFor(() => {
            expect(screen.getByText('Monday')).toBeInTheDocument();
        });

        // Find and click delete button for the first slot
        const deleteButtons = screen.getAllByLabelText('Delete slot');
        fireEvent.click(deleteButtons[0]);

        // Confirm dialog should be shown
        expect(global.confirm).toHaveBeenCalledWith(
            'Are you sure you want to delete this availability slot? This cannot be undone.'
        );

        await waitFor(() => {
            expect(availabilityService.deleteSlot).toHaveBeenCalledWith('tutor-123', 'slot-1');
        });
    });

    it('should not delete slot if user cancels confirmation', async () => {
        availabilityService.getAvailability.mockResolvedValue(mockAvailability);

        // Mock window.confirm to return false
        global.confirm = jest.fn(() => false);

        renderTutorAvailability();

        await waitFor(() => {
            expect(screen.getByText('Monday')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByLabelText('Delete slot');
        fireEvent.click(deleteButtons[0]);

        expect(global.confirm).toHaveBeenCalled();
        expect(availabilityService.deleteSlot).not.toHaveBeenCalled();
    });

    it('should show empty state for specific dates when none exist', async () => {
        availabilityService.getAvailability.mockResolvedValue({
            availability: {
                recurringSlots: mockAvailability.availability.recurringSlots,
                specificSlots: []
            }
        });

        renderTutorAvailability();

        await waitFor(() => {
            expect(screen.getByText('Manage Availability')).toBeInTheDocument();
        });

        // Switch to specific dates tab
        const specificTab = screen.getByText('Specific Dates');
        fireEvent.click(specificTab);

        expect(screen.getByText('No specific date overrides set')).toBeInTheDocument();
        expect(screen.getByText(/Use date overrides to block time off/)).toBeInTheDocument();
    });
});
