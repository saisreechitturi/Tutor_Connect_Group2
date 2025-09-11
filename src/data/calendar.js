// Mock calendar events
export const calendarEvents = [
    {
        id: 1,
        userId: 1, // Alice
        title: "React Tutoring Session",
        description: "One-on-one React development session with Bob",
        type: "session",
        date: "2024-09-15",
        startTime: "14:00",
        endTime: "15:00",
        location: "Online - Zoom",
        attendees: ["bob@example.com"],
        color: "blue",
        reminders: [
            { type: "email", minutes: 60 },
            { type: "notification", minutes: 15 }
        ],
        recurring: false,
        sessionId: 2
    },
    {
        id: 2,
        userId: 1,
        title: "Statistics Midterm Exam",
        description: "Statistics 201 midterm examination",
        type: "exam",
        date: "2024-09-25",
        startTime: "09:00",
        endTime: "11:00",
        location: "Room 205, Science Building",
        attendees: [],
        color: "red",
        reminders: [
            { type: "email", minutes: 1440 }, // 24 hours
            { type: "notification", minutes: 60 }
        ],
        recurring: false
    },
    {
        id: 3,
        userId: 1,
        title: "React Router Tutorial Due",
        description: "Complete the React Router tutorial assignment",
        type: "deadline",
        date: "2024-09-18",
        startTime: "23:59",
        endTime: "23:59",
        location: "Online submission",
        attendees: [],
        color: "orange",
        reminders: [
            { type: "notification", minutes: 120 }
        ],
        recurring: false,
        taskId: 1
    },
    {
        id: 4,
        userId: 1,
        title: "Weekly Study Group",
        description: "Computer Science study group meeting",
        type: "study-group",
        date: "2024-09-17",
        startTime: "18:00",
        endTime: "20:00",
        location: "Library Room 301",
        attendees: ["david@example.com", "sarah@example.com"],
        color: "green",
        reminders: [
            { type: "notification", minutes: 30 }
        ],
        recurring: true,
        recurringPattern: "weekly"
    },
    {
        id: 5,
        userId: 1,
        title: "Calculus Study Session",
        description: "Self-study session for integration problems",
        type: "personal",
        date: "2024-09-16",
        startTime: "15:00",
        endTime: "17:00",
        location: "Home",
        attendees: [],
        color: "purple",
        reminders: [
            { type: "notification", minutes: 15 }
        ],
        recurring: false
    }
];

// Event types
export const eventTypes = [
    { value: "session", label: "Tutoring Session", color: "blue" },
    { value: "exam", label: "Exam", color: "red" },
    { value: "deadline", label: "Assignment Deadline", color: "orange" },
    { value: "study-group", label: "Study Group", color: "green" },
    { value: "personal", label: "Personal Study", color: "purple" }
];

// Calendar view modes
export const viewModes = [
    { value: "month", label: "Month" },
    { value: "week", label: "Week" },
    { value: "day", label: "Day" },
    { value: "agenda", label: "Agenda" }
];