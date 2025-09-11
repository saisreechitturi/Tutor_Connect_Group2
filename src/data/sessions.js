// Mock sessions data
export const sessions = [
    {
        id: 1,
        studentId: 1, // Alice
        tutorId: 2, // Bob
        subject: "React Development",
        status: "completed",
        scheduledDate: "2024-09-05",
        scheduledTime: "14:00",
        duration: 60, // minutes
        price: 45,
        meetingLink: "https://zoom.us/j/123456789",
        notes: "Focus on component lifecycle and hooks",
        feedback: {
            studentRating: 5,
            tutorRating: 5,
            studentComment: "Excellent explanation of React hooks!",
            tutorComment: "Alice is a quick learner, great questions!"
        },
        createdAt: "2024-09-01",
        updatedAt: "2024-09-05"
    },
    {
        id: 2,
        studentId: 4, // David
        tutorId: 5, // Emma
        subject: "Calculus II",
        status: "scheduled",
        scheduledDate: "2024-09-15",
        scheduledTime: "10:00",
        duration: 90,
        price: 90,
        meetingLink: "https://zoom.us/j/987654321",
        notes: "Integration by parts and advanced techniques",
        feedback: null,
        createdAt: "2024-09-10",
        updatedAt: "2024-09-10"
    },
    {
        id: 3,
        studentId: 1, // Alice
        tutorId: 5, // Emma
        subject: "Statistics",
        status: "pending",
        scheduledDate: "2024-09-20",
        scheduledTime: "15:00",
        duration: 60,
        price: 60,
        meetingLink: null,
        notes: "Hypothesis testing and confidence intervals",
        feedback: null,
        createdAt: "2024-09-11",
        updatedAt: "2024-09-11"
    }
];

// Mock session statistics
export const sessionStats = {
    totalSessions: 156,
    completedSessions: 142,
    upcomingSessions: 8,
    cancelledSessions: 6,
    averageRating: 4.7
};