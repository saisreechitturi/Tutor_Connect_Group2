// Mock conversations and messages
export const conversations = [
    {
        id: 1,
        type: "direct", // direct or session-based
        participants: [1, 2], // Alice and Bob
        sessionId: null,
        title: "General Discussion",
        lastMessage: {
            id: 3,
            senderId: 2,
            content: "Looking forward to our next session!",
            timestamp: "2024-09-11T10:30:00Z",
            type: "text"
        },
        unreadCount: 0,
        createdAt: "2024-09-01T08:00:00Z",
        updatedAt: "2024-09-11T10:30:00Z"
    },
    {
        id: 2,
        type: "session",
        participants: [1, 5], // Alice and Emma
        sessionId: 3,
        title: "Statistics Session Discussion",
        lastMessage: {
            id: 6,
            senderId: 1,
            content: "Could you share the practice problems you mentioned?",
            timestamp: "2024-09-11T14:20:00Z",
            type: "text"
        },
        unreadCount: 1,
        createdAt: "2024-09-11T13:00:00Z",
        updatedAt: "2024-09-11T14:20:00Z"
    }
];

export const messages = [
    {
        id: 1,
        conversationId: 1,
        senderId: 1, // Alice
        content: "Hi Bob! Thanks for the great React session yesterday.",
        type: "text",
        timestamp: "2024-09-11T09:15:00Z",
        edited: false,
        attachments: []
    },
    {
        id: 2,
        conversationId: 1,
        senderId: 2, // Bob
        content: "You're welcome! You're making great progress with React hooks.",
        type: "text",
        timestamp: "2024-09-11T09:45:00Z",
        edited: false,
        attachments: []
    },
    {
        id: 3,
        conversationId: 1,
        senderId: 2,
        content: "Looking forward to our next session!",
        type: "text",
        timestamp: "2024-09-11T10:30:00Z",
        edited: false,
        attachments: []
    },
    {
        id: 4,
        conversationId: 2,
        senderId: 5, // Emma
        content: "Hi Alice! I've prepared some materials for our upcoming statistics session.",
        type: "text",
        timestamp: "2024-09-11T13:15:00Z",
        edited: false,
        attachments: []
    },
    {
        id: 5,
        conversationId: 2,
        senderId: 5,
        content: "Here's the document with practice problems we discussed.",
        type: "text",
        timestamp: "2024-09-11T13:30:00Z",
        edited: false,
        attachments: [
            {
                id: 1,
                name: "statistics_practice_problems.pdf",
                type: "application/pdf",
                size: 245760,
                url: "/files/statistics_practice_problems.pdf"
            }
        ]
    },
    {
        id: 6,
        conversationId: 2,
        senderId: 1, // Alice
        content: "Could you share the practice problems you mentioned?",
        type: "text",
        timestamp: "2024-09-11T14:20:00Z",
        edited: false,
        attachments: []
    }
];

// Message types
export const messageTypes = [
    "text",
    "image",
    "file",
    "video",
    "audio"
];