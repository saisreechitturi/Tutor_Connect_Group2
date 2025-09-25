// Mock AI chatbot responses and interactions
export const aiResponses = {
    // Platform-related questions
    "how to book": "To book a tutoring session: 1) Go to 'Find Tutors', 2) Browse available tutors by subject, 3) Click on a tutor's profile, 4) Select 'Book Session', 5) Choose your preferred date and time, 6) Confirm booking and payment details.",

    "payment": "We accept all major credit cards and PayPal. Payment is processed securely through Stripe. You'll be charged only after your session is completed successfully.",

    "cancel session": "You can cancel a session up to 24 hours before the scheduled time for a full refund. To cancel: go to 'My Sessions', find your booking, and click 'Cancel Session'.",

    "find tutors": "Use our tutor search to filter by subject, price range, rating, and availability. You can also read reviews from other students to find the perfect match for your learning style.",

    // Study help
    "study tips": "Here are some effective study tips: 1) Create a consistent study schedule, 2) Break large topics into smaller chunks, 3) Use active recall techniques, 4) Take regular breaks (Pomodoro technique), 5) Find a quiet study environment, 6) Practice retrieval with flashcards or quizzes.",

    "time management": "Effective time management strategies: 1) Use a planner or digital calendar, 2) Prioritize tasks by importance and deadline, 3) Set specific, achievable goals, 4) Eliminate distractions during study time, 5) Use time-blocking techniques, 6) Review and adjust your schedule regularly.",

    "motivation": "Staying motivated while studying: 1) Set clear, specific goals, 2) Reward yourself for completing tasks, 3) Study with friends or join study groups, 4) Remember your long-term objectives, 5) Take breaks to avoid burnout, 6) Celebrate small victories along the way.",

    // Subject-specific help
    "javascript": "JavaScript learning path: 1) Master the basics (variables, functions, loops), 2) Learn DOM manipulation, 3) Understand asynchronous programming (promises, async/await), 4) Practice with projects, 5) Learn a framework like React or Vue, 6) Build a portfolio project.",

    "calculus": "Calculus study approach: 1) Master algebra and trigonometry first, 2) Understand limits conceptually, 3) Practice derivatives systematically, 4) Learn integration techniques step by step, 5) Work through plenty of practice problems, 6) Connect concepts to real-world applications.",

    "react": "Learning React effectively: 1) Understand JavaScript ES6+ features first, 2) Learn JSX syntax, 3) Master components and props, 4) Understand state management, 5) Learn React hooks, 6) Practice with small projects, 7) Learn routing with React Router.",

    // Default responses
    "default": "I'm here to help with questions about the platform and provide study guidance. You can ask me about booking sessions, finding tutors, study tips, or specific subjects like JavaScript, React, calculus, and more!",

    "greeting": "Hello! I'm your AI study assistant. I can help you with platform questions, study tips, and subject-specific guidance. What would you like to know?"
};

// Common question suggestions
export const aiSuggestions = [
    "How do I book a tutoring session?",
    "What are some effective study tips?",
    "How can I find the right tutor?",
    "Help me with time management",
    "JavaScript learning resources",
    "Calculus study strategies",
    "How to cancel a session?"
];

// AI interaction logs (for analytics)
export const aiLogs = [
    {
        id: 1,
        userId: 1,
        query: "How do I book a session?",
        response: "To book a tutoring session: 1) Go to 'Find Tutors'...",
        timestamp: "2024-09-11T09:30:00Z",
        helpful: true,
        category: "platform"
    },
    {
        id: 2,
        userId: 1,
        query: "Study tips for calculus",
        response: "Calculus study approach: 1) Master algebra and trigonometry first...",
        timestamp: "2024-09-11T10:15:00Z",
        helpful: true,
        category: "study-help"
    },
    {
        id: 3,
        userId: 4,
        query: "JavaScript basics",
        response: "JavaScript learning path: 1) Master the basics...",
        timestamp: "2024-09-11T11:00:00Z",
        helpful: null,
        category: "subject-help"
    }
];