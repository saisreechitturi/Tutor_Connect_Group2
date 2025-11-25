/**
 * iCalendar (ICS) File Generator Utility
 * Generates RFC 5545 compliant iCalendar files for calendar export
 */

/**
 * Formats a date to iCalendar format (YYYYMMDDTHHMMSSZ)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
const formatICalDate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return '';
    }

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

/**
 * Escapes special characters for iCalendar text fields
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeICalText = (text) => {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
};

/**
 * Generates a unique identifier for an event
 * @param {object} event - Event object
 * @returns {string} Unique identifier
 */
const generateUID = (event) => {
    const timestamp = new Date().getTime();
    const eventId = event.id || event.taskId || Math.random().toString(36).substring(7);
    return `${eventId}-${timestamp}@tutorconnect.app`;
};

/**
 * Calculates end time for an event
 * @param {Date} startDate - Start date
 * @param {number} duration - Duration in hours (default: 1)
 * @returns {Date} End date
 */
const calculateEndTime = (startDate, duration = 1) => {
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + duration);
    return endDate;
};

/**
 * Gets the start date/time for an event
 * @param {object} event - Event object
 * @returns {Date|null} Start date
 */
const getEventStartDate = (event) => {
    const possibleDates = [
        event.session_date,
        event.scheduled_start,
        event.scheduledStart,
        event.due_date,
        event.dueDate,
        event.scheduled_at,
        event.scheduledAt,
        event.start,
        event.createdAt,
        event.created_at
    ];

    for (const dateField of possibleDates) {
        if (dateField) {
            const testDate = new Date(dateField);
            if (!isNaN(testDate.getTime())) {
                return testDate;
            }
        }
    }
    return null;
};

/**
 * Converts a calendar event to iCalendar VEVENT format
 * @param {object} event - Event object
 * @returns {string} VEVENT component
 */
const createVEvent = (event) => {
    const startDate = getEventStartDate(event);
    if (!startDate) {
        console.warn('Event has no valid date:', event);
        return '';
    }

    // Determine event duration based on type
    let duration = 1; // Default 1 hour
    if (event.type === 'session') {
        duration = event.duration || 1;
    } else if (event.type === 'task') {
        duration = event.estimatedHours || event.estimated_hours || 1;
    }

    const endDate = calculateEndTime(startDate, duration);
    const now = new Date();

    // Build event title
    let title = event.title || event.description || 'Untitled Event';
    if (event.type === 'session') {
        title = `📚 ${title}`;
    } else if (event.type === 'task') {
        title = `✓ ${title}`;
    }

    // Build description
    let description = '';
    if (event.type === 'session') {
        description = `Session Type: ${event.session_type || 'Tutoring'}\\n`;
        if (event.tutor_name) description += `Tutor: ${event.tutor_name}\\n`;
        if (event.student_name) description += `Student: ${event.student_name}\\n`;
        if (event.notes) description += `Notes: ${event.notes}\\n`;
        description += `Status: ${event.status || 'scheduled'}`;
    } else if (event.type === 'task') {
        description = `Task Priority: ${event.priority || 'medium'}\\n`;
        if (event.subject) description += `Subject: ${event.subject}\\n`;
        if (event.progress !== undefined) description += `Progress: ${event.progress}%\\n`;
        if (event.notes) description += `Notes: ${event.notes}\\n`;
        description += `Status: ${event.status || 'pending'}`;
    }

    // Build location
    let location = '';
    if (event.location) {
        location = event.location;
    } else if (event.meeting_link) {
        location = event.meeting_link;
    }

    // Determine status
    let eventStatus = 'CONFIRMED';
    if (event.status === 'cancelled') {
        eventStatus = 'CANCELLED';
    } else if (event.status === 'pending') {
        eventStatus = 'TENTATIVE';
    }

    // Build VEVENT
    let vevent = 'BEGIN:VEVENT\r\n';
    vevent += `UID:${generateUID(event)}\r\n`;
    vevent += `DTSTAMP:${formatICalDate(now)}\r\n`;
    vevent += `DTSTART:${formatICalDate(startDate)}\r\n`;
    vevent += `DTEND:${formatICalDate(endDate)}\r\n`;
    vevent += `SUMMARY:${escapeICalText(title)}\r\n`;

    if (description) {
        vevent += `DESCRIPTION:${escapeICalText(description)}\r\n`;
    }

    if (location) {
        vevent += `LOCATION:${escapeICalText(location)}\r\n`;
    }

    vevent += `STATUS:${eventStatus}\r\n`;

    // Add priority for tasks
    if (event.type === 'task' && event.priority) {
        const priorityMap = {
            'urgent': '1',
            'high': '3',
            'medium': '5',
            'low': '7'
        };
        vevent += `PRIORITY:${priorityMap[event.priority] || '5'}\r\n`;
    }

    // Add alarm for upcoming events
    if (event.status !== 'completed' && event.status !== 'cancelled') {
        vevent += 'BEGIN:VALARM\r\n';
        vevent += 'TRIGGER:-PT15M\r\n'; // 15 minutes before
        vevent += 'ACTION:DISPLAY\r\n';
        vevent += `DESCRIPTION:Reminder: ${escapeICalText(title)}\r\n`;
        vevent += 'END:VALARM\r\n';
    }

    vevent += 'END:VEVENT\r\n';

    return vevent;
};

/**
 * Generates a complete iCalendar file from events
 * @param {Array} events - Array of event objects
 * @param {string} calendarName - Name for the calendar
 * @returns {string} Complete iCalendar file content
 */
export const generateICalendar = (events, calendarName = 'TutorConnect Calendar') => {
    if (!Array.isArray(events) || events.length === 0) {
        throw new Error('No events provided for export');
    }

    let ical = 'BEGIN:VCALENDAR\r\n';
    ical += 'VERSION:2.0\r\n';
    ical += 'PRODID:-//TutorConnect//Calendar Export//EN\r\n';
    ical += 'CALSCALE:GREGORIAN\r\n';
    ical += 'METHOD:PUBLISH\r\n';
    ical += `X-WR-CALNAME:${escapeICalText(calendarName)}\r\n`;
    ical += 'X-WR-TIMEZONE:UTC\r\n';
    ical += `X-WR-CALDESC:Calendar exported from TutorConnect\r\n`;

    // Add each event
    events.forEach(event => {
        const vevent = createVEvent(event);
        if (vevent) {
            ical += vevent;
        }
    });

    ical += 'END:VCALENDAR\r\n';

    return ical;
};

/**
 * Downloads an iCalendar file
 * @param {string} icalContent - iCalendar content
 * @param {string} filename - Filename for the download
 */
export const downloadICalendar = (icalContent, filename = 'calendar.ics') => {
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

/**
 * Exports calendar events to an iCalendar file
 * @param {Array} events - Array of event objects
 * @param {string} calendarName - Name for the calendar
 * @param {string} filename - Filename for the download
 */
export const exportToICalendar = (events, calendarName = 'TutorConnect Calendar', filename = null) => {
    try {
        const icalContent = generateICalendar(events, calendarName);
        const defaultFilename = `tutorconnect-calendar-${new Date().toISOString().split('T')[0]}.ics`;
        downloadICalendar(icalContent, filename || defaultFilename);
        return { success: true, message: 'Calendar exported successfully' };
    } catch (error) {
        console.error('Error exporting calendar:', error);
        return { success: false, message: error.message };
    }
};

export default {
    generateICalendar,
    downloadICalendar,
    exportToICalendar
};
