import apiClient from './apiClient';

class CalendarService {
    /**
     * Get calendar events (sessions + tasks) for a date range
     * @param {Object} filters - Filter options
     * @param {string} filters.startDate - Start date (ISO format)
     * @param {string} filters.endDate - End date (ISO format) 
     * @param {string} filters.type - Event type ('session', 'task', 'all')
     * @param {string} filters.status - Event status filter
     * @param {number} filters.limit - Maximum events to return
     * @param {string} filters.view - Calendar view ('month', 'week', 'day')
     * @returns {Promise<Object>} Calendar events data
     */
    async getCalendarEvents(filters = {}) {
        try {
            const queryParams = new URLSearchParams();

            // Add filters to query params
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.limit) queryParams.append('limit', filters.limit);
            if (filters.view) queryParams.append('view', filters.view);

            const endpoint = `/calendar/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

            console.log('[CalendarService] Making request to:', endpoint);
            const response = await apiClient.get(endpoint);
            console.log('[CalendarService] Response received:', response);

            // Ensure the response has the expected structure
            return {
                events: Array.isArray(response.events) ? response.events : [],
                eventsByDate: response.eventsByDate || {},
                total: response.total || 0,
                filters: response.filters || {},
                _isLiveData: true
            };
        } catch (error) {
            console.error('[CalendarService] Get calendar events failed:', error);
            console.error('[CalendarService] Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });

            // Check if it's an authentication issue
            if (error.response?.status === 401) {
                console.warn('[CalendarService] Authentication required - using sample data');
                return this.getSampleCalendarData(filters);
            }

            // Provide mock data for development/demo purposes when backend is unavailable
            if (error.response?.status === 404 || error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
                console.warn('[CalendarService] Backend unavailable, returning sample data');
                return this.getSampleCalendarData(filters);
            }

            throw error;
        }
    }    /**
     * Provide sample calendar data when backend is unavailable
     * @param {Object} filters - Filter options
     * @returns {Object} Sample calendar data
     */
    getSampleCalendarData(filters = {}) {
        const now = new Date();
        const events = [];

        // Generate sample events for the current month
        for (let i = 1; i <= 30; i++) {
            const eventDate = new Date(now.getFullYear(), now.getMonth(), i);

            // Add some random events
            if (Math.random() > 0.7) {
                const isSession = Math.random() > 0.5;
                const event = {
                    id: `sample-${i}`,
                    title: isSession ? `Tutoring Session ${i}` : `Study Task ${i}`,
                    description: isSession ? 'Mathematics tutoring session' : 'Complete homework assignment',
                    type: isSession ? 'session' : 'task',
                    status: ['scheduled', 'completed', 'pending'][Math.floor(Math.random() * 3)],
                    session_date: eventDate.toISOString().split('T')[0],
                    due_date: eventDate.toISOString().split('T')[0],
                    scheduled_at: eventDate.toISOString(),
                    start_time: '14:00',
                    end_time: '15:00',
                    duration_minutes: 60,
                    location: isSession ? 'Online' : null,
                    priority: isSession ? null : ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
                };
                events.push(event);
            }
        }

        // Group events by date
        const eventsByDate = {};
        events.forEach(event => {
            const dateKey = event.session_date || event.due_date;
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push(event);
        });

        return {
            events,
            eventsByDate,
            total: events.length,
            filters,
            _isSampleData: true
        };
    }

    /**
     * Get events for a specific date
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} type - Event type filter ('session', 'task', 'all')
     * @returns {Promise<Object>} Events for the specified date
     */
    async getEventsForDate(date, type = 'all') {
        try {
            const queryParams = new URLSearchParams();
            if (type && type !== 'all') queryParams.append('type', type);

            const endpoint = `/calendar/events/date/${date}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return {
                events: response.events || [],
                eventsByDate: response.eventsByDate || {},
                total: response.total || 0
            };
        } catch (error) {
            console.error('[CalendarService] Get events for date failed:', error);
            throw error;
        }
    }

    /**
     * Get calendar statistics for dashboard
     * @param {string} period - Time period ('week', 'month', 'year')
     * @returns {Promise<Object>} Calendar statistics
     */
    async getCalendarStats(period = 'month') {
        try {
            const queryParams = new URLSearchParams();
            if (period) queryParams.append('period', period);

            const endpoint = `/calendar/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get(endpoint);

            return {
                period: response.period,
                stats: response.stats || {}
            };
        } catch (error) {
            console.error('[CalendarService] Get calendar stats failed:', error);
            throw error;
        }
    }

    /**
     * Get events for the current month
     * @returns {Promise<Object>} Current month's events
     */
    async getCurrentMonthEvents() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        return this.getCalendarEvents({
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString(),
            type: 'all',
            view: 'month'
        });
    }

    /**
     * Get events for the current week
     * @returns {Promise<Object>} Current week's events
     */
    async getCurrentWeekEvents() {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

        return this.getCalendarEvents({
            startDate: startOfWeek.toISOString(),
            endDate: endOfWeek.toISOString(),
            type: 'all',
            view: 'week'
        });
    }

    /**
     * Get today's events
     * @returns {Promise<Object>} Today's events
     */
    async getTodayEvents() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        return this.getEventsForDate(dateStr);
    }

    /**
     * Get upcoming events (next 7 days)
     * @returns {Promise<Object>} Upcoming events
     */
    async getUpcomingEvents() {
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);

        return this.getCalendarEvents({
            startDate: now.toISOString(),
            endDate: nextWeek.toISOString(),
            type: 'all',
            status: 'scheduled'
        });
    }

    /**
     * Helper method to format date range for specific month/year
     * @param {number} month - Month (0-11)
     * @param {number} year - Full year
     * @returns {Object} Start and end dates for the month
     */
    getMonthDateRange(month, year) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
    }

    /**
     * Helper method to format date for API calls
     * @param {Date} date - JavaScript Date object
     * @returns {string} Formatted date string (YYYY-MM-DD)
     */
    formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Helper method to group events by date
     * @param {Array} events - Array of calendar events
     * @returns {Object} Events grouped by date
     */
    groupEventsByDate(events) {
        const grouped = {};

        events.forEach(event => {
            if (!grouped[event.date]) {
                grouped[event.date] = [];
            }
            grouped[event.date].push(event);
        });

        return grouped;
    }

    /**
     * Helper method to filter events by type
     * @param {Array} events - Array of calendar events
     * @param {string} type - Event type to filter by
     * @returns {Array} Filtered events
     */
    filterEventsByType(events, type) {
        if (type === 'all') return events;
        return events.filter(event => event.type === type);
    }

    /**
     * Helper method to sort events by date/time
     * @param {Array} events - Array of calendar events
     * @param {string} direction - Sort direction ('asc' or 'desc')
     * @returns {Array} Sorted events
     */
    sortEventsByDateTime(events, direction = 'asc') {
        return events.sort((a, b) => {
            const dateA = new Date(a.start);
            const dateB = new Date(b.start);

            if (direction === 'desc') {
                return dateB - dateA;
            }
            return dateA - dateB;
        });
    }
}

const calendarService = new CalendarService();
export default calendarService;