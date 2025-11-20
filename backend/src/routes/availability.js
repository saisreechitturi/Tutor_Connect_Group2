const express = require('express');
const { body, query: expressQuery, validationResult } = require('express-validator');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Get tutor availability slots
router.get('/:tutorId', [
    authenticateToken,
    expressQuery('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
    expressQuery('weekStart').optional().isISO8601().withMessage('Week start must be a valid ISO date'),
    expressQuery('includeBooked').optional().isBoolean().withMessage('Include booked must be a boolean')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { tutorId } = req.params;
    const { date, weekStart, includeBooked = false } = req.query;

    // Get recurring availability slots
    const recurringSlots = await query(`
        SELECT *
        FROM tutor_availability_slots
        WHERE tutor_id = $1 
        AND is_recurring = true 
        AND is_available = true
        ORDER BY day_of_week, start_time
    `, [tutorId]);



    // Get existing bookings to check availability
    let bookings = [];
    if (date || weekStart) {
        let dateFilter = '';
        let dateParams = [tutorId];

        if (date) {
            dateFilter = 'AND session_date = $2';
            dateParams.push(date);
        } else if (weekStart) {
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            dateFilter = 'AND session_date BETWEEN $2 AND $3';
            dateParams.push(weekStart, weekEnd.toISOString().split('T')[0]);
        }

        const bookingResult = await query(`
            SELECT session_date, start_time, end_time, status,
                   u.first_name as student_first_name,
                   u.last_name as student_last_name,
                   s.name as subject_name
            FROM tutoring_sessions ts
            JOIN users u ON ts.student_id = u.id
            LEFT JOIN subjects s ON ts.subject_id = s.id
            WHERE ts.tutor_id = $1 ${dateFilter}
            AND status IN ('scheduled', 'in-progress')
        `, dateParams);

        bookings = bookingResult.rows;
    }

    // Process availability for the requested period
    const availability = {
        recurringSlots: recurringSlots.rows.map(slot => ({
            id: slot.id,
            dayOfWeek: slot.day_of_week,
            startTime: slot.start_time,
            endTime: slot.end_time,
            isAvailable: slot.is_available
        })),

    };

    if (includeBooked) {
        availability.bookings = bookings.map(booking => ({
            date: booking.session_date,
            startTime: booking.start_time,
            endTime: booking.end_time,
            status: booking.status,
            studentName: `${booking.student_first_name} ${booking.student_last_name}`,
            subjectName: booking.subject_name
        }));
    }

    res.json({ availability });
}));

// Get available time slots for a specific date
router.get('/:tutorId/slots', [
    authenticateToken,
    expressQuery('date').isISO8601().withMessage('Date is required and must be valid'),
    expressQuery('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15-480 minutes')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { tutorId } = req.params;
    const { date, duration = 60 } = req.query;

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get tutor's recurring availability for this day
    const availabilitySlots = await query(`
        SELECT * FROM tutor_availability_slots
        WHERE tutor_id = $1 
        AND day_of_week = $2 
        AND is_available = true
        AND is_recurring = true
        ORDER BY start_time
    `, [tutorId, dayOfWeek]);

    // Get existing bookings for this date
    const existingBookings = await query(`
        SELECT scheduled_start, scheduled_end
        FROM tutoring_sessions
        WHERE tutor_id = $1 
        AND DATE(scheduled_start) = $2
        AND status NOT IN ('cancelled', 'rejected')
    `, [tutorId, date]);

    // Generate available time slots
    const availableSlots = [];
    const durationMs = parseInt(duration) * 60 * 1000;

    for (const slot of availabilitySlots.rows) {
        const slotStart = new Date(`${date}T${slot.start_time}`);
        const slotEnd = new Date(`${date}T${slot.end_time}`);

        // Generate 15-minute intervals within the slot
        let currentTime = new Date(slotStart);

        while (currentTime.getTime() + durationMs <= slotEnd.getTime()) {
            const slotEndTime = new Date(currentTime.getTime() + durationMs);

            // Check if this time slot conflicts with existing bookings
            const hasConflict = existingBookings.rows.some(booking => {
                const bookingStart = new Date(booking.scheduled_start);
                const bookingEnd = new Date(booking.scheduled_end);

                return !(slotEndTime <= bookingStart || currentTime >= bookingEnd);
            });

            if (!hasConflict && currentTime > new Date()) {
                availableSlots.push({
                    startTime: currentTime.toTimeString().slice(0, 5),
                    endTime: slotEndTime.toTimeString().slice(0, 5),
                    duration: parseInt(duration)
                });
            }

            // Move to next 15-minute interval
            currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
        }
    }

    res.json({
        date,
        tutorId,
        availableSlots: availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))
    });
}));

// Get availability overview for multiple dates (for calendar highlighting)
router.get('/:tutorId/overview', [
    authenticateToken,
    expressQuery('startDate').isISO8601().withMessage('Start date is required and must be valid'),
    expressQuery('endDate').isISO8601().withMessage('End date is required and must be valid'),
    expressQuery('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15-480 minutes')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { tutorId } = req.params;
    const { startDate, endDate, duration = 60 } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateAvailability = {};

    // Get tutor's recurring availability
    const availabilitySlots = await query(`
        SELECT * FROM tutor_availability_slots
        WHERE tutor_id = $1 
        AND is_available = true
        AND is_recurring = true
        ORDER BY day_of_week, start_time
    `, [tutorId]);

    // Get existing bookings for the date range
    const existingBookings = await query(`
        SELECT DATE(scheduled_start) as session_date, scheduled_start, scheduled_end
        FROM tutoring_sessions
        WHERE tutor_id = $1 
        AND DATE(scheduled_start) BETWEEN $2 AND $3
        AND status NOT IN ('cancelled', 'rejected')
        ORDER BY scheduled_start
    `, [tutorId, startDate, endDate]);

    const bookingsByDate = {};
    existingBookings.rows.forEach(booking => {
        const dateKey = booking.session_date.toISOString().split('T')[0];
        if (!bookingsByDate[dateKey]) {
            bookingsByDate[dateKey] = [];
        }
        bookingsByDate[dateKey].push(booking);
    });

    // Check each date in the range
    const currentDate = new Date(start);
    while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();

        // Find availability slots for this day of week
        const daySlots = availabilitySlots.rows.filter(slot => slot.day_of_week === dayOfWeek);
        let hasAvailability = false;
        let totalSlots = 0;

        for (const slot of daySlots) {
            const slotStart = new Date(`${dateStr}T${slot.start_time}`);
            const slotEnd = new Date(`${dateStr}T${slot.end_time}`);
            const durationMs = parseInt(duration) * 60 * 1000;

            // Generate time slots for this availability window
            let currentTime = new Date(slotStart);
            while (currentTime.getTime() + durationMs <= slotEnd.getTime()) {
                const slotEndTime = new Date(currentTime.getTime() + durationMs);

                // Check if this time slot conflicts with existing bookings
                const dateBookings = bookingsByDate[dateStr] || [];
                const hasConflict = dateBookings.some(booking => {
                    const bookingStart = new Date(booking.scheduled_start);
                    const bookingEnd = new Date(booking.scheduled_end);
                    return !(slotEndTime <= bookingStart || currentTime >= bookingEnd);
                });

                if (!hasConflict && currentTime > new Date()) {
                    hasAvailability = true;
                    totalSlots++;
                }

                // Move to next 15-minute interval
                currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
            }
        }

        dateAvailability[dateStr] = {
            hasAvailability,
            totalSlots,
            dayOfWeek
        };

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
        tutorId,
        startDate,
        endDate,
        duration: parseInt(duration),
        dateAvailability
    });
}));

// Add/Update recurring availability slot
router.post('/:tutorId/recurring', [
    authenticateToken,
    body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6 (0=Sunday)'),
    body('startTime').isTime().withMessage('Start time must be in HH:MM format'),
    body('endTime').isTime().withMessage('End time must be in HH:MM format')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { tutorId } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== tutorId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Validate time range
    if (startTime >= endTime) {
        return res.status(400).json({ message: 'Start time must be before end time' });
    }

    // Check for overlapping slots
    const overlappingSlots = await query(`
        SELECT id FROM tutor_availability_slots
        WHERE tutor_id = $1 
        AND day_of_week = $2
        AND is_recurring = true
        AND (
            (start_time <= $3 AND end_time > $3) OR
            (start_time < $4 AND end_time >= $4) OR
            (start_time >= $3 AND end_time <= $4)
        )
    `, [tutorId, dayOfWeek, startTime, endTime]);

    if (overlappingSlots.rows.length > 0) {
        return res.status(409).json({ message: 'This time slot overlaps with existing availability' });
    }

    // Create new availability slot
    const result = await query(`
        INSERT INTO tutor_availability_slots 
        (tutor_id, day_of_week, start_time, end_time, is_recurring)
        VALUES ($1, $2, $3, $4, true)
        RETURNING *
    `, [tutorId, dayOfWeek, startTime, endTime]);

    const slot = result.rows[0];
    logger.info(`Recurring availability slot created for tutor ${tutorId}: Day ${dayOfWeek}, ${startTime}-${endTime}`);

    res.status(201).json({
        message: 'Availability slot created successfully',
        slot: {
            id: slot.id,
            dayOfWeek: slot.day_of_week,
            startTime: slot.start_time,
            endTime: slot.end_time
        }
    });
}));



// Update availability slot
router.put('/:tutorId/slots/:slotId', [
    authenticateToken,
    body('startTime').optional().isTime().withMessage('Start time must be in HH:MM format'),
    body('endTime').optional().isTime().withMessage('End time must be in HH:MM format'),
    body('isAvailable').optional().isBoolean().withMessage('Is available must be a boolean')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { tutorId, slotId } = req.params;
    const { startTime, endTime, isAvailable } = req.body;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== tutorId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Check if slot exists and belongs to tutor
    const slotCheck = await query(`
        SELECT * FROM tutor_availability_slots
        WHERE id = $1 AND tutor_id = $2
    `, [slotId, tutorId]);

    if (slotCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Availability slot not found' });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (startTime !== undefined) {
        updates.push(`start_time = $${params.length + 1}`);
        params.push(startTime);
    }
    if (endTime !== undefined) {
        updates.push(`end_time = $${params.length + 1}`);
        params.push(endTime);
    }
    if (isAvailable !== undefined) {
        updates.push(`is_available = $${params.length + 1}`);
        params.push(isAvailable);
    }



    if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(slotId);

    await query(`
        UPDATE tutor_availability_slots
        SET ${updates.join(', ')}
        WHERE id = $${params.length}
    `, params);

    logger.info(`Availability slot ${slotId} updated for tutor ${tutorId}`);
    res.json({ message: 'Availability slot updated successfully' });
}));

// Delete availability slot
router.delete('/:tutorId/slots/:slotId', [
    authenticateToken
], asyncHandler(async (req, res) => {
    const { tutorId, slotId } = req.params;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== tutorId) {
        return res.status(403).json({ message: 'Access denied' });
    }

    // Check if slot exists and belongs to tutor
    const slotCheck = await query(`
        SELECT * FROM tutor_availability_slots
        WHERE id = $1 AND tutor_id = $2
    `, [slotId, tutorId]);

    if (slotCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Availability slot not found' });
    }

    // Check if there are any upcoming sessions in this slot
    const slot = slotCheck.rows[0];
    let upcomingSessionsCount = 0;

    if (slot.is_recurring) {
        const upcomingSessions = await query(`
            SELECT COUNT(*) as count
            FROM tutoring_sessions
            WHERE tutor_id = $1
            AND status IN ('scheduled', 'in-progress')
            AND EXTRACT(DOW FROM scheduled_start) = $2
            AND scheduled_start::time >= $3 AND scheduled_start::time < $4
            AND scheduled_start >= CURRENT_DATE
        `, [tutorId, slot.day_of_week, slot.start_time, slot.end_time]);

        upcomingSessionsCount = parseInt(upcomingSessions.rows[0].count);
    } else if (slot.specific_date) {
        const upcomingSessions = await query(`
            SELECT COUNT(*) as count
            FROM tutoring_sessions
            WHERE tutor_id = $1
            AND status IN ('scheduled', 'in-progress')
            AND scheduled_start::date = $2
            AND scheduled_start::time >= $3 AND scheduled_start::time < $4
        `, [tutorId, slot.specific_date, slot.start_time, slot.end_time]);

        upcomingSessionsCount = parseInt(upcomingSessions.rows[0].count);
    }

    if (upcomingSessionsCount > 0) {
        return res.status(409).json({
            message: 'Cannot delete availability slot with upcoming sessions. Cancel or reschedule sessions first.'
        });
    }

    // Delete the slot
    await query('DELETE FROM tutor_availability_slots WHERE id = $1', [slotId]);

    logger.info(`Availability slot ${slotId} deleted for tutor ${tutorId}`);
    res.json({ message: 'Availability slot deleted successfully' });
}));

// Get available time slots for booking (public endpoint)
router.get('/:tutorId/bookable', [
    expressQuery('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
    expressQuery('weekStart').optional().isISO8601().withMessage('Week start must be a valid ISO date'),
    expressQuery('duration').optional().isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { tutorId } = req.params;
    const { date, weekStart, duration = 60 } = req.query;

    // Generate available slots for booking
    const dates = [];
    if (date) {
        dates.push(date);
    } else if (weekStart) {
        const start = new Date(weekStart);
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);
            dates.push(currentDate.toISOString().split('T')[0]);
        }
    } else {
        // Default to next 7 days
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            dates.push(futureDate.toISOString().split('T')[0]);
        }
    }

    const availableSlots = [];

    for (const targetDate of dates) {
        const dayOfWeek = new Date(targetDate).getDay();

        // Get availability for this date
        const availability = await query(`
            SELECT start_time, end_time
            FROM tutor_availability_slots
            WHERE tutor_id = $1
            AND (
                (is_recurring = true AND day_of_week = $2) OR
                (is_recurring = false AND specific_date = $3)
            )
            AND is_available = true
        `, [tutorId, dayOfWeek, targetDate]);

        // Get existing bookings for this date
        const bookings = await query(`
            SELECT scheduled_start, scheduled_end
            FROM tutoring_sessions
            WHERE tutor_id = $1 AND DATE(scheduled_start) = $2
            AND status IN ('scheduled', 'in-progress')
        `, [tutorId, targetDate]);

        // Calculate available time slots
        for (const slot of availability.rows) {
            const slotStart = new Date(`${targetDate}T${slot.start_time}`);
            const slotEnd = new Date(`${targetDate}T${slot.end_time}`);
            const sessionDuration = parseInt(duration);

            let currentTime = new Date(slotStart);

            while (currentTime.getTime() + (sessionDuration * 60000) <= slotEnd.getTime()) {
                const sessionStart = new Date(currentTime);
                const sessionEnd = new Date(currentTime.getTime() + (sessionDuration * 60000));

                // Check if this time conflicts with existing bookings
                const hasConflict = bookings.rows.some(booking => {
                    const bookingStart = new Date(booking.scheduled_start);
                    const bookingEnd = new Date(booking.scheduled_end);

                    return (
                        (sessionStart < bookingEnd && sessionEnd > bookingStart)
                    );
                });

                // Check if it's not in the past
                const now = new Date();
                const isPast = sessionStart <= now;

                if (!hasConflict && !isPast) {
                    availableSlots.push({
                        date: targetDate,
                        startTime: sessionStart.toTimeString().substring(0, 5),
                        endTime: sessionEnd.toTimeString().substring(0, 5),
                        duration: sessionDuration
                    });
                }

                // Move to next 15-minute slot
                currentTime = new Date(currentTime.getTime() + (15 * 60000));
            }
        }
    }

    res.json({
        availableSlots: availableSlots.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
        }),
        duration: parseInt(duration)
    });
}));

// Set tutor availability (simplified route for profile setup)
router.post('/', [
    authenticateToken,
    body('availability').isObject().withMessage('Availability must be an object')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const tutorId = req.user.id;
    const { availability } = req.body;

    // Check if user is a tutor
    const userResult = await query('SELECT role FROM users WHERE id = $1', [tutorId]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'tutor') {
        return res.status(403).json({ message: 'Access denied. Only tutors can set availability.' });
    }

    // Delete existing recurring availability for this tutor
    await query('DELETE FROM tutor_availability_slots WHERE tutor_id = $1 AND is_recurring = true', [tutorId]);

    // Insert new availability slots
    const dayMap = {
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
        'sunday': 0
    };

    for (const [dayName, dayData] of Object.entries(availability)) {
        if (dayData.available && dayData.slots && dayData.slots.length > 0) {
            const dayOfWeek = dayMap[dayName.toLowerCase()];

            for (const slot of dayData.slots) {
                await query(`
                    INSERT INTO tutor_availability_slots 
                    (tutor_id, day_of_week, start_time, end_time, is_recurring, is_available)
                    VALUES ($1, $2, $3, $4, $5, true)
                `, [tutorId, dayOfWeek, slot.startTime, slot.endTime, true]);
            }
        }
    }

    logger.info(`Availability set for tutor ${tutorId}`);
    res.json({ message: 'Availability updated successfully' });
}));

module.exports = router;